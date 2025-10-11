import React, { useRef, useMemo, useEffect } from 'react';
import { Physics } from '@react-three/rapier';
import Leaf from '../components/Leaf';
import DomCollider from '../components/DomCollider';
import './HomePage.css';

const LEAF_COUNT = 36;

function HomePageScene({ titleRef, subtitleRef }) {
  const leafPositions = useMemo(() => {
    const arr = [];
    for (let i = 0; i < LEAF_COUNT; i++) {
      arr.push([(Math.random() - 0.5) * 12, 6 + Math.random() * 4, (Math.random() - 0.5) * 3]);
    }
    return arr;
  }, []);

  return (
    <Physics gravity={[0, -1.6, 0]}>
      {leafPositions.map((pos, i) => (
        <Leaf key={i} position={pos} />
      ))}
      <DomCollider elementRef={titleRef} />
      <DomCollider elementRef={subtitleRef} />
    </Physics>
  );
}

export default function HomePage({ setScene }) {
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);

  useEffect(() => {
    // attach the 3D scene (React element) to app canvas
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
