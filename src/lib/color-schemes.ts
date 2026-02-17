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

  /* ── Page background (behind the CV sheet) ── */
  pageBg: string;
  /** Dark mode page background — dark shade with subtle scheme tint */
  pageBgDark: string;
}

/** Pre-blend an 8-digit hex (#rrggbbaa) over a 6-digit hex (#rrggbb)
 *  to get an opaque result. If fg is already 6/7 chars, return as-is. */
function blend(fg: string, bg: string): string {
  if (fg.length <= 7) return fg;
  const a = parseInt(fg.slice(7, 9), 16) / 255;
  const r = Math.round(parseInt(fg.slice(1, 3), 16) * a + parseInt(bg.slice(1, 3), 16) * (1 - a));
  const g = Math.round(parseInt(fg.slice(3, 5), 16) * a + parseInt(bg.slice(3, 5), 16) * (1 - a));
  const b = Math.round(parseInt(fg.slice(5, 7), 16) * a + parseInt(bg.slice(5, 7), 16) * (1 - a));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export const COLOR_SCHEMES: Record<ColorSchemeName, ColorScheme> = {
  /* Default — blue-gray, optimised for B&W print (~12% density) */
  default: {
    name: "default",
    swatch: "#64748b",
    sidebarBg: "#dfe4ec",
    sidebarText: "#1e293b",
    sidebarMuted: "#64748b",
    sidebarSeparator: "#c4cad5",
    sidebarBadgeBg: "#384152",
    sidebarBadgeText: "#ffffff",
    heading: "#1e293b",
    separator: "#cbd5e1",
    bullet: "#334155",
    nameAccent: "#94a3b8",
    pageBg: "#e8ebf0",
    pageBgDark: "#1a1c20",
  },
  /* Clear Child · Dodger Blue #1e90ff */
  peterRiver: {
    name: "peterRiver",
    swatch: "#1e90ff",
    sidebarBg: "#1a7ed6",
    sidebarText: "#ffffff",
    sidebarMuted: "#ffffff66",
    sidebarSeparator: "#ffffff33",
    sidebarBadgeBg: "#ffffff33",
    sidebarBadgeText: "#ffffff",
    heading: "#1a7ed6",
    separator: "#1e90ff40",
    bullet: "#1e90ff",
    nameAccent: "#1e90ff",
    pageBg: "#e8f2fb",
    pageBgDark: "#181d22",
  },
  /* Emerald · Nephritis #27ae60 */
  emerald: {
    name: "emerald",
    swatch: "#2ecc71",
    sidebarBg: "#27ae60",
    sidebarText: "#ffffff",
    sidebarMuted: "#ffffff66",
    sidebarSeparator: "#ffffff33",
    sidebarBadgeBg: "#ffffff33",
    sidebarBadgeText: "#ffffff",
    heading: "#27ae60",
    separator: "#2ecc7140",
    bullet: "#27ae60",
    nameAccent: "#2ecc71",
    pageBg: "#e9f7ef",
    pageBgDark: "#181e1a",
  },
  /* Carrot · Pumpkin #d35400 */
  carrot: {
    name: "carrot",
    swatch: "#e67e22",
    sidebarBg: "#d35400",
    sidebarText: "#ffffff",
    sidebarMuted: "#ffffff66",
    sidebarSeparator: "#ffffff33",
    sidebarBadgeBg: "#ffffff33",
    sidebarBadgeText: "#ffffff",
    heading: "#d35400",
    separator: "#e67e2240",
    bullet: "#d35400",
    nameAccent: "#e67e22",
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
    nameAccent: "#34495e",
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
