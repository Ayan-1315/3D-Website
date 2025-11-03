import React from 'react';
import { Html, useProgress } from '@react-three/drei';

export default function Loader() {
  const { progress } = useProgress();

  return (
    <Html center>
      <div className="loader-container">
        {/* These divs will be animated by CSS to create particles */}
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        
        <div className="loader-content">
          <div className="progress-wrapper">
            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="progress-text">
            {progress.toFixed(0)}%
          </div>
        </div>
      </div>
    </Html>
  );
}