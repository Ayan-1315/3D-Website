import React, { useEffect, useRef, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { RigidBody, interactionGroups } from '@react-three/rapier';

// --- Collision Groups ---
// Must match the groups defined in LeavesTransition.jsx
const GROUP_ENVIRONMENT = 0;
const GROUP_LEAF = 1;

export default function DomCollider({ elementRef, depth = 0.1 }) {
  const { camera, viewport } = useThree();
  const meshRef = useRef();
  const bodyRef = useRef();

  // Define the collision group for the environment (this collider)
  const colliderGroup = useMemo(() => 
    interactionGroups([GROUP_ENVIRONMENT], [GROUP_LEAF]), 
  []);

  useEffect(() => {
    if (!elementRef || !elementRef.current) return;
    const el = elementRef.current;

    const update = () => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const { width: vw, height: vh } = viewport;

      // Convert pixel values to world-space units (at z=0)
      const worldWidth = (rect.width / window.innerWidth) * vw;
      const worldHeight = (rect.height / window.innerHeight) * vh;
      
      const worldX = (rect.left / window.innerWidth) * vw - vw / 2 + worldWidth / 2;
      const worldY = -(rect.top / window.innerHeight) * vh + vh / 2 - worldHeight / 2;

      // Choose a Z position for the collider
      const worldZ = -1; // Place it slightly in front of the leaves

      if (bodyRef.current) {
        try {
          // Set the position and size of the physics body
          bodyRef.current.setTranslation({ x: worldX, y: worldY, z: worldZ });
          // Note: We can't resize a cuboid collider, so we scale the mesh
          // and the RigidBody component should have scale={[worldWidth, worldHeight, depth]}
        } catch (e) {
          console.warn(e);
        }
      }

      if (meshRef.current) {
        // This is just for visualization, but good to keep in sync
        meshRef.current.position.set(worldX, worldY, worldZ);
      }
    };

    update();
    
    // Update on resize and scroll
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, { passive: true });
    
    // Update if DOM content changes
    const obs = new MutationObserver(update);
    obs.observe(document.body, { attributes: true, childList: true, subtree: true });

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update);
      obs.disconnect();
    };
  }, [elementRef, camera, viewport]);

  // Get initial size/position for the scale prop (will be updated by useEffect)
  let initialScale = [1, 1, depth];
  if (elementRef && elementRef.current) {
    const rect = elementRef.current.getBoundingClientRect();
    const { width: vw, height: vh } = viewport;
    initialScale = [
      (rect.width / window.innerWidth) * vw,
      (rect.height / window.innerHeight) * vh,
      depth
    ];
  }

  return (
    <RigidBody 
      type="fixed" 
      ref={bodyRef} 
      colliders="cuboid" 
      restitution={0.1} 
      friction={1.5}
      collisionGroups={colliderGroup} // <-- Apply collision group
      scale={initialScale} // Set initial scale
    >
      <mesh ref={meshRef} visible={false}>
        <boxGeometry args={[1, 1, 1]} /> 
        <meshStandardMaterial color="hotpink" transparent opacity={0.0} />
      </mesh>
    </RigidBody>
  );
}