export type ColorSchemeName =
  | "default"
  | "peterRiver"
  | "emerald"
  | "carrot"
  | "wetAsphalt";

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
  /* Clear Child · Dodger Blue #1e90ff — light sidebar, accent on icons & name */
  peterRiver: {
    name: "peterRiver",
    swatch: "#1e90ff",
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
    nameColor: "#1a7ed6",
    entryTitle: "#1a7ed6",
    sidebarAccent: "#1a7ed6",
    pageBg: "#e8f2fb",
    pageBgDark: "#181d22",
  },
  /* Emerald · Nephritis #27ae60 — light sidebar, accent on icons & name */
  emerald: {
    name: "emerald",
    swatch: "#2ecc71",
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
    nameColor: "#27ae60",
    entryTitle: "#27ae60",
    sidebarAccent: "#27ae60",
    pageBg: "#e9f7ef",
    pageBgDark: "#181e1a",
  },
  /* Carrot · Pumpkin #d35400 — light sidebar, accent on icons & name */
  carrot: {
    name: "carrot",
    swatch: "#e67e22",
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
    nameColor: "#d35400",
    entryTitle: "#d35400",
    sidebarAccent: "#d35400",
    pageBg: "#fbeee6",
    pageBgDark: "#1e1b18",
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
  "peterRiver",
  "emerald",
  "carrot",
  "wetAsphalt",
];

export const DEFAULT_COLOR_SCHEME: ColorSchemeName = "default";

export function getColorScheme(name: ColorSchemeName): ColorScheme {
  return COLOR_SCHEMES[name] || COLOR_SCHEMES.default;
}
