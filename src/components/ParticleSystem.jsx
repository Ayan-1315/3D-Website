import React, { forwardRef, useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
  Updated ParticleSystem.jsx
  - Smaller rings (fit inside isosphere)
  - Two crossing ribbon rings (A & B)
  - Continuous 2-side background flow (infinite wrap)
  - Background particles attract to the sphere and fade/teleport away when close
  - Ring particles smaller and ribbon-like
  - Transparent with Normal blending so greys read on white
*/

const RING_RADIUS = 3.1;     // <-- smaller so it fits in isosphere
const RING_PER_RING = 600;   // points per ring (smooth ribbon)
const BG_COUNT = 20000;       // background particle count
const TOTAL = RING_PER_RING * 2 + BG_COUNT;

const vertexShader = `
  precision highp float;
  uniform float uTime;
  uniform float uIntro;

  attribute vec3 aColor;
  attribute float aType;      // 0 = ringA, 1 = ringB, 2 = background
  attribute float aRingT;     // 0..1 position along ring for ring particles
  attribute float aSpeed;
  attribute vec3 aInitialOffset;

  varying vec3 vColor;
  varying float vType;
  varying float vAlpha;

  // small axis-angle rotation helper
  mat3 rotAxisAngle(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    return mat3(
      oc*axis.x*axis.x + c,        oc*axis.x*axis.y - axis.z*s,  oc*axis.z*axis.x + axis.y*s,
      oc*axis.x*axis.y + axis.z*s, oc*axis.y*axis.y + c,         oc*axis.y*axis.z - axis.x*s,
      oc*axis.z*axis.x - axis.y*s, oc*axis.y*axis.z + axis.x*s,  oc*axis.z*axis.z + c
    );
  }

  void main() {
    vColor = aColor;
    vType = aType;

    vec3 currentPos = vec3(0.0);
    float pointBase = 6.0;

    // ===== RIBBON RINGS =====
    if (aType < 0.5) {
      float t = fract(aRingT);
      float angle = t * 6.28318530718 + uTime * aSpeed * 0.6;
      float wav = sin(t * 12.0 + uTime * 1.4) * 0.04;        // subtle ribbon wiggle
      float radius = ${RING_RADIUS} + wav;

      // ribbon cross-section: flatten Y a bit to make a band look
      vec3 p = vec3(cos(angle) * radius, sin(angle) * radius * 0.12, sin(angle) * radius);

      // tilt & slow precession for cross formation
      mat3 pr = rotAxisAngle(vec3(0.0,1.0,0.0), uTime * 0.035);
      mat3 tilt = rotAxisAngle(vec3(1.0,0.0,0.0), radians(30.0));
      currentPos = (pr * tilt) * p;

      // small lateral thickness to make it look like many particles in a row (ribbon)
      vec3 tang = normalize(vec3(-sin(angle), 0.0, cos(angle)));
      currentPos += tang * (sin(uTime * 2.0 + t * 20.0) * 0.03);

      pointBase = 4.0; // smaller ring points
    }
    else if (aType >= 0.5 && aType < 1.5) {
      // Ring B - different tilt to cross the first ring
      float t = fract(aRingT);
      float angle = t * 6.28318530718 - uTime * aSpeed * 0.55;
      float wav = cos(t * 10.0 + uTime * 1.0) * 0.035;
      float radius = ${RING_RADIUS} + wav;

      vec3 p = vec3(cos(angle) * radius, sin(angle) * radius * 0.10, sin(angle) * radius);

      mat3 pr = rotAxisAngle(vec3(0.0,1.0,0.0), -uTime * 0.03);
      mat3 tiltZ = rotAxisAngle(vec3(0.0,0.0,1.0), radians(32.0));
      currentPos = (pr * tiltZ) * p;

      vec3 tang = normalize(vec3(-sin(angle), 0.0, cos(angle)));
      currentPos += tang * (cos(uTime * 1.6 + t * 18.0) * 0.028);

      pointBase = 4.0;
    }
    else {
      // ===== BACKGROUND FLOW (two-sided) =====
      vec3 p = aInitialOffset; // seed: x holds side + distance
      float dir = sign(aInitialOffset.x); // -1 left, +1 right
      float span = 30.0;

      // continuous sweep from edge->center, then jump to edge again:
      // travel goes 0..span, we map position = dir * (span - travel)
      float travel = mod(uTime * (aSpeed * 0.6 + 0.2) + abs(aInitialOffset.x) * 0.13, span);
      p.x = dir * (span - travel);

      // turbulence in Y/Z
      p.y += sin(uTime * 0.45 + aInitialOffset.x * 0.12) * 0.5;
      p.z += cos(uTime * 0.35 + aInitialOffset.y * 0.09) * 0.5;

      // attraction toward center (so they curve to the sphere)
      float dist = length(p);
      if (dist > 0.001) {
        vec3 dirToCenter = -p / dist;
        float pull = smoothstep(20.0, 4.0, dist) * 0.12;
        p += dirToCenter * pull;
      }

      currentPos = p;
      pointBase = 9.0;

      // If a particle gets extremely close to the sphere, teleport it back to the edge
      // (gives a vanish + re-entry loop)
      float distToCenter = length(currentPos);
      if (distToCenter < 0.8) {
        // push it back to the starting side edge with a new small jitter
        currentPos.x = dir * span;
        currentPos.y = aInitialOffset.y + (fract(sin(aInitialOffset.x*12.9898) * 43758.5453) - 0.5) * 1.2;
        currentPos.z = aInitialOffset.z;
      }
    }

    // intro transition
    vec3 introPos = aInitialOffset * 2.0;
    vec3 finalPos = mix(introPos, currentPos, clamp(uIntro, 0.0, 1.0));

    // compute alpha based on distance to center (fade when near sphere)
    float distCenter = length(finalPos);
    float vanishRadius = 1.5; // how close before they start to fade
    vAlpha = smoothstep(vanishRadius, vanishRadius + 0.9, distCenter); // 0 near center, 1 far

    vec4 modelPos = modelMatrix * vec4(finalPos, 1.0);
    vec4 viewPos = viewMatrix * modelPos;
    gl_Position = projectionMatrix * viewPos;

    // size scaling (smaller for rings)
    float size = pointBase * (1.6 / max(0.001, -viewPos.z));
    gl_PointSize = clamp(size, 2.0, 28.0);
  }
`;

const fragmentShader = `
  precision highp float;
  varying vec3 vColor;
  varying float vType;
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    if (d > 0.5) discard;

    float edge = smoothstep(0.5, 0.28, d);
    vec3 base = vColor * (0.45 + 0.55 * edge);

    // small pop for ring particles
    if (vType < 1.5) {
      base += vec3(0.08, 0.01, 0.01) * (1.0 - d);
    }

    // alpha from vertex to vanish near sphere
    float alpha = clamp(vAlpha, 0.0, 1.0);

    gl_FragColor = vec4(base, alpha);
  }
`;

const ParticleSystem = forwardRef((props, ref) => {
  const shaderRef = useRef();
  const count = TOTAL;

  const [positions, colors, types, ringT, speeds, initialOffsets] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const typ = new Float32Array(count);
    const rt = new Float32Array(count);
    const sp = new Float32Array(count);
    const init = new Float32Array(count * 3);

    let idx = 0;

    // Ring A
    for (let i = 0; i < RING_PER_RING; i++, idx++) {
      typ[idx] = 0.0;
      const t = i / RING_PER_RING;
      rt[idx] = t;
      sp[idx] = 0.6 + Math.random() * 0.6;

      col[idx * 3 + 0] = 1.0; col[idx * 3 + 1] = 0.06; col[idx * 3 + 2] = 0.06;

      init[idx * 3 + 0] = (Math.random() - 0.5) * 2.0;
      init[idx * 3 + 1] = (Math.random() - 0.5) * 1.2;
      init[idx * 3 + 2] = (Math.random() - 0.5) * 2.0;
    }

    // Ring B
    for (let i = 0; i < RING_PER_RING; i++, idx++) {
      typ[idx] = 1.0;
      const t = i / RING_PER_RING;
      rt[idx] = t;
      sp[idx] = 0.5 + Math.random() * 0.6;

      col[idx * 3 + 0] = 1.0; col[idx * 3 + 1] = 0.08; col[idx * 3 + 2] = 0.08;

      init[idx * 3 + 0] = (Math.random() - 0.5) * 2.0;
      init[idx * 3 + 1] = (Math.random() - 0.5) * 1.2;
      init[idx * 3 + 2] = (Math.random() - 0.5) * 2.0;
    }

    // Background flow (both sides)
    for (let i = 0; i < BG_COUNT; i++, idx++) {
      typ[idx] = 2.0;
      rt[idx] = 0.0;
      sp[idx] = 0.5 + Math.random() * 1.2;

      const side = Math.random() < 0.5 ? -1 : 1;
      const sx = side * (10 + Math.random() * 18);
      const sy = (Math.random() - 0.5) * 12;
      const sz = (Math.random() - 0.5) * 28;

      init[idx * 3 + 0] = sx;
      init[idx * 3 + 1] = sy;
      init[idx * 3 + 2] = sz;

      const r = Math.random();
      if (r < 0.015) {
        col[idx * 3 + 0] = 0.05; col[idx * 3 + 1] = 0.9; col[idx * 3 + 2] = 1.0; // neon blue
      } else if (r < 0.03) {
        col[idx * 3 + 0] = 1.0; col[idx * 3 + 1] = 0.18; col[idx * 3 + 2] = 0.18; // neon red
      } else {
        const shade = 0.06 + Math.random() * 0.06;
        col[idx * 3 + 0] = shade; col[idx * 3 + 1] = shade; col[idx * 3 + 2] = shade;
      }
    }

    // positions array placeholders (not used for placement)
    return [pos, col, typ, rt, sp, init];
  }, []);

  useFrame(({ clock }) => {
    if (!shaderRef.current) return;
    const t = clock.getElapsedTime();
    shaderRef.current.uniforms.uTime.value = t;
    shaderRef.current.uniforms.uIntro.value = Math.min(1.0, t * 0.35);
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={positions.length / 3} itemSize={3} />
        <bufferAttribute attach="attributes-aColor" array={colors} count={colors.length / 3} itemSize={3} />
        <bufferAttribute attach="attributes-aType" array={types} count={types.length} itemSize={1} />
        <bufferAttribute attach="attributes-aRingT" array={ringT} count={ringT.length} itemSize={1} />
        <bufferAttribute attach="attributes-aSpeed" array={speeds} count={speeds.length} itemSize={1} />
        <bufferAttribute attach="attributes-aInitialOffset" array={initialOffsets} count={initialOffsets.length / 3} itemSize={3} />
      </bufferGeometry>

      <shaderMaterial
        ref={shaderRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{ uTime: { value: 0 }, uIntro: { value: 0 } }}
        transparent={true}
        depthWrite={false}           // false so alpha blends smoothly over the model
        depthTest={true}
        blending={THREE.NormalBlending}
      />
    </points>
  );
});

export default ParticleSystem;
