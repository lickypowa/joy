import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '@/design-system/tokens';
import { JoyCoreView } from '@/design-system/JoyCoreView';
import { router } from 'expo-router';

export default function Home() {
  return (
    <View style={s.screen}>
      <View style={s.top}>
        <Text style={s.logo}>
          JOY<Text style={s.dot}>.</Text>
        </Text>
        <View style={s.status}>
          <View style={s.indicator} />
          <Text style={s.statusText}>PRONTA</Text>
        </View>
      </View>

      <View style={s.center}>
        <View style={s.orbWrap}>
          <JoyCoreView state="idle" audioLevel={0} size={300} />
        </View>
        <Text style={s.greeting}>Buonasera.</Text>
        <Text style={s.prompt}>La tua intelligenza, il tuo mondo.</Text>
      </View>

      <View style={s.bottom}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Inizia una conversazione con JOY"
          onPress={() => router.push('/chat')}
          style={s.mic}
        >
          <Text style={s.micIcon}>✳</Text>
        </Pressable>
        <Text style={s.hint}>TOCCA PER PARLARE · CHAT TESTUALE DISPONIBILE</Text>
        <View style={s.actions}>
          <Pressable style={s.action} onPress={() => router.push('/chat')}>
            <Text style={s.actionIcon}>⌨</Text>
            <Text style={s.actionText}>Scrivi</Text>
          </Pressable>
          <Pressable style={s.action} onPress={() => router.push('/chat')}>
            <Text style={s.actionIcon}>◷</Text>
            <Text style={s.actionText}>Conversazioni</Text>
          </Pressable>
          <Pressable style={s.action} onPress={() => router.push('/settings')}>
            <Text style={s.actionIcon}>⚙</Text>
            <Text style={s.actionText}>Impostazioni</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 28,
    paddingTop: 22,
    paddingBottom: 20,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    color: colors.text,
    fontSize: 25,
    fontWeight: '700',
    letterSpacing: 2,
  },
  dot: {
    color: colors.cyan,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.mint,
  },
  statusText: {
    color: colors.muted,
    fontSize: 10,
    letterSpacing: 1.6,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbWrap: {
    height: 300,
    width: 300,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  greeting: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '500',
    letterSpacing: -0.5,
  },
  prompt: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 10,
  },
  bottom: {
    alignItems: 'center',
  },
  mic: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(167,139,250,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.violet,
    shadowOpacity: 0.4,
    shadowRadius: 22,
    elevation: 8,
  },
  micIcon: {
    color: colors.cyan,
    fontSize: 27,
  },
  hint: {
    color: colors.muted,
    fontSize: 9,
    letterSpacing: 2,
    marginTop: 14,
  },
  actions: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 34,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  action: {
    alignItems: 'center',
    gap: 7,
    minWidth: 75,
  },
  actionIcon: {
    fontSize: 20,
    color: '#C7C8D2',
  },
  actionText: {
    fontSize: 10,
    color: colors.muted,
  },
});
