import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin-service';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { data: orders } = await supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false }).limit(20);
    const { data: orderItems } = await supabaseAdmin.from('order_items').select('*');
    const { data: products } = await supabaseAdmin.from('products').select('*');
    
    return NextResponse.json({
      orders,
      orderItems,
      products
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
