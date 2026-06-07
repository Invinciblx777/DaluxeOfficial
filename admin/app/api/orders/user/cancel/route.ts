import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin-service';
import { ShadowfaxService } from '@/lib/shadowfax';

async function getUser(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    if (order.user_id !== user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    if (['cancelled', 'delivered', 'shipped'].includes(order.status)) {
      return NextResponse.json({ success: false, error: `Order cannot be cancelled in status: ${order.status}` }, { status: 400 });
    }

    // Cancel in Shadowfax
    try {
      // For Shadowfax, the requestId is typically the order.id or order.order_number.
      // We'll pass the UUID order.id which was used to create the shipment.
      console.log(`[Cancel API] Attempting to cancel Shadowfax order for ${order.id}`);
      const res = await ShadowfaxService.cancelOrder(order.id, 'Cancelled by customer');
      console.log(`[Cancel API] Shadowfax cancel result:`, res);
    } catch (e: any) {
      console.error(`[Cancel API] Failed to cancel Shadowfax order ${order.id}:`, e);
      // We continue even if SFX fails, since they might not have a shipment yet
    }

    // Update order status
    const { error: updateErr } = await supabaseAdmin
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId);

    if (updateErr) {
      throw updateErr;
    }

    // Restock the items
    if (order.order_items && Array.isArray(order.order_items)) {
      for (const item of order.order_items) {
        // Fetch current stock
        const { data: product } = await supabaseAdmin
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .single();
        
        if (product && product.stock_quantity !== null) {
          const newStock = product.stock_quantity + item.quantity;
          await supabaseAdmin
            .from('products')
            .update({ stock_quantity: newStock })
            .eq('id', item.product_id);
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Order cancelled successfully' });
  } catch (error: any) {
    console.error('[Cancel Order API error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
