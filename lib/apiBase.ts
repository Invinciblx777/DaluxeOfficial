import { Platform } from 'react-native';

/**
 * Resolve the base URL for storefront → backend API calls.
 *
 * On WEB the Expo export and the Next.js API are served from the *same* Vercel
 * deployment, so they always share an origin. We therefore use a same-origin
 * relative path ('') and let the browser resolve it against the current page.
 *
 * Why we deliberately ignore EXPO_PUBLIC_API_URL on web:
 *   The env var was set to the apex host (https://daluxeofficial.in) while the
 *   live page is served from https://www.daluxeofficial.in. That made every
 *   call cross-origin, and the apex→www canonical 307 redirect killed the CORS
 *   preflight (browsers refuse to follow redirects on an OPTIONS preflight),
 *   surfacing as "Failed to fetch / Could not reach the payment gateway".
 *   Forcing same-origin on web makes checkout immune to that misconfiguration.
 *
 * On NATIVE there is no same origin, so the configured absolute URL is required.
 */
export function getApiBase(): string {
  if (Platform.OS === 'web') return '';
  return (typeof process !== 'undefined' && process.env.EXPO_PUBLIC_API_URL) || '';
}
