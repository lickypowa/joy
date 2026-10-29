import * as THREE from 'three';
import type { QualityTier } from '../core/types';
import { createChassisGeometry } from './geometry';

export class Chassis {
  readonly group = new THREE.Group();
  private mesh: THREE.Mesh;
  private innerGlow: THREE.Mesh;
  private quality: QualityTier;

  constructor(quality: QualityTier) {
    this.quality = quality;
    const geometry = createChassisGeometry(quality);

    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#1a1d24'),
      metalness: 1,
      roughness: 0.22,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      reflectivity: 1,
      envMapIntensity: 1.4,
      emissive: new THREE.Color('#3a0505'),
      emissiveIntensity: 0.18,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = false;

    const glowGeom = createChassisGeometry(quality === 'high' ? 'medium' : 'low');
    const glowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#e10600'),
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.innerGlow = new THREE.Mesh(glowGeom, glowMat);
    this.innerGlow.scale.setScalar(0.92);

    this.group.add(this.mesh, this.innerGlow);
  }

  setQuality(quality: QualityTier): void {
    if (quality === this.quality) return;
    this.quality = quality;
    const next = createChassisGeometry(quality);
    this.mesh.geometry.dispose();
    this.mesh.geometry = next;
    this.innerGlow.geometry.dispose();
    this.innerGlow.geometry = createChassisGeometry(quality === 'high' ? 'medium' : 'low');
  }

  update(dt: number, opts: { tilt: number; pulse: number; glitch: number; time: number }): void {
    const swayX = Math.sin(opts.time * 0.35) * opts.tilt;
    const swayY = Math.cos(opts.time * 0.28) * opts.tilt * 0.65;
    const glitchKick = opts.glitch > 0 ? Math.sin(opts.time * 28) * opts.glitch * 0.08 : 0;
    this.group.rotation.x = dampAngle(this.group.rotation.x, swayX + glitchKick, 4, dt);
    this.group.rotation.y = dampAngle(this.group.rotation.y, swayY - glitchKick * 0.6, 4, dt);
    this.group.rotation.z = dampAngle(this.group.rotation.z, Math.sin(opts.time * 0.2) * 0.04, 3, dt);

    const mat = this.mesh.material as THREE.MeshPhysicalMaterial;
    mat.emissiveIntensity = 0.12 + opts.pulse * 0.35;

    const glow = this.innerGlow.material as THREE.MeshBasicMaterial;
    glow.opacity = 0.05 + opts.pulse * 0.12;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    this.innerGlow.geometry.dispose();
    (this.innerGlow.material as THREE.Material).dispose();
  }
}

function dampAngle(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}
