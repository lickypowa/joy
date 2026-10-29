export const energyRingVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const energyRingFragmentShader = /* glsl */ `
uniform float uTime;
uniform float uIntensity;
uniform float uAudio;
uniform vec3 uColor;

varying vec2 vUv;

void main() {
  float along = vUv.x;
  float band = smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.88, vUv.y);
  float travel = fract(along * 3.0 - uTime * (0.35 + uAudio * 1.4));
  float spark = smoothstep(0.72, 1.0, travel) * band;
  float body = band * (0.25 + 0.55 * uIntensity);
  vec3 color = uColor * (body + spark * (1.2 + uAudio));
  float alpha = body * 0.75 + spark * 0.95;
  gl_FragColor = vec4(color, alpha);
}
`;
