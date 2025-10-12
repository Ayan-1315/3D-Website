// src/App.jsx
import React, { useState, Suspense, useRef, useEffect, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
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
const TRANSITION_FALLBACK_MS = 3000; // safety fallback to avoid stuck transitions

function pickRandomSeason(exclude = null) {
  const candidates = SEASONS.filter((s) => s !== exclude);
  if (candidates.length === 0) return SEASONS[0];
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function AppContent() {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionSeason, setTransitionSeason] = useState(() => pickRandomSeason(null));
  const [nextPath, setNextPath] = useState("/");
  const [pageScene, setPageScene] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const currentSeasonRef = useRef(transitionSeason);
  const fallbackTimerRef = useRef(null);

  // Clear any fallback timer (safe)
  const clearFallback = useCallback(() => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  // Called by LeavesTransition when sweep finishes
  const onTransitionComplete = useCallback(() => {
    // navigate to the intended path
    try {
      navigate(nextPath);
    } catch (e) {
      e
      // swallow navigation errors — but still clear state
    }
    // clear safety fallback and reset transitioning
    clearFallback();
    setIsTransitioning(false);
    // update current season tracker
    currentSeasonRef.current = transitionSeason;
  }, [nextPath, transitionSeason, navigate, clearFallback]);

  // Safety: if the transition doesn't report completion, force reset after a timeout
  useEffect(() => {
    if (isTransitioning) {
      // ensure we have a fallback to avoid a stuck UI
      clearFallback();
      fallbackTimerRef.current = setTimeout(() => {
        // fallback navigation if LeavesTransition didn't call completion
        try {
          navigate(nextPath);
        } catch (e) {e}
        setIsTransitioning(false);
        fallbackTimerRef.current = null;
        // sync current season to the one we tried to use
        currentSeasonRef.current = transitionSeason;
      }, TRANSITION_FALLBACK_MS);
    } else {
      clearFallback();
    }
    return clearFallback;
  }, [isTransitioning, nextPath, transitionSeason, navigate, clearFallback]);

  // click handler — pick random season that is different from the current
  const handleLinkClick = (path) => (e) => {
    e.preventDefault();
    // if already at path or a transition is active, ignore
    if (location.pathname === path || isTransitioning) return;
    setNextPath(path);
    const chosen = pickRandomSeason(currentSeasonRef.current);
    setTransitionSeason(chosen);
    // set transitioning true to start the sweep
    setIsTransitioning(true);
  };

  return (
    <>
      <MouseBrushStroke />

      <div className="ui-container">
        <nav className="main-nav">
          <a href="/" onClick={handleLinkClick("/")}>
            Home
          </a>
          <a href="/about" onClick={handleLinkClick("/about")}>
            About
          </a>
          <a href="/contact" onClick={handleLinkClick("/contact")}>
            Contact
          </a>
        </nav>

        <div className="social-links">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">
            GH
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
            TW
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
            IN
          </a>
        </div>

        <Routes>
          <Route path="/" element={<HomePage setScene={setPageScene} />} />
          <Route path="/about" element={<AboutPage setScene={setPageScene} />} />
          <Route path="/contact" element={<ContactPage setScene={setPageScene} />} />
        </Routes>
      </div>

      <Canvas
        camera={{ position: [0, 0, 10], fov: 55 }}
        style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
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
