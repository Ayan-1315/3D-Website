import React, { useEffect, useRef } from "react"; // <-- Import useRef
import styles from "./AboutPage.module.css"; 

export default function AboutPage({ setScene, seasonalShadow }) { 
  const scrollRef = useRef(null); // <-- Ref for the scrollable div

  useEffect(() => {
    setScene(null);

    const scrollableDiv = scrollRef.current;
    if (!scrollableDiv) return;

    // --- Scroll Event Handler ---
    const handleScroll = () => {
      const scrollTop = scrollableDiv.scrollTop;
      // const scrollHeight = scrollableDiv.scrollHeight;
      const clientHeight = scrollableDiv.clientHeight;
      const scrollCenter = scrollTop + clientHeight / 2;
      const maxAngle = 15; // Max rotation angle in degrees

      // Target the direct children (aboutContent and aboutFooter)
      const contentElements = [
          scrollableDiv.querySelector(`.${styles.aboutContent}`),
          scrollableDiv.querySelector(`.${styles.aboutFooter}`)
      ].filter(el => el); // Filter out nulls if footer isn't rendered yet

      contentElements.forEach(el => {
        if (!el) return;
        const elTop = el.offsetTop;
        const elHeight = el.offsetHeight;
        const elCenter = elTop + elHeight / 2;
        
        // Calculate distance from scroll viewport center (-1 to 1)
        const distFromCenter = (elCenter - scrollCenter) / (clientHeight / 2);
        
        // Map distance to rotation angle
        // Clamp the angle between -maxAngle and maxAngle
        const angle = Math.max(-maxAngle, Math.min(maxAngle, distFromCenter * maxAngle));

        // Apply transform
        el.style.transform = `rotateX(${angle.toFixed(2)}deg)`;
      });
    };
    // --- End Handler ---

    // Add listener
    scrollableDiv.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial call to set transforms
    handleScroll(); 

    // Cleanup listener
    return () => {
      if (scrollableDiv) {
        scrollableDiv.removeEventListener('scroll', handleScroll);
      }
    };

  }, [setScene]); // useEffect depends only on setScene now

  return (
    <div className={styles.aboutPage} role="main" aria-label="About page">
      <div className={styles.paperOverlay} />

      <div className={styles.contentInner}>
        <header className={styles.heroBlock}>
           <h1 className={styles.sumiTitle} style={{ textShadow: seasonalShadow }}> 
            About — Ayan
          </h1>
          <p className={styles.lead}>
            I'm Ayan — a software engineer with a B.Tech in Computer Science. I build
            interactive web experiences, real-time systems, and prototype games.
            I care about clean, minimal design and using physics and generative
            systems to make interfaces feel alive.
          </p>
        </header>

        {/* --- ADDED ref to the scrollable div --- */}
        <div ref={scrollRef} className={styles.scrollableContent}> 
          <section className={styles.aboutContent} aria-labelledby="about-heading">
            {/* ... paragraphs ... */}
              <p>
              <strong>Education:</strong> B.Tech — Computer Science (CSE).
            </p>

            <p>
              <strong>Core skills:</strong> HTML, CSS, JavaScript, React, Node,
              WebSockets/Socket.io, Three.js (react-three-fiber), Rapier (physics),
              MongoDB, Python, AI/ML tooling (BERT experiments), and Unity for small
              game prototypes.
            </p>

            <p>
              <strong>Interests:</strong> real-time systems, web graphics, generative
              visuals, small-scale game loops, and experimenting with transformer
              models and LLMs for chat/agent work.
            </p>

            <p> 
              <strong>Selected projects:</strong> 
            </p> 
            
            <ul className={styles.projectList}> 
              <li>3D personal site</li>
              <li>Snuger</li>
              <li>WebSocket / ticketing agent</li>
              <li>Unity prototypes</li>
            </ul>

            <p>
              <strong>Where I share code:</strong>{" "}
              <a href="https://github.com/Ayan-1315" target="_blank" rel="noreferrer">
                github.com/Ayan-1315
              </a>
              .
            </p>

            <p>
              <strong>Contact:</strong> use the contact link in the site footer to get in touch — for collaboration, questions, or bug reports.
            </p>
          </section>

          <footer className={styles.aboutFooter}>
            <small>Last updated: October 21, 2025</small>
          </footer>
        </div> 
        {/* --- END WRAPPER --- */}

      </div>
    </div>
  );
}