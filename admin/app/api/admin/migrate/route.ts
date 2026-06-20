import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin-service';
import { getAdminUser } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

/**
 * Auto-migration endpoint: adds missing columns to the profiles table.
 * Called by the admin panel on first load to ensure the DB is up-to-date.
 * Safe to run multiple times (uses IF NOT EXISTS).
 */
export async function POST(req: Request) {
  const admin = await getAdminUser(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const migrations = [
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT`,
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT`,
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT`,
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state TEXT`,
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pincode TEXT`,
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false`,
  ];

  const results: { sql: string; ok: boolean; error?: string }[] = [];

  for (const sql of migrations) {
    try {
      // Use the Supabase REST API's rpc endpoint to run raw SQL via service_role
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) {
        results.push({ sql, ok: false, error: 'Missing env vars' });
        continue;
      }

      const res = await fetch(`${url}/rest/v1/rpc/run_migration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': key,
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({ query: sql }),
      });

      if (res.ok) {
        results.push({ sql, ok: true });
      } else {
        // If the RPC doesn't exist, try the pg_query workaround
        results.push({ sql, ok: false, error: await res.text() });
      }
    } catch (e: any) {
      results.push({ sql, ok: false, error: e.message });
    }
  }

  // Verify columns by trying a minimal select
  const { error: verifyError } = await supabaseAdmin
    .from('profiles')
    .select('id, name, address, city, state, pincode, is_banned')
    .limit(1);

  return NextResponse.json({
    migrations: results,
    columnsExist: !verifyError,
    verifyError: verifyError?.message || null,
  });
}
