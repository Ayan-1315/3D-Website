import { useEffect, useMemo, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";
import "./Loader.css";

const COLORS = { pink: "#ff4d8d", red: "#ff4d4d", yellow: "#ffcc33" };
const BAR_KEYS = ["pink", "red", "yellow"];

export default function Loader() {
  const { active, progress: realProgress = 0, errors } = useProgress();
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  const barKey = useMemo(
    () => BAR_KEYS[(Math.random() * BAR_KEYS.length) | 0],
    []
  );
  const barColor = COLORS[barKey];
  // show ONLY simulated progress on the UI (monotonic)

  // ---- simulated progress with 2–5 stops; each stop is exactly 0.7s ----
  // eslint-disable-next-line
  const sim = useRef({ p: 0, start: 0, pausedUntil: 0, stops: [], i: 0 });
  const [simPercent, setSimPercent] = useState(0);
  // eslint-disable-next-line
  const [setDisplayPercent] = useState(0); // monotonic
  const displayPercent = simPercent;

  useEffect(() => {
    const MOVE_TOTAL_MS = 4000; // total time actually moving
    const PAUSE_MS = 500; // fixed pause after each step
    const stopCount = 2 + Math.floor(Math.random() * 4); // 2..5 stops

    // choose stop points (percent) and build movement segments
    const stops = Array.from(
      { length: stopCount },
      () => 10 + Math.random() * 85
    ).sort((a, b) => a - b);

    const points = [0, ...stops, 100];
    const segments = [];
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      const len = end - start;
      segments.push({ start, end, len });
    }

    // movement time proportional to segment length
    const msPerPercent = MOVE_TOTAL_MS / 100;
    segments.forEach((s) => (s.duration = s.len * msPerPercent));

    // state
    const S = {
      idx: 0, // current segment index
      phase: "move", // "move" | "pause" | "done"
      segStartTime: 0,
      pauseEndTime: 0,
      value: 0,
    };

    let raf;
    const now = () => performance.now();

    const beginMove = () => {
      S.phase = "move";
      S.segStartTime = now();
    };
    const beginPause = () => {
      S.phase = "pause";
      S.pauseEndTime = now() + PAUSE_MS;
    };

    beginMove();

    const loop = () => {
      const t = now();

      if (S.phase === "pause") {
        if (t >= S.pauseEndTime) {
          // move to next segment
          S.idx++;
          if (S.idx >= segments.length) {
            S.phase = "done";
            S.value = 100;
            setSimPercent(100);
            return; // stop animation; last progress update already set
          }
          beginMove();
        }
        // hold value steady during pause
        raf = requestAnimationFrame(loop);
        return;
      }

      if (S.phase === "move") {
        const seg = segments[S.idx];
        const elapsed = t - S.segStartTime;
        const u = Math.min(1, seg.duration === 0 ? 1 : elapsed / seg.duration);
        S.value = seg.start + (seg.end - seg.start) * u;
        setSimPercent((prev) => Math.max(prev, S.value)); // monotonic

        if (u >= 1) {
          // finish this move; if not on last, pause; if last -> done
          if (S.idx === segments.length - 1) {
            S.phase = "done";
            S.value = 100;
            setSimPercent(100);
            return;
          }
          beginPause();
        }
        raf = requestAnimationFrame(loop);
        return;
      }
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // combine real & simulated; ensure monotonic upward
  useEffect(() => {
    const realDone =
      (errors?.length ?? 0) > 0 || (!active && realProgress >= 99.5);
    if (simPercent >= 100 && realDone) {
      setFadeOut(true);
      const t = setTimeout(() => setVisible(false), 220); // quick fade only
      return () => clearTimeout(t);
    }
  }, [simPercent, active, realProgress, errors]);

  // end as soon as we hit 100% and the R3F loader is done-ish (or errored)
  useEffect(() => {
    const realDone =
      (errors?.length ?? 0) > 0 || (!active && realProgress >= 99.5);
    if (displayPercent >= 100 && realDone) {
      setFadeOut(true); // start CSS fade immediately
      const t = setTimeout(() => setVisible(false), 220); // short, smooth fade
      return () => clearTimeout(t);
    }
  }, [displayPercent, active, realProgress, errors]);

  if (!visible) return null;

  return (
    <div className={`leafLoader ${fadeOut ? "is-fading" : ""}`}>
      <div className="leafLoader__center">
        <div className="leafRow" aria-hidden="true">
          <img
            src="/textures/leaf_pink.png"
            alt=""
            className="leafImg blink1 leaf--pink"
            style={{ filter: glow(COLORS.pink) }}
          />
          <img
            src="/textures/leaf_red.png"
            alt=""
            className="leafImg blink2 leaf--red"
            style={{ filter: glow(COLORS.red) }}
          />
          <img
            src="/textures/leaf_yellow.png"
            alt=""
            className="leafImg blink3 leaf--yellow"
            style={{ filter: glow(COLORS.yellow) }}
          />
        </div>

        {/* <div className="leafRow" aria-hidden="true">
          <img
            src="/textures/leaf_pink.png"
            alt=""
            className="leafImg leaf--pink blink1"
          />
          <img
            src="/textures/leaf_red.png"
            alt=""
            className="leafImg leaf--red blink2"
          />
          <img
            src="/textures/leaf_yellow.png"
            alt=""
            className="leafImg leaf--yellow blink3"
          />
        </div> */}

        <div className="leafBar">
          <div
            className="leafBarFill"
            style={{
              width: `${displayPercent}%`,
              background: `linear-gradient(90deg, ${barColor}, ${lighten(
                barColor,
                0.35
              )})`,
              boxShadow: barGlow(barColor),
            }}
          />
        </div>

        <div className="leafPct">{Math.floor(displayPercent)}%</div>
      </div>
    </div>
  );
}

/* helpers */
function barGlow(hex) {
  return `0 0 10px ${hex}AA, 0 0 28px ${hex}88, 0 0 56px ${hex}55`;
}
function glow(hex) {
  return `drop-shadow(0 0 6px ${hex}) drop-shadow(0 0 14px ${hex}AA) drop-shadow(0 0 28px ${hex}66)`;
}
function lighten(hex, amt = 0.3) {
  const c = hex.replace("#", "");
  const n = parseInt(c, 16);
  let r = (n >> 16) & 255,
    g = (n >> 8) & 255,
    b = n & 255;
  r = Math.min(255, Math.round(r + (255 - r) * amt));
  g = Math.min(255, Math.round(g + (255 - g) * amt));
  b = Math.min(255, Math.round(b + (255 - b) * amt));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
