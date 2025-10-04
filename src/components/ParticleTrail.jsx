// src/components/ParticleTrail.jsx
import React, { useRef, useEffect, useMemo, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Defensive Particle Trail (debug-friendly)
 */
export default function ParticleTrail({
  count = 600,
  spawnRate = 6,
  life = 0.9,
  baseColor = "#00e5ff",
  size = 18,
}) {
  const { camera, gl } = useThree();
  const positions = useRef();
  const alphas = useRef();
  const sizes = useRef();
  const velocities = useRef();
  const lifetimes = useRef();
  const idxRef = useRef(0);

  const geomRef = useRef(null);
  const pointsRef = useRef(null);

  // helper to (re)create arrays + attributes
  const createBuffers = useCallback(() => {
    positions.current = new Float32Array(count * 3);
    alphas.current = new Float32Array(count);
    sizes.current = new Float32Array(count);
    velocities.current = new Float32Array(count * 3);
    lifetimes.current = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions.current[i * 3 + 0] = 0;
      positions.current[i * 3 + 1] = -9999;
      positions.current[i * 3 + 2] = 0;
      alphas.current[i] = 0;
      sizes.current[i] = 0;
      lifetimes.current[i] = 0;
      velocities.current[i * 3 + 0] = 0;
      velocities.current[i * 3 + 1] = 0;
      velocities.current[i * 3 + 2] = 0;
    }

    // build geometry attributes (or update)
    const g = geomRef.current || new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions.current, 3));
    g.setAttribute("alpha", new THREE.BufferAttribute(alphas.current, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes.current, 1));
    geomRef.current = g;
  }, [count]);

  useEffect(() => {
    createBuffers();
    idxRef.current = 0;
    // spawn small burst so we can tell if this renders
    setTimeout(() => {
      // spawn a handful in center
      for (let i = 0; i < 40; i++) {
        const p = new THREE.Vector3((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, 0);
        spawnImmediate(p);
      }
      console.info("ParticleTrail: initial burst spawned (debug).");
    }, 120);

    // cleanup on unmount
    return () => {
      if (geomRef.current) {
        geomRef.current.dispose?.();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createBuffers]);

  // shader material (keeps same as before)
  const shaderMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uColor: { value: new THREE.Color(baseColor) },
        uPixelRatio: { value: typeof window !== "undefined" ? window.devicePixelRatio : 1 },
      },
      vertexShader: `
        attribute float alpha;
        attribute float aSize;
        varying float vAlpha;
        uniform float uPixelRatio;
        void main() {
          vAlpha = alpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (300.0 / -mvPosition.z) * uPixelRatio;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          vec2 uv = gl_PointCoord.xy - 0.5;
          float r = length(uv);
          float mask = smoothstep(0.5, 0.0, r);
          gl_FragColor = vec4(uColor, vAlpha * mask);
        }
      `,
    });
  }, [baseColor]);

  // fallback simple material (helps debug cases where shader fails)
  const fallbackMat = useMemo(() => {
    return new THREE.PointsMaterial({ size: size, color: new THREE.Color(baseColor), transparent: true, opacity: 0.9 });
  }, [baseColor, size]);

  // spawn helper used internally (synchronous)
  const spawnImmediate = useCallback(
    (worldPos, dir = [0, 0, 0]) => {
      if (!positions.current) return;
      const i = idxRef.current % count;
      positions.current[i * 3 + 0] = worldPos.x;
      positions.current[i * 3 + 1] = worldPos.y;
      positions.current[i * 3 + 2] = worldPos.z;
      alphas.current[i] = 1;
      sizes.current[i] = size * (0.6 + Math.random() * 0.8);
      lifetimes.current[i] = life * (0.9 + Math.random() * 0.3);
      velocities.current[i * 3 + 0] = (Math.random() - 0.5) * 0.5 + dir[0] * 0.25;
      velocities.current[i * 3 + 1] = (Math.random() - 0.5) * 0.5 + dir[1] * 0.25;
      velocities.current[i * 3 + 2] = (Math.random() - 0.5) * 0.5 + dir[2] * 0.25;
      idxRef.current = (idxRef.current + 1) % count;
    },
    [count, life, size]
  );

  // pointer handling (raycast to plane; fallback to unproject)
  useEffect(() => {
    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // world z=0
    const pointer = new THREE.Vector2();
    let last = { x: 0, y: 0 };

    function computeWorldPointFromEvent(e) {
      const rect = gl.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const worldPoint = new THREE.Vector3();
      const hit = raycaster.ray.intersectPlane(plane, worldPoint);
      if (hit === null) {
        // fallback: unproject a point at a fixed distance in front of the camera
        const v = new THREE.Vector3(pointer.x, pointer.y, 0.5);
        v.unproject(camera);
        // place slightly in front of camera (distance)
        return v;
      }
      return worldPoint;
    }

    function onPointerMove(e) {
      const worldPoint = computeWorldPointFromEvent(e);
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      const speedVec = [dx * 0.01, -dy * 0.01, 0];
      last.x = e.clientX;
      last.y = e.clientY;

      for (let i = 0; i < spawnRate; i++) {
        const jitter = new THREE.Vector3((Math.random() - 0.5) * 0.06, (Math.random() - 0.5) * 0.06, (Math.random() - 0.5) * 0.02);
        const p = new THREE.Vector3().copy(worldPoint).add(jitter);
        spawnImmediate(p, speedVec);
      }
    }

    function onPointerDown(e) {
      // spawn a visible burst to test that events are wired
      const wp = computeWorldPointFromEvent(e);
      for (let i = 0; i < 120; i++) {
        const jitter = new THREE.Vector3((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.2);
        spawnImmediate(new THREE.Vector3().copy(wp).add(jitter), [(Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, 0]);
      }
      console.info("ParticleTrail: pointerdown burst (debug).");
    }

    gl.domElement.addEventListener("pointermove", onPointerMove);
    gl.domElement.addEventListener("pointerdown", onPointerDown);

    return () => {
      gl.domElement.removeEventListener("pointermove", onPointerMove);
      gl.domElement.removeEventListener("pointerdown", onPointerDown);
    };
  }, [camera, gl, spawnRate, spawnImmediate]);

  // update / animate
  useFrame((_, dt) => {
    if (!geomRef.current || !positions.current) return;

    const posArr = positions.current;
    const aArr = alphas.current;
    const sArr = sizes.current;
    const vArr = velocities.current;
    const lifeArr = lifetimes.current;

    for (let i = 0; i < count; i++) {
      if (lifeArr[i] > 0) {
        posArr[i * 3 + 0] += vArr[i * 3 + 0] * dt;
        posArr[i * 3 + 1] += vArr[i * 3 + 1] * dt;
        posArr[i * 3 + 2] += vArr[i * 3 + 2] * dt;

        lifeArr[i] -= dt;
        const t = Math.max(0, lifeArr[i] / life);
        aArr[i] = t;
        sArr[i] = size * (0.3 + 0.7 * t);

        vArr[i * 3 + 0] *= 0.98;
        vArr[i * 3 + 1] *= 0.98;
        vArr[i * 3 + 2] *= 0.98;

        if (lifeArr[i] <= 0) {
          aArr[i] = 0;
          // (optional) move offscreen: posArr[i*3+1] = -9999;
        }
      }
    }

    // push updates to attributes
    const posAttr = geomRef.current.getAttribute("position");
    const alphaAttr = geomRef.current.getAttribute("alpha");
    const sizeAttr = geomRef.current.getAttribute("aSize");
    if (posAttr && alphaAttr && sizeAttr) {
      posAttr.array = posArr;
      alphaAttr.array = aArr;
      sizeAttr.array = sArr;
      posAttr.needsUpdate = true;
      alphaAttr.needsUpdate = true;
      sizeAttr.needsUpdate = true;
    }

    // assign geometry to points (first time)
    if (pointsRef.current && pointsRef.current.geometry !== geomRef.current) {
      pointsRef.current.geometry = geomRef.current;
    }
  });

  return (
    // show shader mat, but fallback to simple material if shader fails (helps debugging)
    <points ref={pointsRef} geometry={geomRef.current}>
      {/* prefer shader; fallback to points material */}
      <primitive object={shaderMat} attach="material" />
      {/* If you don't see anything, switch the above to: */}
      <primitive object={fallbackMat} attach="material" />
    </points>
  );
}
