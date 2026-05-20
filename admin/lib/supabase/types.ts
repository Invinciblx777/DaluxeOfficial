export type UserRole = 'customer' | 'admin';

export type RegimenStep = 'Cleanser' | 'Toner' | 'Serum' | 'Moisturizer' | 'Sunscreen' | 'Treatment' | 'Mask';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  ingredients: string[] | null; // JSON array of strings
  skin_concerns: string[] | null; // Array of tags e.g. ['Oily', 'Sensitive']
  regimen_step: RegimenStep;
  weight_grams: number;
  volume_ml: number;
  stock_level: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  total_amount: number;
  shipping_address: {
    name: string;
    phone: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  shiprocket_order_id: string | null;
  shiprocket_shipment_id: string | null;
  tracking_url: string | null;
  payment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Review {
  id: string;
  product_id: string;
  reviewer_name: string;
  rating: number;
  review_text: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}
