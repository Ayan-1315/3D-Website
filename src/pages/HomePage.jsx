import React, { useRef, useEffect, useMemo } from "react";
import "./HomePage.css";

export default function HomePage({ setScene, season }) {
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);

  // Clear the 3D scene when the homepage mounts
  useEffect(() => {
    setScene(null);
  }, [setScene]);

  // Calculate the seasonal drop shadow color
  const seasonalShadow = useMemo(() => {
    let color;
    switch (season) {
      case "spring":
        color = "rgba(255, 192, 203, 0.7)"; // Light Pink
        break;
      case "fall":
        color = "rgba(255, 105, 97, 0.7)";  // Light Red
        break;
      case "autumn":
        color = "rgba(255, 218, 185, 0.8)";  // Light Yellow/Gold
        break;
      default:
        color = "rgba(0, 0, 0, 0.15)"; // Default shadow
    }
    // MODIFIED: Apply a soft, directional shadow (like from a top-left light)
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
      </header>
    </div>
  );
}