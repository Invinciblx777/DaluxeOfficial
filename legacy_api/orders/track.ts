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
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const query = (req.query.query as string || '').trim();
    if (!query) return res.status(400).json({ success: false, error: 'Search query required' });

    // Search by order_number or awb_code
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(id, quantity, price, product_id, products(id, name, images, price))')
      .eq('user_id', user.id)
      .or(`order_number.ilike.%${query}%,awb_code.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    if (!orders || orders.length === 0) {
      return res.status(200).json({ success: false, error: 'No order found with that ID or AWB number.' });
    }

    return res.status(200).json({ success: true, orders });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
}
