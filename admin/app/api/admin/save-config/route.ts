import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { url, key } = await request.json();

    if (!url || !key) {
      return NextResponse.json({ success: false, error: 'URL and Key are required' }, { status: 400 });
    }

    // Write to supabase-config.json in the project root
    const rootConfigPath = path.join(process.cwd(), '..', 'supabase-config.json');
    const adminConfigPath = path.join(process.cwd(), 'supabase-config.json');
    const configData = JSON.stringify({ url, key }, null, 2);

    fs.writeFileSync(rootConfigPath, configData, 'utf-8');
    fs.writeFileSync(adminConfigPath, configData, 'utf-8');

    // Write to .env in the project root and admin folder to persist environment variables
    const rootEnvPath = path.join(process.cwd(), '..', '.env');
    const adminEnvPath = path.join(process.cwd(), '.env');

    const envData = `NEXT_PUBLIC_SUPABASE_URL=${url}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${key}
EXPO_PUBLIC_SUPABASE_URL=${url}
EXPO_PUBLIC_SUPABASE_ANON_KEY=${key}
SUPABASE_SERVICE_ROLE_KEY=${key}
`;

    fs.writeFileSync(rootEnvPath, envData, 'utf-8');
    fs.writeFileSync(adminEnvPath, envData, 'utf-8');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Save Config Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const rootConfigPath = path.join(process.cwd(), '..', 'supabase-config.json');
    const adminConfigPath = path.join(process.cwd(), 'supabase-config.json');

    if (fs.existsSync(rootConfigPath)) fs.unlinkSync(rootConfigPath);
    if (fs.existsSync(adminConfigPath)) fs.unlinkSync(adminConfigPath);

    // Remove or reset .env files
    const rootEnvPath = path.join(process.cwd(), '..', '.env');
    const adminEnvPath = path.join(process.cwd(), '.env');

    if (fs.existsSync(rootEnvPath)) fs.unlinkSync(rootEnvPath);
    if (fs.existsSync(adminEnvPath)) fs.unlinkSync(adminEnvPath);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Delete Config Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
