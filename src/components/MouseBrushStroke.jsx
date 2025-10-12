import React, { useEffect, useRef } from 'react';

/**
 * MouseBrushStroke
 * - fixes DPI scaling
 * - resets stroke width when user resumes moving after idle
 */
export default function MouseBrushStroke({
  minWidth = 3,
  maxWidth = 36,
  smoothing = 0.88,
  fadeAlpha = 0.03,
  zIndex = 9999,
  idleResetMs = 220, // consider pointer idle if no move for this ms
}) {
  const canvasRef = useRef(null);
  const offRef = useRef(null);
  const ptsRef = useRef([]);
  const widthEMA = useRef(maxWidth);
  const running = useRef(true);
  const lastMoveAt = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });

    // offscreen canvas accumulates strokes so trail persists
    const off = document.createElement('canvas');
    const offCtx = off.getContext('2d', { alpha: true });
    offRef.current = { canvas: off, ctx: offCtx };

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    let cssW = window.innerWidth;
    let cssH = window.innerHeight;

    const resize = () => {
      cssW = window.innerWidth;
      cssH = window.innerHeight;

      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;

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

      ptsRef.current = [];
      widthEMA.current = maxWidth;
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
      c.strokeStyle = 'rgba(8,8,8,0.995)';
      c.shadowBlur = Math.min(14, w * 0.6);
      c.shadowColor = 'rgba(0,0,0,0.6)';
      c.beginPath();
      c.moveTo(p0.x, p0.y);
      const cx = (p1.x + p2.x) / 2;
      const cy = (p1.y + p2.y) / 2;
      c.quadraticCurveTo(p1.x, p1.y, cx, cy);
      c.stroke();
      c.restore();
    };

    let rafId = null;
    const render = () => {
      if (!running.current) return;

      // fade the offscreen canvas slightly for trailing
      const offc = offRef.current.ctx;
      offc.save();
      offc.globalCompositeOperation = 'destination-out';
      offc.fillStyle = `rgba(0,0,0,${fadeAlpha})`;
      offc.fillRect(0, 0, cssW, cssH);
      offc.restore();

      ctx.clearRect(0, 0, cssW, cssH);
      ctx.drawImage(offRef.current.canvas, 0, 0, cssW, cssH);

      rafId = requestAnimationFrame(render);
    };
    render();

    const idleCheckAndReset = (now) => {
      // if pointer was idle for longer than idleResetMs, reset width EMA
      if (now - lastMoveAt.current > idleResetMs) {
        widthEMA.current = maxWidth;
        // also clear pts so the next stroke is fresh
        ptsRef.current = [];
      }
    };

    const onPointerMove = (e) => {
      const now = performance.now();
      // if gap since last move larger than threshold, reset width/start fresh
      if (now - lastMoveAt.current > idleResetMs) {
        widthEMA.current = maxWidth;
        // keep points minimal so the first strokes are chunky
        ptsRef.current = [];
      }
      lastMoveAt.current = now;

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
      // pointer down should give a bold starting stroke
      widthEMA.current = maxWidth;
      addPoint(e.clientX, e.clientY);
      lastMoveAt.current = performance.now();
    };

    // If pointer stops moving, ensure next resume resets visually
    const onPointerLeaveOrUp = () => {
      lastMoveAt.current = performance.now();
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerLeaveOrUp);
    window.addEventListener('pointerleave', onPointerLeaveOrUp);
    window.addEventListener('resize', resize);

    // small interval to nudge idle reset if browser throttles RAF during inactivity
    const idleTimer = setInterval(() => idleCheckAndReset(performance.now()), 150);

    return () => {
      running.current = false;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerLeaveOrUp);
      window.removeEventListener('pointerleave', onPointerLeaveOrUp);
      window.removeEventListener('resize', resize);
      if (rafId) cancelAnimationFrame(rafId);
      clearInterval(idleTimer);
    };
  }, [minWidth, maxWidth, smoothing, fadeAlpha, zIndex, idleResetMs]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex, pointerEvents: 'none' }}
      aria-hidden
    />
  );
}
