import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, Linking, Image, TextInput, ScrollView,
  Animated as RNAnimated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Send, MessageSquare, ChevronLeft, Bot } from 'lucide-react-native';
import { supabaseClient } from './lib/supabaseClient';

const GOLD       = '#C9A227';
const BG         = '#FDFBF7';
const BG2        = '#F8F6F0';
const CARD       = '#FFFFFF';
const BORDER_LT  = 'rgba(0,0,0,0.07)';
const TEXT       = '#1A1A1A';
const TEXT_MUTED = 'rgba(26,26,26,0.45)';

const WA_NUMBER = '918879621636';

const WA_ICON_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Ccircle cx='24' cy='24' r='24' fill='%2325D366'/%3E%3Cpath fill='%23fff' d='M34.3 13.7A14.07 14.07 0 0 0 24 9.5C16.55 9.5 10.5 15.55 10.5 23a13.44 13.44 0 0 0 1.9 6.9L10.5 38.5l8.8-2.3a13.9 13.9 0 0 0 4.7.86h.01C31.45 37.06 37.5 31 37.5 23.5a13.57 13.57 0 0 0-3.2-9.8zm-10.3 21.3a11.55 11.55 0 0 1-5.88-1.61l-.42-.25-4.36 1.14 1.16-4.25-.28-.44a11.48 11.48 0 0 1-1.77-6.14c0-6.35 5.17-11.52 11.54-11.52a11.46 11.46 0 0 1 8.16 3.38 11.47 11.47 0 0 1 3.37 8.17c0 6.36-5.17 11.52-11.52 11.52zm6.32-8.63c-.35-.17-2.05-1.01-2.37-1.13s-.55-.17-.78.17-.9 1.13-1.1 1.36-.4.26-.75.09a9.43 9.43 0 0 1-2.77-1.71 10.4 10.4 0 0 1-1.92-2.38c-.2-.35 0-.53.15-.7s.35-.4.52-.61a2.3 2.3 0 0 0 .35-.58.64.64 0 0 0-.03-.61c-.09-.17-.78-1.88-1.07-2.58s-.57-.58-.78-.59h-.66a1.28 1.28 0 0 0-.93.44 3.9 3.9 0 0 0-1.22 2.9 6.77 6.77 0 0 0 1.42 3.59c.17.23 2.42 3.7 5.87 5.19a19.7 19.7 0 0 0 1.96.72 4.72 4.72 0 0 0 2.16.14 3.58 3.58 0 0 0 2.35-1.66 2.91 2.91 0 0 0 .2-1.66c-.08-.14-.31-.23-.65-.4z'/%3E%3C/svg%3E";

const WA_OPTIONS = [
  { id: 'invest', emoji: '💼', label: 'Invest / Fund our brand', message: "Hi Daluxe! I'm interested in investing or partnering with your brand. Could you share more details about investment opportunities?" },
  { id: 'product', emoji: '🧴', label: 'Product Query', message: "Hi Daluxe! I have a question about one of your skincare products. Could you help me out?" },
  { id: 'order', emoji: '📦', label: 'Order Updates', message: "Hi Daluxe! I'd like to check on the status of my recent order. Could you please help?" },
  { id: 'general', emoji: '💬', label: 'General Inquiry', message: "Hi Daluxe! I have a general question. Could you please help me?" },
];

const openWhatsApp = (message: string) => {
  const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
  if (Platform.OS === 'web') {
    window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    Linking.openURL(url);
  }
};

type Mode = 'selection' | 'whatsapp' | 'ai';

