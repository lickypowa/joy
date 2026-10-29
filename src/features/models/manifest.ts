export type ModelManifestEntry = {
  id: string;
  name: string;
  version: string;
  url: string;
  license: string;
  licenseUrl: string;
  quantization: string;
  sha256: string;
  sizeBytes: number;
  minRuntime: string;
};

export const DEFAULT_MODEL: ModelManifestEntry = {
  id: 'qwen3-1.7b-q4km-v1',
  name: 'Qwen3 1.7B · Q4_K_M',
  version: '1.0',
  url: 'https://huggingface.co/Antigma/Qwen3-1.7B-GGUF/resolve/main/qwen3-1.7b-q4_k_m.gguf?download=true',
  license: 'Apache-2.0',
  licenseUrl: 'https://huggingface.co/Qwen/Qwen3-1.7B/blob/main/LICENSE',
  quantization: 'Q4_K_M',
  sha256: 'a7f6720f68f4a4567ebf7e3257041dd0b72077b518efe56890aec3516b59b9de',
  sizeBytes: 1_282_000_000,
  minRuntime: 'llama.cpp GGUF, at least 4 GB device RAM and 1.5 GB free storage',
};
