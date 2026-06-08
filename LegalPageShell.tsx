import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Platform,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
  FadeInDown,
  FadeInUp,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, ChevronRight, Mail } from 'lucide-react-native';
import { Footer } from './Footer';

const { width: SW } = Dimensions.get('window');
const isMobile = SW < 768;

// ════════════════════════════════════════════════
// DALUXE LUXURY PALETTE (exact match)
// ════════════════════════════════════════════════
export const BG_PRIMARY = '#FDFBF7';
export const BG_CARD = 'rgba(0, 0, 0, 0.03)';
export const BG_SECTION_ALT = '#F4EFEA';
export const GOLD = '#e9c349';
export const GOLD_DIM = '#B8962E';
export const GOLD_GLOW = 'rgba(233, 195, 73, 0.15)';
export const GOLD_BORDER = 'rgba(233, 195, 73, 0.25)';
export const GOLD_BORDER_SUBTLE = 'rgba(233, 195, 73, 0.12)';
export const TEXT_LIGHT = '#1A1A1A';
export const TEXT_DIM = 'rgba(26, 26, 26, 0.7)';
export const TEXT_MUTED = 'rgba(26, 26, 26, 0.4)';
export const SERIF = Platform.select({
  web: '"Noto Serif", Georgia, "Playfair Display", serif',
  default: undefined,
});
export const SANS = Platform.select({
  web: '"Manrope", -apple-system, BlinkMacSystemFont, sans-serif',
  default: undefined,
});

// ════════════════════════════════════════════════
// SHARED: GOLD DIVIDER
// ════════════════════════════════════════════════
export const GoldDivider = ({ width: w = 60, style }: { width?: number; style?: any }) => {
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
    <View style={[{ alignItems: 'center', marginVertical: 16 }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <LinearGradient colors={['transparent', GOLD, 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ width: w, height: 1 }} />
        <Animated.View style={sparkle}><Sparkles color={GOLD} size={14} /></Animated.View>
        <LinearGradient colors={['transparent', GOLD, 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ width: w, height: 1 }} />
      </View>
    </View>
  );
};

// ════════════════════════════════════════════════
// LEGAL PAGE SHELL
// ════════════════════════════════════════════════
interface LegalPageShellProps {
  eyebrow: string;
  title: string;
  tagline: string;
  lastUpdated: string;
  breadcrumb: string;
  children: React.ReactNode;
  onNavigate?: (page: string) => void;
}

export default function LegalPageShell({
  eyebrow,
  title,
  tagline,
  lastUpdated,
  breadcrumb,
  children,
  onNavigate,
}: LegalPageShellProps) {
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({ onScroll: (e) => { scrollY.value = e.contentOffset.y; } });

  const heroParallax = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(scrollY.value, [0, 400], [0, -80], Extrapolation.CLAMP) }],
    opacity: interpolate(scrollY.value, [0, 350], [1, 0.2], Extrapolation.CLAMP),
  }));

  return (
    <Animated.ScrollView onScroll={scrollHandler} scrollEventThrottle={16} style={{ flex: 1, backgroundColor: BG_PRIMARY }} showsVerticalScrollIndicator={false}>

      {/* ═══ HERO ═══ */}
      <View style={ls.heroSection}>
        <LinearGradient colors={['#FDFBF7', '#F4EFEA', '#FDFBF7']} style={StyleSheet.absoluteFillObject} />
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(233,195,73,0.04)' }]} />
        <Animated.View style={[ls.heroContent, heroParallax]}>
          <Animated.View entering={FadeInDown.duration(900)}><Text style={ls.heroEyebrow}>{eyebrow}</Text></Animated.View>
          <Animated.View entering={FadeInDown.delay(200).duration(900)}><Text style={ls.heroTitle}>{title}</Text></Animated.View>
          <Animated.View entering={FadeInDown.delay(400).duration(900)}>
            <LinearGradient colors={['transparent', GOLD, 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={ls.heroGoldLine} />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(600).duration(900)}><Text style={ls.heroTagline}>{tagline}</Text></Animated.View>
        </Animated.View>
        <LinearGradient colors={['transparent', BG_PRIMARY]} style={ls.heroFade} />
      </View>

      {/* ═══ BREADCRUMB + LAST UPDATED ═══ */}
      <Animated.View entering={FadeIn.delay(700).duration(600)} style={ls.breadcrumbRow}>
        <View style={ls.breadcrumbInner}>
          <TouchableOpacity onPress={() => onNavigate?.('product')}>
            <Text style={ls.breadcrumbLink}>Home</Text>
          </TouchableOpacity>
          <ChevronRight color={TEXT_MUTED} size={12} />
          <Text style={ls.breadcrumbCurrent}>{breadcrumb}</Text>
        </View>
        <Text style={ls.lastUpdated}>Last updated: {lastUpdated}</Text>
      </Animated.View>

      {/* ═══ CONTENT ═══ */}
      {children}

      {/* ═══ CONTACT CTA ═══ */}
      <View style={ls.ctaSection}>
        <LinearGradient colors={['#FDFBF7', '#FAF9F6', '#FDFBF7']} style={StyleSheet.absoluteFillObject} />
        <Animated.View entering={FadeInUp.delay(100).duration(700)} style={ls.ctaCard}>
          <Mail color={GOLD} size={28} style={{ opacity: 0.7, marginBottom: 16 }} />
          <Text style={ls.ctaTitle}>Need Help?</Text>
          <LinearGradient colors={['transparent', GOLD, 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ width: 50, height: 1, marginVertical: 14 }} />
          <Text style={ls.ctaText}>Our support team is available Monday – Saturday, 10AM – 7PM IST.</Text>
          <TouchableOpacity style={ls.ctaButton} onPress={() => onNavigate?.('contact')} activeOpacity={0.8}>
            <LinearGradient colors={[GOLD, '#524000']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFillObject, { borderRadius: 6 }]} />
            <Text style={ls.ctaButtonText}>CONTACT US</Text>
          </TouchableOpacity>
          <Text style={ls.ctaEmail}>care@daluxe.in</Text>
        </Animated.View>
      </View>

      {/* ═══ FOOTER ═══ */}
      <Footer onNavigate={onNavigate} />
    </Animated.ScrollView>
  );
}

