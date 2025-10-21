import React, { useEffect, useRef, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { RigidBody, interactionGroups } from "@react-three/rapier";

const GROUP_ENVIRONMENT = 0;
const GROUP_LEAF = 1;

// DomCollider: positions a fixed cuboid where a DOM element sits.
// It updates on resize/scroll/mutation. If Rapier instance allows dynamic scaling,
// we attempt to set the body scale; otherwise we keep mesh scaled to match.
export default function DomCollider({ elementRef, depth = 0.15 }) {
  const { camera, viewport } = useThree();
  const meshRef = useRef();
  const bodyRef = useRef();

  const colliderGroup = useMemo(
    () => interactionGroups([GROUP_ENVIRONMENT], [GROUP_LEAF]),
    []
  );

  useEffect(() => {
    if (!elementRef || !elementRef.current) return;
    const el = elementRef.current;

    const update = () => {
      if (!el || !viewport) return;
      const rect = el.getBoundingClientRect();
      const vw = viewport.width;
      const vh = viewport.height;

      // Convert pixel values to world-space units (z=0 plane)
      const worldWidth = (rect.width / window.innerWidth) * vw;
      const worldHeight = (rect.height / window.innerHeight) * vh;

      // worldX/worldY center of the element
      const worldX = (rect.left / window.innerWidth) * vw - vw / 2 + worldWidth / 2;
      const worldY = -(rect.top / window.innerHeight) * vh + vh / 2 - worldHeight / 2;

      // Place the collider slightly in front of the UI plane to avoid capturing leaves
      // (choose z positive to be nearer camera). You may tweak this if your leaves are layered differently.
      const worldZ = 2.0;

      // Update RigidBody position if available
      if (bodyRef.current) {
        try {
          bodyRef.current.setTranslation({ x: worldX, y: worldY, z: worldZ });
          // attempt to set scale if API exposes it (some Rapier wrappers have setScale)
          if (typeof bodyRef.current.setScale === "function") {
            bodyRef.current.setScale({ x: worldWidth, y: worldHeight, z: depth });
          } else if (bodyRef.current?.raw?.setScale) {
            // some internals might expose raw API; try cautiously
            try {
              bodyRef.current.raw.setScale?.(worldWidth, worldHeight, depth);
            } catch (e) {e}
          }
        } catch (e) {
          // ignore errors from non-supported methods
          e
        }
      }

      // keep the visualization mesh aligned (mesh scale & position)
      if (meshRef.current) {
        meshRef.current.position.set(worldX, worldY, worldZ);
        meshRef.current.scale.set(worldWidth, worldHeight, depth);
      }
    };

    update();

    // Update on resize, scroll, and DOM changes
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { passive: true });
    const obs = new MutationObserver(update);
    obs.observe(document.body, { attributes: true, childList: true, subtree: true });

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update);
      obs.disconnect();
    };
  }, [elementRef, viewport, camera, depth]);

  // compute initialScale defensively
  let initialScale = [1, 1, depth];
  if (elementRef && elementRef.current && typeof window !== "undefined") {
    const rect = elementRef.current.getBoundingClientRect();
    if (viewport) {
      initialScale = [
        (rect.width / window.innerWidth) * viewport.width,
        (rect.height / window.innerHeight) * viewport.height,
        depth,
      ];
    }
  }

  return (
    <RigidBody
      type="fixed"
      ref={bodyRef}
      colliders="cuboid"
      restitution={0.1}
      friction={1.5}
      collisionGroups={colliderGroup}
      // set initial scale; we'll attempt to update it in the effect
      scale={initialScale}
    >
      <mesh ref={meshRef} visible={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="hotpink" transparent opacity={0.0} />
      </mesh>
    </RigidBody>
  );
}
