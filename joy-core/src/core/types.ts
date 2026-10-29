export const CoreStates = [
  'IDLE',
  'LISTENING',
  'THINKING',
  'SPEAKING',
  'EXECUTING',
  'ERROR',
] as const;

export type CoreState = (typeof CoreStates)[number];

export type QualityTier = 'high' | 'medium' | 'low';

export type CoreInputs = {
  /** Simulated or real audio amplitude in [0, 1]. */
  audioLevel: number;
  state: CoreState;
};

export type CoreMetrics = {
  fps: number;
  frameMs: number;
  quality: QualityTier;
  particleCount: number;
};

/** Visual targets interpolated by the animator each frame. */
export type StateVisualProfile = {
  pulseSpeed: number;
  pulseAmount: number;
  ringSpeed: number;
  ringScale: number;
  particleSpeed: number;
  particleSpread: number;
  crystalIntensity: number;
  chassisTilt: number;
  beamOpacity: number;
  glitch: number;
  bloomStrength: number;
  emissiveHueShift: number;
};

export const STATE_PROFILES: Record<CoreState, StateVisualProfile> = {
  IDLE: {
    pulseSpeed: 1,
    pulseAmount: 0.08,
    ringSpeed: 0.35,
    ringScale: 1,
    particleSpeed: 0.4,
    particleSpread: 1,
    crystalIntensity: 0.85,
    chassisTilt: 0.08,
    beamOpacity: 0,
    glitch: 0,
    bloomStrength: 0.85,
    emissiveHueShift: 0,
  },
  LISTENING: {
    pulseSpeed: 1.8,
    pulseAmount: 0.18,
    ringSpeed: 0.55,
    ringScale: 1.18,
    particleSpeed: 0.7,
    particleSpread: 1.2,
    crystalIntensity: 1.15,
    chassisTilt: 0.12,
    beamOpacity: 0,
    glitch: 0,
    bloomStrength: 1.05,
    emissiveHueShift: 0,
  },
  THINKING: {
    pulseSpeed: 2.4,
    pulseAmount: 0.22,
    ringSpeed: 1.4,
    ringScale: 1.08,
    particleSpeed: 1.6,
    particleSpread: 1.35,
    crystalIntensity: 1.35,
    chassisTilt: 0.22,
    beamOpacity: 0.15,
    glitch: 0.05,
    bloomStrength: 1.2,
    emissiveHueShift: 0.02,
  },
  SPEAKING: {
    pulseSpeed: 2.1,
    pulseAmount: 0.26,
    ringSpeed: 0.9,
    ringScale: 1.12,
    particleSpeed: 1.1,
    particleSpread: 1.25,
    crystalIntensity: 1.25,
    chassisTilt: 0.1,
    beamOpacity: 0.08,
    glitch: 0,
    bloomStrength: 1.15,
    emissiveHueShift: 0,
  },
  EXECUTING: {
    pulseSpeed: 1.3,
    pulseAmount: 0.14,
    ringSpeed: 0.7,
    ringScale: 0.95,
    particleSpeed: 1.3,
    particleSpread: 0.85,
    crystalIntensity: 1.55,
    chassisTilt: 0.05,
    beamOpacity: 1,
    glitch: 0,
    bloomStrength: 1.35,
    emissiveHueShift: 0,
  },
  ERROR: {
    pulseSpeed: 3.2,
    pulseAmount: 0.3,
    ringSpeed: 1.8,
    ringScale: 1.05,
    particleSpeed: 1.9,
    particleSpread: 1.5,
    crystalIntensity: 1.7,
    chassisTilt: 0.35,
    beamOpacity: 0.2,
    glitch: 1,
    bloomStrength: 1.4,
    emissiveHueShift: 0.05,
  },
};
