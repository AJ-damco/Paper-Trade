import { useEffect, useRef } from "react";

/**
 * Stripe-inspired animated beam background.
 * Draws 4 soft colored rays from the top-right corner,
 * each slowly oscillating at a different frequency.
 */

const BEAMS = [
  // { h, s, l } color · alpha · base angle (deg) · swing (deg) · period (s)
  { h: 218, s: 75, l: 62, alpha: 0.78, base: 216, swing: 12, period: 9  }, // blue
  { h: 275, s: 65, l: 60, alpha: 0.72, base: 200, swing: 10, period: 11 }, // violet
  { h: 328, s: 85, l: 60, alpha: 0.68, base: 184, swing: 14, period: 7  }, // pink
  { h: 22,  s: 95, l: 55, alpha: 0.74, base: 167, swing: 11, period: 10 }, // orange
];

export default function StripeWave({ isDark = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let rafId;
    const t0 = performance.now();

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    function render(ts) {
      const elapsed = (ts - t0) / 1000;
      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      // All rays originate from the top-right corner
      const ox = W;
      const oy = 0;
      const len = Math.hypot(W, H) * 1.5;

      for (const beam of BEAMS) {
        // Each beam gently oscillates around its base angle
        const angle = beam.base + Math.sin((elapsed / beam.period) * Math.PI * 2) * beam.swing;
        const rad   = (angle * Math.PI) / 180;
        const half  = (9 * Math.PI) / 180; // ±9° beam width

        // Wedge from origin to far edge
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(ox + Math.cos(rad - half) * len, oy + Math.sin(rad - half) * len);
        ctx.lineTo(ox + Math.cos(rad + half) * len, oy + Math.sin(rad + half) * len);
        ctx.closePath();

        // Gradient: bright at origin → transparent at far end
        const endX = ox + Math.cos(rad) * len;
        const endY = oy + Math.sin(rad) * len;
        const a    = isDark ? Math.min(beam.alpha * 1.15, 1) : beam.alpha;

        const grad = ctx.createLinearGradient(ox, oy, endX, endY);
        grad.addColorStop(0,    `hsla(${beam.h},${beam.s}%,${beam.l}%,${a.toFixed(2)})`);
        grad.addColorStop(0.45, `hsla(${beam.h},${beam.s}%,${beam.l}%,${(a * 0.5).toFixed(2)})`);
        grad.addColorStop(1,    `hsla(${beam.h},${beam.s}%,${beam.l}%,0)`);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      rafId = requestAnimationFrame(render);
    }

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, [isDark]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        // Blur softens the sharp beam edges → Stripe's feathered glow look
        filter: "blur(36px) saturate(1.25)",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    </div>
  );
}
