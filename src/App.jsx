import React, { useRef, useState, useEffect } from "react";
import Globe from "./components/Globe";
import RightMenu from "./components/RightMenu";
import "./App.css";

export default function App() {
  const globeRef = useRef();
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState(null);

  // loader fade (artistic orb spinner)
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 2500);
    return () => clearTimeout(t);
  }, []);

  const handleOpenPage = (page, anchor) => {
    setActivePage(page);
    globeRef.current?.focusToward?.(anchor);
  };

  const handleBack = () => {
    setActivePage(null);
    globeRef.current?.unfocus?.();
  };

  return (
    <div className="App">
      {loading && (
        <div className="loader-overlay">
          <div className="loader-orb">
            <div className="loader-cutout" />
          </div>
          <p className="loader-label">Loading</p>
        </div>
      )}

      {/* Globe */}
      <Globe ref={globeRef} />

      {/* Right-side Menu */}
      <RightMenu
        activePage={activePage}
        onOpenPage={handleOpenPage}
        onBack={handleBack}
      />

      {/* Optional content area (shows when activePage selected) */}
      {activePage && (
        <div className="page-overlay">
          <div className="page-content">
            <h1>{activePage}</h1>
            <p>
              This is the <strong>{activePage}</strong> section. Replace with
              your actual content.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
