// src/components/MouseBrushStroke.jsx
import React, { useEffect, useRef } from 'react';

/**
 * MouseBrushStroke
 * - Fixed DPI / scaling issues so strokes are visible on all displays
 * - Responsive sampling and smoothing for a sumi-ink look
 * - Uses an offscreen canvas to accumulate strokes (trails fade out)
 */
export default function MouseBrushStroke({
  minWidth = 3,
  maxWidth = 36,
  smoothing = 0.88,
  fadeAlpha = 0.03,
  zIndex = 9999,
}) {
  const canvasRef = useRef(null);
  const offRef = useRef(null);
  const ptsRef = useRef([]);
  const widthEMA = useRef(maxWidth);
  const running = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });

    // Create offscreen canvas which accumulates strokes (gives trailing)
    const off = document.createElement('canvas');
    const offCtx = off.getContext('2d', { alpha: true });
    offRef.current = { canvas: off, ctx: offCtx };

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    let cssW = window.innerWidth;
    let cssH = window.innerHeight;

    const resize = () => {
      cssW = window.innerWidth;
      cssH = window.innerHeight;

      // Actual pixel size
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;

      // Reset transform and scale to use CSS pixel coords in drawing calls
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      off.width = Math.round(cssW * dpr);
      off.height = Math.round(cssH * dpr);
      off.style.width = `${cssW}px`;
      off.style.height = `${cssH}px`;
      offCtx.setTransform(1, 0, 0, 1, 0, 0);
      offCtx.scale(dpr, dpr);

      offCtx.lineCap = 'round';
      offCtx.lineJoin = 'round';
      ptsRef.current = []; // reset points so stroke resumes cleanly
    };
    resize();

    const addPoint = (x, y) => {
      ptsRef.current.push({ x, y, t: performance.now() });
      if (ptsRef.current.length > 64) ptsRef.current.shift();
    };

    const computeVel = () => {
      const pts = ptsRef.current;
      const n = pts.length;
      if (n < 2) return 0;
      let total = 0;
      const samples = Math.min(6, n - 1);
      for (let i = 0; i < samples; i++) {
        const a = pts[n - 1 - i];
        const b = pts[n - 2 - i];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dt = Math.max(1, a.t - b.t);
        total += Math.sqrt(dx * dx + dy * dy) / dt;
      }
      return total / samples;
    };

    const velToWidth = (v) => {
      // map velocity to stroke width (faster -> thinner)
      const scale = 0.7;
      const inv = 1 / (1 + v * 1500 * scale);
      const wVal = minWidth + (maxWidth - minWidth) * inv;
      const prev = widthEMA.current;
      const smoothed = prev * smoothing + wVal * (1 - smoothing);
      widthEMA.current = smoothed;
      return Math.max(1, smoothed);
    };

    const drawSegment = (p0, p1, p2, w) => {
      const c = offRef.current.ctx;
      c.save();
      c.lineWidth = Math.max(1, w);
      // Sumi ink: nearly-black stroke with subtle shadow for softness
      c.strokeStyle = 'rgba(8,8,8,0.995)';
      c.shadowBlur = Math.min(14, w * 0.6);
      c.shadowColor = 'rgba(0,0,0,0.6)';
      c.beginPath();
      c.moveTo(p0.x, p0.y);
      // Quadratic smoothing: curve from p0 -> p2 with p1 as control
      const cx = (p1.x + p2.x) / 2;
      const cy = (p1.y + p2.y) / 2;
      c.quadraticCurveTo(p1.x, p1.y, cx, cy);
      c.stroke();
      c.restore();
    };

    let rafId = null;
    const render = () => {
      if (!running.current) return;

      // Fade the offscreen canvas slightly (destination-out) for trail dissolve
      const offc = offRef.current.ctx;
      offc.save();
      offc.globalCompositeOperation = 'destination-out';
      // fill using CSS pixel extents (off canvas is scaled internally)
      offc.fillStyle = `rgba(0,0,0,${fadeAlpha})`;
      offc.fillRect(0, 0, cssW, cssH);
      offc.restore();

      // Clear visible canvas (in CSS pixel coords), then draw accumulated offscreen
      ctx.clearRect(0, 0, cssW, cssH);
      // drawImage will draw the offscreen content scaled appropriately because
      // both contexts are scaled with ctx.scale(dpr,dpr)
      ctx.drawImage(offRef.current.canvas, 0, 0, cssW, cssH);

      rafId = requestAnimationFrame(render);
    };
    render();

    // pointer events
    const onPointerMove = (e) => {
      // Use clientX/clientY which are in CSS pixels
      addPoint(e.clientX, e.clientY);
      const pts = ptsRef.current;
      if (pts.length < 3) return;
      const n = pts.length;
      const p0 = pts[n - 3];
      const p1 = pts[n - 2];
      const p2 = pts[n - 1];
      const v = computeVel();
      const w = velToWidth(v);
      drawSegment(p0, p1, p2, w);
    };

    const onPointerDown = (e) => {
      addPoint(e.clientX, e.clientY);
    };

    // Ensure we have initial pointer registration when the user moves over the page
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('resize', resize);

    return () => {
      running.current = false;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', resize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [minWidth, maxWidth, smoothing, fadeAlpha, zIndex]);

  // pointerEvents none so it doesn't block clicks
  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex, pointerEvents: 'none' }}
      aria-hidden
    />
  );
}
