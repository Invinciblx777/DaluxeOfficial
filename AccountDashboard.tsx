import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Platform, Dimensions, Animated, ActivityIndicator, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  User, Package, Microscope, Phone, MessageSquare, Truck, LogOut,
  ChevronRight, ChevronLeft, Edit3, Save, X, CheckCircle2,
  MapPin, Mail, Clock, Send, AlertCircle, Search,
} from 'lucide-react-native';
import { supabaseClient } from './lib/supabaseClient';

// ─── Light Design Tokens (matches homepage palette) ────────────────────────
const GOLD       = '#C9A227';
const GOLD_DARK  = '#A07820';
const BG         = '#FDFBF7';        // homepage cream background
const BG2        = '#F8F6F0';        // section alternate
const CARD       = '#FFFFFF';
const BORDER     = 'rgba(201,162,39,0.18)';
const BORDER_LT  = 'rgba(0,0,0,0.07)';
const TEXT       = '#1A1A1A';
const TEXT_MUTED = 'rgba(26,26,26,0.45)';
const SIDEBAR_BG = '#FDFBF7';
const SERIF: any = Platform.select({ web: '"Playfair Display", Georgia, serif', default: undefined });

const isMobileDevice = () => Dimensions.get('window').width < 768;

// Status configs and mock orders removed — using real API data

const MENU = [
  { key: 'profile', label: 'Profile',         Icon: User },
  { key: 'orders',  label: 'Orders',           Icon: Package },
  { key: 'track',   label: 'Track Orders',     Icon: Truck },
  { key: 'skin',    label: 'Skin Assessment',  Icon: Microscope },
  { key: 'contact', label: 'Contact Us',       Icon: Phone },
] as const;
type MenuKey = typeof MENU[number]['key'];

const statusConfig: Record<string, { color: string; label: string; bg: string; border: string }> = {
  delivered: { color: '#2D7A2D', label: 'DELIVERED',  bg: 'rgba(45,122,45,0.08)',  border: 'rgba(45,122,45,0.2)'  },
  shipped:   { color: '#1A65C0', label: 'SHIPPED',    bg: 'rgba(26,101,192,0.08)', border: 'rgba(26,101,192,0.2)' },
  pending:   { color: GOLD_DARK, label: 'PROCESSING', bg: 'rgba(201,162,39,0.1)',  border: BORDER },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Shimmer Skeleton ─────────────────────────────────────────────────────────
const Skeleton = ({ width: w = '100%', height: h = 16, style = {} }: any) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
    ])).start();
  }, []);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.06, 0.18] });
  return <Animated.View style={[{ width: w, height: h, borderRadius: 8, backgroundColor: GOLD, opacity }, style]} />;
};

// ─── Gold Button ──────────────────────────────────────────────────────────────
const GoldButton = ({ label, onPress, icon: Icon, outline = false, small = false }: any) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
    {outline ? (
      <View style={[btn.base, btn.outline, small && btn.small]}>
        {Icon && <Icon size={14} color={GOLD_DARK} />}
        <Text style={[btn.txt, { color: GOLD_DARK }]}>{label}</Text>
      </View>
    ) : (
      <LinearGradient colors={['#D4AF37', '#F0CC5E', '#C9A227']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[btn.base, small && btn.small]}>
        {Icon && <Icon size={14} color="#1A1A1A" />}
        <Text style={btn.txt}>{label}</Text>
      </LinearGradient>
    )}
  </TouchableOpacity>
);
const btn = StyleSheet.create({
  base:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 13, paddingHorizontal: 26, borderRadius: 30 },
  small:   { paddingVertical: 8, paddingHorizontal: 16 },
  outline: { borderWidth: 1.5, borderColor: BORDER },
  txt:     { color: '#1A1A1A', fontWeight: '700', fontSize: 13, letterSpacing: 0.8 },
});

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ visible, message }: { visible: boolean; message: string }) => {
  const op = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) Animated.sequence([
      Animated.timing(op, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(op, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [visible]);
  return (
    <Animated.View style={[toastS.wrap, { opacity: op }]} pointerEvents="none">
      <CheckCircle2 color={GOLD_DARK} size={16} />
      <Text style={toastS.text}>{message}</Text>
    </Animated.View>
  );
};
const toastS = StyleSheet.create({
  wrap: {
    position: 'absolute', bottom: 40, alignSelf: 'center', zIndex: 999,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: CARD, paddingVertical: 13, paddingHorizontal: 24,
    borderRadius: 30, borderWidth: 1, borderColor: BORDER,
    ...Platform.select({ web: { boxShadow: '0 4px 20px rgba(0,0,0,0.10)' } as any }),
  },
  text: { color: TEXT, fontSize: 13, fontWeight: '600' },
});

// ─── Gold Input ───────────────────────────────────────────────────────────────
const GoldInput = ({ label, value, onChangeText, editable = true, multiline = false, keyboardType = 'default' }: any) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={inp.wrap}>
      <Text style={inp.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        multiline={multiline}
        keyboardType={keyboardType}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          inp.field,
          focused && inp.focused,
          !editable && inp.disabled,
          multiline && { height: 100, textAlignVertical: 'top' },
        ]}
        placeholderTextColor={TEXT_MUTED}
      />
    </View>
  );
};
const inp = StyleSheet.create({
  wrap:    { marginBottom: 16 },
  label:   { fontSize: 10, color: GOLD_DARK, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '700', marginBottom: 8 },
  field: {
    backgroundColor: BG2, borderWidth: 1.5, borderColor: BORDER_LT,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13,
    color: TEXT, fontSize: 14,
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  },
  focused:  { borderColor: GOLD, ...Platform.select({ web: { boxShadow: '0 0 0 3px rgba(201,162,39,0.14)' } as any }) },
  disabled: { opacity: 0.55 },
});

