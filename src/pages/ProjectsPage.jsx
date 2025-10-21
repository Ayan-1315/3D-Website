import React, { useEffect, useRef } from "react";
import ProjectDetailModal from "../components/ProjectDetailModal"; // Assuming this is the correct path
import "./ProjectsPage.css";

// --- Enhanced Project Data ---
const projects = [
  {
    id: 1,
    title: "Interactive Sumi Canvas",
    desc: "WebGL ink painting with brush trails and particle effects.",
    details: "An experiment using WebGL shaders and particle systems to simulate traditional ink painting techniques interactively in the browser. Features include dynamic brush width based on cursor speed and reactive particle bursts.",
    tech: ["React", "Three.js (R3F)", "GLSL Shaders", "Rapier Physics"],
    githubLink: "https://github.com/Ayan-1315/3d-Portfolio", // Example Link
    liveLink: "https://3d-website-flame.vercel.app/" // Example Link
  },
  {
    id: 2,
    title: "Whispering Leaves",
    desc: "Wind-swept petals with layered depth and soft collisions.",
    details: "A physics-based simulation of falling leaves driven by procedural noise fields acting as wind. Implemented using Three.js and the Rapier physics engine for realistic movement and subtle interactions.",
    tech: ["React", "Three.js (R3F)", "Rapier Physics", "Simplex Noise"],
    githubLink: "https://github.com/Ayan-1315/3d-Portfolio", // Example Link
    liveLink: "https://3d-website-flame.vercel.app/" // Example Link
  },
  {
    id: 3,
    title: "AI Brush Bot",
    desc: "Assistive generator for brush-inspired sketches.",
    details: "Exploring generative art concepts, this tool uses simple AI algorithms (like Perlin noise or agent-based systems) to create sketch-like visuals reminiscent of brush strokes.",
    tech: ["JavaScript", "p5.js", "Generative Algorithms"],
    githubLink: "https://github.com/Ayan-1315/3d-Portfolio", // Example Link
    liveLink: "https://3d-website-flame.vercel.app/" // Example Link
  },
  {
    id: 4,
    title: "Studio Experiments",
    desc: "Small tools, shaders, and prototypes.",
    details: "A collection of various small-scale experiments, shader tests, utility components, and prototypes developed during the creation of other projects or for exploring new techniques.",
    tech: ["React", "Three.js", "GLSL", "Various Libraries"],
    githubLink: "https://github.com/Ayan-1315/3d-Portfolio", // Example Link
    liveLink: "https://3d-website-flame.vercel.app/" // Example Link
  }
];
// --- End Enhanced Project Data ---

