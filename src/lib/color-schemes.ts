export type ColorSchemeName = "default" | "wetAsphalt" | "esmeralda" | "hielo" | "floral" | "rosa" | "violeta" | "rojo" | "amarillo";

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
  /* Esmeralda · Green accent #27ae60 + sage sidebar #e8f5e9 */
  esmeralda: {
    name: "esmeralda",
    swatch: "#e8f5e9",
    sidebarBg: "#e8f5e9",
    sidebarText: "#1e293b",
    sidebarMuted: "#64748b",
    sidebarSeparator: "#bddcd3", // 20% #27ae60 over #e2e8f0
    sidebarBadgeBg: "#384152",
    sidebarBadgeText: "#ffffff",
    heading: "#1e293b",
    separator: "#e2e8f0",
    bullet: "#334155",
    nameAccent: "transparent",
    nameColor: "#27ae60",
    entryTitle: "#27ae60",
    sidebarAccent: "#27ae60",
    pageBg: "#dbe6e0",
    pageBgDark: "#1b2323",
  },
  /* Hielo · Blue accent #1a7ed6 + ice blue sidebar #e8f0fe */
  hielo: {
    name: "hielo",
    swatch: "#e8f0fe",
    sidebarBg: "#e8f0fe",
    sidebarText: "#1e293b",
    sidebarMuted: "#64748b",
    sidebarSeparator: "#bad3eb", // 20% #1a7ed6 over #e2e8f0
    sidebarBadgeBg: "#384152",
    sidebarBadgeText: "#ffffff",
    heading: "#1e293b",
    separator: "#e2e8f0",
    bullet: "#334155",
    nameAccent: "transparent",
    nameColor: "#1a7ed6",
    entryTitle: "#1a7ed6",
    sidebarAccent: "#1a7ed6",
    pageBg: "#dae2e9",
    pageBgDark: "#1a2129",
  },
  /* Floral · Red-orange accent #ff4040 + pale pink sidebar #fce4ec */
  floral: {
    name: "floral",
    swatch: "#fce4ec",
    sidebarBg: "#fce4ec",
    sidebarText: "#1e293b",
    sidebarMuted: "#64748b",
    sidebarSeparator: "#e8c6cd", // 20% #ff4040 over #e2e8f0
    sidebarBadgeBg: "#384152",
    sidebarBadgeText: "#ffffff",
    heading: "#1e293b",
    separator: "#e2e8f0",
    bullet: "#334155",
    nameAccent: "transparent",
    nameColor: "#ff4040",
    entryTitle: "#ff4040",
    sidebarAccent: "#ff4040",
    pageBg: "#eddddd",
    pageBgDark: "#251e22",
  },
  /* Rosa · Pink accent #db2777 + soft pink sidebar #fdf2f8 */
  rosa: {
    name: "rosa",
    swatch: "#fdf2f8",
    sidebarBg: "#fdf2f8",
    sidebarText: "#0a0a0a",
    sidebarMuted: "#64748b",
    sidebarSeparator: "#e1c1d8", // 20% #db2777 over #e2e8f0
    sidebarBadgeBg: "#384152",
    sidebarBadgeText: "#ffffff",
    heading: "#0a0a0a",
    separator: "#e2e8f0",
    bullet: "#334155",
    nameAccent: "transparent",
    nameColor: "#db2777",
    entryTitle: "#db2777",
    sidebarAccent: "#db2777",
    pageBg: "#eadbe2",
    pageBgDark: "#241d24",
  },
  /* Violeta · Violet accent #7c3aed + lavender sidebar #f5f3ff */
  violeta: {
    name: "violeta",
    swatch: "#f5f3ff",
    sidebarBg: "#f5f3ff",
    sidebarText: "#0a0a0a",
    sidebarMuted: "#64748b",
    sidebarSeparator: "#cec5ef", // 20% #7c3aed over #e2e8f0
    sidebarBadgeBg: "#384152",
    sidebarBadgeText: "#ffffff",
    heading: "#0a0a0a",
    separator: "#e2e8f0",
    bullet: "#334155",
    nameAccent: "transparent",
    nameColor: "#7c3aed",
    entryTitle: "#7c3aed",
    sidebarAccent: "#7c3aed",
    pageBg: "#e2ddeb",
    pageBgDark: "#1f1e2a",
  },
  /* Rojo · Red accent #dc2626 + blush sidebar #fef2f2 */
  rojo: {
    name: "rojo",
    swatch: "#fef2f2",
    sidebarBg: "#fef2f2",
    sidebarText: "#0a0a0a",
    sidebarMuted: "#64748b",
    sidebarSeparator: "#e1c1c8", // 20% #dc2626 over #e2e8f0
    sidebarBadgeBg: "#384152",
    sidebarBadgeText: "#ffffff",
    heading: "#0a0a0a",
    separator: "#e2e8f0",
    bullet: "#334155",
    nameAccent: "transparent",
    nameColor: "#dc2626",
    entryTitle: "#dc2626",
    sidebarAccent: "#dc2626",
    pageBg: "#eadbdb",
    pageBgDark: "#241d20",
  },
  /* Amarillo · Amber accent #f59e0b + warm cream sidebar #fffbeb */
  amarillo: {
    name: "amarillo",
    swatch: "#fffbeb",
    sidebarBg: "#fffbeb",
    sidebarText: "#0a0a0a",
    sidebarMuted: "#64748b",
    sidebarSeparator: "#e6d9c2", // 20% #f59e0b over #e2e8f0
    sidebarBadgeBg: "#384152",
    sidebarBadgeText: "#ffffff",
    heading: "#0a0a0a",
    separator: "#e2e8f0",
    bullet: "#334155",
    nameAccent: "transparent",
    nameColor: "#f59e0b",
    entryTitle: "#f59e0b",
    sidebarAccent: "#f59e0b",
    pageBg: "#ece5d9",
    pageBgDark: "#25231f",
  },
};

