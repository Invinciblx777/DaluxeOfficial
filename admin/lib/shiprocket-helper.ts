import { ShiprocketService } from './shiprocket';

const PICKUP_POSTCODE = parseInt(process.env.SHIPROCKET_PICKUP_POSTCODE || '400017');

export interface ShiprocketOrderInput {
  orderId: string;              // Our DB UUID
  orderNumber: string;          // DLX-XXXX
  email: string;
  phone: string;
  shippingAddress: {
    name: string;
    address_line1?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
  };
  cartItems: Array<{
    product_id: string;
    name?: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  paymentMethod: 'COD' | 'Prepaid';
}

/**
 * Calculate the total weight of an order (500g per item unit, minimum 500g)
 */
function calcWeight(cartItems: ShiprocketOrderInput['cartItems']): number {
  const totalUnits = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  return Math.max(0.5, totalUnits * 0.5); // 500g per unit
}

/**
 * Get the cheapest shipping rate for a pincode.
 * Returns 0 on any error (fallback to free/default).
 */
export async function getShippingRate(
  deliveryPincode: string,
  paymentMethod: 'cod' | 'prepaid',
  weight = 0.5
): Promise<number> {
  try {
    const rateData: any = await ShiprocketService.checkServiceability({
      pickup_postcode: PICKUP_POSTCODE,
      delivery_postcode: parseInt(deliveryPincode),
      weight,
      cod: paymentMethod === 'cod' ? 1 : 0,
    });

    const companies = rateData?.data?.available_courier_companies ?? [];
    if (companies.length === 0) return 0;

    const sorted = [...companies].sort((a: any, b: any) => a.rate - b.rate);
    return Math.ceil(sorted[0].rate);
  } catch (e) {
    console.error('[Shiprocket] getShippingRate failed:', e);
    return 0;
  }
}

/**
 * Create a Shiprocket order and auto-assign AWB (recommended courier).
 * Returns the Shiprocket order_id and shipment_id on success, null on failure.
 */
export async function createShiprocketOrder(input: ShiprocketOrderInput): Promise<{
  shiprocket_order_id: string;
  shipment_id: string;
  awb_code?: string;
} | null> {
  try {
    const weight = calcWeight(input.cartItems);
    const orderDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const payload = {
      order_id: input.orderNumber,          // Shiprocket uses this as their reference
      order_date: orderDate,
      pickup_location: process.env.SHIPROCKET_PICKUP_NAME || 'Home', // Defaulted to 'Home' based on user dashboard screenshot
      billing_customer_name: input.shippingAddress.name || 'Customer',
      billing_last_name: '',
      billing_address: input.shippingAddress.address_line1 || '',
      billing_city: input.shippingAddress.city || '',
      billing_pincode: input.shippingAddress.pincode || '',
      billing_state: input.shippingAddress.state || '',
      billing_country: 'India',
      billing_email: input.email,
      billing_phone: input.shippingAddress.phone || input.phone,
      shipping_is_billing: true,
      order_items: input.cartItems.map(item => ({
        name: item.name || `Product ${item.product_id}`,
        sku: item.product_id,
        units: item.quantity,
        selling_price: item.price,
        discount: 0,
        tax: 0,
        hsn: 0,
      })),
      payment_method: input.paymentMethod,
      sub_total: input.totalAmount,
      length: 15,
      breadth: 12,
      height: 10,
      weight,
    };

    console.log('[Shiprocket] Creating order for:', input.orderNumber);
    const srResult: any = await ShiprocketService.createOrder(payload as any);

    if (!srResult?.order_id) {
      console.error('[Shiprocket] Order creation returned no order_id:', srResult);
      return null;
    }

    console.log('[Shiprocket] Order created:', srResult.order_id, 'Shipment:', srResult.shipment_id);

    // Auto-assign AWB using recommended courier
    let awb_code: string | undefined;
    if (srResult.shipment_id) {
      try {
        const awbResult: any = await ShiprocketService.assignAWB({
          shipment_id: srResult.shipment_id.toString(),
        });
        awb_code = awbResult?.response?.data?.awb_code;
        if (awb_code) {
          console.log('[Shiprocket] AWB assigned:', awb_code);
        }
      } catch (awbErr) {
        console.warn('[Shiprocket] AWB auto-assign failed (non-fatal):', awbErr);
      }
    }

    return {
      shiprocket_order_id: srResult.order_id.toString(),
      shipment_id: srResult.shipment_id?.toString() || '',
      awb_code,
    };
  } catch (e) {
    console.error('[Shiprocket] createShiprocketOrder failed:', e);
    return null;
  }
}
