// src/pages/ContactPage.jsx
import React, { useRef, useEffect } from 'react';
import './HomePage.css';

export default function ContactPage({ setScene }) {
  const titleRef = useRef(null);

  useEffect(() => {
    // no special 3D scene for contact page (or you can add one)
    setScene(null);
    return () => setScene(null);
  }, [setScene]);

  return (
    <div className="page-content">
      <div className="paper-overlay" />
      <h1 ref={titleRef} className="sumi-title">Contact</h1>
      <p className="lead">Reach out: you@domain.tld</p>
      <form style={{ marginTop: 24 }} onSubmit={(e) => e.preventDefault()}>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Name
          <input style={{ display: 'block', padding: 8, marginTop: 6, width: '100%' }} />
        </label>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Message
          <textarea style={{ display: 'block', padding: 8, marginTop: 6, width: '100%' }} rows={6} />
        </label>
        <button style={{ padding: '8px 14px' }}>Send</button>
      </form>
    </div>
  );
}
