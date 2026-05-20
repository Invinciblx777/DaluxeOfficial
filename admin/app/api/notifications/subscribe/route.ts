import { NextResponse } from 'next/server';
import webpush from 'web-push';

// Called lazily inside each handler — never at module/build time
function initWebPush() {
  webpush.setVapidDetails(
    'mailto:admin@daluxeskincare.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'placeholder',
    process.env.VAPID_PRIVATE_KEY || 'placeholder'
  );
}

export async function POST(req: Request) {
  try {
    initWebPush();
    // subscription saving — not yet wired to DB
    await req.json();
    return NextResponse.json({ success: true, message: 'Subscription successful' });
  } catch (error: any) {
    console.error('Error handling subscription:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    initWebPush();
    const { subscription, payload } = await req.json();
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return NextResponse.json({ success: true, message: 'Notification sent' });
  } catch (error: any) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
