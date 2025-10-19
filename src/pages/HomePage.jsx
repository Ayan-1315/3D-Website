import React, { useRef, useEffect, useMemo } from "react";
import DomCollider from "../components/DomCollider";
import "./HomePage.css";

const COLORS = {
  default: "rgba(8,8,8,0.995)",
  spring: "rgba(255, 96, 123, 0.9)",
  fall: "rgba(248, 77, 68, 0.9)",
  autumn: "rgba(255, 178, 110, 0.9)",
};

export default function HomePage({ 
  setScene, 
  season, 
  brushColor, 
  setBrushColor,
  is3DContext = false 
}) {
  
  // --- 1. ALL HOOKS CALLED AT THE TOP ---
  // Refs for both 3D and 2D contexts
  const titleRef = useRef(document.getElementById("home-title"));
  const subtitleRef = useRef(document.getElementById("home-subtitle"));
  const uiTitleRef = useRef(null);
  const uiSubtitleRef = useRef(null);

  // Memo hooks for 2D UI (they will run in both contexts, which is fine)
  const seasonalShadow = useMemo(() => {
    let color;
    switch (season) {
      case "spring": color = "rgba(255, 96, 123, 0.87)"; break;
      case "fall": color = "rgba(248, 77, 68, 0.93)"; break;
      case "autumn": color = "rgba(255, 178, 110, 0.93)"; break;
      default: color = "rgba(0, 0, 0, 0.15)";
    }
    return `3px 3px 6px ${color}`;
  }, [season]);

  const seasonalSlogan = useMemo(() => {
    switch (season) {
      case "spring":
        return { color: "rgba(220, 80, 110, 0.9)", text: (<>With every spring, a new bloom;<br />with every fall, a fond farewell.</>) };
      case "fall":
        return { color: "rgba(200, 60, 50, 0.95)", text: (<>The crimson leaf, a final dance,<br />before the winter's quiet trance.</>) };
      case "autumn":
        return { color: "rgba(210, 130, 60, 0.95)", text: (<>A golden hush, the air is still,<br />as sunlight fades upon the hill.</>) };
      default:
        return { color: "rgba(28, 28, 28, 0.76)", text: (<>A quiet canvas, awaiting a new season.<br />Explore motion, texture, and code.</>) };
    }
  }, [season]);

  // Effect hooks with conditional logic *inside*
  useEffect(() => {
    if (is3DContext) {
      // Logic for 3D context
      titleRef.current = document.getElementById("home-title");
      subtitleRef.current = document.getElementById("home-subtitle");
    } else {
      // Logic for 2D UI context
      setScene(null); 
      titleRef.current = uiTitleRef.current;
      subtitleRef.current = uiSubtitleRef.current;
    }
  }, [is3DContext, setScene]);


  // --- 2. CONDITIONAL RETURN (NOW SAFE) ---
  if (is3DContext) {
    return (
      <>
        <DomCollider elementRef={titleRef} />
        <DomCollider elementRef={subtitleRef} />
      </>
    );
  }

  // --- 3. RETURN 2D UI ---
  return (
    <div className="page-content">
      <div className="paper-overlay" />
      <header className="hero-block">
        <h1 
          id="home-title" 
          ref={uiTitleRef} 
          className="sumi-title" 
          style={{ textShadow: seasonalShadow }}
        >
          Ayan Sen
        </h1>
        
        <h2 
          id="home-subtitle" 
          ref={uiSubtitleRef} 
          className="sumi-sub" 
          style={{ textShadow: seasonalShadow }}
        >
          Software Engineer
        </h2>
        
        <p 
          className="lead"
          style={{ color: seasonalSlogan.color }}
        >
          {seasonalSlogan.text}
        </p>

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