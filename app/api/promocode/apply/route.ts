import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

async function getUser(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function POST(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { code, cart_total } = await request.json();

    if (!code || typeof cart_total !== 'number' || cart_total <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid promocode or cart total' }, { status: 400 });
    }

    // 1. Fetch Promocode
    const { data: promo, error: promoError } = await supabaseAdmin
      .from('promocodes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (promoError || !promo) {
      return NextResponse.json({ success: false, error: 'Invalid promocode' }, { status: 404 });
    }

    // 2. Validate Promocode
    if (!promo.active) {
      return NextResponse.json({ success: false, error: 'Promocode is inactive' }, { status: 400 });
    }
    
    if (new Date(promo.expiry) < new Date()) {
      return NextResponse.json({ success: false, error: 'Promocode has expired' }, { status: 400 });
    }

    if (promo.usage_limit !== null && promo.used_count >= promo.usage_limit) {
      return NextResponse.json({ success: false, error: 'Usage limit reached' }, { status: 400 });
    }

    // 3. Calculate Discount
    let discount = 0;
    if (promo.discount_type === 'percentage') {
      discount = (cart_total * promo.value) / 100;
    } else if (promo.discount_type === 'fixed') {
      discount = promo.value;
    }

    // Ensure discount doesn't exceed total
    discount = Math.min(discount, cart_total);
    const new_total = cart_total - discount;

    return NextResponse.json({
      success: true,
      message: 'Promocode applied successfully',
      code: promo.code,
      discount_amount: discount,
      new_total: new_total
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
