import * as THREE from 'three';

export class ExecutionBeam {
  readonly mesh: THREE.Mesh;
  private material: THREE.MeshBasicMaterial;

  constructor() {
    const geometry = new THREE.CylinderGeometry(0.04, 0.04, 4.4, 16, 1, true);
    this.material = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#ff2a1f'),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.mesh = new THREE.Mesh(geometry, this.material);
  }

  update(opts: { opacity: number; audio: number; pulse: number }): void {
    const target = Math.max(0, opts.opacity);
    this.material.opacity = target * (0.55 + opts.pulse * 0.35 + opts.audio * 0.25);
    const scale = 1 + opts.audio * 0.35 + opts.pulse * 0.15;
    this.mesh.scale.set(scale, 1, scale);
    this.mesh.visible = this.material.opacity > 0.01;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
