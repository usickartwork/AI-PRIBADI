"use client";

import React, { useEffect, useRef } from "react";

interface MonochromeWaves3DProps {
  className?: string;
  emblemYPercent?: number; // Approximate vertical percent where center emblem sits
}

export const MonochromeWaves3D: React.FC<MonochromeWaves3DProps> = ({
  className = "",
  emblemYPercent = 42,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Detect prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let time = 0;

    const render = () => {
      if (!ctx || width === 0 || height === 0) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      const centerX = width * 0.5;
      const horizonY = height * 0.66;
      const emblemY = height * (emblemYPercent / 100);

      // ── 1. Volumetric Light Cone from Emblem to Horizon ──
      const beamGrad = ctx.createLinearGradient(centerX, emblemY, centerX, horizonY);
      beamGrad.addColorStop(0, "rgba(255, 255, 255, 0.14)");
      beamGrad.addColorStop(0.35, "rgba(255, 255, 255, 0.08)");
      beamGrad.addColorStop(0.7, "rgba(255, 255, 255, 0.03)");
      beamGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX - 24, emblemY + 10);
      ctx.lineTo(centerX + 24, emblemY + 10);
      ctx.lineTo(centerX + 140, horizonY);
      ctx.lineTo(centerX - 140, horizonY);
      ctx.closePath();
      ctx.fillStyle = beamGrad;
      ctx.fill();

      // Soft radial glow at center emblem
      const emblemGlow = ctx.createRadialGradient(
        centerX,
        emblemY + 15,
        0,
        centerX,
        emblemY + 15,
        180
      );
      emblemGlow.addColorStop(0, "rgba(255, 255, 255, 0.16)");
      emblemGlow.addColorStop(0.4, "rgba(255, 255, 255, 0.06)");
      emblemGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = emblemGlow;
      ctx.beginPath();
      ctx.arc(centerX, emblemY + 15, 180, 0, Math.PI * 2);
      ctx.fill();

      // Soft diffuse glow at horizon center
      const horizonGlow = ctx.createRadialGradient(
        centerX,
        horizonY,
        0,
        centerX,
        horizonY,
        width * 0.35
      );
      horizonGlow.addColorStop(0, "rgba(255, 255, 255, 0.12)");
      horizonGlow.addColorStop(0.5, "rgba(255, 255, 255, 0.03)");
      horizonGlow.addColorStop(1, "rgba(5, 5, 5, 0)");
      ctx.fillStyle = horizonGlow;
      ctx.fillRect(0, horizonY - 120, width, 240);
      ctx.restore();

      // ── 2. Parametric 3D Ribbon Waves (Left & Right Flanks) ──
      const numLines = width < 768 ? 20 : 30;
      const steps = 44;

      const drawFlank = (isRight: boolean) => {
        const sign = isRight ? 1 : -1;
        const previousPoints: { x: number; y: number }[] = [];

        for (let i = 0; i < numLines; i++) {
          const norm = i / (numLines - 1); // 0 (top-most ridge) to 1 (bottom-most valley)
          const currentPoints: { x: number; y: number }[] = [];

          // Wave elevation parameters
          const baseHeight = horizonY * (0.15 + norm * 0.75);
          const ridgeArch = Math.sin(norm * Math.PI) * (height * 0.18);
          const wavePhase = time * 0.9 + i * 0.16;

          for (let s = 0; s <= steps; s++) {
            const u = s / steps; // 0 (outer edge) -> 1 (center horizon)
            
            // Non-linear horizontal projection: curving inward
            const curveFactor = Math.pow(u, 1.35);
            const x = centerX + sign * ((1 - curveFactor) * (width * 0.58) + 35 * (1 - u));

            // Vertical undulation along the ribbon
            const waveUndulation =
              Math.sin(u * 5.2 - wavePhase) * (14 * (1 - u * 0.6)) +
              Math.cos(u * 2.8 + wavePhase * 0.7) * (8 * (1 - u * 0.5));

            // Perspective descent towards horizonY
            const y =
              baseHeight +
              (horizonY - baseHeight) * Math.pow(u, 1.8) -
              ridgeArch * Math.sin(u * Math.PI) +
              waveUndulation;

            currentPoints.push({ x, y });
          }

          // Shaded polygon between consecutive ribbons for 3D depth and metallic occlusion
          if (previousPoints.length > 0) {
            ctx.beginPath();
            ctx.moveTo(previousPoints[0].x, previousPoints[0].y);
            for (let k = 1; k < previousPoints.length; k++) {
              ctx.lineTo(previousPoints[k].x, previousPoints[k].y);
            }
            for (let k = currentPoints.length - 1; k >= 0; k--) {
              ctx.lineTo(currentPoints[k].x, currentPoints[k].y);
            }
            ctx.closePath();

            // Gradient shading along the ribbon span
            const startX = previousPoints[0].x;
            const endX = centerX;
            const polyGrad = ctx.createLinearGradient(startX, 0, endX, 0);
            const shadeAlpha = (0.22 - norm * 0.14) * (1 - (i % 2) * 0.3);
            polyGrad.addColorStop(0, `rgba(18, 18, 18, ${shadeAlpha})`);
            polyGrad.addColorStop(0.5, `rgba(10, 10, 10, ${shadeAlpha * 1.2})`);
            polyGrad.addColorStop(1, "rgba(5, 5, 5, 0.95)");
            ctx.fillStyle = polyGrad;
            ctx.fill();
          }

          // Render wireframe contour stroke
          ctx.beginPath();
          ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
          for (let k = 1; k < currentPoints.length; k++) {
            // Smooth curve
            const prev = currentPoints[k - 1];
            const curr = currentPoints[k];
            const midX = (prev.x + curr.x) * 0.5;
            const midY = (prev.y + curr.y) * 0.5;
            ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
          }
          const last = currentPoints[currentPoints.length - 1];
          ctx.lineTo(last.x, last.y);

          // Stroke lighting: top ridges gleam white, lower valleys fade to dark charcoal
          const strokeGrad = ctx.createLinearGradient(
            currentPoints[0].x,
            0,
            centerX,
            0
          );
          const topPeak = 1 - norm;
          const strokeOpacity = Math.max(0.04, Math.min(0.72, topPeak * 0.65 + 0.08));
          strokeGrad.addColorStop(0, `rgba(255, 255, 255, ${strokeOpacity * 0.7})`);
          strokeGrad.addColorStop(0.35, `rgba(255, 255, 255, ${strokeOpacity})`);
          strokeGrad.addColorStop(0.75, `rgba(200, 200, 200, ${strokeOpacity * 0.45})`);
          strokeGrad.addColorStop(1, "rgba(255, 255, 255, 0.02)");

          ctx.strokeStyle = strokeGrad;
          ctx.lineWidth = norm < 0.25 ? 1.4 : 1.0;
          ctx.stroke();

          // Store current points as previous
          for (let k = 0; k < currentPoints.length; k++) {
            previousPoints[k] = currentPoints[k];
          }
        }
      };

      drawFlank(false); // Left
      drawFlank(true);  // Right

      // ── 3. Atmospheric Vignette & Deep Ground Blend ──
      // Top vignette so headline is crisp on pure dark #050505
      const topFade = ctx.createLinearGradient(0, 0, 0, height * 0.38);
      topFade.addColorStop(0, "rgba(5, 5, 5, 0.98)");
      topFade.addColorStop(0.5, "rgba(5, 5, 5, 0.7)");
      topFade.addColorStop(1, "rgba(5, 5, 5, 0)");
      ctx.fillStyle = topFade;
      ctx.fillRect(0, 0, width, height * 0.38);

      // Bottom fade into #050505 for seamless transition to next sections
      const bottomFade = ctx.createLinearGradient(0, horizonY - 20, 0, height);
      bottomFade.addColorStop(0, "rgba(5, 5, 5, 0)");
      bottomFade.addColorStop(0.4, "rgba(5, 5, 5, 0.65)");
      bottomFade.addColorStop(0.85, "rgba(5, 5, 5, 0.98)");
      bottomFade.addColorStop(1, "rgba(5, 5, 5, 1)");
      ctx.fillStyle = bottomFade;
      ctx.fillRect(0, horizonY - 20, width, height - (horizonY - 20));

      if (!prefersReducedMotion) {
        time += 0.006;
      }
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      ro.disconnect();
    };
  }, [emblemYPercent]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none select-none z-0 ${className}`}
      style={{ display: "block" }}
      aria-hidden="true"
    />
  );
};

export default MonochromeWaves3D;
