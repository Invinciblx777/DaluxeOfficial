import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin-service';
import { getShippingQuote, fulfillShipment } from '@/lib/shipping';

export const dynamic = 'force-dynamic';

async function getUser(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Respond to CORS preflight so cross-origin COD/shipping POSTs from the storefront
// don't fail the preflight with a 405 (surfaces as a generic "network error").
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  return handleRequest(req);
}

export async function POST(req: NextRequest) {
  return handleRequest(req);
}

async function handleRequest(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  // ─── SHIPPING CALCULATOR ───
  // Flat rate, free above a threshold (env-tunable); serviceability is checked
  // against the active courier. Pricing is decoupled from the courier rate API.
  if (action === 'shipping') {
    const pincode = searchParams.get('pincode');
    const payment = (searchParams.get('payment') as 'cod' | 'prepaid') || 'prepaid';
    const subtotal = parseFloat(searchParams.get('subtotal') || '0') || 0;

    if (!pincode || pincode.length < 6) {
      return NextResponse.json({ success: false, error: 'Valid 6-digit pincode is required' }, { status: 400 });
    }

    try {
      const quote = await getShippingQuote({ pincode, paymentMethod: payment, subtotal });
      return NextResponse.json(quote);
    } catch (e: any) {
      console.error('[Shipping API Error]:', e);
      // Never block checkout — fall back to flat rate, serviceable.
      return NextResponse.json({ success: true, serviceable: true, rate: 49, estimatedDays: '3-5' });
    }
  }

  // ─── VALIDATE STOCK ───
  if (action === 'validate') {
    try {
      const user = await getUser(req);
      if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

      const body = await req.json();
      const { cart_items } = body;

      if (!cart_items || !Array.isArray(cart_items) || cart_items.length === 0) {
        return NextResponse.json({ success: false, error: 'Cart is empty' }, { status: 400 });
      }

      const { data: allProducts, error } = await supabaseAdmin.from('products').select('id, name, stock_quantity, price');
      if (error) {
        console.error('[Database Error]:', error);
        return NextResponse.json({ success: false, error: `Database error: ${error.message}` }, { status: 500 });
      }

      for (const item of cart_items) {
        let product = allProducts?.find((p: any) => p.id === item.product_id);
        if (!product && item.name) {
          const itemNameUpper = item.name.toUpperCase();
          product = allProducts?.find((p: any) => p.name?.toUpperCase().includes(itemNameUpper) || itemNameUpper.includes(p.name?.toUpperCase()));
        }
        if (!product) continue;

        if (product.stock_quantity !== null && product.stock_quantity < item.quantity) {
          return NextResponse.json({ success: false, error: `"${product.name}" is out of stock` }, { status: 400 });
        }
      }
      return NextResponse.json({ success: true, message: 'Stock validated' });
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
  }

  // ─── COD ORDER CREATION ───
  if (action === 'cod') {
    try {
      const user = await getUser(req);
      if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

      const body = await req.json();
      const { orderPayload, cartItems } = body;

      if (!orderPayload || !cartItems || cartItems.length === 0) {
        return NextResponse.json({ success: false, error: 'Invalid order data' }, { status: 400 });
      }

      const orderNumber = `DLX-COD-${Date.now().toString(36).toUpperCase()}`;

      const { data: order, error: orderError } = await supabaseAdmin.from('orders').insert({
        user_id: user.id, 
        order_number: orderNumber, 
        total_amount: orderPayload.total_amount,
        coupon_code: orderPayload.coupon_code || null,
        discount_amount: orderPayload.discount_amount || 0,
        payment_method: 'cod', 
        payment_gateway: 'cod',
        status: 'confirmed', 
        shipping_address: orderPayload.shipping_address,
        email: orderPayload.email,
      }).select().single();

      if (orderError) {
        console.error('[Order Creation Error]:', orderError);
        return NextResponse.json({ success: false, error: `Failed to create order: ${orderError.message}` }, { status: 500 });
      }

      const orderItems = cartItems.map((item: any) => ({
        order_id: order.id, 
        product_id: item.product_id,
        name: item.name || `Product ${item.product_id}`,
        quantity: item.quantity, 
        price: item.price,
      }));

      const { error: itemsErr } = await supabaseAdmin.from('order_items').insert(orderItems);
      if (itemsErr) {
        console.error('[Order Items Creation Error]:', itemsErr);
      }
      
      for (const item of cartItems) {
        await supabaseAdmin.rpc('decrement_stock', { p_product_id: item.product_id, p_quantity: item.quantity });
      }

      await supabaseAdmin.from('cart_items').delete().eq('user_id', user.id);

      // ── Courier: create shipment + auto-assign AWB (provider-agnostic) ──────
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
        totalAmount: orderPayload.total_amount,
        paymentMethod: 'COD',
      });

      return NextResponse.json({ success: true, order: { order_number: order.order_number } });
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
}
