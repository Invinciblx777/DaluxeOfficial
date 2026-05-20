import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseAdmin = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function testInsert() {
  const payload = {
    user_id: 'c0230bd0-b189-4f64-a99c-761a7935f5e1', // example user from previous db query
    email: 'test@example.com',
    order_number: 'DLX-TEST123',
    total_amount: 100,
    transaction_id: 'DALUXE-TEST-TXN',
    payment_gateway: 'phonepe',
    status: 'confirmed',
    shipment_status: 'pending',
    shipping_address: { city: 'Test' }
  };
  console.log('Attempting insert with payload:', payload);
  const res = await supabaseAdmin.from('orders').insert(payload).select().single();
  console.log('Insert response:', res);
  if (!res.error) {
     console.log('Cleanup...');
     await supabaseAdmin.from('orders').delete().eq('transaction_id', 'DALUXE-TEST-TXN');
  }
}

testInsert();
