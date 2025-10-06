// ParticleSystem_fallback.jsx
import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 CPU-driven fallback particle system (no custom GLSL).
 - Two ribbon rings (A & B) that form a cross.
 - Continuous background flow from both sides.
 - Some background particles are 'charged' (red) and spiral to the core, then snap to ring coords.
 - Ring counts are fixed (no growth). Charged particles visually join rings without increasing ring buffers.
 - Two separate <points>: rings and background for independent sizes.
*/

const RING_RADIUS = 3.2;      // tweak if you want rings tighter / looser
const RING_PER_RING = 2500;   // per ring
const BG_COUNT = 8000;        // background particles
const TOTAL_RINGS = RING_PER_RING * 2;

export default function ParticleSystemFallback() {
  const ringRef = useRef();
  const bgRef = useRef();

  // buffers created once
  const {
    ringPos,
    ringCol,
    ringPhase,
    ringSpeed,
    bgPos,
    bgCol,
    bgVel,
    bgIsRed,
    bgSeed,
  } = useMemo(() => {
    // RING buffers (we'll compute positions each frame)
    const ringPos = new Float32Array(TOTAL_RINGS * 3);
    const ringCol = new Float32Array(TOTAL_RINGS * 3);
    const ringPhase = new Float32Array(TOTAL_RINGS);
    const ringSpeed = new Float32Array(TOTAL_RINGS);

    for (let r = 0; r < TOTAL_RINGS; r++) {
      ringPhase[r] = Math.random();
      ringSpeed[r] = 0.3 + Math.random() * 0.6;
      // ring colors (neon red)
      ringCol[r * 3 + 0] = 1.0;
      ringCol[r * 3 + 1] = 0.06 + Math.random() * 0.03;
      ringCol[r * 3 + 2] = 0.06 + Math.random() * 0.03;
      // initial pos placeholder
      ringPos[r * 3 + 0] = 0;
      ringPos[r * 3 + 1] = 0;
      ringPos[r * 3 + 2] = 0;
    }

    // BACKGROUND buffers (these are updated per-frame)
    const bgPos = new Float32Array(BG_COUNT * 3);
    const bgCol = new Float32Array(BG_COUNT * 3);
    const bgVel = new Float32Array(BG_COUNT * 3); // velocity for red particles (spiral)
    const bgIsRed = new Float32Array(BG_COUNT);
    const bgSeed = new Float32Array(BG_COUNT); // used to stagger motion

    for (let i = 0; i < BG_COUNT; i++) {
      const side = Math.random() < 0.5 ? -1 : 1;
      const sx = side * (10 + Math.random() * 18);
      const sy = (Math.random() - 0.5) * 12;
      const sz = (Math.random() - 0.5) * 28;

      bgPos[i * 3 + 0] = sx;
      bgPos[i * 3 + 1] = sy;
      bgPos[i * 3 + 2] = sz;

      // decide color: some red charged (attracted), some rare blue, else grey
      const r = Math.random();
      if (r < 0.05) { // 5% charged red
        bgCol[i * 3 + 0] = 1.0;
        bgCol[i * 3 + 1] = 0.18;
        bgCol[i * 3 + 2] = 0.18;
        bgIsRed[i] = 1.0;
      } else if (r < 0.055) {
        bgCol[i * 3 + 0] = 0.05;
        bgCol[i * 3 + 1] = 0.9;
        bgCol[i * 3 + 2] = 1.0;
        bgIsRed[i] = 0.0;
      } else {
        const shade = 0.14 + Math.random() * 0.06; // visible on white
        bgCol[i * 3 + 0] = shade;
        bgCol[i * 3 + 1] = shade;
        bgCol[i * 3 + 2] = shade;
        bgIsRed[i] = 0.0;
      }

      // initial velocity (for spirals) starts small
      bgVel[i * 3 + 0] = (Math.random() - 0.5) * 0.02;
      bgVel[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      bgVel[i * 3 + 2] = (Math.random() - 0.5) * 0.02;

      bgSeed[i] = Math.random() * 1000;
    }

    return {
      ringPos,
      ringCol,
      ringPhase,
      ringSpeed,
      bgPos,
      bgCol,
      bgVel,
      bgIsRed,
      bgSeed,
    };
  }, []);

  // create BufferGeometries & attributes once then update in useFrame
  const ringGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(ringPos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(ringCol, 3));
    return geo;
  }, [ringPos, ringCol]);

  const bgGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(bgPos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(bgCol, 3));
    return geo;
  }, [bgPos, bgCol]);

  // Materials: rings small, background slightly larger; both use vertexColors and NormalBlending for white bg
  const ringMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 2.6,
        sizeAttenuation: true,
        vertexColors: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
      }),
    []
  );

  const bgMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 4.0,
        sizeAttenuation: true,
        vertexColors: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
      }),
    []
  );

  // update loop
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // --- update rings: compute ring positions on CPU (ribbon style) ---
    for (let r = 0; r < TOTAL_RINGS; r++) {
      const isB = r >= RING_PER_RING; // second ring
      // esl
      const localIndex = isB ? r - RING_PER_RING : r;
      const phase = (ringPhase[r] + t * 0.08 * ringSpeed[r]) % 1.0;
      // angle along ring
      let ang = phase * Math.PI * 2;
      // wiggle gives ribbon texture
      const wig = Math.sin(phase * 10 + t * 1.2) * 0.03;
      const radius = RING_RADIUS + wig;

      // ring A vs B have different tilts and rotation directions
      if (!isB) {
        // ring A
        let x = Math.cos(ang) * radius;
        let y = Math.sin(ang) * radius * 0.11;
        let z = Math.sin(ang) * radius;
        // slight rotation (precession)
        const rot = t * 0.02;
        const rx = x * Math.cos(rot) + z * Math.sin(rot);
        const rz = -x * Math.sin(rot) + z * Math.cos(rot);
        x = rx; z = rz;
        // tangential slight offset to create ribbon thickness
        const tangX = -Math.sin(ang);
        const tangZ = Math.cos(ang);
        x += tangX * (Math.sin(t * 1.6 + phase * 18) * 0.02);
        z += tangZ * (Math.sin(t * 1.6 + phase * 18) * 0.02);

        ringPos[r * 3 + 0] = x;
        ringPos[r * 3 + 1] = y;
        ringPos[r * 3 + 2] = z;
      } else {
        // ring B (crossing)
        let angB = ang + Math.PI * 0.5; // offset so they cross
        let x = Math.cos(angB) * radius;
        let y = Math.sin(angB) * radius * 0.095;
        let z = Math.sin(angB) * radius;
        // small opposite rotation
        const rot = -t * 0.018;
        const rx = x * Math.cos(rot) + z * Math.sin(rot);
        const rz = -x * Math.sin(rot) + z * Math.cos(rot);
        x = rx; z = rz;
        // ribbon thickness offset
        const tangX = -Math.sin(angB);
        const tangZ = Math.cos(angB);
        x += tangX * (Math.cos(t * 1.4 + phase * 16) * 0.02);
        z += tangZ * (Math.cos(t * 1.4 + phase * 16) * 0.02);

        ringPos[r * 3 + 0] = x;
        ringPos[r * 3 + 1] = y;
        ringPos[r * 3 + 2] = z;
      }
    }

    // mark ring attribute for update
    if (ringRef.current) {
      ringRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // --- update background particles ---
    // We'll move non-red particles with smooth flow and wrap;
    // red particles get gravity + tangential spiral and then snap to ring area.
    for (let i = 0; i < BG_COUNT; i++) {
      let ix = i * 3;
      let x = bgPos[ix + 0];
      let y = bgPos[ix + 1];
      let z = bgPos[ix + 2];
      const isRed = bgIsRed[i] > 0.5;

      if (!isRed) {
        // normal flow: sweep from edges to center and wrap
        const dir = Math.sign(x);
        const span = 30;
        // lift travel speed with a slow phase
        const speed = 0.4 + (0.6 * (0.5 + 0.5 * Math.sin(bgSeed[i] + t * 0.2)));
        let travel = (t * speed * 0.6 + Math.abs(x) * 0.12) % span;
        x = dir * (span - travel);
        // turbulence
        y = (Math.random() - 0.5) * 0.3 + y + Math.sin(t * 0.45 + bgSeed[i] * 0.12) * 0.004;
        z = (Math.random() - 0.5) * 0.3 + z + Math.cos(t * 0.35 + bgSeed[i] * 0.09) * 0.003;
      } else {
        // charged particle: compute gravity-like pull + tangential spiral
        const dir = Math.sign(x === 0 ? (Math.random() - 0.5) : x);
        const span = 30;
        // move inward baseline like normal but slower (keeps appearing)
        let travel = (t * (0.3 + (0.4 * Math.sin(bgSeed[i] * 0.5 + t * 0.1))) + Math.abs(x) * 0.12) % span;
        x = dir * (span - travel);

        // compute gravity towards center
        let dist = Math.sqrt(x * x + y * y + z * z) + 1e-6;
        const toCx = -x / dist;
        const toCy = -y / dist;
        const toCz = -z / dist;
        // gravity strength grows as it approaches (soft exponent)
        let g = 0.9 * (1.0 / Math.pow(dist + 0.45, 1.05));
        g = Math.min(Math.max(g, 0.0), 0.9);
        // apply gravitational step
        bgVel[ix + 0] += toCx * g * 0.06;
        bgVel[ix + 1] += toCy * g * 0.06;
        bgVel[ix + 2] += toCz * g * 0.06;
        // tangential spiral
        const tangX = -toCz;
        const tangZ = toCx;
        bgVel[ix + 0] += tangX * g * 0.03;
        bgVel[ix + 2] += tangZ * g * 0.03;

        // integrate
        x += bgVel[ix + 0];
        y += bgVel[ix + 1];
        z += bgVel[ix + 2];

        // if it's close to ring radius, snap it onto ring coords visually
        const distAfter = Math.sqrt(x * x + y * y + z * z);
        if (distAfter < RING_RADIUS + 0.6) {
          // angle and choose ring by initial side
          const ang = Math.atan2(z, x);
          const chooseRing = x > 0 ? 1 : 0;
          const ringAngle = ang + (chooseRing ? t * 0.9 : -t * 0.8);
          const rr = RING_RADIUS + Math.sin(ringAngle * 6.0 + t * 1.8) * 0.02;
          let rx = Math.cos(ringAngle) * rr;
          let ry = Math.sin(ringAngle) * rr * (chooseRing ? 0.10 : 0.11);
          let rz = Math.sin(ringAngle) * rr;
          // rotate slightly to match ring orientation
          const rot = chooseRing ? -t * 0.03 : t * 0.02;
          const rrx = rx * Math.cos(rot) + rz * Math.sin(rot);
          const rrz = -rx * Math.sin(rot) + rz * Math.cos(rot);
          rx = rrx; rz = rrz;
          // keep this particle on ring position
          x = rx;
          y = ry;
          z = rz;
          // reduce velocity so it stays stable on ring
          bgVel[ix + 0] *= 0.1;
          bgVel[ix + 1] *= 0.1;
          bgVel[ix + 2] *= 0.1;
        }
      }

      // write back
      bgPos[ix + 0] = x;
      bgPos[ix + 1] = y;
      bgPos[ix + 2] = z;
    }

    // signal updates
    if (bgRef.current) {
      bgRef.current.geometry.attributes.position.needsUpdate = true;
      // we may also occasionally tweak color or size in future
    }
  });

  // render: two separate points (rings + background)
  return (
    <group>
      <points ref={ringRef} geometry={ringGeo} material={ringMaterial} />
      <points ref={bgRef} geometry={bgGeo} material={bgMaterial} />
      {/* small neon core for ambient vibe */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshBasicMaterial color={"#00e5ff"} transparent opacity={0.25} />
      </mesh>
      <pointLight color={0xff3f3f} intensity={0.9} distance={12} decay={2} />
    </group>
  );
}
