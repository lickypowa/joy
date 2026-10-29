import { EventSubscription, requireNativeModule } from 'expo-modules-core';

type Permissions = { speech: string; microphone: string };
type VoiceEvents = { onPartialResult: { text: string }; onFinalResult: { text: string }; onRecognitionError: { message: string }; onSpeechFinished: Record<string, never>; onAmplitude:{value:number} };
type JoyVoiceNative = {
  requestPermissions(): Promise<Permissions>;
  startListening(localeIdentifier: string): Promise<void>;
  stopListening(): Promise<void>;
  speak(text: string, localeIdentifier: string, rate: number): Promise<void>;
  stopSpeaking(): Promise<void>;
  availableVoices(): Promise<Array<{ identifier: string; name: string; language: string }>>;
  getPreference(key: string): string;
  setPreference(key: string, value: string): void;
  requestRemindersPermission(): Promise<boolean>;
  createReminder(title: string, dueTimestamp: number): Promise<{ status: string; title: string }>;
  verifyModel(fileUri: string, expectedHash: string): Promise<boolean>;
  requestContactsPermission(): Promise<boolean>;
  findContacts(query:string):Promise<Array<{givenName:string;familyName:string;phone:string}>>;
  physicalMemoryBytes():number;
  addListener<K extends keyof VoiceEvents>(event: K, listener: (payload: VoiceEvents[K]) => void): EventSubscription;
};

let native: JoyVoiceNative | null | undefined;
function module(): JoyVoiceNative | null {
  if (native !== undefined) return native;
  try { native = requireNativeModule<JoyVoiceNative>('JoyVoice'); }
  catch { native = null; }
  return native;
}

export const voice = {
  get available() { return module() !== null; },
  requestPermissions: async () => module()?.requestPermissions() ?? Promise.resolve({ speech: 'unavailable', microphone: 'unavailable' }),
  startListening: async (locale = 'it-IT') => { const m=module(); if (!m) throw new Error('La voce JOY è disponibile solo nella build iOS nativa.'); return m.startListening(locale); },
  stopListening: async () => module()?.stopListening(),
  speak: async (text: string, locale = 'it-IT', rate = 0.48) => module()?.speak(text, locale, rate),
  stopSpeaking: async () => module()?.stopSpeaking(),
  availableVoices: async () => module()?.availableVoices() ?? [],
  getPreference: (key: string) => module()?.getPreference(key) ?? '',
  setPreference: (key: string, value: string) => module()?.setPreference(key, value),
  requestRemindersPermission: async () => module()?.requestRemindersPermission() ?? false,
  createReminder: async (title: string, dueTimestamp: number) => { const m=module(); if(!m) throw new Error('I promemoria richiedono la build iOS nativa.'); return m.createReminder(title,dueTimestamp); },
  verifyModel: async (fileUri: string, expectedHash: string) => { const m=module(); if(!m) throw new Error('Verifica SHA-256 disponibile nella build nativa iOS.'); return m.verifyModel(fileUri,expectedHash); },
  requestContactsPermission: async () => module()?.requestContactsPermission() ?? false,
  findContacts: async (query:string) => { const m=module(); if(!m) throw new Error('I contatti richiedono la build iOS nativa.'); return m.findContacts(query); },
  physicalMemoryBytes: () => module()?.physicalMemoryBytes() ?? 0,
  addListener: <K extends keyof VoiceEvents>(event: K, listener: (payload: VoiceEvents[K]) => void) => module()?.addListener(event, listener) ?? null,
};
