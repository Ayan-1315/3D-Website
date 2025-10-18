import { useEffect, useRef } from "react";

/**
 * MouseBrushStroke with mobile touch support.
 * - Appends a top-level canvas to document.body (so it's never hidden)
 * - Uses pointer events where available; falls back to touch events for mobile
 * - Starts a bold stroke on pointer/touch start, then thins with velocity
 * - Leaves a short-lived watermark after the user lifts the finger/mouse
 */
export default function MouseBrushStroke({
  brushColor = "rgba(8,8,8,0.995)", // <-- ADDED THIS PROP
  minWidth = 3,
  maxWidth = 36,
  smoothing = 0.88,
  baseFadeAlpha = 0.03,
  watermarkHoldMs = 500,
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

  // ADDED: Ref to hold the current color
  const colorRef = useRef(brushColor);

  // ADDED: Effect to update the color ref when the prop changes
  useEffect(() => {
    colorRef.current = brushColor;
  }, [brushColor]);

  useEffect(() => {
    // create canvas on body
    const canvas = document.createElement("canvas");
    canvas.className = "sumi-mouse-canvas";
    canvas.setAttribute("aria-hidden", "true");
    Object.assign(canvas.style, {
      position: "fixed",
      left: "0",
      top: "0",
      width: "100vw",
      height: "100vh",
      zIndex: "2147483647",
      pointerEvents: "none",
      background: "transparent",
      display: "block",
      visibility: "visible",
      touchAction: "auto",
    });
    document.body.appendChild(canvas);
    canvasRef.current = canvas;

    const ctx = canvas.getContext("2d", { alpha: true });

    const off = document.createElement("canvas");
    const offCtx = off.getContext("2d", { alpha: true });
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

      offCtx.lineCap = "round";
      offCtx.lineJoin = "round";

      ptsRef.current = [];
      widthEMA.current = maxWidth;
    };

    resize();
    window.addEventListener("resize", resize);

    // helpers
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
      const oc = offRef.current.ctx;
      oc.save();
      oc.lineWidth = Math.max(1, w);
      // MODIFIED: Use the color from the ref
      oc.strokeStyle = colorRef.current;
      oc.shadowBlur = Math.min(14, w * 0.6);
      oc.shadowColor = "rgba(0,0,0,0.6)"; // Kept shadow black for depth
      oc.beginPath();
      oc.moveTo(p0.x, p0.y);
      const cx = (p1.x + p2.x) / 2;
      const cy = (p1.y + p2.y) / 2;
      oc.quadraticCurveTo(p1.x, p1.y, cx, cy);
      oc.stroke();
      oc.restore();
    };

    // render loop
    let rafId = null;
    const render = () => {
      if (!running.current) return;
      const offc = offRef.current.ctx;
      offc.save();
      offc.globalCompositeOperation = "destination-out";
      offc.fillStyle = `rgba(0,0,0,${fadeAlpha.current})`;
      offc.fillRect(0, 0, cssW, cssH);
      offc.restore();

      ctx.clearRect(0, 0, cssW, cssH);
      ctx.drawImage(offRef.current.canvas, 0, 0, cssW, cssH);

      rafId = requestAnimationFrame(render);
    };
    render();

    // watermark fade
    const scheduleWatermarkFade = () => {
      if (watermarkTimer.current) clearTimeout(watermarkTimer.current);
      fadeAlpha.current = baseFadeAlpha * 0.25;
      watermarkTimer.current = setTimeout(() => {
        const steps = 18;
        const start = fadeAlpha.current;
        const target = baseFadeAlpha * 6.0;
        let step = 0;
        const tick = () => {
          step++;
          fadeAlpha.current = start + (target - start) * (step / steps);
          if (step < steps) requestAnimationFrame(tick);
          else fadeAlpha.current = baseFadeAlpha;
        };
        tick();
      }, watermarkHoldMs);
    };

    // pointer handlers (primary)
    const getXYFromEvent = (e) => {
      if (e && typeof e.clientX === "number" && typeof e.clientY === "number")
        return { x: e.clientX, y: e.clientY };
      return null;
    };

    const onPointerMove = (e) => {
      const pt = getXYFromEvent(e);
      if (!pt) return;
      const now = performance.now();
      if (now - lastMoveAt.current > idleResetMs) {
        widthEMA.current = maxWidth;
        ptsRef.current = [];
      }
      lastMoveAt.current = now;

      addPoint(pt.x, pt.y);
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
      const pt = getXYFromEvent(e);
      if (!pt) return;
      widthEMA.current = maxWidth;
      addPoint(pt.x, pt.y);
      lastMoveAt.current = performance.now();
    };

    const onPointerUpOrLeave = () => {
      lastMoveAt.current = performance.now();
      scheduleWatermarkFade();
    };

    // touch fallbacks
    const getXYFromTouch = (touchEvent) => {
      if (!touchEvent || !touchEvent.touches || touchEvent.touches.length === 0) return null;
      const t = touchEvent.touches[0];
      return { x: t.clientX, y: t.clientY };
    };

    const onTouchStart = (e) => {
      const pt = getXYFromTouch(e);
      if (!pt) return;
      widthEMA.current = maxWidth;
      addPoint(pt.x, pt.y);
      lastMoveAt.current = performance.now();
    };

    const onTouchMove = (e) => {
      const pt = getXYFromTouch(e);
      if (!pt) return;
      const now = performance.now();
      if (now - lastMoveAt.current > idleResetMs) {
        widthEMA.current = maxWidth;
        ptsRef.current = [];
      }
      lastMoveAt.current = now;
      addPoint(pt.x, pt.y);
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

    const onTouchEnd = () => {
      lastMoveAt.current = performance.now();
      scheduleWatermarkFade();
    };

    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    document.addEventListener("pointerup", onPointerUpOrLeave);
    document.addEventListener("pointerleave", onPointerUpOrLeave);

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });

    const idleChecker = setInterval(() => {
      const now = performance.now();
      if (now - lastMoveAt.current > idleResetMs) {
        widthEMA.current = maxWidth;
        ptsRef.current = [];
      }
    }, 160);

    return () => {
      running.current = false;

      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointerup", onPointerUpOrLeave);
      document.removeEventListener("pointerleave", onPointerUpOrLeave);

      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);

      window.removeEventListener("resize", resize);
      clearInterval(idleChecker);
      if (watermarkTimer.current) clearTimeout(watermarkTimer.current);
      if (rafId) cancelAnimationFrame(rafId);
      try {
        if (canvas && canvas.parentElement) canvas.parentElement.removeChild(canvas);
      } catch (err) {err}
    };
  }, [minWidth, maxWidth, smoothing, baseFadeAlpha, watermarkHoldMs, idleResetMs]);

  return null;
}