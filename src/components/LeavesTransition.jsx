import React, { useMemo, useRef, useEffect } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { RigidBody, interactionGroups } from "@react-three/rapier";
import * as THREE from "three";
import { createNoise2D } from "simplex-noise";

// --- Collision Groups ---
const GROUP_ENVIRONMENT = 0;
const GROUP_LEAF = 1;

const INSTANCED_COUNT = 100;
const PHYSICS_COUNT = 8;
const HORIZ_WRAP = 40;
const VERT_WRAP = 22;

const LEAF_TEXTURES = {
  spring: "/textures/leaf_pink.png",
  autumn: "/textures/leaf_yellow.png",
  fall: "/textures/leaf_red.png",
};

const noise2D = createNoise2D(Math.random);

// --- InstancedLeaves (Upgraded with Wind) ---
function InstancedLeaves({ texture, count = INSTANCED_COUNT, season }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const seeds = useMemo(() => {
    const arr = new Array(count);
    const windDirection = (season === 'fall') ? -1.0 : 1.0; 
    
    for (let i = 0; i < count; i++) {
      const baseX = THREE.MathUtils.randFloatSpread(HORIZ_WRAP);
      const baseY = THREE.MathUtils.randFloatSpread(VERT_WRAP);
      const baseZ = THREE.MathUtils.randFloat(-5, 5);
      const speedX = THREE.MathUtils.randFloat(0.008, 0.04) * windDirection; 
      const swayFreq = THREE.MathUtils.randFloat(0.3, 1.2);
      const swayAmp = THREE.MathUtils.randFloat(0.08, 0.6);
      const rotBase = THREE.MathUtils.randFloat(0, Math.PI * 2);
      const rotFreq = THREE.MathUtils.randFloat(0.2, 0.9);
      const rotAmp = THREE.MathUtils.randFloat(0.15, 0.7);
      const scale = THREE.MathUtils.randFloat(0.45, 1.12);
      arr[i] = {
        baseX, baseY, baseZ, speedX, swayFreq, swayAmp, rotBase, rotFreq, rotAmp, scale,
        phase: Math.random() * Math.PI * 2,
      };
    }
    return arr;
  }, [count, season]);

  const runtimeOffsets = useMemo(() => new Float32Array(count).fill(0), [count]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      runtimeOffsets[i] += s.speedX; 
      let x = s.baseX + runtimeOffsets[i];

      const halfW = HORIZ_WRAP / 2;
      if (x > halfW) {
        runtimeOffsets[i] -= HORIZ_WRAP;
        x = s.baseX + runtimeOffsets[i];
      } else if (x < -halfW) {
        runtimeOffsets[i] += HORIZ_WRAP;
        x = s.baseX + runtimeOffsets[i];
      }

      const y = s.baseY + Math.sin(t * s.swayFreq + s.phase) * s.swayAmp * (1 + (s.baseZ / 6));
      const z = s.baseZ + Math.sin(t * (0.4 + s.swayFreq * 0.1) + s.phase * 0.5) * 0.06;
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

// --- UPGRADED Interactive Physics Leaf ---
function PhysicsLeaf({ texture, initialPos, initialRot, scale, leafCollisionGroup, season }) {
  const bodyRef = useRef();
  const { clock, mouse, viewport } = useThree();

  const pileCenterX = useMemo(() => {
    const pileWidth = 4; // How wide the pile is
    const screenEdge = (viewport.width / 2) - pileWidth; // Position from edge
    switch (season) {
      case 'spring': return -screenEdge; // Left
      case 'fall': return screenEdge;   // Right
      case 'autumn': return 0;          // Center
      default: return 0;
    }
  }, [season, viewport.width]);

  useFrame(() => {
    const body = bodyRef.current;
    if (!body) return;
    if (body.isSleeping()) return;

    const t = clock.elapsedTime;
    const bodyPos = body.translation();
    
    const groundY = -viewport.height / 2; // Dynamic ground based on viewport
    if (bodyPos.y < groundY + 0.5) {
      body.setLinearDamping(10);
      body.setAngularDamping(10);

      const push = (pileCenterX - bodyPos.x) * 0.002;
      body.applyImpulse({ x: push, y: 0, z: 0 }, true);

      setTimeout(() => {
        if(!bodyRef.current || bodyRef.current.isSleeping()) return;
        const finalX = pileCenterX + (Math.random() - 0.5) * 4; 
        bodyRef.current.setTranslation({ x: finalX, y: groundY + Math.random() * 0.1, z: Math.random() * 0.5 }, true);
        bodyRef.current.sleep();
      }, 300); 

      return;
    } else {
      body.setLinearDamping(0.45);
      body.setAngularDamping(0.8);
    }

    const windX = (noise2D(bodyPos.y * 0.1, t * 0.1) * 0.001) + (season === 'fall' ? -0.001 : 0.001);
    const windZ = noise2D(bodyPos.x * 0.1, t * 0.1) * 0.001;
    body.applyImpulse({ x: windX, y: 0, z: windZ }, true);

    const mouseWorldX = (mouse.x * viewport.width) / 2;
    const mouseWorldY = (mouse.y * viewport.height) / 2;
    
    const dx = bodyPos.x - mouseWorldX;
    const dy = bodyPos.y - mouseWorldY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    const gustRadius = 2.5;
    const maxForce = 0.01;

    if (dist < gustRadius) {
      const force = (1 - dist / gustRadius) * maxForce;
      body.applyImpulse({ x: dx * force, y: dy * force, z: 0 }, true);
    }
  });

  const handleClick = (e) => {
    e.stopPropagation();
    const body = bodyRef.current;
    if (!body) return;

    body.wakeUp();
    body.applyImpulse(
      { 
        x: (Math.random() - 0.5) * 0.015, 
        y: Math.random() * 0.02, 
        z: (Math.random() - 0.5) * 0.015
      },
      true
    );
  };

  return (
    <RigidBody
      ref={bodyRef}
      type="dynamic"
      position={initialPos}
      rotation={initialRot}
      restitution={0.06}
      friction={1.0}
      linearDamping={0.45}
      angularDamping={0.8}
      colliders="cuboid"
      collisionGroups={leafCollisionGroup}
    >
      <mesh 
        scale={[scale, scale, scale]} 
        onClick={handleClick}
        onPointerOver={(e) => (e.stopPropagation(), document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
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
  );
}

// --- PhysicsLeaves (wrapper, now passes season) ---
function PhysicsLeaves({ texture, count = PHYSICS_COUNT, season }) {
  const leafCollisionGroup = useMemo(() => 
    interactionGroups([GROUP_LEAF], [GROUP_ENVIRONMENT]), 
  []);

  const leaves = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        id: i,
        pos: [
          THREE.MathUtils.randFloatSpread(HORIZ_WRAP),
          THREE.MathUtils.randFloatSpread(VERT_WRAP),
          THREE.MathUtils.randFloat(-3, 3),
        ],
        rot: [0, 0, THREE.MathUtils.randFloat(-0.5, 0.5)],
        scale: THREE.MathUtils.randFloat(0.6, 1.15),
      });
    }
    return arr;
  }, [count]);

  return (
    <>
      {leaves.map((l) => (
        <PhysicsLeaf
          key={l.id}
          texture={texture}
          initialPos={l.pos}
          initialRot={l.rot}
          scale={l.scale}
          leafCollisionGroup={leafCollisionGroup}
          season={season}
        />
      ))}
    </>
  );
}

