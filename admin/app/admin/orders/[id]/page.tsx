"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAdminStore, Order, OrderStatus } from '@/lib/store';
import { ChevronLeft, Package, User, MapPin, CreditCard, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

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
  const { orders, fetchOrders } = useAdminStore();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (orders.length === 0) {
      fetchOrders();
    }
  }, [orders.length, fetchOrders]);

  useEffect(() => {
    const found = orders.find(o => o.id === id);
    if (found) setOrder(found);
  }, [id, orders]);

  if (!order) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p style={{ color: '#A1A1AA' }}>Loading full order details...</p>
      </div>
    );
  }

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
        <div className="flex items-center gap-4">
          <select 
            value={order.status}
            onChange={(e) => {
              const { updateOrderStatus } = useAdminStore.getState();
              updateOrderStatus(order.id, e.target.value as OrderStatus);
              fetchOrders();
            }}
            className="dark-input px-4 py-1.5 text-xs font-bold uppercase tracking-widest bg-black border"
            style={{ borderRadius: '20px', borderColor: 'rgba(212,175,55,0.3)', color: '#D4AF37' }}
          >
            {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
              <option key={s} value={s}>{s.toUpperCase()}</option>
            ))}
          </select>
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
                  
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex items-center justify-center bg-black/40" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                    {item.productImage ? (
                      <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover opacity-90" />
                    ) : (
                      <ImageIcon size={24} style={{ color: '#52525B' }} />
                    )}
                  </div>
                  
                  {/* Details */}
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
                <span style={{ color: '#FAFAFA' }}>₹{order.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#A1A1AA' }}>Shipping</span>
                <span style={{ color: '#FAFAFA' }}>Free</span>
              </div>
              
              <div className="flex justify-between mt-4 pt-4 border-t items-center" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <span className="font-semibold text-lg" style={{ color: '#FAFAFA' }}>Total</span>
                <span className="font-bold text-xl gold-text">₹{order.total.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between mt-2 pt-2 items-center">
                <span className="text-xs" style={{ color: '#71717A' }}>Payment ID / Method</span>
                <span className="text-xs font-mono uppercase px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: '#D4AF37' }}>
                  {order.paymentId || 'CASH ON DELIVERY'}
                </span>
              </div>
              
              {/* Shiprocket Status */}
              {(order as any).shipmentStatus && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${(order as any).shipmentStatus === 'synced' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: '#71717A' }}>
                      Shiprocket Sync
                    </span>
                  </div>
                  <p className="text-xs font-mono p-2 rounded bg-black/40 border border-white/5" style={{ color: (order as any).shipmentStatus === 'synced' ? '#FAFAFA' : '#EF4444' }}>
                    {(order as any).shipmentStatus}
                  </p>
                </div>
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
                <p style={{ color: '#D4AF37' }}>{order.email}</p>
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
              <h3 className="font-semibold" style={{ color: '#FAFAFA' }}>Shipping Details</h3>
            </div>
            
            <div className="space-y-2 text-sm" style={{ color: '#A1A1AA', lineHeight: 1.6 }}>
              <p className="font-medium" style={{ color: '#FAFAFA' }}>{order.customer}</p>
              <p>{order.address}</p>
              <p>{order.city}, {order.pincode}</p>
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
