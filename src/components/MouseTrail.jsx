import React, { useEffect } from "react";

/**
 * MouseTrail.jsx — black ink with red halo
 *
 * - No permanent marks (canvas fades)
 * - Stronger, black core stroke
 * - Soft red shadow/halo around stroke (matches sword)
 * - Prevents initial blobs and jitter
 */

export default function MouseTrail() {
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.style.position = "fixed";
    canvas.style.left = 0;
    canvas.style.top = 0;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "5";
    document.body.appendChild(canvas);

    const DPR = Math.max(1, window.devicePixelRatio || 1);
    const ctx = canvas.getContext("2d", { alpha: true });

    const resize = () => {
      const w = Math.floor(window.innerWidth * DPR);
      const h = Math.floor(window.innerHeight * DPR);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
      }
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    let lastX = 0;
    let lastY = 0;
    let lastT = 0;
    let hasLast = false;
    let animating = false;
    let raf = null;
    let idleTimeout = null;

    const PAGE_FADE_COLOR = "rgba(250,248,244,";
    const FADE_ALPHA = 0.13;
    const MOVEMENT_THRESHOLD = 1.6;

    const fadeStep = () => {
      ctx.fillStyle = PAGE_FADE_COLOR + FADE_ALPHA + ")";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const drawSegment = (x, y, px, py, width, alpha) => {
      // draw core black stroke
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = `rgba(10,10,10,${alpha})`;
      ctx.lineWidth = width;
      ctx.shadowColor = "rgba(0,0,0,0)"; // no shadow for core
      ctx.shadowBlur = 0;
      ctx.beginPath();
      const midX = (px + x) / 2;
      const midY = (py + y) / 2;
      ctx.moveTo(px, py);
      ctx.quadraticCurveTo(px, py, midX, midY);
      ctx.stroke();
      ctx.restore();

      // draw soft red halo using shadow and lighter stroke
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = `rgba(255,40,40,${Math.max(0.08, alpha * 0.9)})`;
      ctx.lineWidth = Math.max(6, width * 1.6);
      // soft halo with shadow blur to spread the glow
      ctx.shadowColor = "rgba(255,32,32,0.35)";
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.quadraticCurveTo(px, py, midX, midY);
      ctx.stroke();
      ctx.restore();

      // a subtle faint outer glow stroke (very soft)
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = `rgba(255,80,80,${Math.max(0.02, alpha * 0.45)})`;
      ctx.lineWidth = Math.max(14, width * 2.6);
      ctx.shadowColor = "rgba(255,40,40,0.18)";
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.quadraticCurveTo(px, py, midX, midY);
      ctx.stroke();
      ctx.restore();
    };

    const handlePointerMove = (e) => {
      const x = e.clientX ?? (e.touches && e.touches[0]?.clientX);
      const y = e.clientY ?? (e.touches && e.touches[0]?.clientY);
      if (typeof x !== "number" || typeof y !== "number") return;

      const now = performance.now();

      if (!hasLast) {
        lastX = x;
        lastY = y;
        lastT = now;
        hasLast = true;
        if (!animating) {
          animating = true;
          raf = requestAnimationFrame(frameLoop);
        }
        return;
      }

      const dx = x - lastX;
      const dy = y - lastY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MOVEMENT_THRESHOLD) {
        lastX = x;
        lastY = y;
        lastT = now;
        return;
      }

      const dt = Math.max(1, now - lastT);
      const speed = dist / dt;
      const width = Math.max(1.2, Math.min(20, 14 - speed * 8));
      const alpha = Math.max(0.08, Math.min(0.28, 0.16 - speed * 0.02 + (Math.random() - 0.5) * 0.03));

      drawSegment(x, y, lastX, lastY, width, alpha);

      lastX = x;
      lastY = y;
      lastT = now;

      if (!animating) {
        animating = true;
        raf = requestAnimationFrame(frameLoop);
      }

      if (idleTimeout) clearTimeout(idleTimeout);
      idleTimeout = setTimeout(() => {
        setTimeout(() => {
          if (raf) cancelAnimationFrame(raf);
          raf = null;
          animating = false;
          hasLast = false;
          ctx.fillStyle = PAGE_FADE_COLOR + (FADE_ALPHA * 1.6) + ")";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }, 120);
      }, 220);
    };

    const frameLoop = () => {
      fadeStep();
      raf = requestAnimationFrame(frameLoop);
    };

    const handlePointerUp = () => {
      if (idleTimeout) clearTimeout(idleTimeout);
      idleTimeout = setTimeout(() => {
        if (raf) cancelAnimationFrame(raf);
        raf = null;
        animating = false;
        hasLast = false;
        ctx.fillStyle = PAGE_FADE_COLOR + (FADE_ALPHA * 1.6) + ")";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }, 140);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("touchend", handlePointerUp);

    // initial fill (clean)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = PAGE_FADE_COLOR + "1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = PAGE_FADE_COLOR + (FADE_ALPHA * 0.6) + ")";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("touchend", handlePointerUp);
      if (raf) cancelAnimationFrame(raf);
      if (idleTimeout) clearTimeout(idleTimeout);
      // eslint-disable-next-line
      try { canvas.remove(); } catch (e) {}
    };
  }, []);

  return null;
}
