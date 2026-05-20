import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Known bot user-agent patterns that should be allowed through without
 * session validation. This prevents Vercel's deployment screenshot bot
 * (and similar services) from receiving 403 errors.
 */
const BOT_USER_AGENTS = [
  'vercel',
  'headlesschrome',
  'lighthouse',
  'googlebot',
  'bingbot',
  'slurp',
  'duckduckbot',
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'telegrambot',
  'prerender',
  'puppeteer',
  'playwright',
];

function isBot(request: NextRequest): boolean {
  const ua = (request.headers.get('user-agent') || '').toLowerCase();
  if (!ua) return true;
  return BOT_USER_AGENTS.some(bot => ua.includes(bot));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow bots through on all pages
  if (isBot(request)) {
    return NextResponse.next();
  }

  // Admin auth is handled client-side in the admin layout
  // (reads from localStorage, same session as the Expo SPA)
  // No middleware auth needed — just pass through
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|_expo|assets|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|js|css|map|woff|woff2|ttf|eot)$).*)',
  ],
};
