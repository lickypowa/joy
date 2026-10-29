import type { LlamaContext } from 'llama.rn';
import type { LLMProvider, Turn } from './LLMProvider';

export class LocalLlamaProvider implements LLMProvider {
  readonly id='llama.cpp-on-device';
  private context:LlamaContext|null=null;
  private loading:Promise<void>|null=null;
  async isAvailable(){return this.context!==null;}
  async load(modelPath:string){
    if(this.context)return;
    if(this.loading)return this.loading;
    this.loading=(async()=>{const {initLlama}=await import('llama.rn');const model=modelPath.startsWith('file://')?modelPath:`file://${modelPath}`;try{this.context=await initLlama({model,n_ctx:2048,n_gpu_layers:99});}catch{this.context=await initLlama({model,n_ctx:2048,n_gpu_layers:0});}})();
    try{await this.loading;}finally{this.loading=null;}
  }
  async unload(){if(this.context){await this.context.release();this.context=null;}}
  async generate(messages:Turn[],onToken?:(token:string)=>void,signal?:AbortSignal):Promise<string>{
    if(!this.context)throw new Error('Il modello locale non è caricato.');
    if(signal?.aborted)throw new DOMException('Operazione annullata','AbortError');
    const result=await this.context.completion({messages:messages.map(m=>({role:m.role,content:m.content})),n_predict:320,temperature:0.45,top_p:0.9,stop:['<|im_end|>','<|endoftext|>'],chat_template_kwargs:{enable_thinking:false}},data=>onToken?.(data.token));
    return result.text.trim();
  }
}

export const localLlamaProvider=new LocalLlamaProvider();
