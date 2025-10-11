import React, { useEffect } from 'react';
import './HomePage.css';

export default function AboutPage({ setScene }) {
  useEffect(() => {
    // clear any 3D scene
    setScene(null);
  }, [setScene]);

  return (
    <div className="page-content">
      <div className="paper-overlay" />
      <h1 className="sumi-title">私</h1>
      <h2 className="sumi-sub">Watashi — About</h2>
      <p className="lead">Built with React + Three.js. Ink, leaves, and a little patience.</p>
    </div>
  );
}
