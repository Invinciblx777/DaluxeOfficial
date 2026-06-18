import { ShadowfaxService } from './shadowfax';
import type {
  ShippingOrderInput,
  ShipmentResult,
  ShipmentStatus,
} from './shipping-types';

function sanitize(v: string | undefined): string {
  return (v || '').replace(/^['"]|['"]$/g, '').trim();
}

/** Last 10 digits of a phone number, digits only. */
function normalizePhone(phone?: string): string {
  return (phone || '').replace(/\D/g, '').slice(-10);
}

/** Total weight in GRAMS (Shadowfax expects grams). 500g per unit, min 500g. */
function calcWeightGrams(items: ShippingOrderInput['cartItems']): number {
  const units = items.reduce((s, i) => s + (i.quantity || 0), 0);
  return Math.max(500, units * 500);
}

interface PickupDetails {
  name: string;
  contact: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  pincode: number;
  email?: string;
}

function getPickupDetails(): PickupDetails | null {
  const contact = normalizePhone(sanitize(process.env.SHADOWFAX_PICKUP_CONTACT)) || '9999999999';
  const pincode = parseInt(sanitize(process.env.SHADOWFAX_PICKUP_PINCODE) || '400017', 10);
  const address1 = sanitize(process.env.SHADOWFAX_PICKUP_ADDRESS_1) || 'Ground floor shetty house tilak nagar mariamma dharavi';
  const city = sanitize(process.env.SHADOWFAX_PICKUP_CITY) || 'Mumbai';
  const state = sanitize(process.env.SHADOWFAX_PICKUP_STATE) || 'Maharashtra';

  // These are mandatory for SFX order creation — bail if not configured.
  if (!contact || !pincode || !address1 || !city || !state) return null;

  return {
    name: sanitize(process.env.SHADOWFAX_PICKUP_NAME) || 'DA LUXE',
    contact,
    address_line_1: address1,
    address_line_2: sanitize(process.env.SHADOWFAX_PICKUP_ADDRESS_2),
    city,
    state,
    pincode,
    email: sanitize(process.env.SHADOWFAX_PICKUP_EMAIL) || undefined,
  };
}

/**
 * Map a Shadowfax status_id (order state) to our internal shipment_status.
 * Falls back to 'processing' for any unrecognised in-flight state.
 */
export function mapShadowfaxStatus(statusId?: string): ShipmentStatus {
  const s = (statusId || '').toLowerCase();
  if (!s) return 'processing';

  if (['delivered', 'rts_d', 'rto_d'].includes(s)) return 'delivered';
  if (s === 'ofd') return 'out_for_delivery';
  if (s === 'ofp') return 'shipped';
  if (['picked', 'assigned_for_seller_pickup'].includes(s)) return 'shipped';
  if (s === 'lost') return 'lost';
  if (
    ['cancelled_by_customer', 'cancelled_by_seller'].includes(s)
  )
    return 'cancelled';
  if (
    [
      'rts',
      'rts_d',
      'rts_in_process',
      'rts_ofd',
      'rts_nd',
      'rto',
      'rto_d',
      'in_transit_return',
    ].includes(s)
  )
    return 'returned';
  if (
    [
      'recd_at_rev_hub',
      'item_manifested',
      'recd_at_fwd_hub',
      'recd_at_fwd_dc',
      'bag_in_transit',
      'bag_received',
      'bag_received_at_via',
      'received_from_client_warehouse',
      'assigned_for_delivery',
    ].includes(s)
  )
    return 'in_transit';

  return 'processing';
}

/** Is a pincode serviceable for customer delivery via Shadowfax? Best-effort. */
export async function isShadowfaxServiceable(pincode: string): Promise<boolean> {
  try {
    const rows = await ShadowfaxService.checkServiceability(pincode, 'customer_delivery');
    return rows.some(
      (r) => String(r.code) === String(pincode) && (r.services?.length ?? 0) > 0,
    );
  } catch (e) {
    console.warn('[Shadowfax] serviceability check failed:', e);
    // Don't block checkout on a serviceability hiccup.
    return true;
  }
}

/**
 * Create a Shadowfax marketplace (seller-pickup) order.
 * Returns the AWB + ids on success, or null on any failure (graceful degrade).
 */
export async function createShadowfaxOrder(
  input: ShippingOrderInput,
): Promise<ShipmentResult | null> {
  if (!ShadowfaxService.isConfigured()) {
    console.warn('[Shadowfax] SHADOWFAX_TOKEN not set — skipping shipment creation');
    return null;
  }

  const pickup = getPickupDetails();
  if (!pickup) {
    console.error('[Shadowfax] Pickup address not configured (SHADOWFAX_PICKUP_*)');
    return null;
  }

  const addr = input.shippingAddress || ({} as ShippingOrderInput['shippingAddress']);
  const customerContact = normalizePhone(addr.phone || input.phone);
  const customerPincode = parseInt((addr.pincode || '').replace(/\D/g, ''), 10);

  if (!customerContact || !customerPincode || !addr.address_line1 || !addr.city || !addr.state) {
    console.error('[Shadowfax] Customer address incomplete — cannot create shipment', {
      hasContact: !!customerContact,
      hasPincode: !!customerPincode,
    });
    return null;
  }

  const isCod = input.paymentMethod === 'COD';

  const payload = {
    order_type: 'marketplace',
    order_details: {
      client_order_id: input.orderNumber,
      actual_weight: calcWeightGrams(input.cartItems),
      product_value: input.totalAmount,
      total_amount: input.totalAmount,
      cod_amount: isCod ? input.totalAmount : 0,
      payment_mode: isCod ? 'COD' : 'Prepaid',
      order_service: 'regular',
    },
    customer_details: {
      name: addr.name || 'Customer',
      contact: customerContact,
      address_line_1: addr.address_line1 || '',
      address_line_2: addr.address_line2 || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: customerPincode,
    },
    pickup_details: {
      name: pickup.name,
      contact: pickup.contact,
      address_line_1: pickup.address_line_1,
      address_line_2: pickup.address_line_2,
      city: pickup.city,
      state: pickup.state,
      pincode: pickup.pincode,
    },
    // Return-to-seller goes back to the same pickup location.
    rts_details: {
      name: pickup.name,
      contact: pickup.contact,
      address_line_1: pickup.address_line_1,
      address_line_2: pickup.address_line_2,
      city: pickup.city,
      state: pickup.state,
      pincode: pickup.pincode,
      email: pickup.email,
    },
    product_details: input.cartItems.map((item) => ({
      client_sku_id: item.product_id,
      sku_name: item.name || `Product ${item.product_id}`,
      category: 'Skincare',
      price: item.price,
      quantity: item.quantity,
      additional_details: { quantity: item.quantity },
    })),
  };

  try {
    const env = process.env.SHADOWFAX_ENV || 'STAGING (set SHADOWFAX_ENV=PROD for live)';
    console.log(`[Shadowfax] Creating order for: ${input.orderNumber} | Env: ${env}`);
    console.log('[Shadowfax] Payload:', JSON.stringify({
      order_type: payload.order_type,
      client_order_id: payload.order_details?.client_order_id,
      payment_mode: payload.order_details?.payment_mode,
      cod_amount: payload.order_details?.cod_amount,
      total_amount: payload.order_details?.total_amount,
      customer_contact: payload.customer_details?.contact,
      customer_pincode: payload.customer_details?.pincode,
      customer_city: payload.customer_details?.city,
      pickup_city: payload.pickup_details?.city,
      pickup_pincode: payload.pickup_details?.pincode,
    }, null, 2));

    const res = await ShadowfaxService.createOrder(payload);
    console.log('[Shadowfax] Raw response:', JSON.stringify(res, null, 2));

    // SFX signals validation failures with HTTP 200 + message: "Failure".
    if (res?.message !== 'Success' || !res?.data?.awb_number) {
      console.error('[Shadowfax] Order creation FAILED for', input.orderNumber);
      console.error('[Shadowfax] Errors:', JSON.stringify(res?.errors ?? res, null, 2));
      console.error('[Shadowfax] Hint: Check SHADOWFAX_TOKEN, SHADOWFAX_ENV=PROD, pickup address env vars, and pincode serviceability.');
      return null;
    }

    const data = res.data;
    console.log(`[Shadowfax] ✅ Order created successfully! AWB: ${data.awb_number} | Internal ID: ${data.id}`);

    return {
      provider: 'shadowfax',
      awb_code: String(data.awb_number),
      shipment_id: data.id != null ? String(data.id) : undefined,
      courier_order_id: String(data.awb_number),
    };
  } catch (e) {
    console.error('[Shadowfax] createShadowfaxOrder failed:', e);
    return null;
  }
}
