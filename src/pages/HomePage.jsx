// src/pages/HomePage.jsx
import React, { useRef, useMemo, useEffect } from 'react';
import { Physics } from '@react-three/rapier';
import Leaf from '../components/Leaf.jsx';
import DomCollider from '../components/DomCollider.jsx';
import './HomePage.css';
import * as THREE from 'three';

const LEAF_COUNT = 36;

function HomePageScene({ titleRef, subtitleRef }) {
  // spawn leaves in a band above the viewport, varied z for depth
  const leafSpawns = useMemo(() => {
    const arr = [];
    for (let i = 0; i < LEAF_COUNT; i++) {
      const x = THREE.MathUtils.randFloatSpread(14); // spread across horizontal
      const y = 10 + Math.random() * 6; // above view
      const z = -6 + Math.random() * 8; // depth from -6 .. +2
      const size = 0.6 + Math.random() * 1.2;
      arr.push({ position: [x, y, z], size });
    }
    return arr;
  }, []);

  return (
    <Physics gravity={[0, -3.8, 0]}>
      {leafSpawns.map((s, i) => (
        <Leaf key={i} position={s.position} size={s.size} season={'spring'} />
      ))}
      {/* create physical boxes for text elements */}
      <DomCollider elementRef={titleRef} />
      <DomCollider elementRef={subtitleRef} />
    </Physics>
  );
}

export default function HomePage({ setScene }) {
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);

  useEffect(() => {
    setScene(<HomePageScene titleRef={titleRef} subtitleRef={subtitleRef} />);
    return () => setScene(null);
  }, [setScene]);

  return (
    <div className="page-content">
      <div className="paper-overlay" />
      <h1 ref={titleRef} className="sumi-title">墨</h1>
      <h2 ref={subtitleRef} className="sumi-sub">Sumi — Home</h2>
      <p className="lead">A simple demonstration of sumi ink trails and seasonal leaves.</p>
    </div>
  );
}