export default function ProjectsPage({
  setScene,
  seasonalShadow,
  selectedProject,      // Prop from App
  setSelectedProject    // Prop from App
}) {
  const scrollerRef = useRef(null);
  const scrollAmountRef = useRef(0);

  const extendedProjects = [...projects, ...projects, ...projects];

  const handleScrollLeft = () => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollBy({ left: -scrollAmountRef.current, behavior: 'smooth' });
  };

  const handleScrollRight = () => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollBy({ left: scrollAmountRef.current, behavior: 'smooth' });
  };

  // Use the passed-in setSelectedProject
  const handleCardClick = (project) => {
    setSelectedProject(project);
  };

  useEffect(() => {
    setScene(null);

    const scroller = scrollerRef.current;
    if (!scroller) return;

    let scheduled = false;
    let isRepositioning = false;
    let blockWidth = 0;

    const setupScroller = () => {
      // Ensure enough children exist before calculating
      if (scroller.children.length > projects.length) {
        const firstCard = scroller.children[0];
        const secondBlockStartNode = scroller.children[projects.length];

        // Add checks to prevent errors if elements aren't found immediately
        if (!firstCard || !secondBlockStartNode) {
          console.warn("Card elements not ready for width calculation.");
          // Optionally retry after a short delay
          // setTimeout(setupScroller, 50);
          return;
        }

        blockWidth = secondBlockStartNode.offsetLeft - firstCard.offsetLeft;

        // Ensure blockWidth is a valid positive number
        if (isNaN(blockWidth) || blockWidth <= 0) {
            console.warn("Invalid blockWidth calculated:", blockWidth);
            // Optionally retry
            // setTimeout(setupScroller, 50);
            return;
        }

        scroller.scrollLeft = blockWidth;

        const cardStyle = getComputedStyle(firstCard);
        const cardWidth = parseFloat(cardStyle.width);
        const cardGap = parseFloat(getComputedStyle(scroller).gap) || 30; // Provide default gap
        scrollAmountRef.current = cardWidth + cardGap;

        requestAnimationFrame(animateCards);
      } else {
          console.warn("Not enough project cards rendered yet for infinite scroll setup.");
          // Optionally retry
          // setTimeout(setupScroller, 50);
      }
    };

    // Increased timeout for potentially slower rendering/layout
    const setupTimeout = setTimeout(setupScroller, 150);

    const animateCards = () => {
      if (!scroller) return;
      const scrollerCenter = scroller.offsetWidth / 2;

      for (const card of scroller.children) {
        const cardRect = card.getBoundingClientRect();
        const scrollerRect = scroller.getBoundingClientRect();
        // Check if scrollerRect has valid dimensions
        if (scrollerRect.width === 0) continue;

        const cardCenter = cardRect.left - scrollerRect.left + cardRect.width / 2;
        const distanceFromCenter = cardCenter - scrollerCenter;

        // Ensure scrollerCenter is not zero to prevent division by zero
        const rotation = scrollerCenter !== 0 ? (distanceFromCenter / scrollerCenter) * -15 : 0;
        const scale = scroller.offsetWidth > 0 ? 1 - Math.abs(distanceFromCenter) / (scroller.offsetWidth * 2) : 1;


        // Apply transform only if values are valid numbers
        if (!isNaN(rotation) && !isNaN(scale)) {
           card.style.transform = `rotateY(${rotation.toFixed(2)}deg) scale(${scale.toFixed(2)})`;
        }
      }
    };

    const onScroll = () => {
      // Add checks for valid numbers and conditions
      if (isRepositioning || blockWidth === 0 || isNaN(blockWidth)) return;

      const scrollLeft = scroller.scrollLeft;
       if (isNaN(scrollLeft)) return;

      // Adjust thresholds slightly to prevent rapid jumping if scroll momentum is high
      if (scrollLeft <= blockWidth * 0.1) {
        isRepositioning = true;
        scroller.scrollLeft += blockWidth;
        // Use timeout to allow rendering before resetting flag
        setTimeout(() => { isRepositioning = false; }, 50); // Small delay
      } else if (scrollLeft >= blockWidth * 1.9) {
         isRepositioning = true;
        scroller.scrollLeft -= blockWidth;
         setTimeout(() => { isRepositioning = false; }, 50); // Small delay
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
    requestAnimationFrame(animateCards); // Call initially

    // Cleanup function
    return () => {
      clearTimeout(setupTimeout);
      if (scroller) { // Check scroller exists before removing listener
        scroller.removeEventListener("scroll", onScroll);
      }
    };
  // Add projects.length to dependencies to re-run effect if project count changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setScene, projects.length]);

  return (
    <div className="projects-page">
      <header className="projects-header">
        <h1
          className="sumi-title"
          style={{ textShadow: seasonalShadow }}
        >
          Projects
        </h1>
        <p className="projects-lead">
          Selected experiments — click to open.
        </p>
      </header>

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
          <article
            key={`${p.id}-${i}`} // Use original ID + index for uniqueness
            className="project-card"
            tabIndex={0}
            role="button"
            onClick={() => handleCardClick(p)}
          >
            <div className="card-inner">
              <h3 className="project-title">{p.title}</h3>
              <p className="project-desc">{p.desc}</p>
            </div>
          </article>
        ))}
      </div>

      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
}