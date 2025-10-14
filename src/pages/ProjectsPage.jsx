// src/pages/ProjectsPage.jsx
import React, { useEffect, useRef } from "react";
import "./ProjectsPage.css";

export default function ProjectsPage({ setScene }) {
  const scrollerRef = useRef(null);
  const trackRef = useRef(null);
  const sphereRef = useRef(null);

  const projects = [
    { title: "Interactive Sumi Canvas", desc: "WebGL ink painting with brush trails and particle effects." },
    { title: "Whispering Leaves", desc: "Wind-swept petals with layered depth and soft collisions." },
    { title: "AI Brush Bot", desc: "Assistive generator for brush-inspired sketches." },
    { title: "Studio Experiments", desc: "Small tools, shaders, and prototypes." }
  ];

  // 1. Duplicate projects to create the seamless loop effect
  const extendedProjects = [...projects, ...projects, ...projects];

  useEffect(() => {
    setScene(null);

    const scroller = scrollerRef.current;
    const track = trackRef.current;
    const sphere = sphereRef.current;
    if (!scroller || !track || !sphere) return;

    let scheduled = false;
    let isRepositioning = false;
    let blockWidth = 0;

    const setupScroller = () => {
      if (scroller.children.length > projects.length) {
        // Calculate the width of one full set of projects
        const firstCard = scroller.children[0];
        const secondBlockStartNode = scroller.children[projects.length];
        blockWidth = secondBlockStartNode.offsetLeft - firstCard.offsetLeft;

        // Start the scroller at the beginning of the second (middle) block
        scroller.scrollLeft = blockWidth;
      }
    };
    
    // Use a timeout to ensure browser layout is complete before calculating widths
    const setupTimeout = setTimeout(setupScroller, 100);

    const updateSphere = () => {
      scheduled = false;
      if (blockWidth <= 0) return; // Don't run until blockWidth is calculated

      // 2. Update sphere based on the "perceived" scroll position within one block
      const perceivedScrollLeft = scroller.scrollLeft - blockWidth;
      const perceivedMaxScroll = blockWidth - scroller.clientWidth;
      const maxScroll = Math.max(1, perceivedMaxScroll);
      let pct = perceivedScrollLeft / maxScroll;
      pct = Math.max(0, Math.min(1, pct));

      const trackRect = track.getBoundingClientRect();
      const padding = parseFloat(getComputedStyle(track).paddingLeft) || 6;
      const sphereSize = parseFloat(getComputedStyle(sphere).width) || 18;
      const usable = Math.max(1, trackRect.width - padding * 2 - sphereSize);
      const x = pct * usable;
      sphere.style.transform = `translateY(-50%) translateX(${x}px)`;
    };

    const onScroll = () => {
      if (isRepositioning || blockWidth === 0) return;

      const scrollLeft = scroller.scrollLeft;

      // 3. Jump logic: when user scrolls to a clone, move them to the real block
      if (scrollLeft >= blockWidth * 2) {
        isRepositioning = true;
        scroller.scrollLeft -= blockWidth;
        requestAnimationFrame(() => { isRepositioning = false; });
      } else if (scrollLeft < blockWidth) {
        isRepositioning = true;
        scroller.scrollLeft += blockWidth;
        requestAnimationFrame(() => { isRepositioning = false; });
      }

      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(updateSphere);
      }
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    requestAnimationFrame(updateSphere);

    // ---- click / drag to scrub the scroller ----
    let dragging = false;

    const setScrollFromClientX = (clientX) => {
      if (blockWidth <= 0) return; // Wait for setup
      const rect = track.getBoundingClientRect();
      const padding = parseFloat(getComputedStyle(track).paddingLeft) || 6;
      const sphereSize = parseFloat(getComputedStyle(sphere).width) || 18;
      const usable = Math.max(1, rect.width - padding * 2 - sphereSize);
      
      let localX = clientX - rect.left - padding - sphereSize / 2;
      localX = Math.max(0, Math.min(usable, localX));
      const pct = localX / usable;
      
      const perceivedMaxScroll = blockWidth - scroller.clientWidth;
      // Set scrollLeft relative to the start of the middle block
      scroller.scrollLeft = blockWidth + (pct * perceivedMaxScroll);
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
      clearTimeout(setupTimeout);
      scroller.removeEventListener("scroll", onScroll);
      track.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [setScene, projects.length]);

  return (
    <div className="projects-page">
      <header className="projects-header">
        <h1 className="sumi-title">Projects</h1>
        <p className="projects-lead">Selected experiments — click to open.</p>
      </header>

      <div className="projects-scroller" ref={scrollerRef} tabIndex={0} aria-label="Projects carousel">
        {/* Render the extended list of projects */}
        {extendedProjects.map((p, i) => (
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