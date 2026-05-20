import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const getLocalConfig = () => {
  if (typeof window !== 'undefined') return null;
  try {
    const fs = eval("require('fs')");
    const path = eval("require('path')");
    const configPath = path.join(process.cwd(), '..', 'supabase-config.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (e) {}
  try {
    const fs = eval("require('fs')");
    const path = eval("require('path')");
    const configPath = path.join(process.cwd(), 'supabase-config.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (e) {}
  return null;
};

let clientCache: { [key: string]: ReturnType<typeof createSupabaseClient> } = {};

const getClient = () => {
  let url = '';
  let key = '';

  if (typeof window !== 'undefined') {
    url = window.localStorage.getItem('NEXT_PUBLIC_SUPABASE_URL') || '';
    key = window.localStorage.getItem('SUPABASE_SERVICE_ROLE_KEY') || window.localStorage.getItem('NEXT_PUBLIC_SUPABASE_ANON_KEY') || '';
  } else {
    const localConfig = getLocalConfig();
    if (localConfig?.url && localConfig?.key) {
      url = localConfig.url;
      key = localConfig.key;
    }
  }

  if (!url) url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  if (!key) key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!url) url = 'https://placeholder-project.supabase.co';
  if (!key) key = 'placeholder-anon-key';

  const cacheKey = `${url}::${key}`;
  if (!clientCache[cacheKey]) {
    clientCache[cacheKey] = createSupabaseClient(url, key, {
      auth: {
        persistSession: typeof window !== 'undefined',
      }
    });
  }
  return clientCache[cacheKey];
};

/**
 * Admin client using service role key (bypass RLS)
 * Use only for backend-initiated tasks (e.g., Shiprocket sync, DB maintenance)
 */
export const supabaseAdmin = new Proxy({} as any, {
  get(target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client, prop);
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  }
}) as unknown as ReturnType<typeof createSupabaseClient>;
