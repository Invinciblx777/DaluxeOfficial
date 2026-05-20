import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// Extract authenticated user from Bearer token
async function getUser(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// GET /api/cart — Fetch user's cart with product details
export async function GET(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { data: cartItems, error } = await supabaseAdmin
      .from('cart_items')
      .select(`
        id,
        product_id,
        quantity,
        added_at,
        products (
          id,
          name,
          price,
          sale_price,
          images,
          stock_quantity
        )
      `)
      .eq('user_id', user.id)
      .order('added_at', { ascending: false });

    if (error) throw error;

    const formattedCart = (cartItems || []).map((item: any) => ({
      cart_item_id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      product: item.products,
    }));

    return NextResponse.json({ success: true, cart: formattedCart });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/cart — Add item to cart
export async function POST(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { product_id, quantity = 1 } = await request.json();
    if (!product_id || quantity < 1) {
      return NextResponse.json({ success: false, error: 'Invalid product_id or quantity' }, { status: 400 });
    }

    const { data: product } = await supabaseAdmin
      .from('products')
      .select('stock_quantity')
      .eq('id', product_id)
      .single();

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const { data: existing } = await supabaseAdmin
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', product_id)
      .single();

    const newQty = existing ? existing.quantity + quantity : quantity;
    if (newQty > product.stock_quantity) {
      return NextResponse.json({ success: false, error: 'Not enough stock' }, { status: 400 });
    }

    await supabaseAdmin.from('cart_items').upsert(
      { user_id: user.id, product_id, quantity: newQty },
      { onConflict: 'user_id, product_id' }
    );

    return NextResponse.json({ success: true, message: 'Added to cart' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/cart — Update item quantity
export async function PATCH(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { product_id, quantity } = await request.json();
    if (!product_id || typeof quantity !== 'number' || quantity < 1) {
      return NextResponse.json({ success: false, error: 'Invalid data' }, { status: 400 });
    }

    const { data: product } = await supabaseAdmin
      .from('products')
      .select('stock_quantity')
      .eq('id', product_id)
      .single();

    if (!product || quantity > product.stock_quantity) {
      return NextResponse.json({ success: false, error: 'Not enough stock' }, { status: 400 });
    }

    await supabaseAdmin.from('cart_items').update({ quantity }).eq('user_id', user.id).eq('product_id', product_id);
    return NextResponse.json({ success: true, message: 'Cart updated' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/cart — Remove item or clear entire cart
export async function DELETE(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const product_id = searchParams.get('product_id');

    // Clear entire cart for user
    if (action === 'clear') {
      await supabaseAdmin.from('cart_items').delete().eq('user_id', user.id);
      return NextResponse.json({ success: true, message: 'Cart cleared' });
    }

    // Remove single item
    if (!product_id) {
      return NextResponse.json({ success: false, error: 'product_id required' }, { status: 400 });
    }

    await supabaseAdmin.from('cart_items').delete().eq('user_id', user.id).eq('product_id', product_id);
    return NextResponse.json({ success: true, message: 'Removed from cart' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
