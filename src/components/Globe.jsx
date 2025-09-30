import React, {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useFrame, useLoader, extend } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { TextureLoader, Vector3, Color } from "three";
import { shaderMaterial } from "@react-three/drei";

// --- 1. Define the Fresnel Shader Material ---
// This creates a reusable material component we can use in our JSX.
const AtmosphereMaterial = shaderMaterial(
  // Uniforms (data we pass to the shader)
  {
    uColor: new Color("#3088ff"), // The glow color
    uPower: 2.5, // The power of the glow
  },
  // Vertex Shader (positions vertices)
  `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader (colors pixels)
  `
    uniform vec3 uColor;
    uniform float uPower;
    varying vec3 vNormal;
    void main() {
      // Calculate the angle between the camera and the surface normal
      float intensity = pow(1.0 - abs(dot(vNormal, vec3(0, 0, 1.0))), uPower);
      gl_FragColor = vec4(uColor, 1.0) * intensity;
    }
  `
);

// Register it with R3F so we can use it as a JSX component
extend({ AtmosphereMaterial });

// --- 2. The Main Globe Component ---
const Globe = forwardRef(function Globe({ dimScene }, ref) {
  // --- Refs & Textures (No more glow.png!) ---
  const groupRef = useRef();
  const coreRef = useRef();
  const innerTexture = useLoader(TextureLoader, "/textures/inner_core.png");
  const outerTexture = useLoader(TextureLoader, "/textures/outer_surface.png");

  // --- State & Handlers (Unchanged) ---
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [targetRotation, setTargetRotation] = useState(
    () => new Vector3(0, 0, 0)
  );
  useImperativeHandle(ref, () => ({
    focusToward(uiAnchor) {
      const x = (uiAnchor.y - 0.5) * -1.2;
      const y = (uiAnchor.x - 0.5) * 1.2;
      setTargetRotation(new Vector3(x, y, 0));
    },
    unfocus() {
      setTargetRotation(new Vector3(0, 0, 0));
    },
  }));
  useEffect(() => {
    const handleMouseMove = (event) => {
      const { clientX, clientY } = event;
      const x = clientX / window.innerWidth - 0.5;
      const y = clientY / window.innerHeight - 0.5;
      setMousePos({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // --- Animation Loop (Unchanged) ---
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (groupRef.current && coreRef.current) {
      const pulse = Math.sin(time * 0.8) * 0.04;
      coreRef.current.scale.set(1 + pulse, 1 + pulse, 1 + pulse);
      const targetPosX = mousePos.x * -0.2;
      const targetPosY = mousePos.y * 0.2;
      groupRef.current.position.x +=
        (targetPosX - groupRef.current.position.x) * 0.05;
      groupRef.current.position.y +=
        (targetPosY - groupRef.current.position.y) * 0.05;
      groupRef.current.rotation.y += 0.0005;
      const finalTargetY = targetRotation.y + groupRef.current.rotation.y;
      groupRef.current.rotation.x +=
        (targetRotation.x - groupRef.current.rotation.x) * 0.03;
      groupRef.current.rotation.y +=
        (finalTargetY - groupRef.current.rotation.y) * 0.03;
    }
  });

  return (
    <>
      <Stars
        radius={300}
        depth={50}
        count={6000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />
      <ambientLight intensity={dimScene ? 0.05 : 0.1} />
      <pointLight position={[10, 10, 10]} intensity={dimScene ? 0.5 : 1.0} />

      {/* **NEW: Atmospheric Glow using the Shader** */}
      <mesh scale={1.15}>
        <sphereGeometry args={[2.2, 64, 64]} />
        <atmosphereMaterial
          uColor={new Color("#3088ff")}
          uPower={2.5}
          transparent={true}
        />
      </mesh>

      <group ref={groupRef}>

        {/* Outer Shell */}
        <mesh>
          <sphereGeometry args={[2.2, 64, 64]} />
          <meshStandardMaterial
            map={outerTexture} // The new cellular texture
            color="#c81313ff"
            transparent={true}
            opacity={0.6} // Lowered opacity for a more subtle, glassy look
            depthWrite={false}
            roughness={0.3} // Slightly reduced roughness for more gloss
            metalness={0.2}
          />
        </mesh>

        {/* Inner Core */}
        <mesh ref={coreRef} scale={[1.5, 1.5, 1.5]}>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial
            map={innerTexture}
            emissive="#ff4000"
            emissiveMap={innerTexture}
            emissiveIntensity={dimScene ? 2 : 5}
          />
        </mesh>
      </group>
    </>
  );
});

export default Globe;
