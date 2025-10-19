import React, { useEffect } from "react";
import "./ContactPage.css"; // Ensure this import points to the correct CSS file

export default function ContactPage({ setScene, seasonalShadow }) { // <-- Accept prop

  useEffect(() => {
    setScene(null);
  }, [setScene]);

  return (
    <div className="page-content contact-page"> {/* Added page-content class */}
      <div className="paper-overlay" />
      <header className="hero-block">
        <h1
          className="sumi-title"
          style={{ textShadow: seasonalShadow }} // <-- Apply prop
        >
          Contact
        </h1>
        <p className="lead">
          Let's create something together.
          <br />
          You can find me on social media or send an email.
        </p>
      </header>

      <section className="contact-links">
       {/* ... rest of the content ... */}
         <a
          href="mailto:your-email@example.com"
          className="contact-button"
        >
          your-email@example.com
        </a>
        <div className="contact-socials">
          <span>Find me on:</span>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">X (Twitter)</a>
        </div>
      </section>
    </div>
  );
}