import { supabaseAdmin } from '@/lib/supabase/admin-service';

// The codebase configures the admin allow-list under two different names
// (ADMIN_EMAILS server-side, NEXT_PUBLIC_ADMIN_EMAILS client-side). Accept either.
function getAdminEmails(): string[] {
  const raw = `${process.env.ADMIN_EMAILS || ''},${process.env.NEXT_PUBLIC_ADMIN_EMAILS || ''}`;
  return raw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
}

/**
 * Verify the caller is a logged-in admin.
 *
 * Reads the Supabase access token from the `Authorization: Bearer <token>` header,
 * resolves the user, then confirms admin status via the email allow-list OR the
 * `profiles.role === 'admin'` flag (which /api/admin/check promotes admins into).
 *
 * Returns the verified user `{ id, email }` on success, or null otherwise.
 * Guards the server routes that mutate data with the service-role key.
 */
export async function getAdminUser(
  req: Request
): Promise<{ id: string; email: string } | null> {
  const auth = req.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;

  const token = auth.replace('Bearer ', '').trim();
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user?.email) return null;

  const user = data.user;
  const email = user.email!.toLowerCase();

  // 1) Email allow-list (primary).
  if (getAdminEmails().includes(email)) {
    return { id: user.id, email };
  }

  // 2) profiles.role === 'admin' (set by /api/admin/check on first admin login).
  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if ((profile as any)?.role === 'admin') {
      return { id: user.id, email };
    }
  } catch {
    /* fall through to deny */
  }

  return null;
}
