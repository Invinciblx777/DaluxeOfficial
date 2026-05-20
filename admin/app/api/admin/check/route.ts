import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin-service';

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

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(access_token);

    if (error || !user) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    const adminEmails = getAdminEmails();
    const isAdmin = adminEmails.includes((user.email || '').toLowerCase());

    if (isAdmin) {
      // Auto-promote this user to admin in public.profiles table so client-side RLS allows updates
      try {
        await supabaseAdmin.from('profiles').upsert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin',
          role: 'admin'
        });
      } catch (upsertErr) {
        console.warn('Failed to auto-promote admin profile:', upsertErr);
      }
    }

    return NextResponse.json({ isAdmin, email: user.email });
  } catch (err: any) {
    console.error('Admin check error:', err);
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }
}

