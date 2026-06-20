// Test if profiles table is truly accessible (maybe RLS blocks anon REST but profiles do exist)
const SUPABASE_URL = 'https://synzthsuiunyttcawhqm.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5bnp0aHN1aXVueXR0Y2F3aHFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MjA0MTgsImV4cCI6MjA5MTI5NjQxOH0.BFtFRdMWlNEA6N3HxxUPHNxI84EqhO5GdIvlIQE4_LA';

async function test() {
  // Test orders table (should exist)
  console.log('=== Test orders table ===');
  const res1 = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=id&limit=1`, {
    headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` }
  });
  console.log('orders status:', res1.status, await res1.text().then(t => t.substring(0, 200)));

  // Test products table
  console.log('\n=== Test products table ===');
  const res2 = await fetch(`${SUPABASE_URL}/rest/v1/products?select=id,name&limit=1`, {
    headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` }
  });
  console.log('products status:', res2.status, await res2.text().then(t => t.substring(0, 200)));

  // Test profiles table  
  console.log('\n=== Test profiles table ===');
  const res3 = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id&limit=1`, {
    headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` }
  });
  console.log('profiles status:', res3.status, await res3.text().then(t => t.substring(0, 300)));

  // List all tables via PostgREST schema
  console.log('\n=== List available tables ===');
  const res4 = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` }
  });
  console.log('root status:', res4.status);
  const text = await res4.text();
  // Try to extract table info from OpenAPI spec
  try {
    const spec = JSON.parse(text);
    if (spec.definitions) {
      console.log('Tables:', Object.keys(spec.definitions).join(', '));
    } else if (spec.paths) {
      console.log('Paths:', Object.keys(spec.paths).join(', '));
    }
  } catch {
    console.log('Raw (first 500 chars):', text.substring(0, 500));
  }
}

test();
