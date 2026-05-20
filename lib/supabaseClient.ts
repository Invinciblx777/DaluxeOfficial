import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Explicitly set flowType to implicit since the redirect relies on hash fragments (#access_token).
    flowType: 'implicit',
    detectSessionInUrl: true,
    // Persist session in localStorage so users stay logged in across page refreshes
    persistSession: true,
    // Automatically refresh token before it expires
    autoRefreshToken: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});
