import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  Suspense,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

/**
 * FittedModel finds named meshes in your GLB and exposes refs for animation.
 * Mesh names expected: circle1, circle2, isosphere, sphere
 */
function FittedModel({
  url,
  targetRadius = 2.8,
  basePosition = [-1.0, 0, 0],
  baseScale = 1,
  baseRotation = [0.1, 0.3, 0],
}) {
  const containerRef = useRef();
  const coreRef = useRef(null);
  const circle1Ref = useRef(null);
  const circle2Ref = useRef(null);
  const cageRef = useRef(null);

  const { scene } = useGLTF(url);

  const fitted = useMemo(() => {
    const root = scene.clone(true);

    // compute bounds and recenter
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);
    root.position.sub(center);

    // scale to target radius
    const radius = Math.max(size.x, size.y, size.z) * 0.5 || 1;
    const autoScale = (targetRadius / radius) * baseScale;
    root.scale.setScalar(autoScale);

    // initial transform
    root.position.set(basePosition[0], basePosition[1], basePosition[2]);
    root.rotation.set(baseRotation[0], baseRotation[1], baseRotation[2]);

    // make materials low-cost and readable on dark background
    root.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = false;
        obj.receiveShadow = false;
        if (obj.material) {
          // keep simple, avoid heavy PBR for low end devices
          if ("metalness" in obj.material) obj.material.metalness = 0.15;
          if ("roughness" in obj.material) obj.material.roughness = 0.6;
          obj.material.depthWrite = true;
          // slight rim tint if ring/cage
          if (/circle|isosphere|cage/i.test(obj.name)) {
            // tint to very dark cyan so geometry reads on black
            obj.material.color = obj.material.color
              ? obj.material.color.lerp(new THREE.Color(0x0a1115), 0.75)
              : new THREE.Color(0x0a1115);
          }
        }
      }
    });

    return root;
  }, [scene, targetRadius, baseScale, basePosition, baseRotation]);

  // find named parts once (on mount)
  useMemo(() => {
    if (!fitted) return;
    circle1Ref.current =
      fitted.getObjectByName("circle1") || fitted.getObjectByName("Circle1");
    circle2Ref.current =
      fitted.getObjectByName("circle2") || fitted.getObjectByName("Circle2");
    cageRef.current =
      fitted.getObjectByName("isosphere") ||
      fitted.getObjectByName("isopshere") ||
      fitted.getObjectByName("isosphere");
    coreRef.current =
      fitted.getObjectByName("sphere") ||
      fitted.getObjectByName("Sphere") ||
      fitted.getObjectByName("core");

    // ensure the core has emissive
    if (coreRef.current && coreRef.current.material) {
      const mat = coreRef.current.material;
      if (!("emissive" in mat)) {
        mat.emissive = new THREE.Color(0x21e1ff);
      }
      mat.emissive = mat.emissive || new THREE.Color(0x21e1ff);
      if ("emissiveIntensity" in mat)
        mat.emissiveIntensity = mat.emissiveIntensity ?? 0.9;
    }
  }, [fitted]);

  // animation params (tweak these for feel)
  const C1_SPEED = 1.25; // circle1 speed (x)
  const C2_SPEED = -0.9; // circle2 speed (y) negative -> opposite direction
  const CAGE_SPEED_X = 0.08;
  const CAGE_SPEED_Y = 0.18;
  const GROUP_YAW = 0.02; // overall slow yaw
  const CORE_BOB_SPEED = 1.7;
  const CORE_BOB_AMPL = 0.06;

  // animate each frame
  useFrame((state, dt) => {
    const t = state.clock.getElapsedTime();

    // circle1 rotate x
    if (circle1Ref.current) {
      circle1Ref.current.rotation.x += dt * C1_SPEED;
      // small tilt wobble so the ring feels non-uniform
      circle1Ref.current.rotation.z = Math.sin(t * 0.35) * 0.06;
    }

    // circle2 rotate z
    if (circle2Ref.current) {
      circle2Ref.current.rotation.z += dt * C2_SPEED;
      circle2Ref.current.rotation.x = Math.cos(t * 0.22) * 0.03; // subtle wobble
    }

    // cage slow compound
    if (cageRef.current) {
      cageRef.current.rotation.y += dt * CAGE_SPEED_Y;
      cageRef.current.rotation.x += dt * CAGE_SPEED_X;
    }

    // core emissive pulse + bob
    if (coreRef.current && coreRef.current.material) {
      const mat = coreRef.current.material;
      // pulse emissiveIntensity if supported
      const pulse = 0.75 + Math.sin(t * 2.0) * 0.25; // 0.5 .. 1.0 roughly
      if ("emissiveIntensity" in mat) {
        // lerp for smoothness and lower choppiness on low FPS
        mat.emissiveIntensity = THREE.MathUtils.lerp(
          mat.emissiveIntensity ?? 0.8,
          pulse,
          0.08
        );
      } else {
        // fallback: gently nudge emissive color to a slightly brighter tint
        const base = new THREE.Color(0x21e1ff);
        const bright = base
          .clone()
          .lerp(new THREE.Color(0xcff8ff), (pulse - 0.6) * 0.9);
        mat.emissive = mat.emissive ? mat.emissive.lerp(bright, 0.06) : bright;
      }
      // vertical bob (local Y offset)
      if (coreRef.current.parent) {
        coreRef.current.position.y =
          Math.sin(t * CORE_BOB_SPEED) * CORE_BOB_AMPL;
      }
    }

    // gentle overall group motion (keeps scene lively)
    if (containerRef.current) {
      containerRef.current.rotation.y += dt * GROUP_YAW;
      containerRef.current.position.y = Math.sin(t * 0.35) * 0.02; // tiny float
    }
  });

  return (
    <group ref={containerRef}>
      <primitive object={fitted} />
    </group>
  );
}

