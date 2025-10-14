// src/pages/ProjectsPage.jsx
import React, { useEffect, useRef } from "react";
import "./ProjectsPage.css";

export default function ProjectsPage({ setScene }) {
  const scrollerRef = useRef(null);
  const thumbRef = useRef(null);
  const sphereRef = useRef(null);

  useEffect(() => {
    setScene(null); // keep 3D leaves behind; physics disabled by App.jsx for this page

    const scroller = scrollerRef.current;
    const thumb = thumbRef.current;
    const sphere = sphereRef.current;
    if (!scroller || !thumb || !sphere) return;

    let scheduled = false;
    const apply = () => {
      scheduled = false;
      const maxScroll = Math.max(1, scroller.scrollWidth - scroller.clientWidth);
      const pct = scroller.scrollLeft / maxScroll;
      const trackWidth = scroller.clientWidth - 48;
      const x = pct * trackWidth;
      thumb.style.transform = `translateX(${x}px)`;
      sphere.style.transform = `translateX(${x + 24}px)`;
    };

    const onScroll = () => {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(apply);
      }
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    // initial pos
    requestAnimationFrame(apply);

    return () => {
      scroller.removeEventListener("scroll", onScroll);
    };
  }, [setScene]);

  // sample projects array (replace with your data)
  const projects = [
    {
      title: "Interactive Sumi Canvas",
      desc: "WebGL ink painting with brush trails and particle effects.",
    },
    {
      title: "Whispering Leaves",
      desc: "Wind-swept petals with layered depth and soft collisions.",
    },
    {
      title: "AI Brush Bot",
      desc: "Assistive generator for brush-inspired sketches.",
    },
    {
      title: "Studio Experiments",
      desc: "Small tools, shaders, and prototypes.",
    },
  ];

  return (
    <div className="projects-page">
      <header className="projects-header">
        <h1 className="sumi-title">Projects</h1>
        <p className="projects-lead">Selected experiments — click to open.</p>
      </header>

      <div className="projects-scroller" ref={scrollerRef} tabIndex={0} aria-label="Projects carousel">
        {projects.map((p, i) => (
          <article key={i} className="project-card" tabIndex={0} role="button" aria-pressed="false">
            <div className="card-inner">
              <h3 className="project-title">{p.title}</h3>
              <p className="project-desc">{p.desc}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="custom-scrollbar" aria-hidden="true">
        <div className="scroll-track">
          <div className="scroll-thumb" ref={thumbRef} />
          <div className="scroll-sphere" ref={sphereRef} />
        </div>
      </div>
    </div>
  );
}
