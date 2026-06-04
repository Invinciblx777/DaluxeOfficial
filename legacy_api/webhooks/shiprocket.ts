import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const token = req.headers['x-api-key'] as string;
    if (process.env.NODE_ENV === 'production' && token !== process.env.SHIPROCKET_WEBHOOK_TOKEN) {
      console.warn('[Shiprocket Webhook] Unauthorized attempt');
      return res.status(401).json({ success: false, error: 'Unauthorized webhook' });
    }

    const { awb, current_status, shipment_id, order_id } = req.body;
    console.log('[Shiprocket Webhook] Received:', { awb, current_status, shipment_id, order_id });

    if (!current_status) return res.status(400).json({ success: false, error: 'Missing current_status' });

    const raw = current_status.toUpperCase();
    let mapped = 'processing';
    if (raw.includes('DELIVERED')) mapped = 'delivered';
    else if (raw.includes('OUT FOR DELIVERY')) mapped = 'out_for_delivery';
    else if (raw.includes('IN TRANSIT')) mapped = 'in_transit';
    else if (raw.includes('SHIPPED') || raw.includes('PICKED UP')) mapped = 'shipped';
    else if (raw.includes('CANCELLED') || raw.includes('RTO')) mapped = 'cancelled';
    else if (raw.includes('RETURNED')) mapped = 'returned';

    // Try matching by awb_code first, then shipment_id, then order_id
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
      return res.status(200).json({ success: false, message: 'No matching order found' });
    }

    return res.status(200).json({ success: true, message: 'Status synced', status: mapped });

  } catch (error: any) {
    console.error('[Shiprocket Webhook] Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
