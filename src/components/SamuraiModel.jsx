import React, { forwardRef, Suspense, useEffect, useState } from "react";

/**
 * SamuraiModel.jsx — safer version
 * - Uses (props, ref) signature to avoid React forwardRef warnings
 * - Dynamically imports r3f/drei
 * - Verifies the model URL by fetching headers before rendering to avoid GLTFLoader HTML/404 errors
 * - Falls back to an SVG placeholder if anything goes wrong
 *
 * Usage: <SamuraiModel src="/models/Samurai.glb" />
 */

const SamuraiModel = forwardRef((props) => {
  const { src } = props;
  const [mods, setMods] = useState(null);
  const [tried, setTried] = useState(false);
  const [modelOk, setModelOk] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const fiber = await import("@react-three/fiber");
        const drei = await import("@react-three/drei");
        if (!mounted) return;
        setMods({
          Canvas: fiber.Canvas,
          useGLTF: drei.useGLTF,
          OrbitControls: drei.OrbitControls,
        });
      } catch (err) {
        // dynamic import failed (packages not installed)
        err
        if (!mounted) return;
        setMods(null);
      } finally {
        if (mounted) setTried(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // verify src exists and is not HTML (helps avoid the "Unexpected token '<'" GLTFLoader error)
  useEffect(() => {
    let cancelled = false;
    if (!src) {
      setModelOk(false);
      return;
    }
    (async () => {
      try {
        // Use HEAD where possible; some dev servers ignore HEAD so fallback to GET with range
        const headResp = await fetch(src, { method: "HEAD" });
        if (headResp.ok) {
          const ct = headResp.headers.get("content-type") || "";
          const ok = ct.includes("model") || ct.includes("application/octet-stream") || ct.includes("application/gltf+json") || ct.includes("model/gltf-binary");
          if (!cancelled) setModelOk(ok);
          if (!ok) {
            console.warn(`[SamuraiModel] model content-type looks unexpected: ${ct}. The server may be returning HTML (404).`);
          }
          return;
        }
      
      } catch (e) {
        // HEAD might be blocked; try a short GET but request small range if supported
        e
      }

      // fallback GET (small) to check. Some static hosts return an HTML 200 page for missing assets.
      try {
        const resp = await fetch(src, { method: "GET" });
        if (!resp.ok) {
          if (!cancelled) setModelOk(false);
          console.warn(`[SamuraiModel] could not fetch ${src}: ${resp.status} ${resp.statusText}`);
          return;
        }
        const ct = resp.headers.get("content-type") || "";
        const ok = ct.includes("model") || ct.includes("application/octet-stream") || ct.includes("application/gltf+json") || ct.includes("model/gltf-binary");
        if (!cancelled) setModelOk(ok);
        if (!ok) {
          // try peek into the first few bytes to see if it's HTML
          const text = await resp.text();
          const snippet = text.slice(0, 200);
          console.warn(`[SamuraiModel] fetched ${src} but content-type=${ct}. First bytes:`, snippet);
        }
      } catch (err) {
        if (!cancelled) setModelOk(false);
        console.warn(`[SamuraiModel] error fetching ${src}:`, err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [src]);

  // While imports or checks are pending, show placeholder (avoids flicker)
  if (!src || (!mods && !tried) || (mods && !modelOk && !tried)) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        <svg width="300" height="300" viewBox="0 0 200 200" aria-hidden>
          <rect width="200" height="200" fill="#fbf8f3" />
          <g transform="translate(20,24)">
            <text x="0" y="40" style={{ fontFamily: "serif", fontSize: 22, fill: "#222" }}>
              Samurai model
            </text>
            <text x="0" y="80" style={{ fontFamily: "sans-serif", fontSize: 12, fill: "#666" }}>
              place your GLB at /public/models/Samurai.glb
            </text>
            <text x="0" y="108" style={{ fontFamily: "sans-serif", fontSize: 11, fill: "#666" }}>
              (loading libraries / checking file...)
            </text>
          </g>
        </svg>
      </div>
    );
  }

  // If imports definitively failed or model check failed, show final helpful placeholder
  if (!mods || !modelOk) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        <svg width="320" height="200" viewBox="0 0 320 200" aria-hidden>
          <rect width="320" height="200" fill="#fbf8f3" />
          <g transform="translate(20,24)">
            <text x="0" y="32" style={{ fontFamily: "serif", fontSize: 20, fill: "#222" }}>
              Samurai model not loaded
            </text>
            <text x="0" y="64" style={{ fontFamily: "sans-serif", fontSize: 12, fill: "#666" }}>
              Make sure:
            </text>
            <text x="0" y="84" style={{ fontFamily: "sans-serif", fontSize: 12, fill: "#666" }}>
              • /public/models/Samurai.glb exists
            </text>
            <text x="0" y="104" style={{ fontFamily: "sans-serif", fontSize: 12, fill: "#666" }}>
              • content-type is correct (not an HTML 404)
            </text>
            <text x="0" y="124" style={{ fontFamily: "sans-serif", fontSize: 12, fill: "#666" }}>
              • Install @react-three/fiber @react-three/drei for 3D rendering
            </text>
          </g>
        </svg>
      </div>
    );
  }

  // r3f + drei available and model check passed -> render 3D canvas
  const { Canvas, useGLTF, OrbitControls } = mods;

  function FittedModel({ url }) {
    const { scene } = useGLTF(url);
    return <primitive object={scene} dispose={null} />;
  }

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}>
      <Canvas camera={{ position: [0, 1.6, 6], fov: 50 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[6, 8, 10]} intensity={0.6} />
        <Suspense fallback={null}>
          <FittedModel url={src} />
        </Suspense>
        <OrbitControls enabled={false} />
      </Canvas>
    </div>
  );
});

export default SamuraiModel;
