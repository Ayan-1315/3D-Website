// src/components/DomCollider.jsx
import React, { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';

/**
 * DomCollider creates a fixed physics box aligned to a DOM element.
 * - elementRef: React ref to DOM node (must be present in the document)
 * - depth: how far into scene the box extends (world units)
 *
 * This projects the DOM rect into the camera frustum at a small world Z offset.
 */
export default function DomCollider({ elementRef, depth = 0.1 }) {
  const { camera } = useThree();
  const meshRef = useRef();
  const bodyRef = useRef();

  useEffect(() => {
    if (!elementRef || !elementRef.current) return;
    const el = elementRef.current;

    const update = () => {
      const rect = el.getBoundingClientRect();
      // convert rect center to NDC
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // NDC coords [-1,1]
      const ndcX = (centerX / window.innerWidth) * 2 - 1;
      const ndcY = -((centerY / window.innerHeight) * 2 - 1);

      // choose a small world Z to place the collider slightly in front of the camera target
      const zWorld = -2; // near the screen; adjust if your camera is different

      const vec = new THREE.Vector3(ndcX, ndcY, 0.5);
      vec.unproject(camera);
      // move to a plane at zWorld by raycasting from camera through vec
      const dir = vec.sub(camera.position).normalize();
      const distance = (zWorld - camera.position.z) / dir.z;
      const worldPos = camera.position.clone().add(dir.multiplyScalar(distance));

      // world-space size: convert rect width/height from CSS to world at that z
      const left = rect.left;
      const right = rect.right;
      const top = rect.top;
      const bottom = rect.bottom;

      const tl = new THREE.Vector3((left / window.innerWidth) * 2 - 1, -((top / window.innerHeight) * 2 - 1), 0.5).unproject(camera);
      const br = new THREE.Vector3((right / window.innerWidth) * 2 - 1, -((bottom / window.innerHeight) * 2 - 1), 0.5).unproject(camera);

      const worldWidth = Math.abs(br.x - tl.x) || 0.5;
      const worldHeight = Math.abs(br.y - tl.y) || 0.2;

      if (bodyRef.current) {
        // Position the body (works if using RigidBody API to set translation)
        try {
          bodyRef.current.setTranslation({ x: worldPos.x, y: worldPos.y, z: worldPos.z });
        } catch (e) {
          e(console.warn(e));
          // not all rapier builds expose setTranslation directly on ref; ignore if not available
        }
      }

      if (meshRef.current) {
        meshRef.current.position.set(worldPos.x, worldPos.y, worldPos.z);
        meshRef.current.scale.set(worldWidth, worldHeight, depth);
      }
    };

    update();
    window.addEventListener('resize', update);
    const obs = new MutationObserver(update);
    obs.observe(document.body, { attributes: true, childList: true, subtree: true });

    // also update on scroll (when DOM moves)
    window.addEventListener('scroll', update, { passive: true });

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update);
      obs.disconnect();
    };
    // eslint-disable-next-line
  }, [elementRef, camera]);

  // invisible mesh used to visualize / position the collider; RigidBody fixed so leaves can land on it
  return (
    <RigidBody type="fixed" ref={bodyRef} colliders="cuboid" restitution={0.1} friction={1.5}>
      <mesh ref={meshRef} visible={false}>
        <boxGeometry args={[1, 1, 0.05]} />
        <meshStandardMaterial color="hotpink" transparent opacity={0.0} />
      </mesh>
    </RigidBody>
  );
}
