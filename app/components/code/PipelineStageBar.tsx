"use client";

import React from "react";
import { BuilderStage, StageStatus } from "./types";

interface PipelineStageBarProps {
  currentStage: BuilderStage;
  stageStatuses: Record<BuilderStage, StageStatus>;
  onSelectStage: (stage: BuilderStage) => void;
  isDark?: boolean;
}

const STAGES: { id: BuilderStage; label: string; icon: string }[] = [
  { id: "idea", label: "Idea", icon: "💡" },
  { id: "prd", label: "PRD", icon: "📋" },
  { id: "design", label: "Design", icon: "🎨" },
  { id: "prototype", label: "Prototype", icon: "⚡" },
  { id: "build", label: "Build", icon: "🔨" },
  { id: "test", label: "Test", icon: "🧪" },
  { id: "preview", label: "Preview", icon: "🌐" },
];

export function PipelineStageBar({
  currentStage,
  stageStatuses,
  onSelectStage,
  isDark = true,
}: PipelineStageBarProps) {
  return (
    <div className={`w-full border-b ${isDark ? "bg-[#0c0d12]/95 border-white/10" : "bg-white/95 border-black/10"} backdrop-blur-xl px-4 py-2.5 overflow-x-auto`}>
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 min-w-max">
        {STAGES.map((st, index) => {
          const isActive = currentStage === st.id;
          const status = stageStatuses[st.id] || "not_started";
          const isApproved = status === "approved";
          const isReady = status === "ready_for_review";

          return (
            <React.Fragment key={st.id}>
              {index > 0 && (
                <div className={`h-[1px] w-4 sm:w-8 shrink-0 ${isApproved ? "bg-emerald-500/50" : isDark ? "bg-white/10" : "bg-black/10"}`} />
              )}
              <button
                type="button"
                onClick={() => onSelectStage(st.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                  isActive
                    ? isDark
                      ? "bg-white text-black shadow-md shadow-white/5 font-bold"
                      : "bg-black text-white shadow-md font-bold"
                    : isApproved
                    ? isDark
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : isReady
                    ? isDark
                      ? "bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                    : isDark
                    ? "text-zinc-500 hover:text-zinc-300"
                    : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                <span>{st.icon}</span>
                <span>{st.label}</span>
                {isApproved && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                )}
                {isReady && !isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse"></span>
                )}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
