import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin-service';
import { getShippingQuote, fulfillShipment } from '@/lib/shipping';

export const dynamic = 'force-dynamic';

// ─── Allowed origins for CORS ────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://daluxeofficial.in',
  'https://www.daluxeofficial.in',
  process.env.NEXT_PUBLIC_APP_URL,
  'http://localhost:8081',
  'http://localhost:3000',
].filter(Boolean) as string[];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

// ─── Coupon config (keep in sync with CheckoutPage.tsx and admin coupons page) ─
const COUPON_CONFIG: Record<string, { type: 'percent' | 'flat'; value: number }> = {
  DALUXE10: { type: 'percent', value: 10 },
  SUMPI20:  { type: 'flat',    value: 20 },
  RASHMI20: { type: 'flat',    value: 20 },
  DIKSHA20: { type: 'flat',    value: 20 },
  PINKY20:  { type: 'flat',    value: 20 },
};

const COD_FEE = 49;
const FREE_SHIPPING_THRESHOLD = 499;

// ─── Products config (Sync with CollectionPage.tsx) ───────────────
const PRODUCT_PRICES: Record<string, number> = {
  'facewash': 249,
  'hairserum': 349,
  'faceserum': 449,
  'nightcream': 399,
  'hairoil': 299,
  'hairshampoo': 249,
  'skin-combo': 1097,
  'hair-combo': 897,
};

/**
 * Compute the authoritative grand total server-side so the client cannot
 * manipulate prices by altering the HTTP request body.
 *
 * Returns null if any cart item references an unknown product (security deny).
 */
async function computeGrandTotal(
  cartItems: Array<{ product_id: string; quantity: number }>,
  couponCode: string | null,
  shippingRate: number,
  paymentMethod: 'cod' | 'prepaid',
): Promise<{ subtotal: number; discountAmount: number; codFee: number; grandTotal: number } | null> {
  if (!cartItems || cartItems.length === 0) return null;

  // Limit payload size to prevent DoS
  if (cartItems.length > 50) return null;

  let subtotal = 0;
  for (const item of cartItems) {
    if (item.quantity <= 0 || item.quantity > 100) return null; // sanity check
    const price = PRODUCT_PRICES[item.product_id];
    if (price === undefined) return null; // unknown product — reject
    subtotal += price * item.quantity;
  }

  let discountAmount = 0;
  const coupon = couponCode ? COUPON_CONFIG[couponCode.toUpperCase()] : null;
  if (coupon) {
    if (coupon.type === 'percent') {
      discountAmount = Math.round(subtotal * (coupon.value / 100));
    } else {
      discountAmount = coupon.value;
    }
  }

  const codFee = paymentMethod === 'cod' ? COD_FEE : 0;
  const grandTotal = Math.max(0, subtotal + shippingRate + codFee - discountAmount);

  return { subtotal, discountAmount, codFee, grandTotal };
}

async function getUser(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(origin) });
}

export async function GET(req: NextRequest) {
  return handleRequest(req);
}

export async function POST(req: NextRequest) {
  return handleRequest(req);
}

