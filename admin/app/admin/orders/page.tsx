"use client";

import { useState, useEffect } from 'react';
import { useAdminStore, Order, OrderStatus } from '@/lib/store';
import { Search, X, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

const STATUS_BADGE: Record<OrderStatus, string> = {
  pending: 'badge-pending', confirmed: 'badge-confirmed', processing: 'badge-confirmed',
  shipped: 'badge-shipped', delivered: 'badge-delivered', cancelled: 'badge-cancelled'
};
const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing',
  shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled'
};

const ALL_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const { updateOrderStatus } = useAdminStore();
  const [status, setStatus] = useState<OrderStatus>(order.status);

  function handleSave() {
    updateOrderStatus(order.id, status);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
      <div className="glass-card w-full max-w-xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.2)', background: '#111111' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h3 className="font-semibold text-base" style={{ color: '#FAFAFA' }}>Order {order.orderNumber}</h3>
            <p className="text-xs mt-0.5" style={{ color: '#52525B' }}>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <button onClick={onClose} className="ghost-btn p-2 rounded-lg"><X size={16} /></button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Customer CRM */}
          <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs uppercase tracking-wider mb-3 font-medium" style={{ color: '#52525B' }}>Customer Details</p>
            <p className="font-semibold text-sm" style={{ color: '#FAFAFA' }}>{order.customer}</p>
            <p className="text-xs mt-1" style={{ color: '#71717A' }}>{order.email} · {order.phone}</p>
            <p className="text-xs mt-1" style={{ color: '#71717A' }}>{order.address}, {order.city} — {order.pincode}</p>
          </div>

          {/* Items */}
          <div>
            <p className="text-xs uppercase tracking-wider mb-3 font-medium" style={{ color: '#52525B' }}>Order Items</p>
            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#FAFAFA' }}>{item.productName}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#52525B' }}>Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-sm" style={{ color: '#FAFAFA' }}>₹{(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)' }}>
            <div>
              <p className="text-xs" style={{ color: '#A1A1AA' }}>Order Total</p>
              <p className="text-xl font-bold gold-text">₹{order.total.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: '#52525B' }}>Payment ID</p>
              <p className="text-xs font-mono mt-0.5" style={{ color: '#71717A' }}>{order.paymentId}</p>
            </div>
          </div>

          {/* Status Update */}
          <div>
            <p className="text-xs uppercase tracking-wider mb-2 font-medium" style={{ color: '#52525B' }}>Update Status</p>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as OrderStatus)}
              className="dark-input w-full px-3 py-2.5 text-sm"
            >
              {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onClose} className="ghost-btn flex-1 py-2 text-sm rounded-lg">Cancel</button>
          <button onClick={handleSave} className="gold-btn flex-1 py-2 text-sm rounded-lg">Save Changes</button>
        </div>
      </div>
    </div>
  );
}

const STATUS_TABS: (OrderStatus | 'all')[] = ['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function OrdersPage() {
  const router = useRouter();
  const { orders, fetchOrders } = useAdminStore();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filtered = orders.filter(o => {
    const matchStatus = activeTab === 'all' || o.status === activeTab;
    const matchSearch = o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="flex-1 overflow-y-auto p-8">
      {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-light tracking-tight" style={{ color: '#FAFAFA' }}>Orders</h2>
          <p className="text-sm mt-1" style={{ color: '#52525B' }}>{orders.length} total orders</p>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#52525B' }} />
          <input className="dark-input pl-9 pr-3 py-2.5 text-sm w-60" placeholder="Search by order ID or customer…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {STATUS_TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="text-xs px-3 py-1.5 rounded-full capitalize transition-all"
            style={activeTab === tab
              ? { background: 'linear-gradient(135deg,#D4AF37,#F5D06F)', color: '#0B0B0B', fontWeight: 700 }
              : { background: 'rgba(255,255,255,0.04)', color: '#71717A', border: '1px solid rgba(255,255,255,0.06)' }
            }
          >
            {tab === 'all' ? `All (${orders.length})` : STATUS_LABEL[tab]}
          </button>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Order ID', 'Customer', 'Date', 'Total', 'Status', 'Items'].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#3F3F46' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-sm" style={{ color: '#3F3F46' }}>No orders match this filter</td></tr>
            )}
            {filtered.map(order => (
              <tr key={order.id} className="table-row-hover cursor-pointer" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                onClick={() => router.push(`/admin/orders/${order.id}`)}>
                <td className="px-5 py-4 font-mono text-xs">
                  <span className="gold-text hover:underline">{order.orderNumber}</span>
                </td>
                <td className="px-5 py-4">
                  <p className="font-medium text-sm" style={{ color: '#FAFAFA' }}>{order.customer}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#52525B' }}>{order.email}</p>
                </td>
                <td className="px-5 py-4 text-xs" style={{ color: '#71717A' }}>
                  {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </td>
                <td className="px-5 py-4 font-semibold text-sm" style={{ color: '#FAFAFA' }}>₹{order.total.toLocaleString()}</td>
                <td className="px-5 py-4">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[order.status]}`}>
                    {STATUS_LABEL[order.status]}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs" style={{ color: '#71717A' }}>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
