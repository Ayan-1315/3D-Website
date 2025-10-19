import React, { useState, Suspense, useRef, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGithub,
  faXTwitter,
  faLinkedinIn,
} from "@fortawesome/free-brands-svg-icons";

import HomePage from "./pages/HomePage.jsx";
import ProjectsPage from "./pages/ProjectsPage.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import LeavesTransition from "./components/LeavesTransition.jsx";
import FPSMonitor from "./components/FPSMonitor.jsx";
import MouseBrushStroke from "./components/MouseBrushStroke.jsx";
import "./App.css";

const SEASONS = ["spring", "autumn", "fall"];
const pickRandomSeason = (exclude = null) => {
  const options = SEASONS.filter((s) => s !== exclude);
  return options[Math.floor(Math.random() * options.length)];
};

const PHYSICS_ITERATIONS = 2;

function AppContent() {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionSeason, setTransitionSeason] = useState(() =>
    pickRandomSeason(null)
  );
  const [pageScene, setPageScene] = useState(null);
  const [brushColor, setBrushColor] = useState("rgba(8,8,8,0.995)");

  const navigate = useNavigate();
  const location = useLocation();
  const currentSeasonRef = useRef(transitionSeason);

  const handleLinkClick = (path) => (e) => {
    e.preventDefault();
    if (location.pathname === path || isTransitioning) return;

    const nextSeason = pickRandomSeason(currentSeasonRef.current);
    currentSeasonRef.current = nextSeason;
    setTransitionSeason(nextSeason);
    setIsTransitioning(true);
    navigate(path);
    requestAnimationFrame(() => setIsTransitioning(false));
  };

  const onTransitionComplete = useCallback(() => {
    setIsTransitioning(false);
  }, []);

  return (
    <>
      <MouseBrushStroke brushColor={brushColor} />

      {/* MODIFIED: Removed inline style for pointerEvents */}
      <div 
        className="ui-container" 
        style={{ 
          position: 'relative', 
          zIndex: 10
        }}
      >
        <nav className="bottom-nav" role="navigation" aria-label="Primary">
          <div className="nav-inner">
            <a
              className={`nav-item${
                location.pathname === "/" ? " active" : ""
              }`}
              href="/"
              onClick={handleLinkClick("/")}
            >
              <span className="nav-dot" aria-hidden="true" />
              <span className="nav-label">Home</span>
            </a>
            <a
              className={`nav-item${
                location.pathname === "/projects" ? " active" : ""
              }`}
              href="/projects"
              onClick={handleLinkClick("/projects")}
            >
              <span className="nav-dot" aria-hidden="true" />
              <span className="nav-label">Projects</span>
            </a>
            <a
              className={`nav-item${
                location.pathname === "/about" ? " active" : ""
              }`}
              href="/about"
              onClick={handleLinkClick("/about")}
            >
              <span className="nav-dot" aria-hidden="true" />
              <span className="nav-label">About</span>
            </a>
            <a
              className={`nav-item${
                location.pathname === "/contact" ? " active" : ""
              }`}
              href="/contact"
              onClick={handleLinkClick("/contact")}
            >
              <span className="nav-dot" aria-hidden="true" />
              <span className="nav-label">Contact</span>
            </a>
          </div>
        </nav>

        <div className="social-links">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
          >
            <FontAwesomeIcon icon={faGithub} size="lg" />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Twitter"
          >
            <FontAwesomeIcon icon={faXTwitter} size="lg" />
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
          >
            <FontAwesomeIcon icon={faLinkedinIn} size="lg" />
          </a>
        </div>

        <Routes>
          <Route 
            path="/" 
            element={
              <HomePage 
                setScene={setPageScene} 
                season={transitionSeason} 
                brushColor={brushColor}
                setBrushColor={setBrushColor}
              />
            } 
          />
          <Route
            path="/about"
            element={<AboutPage setScene={setPageScene} />}
          />
          <Route
            path="/projects"
            element={<ProjectsPage setScene={setPageScene} />}
          />
          <Route
            path="/contact"
            element={<ContactPage setScene={setPageScene} />}
          />
        </Routes>
      </div>

      <Canvas
        camera={{ position: [0, 0, 10], fov: 55 }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0, 
          pointerEvents: "auto", 
        }}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[0, 0, 5]} intensity={1} />
        
        <Physics gravity={[0, -3.2, 0]} iterations={PHYSICS_ITERATIONS}>
          <Suspense fallback={null}>
            {pageScene}
            
            <Routes>
              <Route 
                path="/" 
                element={
                  <HomePage 
                    setScene={setPageScene} 
                    season={transitionSeason} 
                    brushColor={brushColor}
                    setBrushColor={setBrushColor}
                    is3DContext={true}
                  />
                } 
              />
            </Routes>
            
            <LeavesTransition
              isTransitioning={isTransitioning}
              onTransitionComplete={onTransitionComplete}
              season={transitionSeason}
            />
          </Suspense>
        </Physics>
        
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