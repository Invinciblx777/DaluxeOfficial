import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const token = request.headers.get('x-api-key');
    if (process.env.NODE_ENV === 'production' && token !== process.env.SHIPROCKET_WEBHOOK_TOKEN) {
      console.warn('[Shiprocket Webhook] Unauthorized attempt');
      return NextResponse.json({ success: false, error: 'Unauthorized webhook' }, { status: 401 });
    }

    const payload = await request.json();
    const { awb, current_status, shipment_id, order_id } = payload;
    console.log('[Shiprocket Webhook] Received:', { awb, current_status, shipment_id, order_id });

    if (!current_status) {
      return NextResponse.json({ success: false, error: 'Missing current_status' }, { status: 400 });
    }

    const raw = current_status.toUpperCase();
    let mapped = 'processing';
    if (raw.includes('DELIVERED')) mapped = 'delivered';
    else if (raw.includes('OUT FOR DELIVERY')) mapped = 'out_for_delivery';
    else if (raw.includes('IN TRANSIT')) mapped = 'in_transit';
    else if (raw.includes('SHIPPED') || raw.includes('PICKED UP')) mapped = 'shipped';
    else if (raw.includes('CANCELLED') || raw.includes('RTO')) mapped = 'cancelled';
    else if (raw.includes('RETURNED')) mapped = 'returned';

    // Try matching by awb_code first, then shipment_id
    let updateResult = null;

    if (awb) {
      const { data, error } = await supabaseAdmin.from('orders')
        .update({ shipment_status: mapped })
        .eq('awb_code', awb)
        .select('id');
      if (!error && data && data.length > 0) {
        updateResult = data;
        console.log('[Shiprocket Webhook] Updated by AWB:', awb, '→', mapped);
      }
    }

    if (!updateResult && shipment_id) {
      const { data, error } = await supabaseAdmin.from('orders')
        .update({ shipment_status: mapped })
        .eq('shipment_id', String(shipment_id))
        .select('id');
      if (!error && data && data.length > 0) {
        updateResult = data;
        console.log('[Shiprocket Webhook] Updated by shipment_id:', shipment_id, '→', mapped);
      }
    }

    if (!updateResult) {
      console.warn('[Shiprocket Webhook] No matching order found for awb:', awb, 'shipment_id:', shipment_id);
      return NextResponse.json({ success: false, message: 'No matching order found' });
    }

    return NextResponse.json({ success: true, message: 'Status synced', status: mapped });

  } catch (error: any) {
    console.error('[Shiprocket Webhook] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
