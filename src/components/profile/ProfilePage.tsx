"use client";

import { memo, useState, useEffect } from "react";
import { COLOR_SCHEMES, type ColorSchemeName } from "@/lib/color-schemes";
import type {
  ProfileSocialLinks,
  ProfileVisibleSections,
  SkillCategory,
  ExperienceItem,
  EducationItem,
  CourseItem,
  CertificationItem,
  AwardItem,
  BulletItem,
} from "@/lib/types";
import {
  Github, Twitter, Instagram, Youtube,
  Linkedin, Globe, Dribbble, BookOpen,
  Code, Layers, MapPin, Mail,
  Briefcase, GraduationCap, Award, BookMarked, ShieldCheck,
  FileText,
} from "lucide-react";
import { StarButton } from "./StarButton";

/* ── Social icon mapping ─────────────────────────────── */

interface SocialDef {
  key: keyof ProfileSocialLinks;
  label: string;
  icon: React.ElementType;
}

const SOCIAL_DEFS: SocialDef[] = [
  { key: "github_url", label: "GitHub", icon: Github },
  { key: "twitter_url", label: "X / Twitter", icon: Twitter },
  { key: "instagram_url", label: "Instagram", icon: Instagram },
  { key: "youtube_url", label: "YouTube", icon: Youtube },
  { key: "linkedin_url", label: "LinkedIn", icon: Linkedin },
  { key: "website_url", label: "Website", icon: Globe },
  { key: "dribbble_url", label: "Dribbble", icon: Dribbble },
  { key: "behance_url", label: "Behance", icon: Globe },
  { key: "medium_url", label: "Medium", icon: BookOpen },
  { key: "dev_to_url", label: "Dev.to", icon: Code },
  { key: "tiktok_url", label: "TikTok", icon: Globe },
  { key: "stackoverflow_url", label: "Stack Overflow", icon: Layers },
];

