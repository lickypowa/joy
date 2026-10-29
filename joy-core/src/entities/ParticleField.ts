import * as THREE from 'three';
import type { QualityTier } from '../core/types';

const COUNTS: Record<QualityTier, number> = {
  high: 900,
  medium: 450,
  low: 180,
};

export class ParticleField {
  readonly points: THREE.Points;
  private positions: Float32Array;
  private velocities: Float32Array;
  private seeds: Float32Array;
  private quality: QualityTier;
  private count: number;

  constructor(quality: QualityTier) {
    this.quality = quality;
    this.count = COUNTS[quality];
    this.positions = new Float32Array(this.count * 3);
    this.velocities = new Float32Array(this.count * 3);
    this.seeds = new Float32Array(this.count);
    this.seedParticles();

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    const material = new THREE.PointsMaterial({
      color: new THREE.Color('#ff3b30'),
      size: 0.045,
      map: createSoftCircleTexture(),
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(geometry, material);
  }

  get countActive(): number {
    return this.count;
  }

  private seedParticles(): void {
    for (let i = 0; i < this.count; i += 1) {
      const i3 = i * 3;
      const radius = 1.2 + Math.random() * 1.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      this.positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      this.positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      this.positions[i3 + 2] = radius * Math.cos(phi);
      this.velocities[i3] = (Math.random() - 0.5) * 0.2;
      this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.2;
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.2;
      this.seeds[i] = Math.random() * Math.PI * 2;
    }
  }

  setQuality(quality: QualityTier): void {
    if (quality === this.quality) return;
    this.quality = quality;
    this.count = COUNTS[quality];
    this.positions = new Float32Array(this.count * 3);
    this.velocities = new Float32Array(this.count * 3);
    this.seeds = new Float32Array(this.count);
    this.seedParticles();
    this.points.geometry.dispose();
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.points.geometry = geometry;
  }

  update(
    dt: number,
    opts: {
      time: number;
      speed: number;
      spread: number;
      audio: number;
      glitch: number;
    },
  ): void {
    const pos = this.positions;
    const attr = this.points.geometry.getAttribute('position') as THREE.BufferAttribute;

    for (let i = 0; i < this.count; i += 1) {
      const i3 = i * 3;
      const seed = this.seeds[i]!;
      const orbit = opts.speed * (0.55 + (seed % 1) * 0.8);
      const x = pos[i3]!;
      const y = pos[i3 + 1]!;
      const z = pos[i3 + 2]!;

      // Orbital swirl around Y, with audio-driven radial breathing.
      const angle = orbit * dt * (1.2 + opts.audio * 2.5);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      let nx = x * cos - z * sin;
      let nz = x * sin + z * cos;
      let ny = y + Math.sin(opts.time * 1.4 + seed) * 0.01 * opts.speed;

      const radius = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      const targetRadius = (1.15 + (seed % 1) * 1.7) * opts.spread * (1 + opts.audio * 0.25);
      const pull = (targetRadius - radius) * 0.03;
      nx += (nx / radius) * pull;
      ny += (ny / radius) * pull;
      nz += (nz / radius) * pull;

      if (opts.glitch > 0.2) {
        nx += Math.sin(opts.time * 40 + seed) * opts.glitch * 0.04;
        ny += Math.cos(opts.time * 35 + seed) * opts.glitch * 0.04;
      }

      pos[i3] = nx;
      pos[i3 + 1] = ny;
      pos[i3 + 2] = nz;
    }

    attr.needsUpdate = true;
    const mat = this.points.material as THREE.PointsMaterial;
    mat.size = 0.028 + opts.audio * 0.04;
    mat.opacity = 0.55 + opts.audio * 0.35;
  }

  dispose(): void {
    this.points.geometry.dispose();
    const mat = this.points.material as THREE.PointsMaterial;
    mat.map?.dispose();
    mat.dispose();
  }
}

function createSoftCircleTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new THREE.Texture();
  }
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.35, 'rgba(255,80,60,0.85)');
  gradient.addColorStop(1, 'rgba(255,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
