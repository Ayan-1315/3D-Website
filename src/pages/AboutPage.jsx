import React, { useEffect, useRef } from "react";
import styles from "./AboutPage.module.css";

// Helper function for smooth interpolation (ease-out cubic)
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

export default function AboutPage({ setScene, seasonalShadow }) {
  const scrollRef = useRef(null);
  // MODIFIED: Remove opacity from cache
  const transformCache = useRef({}); 

  useEffect(() => {
    setScene(null);
    const scrollableDiv = scrollRef.current;
    if (!scrollableDiv) return;

    let rafId = null; 

    const handleScroll = () => {
      if (rafId) { cancelAnimationFrame(rafId); }

      rafId = requestAnimationFrame(() => {
        // eslint-disable-next-line no-unused-vars
        const scrollTop = scrollableDiv.scrollTop;
        const clientHeight = scrollableDiv.clientHeight;
        if (clientHeight === 0) return; 

        const viewportCenterY = clientHeight / 2;
        const maxAngle = 20; 
        const maxTranslateZ = -50; 
        const minScale = 0.95; 

        const textBlocks = scrollableDiv.querySelectorAll(
          `.${styles.aboutContent} > p, .${styles.aboutContent} > ul, .${styles.aboutFooter}`
        );

        textBlocks.forEach((el, index) => {
          const cacheKey = `el-${index}`; 
          if (!transformCache.current[cacheKey]) {
              // MODIFIED: Initialize cache without opacity
              transformCache.current[cacheKey] = { angle: 0, tz: 0, scale: 1 }; 
          }
          const prevTransform = transformCache.current[cacheKey];

          const rect = el.getBoundingClientRect();
          const parentRect = scrollableDiv.getBoundingClientRect();
          const elCenterLocal = rect.top - parentRect.top + rect.height / 2;

          let dist = (elCenterLocal - viewportCenterY) / (clientHeight / 1.8); 
          dist = Math.max(-1, Math.min(1, dist)); 

          // --- Calculate Target Values ---
          const easedDist = Math.sign(dist) * easeOutCubic(Math.abs(dist)); 
          
          const targetAngle = easedDist * maxAngle;
          const targetTz = Math.abs(easedDist) * maxTranslateZ; 
          // REMOVED: targetOpacity calculation
          // const targetOpacity = Math.max(0.3, 1 - Math.abs(easedDist) * 0.7); 
          const targetScale = 1 - Math.abs(easedDist) * (1 - minScale); 

          // --- Smooth Interpolation (Lerp) ---
          const lerpFactor = 0.15; 
          const currentAngle = prevTransform.angle + (targetAngle - prevTransform.angle) * lerpFactor;
          const currentTz = prevTransform.tz + (targetTz - prevTransform.tz) * lerpFactor;
          // REMOVED: currentOpacity interpolation
          // const currentOpacity = prevTransform.opacity + (targetOpacity - prevTransform.opacity) * lerpFactor;
          const currentScale = prevTransform.scale + (targetScale - prevTransform.scale) * lerpFactor; 

          // Apply the interpolated transform styles
          el.style.transform = `rotateX(${currentAngle.toFixed(2)}deg) translateZ(${currentTz.toFixed(2)}px) scale(${currentScale.toFixed(3)})`; 
          // REMOVED: Opacity style application
          // el.style.opacity = currentOpacity.toFixed(2);
          // ADDED: Ensure opacity is always 1 (or remove this line if elements are naturally opaque)
          el.style.opacity = 1; 
          el.style.transformOrigin = "center center";
          el.style.backfaceVisibility = "hidden";

           // Store current interpolated values for the next frame
           transformCache.current[cacheKey] = { 
               angle: currentAngle, 
               tz: currentTz, 
               // REMOVED: opacity from cache
               scale: currentScale 
            };
        });
      }); // End requestAnimationFrame
    }; // End handleScroll

    scrollableDiv.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => { // Cleanup
       if (rafId) { cancelAnimationFrame(rafId); }
      if (scrollableDiv) { scrollableDiv.removeEventListener("scroll", handleScroll); }
    };

  }, [setScene]); 

  return (
    // ... (Your existing JSX structure remains the same) ...
     <div className={styles.aboutPage} role="main" aria-label="About page">
      <div className={styles.paperOverlay} />
      <div className={styles.contentInner}>
        <header className={styles.heroBlock}>
           <h1 className={styles.sumiTitle} style={{ textShadow: seasonalShadow }}> 
            About
          </h1>
          <p className={styles.lead}>
            I’m Ayan — a developer, dreamer, and explorer of ideas. I design interactive systems that blend logic and imagination,
            where code feels alive and curiosity never stops moving.
          </p>
        </header>

        <div ref={scrollRef} className={styles.scrollableContent}> 
          <section className={styles.aboutContent} aria-labelledby="about-heading">
            <h1 id="about-heading" className="visually-hidden">About Me</h1>
              <p><br />
              <strong>Education:</strong> B.Tech in Computer Science and Engineering.
            </p>
             <p>
              <strong>Core skills:</strong> HTML, CSS, JavaScript, React, Node, WebSockets / Socket.io,
              Three.js (react-three-fiber), Rapier physics, MongoDB, Python, AI / ML (BERT, LLMs),
              and Unity for small game experiments.
            </p>
            <p>
              <strong>Personal focus:</strong> Real-time systems, generative visuals, immersive web experiences,
              and building tools that make people feel connected to technology — not ruled by it.
            </p>
             <p>
              <strong>Curiosity:</strong> I have a wide range of interests beyond code — space science, technology, biology,
              and history. I learn something new every day; that’s my daily fuel.
            </p>
            <p>
              <strong>Dream:</strong> My ultimate goal is to become a NASA scientist. Space feels far now, and resources are limited,
              but every small experiment and late-night project is a step toward that horizon.
            </p>
             <p>
              <strong>When not building:</strong> I live in stories — I play narrative games and imagine myself in other characters and worlds.
              That creative escape keeps my perspective fresh and makes the work matters I build feel more honest.
            </p>
            <p>
              <strong>Selected projects:</strong>
            </p>
            <ul className={styles.projectList}>
              <li>3D Personal Site</li>
              <li>Snuger</li>
              <li>WebSocket / Ticketing Agent</li>
              <li>Unity Prototypes</li>
            </ul>
             <p>
              <strong>Where I share code:</strong>{" "}
              <a href="https://github.com/Ayan-1315" target="_blank" rel="noreferrer">
                github.com/Ayan-115
              </a>
            </p>
            <p>
              <strong>Contact:</strong> Use the contact link in the site footer to reach out — collaboration, questions, or ideas worth chasing.
            </p>
          </section>
          <footer className={styles.aboutFooter}>
            <small>Last updated: October 22, 2025</small>
          </footer>
        </div> 
      </div>
    </div>
  );
}