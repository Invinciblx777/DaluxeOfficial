import React, { useState } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  StyleSheet, Dimensions, Platform, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft, Check, ChevronRight, ShoppingCart, Package, Star,
  Truck, Shield, Gift, Leaf,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { COMBOS_DATA, ProductType } from './CollectionPage';

const { width: SW } = Dimensions.get('window');
const isMob = SW < 768;

export type ComboId = 'skin-combo' | 'hair-combo';

// ─── Palette ────────────────────────────────────────────────────
const GOLD       = '#C9A84C';
const GOLD_LIGHT = '#EDD37A';
const GOLD_DEEP  = '#8A6914';
const GOLD_GLOW  = 'rgba(201,168,76,0.12)';
const GOLD_BDR   = 'rgba(201,168,76,0.22)';
const BG         = '#FDFBF7';
const DARK       = '#1A1208';
const DIM        = 'rgba(26,18,8,0.55)';
const MUTED      = 'rgba(26,18,8,0.35)';
const SERIF      = Platform.select({ web: '"Cormorant Garamond", Georgia, serif', default: undefined });
const WEB        = (o: any) => Platform.select({ web: o as any }) as any;

// Removed local COMBOS data — now using centralized COMBOS_DATA from CollectionPage.tsx

// ─── Helpers ────────────────────────────────────────────────────
const GoldBtn = ({ label, onPress, icon, full }: { label: string; onPress: () => void; icon?: any; full?: boolean }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.85}
    style={[{ borderRadius: 36, overflow: 'hidden', ...(full ? { width: '100%' } : {}) },
      WEB({ boxShadow: '0 6px 24px rgba(201,168,76,0.35)' })]}>
    <LinearGradient colors={['#EDD37A', '#C9A84C', '#8A6914']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        paddingVertical: 17, paddingHorizontal: 36 }}>
      {icon && React.createElement(icon, { color: '#1A1208', size: 17, strokeWidth: 2 })}
      <Text style={{ color: '#1A1208', fontSize: 12, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' }}>{label}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

// ─── Main Page ───────────────────────────────────────────────────
export default function ComboDetailPage({
  comboId,
  onBack,
  onAddToCart,
}: {
  comboId: ComboId;
  onBack: () => void;
  onAddToCart: (item: any) => void;
}) {
  const combo = (COMBOS_DATA as any)[comboId];
  if (!combo) return null;
  const [pincode, setPincode] = useState('');
  const [delivery, setDelivery] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'routine' | 'ingredients'>('details');

  const checkDelivery = () => {
    if (pincode.length === 6) {
      setDelivery(`Estimated delivery in 4–6 business days to ${pincode}`);
    }
  };

  const handleAddToCart = () => {
    onAddToCart({
      id: combo.id,
      shortName: combo.displayName || combo.name,
      priceDisplay: combo.priceDisplay,
      price: combo.price,
      image: combo.image,
      sizeDetail: combo.includes
        ? combo.includes.map((i: any) => i.name).join(' + ')
        : combo.sizeDetail || '',
      subtitle: combo.subtitle,
      category: 'combo',
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── Hero ── */}
        <View style={{ backgroundColor: combo.themeBg }}>
          {/* Back */}
          <TouchableOpacity onPress={onBack}
            style={{ position: 'absolute', top: isMob ? 52 : 24, left: 20, zIndex: 10,
              flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ArrowLeft color={DARK} size={18} strokeWidth={1.8} />
            <Text style={{ color: DARK, fontSize: 12, fontWeight: '600', letterSpacing: 0.5 }}>Collections</Text>
          </TouchableOpacity>

          {/* Hero image */}
          <View style={{ alignItems: 'center', paddingTop: isMob ? 90 : 60, paddingBottom: 0 }}>
            <Animated.View entering={FadeInDown.duration(600)}>
              <Image source={combo.image}
                style={{ width: isMob ? SW - 40 : 480, height: isMob ? SW - 40 : 480 }}
                resizeMode="contain" />
            </Animated.View>
          </View>
        </View>

        {/* ── Product Info ── */}
        <View style={{ padding: isMob ? 20 : 40, maxWidth: 900, alignSelf: 'center', width: '100%' }}>

          {/* Breadcrumb + tag */}
          <Animated.View entering={FadeInUp.delay(100).duration(500)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Text style={{ color: MUTED, fontSize: 11, letterSpacing: 0.5 }}>Collection</Text>
              <ChevronRight color={MUTED} size={12} />
              <Text style={{ color: combo.themeColor, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                {combo.tag}
              </Text>
            </View>

            <Text style={{ color: MUTED, fontSize: 10, fontWeight: '800', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>
              D A LUXE — VIRGIN 5.0
            </Text>
            <Text style={{ color: DARK, fontSize: isMob ? 28 : 38, fontWeight: '300', fontFamily: SERIF, lineHeight: isMob ? 36 : 48, marginBottom: 8 }}>
              {combo.name}
            </Text>
            <Text style={{ color: DIM, fontSize: 14, marginBottom: 16, lineHeight: 22 }}>{combo.subtitle}</Text>

            {/* Stars */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', gap: 2 }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} color={GOLD} fill={i < Math.floor(combo.rating) ? GOLD : 'none'}
                    size={14} strokeWidth={1.5} />
                ))}
              </View>
              <Text style={{ color: DIM, fontSize: 12 }}>{combo.rating} · {(combo.reviews as any[])?.length || 0} reviews</Text>
            </View>

            {/* Price row */}
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
              <Text style={{ color: DARK, fontSize: 28, fontWeight: '700' }}>{combo.priceDisplay}</Text>
              <Text style={{ color: MUTED, fontSize: 14, textDecorationLine: 'line-through' }}>{combo.mrp}</Text>
              <View style={{ backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ color: '#2E7D32', fontSize: 11, fontWeight: '800' }}>22% OFF</Text>
              </View>
            </View>

            {/* Free badge */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20,
              padding: 12, borderRadius: 12, backgroundColor: GOLD_GLOW, borderWidth: 1, borderColor: GOLD_BDR }}>
              <Gift color={GOLD} size={16} strokeWidth={1.8} />
              <Text style={{ color: DARK, fontSize: 12, fontWeight: '600', flex: 1 }}>{combo.freeBadge}</Text>
            </View>
          </Animated.View>

          {/* ── What's Inside ── */}
          <Animated.View entering={FadeInUp.delay(150).duration(500)}
            style={{ marginBottom: 24, padding: 20, borderRadius: 20, backgroundColor: '#FFF',
              borderWidth: 1, borderColor: GOLD_BDR, ...WEB({ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }) }}>
            <Text style={{ color: MUTED, fontSize: 10, fontWeight: '800', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 14 }}>
              What's Inside
            </Text>
            {combo.includes.map((item, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10,
                paddingBottom: i < combo.includes.length - 1 ? 10 : 0,
                borderBottomWidth: i < combo.includes.length - 1 ? 1 : 0,
                borderBottomColor: 'rgba(201,168,76,0.12)' }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: GOLD_GLOW,
                  borderWidth: 1, borderColor: GOLD_BDR, justifyContent: 'center', alignItems: 'center' }}>
                  <Package color={GOLD} size={14} strokeWidth={1.5} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: DARK, fontSize: 13, fontWeight: '600' }}>{item.name}</Text>
                  <Text style={{ color: item.size.includes('FREE') ? combo.themeColor : MUTED,
                    fontSize: 11, fontWeight: item.size.includes('FREE') ? '800' : '400', marginTop: 2 }}>
                    {item.size}
                  </Text>
                </View>
                {item.size.includes('FREE') && (
                  <View style={{ backgroundColor: combo.themeColor, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                    <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '800', letterSpacing: 1 }}>FREE</Text>
                  </View>
                )}
              </View>
            ))}
          </Animated.View>

          {/* ── Add to Cart CTA ── */}
          <Animated.View entering={FadeInUp.delay(200).duration(500)} style={{ marginBottom: 20, gap: 12 }}>
            <GoldBtn label="Add Combo to Cart" onPress={handleAddToCart} icon={ShoppingCart} full />

            {/* Trust badges */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: isMob ? 20 : 36, paddingVertical: 12,
              borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(201,168,76,0.15)' }}>
              {[
                { icon: Truck, text: 'Free Delivery' },
                { icon: Shield, text: 'Authentic' },
                { icon: Leaf, text: 'Natural' },
              ].map(({ icon: Icon, text }) => (
                <View key={text} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon color={GOLD} size={13} strokeWidth={1.8} />
                  <Text style={{ color: DIM, fontSize: 11, fontWeight: '600' }}>{text}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* ── Delivery Checker ── */}
          <Animated.View entering={FadeInUp.delay(220).duration(500)}
            style={{ marginBottom: 24, padding: 18, borderRadius: 18, backgroundColor: '#FFF',
              borderWidth: 1, borderColor: GOLD_BDR, ...WEB({ boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }) }}>
            <Text style={{ color: DARK, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
              Check Delivery
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <TextInput
                value={pincode}
                onChangeText={v => { setPincode(v.replace(/\D/g, '').slice(0, 6)); setDelivery(null); }}
                placeholder="Enter 6-digit pincode"
                placeholderTextColor={MUTED}
                keyboardType="numeric"
                style={{ flex: 1, borderWidth: 1, borderColor: GOLD_BDR, borderRadius: 12,
                  paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: DARK,
                  backgroundColor: BG, ...WEB({ outline: 'none', fontFamily: 'inherit' }) }}
              />
              <TouchableOpacity onPress={checkDelivery} style={{ borderRadius: 12, overflow: 'hidden' }}>
                <LinearGradient colors={['#EDD37A', '#C9A84C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{ paddingHorizontal: 18, paddingVertical: 12 }}>
                  <Text style={{ color: '#1A1208', fontSize: 12, fontWeight: '800', letterSpacing: 1 }}>CHECK</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            {delivery && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <Check color="#2E7D32" size={14} strokeWidth={2.5} />
                <Text style={{ color: '#2E7D32', fontSize: 12, fontWeight: '600' }}>{delivery}</Text>
              </View>
            )}
          </Animated.View>

          {/* ── Tabs ── */}
          <View style={{ flexDirection: 'row', gap: 4, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: GOLD_BDR }}>
            {(['details', 'routine', 'ingredients'] as const).map(tab => (
              <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}
                style={{ paddingVertical: 12, paddingHorizontal: 16, marginBottom: -1,
                  borderBottomWidth: 2,
                  borderBottomColor: activeTab === tab ? GOLD : 'transparent' }}>
                <Text style={{ color: activeTab === tab ? GOLD : MUTED,
                  fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  {tab === 'details' ? 'Benefits' : tab === 'routine' ? 'How to Use' : 'Ingredients'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab content */}
          {activeTab === 'details' && (
            <Animated.View entering={FadeInDown.duration(350)}>
              <View style={{ gap: 10 }}>
                {combo.benefits.map((b, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: GOLD_GLOW,
                      borderWidth: 1, borderColor: GOLD_BDR, justifyContent: 'center', alignItems: 'center', marginTop: 1 }}>
                      <Check color={GOLD} size={11} strokeWidth={2.5} />
                    </View>
                    <Text style={{ color: DARK, fontSize: 14, lineHeight: 22, flex: 1 }}>{b}</Text>
                  </View>
                ))}
              </View>
              {/* Tags */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
                {combo.tags.map(t => (
                  <View key={t} style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16,
                    borderWidth: 1, borderColor: GOLD_BDR, backgroundColor: GOLD_GLOW }}>
                    <Text style={{ color: GOLD, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>{t}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {activeTab === 'routine' && (
            <Animated.View entering={FadeInDown.duration(350)}>
              {combo.routine.map((phase, pi) => (
                <View key={pi} style={{ marginBottom: 24 }}>
                  <Text style={{ color: GOLD, fontSize: 11, fontWeight: '800', letterSpacing: 2,
                    textTransform: 'uppercase', marginBottom: 12 }}>{phase.time}</Text>
                  {phase.steps.map((step, si) => (
                    <View key={si} style={{ flexDirection: 'row', gap: 14, marginBottom: 10 }}>
                      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: GOLD_GLOW,
                        borderWidth: 1, borderColor: GOLD_BDR, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: GOLD, fontSize: 10, fontWeight: '800' }}>{si + 1}</Text>
                      </View>
                      <Text style={{ color: DARK, fontSize: 14, flex: 1, lineHeight: 22 }}>{step}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </Animated.View>
          )}

          {activeTab === 'ingredients' && (
            <Animated.View entering={FadeInDown.duration(350)}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {combo.ingredients.map((ing, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8,
                    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
                    backgroundColor: '#FFF', borderWidth: 1, borderColor: GOLD_BDR }}>
                    <Leaf color={GOLD} size={12} strokeWidth={1.8} />
                    <Text style={{ color: DARK, fontSize: 12, fontWeight: '500' }}>{ing}</Text>
                  </View>
                ))}
              </View>
              <View style={{ marginTop: 20, padding: 16, borderRadius: 14, backgroundColor: GOLD_GLOW,
                borderWidth: 1, borderColor: GOLD_BDR }}>
                <Text style={{ color: DARK, fontSize: 12, lineHeight: 20, fontStyle: 'italic' }}>
                  Dermal-grade botanical formula. Free from harsh chemicals. Safe for regular use on sensitive skin.
                </Text>
              </View>
            </Animated.View>
          )}
        </View>
      </ScrollView>

      {/* ── Sticky Footer ── */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: BG, paddingHorizontal: isMob ? 16 : 40, paddingVertical: 14,
        borderTopWidth: 1, borderTopColor: GOLD_BDR,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        ...WEB({ backdropFilter: 'blur(16px)', boxShadow: '0 -4px 24px rgba(0,0,0,0.06)' }) }}>
        <View>
          <Text style={{ color: MUTED, fontSize: 10, letterSpacing: 0.5 }}>D A LUXE</Text>
          <Text style={{ color: DARK, fontSize: 13, fontWeight: '700', maxWidth: isMob ? 160 : 280 }} numberOfLines={1}>
            {combo.name}
          </Text>
          <Text style={{ color: GOLD, fontSize: 16, fontWeight: '700' }}>{combo.priceDisplay}</Text>
        </View>
        <GoldBtn label="Add to Cart" onPress={handleAddToCart} icon={ShoppingCart} />
      </View>
    </View>
  );
}
