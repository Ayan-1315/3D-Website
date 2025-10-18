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

  // This memo calculates the text-shadow color
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

  // ADDED: This memo calculates the slogan text and color
  const seasonalSlogan = useMemo(() => {
    switch (season) {
      case "spring":
        return {
          color: "rgba(220, 80, 110, 0.9)", // Darker pink for readability
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
          color: "rgba(200, 60, 50, 0.95)", // Darker red
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
          color: "rgba(210, 130, 60, 0.95)", // Darker gold
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
          color: "rgba(28, 28, 28, 0.76)", // Default lead color
          text: (
            <>
              A quiet canvas, awaiting a new season.
              <br />
              Explore motion, texture, and code.
            </>
          ),
        };
    }
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
        
        {/* MODIFIED: Slogan is now dynamic */}
        <p 
          className="lead"
          style={{ color: seasonalSlogan.color }}
        >
          {seasonalSlogan.text}
        </p>

        {/* Brush Settings UI */}
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

      </header>
    </div>
  );
}