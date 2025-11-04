import React, { useEffect, useRef } from "react";
import styles from "./AboutPage.module.css";

// Helper function for smooth interpolation (ease-out cubic)
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export default function AboutPage({
  setScene,
  seasonalShadow,
  handleLinkClick,
}) {
  const scrollRef = useRef(null);
  // MODIFIED: Remove opacity from cache
  const transformCache = useRef({});

  useEffect(() => {
    setScene(null);
    const scrollableDiv = scrollRef.current;
    if (!scrollableDiv) return;

    let rafId = null;

    const handleScroll = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }

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
          const currentAngle =
            prevTransform.angle +
            (targetAngle - prevTransform.angle) * lerpFactor;
          const currentTz =
            prevTransform.tz + (targetTz - prevTransform.tz) * lerpFactor;
          // REMOVED: currentOpacity interpolation
          // const currentOpacity = prevTransform.opacity + (targetOpacity - prevTransform.opacity) * lerpFactor;
          const currentScale =
            prevTransform.scale +
            (targetScale - prevTransform.scale) * lerpFactor;

          // Apply the interpolated transform styles
          el.style.transform = `rotateX(${currentAngle.toFixed(
            2
          )}deg) translateZ(${currentTz.toFixed(
            2
          )}px) scale(${currentScale.toFixed(3)})`;
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
            scale: currentScale,
          };
        });
      }); // End requestAnimationFrame
    }; // End handleScroll

    scrollableDiv.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => {
      // Cleanup
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      if (scrollableDiv) {
        scrollableDiv.removeEventListener("scroll", handleScroll);
      }
    };
  }, [setScene]);

  return (
    // ... (Your existing JSX structure remains the same) ...
    <div className={styles.aboutPage} role="main" aria-label="About page">
      <div className={styles.paperOverlay} />
      <div className={styles.contentInner}>
        <header className={styles.heroBlock}>
          <h1
            className={styles.sumiTitle}
            style={{ textShadow: seasonalShadow }}
          >
            About
          </h1>
          <p className={styles.lead}>
            I’m Ayan — a developer, dreamer, and explorer of ideas. I design
            interactive systems that blend logic and imagination, where code
            feels alive and curiosity never stops moving.
          </p>
        </header>

        <div ref={scrollRef} className={styles.scrollableContent}>
          <section
            className={styles.aboutContent}
            aria-labelledby="about-heading"
          >
            <h1 id="about-heading" className="visually-hidden">
              About Me
            </h1>
            <p>
              <br />
              <strong>Education:</strong> B.Tech in Computer Science and
              Engineering.
            </p>
            <p>
              <strong>Technical skills:</strong> Experienced in building full
                
                <strong>Core skills:</strong> Proficient in HTML, CSS, and
                JavaScript with strong expertise in building dynamic web
                applications using React.js and Node.js. Experienced in
                real-time communication through WebSockets / Socket.io and
                skilled in 3D web development using Three.js
                (react-three-fiber). Adept at working with MongoDB for scalable
                data management and Python for AI / ML projects, including BERT
                and LLM-based models. Also passionate about experimenting with
                Unity to create interactive game experiences.
            </p>
            <p>
              <strong>Personal focus:</strong> Real-time systems, generative
              visuals, immersive web experiences, and building tools that make
              people feel connected to technology — not ruled by it.
            </p>
            <p>
              
              <strong>Curiosity:</strong> I have a wide range of interests
              beyond code — space science, technology, and biology always draw
              me in, while history catches my attention every now and then. I
              love learning something new every day; that’s what keeps me going.
            </p>
            <p>
              <strong>Dream:</strong> I’m deeply drawn to the mysteries of the
              cosmos — a curiosity that fuels my drive to pursue a career in
              space research. I want to explore the unknown, contribute to
              discoveries that expand our understanding of the universe, and
              turn imagination into knowledge. Every late-night experiment and
              quiet spark of curiosity is a small step toward that vast horizon.
            </p>
            <p>
              <strong>When not building:</strong> I dive into stories — lost in
              narrative games, living through other characters, exploring worlds
              that exist only in pixels and imagination. That escape fuels my
              creativity, keeps my perspective sharp, and somehow makes every
              line of code I write feel a little more alive.
            </p>
            <p>
              <strong>Selected projects:</strong>
            </p>
            <ul className={styles.projectList}>
              <li>3D Websites</li>
              <li>Snuger</li>
              <li>Unity (3D Game)</li>
              <li>Telegram Chatbot</li>
            </ul>
            <p>
              <strong>Where I share code:</strong>{" "}
              <a
                href="https://github.com/Ayan-1315"
                target="_blank"
                rel="noreferrer"
              >
                GitHub - Home Page
              </a>
            </p>
            <p>
              <strong>Contact:</strong> Use the{" "}
              <a href="/contact" onClick={handleLinkClick("/contact")}>
                contact page
              </a>{" "}
              to reach out — collaboration, questions, or ideas worth chasing.
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
