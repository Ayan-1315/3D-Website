// src/components/LeavesTransition.jsx
import React, { useMemo, useRef, useEffect } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { RigidBody, interactionGroups } from "@react-three/rapier";
import * as THREE from "three";
import { createNoise2D } from "simplex-noise";

// --- Collision Groups ---
const GROUP_ENVIRONMENT = 0;
const GROUP_LEAF = 1;

// --- Configuration Constants ---
const INSTANCED_COUNT = 80;
const PHYSICS_COUNT = 6;
const HORIZ_WRAP = 30;
const VERT_WRAP = 15;
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

/*
  SeasonalBackground:
  Use CSS background on the renderer DOM element so the image behaves like background-size:cover.
*/
function SeasonalBackground({ season }) {
  const { gl, scene } = useThree();
  const url = BACKGROUND_TEXTURES[season] || BACKGROUND_TEXTURES.spring;
  const texture = useLoader(THREE.TextureLoader, url);

  useEffect(() => {
    if (!gl || !gl.domElement) return;

    if (texture) {
      texture.encoding = THREE.sRGBEncoding;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.anisotropy = Math.min(gl.capabilities.getMaxAnisotropy(), 8);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.needsUpdate = true;
    }

    const canvas = gl.domElement;
    const prevStyle = {
      backgroundImage: canvas.style.backgroundImage || "",
      backgroundSize: canvas.style.backgroundSize || "",
      backgroundPosition: canvas.style.backgroundPosition || "",
      backgroundRepeat: canvas.style.backgroundRepeat || "",
      backgroundAttachment: canvas.style.backgroundAttachment || "",
    };

    canvas.style.backgroundImage = `url("${url}")`;
    canvas.style.backgroundSize = "cover";
    canvas.style.backgroundPosition = "center center";
    canvas.style.backgroundRepeat = "no-repeat";
    canvas.style.backgroundAttachment = "scroll";

    const prevBackground = scene.background;

    const handleResize = () => {
      // CSS cover handles resizing
    };
    window.addEventListener("resize", handleResize);

    return () => {
      canvas.style.backgroundImage = prevStyle.backgroundImage;
      canvas.style.backgroundSize = prevStyle.backgroundSize;
      canvas.style.backgroundPosition = prevStyle.backgroundPosition;
      canvas.style.backgroundRepeat = prevStyle.backgroundRepeat;
      canvas.style.backgroundAttachment = prevStyle.backgroundAttachment;
      window.removeEventListener("resize", handleResize);
      scene.background = prevBackground || null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, texture, url]);

  return null;
}

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

  const { viewport } = useThree();

  // responsive sizing: tightened clamps so we don't blow up on desktop or phone
  const baseFactor = viewport.width / 1440;
  let sizeFactor = Math.max(0.7, Math.min(1.45, baseFactor)); // tightened range
  if (typeof window !== "undefined" && window.innerWidth <= 420) {
    sizeFactor = Math.max(sizeFactor, 0.9);
  }
  const seasonScale = season === "spring" ? 0.75 : 1.0;

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
      const scale = THREE.MathUtils.randFloat(0.9, 1.8);
      const phase = Math.random() * Math.PI * 2;
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
        phase,
      };
    }
    return arr;
  }, [count, season]);

  const runtimeOffsets = useMemo(
    () => new Float32Array(count).fill(0),
    [count]
  );

  // small, subtle emissive to increase legibility
  useEffect(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material;
    if (mat) {
      mat.color = mat.color || new THREE.Color(0xffffff);
      mat.emissive = new THREE.Color(0x0b0b0b);
      mat.emissiveIntensity = 0.08; // lowered from earlier; subtle
      mat.transparent = true;
      mat.alphaTest = 0.03;
      mat.needsUpdate = true;
    }
  }, []);

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
      if (x > halfW) {
        runtimeOffsets[i] -= HORIZ_WRAP;
        x = s.baseX + runtimeOffsets[i];
      } else if (x < -halfW) {
        runtimeOffsets[i] += HORIZ_WRAP;
        x = s.baseX + runtimeOffsets[i];
      }

      const sway = Math.sin(t * s.swayFreq + s.phase);
      const n = noise2D(s.baseX * 0.02 + t * 0.05, s.baseY * 0.02);
      const y = s.baseY + sway * s.swayAmp * (1 + s.baseZ / 6) + n * 0.08;
      const z =
        s.baseZ +
        Math.sin(t * (0.4 + s.swayFreq * 0.1) + s.phase * 0.5) * 0.06 +
        n * 0.03;
      const rotZ =
        s.rotBase +
        Math.sin(t * s.rotFreq + s.phase * 0.7) * s.rotAmp +
        n * 0.05;

      dummy.position.set(x, y, z);
      dummy.rotation.set(0, 0, rotZ);

      // Vertical boost: mild only — limit to 1.0..1.4
      const normalizedY = (s.baseY + VERT_WRAP / 2) / VERT_WRAP; // 0 at bottom, 1 at top
      const bottomFactor = 1 + (1 - normalizedY) * 0.4; // bottom gives up to +40%

      // responsive sizing: base scale * seasonScale * sizeFactor * bottomFactor
      const appliedScaleRaw = s.scale * seasonScale * sizeFactor * bottomFactor;
      const appliedScale = Math.max(0.75, Math.min(1.6, appliedScaleRaw)); // clamp so no huge values

      dummy.scale.setScalar(appliedScale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      {/* base geometry reduced to 0.9 (was 1.2) to fix oversized leaves */}
      <planeGeometry args={[0.9, 0.9]} />
      <meshStandardMaterial
        map={texture}
        side={THREE.DoubleSide}
        transparent
        alphaTest={0.03}
        depthWrite={false}
      />
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

  const baseFactor = viewport.width / 1440;
  let sizeFactor = Math.max(0.7, Math.min(1.45, baseFactor));
  if (typeof window !== "undefined" && window.innerWidth <= 420) {
    sizeFactor = Math.max(sizeFactor, 0.9);
  }
  const seasonScale = season === "spring" ? 0.75 : 1.0;

  // mild bottom boost, clamp to avoid huge scales
  const normalizedInitialY = (initialPos[1] + VERT_WRAP / 2) / VERT_WRAP; // ~0..1
  const bottomBoost = 1 + (1 - normalizedInitialY) * 0.36; // up to ~1.36x

  const appliedScale = Math.max(0.75, Math.min(1.5, scale * sizeFactor * seasonScale * bottomBoost));

  const pileCenterX = useMemo(() => {
    const pileWidth = 4;
    const screenEdge = viewport.width / 2 - pileWidth;
    switch (season) {
      case "spring":
        return -screenEdge;
      case "fall":
        return screenEdge;
      case "autumn":
        return 0;
      default:
        return 0;
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

    const windX =
      noise2D(bodyPos.y * 0.08, t * 0.6) * 0.0012 +
      (season === "fall" ? -0.0008 : 0.0009);
    const windZ = noise2D(bodyPos.x * 0.08, t * 0.5) * 0.0009;
    body.applyImpulse({ x: windX, y: 0, z: windZ }, true);

    const angNoise = noise2D(bodyPos.x * 0.12, bodyPos.y * 0.12 + t * 0.4);
    const torque = clamp(angNoise * 0.002 + v.length() * 0.0002, -0.005, 0.005);
    try {
      body.applyTorqueImpulse({ x: 0, y: 0, z: torque }, true);
    } catch (e) {
      e;
    }

    body.setLinearDamping(0.6);
    body.setAngularDamping(0.9);

    try {
      body.setLinvel({ x: v.x, y: v.y, z: v.z }, true);
    } catch (e) {
      e;
    }

    const centerRadius = 1.25;
    if (
      Math.abs(bodyPos.x) < centerRadius &&
      Math.abs(bodyPos.y) < centerRadius
    ) {
      const pushX =
        (Math.sign(bodyPos.x) || (Math.random() > 0.5 ? 1 : -1)) *
        (0.02 + Math.random() * 0.02);
      const pushY =
        (Math.sign(bodyPos.y) || (Math.random() > 0.5 ? 1 : -1)) *
        (0.02 + Math.random() * 0.02);
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
            bodyRef.current.setTranslation(
              {
                x: finalX,
                y: groundY + Math.random() * 0.08,
                z: Math.random() * 0.5,
              },
              true
            );
            bodyRef.current.sleep();
          } catch (e) {
            e;
          }
        }
      }, 300);
      return;
    }
  });

  return (
    <RigidBody
      ref={bodyRef}
      type="dynamic"
      position={initialPos}
      rotation={initialRot}
      restitution={0.06}
      friction={0.9}
      linearDamping={0.6}
      angularDamping={0.9}
      colliders="cuboid"
      collisionGroups={leafCollisionGroup}
    >
      <mesh scale={[appliedScale, appliedScale, appliedScale]}>
        <planeGeometry args={[0.9, 0.9]} />
        <meshStandardMaterial
          map={texture}
          side={THREE.DoubleSide}
          transparent={true}
          alphaTest={0.03}
          depthWrite={false}
          emissive={new THREE.Color(0x0b0b0b)}
          emissiveIntensity={0.08}
        />
      </mesh>
    </RigidBody>
  );
}
// --- End PhysicsLeaf ---

