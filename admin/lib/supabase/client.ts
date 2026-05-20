import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Standard browser client for frontend Auth operations
 */
export const createAdminBrowserClient = () => createBrowserClient(supabaseUrl, supabaseAnonKey);
