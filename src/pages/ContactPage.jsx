import React, { useEffect } from "react";
import styles from "./ContactPage.module.css";

export default function ContactPage({ setScene, seasonalShadow }) {
  useEffect(() => {
    setScene(null);
  }, [setScene]);

  return (
    <div className={styles.pageContent}>
      <div className={styles.paperOverlay} /> {/* optional: create paperOverlay class if shared */}
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
          your-email@example.com
        </a>

        <div className={styles.contactSocials}>
          <span>Find me on:</span>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">X (Twitter)</a>
        </div>
      </section>
    </div>
  );
}