// ─── Card wrapper ─────────────────────────────────────────────────────────────
const Card = ({ children, style = {} }: any) => (
  <View style={[sec.card, style]}>{children}</View>
);

// ─── Section shared styles ────────────────────────────────────────────────────
const sec = StyleSheet.create({
  pageTitle: {
    fontSize: 26, fontWeight: '600', color: TEXT, marginBottom: 20,
    ...Platform.select({ web: { fontFamily: SERIF } as any }),
  },
  card: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER_LT,
    borderRadius: 20, padding: 24, marginBottom: 16,
    ...Platform.select({ web: { boxShadow: '0 2px 16px rgba(0,0,0,0.06)' } as any }),
  },
  cardTitle: {
    fontSize: 10, color: GOLD_DARK, letterSpacing: 2.5, textTransform: 'uppercase',
    fontWeight: '700', marginBottom: 20,
  },
  emptyState: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyTitle: { fontSize: 18, color: TEXT, fontWeight: '600' },
  emptyText:  { fontSize: 13, color: TEXT_MUTED },
});

// ─── PROFILE ──────────────────────────────────────────────────────────────────
const ProfileSection = ({ userEmail }: { userEmail: string }) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '', state: '', pincode: '' });

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) return;
        console.log('[Profile] Fetching profile for user:', userId);
        const { data, error } = await supabaseClient.from('profiles').select('*').eq('id', userId).single();
        if (error) console.error('[Profile] Fetch error:', error.message);
        if (data) setForm({ name: data.name || data.full_name || '', phone: data.phone || '', address: data.address || '', city: data.city || '', state: data.state || '', pincode: data.pincode || '' });
      } catch (e) { console.error('[Profile] Unexpected error:', e); }
    })();
  }, [userEmail]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) { setSaving(false); return; }
      console.log('[Profile] Saving profile for user:', userId, form);
      const { error } = await supabaseClient.from('profiles').upsert({
        id: userId,
        email: userEmail,
        name: form.name,
        phone: form.phone,
        address: form.address,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
      if (error) console.error('[Profile] Save error:', error.message);
    } catch (e) { console.error('[Profile] Save failed:', e); }
    setSaving(false); setEditing(false); setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const initials = (form.name || userEmail).charAt(0).toUpperCase();

  return (
    <View style={{ flex: 1 }}>
      {/* Hero */}
      <View style={pf.hero}>
        <LinearGradient colors={[GOLD, '#F0CC5E']} style={pf.avatar}>
          <Text style={pf.avatarText}>{initials}</Text>
        </LinearGradient>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={pf.name}>{form.name || 'Daluxe Member'}</Text>
          <Text style={pf.email}>{userEmail}</Text>
          <View style={pf.badge}><Text style={pf.badgeText}>✦  DALUXE MEMBER</Text></View>
        </View>
        {!editing && <GoldButton label="Edit" onPress={() => setEditing(true)} icon={Edit3} outline small />}
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
        <Card>
          <Text style={sec.cardTitle}>Personal Details</Text>
          <GoldInput label="Full Name" value={form.name} onChangeText={(v: string) => setForm(f => ({ ...f, name: v }))} editable={editing} />
          <GoldInput label="Email" value={userEmail} editable={false} />
          <GoldInput label="Phone Number" value={form.phone} onChangeText={(v: string) => setForm(f => ({ ...f, phone: v }))} editable={editing} keyboardType="phone-pad" />
        </Card>

        <Card>
          <Text style={sec.cardTitle}>Shipping Address</Text>
          <GoldInput label="Street Address" value={form.address} onChangeText={(v: string) => setForm(f => ({ ...f, address: v }))} editable={editing} multiline />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}><GoldInput label="City" value={form.city} onChangeText={(v: string) => setForm(f => ({ ...f, city: v }))} editable={editing} /></View>
            <View style={{ flex: 1 }}><GoldInput label="State" value={form.state} onChangeText={(v: string) => setForm(f => ({ ...f, state: v }))} editable={editing} /></View>
          </View>
          <GoldInput label="Pincode" value={form.pincode} onChangeText={(v: string) => setForm(f => ({ ...f, pincode: v }))} editable={editing} keyboardType="numeric" />
        </Card>

        {editing && (
          <View style={{ flexDirection: 'row', gap: 12, paddingBottom: 8 }}>
            <GoldButton label={saving ? 'Saving…' : 'Save Changes'} onPress={handleSave} icon={Save} />
            <GoldButton label="Cancel" onPress={() => setEditing(false)} outline />
          </View>
        )}
      </ScrollView>
      <Toast visible={showToast} message="Profile updated successfully" />
    </View>
  );
};
const pf = StyleSheet.create({
  hero: {
    flexDirection: 'row', alignItems: 'center', gap: 18,
    padding: 24, borderBottomWidth: 1, borderColor: BORDER_LT,
    backgroundColor: BG,
  },
  avatar: {
    width: 68, height: 68, borderRadius: 34,
    justifyContent: 'center', alignItems: 'center',
    ...Platform.select({ web: { boxShadow: '0 4px 18px rgba(201,162,39,0.30)' } as any }),
  },
  avatarText: { fontSize: 26, fontWeight: '700', color: '#1A1A1A', fontFamily: SERIF },
  name:   { fontSize: 20, fontWeight: '600', color: TEXT, fontFamily: SERIF },
  email:  { fontSize: 13, color: TEXT_MUTED },
  badge:  { alignSelf: 'flex-start', backgroundColor: 'rgba(201,162,39,0.1)', borderWidth: 1, borderColor: BORDER, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginTop: 4 },
  badgeText: { color: GOLD_DARK, fontSize: 9, fontWeight: '700', letterSpacing: 2 },
});

