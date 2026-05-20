import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedProducts = (products || []).map((product) => {
      let stockMessage = 'In stock';

      if (product.stock_quantity <= 0) {
        stockMessage = 'Out of stock';
      } else if (product.stock_quantity <= 5) {
        stockMessage = `Only ${product.stock_quantity} left!`;
      }

      return {
        ...product,
        stock_message: stockMessage,
      };
    });

    return NextResponse.json({ success: true, products: formattedProducts });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
