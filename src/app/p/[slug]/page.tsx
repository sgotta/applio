import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProfilePage } from "@/components/profile/ProfilePage";
import type { ColorSchemeName } from "@/lib/color-schemes";
import type { ProfileVisibleSections, ProfileSocialLinks, SkillCategory, ExperienceItem, EducationItem, CourseItem, CertificationItem, AwardItem } from "@/lib/types";
import { FONT_FAMILIES, type FontFamilyId } from "@/lib/fonts";

/* ── Load translations for a given locale ─────────────── */

const LOCALE_LOADERS: Record<string, () => Promise<Record<string, Record<string, string>>>> = {
  en: () => import("@/messages/en.json").then((m) => m.default),
  es: () => import("@/messages/es.json").then((m) => m.default),
  fr: () => import("@/messages/fr.json").then((m) => m.default),
  pt: () => import("@/messages/pt.json").then((m) => m.default),
  de: () => import("@/messages/de.json").then((m) => m.default),
  it: () => import("@/messages/it.json").then((m) => m.default),
  ru: () => import("@/messages/ru.json").then((m) => m.default),
  tr: () => import("@/messages/tr.json").then((m) => m.default),
  zh: () => import("@/messages/zh.json").then((m) => m.default),
  ja: () => import("@/messages/ja.json").then((m) => m.default),
  ko: () => import("@/messages/ko.json").then((m) => m.default),
  hi: () => import("@/messages/hi.json").then((m) => m.default),
  th: () => import("@/messages/th.json").then((m) => m.default),
};

async function getSectionLabels(locale: string) {
  const loader = LOCALE_LOADERS[locale] || LOCALE_LOADERS.en;
  const messages = await loader();
  const p = messages.printable || {};
  return {
    skills: p.skills || "Skills",
    experience: p.experience || "Experience",
    education: p.education || "Education",
    courses: p.courses || "Courses",
    certifications: p.certifications || "Certifications",
    awards: p.awards || "Awards",
  };
}

/* ── Profile row type ─────────────────────────────────── */

interface ProfileRow {
  id: string;
  user_id: string;
  slug: string;
  display_name: string;
  title: string | null;
  bio: string | null;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  github_url: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  dribbble_url: string | null;
  behance_url: string | null;
  medium_url: string | null;
  dev_to_url: string | null;
  stackoverflow_url: string | null;
  skills: SkillCategory[];
  experience: ExperienceItem[];
  education: EducationItem[];
  courses: CourseItem[];
  certifications: CertificationItem[];
  awards: AwardItem[];
  color_scheme: string;
  locale: string | null;
  font_family: string | null;
  visible_sections: ProfileVisibleSections;
  star_count: number;
}

async function getProfile(slug: string): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("slug", slug)
    .single();
  return data as ProfileRow | null;
}

/* ── Page ─────────────────────────────────────────────── */

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getProfile(slug);
  if (!profile) return { title: "Profile not found" };

  const title = profile.title
    ? `${profile.display_name} — ${profile.title}`
    : profile.display_name;

  return {
    title: `${title} | Applio`,
    description: profile.bio || `${profile.display_name}'s professional profile on Applio.`,
    openGraph: {
      title,
      description: profile.bio || `${profile.display_name}'s professional profile.`,
      type: "profile",
      ...(profile.photo_url ? { images: [{ url: profile.photo_url }] } : {}),
    },
  };
}

export default async function ProfileSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const profile = await getProfile(slug);
  if (!profile) notFound();

  // Load translations for the profile owner's locale
  const profileLocale = profile.locale || "en";
  const labels = await getSectionLabels(profileLocale);

  // Resolve font family
  const fontId = (profile.font_family || "inter") as FontFamilyId;
  const fontDef = FONT_FAMILIES.find((f) => f.id === fontId);
  const fontCssStack = fontDef?.cssStack || "'Inter', sans-serif";
  const fontCssUrl = fontDef?.googleFontsCss2Url || undefined;

  const socialLinks: ProfileSocialLinks = {
    linkedin_url: profile.linkedin_url || undefined,
    website_url: profile.website_url || undefined,
    github_url: profile.github_url || undefined,
    twitter_url: profile.twitter_url || undefined,
    instagram_url: profile.instagram_url || undefined,
    youtube_url: profile.youtube_url || undefined,
    tiktok_url: profile.tiktok_url || undefined,
    dribbble_url: profile.dribbble_url || undefined,
    behance_url: profile.behance_url || undefined,
    medium_url: profile.medium_url || undefined,
    dev_to_url: profile.dev_to_url || undefined,
    stackoverflow_url: profile.stackoverflow_url || undefined,
  };

  return (
    <ProfilePage
      displayName={profile.display_name}
      title={profile.title || undefined}
      bio={profile.bio || undefined}
      photoUrl={profile.photo_url || undefined}
      email={profile.email || undefined}
      location={profile.location || undefined}
      socialLinks={socialLinks}
      skills={profile.skills || []}
      experience={profile.experience || []}
      education={profile.education || []}
      courses={profile.courses || []}
      certifications={profile.certifications || []}
      awards={profile.awards || []}
      colorScheme={(profile.color_scheme || "ivory") as ColorSchemeName}
      visibleSections={profile.visible_sections}
      starCount={profile.star_count || 0}
      profileId={profile.id}
      profileUserId={profile.user_id}
      labels={labels}
      fontCssStack={fontCssStack}
      fontCssUrl={fontCssUrl}
    />
  );
}