// --- NEW: Static Leaf Pile "Bush" Component ---
function LeafPile({ texture, count = 20, season }) {
  const meshRef = useRef();
  const { viewport } = useThree();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Calculate pile center same as physics leaves
  const pileCenterX = useMemo(() => {
    const pileWidth = 4;
    const screenEdge = (viewport.width / 2) - pileWidth;
    switch (season) {
      case 'spring': return -screenEdge;
      case 'fall': return screenEdge;
      case 'autumn': return 0;
      default: return 0;
    }
  }, [season, viewport.width]);
  
  const groundY = -viewport.height / 2;

  // Create static matrices for the pile
  useMemo(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < count; i++) {
      const x = pileCenterX + (Math.random() - 0.5) * 4;
      const y = groundY + Math.random() * 0.15; // Slightly higher pile
      const z = Math.random() * 0.5;
      const rotZ = Math.random() * Math.PI * 2;
      const scale = THREE.MathUtils.randFloat(0.6, 1.15);
      
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, 0, rotZ);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [count, pileCenterX, groundY, dummy]);

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

// --- LeavesTransition (main export, now renders LeafPile) ---
export default function LeavesTransition({
  season = "spring",
  // isTransitioning = false,
  // onTransitionComplete = () => {},
}) {
  const { viewport } = useThree();
  const url = LEAF_TEXTURES[season] || LEAF_TEXTURES.spring;
  const texture = useLoader(THREE.TextureLoader, url);

  useEffect(() => {
    if (texture) {
      texture.encoding = THREE.sRGBEncoding;
      texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.needsUpdate = true;
    }
  }, [texture]);

  const floorCollisionGroup = useMemo(() => 
    interactionGroups([GROUP_ENVIRONMENT], [GROUP_LEAF]), 
  []);

  const groundY = -viewport.height / 2;
  const floorSize = viewport.width * 1.2;

  return (
    <>
      {texture && <InstancedLeaves texture={texture} count={INSTANCED_COUNT} season={season} />}
      {texture && <PhysicsLeaves texture={texture} count={PHYSICS_COUNT} season={season} />}
      {texture && <LeafPile texture={texture} season={season} />}
      
      <RigidBody 
        type="fixed" 
        colliders="cuboid" 
        position={[0, groundY, 0]}
        collisionGroups={floorCollisionGroup}
      >
        <mesh scale={[floorSize, 0.5, 10]} visible={false}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial transparent opacity={0} />
        </mesh>
      </RigidBody>
    </>
  );
}