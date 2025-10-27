import React, { useMemo, useRef, useEffect } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { RigidBody, interactionGroups } from "@react-three/rapier";
import * as THREE from "three";
import { createNoise2D } from "simplex-noise";

// --- Collision Groups ---
const GROUP_ENVIRONMENT = 0;
const GROUP_LEAF = 1;

// --- Configuration Constants ---
const INSTANCED_COUNT = 100;
const PHYSICS_COUNT = 6;
const HORIZ_WRAP = 30;
const VERT_WRAP = 22;

// --- Texture Paths ---
const LEAF_TEXTURES = {
  spring: "/textures/leaf_pink.png",
  autumn: "/textures/leaf_yellow.png",
  fall: "/textures/leaf_red.png",
};

const BACKGROUND_TEXTURES = {
  spring: "/textures/PinkLeafScene.png",
  autumn: "/textures/YellowLeafScene.png",
  fall: "/textures/RedLeafScene.png",
};

const noise2D = createNoise2D(Math.random);

// Helper functions
function applyDrag(vel, dragCoef, delta) {
  vel.multiplyScalar(Math.max(0, 1 - dragCoef * delta));
}
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// --- Component for Seasonal Background Image ---
// NOTE: This version uses scene.background for a reliable full-screen cover
function SeasonalBackground({ season }) {
  const { scene, gl } = useThree();
  const url = BACKGROUND_TEXTURES[season] || BACKGROUND_TEXTURES.spring;
  const texture = useLoader(THREE.TextureLoader, url);

  useEffect(() => {
    if (!texture) return;

    // Quality & mapping tweaks
    texture.encoding = THREE.sRGBEncoding;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.anisotropy = Math.min(gl.capabilities.getMaxAnisotropy(), 8);
    texture.needsUpdate = true;

    // Assign as scene background so it always fills the canvas
    const prevBackground = scene.background;
    scene.background = texture;

    return () => {
      // restore previous background (if any) to avoid leaking texture state
      scene.background = prevBackground || null;
      // Do not dispose texture here if you reuse it elsewhere in the app.
      // If you want to dispose when unmounting, uncomment next line:
      // texture.dispose();
    };
  }, [texture, scene, gl]);

  return null; // no mesh needed — renderer draws the background
}
// --- End SeasonalBackground ---


// --- Component for Instanced (non-physics) Leaves ---
function InstancedLeaves({
  texture,
  count = INSTANCED_COUNT,
  season,
  isSlowMo,
}) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const slowMoTime = useRef(0);
  const slowMoFactor = 0.1;

  const seeds = useMemo(() => {
    const arr = new Array(count);
    const windDirection = season === "fall" ? -1.0 : 1.0;
    for (let i = 0; i < count; i++) {
      let baseX = THREE.MathUtils.randFloatSpread(HORIZ_WRAP);
      let baseY = THREE.MathUtils.randFloatSpread(VERT_WRAP);
      if (Math.abs(baseX) < 1.2 && Math.abs(baseY) < 1.2) {
        const signX = Math.sign(baseX) || (Math.random() > 0.5 ? 1 : -1);
        baseX += signX * (1.5 + Math.random() * 2.0);
      }
      const baseZ = THREE.MathUtils.randFloat(-5, 5);
      const speedX = THREE.MathUtils.randFloat(0.008, 0.04) * windDirection;
      const swayFreq = THREE.MathUtils.randFloat(0.3, 1.2);
      const swayAmp = THREE.MathUtils.randFloat(0.08, 0.6);
      const rotBase = THREE.MathUtils.randFloat(0, Math.PI * 2);
      const rotFreq = THREE.MathUtils.randFloat(0.2, 0.9);
      const rotAmp = THREE.MathUtils.randFloat(0.15, 0.7);
      const scale = THREE.MathUtils.randFloat(0.45, 1.12);
      const phase = Math.random() * Math.PI * 2;
      arr[i] = { baseX, baseY, baseZ, speedX, swayFreq, swayAmp, rotBase, rotFreq, rotAmp, scale, phase };
    }
    return arr;
  }, [count, season]);

  const runtimeOffsets = useMemo(() => new Float32Array(count).fill(0), [count]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const timeScale = isSlowMo ? slowMoFactor : 1.0;
    slowMoTime.current += delta * timeScale;
    const t = slowMoTime.current;

    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      runtimeOffsets[i] += s.speedX * timeScale;
      let x = s.baseX + runtimeOffsets[i];
      const halfW = HORIZ_WRAP / 2;
      if (x > halfW) { runtimeOffsets[i] -= HORIZ_WRAP; x = s.baseX + runtimeOffsets[i]; }
      else if (x < -halfW) { runtimeOffsets[i] += HORIZ_WRAP; x = s.baseX + runtimeOffsets[i]; }

      const sway = Math.sin(t * s.swayFreq + s.phase);
      const n = noise2D(s.baseX * 0.02 + t * 0.05, s.baseY * 0.02);
      const y = s.baseY + sway * s.swayAmp * (1 + s.baseZ / 6) + n * 0.08;
      const z = s.baseZ + Math.sin(t * (0.4 + s.swayFreq * 0.1) + s.phase * 0.5) * 0.06 + n * 0.03;
      const rotZ = s.rotBase + Math.sin(t * s.rotFreq + s.phase * 0.7) * s.rotAmp + n * 0.05;

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
      <meshStandardMaterial map={texture} side={THREE.DoubleSide} transparent alphaTest={0.03} depthWrite={false} />
    </instancedMesh>
  );
}
// --- End InstancedLeaves ---