/** Scene wrapper that exposes focus/unfocus (unchanged from earlier) */
const GlobeScene = forwardRef(function GlobeScene(
  {
    modelUrl = "/models/DysonSphere.glb",
    modelPosition = [-1.0, 0, 0],
    modelScale = 1,
    modelRotation = [0.1, 0.3, 0],
  },
  ref
) {
  const focusRef = useRef(new THREE.Vector3(...modelPosition));
  const groupRef = useRef();
  const { camera } = useThree();

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    // smooth position lerp
    g.position.lerp(focusRef.current, 0.08);
    // camera subtle follow
    const camTarget = new THREE.Vector3(
      focusRef.current.x * 0.6,
      focusRef.current.y * 0.6,
      camera.position.z
    );
    camera.position.lerp(camTarget, 0.06);
    camera.lookAt(g.position);
  });

  useImperativeHandle(ref, () => ({
    focusToward: ({ x, y }) => {
      const wx = (x - 0.5) * 2.0 + modelPosition[0];
      const wy = (0.5 - y) * 1.4 + modelPosition[1];
      focusRef.current.set(wx, wy, 0);
    },
    unfocus: () => {
      focusRef.current.set(...modelPosition);
    },
  }));

  return (
    <group ref={groupRef}>
      <FittedModel
        url={modelUrl}
        targetRadius={2.8}
        basePosition={modelPosition}
        baseScale={modelScale}
        baseRotation={modelRotation}
      />
    </group>
  );
});

/** Canvas wrapper */
const Globe = forwardRef(function Globe(_props, ref) {
  return (
    <div className="globe-canvas" style={{ position: "absolute", inset: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 9], fov: 46 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        {/* ambient dominant so model reads on dark bg */}
        <ambientLight intensity={0.9} />
        {/* a very subtle directional for depth, low intensity */}
        <directionalLight intensity={0.12} position={[4, 6, 8]} />

        <Suspense fallback={null}>
          <GlobeScene
            ref={ref}
            modelPosition={[-1.0, 0, 0]}
            modelScale={1.05}
            modelRotation={[0.08, 0.35, 0]}
          />
        </Suspense>
      </Canvas>
    </div>
  );
});

export default Globe;
useGLTF.preload("/models/DysonSphere.glb");
