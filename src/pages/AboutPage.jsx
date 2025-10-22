import React, { useEffect, useRef } from "react";
import styles from "./AboutPage.module.css"; // Ensure CSS Module import

// Helper function for smooth interpolation (ease-out cubic)
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

export default function AboutPage({ setScene, seasonalShadow }) {
  const scrollRef = useRef(null); // Ref for the scrollable div
  // Ref to store previous transform values for smoother interpolation
  const transformCache = useRef({});

  useEffect(() => {
    setScene(null); // Clear 3D scene on mount

    const scrollableDiv = scrollRef.current;
    if (!scrollableDiv) return; // Exit if ref not attached

    let rafId = null; // Store requestAnimationFrame ID

    // Scroll event handler
    const handleScroll = () => {
      // Cancel previous frame request if scroll happens quickly
      if (rafId) {
        cancelAnimationFrame(rafId);
      }

      // Schedule the transform update in the next animation frame
      rafId = requestAnimationFrame(() => {
        // Get scroll and container dimensions
        // eslint-disable-next-line no-unused-vars
        const scrollTop = scrollableDiv.scrollTop;
        const clientHeight = scrollableDiv.clientHeight;
        if (clientHeight === 0) return; // Avoid division by zero

        // Calculate the vertical center of the visible scroll area
        const viewportCenterY = clientHeight / 2;

        // Configuration for the roll effect
        const maxAngle = 20; // Max rotation angle in degrees
        const maxTranslateZ = -50; // Max push back in Z-axis (pixels)

        // Select all direct block children within the scrolling content
        const textBlocks = scrollableDiv.querySelectorAll(
          `.${styles.aboutContent} > p, .${styles.aboutContent} > ul, .${styles.aboutFooter}`
        );

        textBlocks.forEach((el, index) => {
          // Use index as a simple key for the interpolation cache
          const cacheKey = `el-${index}`;
          // Initialize cache if needed
          if (!transformCache.current[cacheKey]) {
              transformCache.current[cacheKey] = { angle: 0, tz: 0, opacity: 1 };
          }
          const prevTransform = transformCache.current[cacheKey];

          // Get element position relative to the scroll container
          const rect = el.getBoundingClientRect();
          const parentRect = scrollableDiv.getBoundingClientRect();
          const elCenterLocal = rect.top - parentRect.top + rect.height / 2;

          // Calculate normalized distance from the viewport center (-1 to 1, approximately)
          // Adjust the divisor (clientHeight / X) for sensitivity, smaller X = more sensitive
          let dist = (elCenterLocal - viewportCenterY) / (clientHeight / 1.8);
          // Clamp distance between -1 and 1 for predictable easing
          dist = Math.max(-1, Math.min(1, dist));

          // --- Calculate Target Transform Values ---
          // Apply an easing function to the distance for smoother rotation start/end
          const easedDist = Math.sign(dist) * easeOutCubic(Math.abs(dist));

          const targetAngle = easedDist * maxAngle; // Target rotation based on eased distance
          const targetTz = Math.abs(easedDist) * maxTranslateZ; // Target Z translation (push back)
          const targetOpacity = Math.max(0.3, 1 - Math.abs(easedDist) * 0.7); // Fade out towards edges

          // --- Smooth Interpolation (Lerp) ---
          // Gradually move from previous value to target value for smoother animation
          const lerpFactor = 0.15; // Lower value = smoother/slower interpolation
          const currentAngle = prevTransform.angle + (targetAngle - prevTransform.angle) * lerpFactor;
          const currentTz = prevTransform.tz + (targetTz - prevTransform.tz) * lerpFactor;
          const currentOpacity = prevTransform.opacity + (targetOpacity - prevTransform.opacity) * lerpFactor;

          // Apply the calculated transform and opacity styles
          el.style.transform = `rotateX(${currentAngle.toFixed(2)}deg) translateZ(${currentTz.toFixed(2)}px)`;
          el.style.opacity = currentOpacity.toFixed(2);
          // Ensure transform origin and backface visibility are set (can also be set in CSS)
          el.style.transformOrigin = "center center";
          el.style.backfaceVisibility = "hidden";

           // Store current interpolated values for the next frame's calculation
           transformCache.current[cacheKey] = { angle: currentAngle, tz: currentTz, opacity: currentOpacity };
        });
      }); // End requestAnimationFrame
    }; // End handleScroll

    // Attach scroll listener
    scrollableDiv.addEventListener("scroll", handleScroll, { passive: true });
    // Run once initially to set starting transforms
    handleScroll();

    // Cleanup function to remove listener and cancel animation frame on unmount
    return () => {
       if (rafId) {
           cancelAnimationFrame(rafId);
       }
      if (scrollableDiv) {
        scrollableDiv.removeEventListener("scroll", handleScroll);
      }
    };

  }, [setScene]); // Dependency array includes setScene

  return (
    <div className={styles.aboutPage} role="main" aria-label="About page">
      {/* Background paper effect */}
      <div className={styles.paperOverlay} />

      {/* Main content card */}
      <div className={styles.contentInner}>
        {/* Header section (fixed at the top of the card) */}
        <header className={styles.heroBlock}>
           <h1 className={styles.sumiTitle} style={{ textShadow: seasonalShadow }}>
            About
          </h1>
          <p className={styles.lead}>
            I’m Ayan — a developer, dreamer, and explorer of ideas. I design interactive systems that blend logic and imagination,
            where code feels alive and curiosity never stops moving.
          </p>
        </header>

        {/* Scrollable content area */}
        <div ref={scrollRef} className={styles.scrollableContent}>
          {/* Main text content */}
          <section className={styles.aboutContent} aria-labelledby="about-heading">
            <p>
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
                github.com/Ayan-1315
              </a>
            </p>
            <p>
              <strong>Contact:</strong> Use the contact link in the site footer to reach out — collaboration, questions, or ideas worth chasing.
            </p>
          </section>

          {/* Footer inside the scrollable area */}
          <footer className={styles.aboutFooter}>
            <small>Last updated: October 22, 2025</small>
          </footer>
        </div>
        {/* --- END SCROLLABLE WRAPPER --- */}

      </div>
      {/* --- END CONTENT INNER --- */}

    </div>
    /* --- END ABOUT PAGE --- */
  );
}