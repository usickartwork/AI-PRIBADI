import type { Metadata } from "next";
import { GameStandaloneClient } from "@/app/games/survival/client";

export const metadata: Metadata = {
  title: "Usick Survival — 3D Forest Survival RPG",
  description:
    "Jelajahi hutan 3D low-poly, tebang pohon, tambang batu, buat perkakas, bangun tempat berlindung, dan bertahan hidup dari satwa liar di Usick Survival.",
};

export default function GamePage() {
  return <GameStandaloneClient />;
}

