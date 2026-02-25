"use server";

import { connectDB } from "@/lib/mongoose";
import CV from "@/lib/models/cv";
import type { CVData, CloudSettings, SidebarSectionId } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DocPlain = Record<string, any>;

function sortBySortOrder<T extends { sortOrder?: number }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

/**
 * Fetch a published CV by its slug. Public — no auth required.
 * Returns null if the slug doesn't exist or the CV is not published.
 */
export async function fetchPublishedCVBySlug(slug: string): Promise<{
  cvData: CVData;
  settings: CloudSettings;
} | null> {
  await connectDB();

  const doc = await CV.findOne({ slug, isPublished: true });
  if (!doc) return null;

  const plain = doc.toObject();

  const cvData: CVData = {
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

  const settings: CloudSettings = {
    colorScheme: plain.settings?.colorScheme ?? "ivory",
    fontFamily: plain.settings?.fontFamily ?? "inter",
    fontSizeLevel: plain.settings?.fontSizeLevel ?? 2,
    theme: plain.settings?.theme ?? "light",
    locale: plain.settings?.locale ?? "es",
    pattern: {
      name: plain.settings?.pattern?.name ?? "none",
      sidebarIntensity: plain.settings?.pattern?.sidebarIntensity ?? 3,
      mainIntensity: plain.settings?.pattern?.mainIntensity ?? 2,
      scope: plain.settings?.pattern?.scope ?? "sidebar",
    },
  };

  return { cvData, settings };
}
