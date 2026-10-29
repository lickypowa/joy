export const colors = {
  background: '#07070C',
  panel: '#12141D',
  text: '#F4F5FA',
  muted: '#8B90A5',
  violet: '#A78BFA',
  cyan: '#22D3EE',
  mint: '#2DD4BF',
  pink: '#EC4899',
  line: 'rgba(255,255,255,0.09)',
  // legacy aliases kept so older screens keep compiling
  core: '#A78BFA',
  coreHot: '#22D3EE',
  coreDeep: '#4C1D95',
  metal: '#C8D0DC',
  metalDim: 'rgba(200,208,220,0.35)',
} as const;

export type CoreState =
  | 'idle'
  | 'listening'
  | 'transcribing'
  | 'thinking'
  | 'executing'
  | 'speaking'
  | 'complete'
  | 'error'
  | 'wake'
  | 'shutdown';
