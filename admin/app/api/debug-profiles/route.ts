import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin-service';

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint to check the profiles table and its columns.
 * Returns what columns exist and sample data.
 */
export async function GET() {
  const results: Record<string, any> = {};

  // 1. Check if profiles table exists with select *
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .limit(2);
    
    results.profiles_select_star = {
      success: !error,
      error: error?.message || null,
      rowCount: data?.length || 0,
      columns: data && data.length > 0 ? Object.keys(data[0]) : [],
      sample: data && data.length > 0 ? data[0] : null,
    };
  } catch (e: any) {
    results.profiles_select_star = { success: false, error: e.message };
  }

  // 2. Check if new columns exist
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, name, address, city, state, pincode, is_banned')
      .limit(1);
    
    results.profiles_new_columns = {
      success: !error,
      error: error?.message || null,
      data: data?.[0] || null,
    };
  } catch (e: any) {
    results.profiles_new_columns = { success: false, error: e.message };
  }

  // 3. Check orders table to confirm connection works
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('id')
      .limit(1);
    
    results.orders_check = {
      success: !error,
      error: error?.message || null,
      rowCount: data?.length || 0,
    };
  } catch (e: any) {
    results.orders_check = { success: false, error: e.message };
  }

  // 4. Show Supabase URL being used
  results.supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET';
  results.service_key_set = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  return NextResponse.json(results);
}
