/** Shared, courier-agnostic shipping types. */

export type ShipmentStatus =
  | 'pending'
  | 'synced'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'lost'
  | 'failed_sync';

export interface ShippingOrderInput {
  orderId: string;            // our DB UUID
  orderNumber: string;        // DLX-XXXX (used as the courier client_order_id)
  email: string;
  phone: string;
  shippingAddress: {
    name: string;
    address_line1?: string;
    address_line2?: string;
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

export interface ShipmentResult {
  provider: 'shadowfax' | 'shiprocket';
  awb_code?: string;
  shipment_id?: string;       // courier internal shipment/order numeric id
  courier_order_id?: string;  // courier reference id
}
