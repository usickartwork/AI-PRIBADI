export type BjorkTone = "neutral" | "dark" | "light" | "monochrome" | "minimal";

export interface BjorkPaletteEntry {
  text: string;
  accentInk: string;
  bg?: string;
}

/**
 * Palette yang diselaraskan dengan tema monokromatis bersih One Mind (Dark & Light mode).
 * Menghilangkan sepenuhnya aksen oranye agar selalu senada dengan tema aplikasi kita.
 */
export const BJORK_PALETTE: Record<BjorkTone, BjorkPaletteEntry> = {
  neutral: {
    text: "currentColor",
    accentInk: "currentColor",
  },
  dark: {
    text: "#ffffff",
    accentInk: "rgba(255, 255, 255, 0.9)",
  },
  light: {
    text: "#09090b",
    accentInk: "rgba(9, 9, 11, 0.85)",
  },
  monochrome: {
    text: "currentColor",
    accentInk: "currentColor",
  },
  minimal: {
    text: "currentColor",
    accentInk: "currentColor",
  },
};
