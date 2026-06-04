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
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { code, cart_total } = req.body;
    if (!code || typeof cart_total !== 'number' || cart_total <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid promocode or cart total' });
    }

    const { data: promo, error: promoError } = await supabaseAdmin
      .from('promocodes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (promoError || !promo) return res.status(404).json({ success: false, error: 'Invalid promocode' });
    if (!promo.active) return res.status(400).json({ success: false, error: 'Promocode is inactive' });
    if (new Date(promo.expiry) < new Date()) return res.status(400).json({ success: false, error: 'Promocode has expired' });
    if (promo.usage_limit !== null && promo.used_count >= promo.usage_limit) return res.status(400).json({ success: false, error: 'Usage limit reached' });

    let discount = promo.discount_type === 'percentage' ? (cart_total * promo.value) / 100 : promo.value;
    discount = Math.min(discount, cart_total);

    return res.status(200).json({
      success: true,
      code: promo.code,
      discount_amount: discount,
      new_total: cart_total - discount,
    });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
}
