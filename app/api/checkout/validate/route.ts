import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const rateLimitMap = new Map<string, number>();

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

    const now = Date.now();
    const lastRequest = rateLimitMap.get(user.id);
    if (lastRequest && now - lastRequest < 5000) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait.' },
        { status: 429 }
      );
    }
    rateLimitMap.set(user.id, now);

    const body = await request.json();
    const { cart_items } = body;

    if (!cart_items || !Array.isArray(cart_items) || cart_items.length === 0) {
      return NextResponse.json({ success: false, error: 'Cart is empty' }, { status: 400 });
    }

    for (const item of cart_items) {
      if (!item.product_id || typeof item.quantity !== 'number' || item.quantity < 1) {
        return NextResponse.json({ success: false, error: 'Invalid cart item format' }, { status: 400 });
      }
    }

    const productIds = cart_items.map((item: any) => item.product_id);
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('id, name, stock_quantity')
      .in('id', productIds);

    if (error) throw error;

    for (const item of cart_items) {
      const product = products?.find((p) => p.id === item.product_id);
      if (!product) continue; // Skip hardcoded products not in DB
      if (product.stock_quantity !== null && product.stock_quantity < item.quantity) {
        return NextResponse.json(
          { success: false, error: `"${product.name}" is out of stock (only ${product.stock_quantity} available)` },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ success: true, message: 'Stock validated.' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
