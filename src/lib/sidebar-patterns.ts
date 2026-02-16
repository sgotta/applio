export type SidebarPatternName =
  | "none"
  | "dots";

export type PatternScope = "sidebar" | "main" | "full";
export type PatternIntensity = 1 | 2 | 3 | 4 | 5;

export interface PatternSettings {
  name: SidebarPatternName;
  sidebarIntensity: PatternIntensity;
  mainIntensity: PatternIntensity;
  scope: PatternScope;
}

export const DEFAULT_PATTERN_SETTINGS: PatternSettings = {
  name: "none",
  sidebarIntensity: 3,
  mainIntensity: 2,
  scope: "sidebar",
};

export interface SidebarPattern {
  name: SidebarPatternName;
  /** Returns inline CSS background properties for the pattern overlay */
  getStyle: (color: string, intensity: PatternIntensity) => React.CSSProperties;
}

/**
 * Builds a pattern overlay color.
 * `color` should be the sidebar text color (white for dark bgs, dark for light bgs).
 */
function c(color: string, opacity: number): string {
  if (color.startsWith("#")) {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${opacity})`;
  }
  return color;
}

/**
 * Intensity 1–5 → opacity multiplier.
 * Exponential curve so each step is visually distinct:
 *   1 → 0.06,  2 → 0.13,  3 → 0.22,  4 → 0.36,  5 → 0.55
 */
const INTENSITY_MUL: Record<number, number> = {
  1: 0.35,
  2: 0.7,
  3: 1.2,
  4: 2.0,
  5: 3.0,
};

function intensityMultiplier(level: number): number {
  return INTENSITY_MUL[level] ?? 1.2;
}

export const SIDEBAR_PATTERNS: Record<SidebarPatternName, SidebarPattern> = {
  none: {
    name: "none",
    getStyle: () => ({}),
  },

  dots: {
    name: "dots",
    getStyle: (color, intensity) => {
      const opacity = 0.18 * intensityMultiplier(intensity);
      return {
        backgroundImage: `radial-gradient(circle, ${c(color, opacity)} 1px, transparent 1px)`,
        backgroundSize: "12px 12px",
      };
    },
  },
};

export const SIDEBAR_PATTERN_NAMES: SidebarPatternName[] = [
  "none",
  "dots",
];

export const PATTERN_SCOPES: PatternScope[] = ["sidebar", "main", "full"];

export function getSidebarPattern(name: SidebarPatternName): SidebarPattern {
  return SIDEBAR_PATTERNS[name] || SIDEBAR_PATTERNS.none;
}
