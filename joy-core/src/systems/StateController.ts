import { damp } from '../core/math';
import {
  STATE_PROFILES,
  type CoreState,
  type StateVisualProfile,
} from '../core/types';

/** Interpolates visual profiles between core states for organic transitions. */
export class StateController {
  private current: CoreState = 'IDLE';
  private profile: StateVisualProfile = { ...STATE_PROFILES.IDLE };

  get state(): CoreState {
    return this.current;
  }

  get visual(): StateVisualProfile {
    return this.profile;
  }

  setState(next: CoreState): void {
    this.current = next;
  }

  update(dt: number): StateVisualProfile {
    const target = STATE_PROFILES[this.current];
    const keys = Object.keys(target) as (keyof StateVisualProfile)[];
    for (const key of keys) {
      this.profile[key] = damp(this.profile[key], target[key], 3.2, dt);
    }
    return this.profile;
  }
}
