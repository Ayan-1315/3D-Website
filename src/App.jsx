// src/App.jsx
import React, { useState, Suspense, useRef, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { Canvas } from "@react-three/fiber";

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

function AppContent() {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionSeason, setTransitionSeason] = useState(() =>
    pickRandomSeason(null)
  );
  const [pageScene, setPageScene] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const currentSeasonRef = useRef(transitionSeason);

  const handleLinkClick = (path) => (e) => {
    e.preventDefault();
    if (location.pathname === path || isTransitioning) return;

    // Pick a new, different season
    const nextSeason = pickRandomSeason(currentSeasonRef.current);
    currentSeasonRef.current = nextSeason;
    setTransitionSeason(nextSeason);

    // Trigger visual transition
    setIsTransitioning(true);

    // Navigate instantly — no artificial delay
    navigate(path);

    // End transition flag after a tick to allow leaves animation to start
    requestAnimationFrame(() => setIsTransitioning(false));
  };

  const onTransitionComplete = useCallback(() => {
    // just a safeguard if something calls it; state already resets via RAF
    setIsTransitioning(false);
  }, []);

  return (
    <>
      <MouseBrushStroke />

      <div className="ui-container">
        {/* replace existing <nav className="main-nav"> ... </nav> with this block */}
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
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 0C5.372 0 0 5.372 0 12C0 17.659 3.655 22.451 8.647 24C9.284 24.111 9.537 23.722 9.537 23.479C9.537 23.256 9.529 22.405 9.529 21.493C6.012 22.213 5.253 19.967 5.253 19.967C4.694 18.57 3.824 18.2 3.824 18.2C2.716 17.452 3.901 17.469 3.901 17.469C5.101 17.551 5.753 18.736 5.753 18.736C6.812 20.485 8.529 19.992 9.205 19.715C9.314 18.943 9.619 18.411 9.932 18.115C7.266 17.802 4.582 16.757 4.582 12.26C4.582 10.981 5.044 9.919 5.817 9.105C5.698 8.802 5.289 7.54 5.918 5.922C5.918 5.922 6.899 5.618 9.48 7.324C10.407 7.067 11.393 6.938 12.38 6.938C13.367 6.938 14.354 7.067 15.28 7.324C17.863 5.618 18.844 5.922 18.844 5.922C19.473 7.54 19.064 8.802 18.945 9.105C19.718 9.919 20.18 10.981 20.18 12.26C20.18 16.766 17.5 17.801 14.832 18.109C15.242 18.455 15.614 19.125 15.614 20.17C15.614 21.653 15.6 22.862 15.6 23.479C15.6 23.722 15.855 24.111 16.488 24C21.478 22.451 25.133 17.659 25.133 12C25.133 5.372 19.761 0 13.048 0H12Z"
                fill="currentColor"
              />
            </svg>
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Twitter"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18.244 2.25H21.41L14.075 10.007L22 21.75H15.827L10.05 14.075L3.929 21.75H0.76L8.356 13.62L0 2.25H6.31L10.824 8.272L16.29 2.25H18.244ZM16.602 19.85H17.755L5.05 4.09H3.775L16.602 19.85Z"
                fill="currentColor"
              />
            </svg>
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20.447 20.452H16.591V14.737C16.591 13.315 16.564 11.528 14.735 11.528C12.871 11.528 12.593 13.013 12.593 14.632V20.452H8.737V8.125H12.433V9.794H12.484C12.993 8.824 14.363 7.828 16.29 7.828C20.013 7.828 20.655 10.395 20.655 14.021V20.452H20.447Z"
                fill="currentColor"
              />
              <path
                d="M4.796 0.057C2.176 0.057 0.007 2.146 0.007 4.81C0.007 7.47 2.176 9.563 4.796 9.563C7.41 9.563 9.579 7.47 9.579 4.81C9.579 2.146 7.41 0.057 4.796 0.057ZM8.835 20.452H0.916V8.125H8.835V20.452Z"
                fill="currentColor"
              />
            </svg>
          </a>
        </div>

        <Routes>
          <Route path="/" element={<HomePage setScene={setPageScene} />} />
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
          pointerEvents: "none",
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
