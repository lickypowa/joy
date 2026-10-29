declare module 'llama.rn' {
  export type LlamaMessage = { role: 'system' | 'user' | 'assistant'; content: string };
  export interface LlamaContext {
    completion(params: { messages: LlamaMessage[]; n_predict?: number; temperature?: number; top_p?: number; stop?: string[]; chat_template_kwargs?: Record<string,unknown> }, onToken?: (data: { token: string }) => void): Promise<{ text: string; timings?: Record<string, number> }>;
    release(): Promise<void>;
  }
  export function initLlama(params: { model: string; n_ctx: number; n_gpu_layers: number; use_mlock?: boolean }): Promise<LlamaContext>;
}
