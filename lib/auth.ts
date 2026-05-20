import { headers } from 'next/headers';
import { supabaseAdmin } from './supabaseAdmin';

export interface SessionUser {
  id: string;       // Supabase UID
  email: string;
  name: string;
  role: string;
}

export async function getServerUser(): Promise<SessionUser | null> {
  try {
    const headersList = await headers();
    const authHeader = headersList.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.replace('Bearer ', '');

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) return null;

    // Fetch role from profiles table (optional, defaults to customer if not found)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.full_name || '',
      role: profile?.role || 'customer',
    };
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getServerUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== 'admin') throw new Error('Forbidden');
  return user;
}
