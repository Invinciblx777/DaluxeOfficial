import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Platform,
  Dimensions,
  TextInput,
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
  FadeInLeft,
  FadeInRight,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Mail, Phone, MapPin, Clock, Send, Instagram, MessageCircle } from 'lucide-react-native';
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
const BG_INPUT = 'rgba(0, 0, 0, 0.04)';
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
// GLASS CONTACT INFO CARD
// ════════════════════════════════════════════════
const ContactInfoCard = ({ icon: Icon, title, lines, index }: { icon: any; title: string; lines: string[]; index: number }) => (
  <Animated.View entering={FadeInUp.delay(200 + index * 150).duration(700)} style={c.infoCard}>
    <View style={c.infoCardIcon}><Icon color={GOLD} size={20} /></View>
    <Text style={c.infoCardTitle}>{title}</Text>
    <LinearGradient colors={['transparent', GOLD, 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ width: 20, height: 1, marginVertical: 6 }} />
    {lines.map((line, i) => <Text key={i} style={c.infoCardLine}>{line}</Text>)}
  </Animated.View>
);

// ════════════════════════════════════════════════
// SPARKLING GOLD GRADIENT BUTTON
// ════════════════════════════════════════════════
const GoldButton = ({ label, onPress, icon }: { label: string; onPress: () => void; icon?: any }) => {
  const shimmerX = useSharedValue(-1);
  const glowOpacity = useSharedValue(0.15);

  useEffect(() => {
    shimmerX.value = withRepeat(withSequence(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }), withTiming(-1, { duration: 0 })), -1);
    glowOpacity.value = withRepeat(withSequence(withTiming(0.4, { duration: 2000, easing: Easing.inOut(Easing.ease) }), withTiming(0.15, { duration: 2000, easing: Easing.inOut(Easing.ease) })), -1, true);
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmerX.value, [-1, 1], [-200, 200]) }],
    opacity: interpolate(shimmerX.value, [-1, -0.3, 0, 0.3, 1], [0, 0, 0.6, 0, 0]),
  }));

  const glowStyle = useAnimatedStyle(() => ({
    ...Platform.select({
      web: { boxShadow: `0 0 40px -8px rgba(233, 195, 73, ${glowOpacity.value})` } as any,
    }),
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: glowOpacity.value,
    shadowRadius: 20,
  }));

  return (
    <Animated.View style={glowStyle}>
      <TouchableOpacity style={c.goldBtn} onPress={onPress} activeOpacity={0.85}>
        <LinearGradient colors={[GOLD, '#524000']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFillObject, { borderRadius: 6 }]} />
        <Animated.View style={[c.goldBtnShimmer, shimmerStyle]} pointerEvents="none">
          <LinearGradient colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ width: 80, height: '100%' }} />
        </Animated.View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={c.goldBtnText}>{label}</Text>
          {icon}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════
