"use client";

import { useAdminStore, Order, OrderStatus } from '@/lib/store';
import { useMemo, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid
} from 'recharts';
import { TrendingUp, ShoppingBag, Clock, AlertTriangle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const weeklyRevenue = [
  { day: 'Mon', revenue: 12400 }, { day: 'Tue', revenue: 19800 }, { day: 'Wed', revenue: 8200 },
  { day: 'Thu', revenue: 28500 }, { day: 'Fri', revenue: 22100 }, { day: 'Sat', revenue: 35600 }, { day: 'Sun', revenue: 41200 }
];
const ordersData = [
  { day: 'Mon', orders: 4 }, { day: 'Tue', orders: 7 }, { day: 'Wed', orders: 3 },
  { day: 'Thu', orders: 11 }, { day: 'Fri', orders: 8 }, { day: 'Sat', orders: 14 }, { day: 'Sun', orders: 17 }
];

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'badge-pending', confirmed: 'badge-confirmed', processing: 'badge-confirmed',
  shipped: 'badge-shipped', delivered: 'badge-delivered', cancelled: 'badge-cancelled'
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing',
  shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled'
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-3 py-2 text-xs" style={{ border: '1px solid rgba(212,175,55,0.2)' }}>
        <p style={{ color: '#A1A1AA' }}>{label}</p>
        <p style={{ color: '#F5D06F', fontWeight: 700 }}>{typeof payload[0].value === 'number' && payload[0].name === 'revenue' ? `₹${payload[0].value.toLocaleString()}` : payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { products, orders, fetchProducts, fetchOrders } = useAdminStore();

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, [fetchProducts, fetchOrders]);

  const stats = useMemo(() => {
    // Calculate revenue from all non-cancelled orders (pending, confirmed, processing, shipped, delivered)
    const validOrders = orders.filter(o => o.status !== 'cancelled');
    const totalRevenue = validOrders.reduce((s, o) => s + o.total, 0);
    const activeOrders = orders.filter(o => ['pending', 'confirmed', 'processing'].includes(o.status)).length;
    const lowStock = products.filter(p => p.stockStatus === 'low' || p.stockStatus === 'outofstock').length;
    return { totalRevenue, activeOrders, total: orders.length, lowStock };
  }, [products, orders]);

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="flex-1 overflow-y-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-light tracking-tight" style={{ color: '#FAFAFA' }}>
          Good morning, <span className="gold-text font-semibold">Daluxe</span>
        </h2>
        <p className="mt-1 text-sm" style={{ color: '#52525B' }}>Here's what's happening with your store today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} sub="from active & completed orders" icon={TrendingUp} accent="#D4AF37" />
        <StatCard label="Total Orders" value={String(stats.total)} sub="all time" icon={ShoppingBag} accent="#60A5FA" />
        <StatCard label="Active Orders" value={String(stats.activeOrders)} sub="pending / processing" icon={Clock} accent="#A78BFA" />
        <StatCard label="Low / Out of Stock" value={String(stats.lowStock)} sub="products need attention" icon={AlertTriangle} accent="#F87171" urgent={stats.lowStock > 0} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: '#FAFAFA' }}>Weekly Revenue</h3>
              <p className="text-xs mt-0.5" style={{ color: '#52525B' }}>Last 7 days</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37' }}>+21.4%</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={weeklyRevenue}>
              <defs>
                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#3F3F46', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2} fill="url(#revGradient)" dot={false} activeDot={{ r: 4, fill: '#D4AF37' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: '#FAFAFA' }}>Orders by Day</h3>
              <p className="text-xs mt-0.5" style={{ color: '#52525B' }}>Last 7 days</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(96,165,250,0.1)', color: '#60A5FA' }}>+8 this week</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={ordersData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#3F3F46', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="orders" fill="rgba(96,165,250,0.6)" radius={[4, 4, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row: Recent Orders + Low Stock */}
      <div className="grid grid-cols-5 gap-4">
        {/* Recent Orders (3/5 width) */}
        <div className="col-span-3 glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold" style={{ color: '#FAFAFA' }}>Recent Orders</h3>
            <Link href="/admin/orders" className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity" style={{ color: '#D4AF37' }}>
              View all <ExternalLink size={11} />
            </Link>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th className="pb-3 font-medium text-left" style={{ color: '#52525B' }}>Order</th>
                <th className="pb-3 font-medium text-left" style={{ color: '#52525B' }}>Customer</th>
                <th className="pb-3 font-medium text-left" style={{ color: '#52525B' }}>Total</th>
                <th className="pb-3 font-medium text-left" style={{ color: '#52525B' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="table-row-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td className="py-3 font-mono" style={{ color: '#FAFAFA' }}>{order.orderNumber}</td>
                  <td className="py-3" style={{ color: '#A1A1AA' }}>{order.customer}</td>
                  <td className="py-3 font-semibold" style={{ color: '#FAFAFA' }}>₹{order.total.toLocaleString()}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Low Stock Alert (2/5 width) */}
        <div className="col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold" style={{ color: '#FAFAFA' }}>Stock Alerts</h3>
            <Link href="/admin/products" className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity" style={{ color: '#D4AF37' }}>
              Manage <ExternalLink size={11} />
            </Link>
          </div>
          <div className="space-y-3">
            {products.filter(p => p.stockStatus !== 'instock').map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <p className="text-xs font-medium" style={{ color: '#FAFAFA' }}>{p.name}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#52525B' }}>{p.category}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full badge-${p.stockStatus}`}>
                  {p.stockStatus === 'outofstock' ? 'OUT' : `${p.stock} left`}
                </span>
              </div>
            ))}
            {products.filter(p => p.stockStatus !== 'instock').length === 0 && (
              <p className="text-xs text-center py-6" style={{ color: '#3F3F46' }}>All products well stocked ✓</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, accent, urgent }: {
  label: string; value: string; sub: string; icon: any; accent: string; urgent?: boolean;
}) {
  return (
    <div className="glass-card p-5" style={urgent ? { borderColor: 'rgba(248,113,113,0.3)' } : {}}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-medium tracking-wide uppercase" style={{ color: '#52525B' }}>{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${accent}15` }}>
          <Icon size={15} style={{ color: accent }} />
        </div>
      </div>
      <p className="text-2xl font-bold tracking-tight" style={{ color: '#FAFAFA' }}>{value}</p>
      <p className="text-[11px] mt-1" style={{ color: '#52525B' }}>{sub}</p>
    </div>
  );
}
