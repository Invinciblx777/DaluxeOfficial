import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedProducts = (products || []).map((product: any) => {
      let stock_message = 'In stock';
      if (product.stock_quantity <= 0) stock_message = 'Out of stock';
      else if (product.stock_quantity <= 5) stock_message = `Only ${product.stock_quantity} left!`;
      return { ...product, stock_message };
    });

    return res.status(200).json({ success: true, products: formattedProducts });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
}
