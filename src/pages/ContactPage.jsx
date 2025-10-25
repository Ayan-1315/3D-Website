import React, { useEffect } from "react";
// Correct the import to use CSS Modules
import styles from "./ContactPage.module.css"; 

export default function ContactPage({ setScene, seasonalShadow }) {
  useEffect(() => {
    setScene(null);
  }, [setScene]);

  return (
    // Apply CSS Module class names
    <div className={styles.contactPage} role="main" aria-label="Contact page">
      <div className={styles.paperOverlay} /> 
      
      {/* Added content inner wrapper */}
      <div className={styles.contentInner}>
        <header className={styles.heroBlock}>
          <h1 className={styles.sumiTitle} style={{ textShadow: seasonalShadow }}>
            Contact
          </h1>
          <p className={styles.lead}>
            Let's create something together.
            <br />
            You can find me on social media or send an email.
          </p>
        </header>

        <section className={styles.contactLinks}>
          <a href="mailto:your-email@example.com" className={styles.contactButton}>
            ayan.sen1315@gmail.com {/* Replace with your actual email */}
          </a>

          <div className={styles.contactSocials}>
            <span>Find me on:</span>
            {/* Added icons alongside text for better visual */}
            <a href="https://github.com/Ayan-1315" target="_blank" rel="noopener noreferrer">
              {/* Optional: Add GitHub icon here if desired */}
              GitHub
            </a>
            <a href="https://www.linkedin.com/in/ayan-sen-1315abc" target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
            <a href="https://x.com/Ayansen1315" target="_blank" rel="noopener noreferrer">
              X (Twitter)
            </a>
          </div>
        </section>
      </div> 
    </div>
  );
}