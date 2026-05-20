import React from 'react';
import { View, Text, StyleSheet, Platform, Dimensions } from 'react-native';
import Animated, { FadeInUp, FadeInLeft } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Truck, Clock, MapPin, AlertTriangle, Info, Package, Sparkles } from 'lucide-react-native';
import LegalPageShell, { GoldDivider, BG_CARD, GOLD, GOLD_DIM, GOLD_GLOW, GOLD_BORDER, GOLD_BORDER_SUBTLE, TEXT_LIGHT, TEXT_DIM, TEXT_MUTED, SERIF, SANS, BG_SECTION_ALT } from './LegalPageShell';

const { width: SW } = Dimensions.get('window');
const isMobile = SW < 768;

const DELIVERY_TIMELINE = [
  { step: '01', title: 'Order Confirmed', desc: 'You receive an email confirmation with your order details.', days: 'Day 0' },
  { step: '02', title: 'Processing & Quality Check', desc: 'Your order is carefully packaged with a final quality inspection.', days: 'Day 1' },
  { step: '03', title: 'Dispatched from Mumbai', desc: 'Your order is handed to our shipping partner. Tracking details are emailed to you.', days: 'Day 2' },
  { step: '04', title: 'In Transit', desc: 'Your package is on its way. Track real-time updates via email or your account.', days: 'Day 3–4' },
  { step: '05', title: 'Delivered', desc: 'Your DA LUXE products arrive at your doorstep. Enjoy your skincare ritual!', days: 'Day 3–5' },
];

const INFO_CARDS = [
  {
    icon: Truck,
    title: 'Shipping Methods',
    items: [
      'Standard delivery via reputed courier services',
      'Speed Post available for select pin codes',
      'All shipments are insured against transit damage',
      'Eco-friendly packaging for a premium unboxing experience',
    ],
  },
  {
    icon: Clock,
    title: 'Dispatch Timeline',
    items: [
      'Orders are dispatched within 2–4 business days',
      'Custom or engraved orders may take 5–7 business days',
      'Weekends and public holidays are not included',
      'Express shipping available at checkout for additional charges',
    ],
  },
  {
    icon: MapPin,
    title: 'Delivery Coverage',
    items: [
      'We deliver across India via 28,000+ pin codes',
      'Remote areas may experience additional 2–3 day delays',
      'International shipping is not available currently',
      'Address changes must be requested before dispatch',
    ],
  },
  {
    icon: AlertTriangle,
    title: 'Important Notes',
    items: [
      'Shipping costs are non-refundable for cancelled orders',
      'DA LUXE is not responsible for delays by the courier',
      'Ensure correct address to avoid delivery failures',
      'Undelivered packages are returned after 3 attempts',
    ],
  },
];

