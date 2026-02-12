export type ColorSchemeName =
  | "ivory"
  | "peterRiver"
  | "emerald"
  | "alizarin"
  | "sunFlower"
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
}

export const COLOR_SCHEMES: Record<ColorSchemeName, ColorScheme> = {
  /* Ivory — warm off-white, clean default */
  ivory: {
    name: "ivory",
    swatch: "#b5b0a6",
    sidebarBg: "#fdfdfd",
    sidebarText: "#4b5563",
    sidebarMuted: "#9ca3af",
    sidebarSeparator: "#e5e7eb",
    sidebarBadgeBg: "#f3f4f6",
    sidebarBadgeText: "#374151",
    heading: "#6b7280",
    separator: "#e5e7eb",
    bullet: "#9ca3af",
    nameAccent: "#b5b0a6",
  },
  /* Clear Child · Dodger Blue #1e90ff */
  peterRiver: {
    name: "peterRiver",
    swatch: "#1e90ff",
    sidebarBg: "#1a7ed6",
    sidebarText: "#ffffff",
    sidebarMuted: "#ffffff66",
    sidebarSeparator: "#ffffff33",
    sidebarBadgeBg: "#ffffff26",
    sidebarBadgeText: "#ffffff",
    heading: "#1a7ed6",
    separator: "#1e90ff40",
    bullet: "#1e90ff",
    nameAccent: "#1e90ff",
  },
  /* Emerald · Nephritis #27ae60 */
  emerald: {
    name: "emerald",
    swatch: "#2ecc71",
    sidebarBg: "#27ae60",
    sidebarText: "#ffffff",
    sidebarMuted: "#ffffff66",
    sidebarSeparator: "#ffffff33",
    sidebarBadgeBg: "#ffffff26",
    sidebarBadgeText: "#ffffff",
    heading: "#27ae60",
    separator: "#2ecc7140",
    bullet: "#27ae60",
    nameAccent: "#2ecc71",
  },
  /* Bruschetta Tomato #ff6348 */
  alizarin: {
    name: "alizarin",
    swatch: "#ff6348",
    sidebarBg: "#e04530",
    sidebarText: "#ffffff",
    sidebarMuted: "#ffffff66",
    sidebarSeparator: "#ffffff33",
    sidebarBadgeBg: "#ffffff26",
    sidebarBadgeText: "#ffffff",
    heading: "#e04530",
    separator: "#ff634840",
    bullet: "#e04530",
    nameAccent: "#ff6348",
  },
  /* Sun Flower #f1c40f — light bg, dark text */
  sunFlower: {
    name: "sunFlower",
    swatch: "#f1c40f",
    sidebarBg: "#f1c40f",
    sidebarText: "#2c3e50",
    sidebarMuted: "#2c3e5066",
    sidebarSeparator: "#2c3e5033",
    sidebarBadgeBg: "#2c3e501a",
    sidebarBadgeText: "#2c3e50",
    heading: "#9a7d0a",
    separator: "#f1c40f40",
    bullet: "#d4ac0d",
    nameAccent: "#f1c40f",
  },
  /* Carrot · Pumpkin #d35400 */
  carrot: {
    name: "carrot",
    swatch: "#e67e22",
    sidebarBg: "#d35400",
    sidebarText: "#ffffff",
    sidebarMuted: "#ffffff66",
    sidebarSeparator: "#ffffff33",
    sidebarBadgeBg: "#ffffff26",
    sidebarBadgeText: "#ffffff",
    heading: "#d35400",
    separator: "#e67e2240",
    bullet: "#d35400",
    nameAccent: "#e67e22",
  },
  /* Wet Asphalt · Midnight Blue #2c3e50 */
  wetAsphalt: {
    name: "wetAsphalt",
    swatch: "#34495e",
    sidebarBg: "#2c3e50",
    sidebarText: "#ffffff",
    sidebarMuted: "#ffffff66",
    sidebarSeparator: "#ffffff33",
    sidebarBadgeBg: "#ffffff26",
    sidebarBadgeText: "#ffffff",
    heading: "#2c3e50",
    separator: "#34495e40",
    bullet: "#34495e",
    nameAccent: "#34495e",
  },
};

export const COLOR_SCHEME_NAMES: ColorSchemeName[] = [
  "ivory",
  "peterRiver",
  "emerald",
  "alizarin",
  "sunFlower",
  "carrot",
  "wetAsphalt",
];

export const DEFAULT_COLOR_SCHEME: ColorSchemeName = "ivory";

export function getColorScheme(name: ColorSchemeName): ColorScheme {
  return COLOR_SCHEMES[name] || COLOR_SCHEMES.ivory;
}
