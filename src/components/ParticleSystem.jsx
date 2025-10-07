import React, { forwardRef, useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 ParticleSystem.jsx
 - red particles always visible & glowing (no transparency fade)
 - both ribbons share same radius (2.7) with 45° angular offset
 - particles never vanish in the middle
*/

const RING_RADIUS = 2.7;
const RING_PER_RING = 1200;
const TARGET_TOTAL = 10000;
const BG_COUNT = Math.max(0, TARGET_TOTAL - RING_PER_RING * 2);
const COUNT = RING_PER_RING * 2 + BG_COUNT;

// ring angular offset in radians (45°)
const RING_ANGULAR_OFFSET = Math.PI / 4.0;

const vertexShader = `
  precision highp float;
  uniform float uTime;
  uniform float uIntro;
  uniform float uRingRadius;
  attribute vec3 aColor;
  attribute float aSpeed;
  attribute float aType; 
  attribute float aRingT;
  attribute vec3 aInitialOffset;
  attribute float aIsRed;
  varying vec3 vColor;
  varying float vIsRed;
  varying float vMerge;
  varying float vDepth;

  vec3 rotateY(vec3 p, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c);
  }
  float hash1(float x) { return fract(sin(x)*43758.5453); }

  void main() {
    vColor = aColor;
    vIsRed = aIsRed;
    vMerge = 0.0;
    vec3 pos = vec3(0.0);
    float baseSize = 6.0;

    // RING A
    if (aType < 0.5) {
      float t = fract(aRingT + uTime * 0.0010 * aSpeed);
      float ang = t * 6.28318530718 + uTime * 0.28 * aSpeed;
      float wig = sin(t * 10.0 + uTime * 1.1) * 0.04;
      float radius = uRingRadius + wig;
      pos = vec3(cos(ang) * radius, sin(ang) * radius * 0.12, sin(ang) * radius);
      pos = rotateY(pos, uTime * 0.055);
      baseSize = 7.5;
    }
    // RING B — same radius, 45° offset
    else if (aType < 1.5) {
      float t = fract(aRingT - uTime * 0.0009 * aSpeed);
      float ang = t * 6.28318530718 - uTime * 0.24 * aSpeed + ${RING_ANGULAR_OFFSET};
      float wig = cos(t * 9.0 + uTime * 0.9) * 0.04;
      float radius = uRingRadius + wig;
      pos = vec3(cos(ang) * radius, sin(ang) * radius * 0.12, sin(ang) * radius);
      pos = rotateY(pos, -uTime * 0.04);
      baseSize = 7.5;
    }
    // BACKGROUND
    else {
      vec3 p = aInitialOffset;
      float dir = sign(aInitialOffset.x);
      float span = 30.0;
      float travel = mod(uTime*(aSpeed*0.6+0.45)+abs(aInitialOffset.x)*0.12,span);
      p.x = dir*(span-travel);
      p.y += sin(uTime*0.45+aInitialOffset.x*0.12)*0.32;
      p.z += cos(uTime*0.35+aInitialOffset.y*0.09)*0.32;
      // prevent escape
      p.y = clamp(p.y,-6.0,6.0);
      p.z = clamp(p.z,-12.0,12.0);

      // gravity for red only
      if(aIsRed>0.5){
        float dist=length(p);
        vec3 toCenter=-normalize(p);
        float g=1.15*(1.0/pow(dist+0.36,1.02));
        g=clamp(g,0.0,1.3);
        p+=toCenter*g*0.95;
        vec3 axis=normalize(vec3(0.0,0.66,0.24));
        vec3 tang=normalize(cross(toCenter,axis));
        p+=tang*(0.95*g);
        if(dist<(uRingRadius+0.36)){
          float ang=atan(p.z,p.x);
          float rr=uRingRadius+sin(ang*6.0+uTime*1.6)*0.035;
          p=vec3(cos(ang)*rr,sin(ang)*rr*0.12,sin(ang)*rr);
        }
      }

      pos=p;
      baseSize=(aIsRed>0.5)?11.0:8.5;
    }

    vec3 introPos=aInitialOffset*1.6;
    vec3 finalPos=mix(introPos,pos,clamp(uIntro,0.0,1.0));
    vDepth=clamp(1.0-smoothstep(0.0,12.0,length(finalPos)),0.2,1.0);

    vec4 modelP=modelMatrix*vec4(finalPos,1.0);
    vec4 viewP=viewMatrix*modelP;
    gl_Position=projectionMatrix*viewP;
    float size=baseSize*(1.6/max(0.001,-viewP.z));
    gl_PointSize=clamp(size,2.0,128.0);
  }
`;

const fragmentShader = `
  precision highp float;
  uniform float uBoost;
  varying vec3 vColor;
  varying float vIsRed;
  varying float vMerge;
  varying float vDepth;
  void main(){
    vec2 uv=gl_PointCoord-vec2(0.5);
    float d=length(uv);
    if(d>0.5)discard;
    float edge=smoothstep(0.48,0.2,d);
    vec3 base=vColor*(0.8+1.1*(1.0-edge))*(0.7+1.2*vDepth)*(0.85+uBoost);
    // red always glowing & opaque
    if(vIsRed>0.5){
      base+=vec3(1.0,0.25,0.25)*(1.0-d)*1.5;
    }
    float alpha=1.0; // no transparency for red or black
    gl_FragColor=vec4(base,alpha);
  }
`;

const coreVertex = `
  varying vec3 vPos;
  void main(){
    vPos=position;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
  }
`;
const coreFragment = `
  precision highp float;
  uniform float uTime;
  uniform vec3 uBase;
  uniform vec3 uAccent;
  varying vec3 vPos;
  float pseudo(vec3 p){
    return 0.5+0.5*sin(p.x*3.0+uTime*2.0)*cos(p.y*2.5-uTime*1.4);
  }
  void main(){
    float n=pseudo(vPos*1.5);
    float glow=smoothstep(0.12,0.95,n);
    vec3 col=mix(uBase,uAccent,n)*(0.6+glow);
    float alpha=clamp(0.28+glow*0.42,0.15,0.9);
    gl_FragColor=vec4(col,alpha);
  }
`;

const ParticleSystem = forwardRef((props, ref) => {
  const shaderRef = useRef();
  const coreRef = useRef();
  const lightRef = useRef();

  const [positions, colors, speeds, types, ringT, initialOffsets, isRed] = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const speeds = new Float32Array(COUNT);
    const types = new Float32Array(COUNT);
    const ringT = new Float32Array(COUNT);
    const initialOffsets = new Float32Array(COUNT * 3);
    const isRed = new Float32Array(COUNT);

    let i = 0;
    for (let r = 0; r < RING_PER_RING; r++, i++) {
      types[i] = 0.0;
      ringT[i] = r / RING_PER_RING + (Math.random() - 0.5) * 0.05;
      speeds[i] = 0.6 + Math.random() * 0.8;
      colors[i * 3] = 0.98; colors[i * 3 + 1] = 0.06; colors[i * 3 + 2] = 0.06;
      initialOffsets[i * 3] = (Math.random() - 0.5) * 2.6;
      initialOffsets[i * 3 + 1] = (Math.random() - 0.5) * 1.6;
      initialOffsets[i * 3 + 2] = (Math.random() - 0.5) * 2.6;
      isRed[i] = 0.0;
    }
    for (let r = 0; r < RING_PER_RING; r++, i++) {
      types[i] = 1.0;
      ringT[i] = r / RING_PER_RING + (Math.random() - 0.5) * 0.05;
      speeds[i] = 0.6 + Math.random() * 0.8;
      colors[i * 3] = 0.98; colors[i * 3 + 1] = 0.06; colors[i * 3 + 2] = 0.06;
      initialOffsets[i * 3] = (Math.random() - 0.5) * 2.6;
      initialOffsets[i * 3 + 1] = (Math.random() - 0.5) * 1.6;
      initialOffsets[i * 3 + 2] = (Math.random() - 0.5) * 2.6;
      isRed[i] = 0.0;
    }
    for (let b = 0; b < BG_COUNT; b++, i++) {
      types[i] = 2.0;
      ringT[i] = 0.0;
      speeds[i] = 0.6 + Math.random() * 1.2;
      const side = Math.random() < 0.5 ? -1 : 1;
      const sx = side * (10 + Math.random() * 18);
      const sy = (Math.random() - 0.5) * 12;
      const sz = (Math.random() - 0.5) * 24;
      initialOffsets[i * 3] = sx;
      initialOffsets[i * 3 + 1] = sy;
      initialOffsets[i * 3 + 2] = sz;
      const r = Math.random();
      if (r < 0.05) {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.18; colors[i * 3 + 2] = 0.18;
        isRed[i] = 1.0;
      } else {
        const shade = 0.14 + Math.random() * 0.06;
        colors[i * 3] = shade; colors[i * 3 + 1] = shade; colors[i * 3 + 2] = shade;
        isRed[i] = 0.0;
      }
    }
    return [positions, colors, speeds, types, ringT, initialOffsets, isRed];
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = t;
      shaderRef.current.uniforms.uIntro.value = Math.min(1.0, t * 0.45);
      shaderRef.current.uniforms.uRingRadius.value = RING_RADIUS;
      shaderRef.current.uniforms.uBoost.value = 0.6;
    }
    if (coreRef.current) coreRef.current.uniforms.uTime.value = t;
    if (lightRef.current) {
      const tt = clock.getElapsedTime();
      lightRef.current.intensity = 1.0 + Math.sin(tt * 1.1) * 0.32;
      lightRef.current.position.set(Math.sin(tt * 0.6) * 0.12, Math.cos(tt * 0.9) * 0.08, 0.18);
      lightRef.current.color.setRGB(1.0, 0.36, 0.36);
    }
  });

  return (
    <group>
      <points ref={ref}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" array={positions} count={positions.length / 3} itemSize={3} />
          <bufferAttribute attach="attributes-aColor" array={colors} count={colors.length / 3} itemSize={3} />
          <bufferAttribute attach="attributes-aSpeed" array={speeds} count={speeds.length} itemSize={1} />
          <bufferAttribute attach="attributes-aType" array={types} count={types.length} itemSize={1} />
          <bufferAttribute attach="attributes-aRingT" array={ringT} count={ringT.length} itemSize={1} />
          <bufferAttribute attach="attributes-aInitialOffset" array={initialOffsets} count={initialOffsets.length / 3} itemSize={3} />
          <bufferAttribute attach="attributes-aIsRed" array={isRed} count={isRed.length} itemSize={1} />
        </bufferGeometry>
        <shaderMaterial
          ref={shaderRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={{
            uTime: { value: 0 },
            uIntro: { value: 0 },
            uRingRadius: { value: RING_RADIUS },
            uBoost: { value: 0.0 },
          }}
          transparent={true}
          depthWrite={false}
          depthTest={true}
          blending={THREE.NormalBlending}
        />
      </points>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.2, 48, 48]} />
        <shaderMaterial
          ref={coreRef}
          vertexShader={coreVertex}
          fragmentShader={coreFragment}
          uniforms={{
            uTime: { value: 0 },
            uBase: { value: new THREE.Color("#00e5ff") },
            uAccent: { value: new THREE.Color("#ff3f3f") },
          }}
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <pointLight ref={lightRef} color={0xff3f3f} intensity={1.0} distance={12} decay={2} />
    </group>
  );
});

export default ParticleSystem;