function PhysicsLeaves({ texture, count = PHYSICS_COUNT, season }) {
  const leafCollisionGroup = useMemo(
    () => interactionGroups([GROUP_LEAF], [GROUP_ENVIRONMENT]),
    []
  );
  const leaves = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      let x, y;
      const minCenterDist = 1.8;
      do {
        x = THREE.MathUtils.randFloatSpread(HORIZ_WRAP);
        y = THREE.MathUtils.randFloatSpread(VERT_WRAP);
      } while (Math.abs(x) < minCenterDist && Math.abs(y) < minCenterDist);
      arr.push({
        id: i,
        pos: [x, y, THREE.MathUtils.randFloat(-3, 3)],
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

function LeafPile({ texture, count = 20, season }) {
  const meshRef = useRef();
  const { viewport } = useThree();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const baseFactor = viewport.width / 1440;
  let sizeFactor = Math.max(0.7, Math.min(1.45, baseFactor));
  if (typeof window !== "undefined" && window.innerWidth <= 420) {
    sizeFactor = Math.max(sizeFactor, 0.9);
  }
  const seasonScale = season === "spring" ? 0.75 : 1.0;

  const pileCenterX = useMemo(() => {
    const pileWidth = 4;
    const screenEdge = viewport.width / 2 - pileWidth;
    switch (season) {
      case "spring":
        return -screenEdge;
      case "fall":
        return screenEdge;
      case "autumn":
        return 0;
      default:
        return 0;
    }
  }, [season, viewport.width]);
  const groundY = -viewport.height / 2;

  useMemo(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < count; i++) {
      const x = pileCenterX + (Math.random() - 0.5) * 4;
      const y = groundY + Math.random() * 0.15;
      const z = Math.random() * 0.5;
      const rotZ = Math.random() * Math.PI * 2;
      const scale = THREE.MathUtils.randFloat(0.9, 1.5);

      // vertical boost for pile pieces: mild bump only
      const normalizedY = (y + VERT_WRAP / 2) / VERT_WRAP;
      const bottomBoost = 1 + (1 - normalizedY) * 0.36; // up to +36%

      dummy.position.set(x, y, z);
      dummy.rotation.set(0, 0, rotZ);
      dummy.scale.setScalar(Math.max(0.75, scale * sizeFactor * seasonScale * bottomBoost));
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [count, pileCenterX, groundY, dummy, sizeFactor, seasonScale]);

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <planeGeometry args={[0.9, 0.9]} />
      <meshStandardMaterial
        map={texture}
        side={THREE.DoubleSide}
        transparent={true}
        alphaTest={0.03}
        depthWrite={false}
        emissive={new THREE.Color(0x0b0b0b)}
        emissiveIntensity={0.08}
      />
    </instancedMesh>
  );
}

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

  const floorCollisionGroup = useMemo(
    () => interactionGroups([GROUP_ENVIRONMENT], [GROUP_LEAF]),
    []
  );
  const groundY = -viewport.height / 2;
  const floorSize = viewport.width * 1.2;

  // keep reasonable density on mobile
  const instancedCount = typeof window !== "undefined" && window.innerWidth < 600
    ? Math.max(14, Math.floor(INSTANCED_COUNT * 0.45))
    : INSTANCED_COUNT;

  return (
    <>
      <SeasonalBackground season={season} />
      {leafTexture && (
        <InstancedLeaves
          texture={leafTexture}
          count={instancedCount}
          season={season}
          isSlowMo={isSlowMo}
        />
      )}

      {leafTexture && (
        <PhysicsLeaves
          texture={leafTexture}
          count={PHYSICS_COUNT}
          season={season}
        />
      )}
      {leafTexture && <LeafPile texture={leafTexture} season={season} />}
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
