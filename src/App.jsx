import React, { useState, Suspense, useRef, useCallback, useMemo } from "react";
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
import MouseBrushStroke from "./components/MouseBrushStroke.jsx";
import Loader from "./components/Loader.jsx";
import "./App.css";

const SEASONS = ["spring", "autumn", "fall"];
const pickRandomSeason = (exclude = null) => {
  const options = SEASONS.filter((s) => s !== exclude);
  return options[Math.floor(Math.random() * options.length)];
};

const PHYSICS_ITERATIONS = 2;

const COLORS = {
  default: "rgba(8,8,8,0.995)",
  spring: "rgba(255, 96, 123, 0.9)",
  fall: "rgba(248, 77, 68, 0.9)",
  autumn: "rgba(255, 178, 110, 0.9)",
};

function AppContent() {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionSeason, setTransitionSeason] = useState(() =>
    pickRandomSeason(null)
  );
  const [pageScene, setPageScene] = useState(null);
  const [brushColor, setBrushColor] = useState(COLORS.default);

  const [selectedProject, setSelectedProject] = useState(null);
  const isModalOpen = !!selectedProject;

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

  const seasonalShadow = useMemo(() => {
    let color;
    switch (transitionSeason) {
      case "spring":
        color = "rgba(255, 96, 123, 0.87)";
        break;
      case "fall":
        color = "rgba(248, 77, 68, 0.93)";
        break;
      case "autumn":
        color = "rgba(255, 178, 110, 0.93)";
        break;
      default:
        color = "rgba(0, 0, 0, 0.15)";
    }
    return `3px 3px 6px ${color}`;
  }, [transitionSeason]);

  const seasonalSlogan = useMemo(() => {
    switch (transitionSeason) {
      case "spring":
        return {
          color: "rgba(220, 80, 110, 0.9)",
          text: (
            <>
              With every spring, a new bloom;
              <br />
              with every fall, a fond farewell.
            </>
          ),
        };
      case "fall":
        return {
          color: "rgba(200, 60, 50, 0.95)",
          text: (
            <>
              The crimson leaf, a final dance,
              <br />
              before the winter's quiet trance.
            </>
          ),
        };
      case "autumn":
        return {
          color: "rgba(210, 130, 60, 0.95)",
          text: (
            <>
              A golden hush, the air is still,
              <br />
              as sunlight fades upon the hill.
            </>
          ),
        };
      default:
        return {
          color: "rgba(28, 28, 28, 0.76)",
          text: (
            <>
              A quiet canvas, awaiting a new season.
              <br />
              Explore motion, texture, and code.
            </>
          ),
        };
    }
  }, [transitionSeason]);

  return (
    <>
      <MouseBrushStroke brushColor={brushColor} />

      <div
        className="ui-container"
        style={{ position: "relative", zIndex: 10 }}
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
            href="https://github.com/Ayan-1315"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
          >
            <FontAwesomeIcon icon={faGithub} size="lg" />
          </a>
          <a
            href="https://x.com/Ayansen1315"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Twitter"
          >
            <FontAwesomeIcon icon={faXTwitter} size="lg" />
          </a>
          <a
            href="https://www.linkedin.com/in/ayan-sen-1315abc"
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
                seasonalShadow={seasonalShadow}
                seasonalSlogan={seasonalSlogan}
              />
            }
          />
          <Route
            path="/about"
            element={
              <AboutPage
                setScene={setPageScene}
                seasonalShadow={seasonalShadow}
                handleLinkClick={handleLinkClick}
              />
            }
          />
          <Route
            path="/projects"
            element={
              <ProjectsPage
                setScene={setPageScene}
                seasonalShadow={seasonalShadow}
                selectedProject={selectedProject}
                setSelectedProject={setSelectedProject}
              />
            }
          />
          <Route
            path="/contact"
            element={
              <ContactPage
                setScene={setPageScene}
                seasonalShadow={seasonalShadow}
              />
            }
          />
        </Routes>
      </div>

      {/* Overlay loader lives in normal React tree */}
      <Loader />

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
        <Physics gravity={[0, -3.2, 0]} iterations={2}>
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
                    seasonalShadow={seasonalShadow}
                    seasonalSlogan={seasonalSlogan}
                  />
                }
              />
            </Routes>
            <LeavesTransition
              isTransitioning={isTransitioning}
              onTransitionComplete={onTransitionComplete}
              season={transitionSeason}
              isSlowMo={isModalOpen}
            />
          </Suspense>
        </Physics>
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
