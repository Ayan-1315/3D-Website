import React, { useEffect } from "react";
// import "./AboutPage.css"; // You will need to create this CSS file

export default function AboutPage({ setScene }) {
  
  useEffect(() => {
    // ✅ CORRECT: This is the fix.
    // This clears any 3D objects from the scene when you visit the About page.
    setScene(null);
  }, [setScene]);

  return (
    // This HTML is rendered in the UI, which is correct
    <div className="page-content about-page">
      <header className="hero-block">
        <h1 className="sumi-title">About Me</h1>
        <p className="lead">
          I am a creative developer who loves blending art and code.
        </p>
      </header>
      
      <section className="intro-text">
        <p>
          This website is an experiment in generative art, physics-based
          interactions, and minimalist design, inspired by the art of Sumi-e.
        </p>
      </section>
    </div>
  );
}