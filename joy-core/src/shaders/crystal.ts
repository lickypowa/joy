export const crystalVertexShader = /* glsl */ `
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vViewPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  vec4 mvPosition = viewMatrix * worldPos;
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const crystalFragmentShader = /* glsl */ `
uniform float uTime;
uniform float uIntensity;
uniform float uPulse;
uniform float uGlitch;
uniform vec3 uColorCore;
uniform vec3 uColorHot;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vViewPosition;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.4);

  float facets = abs(dot(normal, normalize(vec3(0.35, 1.0, 0.15))));
  float pulse = 0.65 + 0.35 * sin(uTime * 3.2 + facets * 8.0);
  pulse = mix(pulse, 1.0, uPulse);

  float flicker = 1.0;
  if (uGlitch > 0.01) {
    flicker = mix(1.0, 0.55 + 0.45 * step(0.62, hash(vec2(uTime * 18.0, facets))), uGlitch);
  }

  vec3 color = mix(uColorCore, uColorHot, fresnel * 0.75 + facets * 0.35);
  color *= (0.75 + uIntensity * 0.85) * pulse * flicker;
  color += fresnel * uColorHot * (0.55 + uIntensity * 0.45);

  float alpha = 0.78 + fresnel * 0.22;
  gl_FragColor = vec4(color, alpha);
}
`;
