// ─── Usick One — 24/7 Live Radio Stations ────────────────────────────────────
// Real-time live radio streams: zero API rate limits, non-stop popular songs & broadcasts

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
    id: "dengerin-pop-indonesia",
    name: "Dengerin Pop Indonesia",
    tagline: "Hits Populer Musik Indonesia 24/7",
    genre: "Pop Indonesia",
    frequency: "LIVE STREAM",
    country: "Indonesia 🇮🇩",
    streamUrl: "https://stream.denger.in/",
    artworkUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
    badge: "Hits Indo",
    listenersEstimate: "5.4k mendengarkan",
    description: "Siaran langsung lagu-lagu pop Indonesia terpopuler, hits viral, dan tangga lagu nasional tanpa henti.",
  },
  {
    id: "iloveradio-top-40",
    name: "I Love Radio Top 40",
    tagline: "Lagu Terpopuler Dunia & Billboard Chart",
    genre: "Global Top 40",
    frequency: "LIVE STREAM",
    country: "Global 🌍",
    streamUrl: "https://streams.ilovemusic.de/iloveradio1.mp3",
    artworkUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
    badge: "Global Hits",
    listenersEstimate: "14.2k mendengarkan",
    description: "Tangga lagu internasional dan hits global teratas diputar langsung secara terus-menerus 24 jam.",
  },
  {
    id: "wdr-1live-charts",
    name: "1LIVE Pop & Chart Hits",
    tagline: "Musik Tren & Chart Hits Populer",
    genre: "Pop & Trending",
    frequency: "102.4 FM • LIVE",
    country: "Eropa 🇪🇺",
    streamUrl: "http://wdr-1live-live.icecast.wdr.de/wdr/1live/live/mp3/128/stream.mp3",
    artworkUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
    badge: "Trending",
    listenersEstimate: "8.9k mendengarkan",
    description: "Stasiun radio anak muda terbesar dengan kurasi lagu-lagu modern dan rilisan terpopuler.",
  },
  {
    id: "iloveradio-chillhop-lofi",
    name: "I Love Chillhop & Lofi",
    tagline: "Musik Santai, Chill Beats & Lofi Pop",
    genre: "Chillout / Lofi",
    frequency: "LIVE STREAM",
    country: "Global ☕",
    streamUrl: "https://streams.ilovemusic.de/iloveradio17.mp3",
    artworkUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&auto=format&fit=crop&q=80",
    badge: "Chill & Focus",
    listenersEstimate: "6.1k mendengarkan",
    description: "Alunan instrumen lofi dan pop santai yang menenangkan, cocok untuk menemani kerja, belajar, atau istirahat.",
  },
  {
    id: "radio-105-top-hits",
    name: "Radio 105 Top Hits",
    tagline: "Dance Energy & Pop Hits Terpopuler",
    genre: "Dance / Top 40",
    frequency: "105.0 FM • LIVE",
    country: "Italia 🇮🇹",
    streamUrl: "http://icecast.unitedradio.it/Radio105.mp3",
    artworkUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80",
    badge: "Dance Energy",
    listenersEstimate: "7.3k mendengarkan",
    description: "Siaran langsung ritme dance, electronic pop, dan musik berenergi tinggi 24 jam non-stop.",
  },
  {
    id: "elshinta-radio-jakarta",
    name: "Elshinta Radio Jakarta",
    tagline: "Siaran Langsung Berita & Hits Jakarta",
    genre: "News & Pop Hits",
    frequency: "90.0 FM • LIVE",
    country: "Jakarta 🇮🇩",
    streamUrl: "https://stream-ssl.arenastreaming.com:8000/jakarta",
    artworkUrl: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&auto=format&fit=crop&q=80",
    badge: "Siaran Jakarta",
    listenersEstimate: "9.8k mendengarkan",
    description: "Siaran radio live legendaris dari Jakarta menyajikan informasi aktual dan selingan lagu-lagu populer.",
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
    albumTitle: `${station.frequency} • ${station.genre}`,
    artworkUrl: station.artworkUrl,
    durationMs: 0,
    externalUrl: station.streamUrl,
    previewUrl: station.streamUrl,
    isLiveRadio: true,
    streamUrl: station.streamUrl,
    radioFrequency: station.frequency,
  };
}
