import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin-service';
import { getAdminUser } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: Request) {
  try {
    const admin = await getAdminUser(req);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });
    }

    // Fetch all order fields including coupon/discount/shipment data
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_number,
        user_id,
        status,
        total_amount,
        coupon_code,
        discount_amount,
        payment_method,
        payment_gateway,
        payment_id,
        transaction_id,
        email,
        shipping_address,
        shipment_status,
        awb_code,
        shipment_id,
        shiprocket_order_id,
        courier_provider,
        created_at,
        updated_at,
        profiles(full_name, email, phone),
        order_items(id, product_id, name, quantity, price)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Admin Orders API Error]:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: CORS_HEADERS });
    }

    return NextResponse.json({ success: true, data }, { headers: CORS_HEADERS });
  } catch (error: any) {
    console.error('[Admin Orders API Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: CORS_HEADERS });
  }
}

// Update an order's status (service-role write, bypasses RLS — admin-guarded).
export async function PATCH(req: Request) {
  try {
    const admin = await getAdminUser(req);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });
    }

    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Missing order id or status' }, { status: 400, headers: CORS_HEADERS });
    }
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, error: `Invalid status: ${status}` }, { status: 400, headers: CORS_HEADERS });
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('[Admin Orders PATCH Error]:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: CORS_HEADERS });
    }

    return NextResponse.json({ success: true }, { headers: CORS_HEADERS });
  } catch (error: any) {
    console.error('[Admin Orders PATCH Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: CORS_HEADERS });
  }
}
