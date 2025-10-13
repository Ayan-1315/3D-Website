import React, { useEffect } from "react";
import "./ProjectsPage.css";

export default function ProjectsPage({ setScene }) {
  useEffect(() => {
    // no 3D scene overlay here for now
    setScene(null);
  }, [setScene]);

  return (
    <div className="projects-wrapper">
      <header className="projects-header">
        <h1 className="sumi-title">Projects</h1>
        <p className="projects-lead">
          A collection of experiments, ideas, and visual stories built with code.
        </p>
      </header>

      <section className="projects-grid">
        {/* Example project cards — duplicate or replace as needed */}
        <article className="project-card">
          <h2 className="project-title">Interactive Sumi Canvas</h2>
          <p className="project-desc">
            A WebGL ink-painting demo blending cursor motion with particle
            physics. Built using Three.js and custom shaders.
          </p>
        </article>

        <article className="project-card">
          <h2 className="project-title">Whispering Leaves</h2>
          <p className="project-desc">
            A real-time 3D wind field simulation driving thousands of cherry
            petals. Optimized for 60 FPS across devices.
          </p>
        </article>

        <article className="project-card">
          <h2 className="project-title">AI Brush Bot</h2>
          <p className="project-desc">
            A conversational art assistant trained on classical brush-stroke
            datasets, generating sumi-inspired compositions.
          </p>
        </article>
      </section>
    </div>
  );
}
