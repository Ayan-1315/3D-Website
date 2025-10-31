import React, { useEffect } from "react";
import styles from "./ContactPage.module.css"; 
// --- IMPORTS ADDED ---
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub, faLinkedinIn, faXTwitter } from "@fortawesome/free-brands-svg-icons";

export default function ContactPage({ setScene, seasonalShadow }) {
  useEffect(() => {
    setScene(null);
  }, [setScene]);

  return (
    <div className={styles.contactPage} role="main" aria-label="Contact page">
      <div className={styles.paperOverlay} /> 
      
      <div className={styles.contentInner}>
        <header className={styles.heroBlock}>
          <h1 className={styles.sumiTitle} style={{ textShadow: seasonalShadow }}>
            Contact
          </h1>

          {/* --- NEW TEXT CONTENT ADDED --- */}
          <p className={styles.lead}>
            I'm actively exploring new opportunities. If my work resonates with 
            your team, I would be excited to discuss how I can contribute.
            <br /><br />
            This site is a living experiment—if you spot a bug or have feedback, 
            please send me a note.
          </p>
        </header>

        <section className={styles.contactLinks}>
          <a href="mailto:ayan.sen1315@gmail.com" className={styles.contactButton}>
            ayan.sen1315@gmail.com
          </a>

          {/* --- SOCIAL LINKS UPDATED TO BUTTONS --- */}
          <div className={styles.contactSocials}>
            <a 
              href="https://github.com/Ayan-1315" 
              target="_blank" 
              rel="noopener noreferrer" 
              className={styles.socialButton}
              aria-label="GitHub"
            >
              <FontAwesomeIcon icon={faGithub} />
            </a>
            <a 
              href="https://www.linkedin.com/in/ayan-sen-1315abc" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.socialButton}
              aria-label="LinkedIn"
            >
              <FontAwesomeIcon icon={faLinkedinIn} />
            </a>
            <a 
              href="https://x.com/Ayansen1315" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.socialButton}
              aria-label="X (Twitter)"
            >
              <FontAwesomeIcon icon={faXTwitter} />
            </a>
          </div>
        </section>
      </div> 
    </div>
  );
}