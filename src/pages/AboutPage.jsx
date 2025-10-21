import React, { useEffect } from "react";
// MODIFIED: Use the correct CSS module import if you renamed the file
import "./AboutPage.module.css"; 

export default function AboutPage({ setScene, seasonalShadow }) { // <-- Ensure seasonalShadow is received
  useEffect(() => {
    setScene(null);
  }, [setScene]);

  return (
    // MODIFIED: Use a unique class for the page container
    <div className="about-page" role="main" aria-label="About page">
      <div className="paper-overlay" />

      <div className="content-inner">
        <header className="hero-block">
          {/* MODIFIED: Ensure inline style applies the prop */}
          <h1 className="sumi-title" style={{ textShadow: seasonalShadow }}> 
            About — Ayan
          </h1>
          <p className="lead">
            I'm Ayan — a software engineer with a B.Tech in Computer Science. I build
            interactive web experiences, real-time systems, and prototype games.
            I care about clean, minimal design and using physics and generative
            systems to make interfaces feel alive.
          </p>
        </header>

        <section className="about-content" aria-labelledby="about-heading">
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
            {/* MODIFIED: Add a class for styling the list */}
            <ul className="project-list"> 
              <li>3D personal site</li>
              <li>Snuger</li>
              <li>WebSocket / ticketing agent</li>
              <li>Unity prototypes</li>
            </ul>
          </p>

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

        <footer className="about-footer">
          <small>Last updated: October 21, 2025</small>
        </footer>
      </div>
    </div>
  );
}