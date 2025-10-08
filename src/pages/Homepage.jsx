import React, { useState, useRef } from "react";
import RightMenu from "../components/RightMenu";
import SamuraiModel from "../components/SamuraiModel";
import MouseTrail from "../components/MouseTrail";
import "./HomePage.css";

export default function Homepage() {
  const [activePage, setActivePage] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const modelRef = useRef();

  const handleOpenPage = (page) => {
    setActivePage(page);
    setIsPanelOpen(true);
    // optional: later use anchor to animate camera toward UI
  };

  const handleBack = () => {
    setIsPanelOpen(false);
    setTimeout(() => setActivePage(null), 300);
  };

  return (
    <main className="app-container homepage">
      <div className="canvas-background">
        {/* SamuraiModel shows a placeholder and will load your model when you add it to /public/models */}
        <SamuraiModel ref={modelRef} src="/models/Samurai.glb" />
      </div>

      <MouseTrail />

      <RightMenu activePage={activePage} onOpenPage={handleOpenPage} onBack={handleBack} />

      <section className={`panel ${isPanelOpen ? "open" : ""}`}>
        <header>
          <h2>{activePage}</h2>
        </header>
        <div className="panel-content">
          {activePage === "About" && <p>About content — write something minimal and poetic: who you are, what you build.</p>}
          {activePage === "Projects" && <p>Projects will be displayed here.</p>}
          {activePage === "Contact" && <p>Contact me at your-email@example.com</p>}
        </div>
      </section>
    </main>
  );
}
