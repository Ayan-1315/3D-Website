import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

const LEAF_COUNT = 120;

/**
 * LeavesTransition
 * - continuous background (looping leaves) when isTransitioning=false
 * - when isTransitioning=true, leaves switch to one-shot sweep: they do NOT loop,
 *   and onTransitionComplete() is called when all have passed left edge
 * - after sweep completes, component returns to continuous mode
 */
export default function LeavesTransition({
  season = 'spring',
  isTransitioning = false,
  onTransitionComplete = () => {},
}) {
  const pointsRef = useRef();
  const finishedRef = useRef(false);
  const transitionStartedRef = useRef(false);

  const texMap = {
    spring: '/textures/leaf_pink.png',
    autumn: '/textures/leaf_yellow.png',
    fall: '/textures/leaf_red.png',
  };
  const texture = useLoader(THREE.TextureLoader, texMap[season] || texMap.spring);

  // create per-leaf control objects (JS-side)
  const particles = useMemo(() => {
    return new Array(LEAF_COUNT).fill().map(() => {
      const base = {
        x: THREE.MathUtils.randFloat(12, 28),
        y: THREE.MathUtils.randFloat(-8, 12),
        z: THREE.MathUtils.randFloat(-4, 4),
        baseSpeed: THREE.MathUtils.randFloat(0.03, 0.09), // background speed
        speed: 0, // will be set per mode
        flutter: THREE.MathUtils.randFloat(0.6, 1.6),
        rot: THREE.MathUtils.randFloat(0, Math.PI * 2),
        rotSpeed: THREE.MathUtils.randFloat(-1.6, 1.6),
        finished: false,
      };
      base.speed = THREE.MathUtils.randFloat(0.03, 0.09);
      return base;
    });
  }, []);

  // buffer for positions
  const positions = useMemo(() => new Float32Array(LEAF_COUNT * 3), []);

  // initialize positions once
  useEffect(() => {
    for (let i = 0; i < LEAF_COUNT; i++) {
      const p = particles[i];
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
      p.finished = false;
    }
    finishedRef.current = false;
    transitionStartedRef.current = false;
  }, [particles, positions, season]);

  const finishedCountRef = useRef(0);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position.array;

    if (!isTransitioning) {
      // continuous background loop
      if (transitionStartedRef.current) {
        // reset transition flags if we returned from a sweep
        transitionStartedRef.current = false;
        finishedCountRef.current = 0;
        for (let i = 0; i < LEAF_COUNT; i++) {
          particles[i].finished = false;
          // re-seed off-left leaves onto right so background looks continuous
          if (particles[i].x < -14) {
            particles[i].x = THREE.MathUtils.randFloat(12, 28);
            particles[i].y = THREE.MathUtils.randFloat(-8, 12);
            particles[i].z = THREE.MathUtils.randFloat(-4, 4);
            particles[i].speed = THREE.MathUtils.randFloat(0.03, 0.09);
          }
        }
      }

      for (let i = 0; i < LEAF_COUNT; i++) {
        const p = particles[i];
        // keep speed gentle for background
        p.x -= p.baseSpeed * (0.8 + Math.sin((state.clock.elapsedTime + i) * p.flutter) * 0.08);
        p.y += Math.sin((state.clock.elapsedTime + i * 0.2) * p.flutter) * 0.02;
        p.rot += p.rotSpeed * 0.01;

        if (p.x < -14) {
          // loop back to the right (continuous)
          p.x = THREE.MathUtils.randFloat(12, 28);
          p.y = THREE.MathUtils.randFloat(-8, 12);
          p.z = THREE.MathUtils.randFloat(-4, 4);
        }

        posAttr[i * 3] = p.x;
        posAttr[i * 3 + 1] = p.y;
        posAttr[i * 3 + 2] = p.z;
      }
    } else {
      // one-shot transition sweep
      if (!transitionStartedRef.current) {
        // begin sweep — give leaves stronger left speed and stagger slightly
        transitionStartedRef.current = true;
        finishedCountRef.current = 0;
        for (let i = 0; i < LEAF_COUNT; i++) {
          particles[i].finished = false;
          particles[i].speed = THREE.MathUtils.randFloat(0.12, 0.28);
          // optionally random vertical start a little
          particles[i].y += THREE.MathUtils.randFloat(-0.5, 0.5);
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
        p.rot += p.rotSpeed * 0.02;

        posAttr[i * 3] = p.x;
        posAttr[i * 3 + 1] = p.y;
        posAttr[i * 3 + 2] = p.z;

        if (p.x < -14) {
          p.finished = true;
          finishedCountRef.current += 1;
        }
      }

      // if all leaves finished, fire the callback once
      if (!finishedRef.current && finishedCountRef.current >= LEAF_COUNT) {
        finishedRef.current = true;
        setTimeout(() => {
          // call completion and allow parent to navigate
          try {
            onTransitionComplete();
          } finally {
            // keep finishedRef true until isTransitioning flips off — then reset in next frames
          }
        }, 60);
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  // show nothing if texture missing
  if (!texture) return null;

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
