import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    // Try reading from supabase-config.json
    const configPath = path.join(process.cwd(), 'supabase-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.url && config.key) {
        url = config.url;
        key = config.key;
      }
    }

    if (!url || !key) {
      return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 404 });
    }

    return NextResponse.json({ success: true, url, key });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
