// Migration script to add missing profile columns and is_banned flag
// Run via: node admin/scripts/migrate-profiles.mjs

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const migrations = [
  `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT`,
  `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT`,
  `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state TEXT`,
  `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pincode TEXT`,
  `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false`,
  `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT`,
];

for (const sql of migrations) {
  const { error } = await supabase.rpc('exec_sql', { sql }).catch(() => ({ error: null }));
  if (error) console.warn('RPC not available, using direct query attempt:', sql);
}

// Verify by reading columns
const { data, error } = await supabase.from('profiles').select('id, email, name, phone, address, city, state, pincode, is_banned').limit(1);
if (error) {
  console.error('Verification failed — columns may not exist yet:', error.message);
  console.log('\nPlease run this SQL manually in your Supabase SQL Editor:');
  console.log(`
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pincode TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
  `);
} else {
  console.log('✅ Profiles table columns verified successfully!');
  console.log('Sample row:', data?.[0] || 'no rows yet');
}
