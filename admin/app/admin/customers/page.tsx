"use client";

import { useAdminStore } from '@/lib/store';
import { Search, Mail, Phone, ShoppingBag } from 'lucide-react';
import { useState } from 'react';

export default function CustomersPage() {
  const { customers, orders } = useAdminStore();
  const [search, setSearch] = useState('');

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const topSpender = [...customers].sort((a, b) => b.totalSpent - a.totalSpent)[0];

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-light tracking-tight" style={{ color: '#FAFAFA' }}>Customers</h2>
          <p className="text-sm mt-1" style={{ color: '#52525B' }}>{customers.length} registered customers</p>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#52525B' }} />
          <input className="dark-input pl-9 pr-3 py-2.5 text-sm w-60" placeholder="Search customers…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Top Customer Card */}
      {topSpender && (
        <div className="glass-card p-5 mb-6 flex items-center gap-5" style={{ border: '1px solid rgba(212,175,55,0.2)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0" style={{ background: 'linear-gradient(135deg,#D4AF37,#F5D06F)', color: '#0B0B0B' }}>
            {topSpender.name[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold" style={{ color: '#FAFAFA' }}>{topSpender.name}</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}>TOP CUSTOMER</span>
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

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Customer', 'Contact', 'Orders', 'Total Spent', 'Joined'].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#3F3F46' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-sm" style={{ color: '#3F3F46' }}>No customers found</td></tr>
            )}
            {filtered.map(c => (
              <tr key={c.id} className="table-row-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0" style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.15)' }}>
                      {c.name[0]}
                    </div>
                    <p className="font-medium text-sm" style={{ color: '#FAFAFA' }}>{c.name}</p>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: '#71717A' }}>
                      <Mail size={11} /> {c.email}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: '#71717A' }}>
                      <Phone size={11} /> {c.phone}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#FAFAFA' }}>
                    <ShoppingBag size={13} style={{ color: '#A78BFA' }} /> {c.orderCount}
                  </span>
                </td>
                <td className="px-5 py-4 font-bold text-sm gold-text">₹{c.totalSpent.toLocaleString()}</td>
                <td className="px-5 py-4 text-xs" style={{ color: '#52525B' }}>
                  {new Date(c.joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
