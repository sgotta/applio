"use server";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import CV from "@/lib/models/cv";
import User from "@/lib/models/user";
import type { CVData, CloudSettings, SidebarSectionId } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers: lightweight inline mapping for structural diffs between CVData
// and Mongoose subdocuments (summary location, skill items, sidebarSections,
// sortOrder, id/_id). Field names are already aligned after the rename.
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DocPlain = Record<string, any>;

function sortBySortOrder<T extends { sortOrder?: number }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

function toSettings(plain: DocPlain): CloudSettings {
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

function docToCVData(plain: DocPlain): CVData {
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

function cvDataToDoc(cvData: CVData, settings?: CloudSettings) {
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

// ---------------------------------------------------------------------------
// Authenticated helpers
// ---------------------------------------------------------------------------

async function getSessionUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

// ---------------------------------------------------------------------------
// Server Actions
// ---------------------------------------------------------------------------

/**
 * Upsert the user's CV. Creates a new document if none exists,
 * updates the existing one otherwise. Rejects base64 photo data.
 */
export async function saveCV(
  cvData: CVData,
  settings?: CloudSettings,
): Promise<{ id: string; updatedAt: string }> {
  const userId = await getSessionUserId();

  // Reject base64 photos — only R2 URLs should be persisted
  if (cvData.personalInfo.photoUrl?.startsWith("data:")) {
    cvData = {
      ...cvData,
      personalInfo: { ...cvData.personalInfo, photoUrl: undefined },
    };
  }

  await connectDB();

  const update = cvDataToDoc(cvData, settings);
  const doc = await CV.findOneAndUpdate(
    { userId },
    { $set: update },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return {
    id: doc._id.toString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/**
 * Load the authenticated user's CV. Returns null if no CV exists.
 */
export async function loadCV(): Promise<{
  id: string;
  cvData: CVData;
  settings: CloudSettings;
  isPublished: boolean;
  slug: string | null;
  updatedAt: string;
} | null> {
  const userId = await getSessionUserId();
  await connectDB();

  const doc = await CV.findOne({ userId });
  if (!doc) return null;

  const plain = doc.toObject();
  return {
    id: doc._id.toString(),
    cvData: docToCVData(plain),
    settings: toSettings(plain),
    isPublished: doc.isPublished,
    slug: doc.slug ?? null,
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/**
 * Fetch the authenticated user's subscription plan.
 * Returns "pro" only if the subscription is active (plan === "pro" AND
 * currentPeriodEnd is in the future).
 */
export async function fetchPlan(): Promise<{
  plan: "free" | "pro";
  isActive: boolean;
  currentPeriodEnd: string | null;
}> {
  const userId = await getSessionUserId();
  await connectDB();

  const user = await User.findById(userId).select("subscription").lean();
  if (!user?.subscription) {
    return { plan: "free", isActive: false, currentPeriodEnd: null };
  }

  const { plan, currentPeriodEnd } = user.subscription;
  const isActive =
    plan === "pro" && !!currentPeriodEnd && new Date(currentPeriodEnd) > new Date();

  return {
    plan: isActive ? "pro" : "free",
    isActive,
    currentPeriodEnd: currentPeriodEnd?.toISOString() ?? null,
  };
}

/**
 * Publish the user's CV. Generates a random 8-char slug if none exists.
 */
export async function publishCV(): Promise<{
  slug: string;
}> {
  const userId = await getSessionUserId();
  await connectDB();

  const doc = await CV.findOne({ userId });
  if (!doc) throw new Error("CV not found");

  if (!doc.slug) {
    doc.slug = Math.random().toString(36).substring(2, 10);
  }
  doc.isPublished = true;
  await doc.save();

  return { slug: doc.slug };
}

/**
 * Unpublish the user's CV.
 */
export async function unpublishCV(): Promise<void> {
  const userId = await getSessionUserId();
  await connectDB();

  await CV.findOneAndUpdate({ userId }, { $set: { isPublished: false } });
}
