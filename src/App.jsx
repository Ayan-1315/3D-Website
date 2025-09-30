import React, { useEffect, useRef, useState } from "react";
import { Canvas } from '@react-three/fiber'; // <-- IMPORT CANVAS
import Globe from "./components/Globe";
import RightMenu from "./components/RightMenu";
import "./App.css";

export default function App() {
  const globeRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(t);
  }, []);

  const handleOpenPage = (page, uiAnchor) => {
    setActivePage(page);
    globeRef.current?.focusToward(uiAnchor);
  };

  const handleBack = () => {
    globeRef.current?.unfocus();
    setActivePage(null);
  };

  return (
    // This main div will hold our layers
    <main className="app-container">
      {loading && (
        <div className="loader">
          <div className="spinner" />
          <p>Loading…</p>
        </div>
      )}

      {/* LAYER 1: The 3D Canvas in the background */}
      <div className="globe-canvas-container">
        <Canvas camera={{ position: [0, 0, 7], fov: 50 }}>
          <Globe ref={globeRef} dimScene={!!activePage} />
        </Canvas>
      </div>

      {/* LAYER 2: The UI on top of the canvas */}
      <RightMenu
        activePage={activePage}
        onOpenPage={handleOpenPage}
        onBack={handleBack}
      />

      <section className={`panel ${activePage ? "open" : ""}`}>
        <header className="panel-header">
          <h2>{activePage ?? ""}</h2>
          {activePage && (
            <button className="back-btn" onClick={handleBack}>Back</button>
          )}
        </header>
        <div className="panel-content">
          {activePage === "About" && <p>Short bio goes here.</p>}
          {activePage === "Projects" && <p>Project grid coming next.</p>}
          {activePage === "Contact" && <p>Drop your contact bits here.</p>}
        </div>
      </section>
    </main>
  );
}