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

async function getUser(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function POST(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const { amount, cart_items, shipping_address, email } = await request.json();
    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid payment amount' }, { status: 400 });
    }

    const merchantOrderId = `DALUXE-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Save pending order for post-payment processing
    if (cart_items && cart_items.length > 0) {
      await supabaseAdmin.from('pending_orders').upsert({
        transaction_id: merchantOrderId,
        user_id: user.id,
        cart_items: JSON.stringify(cart_items),
        shipping_address: shipping_address ? JSON.stringify(shipping_address) : null,
        amount,
        email: email || user.email || 'customer@daluxeskincare.com',
        status: 'initiated',
        created_at: new Date().toISOString(),
      });
    }

    const accessToken = await getAccessToken();
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://daluxeofficial.in').replace(/\/$/, '');

    const paymentPayload = {
      merchantOrderId,
      amount: Math.round(amount * 100),
      expireAfter: 1200,
      paymentFlow: {
        type: 'PG_CHECKOUT',
        merchantUrls: {
          redirectUrl: `${appUrl}/api/phonepe?action=callback&orderId=${merchantOrderId}`,
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
    console.error('[PhonePe/Initiate] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
