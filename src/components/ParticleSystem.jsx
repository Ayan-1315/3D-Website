import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = `
  uniform float uTime;
  attribute vec3 aColor;
  attribute float aSpeed;
  attribute float aRotation;

  varying vec3 vColor;
  varying float vRotation;

  void main() {
    vColor = aColor;
    vRotation = aRotation;
    
    vec3 pos = position;
    
    // Create a swirling, vortex-like motion
    float angle = uTime * aSpeed + aRotation;
    float radius = 4.0 + cos(angle * 0.5) * 2.0;
    
    pos.x = cos(angle) * radius;
    pos.z = sin(angle) * radius;
    pos.y += sin(uTime * 0.5 + aRotation) * 0.5;
    
    vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = 15.0 * (1.0 / -viewPosition.z);
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vRotation;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    // Use the color passed from the vertex shader
    gl_FragColor = vec4(vColor, 0.5);
  }
`;

export default function ParticleSystem() {
  const shaderRef = useRef();
  const count = 20000; // High particle count for a dense effect

  const [positions, colors, speeds, rotations] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const color = new Float32Array(count * 3);
    const speed = new Float32Array(count);
    const rotation = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      pos.set([(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10], i * 3);
      
      speed[i] = Math.random() * 0.1 + 0.05;
      rotation[i] = Math.random() * Math.PI * 2;
      
      // 80% dark cloud particles, 20% neon bubbles
      if (Math.random() > 0.2) {
        const blackShade = Math.random() * 0.1 + 0.05;
        color.set([blackShade, blackShade, blackShade], i * 3);
      } else {
        color.set([0.0, 0.9, 1.0], i * 3); // Neon blue
      }
    }
    return [pos, color, speed, rotation];
  }, [count]);

  useFrame(({ clock }) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aColor" count={count} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-aSpeed" count={count} array={speeds} itemSize={1} />
        <bufferAttribute attach="attributes-aRotation" count={count} array={rotations} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={shaderRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{ uTime: { value: 0 } }}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </points>
  );
}