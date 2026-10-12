import React from "react";
import type { ExperimentType } from "../three/ThreeScene";

interface ExperimentSelectorProps {
  currentExperiment: ExperimentType;
  onChange: (type: ExperimentType) => void;
}

const EXPERIMENTS: {
  id: ExperimentType;
  name: string;
  icon: string;
  desc: string;
  tips: string;
}[] = [
  {
    id: "orb",
    name: "Orb Control",
    icon: "✦",
    desc: "Bola energi holografik",
    tips: "Buka/gerakkan telapak tangan untuk mengendalikan bola. Bentuk tangan mengatur ukuran bola.",
  },
  {
    id: "particles",
    name: "Gesture Particles",
    icon: "⚡",
    desc: "Awan partikel kinetik",
    tips: "Buka tangan untuk menyebarkan partikel nebula. Kepalkan tangan untuk memadatkan menjadi inti padat.",
  },
  {
    id: "hologram",
    name: "Hologram Object",
    icon: "💎",
    desc: "Kristal artefak sci-fi",
    tips: "Pinch (cubit jempol & telunjuk) untuk Grab Mode. Geser tangan ke samping untuk memutar kristal.",
  },
];

export function ExperimentSelector({
  currentExperiment,
  onChange,
}: ExperimentSelectorProps) {
  const activeExp = EXPERIMENTS.find((e) => e.id === currentExperiment) || EXPERIMENTS[0];

  return (
    <div className="flex flex-col items-center gap-2 max-w-lg mx-auto w-full px-3">
      {/* Selector pills */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-950/70 border border-white/10 backdrop-blur-xl shadow-2xl">
        {EXPERIMENTS.map((exp) => {
          const isActive = exp.id === currentExperiment;
          return (
            <button
              key={exp.id}
              onClick={() => onChange(exp.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(0,242,254,0.4)] font-semibold scale-102"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
              }`}
            >
              <span className="text-sm">{exp.icon}</span>
              <span>{exp.name}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic gesture hint */}
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-md text-[11px] text-zinc-300 text-center max-w-md animate-in fade-in duration-300">
        <span className="text-cyan-400 shrink-0 font-bold">TIPS:</span>
        <span className="truncate">{activeExp.tips}</span>
      </div>
    </div>
  );
}