// --- Component for Single Physics-enabled Leaf ---
function PhysicsLeaf({
  texture,
  initialPos,
  initialRot,
  scale,
  leafCollisionGroup,
  season,
}) {
  const bodyRef = useRef();
  const { clock, viewport } = useThree();

  const pileCenterX = useMemo(() => {
    const pileWidth = 4;
    const screenEdge = viewport.width / 2 - pileWidth;
    switch (season) {
      case "spring": return -screenEdge;
      case "fall": return screenEdge;
      case "autumn": return 0;
      default: return 0;
    }
  }, [season, viewport.width]);

  useFrame(() => {
    const body = bodyRef.current;
    if (!body || body.isSleeping?.()) return;

    const bodyPos = body.translation();
    const vel = body.linvel ? body.linvel() : { x: 0, y: 0, z: 0 };
    const v = new THREE.Vector3(vel.x, vel.y, vel.z);
    const t = clock.elapsedTime;
    const delta = Math.min(0.016, clock.getDelta ? clock.getDelta() : 0.016);

    const dragCoef = 0.6;
    applyDrag(v, dragCoef * 0.5, delta);

    const lift = 0.0006 + Math.abs(bodyPos.z) * 0.00002;
    body.applyImpulse({ x: 0, y: lift, z: 0 }, true);

    const windX = noise2D(bodyPos.y * 0.08, t * 0.6) * 0.0012 + (season === "fall" ? -0.0008 : 0.0009);
    const windZ = noise2D(bodyPos.x * 0.08, t * 0.5) * 0.0009;
    body.applyImpulse({ x: windX, y: 0, z: windZ }, true);

    const angNoise = noise2D(bodyPos.x * 0.12, bodyPos.y * 0.12 + t * 0.4);
    const torque = clamp(angNoise * 0.002 + v.length() * 0.0002, -0.005, 0.005);
    try { body.applyTorqueImpulse({ x: 0, y: 0, z: torque }, true); } catch (e) {e }

    body.setLinearDamping(0.6);
    body.setAngularDamping(0.9);

    try { body.setLinvel({ x: v.x, y: v.y, z: v.z }, true); } catch (e) { e}

    const centerRadius = 1.25;
    if (Math.abs(bodyPos.x) < centerRadius && Math.abs(bodyPos.y) < centerRadius) {
      const pushX = (Math.sign(bodyPos.x) || (Math.random() > 0.5 ? 1 : -1)) * (0.02 + Math.random() * 0.02);
      const pushY = (Math.sign(bodyPos.y) || (Math.random() > 0.5 ? 1 : -1)) * (0.02 + Math.random() * 0.02);
      body.applyImpulse({ x: pushX, y: pushY, z: 0 }, true);
    }

    const groundY = -viewport.height / 2;
    if (bodyPos.y < groundY + 0.5) {
      body.setLinearDamping(10);
      body.setAngularDamping(10);
      const push = (pileCenterX - bodyPos.x) * 0.0025;
      body.applyImpulse({ x: push, y: 0, z: 0 }, true);
      setTimeout(() => {
        if (bodyRef.current && !bodyRef.current.isSleeping?.()) {
          const finalX = pileCenterX + (Math.random() - 0.5) * 4;
          try {
            bodyRef.current.setTranslation({ x: finalX, y: groundY + Math.random() * 0.08, z: Math.random() * 0.5 }, true);
            bodyRef.current.sleep();
          } catch (e) {e }
        }
      }, 300);
      return;
    }
  });

  return (
    <RigidBody
      ref={bodyRef} type="dynamic" position={initialPos} rotation={initialRot}
      restitution={0.06} friction={0.9} linearDamping={0.6} angularDamping={0.9}
      colliders="cuboid" collisionGroups={leafCollisionGroup} >
      <mesh scale={[scale, scale, scale]}>
        <planeGeometry args={[0.6, 0.6]} />
        <meshStandardMaterial map={texture} side={THREE.DoubleSide} transparent={true} alphaTest={0.03} depthWrite={false} />
      </mesh>
    </RigidBody>
  );
}
// --- End PhysicsLeaf ---


