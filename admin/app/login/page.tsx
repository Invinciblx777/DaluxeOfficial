import { redirect } from 'next/navigation';

// No separate admin login page needed.
// Users log in on the main site, then visit /admin.
// The admin layout checks their session (from localStorage) and verifies
// their email is in the ADMIN_EMAILS whitelist.
export default function LoginPage() {
  redirect('/');
}
