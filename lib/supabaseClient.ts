import { createClient } from '@supabase/supabase-js';

const getSupabaseConfig = () => {
  if (typeof window !== 'undefined') {
    const localUrl = window.localStorage.getItem('NEXT_PUBLIC_SUPABASE_URL');
    const localKey = window.localStorage.getItem('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    if (localUrl && localKey) {
      return { url: localUrl, key: localKey };
    }
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
  return { url, key };
};

let clientCache: { [key: string]: ReturnType<typeof createClient> } = {};

const getClient = () => {
  const { url, key } = getSupabaseConfig();
  const cacheKey = `${url}::${key}`;
  if (!clientCache[cacheKey]) {
    clientCache[cacheKey] = createClient(url, key, {
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
  }
  return clientCache[cacheKey];
};

export const supabaseClient = new Proxy({} as any, {
  get(target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client, prop);
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  }
}) as unknown as ReturnType<typeof createClient>;

