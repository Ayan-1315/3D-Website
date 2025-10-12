// src/components/MouseBrushStroke.jsx
import { useEffect, useRef } from 'react';

/**
 * Body-appended mouse brush. Appends a top-level canvas to document.body so it's always visible.
 * Leaves a short-lived watermark (residual ink) that fades away a few seconds after pointer stops.
 */
export default function MouseBrushStroke({
  minWidth = 3,
  maxWidth = 36,
  smoothing = 0.88,
  baseFadeAlpha = 0.03, // normal fade
  watermarkHoldMs = 900, // how long to preserve watermark before starting stronger fade
  watermarkFadeMs = 900, // fade duration
  idleResetMs = 220,
}) {
  const canvasRef = useRef(null);
  const offRef = useRef(null);
  const ptsRef = useRef([]);
  const widthEMA = useRef(maxWidth);
  const running = useRef(true);
  const lastMoveAt = useRef(0);
  const fadeAlpha = useRef(baseFadeAlpha);
  const watermarkTimer = useRef(null);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.className = 'sumi-mouse-canvas';
    Object.assign(canvas.style, {
      position: 'fixed',
      left: '0px',
      top: '0px',
      width: '100vw',
      height: '100vh',
      zIndex: '2147483647',
      pointerEvents: 'none',
      background: 'transparent',
      display: 'block',
      visibility: 'visible',
      opacity: '1',
    });
    document.body.appendChild(canvas);
    canvasRef.current = canvas;

    const ctx = canvas.getContext('2d', { alpha: true });

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
    window.addEventListener('resize', resize);

    // points helpers
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

    // render loop
    let rafId = null;
    const render = () => {
      if (!running.current) return;

      const offc = offRef.current.ctx;
      offc.save();
      offc.globalCompositeOperation = 'destination-out';
      offc.fillStyle = `rgba(0,0,0,${fadeAlpha.current})`;
      offc.fillRect(0, 0, cssW, cssH);
      offc.restore();

      ctx.clearRect(0, 0, cssW, cssH);
      ctx.drawImage(offRef.current.canvas, 0, 0, cssW, cssH);

      rafId = requestAnimationFrame(render);
    };
    render();

    // watermark fade orchestration
    const scheduleWatermarkFade = () => {
      if (watermarkTimer.current) clearTimeout(watermarkTimer.current);
      // hold watermark low fade for a bit (preserve a mark)
      fadeAlpha.current = baseFadeAlpha * 0.25;
      watermarkTimer.current = setTimeout(() => {
        // ramp to a stronger fade to clear mark over watermarkFadeMs
        const steps = 18;
        const start = fadeAlpha.current;
        const target = baseFadeAlpha * 6.0; // stronger clearing
        let step = 0;
        const tick = () => {
          step++;
          fadeAlpha.current = start + (target - start) * (step / steps);
          if (step < steps) {
            requestAnimationFrame(tick);
          } else {
            // after fully faded, restore base fade
            fadeAlpha.current = baseFadeAlpha;
          }
        };
        tick();
      }, watermarkHoldMs);
    };

    // pointer handlers
    const onPointerMove = (e) => {
      const now = performance.now();
      if (now - lastMoveAt.current > idleResetMs) {
        widthEMA.current = maxWidth;
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
      widthEMA.current = maxWidth;
      addPoint(e.clientX, e.clientY);
      lastMoveAt.current = performance.now();
    };

    const onPointerLeaveOrUp = () => {
      lastMoveAt.current = performance.now();
      // start watermark fade cycle
      scheduleWatermarkFade();
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerLeaveOrUp);
    window.addEventListener('pointerleave', onPointerLeaveOrUp);

    const idleChecker = setInterval(() => {
      const now = performance.now();
      if (now - lastMoveAt.current > idleResetMs) {
        widthEMA.current = maxWidth;
        ptsRef.current = [];
      }
    }, 160);

    return () => {
      running.current = false;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerLeaveOrUp);
      window.removeEventListener('pointerleave', onPointerLeaveOrUp);
      window.removeEventListener('resize', resize);
      if (rafId) cancelAnimationFrame(rafId);
      clearInterval(idleChecker);
      if (watermarkTimer.current) clearTimeout(watermarkTimer.current);
      try {
        if (canvas && canvas.parentElement) canvas.parentElement.removeChild(canvas);
      } catch (err) {err(console.warn(err))}
    };
  }, [minWidth, maxWidth, smoothing, baseFadeAlpha, watermarkHoldMs, watermarkFadeMs, idleResetMs]);

  // This component does not render into React DOM — it's top-level canvas appended to body.
  return null;
}
