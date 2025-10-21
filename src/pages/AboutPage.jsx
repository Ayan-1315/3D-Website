import React, { useEffect } from "react";
// MODIFIED: Import styles as an object
import styles from "./AboutPage.module.css"; 

export default function AboutPage({ setScene, seasonalShadow }) { 
  useEffect(() => {
    setScene(null);
  }, [setScene]);

  return (
    // MODIFIED: Apply classes using the styles object
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

        <section className={styles.aboutContent} aria-labelledby="about-heading">
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
    </div>
  );
}