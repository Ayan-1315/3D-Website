import React, { forwardRef, useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 ParticleSystem.jsx — fix:
 - background particles never vanish
 - red particles fade smoothly as they merge onto ribbons (no abrupt hole)
 - small jitter when snapping to rings to avoid stacking
 - slightly faster ring motion so rings don't appear static
*/

const RING_RADIUS = 3.4;
const RING_PER_RING = 1200;
const BG_COUNT = 9000;
const COUNT = RING_PER_RING * 2 + BG_COUNT;

const vertexShader = `
  precision highp float;
  uniform float uTime;
  uniform float uIntro;
  uniform float uRingRadius;

  attribute vec3 aColor;
  attribute float aSpeed;
  attribute float aType;        // 0 ringA, 1 ringB, 2 background
  attribute float aRingT;
  attribute vec3 aInitialOffset;
  attribute float aIsRed;      // 1 => charged red

  varying vec3 vColor;
  varying float vIsRed;
  varying float vMerge;        // 0..1 merge progress (1 = fully merged)
  varying float vDepth;

  // small rotateY helper (keeps shader simple)
  vec3 rotateY(vec3 p, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c);
  }

  void main() {
    vColor = aColor;
    vIsRed = aIsRed;
    vMerge = 0.0;

    vec3 pos = vec3(0.0);
    float baseSize = 6.0;

    // ---- Ring A (ribbon) ----
    if (aType < 0.5) {
      float t = fract(aRingT + uTime * 0.0006 * aSpeed);
      float ang = t * 6.28318530718 + uTime * 0.22 * aSpeed;
      float wig = sin(t * 10.0 + uTime * 1.1) * 0.02;
      float radius = uRingRadius + wig;
      vec3 p = vec3(cos(ang) * radius, sin(ang) * radius * 0.10, sin(ang) * radius);
      // stronger precession so rings move
      p = rotateY(p, uTime * 0.035);
      // lateral jitter to create ribbon rows
      vec3 tang = normalize(vec3(-sin(ang), 0.0, cos(ang)));
      p += tang * (sin(uTime * 1.6 + t * 18.0) * 0.02);
      pos = p;
      baseSize = 3.0;
    }
    // ---- Ring B (crossing ribbon) ----
    else if (aType >= 0.5 && aType < 1.5) {
      float t = fract(aRingT - uTime * 0.00045 * aSpeed);
      float ang = t * 6.28318530718 - uTime * 0.18 * aSpeed;
      float wig = cos(t * 9.0 + uTime * 0.9) * 0.02;
      float radius = uRingRadius + wig;
      vec3 p = vec3(cos(ang) * radius, sin(ang) * radius * 0.095, sin(ang) * radius);
      p = rotateY(p, -uTime * 0.03);
      p = vec3(p.x, p.y * 0.98, p.z);
      vec3 tang = normalize(vec3(-sin(ang), 0.0, cos(ang)));
      p += tang * (cos(uTime * 1.4 + t * 16.0) * 0.025);
      pos = p;
      baseSize = 3.0;
    }
    // ---- Background flow (two-sided) ----
    else {
      vec3 p = aInitialOffset;
      float dir = sign(aInitialOffset.x);
      float span = 30.0;
      float travel = mod(uTime * (aSpeed * 0.6 + 0.45) + abs(aInitialOffset.x) * 0.12, span);
      p.x = dir * (span - travel);
      p.y += sin(uTime * 0.45 + aInitialOffset.x * 0.12) * 0.44;
      p.z += cos(uTime * 0.35 + aInitialOffset.y * 0.09) * 0.44;

      // charged red: gravity-ish pull + tangential spiral; fade & snap with jitter
      if (aIsRed > 0.5) {
        float dist = length(p);
        if (dist > 0.0001) {
          vec3 toCenter = -p / dist;
          float g = 0.82 * (1.0 / pow(dist + 0.52, 1.05));
          g = clamp(g, 0.0, 0.92);
          p += toCenter * g;
          vec3 up = vec3(0.0, 1.0, 0.0);
          vec3 tang = normalize(cross(toCenter, up));
          p += tang * (0.62 * g);

          // compute a smooth merge factor: 0 when far, 1 when very close
          float merge = 1.0 - smoothstep(uRingRadius + 0.6, uRingRadius + 0.12, dist);
          vMerge = clamp(merge, 0.0, 1.0);

          // when very close, snap onto ring but add a tiny jitter to avoid stacking
          if (dist < (uRingRadius + 0.28)) {
            float ang = atan(p.z, p.x) + (p.x > 0.0 ? uTime * 0.9 : -uTime * 0.8);
            float rr = uRingRadius + sin(ang * 6.0 + uTime * 1.6) * 0.02;
            vec3 ringP = vec3(cos(ang) * rr, sin(ang) * rr * (p.x > 0.0 ? 0.10 : 0.11), sin(ang) * rr);
            if (p.x > 0.0) ringP = rotateY(ringP, -uTime * 0.03);
            else ringP = rotateY(ringP, uTime * 0.02);
            // tiny jitter based on initial offset so multiple red particles don't stack
            float jitter = (fract(sin(aInitialOffset.y * 12.9898) * 43758.5453) - 0.5) * 0.03;
            ringP += normalize(ringP) * jitter;
            p = ringP;
            // ensure merge factor hits 1 when snapped
            vMerge = 1.0;
          }
        }
      }

      pos = p;
      baseSize = 8.0;
    }

    // spawn spread -> final
    vec3 introPos = aInitialOffset * 1.6;
    vec3 finalPos = mix(introPos, pos, clamp(uIntro, 0.0, 1.0));

    // pass depth influence to fragment for subtle pop
    vDepth = clamp(1.0 - smoothstep(0.0, 12.0, length(finalPos)), 0.25, 1.0);

    vec4 modelP = modelMatrix * vec4(finalPos, 1.0);
    vec4 viewP = viewMatrix * modelP;
    gl_Position = projectionMatrix * viewP;

    float size = baseSize * (1.6 / max(0.001, -viewP.z));
    gl_PointSize = clamp(size, 3.0, 48.0);
  }
`;

const fragmentShader = `
  precision highp float;
  uniform float uBoost;

  varying vec3 vColor;
  varying float vIsRed;
  varying float vMerge;
  varying float vDepth;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    if (d > 0.5) discard;
    float edge = smoothstep(0.5, 0.22, d);

    // base color boosted by depth and global boost
    vec3 base = vColor * (0.45 + 0.65 * edge) * (0.6 + 0.6 * vDepth) * (0.6 + uBoost);

    // charged red emphasis glow
    if (vIsRed > 0.5) {
      base += vec3(0.38, 0.08, 0.08) * (1.0 - d) * (0.9 + vDepth);
    }

    // smooth fade for merge: when vMerge is 0 -> fully visible,
    // when vMerge approaches 1 -> fade out smoothly (not abrupt)
    float alpha = 1.0;
    if (vIsRed > 0.5) {
      // cubic fade gives a nicer curve
      float f = clamp(vMerge, 0.0, 1.0);
      alpha = 1.0 - (f * f * (3.0 - 2.0 * f)); // smoothstep-like easing
      // keep a tiny remnant for subtle glow even at final fade
      alpha = max(alpha, 0.0);
    }

    // non-red background never vanishes
    gl_FragColor = vec4(base, alpha);
  }
`;

/* core energy sphere shaders (unchanged behavior) */
const coreVertex = `
  varying vec3 vPos;
  void main() {
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const coreFragment = `
  precision highp float;
  uniform float uTime;
  uniform vec3 uBase;
  uniform vec3 uAccent;
  varying vec3 vPos;

  float pseudo(vec3 p) {
    return 0.5 + 0.5 * sin(p.x * 3.0 + uTime * 2.0) * cos(p.y * 2.5 - uTime * 1.4);
  }

  void main() {
    float n = pseudo(vPos * 1.5);
    float glow = smoothstep(0.12, 0.95, n);
    vec3 col = mix(uBase, uAccent, n) * (0.6 + glow);
    float alpha = clamp(0.28 + glow * 0.42, 0.15, 0.8);
    gl_FragColor = vec4(col, alpha);
  }
`;

const ParticleSystem = forwardRef((props, ref) => {
  const shaderRef = useRef();
  const coreRef = useRef();
  const lightRef = useRef();

  const [positions, colors, speeds, types, ringT, initialOffsets, isRed] = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const speeds = new Float32Array(COUNT);
    const types = new Float32Array(COUNT);
    const ringT = new Float32Array(COUNT);
    const initialOffsets = new Float32Array(COUNT * 3);
    const isRed = new Float32Array(COUNT);

    let i = 0;
    // Ring A
    for (let r = 0; r < RING_PER_RING; r++, i++) {
      types[i] = 0.0;
      ringT[i] = r / RING_PER_RING;
      speeds[i] = 0.45 + Math.random() * 0.6;
      colors[i * 3 + 0] = 1.0; colors[i * 3 + 1] = 0.06 + Math.random() * 0.03; colors[i * 3 + 2] = 0.06 + Math.random() * 0.03;
      initialOffsets[i * 3 + 0] = (Math.random() - 0.5) * 1.2;
      initialOffsets[i * 3 + 1] = (Math.random() - 0.5) * 0.8;
      initialOffsets[i * 3 + 2] = (Math.random() - 0.5) * 1.2;
      isRed[i] = 0.0;
    }

    // Ring B
    for (let r = 0; r < RING_PER_RING; r++, i++) {
      types[i] = 1.0;
      ringT[i] = r / RING_PER_RING;
      speeds[i] = 0.45 + Math.random() * 0.6;
      colors[i * 3 + 0] = 1.0; colors[i * 3 + 1] = 0.06 + Math.random() * 0.03; colors[i * 3 + 2] = 0.06 + Math.random() * 0.03;
      initialOffsets[i * 3 + 0] = (Math.random() - 0.5) * 1.2;
      initialOffsets[i * 3 + 1] = (Math.random() - 0.5) * 0.8;
      initialOffsets[i * 3 + 2] = (Math.random() - 0.5) * 1.2;
      isRed[i] = 0.0;
    }

    // Background
    for (let b = 0; b < BG_COUNT; b++, i++) {
      types[i] = 2.0;
      ringT[i] = 0.0;
      speeds[i] = 0.6 + Math.random() * 1.0;
      const side = Math.random() < 0.5 ? -1 : 1;
      const sx = side * (10 + Math.random() * 18);
      const sy = (Math.random() - 0.5) * 12;
      const sz = (Math.random() - 0.5) * 28;
      initialOffsets[i * 3 + 0] = sx;
      initialOffsets[i * 3 + 1] = sy;
      initialOffsets[i * 3 + 2] = sz;

      const r = Math.random();
      if (r < 0.05) {
        colors[i * 3 + 0] = 1.0; colors[i * 3 + 1] = 0.18; colors[i * 3 + 2] = 0.18;
        isRed[i] = 1.0;
      } else if (r < 0.06) {
        colors[i * 3 + 0] = 0.05; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 1.0;
        isRed[i] = 0.0;
      } else {
        const shade = 0.14 + Math.random() * 0.06;
        colors[i * 3 + 0] = shade; colors[i * 3 + 1] = shade; colors[i * 3 + 2] = shade;
        isRed[i] = 0.0;
      }
    }

    return [positions, colors, speeds, types, ringT, initialOffsets, isRed];
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = t;
      shaderRef.current.uniforms.uIntro.value = Math.min(1.0, t * 0.35);
      shaderRef.current.uniforms.uRingRadius.value = RING_RADIUS;
      shaderRef.current.uniforms.uBoost.value = 0.18;
    }
    if (coreRef.current) coreRef.current.uniforms.uTime.value = t;
    if (lightRef.current) {
      const tt = clock.getElapsedTime();
      lightRef.current.intensity = 0.9 + Math.sin(tt * 1.1) * 0.25;
      lightRef.current.position.set(Math.sin(tt * 0.6) * 0.12, Math.cos(tt * 0.9) * 0.08, 0.18);
    }
  });

  return (
    <group>
      <points ref={ref}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" array={positions} count={positions.length / 3} itemSize={3} />
          <bufferAttribute attach="attributes-aColor" array={colors} count={colors.length / 3} itemSize={3} />
          <bufferAttribute attach="attributes-aSpeed" array={speeds} count={speeds.length} itemSize={1} />
          <bufferAttribute attach="attributes-aType" array={types} count={types.length} itemSize={1} />
          <bufferAttribute attach="attributes-aRingT" array={ringT} count={ringT.length} itemSize={1} />
          <bufferAttribute attach="attributes-aInitialOffset" array={initialOffsets} count={initialOffsets.length / 3} itemSize={3} />
          <bufferAttribute attach="attributes-aIsRed" array={isRed} count={isRed.length} itemSize={1} />
        </bufferGeometry>

        <shaderMaterial
          ref={shaderRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={{
            uTime: { value: 0 },
            uIntro: { value: 0 },
            uRingRadius: { value: RING_RADIUS },
            uBoost: { value: 0.0 },
          }}
          transparent={true}
          depthWrite={false}
          depthTest={true}
          blending={THREE.NormalBlending}
        />
      </points>

      {/* core energy sphere */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.2, 48, 48]} />
        <shaderMaterial
          ref={coreRef}
          vertexShader={coreVertex}
          fragmentShader={coreFragment}
          uniforms={{
            uTime: { value: 0 },
            uBase: { value: new THREE.Color("#00e5ff") },
            uAccent: { value: new THREE.Color("#ff3f3f") },
          }}
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <pointLight ref={lightRef} color={0xff3f3f} intensity={0.9} distance={12} decay={2} />
    </group>
  );
});

export default ParticleSystem;
