import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function getUser(req: VercelRequest) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('cart_items')
        .select('id, quantity, added_at, products(id, name, price, sale_price, images, stock_quantity)')
        .eq('user_id', user.id)
        .order('added_at', { ascending: false });

      if (error) throw error;

      const cart = (data || []).map((item: any) => ({
        cart_item_id: item.id,
        quantity: item.quantity,
        product: item.products,
      }));

      return res.status(200).json({ success: true, cart });
    }

    if (req.method === 'POST') {
      const { product_id, quantity = 1 } = req.body;
      if (!product_id || quantity < 1) return res.status(400).json({ success: false, error: 'Invalid product_id or quantity' });

      const { data: product } = await supabaseAdmin.from('products').select('stock_quantity').eq('id', product_id).single();
      if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

      const { data: existing } = await supabaseAdmin.from('cart_items').select('id, quantity').eq('user_id', user.id).eq('product_id', product_id).single();
      const newQty = existing ? existing.quantity + quantity : quantity;
      if (newQty > product.stock_quantity) return res.status(400).json({ success: false, error: 'Not enough stock' });

      await supabaseAdmin.from('cart_items').upsert({ user_id: user.id, product_id, quantity: newQty }, { onConflict: 'user_id, product_id' });
      return res.status(200).json({ success: true, message: 'Added to cart' });
    }

    if (req.method === 'PATCH') {
      const { product_id, quantity } = req.body;
      if (!product_id || typeof quantity !== 'number' || quantity < 1) return res.status(400).json({ success: false, error: 'Invalid data' });

      const { data: product } = await supabaseAdmin.from('products').select('stock_quantity').eq('id', product_id).single();
      if (!product || quantity > product.stock_quantity) return res.status(400).json({ success: false, error: 'Not enough stock' });

      await supabaseAdmin.from('cart_items').update({ quantity }).eq('user_id', user.id).eq('product_id', product_id);
      return res.status(200).json({ success: true, message: 'Cart updated' });
    }

    if (req.method === 'DELETE') {
      const action = req.query.action as string;

      // Clear entire cart for user
      if (action === 'clear') {
        await supabaseAdmin.from('cart_items').delete().eq('user_id', user.id);
        return res.status(200).json({ success: true, message: 'Cart cleared' });
      }

      // Remove single item
      const product_id = req.query.product_id as string;
      if (!product_id) return res.status(400).json({ success: false, error: 'product_id required' });

      await supabaseAdmin.from('cart_items').delete().eq('user_id', user.id).eq('product_id', product_id);
      return res.status(200).json({ success: true, message: 'Removed from cart' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
}
