"use client";

import { useState, useEffect } from 'react';
import { Globe, Bell, Lock, Store, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [storeName, setStoreName] = useState('DALUXE');
  const [currency, setCurrency] = useState('INR');
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [saved, setSaved] = useState(false);

  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [showSupaConfig, setShowSupaConfig] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const localUrl = window.localStorage.getItem('NEXT_PUBLIC_SUPABASE_URL') || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const localKey = window.localStorage.getItem('NEXT_PUBLIC_SUPABASE_ANON_KEY') || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      setSupabaseUrl(localUrl);
      setSupabaseAnonKey(localKey);
    }
  }, []);

  const isSupabaseConfigured = !!(
    supabaseUrl && 
    supabaseUrl !== 'https://placeholder-project.supabase.co' && 
    supabaseUrl !== '' &&
    supabaseAnonKey && 
    supabaseAnonKey !== 'placeholder-anon-key' &&
    supabaseAnonKey !== ''
  );

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-light tracking-tight" style={{ color: '#FAFAFA' }}>Settings</h2>
        <p className="text-sm mt-1" style={{ color: '#52525B' }}>Manage store preferences and admin configuration</p>
      </div>

      <div className="max-w-2xl space-y-4">
        {/* Store Info */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.1)' }}>
              <Store size={15} style={{ color: '#D4AF37' }} />
            </div>
            <h3 className="text-sm font-semibold" style={{ color: '#FAFAFA' }}>Store Information</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#71717A' }}>Store Name</label>
              <input className="dark-input w-full px-3 py-2.5 text-sm" value={storeName} onChange={e => setStoreName(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#71717A' }}>Currency</label>
              <select className="dark-input w-full px-3 py-2.5 text-sm" value={currency} onChange={e => setCurrency(e.target.value)}>
                <option value="INR">INR — Indian Rupee (₹)</option>
                <option value="USD">USD — US Dollar ($)</option>
                <option value="EUR">EUR — Euro (€)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(234,179,8,0.1)' }}>
              <Bell size={15} style={{ color: '#EAB308' }} />
            </div>
            <h3 className="text-sm font-semibold" style={{ color: '#FAFAFA' }}>Inventory Alerts</h3>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#71717A' }}>Low Stock Threshold (units)</label>
            <input type="number" className="dark-input w-full px-3 py-2.5 text-sm" value={lowStockThreshold}
              onChange={e => setLowStockThreshold(Number(e.target.value))} />
            <p className="text-xs mt-2" style={{ color: '#3F3F46' }}>Products with stock ≤ this number will be tagged as "Low Stock"</p>
          </div>
        </div>

        {/* Integrations */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(96,165,250,0.1)' }}>
              <Globe size={15} style={{ color: '#60A5FA' }} />
            </div>
            <h3 className="text-sm font-semibold" style={{ color: '#FAFAFA' }}>Integrations</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Razorpay', status: 'Connected', color: '#4ADE80', expandable: false },
              { label: 'Shiprocket', status: 'Connected', color: '#4ADE80', expandable: false },
              { 
                label: 'Supabase', 
                status: isSupabaseConfigured ? 'Connected' : 'Not configured', 
                color: isSupabaseConfigured ? '#4ADE80' : '#EAB308',
                expandable: true
              }
            ].map(item => (
              <div key={item.label} className="flex flex-col">
                <div 
                  onClick={() => item.expandable && setShowSupaConfig(!showSupaConfig)}
                  className={`flex items-center justify-between p-3.5 rounded-xl transition-all ${item.expandable ? 'cursor-pointer hover:bg-[rgba(255,255,255,0.05)]' : ''}`} 
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: '#FAFAFA' }}>{item.label}</span>
                    {item.expandable && (
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded cursor-pointer" style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37' }}>
                        {showSupaConfig ? 'Hide Config' : 'Check Credentials'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: item.color }} />
                    <span className="text-xs" style={{ color: item.color }}>{item.status}</span>
                  </div>
                </div>

                {item.label === 'Supabase' && showSupaConfig && (
                  <div className="mt-2.5 p-4 rounded-xl space-y-4 transition-all" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="text-[10px] font-bold tracking-wider" style={{ color: '#D4AF37' }}>SUPABASE OVERRIDES SETUP</div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: '#71717A' }}>Supabase Project URL</label>
                      <input 
                        type="text" 
                        className="dark-input w-full px-3 py-2 text-xs" 
                        placeholder="https://your-project.supabase.co"
                        value={supabaseUrl} 
                        onChange={e => setSupabaseUrl(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: '#71717A' }}>Supabase Anon / API Key</label>
                      <input 
                        type="password" 
                        className="dark-input w-full px-3 py-2 text-xs" 
                        placeholder="your-anon-key..."
                        value={supabaseAnonKey} 
                        onChange={e => setSupabaseAnonKey(e.target.value)} 
                      />
                      <p className="text-[10px] mt-1.5 leading-relaxed" style={{ color: '#52525B' }}>
                        Overriding Supabase settings dynamically connects this admin dashboard and the storefront to your database without touching local config files.
                      </p>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button 
                        onClick={async () => {
                          if (typeof window !== 'undefined') {
                            try {
                              const res = await fetch('/api/admin/save-config', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ url: supabaseUrl, key: supabaseAnonKey })
                              });
                              const data = await res.json();
                              if (data.success) {
                                window.localStorage.setItem('NEXT_PUBLIC_SUPABASE_URL', supabaseUrl);
                                window.localStorage.setItem('NEXT_PUBLIC_SUPABASE_ANON_KEY', supabaseAnonKey);
                                toast.success("Supabase configuration saved & persisted! Reloading...");
                                window.dispatchEvent(new Event('storage'));
                                setTimeout(() => {
                                  window.location.reload();
                                }, 1000);
                              } else {
                                toast.error(`Failed to save config on server: ${data.error}`);
                              }
                            } catch (e: any) {
                              toast.error(`Error saving config: ${e.message}`);
                            }
                          }
                        }} 
                        className="gold-btn px-4 py-2 text-xs font-bold tracking-wide transition-all"
                      >
                        Save Configuration
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Admin Access */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
              <Lock size={15} style={{ color: '#F87171' }} />
            </div>
            <h3 className="text-sm font-semibold" style={{ color: '#FAFAFA' }}>Admin Access</h3>
          </div>
          <div className="p-4 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#71717A' }}>
            Authentication is powered by <strong style={{ color: '#A1A1AA' }}>Supabase Auth</strong>. Admin route protection is managed via <strong style={{ color: '#A1A1AA' }}>middleware.ts</strong>. 
            Enable middleware to restrict access to authenticated admin users only.
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button onClick={handleSave} className="gold-btn px-8 py-2.5 text-sm transition-all">
            {saved ? '✓ Saved' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
