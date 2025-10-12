// src/App.jsx
import React, { useState, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import { Canvas } from "@react-three/fiber";

import HomePage from "./pages/HomePage.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import LeavesTransition from "./components/LeavesTransition.jsx";
import FPSMonitor from "./components/FPSMonitor.jsx";
import MouseBrushStroke from "./components/MouseBrushStroke.jsx";
import "./App.css";

const SEASONS = ["spring", "autumn", "fall"];

function pickRandomSeason() {
  return SEASONS[Math.floor(Math.random() * SEASONS.length)];
}

function AppContent() {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionSeason, setTransitionSeason] = useState("spring");
  const [nextPath, setNextPath] = useState("/");
  const navigate = useNavigate();
  const [pageScene, setPageScene] = useState(null);

  // click handler for nav links
  // if `season` argument is provided we use it; otherwise we randomize
  const handleLinkClick = (path, season = null) => (e) => {
    e.preventDefault();
    if (isTransitioning) return;
    setNextPath(path);
    setTransitionSeason(season || pickRandomSeason());
    setIsTransitioning(true);
  };

  // called by LeavesTransition when sweep finishes
  const onTransitionComplete = () => {
    // navigate after the sweep finished
    navigate(nextPath);
    // allow a short tick for the new route to mount before clearing transition
    requestAnimationFrame(() => {
      setIsTransitioning(false);
    });
  };

  return (
    <>
      {/* Top-level brush (appends a canvas to document.body) */}
      <MouseBrushStroke />

      {/* UI sits above the Three canvas */}
      <div className="ui-container">
        <nav className="main-nav">
          <a href="/" onClick={handleLinkClick("/", "spring")}>
            Home
          </a>
          <a href="/about" onClick={handleLinkClick("/about", "fall")}>
            About
          </a>
          <a href="/contact" onClick={handleLinkClick("/contact")}>
            Contact
          </a>
        </nav>

        <div className="social-links">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            GH
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            TW
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            IN
          </a>
        </div>

        <Routes>
          <Route path="/" element={<HomePage setScene={setPageScene} />} />
          <Route path="/about" element={<AboutPage setScene={setPageScene} />} />
          <Route path="/contact" element={<ContactPage setScene={setPageScene} />} />
        </Routes>
      </div>

      {/* Three.js canvas (fills viewport; behind UI; pointerEvents none so it doesn't block clicks) */}
      <Canvas
        camera={{ position: [0, 0, 10], fov: 55 }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[0, 0, 5]} intensity={1} />
        <Suspense fallback={null}>
          {/* mount per-page scene (set by pages via setScene) */}
          {pageScene}
          {/* LeavesTransition handles both continuous background and one-shot sweeps */}
          <LeavesTransition
            isTransitioning={isTransitioning}
            onTransitionComplete={onTransitionComplete}
            season={transitionSeason}
          />
        </Suspense>
        <FPSMonitor />
      </Canvas>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
