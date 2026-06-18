"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAdminStore, Order, OrderStatus } from '@/lib/store';
import { Search, X, RefreshCw, Truck, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const STATUS_BADGE: Record<OrderStatus, string> = {
  pending: 'badge-pending', confirmed: 'badge-confirmed', processing: 'badge-confirmed',
  shipped: 'badge-shipped', delivered: 'badge-delivered', cancelled: 'badge-cancelled'
};
const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing',
  shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled'
};

const ALL_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const STATUS_TABS: (OrderStatus | 'all')[] = ['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

function ShipmentBadge({ status, awb }: { status?: string | null; awb?: string | null }) {
  if (!status) return null;
  const isOk = status === 'synced';
  const isFail = status === 'failed_sync' || status?.startsWith('error:');
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{
        background: isOk ? 'rgba(34,197,94,0.1)' : isFail ? 'rgba(239,68,68,0.1)' : 'rgba(251,191,36,0.1)',
        color: isOk ? '#22C55E' : isFail ? '#EF4444' : '#FBB024',
        border: `1px solid ${isOk ? 'rgba(34,197,94,0.2)' : isFail ? 'rgba(239,68,68,0.2)' : 'rgba(251,191,36,0.2)'}`,
      }}
      title={awb ? `AWB: ${awb}` : status}
    >
      <Truck size={9} />
      {isOk ? (awb ? `AWB: ${awb.slice(-6)}` : 'Synced') : isFail ? 'Sync Failed' : 'Pending'}
    </span>
  );
}

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const { updateOrderStatus, retryShipment } = useAdminStore();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [retrying, setRetrying] = useState(false);

  async function handleSave() {
    await updateOrderStatus(order.id, status);
    toast.success(`Order ${order.orderNumber} updated to ${STATUS_LABEL[status]}`);
    onClose();
  }

  async function handleRetryShipment() {
    setRetrying(true);
    const result = await retryShipment(order.id);
    setRetrying(false);
    if (result.success) {
      toast.success('Shadowfax sync successful!', { description: result.message });
    } else {
      toast.error('Sync failed', { description: result.message });
    }
  }

  const canRetry = order.shipmentStatus === 'failed_sync' || order.shipmentStatus?.startsWith('error:') || !order.shipmentStatus;

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
            <p className="text-xs mt-1" style={{ color: '#71717A' }}>{order.email} · {order.phone || 'No phone'}</p>
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
                    <p className="text-xs mt-0.5" style={{ color: '#52525B' }}>Qty: {item.quantity} × ₹{item.price.toLocaleString()}</p>
                  </div>
                  <p className="font-semibold text-sm" style={{ color: '#FAFAFA' }}>₹{(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals + Coupon */}
          <div className="p-4 rounded-xl space-y-2" style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)' }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: '#A1A1AA' }}>Order Total</span>
              <span className="font-bold gold-text text-base">₹{order.total.toLocaleString()}</span>
            </div>
            {order.couponCode && (
              <div className="flex justify-between text-xs">
                <span style={{ color: '#52525B' }}>Coupon: <span className="font-mono" style={{ color: '#D4AF37' }}>{order.couponCode}</span></span>
                <span style={{ color: '#22C55E' }}>-₹{order.discountAmount ?? 0}</span>
              </div>
            )}
            {order.paymentMethod && (
              <div className="flex justify-between text-xs">
                <span style={{ color: '#52525B' }}>Payment</span>
                <span className="uppercase font-mono text-xs" style={{ color: '#71717A' }}>{order.paymentMethod}</span>
              </div>
            )}
          </div>

          {/* Shipment status */}
          <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-wider font-medium" style={{ color: '#52525B' }}>Shadowfax / Courier Sync</p>
              {canRetry && (
                <button
                  onClick={handleRetryShipment}
                  disabled={retrying}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                  style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}
                >
                  {retrying ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                  {retrying ? 'Syncing…' : 'Retry Sync'}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${order.shipmentStatus === 'synced' ? 'bg-green-500' : order.shipmentStatus?.startsWith('error') || order.shipmentStatus === 'failed_sync' ? 'bg-red-500' : 'bg-yellow-500'}`} />
              <p className="text-xs font-mono" style={{ color: order.shipmentStatus === 'synced' ? '#22C55E' : '#EF4444' }}>
                {order.shipmentStatus || 'Not synced yet'}
              </p>
            </div>
            {order.awbCode && (
              <p className="text-xs mt-2 font-mono" style={{ color: '#71717A' }}>AWB: {order.awbCode}</p>
            )}
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

export default function OrdersPage() {
  const router = useRouter();
  const { orders, fetchOrders, isLoading, ordersError } = useAdminStore();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
    toast.success('Orders refreshed');
  }, [fetchOrders]);

  const filtered = orders.filter(o => {
    const matchStatus = activeTab === 'all' || o.status === activeTab;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.customer.toLowerCase().includes(q) ||
      o.email.toLowerCase().includes(q) ||
      (o.phone && o.phone.includes(q)) ||
      (o.couponCode && o.couponCode.toLowerCase().includes(q));
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
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#52525B' }} />
            <input
              className="dark-input pl-9 pr-3 py-2.5 text-sm w-64"
              placeholder="Search by order, customer, email, phone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading || refreshing}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#71717A', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <RefreshCw size={14} className={isLoading || refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {ordersError && (
        <div className="mb-5 flex items-start gap-3 p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertCircle size={16} style={{ color: '#EF4444', marginTop: 1, flexShrink: 0 }} />
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: '#EF4444' }}>Could not load orders</p>
            <p className="text-xs mt-0.5" style={{ color: '#A1A1AA' }}>{ordersError}</p>
          </div>
          <button onClick={handleRefresh} className="text-xs px-3 py-1 rounded-lg font-medium" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
            Try Again
          </button>
        </div>
      )}

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
            {tab === 'all' ? `All (${orders.length})` : STATUS_LABEL[tab as OrderStatus]}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {isLoading && orders.length === 0 && !ordersError && (
        <div className="glass-card p-12 flex flex-col items-center gap-4">
          <Loader2 size={24} className="animate-spin" style={{ color: '#D4AF37' }} />
          <p className="text-sm" style={{ color: '#52525B' }}>Loading orders…</p>
        </div>
      )}

      {/* Table */}
      {(!isLoading || orders.length > 0) && !ordersError && (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Order ID', 'Customer', 'Date', 'Total', 'Status', 'Courier', 'Items'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#3F3F46' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm" style={{ color: '#3F3F46' }}>
                  {search ? 'No orders match your search.' : 'No orders match this filter.'}
                </td></tr>
              )}
              {filtered.map(order => (
                <tr key={order.id} className="table-row-hover cursor-pointer" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                  onClick={() => setSelectedOrder(order)}>
                  <td className="px-5 py-4 font-mono text-xs">
                    <span className="gold-text hover:underline">{order.orderNumber}</span>
                    {order.couponCode && (
                      <div className="mt-1">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37' }}>
                          {order.couponCode}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-sm" style={{ color: '#FAFAFA' }}>{order.customer}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#A1A1AA' }}>{order.email}</p>
                    {order.phone && <p className="text-xs mt-0.5" style={{ color: '#52525B' }}>{order.phone}</p>}
                  </td>
                  <td className="px-5 py-4 text-xs" style={{ color: '#71717A' }}>
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="px-5 py-4 font-semibold text-sm" style={{ color: '#FAFAFA' }}>
                    ₹{order.total.toLocaleString()}
                    {order.discountAmount != null && order.discountAmount > 0 && (
                      <div className="text-[10px] font-normal" style={{ color: '#22C55E' }}>-₹{order.discountAmount}</div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[order.status]}`}>
                      {STATUS_LABEL[order.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <ShipmentBadge status={order.shipmentStatus} awb={order.awbCode} />
                  </td>
                  <td className="px-5 py-4 text-xs" style={{ color: '#A1A1AA' }}>
                    <div className="flex flex-col gap-1">
                      {order.items.map((item, idx) => (
                        <span key={idx} className="truncate max-w-[180px]" title={item.productName}>
                          <span className="font-semibold text-[10px] uppercase" style={{ color: '#D4AF37' }}>{item.quantity}x</span> {item.productName}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
