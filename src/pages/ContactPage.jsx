import React, { useEffect } from "react";
// import "./ContactPage.css"; // You will need to create this CSS file

export default function ContactPage({ setScene }) {

  useEffect(() => {
    // ✅ CORRECT: This is the fix.
    // This clears any 3D objects from the scene when you visit the Contact page.
    setScene(null);
  }, [setScene]);

  return (
    // This HTML is rendered in the UI, which is correct
    <div className="page-content contact-page">
      <header className="hero-block">
        <h1 className="sumi-title">Get In Touch</h1>
        <p className="lead">
          You can find me on GitHub, Twitter, and LinkedIn,
          or send me an email.
        </p>
      </header>
    </div>
  );
}