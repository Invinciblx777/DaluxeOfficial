import React from 'react';
import { View, Text, StyleSheet, Platform, Dimensions } from 'react-native';
import Animated, { FadeInUp, FadeInLeft } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, X, ArrowRight, Package, Search, CheckCircle, Sparkles } from 'lucide-react-native';
import LegalPageShell, { GoldDivider, BG_CARD, GOLD, GOLD_DIM, GOLD_GLOW, GOLD_BORDER, GOLD_BORDER_SUBTLE, TEXT_LIGHT, TEXT_DIM, TEXT_MUTED, SERIF, SANS } from './LegalPageShell';

const { width: SW } = Dimensions.get('window');
const isMobile = SW < 768;

const ELIGIBLE = [
  'Product is in unused, unopened condition',
  'Original packaging and tags are intact',
  'Return request made within 7 days of delivery',
  'Product has no signs of use, damage by customer, or wear',
  'Proof of purchase (order confirmation email) is available',
];

const NOT_ELIGIBLE = [
  'Products that have been opened or used',
  'Items without original packaging or tags',
  'Requests made after the 7-day return window',
  'Products purchased on sale or with promotional discounts (unless defective)',
  'Gift cards and prepaid vouchers',
  'Products damaged due to misuse or negligence by the customer',
];

const FLOW_STEPS = [
  { icon: Package, label: 'Request', desc: 'Submit your return request via email or chat within 7 days' },
  { icon: Search, label: 'Review', desc: 'Our team reviews your request within 24–48 hours' },
  { icon: CheckCircle, label: 'Approval', desc: 'You receive a return authorization with pickup details' },
  { icon: Sparkles, label: 'Complete', desc: 'Refund or exchange is processed after product inspection' },
];

