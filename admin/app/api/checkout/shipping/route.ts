import { NextResponse } from 'next/server';
import { ShiprocketService } from '@/lib/shiprocket';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const delivery_postcode = searchParams.get('pincode');
    const payment = searchParams.get('payment') || 'prepaid'; // 'prepaid' | 'cod'
    const cod = payment === 'cod' ? 1 : 0;
    const weight = searchParams.get('weight') || '0.5';

    if (!delivery_postcode || delivery_postcode.length < 6) {
      return NextResponse.json({ error: 'Valid pincode required' }, { status: 400 });
    }

    const pickup_postcode = process.env.SHIPROCKET_PICKUP_POSTCODE || '110030'; // fallback postcode or your warehouse

    const res = await ShiprocketService.checkServiceability({
      pickup_postcode: parseInt(pickup_postcode),
      delivery_postcode: parseInt(delivery_postcode),
      weight: parseFloat(weight),
      cod
    });

    if (res && res.data && res.data.available_courier_companies && res.data.available_courier_companies.length > 0) {
      // Find the cheapest standard shipping rate
      const companies = res.data.available_courier_companies;
      const rates = companies.map((c: any) => parseFloat(c.rate));
      const minRate = Math.min(...rates);

      return NextResponse.json({
        serviceable: true,
        rate: minRate,
        couriers_count: companies.length,
        estimated_delivery_days: companies[0].etd
      });
    } else {
      return NextResponse.json({
        serviceable: false,
        rate: 99, // Fallback local rate
        error: "Unserviceable via Shiprocket"
      });
    }

  } catch (error: any) {
    console.error('Shiprocket serviceability error:', error);
    return NextResponse.json({ error: error.message, rate: 99, serviceable: false }, { status: 500 }); // Default 99 fallback
  }
}
