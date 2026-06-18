import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;
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
  if (!res.ok || !data.access_token) throw new Error(data.message || 'Failed to get PhonePe access token');
  cachedToken = data.access_token;
  tokenExpiresAt = (data.expires_at || Date.now() + 14 * 60 * 1000) - 60000;
  return cachedToken!;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const transactionId = body.transactionId || body.orderId;

    if (!transactionId) {
      return NextResponse.json({ success: false, error: 'Missing transactionId' }, { status: 400 });
    }

    // Check if order already exists (idempotent)
    const { data: existingOrder } = await supabaseAdmin
      .from('orders')
      .select('id, order_number')
      .eq('transaction_id', transactionId)
      .single();

    if (existingOrder) {
      return NextResponse.json({ success: true, message: 'Order already processed', order: existingOrder });
    }

    // Verify with PhonePe
    const accessToken = await getAccessToken();
    const statusRes = await fetch(`${PHONEPE_HOST}/checkout/v2/order/${transactionId}/status?details=true&errorContext=true`, {
      headers: { 'Content-Type': 'application/json', 'Authorization': `O-Bearer ${accessToken}` },
    });
    const statusData = await statusRes.json();
    const state = statusData.state || statusData.orderState;

    if (state === 'COMPLETED') {
      // Process order from pending_orders
      const { data: pending } = await supabaseAdmin
        .from('pending_orders')
        .select('*')
        .eq('transaction_id', transactionId)
        .single();

      if (pending && pending.status !== 'completed') {
        let cartItems: any[] = [];
        let shippingAddress: any = {};
        try {
          cartItems = JSON.parse(pending.cart_items);
        } catch (parseErr) {
          console.error('[Verify] Failed to parse cart_items for transaction', transactionId, parseErr);
          return NextResponse.json({ success: false, error: 'Malformed order data — cart_items could not be parsed' }, { status: 500 });
        }
        try {
          shippingAddress = pending.shipping_address ? JSON.parse(pending.shipping_address) : {};
        } catch {
          shippingAddress = {};
        }
        const orderNumber = `DLX-${Date.now().toString(36).toUpperCase()}`;

        const { data: order } = await supabaseAdmin.from('orders').insert({
          user_id: pending.user_id,
          order_number: orderNumber,
          total_amount: pending.amount,
          transaction_id: transactionId,
          payment_gateway: 'phonepe',
          status: 'confirmed',
          shipment_status: 'pending',
          shipping_address: shippingAddress,
        }).select().single();

        if (order) {
          const orderItems = cartItems.map((item: any) => ({
            order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
          }));
          await supabaseAdmin.from('order_items').insert(orderItems);
          await supabaseAdmin.from('pending_orders').update({ status: 'completed' }).eq('transaction_id', transactionId);

          for (const item of cartItems) {
            await supabaseAdmin.rpc('decrement_stock', { p_product_id: item.product_id, p_quantity: item.quantity });
          }

          // Clear user's cart
          await supabaseAdmin.from('cart_items').delete().eq('user_id', pending.user_id);

          return NextResponse.json({ success: true, message: 'Payment verified and order created', order: { order_number: orderNumber } });
        }
      }
      return NextResponse.json({ success: true, state: 'COMPLETED' });
    }

    if (state === 'FAILED') {
      return NextResponse.json({ success: false, state: 'FAILED', error: statusData.errorContext?.description || 'Payment failed' });
    }

    return NextResponse.json({ success: false, state: state || 'UNKNOWN', error: 'Payment not completed' });

  } catch (error: any) {
    console.error('[PhonePe/Verify] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
