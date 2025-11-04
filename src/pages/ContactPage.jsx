import React, { useEffect } from "react"; // Removed useState
import styles from "./ContactPage.module.css"; 
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";

export default function ContactPage({ setScene, seasonalShadow }) {

  useEffect(() => {
    setScene(null);
  }, [setScene]);

  // We no longer need the 'handleSubmit' function,
  // Formspree will handle the submission.

  return (
    <div className={styles.contactPage} role="main" aria-label="Contact page">
      <div className={styles.paperOverlay} /> 
      
      <div className={styles.contentInner}>
        <header className={styles.heroBlock}>
          <h1 className={styles.sumiTitle} style={{ textShadow: seasonalShadow }}>
            Contact
          </h1>
          <p className={styles.lead}>
            I'm actively exploring new opportunities. If my work resonates with 
            your team, I would be excited to discuss how I can contribute.
            <br /><br />
            This site is a living experiment—if you spot a bug or have feedback, 
            please send me a note.
          </p>
        </header>

        <div className={styles.scrollableArea}>
          <section className={styles.contactSection}>

              <a href="mailto:ayansen1315@gmail.com" className={styles.contactButton}>
                <FontAwesomeIcon icon={faEnvelope} className={styles.emailIcon} />
                <span>ayansen1315@gmail.com</span>
              </a>

              <div className={styles.divider}>
                <span>or</span>
              </div>

              <h3 className={styles.formHeading}>Report an issue or leave feedback</h3>
              <p className={styles.formIntro}>
                This project is actively maintained. Your feedback on performance, 
                design, or any bugs you find is invaluable.
              </p>

            {/* --- FORM UPDATED FOR FORMSPREE --- */}
              <form 
                className={styles.feedbackForm} 
              // 1. REMOVED onSubmit and data-netlify
              // 2. ADDED action and method
              action="https://formspree.io/f/xgvpjqwy" // <-- PASTE YOUR URL HERE
              method="POST"
              >
              {/* 3. NEW EMAIL FIELD ADDED */}
              <label htmlFor="user-email" className="visually-hidden">Your Email</label>
              <input
                id="user-email"
                type="email"
                name="email" // This 'name' is the key for the data
                className={styles.feedbackBox} // Re-using your style
                placeholder="Your email (so I can reply)"
                required
              />

              {/* 4. TEXTAREA UPDATED */}
                <label htmlFor="feedback-box" className="visually-hidden">Bug Report or Feedback</label>
                <textarea 
                  id="feedback-box"
                 name="message" // This 'name' is the key
                  className={styles.feedbackBox}
                  placeholder="Type your feedback here..."
                  required
                />

                <button type="submit" className={styles.reportButton}>
                  <span className={styles.buttonText}>Report</span>
                </button>
              </form>
          
          </section>
        </div> 
      </div> 
    </div>
  );
}