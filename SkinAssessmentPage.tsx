import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, TextInput, Platform, Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat,
  withSequence, withDelay, Easing, FadeInDown, FadeInUp, FadeIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowRight, ArrowLeft, Check, Sun, Moon, Mail, Download, X,
  ChevronRight, ScanFace, Droplet, Wind, Scale, Flower2, Sparkles,
  Zap, CircleDot, Eye, Waves, Flame, Clock, Glasses, Leaf, Globe,
  Lock, LucideIcon,
} from 'lucide-react-native';
import { Footer } from './Footer';

const { width: SW, height: SH } = Dimensions.get('window');
const isMob = SW < 768;

// ── Palette ─────────────────────────────────────────────────────
const GOLD       = '#C9A84C';
const GOLD_LIGHT = '#E7C873';
const GOLD_DEEP  = '#8A6914';
const GOLD_GLOW  = 'rgba(201,168,76,0.12)';
const GOLD_BDR   = 'rgba(201,168,76,0.22)';
const BG         = '#F5F0EB';
const CARD       = '#FFFFFF';
const DARK       = '#1A1208';
const DIM        = 'rgba(26,18,8,0.55)';
const MUTED      = 'rgba(26,18,8,0.35)';
const SERIF      = Platform.select({ web: '"Cormorant Garamond", "Noto Serif", Georgia, serif', default: undefined });
const WEB        = (o: any) => Platform.select({ web: o as any }) as any;

// ── Reusable: Gold Next Button ───────────────────────────────────
const GoldBtn = ({ label, onPress, icon, disabled, size = 'md' }: {
  label: string; onPress: () => void; icon?: LucideIcon; disabled?: boolean; size?: 'md' | 'lg';
}) => (
  <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.85}
    style={{ opacity: disabled ? 0.4 : 1, borderRadius: 40, overflow: 'hidden',
      shadowColor: GOLD, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8 }}>
    <LinearGradient colors={['#EDD37A', '#C9A84C', '#8A6914']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: size === 'lg' ? 17 : 13, paddingHorizontal: size === 'lg' ? 36 : 24 }}>
      <Text style={{ color: '#1A1208', fontWeight: '700', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' }}>{label}</Text>
      {icon && React.createElement(icon, { color: '#1A1208', size: 15 })}
    </LinearGradient>
  </TouchableOpacity>
);

const GhostBtn = ({ label, onPress, icon }: { label: string; onPress: () => void; icon?: LucideIcon }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.75}
    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 13, paddingHorizontal: 22,
      borderRadius: 40, borderWidth: 1, borderColor: GOLD_BDR, backgroundColor: 'transparent' }}>
    {icon && React.createElement(icon, { color: GOLD, size: 15 })}
    <Text style={{ color: DARK, fontWeight: '500', fontSize: 12, letterSpacing: 0.5 }}>{label}</Text>
  </TouchableOpacity>
);

const GoldDivider = ({ width: w = 60 }: { width?: number }) => (
  <View style={{ alignItems: 'center', marginVertical: 12 }}>
    <LinearGradient colors={['transparent', GOLD, 'transparent']}
      start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
      style={{ width: w, height: 1 }} />
  </View>
);

