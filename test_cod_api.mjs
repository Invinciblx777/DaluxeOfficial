import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function testCOD() {
  const payload = {
    orderPayload: {
      user_id: null,
      total_amount: 398,
      email: "test@daluxeskincare.com",
      shipping_address: {
        name: "test cod",
        phone: "9195005933",
        address_line1: "102/gkd nagar",
        address_line2: "",
        city: "Periyanaickenpalayam",
        state: "Tamil Nadu",
        pincode: "641020"
      }
    },
    cartItems: [
      { product_id: "hairoil", name: "HAIR OIL", quantity: 1, price: 299 }
    ]
  };

  const JWT = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const res = await fetch("https://daluxeadminpanel.vercel.app/api/checkout?action=cod", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${JWT}`
    },
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text);
}

testCOD();
