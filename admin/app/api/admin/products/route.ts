import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin-service';
import { getAdminUser } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

// Create a product (service-role write, bypasses RLS — admin-guarded).
// Body: { product: { ...snake_case columns } }
export async function POST(req: Request) {
  try {
    const admin = await getAdminUser(req);
    if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { product } = await req.json();
    if (!product || !product.name) {
      return NextResponse.json({ success: false, error: 'Missing product data' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert([product])
      .select()
      .single();

    if (error) {
      console.error('[Admin Products POST Error]:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[Admin Products POST Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Update a product. Body: { id, updates: { ...snake_case columns } }
export async function PATCH(req: Request) {
  try {
    const admin = await getAdminUser(req);
    if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id, updates } = await req.json();
    if (!id || !updates || typeof updates !== 'object') {
      return NextResponse.json({ success: false, error: 'Missing id or updates' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('products').update(updates).eq('id', id);

    if (error) {
      console.error('[Admin Products PATCH Error]:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Admin Products PATCH Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Delete a product. Query: ?id=<uuid>
export async function DELETE(req: Request) {
  try {
    const admin = await getAdminUser(req);
    if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });

    const { error } = await supabaseAdmin.from('products').delete().eq('id', id);

    if (error) {
      console.error('[Admin Products DELETE Error]:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Admin Products DELETE Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
