import React, { useEffect, useRef } from "react";

/**
 * MouseTrail.jsx
 * - full-screen canvas following mouse
 * - draws black ink-like brush stroke
 * - now renders BEHIND main scene
 */
export default function MouseTrail() {
  const canvasRef = useRef(null);
  const pointsRef = useRef([]);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.style.position = "fixed";
    canvas.style.left = 0;
    canvas.style.top = 0;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "0"; // changed from 40 → 0 (behind hero image)
    document.body.appendChild(canvas);
    canvasRef.current = canvas;

    const ctx = canvas.getContext("2d");

    const resize = () => {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    
    // eslint-disable-next-line
    let isDown = false;
    const addPoint = (x, y, pressure = 1) => {
      pointsRef.current.push({ x, y, t: performance.now(), p: pressure });
      if (pointsRef.current.length > 240) pointsRef.current.shift();
    };

    const handleMove = (e) => {
      const x = e.clientX ?? (e.touches && e.touches[0].clientX);
      const y = e.clientY ?? (e.touches && e.touches[0].clientY);
      if (x == null) return;
      addPoint(x, y, e.pressure ?? 1);
      isDown = true;
    };
    const handleUp = () => {
      isDown = false;
    };

    window.addEventListener("pointermove", handleMove, { passive: true });
    window.addEventListener("pointerdown", handleMove, { passive: true });
    window.addEventListener("pointerup", handleUp);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);

      // fade canvas slightly each frame for a trailing effect
      ctx.fillStyle = "rgba(250,250,247,0.06)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const pts = pointsRef.current;
      if (!pts.length) return;

      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];

        const age = (performance.now() - p0.t) / 1200;
        const alpha = Math.max(0, 1 - age);
        const width = Math.max(1.2, 18 * (1 - age * 0.9) * (p1.p || 1));

        ctx.strokeStyle = `rgba(10,10,10,${0.92 * alpha})`;
        ctx.lineWidth = width;

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        const midX = (p0.x + p1.x) / 2;
        const midY = (p0.y + p1.y) / 2;
        ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
        ctx.stroke();
      }

      const now = performance.now();
      pointsRef.current = pts.filter((p) => now - p.t < 1800);
    };

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerdown", handleMove);
      window.removeEventListener("pointerup", handleUp);
      if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, []);

  return null;
}
