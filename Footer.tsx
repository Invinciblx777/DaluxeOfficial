import React from 'react';
import { View, Text, Image, TouchableOpacity, Platform, Dimensions, ImageBackground } from 'react-native';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(Dimensions.get('window').width < 768);
  React.useEffect(() => {
    const handleResize = () => setIsMobile(Dimensions.get('window').width < 768);
    if (Platform.OS === 'web') window.addEventListener('resize', handleResize);
    return () => {
      if (Platform.OS === 'web') window.removeEventListener('resize', handleResize);
    };
  }, []);
  return isMobile;
};

const footerLinkStyle = {
  color: 'rgba(255,255,255,0.6)',
  fontSize: 13,
  letterSpacing: 0.5,
  ...Platform.select({ web: { cursor: 'pointer', transition: 'color 0.3s ease' } as any }),
} as any;

export const Footer = ({ onNavigate }: { onNavigate?: (page: string) => void }) => {
  const nav = (page: string) => onNavigate?.(page);
  const isMobile = useIsMobile();
  return (
    <ImageBackground
      source={require('./assets/footer.jpg')}
      style={{ width: '100%', alignItems: 'center' }}
      imageStyle={{ resizeMode: 'cover', width: '100%', height: '100%' }}
    >
      <View style={{
        backgroundColor: 'rgba(5, 11, 20, 0.82)',
        paddingVertical: 80,
        paddingHorizontal: 20,
        alignItems: 'center',
        width: '100%',
      }}>
        <Image
          source={require('./assets/logo.png')}
          style={{ width: 140, height: 46, marginBottom: 32 }}
          resizeMode="contain"
          tintColor="#E9C349"
        />

        <View style={{
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 32 : 64,
          marginBottom: 48,
          width: '100%',
          maxWidth: 800,
          justifyContent: 'center',
          alignItems: isMobile ? 'center' : 'flex-start',
        }}>
          {/* Shop Links */}
          <View style={{ alignItems: isMobile ? 'center' : 'flex-start', gap: 12 }}>
            <Text style={{ color: '#E9C349', fontSize: 10, fontWeight: '700', letterSpacing: 4, marginBottom: 4 }}>SHOP</Text>
            <TouchableOpacity onPress={() => nav('collection')}><Text style={footerLinkStyle}>Collections</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => nav('our-story')}><Text style={footerLinkStyle}>Our Story</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => nav('contact')}><Text style={footerLinkStyle}>Contact</Text></TouchableOpacity>
          </View>
          {/* Legal Links */}
          <View style={{ alignItems: isMobile ? 'center' : 'flex-start', gap: 12 }}>
            <Text style={{ color: '#E9C349', fontSize: 10, fontWeight: '700', letterSpacing: 4, marginBottom: 4 }}>LEGAL</Text>
            <TouchableOpacity onPress={() => nav('terms')}><Text style={footerLinkStyle}>Terms & Conditions</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => nav('privacy-policy')}><Text style={footerLinkStyle}>Privacy Policy</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => nav('refund-policy')}><Text style={footerLinkStyle}>Refund Policy</Text></TouchableOpacity>
          </View>
          {/* Support Links */}
          <View style={{ alignItems: isMobile ? 'center' : 'flex-start', gap: 12 }}>
            <Text style={{ color: '#E9C349', fontSize: 10, fontWeight: '700', letterSpacing: 4, marginBottom: 4 }}>SUPPORT</Text>
            <TouchableOpacity onPress={() => nav('return-policy')}><Text style={footerLinkStyle}>Return Policy</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => nav('shipping-policy')}><Text style={footerLinkStyle}>Shipping Policy</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => nav('login')}><Text style={footerLinkStyle}>My Account</Text></TouchableOpacity>
          </View>
        </View>

        <View style={{ width: '100%', maxWidth: 800, height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 40 }} />

        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 24, letterSpacing: 1, textAlign: 'center' }}>
          © {new Date().getFullYear()} Daluxe Luxury Skincare. All rights reserved.
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: 0.5 }}>Designed and powered by</Text>
          <Image
            source={require('./assets/elevexsocialslogo.png')}
            style={{ width: 100, height: 26, opacity: 0.8 }}
            resizeMode="contain"
          />
        </View>
      </View>
    </ImageBackground>
  );
};

export default Footer;
