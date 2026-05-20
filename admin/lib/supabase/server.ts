import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

const getLocalConfig = () => {
  if (typeof window !== 'undefined') return null;
  try {
    const configPath = path.join(process.cwd(), '..', 'supabase-config.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (e) {}
  try {
    const configPath = path.join(process.cwd(), 'supabase-config.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (e) {}
  return null;
};

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  const localConfig = getLocalConfig();
  const url = localConfig?.url || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = localConfig?.key || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Can be ignored if middleware refreshes user sessions
          }
        },
      },
    }
  );
}
