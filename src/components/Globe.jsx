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

/** Center + scale the loaded scene to a target radius, then render it. */
function FittedModel({ url, targetRadius = 6.5 }) {
  const group = useRef();
  const { scene } = useGLTF(url);

  // Build a fitted clone once
  const fitted = useMemo(() => {
    const root = scene.clone(true);

    // compute bounds
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // recentre to origin
    root.position.sub(center);

    // scale to target radius
    const radius =
      Math.max(size.x, size.y, size.z) * 0.5 || 1; // avoid div by 0
    const scale = targetRadius / radius;
    root.scale.setScalar(scale);

    // soften materials a bit for dark theme
    root.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = false;
        obj.receiveShadow = false;
        if (obj.material && "metalness" in obj.material) {
          obj.material.metalness = Math.min(0.3, obj.material.metalness ?? 0.3);
          obj.material.roughness = Math.max(0.4, obj.material.roughness ?? 0.6);
        }
      }
    });

    return root;
  }, [scene, targetRadius]);

  // slow, classy spin (can be disabled if you like)
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.12;
  });

  return <primitive ref={group} object={fitted} />;
}

/** Scene wrapper that exposes focus/unfocus to parent via ref */
const GlobeScene = forwardRef(function GlobeScene(
  { modelUrl = "/models/DysonSphere.glb" },
  ref
) {
  const focusRef = useRef(new THREE.Vector3(0, 0, 0)); // desired offset
  const groupRef = useRef(); // moves the whole model group
  const { camera } = useThree();

  // Smoothly lerp model position & camera toward target each frame
  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;

    // model position
    g.position.lerp(focusRef.current, 0.08);

    // camera x/y follow subtly, z stays fixed
    const camTarget = new THREE.Vector3(
      focusRef.current.x * 0.6,
      focusRef.current.y * 0.6,
      camera.position.z
    );
    camera.position.lerp(camTarget, 0.06);
    camera.lookAt(g.position);
  });

  // public API used by App.jsx (RightMenu clicks pass a screen-space anchor)
  useImperativeHandle(ref, () => ({
    focusToward: ({ x, y }) => {
      // anchor (0..1) → world-ish offset (-1..1), biased so it doesn't fly too far
      const wx = (x - 0.5) * 2.0;
      const wy = (0.5 - y) * 1.4; // flip Y, keep it a bit tighter
      focusRef.current.set(wx, wy, 0);
    },
    unfocus: () => {
      focusRef.current.set(0, 0, 0);
    },
  }));

  return (
    <group ref={groupRef}>
      <FittedModel url={modelUrl} targetRadius={2.8} />
    </group>
  );
});

/** The exported Globe component: full-bleed Canvas with neutral lights */
const Globe = forwardRef(function Globe(_props, ref) {
  return (
    <div className="globe-canvas" style={{ position: "absolute", inset: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        {/* Lights tuned for black/grey theme; no color cast */}
        <ambientLight intensity={0.35} />
        <directionalLight position={[6, 8, 10]} intensity={1.0} />
        <directionalLight position={[-4, -2, -6]} intensity={0.5} />

        <Suspense fallback={null}>
          <GlobeScene ref={ref} />
        </Suspense>
      </Canvas>
    </div>
  );
});

export default Globe;

// Preload model for faster first render
useGLTF.preload("/models/DysonSphere.glb");
