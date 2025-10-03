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
 * FittedModel: loads a GLB, recenters & scales it, then finds named parts:
 * circle1, circle2, circle3, circle4, isosphere, sphere
 * and animates them with independent rotations.
 */
function FittedModel({
  url,
  targetRadius = 2.8,
  basePosition = [-1.0, 0, 0],
  baseScale = 1,
  baseRotation = [0.08, 0.35, 0],
}) {
  const containerRef = useRef();
  const coreRef = useRef(null);
  const circle1Ref = useRef(null);
  const circle2Ref = useRef(null);
  const circle3Ref = useRef(null);
  const circle4Ref = useRef(null);
  const cageRef = useRef(null);

  const { scene } = useGLTF(url);

  // Build fitted clone once
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

    // initial transform (place left by default)
    root.position.set(basePosition[0], basePosition[1], basePosition[2]);
    root.rotation.set(baseRotation[0], baseRotation[1], baseRotation[2]);

    // friendly material tweaks (low-cost)
    root.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        obj.castShadow = false;
        obj.receiveShadow = false;
        if ("metalness" in obj.material) obj.material.metalness = 0.15;
        if ("roughness" in obj.material) obj.material.roughness = 0.6;
        obj.material.depthWrite = true;
      }
    });

    return root;
  }, [scene, targetRadius, baseScale, basePosition, baseRotation]);

  // find named children once
  useMemo(() => {
    if (!fitted) return;

    circle1Ref.current = fitted.getObjectByName("circle1") || fitted.getObjectByName("Circle1") || null;
    circle2Ref.current = fitted.getObjectByName("circle2") || fitted.getObjectByName("Circle2") || null;
    circle3Ref.current = fitted.getObjectByName("circle3") || fitted.getObjectByName("Circle3") || null;
    circle4Ref.current = fitted.getObjectByName("circle4") || fitted.getObjectByName("Circle4") || null;
    cageRef.current = fitted.getObjectByName("isosphere") || fitted.getObjectByName("isosphere") || fitted.getObjectByName("isopshere") || null;
    coreRef.current = fitted.getObjectByName("sphere") || fitted.getObjectByName("Sphere") || fitted.getObjectByName("core") || null;

    // ensure core emissive exist
    if (coreRef.current && coreRef.current.material) {
      const mat = coreRef.current.material;
      if (!("emissive" in mat)) mat.emissive = new THREE.Color(0x21e1ff);
      mat.emissive = mat.emissive || new THREE.Color(0x21e1ff);
      if ("emissiveIntensity" in mat) mat.emissiveIntensity = mat.emissiveIntensity ?? 0.9;
    }

    // set rotation order for predictable small-axis tweaks
    [circle1Ref, circle2Ref, circle3Ref, circle4Ref, cageRef].forEach(ref => {
      if (ref.current) ref.current.rotation.order = "XYZ";
    });
  }, [fitted]);

  // animation params (adjust to taste)
  const SPEEDS = {
    circle1: 1.0,   // X axis
    circle2: -0.85, // Z axis
    circle3: 0.72,  // Y axis
    circle4x: 0.45, // compound X
    circle4z: -0.6, // compound Z
    cageX: 0.06,
    cageY: 0.18,
    groupYaw: 0.02,
    coreBobSpeed: 1.6,
    coreBobAmp: 0.055,
  };

  // animate parts each frame
  useFrame((state, dt) => {
    const t = state.clock.getElapsedTime();

    // circle1: rotate around X
    if (circle1Ref.current) {
      circle1Ref.current.rotation.x += dt * SPEEDS.circle1;
      // tiny wobble on Z for life
      circle1Ref.current.rotation.z = Math.sin(t * 0.33) * 0.04;
    }

    // circle2: rotate around Z (you requested Z earlier)
    if (circle2Ref.current) {
      circle2Ref.current.rotation.z += dt * SPEEDS.circle2;
      circle2Ref.current.rotation.x = Math.cos(t * 0.22) * 0.02;
    }

    // circle3: rotate around Y
    if (circle3Ref.current) {
      circle3Ref.current.rotation.y += dt * SPEEDS.circle3;
      circle3Ref.current.rotation.z = Math.sin(t * 0.2) * 0.015;
    }

    // circle4: compound rotation X and Z for character
    if (circle4Ref.current) {
      circle4Ref.current.rotation.x += dt * SPEEDS.circle4x;
      circle4Ref.current.rotation.z += dt * SPEEDS.circle4z;
      // small harmonic movement
      circle4Ref.current.rotation.y = Math.sin(t * 0.28) * 0.03;
    }

    // cage slow compound motion
    if (cageRef.current) {
      cageRef.current.rotation.y += dt * SPEEDS.cageY;
      cageRef.current.rotation.x += dt * SPEEDS.cageX;
    }

    // core: emissive pulse + bob
    if (coreRef.current && coreRef.current.material) {
      const mat = coreRef.current.material;
      const pulse = 0.7 + Math.sin(t * 2.0) * 0.25;
      if ("emissiveIntensity" in mat) {
        mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity ?? 0.8, pulse, 0.08);
      } else {
        const base = new THREE.Color(0x21e1ff);
        const bright = base.clone().lerp(new THREE.Color(0xcff8ff), (pulse - 0.6) * 0.9);
        mat.emissive = mat.emissive ? mat.emissive.lerp(bright, 0.06) : bright;
      }
      if (coreRef.current.parent) {
        coreRef.current.position.y = Math.sin(t * SPEEDS.coreBobSpeed) * SPEEDS.coreBobAmp;
      }
    }

    // gentle overall group motion (tiny yaw + float)
    if (containerRef.current) {
      containerRef.current.rotation.y += dt * SPEEDS.groupYaw;
      containerRef.current.position.y = Math.sin(t * 0.35) * 0.015;
    }
  });

  return (
    <group ref={containerRef}>
      <primitive object={fitted} />
    </group>
  );
}

/** Scene wrapper with focus/unfocus API */
const GlobeScene = forwardRef(function GlobeScene(
  { modelUrl = "/models/DysonSphere.glb", modelPosition = [-1.0, 0, 0], modelScale = 1, modelRotation = [0.08, 0.35, 0] },
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
    // subtle camera follow
    const camTarget = new THREE.Vector3(focusRef.current.x * 0.6, focusRef.current.y * 0.6, camera.position.z);
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
      <FittedModel url={modelUrl} targetRadius={2.8} basePosition={modelPosition} baseScale={modelScale} baseRotation={modelRotation} />
    </group>
  );
});

/** Canvas wrapper */
const Globe = forwardRef(function Globe(_props, ref) {
  return (
    <div className="globe-canvas" style={{ position: "absolute", inset: 0 }}>
      <Canvas camera={{ position: [0, 0, 9], fov: 46 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        {/* simple ambient + a tiny directional so geometry reads without heavy lights */}
        <ambientLight intensity={0.9} />
        <directionalLight intensity={0.12} position={[4, 6, 8]} />

        <Suspense fallback={null}>
          <GlobeScene ref={ref} modelPosition={[-1.0, 0, 0]} modelScale={1.05} modelRotation={[0.08, 0.35, 0]} />
        </Suspense>
      </Canvas>
    </div>
  );
});

export default Globe;
useGLTF.preload("/models/DysonSphere.glb");
