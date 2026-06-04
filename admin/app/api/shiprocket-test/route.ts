import { NextResponse } from 'next/server';
import { ShiprocketService } from '@/lib/shiprocket';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const token = await ShiprocketService.getToken();
    const res = await fetch('https://apiv2.shiprocket.in/v1/external/settings/company/pickup', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
