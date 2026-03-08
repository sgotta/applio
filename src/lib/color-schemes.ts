export type ColorSchemeName = "default" | "wetAsphalt";

export interface ColorScheme {
  name: ColorSchemeName;
  /** Preview swatch color for the toolbar picker */
  swatch: string;

  /* ── Sidebar (left column) — bold background ── */
  sidebarBg: string;
  sidebarText: string;
  sidebarMuted: string;
  sidebarSeparator: string;
  sidebarBadgeBg: string;
  sidebarBadgeText: string;

  /* ── Right column ── */
  heading: string;
  separator: string;
  bullet: string;
  nameAccent: string;
  /** Color of the full name text in the header */
  nameColor: string;
  /** Color for entry titles: company names, institutions, cert/award names */
  entryTitle: string;

  /* ── Sidebar accent ── */
  /** Accent color for sidebar icons, section headings, and decorative touches */
  sidebarAccent: string;

  /* ── Page background (behind the CV sheet) ── */
  pageBg: string;
  /** Dark mode page background — dark shade with subtle scheme tint */
  pageBgDark: string;
}

export const COLOR_SCHEMES: Record<ColorSchemeName, ColorScheme> = {
  /* Default — neutral light gray, optimised for B&W print */
  default: {
    name: "default",
    swatch: "#f5f5f5",
    sidebarBg: "#f5f5f5",
    sidebarText: "#1e293b",
    sidebarMuted: "#64748b",
    sidebarSeparator: "#e2e8f0",
    sidebarBadgeBg: "#384152",
    sidebarBadgeText: "#ffffff",
    heading: "#1e293b",
    separator: "#e2e8f0",
    bullet: "#334155",
    nameAccent: "transparent",
    nameColor: "#111827",
    entryTitle: "#111827",
    sidebarAccent: "#1e293b",
    pageBg: "#ebebeb",
    pageBgDark: "#1a1c20",
  },
  /* Wet Asphalt · Midnight Blue #2c3e50 */
  wetAsphalt: {
    name: "wetAsphalt",
    swatch: "#34495e",
    sidebarBg: "#2c3e50",
    sidebarText: "#ffffff",
    sidebarMuted: "#ffffff66",
    sidebarSeparator: "#ffffff33",
    sidebarBadgeBg: "#ffffff33",
    sidebarBadgeText: "#ffffff",
    heading: "#2c3e50",
    separator: "#34495e40",
    bullet: "#34495e",
    nameAccent: "transparent",
    nameColor: "#111827",
    entryTitle: "#111827",
    sidebarAccent: "#ffffff",
    pageBg: "#eaecee",
    pageBgDark: "#191b1d",
  },
};

export const COLOR_SCHEME_NAMES: ColorSchemeName[] = [
  "default",
  "wetAsphalt",
];

export const DEFAULT_COLOR_SCHEME: ColorSchemeName = "default";

/* ── Accent color presets ──────────────────────────────── */

export interface AccentPreset {
  /** i18n key suffix: "Blue", "Green", "Orange" */
  name: string;
  color: string;
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { name: "Blue", color: "#1a7ed6" },
  { name: "Green", color: "#27ae60" },
  { name: "Orange", color: "#d35400" },
];

/* ── Color helpers ─────────────────────────────────────── */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")
  );
}

/** Light mode page bg: mix accent at ~8% opacity over #ebebeb */
export function hexToTintedPageBg(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  const base = 0xeb; // 235
  const mix = 0.08;
  return rgbToHex(
    Math.round(base + (r - base) * mix),
    Math.round(base + (g - base) * mix),
    Math.round(base + (b - base) * mix),
  );
}

/** Dark mode page bg: mix accent at ~5% opacity over #1a1c20 */
export function hexToTintedPageBgDark(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  const baseR = 0x1a,
    baseG = 0x1c,
    baseB = 0x20;
  const mix = 0.05;
  return rgbToHex(
    Math.round(baseR + (r - baseR) * mix),
    Math.round(baseG + (g - baseG) * mix),
    Math.round(baseB + (b - baseB) * mix),
  );
}

/* ── Resolve final scheme from base + accent ───────────── */

/**
 * Compute the full ColorScheme from a base style and optional accent color.
 * - "default" base: accent applies to nameColor, entryTitle, sidebarAccent, pageBg, pageBgDark
 * - "wetAsphalt" base: accent ONLY applies to nameColor and entryTitle (right column)
 */
export function resolveColorScheme(
  baseName: ColorSchemeName,
  accentColor: string | null,
): ColorScheme {
  const base = COLOR_SCHEMES[baseName] ?? COLOR_SCHEMES.default;
  if (!accentColor) return base;

  if (baseName === "wetAsphalt") {
    return {
      ...base,
      nameColor: accentColor,
      entryTitle: accentColor,
    };
  }

  return {
    ...base,
    nameColor: accentColor,
    entryTitle: accentColor,
    sidebarAccent: accentColor,
    pageBg: hexToTintedPageBg(accentColor),
    pageBgDark: hexToTintedPageBgDark(accentColor),
  };
}

/* ── Migration from old 5-scheme system ────────────────── */

export function migrateColorSchemeName(name: string): {
  baseName: ColorSchemeName;
  accentColor: string | null;
} {
  switch (name) {
    case "peterRiver":
      return { baseName: "default", accentColor: "#1a7ed6" };
    case "emerald":
      return { baseName: "default", accentColor: "#27ae60" };
    case "carrot":
      return { baseName: "default", accentColor: "#d35400" };
    case "wetAsphalt":
      return { baseName: "wetAsphalt", accentColor: null };
    case "default":
      return { baseName: "default", accentColor: null };
    default:
      return { baseName: "default", accentColor: null };
  }
}

/* ── Legacy helper (kept for backward compat) ──────────── */

export function getColorScheme(name: ColorSchemeName): ColorScheme {
  return COLOR_SCHEMES[name] || COLOR_SCHEMES.default;
}
