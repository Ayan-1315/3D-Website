// src/pages/ProjectsPage.jsx
import React, { useEffect, useRef } from "react";
import "./ProjectsPage.css";

export default function ProjectsPage({ setScene }) {
  const scrollerRef = useRef(null);
  const trackRef = useRef(null);
  const sphereRef = useRef(null);

  useEffect(() => {
    setScene(null);

    const scroller = scrollerRef.current;
    const track = trackRef.current;
    const sphere = sphereRef.current;
    if (!scroller || !track || !sphere) return;

    let scheduled = false;

    // update sphere position based on scroller.scrollLeft
    const updateSphere = () => {
      scheduled = false;
      const maxScroll = Math.max(1, scroller.scrollWidth - scroller.clientWidth);
      const pct = scroller.scrollLeft / maxScroll;
      const trackRect = track.getBoundingClientRect();
      const padding = parseFloat(getComputedStyle(track).paddingLeft) || 6;
      const sphereSize = parseFloat(getComputedStyle(sphere).width) || 18;
      const usable = Math.max(1, trackRect.width - padding * 2 - sphereSize);
      const x = pct * usable;
      sphere.style.transform = `translateY(-50%) translateX(${x}px)`;
    };

    const onScroll = () => {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(updateSphere);
      }
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    // set initial pos
    requestAnimationFrame(updateSphere);

    // ---- click / drag to scrub the scroller ----
    let dragging = false;

    const setScrollFromClientX = (clientX) => {
      const rect = track.getBoundingClientRect();
      const padding = parseFloat(getComputedStyle(track).paddingLeft) || 6;
      const sphereSize = parseFloat(getComputedStyle(sphere).width) || 18;
      const usable = Math.max(1, rect.width - padding * 2 - sphereSize);
      // compute local x within usable area
      let localX = clientX - rect.left - padding - sphereSize / 2;
      localX = Math.max(0, Math.min(usable, localX));
      const pct = localX / usable;
      const maxScroll = Math.max(1, scroller.scrollWidth - scroller.clientWidth);
      scroller.scrollLeft = pct * maxScroll;
      // call updateSphere via RAF (scroll listener will sync)
    };

    const onPointerDown = (e) => {
      dragging = true;
      track.setPointerCapture && track.setPointerCapture(e.pointerId);
      setScrollFromClientX(e.clientX);
    };
    const onPointerMove = (e) => {
      if (!dragging) return;
      setScrollFromClientX(e.clientX);
    };
    const onPointerUp = (e) => {
      dragging = false;
      try { track.releasePointerCapture && track.releasePointerCapture(e.pointerId); } catch (err) {err}
    };

    track.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    track.addEventListener("click", (e) => setScrollFromClientX(e.clientX));

    return () => {
      scroller.removeEventListener("scroll", onScroll);
      track.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [setScene]);

  const projects = [
    { title: "Interactive Sumi Canvas", desc: "WebGL ink painting with brush trails and particle effects." },
    { title: "Whispering Leaves", desc: "Wind-swept petals with layered depth and soft collisions." },
    { title: "AI Brush Bot", desc: "Assistive generator for brush-inspired sketches." },
    { title: "Studio Experiments", desc: "Small tools, shaders, and prototypes." }
  ];

  return (
    <div className="projects-page">
      <header className="projects-header">
        <h1 className="sumi-title">Projects</h1>
        <p className="projects-lead">Selected experiments — click to open.</p>
      </header>

      <div className="projects-scroller" ref={scrollerRef} tabIndex={0} aria-label="Projects carousel">
        {projects.map((p, i) => (
          <article key={i} className="project-card" tabIndex={0} role="button">
            <div className="card-inner">
              <h3 className="project-title">{p.title}</h3>
              <p className="project-desc">{p.desc}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="custom-scrollbar" aria-hidden="false">
        <div className="scroll-track" ref={trackRef}>
          <div className="scroll-sphere" ref={sphereRef} />
        </div>
      </div>
    </div>
  );
}
