import type { Metadata } from "next";
import { TrackingStandaloneClient } from "./client";

export const metadata: Metadata = {
  title: "HandVerse — Real-Time Hand Tracking & 3D Interactive Camera",
  description:
    "Eksperimen kamera 3D interaktif berbasis webcam/kamera HP dengan deteksi gestur tangan real-time menggunakan MediaPipe dan Three.js.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function TrackingPage() {
  return <TrackingStandaloneClient />;
}

