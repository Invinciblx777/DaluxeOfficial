'use client';

import React, { useEffect, useMemo } from 'react';
import { useAdminStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Ticket, Users, TrendingDown } from 'lucide-react';

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});
export default function CouponsPage() {
  const { orders, fetchOrders, isLoading } = useAdminStore();

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const couponStats = useMemo(() => {
    const stats: Record<string, { count: number; totalDiscount: number }> = {
      'SUMPI20': { count: 0, totalDiscount: 0 },
      'RASHMI20': { count: 0, totalDiscount: 0 },
      'DIKSHA20': { count: 0, totalDiscount: 0 },
      'PINKY20': { count: 0, totalDiscount: 0 },
    };

    orders.forEach(order => {
      const code = order.couponCode?.toUpperCase();
      if (code && stats[code] !== undefined) {
        stats[code].count += 1;
        stats[code].totalDiscount += (order.discountAmount || 20);
      }
    });

    return stats;
  }, [orders]);

  const couponUsages = useMemo(() => {
    return orders
      .filter(o => o.couponCode)
      .map(o => ({
        id: o.id,
        customerName: o.customer,
        email: o.email,
        phone: o.phone,
        couponCode: o.couponCode?.toUpperCase(),
        discountAmount: o.discountAmount || 20,
        date: new Date(o.createdAt),
        orderNumber: o.orderNumber,
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [orders]);

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Coupons</h2>
        <p className="text-muted-foreground">Monitor coupon usage and discounts applied by customers.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(couponStats).map(([code, data]) => (
          <Card key={code}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{code}</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.count} uses</div>
              <p className="text-xs text-muted-foreground">
                Total discount: ₹{data.totalDiscount}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Coupon Usages</CardTitle>
          <CardDescription>A detailed list of all customers who applied a coupon to their order.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Coupon</TableHead>
                <TableHead>Order</TableHead>
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
                      <div className="text-sm">{usage.orderNumber}</div>
                    </TableCell>
                    <TableCell>
                      <span className="text-green-600 font-medium">-₹{usage.discountAmount}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      {dateFormatter.format(usage.date)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    No coupons have been used yet.
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
