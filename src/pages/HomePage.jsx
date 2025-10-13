import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

export default function HomePage({ setScene }) {
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const navigate = useNavigate();

  // just clear the scene for now; you could insert 3D props here later
  useEffect(() => {
    setScene(null);
  }, [setScene]);

  return (
    <div className="page-content">
      <div className="paper-overlay" />

      <header className="hero-block">
        <h1 ref={titleRef} className="sumi-title">
          墨
        </h1>
        <h2 ref={subtitleRef} className="sumi-sub">
          Sumi — Home
        </h2>
        <p className="lead">
          A quiet canvas of ink and wind.<br />
          Explore motion, texture, and the soft rhythm of falling leaves.
        </p>
        <button
          className="sumi-button"
          onClick={() => navigate("/projects")}
          aria-label="View my projects"
        >
          View Projects
        </button>
      </header>

      <section className="intro-text">
        <p>
          Each scene you visit breathes with its own season — pink petals in
          spring, red leaves in fall, golden light in autumn.
        </p>
        <p>
          The brush trails echo the movement of your cursor, blending tradition
          with code. Wander, explore, and let the minimalism do the talking.
        </p>
      </section>
    </div>
  );
}
