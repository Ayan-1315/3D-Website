import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';

const LEAF_COUNT = 120;

export default function LeavesTransition({
  season = 'spring',
  isTransitioning = false,
  onTransitionComplete = () => {},
}) {
  const pointsRef = useRef();
  const finishedRef = useRef(false);

  // load textures (from public/textures)
  const texMap = {
    spring: '/textures/leaf_pink.png',
    autumn: '/textures/leaf_yellow.png',
    fall: '/textures/leaf_red.png',
  };
  const texture = useLoader(THREE.TextureLoader, texMap[season] || texMap.spring);

  // per-leaf state (keeps JS-side properties like speed/rot)
  const particles = useMemo(() => {
    const arr = new Array(LEAF_COUNT).fill().map(() => ({
      x: THREE.MathUtils.randFloat(12, 28),
      y: THREE.MathUtils.randFloat(-8, 12),
      z: THREE.MathUtils.randFloat(-4, 4),
      speed: THREE.MathUtils.randFloat(0.06, 0.18),
      flutter: THREE.MathUtils.randFloat(0.6, 1.6),
      rot: THREE.MathUtils.randFloat(0, Math.PI * 2),
      rotSpeed: THREE.MathUtils.randFloat(-1.6, 1.6),
      finished: false,
    }));
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [season]);

  const positions = useMemo(() => new Float32Array(LEAF_COUNT * 3), []);
  const finishedCountRef = useRef(0);

  useEffect(() => {
    // initialize buffer positions
    for (let i = 0; i < LEAF_COUNT; i++) {
      const p = particles[i];
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
    }
    finishedRef.current = false;
    finishedCountRef.current = 0;
  }, [particles, positions]);

  useFrame((state) => {
    if (!isTransitioning || !pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position.array;

    for (let i = 0; i < LEAF_COUNT; i++) {
      const p = particles[i];
      if (p.finished) continue;

      // leftward drift + light vertical sway + per-leaf flutter
      p.x -= p.speed;
      p.y += Math.sin((state.clock.elapsedTime + i * 0.2) * p.flutter) * 0.03;
      p.rot += p.rotSpeed * 0.01;

      posAttr[i * 3] = p.x;
      posAttr[i * 3 + 1] = p.y;
      posAttr[i * 3 + 2] = p.z;

      if (p.x < -14) {
        p.finished = true;
        finishedCountRef.current += 1;
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    if (!finishedRef.current && finishedCountRef.current >= LEAF_COUNT) {
      finishedRef.current = true;
      // slight delay so last frames render nicely before page switch
      setTimeout(() => onTransitionComplete(), 60);
    }
  });

  if (!isTransitioning) return null;

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={LEAF_COUNT} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.9}
        map={texture}
        transparent
        depthWrite={false}
        depthTest={false}
        sizeAttenuation={true}
        alphaTest={0.5}
      />
    </points>
  );
}
