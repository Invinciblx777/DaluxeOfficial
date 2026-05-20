import { createBrowserClient } from '@supabase/ssr';

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

const getSupabaseConfig = () => {
  let url = '';
  let key = '';

  if (typeof window === 'undefined') {
    const localConfig = getLocalConfig();
    if (localConfig?.url && localConfig?.key) {
      url = localConfig.url;
      key = localConfig.key;
    }
  }

  if (!url) url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  if (!key) key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  return { url, key };
};

/**
 * Standard browser client for frontend Auth operations
 */
export const createAdminBrowserClient = () => {
  const { url, key } = getSupabaseConfig();
  return createBrowserClient(url, key);
};
