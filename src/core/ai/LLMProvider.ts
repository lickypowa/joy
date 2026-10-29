export type Turn = { role: 'system' | 'user' | 'assistant'; content: string };
export interface LLMProvider {
  readonly id: string;
  isAvailable(): Promise<boolean>;
  generate(messages: Turn[], onToken?: (token: string) => void, signal?: AbortSignal): Promise<string>;
}
