import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// MUST REGISTER TS-NODE or use npx tsx
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// Setup a mock for Next.js process env variables if needed
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

import { fulfillShipment } from './admin/lib/shipping.js';

async function run() {
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !order) {
    console.error("No order found", error);
    process.exit(1);
  }

  console.log(`Found order: ${order.order_number} (${order.id})`);

  const addr = order.shipping_address || {};
  const cartItems = (order.order_items || []).map((item) => ({
    product_id: item.product_id,
    name: item.name || `Product ${item.product_id}`,
    quantity: item.quantity,
    price: item.price,
  }));

  try {
    const result = await fulfillShipment(order.id, {
      orderId: order.id,
      orderNumber: order.order_number,
      email: order.email || addr.email || 'test@test.com',
      phone: addr.phone || order.phone || '9999999999',
      shippingAddress: {
        name: addr.name || 'Test User',
        address_line1: addr.address_line1 || addr.address || 'Test Addr',
        address_line2: addr.address_line2 || '',
        city: addr.city || 'Test City',
        state: addr.state || 'Test State',
        pincode: addr.pincode || '110001',
        phone: addr.phone || order.phone || '9999999999',
      },
      cartItems,
      totalAmount: order.total_amount,
      paymentMethod: order.payment_method?.toUpperCase() === 'COD' ? 'COD' : 'Prepaid',
    });

    console.log("Shipment Result:", result);
  } catch (err) {
    console.error("Shipment Error:", err);
  }
}

run();
