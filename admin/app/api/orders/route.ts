import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin-service';
import { ShiprocketService } from '@/lib/shiprocket';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
    }

    // Since we don't have a rigid Supabase auth flow on the frontend yet, 
    // we query orders by matching the email inside the JSONB shipping_address column.
    // In production with rigid auth, query by user_id instead.
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*, products(name, image))') // fetching nested details
      .order('created_at', { ascending: false });

    if (ordersError || !orders) {
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    // Filter orders by email in shipping_address
    const userOrders = orders.filter((o: any) => 
      o.shipping_address && o.shipping_address.email?.toLowerCase() === email.toLowerCase()
      || o.shipping_address && o.shipping_address.name && o.shipping_address.phone // fallback parsing
    ).filter((o: any) => {
        // Precise fallback check
        if (o.shipping_address && o.shipping_address.email) {
            return o.shipping_address.email.toLowerCase() === email.toLowerCase()
        }
        return false;
    });

    // Optionally fetch active tracking statuses for shipped orders
    for (const order of userOrders) {
      if (order.shiprocket_order_id && order.status !== 'delivered') {
        try {
          // Fetch real tracking if available. Using an awb if assigned, or just pass generic state.
          // This is a placeholder for `ShiprocketService.trackByAWB(...)`
          // We don't want to exhaust API rate limits here blindly.
        } catch(e) {}
      }
    }

    return NextResponse.json({ orders: userOrders });

  } catch (error: any) {
    console.error('Order fetching error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
