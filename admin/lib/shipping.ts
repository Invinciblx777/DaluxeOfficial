/**
 * Courier-agnostic shipping layer.
 *
 * One switch — `SHIPPING_PROVIDER` (`shadowfax` | `shiprocket`, default
 * `shadowfax`) — selects the active courier. The checkout/COD/PhonePe flows
 * only ever call this module, never a courier SDK directly, so swapping or
 * rolling back a provider is a single env change with no code deploy.
 *
 * Shipping price is decoupled from the courier: Shadowfax's serviceability API
 * returns no rate, so we show a flat rate that's free above a threshold (both
 * env-tunable). Serviceability is still checked against the active courier.
 */
import { supabaseAdmin } from '@/lib/supabase/admin-service';
import { createShadowfaxOrder, isShadowfaxServiceable } from './shadowfax-helper';
import { createShiprocketOrder } from './shiprocket-helper';
import type { ShippingOrderInput, ShipmentResult } from './shipping-types';

export type ShippingProvider = 'shadowfax' | 'shiprocket';

function num(envVal: string | undefined, fallback: number): number {
  const n = parseFloat((envVal || '').replace(/^['"]|['"]$/g, '').trim());
  return Number.isFinite(n) ? n : fallback;
}

export function getShippingProvider(): ShippingProvider {
  const p = (process.env.SHIPPING_PROVIDER || 'shadowfax')
    .replace(/^['"]|['"]$/g, '')
    .trim()
    .toLowerCase();
  return p === 'shiprocket' ? 'shiprocket' : 'shadowfax';
}

const FLAT_RATE = () => num(process.env.SHIPPING_FLAT_RATE, 49);
const FREE_THRESHOLD = () => num(process.env.SHIPPING_FREE_THRESHOLD, 499);
const ETD = () =>
  (process.env.SHIPPING_ETD || '3-5').replace(/^['"]|['"]$/g, '').trim();

export interface ShippingQuote {
  success: boolean;
  serviceable: boolean;
  rate: number;
  estimatedDays: string;
}

/** Is the destination pincode serviceable by the active courier? Best-effort. */
async function checkServiceable(pincode: string): Promise<boolean> {
  try {
    if (getShippingProvider() === 'shadowfax') {
      return await isShadowfaxServiceable(pincode);
    }
    // Shiprocket: we no longer price from it; treat as serviceable and let
    // shipment creation surface any true coverage gap.
    return true;
  } catch {
    return true; // never block checkout on a serviceability hiccup
  }
}

/**
 * Compute the shipping quote shown at checkout.
 * Rate = 0 when subtotal >= free threshold, otherwise the flat rate.
 */
export async function getShippingQuote(params: {
  pincode: string;
  paymentMethod?: 'cod' | 'prepaid';
  subtotal?: number;
}): Promise<ShippingQuote> {
  const subtotal = Number(params.subtotal) || 0;
  const serviceable = await checkServiceable(params.pincode);
  
  // All shipping is technically free, we only charge a COD fee which is handled on the frontend and checkout API
  const rate = 0;

  return { success: true, serviceable, rate, estimatedDays: ETD() };
}

/**
 * Create a shipment with the active courier and auto-assign an AWB.
 * Returns a normalised result, or null on failure (order still succeeds).
 */
export async function createShipment(
  input: ShippingOrderInput,
): Promise<ShipmentResult | null> {
  if (getShippingProvider() === 'shadowfax') {
    return createShadowfaxOrder(input);
  }
  const sr = await createShiprocketOrder({
    orderId: input.orderId,
    orderNumber: input.orderNumber,
    email: input.email,
    phone: input.phone,
    shippingAddress: input.shippingAddress,
    cartItems: input.cartItems,
    totalAmount: input.totalAmount,
    paymentMethod: input.paymentMethod,
  });
  if (!sr) return null;
  return {
    provider: 'shiprocket',
    awb_code: sr.awb_code,
    shipment_id: sr.shipment_id,
    courier_order_id: sr.shiprocket_order_id,
  };
}

/**
 * Persist a shipment result onto the order row. Writes only columns that are
 * known to exist on the live table; `courier_provider` is a best-effort write
 * that silently no-ops if the column hasn't been migrated yet.
 */
export async function persistShipmentResult(
  orderId: string,
  result: ShipmentResult | null,
): Promise<void> {
  if (!result) {
    await supabaseAdmin
      .from('orders')
      .update({ shipment_status: 'failed_sync' })
      .eq('id', orderId);
    return;
  }

  await supabaseAdmin
    .from('orders')
    .update({
      awb_code: result.awb_code || null,
      shipment_id: result.shipment_id || null,
      shiprocket_order_id: result.courier_order_id || null,
      shipment_status: 'synced',
    })
    .eq('id', orderId);

  // Optional column — ignore the error if the migration hasn't run.
  try {
    await supabaseAdmin
      .from('orders')
      .update({ courier_provider: result.provider })
      .eq('id', orderId);
  } catch {
    /* courier_provider column not present; non-fatal */
  }
}

/**
 * Convenience: create a shipment and persist the result in one call, recording
 * the failure state on the order if the courier call throws or returns null.
 */
export async function fulfillShipment(
  orderId: string,
  input: ShippingOrderInput,
): Promise<ShipmentResult | null> {
  try {
    const result = await createShipment(input);
    await persistShipmentResult(orderId, result);
    return result;
  } catch (e: any) {
    console.error('[Shipping] fulfillShipment failed:', e);
    await supabaseAdmin
      .from('orders')
      .update({ shipment_status: `error: ${e?.message || 'unknown'}` })
      .eq('id', orderId);
    throw e;
  }
}
