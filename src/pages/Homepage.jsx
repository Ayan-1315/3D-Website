import React, { useState } from "react";
import RightMenu from "../components/RightMenu";
import MouseTrail from "../components/MouseTrail";
import "./HomePage.css";

/**
 * Homepage — minimal cinematic version
 * Only uses FrontSide.png as the main visual.
 * Keeps RightMenu, MouseTrail, and panel system.
 */

export default function Homepage() {
  const [activePage, setActivePage] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleOpenPage = (page) => {
    setActivePage(page);
    setIsPanelOpen(true);
  };

  const handleBack = () => {
    setIsPanelOpen(false);
    setTimeout(() => setActivePage(null), 300);
  };

  return (
    <main className="app-container homepage cinematic">
      {/* Background layer */}
      <div className="canvas-background" aria-hidden>
        <div className="red-glow" />
      </div>

      {/* Mouse brush trail */}
      <MouseTrail />

      {/* Main image */}
      <div className="front-container">
        <div className="front-card">
          <img
            src="/textures/Samurai.png"
            alt="Samurai Front"
            className="front breathing"
          />
          <div className="front-reflection" />
        </div>
      </div>

      {/* Right menu */}
      <RightMenu
        activePage={activePage}
        onOpenPage={handleOpenPage}
        onBack={handleBack}
      />

      {/* Panel */}
      <section className={`panel ${isPanelOpen ? "open" : ""}`}>
        <header>
          <h2>{activePage}</h2>
        </header>
        <div className="panel-content">
          {activePage === "About" && (
            <p>
              About content — write something minimal and poetic: who you are,
              what you build.
            </p>
          )}
          {activePage === "Projects" && <p>Projects will be displayed here.</p>}
          {activePage === "Contact" && (
            <p>Contact me at your-email@example.com</p>
          )}
        </div>
      </section>
    </main>
  );
}