// --- Component Managing Multiple Physics Leaves ---
function PhysicsLeaves({ texture, count = PHYSICS_COUNT, season }) {
  const leafCollisionGroup = useMemo(() => interactionGroups([GROUP_LEAF], [GROUP_ENVIRONMENT]), []);
  const leaves = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      let x, y; const minCenterDist = 1.8;
      do { x = THREE.MathUtils.randFloatSpread(HORIZ_WRAP); y = THREE.MathUtils.randFloatSpread(VERT_WRAP); }
      while (Math.abs(x) < minCenterDist && Math.abs(y) < minCenterDist);
      arr.push({ id: i, pos: [x, y, THREE.MathUtils.randFloat(-3, 3)], rot: [0, 0, THREE.MathUtils.randFloat(-0.5, 0.5)], scale: THREE.MathUtils.randFloat(0.6, 1.15) });
    }
    return arr;
  }, [count]);

  return (
    <>
      {leaves.map((l) => (
        <PhysicsLeaf key={l.id} texture={texture} initialPos={l.pos} initialRot={l.rot} scale={l.scale} leafCollisionGroup={leafCollisionGroup} season={season}/>
      ))}
    </>
  );
}
// --- End PhysicsLeaves ---


// --- Component for Static Leaf Pile on the Ground ---
function LeafPile({ texture, count = 20, season }) {
  const meshRef = useRef();
  const { viewport } = useThree();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const pileCenterX = useMemo(() => {
    const pileWidth = 4; const screenEdge = viewport.width / 2 - pileWidth;
    switch (season) { case "spring": return -screenEdge; case "fall": return screenEdge; case "autumn": return 0; default: return 0; }
  }, [season, viewport.width]);
  const groundY = -viewport.height / 2;

  useMemo(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < count; i++) {
      const x = pileCenterX + (Math.random() - 0.5) * 4;
      const y = groundY + Math.random() * 0.15;
      const z = Math.random() * 0.5;
      const rotZ = Math.random() * Math.PI * 2;
      const scale = THREE.MathUtils.randFloat(0.6, 1.15);
      dummy.position.set(x, y, z); dummy.rotation.set(0, 0, rotZ); dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [count, pileCenterX, groundY, dummy]);

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <planeGeometry args={[0.6, 0.6]} />
      <meshStandardMaterial map={texture} side={THREE.DoubleSide} transparent={true} alphaTest={0.03} depthWrite={false} />
    </instancedMesh>
  );
}
// --- End LeafPile ---


// --- Main Exported Component ---
export default function LeavesTransition({
  season = "spring",
  isSlowMo = false,
}) {
  const { viewport } = useThree();
  const leafUrl = LEAF_TEXTURES[season] || LEAF_TEXTURES.spring;
  const leafTexture = useLoader(THREE.TextureLoader, leafUrl);

  useEffect(() => {
    if (leafTexture) {
      leafTexture.encoding = THREE.sRGBEncoding;
      leafTexture.wrapS = leafTexture.wrapT = THREE.ClampToEdgeWrapping;
      leafTexture.needsUpdate = true;
    }
  }, [leafTexture]);

  const floorCollisionGroup = useMemo(() => interactionGroups([GROUP_ENVIRONMENT], [GROUP_LEAF]), []);
  const groundY = -viewport.height / 2;
  const floorSize = viewport.width * 1.2;

  return (
    <>
      <SeasonalBackground season={season} />
      {leafTexture && <InstancedLeaves texture={leafTexture} count={INSTANCED_COUNT} season={season} isSlowMo={isSlowMo} />}
      {leafTexture && <PhysicsLeaves texture={leafTexture} count={PHYSICS_COUNT} season={season} />}
      {leafTexture && <LeafPile texture={leafTexture} season={season} />}
      <RigidBody type="fixed" colliders="cuboid" position={[0, groundY, 0]} collisionGroups={floorCollisionGroup}>
        <mesh scale={[floorSize, 0.5, 10]} visible={false}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial transparent opacity={0} />
        </mesh>
      </RigidBody>
    </>
  );
}
