import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseAdmin = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function syncProducts() {
  const productsToSync = [
    { id: 'facewash', name: 'ULTRA SENSITIVE GOLD GLOW FACEWASH', price: 249, category: 'cleanse' },
    { id: 'hairserum', name: 'ULTRA SENSITIVE SMOOTH & SHINE HAIR SERUM', price: 349, category: 'hair' },
    { id: 'faceserum', name: 'ULTRA SENSITIVE GLOW & CORRECT FACE SERUM', price: 449, category: 'serum' },
    { id: 'nightcream', name: 'ULTRA SENSITIVE REPAIR NIGHT CREAM', price: 399, category: 'night' },
    { id: 'hairoil', name: 'ULTRA SENSITIVE HAIR GROWTH ELIXIR HAIR OIL', price: 299, category: 'hair' },
    { id: 'hairshampoo', name: 'ULTRA SENSITIVE CALM & CLEAN HAIR SHAMPOO', price: 249, category: 'hair' },
    { id: 'skin-combo', name: 'VIRGIN 5.0 SKINCARE COMBO', price: 897, category: 'combo' },
    { id: 'hair-combo', name: 'VIRGIN 5.0 HAIR CARE COMBO', price: 897, category: 'combo' }
  ];

  for (const p of productsToSync) {
    const { data: existing } = await supabaseAdmin.from('products').select('id').eq('id', p.id).single();
    if (!existing) {
      console.log(`Inserting missing product: ${p.id}`);
      const { error } = await supabaseAdmin.from('products').insert({
        id: p.id,
        name: p.name,
        price: p.price,
        category: p.category,
        stock_quantity: 100, // Give them default stock
        is_active: true
      });
      if (error) {
        console.error(`Failed to insert ${p.id}:`, error.message);
      } else {
        console.log(`Successfully inserted ${p.id}`);
      }
    } else {
      console.log(`Product ${p.id} already exists, skipping.`);
    }
  }
}

syncProducts();