export default function ContactPage({ externalScrollY, onNavigate }: { externalScrollY?: any, onNavigate?: (page: string) => void }) {
  const internalScrollY = useSharedValue(0);
  const scrollY = externalScrollY || internalScrollY;
  const scrollHandler = useAnimatedScrollHandler({ onScroll: (e) => { scrollY.value = e.contentOffset.y; } });

  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const heroParallax = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(scrollY.value, [0, 400], [0, -80], Extrapolation.CLAMP) }],
    opacity: interpolate(scrollY.value, [0, 350], [1, 0.2], Extrapolation.CLAMP),
  }));

  const handleSubmit = () => { if (formData.name && formData.email && formData.message) setSubmitted(true); };

  return (
    <Animated.ScrollView onScroll={scrollHandler} scrollEventThrottle={16} style={{ flex: 1, backgroundColor: BG_PRIMARY }} showsVerticalScrollIndicator={false}>

      {/* ═══ HERO ═══ */}
      <View style={c.heroSection}>
        <LinearGradient colors={['#FDFBF7', '#F4EFEA', '#FDFBF7']} style={StyleSheet.absoluteFillObject} />
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(233,195,73,0.04)' }]} />
        <Animated.View style={[c.heroContent, heroParallax]}>
          <Animated.View entering={FadeInDown.duration(900)}><Text style={c.heroEyebrow}>GET IN TOUCH</Text></Animated.View>
          <Animated.View entering={FadeInDown.delay(200).duration(900)}><Text style={c.heroTitle}>Contact</Text></Animated.View>
          <Animated.View entering={FadeInDown.delay(400).duration(900)}><LinearGradient colors={['transparent', GOLD, 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={c.heroGoldLine} /></Animated.View>
          <Animated.View entering={FadeInDown.delay(600).duration(900)}><Text style={c.heroTagline}>We would love to hear from you.{'\n'}Every inquiry receives our full attention.</Text></Animated.View>
        </Animated.View>
        <LinearGradient colors={['transparent', BG_PRIMARY]} style={c.heroFade} />
      </View>

      {/* ═══ INFO CARDS ═══ */}
      <View style={c.section}>
        <Animated.View entering={FadeInDown.duration(600)}><Text style={c.sectionEyebrow}>OTHER WAYS TO REACH US</Text><GoldDivider width={40} /></Animated.View>
        <View style={c.infoCardsRow}>
          <ContactInfoCard icon={Mail} title="Email" lines={['mydaluxe@gmail.com']} index={0} />
          <ContactInfoCard icon={Phone} title="Phone" lines={['+91 8879621636']} index={1} />
          <ContactInfoCard icon={MapPin} title="Address" lines={['Near by - Tasmia medical', 'Mahim East, Mumbai 400017']} index={2} />
          <ContactInfoCard icon={Clock} title="Hours" lines={['Mon–Sat, 10:00 AM–7:00 PM IST']} index={3} />
        </View>
      </View>

      {/* ═══ SOCIAL ═══ */}
      <View style={c.section}>
        <Animated.View entering={FadeInDown.duration(600)}>
          <Text style={c.sectionEyebrow}>FOLLOW US</Text>
          <GoldDivider width={40} />
          <Text style={c.socialTitle}>Stay Connected</Text>
          <Text style={c.socialSubtitle}>Follow our journey and be the first{'\n'}to know about new launches.</Text>
        </Animated.View>
        <View style={c.socialRow}>
          {[
            { icon: Instagram, label: 'Instagram', handle: '@daluxe.in' },
            { icon: MessageCircle, label: 'WhatsApp', handle: '+91 8879621636' },
            { icon: Mail, label: 'Email', handle: 'mydaluxe@gmail.com' },
          ].map((social, i) => (
            <Animated.View key={i} entering={FadeInUp.delay(200 + i * 150).duration(600)} style={c.socialCard}>
              <View style={c.socialIconWrap}><social.icon color={GOLD} size={22} /></View>
              <Text style={c.socialLabel}>{social.label}</Text>
              <Text style={c.socialHandle}>{social.handle}</Text>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* ═══ CLOSING ═══ */}
      <View style={c.closingBand}>
        <LinearGradient colors={['#FDFBF7', '#FAF9F6', '#FDFBF7']} style={StyleSheet.absoluteFillObject} />
        <Animated.View entering={FadeInDown.duration(700)} style={c.closingContent}>
          <Text style={c.closingText}>Your skin deserves the finest care — and so do you.</Text>
          <Text style={c.closingSignature}>DA LUXE — Luxury, Redefined.</Text>
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
const c = StyleSheet.create({
  heroSection: { height: isMobile ? 400 : 520, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  heroContent: { alignItems: 'center', paddingHorizontal: 24, zIndex: 2 },
  heroEyebrow: { color: GOLD, fontSize: 12, fontWeight: '600', letterSpacing: 6, textTransform: 'uppercase', marginBottom: 14, textAlign: 'center', ...Platform.select({ web: { textShadow: '0 0 30px rgba(233,195,73,0.5)' } as any }) },
  heroTitle: { color: WHITE, fontSize: isMobile ? 42 : 68, fontWeight: '300', letterSpacing: isMobile ? 4 : 8, textAlign: 'center', fontFamily: SERIF, marginBottom: 20, ...Platform.select({ web: { textShadow: '0 2px 40px rgba(233,195,73,0.15)' } as any }) },
  heroGoldLine: { width: 80, height: 1, marginBottom: 24, alignSelf: 'center' },
  heroTagline: { color: TEXT_DIM, fontSize: isMobile ? 14 : 17, lineHeight: isMobile ? 22 : 28, textAlign: 'center', fontWeight: '300', letterSpacing: 1, maxWidth: 440 },
  heroFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 },

  section: { paddingVertical: isMobile ? 44 : 64, paddingHorizontal: isMobile ? 20 : 56, alignItems: 'center' },
  sectionEyebrow: { color: GOLD, fontSize: 10, fontWeight: '600', letterSpacing: 5, textTransform: 'uppercase', textAlign: 'center', marginBottom: 6 },

  infoCardsRow: { flexDirection: isMobile ? 'column' : 'row', flexWrap: 'wrap', justifyContent: 'center', gap: isMobile ? 14 : 18, maxWidth: 1060, width: '100%', marginTop: 8 },
  infoCard: {
    flex: isMobile ? undefined : 1, minWidth: isMobile ? '100%' : 210, maxWidth: isMobile ? '100%' : 250,
    alignItems: 'center', padding: 24, backgroundColor: BG_CARD, borderRadius: 18, borderWidth: 1, borderColor: GOLD_BORDER_SUBTLE,
    ...Platform.select({ web: { backdropFilter: 'blur(16px)', boxShadow: '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)', transition: 'transform 0.3s ease' } as any }),
  },
  infoCardIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: GOLD_GLOW, borderWidth: 1, borderColor: GOLD_BORDER,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    ...Platform.select({ web: { boxShadow: '0 0 20px rgba(233,195,73,0.15)' } as any }),
  },
  infoCardTitle: { color: TEXT_LIGHT, fontSize: 12, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  infoCardLine: { color: TEXT_DIM, fontSize: 12, lineHeight: 18, textAlign: 'center', fontWeight: '400' },

  formBlock: { flexDirection: 'row', maxWidth: 1060, width: '100%', gap: 40, alignItems: 'flex-start' },
  formBlockMobile: { flexDirection: 'column', width: '100%', gap: 28 },
  formTitle: { color: TEXT_LIGHT, fontSize: isMobile ? 24 : 30, fontWeight: '300', fontFamily: SERIF, letterSpacing: 1, marginBottom: 24 },
  form: { gap: 18 },
  formRow: { flexDirection: isMobile ? 'column' : 'row', gap: 14 },
  inputGroup: { marginBottom: 0 },
  inputLabel: { color: TEXT_MUTED, fontSize: 10, fontWeight: '500', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8, marginLeft: 2 },
  input: {
    backgroundColor: BG_INPUT, borderBottomWidth: 1, borderBottomColor: BORDER_SUBTLE,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: TEXT_LIGHT, fontWeight: '400' as const,
    ...Platform.select({ web: { outlineStyle: 'none', transition: 'border-color 0.5s ease' } as any }),
  } as any,
  inputFocused: { borderBottomColor: GOLD },
  focusLine: {
    height: 1, width: '0%' as any, backgroundColor: GOLD,
    ...Platform.select({ web: { transition: 'width 0.7s ease' } as any }),
  } as any,
  focusLineActive: { width: '100%' as any } as any,
  textarea: { minHeight: 120, paddingTop: 14 },

  goldBtn: {
    paddingVertical: 16, paddingHorizontal: 32, borderRadius: 4, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start', marginTop: 12,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  goldBtnShimmer: { position: 'absolute', top: 0, bottom: 0, width: 80, left: '50%' },
  goldBtnText: { color: '#3c2f00', fontSize: 12, fontWeight: '700', letterSpacing: 3, textTransform: 'uppercase' },

  successBlock: {
    alignItems: 'center', paddingVertical: 44, paddingHorizontal: 24, backgroundColor: BG_CARD, borderRadius: 18, borderWidth: 1, borderColor: GOLD_BORDER_SUBTLE,
    ...Platform.select({ web: { backdropFilter: 'blur(16px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' } as any }),
  },
  successTitle: { color: TEXT_LIGHT, fontSize: 22, fontWeight: '300', fontFamily: SERIF, letterSpacing: 2, marginBottom: 10 },
  successText: { color: TEXT_DIM, fontSize: 13, lineHeight: 20, textAlign: 'center', fontWeight: '400', marginBottom: 20, maxWidth: 320 },

  assuranceCard: {
    backgroundColor: BG_CARD, borderRadius: 20, borderWidth: 1, borderColor: GOLD_BORDER_SUBTLE,
    padding: isMobile ? 24 : 32,
    ...Platform.select({ web: { backdropFilter: 'blur(16px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)' } as any }),
  },
  assuranceTitle: { color: TEXT_LIGHT, fontSize: isMobile ? 24 : 28, fontWeight: '300', fontFamily: SERIF, letterSpacing: 2, lineHeight: isMobile ? 32 : 38, ...Platform.select({ web: { textShadow: '0 2px 20px rgba(233,195,73,0.1)' } as any }) },
  assuranceItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  assuranceNum: { color: GOLD, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: 2, width: 18, ...Platform.select({ web: { textShadow: '0 0 10px rgba(233,195,73,0.3)' } as any }) },
  assuranceText: { color: TEXT_DIM, fontSize: 13, lineHeight: 20, fontWeight: '400', flex: 1 },
  assuranceFooter: { color: TEXT_MUTED, fontSize: 11, lineHeight: 16, fontWeight: '500', letterSpacing: 1, textAlign: 'center' },

  socialTitle: { color: TEXT_LIGHT, fontSize: isMobile ? 24 : 32, fontWeight: '300', letterSpacing: 2, textAlign: 'center', fontFamily: SERIF, marginBottom: 10 },
  socialSubtitle: { color: TEXT_DIM, fontSize: 13, lineHeight: 20, textAlign: 'center', fontWeight: '400', marginBottom: 28 },
  socialRow: { flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 14 : 20, justifyContent: 'center', maxWidth: 750, width: '100%' },
  socialCard: {
    flex: isMobile ? undefined : 1, alignItems: 'center', padding: 24, backgroundColor: BG_CARD, borderRadius: 18, borderWidth: 1, borderColor: GOLD_BORDER_SUBTLE,
    ...Platform.select({ web: { backdropFilter: 'blur(16px)', boxShadow: '0 4px 24px rgba(0,0,0,0.2)', transition: 'transform 0.3s ease' } as any }),
  },
  socialIconWrap: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: GOLD_GLOW, borderWidth: 1, borderColor: GOLD_BORDER,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    ...Platform.select({ web: { boxShadow: '0 0 20px rgba(233,195,73,0.12)' } as any }),
  },
  socialLabel: { color: TEXT_LIGHT, fontSize: 12, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  socialHandle: { color: TEXT_DIM, fontSize: 12, fontWeight: '400' },

  closingBand: { paddingVertical: isMobile ? 44 : 64, paddingHorizontal: 24, alignItems: 'center', overflow: 'hidden' },
  closingContent: {
    alignItems: 'center', maxWidth: 460, zIndex: 2, backgroundColor: BG_CARD, borderRadius: 22, borderWidth: 1, borderColor: GOLD_BORDER_SUBTLE,
    paddingVertical: 36, paddingHorizontal: 28,
    ...Platform.select({ web: { backdropFilter: 'blur(20px)', boxShadow: '0 12px 48px rgba(0,0,0,0.3)' } as any }),
  },
  closingText: { color: TEXT_DIM, fontSize: isMobile ? 16 : 18, lineHeight: isMobile ? 26 : 30, textAlign: 'center', fontWeight: '300', fontFamily: SERIF, fontStyle: 'italic', marginBottom: 18 },
  closingSignature: { color: GOLD, fontSize: 12, fontWeight: '600', letterSpacing: 4, textTransform: 'uppercase', ...Platform.select({ web: { textShadow: '0 0 20px rgba(233,195,73,0.3)' } as any }) },

  footer: { paddingVertical: 36, alignItems: 'center', backgroundColor: BG_PRIMARY },
  footerLogo: { height: 36, width: 90, marginBottom: 10, opacity: 0.7 },
  footerText: { color: TEXT_MUTED, fontSize: 10, fontWeight: '500', letterSpacing: 2, textAlign: 'center', lineHeight: 16, textTransform: 'uppercase' },
});
