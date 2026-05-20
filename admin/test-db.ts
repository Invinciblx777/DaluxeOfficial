import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function test() {
  const { data: order, error: orderErr } = await supabase.from('orders').select('id, order_number').order('created_at', { ascending: false }).limit(1).single();
  if (!order) {
    console.log("No order found");
    return;
  }
  
  console.log("Found order:", order.order_number);
  
  // Try to insert a dummy order item with product_id="1"
  const { data, error } = await supabase.from('order_items').insert({
    order_id: order.id,
    product_id: "1",
    quantity: 1,
    price: 100
  });
  
  console.log("Insert result:", { data, error });
  
  // Try to fetch order_items with products
  const { data: fetchItems, error: fetchErr } = await supabase.from('order_items').select('*, products(*)').eq('order_id', order.id);
  console.log("Fetch items with products(*):", { data: fetchItems, error: fetchErr });
}
test();
