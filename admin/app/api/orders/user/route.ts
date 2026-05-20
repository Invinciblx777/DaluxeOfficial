import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin-service';

async function getUser(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    // Fetch orders with order items
    // Using a separate query for items to keep it simple with Supabase client
    const { data: orders, error: ordersErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (ordersErr) throw ordersErr;

    if (!orders || orders.length === 0) {
      return NextResponse.json({ success: true, orders: [] });
    }

    const orderIds = orders.map(o => o.id);
    const { data: items, error: itemsErr } = await supabaseAdmin
      .from('order_items')
      .select('*, products(*)')
      .in('order_id', orderIds);

    if (itemsErr) throw itemsErr;

    // Group items by order_id
    const ordersWithItems = orders.map(order => ({
      ...order,
      items: items?.filter(item => item.order_id === order.id).map(item => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        name: item.products?.name || item.product_id,
        image_url: item.products?.image_url || null, // Just in case it's in DB
      })) || []
    }));

    return NextResponse.json({ success: true, orders: ordersWithItems });
  } catch (error: any) {
    console.error('[User Orders API error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
