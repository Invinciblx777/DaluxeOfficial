import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select('id, order_number')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !order) {
    console.error("No order found", error);
    process.exit(1);
  }

  console.log(`Found order: ${order.order_number} (${order.id})`);

  // We will simulate hitting the internal retry-shipment API or just using the helper
  try {
    const res = await fetch(`http://localhost:3000/api/admin/orders/retry-shipment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ order_id: order.id }),
    });

    const json = await res.json();
    console.log("Retry API response:", JSON.stringify(json, null, 2));
  } catch (err) {
    console.error("API error:", err);
  }
}

run();
