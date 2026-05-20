import React, { useEffect, useRef } from 'react';
import { View, Image, Text, StyleSheet, Platform, Animated } from 'react-native';

interface Props {
  onDone: () => void;
}

const PulseDot = ({ delay }: { delay: number }) => {
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1.3, duration: 400, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1,   duration: 400, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 0.5, duration: 400, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.4, duration: 400, useNativeDriver: true }),
        ]),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return <Animated.View style={[styles.dot, { transform: [{ scale }], opacity }]} />;
};

export default function SplashLoader({ onDone }: Props) {
  const rootOpacity  = useRef(new Animated.Value(1)).current;
  const logoScale    = useRef(new Animated.Value(0.78)).current;
  const logoOpacity  = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const dotsOpacity  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Logo pops in
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(logoScale,   { toValue: 1, tension: 55, friction: 8, useNativeDriver: true }),
    ]).start();

    // 2. Tagline + dots fade in shortly after
    const t1 = setTimeout(() =>
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(dotsOpacity,    { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start()
    , 380);

    // 3. Fade everything out and call onDone
    const t2 = setTimeout(() =>
      Animated.timing(rootOpacity, { toValue: 0, duration: 450, useNativeDriver: true })
        .start(() => onDone())
    , 1900);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <Animated.View style={[styles.root, { opacity: rootOpacity }]} pointerEvents="none">
      <View style={styles.glow} />

      <Animated.Image
        source={require('./assets/logo.png')}
        style={[styles.logo, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}
        resizeMode="contain"
      />

      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        DERMAL-GRADE BOTANICALS
      </Animated.Text>

      <Animated.View style={[styles.dotsRow, { opacity: dotsOpacity }]}>
        <PulseDot delay={0} />
        <PulseDot delay={160} />
        <PulseDot delay={320} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F4EE',
    zIndex: 99999,
    ...Platform.select({ web: { position: 'fixed' } as any }),
  },
  glow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(233,195,73,0.09)',
    ...Platform.select({
      web: { boxShadow: '0 0 100px 60px rgba(233,195,73,0.13)' } as any,
    }),
  },
  logo: {
    width: 210,
    height: 84,
    marginBottom: 20,
  },
  tagline: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 4,
    color: '#B8962E',
    textTransform: 'uppercase',
    marginBottom: 28,
    ...Platform.select({ web: { fontFamily: 'Georgia, serif' } as any }),
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#D4AF37',
  },
});