// ─── ORDER DETAIL ─────────────────────────────────────────────────────────────
const OrderDetail = ({ order, onBack, onTrack }: any) => {
  const st = statusConfig[order.status] || statusConfig.pending;
  const timeline = [
    { label: 'Order Placed',    done: true,                                            date: formatDate(order.created_at) },
    { label: 'Packed',          done: order.status !== 'pending',                      date: '' },
    { label: 'Shipped',         done: ['shipped','delivered'].includes(order.status),  date: '' },
    { label: 'Out for Delivery',done: order.status === 'delivered',                    date: '' },
    { label: 'Delivered',       done: order.status === 'delivered',                    date: order.status === 'delivered' ? formatDate(order.expected_delivery) : '' },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <TouchableOpacity onPress={onBack} style={{ padding: 8, borderRadius: 20, backgroundColor: BG2, borderWidth: 1, borderColor: BORDER_LT }}>
          <ChevronLeft color={GOLD_DARK} size={18} />
        </TouchableOpacity>
        <Text style={sec.pageTitle}>Order Details</Text>
      </View>

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: st.color }} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: st.color, fontWeight: '700', fontSize: 13, letterSpacing: 1 }}>{st.label}</Text>
          <Text style={{ color: TEXT_MUTED, fontSize: 12, marginTop: 2 }}>
            {order.expected_delivery ? `Expected by ${formatDate(order.expected_delivery)}` : 'Processing your order'}
          </Text>
        </View>
        {(order.tracking_id || order.shiprocket_order_id) && (
          <GoldButton label="Track" onPress={onTrack} icon={Truck} small />
        )}
      </Card>

      <Card>
        <Text style={sec.cardTitle}>Items in this Order</Text>
        {(order.products || []).map((p: any, i: number) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16, paddingBottom: 16, borderBottomWidth: i < order.products.length - 1 ? 1 : 0, borderColor: BORDER_LT }}>
            {(p.image || p.imageUrl) ? (
              <Image source={p.image ? p.image : { uri: p.imageUrl }} style={{ width: 52, height: 52, borderRadius: 10, backgroundColor: BG2 }} resizeMode="contain" />
            ) : (
              <View style={{ width: 52, height: 52, borderRadius: 10, backgroundColor: BG2, justifyContent: 'center', alignItems: 'center' }}>
                <Package color={GOLD} size={20} strokeWidth={1} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ color: TEXT, fontWeight: '600', fontSize: 14 }}>{p.name}</Text>
              <Text style={{ color: TEXT_MUTED, fontSize: 12, marginTop: 2 }}>Qty: {p.qty}</Text>
            </View>
            <Text style={{ color: GOLD_DARK, fontWeight: '700', fontSize: 14 }}>₹{p.price}</Text>
          </View>
        ))}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8 }}>
          <Text style={{ color: TEXT_MUTED, fontSize: 13 }}>Total</Text>
          <Text style={{ color: TEXT, fontWeight: '800', fontSize: 16 }}>₹{order.total_amount}</Text>
        </View>
      </Card>

      <Card style={{ gap: 14 }}>
        <Text style={sec.cardTitle}>Shipping & Payment</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <MapPin color={GOLD_DARK} size={14} strokeWidth={1.5} />
          <Text style={{ color: TEXT_MUTED, fontSize: 13, flex: 1 }}>{order.address || 'Address not available'}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <CheckCircle2 color="#2D7A2D" size={14} strokeWidth={1.5} />
          <Text style={{ color: TEXT_MUTED, fontSize: 13 }}>Payment: {order.payment_status || 'Paid'}</Text>
        </View>
      </Card>

      <Card>
        <Text style={sec.cardTitle}>Order Timeline</Text>
        {timeline.map((step, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 16, marginBottom: i < timeline.length - 1 ? 22 : 0 }}>
            <View style={{ alignItems: 'center' }}>
              <View style={[tl.dot, step.done && tl.dotDone]} />
              {i < timeline.length - 1 && <View style={[tl.line, step.done && tl.lineDone]} />}
            </View>
            <View style={{ flex: 1, paddingBottom: 4 }}>
              <Text style={[tl.label, step.done && tl.labelDone]}>{step.label}</Text>
              {step.date ? <Text style={tl.date}>{step.date}</Text> : null}
            </View>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
};
const tl = StyleSheet.create({
  dot:       { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: BORDER_LT, backgroundColor: 'transparent' },
  dotDone:   { borderColor: GOLD, backgroundColor: GOLD },
  line:      { width: 2, flex: 1, backgroundColor: BORDER_LT, marginTop: 4 },
  lineDone:  { backgroundColor: GOLD },
  label:     { fontSize: 13, color: TEXT_MUTED, fontWeight: '500' },
  labelDone: { color: TEXT, fontWeight: '600' },
  date:      { fontSize: 11, color: TEXT_MUTED, marginTop: 2 },
});