export const COLOR_SCHEME_NAMES: ColorSchemeName[] = [
  "default",
  "wetAsphalt",
  "esmeralda",
  "hielo",
  "floral",
  "rosa",
  "violeta",
  "rojo",
  "amarillo",
];

export const DEFAULT_COLOR_SCHEME: ColorSchemeName = "default";

/* ── Scheme metadata (customizable vs template) ────────── */

export type SchemeCategory = "customizable" | "palette";

export interface SchemeMetadata {
  name: ColorSchemeName;
  category: SchemeCategory;
  /** i18n key suffix for the label */
  labelKey: string;
  /** Whether this scheme requires premium */
  premium: boolean;
}

export const SCHEME_METADATA: SchemeMetadata[] = [
  { name: "default", category: "customizable", labelKey: "Default", premium: false },
  { name: "wetAsphalt", category: "palette", labelKey: "WetAsphalt", premium: true },
  { name: "esmeralda", category: "palette", labelKey: "Esmeralda", premium: true },
  { name: "hielo", category: "palette", labelKey: "Hielo", premium: true },
  { name: "floral", category: "palette", labelKey: "Floral", premium: true },
  { name: "rosa", category: "palette", labelKey: "Rosa", premium: true },
  { name: "violeta", category: "palette", labelKey: "Violeta", premium: true },
  { name: "rojo", category: "palette", labelKey: "Rojo", premium: true },
  { name: "amarillo", category: "palette", labelKey: "Amarillo", premium: true },
];

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

/** Sidebar separator: mix accent at ~20% over #e2e8f0 base */
export function hexToTintedSeparator(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  const base = [0xe2, 0xe8, 0xf0];
  const mix = 0.2;
  return rgbToHex(
    Math.round(base[0] + (r - base[0]) * mix),
    Math.round(base[1] + (g - base[1]) * mix),
    Math.round(base[2] + (b - base[2]) * mix),
  );
}

/* ── Luminance & auto-computed sidebar colors ──────────── */

/**
 * Compute relative luminance (WCAG 2.1 sRGB formula).
 * Returns 0 (black) to 1 (white).
 */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export interface SidebarDerivedColors {
  sidebarBg: string;
  sidebarText: string;
  sidebarMuted: string;
  sidebarSeparator: string;
  sidebarBadgeBg: string;
  sidebarBadgeText: string;
}

/**
 * Auto-compute all sidebar text/muted/separator/badge colors from a background hex.
 * Uses luminance threshold: dark bg → white text system, light bg → dark text system.
 */
export function computeSidebarColors(bgHex: string): SidebarDerivedColors {
  const isDark = relativeLuminance(bgHex) < 0.4;

  if (isDark) {
    return {
      sidebarBg: bgHex,
      sidebarText: "#ffffff",
      sidebarMuted: "#ffffff66",
      sidebarSeparator: "#ffffff33",
      sidebarBadgeBg: "#ffffff33",
      sidebarBadgeText: "#ffffff",
    };
  }

  return {
    sidebarBg: bgHex,
    sidebarText: "#1e293b",
    sidebarMuted: "#64748b",
    sidebarSeparator: "#e2e8f0",
    sidebarBadgeBg: "#384152",
    sidebarBadgeText: "#ffffff",
  };
}

/* ── Resolve final scheme from base + accent ───────────── */

/**
 * Compute the full ColorScheme from a base style + optional accent color.
 * - wetAsphalt: return base as-is (dark sidebar, no accent).
 * - All others: apply accent overrides if provided.
 */
export function resolveColorScheme(
  baseName: ColorSchemeName,
  accentColor: string | null,
): ColorScheme {
  const base = COLOR_SCHEMES[baseName] ?? COLOR_SCHEMES.default;

  // wetAsphalt: always return base unchanged (no accent support)
  if (baseName === "wetAsphalt") return base;

  // No accent provided: return base as-is
  if (!accentColor) return base;

  return {
    ...base,
    nameColor: accentColor,
    entryTitle: accentColor,
    sidebarAccent: accentColor,
    sidebarSeparator: hexToTintedSeparator(accentColor),
    pageBg: hexToTintedPageBg(accentColor),
    pageBgDark: hexToTintedPageBgDark(accentColor),
  };
}

/* ── Migration from old 5-scheme system ────────────────── */

export function migrateColorSchemeName(name: string): {
  baseName: ColorSchemeName;
  accentColor: string | null;
} {
  // Pass through current valid names
  if (COLOR_SCHEME_NAMES.includes(name as ColorSchemeName)) {
    return { baseName: name as ColorSchemeName, accentColor: null };
  }
  // Migrate old names
  switch (name) {
    case "peterRiver":
      return { baseName: "hielo", accentColor: null };
    case "emerald":
      return { baseName: "esmeralda", accentColor: null };
    case "carrot":
      return { baseName: "floral", accentColor: null };
    default:
      return { baseName: "default", accentColor: null };
  }
}

/* ── Legacy helper (kept for backward compat) ──────────── */

export function getColorScheme(name: ColorSchemeName): ColorScheme {
  return COLOR_SCHEMES[name] || COLOR_SCHEMES.default;
}
