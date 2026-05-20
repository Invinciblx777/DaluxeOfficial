import React from 'react';
import { View, Text, StyleSheet, Platform, Dimensions } from 'react-native';
import Animated, { FadeInUp, FadeInLeft } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertCircle, CheckCircle, Clock, XCircle, Sparkles } from 'lucide-react-native';
import LegalPageShell, { GoldDivider, BG_CARD, BG_SECTION_ALT, GOLD, GOLD_DIM, GOLD_GLOW, GOLD_BORDER, GOLD_BORDER_SUBTLE, TEXT_LIGHT, TEXT_DIM, TEXT_MUTED, SERIF, SANS } from './LegalPageShell';

const { width: SW } = Dimensions.get('window');
const isMobile = SW < 768;

const TIMELINE_STEPS = [
  { step: '01', title: 'Request Cancellation', desc: 'Contact us within 24 hours of placing your order. Provide your order number and reason.', icon: Clock },
  { step: '02', title: 'Review', desc: 'Our team reviews your request. Orders that have already been shipped cannot be cancelled.', icon: AlertCircle },
  { step: '03', title: 'Confirmation', desc: 'You will receive a cancellation confirmation email within 24 hours of approval.', icon: CheckCircle },
  { step: '04', title: 'Refund Initiated', desc: 'Refund is processed to your original payment method within 5–7 business days.', icon: Sparkles },
];

const HIGHLIGHT_RULES = [
  { type: 'warning', icon: XCircle, text: 'Orders that have been dispatched or shipped cannot be cancelled.' },
  { type: 'warning', icon: XCircle, text: 'Products marked "Non-Cancellable" at the time of purchase cannot be cancelled.' },
  { type: 'info', icon: CheckCircle, text: 'Damaged or defective products will be replaced at no extra cost. and the replaced product will be delivered with in 7 days' },
  { type: 'info', icon: CheckCircle, text: 'Refunds are processed within 5–7 business days after approval.' },
  { type: 'info', icon: Clock, text: 'Contact us within 24 hours of delivery for damaged item claims.' },
];

export default function RefundPolicyPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  return (
    <LegalPageShell
      eyebrow="REFUNDS"
      title="Refund & Cancellation"
      tagline="Our transparent policies for cancellations, refunds, and damaged products."
      lastUpdated="April 14, 2026"
      breadcrumb="Refund Policy"
      onNavigate={onNavigate}
    >
      <View style={r.contentWrap}>

        {/* ═══ CANCELLATION TIMELINE ═══ */}
        <View style={r.sectionBlock}>
          <Animated.View entering={FadeInUp.duration(600)}>
            <Text style={r.sectionEyebrow}>CANCELLATION PROCESS</Text>
            <GoldDivider width={30} style={{ alignItems: 'flex-start' }} />
            <Text style={r.sectionTitle}>How It Works</Text>
          </Animated.View>

          <View style={r.timeline}>
            <LinearGradient colors={[GOLD_BORDER_SUBTLE, GOLD, GOLD_BORDER_SUBTLE]} style={r.timelineLine} />
            {TIMELINE_STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <Animated.View key={i} entering={FadeInLeft.delay(200 + i * 150).duration(600)} style={r.timelineItem}>
                  <View style={r.timelineDot}>
                    <Icon color={GOLD} size={14} />
                  </View>
                  <View style={r.timelineCard}>
                    <Text style={r.timelineStep}>STEP {s.step}</Text>
                    <Text style={r.timelineTitle}>{s.title}</Text>
                    <Text style={r.timelineDesc}>{s.desc}</Text>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        </View>

        <GoldDivider width={50} />

        {/* ═══ IMPORTANT RULES ═══ */}
        <View style={r.sectionBlock}>
          <Animated.View entering={FadeInUp.duration(600)}>
            <Text style={r.sectionEyebrow}>IMPORTANT RULES</Text>
            <GoldDivider width={30} style={{ alignItems: 'flex-start' }} />
            <Text style={r.sectionTitle}>Please Note</Text>
          </Animated.View>

          <View style={r.rulesGrid}>
            {HIGHLIGHT_RULES.map((rule, i) => {
              const Icon = rule.icon;
              const isWarning = rule.type === 'warning';
              return (
                <Animated.View key={i} entering={FadeInUp.delay(100 + i * 80).duration(500)} style={[r.ruleCard, isWarning && r.ruleCardWarning]}>
                  <View style={[r.ruleIconWrap, isWarning && r.ruleIconWarning]}>
                    <Icon color={isWarning ? '#C4785C' : GOLD} size={16} />
                  </View>
                  <Text style={[r.ruleText, isWarning && r.ruleTextWarning]}>{rule.text}</Text>
                </Animated.View>
              );
            })}
          </View>
        </View>

        <GoldDivider width={50} />

        {/* ═══ REFUND DETAILS ═══ */}
        <View style={r.sectionBlock}>
          <Animated.View entering={FadeInUp.duration(600)}>
            <Text style={r.sectionEyebrow}>REFUND DETAILS</Text>
            <GoldDivider width={30} style={{ alignItems: 'flex-start' }} />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(200).duration(600)} style={r.detailCard}>
            <View style={r.detailRow}>
              <Text style={r.detailLabel}>Refund Method</Text>
              <Text style={r.detailValue}>Original payment method</Text>
            </View>
            <View style={r.detailDivider} />
            <View style={r.detailRow}>
              <Text style={r.detailLabel}>Processing Time</Text>
              <Text style={r.detailValue}>5–7 business days</Text>
            </View>
            <View style={r.detailDivider} />
            <View style={r.detailRow}>
              <Text style={r.detailLabel}>COD Orders</Text>
              <Text style={r.detailValue}>Bank transfer within 7 days</Text>
            </View>
            <View style={r.detailDivider} />
            <View style={r.detailRow}>
              <Text style={r.detailLabel}>Shipping Costs</Text>
              <Text style={r.detailValue}>Non-refundable</Text>
            </View>
          </Animated.View>
        </View>

        {/* ═══ REPLACEMENT POLICY GLASS BOX ═══ */}
        <Animated.View entering={FadeInUp.delay(300).duration(600)} style={[r.glassBox, { marginTop: 40, marginBottom: 20 }]}>
          <LinearGradient 
            colors={['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.4)']} 
            style={r.glassInner}
          >
            <Text style={r.glassText}>
              Damaged or defective products will be replaced at no extra cost. And the replaced product will be delivered within 7 days.
            </Text>
          </LinearGradient>
        </Animated.View>

      </View>
    </LegalPageShell>
  );
}

