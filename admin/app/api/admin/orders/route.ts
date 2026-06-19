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

    // Fetch orders
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Admin Orders API Error]:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: CORS_HEADERS });
    }

    // Fetch order_items safely (ignore if fails or table missing)
    let orderItems: any[] = [];
    try {
      const { data: items } = await supabaseAdmin.from('order_items').select('*');
      if (items) orderItems = items;
    } catch (e) {
      console.warn('[Admin Orders API] Could not fetch order_items:', e);
    }

    // Fetch profiles safely (ignore if fails or table missing)
    let profiles: any[] = [];
    try {
      const { data: profs } = await supabaseAdmin.from('profiles').select('id, full_name, email, phone');
      if (profs) profiles = profs;
    } catch (e) {
      console.warn('[Admin Orders API] Could not fetch profiles:', e);
    }

    // Stitch data together in memory to completely bypass PostgREST foreign-key requirements
    const stitchedData = (orders || []).map((order) => {
      const relatedItems = orderItems.filter((i) => i.order_id === order.id);
      const relatedProfile = profiles.find((p) => p.id === order.user_id) || null;
      
      return {
        ...order,
        order_items: relatedItems,
        profiles: relatedProfile,
      };
    });

    return NextResponse.json({ success: true, data: stitchedData }, { headers: CORS_HEADERS });
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
