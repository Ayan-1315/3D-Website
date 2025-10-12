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
import LeavesTransition from "./components/LeavesTransition.jsx";
import FPSMonitor from "./components/FPSMonitor.jsx";
import MouseBrushStroke from "./components/MouseBrushStroke.jsx";
import "./App.css";

function AppContent() {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionSeason, setTransitionSeason] = useState("spring");
  const [nextPath, setNextPath] = useState("/");
  const navigate = useNavigate();
  const [pageScene, setPageScene] = useState(null);

  const handleLinkClick = (path, season) => (e) => {
    e.preventDefault();
    if (isTransitioning) return;
    setNextPath(path);
    setTransitionSeason(season);
    setIsTransitioning(true);
  };

  const onTransitionComplete = () => {
    navigate(nextPath);
    setIsTransitioning(false);
  };

  return (
    <>
      <MouseBrushStroke />

      <div className="ui-container">
        <nav className="main-nav">
          <a href="/" onClick={handleLinkClick("/", "spring")}>
            Home
          </a>
          <a href="/about" onClick={handleLinkClick("/about", "fall")}>
            About
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
          <Route
            path="/about"
            element={<AboutPage setScene={setPageScene} />}
          />
        </Routes>
      </div>

      <Canvas
        camera={{ position: [0, 0, 10], fov: 55 }}
        style={{
          position: "fixed",
          inset: 0, // fills viewport
          zIndex: 0, // behind UI container
          pointerEvents: "none", // don't block clicks
        }}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[0, 0, 5]} intensity={1} />
        <Suspense fallback={null}>
          {pageScene}
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