// ── Progress Bar ─────────────────────────────────────────────────
const ProgressBar = ({ step, total }: { step: number; total: number }) => {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(step / total, { duration: 500, easing: Easing.out(Easing.ease) });
  }, [step]);
  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` as any }));
  return (
    <View style={{ paddingHorizontal: isMob ? 20 : 40, paddingVertical: 14, backgroundColor: BG }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ color: MUTED, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>
          Step {step} of {total}
        </Text>
        <Text style={{ color: GOLD, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
          {Math.round((step / total) * 100)}%
        </Text>
      </View>
      <View style={{ height: 3, backgroundColor: 'rgba(201,168,76,0.15)', borderRadius: 3, overflow: 'hidden' }}>
        <Animated.View style={[{ height: '100%', borderRadius: 3 }, barStyle]}>
          <LinearGradient colors={['#EDD37A', GOLD]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
        </Animated.View>
      </View>
    </View>
  );
};

// ── Option Card (matches reference) ─────────────────────────────
const OptionCard = ({ icon: Icon, label, desc, active, onPress }: {
  icon: LucideIcon; label: string; desc: string; active: boolean; onPress: () => void;
}) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.82}
    style={[{
      flexDirection: 'row', alignItems: 'center', gap: 16,
      paddingVertical: 18, paddingHorizontal: 20,
      borderRadius: 16, borderWidth: 1,
      backgroundColor: CARD,
      borderColor: active ? GOLD : 'rgba(201,168,76,0.15)',
      ...WEB({
        boxShadow: active
          ? '0 4px 20px rgba(201,168,76,0.18)'
          : '0 2px 10px rgba(0,0,0,0.04)',
        transition: 'all 0.2s cubic-bezier(0.25,0.46,0.45,0.94)',
      }),
    }]}>
    {/* Icon circle */}
    <View style={{
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: active ? GOLD_GLOW : 'rgba(201,168,76,0.07)',
      borderWidth: 1, borderColor: active ? GOLD_BDR : 'rgba(201,168,76,0.12)',
      justifyContent: 'center', alignItems: 'center',
    }}>
      <Icon color={GOLD} size={20} strokeWidth={1.5} />
    </View>
    {/* Text */}
    <View style={{ flex: 1 }}>
      <Text style={{ color: DARK, fontSize: 13, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 3 }}>
        {label}
      </Text>
      <Text style={{ color: DIM, fontSize: 12, lineHeight: 17 }}>{desc}</Text>
    </View>
    {/* Arrow */}
    <ArrowRight color={active ? GOLD : MUTED} size={16} strokeWidth={1.8} />
  </TouchableOpacity>
);

// ── STEP 1 — Skin Type ───────────────────────────────────────────
const SKIN_TYPES = [
  { id: 'oily',        label: 'Oily',        desc: 'Shiny T-zone, prone to breakouts',  icon: Droplet },
  { id: 'dry',         label: 'Dry',         desc: 'Tight, flaky, or rough texture',    icon: Wind },
  { id: 'combination', label: 'Combination', desc: 'Oily T-zone, dry cheeks',           icon: Scale },
  { id: 'sensitive',   label: 'Sensitive',   desc: 'Easily irritated or red',           icon: Flower2 },
  { id: 'unsure',      label: 'Not Sure',    desc: 'Let our AI figure it out',          icon: Sparkles },
];

const Step1 = ({ value, onSelect }: any) => (
  <View>
    <Text style={s.stepTitle}>What's your{'\n'}skin type?</Text>
    <Text style={s.stepSub}>Select the option that best describes your skin on an average day.</Text>
    <View style={{ gap: 10, marginTop: 20 }}>
      {SKIN_TYPES.map(t => (
        <OptionCard key={t.id} icon={t.icon} label={t.label} desc={t.desc}
          active={value === t.id} onPress={() => onSelect(t.id)} />
      ))}
    </View>
  </View>
);

// ── STEP 2 — Concerns ────────────────────────────────────────────
const CONCERNS_LIST = [
  { id: 'acne',       label: 'Acne',         desc: 'Breakouts and blemishes',         icon: Zap },
  { id: 'darkspots',  label: 'Dark Spots',   desc: 'Uneven patches and marks',        icon: CircleDot },
  { id: 'pigment',    label: 'Pigmentation', desc: 'Uneven skin tone',                icon: Eye },
  { id: 'dullness',   label: 'Dullness',     desc: 'Lack of radiance and glow',       icon: Sparkles },
  { id: 'pores',      label: 'Large Pores',  desc: 'Visible or enlarged pores',       icon: Waves },
  { id: 'wrinkles',   label: 'Fine Lines',   desc: 'Early aging and expression lines', icon: Wind },
  { id: 'redness',    label: 'Redness',      desc: 'Flushing or irritation',          icon: Flame },
];

const Step2 = ({ value, onToggle }: any) => (
  <View>
    <Text style={s.stepTitle}>What concerns{'\n'}you most?</Text>
    <Text style={s.stepSub}>Select all that apply — our AI will prioritize these.</Text>
    <View style={{ gap: 10, marginTop: 20 }}>
      {CONCERNS_LIST.map(c => (
        <OptionCard key={c.id} icon={c.icon} label={c.label} desc={c.desc}
          active={value.includes(c.id)} onPress={() => onToggle(c.id)} />
      ))}
    </View>
  </View>
);

// ── STEP 3 — Lifestyle ───────────────────────────────────────────
const LIFESTYLE_SECTIONS = [
  { key: 'sleep', label: 'Hours of sleep per night', icon: Moon, options: ['< 5 hrs', '5–6 hrs', '7–8 hrs', '8+ hrs'] },
  { key: 'water', label: 'Daily water intake',        icon: Droplet, options: ['< 1L', '1–2L', '2–3L', '3L+'] },
  { key: 'sun',   label: 'Sun exposure',              icon: Sun,    options: ['Minimal', 'Moderate', 'High', 'Extreme'] },
  { key: 'env',   label: 'Environment',               icon: Globe,  options: ['City', 'Suburban', 'Rural', 'Coastal'] },
];

const Step3 = ({ value, onChange }: any) => (
  <View>
    <Text style={s.stepTitle}>Your{'\n'}Lifestyle</Text>
    <Text style={s.stepSub}>These factors significantly shape your skin's health.</Text>
    <View style={{ marginTop: 20, gap: 28 }}>
      {LIFESTYLE_SECTIONS.map(sec => (
        <View key={sec.key}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <sec.icon color={GOLD} size={14} strokeWidth={1.8} />
            <Text style={{ color: DARK, fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' }}>
              {sec.label}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {sec.options.map(opt => {
              const active = value[sec.key] === opt;
              return (
                <TouchableOpacity key={opt} onPress={() => onChange({ ...value, [sec.key]: opt })} activeOpacity={0.8}
                  style={{
                    paddingVertical: 10, paddingHorizontal: 20, borderRadius: 24,
                    borderWidth: 1,
                    borderColor: active ? GOLD : 'rgba(201,168,76,0.25)',
                    backgroundColor: active ? CARD : 'transparent',
                    ...WEB({ boxShadow: active ? '0 2px 12px rgba(201,168,76,0.15)' : 'none', transition: 'all 0.18s ease' }),
                  }}>
                  <Text style={{ color: active ? DARK : DIM, fontSize: 13, fontWeight: active ? '600' : '400' }}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  </View>
);

// ── STEP 4 — Photo Upload ────────────────────────────────────────
const Step4 = ({ onSkip }: any) => (
  <View>
    <Text style={s.stepTitle}>Skin Photo{'\n'}Analysis</Text>
    <Text style={s.stepSub}>Optional — Upload a selfie for AI visual skin detection.</Text>
    <View style={[s.uploadBox, { marginTop: 24 }]}>
      <View style={{
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: GOLD_GLOW, borderWidth: 1, borderColor: GOLD_BDR,
        justifyContent: 'center', alignItems: 'center', marginBottom: 20,
      }}>
        <ScanFace color={GOLD} size={34} strokeWidth={1.2} />
      </View>
      <Text style={{ color: DARK, fontSize: 16, fontWeight: '600', marginBottom: 6, textAlign: 'center' }}>
        Upload a clear selfie
      </Text>
      <Text style={{ color: DIM, fontSize: 13, textAlign: 'center', lineHeight: 20, maxWidth: 280 }}>
        No photo is stored or shared. Used only for AI skin analysis.
      </Text>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
        <GoldBtn label="Choose Photo" onPress={() => {}} icon={ArrowRight} />
      </View>
    </View>
    <TouchableOpacity onPress={onSkip} style={{ marginTop: 18, alignItems: 'center' }}>
      <Text style={{ color: MUTED, fontSize: 12, letterSpacing: 0.3 }}>Skip — continue without photo</Text>
    </TouchableOpacity>
  </View>
);

// ── STEP 5 — Basic Info ──────────────────────────────────────────
const Step5 = ({ value, onChange }: any) => (
  <View>
    <Text style={s.stepTitle}>Almost{'\n'}there.</Text>
    <Text style={s.stepSub}>We'll personalize your report and send it straight to you.</Text>
    <View style={{ gap: 16, marginTop: 24 }}>
      <View>
        <Text style={s.inputLabel}>Your Name</Text>
        <TextInput value={value.name} onChangeText={(v) => onChange({ ...value, name: v })}
          placeholder="e.g. Priya Sharma" placeholderTextColor={MUTED} style={s.input} />
      </View>
      <View>
        <Text style={s.inputLabel}>Email Address</Text>
        <TextInput value={value.email} onChangeText={(v) => onChange({ ...value, email: v })}
          placeholder="priya@email.com" placeholderTextColor={MUTED}
          keyboardType="email-address" autoCapitalize="none" style={s.input} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10,
        padding: 16, borderRadius: 14, backgroundColor: 'rgba(201,168,76,0.06)',
        borderWidth: 1, borderColor: GOLD_BDR }}>
        <Lock color={GOLD} size={14} strokeWidth={1.8} style={{ marginTop: 1 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: DARK, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
            Privacy Assured
          </Text>
          <Text style={{ color: DIM, fontSize: 12, lineHeight: 18 }}>
            Your data stays private. We only use it to generate your skin report — never sold or shared.
          </Text>
        </View>
      </View>
    </View>
  </View>
);

// ── Analysis Loading ─────────────────────────────────────────────
const LOAD_MSGS = [
  'Analyzing your skin profile…',
  'Detecting skin concerns…',
  'Mapping your skin type…',
  'Generating personalized routine…',
  'Finding the best DaLuxe products…',
];

const AnalysisScreen = ({ onDone }: { onDone: () => void }) => {
  const [msgIdx, setMsgIdx] = useState(0);
  const progress = useSharedValue(0);
  const glow = useSharedValue(0.5);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 3800, easing: Easing.out(Easing.ease) });
    glow.value = withRepeat(withSequence(
      withTiming(1, { duration: 900 }),
      withTiming(0.4, { duration: 900 }),
    ), -1, true);
    const interval = setInterval(() => setMsgIdx(i => (i >= LOAD_MSGS.length - 1 ? i : i + 1)), 760);
    const timer = setTimeout(onDone, 3900);
    return () => { clearInterval(interval); clearTimeout(timer); };
  }, []);

  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` as any }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <View style={{ flex: 1, backgroundColor: BG, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
      <Animated.View style={[{ marginBottom: 36 }, glowStyle]}>
        <View style={{ width: 100, height: 100, borderRadius: 50,
          backgroundColor: GOLD_GLOW, borderWidth: 1, borderColor: GOLD_BDR,
          justifyContent: 'center', alignItems: 'center',
          ...WEB({ boxShadow: '0 0 60px rgba(201,168,76,0.25)' }) }}>
          <ScanFace color={GOLD} size={48} strokeWidth={1} />
        </View>
      </Animated.View>
      <Text style={{ color: DARK, fontSize: isMob ? 22 : 28, fontWeight: '300', fontFamily: SERIF, textAlign: 'center', marginBottom: 6 }}>
        DaLuxe AI Analysis
      </Text>
      <GoldDivider width={60} />
      <Text style={{ color: DIM, fontSize: 13, marginTop: 8, marginBottom: 32, textAlign: 'center', letterSpacing: 0.3 }}>
        {LOAD_MSGS[msgIdx]}
      </Text>
      <View style={{ width: '100%', maxWidth: 320, height: 3, borderRadius: 3,
        backgroundColor: 'rgba(201,168,76,0.15)', overflow: 'hidden', marginBottom: 10 }}>
        <Animated.View style={[{ height: '100%', borderRadius: 3 }, barStyle]}>
          <LinearGradient colors={['#EDD37A', GOLD, GOLD_DEEP]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
        </Animated.View>
      </View>
      <Text style={{ color: MUTED, fontSize: 11, letterSpacing: 1 }}>Processing your skin data…</Text>
    </View>
  );
};

// ── Results ──────────────────────────────────────────────────────
const MOCK_RESULTS = {
  skinType: 'Combination',
  confidence: 87,
  concerns: [
    { label: 'Dullness', pct: 72, color: GOLD },
    { label: 'Pigmentation', pct: 58, color: '#B8962E' },
    { label: 'Acne', pct: 40, color: '#8A5A19' },
    { label: 'Dark Spots', pct: 35, color: '#A07828' },
  ],
  morningRoutine: ['Gold Glow Face Wash', 'Ultra Sensitive Serum', 'Hydrating Moisturiser', 'SPF 50 Sunscreen'],
  nightRoutine: ['Gold Glow Face Wash', 'Repair Night Cream', 'Rosehip Oil'],
  products: [
    { id: 1, name: 'GOLD GLOW\nFACE WASH',      price: '₹249', img: require('./assets/facewash_main.png') },
    { id: 2, name: 'ULTRA SENSITIVE\nFACE SERUM', price: '₹449', img: require('./assets/faceserum_main.png') },
    { id: 3, name: 'REPAIR NIGHT\nCREAM',         price: '₹399', img: require('./assets/nightcream_main.png') },
  ],
};

const ConcernBar = ({ label, pct, color }: any) => {
  const bar = useSharedValue(0);
  useEffect(() => { bar.value = withDelay(200, withTiming(pct / 100, { duration: 900, easing: Easing.out(Easing.ease) })); }, []);
  const barStyle = useAnimatedStyle(() => ({ width: `${bar.value * 100}%` as any }));
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ color: DARK, fontSize: 13, fontWeight: '600' }}>{label}</Text>
        <Text style={{ color, fontSize: 13, fontWeight: '700' }}>{pct}%</Text>
      </View>
      <View style={{ height: 5, backgroundColor: 'rgba(201,168,76,0.12)', borderRadius: 5, overflow: 'hidden' }}>
        <Animated.View style={[{ height: '100%', borderRadius: 5, backgroundColor: color }, barStyle]} />
      </View>
    </View>
  );
};

