import React, { useEffect, useState } from "react";
import styles from "./ContactPage.module.css"; 
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";

export default function ContactPage({ setScene, seasonalShadow }) {
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    setScene(null);
  }, [setScene]);

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Feedback submitted. Thank you!");
    setFeedback("");
  };

  return (
    <div className={styles.contactPage} role="main" aria-label="Contact page">
      <div className={styles.paperOverlay} /> 
      
      {/* This is now the fixed-size card */}
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

        {/* --- NEW Scrollable Wrapper --- */}
        <div className={styles.scrollableArea}>
          <section className={styles.contactSection}>

              <a href="mailto:ayan.sen1315@gmail.com" className={styles.contactButton}>
                <FontAwesomeIcon icon={faEnvelope} className={styles.emailIcon} />
                <span>ayan.sen1315@gmail.com</span>
              </a>

              <div className={styles.divider}>
                <span>or</span>
              </div>

              <h3 className={styles.formHeading}>Report an issue or leave feedback</h3>
              <p className={styles.formIntro}>
                This project is actively maintained. Your feedback on performance, 
                design, or any bugs you find is invaluable.
              </p>

              <form 
                className={styles.feedbackForm} 
                onSubmit={handleSubmit}
                name="feedback"
                data-netlify="true"
              >
                <input type="hidden" name="form-name" value="feedback" />
                <label htmlFor="feedback-box" className="visually-hidden">Bug Report or Feedback</label>
                <textarea 
                  id="feedback-box"
                  name="message"
                  className={styles.feedbackBox}
                  placeholder="Type your feedback here..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  required
                />
                <button type="submit" className={styles.reportButton}>
                  <span className={styles.buttonText}>Report</span>
                </button>
              </form>
          
          </section>
        </div> {/* --- End .scrollableArea --- */}
      </div> {/* --- End .contentInner --- */}
    </div>
  );
}