export default function WhatsAppChat() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('selection');
  const [scaleAnim] = useState(() => new RNAnimated.Value(0));
  const [fadeAnim] = useState(() => new RNAnimated.Value(0));

  // AI Chat State
  const [messages, setMessages] = useState([
    { from: 'bot', text: "Hi! Welcome to Daluxe Support 👋 How can I help you today?" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (mode === 'ai') {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, mode]);

  const show = () => {
    setMode('selection');
    setOpen(true);
    RNAnimated.parallel([
      RNAnimated.spring(scaleAnim, { toValue: 1, tension: 65, friction: 8, useNativeDriver: true }),
      RNAnimated.timing(fadeAnim, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();
  };

  const hide = () => {
    RNAnimated.parallel([
      RNAnimated.spring(scaleAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
      RNAnimated.timing(fadeAnim, { toValue: 0, duration: 130, useNativeDriver: true }),
    ]).start(() => {
      setOpen(false);
      setMode('selection');
    });
  };

  const toggle = () => (open ? hide() : show());

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setMessages(m => [...m, { from: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      const token = session?.access_token || '';

      const apiMessages = messages
        .filter(m => m.from === 'user' || m.from === 'bot')
        .slice(-10)
        .map(m => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text }))
        .concat([{ role: 'user', content: userMsg }]);

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await res.json();
      if (data.success && data.message?.content) {
        setMessages(m => [...m, { from: 'bot', text: data.message.content }]);
      } else {
        setMessages(m => [...m, { from: 'bot', text: data.error || 'Sorry, I could not process your request right now. Please try again.' }]);
      }
    } catch (e: any) {
      setMessages(m => [...m, { from: 'bot', text: 'Connection error. Please check your internet and try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root} pointerEvents="box-none">
      {open && (
        <RNAnimated.View
          style={[
            styles.panel,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: scaleAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
              ],
            },
          ]}
        >
          {mode === 'selection' && (
            <View style={{ flex: 1 }}>
              <View style={[styles.header, { backgroundColor: BG }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.headerTitle, { color: TEXT, fontSize: 18 }]}>How can we help?</Text>
                  <Text style={{ color: TEXT_MUTED, fontSize: 12, marginTop: 4 }}>Choose a support channel</Text>
                </View>
                <TouchableOpacity onPress={hide} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <X size={20} color={TEXT} />
                </TouchableOpacity>
              </View>

              <View style={styles.optionsList}>
                <TouchableOpacity style={styles.selectionRow} activeOpacity={0.7} onPress={() => setMode('ai')}>
                  <LinearGradient colors={[GOLD, '#F0CC5E']} style={styles.iconCircle}>
                    <MessageSquare size={20} color="#1A1A1A" />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectionTitle}>AI Chat Support</Text>
                    <Text style={styles.selectionSub}>Get instant answers & skin advice</Text>
                  </View>
                  <ChevronLeft size={18} color={TEXT_MUTED} style={{ transform: [{ rotate: '180deg' }] }} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.selectionRow} activeOpacity={0.7} onPress={() => setMode('whatsapp')}>
                  <View style={[styles.iconCircle, { backgroundColor: '#25D366' }]}>
                    <Image source={{ uri: WA_ICON_URI }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectionTitle}>WhatsApp Support</Text>
                    <Text style={styles.selectionSub}>Connect with our team directly</Text>
                  </View>
                  <ChevronLeft size={18} color={TEXT_MUTED} style={{ transform: [{ rotate: '180deg' }] }} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {mode === 'whatsapp' && (
            <View style={{ flex: 1 }}>
              <View style={[styles.header, { backgroundColor: '#075E54' }]}>
                <TouchableOpacity onPress={() => setMode('selection')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <ChevronLeft size={22} color="#FFF" />
                </TouchableOpacity>
                <Image source={{ uri: WA_ICON_URI }} style={styles.headerIconWA} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.headerTitle, { color: '#FFF' }]}>WhatsApp Support</Text>
                  <View style={styles.onlineRow}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.onlineText}>Typically replies instantly</Text>
                  </View>
                </View>
              </View>

              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
                <View style={styles.bubbleRow}>
                  <Image source={{ uri: WA_ICON_URI }} style={styles.bubbleAvatar} />
                  <View style={styles.waBubble}>
                    <Text style={styles.waBubbleText}>👋 Hi there! How can we help you today?</Text>
                  </View>
                </View>

                <View style={[styles.optionsList, { marginTop: 8 }]}>
                  {WA_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.id}
                      style={styles.optionRow}
                      activeOpacity={0.7}
                      onPress={() => {
                        hide();
                        setTimeout(() => openWhatsApp(opt.message), 280);
                      }}
                    >
                      <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                      <Text style={styles.optionLabel}>{opt.label}</Text>
                      <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Powered by </Text>
                <Image source={{ uri: WA_ICON_URI }} style={styles.footerIcon} />
                <Text style={styles.footerText}> WhatsApp Business</Text>
              </View>
            </View>
          )}

          {mode === 'ai' && (
            <View style={{ flex: 1, backgroundColor: BG2 }}>
              <View style={[styles.header, { backgroundColor: BG, borderBottomWidth: 1, borderColor: BORDER_LT }]}>
                <TouchableOpacity onPress={() => setMode('selection')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <ChevronLeft size={22} color={TEXT} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.headerTitle, { color: TEXT }]}>AI Chat Support</Text>
                  <Text style={{ color: TEXT_MUTED, fontSize: 11, marginTop: 2 }}>Instant automated assistance</Text>
                </View>
              </View>

              <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
                {messages.map((m, i) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start' }}>
                    {m.from === 'bot' && (
                      <LinearGradient colors={[GOLD, '#F0CC5E']} style={{ width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 8, flexShrink: 0 }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#1A1A1A' }}>D</Text>
                      </LinearGradient>
                    )}
                    <View style={[styles.aiBubble, m.from === 'user' ? styles.userBubble : styles.botBubble]}>
                      <Text style={[{ fontSize: 13, lineHeight: 18 }, m.from === 'user' ? { color: '#1A1A1A' } : { color: TEXT }]}>{m.text}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>

              <View style={styles.inputRow}>
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder="Type a message…"
                  placeholderTextColor={TEXT_MUTED}
                  style={styles.inputField}
                  onSubmitEditing={send}
                  returnKeyType="send"
                />
                <TouchableOpacity onPress={send} disabled={loading}>
                  <LinearGradient colors={[GOLD, '#F0CC5E']} style={styles.sendBtn}>
                    <Send color="#1A1A1A" size={16} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </RNAnimated.View>
      )}

      {/* FAB - generic chat icon since it has multiple channels */}
      <TouchableOpacity onPress={toggle} activeOpacity={0.88} style={[styles.fab, open ? {} : { backgroundColor: 'transparent' }]}>
        {open ? (
          <X size={24} color="#1A1A1A" />
        ) : (
          <Image source={require('./assets/whatsapp-bot.png')} style={{ width: 60, height: 60, borderRadius: 30 }} resizeMode="contain" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    bottom: 130,
    right: 30,
    zIndex: 9999,
    alignItems: 'flex-end',
    ...Platform.select({ web: { position: 'fixed' } as any }),
  },
  panel: {
    backgroundColor: CARD,
    borderRadius: 20,
    marginBottom: 16,
    width: 340,
    height: 520, // fixed height for smooth transitions between modes
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 8px 48px rgba(0,0,0,0.18)' } as any,
      default: { elevation: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 20 },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerIconWA: { width: 36, height: 36, borderRadius: 18 },
  headerTitle: { fontWeight: '700', fontSize: 16 },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ADE80' },
  onlineText: { color: 'rgba(255,255,255,0.75)', fontSize: 11 },

  // Selection Mode
  selectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER_LT,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionTitle: { fontSize: 15, fontWeight: '600', color: TEXT, marginBottom: 4 },
  selectionSub: { fontSize: 12, color: TEXT_MUTED },

  // WhatsApp Mode
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 16, paddingBottom: 8, backgroundColor: '#E5DDD5' },
  bubbleAvatar: { width: 28, height: 28, borderRadius: 14 },
  waBubble: {
    backgroundColor: '#FFF', borderRadius: 12, borderBottomLeftRadius: 2,
    paddingHorizontal: 12, paddingVertical: 10, maxWidth: 220,
    ...Platform.select({ web: { boxShadow: '0 1px 2px rgba(0,0,0,0.1)' } as any }),
  },
  waBubbleText: { fontSize: 13, color: '#1A1A1A', lineHeight: 19 },
  optionsList: { backgroundColor: '#FFF', flex: 1 },
  optionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#EBEBEB' },
  optionEmoji: { fontSize: 18, width: 24, textAlign: 'center' },
  optionLabel: { flex: 1, fontSize: 13, color: '#1A1A1A', fontWeight: '500' },
  chevron: { fontSize: 20, color: '#25D366', fontWeight: '700', lineHeight: 22 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, backgroundColor: '#F7F7F7', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E0E0E0' },
  footerIcon: { width: 14, height: 14, borderRadius: 7, marginHorizontal: 4 },
  footerText: { fontSize: 10, color: '#999' },

  // AI Chat Mode
  aiBubble: { maxWidth: '80%', borderRadius: 16, padding: 12 },
  userBubble: { backgroundColor: GOLD, borderBottomRightRadius: 4 },
  botBubble: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER_LT, borderBottomLeftRadius: 4 },
  inputRow: { flexDirection: 'row', gap: 10, padding: 14, borderTopWidth: 1, borderColor: BORDER_LT, backgroundColor: BG, alignItems: 'center' },
  inputField: {
    flex: 1, backgroundColor: BG2, borderWidth: 1, borderColor: BORDER_LT,
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: TEXT, fontSize: 14,
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  },
  sendBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },

  // FAB
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: GOLD,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(201,162,39,0.4)', cursor: 'pointer' } as any,
      default: { elevation: 10, shadowColor: GOLD, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12 },
    }),
  },
});
