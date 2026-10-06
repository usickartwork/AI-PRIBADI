"use client";

import React, { useState, useEffect, useRef } from "react";
import { Eye, EyeOff } from "lucide-react";

export interface FormFieldProps {
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: React.ReactNode;
  showToggle?: boolean;
  onToggle?: () => void;
  showPassword?: boolean;
  autoComplete?: string;
  required?: boolean;
  isDark?: boolean;
}

export const AnimatedFormField: React.FC<FormFieldProps> = ({
  type,
  placeholder,
  value,
  onChange,
  icon,
  showToggle,
  onToggle,
  showPassword,
  autoComplete,
  required,
  isDark = true,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div className="relative group">
      <div
        className={`relative overflow-hidden rounded-xl border transition-all duration-300 ease-in-out ${
          isDark
            ? "border-zinc-800 bg-zinc-900/80 focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-zinc-600"
            : "border-zinc-200 bg-zinc-50/90 focus-within:border-zinc-400 focus-within:ring-1 focus-within:ring-zinc-400"
        }`}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div
          className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
            isFocused
              ? isDark ? "text-white" : "text-black"
              : isDark ? "text-zinc-500" : "text-zinc-400"
          }`}
        >
          {icon}
        </div>

        <input
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoComplete={autoComplete}
          required={required}
          className={`w-full bg-transparent pl-11 pr-11 pt-5 pb-2 text-sm focus:outline-none transition-colors ${
            isDark ? "text-zinc-100 placeholder:text-transparent" : "text-zinc-900 placeholder:text-transparent"
          }`}
          placeholder=""
        />

        <label
          className={`absolute left-11 transition-all duration-200 ease-in-out pointer-events-none select-none ${
            isFocused || value
              ? `top-1.5 text-[11px] font-medium ${isDark ? "text-zinc-400" : "text-zinc-600"}`
              : `top-1/2 -translate-y-1/2 text-sm ${isDark ? "text-zinc-500" : "text-zinc-400"}`
          }`}
        >
          {placeholder}
        </label>

        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer ${
              isDark ? "text-zinc-500 hover:text-zinc-200" : "text-zinc-400 hover:text-zinc-700"
            }`}
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}

        {isHovering && (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
            style={{
              background: `radial-gradient(160px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 255, 255, ${
                isDark ? "0.06" : "0.12"
              }) 0%, transparent 70%)`,
            }}
          />
        )}
      </div>
    </div>
  );
};

export const SocialButton: React.FC<{
  icon: React.ReactNode;
  name: string;
  onClick: () => void;
  disabled?: boolean;
  isDark?: boolean;
}> = ({ icon, name, onClick, disabled, isDark = true }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative group flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border transition-all duration-300 ease-in-out overflow-hidden cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        isDark
          ? "border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/80 hover:border-zinc-700 text-zinc-200 shadow-sm"
          : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-300 text-zinc-800 shadow-sm"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 transition-transform duration-500 pointer-events-none ${
          isHovered ? "translate-x-0" : "-translate-x-full"
        }`}
      />
      <div className="relative shrink-0">{icon}</div>
      <span className="relative text-xs font-semibold tracking-wide">{name}</span>
    </button>
  );
};

export const FloatingParticles: React.FC<{ isDark?: boolean }> = ({ isDark = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const setCanvasSize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;

      constructor() {
        this.x = Math.random() * (canvas?.width || 400);
        this.y = Math.random() * (canvas?.height || 500);
        this.size = Math.random() * 1.5 + 0.8;
        this.speedX = (Math.random() - 0.5) * 0.35;
        this.speedY = (Math.random() - 0.5) * 0.35;
        this.opacity = Math.random() * 0.25 + 0.05;
      }

      update() {
        if (!canvas) return;
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = isDark
          ? `rgba(255, 255, 255, ${this.opacity})`
          : `rgba(0, 0, 0, ${this.opacity * 0.7})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const particles: Particle[] = [];
    const particleCount = 35;

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((particle) => {
        particle.update();
        particle.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", setCanvasSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none rounded-3xl"
      style={{ zIndex: 0 }}
    />
  );
};