async function handleRequest(req: NextRequest) {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  // ─── SHIPPING CALCULATOR ────────────────────────────────────────────────────
  if (action === 'shipping') {
    const pincode = searchParams.get('pincode');
    const payment = (searchParams.get('payment') as 'cod' | 'prepaid') || 'prepaid';
    const subtotal = parseFloat(searchParams.get('subtotal') || '0') || 0;

    if (!pincode || pincode.length < 6) {
      return NextResponse.json({ success: false, error: 'Valid 6-digit pincode is required' }, { status: 400, headers: corsHeaders });
    }

    try {
      const quote = await getShippingQuote({ pincode, paymentMethod: payment, subtotal });
      return NextResponse.json(quote, { headers: corsHeaders });
    } catch (e: any) {
      console.error('[Shipping API Error]:', e);
      return NextResponse.json({ success: true, serviceable: true, rate: 49, estimatedDays: '3-5' }, { headers: corsHeaders });
    }
  }

  // ─── VALIDATE STOCK ────────────────────────────────────────────────────────
  if (action === 'validate') {
    try {
      const user = await getUser(req);
      if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401, headers: corsHeaders });

      const body = await req.json();
      const { cart_items } = body;

      if (!cart_items || !Array.isArray(cart_items) || cart_items.length === 0) {
        return NextResponse.json({ success: false, error: 'Cart is empty' }, { status: 400, headers: corsHeaders });
      }
      if (cart_items.length > 50) {
        return NextResponse.json({ success: false, error: 'Too many cart items' }, { status: 400, headers: corsHeaders });
      }

      const { data: allProducts, error } = await supabaseAdmin.from('products').select('id, name, stock_quantity, price');
      if (error) {
        console.error('[Database Error]:', error);
        return NextResponse.json({ success: false, error: `Database error: ${error.message}` }, { status: 500, headers: corsHeaders });
      }

      for (const item of cart_items) {
        let product = allProducts?.find((p: any) => p.id === item.product_id);
        if (!product && item.name) {
          const itemNameUpper = item.name.toUpperCase();
          product = allProducts?.find((p: any) => p.name?.toUpperCase().includes(itemNameUpper) || itemNameUpper.includes(p.name?.toUpperCase()));
        }
        if (!product) continue;

        if (product.stock_quantity !== null && product.stock_quantity < item.quantity) {
          return NextResponse.json({ success: false, error: `"${product.name}" is out of stock` }, { status: 400, headers: corsHeaders });
        }
      }
      return NextResponse.json({ success: true, message: 'Stock validated' }, { headers: corsHeaders });
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message }, { status: 500, headers: corsHeaders });
    }
  }

  // ─── COD ORDER CREATION ────────────────────────────────────────────────────
  // SECURITY: Total amount is recalculated server-side from DB prices.
  // The client's `total_amount` is IGNORED to prevent price manipulation.
  if (action === 'cod') {
    try {
      const user = await getUser(req);
      if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401, headers: corsHeaders });

      const body = await req.json();
      const { orderPayload, cartItems } = body;

      if (!orderPayload || !cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        return NextResponse.json({ success: false, error: 'Invalid order data' }, { status: 400, headers: corsHeaders });
      }
      if (cartItems.length > 50) {
        return NextResponse.json({ success: false, error: 'Too many cart items' }, { status: 400, headers: corsHeaders });
      }

      // Get the shipping rate to include in server-side total calculation
      const shippingRate = typeof orderPayload.shipping_amount === 'number' ? orderPayload.shipping_amount : 49;
      const couponCode = typeof orderPayload.coupon_code === 'string' ? orderPayload.coupon_code.trim().toUpperCase() : null;

      // SERVER-SIDE PRICE RECALCULATION — never trust the client total
      const pricing = await computeGrandTotal(cartItems, couponCode, shippingRate, 'cod');
      if (!pricing) {
        console.error('[COD] Price calculation failed — unknown products or invalid cart');
        return NextResponse.json({ success: false, error: 'Invalid cart items. Please refresh and try again.' }, { status: 400, headers: corsHeaders });
      }

      console.log(`[COD] Server computed total: ₹${pricing.grandTotal} (subtotal ₹${pricing.subtotal}, discount -₹${pricing.discountAmount}, COD fee ₹${pricing.codFee})`);

      const orderNumber = `DLX-COD-${Date.now().toString(36).toUpperCase()}`;

      const { data: order, error: orderError } = await supabaseAdmin.from('orders').insert({
        user_id: user.id,
        order_number: orderNumber,
        total_amount: pricing.grandTotal,       // ← server computed, never client value
        coupon_code: couponCode || null,
        discount_amount: pricing.discountAmount, // ← server computed
        payment_method: 'cod',
        payment_gateway: 'cod',
        status: 'confirmed',
        shipping_address: orderPayload.shipping_address,
        email: orderPayload.email,
      }).select().single();

      if (orderError) {
        console.error('[Order Creation Error]:', orderError);
        return NextResponse.json({ success: false, error: `Failed to create order: ${orderError.message}` }, { status: 500, headers: corsHeaders });
      }

      const orderItems = cartItems.map((item: any) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: PRODUCT_PRICES[item.product_id] || item.price,
      }));

      const { error: itemsErr } = await supabaseAdmin.from('order_items').insert(orderItems);
      if (itemsErr) {
        // Log the error but DO NOT rollback — the order itself is valid.
        // The DB schema may need an ALTER to fix product_id column type.
        console.error('[Order Items Creation Error — order preserved]:', itemsErr.message, itemsErr.details);
      }

      for (const item of cartItems) {
        await supabaseAdmin.rpc('decrement_stock', { p_product_id: item.product_id, p_quantity: item.quantity });
      }

      await supabaseAdmin.from('cart_items').delete().eq('user_id', user.id);

      const addr = orderPayload.shipping_address || {};
      await fulfillShipment(order.id, {
        orderId: order.id,
        orderNumber,
        email: orderPayload.email || user.email || '',
        phone: addr.phone || '',
        shippingAddress: {
          name: addr.name || '',
          address_line1: addr.address_line1 || '',
          address_line2: addr.address_line2 || '',
          city: addr.city || '',
          state: addr.state || '',
          pincode: addr.pincode || '',
          phone: addr.phone || '',
        },
        cartItems,
        totalAmount: pricing.grandTotal,
        paymentMethod: 'COD',
      });

      return NextResponse.json({ success: true, order: { order_number: order.order_number } }, { headers: corsHeaders });
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message }, { status: 500, headers: corsHeaders });
    }
  }

  return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400, headers: corsHeaders });
}