function ensureProtocol(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/* ── Props ────────────────────────────────────────────── */

interface ProfilePageProps {
  displayName: string;
  title?: string;
  bio?: string;
  photoUrl?: string;
  email?: string;
  location?: string;
  socialLinks: ProfileSocialLinks;
  skills: SkillCategory[];
  experience: ExperienceItem[];
  education: EducationItem[];
  courses: CourseItem[];
  certifications: CertificationItem[];
  awards: AwardItem[];
  colorScheme: ColorSchemeName;
  visibleSections: ProfileVisibleSections;
  starCount: number;
  profileId: string;
  profileUserId: string;
  labels: {
    skills: string;
    experience: string;
    education: string;
    courses: string;
    certifications: string;
    awards: string;
  };
  fontCssStack: string;
  fontCssUrl?: string;
}

/* ── Component ────────────────────────────────────────── */

export const ProfilePage = memo(function ProfilePage({
  displayName,
  title,
  bio,
  photoUrl,
  email,
  location,
  socialLinks,
  skills,
  experience,
  education,
  courses,
  certifications,
  awards,
  colorScheme,
  visibleSections,
  starCount,
  profileId,
  profileUserId,
  labels,
  fontCssStack,
  fontCssUrl,
}: ProfilePageProps) {
  const colors = COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES.ivory;
  const isLightSidebar = colors.sidebarText !== "#ffffff";
  const accentColor = isLightSidebar ? colors.nameAccent : colors.sidebarBg;

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  // Load Google Font CSS if needed
  useEffect(() => {
    if (!fontCssUrl) return;
    const id = `profile-font-${fontCssUrl.replace(/\W/g, "")}`.slice(0, 64);
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = fontCssUrl;
    document.head.appendChild(link);
  }, [fontCssUrl]);

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Filter active social links
  const activeSocials = SOCIAL_DEFS.filter(
    (s) => socialLinks[s.key] && (socialLinks[s.key] as string).trim()
  );

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: fontCssStack }}>
      {/* ── Hero ──────────────────────────────────── */}
      <div className="relative overflow-hidden">
        {/* Gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd, ${accentColor}99)`,
          }}
        />
        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative mx-auto max-w-2xl px-6 pb-16 pt-20 text-center sm:pt-24 sm:pb-20">
          {/* Photo */}
          <div className="mb-6 flex justify-center">
            <div
              className="relative h-28 w-28 overflow-hidden rounded-full ring-4 ring-white/30 shadow-xl sm:h-32 sm:w-32"
              style={{ backgroundColor: `${isLightSidebar ? accentColor : "white"}20` }}
            >
              <span
                className={`absolute inset-0 flex items-center justify-center text-3xl font-semibold select-none transition-opacity duration-300 sm:text-4xl ${imageLoaded ? "opacity-0" : "opacity-100"}`}
                style={{ color: isLightSidebar ? `${accentColor}80` : "rgba(255,255,255,0.6)" }}
              >
                {initials}
              </span>
              {photoUrl && !imageFailed && (
                <img
                  src={photoUrl}
                  alt={displayName}
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageFailed(true)}
                />
              )}
            </div>
          </div>

          {/* Name & title */}
          <h1
            className="text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ color: isLightSidebar ? "#111827" : "#ffffff" }}
          >
            {displayName}
          </h1>
          {title && (
            <p
              className="mt-2 text-lg font-medium sm:text-xl"
              style={{ color: isLightSidebar ? "#6b7280" : "rgba(255,255,255,0.8)" }}
            >
              {title}
            </p>
          )}

          {/* Location & email chips */}
          {(location || email) && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              {location && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm"
                  style={{
                    backgroundColor: isLightSidebar ? `${accentColor}15` : "rgba(255,255,255,0.15)",
                    color: isLightSidebar ? "#374151" : "rgba(255,255,255,0.9)",
                  }}
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {location}
                </span>
              )}
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm transition-opacity hover:opacity-80"
                  style={{
                    backgroundColor: isLightSidebar ? `${accentColor}15` : "rgba(255,255,255,0.15)",
                    color: isLightSidebar ? "#374151" : "rgba(255,255,255,0.9)",
                  }}
                >
                  <Mail className="h-3.5 w-3.5" />
                  {email}
                </a>
              )}
            </div>
          )}

          {/* Bio */}
          {visibleSections.bio && bio && (
            <p
              className="mx-auto mt-6 max-w-lg text-base leading-relaxed sm:text-lg"
              style={{ color: isLightSidebar ? "#4b5563" : "rgba(255,255,255,0.85)" }}
            >
              {bio}
            </p>
          )}

          {/* Social links */}
          {activeSocials.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {activeSocials.map(({ key, label, icon: Icon }) => (
                <a
                  key={key}
                  href={ensureProtocol(socialLinks[key] as string)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full transition-all hover:scale-110"
                  style={{
                    backgroundColor: isLightSidebar ? `${accentColor}12` : "rgba(255,255,255,0.15)",
                    color: isLightSidebar ? "#374151" : "rgba(255,255,255,0.9)",
                  }}
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          )}

          {/* Star button */}
          <div className="mt-6">
            <StarButton
              profileId={profileId}
              profileUserId={profileUserId}
              initialCount={starCount}
              accentColor={accentColor}
              isLightSidebar={isLightSidebar}
            />
          </div>
        </div>
      </div>

      {/* ── Content sections ──────────────────────── */}
      <div className="mx-auto max-w-2xl space-y-8 px-6 py-10 sm:py-14">
        {/* Skills */}
        {visibleSections.skills && skills.length > 0 && (
          <section>
            <SectionHeading icon={Layers} color={accentColor}>
              {labels.skills}
            </SectionHeading>
            <div className="mt-4 space-y-4">
              {skills.map((group) => (
                <div key={group.id}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {group.category}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((item, i) => (
                      <span
                        key={i}
                        className="rounded-full px-3 py-1 text-sm font-medium text-gray-700"
                        style={{ backgroundColor: `${accentColor}12`, color: "#374151" }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Experience */}
        {visibleSections.experience && experience.length > 0 && (
          <section>
            <SectionHeading icon={Briefcase} color={accentColor}>
              {labels.experience}
            </SectionHeading>
            <div className="mt-4 space-y-6">
              {experience.map((exp) => (
                <div key={exp.id} className="relative pl-6">
                  <span
                    className="absolute left-0 top-2 h-2 w-2 rounded-full"
                    style={{ backgroundColor: accentColor }}
                  />
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                    <h3 className="text-base font-semibold text-gray-900">
                      {exp.company}
                    </h3>
                    <span className="shrink-0 text-sm text-gray-400">
                      {exp.startDate} — {exp.endDate}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-500">{exp.position}</p>
                  {exp.roleDescription && exp.roleDescription.trim() && (
                    <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                      {exp.roleDescription}
                    </p>
                  )}
                  {exp.description.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {exp.description.map((bullet: string | BulletItem, i: number) => {
                        const item: BulletItem = typeof bullet === "string" ? { text: bullet, type: "bullet" } : bullet;
                        if (item.type === "title") {
                          return <li key={i} className="mt-2 text-sm font-semibold text-gray-900 first:mt-0 list-none">{item.text}</li>;
                        }
                        if (item.type === "subtitle") {
                          return <li key={i} className="text-sm font-medium text-gray-800 list-none">{item.text}</li>;
                        }
                        if (item.type === "comment") {
                          return <li key={i} className="text-sm italic text-gray-400 list-none">{item.text}</li>;
                        }
                        return (
                          <li key={i} className="relative pl-4 text-sm leading-relaxed text-gray-600">
                            <span className="absolute left-0 top-0" style={{ color: accentColor }}>&bull;</span>
                            {item.text}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {visibleSections.education && education.length > 0 && (
          <section>
            <SectionHeading icon={GraduationCap} color={accentColor}>
              {labels.education}
            </SectionHeading>
            <div className="mt-4 space-y-4">
              {education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                    <h3 className="text-base font-semibold text-gray-900">
                      {edu.institution}
                    </h3>
                    <span className="shrink-0 text-sm text-gray-400">
                      {edu.startDate} — {edu.endDate}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-500">{edu.degree}</p>
                  {edu.description && (
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">
                      {edu.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Courses */}
        {visibleSections.courses && courses.length > 0 && (
          <section>
            <SectionHeading icon={BookMarked} color={accentColor}>
              {labels.courses}
            </SectionHeading>
            <div className="mt-4 space-y-3">
              {courses.map((course) => (
                <div key={course.id} className="flex items-baseline justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{course.name}</h3>
                    <p className="text-sm text-gray-500">{course.institution}</p>
                  </div>
                  <span className="shrink-0 text-sm text-gray-400">{course.date}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Certifications */}
        {visibleSections.certifications && certifications.length > 0 && (
          <section>
            <SectionHeading icon={ShieldCheck} color={accentColor}>
              {labels.certifications}
            </SectionHeading>
            <div className="mt-4 space-y-3">
              {certifications.map((cert) => (
                <div key={cert.id} className="flex items-baseline justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{cert.name}</h3>
                    <p className="text-sm text-gray-500">{cert.issuer}</p>
                  </div>
                  <span className="shrink-0 text-sm text-gray-400">{cert.date}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Awards */}
        {visibleSections.awards && awards.length > 0 && (
          <section>
            <SectionHeading icon={Award} color={accentColor}>
              {labels.awards}
            </SectionHeading>
            <div className="mt-4 space-y-3">
              {awards.map((award) => (
                <div key={award.id} className="flex items-baseline justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{award.name}</h3>
                    <p className="text-sm text-gray-500">{award.issuer}</p>
                  </div>
                  <span className="shrink-0 text-sm text-gray-400">{award.date}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── Footer ────────────────────────────────── */}
      <footer className="border-t border-gray-200 py-6 text-center">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-gray-400 transition-colors hover:text-gray-500"
        >
          <FileText className="h-3.5 w-3.5" />
          <span className="text-sm">Applio</span>
        </a>
      </footer>
    </div>
  );
});

/* ── Section heading helper ──────────────────────────── */

function SectionHeading({
  children,
  icon: Icon,
  color,
}: {
  children: React.ReactNode;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex h-8 w-8 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <h2 className="text-lg font-semibold text-gray-900">{children}</h2>
    </div>
  );
}
