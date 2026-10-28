export type AdminAvatarShape = "circle" | "squircle" | "rounded";
export type AdminAvatarBorderStyle = "none" | "minimal" | "glow" | "double";
export type AdminAvatarFilter = "none" | "grayscale" | "contrast";

export interface AdminAvatarConfig {
  imageUrl: string;
  shape: AdminAvatarShape;
  borderStyle: AdminAvatarBorderStyle;
  filter: AdminAvatarFilter;
  zoom: number; // 1 to 1.6
  updatedAt?: string;
}

export const DEFAULT_ADMIN_AVATAR_CONFIG: AdminAvatarConfig = {
  imageUrl: "",
  shape: "circle",
  borderStyle: "minimal",
  filter: "none",
  zoom: 1,
};

export const ADMIN_AVATAR_STORAGE_KEY = "onemind_admin_avatar_config_v1";

/**
 * Validasi dan sanitasi konfigurasi foto profil admin.
 * Memastikan URL aman (data:image/ atau https://) dan nilai opsi valid.
 */
export function sanitizeAdminAvatarConfig(input: unknown): AdminAvatarConfig | null {
  if (!input || typeof input !== "object") return null;
  const record = input as Record<string, unknown>;
  const rawUrl = typeof record.imageUrl === "string" ? record.imageUrl.trim() : "";
  if (!rawUrl) return null;

  // Izinkan data URL base64 atau HTTPS URL atau path lokal
  if (!rawUrl.startsWith("data:image/") && !rawUrl.startsWith("https://") && !rawUrl.startsWith("/")) {
    return null;
  }

  const validShapes: AdminAvatarShape[] = ["circle", "squircle", "rounded"];
  const shape: AdminAvatarShape = typeof record.shape === "string" && validShapes.includes(record.shape as AdminAvatarShape)
    ? (record.shape as AdminAvatarShape)
    : "circle";

  const validBorders: AdminAvatarBorderStyle[] = ["none", "minimal", "glow", "double"];
  const borderStyle: AdminAvatarBorderStyle = typeof record.borderStyle === "string" && validBorders.includes(record.borderStyle as AdminAvatarBorderStyle)
    ? (record.borderStyle as AdminAvatarBorderStyle)
    : "minimal";

  const validFilters: AdminAvatarFilter[] = ["none", "grayscale", "contrast"];
  const filter: AdminAvatarFilter = typeof record.filter === "string" && validFilters.includes(record.filter as AdminAvatarFilter)
    ? (record.filter as AdminAvatarFilter)
    : "none";

  let zoom = typeof record.zoom === "number" && !isNaN(record.zoom) ? record.zoom : 1;
  if (zoom < 1) zoom = 1;
  if (zoom > 1.8) zoom = 1.8;

  return {
    imageUrl: rawUrl,
    shape,
    borderStyle,
    filter,
    zoom: Math.round(zoom * 100) / 100,
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : new Date().toISOString(),
  };
}
