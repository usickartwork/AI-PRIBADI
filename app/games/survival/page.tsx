import type { Metadata } from "next";
import { GameStandaloneClient } from "./client";

export const metadata: Metadata = {
  title: "Usick Survival — 3D Forest Survival RPG",
  description:
    "Jelajahi hutan 3D low-poly, tebang pohon, tambang batu, buat perkakas, bangun tempat berlindung, dan bertahan hidup dari satwa liar di Usick Survival.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function GameSurvivalPage() {
  return <GameStandaloneClient />;
}

