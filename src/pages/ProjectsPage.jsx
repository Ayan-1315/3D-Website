// src/pages/ProjectsPage.jsx
import React, { useEffect, useRef } from "react";
import "./ProjectsPage.css";

export default function ProjectsPage({ setScene }) {
  const scrollerRef = useRef(null);
  const thumbRef = useRef(null);
  const sphereRef = useRef(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const thumb = thumbRef.current;
    const sphere = sphereRef.current;
    if (!scroller || !thumb || !sphere) return;

    let scheduled = false;

    const applyPos = () => {
      const maxScroll = Math.max(
        1,
        scroller.scrollWidth - scroller.clientWidth
      );
      const pct = scroller.scrollLeft / maxScroll;
      const trackWidth = scroller.clientWidth - 48;
      const x = pct * trackWidth;
      thumb.style.transform = `translateX(${x}px)`;
      sphere.style.transform = `translateX(${x + 26}px)`;
      scheduled = false;
    };

    const onScroll = () => {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(applyPos);
      }
    };

    // set initial position
    requestAnimationFrame(applyPos);
    scroller.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      scroller.removeEventListener("scroll", onScroll);
    };
  }, [setScene]);

  // keyboard left/right control for scroller
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const onKey = (e) => {
      if (e.key === "ArrowRight") {
        scroller.scrollBy({
          left: scroller.clientWidth * 0.6,
          behavior: "smooth",
        });
      } else if (e.key === "ArrowLeft") {
        scroller.scrollBy({
          left: -scroller.clientWidth * 0.6,
          behavior: "smooth",
        });
      }
    };
    scroller.addEventListener("keydown", onKey);
    return () => scroller.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="projects-page">
      <header className="projects-header">
        <h1 className="sumi-title">Projects</h1>
        <p className="projects-lead">
          A collection of experiments, ideas, and visual stories built with
          code.
        </p>
      </header>

      <div
        className="projects-scroller"
        ref={scrollerRef}
        tabIndex={0}
        aria-label="Projects carousel (horizontal scroll)"
      >
        {/* sample cards — duplicate/replace as needed */}
        <article className="project-card">
          <h2 className="project-title">Interactive Sumi Canvas</h2>
          <p className="project-desc">
            A WebGL ink-painting demo blending cursor motion with particle
            physics.
          </p>
        </article>

        <article className="project-card">
          <h2 className="project-title">Whispering Leaves</h2>
          <p className="project-desc">
            A real-time 3D wind field simulation driving thousands of cherry
            petals.
          </p>
        </article>

        <article className="project-card">
          <h2 className="project-title">AI Brush Bot</h2>
          <p className="project-desc">
            A conversational art assistant trained on brush-stroke datasets.
          </p>
        </article>

        <article className="project-card">
          <h2 className="project-title">Experimental Studio</h2>
          <p className="project-desc">
            Short experiments and utilities for generative visuals.
          </p>
        </article>

        {/* add more cards as needed */}
      </div>

      {/* Custom scrollbar track (bottom of page) */}
      <div className="custom-scrollbar" aria-hidden="true">
        <div className="scroll-track">
          <div className="scroll-thumb" ref={thumbRef} />
          <div className="scroll-sphere" ref={sphereRef} />
        </div>
      </div>
    </div>
  );
}