// ════════════════════════════════════════════════
// SHARED STYLES
// ════════════════════════════════════════════════
export const ls = StyleSheet.create({
  heroSection: { height: isMobile ? 360 : 460, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' } as any,
  heroContent: { alignItems: 'center', paddingHorizontal: 24, zIndex: 2 },
  heroEyebrow: {
    color: GOLD, fontSize: 11, fontWeight: '600', letterSpacing: 6, textTransform: 'uppercase', marginBottom: 14, textAlign: 'center',
    ...Platform.select({ web: { textShadow: '0 0 30px rgba(233,195,73,0.5)', fontFamily: SANS } as any }),
  },
  heroTitle: {
    color: TEXT_LIGHT, fontSize: isMobile ? 36 : 56, fontWeight: '300', letterSpacing: isMobile ? 3 : 6, textAlign: 'center', fontFamily: SERIF, marginBottom: 18,
    ...Platform.select({ web: { textShadow: '0 2px 40px rgba(233,195,73,0.12)' } as any }),
  },
  heroGoldLine: { width: 80, height: 1, marginBottom: 20, alignSelf: 'center' } as any,
  heroTagline: {
    color: TEXT_DIM, fontSize: isMobile ? 13 : 16, lineHeight: isMobile ? 22 : 28, textAlign: 'center', fontWeight: '300', letterSpacing: 0.5, maxWidth: 500,
    ...Platform.select({ web: { fontFamily: SANS } as any }),
  },
  heroFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 } as any,

  breadcrumbRow: {
    flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center',
    paddingHorizontal: isMobile ? 20 : 56, paddingVertical: 16, gap: 8,
    maxWidth: 900, width: '100%', alignSelf: 'center',
  } as any,
  breadcrumbInner: { flexDirection: 'row', alignItems: 'center', gap: 6 } as any,
  breadcrumbLink: {
    color: GOLD_DIM, fontSize: 11, fontWeight: '500', letterSpacing: 2,
    ...Platform.select({ web: { fontFamily: SANS, cursor: 'pointer' } as any }),
  },
  breadcrumbCurrent: {
    color: TEXT_MUTED, fontSize: 11, fontWeight: '500', letterSpacing: 2,
    ...Platform.select({ web: { fontFamily: SANS } as any }),
  },
  lastUpdated: {
    color: TEXT_MUTED, fontSize: 10, fontWeight: '400', letterSpacing: 1, fontStyle: 'italic',
    ...Platform.select({ web: { fontFamily: SANS } as any }),
  },

  section: { paddingVertical: isMobile ? 12 : 20, paddingHorizontal: isMobile ? 20 : 56, alignItems: 'center' } as any,
  sectionAlt: { backgroundColor: BG_SECTION_ALT },

  ctaSection: { paddingVertical: isMobile ? 48 : 72, paddingHorizontal: 24, alignItems: 'center', overflow: 'hidden' } as any,
  ctaCard: {
    alignItems: 'center', maxWidth: 440, width: '100%', zIndex: 2, backgroundColor: BG_CARD, borderRadius: 24, borderWidth: 1, borderColor: GOLD_BORDER_SUBTLE,
    paddingVertical: 40, paddingHorizontal: 28,
    ...Platform.select({ web: { backdropFilter: 'blur(20px)', boxShadow: '0 12px 48px rgba(0,0,0,0.06)' } as any }),
  } as any,
  ctaTitle: {
    color: TEXT_LIGHT, fontSize: isMobile ? 26 : 32, fontWeight: '300', letterSpacing: 3, fontFamily: SERIF, textAlign: 'center',
    ...Platform.select({ web: { textShadow: '0 2px 20px rgba(233,195,73,0.15)' } as any }),
  },
  ctaText: {
    color: TEXT_DIM, fontSize: 13, lineHeight: 22, textAlign: 'center', fontWeight: '400', marginBottom: 22, maxWidth: 340,
    ...Platform.select({ web: { fontFamily: SANS } as any }),
  },
  ctaButton: {
    paddingVertical: 14, paddingHorizontal: 36, borderRadius: 6, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  } as any,
  ctaButtonText: {
    color: '#3c2f00', fontSize: 11, fontWeight: '700', letterSpacing: 4,
    ...Platform.select({ web: { fontFamily: SANS } as any }),
  },
  ctaEmail: {
    color: GOLD_DIM, fontSize: 12, fontWeight: '500', letterSpacing: 1,
    ...Platform.select({ web: { fontFamily: SANS } as any }),
  },

  footer: { paddingVertical: 36, alignItems: 'center', backgroundColor: BG_PRIMARY } as any,
  footerLogo: { height: 36, width: 90, marginBottom: 10, opacity: 0.7 },
  footerText: {
    color: TEXT_MUTED, fontSize: 10, fontWeight: '500', letterSpacing: 2, textAlign: 'center', lineHeight: 16, textTransform: 'uppercase',
    ...Platform.select({ web: { fontFamily: SANS } as any }),
  },
});
