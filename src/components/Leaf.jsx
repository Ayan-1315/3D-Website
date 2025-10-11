import React from 'react';
import { RigidBody } from '@react-three/rapier';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

const leafGeometry = new THREE.PlaneGeometry(0.5, 0.5);

export default function Leaf({ position }) {
  const leafTexture = useTexture('/textures/leaf_pink.png');
  const initialRotation = [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI];
  const angularVelocity = [(Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, 0];

  return (
    <RigidBody
      position={position}
      colliders="ball"
      restitution={0.3}
      friction={0.5}
      linearDamping={0.5}
      angularDamping={0.5}
      angularVelocity={angularVelocity}
      rotation={initialRotation}
    >
      <mesh geometry={leafGeometry}>
        <meshStandardMaterial
          map={leafTexture}
          transparent={true}
          side={THREE.DoubleSide}
          alphaTest={0.5}
        />
      </mesh>
    </RigidBody>
  );
}