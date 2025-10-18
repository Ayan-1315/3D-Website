import React, { useRef, useEffect, useMemo } from "react";
import "./HomePage.css";

// Define colors in one place
const COLORS = {
  default: "rgba(8,8,8,0.995)",
  spring: "rgba(255, 96, 123, 0.9)",
  fall: "rgba(248, 77, 68, 0.9)",
  autumn: "rgba(255, 178, 110, 0.9)",
};

export default function HomePage({ setScene, season, brushColor, setBrushColor }) {
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);

  useEffect(() => {
    setScene(null);
  }, [setScene]);

  const seasonalShadow = useMemo(() => {
    let color;
    switch (season) {
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
  }, [season]);

  return (
    <div className="page-content">
      <div className="paper-overlay" />

      <header className="hero-block">
        <h1 
          ref={titleRef} 
          className="sumi-title" 
          style={{ textShadow: seasonalShadow }}
        >
          Ayan Sen
        </h1>
        
        <h2 
          ref={subtitleRef} 
          className="sumi-sub" 
          style={{ textShadow: seasonalShadow }}
        >
          Software Engineer
        </h2>
        
        <p className="lead">
          With every spring, a new bloom;
          <br /> 
          with every fall, a fond farewell.
        </p>

        {/* ADDED: Brush Settings UI */}
        <div className="brush-settings">
          <h3 className="brush-settings-title">Brush Color</h3>
          <div className="color-swatch-container">
            <button
              className={`color-swatch ${brushColor === COLORS.default ? 'active' : ''}`}
              style={{ backgroundColor: COLORS.default }}
              onClick={() => setBrushColor(COLORS.default)}
              aria-label="Set brush color to black"
            />
            <button
              className={`color-swatch ${brushColor === COLORS.spring ? 'active' : ''}`}
              style={{ backgroundColor: COLORS.spring }}
              onClick={() => setBrushColor(COLORS.spring)}
              aria-label="Set brush color to spring pink"
            />
            <button
              className={`color-swatch ${brushColor === COLORS.fall ? 'active' : ''}`}
              style={{ backgroundColor: COLORS.fall }}
              onClick={() => setBrushColor(COLORS.fall)}
              aria-label="Set brush color to fall red"
            />
            <button
              className={`color-swatch ${brushColor === COLORS.autumn ? 'active' : ''}`}
              style={{ backgroundColor: COLORS.autumn }}
              onClick={() => setBrushColor(COLORS.autumn)}
              aria-label="Set brush color to autumn gold"
            />
          </div>
        </div>
        {/* End of Brush Settings */}

      </header>
    </div>
  );
}