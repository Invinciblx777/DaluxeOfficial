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
    let orderItemsError: any = null;
    try {
      const { data: items, error: itemsErr } = await supabaseAdmin.from('order_items').select('*');
      if (itemsErr) {
        orderItemsError = itemsErr;
        console.error('[Admin Orders API] Error fetching order_items:', itemsErr);
      }
      if (items) orderItems = items;
    } catch (e) {
      console.error('[Admin Orders API] Exception fetching order_items:', e);
      orderItemsError = e;
    }

    // Fetch profiles safely (ignore if fails or table missing)
    let profiles: any[] = [];
    let profilesError: any = null;
    try {
      const { data: profs, error: profsErr } = await supabaseAdmin.from('profiles').select('id, full_name, email, phone');
      if (profsErr) {
        profilesError = profsErr;
        console.error('[Admin Orders API] Error fetching profiles:', profsErr);
      }
      if (profs) profiles = profs;
    } catch (e) {
      console.error('[Admin Orders API] Exception fetching profiles:', e);
      profilesError = e;
    }

    // Stitch data together in memory to completely bypass PostgREST foreign-key requirements
    const stitchedData = (orders || []).map((order) => {
      let relatedItems = orderItems.filter((i) => i.order_id === order.id);
      const relatedProfile = profiles.find((p) => p.id === order.user_id) || null;
      
      // Fallback for corrupted historical orders where order_items failed to insert
      if (relatedItems.length === 0) {
        relatedItems = [{
          id: 'dummy-' + order.id,
          order_id: order.id,
          product_id: 'unknown',
          name: 'Recovered Item (History Lost)',
          quantity: 1,
          price: order.total_amount
        }];
      }

      return {
        ...order,
        order_items: relatedItems,
        profiles: relatedProfile,
      };
    });

    return NextResponse.json({ 
      success: true, 
      data: stitchedData,
      debug: {
        orderItemsFetched: orderItems.length,
        profilesFetched: profiles.length,
        orderItemsError,
        profilesError
      }
    }, { headers: CORS_HEADERS });
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
