import React, { useState, useRef } from "react";
import Globe from "./components/Globe";
import RightMenu from "./components/RightMenu";
import "./App.css";

export default function App() {
  const globeRef = useRef(null);
  const [activePage, setActivePage] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleOpenPage = (page, anchor) => {
    setActivePage(page);
    setIsPanelOpen(true);
    globeRef.current?.focusToward(anchor);
  };

  const handleBack = () => {
    setIsPanelOpen(false);
    setTimeout(() => {
      setActivePage(null);
      globeRef.current?.unfocus();
    }, 400);
  };

  return (
    <main className="app-container">
      <div className="canvas-background">
        <Globe ref={globeRef} />
      </div>

      <RightMenu
        activePage={activePage}
        onOpenPage={handleOpenPage}
        onBack={handleBack}
      />

      <section className={`panel ${isPanelOpen ? "open" : ""}`}>
        <header className="panel-header">
          <h2>{activePage}</h2>
        </header>
        <div className="panel-content">
          {activePage === "About" && <p>Your about page content goes here.</p>}
          {activePage === "Projects" && <p>Your projects will be displayed here.</p>}
          {activePage === "Contact" && <p>Your contact information goes here.</p>}
        </div>
      </section>
    </main>
  );
}