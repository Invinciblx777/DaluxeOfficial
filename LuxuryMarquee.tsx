import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SW } = Dimensions.get('window');
const isMobile = SW < 768;

const ITEMS = [
  'Paraben-Free',
  'Rose Hydrosol Infusion',
  'Ayurvedic Wisdom × Modern Science',
  'Sulfate-Free',
  'Saffron Glow Extract',
  'Luxury Botanical Skincare',
  'Alcohol-Free',
  'Licorice Brightening Complex',
  'Sensitive Skin First Formulation',
  'pH Balanced',
  'Aloe Vera Hydration Boost',
  'Clean & Conscious Beauty',
  'Dermatologically Inspired',
  'Kumkumadi Taila Blend',
  'Cruelty-Free',
  'Gold Infusion Skincare',
  'No Irritation Formula',
  'Ayurvedic Herbal Complex',
  'Suitable for Sensitive Skin',
  'Botanical Active Technology',
];

// Triplicate so the loop always has content
const ALL = [...ITEMS, ...ITEMS, ...ITEMS];

const ITEM_WIDTH = isMobile ? 220 : 320;
const TOTAL_SCROLL = ITEMS.length * ITEM_WIDTH; // scroll one full set then reset

export default function LuxuryMarquee() {
  const translateX = useRef(new Animated.Value(0)).current;
  const animRef = useRef<any>(null);

  const startAnimation = () => {
    translateX.setValue(0);
    animRef.current = Animated.loop(
      Animated.timing(translateX, {
        toValue: -TOTAL_SCROLL,
        duration: 55000,
        useNativeDriver: true,
        isInteraction: false,
      } as any)
    );
    animRef.current.start();
  };

  useEffect(() => {
    startAnimation();
    return () => { animRef.current?.stop(); };
  }, []);

  const handleMouseEnter = () => {
    if (Platform.OS === 'web') animRef.current?.stop();
  };
  const handleMouseLeave = () => {
    if (Platform.OS === 'web') startAnimation();
  };

  return (
    <View
      style={s.container}
      {...(Platform.OS === 'web'
        ? { onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave }
        : {})}
    >
      {/* edge fades */}
      <LinearGradient
        colors={['#0B0B0B', 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={s.fadeLeft}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['transparent', '#0B0B0B']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={s.fadeRight}
        pointerEvents="none"
      />

      <View style={s.overflow}>
        <Animated.View style={[s.track, { transform: [{ translateX }] }]}>
          {ALL.map((item, i) => (
            <View key={i} style={s.item}>
              <Text style={s.text}>{item}</Text>
              <Text style={s.dot}>✦</Text>
            </View>
          ))}
        </Animated.View>
      </View>
    </View>
  );
}

const SERIF = Platform.select({
  web: '"Noto Serif", Georgia, "Playfair Display", serif',
  default: undefined,
});

const s = StyleSheet.create({
  container: {
    backgroundColor: '#0B0B0B',
    paddingVertical: isMobile ? 28 : 40,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(212,175,55,0.12)',
    position: 'relative',
    width: '100%',
    ...Platform.select({ web: { overflow: 'hidden' } as any }),
  },
  overflow: {
    overflow: 'hidden',
    flexDirection: 'row',
    width: '100%',
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    width: ITEM_WIDTH,
  },
  text: {
    fontFamily: SERIF,
    fontSize: isMobile ? 13 : 17,
    fontWeight: '400',
    letterSpacing: isMobile ? 1.5 : 2.5,
    textTransform: 'uppercase',
    color: '#D4AF37',
    flexShrink: 1,
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(90deg, #D4AF37, #F5D06F, #D4AF37)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      } as any,
    }),
  },
  dot: {
    color: '#D4AF37',
    fontSize: 10,
    opacity: 0.35,
    marginHorizontal: isMobile ? 12 : 20,
  },
  fadeLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: isMobile ? 50 : 160,
    zIndex: 10,
  },
  fadeRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: isMobile ? 50 : 160,
    zIndex: 10,
  },
});