export default function ShippingPolicyPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  return (
    <LegalPageShell
      eyebrow="DELIVERY"
      title="Shipping Policy"
      tagline="From our hands to yours — carefully packaged with love."
      lastUpdated="April 14, 2026"
      breadcrumb="Shipping Policy"
      onNavigate={onNavigate}
    >
      <View style={sh.contentWrap}>

        {/* ═══ DELIVERY TIMELINE ═══ */}
        <View style={sh.sectionBlock}>
          <Animated.View entering={FadeInUp.duration(600)}>
            <Text style={sh.sectionEyebrow}>YOUR ORDER JOURNEY</Text>
            <GoldDivider width={30} style={{ alignItems: 'flex-start' }} />
            <Text style={sh.sectionTitle}>Delivery Timeline</Text>
          </Animated.View>

          <View style={sh.timeline}>
            <LinearGradient colors={[GOLD_BORDER_SUBTLE, GOLD, GOLD_BORDER_SUBTLE]} style={sh.timelineLine} />
            {DELIVERY_TIMELINE.map((s, i) => (
              <Animated.View key={i} entering={FadeInLeft.delay(150 + i * 120).duration(600)} style={sh.timelineItem}>
                <View style={sh.timelineDot}>
                  <Text style={sh.timelineDotText}>{s.step}</Text>
                </View>
                <View style={sh.timelineCard}>
                  <View style={sh.timelineCardHeader}>
                    <Text style={sh.timelineTitle}>{s.title}</Text>
                    <View style={sh.daysBadge}>
                      <Text style={sh.daysText}>{s.days}</Text>
                    </View>
                  </View>
                  <Text style={sh.timelineDesc}>{s.desc}</Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </View>

        <GoldDivider width={50} />

        {/* ═══ INFO CARDS ═══ */}
        <View style={sh.sectionBlock}>
          <Animated.View entering={FadeInUp.duration(600)}>
            <Text style={sh.sectionEyebrow}>SHIPPING DETAILS</Text>
            <GoldDivider width={30} style={{ alignItems: 'flex-start' }} />
            <Text style={sh.sectionTitle}>Everything You Need to Know</Text>
          </Animated.View>

          <View style={sh.infoGrid}>
            {INFO_CARDS.map((card, i) => {
              const Icon = card.icon;
              return (
                <Animated.View key={i} entering={FadeInUp.delay(100 + i * 100).duration(500)} style={sh.infoCard}>
                  <View style={sh.infoCardHeader}>
                    <View style={sh.infoIconWrap}>
                      <Icon color={GOLD} size={20} />
                    </View>
                    <Text style={sh.infoCardTitle}>{card.title}</Text>
                  </View>
                  <LinearGradient colors={['transparent', GOLD, 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ width: 24, height: 1, marginVertical: 12, alignSelf: 'flex-start', marginLeft: 2 } as any} />
                  {card.items.map((item, j) => (
                    <View key={j} style={sh.infoItem}>
                      <View style={sh.infoDot} />
                      <Text style={sh.infoItemText}>{item}</Text>
                    </View>
                  ))}
                </Animated.View>
              );
            })}
          </View>
        </View>

        <GoldDivider width={50} />

        {/* ═══ TRACKING INFO ═══ */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={sh.trackingCard}>
          <Sparkles color={GOLD} size={24} style={{ marginBottom: 14, opacity: 0.7 }} />
          <Text style={sh.trackingTitle}>Track Your Order</Text>
          <LinearGradient colors={['transparent', GOLD, 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ width: 50, height: 1, marginVertical: 16 }} />
          <Text style={sh.trackingText}>
            Once your order is dispatched, you will receive a tracking ID and link via email/SMS. You can also check your order status anytime in your DA LUXE profile.
          </Text>
          <Text style={sh.trackingText}>
            For any shipping-related queries, reach out to us at mydaluxe@gmail.com and our team will assist you within 24 hours.
          </Text>
        </Animated.View>

      </View>
    </LegalPageShell>
  );
}

const sh = StyleSheet.create({
  contentWrap: { maxWidth: 900, width: '100%', alignSelf: 'center', paddingHorizontal: isMobile ? 16 : 40, paddingVertical: isMobile ? 16 : 28 } as any,
  sectionBlock: { marginBottom: 12 } as any,
  sectionEyebrow: { color: GOLD, fontSize: 10, fontWeight: '600', letterSpacing: 5, textTransform: 'uppercase', marginBottom: 4, ...Platform.select({ web: { fontFamily: SANS } as any }) },
  sectionTitle: { color: TEXT_LIGHT, fontSize: isMobile ? 24 : 30, fontWeight: '300', fontFamily: SERIF, letterSpacing: 1, marginBottom: 24 },

  timeline: { paddingLeft: 28, position: 'relative' } as any,
  timelineLine: { position: 'absolute', left: 15, top: 10, bottom: 10, width: 1.5, borderRadius: 1 } as any,
  timelineItem: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start' } as any,
  timelineDot: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: GOLD,
    backgroundColor: '#FDFBF7', justifyContent: 'center', alignItems: 'center',
    marginRight: 16, marginLeft: -20, marginTop: 8,
    ...Platform.select({ web: { boxShadow: '0 0 16px rgba(233,195,73,0.3)' } as any }),
  } as any,
  timelineDotText: { color: GOLD_DIM, fontSize: 10, fontWeight: '800', letterSpacing: 1, ...Platform.select({ web: { fontFamily: SANS } as any }) },
  timelineCard: {
    flex: 1, backgroundColor: BG_CARD, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: GOLD_BORDER_SUBTLE,
    ...Platform.select({ web: { backdropFilter: 'blur(12px)', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' } as any }),
  } as any,
  timelineCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 8 } as any,
  timelineTitle: { color: TEXT_LIGHT, fontSize: 14, fontWeight: '600', fontFamily: SERIF },
  daysBadge: {
    backgroundColor: GOLD_GLOW, borderWidth: 1, borderColor: GOLD_BORDER,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  } as any,
  daysText: { color: GOLD_DIM, fontSize: 10, fontWeight: '700', letterSpacing: 2, ...Platform.select({ web: { fontFamily: SANS } as any }) },
  timelineDesc: { color: TEXT_DIM, fontSize: 12, lineHeight: 19, fontWeight: '400', ...Platform.select({ web: { fontFamily: SANS } as any }) },

  infoGrid: { flexDirection: isMobile ? 'column' : 'row', flexWrap: 'wrap', gap: 16 } as any,
  infoCard: {
    flex: isMobile ? undefined : 1, minWidth: isMobile ? '100%' : 300, maxWidth: isMobile ? '100%' : '48%',
    backgroundColor: BG_CARD, borderRadius: 18, borderWidth: 1, borderColor: GOLD_BORDER_SUBTLE,
    padding: isMobile ? 18 : 22,
    ...Platform.select({ web: { backdropFilter: 'blur(12px)', boxShadow: '0 2px 16px rgba(0,0,0,0.03)' } as any }),
  } as any,
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 } as any,
  infoIconWrap: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: GOLD_GLOW, borderWidth: 1, borderColor: GOLD_BORDER,
    justifyContent: 'center', alignItems: 'center',
    ...Platform.select({ web: { boxShadow: '0 0 12px rgba(233,195,73,0.1)' } as any }),
  } as any,
  infoCardTitle: { color: TEXT_LIGHT, fontSize: 15, fontWeight: '600', letterSpacing: 0.3, ...Platform.select({ web: { fontFamily: SANS } as any }) },
  infoItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 } as any,
  infoDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: GOLD, marginTop: 7, opacity: 0.6 },
  infoItemText: { flex: 1, color: TEXT_DIM, fontSize: 12, lineHeight: 19, fontWeight: '400', ...Platform.select({ web: { fontFamily: SANS } as any }) },

  trackingCard: {
    alignItems: 'center', backgroundColor: BG_CARD, borderRadius: 22, borderWidth: 1, borderColor: GOLD_BORDER_SUBTLE,
    paddingVertical: 36, paddingHorizontal: isMobile ? 20 : 32,
    ...Platform.select({ web: { backdropFilter: 'blur(16px)', boxShadow: '0 8px 32px rgba(0,0,0,0.04)' } as any }),
  } as any,
  trackingTitle: { color: TEXT_LIGHT, fontSize: isMobile ? 24 : 30, fontWeight: '300', fontFamily: SERIF, letterSpacing: 2, ...Platform.select({ web: { textShadow: '0 2px 20px rgba(233,195,73,0.1)' } as any }) },
  trackingText: { color: TEXT_DIM, fontSize: 13, lineHeight: 22, textAlign: 'center', fontWeight: '400', marginBottom: 10, maxWidth: 480, ...Platform.select({ web: { fontFamily: SANS } as any }) },
});
