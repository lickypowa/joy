import type { LLMProvider, Turn } from './LLMProvider';
/** Honest offline fallback: useful assistant routing without claiming generative LLM capability. */
export class OfflineProvider implements LLMProvider {
  readonly id = 'offline-intents-v1';
  async isAvailable() { return true; }
  async generate(messages: Turn[]): Promise<string> {
    const query = messages.at(-1)?.content.trim() ?? '';
    if (!query) return 'Dimmi pure, ti ascolto.';
    if (/\b(che tempo|meteo|piove|temperatura)\b/i.test(query)) return 'Posso cercare il meteo. Indicami la città oppure attiva la posizione.';
    if (/\b(ricordami|promemoria)\b/i.test(query)) return 'Posso preparare un promemoria. Per crearlo serve collegare il calendario Promemoria di iOS.';
    if (/\b(portami|naviga|percorso|indicazioni)\b/i.test(query)) return 'Posso preparare la navigazione. Qual è la destinazione precisa?';
    if (/\bciao|buongiorno|buonasera\b/i.test(query)) return 'Ciao, sono qui. Cosa vuoi fare?';
    return 'Ho ricevuto la richiesta. Il modello locale non è ancora installato; per ora posso aiutarti con meteo, promemoria e navigazione quando i relativi strumenti sono configurati.';
  }
}
