import { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';

// This component now controls the HTML loader, it doesn't render one.
export default function Loader() {
  const { progress, active } = useProgress();

  // Tracks if the assets are 100% loaded
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  
  // Tracks if the minimum 3-second timer is up
  const [timerDone, setTimerDone] = useState(false);

  // Start the 3-second timer as soon as this component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setTimerDone(true);
    }, 3000); // 3-second minimum
    return () => clearTimeout(timer);
  }, []);

  // This effect runs every time the loading progress changes
  useEffect(() => {
    // Find the HTML loader elements
    const loaderElement = document.getElementById('global-loader');
    const barElement = document.getElementById('loader-bar');
    const percentElement = document.getElementById('loader-percent');

    if (!loaderElement || !barElement || !percentElement) {
      return;
    }

    // Update the progress bar and text in the HTML
    barElement.style.width = `${progress}%`;
    percentElement.innerText = `${progress.toFixed(0)}%`;

    // Check if assets are fully loaded
    if (progress === 100 && !active) {
      setAssetsLoaded(true);
    }
  }, [progress, active]);


  // This effect runs when *either* the timer or the loader finishes
  useEffect(() => {
    // We must wait for BOTH to be true
    if (assetsLoaded && timerDone) {
      const loaderElement = document.getElementById('global-loader');
      
      // Start the fade-out animation
      loaderElement.classList.add('loaded');

      // Wait for the fade-out to finish, then remove the loader
      const fadeOutTimer = setTimeout(() => {
        loaderElement.style.display = 'none';
      }, 500); // Must match the transition duration in App.css

      return () => clearTimeout(fadeOutTimer);
    }
  }, [assetsLoaded, timerDone]); // Only runs when these values change

  return null; // This component doesn't render any 3D object
}