const RoutineItem = ({ step: stepNum, label }: any) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: GOLD_GLOW,
      borderWidth: 1, borderColor: GOLD_BDR, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: GOLD, fontSize: 10, fontWeight: '700' }}>{stepNum}</Text>
    </View>
    <Text style={{ color: DARK, fontSize: 13, flex: 1 }}>{label}</Text>
    <ChevronRight color={MUTED} size={13} />
  </View>
);

const ResultsPage = ({ name, onEmailReport, onNavigate }: any) => {
  const r = MOCK_RESULTS;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#2A1F10', '#110C07']}
        style={{ paddingTop: isMob ? 56 : 72, paddingBottom: 36, paddingHorizontal: isMob ? 24 : 40, alignItems: 'center' }}>
        <Animated.View entering={FadeInDown.duration(700)} style={{ alignItems: 'center' }}>
          <Text style={{ color: GOLD_LIGHT, fontSize: 10, fontWeight: '700', letterSpacing: 5, textTransform: 'uppercase', marginBottom: 10 }}>
            Your Skin Report
          </Text>
          <Text style={{ color: '#FFF', fontSize: isMob ? 26 : 36, fontWeight: '300', fontFamily: SERIF, textAlign: 'center' }}>
            {name ? `Hello, ${name}` : 'Your DaLuxe Report'}
          </Text>
          <GoldDivider width={80} />
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', marginTop: 4, letterSpacing: 0.5 }}>
            Powered by DaLuxe AI Skin Intelligence
          </Text>
        </Animated.View>
      </LinearGradient>

      <View style={{ padding: isMob ? 20 : 40, gap: 20 }}>
        <Animated.View entering={FadeInUp.delay(100).duration(600)} style={s.resultCard}>
          <Text style={s.resultCardEye}>Skin Summary</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            <View>
              <Text style={{ color: MUTED, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>Your Skin Type</Text>
              <Text style={{ color: DARK, fontSize: 24, fontWeight: '700', fontFamily: SERIF }}>{r.skinType}</Text>
            </View>
            <View style={{ padding: 16, backgroundColor: GOLD_GLOW, borderRadius: 16, borderWidth: 1, borderColor: GOLD_BDR, alignItems: 'center' }}>
              <Text style={{ color: GOLD, fontSize: 22, fontWeight: '700' }}>{r.confidence}%</Text>
              <Text style={{ color: MUTED, fontSize: 9, fontWeight: '600', letterSpacing: 1.5, marginTop: 2 }}>CONFIDENCE</Text>
            </View>
          </View>
          <View style={{ marginTop: 16, padding: 14, backgroundColor: 'rgba(201,168,76,0.06)', borderRadius: 12, borderWidth: 1, borderColor: GOLD_BDR }}>
            <Text style={{ color: DIM, fontSize: 13, lineHeight: 20 }}>
              Your skin shows a mix of oily and dry zones with an oily T-zone and balanced cheeks. Requires lightweight hydration and oil-control without stripping.
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={s.resultCard}>
          <Text style={s.resultCardEye}>Detected Concerns</Text>
          <View style={{ marginTop: 16 }}>
            {r.concerns.map(c => <ConcernBar key={c.label} {...c} />)}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(600)} style={s.resultCard}>
          <Text style={s.resultCardEye}>Recommended Routine</Text>
          <View style={{ flexDirection: isMob ? 'column' : 'row', gap: 20, marginTop: 16 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Sun color={GOLD} size={14} strokeWidth={1.8} />
                <Text style={{ color: DARK, fontWeight: '700', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' }}>Morning</Text>
              </View>
              {r.morningRoutine.map((item, i) => <RoutineItem key={i} step={i + 1} label={item} />)}
            </View>
            <View style={{ width: isMob ? '100%' : 1, height: isMob ? 1 : undefined, backgroundColor: GOLD_BDR }} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Moon color={GOLD} size={14} strokeWidth={1.8} />
                <Text style={{ color: DARK, fontWeight: '700', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' }}>Night</Text>
              </View>
              {r.nightRoutine.map((item, i) => <RoutineItem key={i} step={i + 1} label={item} />)}
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(600)} style={s.resultCard}>
          <Text style={s.resultCardEye}>DaLuxe Picks For You</Text>
          <Text style={{ color: DIM, fontSize: 12, marginTop: 4, marginBottom: 16 }}>Products formulated for your exact skin profile</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
            {r.products.map(p => (
              <View key={p.id} style={{ width: 150, borderRadius: 16, overflow: 'hidden',
                borderWidth: 1, borderColor: GOLD_BDR, backgroundColor: CARD,
                ...WEB({ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }) }}>
                <Image source={p.img} style={{ width: 150, height: 150 }} resizeMode="contain" />
                <View style={{ padding: 12 }}>
                  <Text style={{ color: GOLD, fontSize: 8, fontWeight: '700', letterSpacing: 2.5, textTransform: 'uppercase' }}>DALUXE</Text>
                  <Text style={{ color: DARK, fontSize: 11, fontWeight: '700', marginTop: 3, lineHeight: 16 }}>{p.name}</Text>
                  <Text style={{ color: GOLD, fontSize: 14, fontWeight: '700', marginTop: 6 }}>{p.price}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500).duration(600)} style={{ flexDirection: isMob ? 'column' : 'row', gap: 12 }}>
          <GoldBtn label="Download Report" onPress={() => {}} icon={Download} size="lg" />
          <GhostBtn label="Send to Email" onPress={onEmailReport} icon={Mail} />
        </Animated.View>
      </View>
      <Footer onNavigate={onNavigate} />
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

// ── Hero ─────────────────────────────────────────────────────────
const HeroSection = ({ onStart }: { onStart: () => void }) => {
  const float = useSharedValue(0);
  useEffect(() => {
    float.value = withRepeat(withSequence(
      withTiming(-10, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
      withTiming(0, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
    ), -1, true);
  }, []);
  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: float.value }] }));

  return (
    <View style={{ flex: 1, minHeight: SH, backgroundColor: BG }}>
      {/* Mobile background image */}
      {isMob && (
        <Image
          source={require('./assets/backgroundskinassesment-mobile.png')}
          style={StyleSheet.absoluteFillObject as any}
          resizeMode="cover"
        />
      )}
      {/* Soft light overlay so text stays legible */}
      {isMob && (
        <View style={[StyleSheet.absoluteFillObject as any, { backgroundColor: 'rgba(245,240,235,0.45)' }]} />
      )}
      {/* Desktop background image */}
      {!isMob && (
        <Image
          source={require('./assets/bgdesktopskinassesment.png')}
          style={StyleSheet.absoluteFillObject as any}
          resizeMode="cover"
        />
      )}
      {!isMob && (
        <View style={[StyleSheet.absoluteFillObject as any, { backgroundColor: 'rgba(245,240,235,0.40)' }]} />
      )}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: isMob ? 28 : 60 }}>
        <Animated.View entering={FadeInDown.duration(800)} style={{ alignItems: 'center' }}>
          <Text style={{ color: GOLD, fontSize: 10, fontWeight: '700', letterSpacing: 5, textTransform: 'uppercase', marginBottom: 16 }}>
            DaLuxe AI
          </Text>
        </Animated.View>
        <Animated.View style={floatStyle}>
          <View style={{ width: 96, height: 96, borderRadius: 48,
            backgroundColor: GOLD_GLOW, borderWidth: 1, borderColor: GOLD_BDR,
            justifyContent: 'center', alignItems: 'center', marginBottom: 28,
            ...WEB({ boxShadow: '0 0 60px rgba(201,168,76,0.2)' }) }}>
            <ScanFace color={GOLD} size={46} strokeWidth={1} />
          </View>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(200).duration(800)} style={{ alignItems: 'center' }}>
          <Text style={{ color: DARK, fontSize: isMob ? 36 : 52, fontWeight: '300', fontFamily: SERIF,
            textAlign: 'center', lineHeight: isMob ? 44 : 64, letterSpacing: 1, marginBottom: 20 }}>
            AI Skin{'\n'}Assessment
          </Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(400).duration(800)} style={{ alignItems: 'center' }}>
          <GoldDivider width={80} />
          <Text style={{ color: DIM, fontSize: isMob ? 14 : 17, textAlign: 'center', lineHeight: isMob ? 22 : 28,
            fontWeight: '300', maxWidth: 400, marginBottom: 36, marginTop: 4 }}>
            Discover your skin type and personalized{'\n'}DaLuxe routine in 5 minutes
          </Text>
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(600).duration(700)} style={{ alignItems: 'center', gap: 14 }}>
          <GoldBtn label="Start Free Assessment" icon={ArrowRight} size="lg" onPress={onStart} />
          <View style={{ flexDirection: 'row', gap: 24, marginTop: 12 }}>
            {['2 minutes', 'Free', 'Personalized'].map(t => (
              <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Check color={GOLD} size={11} strokeWidth={2.5} />
                <Text style={{ color: MUTED, fontSize: 12, fontWeight: '500' }}>{t}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

// ── Main ─────────────────────────────────────────────────────────
type Phase = 'hero' | 'form' | 'loading' | 'results';

export default function SkinAssessmentPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [phase, setPhase] = useState<Phase>('hero');
  const [step, setStep] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [skinType, setSkinType] = useState('');
  const [concerns, setConcerns] = useState<string[]>([]);
  const [lifestyle, setLifestyle] = useState({ sleep: '', water: '', sun: '', env: '' });
  const [info, setInfo] = useState({ name: '', email: '' });
  const TOTAL_STEPS = 5;

  const toggleConcern = (id: string) =>
    setConcerns(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);

  const canAdvance = () => {
    if (step === 1) return !!skinType;
    if (step === 2) return concerns.length > 0;
    if (step === 3) return !!(lifestyle.sleep && lifestyle.water && lifestyle.sun);
    if (step === 4) return true;
    if (step === 5) return !!(info.name && info.email);
    return false;
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep(s => s + 1);
    else setPhase('loading');
  };

  if (phase === 'loading') return <AnalysisScreen onDone={() => setPhase('results')} />;
  if (phase === 'results') return (
    <View style={{ flex: 1 }}>
      <ResultsPage name={info.name} onEmailReport={() => setShowModal(true)} onNavigate={onNavigate} />
    </View>
  );
  if (phase === 'hero') return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <HeroSection onStart={() => setPhase('form')} />
    </ScrollView>
  );

  const renderStep = () => {
    switch (step) {
      case 1: return <Step1 value={skinType} onSelect={setSkinType} />;
      case 2: return <Step2 value={concerns} onToggle={toggleConcern} />;
      case 3: return <Step3 value={lifestyle} onChange={setLifestyle} />;
      case 4: return <Step4 onSkip={() => setStep(5)} />;
      case 5: return <Step5 value={info} onChange={setInfo} />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Mobile background image on form steps */}
      {isMob && (
        <Image
          source={require('./assets/backgroundskinassesment-mobile.png')}
          style={[StyleSheet.absoluteFillObject as any, { opacity: 0.35 }]}
          resizeMode="cover"
        />
      )}
      {/* Desktop background image on form steps */}
      {!isMob && (
        <Image
          source={require('./assets/bgdesktopskinassesment.png')}
          style={[StyleSheet.absoluteFillObject as any, { opacity: 0.30 }]}
          resizeMode="cover"
        />
      )}
      <ProgressBar step={step} total={TOTAL_STEPS} />
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: isMob ? 24 : 48, paddingBottom: 120, maxWidth: 680, alignSelf: 'center', width: '100%' }}>
        <Animated.View key={step} entering={FadeIn.duration(320)}>
          {renderStep()}
        </Animated.View>
      </ScrollView>

      {/* Sticky footer — matches reference exactly */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: BG, paddingHorizontal: isMob ? 20 : 40, paddingVertical: 16,
        borderTopWidth: 1, borderTopColor: 'rgba(201,168,76,0.12)',
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      }}>
        {step > 1
          ? <GhostBtn label="Back" onPress={() => setStep(s => s - 1)} icon={ArrowLeft} />
          : <View />
        }
        <GoldBtn
          label={step === TOTAL_STEPS ? 'Analyse My Skin' : 'Next'}
          icon={step === TOTAL_STEPS ? ScanFace : ArrowRight}
          disabled={!canAdvance()}
          onPress={handleNext}
          size="lg"
        />
      </View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────
const s = StyleSheet.create({
  stepTitle: {
    color: DARK, fontSize: isMob ? 28 : 36, fontWeight: '300',
    fontFamily: SERIF, lineHeight: isMob ? 36 : 46, marginBottom: 10,
  },
  stepSub: {
    color: DIM, fontSize: 13, lineHeight: 21, marginBottom: 4,
  },
  uploadBox: {
    borderRadius: 20, borderWidth: 1.5,
    borderStyle: 'dashed' as const,
    borderColor: GOLD_BDR,
    padding: isMob ? 32 : 52,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(201,168,76,0.03)',
  },
  inputLabel: {
    color: DARK, fontSize: 11, fontWeight: '600', marginBottom: 8,
    letterSpacing: 1, textTransform: 'uppercase' as const,
  },
  input: {
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.28)', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    color: DARK, fontSize: 14, backgroundColor: CARD,
    ...WEB({ outline: 'none', fontFamily: 'inherit' }),
  },
  resultCard: {
    backgroundColor: CARD, borderRadius: 20, padding: isMob ? 20 : 28,
    borderWidth: 1, borderColor: GOLD_BDR,
    ...WEB({ backdropFilter: 'blur(20px)', boxShadow: '0 4px 24px rgba(0,0,0,0.05)' }),
  },
  resultCardEye: {
    color: GOLD, fontSize: 10, fontWeight: '700', letterSpacing: 3, textTransform: 'uppercase' as const,
  },
});
