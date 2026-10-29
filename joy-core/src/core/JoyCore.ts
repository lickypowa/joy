import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { Chassis } from '../entities/Chassis';
import { Crystal } from '../entities/Crystal';
import { EnergyRings } from '../entities/EnergyRings';
import { ExecutionBeam } from '../entities/ExecutionBeam';
import { ParticleField } from '../entities/ParticleField';
import { QualityScaler } from '../systems/QualityScaler';
import { StateController } from '../systems/StateController';
import { clamp } from './math';
import type { CoreMetrics, CoreState, QualityTier } from './types';

export type JoyCoreOptions = {
  canvas: HTMLCanvasElement;
  initialState?: CoreState;
};

/**
 * Renderer-agnostic-ish core engine.
 * DOM coupling is limited to the canvas element so the scene graph
 * can later be driven from React Native via expo-gl / similar.
 */
export class JoyCore {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly root = new THREE.Group();

  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private chassis: Chassis;
  private crystal: Crystal;
  private rings: EnergyRings;
  private particles: ParticleField;
  private beam: ExecutionBeam;
  private states = new StateController();
  private quality = new QualityScaler();
  private clock = new THREE.Clock();
  private audioLevel = 0;
  private running = false;
  private raf = 0;
  private metrics: CoreMetrics = { fps: 0, frameMs: 0, quality: 'high', particleCount: 0 };
  private fpsAccum = 0;
  private fpsFrames = 0;
  private onMetrics: ((m: CoreMetrics) => void) | null = null;
  private envRT: THREE.WebGLRenderTarget | null = null;

  constructor(options: JoyCoreOptions) {
    const { canvas } = options;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    this.camera.position.set(0, 0.35, 6.2);
    this.camera.lookAt(0, 0, 0);

    this.scene.background = new THREE.Color('#030406');
    this.scene.fog = new THREE.FogExp2('#030406', 0.045);

    this.setupLights();
    this.setupEnvironment();

    const tier = this.quality.current;
    this.chassis = new Chassis(tier);
    this.crystal = new Crystal(tier);
    this.rings = new EnergyRings(tier);
    this.particles = new ParticleField(tier);
    this.beam = new ExecutionBeam();

    this.root.add(
      this.chassis.group,
      this.crystal.group,
      this.rings.group,
      this.particles.points,
      this.beam.mesh,
    );
    this.scene.add(this.root);

    const size = new THREE.Vector2(canvas.clientWidth, canvas.clientHeight);
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(size, 0.9, 0.7, 0.35);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this.quality.onChange((next) => this.applyQuality(next));
    if (options.initialState) this.setState(options.initialState);
    this.resize();
  }

  private setupLights(): void {
    const key = new THREE.DirectionalLight(0xffe7e2, 2.2);
    key.position.set(3.5, 4.5, 2.5);
    const fill = new THREE.DirectionalLight(0x88a0ff, 0.55);
    fill.position.set(-4, -1, -2);
    const rim = new THREE.PointLight(0xff2a1f, 3.5, 12, 2);
    rim.position.set(0, 0, 2.2);
    const ambient = new THREE.HemisphereLight(0x1a2030, 0x050308, 0.55);
    this.scene.add(key, fill, rim, ambient);
  }

  private setupEnvironment(): void {
    // Procedural studio env — no external HDRI downloads / paid assets.
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const envScene = new THREE.Scene();
    envScene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const top = new THREE.Mesh(
      new THREE.SphereGeometry(4, 16, 8),
      new THREE.MeshBasicMaterial({ color: 0x202833, side: THREE.BackSide }),
    );
    envScene.add(top);
    const warm = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 3),
      new THREE.MeshBasicMaterial({ color: 0xff6a55 }),
    );
    warm.position.set(2.5, 1.5, 2);
    envScene.add(warm);
    const cool = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 3),
      new THREE.MeshBasicMaterial({ color: 0x6f87ff }),
    );
    cool.position.set(-2.5, -1, 1.5);
    envScene.add(cool);
    this.envRT = pmrem.fromScene(envScene, 0.04);
    this.scene.environment = this.envRT?.texture ?? null;
    pmrem.dispose();
  }

  private applyQuality(tier: QualityTier): void {
    this.chassis.setQuality(tier);
    this.crystal.setQuality(tier);
    this.rings.setQuality(tier);
    this.particles.setQuality(tier);
    const ratio = tier === 'high' ? Math.min(window.devicePixelRatio, 2) : tier === 'medium' ? 1.25 : 1;
    this.renderer.setPixelRatio(ratio);
    this.bloom.strength = tier === 'low' ? 0.55 : tier === 'medium' ? 0.75 : 0.95;
    this.resize();
  }

  setState(state: CoreState): void {
    this.states.setState(state);
  }

  setAudioLevel(level: number): void {
    this.audioLevel = clamp(level, 0, 1);
  }

  getState(): CoreState {
    return this.states.state;
  }

  getMetrics(): CoreMetrics {
    return this.metrics;
  }

  onMetricsChange(cb: (m: CoreMetrics) => void): void {
    this.onMetrics = cb;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.clock.start();
    const loop = () => {
      this.raf = requestAnimationFrame(loop);
      this.frame();
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  resize(): void {
    const canvas = this.renderer.domElement;
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.composer.setSize(width, height);
    this.bloom.setSize(width, height);
  }

  private frame(): void {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const time = this.clock.elapsedTime;
    const t0 = performance.now();

    const profile = this.states.update(dt);
    const audio = this.audioLevel;
    const pulseWave = 0.5 + 0.5 * Math.sin(time * profile.pulseSpeed * Math.PI * 2);
    const pulse = profile.pulseAmount * (0.55 + pulseWave * 0.45) + audio * 0.22;

    this.root.rotation.y += dt * 0.08;
    this.chassis.update(dt, {
      tilt: profile.chassisTilt,
      pulse,
      glitch: profile.glitch,
      time,
    });
    this.crystal.update(dt, {
      time,
      intensity: profile.crystalIntensity,
      pulse,
      glitch: profile.glitch,
      audio,
    });
    this.rings.update(dt, {
      time,
      speed: profile.ringSpeed * (1 + audio * 0.8),
      scale: profile.ringScale + audio * 0.12,
      intensity: profile.crystalIntensity,
      audio,
    });
    this.particles.update(dt, {
      time,
      speed: profile.particleSpeed,
      spread: profile.particleSpread,
      audio,
      glitch: profile.glitch,
    });
    this.beam.update({
      opacity: profile.beamOpacity,
      audio,
      pulse,
    });

    this.bloom.strength = profile.bloomStrength * (0.85 + audio * 0.25);
    this.composer.render();

    const frameMs = performance.now() - t0;
    this.quality.sample(frameMs);
    this.fpsAccum += dt;
    this.fpsFrames += 1;
    if (this.fpsAccum >= 0.5) {
      this.metrics = {
        fps: Math.round(this.fpsFrames / this.fpsAccum),
        frameMs,
        quality: this.quality.current,
        particleCount: this.particles.countActive,
      };
      this.fpsAccum = 0;
      this.fpsFrames = 0;
      this.onMetrics?.(this.metrics);
    }
  }

  dispose(): void {
    this.stop();
    this.chassis.dispose();
    this.crystal.dispose();
    this.rings.dispose();
    this.particles.dispose();
    this.beam.dispose();
    this.envRT?.dispose();
    this.composer.dispose();
    this.renderer.dispose();
  }
}
