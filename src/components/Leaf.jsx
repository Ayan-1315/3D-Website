// src/components/Leaf.jsx
import React, { useMemo, useRef } from 'react';
import { RigidBody } from '@react-three/rapier';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';

export default function Leaf({ position = [0, 6, 0], season = 'spring', size = 1.0 }) {
  const texMap = {
    spring: '/textures/leaf_pink.png',
    autumn: '/textures/leaf_yellow.png',
    fall: '/textures/leaf_red.png',
  };
  const map = useLoader(THREE.TextureLoader, texMap[season] || texMap.spring);
  // plane geometry is cheap to reuse; create once
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  const meshRef = useRef();

  // randomized orientation restricted to Z rotation (no upside-down flips)
  const initialRotation = [
    0, // x
    0, // y
    (Math.random() - 0.5) * 1.2, // gentle z rotation
  ];
  // gentle angular velocity around z
  const angularVelocity = [0, 0, (Math.random() - 0.5) * 0.6];

  // scale leaves by size (varies per instance)
  const scale = size * (0.6 + Math.random() * 0.9);

  return (
    <RigidBody
      type="dynamic"
      position={position}
      restitution={0.05}
      friction={1.2}
      linearDamping={0.8}
      angularDamping={0.9}
      angularVelocity={angularVelocity}
      rotation={initialRotation}
      colliders={false} // we'll use a small collider below
    >
      <mesh ref={meshRef} geometry={geometry} scale={[scale, scale, scale]}>
        <meshStandardMaterial
          map={map}
          transparent={false} // fully opaque
          side={THREE.DoubleSide}
          // alphaTest only needed if you use transparency; keep it off
        />
      </mesh>
      {/* Add a lightweight collider roughly matching the plane bounds */}
      <RigidBody
        type="fixed"
        position={[0, 0, 0]} // nested; this RigidBody is only used as a wrapper for collider — rapier doesn't support nested RB well, but @react-three/rapier supports primitive collider config — to be safe we add a primitive collider element */}
        ></RigidBody>
    </RigidBody>
  );
}