export default function ReturnPolicyPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  return (
    <LegalPageShell
      eyebrow="RETURNS"
      title="Return Policy"
      tagline="7-day hassle-free returns for a seamless shopping experience."
      lastUpdated="April 14, 2026"
      breadcrumb="Return Policy"
      onNavigate={onNavigate}
    >
      <View style={rt.contentWrap}>

        {/* ═══ ELIGIBILITY CHECKLISTS ═══ */}
        <View style={rt.doubleCol}>
          {/* Eligible */}
          <Animated.View entering={FadeInUp.delay(100).duration(600)} style={rt.checklistCard}>
            <View style={rt.checklistHeader}>
              <View style={[rt.checklistBadge, { backgroundColor: GOLD_GLOW, borderColor: GOLD_BORDER }]}>
                <Check color={GOLD} size={16} />
              </View>
              <Text style={rt.checklistTitle}>Eligible for Return</Text>
            </View>
            <LinearGradient colors={['transparent', GOLD, 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ width: 30, height: 1, marginVertical: 12 }} />
            {ELIGIBLE.map((item, i) => (
              <Animated.View key={i} entering={FadeInLeft.delay(200 + i * 60).duration(400)} style={rt.checkItem}>
                <View style={rt.checkDot}><Check color={GOLD} size={12} /></View>
                <Text style={rt.checkText}>{item}</Text>
              </Animated.View>
            ))}
          </Animated.View>

          {/* Not Eligible */}
          <Animated.View entering={FadeInUp.delay(200).duration(600)} style={[rt.checklistCard, rt.checklistCardDanger]}>
            <View style={rt.checklistHeader}>
              <View style={[rt.checklistBadge, { backgroundColor: 'rgba(196,120,92,0.1)', borderColor: 'rgba(196,120,92,0.25)' }]}>
                <X color="#C4785C" size={16} />
              </View>
              <Text style={rt.checklistTitle}>Not Eligible</Text>
            </View>
            <LinearGradient colors={['transparent', 'rgba(196,120,92,0.4)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ width: 30, height: 1, marginVertical: 12 }} />
            {NOT_ELIGIBLE.map((item, i) => (
              <Animated.View key={i} entering={FadeInLeft.delay(300 + i * 60).duration(400)} style={rt.checkItem}>
                <View style={[rt.checkDot, { backgroundColor: 'rgba(196,120,92,0.1)', borderColor: 'rgba(196,120,92,0.2)' }]}>
                  <X color="#C4785C" size={10} />
                </View>
                <Text style={[rt.checkText, { color: 'rgba(140, 80, 55, 0.8)' }]}>{item}</Text>
              </Animated.View>
            ))}
          </Animated.View>
        </View>

        <GoldDivider width={50} />

        {/* ═══ RETURN FLOW ═══ */}
        <View style={rt.sectionBlock}>
          <Animated.View entering={FadeInUp.duration(600)}>
            <Text style={rt.sectionEyebrow}>RETURN PROCESS</Text>
            <GoldDivider width={30} style={{ alignItems: 'flex-start' }} />
            <Text style={rt.sectionTitle}>Status Flow</Text>
          </Animated.View>

          <View style={rt.flowRow}>
            {FLOW_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <React.Fragment key={i}>
                  <Animated.View entering={FadeInUp.delay(200 + i * 120).duration(500)} style={rt.flowCard}>
                    <View style={rt.flowIconWrap}>
                      <Icon color={GOLD} size={20} />
                    </View>
                    <Text style={rt.flowLabel}>{step.label}</Text>
                    <Text style={rt.flowDesc}>{step.desc}</Text>
                  </Animated.View>
                  {i < FLOW_STEPS.length - 1 && !isMobile && (
                    <View style={rt.flowArrow}><ArrowRight color={GOLD_DIM} size={16} /></View>
                  )}
                  {i < FLOW_STEPS.length - 1 && isMobile && (
                    <View style={rt.flowArrowMobile}>
                      <LinearGradient colors={[GOLD_BORDER_SUBTLE, GOLD, GOLD_BORDER_SUBTLE]} style={{ width: 1, height: 24 }} />
                    </View>
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        <GoldDivider width={50} />

        {/* ═══ EXCHANGE INFO ═══ */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={rt.exchangeCard}>
          <Sparkles color={GOLD} size={22} style={{ marginBottom: 12, opacity: 0.7 }} />
          <Text style={rt.exchangeTitle}>Exchange Process</Text>
          <LinearGradient colors={['transparent', GOLD, 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ width: 40, height: 1, marginVertical: 14 }} />
          <Text style={rt.exchangeText}>
            If you wish to exchange a product for a different variant, please initiate a return request and place a new order for the desired product. The refund from the returned product will be processed to your original payment method.
          </Text>
          <Text style={rt.exchangeText}>
            For defective products, we offer a one-time direct replacement at no additional cost. Contact mydaluxe@gmail.com with your order details and photos of the defect.
          </Text>
        </Animated.View>

      </View>
    </LegalPageShell>
  );
}

const rt = StyleSheet.create({
  contentWrap: { maxWidth: 900, width: '100%', alignSelf: 'center', paddingHorizontal: isMobile ? 16 : 40, paddingVertical: isMobile ? 16 : 28 } as any,
  sectionBlock: { marginBottom: 12 } as any,
  sectionEyebrow: { color: GOLD, fontSize: 10, fontWeight: '600', letterSpacing: 5, textTransform: 'uppercase', marginBottom: 4, ...Platform.select({ web: { fontFamily: SANS } as any }) },
  sectionTitle: { color: TEXT_LIGHT, fontSize: isMobile ? 24 : 30, fontWeight: '300', fontFamily: SERIF, letterSpacing: 1, marginBottom: 24 },

  doubleCol: { flexDirection: isMobile ? 'column' : 'row', gap: 16, marginBottom: 8 } as any,
  checklistCard: {
    flex: 1, backgroundColor: BG_CARD, borderRadius: 18, borderWidth: 1, borderColor: GOLD_BORDER_SUBTLE,
    padding: isMobile ? 18 : 24,
    ...Platform.select({ web: { backdropFilter: 'blur(12px)', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' } as any }),
  } as any,
  checklistCardDanger: { borderColor: 'rgba(196,120,92,0.15)' },
  checklistHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 } as any,
  checklistBadge: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, justifyContent: 'center', alignItems: 'center' } as any,
  checklistTitle: { color: TEXT_LIGHT, fontSize: 16, fontWeight: '600', letterSpacing: 0.3, ...Platform.select({ web: { fontFamily: SANS } as any }) },
  checkItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 } as any,
  checkDot: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: GOLD_GLOW, borderWidth: 1, borderColor: GOLD_BORDER,
    justifyContent: 'center', alignItems: 'center', marginTop: 1,
  } as any,
  checkText: { flex: 1, color: TEXT_DIM, fontSize: 13, lineHeight: 20, fontWeight: '400', ...Platform.select({ web: { fontFamily: SANS } as any }) },

  flowRow: { flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', gap: isMobile ? 0 : 8 } as any,
  flowCard: {
    flex: isMobile ? undefined : 1, width: isMobile ? '100%' : undefined,
    alignItems: 'center', padding: isMobile ? 16 : 20, backgroundColor: BG_CARD, borderRadius: 16, borderWidth: 1, borderColor: GOLD_BORDER_SUBTLE,
    ...Platform.select({ web: { backdropFilter: 'blur(12px)', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' } as any }),
  } as any,
  flowIconWrap: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: GOLD_GLOW, borderWidth: 1, borderColor: GOLD_BORDER,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
    ...Platform.select({ web: { boxShadow: '0 0 16px rgba(233,195,73,0.12)' } as any }),
  } as any,
  flowLabel: { color: TEXT_LIGHT, fontSize: 13, fontWeight: '700', letterSpacing: 1, marginBottom: 4, textAlign: 'center', ...Platform.select({ web: { fontFamily: SANS } as any }) },
  flowDesc: { color: TEXT_DIM, fontSize: 11, lineHeight: 17, textAlign: 'center', fontWeight: '400', ...Platform.select({ web: { fontFamily: SANS } as any }) },
  flowArrow: { paddingHorizontal: 4, opacity: 0.5 },
  flowArrowMobile: { alignItems: 'center', paddingVertical: 4 } as any,

  exchangeCard: {
    alignItems: 'center', backgroundColor: BG_CARD, borderRadius: 22, borderWidth: 1, borderColor: GOLD_BORDER_SUBTLE,
    paddingVertical: 32, paddingHorizontal: isMobile ? 20 : 32,
    ...Platform.select({ web: { backdropFilter: 'blur(16px)', boxShadow: '0 8px 32px rgba(0,0,0,0.04)' } as any }),
  } as any,
  exchangeTitle: { color: TEXT_LIGHT, fontSize: isMobile ? 22 : 28, fontWeight: '300', fontFamily: SERIF, letterSpacing: 2, ...Platform.select({ web: { textShadow: '0 2px 20px rgba(233,195,73,0.1)' } as any }) },
  exchangeText: { color: TEXT_DIM, fontSize: 13, lineHeight: 22, textAlign: 'center', fontWeight: '400', marginBottom: 12, maxWidth: 500, ...Platform.select({ web: { fontFamily: SANS } as any }) },
});
