import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Package, Truck, CheckCircle2, ChevronLeft, LogOut, ExternalLink, RefreshCcw, AlertCircle } from 'lucide-react-native';
import { Image } from 'react-native';
import { COLLECTION_PRODUCTS } from './CollectionPage';
import { getApiBase } from './lib/apiBase';

const GOLD = '#C9A227';
const TEXT = '#1A1A1A';

export default function ProfilePage({ userEmail, onLogout, onBack }: { userEmail: string, onLogout: () => void, onBack: () => void }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
    handleCallback();
  }, []);

  const handleCallback = () => {
    if (Platform.OS !== 'web') return;
    const url = new URL(window.location.href);
    const status = url.searchParams.get('status');
    const orderId = url.searchParams.get('orderId');
    const error = url.searchParams.get('error');

    if (status === 'success') {
      alert(`Success! Order ${orderId} has been placed.`);
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (status === 'error' || status === 'failed') {
      alert(`Payment Error: ${error || 'Unknown error'}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const fetchOrders = async () => {
    try {
      const { supabaseClient } = require('./lib/supabaseClient');
      const { data: { session } } = await supabaseClient.auth.getSession();
      const token = session?.access_token || '';

      const API_URL = getApiBase();
      const res = await fetch(`${API_URL}/api/orders/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.orders) setOrders(data.orders);
    } catch(e) {
      console.error('Error fetching orders:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (Platform.OS === 'web') {
      if (!window.confirm('Are you sure you want to cancel this order?')) return;
    }
    
    setCancellingId(orderId);
    try {
      const { supabaseClient } = require('./lib/supabaseClient');
      const { data: { session } } = await supabaseClient.auth.getSession();
      const token = session?.access_token || '';

      const API_URL = getApiBase();
      const res = await fetch(`${API_URL}/api/orders/user/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderId })
      });
      const data = await res.json();
      
      if (data.success) {
        if (Platform.OS === 'web') alert('Order cancelled successfully.');
        fetchOrders();
      } else {
        if (Platform.OS === 'web') alert(data.error || 'Failed to cancel order');
      }
    } catch(e) {
      if (Platform.OS === 'web') alert('Network error while cancelling order');
    } finally {
      setCancellingId(null);
    }
  };

  const getProductImage = (productId: string) => {
    const product = COLLECTION_PRODUCTS.find(p => p.id === productId);
    return product ? product.image : null;
  };

  const getStatusIcon = (status: string) => {
    if (status === 'delivered') return <CheckCircle2 color="#3C7A3C" size={24} />;
    if (status === 'shipped') return <Truck color="#2A75D3" size={24} />;
    return <Package color={GOLD} size={24} />;
  };

  const getStatusColor = (status: string) => {
    if (status === 'delivered') return '#3C7A3C';
    if (status === 'shipped') return '#2A75D3';
    return GOLD;
  };

  return (
    <View style={s.root}>
      <LinearGradient colors={['#FDFBF7', '#FAF8F3']} style={StyleSheet.absoluteFill} />
      
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={s.backBtn}>
          <ChevronLeft color={TEXT} size={22} strokeWidth={1.8} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={onLogout} style={s.logoutBtn}>
          <LogOut color="rgba(26,26,26,0.6)" size={18} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        <View style={s.profileCard}>
          <LinearGradient colors={['#110C07', '#1A130B']} style={StyleSheet.absoluteFill} />
          <View style={s.avatar}>
            <Text style={s.avatarText}>{userEmail.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={s.emailText}>{userEmail}</Text>
          <Text style={s.memberText}>Daluxe Member</Text>
        </View>

        <Text style={s.sectionTitle}>Order History</Text>
        
        {loading ? (
          <ActivityIndicator color={GOLD} size="large" style={{ marginTop: 40 }} />
        ) : orders.length === 0 ? (
          <View style={s.emptyState}>
            <Package color="rgba(26,26,26,0.2)" size={48} />
            <Text style={s.emptyText}>You haven't placed any orders yet.</Text>
            <TouchableOpacity onPress={onBack}>
              <Text style={s.shopLink}>Start Shopping →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          orders.map((order, idx) => (
            <View key={order.id || idx} style={s.orderCard}>
              <View style={s.orderHeader}>
                <View>
                  <Text style={s.orderNumber}>{order.order_number}</Text>
                  <Text style={s.orderDate}>{new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                </View>
                <Text style={s.orderTotal}>₹{order.total_amount}</Text>
              </View>

              <View style={s.orderStatusBox}>
                {getStatusIcon(order.status)}
                <View style={{ flex: 1 }}>
                  <Text style={[s.statusText, { color: getStatusColor(order.status) }]}>{order.status.toUpperCase()}</Text>
                  {order.tracking_url ? (
                    <TouchableOpacity onPress={() => window.open(order.tracking_url, '_blank')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <Text style={s.trackingLink}>Track via Shiprocket</Text>
                      <ExternalLink size={12} color={GOLD} />
                    </TouchableOpacity>
                  ) : order.shiprocket_order_id ? (
                    <Text style={s.trackingSub}>Tracking pending allocation</Text>
                  ) : (
                    <Text style={s.trackingSub}>Order received & processing</Text>
                  )}
                </View>
              </View>

              {/* Order Items Section */}
              <View style={s.itemsSection}>
                {order.items && order.items.map((item: any, i: number) => (
                  <View key={item.id || i} style={s.itemRow}>
                    <View style={s.itemImageWrapper}>
                      <Image 
                        source={getProductImage(item.product_id)} 
                        style={s.itemImage} 
                        resizeMode="contain" 
                      />
                    </View>
                    <View style={s.itemInfo}>
                      <Text style={s.itemName} numberOfLines={1}>{item.name}</Text>
                      <Text style={s.itemMeta}>Qty: {item.quantity} · ₹{item.price}</Text>
                    </View>
                  </View>
                ))}
                {!order.items?.length && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 }}>
                    <AlertCircle size={14} color="rgba(0,0,0,0.3)" />
                    <Text style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)' }}>Standard Delivery Package</Text>
                  </View>
                )}
              </View>

              {/* Cancel Button */}
              {['pending', 'confirmed'].includes(order.status) && (
                <View style={{ marginTop: 16, borderTopWidth: 1, borderColor: 'rgba(0,0,0,0.05)', paddingTop: 16, alignItems: 'flex-end' }}>
                  <TouchableOpacity 
                    style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6, backgroundColor: '#FFF0F0', borderWidth: 1, borderColor: '#FFD6D6' }}
                    onPress={() => handleCancelOrder(order.id)}
                    disabled={cancellingId === order.id}
                  >
                    {cancellingId === order.id ? (
                      <ActivityIndicator size="small" color="#E53935" />
                    ) : (
                      <Text style={{ color: '#E53935', fontSize: 13, fontWeight: '600' }}>Cancel Order</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 52 : Platform.OS === 'web' ? 24 : 20,
    paddingBottom: 16, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
  },
  backBtn: { padding: 6 },
  logoutBtn: { padding: 6, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 20 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: TEXT, letterSpacing: 0.8 },
  
  profileCard: {
    padding: 30, borderRadius: 24, alignItems: 'center', overflow: 'hidden', marginBottom: 32,
    ...Platform.select({ web: { boxShadow: '0 10px 30px rgba(0,0,0,0.15)' } as any })
  },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(201,162,39,0.15)', borderWidth: 1, borderColor: 'rgba(201,162,39,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { fontSize: 24, fontWeight: '300', color: GOLD, ...Platform.select({ web: { fontFamily: 'Georgia, serif' } as any }) },
  emailText: { fontSize: 16, color: '#FFFFFF', fontWeight: '500', marginBottom: 6 },
  memberText: { fontSize: 11, color: GOLD, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600' },

  sectionTitle: { fontSize: 18, fontWeight: '300', color: TEXT, marginBottom: 16, letterSpacing: 1, ...Platform.select({ web: { fontFamily: 'Georgia, serif' } as any }) },
  
  orderCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', ...Platform.select({ web: { boxShadow: '0 4px 12px rgba(0,0,0,0.03)' } as any }) },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 16, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.06)', marginBottom: 16 },
  orderNumber: { fontSize: 14, fontWeight: '700', color: TEXT, marginBottom: 4 },
  orderDate: { fontSize: 12, color: 'rgba(26,26,26,0.5)' },
  orderTotal: { fontSize: 15, fontWeight: '800', color: TEXT },

  orderStatusBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(0,0,0,0.02)', padding: 14, borderRadius: 12 },
  statusText: { fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  trackingLink: { fontSize: 12, color: GOLD, fontWeight: '600', textDecorationLine: 'underline' },
  trackingSub: { fontSize: 11, color: 'rgba(26,26,26,0.5)', marginTop: 4 },

  itemsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  itemImageWrapper: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F7F7F7',
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT,
    marginBottom: 2,
  },
  itemMeta: {
    fontSize: 11,
    color: 'rgba(0,0,0,0.5)',
  },

  emptyState: { alignItems: 'center', paddingVertical: 60, opacity: 0.8 },
  emptyText: { marginTop: 16, fontSize: 14, color: 'rgba(26,26,26,0.5)', marginBottom: 12 },
  shopLink: { color: GOLD, fontSize: 13, fontWeight: '700', letterSpacing: 1 }
});
