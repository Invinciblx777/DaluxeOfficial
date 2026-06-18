'use client';

import React, { useEffect, useMemo } from 'react';
import { useAdminStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Ticket, TrendingDown, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

// All supported coupons with their discount type for display
const COUPON_CONFIG: Record<string, { label: string; type: 'flat' | 'percent'; value: number }> = {
  'SUMPI20':   { label: 'SUMPI20',   type: 'flat',    value: 20 },
  'RASHMI20':  { label: 'RASHMI20',  type: 'flat',    value: 20 },
  'DIKSHA20':  { label: 'DIKSHA20',  type: 'flat',    value: 20 },
  'PINKY20':   { label: 'PINKY20',   type: 'flat',    value: 20 },
  'DALUXE10':  { label: 'DALUXE10',  type: 'percent', value: 10 },
};

function CouponCard({ code, count, totalDiscount, config }: {
  code: string;
  count: number;
  totalDiscount: number;
  config: { label: string; type: 'flat' | 'percent'; value: number };
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium font-mono">{code}</CardTitle>
        <Ticket className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{count} {count === 1 ? 'use' : 'uses'}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {config.type === 'percent'
            ? `${config.value}% off per order`
            : `Flat ₹${config.value} off per order`
          }
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Total saved: <span className="text-green-500 font-semibold">₹{totalDiscount.toLocaleString('en-IN')}</span>
        </p>
      </CardContent>
    </Card>
  );
}

export default function CouponsPage() {
  const { orders, fetchOrders, isLoading, ordersError } = useAdminStore();

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Aggregate per-coupon usage stats from actual orders
  const couponStats = useMemo(() => {
    const stats: Record<string, { count: number; totalDiscount: number }> = {};

    // Initialise all known coupons at zero so they always show
    for (const code of Object.keys(COUPON_CONFIG)) {
      stats[code] = { count: 0, totalDiscount: 0 };
    }

    orders.forEach(order => {
      const code = order.couponCode?.toUpperCase()?.trim();
      if (!code) return;

      // If it's a known coupon, use the stored discount_amount (most accurate)
      if (stats[code] !== undefined) {
        stats[code].count += 1;
        // Use the actual stored discount — never guess. Fall back to config value only if missing.
        const disc = order.discountAmount != null && order.discountAmount > 0
          ? order.discountAmount
          : COUPON_CONFIG[code]?.value ?? 0;
        stats[code].totalDiscount += disc;
      } else {
        // Unknown coupon — still track it
        stats[code] = {
          count: (stats[code]?.count ?? 0) + 1,
          totalDiscount: (stats[code]?.totalDiscount ?? 0) + (order.discountAmount ?? 0),
        };
      }
    });

    return stats;
  }, [orders]);

  // Build the per-order usage list (all orders that had ANY coupon)
  const couponUsages = useMemo(() => {
    return orders
      .filter(o => o.couponCode)
      .map(o => ({
        id: o.id,
        customerName: o.customer,
        email: o.email,
        phone: o.phone,
        couponCode: o.couponCode?.toUpperCase()?.trim() ?? '',
        discountAmount: o.discountAmount ?? 0,
        date: new Date(o.createdAt),
        orderNumber: o.orderNumber,
        orderTotal: o.total,
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [orders]);

  const totalCouponOrders = couponUsages.length;
  const totalDiscountGiven = couponUsages.reduce((s, u) => s + u.discountAmount, 0);

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex h-full items-center justify-center gap-3 flex-col">
        <Loader2 className="animate-spin h-6 w-6" style={{ color: '#D4AF37' }} />
        <p className="text-sm text-muted-foreground">Loading coupon data…</p>
      </div>
    );
  }

  if (ordersError) {
    return (
      <div className="flex h-full items-center justify-center flex-col gap-4">
        <p className="text-sm text-red-400">{ordersError}</p>
        <button
          onClick={() => fetchOrders()}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg"
          style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Coupons</h2>
          <p className="text-muted-foreground">Monitor promo code usage and discounts applied by customers.</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-semibold" style={{ color: '#D4AF37' }}>{totalCouponOrders} coupon orders</p>
          <p className="text-muted-foreground text-xs">₹{totalDiscountGiven.toLocaleString('en-IN')} total discounts given</p>
        </div>
      </div>

      {/* Per-coupon stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Object.entries(COUPON_CONFIG).map(([code, config]) => (
          <CouponCard
            key={code}
            code={code}
            count={couponStats[code]?.count ?? 0}
            totalDiscount={couponStats[code]?.totalDiscount ?? 0}
            config={config}
          />
        ))}
      </div>

      {/* Unknown coupons (if any appeared outside the known list) */}
      {Object.entries(couponStats)
        .filter(([code]) => !COUPON_CONFIG[code])
        .map(([code, data]) => (
          <Card key={code} style={{ borderColor: 'rgba(212,175,55,0.3)' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-mono">{code} <span className="text-xs text-muted-foreground font-normal">(unrecognised)</span></CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.count} uses</div>
              <p className="text-xs text-muted-foreground">Total discount: ₹{data.totalDiscount}</p>
            </CardContent>
          </Card>
        ))
      }

      {/* Detailed usage table */}
      <Card>
        <CardHeader>
          <CardTitle>Coupon Usage History</CardTitle>
          <CardDescription>All orders where a promo code was applied, newest first.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Coupon</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Order Total</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {couponUsages.length > 0 ? (
                couponUsages.map((usage) => (
                  <TableRow key={usage.id}>
                    <TableCell>
                      <div className="font-medium">{usage.customerName}</div>
                      <div className="text-sm text-muted-foreground">{usage.phone || usage.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">{usage.couponCode}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-mono">{usage.orderNumber}</div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">₹{usage.orderTotal.toLocaleString('en-IN')}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-green-600 font-semibold">-₹{usage.discountAmount.toLocaleString('en-IN')}</span>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {dateFormatter.format(usage.date)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    {orders.length === 0
                      ? 'No orders loaded yet — check the Orders page for connection issues.'
                      : 'No coupons have been used yet.'
                    }
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
