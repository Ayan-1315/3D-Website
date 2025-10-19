import React, { useEffect } from "react";
import "./AboutPage.css"; // Ensure this import points to the correct CSS file

export default function AboutPage({ setScene, seasonalShadow }) { // <-- Accept prop

  useEffect(() => {
    setScene(null);
  }, [setScene]);

  return (
    <div className="page-content about-page"> {/* Added page-content class */}
      <div className="paper-overlay" />
      <header className="hero-block">
        <h1
          className="sumi-title"
          style={{ textShadow: seasonalShadow }} // <-- Apply prop
        >
          About
        </h1>
        <p className="lead">
          I'm a software engineer passionate about building
          interactive and beautiful digital experiences.
        </p>
      </header>

      <section className="about-content">
        {/* ... rest of the content ... */}
         <p>
          This website is my personal canvas, a place where I blend
          the art of minimalist design with the technical challenges of
          web graphics and physics simulations.
        </p>
        <p>
          Inspired by the Japanese art of Sumi-e (墨絵), the goal was to
          create a space that feels organic, alive, and responsive.
          Every falling leaf and ink trail is a line of code,
          a generative system designed to be peaceful and interactive.
        </p>
        <p>
          <strong>Tech Stack:</strong> Built with React, Three.js (react-three-fiber),
          and Rapier (for physics).
        </p>
      </section>
    </div>
  );
}