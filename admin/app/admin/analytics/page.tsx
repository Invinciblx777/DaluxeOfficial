"use client";

import {
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid
} from 'recharts';
import { useAdminStore } from '@/lib/store';
import { useMemo, useEffect } from 'react';

const monthlyRevenue = [
  { m: 'Nov', rev: 48000 }, { m: 'Dec', rev: 72000 }, { m: 'Jan', rev: 55000 },
  { m: 'Feb', rev: 88000 }, { m: 'Mar', rev: 94000 }, { m: 'Apr', rev: 110000 }
];

const GOLD_GRADIENT_COLORS = ['#D4AF37', '#E8C547', '#F5D06F', '#B8962E', '#A07820'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card px-3 py-2 text-xs" style={{ border: '1px solid rgba(212,175,55,0.2)' }}>
        <p style={{ color: '#A1A1AA' }}>{label}</p>
        <p style={{ color: '#F5D06F', fontWeight: 700 }}>₹{payload[0].value?.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const { products, orders, fetchProducts, fetchOrders } = useAdminStore();

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, [fetchProducts, fetchOrders]);

  const { totalRevenue, avgOrderValue, conversionPlaceholder, topProducts, categoryData } = useMemo(() => {
    const validOrders = orders.filter(o => o.status !== 'cancelled');
    const totalRevenue = validOrders.reduce((s, o) => s + o.total, 0);
    const avgOrderValue = validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;

    // Top products by units sold (from order items)
    const productSales: Record<string, { name: string; units: number; revenue: number }> = {};
    orders.forEach(o => {
      o.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.productName, units: 0, revenue: 0 };
        }
        productSales[item.productId].units += item.quantity;
        productSales[item.productId].revenue += item.price * item.quantity;
      });
    });
    const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Category breakdown
    const catMap: Record<string, number> = {};
    products.forEach(p => { catMap[p.category] = (catMap[p.category] || 0) + 1; });
    const categoryData = Object.entries(catMap).map(([name, value]) => ({ name, value }));

    return { totalRevenue, avgOrderValue, conversionPlaceholder: '3.4%', topProducts, categoryData };
  }, [products, orders]);

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-light tracking-tight" style={{ color: '#FAFAFA' }}>Analytics</h2>
        <p className="text-sm mt-1" style={{ color: '#52525B' }}>Performance overview and revenue insights</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="glass-card p-5">
          <p className="text-xs uppercase tracking-wider font-medium mb-3" style={{ color: '#52525B' }}>Total Revenue</p>
          <p className="text-3xl font-bold gold-text">₹{totalRevenue.toLocaleString()}</p>
          <p className="text-xs mt-1" style={{ color: '#3F3F46' }}>from all active & completed orders</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs uppercase tracking-wider font-medium mb-3" style={{ color: '#52525B' }}>Avg. Order Value</p>
          <p className="text-3xl font-bold" style={{ color: '#FAFAFA' }}>₹{avgOrderValue.toLocaleString()}</p>
          <p className="text-xs mt-1" style={{ color: '#3F3F46' }}>per active & completed order</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs uppercase tracking-wider font-medium mb-3" style={{ color: '#52525B' }}>Conversion Rate</p>
          <p className="text-3xl font-bold" style={{ color: '#A78BFA' }}>{conversionPlaceholder}</p>
          <p className="text-xs mt-1" style={{ color: '#3F3F46' }}>connect backend for live data</p>
        </div>
      </div>

      {/* Revenue Trend */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: '#FAFAFA' }}>Monthly Revenue Trend</h3>
            <p className="text-xs mt-0.5" style={{ color: '#52525B' }}>Last 6 months</p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37' }}>+17% MoM</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={monthlyRevenue}>
            <defs>
              <linearGradient id="analyticsRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fill: '#3F3F46', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="rev" stroke="#D4AF37" strokeWidth={2} fill="url(#analyticsRev)" dot={false} activeDot={{ r: 4, fill: '#D4AF37' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold mb-5" style={{ color: '#FAFAFA' }}>Top Products by Revenue</h3>
          {topProducts.length > 0 ? (
            <div className="space-y-4">
              {topProducts.map((p, i) => (
                <div key={p.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium" style={{ color: '#A1A1AA' }}>{p.name}</span>
                    <span className="text-xs font-semibold" style={{ color: '#FAFAFA' }}>₹{p.revenue.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-1.5 rounded-full" style={{ background: `linear-gradient(90deg, #D4AF37, #F5D06F)`, width: `${Math.min(100, (p.revenue / topProducts[0].revenue) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-36">
              <p className="text-xs text-center" style={{ color: '#3F3F46' }}>No sales data yet.<br />Connect backend to load real data.</p>
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold mb-5" style={{ color: '#FAFAFA' }}>Products by Category</h3>
          {categoryData.length > 0 ? (
            <div className="flex items-center gap-4">
              <PieChart width={120} height={120}>
                <Pie data={categoryData} cx={55} cy={55} innerRadius={30} outerRadius={55} paddingAngle={3} dataKey="value">
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={GOLD_GRADIENT_COLORS[index % GOLD_GRADIENT_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
              <div className="space-y-2">
                {categoryData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: GOLD_GRADIENT_COLORS[i % GOLD_GRADIENT_COLORS.length] }} />
                    <span className="text-xs" style={{ color: '#A1A1AA' }}>{d.name}</span>
                    <span className="text-xs ml-auto font-medium" style={{ color: '#FAFAFA' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs" style={{ color: '#3F3F46' }}>No data</p>
          )}
        </div>
      </div>
    </div>
  );
}
