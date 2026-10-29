import './styles/main.css';
import { JoyCore } from './core/JoyCore';
import type { CoreState } from './core/types';
import { DebugPanel } from './ui/debugPanel';

const canvas = document.querySelector<HTMLCanvasElement>('#stage');
const debugMount = document.querySelector<HTMLElement>('#debug');
const stateLabel = document.querySelector<HTMLElement>('#state-label');

if (!canvas || !debugMount || !stateLabel) {
  throw new Error('JOY CORE mount points missing in index.html');
}

const core = new JoyCore({ canvas, initialState: 'IDLE' });

// Bridge for React Native WebView injectJavaScript.
(window as Window & { __JOY_CORE__?: JoyCore }).__JOY_CORE__ = core;

const panel = new DebugPanel(debugMount, {
  onState: (state: CoreState) => {
    core.setState(state);
    stateLabel.textContent = state;
  },
  onAudio: (level: number) => {
    core.setAudioLevel(level);
  },
});

core.onMetricsChange((metrics) => panel.updateMetrics(metrics));
core.start();

const onResize = () => core.resize();
window.addEventListener('resize', onResize);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    window.removeEventListener('resize', onResize);
    core.dispose();
  });
}
