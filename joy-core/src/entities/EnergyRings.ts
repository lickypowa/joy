import * as THREE from 'three';
import type { QualityTier } from '../core/types';
import { energyRingFragmentShader, energyRingVertexShader } from '../shaders/energyRing';

type RingHandle = {
  mesh: THREE.Mesh;
  speed: number;
  axis: THREE.Vector3;
};

export class EnergyRings {
  readonly group = new THREE.Group();
  private rings: RingHandle[] = [];
  private quality: QualityTier;

  constructor(quality: QualityTier) {
    this.quality = quality;
    this.rebuild(quality);
  }

  private rebuild(quality: QualityTier): void {
    for (const ring of this.rings) {
      ring.mesh.geometry.dispose();
      (ring.mesh.material as THREE.Material).dispose();
      this.group.remove(ring.mesh);
    }
    this.rings = [];

    const defs = [
      { radius: 1.75, tube: 0.012, speed: 0.45, axis: new THREE.Vector3(1, 0.15, 0.05).normalize() },
      { radius: 2.05, tube: 0.01, speed: -0.32, axis: new THREE.Vector3(0.2, 1, 0.1).normalize() },
      { radius: 2.35, tube: 0.008, speed: 0.22, axis: new THREE.Vector3(0.15, 0.25, 1).normalize() },
    ];

    const radial = quality === 'high' ? 96 : quality === 'medium' ? 64 : 40;
    const tubular = quality === 'high' ? 12 : quality === 'medium' ? 8 : 6;

    for (const def of defs) {
      const geom = new THREE.TorusGeometry(def.radius, def.tube, tubular, radial);
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uIntensity: { value: 1 },
          uAudio: { value: 0 },
          uColor: { value: new THREE.Color('#ff2a1f') },
        },
        vertexShader: energyRingVertexShader,
        fragmentShader: energyRingFragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.rotation.set(def.axis.x * Math.PI * 0.5, def.axis.y * 0.4, def.axis.z * 0.2);
      this.group.add(mesh);
      this.rings.push({ mesh, speed: def.speed, axis: def.axis });
    }
  }

  setQuality(quality: QualityTier): void {
    if (quality === this.quality) return;
    this.quality = quality;
    this.rebuild(quality);
  }

  update(
    dt: number,
    opts: {
      time: number;
      speed: number;
      scale: number;
      intensity: number;
      audio: number;
    },
  ): void {
    this.group.scale.setScalar(opts.scale);
    for (const ring of this.rings) {
      ring.mesh.rotateOnAxis(ring.axis, ring.speed * opts.speed * dt);
      const mat = ring.mesh.material as THREE.ShaderMaterial;
      mat.uniforms.uTime!.value = opts.time;
      mat.uniforms.uIntensity!.value = opts.intensity;
      mat.uniforms.uAudio!.value = opts.audio;
    }
  }

  dispose(): void {
    for (const ring of this.rings) {
      ring.mesh.geometry.dispose();
      (ring.mesh.material as THREE.Material).dispose();
    }
    this.rings = [];
  }
}
