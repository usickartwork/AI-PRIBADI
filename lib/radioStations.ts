// ─── Usick One — 24/7 Radio Stations ──────────────────────────────────────────
// Curated 3 dedicated radio streams: Top Hits Lagu Indo, Lagu Global, Lagu Chill

import { MusicItem } from "./music";

export interface RadioStation {
  id: string;
  name: string;
  tagline: string;
  genre: string;
  frequency: string;
  country: string;
  streamUrl: string;
  artworkUrl: string;
  badge?: string;
  listenersEstimate?: string;
  description: string;
}

export const POPULAR_RADIO_STATIONS: RadioStation[] = [
  {
    id: "top-hits-lagu-indo",
    name: "Top Hits Lagu Indo",
    tagline: "Hits Populer Musik Indonesia",
    genre: "Pop Indonesia",
    frequency: "",
    country: "Indonesia 🇮🇩",
    streamUrl: "https://stream.lokermusik.com/listen/lokermusik/lokermusik",
    artworkUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
    badge: "Indo Hits",
    listenersEstimate: "5.4k mendengarkan",
    description: "Lagu-lagu pop Indonesia terpopuler, hits viral, dan tangga lagu nasional tanpa henti.",
  },
  {
    id: "lagu-global",
    name: "Lagu Global",
    tagline: "Top Hits Mancanegara & Billboard",
    genre: "Global Top 40",
    frequency: "",
    country: "Global 🌍",
    streamUrl: "https://streams.ilovemusic.de/iloveradio1.mp3",
    artworkUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
    badge: "Global Hits",
    listenersEstimate: "14.2k mendengarkan",
    description: "Tangga lagu internasional dan hits global teratas diputar secara terus-menerus.",
  },
  {
    id: "lagu-chill",
    name: "Lagu Chill",
    tagline: "Chillhop, Beats & Lofi Santai",
    genre: "Chill & Lofi",
    frequency: "",
    country: "Chillout ☕",
    streamUrl: "https://streams.ilovemusic.de/iloveradio17.mp3",
    artworkUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&auto=format&fit=crop&q=80",
    badge: "Chill Beats",
    listenersEstimate: "6.1k mendengarkan",
    description: "Alunan instrumen lofi dan musik chill santai yang menenangkan untuk fokus dan istirahat.",
  },
];

export function radioStationToMusicItem(station: RadioStation): MusicItem {
  return {
    id: `radio:${station.id}`,
    provider: "radio",
    providerItemId: station.id,
    itemType: "track",
    title: station.name,
    artistNames: [station.tagline],
    albumTitle: station.name,
    artworkUrl: station.artworkUrl,
    durationMs: 0,
    externalUrl: station.streamUrl,
    previewUrl: station.streamUrl,
    isLiveRadio: true,
    streamUrl: station.streamUrl,
    radioFrequency: station.genre,
  };
}
