import React, { useState } from "react";
import RightMenu from "../components/RightMenu";
import MouseTrail from "../components/MouseTrail";
import SamuraiScene from "../components/SamuraiScene";
import "./HomePage.css";

/**
 * Homepage - stacking order:
 * 1) top text UI (z: 60)
 * 2) mouse trail canvas (z: 40)
 * 3) samurai image (z: 30)
 * 4) SamuraiScene shader base (z: 20)
 * 5) background red glow & bg (z: 10)
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

  // If your FrontSide.png is in public/textures/FrontSide.png
  const frontPath = "/textures/Samurai.png";

  return (
    <main className="app-container homepage cinematic">
      {/* 5) Background glow */}
      <div className="background-layer" aria-hidden>
        <div className="red-glow" />
      </div>

      {/* 4) SamuraiScene (shader base) */}
      <SamuraiScene />

      {/* 3) Samurai image */}
      <div className="front-container">
        <div className="front-card">
          <img src={frontPath} alt="Samurai Front" className="front breathing" />
          <div className="front-reflection" />
        </div>
      </div>

      {/* 2) Mouse brush trail (canvas appended to body). It will be behind the samurai image. */}
      <MouseTrail />

      {/* 1) Top text overlay (Katakana + small UI text) */}
      <div className="top-text">
        <div className="katakana">サムライ</div>
        <div className="title">AYAN — Quiet Blade</div>
      </div>

      {/* Right menu */}
      <RightMenu activePage={activePage} onOpenPage={handleOpenPage} onBack={handleBack} />

      {/* Panel */}
      <section className={`panel ${isPanelOpen ? "open" : ""}`}>
        <header>
          <h2>{activePage}</h2>
        </header>
        <div className="panel-content">
          {activePage === "About" && <p>About content — write something minimal and poetic.</p>}
          {activePage === "Projects" && <p>Projects will be displayed here.</p>}
          {activePage === "Contact" && <p>Contact me at your-email@example.com</p>}
        </div>
      </section>
    </main>
  );
}
