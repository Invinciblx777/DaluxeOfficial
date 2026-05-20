import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin-service';
import { ShiprocketService } from '@/lib/shiprocket';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      orderPayload, 
      cartItems 
    } = body;

    // 1. Insert Order to Supabase (COD)
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number: `ORD-COD-${Date.now()}`,
        user_id: orderPayload.user_id || null,
        status: 'pending', // COD is pending until delivered and paid
        total_amount: orderPayload.total_amount,
        shipping_address: orderPayload.shipping_address,
        payment_id: 'COD'
      })
      .select()
      .single();

    if (orderError || !orderData) {
      console.error('Failed to create COD order', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // 2. Decrement Product Stock & Create Order Items
    for (const item of cartItems) {
      // Create the items for Shiprocket compatibility even if product mapping in DB fails. Ensure product_id exists.
      const productId = item.product_id || item.id;
      
      const insertData: any = {
        order_id: orderData.id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      };
      
      if (productId) insertData.product_id = productId;

      await supabaseAdmin.from('order_items').insert(insertData).catch(e => console.error(e));

      // Fetch current stock
      if (productId) {
         const { data: prod } = await supabaseAdmin
          .from('products')
          .select('stock_level')
          .eq('id', productId)
          .single();
        
        if (prod) {
          await supabaseAdmin
            .from('products')
            .update({ stock_level: Math.max(0, prod.stock_level - item.quantity) })
            .eq('id', productId);
        }
      }
    }

    // 3. Trigger Shiprocket Ad-hoc Order (COD)
    try {
      const shiprocketPayload = {
        order_id: orderData.order_number,
        order_date: new Date().toISOString(),
        pickup_location: "Primary",
        billing_customer_name: orderPayload.shipping_address.name,
        billing_last_name: "",
        billing_address: orderPayload.shipping_address.address_line1,
        billing_address_2: orderPayload.shipping_address.address_line2 || "",
        billing_city: orderPayload.shipping_address.city,
        billing_state: orderPayload.shipping_address.state,
        billing_country: "India",
        billing_pincode: orderPayload.shipping_address.pincode,
        billing_email: orderPayload.email,
        billing_phone: orderPayload.shipping_address.phone,
        shipping_is_billing: true,
        order_items: cartItems.map((item: any) => ({
          name: item.name,
          sku: item.slug || "SKU-DEF",
          units: item.quantity,
          selling_price: item.price,
          discount: 0,
          tax: 0,
          hsn: "33049910"
        })),
        payment_method: "COD",
        sub_total: orderPayload.total_amount,
        length: 10,
        breadth: 10,
        height: 10,
        weight: orderPayload.total_weight_kg || 0.5
      };

      const shiprocketRes = await ShiprocketService.createOrder(shiprocketPayload);
      
      if (shiprocketRes && shiprocketRes.order_id) {
        await supabaseAdmin
          .from('orders')
          .update({ 
            shiprocket_order_id: shiprocketRes.order_id.toString(),
            shiprocket_shipment_id: shiprocketRes.shipment_id.toString() 
          })
          .eq('id', orderData.id);
      }
    } catch (shiprocketErr) {
      console.error('Shiprocket COD creation failed, but order was saved', shiprocketErr);
    }

    return NextResponse.json({ success: true, order: orderData });
  } catch (error: any) {
    console.error('Error verifying COD order:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
