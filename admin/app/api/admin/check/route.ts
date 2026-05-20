import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS || '';
  return raw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
}

export async function POST(request: NextRequest) {
  try {
    const { access_token } = await request.json();

    if (!access_token) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data: { user }, error } = await supabase.auth.getUser(access_token);

    if (error || !user) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    const adminEmails = getAdminEmails();
    const isAdmin = adminEmails.includes((user.email || '').toLowerCase());

    return NextResponse.json({ isAdmin, email: user.email });
  } catch {
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }
}