// ─── ORDERS ───────────────────────────────────────────────────────────────────
const OrdersSection = ({ userEmail, onTrackOrder }: { userEmail: string; onTrackOrder: (id: string) => void }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) { setOrders([]); setLoading(false); return; }

        // Query Supabase directly by user_id — avoids broken API proxy URL in production
        const { data: rawOrders, error } = await supabaseClient
          .from('orders')
          .select('*, order_items(id, product_id, name, quantity, price)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) { console.error('[Orders] Supabase error:', error.message); setOrders([]); setLoading(false); return; }

        const transformed = (rawOrders || []).map((order: any) => {
          const products = (order.order_items || []).map((item: any) => ({
            name: item.name || 'Product',
            qty: item.quantity || item.qty || 1,
            price: item.price,
            image: null,
            imageUrl: null,
          }));
          const addr = order.shipping_address || {};
          const addressStr = typeof addr === 'string' ? addr :
            [addr.address_line1, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ');
          return {
            ...order,
            products,
            items_count: products.length,
            address: addressStr,
            tracking_id: order.awb_code || order.shipment_id || null,
            payment_status: order.payment_gateway === 'cod' ? 'COD' : 'Paid',
            expected_delivery: order.expected_delivery || null,
          };
        });
        setOrders(transformed);
      } catch (e) { console.error('[Orders] Fetch error:', e); setOrders([]); }
      finally { setLoading(false); }
    })();
  }, [userEmail]);

  if (selected) return <OrderDetail order={selected} onBack={() => setSelected(null)} onTrack={() => onTrackOrder(selected.tracking_id || selected.id)} />;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
      <Text style={sec.pageTitle}>Order History</Text>
      {loading ? (
        <View style={{ gap: 16 }}>
          {[1,2,3].map(i => <Card key={i}><Skeleton height={80} /></Card>)}
        </View>
      ) : orders.length === 0 ? (
        <View style={sec.emptyState}>
          <Package color={TEXT_MUTED} size={48} strokeWidth={1} />
          <Text style={sec.emptyTitle}>No Orders Yet</Text>
          <Text style={sec.emptyText}>Your order history will appear here.</Text>
        </View>
      ) : (
        orders.map((order) => {
          const st = statusConfig[order.status] || statusConfig.pending;
          return (
            <TouchableOpacity key={order.id} onPress={() => setSelected(order)} activeOpacity={0.85}>
              <Card>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                  {(order.products?.[0]?.image || order.products?.[0]?.imageUrl) ? (
                    <Image source={order.products[0].image ? order.products[0].image : { uri: order.products[0].imageUrl }} style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: BG2 }} resizeMode="contain" />
                  ) : (
                    <View style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: BG2, justifyContent: 'center', alignItems: 'center' }}>
                      <Package color={GOLD} size={22} strokeWidth={1} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: TEXT, fontWeight: '700', fontSize: 14, marginBottom: 3 }}>{order.order_number}</Text>
                    <Text style={{ color: TEXT_MUTED, fontSize: 12, marginBottom: 2 }}>
                      {order.items_count || order.products?.length || 1} item{(order.items_count || 1) > 1 ? 's' : ''} · {formatDate(order.created_at)}
                    </Text>
                    {order.expected_delivery && <Text style={{ color: TEXT_MUTED, fontSize: 12 }}>Expected: {formatDate(order.expected_delivery)}</Text>}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 8 }}>
                    <Text style={{ color: TEXT, fontWeight: '800', fontSize: 15 }}>₹{order.total_amount}</Text>
                    <View style={[{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 }, { backgroundColor: st.bg, borderColor: st.border }]}>
                      <Text style={{ color: st.color, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>{st.label}</Text>
                    </View>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderTopWidth: 1, borderColor: BORDER_LT, paddingTop: 12 }}>
                  <Text style={{ fontSize: 12, color: GOLD_DARK, fontWeight: '600' }}>View Details</Text>
                  <ChevronRight color={GOLD_DARK} size={13} />
                </View>
              </Card>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
};