const r = StyleSheet.create({
  contentWrap: { maxWidth: 800, width: '100%', alignSelf: 'center', paddingHorizontal: isMobile ? 16 : 40, paddingVertical: isMobile ? 16 : 28 } as any,
  sectionBlock: { marginBottom: 12 },
  sectionEyebrow: { color: GOLD, fontSize: 10, fontWeight: '600', letterSpacing: 5, textTransform: 'uppercase', marginBottom: 4, ...Platform.select({ web: { fontFamily: SANS } as any }) },
  sectionTitle: { color: TEXT_LIGHT, fontSize: isMobile ? 24 : 30, fontWeight: '300', fontFamily: SERIF, letterSpacing: 1, marginBottom: 24 },

  glassBox: {
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#B8962E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  glassInner: {
    padding: 24,
    alignItems: 'center',
    ...Platform.select({ web: { backdropFilter: 'blur(12px)' } as any })
  },
  glassText: {
    fontSize: 16,
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
    letterSpacing: 0.5,
    fontFamily: SERIF,
  },

  timeline: { paddingLeft: 28, position: 'relative' } as any,
  timelineLine: { position: 'absolute', left: 15, top: 10, bottom: 10, width: 1.5, borderRadius: 1 } as any,
  timelineItem: { flexDirection: 'row', marginBottom: 20, alignItems: 'flex-start' } as any,
  timelineDot: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: GOLD,
    backgroundColor: '#FDFBF7', justifyContent: 'center', alignItems: 'center',
    marginRight: 16, marginLeft: -20, marginTop: 8,
    ...Platform.select({ web: { boxShadow: '0 0 16px rgba(233,195,73,0.3)' } as any }),
  } as any,
  timelineCard: {
    flex: 1, backgroundColor: BG_CARD, borderRadius: 14, padding: 18, borderWidth: 1, borderColor: GOLD_BORDER_SUBTLE,
    ...Platform.select({ web: { backdropFilter: 'blur(12px)', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' } as any }),
  } as any,
  timelineStep: { color: GOLD, fontSize: 10, fontWeight: '700', letterSpacing: 4, marginBottom: 4, ...Platform.select({ web: { fontFamily: SANS } as any }) },
  timelineTitle: { color: TEXT_LIGHT, fontSize: 15, fontWeight: '600', fontFamily: SERIF, marginBottom: 6 },
  timelineDesc: { color: TEXT_DIM, fontSize: 13, lineHeight: 20, fontWeight: '400', ...Platform.select({ web: { fontFamily: SANS } as any }) },

  rulesGrid: { gap: 10 } as any,
  ruleCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 16, backgroundColor: BG_CARD,
    borderRadius: 14, borderWidth: 1, borderColor: GOLD_BORDER_SUBTLE,
    ...Platform.select({ web: { backdropFilter: 'blur(12px)', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' } as any }),
  } as any,
  ruleCardWarning: { borderColor: 'rgba(196,120,92,0.2)', backgroundColor: 'rgba(196,120,92,0.04)' },
  ruleIconWrap: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: GOLD_GLOW, borderWidth: 1, borderColor: GOLD_BORDER,
    justifyContent: 'center', alignItems: 'center', marginTop: 2,
  } as any,
  ruleIconWarning: { backgroundColor: 'rgba(196,120,92,0.1)', borderColor: 'rgba(196,120,92,0.25)' },
  ruleText: { flex: 1, color: TEXT_DIM, fontSize: 13, lineHeight: 20, fontWeight: '400', ...Platform.select({ web: { fontFamily: SANS } as any }) },
  ruleTextWarning: { color: 'rgba(140, 80, 55, 0.85)' },

  detailCard: {
    backgroundColor: BG_CARD, borderRadius: 18, borderWidth: 1, borderColor: GOLD_BORDER_SUBTLE,
    padding: isMobile ? 18 : 24,
    ...Platform.select({ web: { backdropFilter: 'blur(12px)', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' } as any }),
  } as any,
  detailRow: { flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', paddingVertical: 14, gap: 4 } as any,
  detailLabel: { color: TEXT_MUTED, fontSize: 11, fontWeight: '600', letterSpacing: 3, textTransform: 'uppercase', ...Platform.select({ web: { fontFamily: SANS } as any }) },
  detailValue: { color: TEXT_LIGHT, fontSize: 14, fontWeight: '500', ...Platform.select({ web: { fontFamily: SANS } as any }) },
  detailDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.04)' },
});
