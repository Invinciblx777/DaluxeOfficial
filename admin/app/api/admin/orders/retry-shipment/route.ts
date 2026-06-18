import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin-service';
import { getAdminUser } from '@/lib/admin-auth';
import { fulfillShipment } from '@/lib/shipping';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS,POST',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * POST /api/admin/orders/retry-shipment
 * Body: { order_id: string }
 * Retries the Shadowfax/Shiprocket sync for a given order.
 * Protected: admin only.
 */
export async function POST(req: Request) {
  try {
    const admin = await getAdminUser(req);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });
    }

    const { order_id } = await req.json();
    if (!order_id) {
      return NextResponse.json({ success: false, error: 'Missing order_id' }, { status: 400, headers: CORS_HEADERS });
    }

    // Fetch full order details needed for shipment
    const { data: order, error: fetchErr } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(id, product_id, name, quantity, price)')
      .eq('id', order_id)
      .single();

    if (fetchErr || !order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404, headers: CORS_HEADERS });
    }

    const addr = order.shipping_address || {};
    const cartItems = (order.order_items || []).map((item: any) => ({
      product_id: item.product_id,
      name: item.name || `Product ${item.product_id}`,
      quantity: item.quantity,
      price: item.price,
    }));

    console.log(`[Admin] Retrying shipment for order ${order.order_number}...`);

    const result = await fulfillShipment(order.id, {
      orderId: order.id,
      orderNumber: order.order_number,
      email: order.email || addr.email || '',
      phone: addr.phone || order.phone || '',
      shippingAddress: {
        name: addr.name || '',
        address_line1: addr.address_line1 || addr.address || '',
        address_line2: addr.address_line2 || '',
        city: addr.city || '',
        state: addr.state || '',
        pincode: addr.pincode || '',
        phone: addr.phone || order.phone || '',
      },
      cartItems,
      totalAmount: order.total_amount,
      paymentMethod: order.payment_method?.toUpperCase() === 'COD' ? 'COD' : 'Prepaid',
    });

    if (result) {
      return NextResponse.json({
        success: true,
        message: 'Shipment synced successfully',
        awb_code: result.awb_code,
        provider: result.provider,
      }, { headers: CORS_HEADERS });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Shipment sync failed — check server logs for Shadowfax/Shiprocket response details',
      }, { status: 500, headers: CORS_HEADERS });
    }
  } catch (error: any) {
    console.error('[Retry Shipment Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: CORS_HEADERS });
  }
}
