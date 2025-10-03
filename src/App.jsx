import React, { useState, useRef } from "react";
import Globe from "./components/Globe";
import RightMenu from "./components/RightMenu";
import FPSMonitor from "./components/FPSMonitor";
import "./App.css";

export default function App() {
  const globeRef = useRef(null);
  const [activePage, setActivePage] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleOpenPage = (page, anchor) => {
    setActivePage(page);
    setIsPanelOpen(true);
    // Call the focus function on the Globe component
    globeRef.current?.focusToward(anchor);
  };

  const handleBack = () => {
    setIsPanelOpen(false);
    // A slight delay to allow the panel to close before resetting state
    setTimeout(() => {
      setActivePage(null);
      // Call the unfocus function on the Globe component
      globeRef.current?.unfocus();
    }, 400); // This duration should match the CSS transition
  };

  return (
    <main className="app-container">
      <div className="canvas-background">
        <Globe ref={globeRef} />
        <FPSMonitor />
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