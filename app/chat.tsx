import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/design-system/tokens';
import { respond } from '@/features/assistant/respond';
import { saveMessage, listMessages } from '@/features/conversation/repository';
import { ChatMessage } from '@/features/conversation/types';
import { voice } from '@/features/voice/voice';

export default function Chat() {
    const insets = useSafeAreaInsets();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [draft, setDraft] = useState('');
    const [busy, setBusy] = useState(false);
    const [listening, setListening] = useState(false);
    const [voiceError, setVoiceError] = useState('');
    const [amplitude, setAmplitude] = useState(0);
    const draftRef = useRef('');
    const busyRef = useRef(false);
    const messagesRef = useRef<ChatMessage[]>([]);
    const sendText = useCallback(async (input: string) => {
        const text = input.trim();
        if (!text || busyRef.current) return;
        draftRef.current = '';
        setDraft('');
        busyRef.current = true;
        setBusy(true);
        const user: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text, createdAt: Date.now() };
        const next = [...messagesRef.current, user];
        messagesRef.current = next;
        setMessages(next);
        try {
            await saveMessage(user);
            let streamed = '';
            const streamId = `a-${Date.now()}`;
            const answer = await respond(
                next.map(({ role, text: content }) => ({ role, content })),
                (token) => {
                    streamed += token;
                    const current = [...messagesRef.current];
                    const index = current.findIndex((item) => item.id === streamId);
                    const partial: ChatMessage = {
                        id: streamId,
                        role: 'assistant',
                        text: streamed,
                        createdAt: Date.now(),
                    };
                    if (index < 0) current.push(partial);
                    else current[index] = partial;
                    messagesRef.current = current;
                    setMessages(current);
                },
            );
            const reply: ChatMessage = { id: streamId, role: 'assistant', text: answer, createdAt: Date.now() };
            const current = [...messagesRef.current];
            const index = current.findIndex((item) => item.id === streamId);
            if (index < 0) current.push(reply);
            else current[index] = reply;
            messagesRef.current = current;
            setMessages(current);
            await saveMessage(reply);
            if (voice.getPreference('voice-replies') === 'true') {
                try {
                    await voice.speak(answer);
                } catch {
                    /* Keep the generated response even if speech output is unavailable. */
                }
            }
        } catch {
            const reply: ChatMessage = {
                id: `a-${Date.now()}`,
                role: 'assistant',
                text: 'Non sono riuscita a elaborare la richiesta. Riprova tra poco.',
                createdAt: Date.now(),
            };
            messagesRef.current = [...messagesRef.current, reply];
            setMessages(messagesRef.current);
            await saveMessage(reply);
        } finally {
            busyRef.current = false;
            setBusy(false);
        }
    }, []);
    const send = useCallback(() => sendText(draftRef.current), [sendText]);
    useEffect(() => {
        listMessages()
            .then((items) => {
                messagesRef.current = items;
                setMessages(items);
            })
            .catch(() => {
                messagesRef.current = [];
                setMessages([]);
            });
        const partial = voice.addListener('onPartialResult', (event) => {
            draftRef.current = event.text;
            setDraft(event.text);
        });
        const final = voice.addListener('onFinalResult', (event) => {
            setListening(false);
            draftRef.current = event.text;
            void sendText(event.text);
        });
        const failure = voice.addListener('onRecognitionError', (event) => {
            setListening(false);
            setVoiceError(event.message);
        });
        const level = voice.addListener('onAmplitude', (event) => setAmplitude(event.value));
        return () => {
            partial?.remove();
            final?.remove();
            failure?.remove();
            level?.remove();
            void voice.stopListening();
        };
    }, [sendText]);
    const toggleVoice = useCallback(async () => {
        setVoiceError('');
        if (listening) {
            await voice.stopListening();
            setListening(false);
            return;
        }
        if (busyRef.current) {
            setVoiceError('Attendi che JOY termini la risposta prima di dettare.');
            return;
        }
        if (!voice.available) {
            setVoiceError('Microfono e dettatura richiedono la build di sviluppo di JOY. Expo Go non include il modulo voce personalizzato.');
            return;
        }
        try {
            const permission = await voice.requestPermissions();
            if (permission.speech !== 'granted' || permission.microphone !== 'granted') {
                setVoiceError('Per dettare servono i permessi di riconoscimento vocale e microfono.');
                return;
            }
            draftRef.current = '';
            setDraft('');
            setListening(true);
            await voice.startListening('it-IT');
        } catch (error) {
            setListening(false);
            setVoiceError(error instanceof Error ? error.message : 'Non riesco ad avviare l’ascolto.');
        }
    }, [listening]);
    return (
        <View style={[s.root, { paddingTop: insets.top }]}>
            <Stack.Screen options={{ title: 'Conversazione', headerShown: false }} />
            <View style={s.header}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Indietro"
                    onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
                >
                    <Text style={s.back}>‹</Text>
                </Pressable>
                <View>
                    <Text style={s.title}>JOY</Text>
                    <Text style={s.subtitle}>ELABORAZIONE LOCALE</Text>
                </View>
                <View style={s.live} />
            </View>
            <FlatList
                data={messages}
                keyExtractor={(m) => m.id}
                contentContainerStyle={s.list}
                renderItem={({ item }) => (
                    <View style={[s.bubble, item.role === 'user' ? s.user : s.assistant]}>
                        <Text style={s.message}>{item.text}</Text>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={s.empty}>
                        <Text style={s.emptyTitle}>Da dove iniziamo?</Text>
                        <Text style={s.emptyText}>Scrivi a JOY. Le conversazioni restano su questo dispositivo.</Text>
                    </View>
                }
            />
            {Boolean(busy || listening || voiceError) && (
                <View style={s.thinking}>
                    {busy && <ActivityIndicator color={colors.cyan} />}
                    <Text style={[s.subtitle, voiceError && { color: '#FF9DAB' }]}>
                        {voiceError ||
                            (listening ? 'TI STO ASCOLTANDO · TOCCA IL MICROFONO PER FERMARMI' : 'JOY STA PENSANDO')}
                    </Text>
                </View>
            )}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
                <View style={[s.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={listening ? 'Ferma ascolto' : 'Detta un messaggio'}
                        onPress={toggleVoice}
                        style={[s.mic, listening && s.micActive, { transform: [{ scale: 1 + amplitude * 0.16 }] }]}
                    >
                        <Text style={s.micText}>{listening ? '■' : '●'}</Text>
                    </Pressable>
                    <TextInput
                        value={draft}
                        onChangeText={(value) => {
                            draftRef.current = value;
                            setDraft(value);
                        }}
                        onSubmitEditing={send}
                        placeholder="Scrivi a JOY…"
                        placeholderTextColor={colors.muted}
                        style={s.input}
                        returnKeyType="send"
                    />
                    <Pressable
                        accessibilityLabel="Invia messaggio"
                        onPress={send}
                        style={[s.send, !draft.trim() && s.disabled]}
                    >
                        <Text style={s.sendText}>↑</Text>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: {
        height: 62,
        borderBottomWidth: 1,
        borderBottomColor: colors.line,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 22,
        gap: 16,
    },
    back: { fontSize: 34, color: colors.text },
    title: { fontSize: 16, color: colors.text, fontWeight: '700', letterSpacing: 2 },
    subtitle: { fontSize: 8, color: colors.cyan, letterSpacing: 1.6, marginTop: 3 },
    live: { marginLeft: 'auto', width: 7, height: 7, borderRadius: 4, backgroundColor: colors.cyan },
    list: { padding: 20, gap: 12, flexGrow: 1, justifyContent: 'flex-end' },
    bubble: { maxWidth: '86%', padding: 15, borderRadius: 19 },
    user: { alignSelf: 'flex-end', backgroundColor: '#26213D', borderBottomRightRadius: 5 },
    assistant: {
        alignSelf: 'flex-start',
        backgroundColor: colors.panel,
        borderWidth: 1,
        borderColor: colors.line,
        borderBottomLeftRadius: 5,
    },
    message: { fontSize: 15, color: colors.text, lineHeight: 23 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 34 },
    emptyTitle: { fontSize: 24, color: colors.text, fontWeight: '500' },
    emptyText: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 22, marginTop: 10 },
    thinking: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 22, paddingBottom: 8 },
    composer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: colors.line,
    },
    input: {
        flex: 1,
        backgroundColor: colors.panel,
        color: colors.text,
        borderRadius: 24,
        paddingHorizontal: 18,
        paddingVertical: 13,
        fontSize: 15,
    },
    mic: {
        height: 44,
        width: 44,
        borderRadius: 22,
        backgroundColor: '#20212B',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.line,
    },
    micActive: { backgroundColor: '#A6425D', borderColor: '#FF91A7' },
    micText: { fontSize: 15, color: colors.text },
    send: {
        height: 44,
        width: 44,
        borderRadius: 22,
        backgroundColor: colors.violet,
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabled: { opacity: 0.5 },
    sendText: { fontSize: 24, color: '#171324', fontWeight: '600' },
});
