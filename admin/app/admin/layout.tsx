"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Package, Users, BarChart3, Settings, Sparkles, LogOut, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Toaster, toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase/admin-service';

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { href: '/admin/coupons', icon: Ticket, label: 'Coupons' },
  { href: '/admin/products', icon: Package, label: 'Products' },
  { href: '/admin/customers', icon: Users, label: 'Customers' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

/**
 * Admin email whitelist — checked client-side.
 * The actual security comes from Supabase Auth (you can't fake your JWT email).
 * All admin data APIs should also verify on the server side.
 */
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

/**
 * Read the Supabase auth session directly from localStorage.
 * The Expo SPA stores it under: sb-<projectRef>-auth-token
 */
function getStoredSession(): { access_token: string; user: { email: string } } | null {
  if (typeof window === 'undefined') return null;

  // Read from localStorage overrides first, then from process.env
  const supabaseUrl = window.localStorage.getItem('NEXT_PUBLIC_SUPABASE_URL') || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  const projectRef = match ? match[1] : '';

  if (!projectRef) return null;

  const storageKey = `sb-${projectRef}-auth-token`;
  const raw = localStorage.getItem(storageKey);

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (parsed?.access_token && parsed?.user?.email) {
      return { access_token: parsed.access_token, user: parsed.user };
    }
    return null;
  } catch {
    return null;
  }
}

// Singleton supabase client for sign-out
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    const supabaseUrl = (typeof window !== 'undefined' ? window.localStorage.getItem('NEXT_PUBLIC_SUPABASE_URL') : null) || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = (typeof window !== 'undefined' ? window.localStorage.getItem('NEXT_PUBLIC_SUPABASE_ANON_KEY') : null) || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    _supabase = createClient(
      supabaseUrl || 'https://placeholder-project.supabase.co',
      supabaseAnonKey || 'placeholder-anon-key',
      {
        auth: {
          flowType: 'implicit',
          persistSession: true,
          autoRefreshToken: true,
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        },
      }
    );
  }
  return _supabase;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authState, setAuthState] = useState<'loading' | 'authorized' | 'unauthorized' | 'not-logged-in'>('loading');

  useEffect(() => {
    const checkAdmin = async () => {
      // Read session directly from localStorage (same storage as Expo SPA)
      const session = getStoredSession();

      if (!session) {
        setAuthState('not-logged-in');
        window.location.href = '/login';
        return;
      }

      const email = session.user.email.toLowerCase();

      // Check admin whitelist
      // If NEXT_PUBLIC_ADMIN_EMAILS is set, use it for client-side check
      // Otherwise fall back to the API endpoint
      if (ADMIN_EMAILS.length > 0) {
        if (ADMIN_EMAILS.includes(email)) {
          setUserEmail(session.user.email);
          setAuthState('authorized');
        } else {
          setAuthState('unauthorized');
          window.location.href = '/unauthorized';
        }
        return;
      }

      // Fallback: verify via API
      try {
        const res = await fetch('/api/admin/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: session.access_token }),
        });
        const data = await res.json();

        if (data.isAdmin) {
          setUserEmail(data.email || session.user.email);
          setAuthState('authorized');
        } else {
          setAuthState('unauthorized');
          window.location.href = '/unauthorized';
        }
      } catch {
        setAuthState('unauthorized');
        window.location.href = '/unauthorized';
      }
    };

    checkAdmin();

    // Listen for new orders
    const channel = supabaseAdmin
      .channel('admin-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const newOrder = payload.new as any;
          toast.success(`New Order: ${newOrder.order_number}`, {
            description: `Total: ₹${newOrder.total_amount}`,
            duration: 5000,
            action: {
              label: 'View',
              onClick: () => window.location.href = '/admin/orders'
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabaseAdmin.removeChannel(channel);
    };
  }, []);

  const handleSignOut = async () => {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Failed to sign out');
    } else {
      window.location.href = '/';
    }
  };

  // Loading state
  if (authState === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0B0B0B',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '2px solid rgba(212,175,55,0.2)',
            borderTopColor: '#D4AF37',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: '#71717A', fontSize: '13px', letterSpacing: '0.1em' }}>
            Verifying access...
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // Not authorized states redirect via window.location, show nothing while redirecting
  if (authState !== 'authorized') {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full" style={{ backgroundColor: '#0B0B0B' }}>
      {/* Sidebar */}
      <aside className="w-60 shrink-0 flex flex-col border-r" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)' }}>
        {/* Logo */}
        <div className="px-6 py-7">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #D4AF37, #F5D06F)' }}>
              <Sparkles size={14} color="#0B0B0B" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-black tracking-[0.2em] text-sm" style={{ color: '#FAFAFA' }}>DALUXE</h1>
              <p className="text-[9px] tracking-[0.15em] uppercase" style={{ color: '#52525B' }}>Admin Panel</p>
            </div>
          </div>
        </div>

        <div className="gold-divider mx-4" />

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link key={href} href={href}
                className={cn('flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive ? 'sidebar-active' : 'sidebar-item'
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 pb-6 mt-auto">
          <div className="gold-divider mb-4" />
          
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium transition-all duration-150 sign-out-btn mb-4"
          >
            <LogOut size={16} />
            Sign Out
          </button>

          <div className="px-3 border-l" style={{ borderColor: 'rgba(212,175,55,0.2)' }}>
            <p className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: '#FAFAFA' }}>{userEmail || 'Admin'}</p>
            <p className="text-[9px] tracking-widest uppercase" style={{ color: '#3F3F46' }}>v1.0.0 · Daluxe Admin</p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
      <Toaster position="top-right" theme="dark" richColors />
    </div>
  );
}
