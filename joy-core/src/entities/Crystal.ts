import * as THREE from 'three';
import type { QualityTier } from '../core/types';
import { createCrystalGeometry } from './geometry';
import { crystalFragmentShader, crystalVertexShader } from '../shaders/crystal';

export class Crystal {
  readonly group = new THREE.Group();
  private crystal: THREE.Mesh;
  private shell: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private quality: QualityTier;

  constructor(quality: QualityTier) {
    this.quality = quality;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 1 },
        uPulse: { value: 0 },
        uGlitch: { value: 0 },
        uColorCore: { value: new THREE.Color('#c40000') },
        uColorHot: { value: new THREE.Color('#ff4d3a') },
      },
      vertexShader: crystalVertexShader,
      fragmentShader: crystalFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.crystal = new THREE.Mesh(createCrystalGeometry(quality), this.material);
    this.crystal.scale.set(1, 1.25, 1);

    const shellMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#120507'),
      metalness: 0,
      roughness: 0.05,
      transmission: 0.92,
      thickness: 1.1,
      ior: 1.4,
      transparent: true,
      opacity: 0.9,
      envMapIntensity: 0.8,
      attenuationColor: new THREE.Color('#e10600'),
      attenuationDistance: 1.4,
    });

    const shellSegments = quality === 'high' ? 48 : quality === 'medium' ? 32 : 20;
    this.shell = new THREE.Mesh(new THREE.SphereGeometry(0.72, shellSegments, shellSegments), shellMat);
    this.shell.renderOrder = 1;

    this.group.add(this.shell, this.crystal);
  }

  setQuality(quality: QualityTier): void {
    if (quality === this.quality) return;
    this.quality = quality;
    this.crystal.geometry.dispose();
    this.crystal.geometry = createCrystalGeometry(quality);
    this.shell.geometry.dispose();
    const shellSegments = quality === 'high' ? 48 : quality === 'medium' ? 32 : 20;
    this.shell.geometry = new THREE.SphereGeometry(0.72, shellSegments, shellSegments);
  }

  update(
    dt: number,
    opts: {
      time: number;
      intensity: number;
      pulse: number;
      glitch: number;
      audio: number;
    },
  ): void {
    this.material.uniforms.uTime!.value = opts.time;
    this.material.uniforms.uIntensity!.value = opts.intensity;
    this.material.uniforms.uPulse!.value = opts.pulse;
    this.material.uniforms.uGlitch!.value = opts.glitch;

    const spin = (0.35 + opts.audio * 1.4) * dt;
    this.crystal.rotation.y += spin;
    this.crystal.rotation.x += spin * 0.35;
    const scale = 1 + opts.pulse * 0.12 + opts.audio * 0.08;
    this.crystal.scale.set(scale, scale * 1.25, scale);

    const shell = this.shell.material as THREE.MeshPhysicalMaterial;
    shell.attenuationDistance = 1.1 - opts.intensity * 0.25;
  }

  dispose(): void {
    this.crystal.geometry.dispose();
    this.material.dispose();
    this.shell.geometry.dispose();
    (this.shell.material as THREE.Material).dispose();
  }
}
