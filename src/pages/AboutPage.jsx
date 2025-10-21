import React, { useEffect } from "react";
import styles from "./AboutPage.module.css";

export default function AboutPage({ setScene, seasonalShadow }) {
  useEffect(() => {
    setScene(null);
  }, [setScene]);

  return (
    <div className={styles.aboutPage}>
      <div className={styles.paperOverlay} />

      <header className={styles.heroBlock}>
        <h1 className={styles.sumiTitle} style={{ textShadow: seasonalShadow }}>
          About — Ayan
        </h1>
        <p className={styles.lead}>
          I'm Ayan — a full-stack developer and game-maker who builds interactive,
          generative web experiences. I combine 3D graphics, physics, and clean UI.
        </p>
      </header>

      <section className={styles.aboutContent}>
        <p className={styles.paragraph}>
          I came through a B.Tech in Computer Science and fine-tuned my craft by
          shipping projects across real-time systems, web graphics, and AI.
        </p>

        <p className={styles.paragraph}>
          <strong>What I build:</strong> interactive 3D websites and real-time apps...
        </p>

        <ul className={styles.projectList}>
          <li><strong>3D personal site</strong> — the site you're on.</li>
          <li><strong>Snuger</strong> — real-time chat (Socket.io + Fastify + MongoDB).</li>
        </ul>
      </section>

      <footer style={{ marginTop: "auto", padding: "40px var(--pad)" }}>
        <small className={styles.footerSmall}>Last updated: October 21, 2025</small>
      </footer>
    </div>
  );
}
