import type { CVData, CloudSettings, SidebarSectionId } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DocPlain = Record<string, any>;

// ---------------------------------------------------------------------------
// Stable stringify for content comparison (keys sorted)
// ---------------------------------------------------------------------------

/**
 * Deep-sort keys and normalize empty values for stable comparison.
 * - Strips keys in `stripKeys` (e.g. "id") at all levels
 * - Treats null, undefined, and "" equally (all skipped) to avoid
 *   false positives from MongoDB null vs local undefined vs empty string
 */
export function stableStringify(obj: unknown, stripKeys?: Set<string>): string {
  if (obj === null || obj === undefined || obj === "") return "null";
  if (typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map((v) => stableStringify(v, stripKeys)).join(",")}]`;
  const rec = obj as Record<string, unknown>;
  const keys = Object.keys(rec)
    .filter((k) => {
      if (stripKeys?.has(k)) return false;
      const v = rec[k];
      // Skip empty values — they're semantically equal across local/cloud
      if (v === null || v === undefined || v === "") return false;
      return true;
    })
    .sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(rec[k], stripKeys)}`).join(",")}}`;
}

// Keys to ignore in fingerprint: "id" differs between local (generateId) and cloud (MongoDB _id)
export const STRIP_KEYS = new Set(["id"]);

export function cvContentFingerprint(data: CVData): string {
  // Strip base64 photos (volatile locally) but keep R2 URLs so they trigger a sync
  const photoUrl = data.personalInfo.photoUrl;
  const stablePhoto = photoUrl?.startsWith("data:") ? undefined : photoUrl;
  const clean = { ...data, personalInfo: { ...data.personalInfo, photoUrl: stablePhoto } };
  return stableStringify(clean, STRIP_KEYS);
}

// ---------------------------------------------------------------------------
// Sort helper
// ---------------------------------------------------------------------------

export function sortBySortOrder<T extends { sortOrder?: number }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

// ---------------------------------------------------------------------------
// MongoDB document <-> CVData mapping
// ---------------------------------------------------------------------------

export function toSettings(plain: DocPlain): CloudSettings {
  const s = plain.settings ?? {};
  return {
    colorScheme: s.colorScheme ?? "ivory",
    fontFamily: s.fontFamily ?? "inter",
    fontSizeLevel: s.fontSizeLevel ?? 2,
    theme: s.theme ?? "light",
    locale: s.locale ?? "es",
    pattern: {
      name: s.pattern?.name ?? "none",
      sidebarIntensity: s.pattern?.sidebarIntensity ?? 3,
      mainIntensity: s.pattern?.mainIntensity ?? 2,
      scope: s.pattern?.scope ?? "sidebar",
    },
  };
}

export function docToCVData(plain: DocPlain): CVData {
  return {
    personalInfo: {
      fullName: plain.personalInfo?.fullName ?? "",
      jobTitle: plain.personalInfo?.jobTitle ?? "",
      photoUrl: plain.personalInfo?.photoUrl,
      email: plain.personalInfo?.email ?? "",
      phone: plain.personalInfo?.phone ?? "",
      location: plain.personalInfo?.location ?? "",
      linkedin: plain.personalInfo?.linkedin ?? "",
      website: plain.personalInfo?.website ?? "",
    },
    summary: plain.personalInfo?.summary ?? "",
    experiences: sortBySortOrder(plain.experiences ?? []).map(
      (e: DocPlain) => ({
        id: e._id?.toString() ?? "",
        company: e.company ?? "",
        position: e.position ?? "",
        startDate: e.startDate ?? "",
        endDate: e.endDate ?? "",
        description: e.description ?? "",
      }),
    ),
    education: sortBySortOrder(plain.education ?? []).map((e: DocPlain) => ({
      id: e._id?.toString() ?? "",
      institution: e.institution ?? "",
      degree: e.degree ?? "",
      startDate: e.startDate ?? "",
      endDate: e.endDate ?? "",
      description: e.description,
    })),
    skillCategories: sortBySortOrder(plain.skillCategories ?? []).map(
      (s: DocPlain) => ({
        id: s._id?.toString() ?? "",
        category: s.name ?? "",
        items: sortBySortOrder(s.items ?? []).map(
          (i: DocPlain) => (i.name ?? "") as string,
        ),
      }),
    ),
    courses: sortBySortOrder(plain.courses ?? []).map((c: DocPlain) => ({
      id: c._id?.toString() ?? "",
      name: c.name ?? "",
      institution: c.institution ?? "",
      date: c.date ?? "",
      description: c.description,
    })),
    certifications: sortBySortOrder(plain.certifications ?? []).map(
      (c: DocPlain) => ({
        id: c._id?.toString() ?? "",
        name: c.name ?? "",
        issuer: c.issuer ?? "",
        date: c.date ?? "",
        description: c.description,
      }),
    ),
    awards: sortBySortOrder(plain.awards ?? []).map((a: DocPlain) => ({
      id: a._id?.toString() ?? "",
      name: a.name ?? "",
      issuer: a.issuer ?? "",
      date: a.date ?? "",
      description: a.description,
    })),
    visibility: {
      location: plain.visibility?.location ?? true,
      linkedin: plain.visibility?.linkedin ?? true,
      website: plain.visibility?.website ?? true,
      summary: plain.visibility?.summary ?? true,
      courses: plain.visibility?.courses ?? false,
      certifications: plain.visibility?.certifications ?? false,
      awards: plain.visibility?.awards ?? false,
    },
    sidebarSections: sortBySortOrder(plain.sidebarSections ?? [])
      .map((s: DocPlain) => s.sectionId as SidebarSectionId)
      .filter(Boolean),
  };
}

export function cvDataToDoc(cvData: CVData, settings?: CloudSettings) {
  return {
    title: cvData.personalInfo.fullName || "Untitled CV",
    personalInfo: {
      fullName: cvData.personalInfo.fullName,
      jobTitle: cvData.personalInfo.jobTitle,
      photoUrl: cvData.personalInfo.photoUrl,
      email: cvData.personalInfo.email,
      phone: cvData.personalInfo.phone,
      location: cvData.personalInfo.location,
      linkedin: cvData.personalInfo.linkedin,
      website: cvData.personalInfo.website,
      summary: cvData.summary,
    },
    ...(settings ? { settings } : {}),
    visibility: cvData.visibility,
    sidebarSections: cvData.sidebarSections.map((id, i) => ({
      sectionId: id,
      sortOrder: i,
    })),
    experiences: cvData.experiences.map((e, i) => ({
      company: e.company,
      position: e.position,
      startDate: e.startDate,
      endDate: e.endDate,
      description: e.description,
      sortOrder: i,
    })),
    education: cvData.education.map((e, i) => ({
      institution: e.institution,
      degree: e.degree,
      startDate: e.startDate,
      endDate: e.endDate,
      description: e.description,
      sortOrder: i,
    })),
    skillCategories: cvData.skillCategories.map((s, i) => ({
      name: s.category,
      sortOrder: i,
      items: s.items.map((item, j) => ({ name: item, sortOrder: j })),
    })),
    certifications: cvData.certifications.map((c, i) => ({
      name: c.name,
      issuer: c.issuer,
      date: c.date,
      description: c.description,
      sortOrder: i,
    })),
    courses: cvData.courses.map((c, i) => ({
      name: c.name,
      institution: c.institution,
      date: c.date,
      description: c.description,
      sortOrder: i,
    })),
    awards: cvData.awards.map((a, i) => ({
      name: a.name,
      issuer: a.issuer,
      date: a.date,
      description: a.description,
      sortOrder: i,
    })),
  };
}
