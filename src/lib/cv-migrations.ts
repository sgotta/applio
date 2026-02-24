import type { CVData, SidebarSectionId } from "./types";
import { defaultVisibility, DEFAULT_SIDEBAR_SECTIONS } from "./default-data";

export function moveItem<T>(
  arr: T[],
  index: number,
  direction: "up" | "down"
): T[] {
  const newArr = [...arr];
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= newArr.length) return newArr;
  [newArr[index], newArr[targetIndex]] = [newArr[targetIndex], newArr[index]];
  return newArr;
}

/** Ensure sidebarSections is a valid array containing all section IDs */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function migrateSidebarSections(raw: any): SidebarSectionId[] {
  if (!Array.isArray(raw)) return [...DEFAULT_SIDEBAR_SECTIONS];
  const valid = raw.filter(
    (id: unknown): id is SidebarSectionId =>
      typeof id === "string" &&
      (DEFAULT_SIDEBAR_SECTIONS as readonly string[]).includes(id)
  );
  // Append any missing sections at the end
  for (const id of DEFAULT_SIDEBAR_SECTIONS) {
    if (!valid.includes(id)) valid.push(id);
  }
  return valid;
}

/** Convert **markdown** bold to <strong>HTML</strong>. Idempotent — ignores text without ** */
export function migrateMarkdownBold(text: string): string {
  if (!text || !text.includes("**")) return text;
  return text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

/** Convert a BulletItem[] array to a single Tiptap HTML string */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function migrateBulletsToHtml(bullets: any[]): string {
  if (!Array.isArray(bullets))
    return typeof bullets === "string" ? bullets : "";

  // Group consecutive items of the same list type
  const groups: { type: string; items: string[] }[] = [];
  for (const b of bullets) {
    const text = migrateMarkdownBold(
      typeof b === "string" ? b : b.text || ""
    );
    const type: string =
      typeof b === "string" ? "bullet" : b.type || "bullet";
    // Normalize old type names
    const normalized =
      type === "subheading"
        ? "title"
        : type === "comment"
          ? "bullet"
          : type === "code"
            ? "paragraph"
            : type;

    const listType =
      normalized === "bullet" ? "ul" : normalized === "numbered" ? "ol" : null;
    const last = groups[groups.length - 1];

    if (listType && last?.type === listType) {
      last.items.push(text);
    } else if (listType) {
      groups.push({ type: listType, items: [text] });
    } else {
      groups.push({ type: normalized, items: [text] });
    }
  }

  // Convert each group to HTML
  return groups
    .map((g) => {
      if (g.type === "ul" || g.type === "ol") {
        const lis = g.items.map((t) => `<li><p>${t}</p></li>`).join("");
        return `<${g.type}>${lis}</${g.type}>`;
      }
      return g.items
        .map((t) => {
          switch (g.type) {
            case "title":
              return `<h2>${t}</h2>`;
            case "subtitle":
              return `<h3>${t}</h3>`;
            case "heading3":
              return `<h4>${t}</h4>`;
            case "quote":
              return `<blockquote><p>${t}</p></blockquote>`;
            default:
              return `<p>${t}</p>`; // paragraph
          }
        })
        .join("");
    })
    .join("");
}

// Migración: si los datos guardados tienen el formato viejo (contacts array), convertir a campos individuales
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function migrateCVData(data: any): CVData {
  const personalInfo = data.personalInfo || {};

  // Si tiene contacts array (formato viejo), extraer los valores
  if (Array.isArray(personalInfo.contacts)) {
    const contacts = personalInfo.contacts;
    const findContact = (type: string) =>
      contacts.find((c: { type: string }) => c.type === type)?.value || "";

    const oldResult: CVData = {
      personalInfo: {
        fullName: personalInfo.fullName || "",
        jobTitle: personalInfo.jobTitle || personalInfo.title || "",
        photoUrl: personalInfo.photoUrl || personalInfo.photo,
        email: findContact("email") || personalInfo.email || "",
        phone: findContact("phone") || personalInfo.phone || "",
        location: findContact("location") || personalInfo.location || "",
        linkedin: findContact("linkedin") || personalInfo.linkedin || "",
        website: findContact("website") || personalInfo.website || "",
        linkedinUrl: personalInfo.linkedinUrl,
        websiteUrl: personalInfo.websiteUrl,
      },
      summary: data.summary || "",
      experiences: data.experiences || data.experience || [],
      education: data.education || [],
      skillCategories: data.skillCategories || data.skills || [],
      courses: data.courses || [],
      certifications: data.certifications || [],
      awards: data.awards || [],
      visibility: { ...defaultVisibility, ...data.visibility },
      sidebarSections: migrateSidebarSections(data.sidebarSections || data.sidebarOrder),
    };

    // Migrate bullets to HTML string + roleDescription → paragraph prepended
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    oldResult.experiences = oldResult.experiences.map((exp: any) => {
      const roleDesc = exp.roleDescription?.trim();
      const bullets = Array.isArray(exp.description) ? exp.description : [];
      const allBullets = roleDesc
        ? [{ text: roleDesc, type: "paragraph" }, ...bullets]
        : bullets;
      return {
        ...exp,
        description: migrateBulletsToHtml(allBullets),
        roleDescription: undefined,
      };
    });

    // Migrate **markdown bold** → <strong>HTML</strong>
    oldResult.summary = migrateMarkdownBold(oldResult.summary);
    oldResult.education = oldResult.education.map((edu) => ({
      ...edu,
      description: edu.description
        ? migrateMarkdownBold(edu.description)
        : edu.description,
    }));

    return oldResult;
  }

  // Already in new format, just ensure all fields exist
  const result: CVData = {
    personalInfo: {
      fullName: personalInfo.fullName || "",
      jobTitle: personalInfo.jobTitle || personalInfo.title || "",
      photoUrl: personalInfo.photoUrl || personalInfo.photo,
      email: personalInfo.email || "",
      phone: personalInfo.phone || "",
      location: personalInfo.location || "",
      linkedin: personalInfo.linkedin || "",
      website: personalInfo.website || "",
      linkedinUrl: personalInfo.linkedinUrl,
      websiteUrl: personalInfo.websiteUrl,
    },
    summary: data.summary || "",
    experiences: data.experiences || data.experience || [],
    education: data.education || [],
    skillCategories: data.skillCategories || data.skills || [],
    courses: data.courses || [],
    certifications: data.certifications || [],
    awards: data.awards || [],
    visibility: { ...defaultVisibility, ...data.visibility },
    sidebarSections: migrateSidebarSections(data.sidebarSections || data.sidebarOrder),
  };

  // Migrate bullets (BulletItem[] or string[]) to HTML string + roleDescription → paragraph prepended
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result.experiences = result.experiences.map((exp: any) => {
    // Already migrated to string — skip
    if (typeof exp.description === "string") return exp;
    const roleDesc = exp.roleDescription?.trim();
    const bullets = Array.isArray(exp.description) ? exp.description : [];
    const allBullets = roleDesc
      ? [{ text: roleDesc, type: "paragraph" }, ...bullets]
      : bullets;
    return {
      ...exp,
      description: migrateBulletsToHtml(allBullets),
      roleDescription: undefined,
    };
  });

  // Migrate **markdown bold** → <strong>HTML</strong> (rich text migration)
  result.summary = migrateMarkdownBold(result.summary);
  result.education = result.education.map((edu) => ({
    ...edu,
    description: edu.description
      ? migrateMarkdownBold(edu.description)
      : edu.description,
  }));

  return result;
}
