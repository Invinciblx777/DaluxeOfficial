import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform, Animated, ActivityIndicator, Image,
  KeyboardAvoidingView, ImageBackground, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ShoppingBag, MapPin, User, Lock, Check } from 'lucide-react-native';

import { supabaseClient } from './lib/supabaseClient';
import { getApiBase } from './lib/apiBase';

export interface CheckoutItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: any;
  priceDisplay: string;
  sizeDetail: string;
}

interface CheckoutPageProps {
  items: CheckoutItem[];
  initialTotal?: number;
  userEmail: string | null;
  onBack: () => void;
  onLoginRequired: () => void;
  onSuccess: (paymentId: string) => void;
}

const GOLD = '#C9A227';
const GOLD_LIGHT = '#E9C349';
const TEXT = '#1A1A1A';

type Step = 'details' | 'review' | 'payment';

export default function CheckoutPage({ items, initialTotal, userEmail, onBack, onLoginRequired, onSuccess }: CheckoutPageProps) {
  const { width: windowWidth } = useWindowDimensions();
  const [step, setStep] = useState<Step>('details');
  const [loading, setLoading] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  // Removed glitched skin assessment background image from checkout

  // ... (rest of states)
  const [shipping, setShipping] = useState<number | 'CALCULATING'>(99);
  const [paymentMethod, setPaymentMethod] = useState<'prepaid' | 'cod'>('prepaid');
  const [pincodeError, setPincodeError] = useState('');
  
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponMsg, setCouponMsg] = useState('');
  const VALID_COUPONS = ['SUMPI20', 'RASHMI20', 'DIKSHA20', 'PINKY20'];
  const COUPON_DISCOUNT = 20;
  
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView>(null);

  const [form, setForm] = useState({
    name: '', phone: '', email: userEmail || '',
    address: '', city: '', pincode: '', state: '',
  });

  // Effect to sync email if user logs in while on checkout
  React.useEffect(() => {
    if (userEmail && !form.email) {
      setForm(p => ({ ...p, email: userEmail }));
    }
  }, [userEmail]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const subtotal = initialTotal !== undefined ? initialTotal : items.reduce((s, i) => s + i.price * i.quantity, 0);
  const getShippingAmount = () => (shipping === 'CALCULATING' ? 0 : shipping);
  const discountAmount = appliedCoupon ? COUPON_DISCOUNT : 0;
  const codFee = paymentMethod === 'cod' ? 49 : 0;
  const grandTotal = Math.max(0, subtotal + getShippingAmount() + codFee - discountAmount);
  const API_URL = getApiBase();

  function handleApplyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    if (VALID_COUPONS.includes(code)) {
      setAppliedCoupon(code);
      setCouponMsg('Coupon applied successfully!');
    } else {
      setAppliedCoupon(null);
      setCouponMsg('Invalid coupon code');
    }
  }

  async function checkShipping(pincode: string, pMethod = paymentMethod) {
    if (!pincode || pincode.length < 6) return;
    setShipping('CALCULATING');
    setPincodeError('');
    try {
      const w = 0.5; // default weight 500g
      const res = await fetch(`${API_URL}/api/checkout?action=shipping&pincode=${pincode}&weight=${w}&payment=${pMethod}&subtotal=${subtotal}`).then(r => r.json());
      // Rate is a flat fee (free above the threshold), independent of serviceability.
      setShipping(typeof res.rate === 'number' ? res.rate : 0);
      if (res.serviceable === false) {
        setPincodeError('This pincode may be unserviceable by our courier partner');
      }
    } catch(e) {
      setShipping(0);
    }
  }

  function animateStep(next: Step) {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setStep(next);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.phone.trim() || !/^\d{10}$/.test(form.phone.trim())) e.phone = 'Valid 10-digit number required';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    if (!form.address.trim()) e.address = 'Address is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.pincode.trim() || !/^\d{6}$/.test(form.pincode.trim())) e.pincode = 'Valid 6-digit PIN code required';
    if (!form.state.trim()) e.state = 'State is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleCodCheckout() {
    if (!validate()) return;
    setLoading(true);

    const orderPayload = {
      total_amount: grandTotal,
      email: form.email,
      coupon_code: appliedCoupon,
      discount_amount: discountAmount,
      shipping_address: {
        name: form.name, phone: form.phone,
        address_line1: form.address, address_line2: '',
        city: form.city, state: form.state, pincode: form.pincode
      }
    };
    
    const cartPayload = items.map(i => ({ product_id: i.id, name: i.name, quantity: i.quantity, price: i.price }));

    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setLoading(false);
        onLoginRequired();
        return;
      }

      const res = await fetch(`${API_URL}/api/checkout?action=cod`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderPayload, cartItems: cartPayload })
      });
      const data = await res.json();
      if (data.success) {
        setPaymentDone(true);
        onSuccess(data.order.order_number);
      } else {
        alert(data.error || 'Failed to place order');
      }
    } catch(e) {
      alert('Network error');
    } finally {
      setLoading(false);
    }
  }

  async function handlePrepaidCheckout() {
    if (!validate()) return;
    setLoading(true);

    if (Platform.OS === 'web') {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        const token = session?.access_token;
        if (!token) {
          setLoading(false);
          onLoginRequired();
          return;
        }

        const res = await fetch(`${API_URL}/api/phonepe?action=initiate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            amount: grandTotal,
            coupon_code: appliedCoupon,
            discount_amount: discountAmount,
            cart_items: items.map(i => ({ product_id: i.id, name: i.name, quantity: i.quantity, price: i.price })),
            shipping_address: {
              name: form.name, phone: form.phone,
              address_line1: form.address, address_line2: '',
              city: form.city, state: form.state, pincode: form.pincode
            },
            email: form.email
          })
        });

        // Parse defensively: a misrouted call can return HTML (the SPA shell) instead
        // of JSON, which would otherwise throw and be masked as a generic network error.
        const raw = await res.text();
        let data: any = null;
        try { data = raw ? JSON.parse(raw) : null; } catch { data = null; }

        if (data?.success && data.data?.redirectUrl) {
          window.location.href = data.data.redirectUrl;
        } else {
          setLoading(false);
          const reason = data?.error
            || (!res.ok ? `Payment service returned ${res.status}` : 'Could not initiate payment');
          alert('Payment gateway error: ' + reason);
        }
      } catch (err: any) {
        setLoading(false);
        alert('Could not reach the payment gateway: ' + (err?.message || 'network error') + '. Please try again.');
      }
    } else {
       setLoading(false); alert('Native payments must use Deep Links or WebViews for PhonePe');
    }
  }

  async function handlePayment() {
    if (!userEmail) {
      onLoginRequired();
      return;
    }
    if (paymentMethod === 'cod') await handleCodCheckout();
    else await handlePrepaidCheckout();
  }

  // ─── Success screen ───────────────────────────────────────────────
  if (paymentDone) {
    return (
      <View style={s.successContainer}>
        <LinearGradient colors={[GOLD, GOLD_LIGHT]} style={s.successCircle}>
          <Check color="#fff" size={36} strokeWidth={3} />
        </LinearGradient>
        <Text style={s.successTitle}>Order Confirmed!</Text>
        <Text style={s.successSub}>
          Thank you, {form.name.split(' ')[0]}! Your order is on its way to {form.city} in 3–5 business days.
        </Text>
        <View style={s.successPill}>
          <Text style={s.successPillText}>
            ₹{grandTotal.toLocaleString('en-IN')} · {items.length} item{items.length > 1 ? 's' : ''}
          </Text>
        </View>
      </View>
    );
  }

  // ─── Step indicator ───────────────────────────────────────────────
  const stepDone = (t: Step) =>
    (t === 'details' && (step === 'review' || step === 'payment')) ||
    (t === 'review' && step === 'payment');

  return (
    <View style={s.root}>
      
      {/* KeyboardAvoidingView fixes inputs being covered by soft keyboard */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={s.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <ChevronLeft color={TEXT} size={22} strokeWidth={1.8} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Checkout</Text>
        <View style={s.lockBadge}>
          <Lock color={GOLD} size={11} />
          <Text style={s.lockText}>Secure</Text>
        </View>
      </View>

      {/* Steps */}
      <View style={s.steps}>
        {(['details', 'review', 'payment'] as Step[]).map((t, i) => (
          <React.Fragment key={t}>
            {i > 0 && <View style={s.stepLine} />}
            <View style={[s.dot, step === t && s.dotActive, stepDone(t) && s.dotDone]}>
              {stepDone(t)
                ? <Check color="#fff" size={13} strokeWidth={3} />
                : <Text style={[s.dotNum, step === t && { color: '#fff' }]}>{i + 1}</Text>
              }
            </View>
            <Text style={[s.dotLabel, step === t && s.dotLabelActive]}>{['You', 'Review', 'Pay'][i]}</Text>
          </React.Fragment>
        ))}
      </View>

      {/* Content */}
      <ScrollView ref={scrollRef} style={s.scroll} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Animated.View style={[s.body, { opacity: fadeAnim }]}>

          {/* ── STEP 1: DETAILS ── */}
          {step === 'details' && <>
            <SectionHead icon={User} label="Your Details" />
            <Field label="Full Name" value={form.name} onChange={(v: string) => setForm(p => ({ ...p, name: v }))} placeholder="e.g. Priya Sharma" error={errors.name} autoComplete="name" textContentType="name" />
            <Field label="Phone Number" value={form.phone} onChange={(v: string) => setForm(p => ({ ...p, phone: v.replace(/\D/g, '').slice(0, 10) }))} placeholder="10-digit mobile number" error={errors.phone} keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" />
            <Field label="Email Address" value={form.email} onChange={(v: string) => setForm(p => ({ ...p, email: v }))} placeholder="you@example.com" error={errors.email} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />

            <View style={s.divider} />
            <SectionHead icon={MapPin} label="Shipping Address" />
            <Field label="Street Address" value={form.address} onChange={(v: string) => setForm(p => ({ ...p, address: v }))} placeholder="House/flat no., street" error={errors.address} multiline numberOfLines={2} autoComplete="street-address" textContentType="streetAddressLine1" />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Field label="City" value={form.city} onChange={(v: string) => setForm(p => ({ ...p, city: v }))} placeholder="City" error={errors.city} autoComplete="address-level2" textContentType="addressCity" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Pincode" value={form.pincode}
                  onChange={(v: string) => {
                    const cleaned = v.replace(/\D/g, '').slice(0, 6);
                    setForm(p => ({ ...p, pincode: cleaned }));
                  }}
                  onBlur={() => checkShipping(form.pincode)}
                  placeholder="6-digit" error={errors.pincode || pincodeError} keyboardType="number-pad" autoComplete="postal-code" textContentType="postalCode" />
              </View>
            </View>
            <Field label="State" value={form.state} onChange={(v: string) => setForm(p => ({ ...p, state: v }))} placeholder="State" error={errors.state} autoComplete="address-level1" textContentType="addressState" />

            <GoldButton label="Continue to Review" onPress={() => { if (validate()) { checkShipping(form.pincode); animateStep('review'); } }} />
          </>}

          {/* ── STEP 2: REVIEW ── */}
          {step === 'review' && <>
            <SectionHead icon={ShoppingBag} label="Order Summary" />
            {items.map((item) => (
              <View key={item.id} style={s.reviewRow}>
                <View style={s.reviewImgBox}>
                  <Image source={item.image} style={s.reviewImg} resizeMode="contain" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.reviewName}>{item.name}</Text>
                  <Text style={s.reviewSub}>{item.sizeDetail} · Qty {item.quantity}</Text>
                </View>
                <Text style={s.reviewPrice}>{item.priceDisplay}</Text>
              </View>
            ))}

            <View style={s.priceBox}>
              <PriceLine label="Items Subtotal" value={`₹${subtotal.toLocaleString('en-IN')}`} />
              <PriceLine label="Shipping" value={shipping === 'CALCULATING' ? '...' : (shipping === 0 ? 'FREE' : `₹${shipping}`)} green={shipping === 0} />
              {paymentMethod === 'cod' && (
                <PriceLine label="Cash on Delivery Fee" value="₹49" />
              )}
              {appliedCoupon && (
                <PriceLine label={`Discount (${appliedCoupon})`} value={`-₹${discountAmount}`} green />
              )}
              <View style={s.divider} />
              <PriceLine label="Final Total" value={`₹${grandTotal.toLocaleString('en-IN')}`} bold />
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              <TextInput 
                style={[f.input, { flex: 1, textTransform: 'uppercase', marginBottom: 0 }]} 
                placeholder="Discount code" 
                value={couponInput}
                onChangeText={setCouponInput}
                autoCapitalize="characters"
              />
              <TouchableOpacity 
                style={{ backgroundColor: couponInput.trim() ? '#1A1A1A' : '#E0E0E0', paddingHorizontal: 20, justifyContent: 'center', borderRadius: 8 }}
                disabled={!couponInput.trim()}
                onPress={handleApplyCoupon}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Apply</Text>
              </TouchableOpacity>
            </View>
            {couponMsg ? <Text style={{ color: appliedCoupon ? '#22C55E' : '#EF4444', marginBottom: 20, marginTop: -10, fontSize: 13, fontWeight: '500' }}>{couponMsg}</Text> : null}

            <View style={s.addrBox}>
              <MapPin color={GOLD} size={15} strokeWidth={1.8} />
              <View style={{ flex: 1 }}>
                <Text style={s.addrName}>{form.name}</Text>
                <Text style={s.addrText}>{form.address}, {form.city}, {form.state} – {form.pincode}</Text>
                <Text style={s.addrText}>{form.phone} · {form.email}</Text>
              </View>
            </View>

            <GoldButton label="Continue to Payment" onPress={() => animateStep('payment')} />
            <TouchableOpacity onPress={() => animateStep('details')} style={s.ghostBtn} activeOpacity={0.7}>
              <Text style={s.ghostBtnText}>← Edit Details</Text>
            </TouchableOpacity>
          </>}

          {/* ── STEP 3: PAYMENT ── */}
          {step === 'payment' && <>
            <View style={s.payCard}>
              <LinearGradient colors={['rgba(201,162,39,0.07)', 'rgba(233,195,73,0.03)']} style={s.payCardInner}>
                <Text style={s.payAmount}>₹{grandTotal.toLocaleString('en-IN')}</Text>
                <Text style={s.payLabel}>Total Payable</Text>
                <View style={s.payPill}>
                  <Text style={s.payPillText}>{items.length} item{items.length > 1 ? 's' : ''} · Delivered to {form.city}</Text>
                </View>
              </LinearGradient>
            </View>

            <SectionHead icon={ShoppingBag} label="Payment Method" />
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
              <TouchableOpacity onPress={() => { setPaymentMethod('prepaid'); checkShipping(form.pincode, 'prepaid'); }} style={[s.paymentToggle, paymentMethod === 'prepaid' && s.paymentToggleActive]} activeOpacity={0.8}>
                {paymentMethod === 'prepaid' && <View style={s.paymentToggleDot} />}
                <Text style={[s.paymentToggleText, paymentMethod === 'prepaid' && s.paymentToggleTextActive]}>PhonePe / UPI / Cards</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setPaymentMethod('cod'); checkShipping(form.pincode, 'cod'); }} style={[s.paymentToggle, paymentMethod === 'cod' && s.paymentToggleActive]} activeOpacity={0.8}>
                {paymentMethod === 'cod' && <View style={s.paymentToggleDot} />}
                <Text style={[s.paymentToggleText, paymentMethod === 'cod' && s.paymentToggleTextActive]}>Cash on Delivery</Text>
              </TouchableOpacity>
            </View>

            <View style={s.secureRow}>
              <Lock color={GOLD} size={13} />
              <Text style={s.secureText}>
                {paymentMethod === 'prepaid' 
                  ? '100% secure payment powered by PhonePe. Your card details are never stored.'
                  : 'Pay physically with cash or UPI at the time of delivery to your doorstep.'}
              </Text>
            </View>

            <GoldButton label={loading ? '' : paymentMethod === 'cod' ? `PLACE ORDER (COD)` : `PAY ₹${grandTotal.toLocaleString('en-IN')}`} onPress={handlePayment} disabled={loading}
              loading={loading} />

            <TouchableOpacity onPress={() => animateStep('review')} style={{ alignItems: 'center', marginTop: 16, paddingVertical: 8 }} activeOpacity={0.7}>
              <Text style={s.ghostBtnText}>← Back to Review</Text>
            </TouchableOpacity>
          </>}

          <View style={{ height: 60 }} />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
    </View>
  );
}

// ── Sub-components ───────────────────────────────────────────────────

function SectionHead({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 }}>
      <Icon color={GOLD} size={15} strokeWidth={2} />
      <Text style={{ fontSize: 12, fontWeight: '700', color: TEXT, letterSpacing: 1.5, textTransform: 'uppercase' }}>{label}</Text>
    </View>
  );
}

function Field({ label, value, onChange, onBlur: customOnBlur, placeholder, error, multiline, keyboardType, numberOfLines, autoCapitalize, autoComplete, textContentType }: any) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={f.label}>{label}</Text>
      <TextInput
        style={[f.input, focused && f.focused, error && f.errBorder, multiline && { height: 72, textAlignVertical: 'top', paddingTop: 12 }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="rgba(26,26,26,0.28)"
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'words'}
        autoComplete={autoComplete as any}
        textContentType={textContentType as any}
        autoCorrect={false}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); if (customOnBlur) customOnBlur(); }}
      />
      {error && <Text style={f.err}>{error}</Text>}
    </View>
  );
}

function GoldButton({ label, onPress, disabled, loading }: { label: string; onPress: () => void; disabled?: boolean; loading?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.85} style={{ marginTop: 24, borderRadius: 14, overflow: 'hidden' }}>
      <LinearGradient colors={[GOLD, GOLD_LIGHT, GOLD]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={{ paddingVertical: 17, alignItems: 'center', borderRadius: 14, opacity: disabled ? 0.75 : 1,
          ...Platform.select({ web: { boxShadow: '0 6px 20px rgba(201,162,39,0.28)' } as any }) }}>
        {loading
          ? <ActivityIndicator color="#1A1A1A" size="small" />
          : <Text style={{ color: '#1A1A1A', fontSize: 13, fontWeight: '800', letterSpacing: 2 }}>{label}</Text>
        }
      </LinearGradient>
    </TouchableOpacity>
  );
}

function PriceLine({ label, value, bold, green }: { label: string; value: string; bold?: boolean; green?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 }}>
      <Text style={{ fontSize: bold ? 15 : 13, color: bold ? TEXT : 'rgba(26,26,26,0.55)', fontWeight: bold ? '700' : '400' }}>{label}</Text>
      <Text style={{ fontSize: bold ? 16 : 13, color: green ? '#2D7A2D' : bold ? TEXT : TEXT, fontWeight: bold ? '800' : '600' }}>{value}</Text>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAF8F3' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 52 : Platform.OS === 'web' ? 24 : 20,
    paddingBottom: 16, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
  },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: TEXT, letterSpacing: 0.8 },
  lockBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: 'rgba(201,162,39,0.08)',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(201,162,39,0.18)',
  },
  lockText: { fontSize: 11, color: GOLD, fontWeight: '600' },

  steps: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, paddingHorizontal: 24,
  },
  dot: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.06)', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)',
  },
  dotActive: { backgroundColor: GOLD, borderColor: GOLD },
  dotDone: { backgroundColor: '#3C7A3C', borderColor: '#3C7A3C' },
  dotNum: { fontSize: 11, fontWeight: '700', color: 'rgba(26,26,26,0.3)' },
  dotLabel: { fontSize: 11, color: 'rgba(26,26,26,0.35)', fontWeight: '500', marginLeft: 6 },
  dotLabelActive: { color: GOLD, fontWeight: '700' },
  stepLine: { width: 24, height: 1, backgroundColor: 'rgba(0,0,0,0.1)', marginHorizontal: 8 },

  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  body: { maxWidth: 560, alignSelf: 'center', width: '100%', padding: 24 },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginVertical: 20 },

  // Review
  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  reviewImgBox: { width: 62, height: 62, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.03)', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  reviewImg: { width: 52, height: 52 },
  reviewName: { fontSize: 14, fontWeight: '600', color: TEXT, marginBottom: 3 },
  reviewSub: { fontSize: 11, color: 'rgba(26,26,26,0.45)' },
  reviewPrice: { fontSize: 15, fontWeight: '700', color: TEXT },
  priceBox: { marginTop: 18, padding: 18, backgroundColor: 'rgba(0,0,0,0.025)', borderRadius: 14, gap: 8 },
  addrBox: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginTop: 16,
    padding: 16, backgroundColor: 'rgba(201,162,39,0.05)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(201,162,39,0.14)',
  },
  addrName: { fontSize: 13, fontWeight: '600', color: TEXT, marginBottom: 4 },
  addrText: { fontSize: 12, color: 'rgba(26,26,26,0.55)', lineHeight: 19 },

  ghostBtn: { paddingVertical: 16, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  ghostBtnText: { color: GOLD, fontSize: 13, fontWeight: '600' },

  // Payment
  payCard: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(201,162,39,0.2)', marginBottom: 20 },
  payCardInner: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  payAmount: { fontSize: 44, fontWeight: '300', color: TEXT, letterSpacing: -1, ...Platform.select({ web: { fontFamily: 'Georgia, serif' } as any }) },
  payLabel: { fontSize: 11, color: 'rgba(26,26,26,0.4)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 8 },
  payPill: { marginTop: 16, paddingHorizontal: 18, paddingVertical: 7, backgroundColor: 'rgba(201,162,39,0.09)', borderRadius: 20 },
  payPillText: { fontSize: 12, color: GOLD, fontWeight: '600' },
  secureRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 14, backgroundColor: 'rgba(0,0,0,0.025)', borderRadius: 12, marginBottom: 4 },
  secureText: { flex: 1, fontSize: 12, color: 'rgba(26,26,26,0.45)', lineHeight: 18 },

  // Success
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  successCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 28 },
  successTitle: { fontSize: 26, fontWeight: '300', color: TEXT, marginBottom: 12, textAlign: 'center', ...Platform.select({ web: { fontFamily: 'Georgia, serif' } as any }) },
  successSub: { fontSize: 14, color: 'rgba(26,26,26,0.55)', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  successPill: { paddingHorizontal: 22, paddingVertical: 10, backgroundColor: 'rgba(201,162,39,0.1)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(201,162,39,0.2)' },
  successPillText: { fontSize: 14, fontWeight: '700', color: GOLD },
  paymentToggle: { flex: 1, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  paymentToggleActive: { borderColor: GOLD, backgroundColor: 'rgba(201,162,39,0.05)' },
  paymentToggleText: { fontSize: 13, color: 'rgba(26,26,26,0.5)', fontWeight: '600' },
  paymentToggleTextActive: { color: TEXT, fontWeight: '700' },
  paymentToggleDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: GOLD },
});

const f = StyleSheet.create({
  label: { fontSize: 10, fontWeight: '700', color: 'rgba(26,26,26,0.45)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 7 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: TEXT,
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  },
  focused: {
    borderColor: GOLD,
    ...Platform.select({ web: { boxShadow: '0 0 0 3px rgba(201,162,39,0.1)' } as any }),
  },
  errBorder: { borderColor: '#E53E3E' },
  err: { fontSize: 11, color: '#E53E3E', marginTop: 4, marginLeft: 2 },
});
