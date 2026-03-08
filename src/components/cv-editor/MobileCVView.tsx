"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, MapPin, Linkedin, Globe } from "lucide-react";
import { renderRichDocument } from "@/lib/render-rich-text";
import { DEFAULT_SIDEBAR_SECTIONS } from "@/lib/default-data";
import type { CVData } from "@/lib/types";
import type { ColorScheme } from "@/lib/color-schemes";

function ensureProtocol(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function MobileSectionHeading({
  children,
  color,
  separatorColor,
  fontSize,
}: {
  children: React.ReactNode;
  color: string;
  separatorColor: string;
  fontSize: string;
}) {
  return (
    <div className="mb-3 mt-1">
      <h3
        className="font-semibold uppercase tracking-[0.15em]"
        style={{ color, fontSize }}
      >
        {children}
      </h3>
      <Separator className="mt-1.5" style={{ backgroundColor: separatorColor }} />
    </div>
  );
}

export function MobileCVView({
  data,
  colors,
  photoUrl,
  fontFamilyOverride,
}: {
  data: CVData;
  colors: ColorScheme;
  photoUrl?: string;
  fontFamilyOverride?: string;
}) {
  const t = useTranslations("printable");
  const { personalInfo, summary, experiences, education, skillCategories, courses, certifications, awards, visibility } = data;
  const sidebarSections = data.sidebarSections ?? DEFAULT_SIDEBAR_SECTIONS;
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  // SSR hydration fix: if the image loaded before React hydrated, onLoad won't fire.
  const photoRef = useCallback((el: HTMLImageElement | null) => {
    if (el?.complete && el.naturalWidth > 0) setImageLoaded(true);
  }, []);

  const initials = personalInfo.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const mg = (px: number) => Math.round(px * 1.6);

  const fs = {
    heading: "2.8em",
    subheading: "1.26em",
    itemTitle: "1.17em",
    body: "1em",
    small: "1em",
    tiny: "0.9em",
    section: "0.9em",
  };

  return (
    <div
      className="cv-preview-content bg-white font-sans overflow-x-hidden"
      style={{ fontFamily: fontFamilyOverride ?? "var(--font-inter), Inter, sans-serif" }}
    >
      {/* Mobile Header */}
      <div className={`flex flex-col items-center px-6 ${visibility.photo ? "pt-16" : "pt-16 pb-12"}`}>
        {visibility.photo ? (
          <div className="flex flex-col items-center mb-6">
            <div
              className="w-44 h-44 rounded-full grid place-items-center overflow-hidden relative"
              style={{ backgroundColor: "#e5e7eb" }}
            >
              <span
                className={`text-4xl font-medium leading-none tracking-wide select-none transition-opacity duration-300 ${imageLoaded ? "opacity-0" : "opacity-100"}`}
                style={{ color: "#9ca3af" }}
              >
                {initials}
              </span>
              {photoUrl && !imageFailed && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  ref={photoRef}
                  src={photoUrl}
                  alt={personalInfo.fullName}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageFailed(true)}
                />
              )}
            </div>
          </div>
        ) : null}

        <div className={visibility.photo ? "mb-4" : ""}>
          {(() => {
            // Mobile header is always on white background — use a color visible on white.
            // sidebarBadgeBg may contain alpha (e.g. wetAsphalt "#ffffff33"), fall back to heading color.
            const noPhotoBg = colors.sidebarBadgeBg.length <= 7 ? colors.sidebarBadgeBg : colors.heading;
            const nameClr = visibility.photo ? colors.nameColor : noPhotoBg;
            const titleClr = visibility.photo ? undefined : noPhotoBg;
            return (
              <>
                <h1
                  className="font-semibold tracking-tight leading-tight"
                  style={{ fontSize: fs.heading, color: nameClr }}
                >
                  {personalInfo.fullName}
                </h1>
                {visibility.photo && colors.nameAccent !== "transparent" && (
                  <div
                    className="mt-1 h-0.5 w-12 rounded-full"
                    style={{ backgroundColor: colors.nameAccent }}
                  />
                )}
                <div className="mt-3">
                  <p
                    className="font-medium uppercase tracking-wide"
                    style={{ fontSize: fs.small, color: titleClr ?? undefined }}
                  >
                    {personalInfo.jobTitle}
                  </p>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Sidebar content */}
      <div className="relative" style={{ backgroundColor: colors.sidebarBg, padding: mg(24) }}>
        <div className="relative space-y-5">
        {sidebarSections.map((sectionId) => {
          if (sectionId === "contact") {
            const hasFields = personalInfo.email || personalInfo.phone || (visibility.location && personalInfo.location) || (visibility.linkedin && personalInfo.linkedin) || (visibility.website && personalInfo.website);
            if (!hasFields) return null;
            return (
              <div key="contact" className="space-y-2">
                <MobileSectionHeading color={colors.sidebarText} separatorColor={colors.sidebarSeparator} fontSize={fs.section}>
                  {t("contact")}
                </MobileSectionHeading>
                <div className="space-y-1.5">
                  {personalInfo.email && (
                    <div className="flex items-center gap-2" style={{ color: colors.sidebarText, fontSize: fs.small }}>
                      <Mail className="h-3 w-3 shrink-0" style={{ color: colors.sidebarAccent }} />
                      <a href={`mailto:${personalInfo.email}`} style={{ color: "inherit", textDecoration: "none" }}>{personalInfo.email}</a>
                    </div>
                  )}
                  {personalInfo.phone && (
                    <div className="flex items-center gap-2" style={{ color: colors.sidebarText, fontSize: fs.small }}>
                      <Phone className="h-3 w-3 shrink-0" style={{ color: colors.sidebarAccent }} />
                      <a href={`tel:${personalInfo.phone}`} style={{ color: "inherit", textDecoration: "none" }}>{personalInfo.phone}</a>
                    </div>
                  )}
                  {visibility.location && personalInfo.location && (
                    <div className="flex items-center gap-2" style={{ color: colors.sidebarText, fontSize: fs.small }}>
                      <MapPin className="h-3 w-3 shrink-0" style={{ color: colors.sidebarAccent }} />
                      <span>{personalInfo.location}</span>
                    </div>
                  )}
                  {visibility.linkedin && personalInfo.linkedin && (
                    <div className="flex items-center gap-2" style={{ color: colors.sidebarText, fontSize: fs.small }}>
                      <Linkedin className="h-3 w-3 shrink-0" style={{ color: colors.sidebarAccent }} />
                      {personalInfo.linkedinUrl ? (
                        <a href={ensureProtocol(personalInfo.linkedinUrl)} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>{personalInfo.linkedin}</a>
                      ) : (
                        <span>{personalInfo.linkedin}</span>
                      )}
                    </div>
                  )}
                  {visibility.website && personalInfo.website && (
                    <div className="flex items-center gap-2" style={{ color: colors.sidebarText, fontSize: fs.small }}>
                      <Globe className="h-3 w-3 shrink-0" style={{ color: colors.sidebarAccent }} />
                      {personalInfo.websiteUrl ? (
                        <a href={ensureProtocol(personalInfo.websiteUrl)} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>{personalInfo.website}</a>
                      ) : (
                        <span>{personalInfo.website}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          }
          if (sectionId === "summary") {
            if (!visibility.summary || !summary) return null;
            return (
              <div key="summary">
                <MobileSectionHeading color={colors.sidebarText} separatorColor={colors.sidebarSeparator} fontSize={fs.section}>
                  {t("aboutMe")}
                </MobileSectionHeading>
                <div className="leading-relaxed" style={{ color: colors.sidebarText, fontSize: fs.body }}>
                  {renderRichDocument(summary)}
                </div>
              </div>
            );
          }
          if (sectionId === "skills") {
            if (skillCategories.length === 0) return null;
            return (
              <div key="skills">
                <MobileSectionHeading color={colors.sidebarText} separatorColor={colors.sidebarSeparator} fontSize={fs.section}>
                  {t("skills")}
                </MobileSectionHeading>
                <div className="space-y-3">
                  {skillCategories.map((group) => (
                    <div key={group.id}>
                      <p
                        className="font-semibold uppercase tracking-wide mb-1"
                        style={{ color: colors.sidebarText, fontSize: fs.tiny }}
                      >
                        {group.category}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {group.items.map((item, i) => (
                          <span
                            key={i}
                            className="inline-block rounded px-2 py-0.5"
                            style={{ backgroundColor: colors.sidebarBadgeBg, color: colors.sidebarBadgeText, fontSize: fs.tiny }}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          return null;
        })}
        </div>
      </div>

      {/* Main content */}
      <div className="relative" style={{ padding: `${mg(16)}px ${mg(24)}px ${mg(24)}px` }}>
        <div className="relative space-y-5">
        {experiences.length > 0 && (
          <div>
            <MobileSectionHeading color={colors.heading} separatorColor={colors.separator} fontSize={fs.section}>
              {t("experience")}
            </MobileSectionHeading>
            <div className="space-y-2.5">
              {experiences.map((exp) => (
                <div key={exp.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
                    <h4 className="font-semibold" style={{ fontSize: fs.itemTitle, color: colors.entryTitle }}>{exp.company}</h4>
                    <div className="flex items-baseline gap-1 shrink-0">
                      <span className="text-gray-400" style={{ fontSize: fs.tiny }}>{exp.startDate}</span>
                      <span className="text-gray-400" style={{ fontSize: fs.tiny }}>—</span>
                      <span className="text-gray-400" style={{ fontSize: fs.tiny }}>{exp.endDate}</span>
                    </div>
                  </div>
                  <p className="mt-0.5 font-medium text-gray-600" style={{ fontSize: fs.small }}>{exp.position}</p>
                  {exp.description && (
                    <div className="mt-1.5" style={{ fontSize: fs.body, "--bullet-color": colors.bullet } as React.CSSProperties}>
                      {renderRichDocument(exp.description)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {education.length > 0 && (
          <div>
            <MobileSectionHeading color={colors.heading} separatorColor={colors.separator} fontSize={fs.section}>
              {t("education")}
            </MobileSectionHeading>
            <div className="space-y-2.5">
              {education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
                    <h4 className="font-semibold" style={{ fontSize: fs.itemTitle, color: colors.entryTitle }}>{edu.institution}</h4>
                    <div className="flex items-baseline gap-1 shrink-0">
                      <span className="text-gray-400" style={{ fontSize: fs.tiny }}>{edu.startDate}</span>
                      <span className="text-gray-400" style={{ fontSize: fs.tiny }}>—</span>
                      <span className="text-gray-400" style={{ fontSize: fs.tiny }}>{edu.endDate}</span>
                    </div>
                  </div>
                  <p className="mt-0.5 font-medium text-gray-600" style={{ fontSize: fs.small }}>{edu.degree}</p>
                  {edu.description && (
                    <div className="mt-1.5" style={{ fontSize: fs.body, "--bullet-color": colors.bullet } as React.CSSProperties}>
                      {renderRichDocument(edu.description)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {visibility.courses && courses.length > 0 && (
          <div>
            <MobileSectionHeading color={colors.heading} separatorColor={colors.separator} fontSize={fs.section}>
              {t("courses")}
            </MobileSectionHeading>
            <div className="space-y-2.5">
              {courses.map((course) => (
                <div key={course.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
                    <h4 className="font-semibold" style={{ fontSize: fs.itemTitle, color: colors.entryTitle }}>{course.name}</h4>
                    <span className="shrink-0 text-gray-400" style={{ fontSize: fs.tiny }}>{course.date}</span>
                  </div>
                  <p className="mt-0.5 font-medium text-gray-600" style={{ fontSize: fs.small }}>{course.institution}</p>
                  {course.description && (
                    <div className="mt-1.5" style={{ fontSize: fs.body, "--bullet-color": colors.bullet } as React.CSSProperties}>
                      {renderRichDocument(course.description)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {visibility.certifications && certifications.length > 0 && (
          <div>
            <MobileSectionHeading color={colors.heading} separatorColor={colors.separator} fontSize={fs.section}>
              {t("certifications")}
            </MobileSectionHeading>
            <div className="space-y-2.5">
              {certifications.map((cert) => (
                <div key={cert.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
                    <h4 className="font-semibold" style={{ fontSize: fs.itemTitle, color: colors.entryTitle }}>{cert.name}</h4>
                    <span className="shrink-0 text-gray-400" style={{ fontSize: fs.tiny }}>{cert.date}</span>
                  </div>
                  <p className="mt-0.5 font-medium text-gray-600" style={{ fontSize: fs.small }}>{cert.issuer}</p>
                  {cert.description && (
                    <div className="mt-1.5" style={{ fontSize: fs.body, "--bullet-color": colors.bullet } as React.CSSProperties}>
                      {renderRichDocument(cert.description)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {visibility.awards && awards.length > 0 && (
          <div>
            <MobileSectionHeading color={colors.heading} separatorColor={colors.separator} fontSize={fs.section}>
              {t("awards")}
            </MobileSectionHeading>
            <div className="space-y-2.5">
              {awards.map((award) => (
                <div key={award.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
                    <h4 className="font-semibold" style={{ fontSize: fs.itemTitle, color: colors.entryTitle }}>{award.name}</h4>
                    <span className="shrink-0 text-gray-400" style={{ fontSize: fs.tiny }}>{award.date}</span>
                  </div>
                  <p className="mt-0.5 font-medium text-gray-600" style={{ fontSize: fs.small }}>{award.issuer}</p>
                  {award.description && (
                    <div className="mt-1.5" style={{ fontSize: fs.body, "--bullet-color": colors.bullet } as React.CSSProperties}>
                      {renderRichDocument(award.description)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
