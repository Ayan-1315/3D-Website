import React, { useRef, useEffect } from "react";
import styles from "./HomePage.module.css";
import DomCollider from "../components/DomCollider";

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
  seasonalShadow,
}) {
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const uiTitleRef = useRef(null);
  const uiSubtitleRef = useRef(null);

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
    <div className={styles.homePageContent}>
      <div className={styles.paperOverlay} />
      <header className={styles.heroBlock}>
        <h1 id="home-title" ref={uiTitleRef} className={styles.sumiTitle} style={{ textShadow: seasonalShadow }}>
          Ayan Sen
        </h1>

        <h2 id="home-subtitle" ref={uiSubtitleRef} className={styles.sumiSub} style={{ textShadow: seasonalShadow }}>
          Software Engineer
        </h2>

        <p className={styles.homeDescription}>
          I build immersive, interactive systems that blend logic and imagination,
          turning complex ideas into living digital experiences.
        </p>

        <a
          href="/AyanSen_Resume.pdf" // Ensure your resume is in the /public folder
          download="AyanSen_Resume.pdf"
          className={styles.resumeButton}
        >
          <span className={styles.buttonText}>Download Resume</span>
        </a>

        {/* The "homeLead" (poetry) <p> tag has been removed.
        */}

      </header>

      {/* --- BRUSH SETTINGS MOVED HERE --- */}
      <div className={styles.brushSettings}>
        <h3 className={styles.brushTitle}>Brush Color</h3>
        <div className={styles.colorSwatchContainer}>
          <button
            className={`${styles.colorSwatch} ${brushColor === COLORS.default ? styles.colorSwatchActive : ""}`}
            style={{ backgroundColor: COLORS.default }}
            onClick={() => setBrushColor(COLORS.default)}
            aria-label="Set brush color to black"
          />
          <button
            className={`${styles.colorSwatch} ${brushColor === COLORS.spring ? styles.colorSwatchActive : ""}`}
            style={{ backgroundColor: COLORS.spring }}
            onClick={() => setBrushColor(COLORS.spring)}
            aria-label="Set brush color to spring pink"
          />
          <button
            className={`${styles.colorSwatch} ${brushColor === COLORS.fall ? styles.colorSwatchActive : ""}`}
            style={{ backgroundColor: COLORS.fall }}
            onClick={() => setBrushColor(COLORS.fall)}
            aria-label="Set brush color to fall red"
          />
          <button
            className={`${styles.colorSwatch} ${brushColor === COLORS.autumn ? styles.colorSwatchActive : ""}`}
            style={{ backgroundColor: COLORS.autumn }}
            onClick={() => setBrushColor(COLORS.autumn)}
            aria-label="Set brush color to autumn gold"
          />
        </div>
      </div>
      {/* --- END OF BRUSH SETTINGS --- */}

    </div>
  );
}