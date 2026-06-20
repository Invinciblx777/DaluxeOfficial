"use client";

import { useAdminStore } from '@/lib/store';
import { Search, Mail, Phone, ShoppingBag, MapPin, Shield, ShieldOff, RefreshCw, Eye, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function CustomersPage() {
  const { customers, fetchCustomers, toggleBanUser } = useAdminStore();
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [banningId, setBanningId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filtered = customers.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  );

  const topSpender = [...customers].sort((a, b) => b.totalSpent - a.totalSpent)[0];

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCustomers();
    setRefreshing(false);
  };

  const handleToggleBan = async (userId: string, currentlyBanned: boolean) => {
    const action = currentlyBanned ? 'unban' : 'ban';
    if (!confirm(`Are you sure you want to ${action} this user? ${!currentlyBanned ? 'They will be signed out immediately.' : ''}`)) return;
    setBanningId(userId);
    await toggleBanUser(userId, !currentlyBanned);
    setBanningId(null);
    if (selectedCustomer?.id === userId) {
      setSelectedCustomer((prev: any) => prev ? { ...prev, isBanned: !currentlyBanned } : null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-light tracking-tight" style={{ color: '#FAFAFA' }}>Customers</h2>
          <p className="text-sm mt-1" style={{ color: '#52525B' }}>
            {customers.length} registered · {customers.filter(c => c.isBanned).length} banned
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="p-2.5 rounded-lg transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <RefreshCw size={15} style={{ color: '#71717A' }} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#52525B' }} />
            <input
              className="dark-input pl-9 pr-3 py-2.5 text-sm w-60"
              placeholder="Search by name, email, phone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Top Customer Card */}
      {topSpender && !topSpender.isBanned && (
        <div className="glass-card p-5 mb-6 flex items-center gap-5" style={{ border: '1px solid rgba(212,175,55,0.2)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0" style={{ background: 'linear-gradient(135deg,#D4AF37,#F5D06F)', color: '#0B0B0B' }}>
            {(topSpender.name || 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold" style={{ color: '#FAFAFA' }}>{topSpender.name}</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}>⭐ TOP CUSTOMER</span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: '#52525B' }}>{topSpender.email}</p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: '#52525B' }}>Total Spent</p>
            <p className="text-xl font-bold gold-text">₹{topSpender.totalSpent.toLocaleString()}</p>
            <p className="text-xs mt-0.5" style={{ color: '#52525B' }}>{topSpender.orderCount} orders</p>
          </div>
        </div>
      )}

      {/* Customers Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Customer', 'Contact', 'Address', 'Orders', 'Total Spent', 'Joined', 'Actions'].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#3F3F46' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-sm" style={{ color: '#3F3F46' }}>No customers found</td></tr>
            )}
            {filtered.map(c => (
              <tr key={c.id} className="table-row-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', opacity: c.isBanned ? 0.6 : 1 }}>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0" style={{ background: c.isBanned ? 'rgba(239,68,68,0.1)' : 'rgba(212,175,55,0.1)', color: c.isBanned ? '#EF4444' : '#D4AF37', border: `1px solid ${c.isBanned ? 'rgba(239,68,68,0.15)' : 'rgba(212,175,55,0.15)'}` }}>
                      {(c.name || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm" style={{ color: '#FAFAFA' }}>{c.name || 'No Name'}</p>
                      {c.isBanned && <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>BANNED</span>}
                      {c.role === 'admin' && !c.isBanned && <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37' }}>ADMIN</span>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: '#71717A' }}>
                      <Mail size={11} /> {c.email}
                    </span>
                    {c.phone && (
                      <span className="flex items-center gap-1.5 text-xs" style={{ color: '#71717A' }}>
                        <Phone size={11} /> {c.phone}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4">
                  {(c.address || c.city) ? (
                    <span className="flex items-start gap-1.5 text-xs max-w-[160px]" style={{ color: '#71717A' }}>
                      <MapPin size={11} className="shrink-0 mt-0.5" />
                      <span>{[c.address, c.city, c.state, c.pincode].filter(Boolean).join(', ')}</span>
                    </span>
                  ) : (
                    <span className="text-xs" style={{ color: '#3F3F46' }}>—</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#FAFAFA' }}>
                    <ShoppingBag size={13} style={{ color: '#A78BFA' }} /> {c.orderCount}
                  </span>
                </td>
                <td className="px-5 py-4 font-bold text-sm gold-text">₹{c.totalSpent.toLocaleString()}</td>
                <td className="px-5 py-4 text-xs" style={{ color: '#52525B' }}>
                  {c.joinedAt ? new Date(c.joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedCustomer(c)}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                      title="View Details"
                    >
                      <Eye size={13} style={{ color: '#71717A' }} />
                    </button>
                    {c.role !== 'admin' && (
                      <button
                        onClick={() => handleToggleBan(c.id, c.isBanned)}
                        disabled={banningId === c.id}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ background: c.isBanned ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${c.isBanned ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}` }}
                        title={c.isBanned ? 'Unban User' : 'Ban User'}
                      >
                        {banningId === c.id ? (
                          <span className="text-xs" style={{ color: '#71717A' }}>…</span>
                        ) : c.isBanned ? (
                          <ShieldOff size={13} style={{ color: '#22C55E' }} />
                        ) : (
                          <Shield size={13} style={{ color: '#EF4444' }} />
                        )}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-card w-full max-w-lg" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 pb-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl" style={{ background: selectedCustomer.isBanned ? 'rgba(239,68,68,0.1)' : 'linear-gradient(135deg,#D4AF37,#F5D06F)', color: selectedCustomer.isBanned ? '#EF4444' : '#0B0B0B', border: selectedCustomer.isBanned ? '2px solid rgba(239,68,68,0.3)' : 'none' }}>
                  {(selectedCustomer.name || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-lg" style={{ color: '#FAFAFA' }}>{selectedCustomer.name || 'No Name'}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedCustomer.isBanned && <span className="text-[10px] px-2 py-0.5 rounded font-bold" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>BANNED</span>}
                    {selectedCustomer.role === 'admin' && <span className="text-[10px] px-2 py-0.5 rounded font-bold" style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37' }}>ADMIN</span>}
                    <span className="text-xs" style={{ color: '#52525B' }}>Customer since {new Date(selectedCustomer.joinedAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <X size={16} style={{ color: '#71717A' }} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Contact Info */}
              <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#D4AF37' }}>Contact Details</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#A1A1AA' }}>
                    <Mail size={14} style={{ color: '#52525B' }} /> {selectedCustomer.email}
                  </div>
                  {selectedCustomer.phone && (
                    <div className="flex items-center gap-2 text-sm" style={{ color: '#A1A1AA' }}>
                      <Phone size={14} style={{ color: '#52525B' }} /> {selectedCustomer.phone}
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              {(selectedCustomer.address || selectedCustomer.city) && (
                <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#D4AF37' }}>Saved Address</p>
                  <div className="flex items-start gap-2 text-sm" style={{ color: '#A1A1AA' }}>
                    <MapPin size={14} className="shrink-0 mt-0.5" style={{ color: '#52525B' }} />
                    <span>{[selectedCustomer.address, selectedCustomer.city, selectedCustomer.state, selectedCustomer.pincode].filter(Boolean).join(', ')}</span>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.12)' }}>
                  <p className="text-2xl font-bold" style={{ color: '#A78BFA' }}>{selectedCustomer.orderCount}</p>
                  <p className="text-xs mt-1" style={{ color: '#52525B' }}>Total Orders</p>
                </div>
                <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.12)' }}>
                  <p className="text-2xl font-bold gold-text">₹{selectedCustomer.totalSpent.toLocaleString()}</p>
                  <p className="text-xs mt-1" style={{ color: '#52525B' }}>Total Spent</p>
                </div>
              </div>

              {/* Ban Action */}
              {selectedCustomer.role !== 'admin' && (
                <button
                  onClick={() => handleToggleBan(selectedCustomer.id, selectedCustomer.isBanned)}
                  disabled={banningId === selectedCustomer.id}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                  style={{
                    background: selectedCustomer.isBanned ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${selectedCustomer.isBanned ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                    color: selectedCustomer.isBanned ? '#22C55E' : '#EF4444',
                  }}
                >
                  {banningId === selectedCustomer.id ? (
                    'Processing…'
                  ) : selectedCustomer.isBanned ? (
                    <><ShieldOff size={16} /> Unban User</>
                  ) : (
                    <><Shield size={16} /> Ban User</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
