import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin-service';
import { mapShadowfaxStatus } from '@/lib/shadowfax-helper';

export const dynamic = 'force-dynamic';

/**
 * Shadowfax PUSH callback receiver.
 *
 * Configure this URL in the Shadowfax dashboard:
 *   https://www.daluxeofficial.in/api/webhooks/shadowfax
 *
 * SFX posts: { awb_number, order_id (=client_order_id), status, event (=status_id),
 *              event_timestamp, current_location, comments, type (FWD/REV),
 *              recepient_info (POD, on delivery) }
 *
 * Auth: SFX sends a configurable Authorization header. Set SHADOWFAX_WEBHOOK_TOKEN
 * to the same value and we reject mismatches (the check is skipped if unset, e.g.
 * in staging).
 */
function isAuthorized(req: NextRequest): boolean {
  const expected = (process.env.SHADOWFAX_WEBHOOK_TOKEN || '').trim();
  if (!expected) return true; // not configured → accept (staging/dev)
  const auth = (req.headers.get('authorization') || '').trim();
  const bare = auth.replace(/^Token\s+/i, '').trim();
  return auth === expected || bare === expected;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    console.warn('[Shadowfax Webhook] Unauthorized attempt');
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const awb = body?.awb_number ? String(body.awb_number) : '';
  const clientOrderId = body?.order_id ? String(body.order_id) : '';
  const statusId = body?.event || body?.status_id || body?.status;

  console.log('[Shadowfax Webhook] Received:', {
    awb,
    clientOrderId,
    statusId,
    type: body?.type,
  });

  if (!awb && !clientOrderId) {
    return NextResponse.json(
      { success: false, error: 'Missing awb_number / order_id' },
      { status: 400 },
    );
  }

  const mapped = mapShadowfaxStatus(statusId);

  const patch: Record<string, any> = { shipment_status: mapped };
  // Backfill the AWB if we matched by client_order_id and didn't have it stored.
  if (awb) patch.awb_code = awb;

  // 1) Match by AWB, 2) fall back to our order_number (== client_order_id).
  let updated: any[] | null = null;

  if (awb) {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(patch)
      .eq('awb_code', awb)
      .select('id');
    if (!error && data && data.length) updated = data;
  }

  if (!updated && clientOrderId) {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(patch)
      .eq('order_number', clientOrderId)
      .select('id');
    if (!error && data && data.length) updated = data;
  }

  if (!updated) {
    console.warn('[Shadowfax Webhook] No matching order for', { awb, clientOrderId });
    // 200 so SFX doesn't hammer retries for an order we don't own.
    return NextResponse.json({ success: false, message: 'No matching order' });
  }

  console.log('[Shadowfax Webhook] Updated', updated.length, 'order(s) →', mapped);
  return NextResponse.json({ success: true, status: mapped });
}