// ─── TRACK ────────────────────────────────────────────────────────────────────
const TrackSection = ({ initialId = '' }: { initialId?: string }) => {
  const [query, setQuery] = useState(initialId);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const doSearch = async () => {
    if (!query.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      const token = session?.access_token || '';
      const res = await fetch(`/api/orders/track?query=${encodeURIComponent(query.trim())}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.orders?.length > 0) {
        const order = data.orders[0];
        // Transform to match UI
        const products = (order.order_items || []).map((item: any) => ({
          name: item.products?.name || 'Product',
          qty: item.quantity,
          price: item.price,
        }));
        setResult({
          ...order,
          products,
          tracking_id: order.awb_code || order.shipment_id || null,
        });
      } else {
        setError(data.error || 'No order found with that ID or AWB number.');
      }
    } catch (e) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const st = result ? (statusConfig[result.status] || statusConfig.pending) : null;
  const timeline = result ? [
    { label: 'Order Placed',     done: true },
    { label: 'Packed',           done: result.status !== 'pending' },
    { label: 'Shipped',          done: ['shipped','delivered'].includes(result.status) },
    { label: 'Out for Delivery', done: result.status === 'delivered' },
    { label: 'Delivered',        done: result.status === 'delivered' },
  ] : [];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
      <Text style={sec.pageTitle}>Track Your Order</Text>
      <Card>
        <Text style={sec.cardTitle}>Enter Order or AWB Number</Text>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <TextInput value={query} onChangeText={setQuery} placeholder="e.g. DLX-2024-001 or SHIP123456" placeholderTextColor={TEXT_MUTED}
              style={[inp.field, { marginBottom: 0, color: TEXT }]} onSubmitEditing={doSearch} />
          </View>
          <TouchableOpacity onPress={doSearch} style={{ padding: 13, borderRadius: 12, borderWidth: 1.5, borderColor: BORDER, backgroundColor: BG2 }}>
            {loading ? <ActivityIndicator color={GOLD} size="small" /> : <Search color={GOLD_DARK} size={18} />}
          </TouchableOpacity>
        </View>
        <Text style={{ color: TEXT_MUTED, fontSize: 11, marginTop: 8 }}>Enter your Daluxe Order ID or Shiprocket AWB number</Text>
      </Card>

      {error && (
        <Card style={{ flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: 'rgba(220,38,38,0.04)', borderColor: 'rgba(220,38,38,0.2)' }}>
          <AlertCircle color="#DC2626" size={18} />
          <Text style={{ color: '#DC2626', fontSize: 13 }}>{error}</Text>
        </Card>
      )}

      {result && st && (
        <>
          <Card style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: TEXT, fontWeight: '700', fontSize: 14 }}>{result.order_number}</Text>
              <View style={[{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 }, { backgroundColor: st.bg, borderColor: st.border }]}>
                <Text style={{ color: st.color, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>{st.label}</Text>
              </View>
            </View>
            <Text style={{ color: TEXT_MUTED, fontSize: 12 }}>Ordered {formatDate(result.created_at)}</Text>
            {result.expected_delivery && (
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <Clock color={GOLD_DARK} size={13} />
                <Text style={{ color: TEXT_MUTED, fontSize: 12 }}>Expected by {formatDate(result.expected_delivery)}</Text>
              </View>
            )}
            {result.tracking_id && <Text style={{ color: TEXT_MUTED, fontSize: 11 }}>AWB: {result.tracking_id}</Text>}
          </Card>
          <Card>
            <Text style={sec.cardTitle}>Shipment Timeline</Text>
            {timeline.map((step, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 16, marginBottom: i < timeline.length - 1 ? 22 : 0 }}>
                <View style={{ alignItems: 'center' }}>
                  <View style={[tl.dot, step.done && tl.dotDone]} />
                  {i < timeline.length - 1 && <View style={[tl.line, step.done && tl.lineDone]} />}
                </View>
                <Text style={[tl.label, step.done && tl.labelDone]}>{step.label}</Text>
              </View>
            ))}
          </Card>
        </>
      )}
    </ScrollView>
  );
};

// ─── SKIN ─────────────────────────────────────────────────────────────────────
const SkinSection = ({ onNavigate }: { onNavigate: (p: string) => void }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
    <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(201,162,39,0.1)', borderWidth: 1.5, borderColor: BORDER, justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
      <Microscope color={GOLD_DARK} size={32} strokeWidth={1.3} />
    </View>
    <Text style={[sec.pageTitle, { textAlign: 'center', marginBottom: 12 }]}>AI Skin Assessment</Text>
    <Text style={{ color: TEXT_MUTED, textAlign: 'center', fontSize: 14, lineHeight: 22, maxWidth: 320, marginBottom: 32 }}>
      Get a personalised skincare routine powered by AI. Takes just 2 minutes and is completely free.
    </Text>
    <GoldButton label="Start My Assessment" onPress={() => onNavigate('skin-assessment')} icon={Microscope} />
  </View>
);

// ─── CONTACT ──────────────────────────────────────────────────────────────────
const ContactSection = ({ userEmail }: { userEmail: string }) => {
  const [form, setForm] = useState({ name: '', email: userEmail, message: '' });
  const [sending, setSending] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = async () => {
    if (!form.message.trim()) return;
    setSending(true); await new Promise(r => setTimeout(r, 1200)); setSending(false);
    setForm(f => ({ ...f, message: '' })); setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
      <Text style={sec.pageTitle}>Contact Us</Text>
      <Card>
        <Text style={sec.cardTitle}>Get in Touch</Text>
        <Text style={{ color: TEXT_MUTED, fontSize: 13, marginBottom: 20, lineHeight: 20 }}>
          Have a question about your order or our products? We typically respond within 24 hours.
        </Text>
        <GoldInput label="Your Name"      value={form.name}    onChangeText={(v: string) => setForm(f => ({ ...f, name: v }))} />
        <GoldInput label="Email Address"  value={form.email}   onChangeText={(v: string) => setForm(f => ({ ...f, email: v }))} keyboardType="email-address" />
        <GoldInput label="Message"        value={form.message} onChangeText={(v: string) => setForm(f => ({ ...f, message: v }))} multiline />
        <GoldButton label={sending ? 'Sending…' : 'Send Message'} onPress={handleSubmit} icon={Send} />
      </Card>
      <Card style={{ gap: 16 }}>
        <Text style={sec.cardTitle}>Other Ways to Reach Us</Text>
        {[
          { icon: Mail,  label: 'Email',    value: 'mydaluxe@gmail.com' },
          { icon: Phone, label: 'Phone',    value: '+91 6201 503 466\n+91 8879621636' },
          { icon: Clock, label: 'Hours',    value: 'Mon–Sat, 10:00 AM–7:00 PM IST' },
          { icon: MapPin,label: 'Location', value: 'Sanaullah compound dharavi\nNear by - Tasmia medical\nMahim East, Mumbai 400017' },
        ].map(({ icon: Icon, label, value }) => (
          <View key={label} style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(201,162,39,0.08)', borderWidth: 1, borderColor: BORDER, justifyContent: 'center', alignItems: 'center' }}>
              <Icon color={GOLD_DARK} size={14} strokeWidth={1.5} />
            </View>
            <View>
              <Text style={{ color: TEXT_MUTED, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 }}>{label}</Text>
              <Text style={{ color: TEXT, fontSize: 13 }}>{value}</Text>
            </View>
          </View>
        ))}
      </Card>
      <Toast visible={showToast} message="Message sent! We'll get back to you soon." />
    </ScrollView>
  );
};

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
interface Props {
  userEmail: string;
  onLogout: () => void;
  onBack: () => void;
  onNavigate: (page: string) => void;
}

export default function AccountDashboard({ userEmail, onLogout, onBack, onNavigate }: Props) {
  const [isMobile, setIsMobile] = useState(isMobileDevice());
  const [activeMenu, setActiveMenu] = useState<MenuKey>('profile');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [trackId, setTrackId] = useState('');
  const sidebarAnim = useRef(new Animated.Value(-280)).current;

  useEffect(() => {
    const handleResize = () => setIsMobile(isMobileDevice());
    if (Platform.OS === 'web') window.addEventListener('resize', handleResize);
    return () => { if (Platform.OS === 'web') window.removeEventListener('resize', handleResize); };
  }, []);

  useEffect(() => {
    if (isMobile) {
      Animated.spring(sidebarAnim, { toValue: sidebarOpen ? 0 : -280, useNativeDriver: true, tension: 80, friction: 12 }).start();
    }
  }, [sidebarOpen, isMobile]);

  const handleMenuSelect = (key: MenuKey) => { setActiveMenu(key); if (isMobile) setSidebarOpen(false); };
  const goToTrack = (id: string) => { setTrackId(id); setActiveMenu('track'); };

  const renderContent = () => {
    switch (activeMenu) {
      case 'profile': return <ProfileSection userEmail={userEmail} />;
      case 'orders':  return <OrdersSection userEmail={userEmail} onTrackOrder={goToTrack} />;
      case 'track':   return <TrackSection initialId={trackId} />;
      case 'skin':    return <SkinSection onNavigate={onNavigate} />;
      case 'contact': return <ContactSection userEmail={userEmail} />;
      default:        return null;
    }
  };

  const SidebarInner = () => (
    <View style={dash.sidebar}>
      {/* User info */}
      <View style={dash.brandRow}>
        <LinearGradient colors={[GOLD, '#F0CC5E']} style={dash.avatarSmall}>
          <Text style={dash.avatarSmallText}>{userEmail.charAt(0).toUpperCase()}</Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={dash.brandEmail} numberOfLines={1}>{userEmail}</Text>
          <Text style={dash.brandBadge}>✦  DALUXE MEMBER</Text>
        </View>
      </View>

      <View style={{ height: 1, backgroundColor: BORDER_LT, marginHorizontal: 16, marginBottom: 12 }} />

      {/* Nav */}
      <View style={{ flex: 1, gap: 2, paddingHorizontal: 10 }}>
        {MENU.map(({ key, label, Icon }) => {
          const active = activeMenu === key;
          return (
            <TouchableOpacity key={key} onPress={() => handleMenuSelect(key)} activeOpacity={0.7}
              style={[dash.menuItem, active && dash.menuItemActive]}>
              <Icon color={active ? GOLD_DARK : TEXT_MUTED} size={16} strokeWidth={active ? 2 : 1.5} />
              <Text style={[dash.menuLabel, active && dash.menuLabelActive]}>{label}</Text>
              {active && <View style={dash.activeBar} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Logout */}
      <TouchableOpacity onPress={onLogout} style={dash.logoutBtn} activeOpacity={0.7}>
        <LogOut color="#DC2626" size={15} strokeWidth={1.5} />
        <Text style={dash.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={dash.root}>
      {/* Mobile top bar */}
      {isMobile && (
        <View style={dash.topbar}>
          <TouchableOpacity onPress={onBack} style={dash.topbarBtn}>
            <ChevronLeft color={GOLD_DARK} size={20} />
          </TouchableOpacity>
          <Text style={dash.topbarTitle}>{MENU.find(m => m.key === activeMenu)?.label || 'Account'}</Text>
          <TouchableOpacity onPress={() => setSidebarOpen(v => !v)} style={dash.topbarBtn}>
            <User color={GOLD_DARK} size={20} />
          </TouchableOpacity>
        </View>
      )}

      {/* Desktop sidebar */}
      {!isMobile && (
        <View style={dash.desktopSidebar}>
          <TouchableOpacity onPress={onBack} style={dash.backToSite}>
            <ChevronLeft color={TEXT_MUTED} size={14} />
            <Text style={dash.backToSiteText}>Back to Store</Text>
          </TouchableOpacity>
          <SidebarInner />
        </View>
      )}

      {/* Mobile slide-in sidebar */}
      {isMobile && (
        <>
          {sidebarOpen && (
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setSidebarOpen(false)} activeOpacity={1}>
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} />
            </TouchableOpacity>
          )}
          <Animated.View style={[dash.mobileSidebar, { transform: [{ translateX: sidebarAnim }] }]}>
            <TouchableOpacity onPress={onBack} style={[dash.backToSite, { paddingTop: 50 }]}>
              <ChevronLeft color={TEXT_MUTED} size={14} />
              <Text style={dash.backToSiteText}>Back to Store</Text>
            </TouchableOpacity>
            <SidebarInner />
          </Animated.View>
        </>
      )}

      {/* Content */}
      <View style={{ flex: 1, backgroundColor: BG2, marginTop: isMobile ? 58 : 0 }}>
        {renderContent()}
      </View>
    </View>
  );
}

const dash = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: BG },

  topbar: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 58,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, borderBottomWidth: 1, borderColor: BORDER_LT,
    backgroundColor: BG, zIndex: 100,
  },
  topbarBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: BG2, borderWidth: 1, borderColor: BORDER_LT,
    justifyContent: 'center', alignItems: 'center',
  },
  topbarTitle: { fontSize: 15, fontWeight: '600', color: TEXT },

  desktopSidebar: {
    width: 256, height: '100%',
    backgroundColor: SIDEBAR_BG,
    borderRightWidth: 1, borderColor: BORDER_LT,
  },
  mobileSidebar: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 280,
    backgroundColor: SIDEBAR_BG, borderRightWidth: 1, borderColor: BORDER_LT,
    zIndex: 200,
    ...Platform.select({ web: { boxShadow: '6px 0 24px rgba(0,0,0,0.12)' } as any }),
  },

  backToSite: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 16,
  },
  backToSiteText: { fontSize: 12, color: TEXT_MUTED, letterSpacing: 0.5 },

  sidebar:    { flex: 1, paddingTop: 4, paddingBottom: 20 },
  brandRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 16 },
  avatarSmall:     { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  avatarSmallText: { color: '#1A1A1A', fontWeight: '700', fontSize: 14 },
  brandEmail:  { color: TEXT, fontSize: 12, fontWeight: '500' },
  brandBadge:  { color: GOLD_DARK, fontSize: 9, letterSpacing: 2, marginTop: 2 },

  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 12, overflow: 'hidden', position: 'relative',
  },
  menuItemActive: { backgroundColor: 'rgba(201,162,39,0.08)' },
  menuLabel:      { flex: 1, fontSize: 13, color: TEXT_MUTED, fontWeight: '500' },
  menuLabelActive:{ color: TEXT, fontWeight: '700' },
  activeBar:      { width: 3, height: 18, borderRadius: 2, backgroundColor: GOLD },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 10, marginTop: 8,
    paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.2)', backgroundColor: 'rgba(220,38,38,0.04)',
  },
  logoutText: { color: '#DC2626', fontSize: 13, fontWeight: '600' },
});
