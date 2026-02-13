import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import type { CVData, SharedCVData } from "./types";
import { defaultVisibility } from "./default-data";
import {
  COLOR_SCHEME_NAMES,
  DEFAULT_COLOR_SCHEME,
  type ColorSchemeName,
} from "./color-schemes";

/**
 * Build the shareable data payload from the editor state.
 * Strips the photo from personalInfo to keep URLs small.
 */
export function buildSharedData(
  data: CVData,
  settings: { colorScheme: string; fontSizeLevel: number; marginLevel: number }
): SharedCVData {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { photo, ...personalInfoWithoutPhoto } = data.personalInfo;
  return {
    cv: { ...data, personalInfo: personalInfoWithoutPhoto },
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
    [1, 2].includes(rawSettings.fontSizeLevel)
      ? rawSettings.fontSizeLevel
      : 1;
  const marginLevel =
    typeof rawSettings.marginLevel === "number" &&
    [1, 2].includes(rawSettings.marginLevel)
      ? rawSettings.marginLevel
      : 1;

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
    },
    settings: { colorScheme, fontSizeLevel, marginLevel },
    sharedAt:
      typeof d.sharedAt === "string" ? d.sharedAt : new Date().toISOString(),
  };
}
