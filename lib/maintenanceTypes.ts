export type FeatureKey =
  | "chat"
  | "code"
  | "schedule"
  | "messages"
  | "image"
  | "music"
  | "notebook"
  | "emergency"
  | "game"
  | "faith";

export const FEATURE_KEYS: FeatureKey[] = [
  "chat",
  "code",
  "schedule",
  "messages",
  "image",
  "music",
  "notebook",
  "emergency",
  "game",
  "faith",
];

export const FEATURE_METADATA: Record<FeatureKey, { name: string; defaultMessage: string }> = {
  chat: {
    name: "Chat AI",
    defaultMessage: "Fitur percakapan AI sedang diperbarui. Fitur lainnya tetap dapat digunakan.",
  },
  code: {
    name: "Code Studio & PRD",
    defaultMessage: "Fitur Code Studio & Generate PRD sedang dalam pemeliharaan berkala.",
  },
  schedule: {
    name: "Schedule & Kalender",
    defaultMessage: "Fitur jadwal dan pengingat sedang dalam pemeliharaan.",
  },
  messages: {
    name: "Messages & Pertemanan",
    defaultMessage: "Layanan percakapan instan sedang dalam peningkatan server.",
  },
  image: {
    name: "Image Studio",
    defaultMessage: "Layanan kreasi dan translasi gambar sedang dalam pemeliharaan.",
  },
  music: {
    name: "Music One & Connect",
    defaultMessage: "Server streaming audio sedang dalam pemeliharaan sistem.",
  },
  notebook: {
    name: "Notebook",
    defaultMessage: "Fitur catatan pribadi sedang dalam sinkronisasi sistem.",
  },
  emergency: {
    name: "Emergency Contact",
    defaultMessage: "Pusat kontak darurat sedang diperbarui.",
  },
  game: {
    name: "Game Center",
    defaultMessage: "Arena game sedang dalam pemeliharaan berkala.",
  },
  faith: {
    name: "Faith Space",
    defaultMessage: "Ruang renungan batin sedang dalam pemeliharaan sistem.",
  },
};

export interface MaintenanceItem {
  isEnabled: boolean;
  title?: string | null;
  message?: string | null;
  estimatedEnd?: string | null;
  updatedAt?: string;
  updatedBy?: string;
}

export interface MaintenanceDictionary {
  global: MaintenanceItem;
  features: Record<FeatureKey, MaintenanceItem>;
}
