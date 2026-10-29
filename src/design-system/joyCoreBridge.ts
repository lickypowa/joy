import type { CoreState as AppCoreState } from '@/design-system/tokens';
import type { CoreState as JoyEngineState } from '../../joy-core/src/core/types';

/** Maps app-level lowercase states onto the Three.js engine states. */
export function toJoyEngineState(state: AppCoreState): JoyEngineState {
  switch (state) {
    case 'listening':
      return 'LISTENING';
    case 'thinking':
    case 'transcribing':
      return 'THINKING';
    case 'speaking':
      return 'SPEAKING';
    case 'executing':
      return 'EXECUTING';
    case 'error':
      return 'ERROR';
    case 'idle':
    case 'complete':
    case 'wake':
    case 'shutdown':
    default:
      return 'IDLE';
  }
}
