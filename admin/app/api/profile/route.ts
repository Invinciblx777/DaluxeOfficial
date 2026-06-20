import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin-service';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

async function getUser(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.replace('Bearer ', '').trim();
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// GET: Fetch the current user's profile
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
  }

  return NextResponse.json({ profile: data }, { headers: CORS_HEADERS });
}

// POST: Save/update the current user's profile using service_role (bypasses RLS)
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });

  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS_HEADERS });
  }

  // Build update object - always include known-safe columns first
  const updateData: Record<string, any> = {
    full_name: body.name ?? null,
    phone: body.phone ?? null,
    updated_at: new Date().toISOString(),
  };

  // Try the full update including new columns
  const fullUpdateData = {
    ...updateData,
    name: body.name ?? null,
    address: body.address ?? null,
    city: body.city ?? null,
    state: body.state ?? null,
    pincode: body.pincode ?? null,
  };

  const { error } = await supabaseAdmin
    .from('profiles')
    .update(fullUpdateData)
    .eq('id', user.id);

  if (error) {
    console.error('[Profile API] Full update failed:', error.message, error.code);

    // Column doesn't exist yet — fall back to basic columns only
    if (error.code === '42703' || error.message?.includes('column')) {
      console.log('[Profile API] Falling back to basic columns (address columns may not exist yet)');
      const { error: basicError } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (basicError) {
        console.error('[Profile API] Basic update also failed:', basicError.message);
        return NextResponse.json({ error: basicError.message, note: 'Run the SQL migration to enable address saving' }, { status: 500, headers: CORS_HEADERS });
      }

      return NextResponse.json({
        success: true,
        partial: true,
        note: 'Name and phone saved. Run SQL migration to enable address fields.',
      }, { headers: CORS_HEADERS });
    }

    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
  }

  return NextResponse.json({ success: true }, { headers: CORS_HEADERS });
}
