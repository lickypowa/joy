import * as THREE from 'three';

/** Rounded equilateral triangle centerline (Reuleaux-like chassis path). */
export function createRoundedTriangleCurve(radius = 1.35, cornerSamples = 18): THREE.CatmullRomCurve3 {
  const verts: THREE.Vector3[] = [];
  for (let i = 0; i < 3; i += 1) {
    const angle = -Math.PI / 2 + (i * Math.PI * 2) / 3;
    verts.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
  }

  const points: THREE.Vector3[] = [];
  for (let i = 0; i < 3; i += 1) {
    const prev = verts[(i + 2) % 3]!;
    const curr = verts[i]!;
    const next = verts[(i + 1) % 3]!;
    const toPrev = prev.clone().sub(curr).normalize();
    const toNext = next.clone().sub(curr).normalize();
    const cornerRadius = radius * 0.34;
    const start = curr.clone().add(toPrev.multiplyScalar(-cornerRadius));
    const end = curr.clone().add(toNext.multiplyScalar(-cornerRadius));

    for (let s = 0; s <= cornerSamples; s += 1) {
      const t = s / cornerSamples;
      const p = new THREE.Vector3()
        .addScaledVector(start, (1 - t) * (1 - t))
        .addScaledVector(curr, 2 * (1 - t) * t)
        .addScaledVector(end, t * t);
      points.push(p);
    }
  }

  points.push(points[0]!.clone());
  return new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.15);
}

export function createChassisGeometry(quality: 'high' | 'medium' | 'low'): THREE.TubeGeometry {
  const tubular = quality === 'high' ? 260 : quality === 'medium' ? 160 : 100;
  const radial = quality === 'high' ? 22 : quality === 'medium' ? 14 : 10;
  const curve = createRoundedTriangleCurve(1.55);
  return new THREE.TubeGeometry(curve, tubular, 0.2, radial, true);
}

export function createCrystalGeometry(quality: 'high' | 'medium' | 'low'): THREE.BufferGeometry {
  const detail = quality === 'high' ? 1 : 0;
  const geom = new THREE.OctahedronGeometry(0.42, detail);
  geom.computeVertexNormals();
  return geom;
}
