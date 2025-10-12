// src/components/LeavesTransition.jsx
import React, { useMemo, useRef, useEffect } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { Physics, RigidBody } from "@react-three/rapier";
import * as THREE from "three";

/**
 * Smooth, non-jumping LeavesTransition
 * - Instanced leaves are driven by base state + smooth trigs (no state mutation surprises)
 * - Wrap by shifting (x += width) rather than teleport-to-fixed to avoid jumps
 * - Small set of physics leaves for collisions; keep count low for performance
 */

const INSTANCED_COUNT = 100;
const PHYSICS_COUNT = 8;
const PHYSICS_ITERATIONS = 2;

const HORIZ_WRAP = 40; // world units width to loop across
const VERT_WRAP = 22; // vertical span to loop across

const LEAF_TEXTURES = {
  spring: "/textures/leaf_pink.png",
  autumn: "/textures/leaf_yellow.png",
  fall: "/textures/leaf_red.png",
};

function InstancedLeaves({ texture, count = INSTANCED_COUNT }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Create immutable seed base state per instance
  const seeds = useMemo(() => {
    const arr = new Array(count);
    for (let i = 0; i < count; i++) {
      const baseX = THREE.MathUtils.randFloatSpread(HORIZ_WRAP); // -W/2 .. W/2
      const baseY = THREE.MathUtils.randFloatSpread(VERT_WRAP); // -H/2 .. H/2
      const baseZ = THREE.MathUtils.randFloat(-5, 5);
      const speedX = THREE.MathUtils.randFloat(0.008, 0.04); // horizontal drift
      const swayFreq = THREE.MathUtils.randFloat(0.3, 1.2);
      const swayAmp = THREE.MathUtils.randFloat(0.08, 0.6);
      const rotBase = THREE.MathUtils.randFloat(0, Math.PI * 2);
      const rotFreq = THREE.MathUtils.randFloat(0.2, 0.9);
      const rotAmp = THREE.MathUtils.randFloat(0.15, 0.7);
      const scale = THREE.MathUtils.randFloat(0.45, 1.12);
      arr[i] = {
        baseX,
        baseY,
        baseZ,
        speedX,
        swayFreq,
        swayAmp,
        rotBase,
        rotFreq,
        rotAmp,
        scale,
        // small phase offsets for de-synchronization
        phase: Math.random() * Math.PI * 2,
      };
    }
    return arr;
  }, [count]);

  // We keep a *runtime* X offset for continuity instead of mutating baseX directly.
  // That avoids jumps when wrapping.
  const runtimeOffsets = useMemo(() => new Float32Array(count).fill(0), [count]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const s = seeds[i];

      // Move horizontally: runtime offset increases over time according to speed
      runtimeOffsets[i] -= s.speedX;
      // compute continuous x by baseX + runtimeOffset
      let x = s.baseX + runtimeOffsets[i];

      // wrap smoothly: when x < -HORIZ_WRAP/2 push it forward by HORIZ_WRAP
      // adding HORIZ_WRAP preserves continuity (no reset to unrelated value)
      const halfW = HORIZ_WRAP / 2;
      if (x < -halfW) {
        runtimeOffsets[i] += HORIZ_WRAP; // shift forward by full width
        x = s.baseX + runtimeOffsets[i];
      } else if (x > halfW) {
        runtimeOffsets[i] -= HORIZ_WRAP;
        x = s.baseX + runtimeOffsets[i];
      }

      // Vertical: compute as baseY + sin oscillation (no accumulated mutation)
      const y = s.baseY + Math.sin(t * s.swayFreq + s.phase) * s.swayAmp * (1 + (s.baseZ / 6));

      // Z depth remains baseZ but add a tiny bob so leaves feel alive
      const z = s.baseZ + Math.sin(t * (0.4 + s.swayFreq * 0.1) + s.phase * 0.5) * 0.06;

      // Rotation = base rotation + small oscillation (no persistent mutation)
      const rotZ = s.rotBase + Math.sin(t * s.rotFreq + s.phase * 0.7) * s.rotAmp;

      dummy.position.set(x, y, z);
      dummy.rotation.set(0, 0, rotZ);
      dummy.scale.setScalar(s.scale);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <planeGeometry args={[0.6, 0.6]} />
      <meshStandardMaterial
        map={texture}
        side={THREE.DoubleSide}
        transparent={true}
        alphaTest={0.03}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

function PhysicsLeaves({ texture, count = PHYSICS_COUNT }) {
  // place physics leaves across full frame but keep initial positions close to natural band
  const leaves = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: THREE.MathUtils.randFloatSpread(HORIZ_WRAP),
        y: THREE.MathUtils.randFloatSpread(VERT_WRAP),
        z: THREE.MathUtils.randFloat(-3, 3),
        rotZ: THREE.MathUtils.randFloat(-0.5, 0.5),
        scale: THREE.MathUtils.randFloat(0.6, 1.15),
      });
    }
    return arr;
  }, [count]);

  return (
    <>
      {leaves.map((l, idx) => (
        <RigidBody
          key={idx}
          type="dynamic"
          position={[l.x, l.y, l.z]}
          rotation={[0, 0, l.rotZ]}
          restitution={0.06}
          friction={1.0}
          linearDamping={0.45}
          angularDamping={0.8}
          colliders="cuboid"
        >
          <mesh scale={[l.scale, l.scale, l.scale]}>
            <planeGeometry args={[0.6, 0.6]} />
            <meshStandardMaterial
              map={texture}
              side={THREE.DoubleSide}
              transparent={true}
              alphaTest={0.03}
              depthWrite={false}
            />
          </mesh>
        </RigidBody>
      ))}
    </>
  );
}

export default function LeavesTransition({
  season = "spring",
  // eslint-disable-next-line
  isTransitioning = false,
  // eslint-disable-next-line
  onTransitionComplete = () => {},
}) {
  const url = LEAF_TEXTURES[season] || LEAF_TEXTURES.spring;
  const texture = useLoader(THREE.TextureLoader, url);

  useEffect(() => {
    if (texture) {
      texture.encoding = THREE.sRGBEncoding;
      texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.needsUpdate = true;
    }
  }, [texture]);

  // invisible wide floor so physics leaves settle naturally
  const floorSize = HORIZ_WRAP * 1.2;

  return (
    <>
      {texture && <InstancedLeaves texture={texture} count={INSTANCED_COUNT} />}

      <Physics gravity={[0, -3.2, 0]} iterations={PHYSICS_ITERATIONS}>
        {texture && <PhysicsLeaves texture={texture} count={PHYSICS_COUNT} />}
        <RigidBody type="fixed" colliders="cuboid" position={[0, -VERT_WRAP / 2 - 2, 0]}>
          <mesh scale={[floorSize, 0.5, 10]} visible={false}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial transparent opacity={0} />
          </mesh>
        </RigidBody>
      </Physics>
    </>
  );
}
