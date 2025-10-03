import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// GLSL 3D Simplex noise function (from webgl-noise)
const noise3D = `
    vec4 permute(vec4 x) { return mod(((x*34.0)+10.0)*x, 289.0); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    float snoise(vec3 v) { 
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

      // First corner
      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 =   v - i + dot(i, C.xxx) ;

      // Other corners
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );

      //   x0 = x0 - 0.0 + 0.0 * C.xxx;
      //   x1 = x0 - i1  + 1.0 * C.xxx;
      //   x2 = x0 - i2  + 2.0 * C.xxx;
      //   x3 = x0 - 1.0 + 3.0 * C.xxx;
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy; // -1.0 + 3.0 * C.xxx

      // Permutations
      i = mod(i, 289.0 ); 
      vec4 p = permute( permute( permute( 
                 i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
               + i.x + vec4(0.0, i1.x, i2.x, 1.0 )));

      // Gradients: 7x7x6 points over a cube, mapped onto an octahedron.
      // The kernel is 4D which makes this a little tricky.
      // Each of the 12 edges of the cube are also assigned a gradient.
      // These 12 gradients are the 12 directions on the octahedron.
      // (The points are at (0,0,1), (0,1,0), (1,0,0) and their permutations and inversions.)
      vec4 j = p - D.wwww; //  Subtract 2.0 to get 0.0, 1.0, 2.0, 3.0
      vec4 o1 = fract(j * C.xxx);
      vec4 o2 = mod(j, C.xxx);
      vec4 o = 1.0 - abs(o1 - o2); 
      vec4 h = step(o1, o2); 
      vec4 b0 = vec4(o1 - h.xyzw, o2 - h.xyzw); 
      vec4 b1 = b0.xzyw + vec4(h.zxyw, h.zxyw); // Rearrange components

      vec4 s0 = floor(p * C.xxx) * 2.0 + 1.0;
      vec4 s1 = floor(p * C.zzz) * 2.0 + 1.0;
      vec4 s = abs(s0) - 1.0; //  Get absolute values

      // Calculate the gradients
      vec4 gx = b0.xzxz * s.xzxz + b1.ywyw * s.ywyw; // Dot product
      vec4 gy = b0.xxyy * s.xxyy + b1.zzww * s.zzww;
      vec4 gz = b0.aaaa * s.aaaa + b1.xxxx * s.xxxx; //  Why is this a.aaaa?

      vec4 g0 = vec4(gx.x, gy.x, gz.x, 0.0);
      vec4 g1 = vec4(gx.y, gy.y, gz.y, 0.0);
      vec4 g2 = vec4(gx.z, gy.z, gz.z, 0.0);
      vec4 g3 = vec4(gx.w, gy.w, gz.w, 0.0);

      // Normalise gradients
      vec4 norm0 = taylorInvSqrt(vec4(dot(g0, g0), dot(g1, g1), dot(g2, g2), dot(g3, g3)));
      g0 *= norm0.x;
      g1 *= norm0.y;
      g2 *= norm0.z;
      g3 *= norm0.w;

      // Calculate noise contributions from the four corners
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(g0,x0), dot(g1,x1), dot(g2,x2), dot(g3,x3) ) );
    }
`;


const vertexShader = `
  varying vec3 vWorldPosition;
  void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = modelPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec3 uBaseColor;
  uniform vec3 uBloomColor;
  uniform float uDensity;
  uniform float uNoiseScale;
  uniform float uBrightness;

  varying vec3 vWorldPosition;

  ${noise3D} // Include the 3D noise function

  void main() {
    // Offset the position to center the smoke and animate its movement
    vec3 smokePos = vWorldPosition * uNoiseScale + uTime * 0.1;

    // Get 3D noise value for smoke density
    // Adding multiple noise layers for more complexity
    float n = snoise(smokePos);
    n += snoise(smokePos * 1.5) * 0.5;
    n += snoise(smokePos * 2.5) * 0.25;
    n = n / (1.0 + 0.5 + 0.25); // Normalize sum

    // Smoothstep to create a more defined cloud shape
    n = smoothstep(0.2, 0.8, n); 

    // Adjust density based on distance from core (center of the volume)
    float distToCenter = length(vWorldPosition);
    float falloff = 1.0 - smoothstep(0.0, 3.0, distToCenter); // Adjust 3.0 for volume size
    n *= falloff;

    // Apply overall density control
    n *= uDensity;
    
    // Final color with glowing effect
    vec3 finalColor = mix(uBaseColor, uBloomColor, n * uBrightness);
    
    gl_FragColor = vec4(finalColor, n); // Alpha based on noise density
  }
`;

export default function VolumetricSmoke() {
  const materialRef = useRef();

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  const uniforms = {
    uTime: { value: 0 },
    uBaseColor: { value: new THREE.Color('#003366') }, // Darker blue for smoke body
    uBloomColor: { value: new THREE.Color('#00ffff') }, // Cyan for glowing parts
    uDensity: { value: 0.8 }, // Overall density of the smoke
    uNoiseScale: { value: 0.5 }, // How zoomed in the noise is
    uBrightness: { value: 2.0 } // How much the smoke glows
  };

  return (
    <mesh position={[0, 0, 0]}> {/* Position at the core */}
      <sphereGeometry args={[4, 32, 32]} /> {/* Use a sphere to contain the smoke */}
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false} // Important for blending
        side={THREE.FrontSide} // Render only front side of sphere
        blending={THREE.AdditiveBlending} // Additive blending for glow effect
      />
    </mesh>
  );
}