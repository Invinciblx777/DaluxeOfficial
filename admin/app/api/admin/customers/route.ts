import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin-service';
import { getAdminUser } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const admin = await getAdminUser(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch all profiles with order stats
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, name, full_name, phone, address, city, state, pincode, is_banned, role, created_at')
    .order('created_at', { ascending: false });

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  // Fetch order summaries grouped by user
  const { data: orderStats } = await supabaseAdmin
    .from('orders')
    .select('user_id, total_amount, status');

  // Build per-user stats map
  const statsMap: Record<string, { orderCount: number; totalSpent: number }> = {};
  for (const order of (orderStats || [])) {
    if (!order.user_id) continue;
    if (!statsMap[order.user_id]) statsMap[order.user_id] = { orderCount: 0, totalSpent: 0 };
    if (order.status !== 'cancelled') {
      statsMap[order.user_id].orderCount += 1;
      statsMap[order.user_id].totalSpent += Number(order.total_amount) || 0;
    }
  }

  const customers = (profiles || []).map(p => ({
    id: p.id,
    name: p.name || p.full_name || 'No Name',
    email: p.email,
    phone: p.phone || '',
    address: p.address || '',
    city: p.city || '',
    state: p.state || '',
    pincode: p.pincode || '',
    isBanned: p.is_banned || false,
    role: p.role || 'customer',
    joinedAt: p.created_at,
    orderCount: statsMap[p.id]?.orderCount || 0,
    totalSpent: statsMap[p.id]?.totalSpent || 0,
  }));

  return NextResponse.json({ customers });
}
