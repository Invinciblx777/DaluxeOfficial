
require('dotenv').config({ path: './admin/.env.local' });
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const EMAIL = process.env.SHIPROCKET_EMAIL;
const PASSWORD = process.env.SHIPROCKET_PASSWORD;
const BASE_URL = process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external';

async function testShiprocket() {
    console.log('Testing Shiprocket connectivity...');
    console.log('Email:', EMAIL);
    console.log('Password Length:', PASSWORD ? PASSWORD.length : 0);

    try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD.replace(/^['"]|['"]$/g, '') })
        });

        const data = await res.json();
        if (res.ok && data.token) {
            console.log('✅ Shiprocket AUTH SUCCESS');
            console.log('Token snippet:', data.token.slice(0, 10) + '...');
            
            // Test pickup locations
            const locRes = await fetch(`${BASE_URL}/settings/company/pickup`, {
                headers: { 'Authorization': `Bearer ${data.token}` }
            });
            const locData = await locRes.json();
            console.log('✅ Pickup Locations:', locData.data?.shipping_address?.map(l => l.pickup_location) || 'None found');
        } else {
            console.error('❌ Shiprocket AUTH FAILED');
            console.error('Status:', res.status);
            console.error('Response:', data);
        }
    } catch (err) {
        console.error('❌ Network Error:', err.message);
    }
}

testShiprocket();
