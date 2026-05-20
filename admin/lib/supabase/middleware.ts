import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Comma-separated list of admin emails from env.
 * To add a new admin, simply add their email to the ADMIN_EMAILS env var.
 * Example: ADMIN_EMAILS=invinciblx777@gmail.com,another@gmail.com
 */
function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS || '';
  return raw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake can make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();

  // Protect all /admin paths — email whitelist + login redirect
  if (url.pathname.startsWith('/admin')) {
    if (!user) {
      // Not logged in → send to admin login page
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    const adminEmails = getAdminEmails();
    const userEmail = (user.email || '').toLowerCase();

    if (!adminEmails.includes(userEmail)) {
      // Logged in but email is not whitelisted
      url.pathname = '/unauthorized';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
