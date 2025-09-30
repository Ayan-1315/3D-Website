// src/App.jsx
import React, { useState, useEffect } from 'react';
import Globe from './components/Globe';
import './App.css'; // loader styles, global page styles

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // default waiting time 3s
    const t = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {loading && (
        <div className="loader">
          <div className="spinner" />
          <p>Loading...</p>
        </div>
      )}
      <Globe />
    </>
  );
}
