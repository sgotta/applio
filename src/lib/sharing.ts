import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import type { CVData, SharedCVData, SidebarSectionId } from "./types";
import { defaultVisibility, DEFAULT_SIDEBAR_ORDER } from "./default-data";
import {
  COLOR_SCHEME_NAMES,
  DEFAULT_COLOR_SCHEME,
  type ColorSchemeName,
} from "./color-schemes";
import {
  SIDEBAR_PATTERN_NAMES,
  PATTERN_SCOPES,
  type SidebarPatternName,
  type PatternScope,
  type PatternIntensity,
} from "./sidebar-patterns";
import { FONT_FAMILY_IDS, type FontFamilyId } from "./fonts";

/**
 * Build the shareable data payload from the editor state.
 * Strips the base64 photo from personalInfo to keep URLs small.
 * If a photoUrl (R2) is provided, it is included instead.
 */
export function buildSharedData(
  data: CVData,
  settings: { colorScheme: string; fontSizeLevel: number; marginLevel: number },
  photoUrl?: string
): SharedCVData {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { photo, ...personalInfoWithoutPhoto } = data.personalInfo;
  return {
    cv: {
      ...data,
      personalInfo: {
        ...personalInfoWithoutPhoto,
        ...(photoUrl ? { photoUrl } : {}),
      },
    },
    settings,
    sharedAt: new Date().toISOString(),
  };
}

/**
 * Compress SharedCVData to a URL-safe string.
 */
export function compressSharedData(shared: SharedCVData): string {
  return compressToEncodedURIComponent(JSON.stringify(shared));
}

/**
 * Decompress a URL hash string back to SharedCVData.
 * Returns null if decompression or validation fails.
 */
export function decompressSharedData(hash: string): SharedCVData | null {
  try {
    const json = decompressFromEncodedURIComponent(hash);
    if (!json) return null;
    const parsed = JSON.parse(json);
    return validateSharedData(parsed);
  } catch {
    return null;
  }
}

/**
 * Generate the full share URL for the current origin.
 */
export function generateShareURL(compressed: string): string {
  const base =
    typeof window !== "undefined"
      ? `${window.location.origin}/view`
      : "https://applio.dev/view";
  return `${base}#${compressed}`;
}

function validateSharedData(data: unknown): SharedCVData | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;

  if (!d.cv || typeof d.cv !== "object") return null;
  const cv = d.cv as Record<string, unknown>;

  if (!cv.personalInfo || typeof cv.personalInfo !== "object") return null;
  const pi = cv.personalInfo as Record<string, unknown>;
  if (typeof pi.fullName !== "string") return null;

  const rawSettings = (d.settings || {}) as Record<string, unknown>;
  const colorScheme =
    typeof rawSettings.colorScheme === "string" &&
    COLOR_SCHEME_NAMES.includes(rawSettings.colorScheme as ColorSchemeName)
      ? rawSettings.colorScheme
      : DEFAULT_COLOR_SCHEME;
  const fontSizeLevel =
    typeof rawSettings.fontSizeLevel === "number" &&
    [1, 2, 3].includes(rawSettings.fontSizeLevel)
      ? rawSettings.fontSizeLevel
      : 2;
  const fontFamily =
    typeof rawSettings.fontFamily === "string" &&
    FONT_FAMILY_IDS.includes(rawSettings.fontFamily as FontFamilyId)
      ? rawSettings.fontFamily
      : undefined;
  const marginLevel =
    typeof rawSettings.marginLevel === "number" &&
    [1, 2].includes(rawSettings.marginLevel)
      ? rawSettings.marginLevel
      : 1;

  // Validate pattern settings
  const rawPattern = rawSettings.pattern as Record<string, unknown> | undefined;
  const pattern = rawPattern && typeof rawPattern === "object"
    ? {
        name: typeof rawPattern.name === "string" && SIDEBAR_PATTERN_NAMES.includes(rawPattern.name as SidebarPatternName) ? rawPattern.name : "none",
        sidebarIntensity: typeof rawPattern.sidebarIntensity === "number" && Number.isInteger(rawPattern.sidebarIntensity) && rawPattern.sidebarIntensity >= 1 && rawPattern.sidebarIntensity <= 5 ? rawPattern.sidebarIntensity : 3,
        mainIntensity: typeof rawPattern.mainIntensity === "number" && Number.isInteger(rawPattern.mainIntensity) && rawPattern.mainIntensity >= 1 && rawPattern.mainIntensity <= 5 ? rawPattern.mainIntensity : 2,
        scope: typeof rawPattern.scope === "string" && PATTERN_SCOPES.includes(rawPattern.scope as PatternScope) ? rawPattern.scope : "sidebar",
      }
    : undefined;

  return {
    cv: {
      personalInfo: {
        fullName: String(pi.fullName || ""),
        title: String(pi.title || ""),
        email: String(pi.email || ""),
        phone: String(pi.phone || ""),
        location: String(pi.location || ""),
        linkedin: String(pi.linkedin || ""),
        website: String(pi.website || ""),
        ...(typeof pi.linkedinUrl === "string" && pi.linkedinUrl
          ? { linkedinUrl: pi.linkedinUrl }
          : {}),
        ...(typeof pi.websiteUrl === "string" && pi.websiteUrl
          ? { websiteUrl: pi.websiteUrl }
          : {}),
        ...(typeof pi.photoUrl === "string" && pi.photoUrl
          ? { photoUrl: pi.photoUrl }
          : {}),
      },
      summary: typeof cv.summary === "string" ? cv.summary : "",
      experience: Array.isArray(cv.experience) ? cv.experience : [],
      education: Array.isArray(cv.education) ? cv.education : [],
      skills: Array.isArray(cv.skills) ? cv.skills : [],
      courses: Array.isArray(cv.courses) ? cv.courses : [],
      certifications: Array.isArray(cv.certifications)
        ? cv.certifications
        : [],
      awards: Array.isArray(cv.awards) ? cv.awards : [],
      visibility: {
        ...defaultVisibility,
        ...((cv.visibility as object) || {}),
      },
      sidebarOrder: (() => {
        if (!Array.isArray(cv.sidebarOrder)) return [...DEFAULT_SIDEBAR_ORDER];
        const valid = (cv.sidebarOrder as unknown[]).filter(
          (id): id is SidebarSectionId =>
            typeof id === "string" && (DEFAULT_SIDEBAR_ORDER as readonly string[]).includes(id)
        );
        for (const id of DEFAULT_SIDEBAR_ORDER) {
          if (!valid.includes(id)) valid.push(id);
        }
        return valid;
      })(),
    },
    settings: { colorScheme, fontSizeLevel, marginLevel, ...(fontFamily ? { fontFamily } : {}), ...(pattern ? { pattern } : {}) },
    sharedAt:
      typeof d.sharedAt === "string" ? d.sharedAt : new Date().toISOString(),
  };
}
