"use client";

import { useEffect, useRef } from "react";
import { dropIntensityFor } from "../scene/warden";

/**
 * تنها بوم صحنه: لکه‌های سه‌قطره و الیاف کاغذ.
 * کار هنری حمل‌کنندهٔ معناست: تیرگی با تلاش/هم‌دستی، نبض با فشار.
 */
export function SceneCanvas({
  attempts,
  complicity,
  motif,
  reduceMotion,
  className = "",
}: {
  attempts: number;
  complicity: number;
  motif: boolean;
  reduceMotion: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let frame = 0;
    let last = 0;
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
    };
    resize();

    const strength = 0.2 + dropIntensityFor(attempts, complicity) * 0.6;

    const draw = (time: number) => {
      const width = canvas.width;
      const height = canvas.height;
      context.clearRect(0, 0, width, height);

      const drops = [
        { x: 0.16, y: 0.76, r: 0.048, tint: 0.2 },
        { x: 0.79, y: 0.6, r: 0.038, tint: 0.14 },
        { x: 0.68, y: 0.84, r: 0.032, tint: 0.1 },
      ];

      drops.forEach((drop, index) => {
        const pulse = reduceMotion
          ? 1
          : 0.94 + Math.sin(time * 0.0006 + index * 1.7) * 0.06;
        const radius = Math.max(width, height) * drop.r * pulse;
        const x = width * drop.x;
        const y = height * drop.y;
        const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(
          0,
          `rgba(94, 22, 30, ${strength * 0.62 + drop.tint * 0.25})`,
        );
        gradient.addColorStop(
          0.55,
          `rgba(115, 33, 40, ${strength * 0.3 + drop.tint * 0.1})`,
        );
        gradient.addColorStop(1, "rgba(115, 33, 40, 0)");
        context.fillStyle = gradient;
        context.beginPath();
        context.ellipse(x, y, radius, radius * 1.1, index * 0.4, 0, Math.PI * 2);
        context.fill();

        if (motif) {
          const rim = context.createRadialGradient(x, y, radius * 0.5, x, y, radius * 1.5);
          rim.addColorStop(0, "rgba(183, 120, 74, 0)");
          rim.addColorStop(0.7, `rgba(183, 120, 74, ${0.05 + index * 0.01})`);
          rim.addColorStop(1, "rgba(183, 120, 74, 0)");
          context.fillStyle = rim;
          context.beginPath();
          context.ellipse(x, y, radius * 1.5, radius * 1.65, 0, 0, Math.PI * 2);
          context.fill();
        }
      });

      // الیاف کاغذ
      context.strokeStyle = "rgba(52, 38, 22, 0.1)";
      context.lineWidth = 0.6;
      for (let index = 0; index < 26; index += 1) {
        const seed = index * 12.9898 + 4.1414;
        const local = Math.sin(seed) * 43758.5453;
        const fraction = local - Math.floor(local);
        const second = Math.sin(seed + 2.33) * 24634.6345;
        const fractionTwo = second - Math.floor(second);
        const x = fraction * width;
        const y = fractionTwo * height;
        context.beginPath();
        context.moveTo(x, y);
        context.quadraticCurveTo(
          x + 10 + fraction * 24,
          y - 3,
          x + 18 + fractionTwo * 40,
          y + 1.5,
        );
        context.stroke();
      }
    };

    const loop = (time: number) => {
      if (reduceMotion) {
        draw(0);
        return;
      }
      if (time - last > 48) {
        last = time;
        draw(time);
      }
      frame = window.requestAnimationFrame(loop);
    };

    if (reduceMotion) {
      draw(0);
      const observer = new ResizeObserver(() => {
        resize();
        draw(0);
      });
      observer.observe(canvas);
      return () => observer.disconnect();
    }

    frame = window.requestAnimationFrame(loop);
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [attempts, complicity, motif, reduceMotion]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}
