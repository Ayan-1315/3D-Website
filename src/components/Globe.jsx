import React, { forwardRef, useMemo, useRef, Suspense, useImperativeHandle } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Stats } from "@react-three/drei";
import * as THREE from "three";
import ParticleSystem from "./ParticleSystem";

const ANIMATION_PARAMS = {
  baseSpeed: 0.15, yawSpeed: 1, cageSpeed: 4,
  innerRingSpeed: 11, outerRingSpeed: 9,
};

function FittedModel({ url, targetRadius = 4.5 }) {
  const group = useRef();
  const { scene } = useGLTF(url);

  const fitted = useMemo(() => {
    const root = scene.clone(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);
    root.position.sub(center);
    const radius = Math.max(size.x, size.y, size.z) * 0.5 || 1;
    const scale = targetRadius / radius;
    root.scale.setScalar(scale);

    const core = root.getObjectByName("sphere");
    if (core && core.material) {
      core.material = new THREE.MeshBasicMaterial({
        color: new THREE.Color("#00ffff"),
        toneMapped: false,
      });
    }
    return root;
  }, [scene, targetRadius]);

  useFrame((_, dt) => {
    const c1 = fitted.getObjectByName("circle1");
    const c2 = fitted.getObjectByName("circle2");
    const c3 = fitted.getObjectByName("circle3");
    const c4 = fitted.getObjectByName("circle4");
    const cage = fitted.getObjectByName("isosphere");
    const effectiveSpeed = dt * ANIMATION_PARAMS.baseSpeed;
    if (group.current) group.current.rotation.y += effectiveSpeed * ANIMATION_PARAMS.yawSpeed;
    if (cage) cage.rotation.y += effectiveSpeed * ANIMATION_PARAMS.cageSpeed;
    if (c1) c1.rotation.y += effectiveSpeed * ANIMATION_PARAMS.innerRingSpeed;
    if (c3) c3.rotation.y -= effectiveSpeed * ANIMATION_PARAMS.innerRingSpeed;
    if (c2) c2.rotation.x += effectiveSpeed * ANIMATION_PARAMS.outerRingSpeed;
    if (c4) c4.rotation.x -= effectiveSpeed * ANIMATION_PARAMS.outerRingSpeed;
  });

  return <primitive ref={group} object={fitted} />;
}

const GlobeScene = forwardRef(function GlobeScene({ modelUrl }, ref) {
  const particleSystemRef = useRef();
  const modelPosition = useMemo(() => new THREE.Vector3(-0.8, 0, 0), []);
  const focusRef = useRef(new THREE.Vector3().copy(modelPosition));
  const groupRef = useRef();
  const { camera } = useThree();

  useFrame(() => {
    if (particleSystemRef.current && particleSystemRef.current.material.uniforms.uIntro.value < 1) {
      particleSystemRef.current.material.uniforms.uIntro.value += 0.01;
    }

    const g = groupRef.current;
    if (!g) return;
    g.position.lerp(focusRef.current, 0.08);
    const camTarget = new THREE.Vector3(focusRef.current.x * 0.4, focusRef.current.y * 0.4, camera.position.z);
    camera.position.lerp(camTarget, 0.06);
    camera.lookAt(g.position);
  });

  useImperativeHandle(ref, () => ({
    focusToward: ({ x, y }) => {
      const wx = (x - 0.5) * 3.0 + modelPosition.x;
      const wy = (0.5 - y) * 2.0 + modelPosition.y;
      focusRef.current.set(wx, wy, 0);
    },
    unfocus: () => {
      focusRef.current.copy(modelPosition);
    },
  }));

  return (
    <group ref={groupRef}>
      <FittedModel url={modelUrl} />
      <ParticleSystem ref={particleSystemRef} />
      <pointLight color="#00ffff" intensity={8} distance={10} decay={2} />
    </group>
  );
});

const Globe = forwardRef(function Globe(_props, ref) {
  return (
    <div className="globe-canvas" style={{ position: "absolute", inset: 0 }}>
      <Canvas
        onCreated={({ scene }) => scene.background = new THREE.Color('#101010')}
        camera={{ position: [0, 0, 12], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[6, 8, 10]} intensity={0.5} color="#ffffff" />
        <Suspense fallback={null}>
          <GlobeScene ref={ref} modelUrl="/models/DysonSphere.glb" />
        </Suspense>
        <Stats />
      </Canvas>
    </div>
  );
});

export default Globe;
useGLTF.preload("/models/DysonSphere.glb");