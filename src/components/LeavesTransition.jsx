// src/components/LeavesTransition.jsx
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

const LEAF_COUNT = 120;

export default function LeavesTransition({
  season = 'spring',
  isTransitioning = false,
  onTransitionComplete = () => {},
}) {
  const pointsRef = useRef();
  const texMap = {
    spring: '/textures/leaf_pink.png',
    autumn: '/textures/leaf_yellow.png',
    fall: '/textures/leaf_red.png',
  };
  const texture = useLoader(THREE.TextureLoader, texMap[season] || texMap.spring);

  const particles = useMemo(() =>
    new Array(LEAF_COUNT).fill().map(() => ({
      x: THREE.MathUtils.randFloat(12, 28),
      // tighter vertical range so they don't "fall from top"
      y: THREE.MathUtils.randFloat(-2.5, 2.5),
      z: THREE.MathUtils.randFloat(-3, 3),
      baseSpeed: THREE.MathUtils.randFloat(0.03, 0.09),
      speed: 0,
      flutter: THREE.MathUtils.randFloat(0.6, 1.4),
      rotZ: THREE.MathUtils.randFloat(-0.5, 0.5),
      rotZSpeed: THREE.MathUtils.randFloat(-0.02, 0.02),
      finished: false,
      // eslint-disable-next-line
    })), [season]
  );

  const positions = useMemo(() => new Float32Array(LEAF_COUNT * 3), []);
  useEffect(() => {
    for (let i = 0; i < LEAF_COUNT; i++) {
      const p = particles[i];
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
      p.finished = false;
    }
  }, [particles, positions]);

  const finishedRef = useRef(false);
  const transitionStartedRef = useRef(false);
  const finishedCountRef = useRef(0);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position.array;

    if (!isTransitioning) {
      if (transitionStartedRef.current) {
        transitionStartedRef.current = false;
        finishedRef.current = false;
        finishedCountRef.current = 0;
        for (let i = 0; i < LEAF_COUNT; i++) {
          particles[i].finished = false;
          if (particles[i].x < -14) {
            particles[i].x = THREE.MathUtils.randFloat(12, 28);
            particles[i].y = THREE.MathUtils.randFloat(-2.5, 2.5);
            particles[i].z = THREE.MathUtils.randFloat(-3, 3);
          }
        }
      }

      for (let i = 0; i < LEAF_COUNT; i++) {
        const p = particles[i];
        p.x -= p.baseSpeed * (0.9 + Math.sin((state.clock.elapsedTime + i) * p.flutter) * 0.06);
        p.y += Math.sin((state.clock.elapsedTime + i * 0.25) * p.flutter) * 0.02;
        p.rotZ += p.rotZSpeed;

        if (p.x < -14) {
          p.x = THREE.MathUtils.randFloat(12, 28);
          p.y = THREE.MathUtils.randFloat(-2.5, 2.5);
          p.z = THREE.MathUtils.randFloat(-3, 3);
        }

        posAttr[i * 3] = p.x;
        posAttr[i * 3 + 1] = p.y;
        posAttr[i * 3 + 2] = p.z;
      }
    } else {
      if (!transitionStartedRef.current) {
        transitionStartedRef.current = true;
        finishedCountRef.current = 0;
        for (let i = 0; i < LEAF_COUNT; i++) {
          particles[i].finished = false;
          particles[i].speed = THREE.MathUtils.randFloat(0.12, 0.28);
          particles[i].x += THREE.MathUtils.randFloat(0, 2.5);
        }
      }

      for (let i = 0; i < LEAF_COUNT; i++) {
        const p = particles[i];
        if (p.finished) {
          posAttr[i * 3] = p.x;
          posAttr[i * 3 + 1] = p.y;
          posAttr[i * 3 + 2] = p.z;
          continue;
        }

        p.x -= p.speed + Math.sin(state.clock.elapsedTime * p.flutter + i) * 0.02;
        p.y += Math.sin((state.clock.elapsedTime + i * 0.3) * p.flutter) * 0.03;
        p.rotZ += p.rotZSpeed * 0.5;

        posAttr[i * 3] = p.x;
        posAttr[i * 3 + 1] = p.y;
        posAttr[i * 3 + 2] = p.z;

        if (p.x < -14) {
          p.finished = true;
          finishedCountRef.current += 1;
        }
      }

      if (!finishedRef.current && finishedCountRef.current >= LEAF_COUNT) {
        finishedRef.current = true;
        setTimeout(() => {
          try { onTransitionComplete(); } catch (e) {e()}
        }, 60);
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!texture) return null;

  texture.encoding = THREE.sRGBEncoding;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={LEAF_COUNT} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={1.0}
        map={texture}
        transparent={true}
        opacity={1.0}
        depthWrite={false}
        depthTest={false}
        sizeAttenuation={true}
        alphaTest={0.01}
      />
    </points>
  );
}
