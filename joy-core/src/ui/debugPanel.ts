import { CoreStates, type CoreMetrics, type CoreState } from '../core/types';

export type DebugPanelHandlers = {
  onState: (state: CoreState) => void;
  onAudio: (level: number) => void;
};

export class DebugPanel {
  private buttons = new Map<CoreState, HTMLButtonElement>();
  private audioValue: HTMLElement;
  private fpsEl: HTMLElement;
  private qualityEl: HTMLElement;
  private particlesEl: HTMLElement;
  private frameEl: HTMLElement;

  constructor(mount: HTMLElement, handlers: DebugPanelHandlers) {
    mount.innerHTML = `
      <h1>JOY CORE DEBUG</h1>
      <p>Storyboard-driven cinematic nucleus. Change state and audio amplitude manually.</p>
      <div class="section">
        <label>State</label>
        <div class="states" data-states></div>
      </div>
      <div class="section">
        <label>Audio amplitude</label>
        <input type="range" min="0" max="100" value="0" data-audio />
        <div class="meta"><span>Level</span><span data-audio-value>0%</span></div>
      </div>
      <div class="stats">
        <div>FPS<strong data-fps>—</strong></div>
        <div>Quality<strong data-quality>—</strong></div>
        <div>Particles<strong data-particles>—</strong></div>
        <div>Frame<strong data-frame>—</strong></div>
      </div>
    `;

    const statesHost = mount.querySelector('[data-states]')!;
    for (const state of CoreStates) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = state;
      btn.addEventListener('click', () => {
        handlers.onState(state);
        this.setActiveState(state);
      });
      statesHost.appendChild(btn);
      this.buttons.set(state, btn);
    }

    const audio = mount.querySelector<HTMLInputElement>('[data-audio]')!;
    this.audioValue = mount.querySelector('[data-audio-value]')!;
    audio.addEventListener('input', () => {
      const level = Number(audio.value) / 100;
      this.audioValue.textContent = `${Math.round(level * 100)}%`;
      handlers.onAudio(level);
    });

    this.fpsEl = mount.querySelector('[data-fps]')!;
    this.qualityEl = mount.querySelector('[data-quality]')!;
    this.particlesEl = mount.querySelector('[data-particles]')!;
    this.frameEl = mount.querySelector('[data-frame]')!;
    this.setActiveState('IDLE');
  }

  setActiveState(state: CoreState): void {
    for (const [key, btn] of this.buttons) {
      btn.classList.toggle('active', key === state);
    }
  }

  updateMetrics(metrics: CoreMetrics): void {
    this.fpsEl.textContent = String(metrics.fps);
    this.qualityEl.textContent = metrics.quality.toUpperCase();
    this.particlesEl.textContent = String(metrics.particleCount);
    this.frameEl.textContent = `${metrics.frameMs.toFixed(1)} ms`;
  }
}
