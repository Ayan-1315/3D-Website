import React, { useRef, useEffect } from "react";
import DomCollider from "../components/DomCollider";
import "./HomePage.css"; // Ensure this import points to the correct CSS file

// Keep COLORS defined here if used only by HomePage
const COLORS = {
  default: "rgba(8,8,8,0.995)",
  spring: "rgba(255, 96, 123, 0.9)",
  fall: "rgba(248, 77, 68, 0.9)",
  autumn: "rgba(255, 178, 110, 0.9)",
};

export default function HomePage({
  setScene,
  brushColor,
  setBrushColor,
  is3DContext = false,
  seasonalShadow, // <-- Accept prop
  seasonalSlogan, // <-- Accept prop
}) {
  const titleRef = useRef(document.getElementById("home-title"));
  const subtitleRef = useRef(document.getElementById("home-subtitle"));
  const uiTitleRef = useRef(null);
  const uiSubtitleRef = useRef(null);

  // Removed useMemo for seasonalShadow (now passed as prop)
  // Removed useMemo for seasonalSlogan (now passed as prop)

  useEffect(() => {
    if (is3DContext) {
      titleRef.current = document.getElementById("home-title");
      subtitleRef.current = document.getElementById("home-subtitle");
    } else {
      setScene(null);
      titleRef.current = uiTitleRef.current;
      subtitleRef.current = uiSubtitleRef.current;
    }
  }, [is3DContext, setScene]);

  if (is3DContext) {
    return (
      <>
        <DomCollider elementRef={titleRef} />
        <DomCollider elementRef={subtitleRef} />
      </>
    );
  }

  return (
    <div className="home-page-content">
      <div className="paper-overlay" />
      <header className="hero-block">
        <h1
          id="home-title"
          ref={uiTitleRef}
          className="sumi-title"
          style={{ textShadow: seasonalShadow }} // <-- Apply prop
        >
          Ayan Sen
        </h1>

        <h2
          id="home-subtitle"
          ref={uiSubtitleRef}
          className="sumi-sub"
          style={{ textShadow: seasonalShadow }} // <-- Apply prop
        >
          Software Engineer
        </h2>

        <p
          className="home-lead"
          style={{ color: seasonalSlogan.color }} // <-- Apply prop
        >
          {seasonalSlogan.text}
        </p>

        <div className="brush-settings">
          <h3 className="brush-settings-title">Brush Color</h3>
          <div className="color-swatch-container">
            {/* ... color swatches */}
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