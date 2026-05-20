import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function getAdmin(req: VercelRequest) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return null;
  return user;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const admin = await getAdmin(req);
    if (!admin) return res.status(403).json({ success: false, error: 'Forbidden' });

    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json({ success: true, products: data });
    }

    if (req.method === 'POST') {
      const payload = req.body;
      if (!payload.name || !payload.price) return res.status(400).json({ success: false, error: 'Missing required fields' });
      const { data, error } = await supabaseAdmin.from('products').insert(payload).select().single();
      if (error) throw error;
      return res.status(200).json({ success: true, product: data });
    }

    if (req.method === 'PATCH') {
      const { id, ...updates } = req.body;
      if (!id) return res.status(400).json({ success: false, error: 'Product ID required' });
      const { data, error } = await supabaseAdmin.from('products').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json({ success: true, product: data });
    }

    if (req.method === 'DELETE') {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ success: false, error: 'Product ID required' });
      const { error } = await supabaseAdmin.from('products').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Product deleted' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
}
