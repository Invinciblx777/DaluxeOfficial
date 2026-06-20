import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin-service';
import { getAdminUser } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const admin = await getAdminUser(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { userId, isBanned } = body;
  if (!userId || typeof isBanned !== 'boolean') {
    return NextResponse.json({ error: 'userId and isBanned are required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ is_banned: isBanned, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log(`[Admin] User ${userId} ${isBanned ? 'BANNED' : 'UNBANNED'}`);
  return NextResponse.json({ success: true, isBanned });
}
