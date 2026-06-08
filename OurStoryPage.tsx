import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Platform,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
  FadeInDown,
  FadeInUp,
  FadeInLeft,
  FadeInRight,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Award, Shield, Leaf, Heart, Gem, Droplets } from 'lucide-react-native';
import { Footer } from './Footer';

const { width: SW } = Dimensions.get('window');
const isMobile = SW < 768;

// ════════════════════════════════════════════════
// DARK GOLD LUXURY PALETTE
// ════════════════════════════════════════════════
const BG_PRIMARY = '#FDFBF7';
const BG_CARD = 'rgba(0, 0, 0, 0.03)';
const BG_CARD_STRONG = 'rgba(0, 0, 0, 0.06)';
const BG_SECTION_ALT = '#F4EFEA';
const GOLD = '#e9c349';
const GOLD_DIM = '#B8962E';
const GOLD_GLOW = 'rgba(233, 195, 73, 0.15)';
const GOLD_BORDER = 'rgba(233, 195, 73, 0.25)';
const GOLD_BORDER_SUBTLE = 'rgba(233, 195, 73, 0.12)';
const TEXT_LIGHT = '#1A1A1A';
const TEXT_DIM = 'rgba(26, 26, 26, 0.7)';
const TEXT_MUTED = 'rgba(26, 26, 26, 0.4)';
const BORDER_SUBTLE = 'rgba(0, 0, 0, 0.06)';
const WHITE = '#1A1A1A';
const SERIF = Platform.select({
  web: '"Noto Serif", Georgia, "Playfair Display", serif',
  default: undefined,
});

