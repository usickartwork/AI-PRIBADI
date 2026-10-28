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
