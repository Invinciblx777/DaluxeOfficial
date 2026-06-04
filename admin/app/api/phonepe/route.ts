import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin-service';
import { fulfillShipment } from '@/lib/shipping';

export const dynamic = 'force-dynamic';

const PHONEPE_CLIENT_ID = process.env.PHONEPE_CLIENT_ID!;
const PHONEPE_CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET!;
const PHONEPE_CLIENT_VERSION = process.env.PHONEPE_CLIENT_VERSION || '1';
const PHONEPE_ENV = process.env.PHONEPE_ENV || 'UAT';

const PHONEPE_HOST = PHONEPE_ENV === 'PROD'
  ? 'https://api.phonepe.com/apis/pg'
  : 'https://api-preprod.phonepe.com/apis/pg-sandbox';

const PHONEPE_AUTH_HOST = PHONEPE_ENV === 'PROD'
  ? 'https://api.phonepe.com/apis/identity-manager'
  : 'https://api-preprod.phonepe.com/apis/pg-sandbox';

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }
  const res = await fetch(`${PHONEPE_AUTH_HOST}/v1/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: PHONEPE_CLIENT_ID,
      client_secret: PHONEPE_CLIENT_SECRET,
      client_version: PHONEPE_CLIENT_VERSION,
      grant_type: 'client_credentials',
    }).toString(),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.message || 'Failed to get PhonePe access token');
  }
  cachedToken = data.access_token;
  tokenExpiresAt = (data.expires_at || Date.now() + 14 * 60 * 1000) - 60000;
  return cachedToken!;
}

async function getUser(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

function safeParse<T>(raw: any, fallback: T): T {
  if (raw == null) return fallback;
  if (typeof raw !== 'string') return raw as T;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Idempotently turn a PAID PhonePe transaction into a confirmed order.
 *
 * Callable from BOTH the server-side PhonePe callback and the client-side
 * verify-polling path — whichever observes success first wins, the other
 * no-ops. Idempotency is enforced by the unique `transaction_id`: if the order
 * already exists (or a concurrent call races us to the insert) we return the
 * existing order rather than creating a duplicate or decrementing stock twice.
 *
 * The caller must have already verified the payment is successful.
 */
async function finalizePaidOrder(
  transactionId: string,
): Promise<
  | { ok: true; orderNumber: string; alreadyExisted: boolean }
  | { ok: false; error: string }
> {
  // 1. Already fulfilled?
  const { data: existing } = await supabaseAdmin
    .from('orders')
    .select('order_number')
    .eq('transaction_id', transactionId)
    .maybeSingle();
  if (existing) return { ok: true, orderNumber: existing.order_number, alreadyExisted: true };

  // 2. The pending order captured at initiate-time must exist.
  const { data: pending } = await supabaseAdmin
    .from('pending_orders')
    .select('*')
    .eq('transaction_id', transactionId)
    .maybeSingle();
  if (!pending) return { ok: false, error: 'Pending order not found' };

  const cartItems = safeParse<any[]>(pending.cart_items, []);
  const shippingAddr = safeParse<any>(pending.shipping_address, {});
  const orderNumber = `DLX-${Date.now().toString(36).toUpperCase()}`;

  // 3. Create the order. A unique index on transaction_id guards against
  //    double-fulfilment from a callback/verify race.
  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .insert({
      user_id: pending.user_id,
      order_number: orderNumber,
      total_amount: pending.amount,
      coupon_code: pending.coupon_code || null,
      discount_amount: pending.discount_amount || 0,
      payment_method: 'phonepe',
      payment_gateway: 'phonepe',
      status: 'confirmed',
      shipping_address: shippingAddr,
      email: pending.email || 'customer@daluxeskincare.com',
      transaction_id: transactionId,
    })
    .select()
    .single();

  if (orderErr || !order) {
    // A concurrent fulfilment likely won the unique-transaction_id race.
    const { data: raced } = await supabaseAdmin
      .from('orders')
      .select('order_number')
      .eq('transaction_id', transactionId)
      .maybeSingle();
    if (raced) return { ok: true, orderNumber: raced.order_number, alreadyExisted: true };
    console.error('[PhonePe] Order insert failed:', orderErr);
    return { ok: false, error: orderErr?.message || 'Failed to create order' };
  }

  // 4. Order items + stock + cart/pending cleanup.
  if (cartItems.length) {
    const orderItems = cartItems.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      name: item.name || `Product ${item.product_id}`,
      quantity: item.quantity,
      price: item.price,
    }));
    const { error: itemsErr } = await supabaseAdmin.from('order_items').insert(orderItems);
    if (itemsErr) console.error('[PhonePe] Order items error:', itemsErr);

    for (const item of cartItems) {
      await supabaseAdmin.rpc('decrement_stock', {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
      });
    }
  }
  if (pending.user_id) {
    await supabaseAdmin.from('cart_items').delete().eq('user_id', pending.user_id);
  }
  await supabaseAdmin.from('pending_orders').delete().eq('transaction_id', transactionId);

  // 5. Courier shipment (provider-agnostic, best-effort — never fails the order).
  await fulfillShipment(order.id, {
    orderId: order.id,
    orderNumber,
    email: pending.email || '',
    phone: shippingAddr.phone || '',
    shippingAddress: {
      name: shippingAddr.name || '',
      address_line1: shippingAddr.address_line1 || '',
      address_line2: shippingAddr.address_line2 || '',
      city: shippingAddr.city || '',
      state: shippingAddr.state || '',
      pincode: shippingAddr.pincode || '',
      phone: shippingAddr.phone || '',
    },
    cartItems,
    totalAmount: pending.amount,
    paymentMethod: 'Prepaid',
  });

  return { ok: true, orderNumber, alreadyExisted: false };
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Respond to CORS preflight. Without this, cross-origin POSTs from the storefront
// (Content-Type: application/json + Authorization header) fail the preflight with a
// 405 and the browser reports a generic "network error". See checkout flow.
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
  const action = searchParams.get('action') || 'verify';

  if (action === 'test') {
    // Safe diagnostic: reports config + whether a PhonePe access token can be
    // obtained. Never returns secret values — only booleans and the live host.
    const diag: any = {
      PHONEPE_ENV: process.env.PHONEPE_ENV || '(unset → defaults to UAT sandbox)',
      usingHost: PHONEPE_HOST,
      usingAuthHost: PHONEPE_AUTH_HOST,
      hasClientId: !!process.env.PHONEPE_CLIENT_ID,
      hasClientSecret: !!process.env.PHONEPE_CLIENT_SECRET,
      clientVersion: PHONEPE_CLIENT_VERSION,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_ADMIN_URL: process.env.NEXT_PUBLIC_ADMIN_URL,
      computedAppUrl: (process.env.NEXT_PUBLIC_APP_URL || 'https://daluxeofficial.in').replace(/\/$/, ''),
      computedAdminUrl: (process.env.NEXT_PUBLIC_ADMIN_URL || 'https://daluxeadminpanel.vercel.app').replace(/\/$/, ''),
    };
    try {
      const token = await getAccessToken();
      diag.tokenFetch = token ? 'SUCCESS — credentials valid' : 'FAILED — no token returned';
    } catch (e: any) {
      diag.tokenFetch = `FAILED — ${e?.message || 'unknown error'}`;
    }
    return NextResponse.json(diag);
  }

  // ─── INITIATE ───
  if (action === 'initiate') {
    try {
      const user = await getUser(req);
      if (!user) return NextResponse.json({ success: false, error: 'Unauthorized. Please log in.' }, { status: 401 });

      const body = await req.json();
      const { amount, coupon_code, discount_amount, cart_items, shipping_address, email } = body;
      if (!amount || amount <= 0) return NextResponse.json({ success: false, error: 'Invalid payment amount' }, { status: 400 });

      const merchantOrderId = `DALUXE-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

      // Save pending order
      if (cart_items && cart_items.length > 0) {
        const { error: upsertError } = await supabaseAdmin.from('pending_orders').upsert({
          transaction_id: merchantOrderId,
          user_id: user.id,
          cart_items: JSON.stringify(cart_items),
          shipping_address: shipping_address ? JSON.stringify(shipping_address) : null,
          amount,
          coupon_code: coupon_code || null,
          discount_amount: discount_amount || 0,
          email: email || user.email,
          status: 'initiated',
          created_at: new Date().toISOString(),
        });
        if (upsertError) {
          console.error('[Pending Order Error]:', upsertError);
          return NextResponse.json({ success: false, error: `Database error: ${upsertError.message}` }, { status: 500 });
        }
      }

      const accessToken = await getAccessToken();
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://daluxeofficial.in').replace(/\/$/, '');
      const adminApiUrl = (process.env.NEXT_PUBLIC_ADMIN_URL || 'https://daluxeadminpanel.vercel.app').replace(/\/$/, '');

      const paymentPayload = {
        merchantOrderId,
        amount: Math.round(amount * 100),
        expireAfter: 1200,
        paymentFlow: {
          type: 'PG_CHECKOUT',
          merchantUrls: {
            redirectUrl: `${appUrl}/api/phonepe?action=callback&orderId=${merchantOrderId}&storefront=${encodeURIComponent(appUrl)}`,
          },
        },
        metaInfo: { udf1: user.id, udf2: user.email || '' },
      };

      const phonePeRes = await fetch(`${PHONEPE_HOST}/checkout/v2/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `O-Bearer ${accessToken}` },
        body: JSON.stringify(paymentPayload),
      });

      const phonePeData = await phonePeRes.json();

      if (phonePeRes.ok && phonePeData.redirectUrl) {
        return NextResponse.json({ success: true, data: { orderId: merchantOrderId, redirectUrl: phonePeData.redirectUrl } });
      }

      return NextResponse.json({ success: false, error: phonePeData.message || 'Failed to create payment session' }, { status: 400 });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  // ─── CALLBACK (Redirect from PhonePe) ───
  if (action === 'callback') {
    try {
      const orderId = searchParams.get('orderId');
      const storefrontUrl = searchParams.get('storefront')
        ? decodeURIComponent(searchParams.get('storefront')!)
        : (process.env.NEXT_PUBLIC_APP_URL || 'https://daluxeofficial.in').replace(/\/$/, '');

      if (!orderId) {
        return NextResponse.redirect(`${storefrontUrl}/profile?status=error&error=Missing+orderId`);
      }

      const accessToken = await getAccessToken();
      const statusRes = await fetch(`${PHONEPE_HOST}/checkout/v2/order/${orderId}/status?details=true`, {
        headers: { 'Content-Type': 'application/json', 'Authorization': `O-Bearer ${accessToken}` },
      });
      const statusData = await statusRes.json();
      const state = statusData.state || statusData.orderState || statusData.data?.state || statusData.data?.orderState;
      
      const isSuccessful = ['COMPLETED', 'SUCCESS', 'PAYMENT_SUCCESS'].includes(state);

      const appUrl = storefrontUrl;

      if (isSuccessful) {
        const result = await finalizePaidOrder(orderId);
        if (!result.ok) {
          return NextResponse.redirect(`${appUrl}/profile?status=error&error=${encodeURIComponent(result.error)}`);
        }
        return NextResponse.redirect(`${appUrl}/profile?status=success&orderId=${orderId}`);
      } else {
        console.warn('[PhonePe Callback] Payment not successful. State:', state);
        // Log the failure to pending_orders for debugging
        await supabaseAdmin.from('pending_orders').update({
          status: `failed: ${state || 'unknown'}`,
        }).eq('transaction_id', orderId);

        return NextResponse.redirect(`${appUrl}/profile?status=error&error=Payment+failed+with+state+${state || 'unknown'}`);
      }
    } catch (e: any) {
      console.error('[PhonePe Callback Error]:', e);
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8081').replace(/\/$/, '');
      return NextResponse.redirect(`${appUrl}/profile?status=error&error=${encodeURIComponent(e.message)}`);
    }
  }

  // ─── VERIFY (Frontend Polling) ───
  if (action === 'verify') {
    try {
      const orderId = searchParams.get('orderId') || (await req.json().catch(() => ({}))).orderId;
      if (!orderId) return NextResponse.json({ success: false, error: 'Missing orderId' }, { status: 400 });

      // Check if order already exist
      const { data: existingOrder } = await supabaseAdmin.from('orders').select('id, order_number').eq('transaction_id', orderId).single();
      if (existingOrder) return NextResponse.json({ success: true, state: 'COMPLETED', order: existingOrder });

      const accessToken = await getAccessToken();
      const statusRes = await fetch(`${PHONEPE_HOST}/checkout/v2/order/${orderId}/status?details=true`, {
        headers: { 'Content-Type': 'application/json', 'Authorization': `O-Bearer ${accessToken}` },
      });
      const statusData = await statusRes.json();
      const state = statusData.state || statusData.orderState || statusData.data?.state || statusData.data?.orderState;

      if (state === 'COMPLETED') {
        // Idempotently fulfil here too: covers the case where PhonePe's
        // server-to-server callback never reached us (user closed the tab,
        // callback errored, etc.) but the payment genuinely succeeded.
        const result = await finalizePaidOrder(orderId);
        if (!result.ok) {
          return NextResponse.json({ success: false, state, error: result.error }, { status: 500 });
        }
        return NextResponse.json({
          success: true,
          state: 'COMPLETED',
          order: { order_number: result.orderNumber },
        });
      }

      if (state === 'FAILED') return NextResponse.json({ success: false, state: 'FAILED', error: 'Payment failed' });
      
      return NextResponse.json({ success: false, state: state || 'UNKNOWN', error: 'Payment not completed' });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
}
