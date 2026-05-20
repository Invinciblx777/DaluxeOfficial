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

    const { product_id, quantity = 1 } = await request.json();
    if (!product_id || quantity < 1) {
      return NextResponse.json({ success: false, error: 'Invalid product_id or quantity' }, { status: 400 });
    }

    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('stock_quantity')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const { data: existingItem } = await supabaseAdmin
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', product_id)
      .single();

    let newQuantity = quantity;
    if (existingItem) {
      newQuantity = existingItem.quantity + quantity;
    }

    if (newQuantity > product.stock_quantity) {
      return NextResponse.json({ success: false, error: 'Not enough stock available' }, { status: 400 });
    }

    const { error: upsertError } = await supabaseAdmin
      .from('cart_items')
      .upsert({
        user_id: user.id,
        product_id,
        quantity: newQuantity,
      }, { onConflict: 'user_id, product_id' });

    if (upsertError) throw upsertError;

    return NextResponse.json({ success: true, message: 'Added to cart' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
