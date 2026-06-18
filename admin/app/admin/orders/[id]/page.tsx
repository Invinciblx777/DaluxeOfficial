"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAdminStore, Order, OrderStatus } from '@/lib/store';
import { ChevronLeft, Package, User, MapPin, CreditCard, Image as ImageIcon, RefreshCw, Loader2, Truck } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_BADGE: Record<OrderStatus, string> = {
  pending: 'badge-pending', confirmed: 'badge-confirmed', processing: 'badge-confirmed',
  shipped: 'badge-shipped', delivered: 'badge-delivered', cancelled: 'badge-cancelled'
};
const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing',
  shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled'
};

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // ✅ Hooks called unconditionally at top-level (not inside render)
  const { orders, fetchOrders, updateOrderStatus, retryShipment } = useAdminStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [saving, setSaving] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<OrderStatus | ''>('');

  useEffect(() => {
    if (orders.length === 0) {
      fetchOrders();
    }
  }, [orders.length, fetchOrders]);

  useEffect(() => {
    const found = orders.find(o => o.id === id);
    if (found) {
      setOrder(found);
      setCurrentStatus(found.status);
    }
  }, [id, orders]);

  async function handleSaveStatus() {
    if (!order || !currentStatus || currentStatus === order.status) return;
    setSaving(true);
    const ok = await updateOrderStatus(order.id, currentStatus as OrderStatus);
    setSaving(false);
    if (ok) {
      toast.success(`Status updated to ${STATUS_LABEL[currentStatus as OrderStatus]}`);
    } else {
      toast.error('Failed to update status — check your connection');
    }
  }

  async function handleRetryShipment() {
    if (!order) return;
    setRetrying(true);
    const result = await retryShipment(order.id);
    setRetrying(false);
    if (result.success) {
      toast.success('Shadowfax synced!', { description: result.message });
    } else {
      toast.error('Sync failed', { description: result.message });
    }
  }

  if (!order) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-4">
        <Loader2 size={24} className="animate-spin" style={{ color: '#D4AF37' }} />
        <p style={{ color: '#A1A1AA' }}>Loading order details…</p>
      </div>
    );
  }

  const shipmentOk = order.shipmentStatus === 'synced';
  const shipmentFailed = order.shipmentStatus === 'failed_sync' || order.shipmentStatus?.startsWith('error:');
  const canRetry = !shipmentOk || shipmentFailed;

  return (
    <div className="flex-1 overflow-y-auto p-8" style={{ background: '#0B0B0B' }}>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="ghost-btn p-2 rounded-lg"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <ChevronLeft size={18} style={{ color: '#D4AF37' }} />
          </button>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight" style={{ color: '#FAFAFA' }}>
              Order #{order.orderNumber}
            </h2>
            <p className="text-sm mt-1" style={{ color: '#71717A' }}>
              Placed on {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={currentStatus}
            onChange={(e) => setCurrentStatus(e.target.value as OrderStatus)}
            className="dark-input px-4 py-1.5 text-xs font-bold uppercase tracking-widest bg-black border"
            style={{ borderRadius: '20px', borderColor: 'rgba(212,175,55,0.3)', color: '#D4AF37' }}
          >
            {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
              <option key={s} value={s}>{s.toUpperCase()}</option>
            ))}
          </select>
          <button
            onClick={handleSaveStatus}
            disabled={saving || currentStatus === order.status}
            className="gold-btn px-4 py-1.5 text-xs font-bold tracking-widest rounded-full flex items-center gap-2"
            style={{ opacity: (saving || currentStatus === order.status) ? 0.5 : 1 }}
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : null}
            {saving ? 'Saving…' : 'Save'}
          </button>
          <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase border ${STATUS_BADGE[order.status]}`}>
            {STATUS_LABEL[order.status]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        
        {/* Left Column (Items + Payment) */}
        <div className="col-span-2 space-y-6">
          
          {/* Order Items */}
          <div className="glass-card p-6" style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 mb-6 border-b pb-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <Package size={18} style={{ color: '#D4AF37' }} />
              <h3 className="font-semibold" style={{ color: '#FAFAFA' }}>Order Items ({order.items.length})</h3>
            </div>
            
            <div className="space-y-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex items-center justify-center bg-black/40" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                    {item.productImage ? (
                      <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover opacity-90" />
                    ) : (
                      <ImageIcon size={24} style={{ color: '#52525B' }} />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-sm" style={{ color: '#FAFAFA' }}>{item.productName}</h4>
                      <p className="font-bold text-sm" style={{ color: '#FAFAFA' }}>₹{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                    {item.productDescription && (
                      <p className="text-xs mt-1 max-w-[80%]" style={{ color: '#A1A1AA', lineHeight: 1.4 }}>
                        {item.productDescription}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-3">
                      <span className="px-3 py-1 rounded-lg text-xs font-semibold tracking-wide" style={{ background: 'rgba(212,175,55,0.08)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.15)' }}>
                        Quantity: {item.quantity}
                      </span>
                      <span className="text-xs" style={{ color: '#52525B' }}>
                        ₹{item.price.toLocaleString()} per unit
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {order.items.length === 0 && (
                <p className="text-sm py-4 text-center" style={{ color: '#71717A' }}>No items found in this order.</p>
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div className="glass-card p-6" style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 mb-5 border-b pb-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <CreditCard size={18} style={{ color: '#D4AF37' }} />
              <h3 className="font-semibold" style={{ color: '#FAFAFA' }}>Payment Details</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span style={{ color: '#A1A1AA' }}>Subtotal</span>
                <span style={{ color: '#FAFAFA' }}>₹{(order.total + (order.discountAmount ?? 0)).toLocaleString()}</span>
              </div>
              {order.couponCode && (
                <div className="flex justify-between text-sm items-center">
                  <span style={{ color: '#A1A1AA' }}>
                    Coupon: <span className="font-mono px-1.5 py-0.5 rounded text-xs" style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37' }}>{order.couponCode}</span>
                  </span>
                  <span style={{ color: '#22C55E', fontWeight: 600 }}>-₹{(order.discountAmount ?? 0).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span style={{ color: '#A1A1AA' }}>Shipping</span>
                <span style={{ color: '#FAFAFA' }}>Free</span>
              </div>
              
              <div className="flex justify-between mt-4 pt-4 border-t items-center" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <span className="font-semibold text-lg" style={{ color: '#FAFAFA' }}>Total Charged</span>
                <span className="font-bold text-xl gold-text">₹{order.total.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between mt-2 pt-2 items-center">
                <span className="text-xs" style={{ color: '#71717A' }}>Payment Method</span>
                <span className="text-xs font-mono uppercase px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: '#D4AF37' }}>
                  {order.paymentMethod?.toUpperCase() || order.paymentId || 'CASH ON DELIVERY'}
                </span>
              </div>
              {order.paymentId && (
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: '#71717A' }}>Payment ID</span>
                  <span className="text-xs font-mono" style={{ color: '#52525B' }}>{order.paymentId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Courier / Shadowfax Status */}
          <div className="glass-card p-6" style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-5 border-b pb-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2">
                <Truck size={18} style={{ color: '#D4AF37' }} />
                <h3 className="font-semibold" style={{ color: '#FAFAFA' }}>Courier Sync (Shadowfax 360)</h3>
              </div>
              {canRetry && (
                <button
                  onClick={handleRetryShipment}
                  disabled={retrying}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                  style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}
                >
                  {retrying ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                  {retrying ? 'Syncing to Shadowfax…' : 'Retry Sync'}
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${shipmentOk ? 'bg-green-500' : shipmentFailed ? 'bg-red-500' : 'bg-yellow-500'}`} />
                <span className="text-sm font-medium" style={{ color: shipmentOk ? '#22C55E' : shipmentFailed ? '#EF4444' : '#FBB024' }}>
                  {shipmentOk ? 'Synced to Shadowfax' : shipmentFailed ? 'Sync Failed' : 'Not synced yet'}
                </span>
              </div>
              {order.shipmentStatus && (
                <p className="text-xs font-mono p-2 rounded bg-black/40 border border-white/5" style={{ color: '#A1A1AA' }}>
                  Status: {order.shipmentStatus}
                </p>
              )}
              {order.awbCode && (
                <div className="flex justify-between items-center p-3 rounded-lg" style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)' }}>
                  <span className="text-xs" style={{ color: '#A1A1AA' }}>AWB Number</span>
                  <span className="text-sm font-mono font-bold" style={{ color: '#D4AF37' }}>{order.awbCode}</span>
                </div>
              )}
              {!order.shipmentStatus && (
                <p className="text-xs" style={{ color: '#52525B' }}>
                  This order hasn't been synced to Shadowfax yet. Click "Retry Sync" to push it now.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Customer + Shipping) */}
        <div className="col-span-1 space-y-6">
          
          {/* Customer */}
          <div className="glass-card p-6" style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 mb-5 border-b pb-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <User size={18} style={{ color: '#D4AF37' }} />
              <h3 className="font-semibold" style={{ color: '#FAFAFA' }}>Customer</h3>
            </div>
            
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-[10px] uppercase font-semibold tracking-wider mb-1" style={{ color: '#71717A' }}>Name</p>
                <p style={{ color: '#FAFAFA' }}>{order.customer}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold tracking-wider mb-1" style={{ color: '#71717A' }}>Email</p>
                <p style={{ color: '#D4AF37' }}>{order.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold tracking-wider mb-1" style={{ color: '#71717A' }}>Phone</p>
                <p style={{ color: '#FAFAFA' }}>{order.phone || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Shipping */}
          <div className="glass-card p-6" style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 mb-5 border-b pb-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <MapPin size={18} style={{ color: '#D4AF37' }} />
              <h3 className="font-semibold" style={{ color: '#FAFAFA' }}>Shipping Address</h3>
            </div>
            
            <div className="space-y-2 text-sm" style={{ color: '#A1A1AA', lineHeight: 1.6 }}>
              <p className="font-medium" style={{ color: '#FAFAFA' }}>{order.customer}</p>
              <p>{order.address}</p>
              <p>{order.city}{order.state ? `, ${order.state}` : ''} — {order.pincode}</p>
              <p className="mt-2 pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                Phone: {order.phone || 'N/A'}
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