// ════════════════════════════════════════════════
// SPARKLING GOLD DIVIDER
// ════════════════════════════════════════════════
const GoldDivider = ({ width: w = 60, style }: { width?: number; style?: any }) => {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      ), -1, true
    );
  }, []);
  const sparkle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: interpolate(pulse.value, [1, 1.4], [0.4, 1]),
  }));
  return (
    <View style={[{ alignItems: 'center', marginVertical: 20 }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <LinearGradient colors={['transparent', GOLD, 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ width: w, height: 1 }} />
        <Animated.View style={sparkle}><Sparkles color={GOLD} size={14} /></Animated.View>
        <LinearGradient colors={['transparent', GOLD, 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ width: w, height: 1 }} />
      </View>
    </View>
  );
};

// ════════════════════════════════════════════════
// GLASS CARD VALUE PILLAR
// ════════════════════════════════════════════════
const ValuePillar = ({ icon: Icon, title, description, index }: { icon: any; title: string; description: string; index: number }) => (
  <Animated.View entering={FadeInUp.delay(200 + index * 150).duration(700)} style={s.valuePillar}>
    <View style={s.valuePillarIcon}>
      <Icon color={GOLD} size={24} />
    </View>
    <Text style={s.valuePillarTitle}>{title}</Text>
    <LinearGradient colors={['transparent', GOLD, 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ width: 24, height: 1, marginVertical: 8 }} />
    <Text style={s.valuePillarDesc}>{description}</Text>
  </Animated.View>
);

// ════════════════════════════════════════════════
// TIMELINE MILESTONE
// ════════════════════════════════════════════════
const TimelineMilestone = ({ year, title, description, index }: { year: string; title: string; description: string; index: number }) => (
  <Animated.View entering={FadeInLeft.delay(300 + index * 200).duration(600)} style={s.timelineItem}>
    <View style={s.timelineDot}><View style={s.timelineDotInner} /></View>
    <View style={s.timelineContent}>
      <Text style={s.timelineYear}>{year}</Text>
      <Text style={s.timelineTitle}>{title}</Text>
      <Text style={s.timelineDesc}>{description}</Text>
    </View>
  </Animated.View>
);

// ════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════
export default function OurStoryPage({ externalScrollY, onNavigate }: { externalScrollY?: any, onNavigate?: (page: string) => void }) {
  const internalScrollY = useSharedValue(0);
  const scrollY = externalScrollY || internalScrollY;
  const scrollHandler = useAnimatedScrollHandler({ onScroll: (e) => { scrollY.value = e.contentOffset.y; } });

  const heroParallax = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(scrollY.value, [0, 400], [0, -80], Extrapolation.CLAMP) }],
    opacity: interpolate(scrollY.value, [0, 350], [1, 0.2], Extrapolation.CLAMP),
  }));

  return (
    <Animated.ScrollView onScroll={scrollHandler} scrollEventThrottle={16} style={{ flex: 1, backgroundColor: BG_PRIMARY }} showsVerticalScrollIndicator={false}>

      {/* ═══ HERO ═══ */}
      <View style={s.heroSection}>
        <LinearGradient colors={['#FDFBF7', '#F4EFEA', '#FDFBF7']} style={StyleSheet.absoluteFillObject} />
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(233,195,73,0.04)' }]} />
        <Animated.View style={[s.heroContent, heroParallax]}>
          <Animated.View entering={FadeInDown.duration(900)}><Text style={s.heroEyebrow}>EST. 2024</Text></Animated.View>
          <Animated.View entering={FadeInDown.delay(200).duration(900)}><Text style={s.heroTitle}>Our Story</Text></Animated.View>
          <Animated.View entering={FadeInDown.delay(400).duration(900)}><LinearGradient colors={['transparent', GOLD, 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={s.heroGoldLine} /></Animated.View>
          <Animated.View entering={FadeInDown.delay(600).duration(900)}><Text style={s.heroTagline}>Where science meets botanical artistry{'\n'}to redefine luxury skincare</Text></Animated.View>
        </Animated.View>
        <LinearGradient colors={['transparent', BG_PRIMARY]} style={s.heroFade} />
      </View>

      {/* ═══ PHILOSOPHY ═══ */}
      <View style={s.section}>
        <Animated.View entering={FadeInUp.delay(100).duration(700)} style={s.philosophyBlock}>
          <Text style={s.sectionEyebrow}>THE PHILOSOPHY</Text>
          <GoldDivider width={40} />
          <View style={s.glassCard}>
            <Text style={s.philosophyQuote}>"True luxury is not merely what you see{'\n'}— it is what your skin feels."</Text>
            <Text style={s.philosophyAttribution}>— The Founders, DaLuxe</Text>
          </View>
        </Animated.View>
      </View>

      {/* ═══ ORIGIN ═══ */}
      <View style={[s.section, { backgroundColor: BG_SECTION_ALT }]}>
        <View style={isMobile ? s.originBlockMobile : s.originBlock}>
          <Animated.View entering={FadeInLeft.delay(100).duration(700)} style={isMobile ? s.originImageWrapMobile : s.originImageWrap}>
            <Image source={require('./assets/facewash_story.jpg')} style={s.originImage} resizeMode="cover" />
            <LinearGradient colors={['transparent', 'rgba(10,10,10,0.6)']} style={StyleSheet.absoluteFillObject} />
          </Animated.View>
          <Animated.View entering={FadeInRight.delay(300).duration(700)} style={isMobile ? s.originTextMobile : s.originText}>
            <Text style={s.sectionEyebrow}>THE BEGINNING</Text>
            <GoldDivider width={30} style={{ alignItems: 'flex-start' }} />
            <Text style={s.originTitle}>Born from a{'\n'}Simple Truth</Text>
            <Text style={s.originBody}>DaLuxe was born from a conviction that luxury skincare should never compromise on purity. Our founders, driven by a passion for dermal science and botanical heritage, set out to create formulations that honor both.</Text>
            <Text style={s.originBody}>Every product begins its journey in our research labs — where cutting-edge dermal science meets time-honored botanical wisdom.</Text>
            <View style={s.originAccent}>
              <Sparkles color={GOLD} size={16} />
              <Text style={s.originAccentText}>ISO & GMP Certified Excellence</Text>
            </View>
          </Animated.View>
        </View>
      </View>

      {/* ═══ VALUES ═══ */}
      <View style={s.section}>
        <Animated.View entering={FadeInDown.duration(600)}>
          <Text style={s.sectionEyebrow}>OUR VALUES</Text>
          <GoldDivider width={40} />
          <Text style={s.sectionTitle}>The Pillars of DaLuxe</Text>
        </Animated.View>
        <View style={s.valuePillarsRow}>
          <ValuePillar icon={Gem} title="Dermal-Grade Purity" description="Every ingredient meets pharmaceutical-grade standards. No fillers, no compromises." index={0} />
          <ValuePillar icon={Leaf} title="Botanical Heritage" description="We harness centuries of herbal wisdom, selecting each extract for proven efficacy." index={1} />
          <ValuePillar icon={Shield} title="Sensitive-First Design" description="Formulated from the ground up for sensitive skin. Gentle yet powerful." index={2} />
          <ValuePillar icon={Heart} title="Conscious Luxury" description="Sustainable sourcing, ethical practices, and eco-conscious packaging." index={3} />
        </View>
      </View>

      {/* ═══ STATS ═══ */}
      <View style={[s.section, { backgroundColor: BG_SECTION_ALT }]}>
        <Animated.View entering={FadeInDown.duration(600)}><Text style={s.sectionEyebrow}>BY THE NUMBERS</Text><GoldDivider width={40} /></Animated.View>
        <View style={s.statsRow}>
          {[
            { value: '100%', label: 'Botanical\nIngredients' },
            { value: '0', label: 'Harmful\nChemicals' },
            { value: '3+', label: 'Years of\nResearch' },
            { value: '50K+', label: 'Happy\nCustomers' },
          ].map((stat, i) => (
            <Animated.View key={i} entering={FadeInUp.delay(200 + i * 100).duration(600)} style={s.statItem}>
              <Text style={s.statValue}>{stat.value}</Text>
              <LinearGradient colors={['transparent', GOLD, 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ width: 20, height: 1, marginVertical: 8 }} />
              <Text style={s.statLabel}>{stat.label}</Text>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* ═══ TIMELINE ═══ */}
      <View style={s.section}>
        <Animated.View entering={FadeInDown.duration(600)}>
          <Text style={s.sectionEyebrow}>THE JOURNEY</Text>
          <GoldDivider width={40} />
          <Text style={s.sectionTitle}>Milestones of Excellence</Text>
        </Animated.View>
        <View style={s.timeline}>
          <LinearGradient colors={[GOLD_BORDER_SUBTLE, GOLD, GOLD_BORDER_SUBTLE]} style={s.timelineLine} />
          <TimelineMilestone year="2022" title="The Vision" description="Our founders unite a shared passion for dermal science and botanical luxury." index={0} />
          <TimelineMilestone year="2023" title="Research & Development" description="Over 200 formulation trials to perfect our dermal-grade botanical approach." index={1} />
          <TimelineMilestone year="2024" title="DaLuxe Launches" description="The debut collection — Gold Glow Facewash, Hair Serum, and Night Cream." index={2} />
          <TimelineMilestone year="2025" title="ISO & GMP Certified" description="Full certification achieved, affirming pharmaceutical-grade quality." index={3} />
        </View>
      </View>

      {/* ═══ CRAFTSMANSHIP ═══ */}
      <View style={[s.section, { backgroundColor: BG_SECTION_ALT }]}>
        <View style={isMobile ? s.craftBlockMobile : s.craftBlock}>
          <Animated.View entering={FadeInLeft.delay(100).duration(700)} style={isMobile ? { width: '100%' } : { flex: 1, paddingVertical: 20 }}>
            <Text style={s.sectionEyebrow}>THE CRAFT</Text>
            <GoldDivider width={30} style={{ alignItems: 'flex-start' }} />
            <Text style={s.originTitle}>Precision in{'\n'}Every Drop</Text>
            <Text style={s.originBody}>Our formulations are not mass-produced. Each batch is carefully crafted in small quantities to maintain the highest standards of purity and potency.</Text>
            <Text style={s.originBody}>From sourcing to bottling, every step is overseen by our team of dermal scientists.</Text>
            <View style={s.craftBadges}>
              {[
                { icon: Award, label: 'ISO Certified' },
                { icon: Shield, label: 'GMP Certified' },
                { icon: Droplets, label: 'Dermal-Grade' },
              ].map((badge, i) => (
                <View key={i} style={s.craftBadge}>
                  <badge.icon color={GOLD} size={16} />
                  <Text style={s.craftBadgeText}>{badge.label}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
          <Animated.View entering={FadeInRight.delay(300).duration(700)} style={isMobile ? s.originImageWrapMobile : s.originImageWrap}>
            <Image source={require('./assets/hero_background_new.jpg')} style={s.originImage} resizeMode="cover" />
          </Animated.View>
        </View>
      </View>

      {/* ═══ CLOSING PROMISE ═══ */}
      <View style={s.closingSection}>
        <LinearGradient colors={['#FDFBF7', '#FAF9F6', '#FDFBF7']} style={StyleSheet.absoluteFillObject} />
        <Animated.View entering={FadeInDown.duration(800)} style={s.closingContent}>
          <Sparkles color={GOLD} size={28} style={{ opacity: 0.7, marginBottom: 20 }} />
          <Text style={s.closingTitle}>Our Promise</Text>
          <LinearGradient colors={['transparent', GOLD, 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ width: 60, height: 1, marginVertical: 20 }} />
          <Text style={s.closingText}>Every DaLuxe product is a testament to our unwavering pursuit of excellence — formulated with the finest botanicals, backed by science, and crafted with love.</Text>
          <Text style={s.closingSignature}>DaLuxe — Luxury, Redefined.</Text>
        </Animated.View>
      </View>

      {/* ═══ FOOTER ═══ */}
      <Footer onNavigate={onNavigate} />
    </Animated.ScrollView>
  );
}

// ════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════
const s = StyleSheet.create({
  heroSection: { height: isMobile ? 440 : 580, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  heroContent: { alignItems: 'center', paddingHorizontal: 24, zIndex: 2 },
  heroEyebrow: {
    color: GOLD, fontSize: 12, fontWeight: '600', letterSpacing: 6, textTransform: 'uppercase', marginBottom: 14, textAlign: 'center',
    ...Platform.select({ web: { textShadow: '0 0 30px rgba(233,195,73,0.5)' } as any }),
  },
  heroTitle: {
    color: WHITE, fontSize: isMobile ? 42 : 68, fontWeight: '300', letterSpacing: isMobile ? 4 : 8, textAlign: 'center', fontFamily: SERIF, marginBottom: 20,
    ...Platform.select({ web: { textShadow: '0 2px 40px rgba(233,195,73,0.15)' } as any }),
  },
  heroGoldLine: { width: 80, height: 1, marginBottom: 24, alignSelf: 'center' },
  heroTagline: { color: TEXT_DIM, fontSize: isMobile ? 14 : 17, lineHeight: isMobile ? 22 : 28, textAlign: 'center', fontWeight: '300', letterSpacing: 1, maxWidth: 440 },
  heroFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 },

  section: { paddingVertical: isMobile ? 44 : 72, paddingHorizontal: isMobile ? 20 : 56, alignItems: 'center' },
  sectionEyebrow: { color: GOLD, fontSize: 10, fontWeight: '600', letterSpacing: 5, textTransform: 'uppercase', textAlign: 'center', marginBottom: 6 },
  sectionTitle: { color: TEXT_LIGHT, fontSize: isMobile ? 26 : 36, fontWeight: '300', letterSpacing: 2, textAlign: 'center', fontFamily: SERIF, marginBottom: 36 },

  glassCard: {
    backgroundColor: BG_CARD, borderRadius: 20, borderWidth: 1, borderColor: GOLD_BORDER_SUBTLE,
    paddingVertical: 36, paddingHorizontal: isMobile ? 24 : 36, alignItems: 'center',
    ...Platform.select({ web: { backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)' } as any }),
  },
  philosophyBlock: { alignItems: 'center', maxWidth: 640 },
  philosophyQuote: { color: TEXT_LIGHT, fontSize: isMobile ? 20 : 28, fontWeight: '300', lineHeight: isMobile ? 32 : 44, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', letterSpacing: 0.5, marginBottom: 18 },
  philosophyAttribution: { color: GOLD_DIM, fontSize: 12, fontWeight: '600', letterSpacing: 3, textTransform: 'uppercase' },

  originBlock: { flexDirection: 'row', maxWidth: 1060, width: '100%', gap: 48, alignItems: 'center' },
  originBlockMobile: { flexDirection: 'column', width: '100%', gap: 24 },
  originImageWrap: { flex: 1, height: 480, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: BORDER_SUBTLE, ...Platform.select({ web: { boxShadow: '0 16px 48px rgba(0,0,0,0.4)' } as any }) },
  originImageWrapMobile: { width: '100%', height: 240, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: BORDER_SUBTLE },
  originImage: { width: '100%', height: '100%' },
  originText: { flex: 1, paddingVertical: 16 },
  originTextMobile: { width: '100%' },
  originTitle: { color: TEXT_LIGHT, fontSize: isMobile ? 26 : 34, fontWeight: '300', lineHeight: isMobile ? 34 : 44, fontFamily: SERIF, letterSpacing: 1, marginBottom: 20 },
  originBody: { color: TEXT_DIM, fontSize: 14, lineHeight: 24, fontWeight: '400', marginBottom: 14, maxWidth: 440 },
  originAccent: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, paddingVertical: 14, paddingHorizontal: 18,
    borderRadius: 14, backgroundColor: GOLD_GLOW, borderWidth: 1, borderColor: GOLD_BORDER,
    ...Platform.select({ web: { boxShadow: '0 4px 20px rgba(233,195,73,0.12)' } as any }),
  },
  originAccentText: { color: GOLD, fontSize: 11, fontWeight: '700', letterSpacing: 3, textTransform: 'uppercase' },

  valuePillarsRow: { flexDirection: isMobile ? 'column' : 'row', flexWrap: 'wrap', justifyContent: 'center', gap: isMobile ? 16 : 20, maxWidth: 1060, width: '100%' },
  valuePillar: {
    flex: isMobile ? undefined : 1, minWidth: isMobile ? '100%' : 210, maxWidth: isMobile ? '100%' : 250,
    alignItems: 'center', padding: 24, backgroundColor: BG_CARD, borderRadius: 20, borderWidth: 1, borderColor: GOLD_BORDER_SUBTLE,
    ...Platform.select({ web: { backdropFilter: 'blur(16px)', boxShadow: '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)', transition: 'transform 0.3s ease, box-shadow 0.3s ease' } as any }),
  },
  valuePillarIcon: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: GOLD_GLOW, borderWidth: 1, borderColor: GOLD_BORDER,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
    ...Platform.select({ web: { boxShadow: '0 0 20px rgba(233,195,73,0.15)' } as any }),
  },
  valuePillarTitle: { color: TEXT_LIGHT, fontSize: 14, fontWeight: '600', letterSpacing: 1, textAlign: 'center' },
  valuePillarDesc: { color: TEXT_DIM, fontSize: 12, lineHeight: 20, textAlign: 'center', fontWeight: '400' },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: isMobile ? 16 : 40, maxWidth: 800, marginTop: 12 },
  statItem: {
    alignItems: 'center', minWidth: isMobile ? 120 : 130, paddingVertical: 18, paddingHorizontal: 14,
    backgroundColor: BG_CARD, borderRadius: 16, borderWidth: 1, borderColor: GOLD_BORDER_SUBTLE,
    ...Platform.select({ web: { backdropFilter: 'blur(12px)', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' } as any }),
  },
  statValue: { color: GOLD, fontSize: isMobile ? 32 : 44, fontWeight: '200', fontFamily: SERIF, letterSpacing: 2 },
  statLabel: { color: TEXT_MUTED, fontSize: 11, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center', lineHeight: 16 },

  timeline: { maxWidth: 560, width: '100%', marginTop: 8, paddingLeft: 28, position: 'relative' },
  timelineLine: { position: 'absolute', left: 10, top: 0, bottom: 0, width: 1.5, borderRadius: 1 },
  timelineItem: { flexDirection: 'row', marginBottom: 32, alignItems: 'flex-start' },
  timelineDot: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: GOLD,
    backgroundColor: BG_PRIMARY, justifyContent: 'center', alignItems: 'center',
    marginRight: 18, marginLeft: -20, marginTop: 2,
    ...Platform.select({ web: { boxShadow: '0 0 16px rgba(233,195,73,0.4)' } as any }),
  },
  timelineDotInner: { width: 7, height: 7, borderRadius: 4, backgroundColor: GOLD },
  timelineContent: {
    flex: 1, backgroundColor: BG_CARD, borderRadius: 14, padding: 18, borderWidth: 1, borderColor: GOLD_BORDER_SUBTLE,
    ...Platform.select({ web: { backdropFilter: 'blur(12px)', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' } as any }),
  },
  timelineYear: { color: GOLD, fontSize: 11, fontWeight: '700', letterSpacing: 4, marginBottom: 4, ...Platform.select({ web: { textShadow: '0 0 10px rgba(233,195,73,0.3)' } as any }) },
  timelineTitle: { color: TEXT_LIGHT, fontSize: 16, fontWeight: '600', fontFamily: SERIF, marginBottom: 4 },
  timelineDesc: { color: TEXT_DIM, fontSize: 13, lineHeight: 20, fontWeight: '400' },

  craftBlock: { flexDirection: 'row', maxWidth: 1060, width: '100%', gap: 48, alignItems: 'center' },
  craftBlockMobile: { flexDirection: 'column', width: '100%', gap: 24 },
  craftBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 },
  craftBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: BG_CARD,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, borderWidth: 1, borderColor: GOLD_BORDER,
    ...Platform.select({ web: { boxShadow: '0 0 16px rgba(233,195,73,0.08)' } as any }),
  },
  craftBadgeText: { color: TEXT_LIGHT, fontSize: 11, fontWeight: '600', letterSpacing: 1 },

  closingSection: { paddingVertical: isMobile ? 52 : 88, paddingHorizontal: 24, alignItems: 'center', overflow: 'hidden' },
  closingContent: {
    alignItems: 'center', maxWidth: 520, zIndex: 2, backgroundColor: BG_CARD, borderRadius: 24, borderWidth: 1, borderColor: GOLD_BORDER_SUBTLE,
    paddingVertical: 44, paddingHorizontal: 32,
    ...Platform.select({ web: { backdropFilter: 'blur(20px)', boxShadow: '0 12px 48px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)' } as any }),
  },
  closingTitle: { color: WHITE, fontSize: isMobile ? 30 : 40, fontWeight: '300', letterSpacing: 4, fontFamily: SERIF, textAlign: 'center', ...Platform.select({ web: { textShadow: '0 2px 20px rgba(233,195,73,0.2)' } as any }) },
  closingText: { color: TEXT_DIM, fontSize: 14, lineHeight: 24, textAlign: 'center', fontWeight: '400', marginBottom: 24 },
  closingSignature: { color: GOLD, fontSize: 13, fontWeight: '600', letterSpacing: 4, textTransform: 'uppercase', ...Platform.select({ web: { textShadow: '0 0 20px rgba(233,195,73,0.3)' } as any }) },

  footer: { paddingVertical: 36, alignItems: 'center', backgroundColor: BG_PRIMARY },
  footerLogo: { height: 36, width: 90, marginBottom: 10, opacity: 0.7 },
  footerText: { color: TEXT_MUTED, fontSize: 10, fontWeight: '500', letterSpacing: 2, textAlign: 'center', lineHeight: 16, textTransform: 'uppercase' },
});
