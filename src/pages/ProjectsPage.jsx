import React, { useEffect, useRef } from "react";
import "./ProjectsPage.css";

export default function ProjectsPage({ setScene }) {
  const scrollerRef = useRef(null);
  const scrollAmountRef = useRef(0); // To store the width of one card + gap

  const projects = [
    { title: "Interactive Sumi Canvas", desc: "WebGL ink painting with brush trails and particle effects." },
    { title: "Whispering Leaves", desc: "Wind-swept petals with layered depth and soft collisions." },
    { title: "AI Brush Bot", desc: "Assistive generator for brush-inspired sketches." },
    { title: "Studio Experiments", desc: "Small tools, shaders, and prototypes." }
  ];

  const extendedProjects = [...projects, ...projects, ...projects];

  // Arrow Click Handlers
  const handleScrollLeft = () => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollBy({
      left: -scrollAmountRef.current,
      behavior: 'smooth'
    });
  };

  const handleScrollRight = () => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollBy({
      left: scrollAmountRef.current,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    setScene(null);

    const scroller = scrollerRef.current;
    if (!scroller) return;

    let scheduled = false;
    let isRepositioning = false;
    let blockWidth = 0;

    const setupScroller = () => {
      if (scroller.children.length > projects.length) {
        const firstCard = scroller.children[0];
        const secondBlockStartNode = scroller.children[projects.length];
        blockWidth = secondBlockStartNode.offsetLeft - firstCard.offsetLeft;
        scroller.scrollLeft = blockWidth;
        
        const cardStyle = getComputedStyle(scroller.children[0]);
        const cardWidth = parseFloat(cardStyle.width);
        const cardGap = parseFloat(getComputedStyle(scroller).gap);
        scrollAmountRef.current = cardWidth + cardGap;
        
        requestAnimationFrame(animateCards);
      }
    };
    
    const setupTimeout = setTimeout(setupScroller, 100);

    const animateCards = () => {
      if (!scroller) return;
      const scrollerCenter = scroller.offsetWidth / 2;
      
      for (const card of scroller.children) {
        const cardRect = card.getBoundingClientRect();
        const scrollerRect = scroller.getBoundingClientRect();
        const cardCenter = cardRect.left - scrollerRect.left + cardRect.width / 2;
        const distanceFromCenter = cardCenter - scrollerCenter;
        
        const rotation = distanceFromCenter / scrollerCenter * -15;
        const scale = 1 - Math.abs(distanceFromCenter) / (scroller.offsetWidth * 2);

        card.style.transform = `rotateY(${rotation.toFixed(2)}deg) scale(${scale.toFixed(2)})`;
      }
    };

    const onScroll = () => {
      if (isRepositioning || blockWidth === 0) return;
      
      if (scroller.scrollLeft <= 0) {
        isRepositioning = true;
        scroller.scrollLeft = blockWidth;
        requestAnimationFrame(() => { isRepositioning = false; });
      } else if (scroller.scrollLeft >= blockWidth * 2) {
        isRepositioning = true;
        scroller.scrollLeft = blockWidth;
        requestAnimationFrame(() => { isRepositioning = false; });
      }

      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(() => {
          animateCards();
          scheduled = false;
        });
      }
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      clearTimeout(setupTimeout);
      scroller.removeEventListener("scroll", onScroll);
    };
  }, [setScene, projects.length]);

  return (
    <div className="projects-page">
      <header className="projects-header">
        <h1 className="sumi-title">Projects</h1>
        <p className="projects-lead">Selected experiments — click to open.</p>
      </header>

      {/* Navigation Arrows */}
      <button className="nav-arrow nav-arrow-left" onClick={handleScrollLeft} aria-label="Scroll left">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.75 19.5L8.25 12L15.75 4.5" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <button className="nav-arrow nav-arrow-right" onClick={handleScrollRight} aria-label="Scroll right">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8.25 4.5L15.75 12L8.25 19.5" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div className="projects-scroller" ref={scrollerRef} tabIndex={0} aria-label="Projects carousel">
        {extendedProjects.map((p, i) => (
          <article key={i} className="project-card" tabIndex={0} role="button">
            <div className="card-inner">
              <h3 className="project-title">{p.title}</h3>
              <p className="project-desc">{p.desc}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}