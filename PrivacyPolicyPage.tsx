import React from 'react';
import { View, Text, StyleSheet, Platform, Dimensions } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, Eye, Share2, Lock, Clock, UserCheck, FileCheck, Bell, AlertTriangle, Sparkles } from 'lucide-react-native';
import LegalPageShell, { GoldDivider, BG_CARD, GOLD, GOLD_DIM, GOLD_GLOW, GOLD_BORDER, GOLD_BORDER_SUBTLE, TEXT_LIGHT, TEXT_DIM, TEXT_MUTED, SERIF, SANS } from './LegalPageShell';

const { width: SW } = Dimensions.get('window');
const isMobile = SW < 768;

const PRIVACY_SECTIONS = [
  { icon: Eye, title: 'Introduction', content: 'DA LUXE ("DA LUXE", "we", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our Platform and purchase our products.\n\nBy using the Platform, you consent to the practices described in this Policy.' },
  { icon: Shield, title: 'Data We Collect', content: 'We collect the following types of information:\n\n• Personal Information: Name, email address, phone number, shipping address\n• Payment Information: Processed securely via PhonePe — we never store card details\n• Device Information: Browser type, IP address, device identifiers\n• Usage Data: Pages visited, time spent, click patterns\n• Communication Data: Customer service correspondence, reviews, feedback' },
  { icon: Share2, title: 'How We Use Your Data', content: 'Your information is used to:\n\n• Process and fulfill your orders\n• Send order confirmations and delivery updates\n• Provide personalized product recommendations\n• Improve our Platform and user experience\n• Communicate promotional offers (with your consent)\n• Prevent fraud and ensure Platform security\n• Comply with legal obligations' },
  { icon: UserCheck, title: 'Data Sharing', content: 'We do not sell your personal data to third parties. We may share information with:\n\n• Payment Processors: PhonePe for secure transaction processing\n• Shipping Partners: Shiprocket and courier services for delivery\n• Analytics Providers: To understand usage patterns and improve services\n• Legal Authorities: When required by law or to protect our rights\n\nAll third-party partners are bound by confidentiality agreements.' },
  { icon: Lock, title: 'Security Practices', content: 'We implement industry-standard security measures including:\n\n• SSL/TLS encryption for all data transmission\n• Supabase Authentication for secure access control\n• Row Level Security (RLS) on our database\n• Regular security audits and vulnerability assessments\n• Access controls limiting employee data access\n• Encrypted storage for sensitive information' },
  { icon: Clock, title: 'Data Retention & Deletion', content: 'We retain your personal data only as long as necessary to fulfill the purposes outlined in this Policy:\n\n• Account data: Until you request deletion\n• Order history: 7 years (legal/tax requirements)\n• Communication logs: 3 years\n• Analytics data: 2 years (anonymized)\n\nYou may request deletion of your data at any time by contacting mydaluxe@gmail.com.' },
  { icon: FileCheck, title: 'Your Rights', content: 'Under applicable Indian privacy laws, you have the right to:\n\n• Access your personal data held by us\n• Correct inaccurate or incomplete data\n• Request deletion of your personal data\n• Withdraw consent for marketing communications\n• Object to processing of your data\n• Request a copy of your data in a portable format\n\nTo exercise any of these rights, contact us at mydaluxe@gmail.com.' },
  { icon: Bell, title: 'Consent', content: 'By using the Platform and providing your personal information, you consent to the collection, use, and sharing of your information as described in this Privacy Policy.\n\nYou may withdraw your consent at any time by contacting us. Withdrawal of consent will not affect the lawfulness of processing based on consent before its withdrawal.' },
  { icon: AlertTriangle, title: 'Policy Updates', content: 'We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.\n\nWe encourage you to review this Privacy Policy periodically for any changes. Changes are effective when posted on this page.' },
  { icon: Sparkles, title: 'Grievance Officer', content: 'In accordance with the Information Technology Act, 2000 and rules made thereunder, the name and contact details of the Grievance Officer are as follows:\n\nName: Grievance Officer, DA LUXE\nEmail: mydaluxe@gmail.com\nPhone: +91 8879621636\nAddress: Near by - Tasmia medical, mahim east mumbai 400017\n\nThe Grievance Officer shall address complaints within 30 days of receipt.' },
];

export default function PrivacyPolicyPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  return (
    <LegalPageShell
      eyebrow="YOUR DATA"
      title="Privacy Policy"
      tagline="How we collect, use, and protect your personal information."
      lastUpdated="April 14, 2026"
      breadcrumb="Privacy Policy"
      onNavigate={onNavigate}
    >
      <View style={p.contentWrap}>
        {PRIVACY_SECTIONS.map((section, i) => {
          const Icon = section.icon;
          return (
            <Animated.View key={i} entering={FadeInUp.delay(80 + i * 60).duration(500)} style={p.card}>
              <View style={p.cardHeader}>
                <View style={p.iconWrap}>
                  <Icon color={GOLD} size={20} />
                </View>
                <View style={p.cardHeaderText}>
                  <Text style={p.cardNum}>{String(i + 1).padStart(2, '0')}</Text>
                  <Text style={p.cardTitle}>{section.title}</Text>
                </View>
              </View>
              <LinearGradient colors={['transparent', GOLD, 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ width: 40, height: 1, marginVertical: 14, alignSelf: 'flex-start', marginLeft: isMobile ? 0 : 64 } as any} />
              <View style={p.cardBody}>
                {section.content.split('\n\n').map((para, j) => (
                  <Text key={j} style={[p.bodyText, para.startsWith('•') && p.bulletBlock]}>{para}</Text>
                ))}
              </View>
            </Animated.View>
          );
        })}
      </View>
    </LegalPageShell>
  );
}

const p = StyleSheet.create({
  contentWrap: { maxWidth: 800, width: '100%', alignSelf: 'center', paddingHorizontal: isMobile ? 16 : 40, paddingVertical: isMobile ? 16 : 28, gap: 16 } as any,
  card: {
    backgroundColor: BG_CARD, borderRadius: 18, borderWidth: 1, borderColor: GOLD_BORDER_SUBTLE,
    padding: isMobile ? 18 : 24,
    ...Platform.select({ web: { backdropFilter: 'blur(12px)', boxShadow: '0 2px 16px rgba(0,0,0,0.03)', transition: 'transform 0.3s ease, box-shadow 0.3s ease' } as any }),
  } as any,
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 } as any,
  iconWrap: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: GOLD_GLOW, borderWidth: 1, borderColor: GOLD_BORDER,
    justifyContent: 'center', alignItems: 'center',
    ...Platform.select({ web: { boxShadow: '0 0 16px rgba(233,195,73,0.12)' } as any }),
  } as any,
  cardHeaderText: { flex: 1 } as any,
  cardNum: { color: GOLD_DIM, fontSize: 10, fontWeight: '700', letterSpacing: 3, marginBottom: 2, ...Platform.select({ web: { fontFamily: SANS } as any }) },
  cardTitle: { color: TEXT_LIGHT, fontSize: 16, fontWeight: '600', letterSpacing: 0.3, ...Platform.select({ web: { fontFamily: SANS } as any }) },
  cardBody: { paddingLeft: isMobile ? 0 : 58 },
  bodyText: { color: TEXT_DIM, fontSize: 13, lineHeight: 22, fontWeight: '400', marginBottom: 10, ...Platform.select({ web: { fontFamily: SANS } as any }) },
  bulletBlock: { paddingLeft: 4 },
});
