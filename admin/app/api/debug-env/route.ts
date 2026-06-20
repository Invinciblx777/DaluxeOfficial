import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const envVars = Object.keys(process.env).filter(k => 
    k.includes('PG') || 
    k.includes('POSTGRES') || 
    k.includes('DB') || 
    k.includes('DATABASE') || 
    k.includes('SUPABASE')
  );

  const envs: Record<string, string> = {};
  for (const k of envVars) {
    envs[k] = process.env[k] || '';
  }

  return NextResponse.json({ envs });
}
