"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, MapPin, Linkedin, Globe } from "lucide-react";
import { renderRichDocument } from "@/lib/render-rich-text";
import { DEFAULT_SIDEBAR_SECTIONS } from "@/lib/default-data";
import type { CVData, TemplateId } from "@/lib/types";
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
  templateId,
}: {
  data: CVData;
  colors: ColorScheme;
  photoUrl?: string;
  fontFamilyOverride?: string;
  templateId?: TemplateId;
}) {
  const t = useTranslations("printable");
  const { personalInfo, summary, experiences, education, skillCategories, courses, certifications, awards, languages, visibility } = data;
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
    heading: "2.16em",
    subheading: "1.26em",
    itemTitle: "1.17em",
    body: "1em",
    small: "1em",
    tiny: "0.9em",
    section: "0.9em",
  };

  // ---- NoPhoto template: single-column layout without photo or sidebar ----
  if (templateId === "noPhoto") {
    const langItems = languages ?? [];
    const noPhotoContactItems = [
      personalInfo.email && (
        <span key="email" className="inline-flex items-center gap-1">
          <Mail className="h-3 w-3 shrink-0" style={{ color: colors.heading }} />
          <a href={`mailto:${personalInfo.email}`} style={{ color: "inherit", textDecoration: "none" }}>{personalInfo.email}</a>
        </span>
      ),
      personalInfo.phone && (
        <span key="phone" className="inline-flex items-center gap-1">
          <Phone className="h-3 w-3 shrink-0" style={{ color: colors.heading }} />
          <a href={`tel:${personalInfo.phone}`} style={{ color: "inherit", textDecoration: "none" }}>{personalInfo.phone}</a>
        </span>
      ),
      (visibility.location && personalInfo.location) && (
        <span key="location" className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3 shrink-0" style={{ color: colors.heading }} />
          <span>{personalInfo.location}</span>
        </span>
      ),
      (visibility.linkedin && personalInfo.linkedin) && (
        <span key="linkedin" className="inline-flex items-center gap-1">
          <Linkedin className="h-3 w-3 shrink-0" style={{ color: colors.heading }} />
          {personalInfo.linkedinUrl ? (
            <a href={ensureProtocol(personalInfo.linkedinUrl)} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>{personalInfo.linkedin}</a>
          ) : (
            <span>{personalInfo.linkedin}</span>
          )}
        </span>
      ),
      (visibility.website && personalInfo.website) && (
        <span key="website" className="inline-flex items-center gap-1">
          <Globe className="h-3 w-3 shrink-0" style={{ color: colors.heading }} />
          {personalInfo.websiteUrl ? (
            <a href={ensureProtocol(personalInfo.websiteUrl)} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>{personalInfo.website}</a>
          ) : (
            <span>{personalInfo.website}</span>
          )}
        </span>
      ),
    ].filter(Boolean);

    return (
      <div
        className="cv-preview-content bg-white font-sans overflow-x-hidden"
        style={{ fontFamily: fontFamilyOverride ?? "var(--font-inter), Inter, sans-serif" }}
      >
        {/* Top accent bar */}
        <div style={{ height: 3, backgroundColor: colors.heading }} />

        {/* Header */}
        <div style={{ padding: `${mg(26)}px ${mg(24)}px ${mg(18)}px` }}>
          <h1 className="font-semibold tracking-tight text-gray-900" style={{ fontSize: fs.heading }}>
            {personalInfo.fullName}
          </h1>
          {colors.nameAccent !== "transparent" && (
            <div className="mt-1 h-0.5 w-10 rounded-full" style={{ backgroundColor: colors.nameAccent }} />
          )}
          <div className="mt-0.5">
            <p className="font-medium uppercase tracking-wide" style={{ color: colors.heading, fontSize: fs.subheading }}>
              {personalInfo.jobTitle}
            </p>
          </div>
          {noPhotoContactItems.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-y-1.5" style={{ color: "#777", fontSize: fs.tiny }}>
              {noPhotoContactItems.map((item, idx) => (
                <span key={idx} className="inline-flex items-center">
                  {idx > 0 && <span className="mx-2 text-[10px]" style={{ color: `${colors.heading}35` }}>·</span>}
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: `${colors.heading}14`, marginLeft: mg(24), marginRight: mg(24) }} />

        {/* Content */}
        <div className="space-y-5" style={{ padding: `${mg(16)}px ${mg(24)}px ${mg(24)}px` }}>
          {visibility.summary && summary && (
            <div>
              <MobileSectionHeading color={colors.heading} separatorColor={colors.separator} fontSize={fs.section}>
                {t("aboutMe")}
              </MobileSectionHeading>
              <div className="leading-relaxed" style={{ color: "#444", fontSize: fs.body }}>
                {renderRichDocument(summary)}
              </div>
            </div>
          )}

          {experiences.length > 0 && (
            <div>
              <MobileSectionHeading color={colors.heading} separatorColor={colors.separator} fontSize={fs.section}>
                {t("experience")}
              </MobileSectionHeading>
              <div className="space-y-2.5">
                {experiences.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
                      <h4 className="font-semibold text-gray-900" style={{ fontSize: fs.itemTitle }}>{exp.company}</h4>
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
                      <h4 className="font-semibold text-gray-900" style={{ fontSize: fs.itemTitle }}>{edu.institution}</h4>
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
                      <h4 className="font-semibold text-gray-900" style={{ fontSize: fs.itemTitle }}>{course.name}</h4>
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
                      <h4 className="font-semibold text-gray-900" style={{ fontSize: fs.itemTitle }}>{cert.name}</h4>
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
                      <h4 className="font-semibold text-gray-900" style={{ fontSize: fs.itemTitle }}>{award.name}</h4>
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

          {visibility.languages && langItems.length > 0 && (
            <div>
              <MobileSectionHeading color={colors.heading} separatorColor={colors.separator} fontSize={fs.section}>
                {t("languages")}
              </MobileSectionHeading>
              <div className="flex flex-wrap gap-2">
                {langItems.map((lang) => (
                  <div key={lang.id} className="inline-flex items-baseline gap-1.5">
                    <span className="font-semibold text-gray-800" style={{ fontSize: fs.small }}>{lang.language}</span>
                    <span className="inline-flex items-center rounded px-1.5 py-0.5" style={{ backgroundColor: `${colors.heading}12`, color: colors.heading, fontSize: "11px" }}>{lang.level}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {skillCategories.length > 0 && (
            <div>
              <MobileSectionHeading color={colors.heading} separatorColor={colors.separator} fontSize={fs.section}>
                {t("skills")}
              </MobileSectionHeading>
              <div className="space-y-2.5">
                {skillCategories.map((group) => (
                  <div key={group.id}>
                    <p className="text-[9px] font-bold tracking-widest uppercase mb-1.5" style={{ color: colors.heading }}>
                      {group.category}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.items.map((item, i) => (
                        <span key={i} className="inline-flex items-center rounded px-2 py-0.5 text-[11px]" style={{ backgroundColor: `${colors.heading}12`, color: colors.heading }}>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- Executive template: single-column, centered header, pipe contact, no photo ----
  if (templateId === "executive") {
    const langItems = languages ?? [];
    const contactParts: React.ReactNode[] = [];
    if (personalInfo.email) {
      contactParts.push(<a key="email" href={`mailto:${personalInfo.email}`} style={{ color: "#64748b", textDecoration: "none" }}>{personalInfo.email}</a>);
    }
    if (personalInfo.phone) {
      contactParts.push(<a key="phone" href={`tel:${personalInfo.phone}`} style={{ color: "#64748b", textDecoration: "none" }}>{personalInfo.phone}</a>);
    }
    if (visibility.location && personalInfo.location) {
      contactParts.push(<span key="location" style={{ color: "#64748b" }}>{personalInfo.location}</span>);
    }
    if (visibility.linkedin && personalInfo.linkedin) {
      contactParts.push(
        personalInfo.linkedinUrl ? (
          <a key="linkedin" href={ensureProtocol(personalInfo.linkedinUrl)} target="_blank" rel="noopener noreferrer" style={{ color: "#64748b", textDecoration: "none" }}>{personalInfo.linkedin}</a>
        ) : (
          <span key="linkedin" style={{ color: "#64748b" }}>{personalInfo.linkedin}</span>
        )
      );
    }
    if (visibility.website && personalInfo.website) {
      contactParts.push(
        personalInfo.websiteUrl ? (
          <a key="website" href={ensureProtocol(personalInfo.websiteUrl)} target="_blank" rel="noopener noreferrer" style={{ color: "#64748b", textDecoration: "none" }}>{personalInfo.website}</a>
        ) : (
          <span key="website" style={{ color: "#64748b" }}>{personalInfo.website}</span>
        )
      );
    }

    const execHeading = (label: string) => (
      <div className="flex items-center gap-2.5 mb-4 mt-2">
        <div className="flex-1 h-px" style={{ backgroundColor: colors.separator }} />
        <div className="w-1.5 h-1.5 rotate-45 shrink-0" style={{ backgroundColor: colors.heading }} />
        <h3 className="text-[10px] font-bold tracking-[0.22em] uppercase shrink-0" style={{ color: colors.heading }}>
          {label}
        </h3>
        <div className="w-1.5 h-1.5 rotate-45 shrink-0" style={{ backgroundColor: colors.heading }} />
        <div className="flex-1 h-px" style={{ backgroundColor: colors.separator }} />
      </div>
    );

    return (
      <div
        className="cv-preview-content bg-white font-sans overflow-x-hidden"
        style={{ fontFamily: fontFamilyOverride ?? "var(--font-inter), Inter, sans-serif" }}
      >
        {/* Top accent bar */}
        <div style={{ height: 6, backgroundColor: colors.heading }} />

        {/* Header — centered */}
        <div className="text-center" style={{ padding: `${mg(28)}px ${mg(20)}px ${mg(10)}px` }}>
          {/* Photo */}
          <div className="flex justify-center mb-4">
            <div className="w-28 h-28 rounded-full overflow-hidden" style={{ backgroundColor: `${colors.heading}12` }}>
              {data.personalInfo.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.personalInfo.photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-medium" style={{ color: colors.heading }}>
                  {data.personalInfo.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          </div>
          <h1 className="font-semibold" style={{ fontSize: fs.heading, color: colors.heading, letterSpacing: "-0.01em" }}>
            {personalInfo.fullName}
          </h1>
          {colors.nameAccent !== "transparent" && (
            <div className="mx-auto mt-2 h-[3px] w-12 rounded-full" style={{ backgroundColor: colors.nameAccent }} />
          )}
          <p className="mt-2 font-medium uppercase tracking-wide" style={{ fontSize: fs.subheading, color: `${colors.heading}BF` }}>
            {personalInfo.jobTitle}
          </p>
          {contactParts.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-y-1" style={{ fontSize: fs.tiny, backgroundColor: `${colors.heading}0A`, marginLeft: -mg(20), marginRight: -mg(20), padding: `8px ${mg(20)}px` }}>
              {contactParts.map((part, i) => (
                <span key={i} className="inline-flex items-center">
                  {i > 0 && <span className="mx-2" style={{ color: "#cbd5e1" }}>|</span>}
                  {part}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Double rule separator */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3, marginLeft: mg(20), marginRight: mg(20) }}>
          <div className="h-px" style={{ backgroundColor: colors.separator }} />
          <div className="h-px" style={{ backgroundColor: colors.separator }} />
        </div>

        {/* Content */}
        <div className="space-y-5" style={{ padding: `${mg(12)}px ${mg(20)}px ${mg(20)}px` }}>
          {visibility.summary && summary && (
            <div>
              {execHeading(t("aboutMe"))}
              <div className="leading-relaxed" style={{ color: "#374151", fontSize: fs.body }}>
                {renderRichDocument(summary)}
              </div>
            </div>
          )}

          {experiences.length > 0 && (
            <div>
              {execHeading(t("experience"))}
              <div className="space-y-2.5">
                {experiences.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
                      <h4 className="font-semibold text-gray-900" style={{ fontSize: fs.itemTitle }}>{exp.company}</h4>
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
              {execHeading(t("education"))}
              <div className="space-y-2.5">
                {education.map((edu) => (
                  <div key={edu.id}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
                      <h4 className="font-semibold text-gray-900" style={{ fontSize: fs.itemTitle }}>{edu.institution}</h4>
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
              {execHeading(t("courses"))}
              <div className="space-y-2.5">
                {courses.map((course) => (
                  <div key={course.id}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
                      <h4 className="font-semibold text-gray-900" style={{ fontSize: fs.itemTitle }}>{course.name}</h4>
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
              {execHeading(t("certifications"))}
              <div className="space-y-2.5">
                {certifications.map((cert) => (
                  <div key={cert.id}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
                      <h4 className="font-semibold text-gray-900" style={{ fontSize: fs.itemTitle }}>{cert.name}</h4>
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
              {execHeading(t("awards"))}
              <div className="space-y-2.5">
                {awards.map((award) => (
                  <div key={award.id}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
                      <h4 className="font-semibold text-gray-900" style={{ fontSize: fs.itemTitle }}>{award.name}</h4>
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

          {/* Languages — inline with level in parentheses */}
          {visibility.languages && langItems.length > 0 && (
            <div>
              {execHeading(t("languages"))}
              <div className="flex flex-wrap gap-x-4 gap-y-1" style={{ fontSize: fs.body }}>
                {langItems.map((lang) => (
                  <span key={lang.id} className="text-gray-900">
                    {lang.language}{lang.level && <span className="text-gray-400 ml-1">({lang.level})</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {skillCategories.length > 0 && (
            <div>
              {execHeading(t("skills"))}
              <div className="space-y-2.5">
                {skillCategories.map((group) => (
                  <div key={group.id}>
                    <p className="text-[9px] font-bold tracking-widest uppercase mb-1.5" style={{ color: colors.heading }}>
                      {group.category}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.items.map((item, i) => (
                        <span key={i} className="inline-flex items-center rounded px-2 py-0.5 text-[11px]" style={{ border: `1.5px solid ${colors.heading}`, backgroundColor: "transparent", color: colors.heading }}>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    );
  }

  // ---- Modern template: header + sidebar content stacked (mobile) ----
  if (templateId === "modern") {
    const langItems = languages ?? [];

    const modernHeading = (label: string) => (
      <div className="flex items-center gap-2 mb-3 mt-1">
        <div className="shrink-0" style={{ width: 12, height: 2, backgroundColor: colors.nameAccent }} />
        <h3 className="text-xs font-bold tracking-[0.18em] uppercase shrink-0" style={{ color: "#ffffff" }}>
          {label}
        </h3>
      </div>
    );

    return (
      <div
        className="cv-preview-content bg-white font-sans overflow-x-hidden"
        style={{ fontFamily: fontFamilyOverride ?? "var(--font-inter), Inter, sans-serif" }}
      >
        {/* Top accent strip */}
        <div style={{ height: 4, backgroundColor: colors.nameAccent }} />

        {/* Header */}
        <div style={{ padding: `${mg(26)}px ${mg(24)}px ${mg(10)}px` }}>
          <h1 className="font-semibold tracking-tight" style={{ fontSize: fs.heading, color: colors.heading }}>
            {personalInfo.fullName}
          </h1>
          {colors.nameAccent !== "transparent" && (
            <div className="mt-1 h-0.5 w-10 rounded-full" style={{ backgroundColor: colors.nameAccent }} />
          )}
          <p className="mt-1 font-medium uppercase tracking-wide" style={{ fontSize: fs.subheading, color: `${colors.heading}BF` }}>
            {personalInfo.jobTitle}
          </p>
        </div>

        {/* Sidebar content on solid bg */}
        <div style={{ backgroundColor: colors.heading, padding: `${mg(16)}px ${mg(24)}px` }}>
          {/* Photo */}
          <div className="flex justify-center mb-5">
            <div className="w-28 h-28 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.25)" }}>
              {data.personalInfo.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.personalInfo.photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>
                  {data.personalInfo.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-4">
            {/* Contact */}
            {(personalInfo.email || personalInfo.phone || (visibility.location && personalInfo.location) || (visibility.linkedin && personalInfo.linkedin) || (visibility.website && personalInfo.website)) && (
              <div>
                {modernHeading(t("contact"))}
                <div className="space-y-1.5">
                  {personalInfo.email && (
                    <div className="flex items-center gap-2" style={{ color: "rgba(255,255,255,0.85)", fontSize: fs.small }}>
                      <Mail className="h-3 w-3 shrink-0" style={{ color: "#ffffff" }} />
                      <a href={`mailto:${personalInfo.email}`} style={{ color: "inherit", textDecoration: "none" }}>{personalInfo.email}</a>
                    </div>
                  )}
                  {personalInfo.phone && (
                    <div className="flex items-center gap-2" style={{ color: "rgba(255,255,255,0.85)", fontSize: fs.small }}>
                      <Phone className="h-3 w-3 shrink-0" style={{ color: "#ffffff" }} />
                      <a href={`tel:${personalInfo.phone}`} style={{ color: "inherit", textDecoration: "none" }}>{personalInfo.phone}</a>
                    </div>
                  )}
                  {visibility.location && personalInfo.location && (
                    <div className="flex items-center gap-2" style={{ color: "rgba(255,255,255,0.85)", fontSize: fs.small }}>
                      <MapPin className="h-3 w-3 shrink-0" style={{ color: "#ffffff" }} />
                      <span>{personalInfo.location}</span>
                    </div>
                  )}
                  {visibility.linkedin && personalInfo.linkedin && (
                    <div className="flex items-center gap-2" style={{ color: "rgba(255,255,255,0.85)", fontSize: fs.small }}>
                      <Linkedin className="h-3 w-3 shrink-0" style={{ color: "#ffffff" }} />
                      {personalInfo.linkedinUrl ? (
                        <a href={ensureProtocol(personalInfo.linkedinUrl)} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>{personalInfo.linkedin}</a>
                      ) : (
                        <span>{personalInfo.linkedin}</span>
                      )}
                    </div>
                  )}
                  {visibility.website && personalInfo.website && (
                    <div className="flex items-center gap-2" style={{ color: "rgba(255,255,255,0.85)", fontSize: fs.small }}>
                      <Globe className="h-3 w-3 shrink-0" style={{ color: "#ffffff" }} />
                      {personalInfo.websiteUrl ? (
                        <a href={ensureProtocol(personalInfo.websiteUrl)} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>{personalInfo.website}</a>
                      ) : (
                        <span>{personalInfo.website}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Summary */}
            {visibility.summary && summary && (
              <div>
                {modernHeading(t("aboutMe"))}
                <div className="leading-relaxed" style={{ color: "rgba(255,255,255,0.85)", fontSize: fs.body }}>{renderRichDocument(summary)}</div>
              </div>
            )}

            {/* Skills */}
            {skillCategories.length > 0 && (
              <div>
                {modernHeading(t("skills"))}
                <div className="space-y-2.5">
                  {skillCategories.map((group) => (
                    <div key={group.id}>
                      <p className="text-[9px] font-bold tracking-widest uppercase mb-1.5" style={{ color: "#ffffff" }}>{group.category}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {group.items.map((item, i) => (
                          <span key={i} className="inline-flex items-center rounded px-2 py-0.5 text-[11px]" style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#ffffff" }}>{item}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {visibility.languages && langItems.length > 0 && (
              <div>
                {modernHeading(t("languages"))}
                <div className="flex flex-wrap gap-2">
                  {langItems.map((lang) => (
                    <div key={lang.id} className="inline-flex items-baseline gap-1.5">
                      <span className="font-semibold" style={{ fontSize: fs.small, color: "#ffffff" }}>{lang.language}</span>
                      {lang.level && (
                        <span className="inline-flex items-center rounded px-1.5 py-0.5" style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#ffffff", fontSize: "11px" }}>{lang.level}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="space-y-5" style={{ padding: `${mg(16)}px ${mg(24)}px ${mg(24)}px` }}>
          {experiences.length > 0 && (
            <div>
              <MobileSectionHeading color={colors.heading} separatorColor={colors.separator} fontSize={fs.section}>{t("experience")}</MobileSectionHeading>
              <div className="space-y-2.5">
                {experiences.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
                      <h4 className="font-semibold text-gray-900" style={{ fontSize: fs.itemTitle }}>{exp.company}</h4>
                      <div className="flex items-baseline gap-1 shrink-0">
                        <span className="text-gray-400" style={{ fontSize: fs.tiny }}>{exp.startDate}</span>
                        <span className="text-gray-400" style={{ fontSize: fs.tiny }}>—</span>
                        <span className="text-gray-400" style={{ fontSize: fs.tiny }}>{exp.endDate}</span>
                      </div>
                    </div>
                    <p className="mt-0.5 font-medium text-gray-600" style={{ fontSize: fs.small }}>{exp.position}</p>
                    {exp.description && (<div className="mt-1.5" style={{ fontSize: fs.body, "--bullet-color": colors.bullet } as React.CSSProperties}>{renderRichDocument(exp.description)}</div>)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {education.length > 0 && (
            <div>
              <MobileSectionHeading color={colors.heading} separatorColor={colors.separator} fontSize={fs.section}>{t("education")}</MobileSectionHeading>
              <div className="space-y-2.5">
                {education.map((edu) => (
                  <div key={edu.id}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
                      <h4 className="font-semibold text-gray-900" style={{ fontSize: fs.itemTitle }}>{edu.institution}</h4>
                      <div className="flex items-baseline gap-1 shrink-0">
                        <span className="text-gray-400" style={{ fontSize: fs.tiny }}>{edu.startDate}</span>
                        <span className="text-gray-400" style={{ fontSize: fs.tiny }}>—</span>
                        <span className="text-gray-400" style={{ fontSize: fs.tiny }}>{edu.endDate}</span>
                      </div>
                    </div>
                    <p className="mt-0.5 font-medium text-gray-600" style={{ fontSize: fs.small }}>{edu.degree}</p>
                    {edu.description && (<div className="mt-1.5" style={{ fontSize: fs.body, "--bullet-color": colors.bullet } as React.CSSProperties}>{renderRichDocument(edu.description)}</div>)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {visibility.courses && courses.length > 0 && (
            <div>
              <MobileSectionHeading color={colors.heading} separatorColor={colors.separator} fontSize={fs.section}>{t("courses")}</MobileSectionHeading>
              <div className="space-y-2.5">
                {courses.map((course) => (
                  <div key={course.id}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
                      <h4 className="font-semibold text-gray-900" style={{ fontSize: fs.itemTitle }}>{course.name}</h4>
                      <span className="shrink-0 text-gray-400" style={{ fontSize: fs.tiny }}>{course.date}</span>
                    </div>
                    <p className="mt-0.5 font-medium text-gray-600" style={{ fontSize: fs.small }}>{course.institution}</p>
                    {course.description && (<div className="mt-1.5" style={{ fontSize: fs.body, "--bullet-color": colors.bullet } as React.CSSProperties}>{renderRichDocument(course.description)}</div>)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {visibility.certifications && certifications.length > 0 && (
            <div>
              <MobileSectionHeading color={colors.heading} separatorColor={colors.separator} fontSize={fs.section}>{t("certifications")}</MobileSectionHeading>
              <div className="space-y-2.5">
                {certifications.map((cert) => (
                  <div key={cert.id}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
                      <h4 className="font-semibold text-gray-900" style={{ fontSize: fs.itemTitle }}>{cert.name}</h4>
                      <span className="shrink-0 text-gray-400" style={{ fontSize: fs.tiny }}>{cert.date}</span>
                    </div>
                    <p className="mt-0.5 font-medium text-gray-600" style={{ fontSize: fs.small }}>{cert.issuer}</p>
                    {cert.description && (<div className="mt-1.5" style={{ fontSize: fs.body, "--bullet-color": colors.bullet } as React.CSSProperties}>{renderRichDocument(cert.description)}</div>)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {visibility.awards && awards.length > 0 && (
            <div>
              <MobileSectionHeading color={colors.heading} separatorColor={colors.separator} fontSize={fs.section}>{t("awards")}</MobileSectionHeading>
              <div className="space-y-2.5">
                {awards.map((award) => (
                  <div key={award.id}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
                      <h4 className="font-semibold text-gray-900" style={{ fontSize: fs.itemTitle }}>{award.name}</h4>
                      <span className="shrink-0 text-gray-400" style={{ fontSize: fs.tiny }}>{award.date}</span>
                    </div>
                    <p className="mt-0.5 font-medium text-gray-600" style={{ fontSize: fs.small }}>{award.issuer}</p>
                    {award.description && (<div className="mt-1.5" style={{ fontSize: fs.body, "--bullet-color": colors.bullet } as React.CSSProperties}>{renderRichDocument(award.description)}</div>)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer — two-column matching sidebar */}
        <div className="grid grid-cols-[1fr_auto]">
          <div className="flex items-center justify-end text-[10px] text-[#aaaaaa]" style={{ padding: "8px 16px 12px" }}>
            {data.personalInfo.fullName} · {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} · 1 / 1
          </div>
          <div className="flex items-center justify-center" style={{ backgroundColor: colors.heading, padding: "8px 18px 12px", minWidth: 120 }}>
            <a href="https://www.applio.dev/" target="_blank" rel="noopener noreferrer" className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
              Applio ♥
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ---- Timeline template: header + contact, summary outside, vertical line with dots ----
  if (templateId === "timeline") {
    const langItems = languages ?? [];
    const lineColor = `${colors.heading}40`;

    const tlHeading = (label: string) => (
      <div className="flex items-center gap-3 mb-3 mt-1" style={{ marginLeft: -26 }}>
        <div className="shrink-0" style={{ width: 14, height: 14, borderRadius: 9999, backgroundColor: colors.heading, border: "2.5px solid white", boxShadow: `0 0 0 2px ${colors.heading}` }} />
        <h3 className="text-xs font-bold tracking-[0.18em] uppercase shrink-0" style={{ color: colors.heading }}>
          {label}
        </h3>
        <div className="flex-1 h-px" style={{ backgroundColor: `${colors.heading}18` }} />
      </div>
    );

    const bottomHeading = (label: string) => (
      <div className="flex items-center gap-2 mb-3 mt-1">
        <div className="w-0.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: colors.heading }} />
        <h3 className="text-xs font-bold tracking-[0.18em] uppercase shrink-0" style={{ color: colors.heading }}>
          {label}
        </h3>
        <div className="flex-1 h-px" style={{ backgroundColor: `${colors.heading}18` }} />
      </div>
    );

    const noPhotoContactItems = [
      personalInfo.email && (
        <span key="email" className="inline-flex items-center gap-1">
          <Mail className="h-3 w-3 shrink-0" style={{ color: colors.heading }} />
          <a href={`mailto:${personalInfo.email}`} style={{ color: "#64748b", textDecoration: "none" }}>{personalInfo.email}</a>
        </span>
      ),
      personalInfo.phone && (
        <span key="phone" className="inline-flex items-center gap-1">
          <Phone className="h-3 w-3 shrink-0" style={{ color: colors.heading }} />
          <a href={`tel:${personalInfo.phone}`} style={{ color: "#64748b", textDecoration: "none" }}>{personalInfo.phone}</a>
        </span>
      ),
      (visibility.location && personalInfo.location) && (
        <span key="location" className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3 shrink-0" style={{ color: colors.heading }} />
          <span style={{ color: "#64748b" }}>{personalInfo.location}</span>
        </span>
      ),
      (visibility.linkedin && personalInfo.linkedin) && (
        <span key="linkedin" className="inline-flex items-center gap-1">
          <Linkedin className="h-3 w-3 shrink-0" style={{ color: colors.heading }} />
          {personalInfo.linkedinUrl ? (
            <a href={ensureProtocol(personalInfo.linkedinUrl)} target="_blank" rel="noopener noreferrer" style={{ color: "#64748b", textDecoration: "none" }}>{personalInfo.linkedin}</a>
          ) : (
            <span style={{ color: "#64748b" }}>{personalInfo.linkedin}</span>
          )}
        </span>
      ),
      (visibility.website && personalInfo.website) && (
        <span key="website" className="inline-flex items-center gap-1">
          <Globe className="h-3 w-3 shrink-0" style={{ color: colors.heading }} />
          {personalInfo.websiteUrl ? (
            <a href={ensureProtocol(personalInfo.websiteUrl)} target="_blank" rel="noopener noreferrer" style={{ color: "#64748b", textDecoration: "none" }}>{personalInfo.website}</a>
          ) : (
            <span style={{ color: "#64748b" }}>{personalInfo.website}</span>
          )}
        </span>
      ),
    ].filter(Boolean);

    return (
      <div
        className="cv-preview-content bg-white font-sans overflow-x-hidden"
        style={{ fontFamily: fontFamilyOverride ?? "var(--font-inter), Inter, sans-serif" }}
      >
        {/* Header */}
        <div className="flex gap-5 items-start" style={{ padding: `${mg(26)}px ${mg(24)}px ${mg(10)}px` }}>
          {/* Photo */}
          <div className="w-28 h-28 rounded-full overflow-hidden shrink-0" style={{ backgroundColor: `${colors.heading}12` }}>
            {data.personalInfo.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.personalInfo.photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-medium" style={{ color: colors.heading }}>
                {data.personalInfo.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
          <h1 className="font-semibold tracking-tight" style={{ fontSize: fs.heading, color: colors.heading }}>
            {personalInfo.fullName}
          </h1>
          {colors.nameAccent !== "transparent" && (
            <div className="mt-1 h-0.5 w-12 rounded-full" style={{ backgroundColor: colors.nameAccent }} />
          )}
          <p className="mt-1 font-medium uppercase tracking-wide" style={{ fontSize: fs.subheading, color: `${colors.heading}BF` }}>
            {personalInfo.jobTitle}
          </p>
          {noPhotoContactItems.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-y-1.5" style={{ fontSize: fs.tiny }}>
              {noPhotoContactItems.map((item, idx) => (
                <span key={idx} className="inline-flex items-center">
                  {idx > 0 && <span className="mx-2 text-[10px]" style={{ color: `${colors.heading}35` }}>·</span>}
                  {item}
                </span>
              ))}
            </div>
          )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: `${colors.heading}14`, marginLeft: mg(24), marginRight: mg(24) }} />

        {/* Content */}
        <div className="space-y-5" style={{ padding: `${mg(16)}px ${mg(24)}px ${mg(24)}px` }}>

          {/* Summary — outside timeline */}
          {visibility.summary && summary && (
            <div>
              {bottomHeading(t("aboutMe"))}
              <div className="rounded-lg" style={{ backgroundColor: `${colors.heading}08`, borderLeft: `3px solid ${colors.heading}`, padding: "12px 16px" }}>
                <div className="leading-relaxed" style={{ color: "#374151", fontSize: fs.body }}>{renderRichDocument(summary)}</div>
              </div>
            </div>
          )}

          {/* Timeline sections */}
          <div style={{ marginLeft: 18, borderLeft: `3px solid ${lineColor}`, paddingLeft: 20 }}>
            <div className="space-y-5">
              {experiences.length > 0 && (
                <div>
                  {tlHeading(t("experience"))}
                  <div className="space-y-2.5">
                    {experiences.map((exp) => (
                      <div key={exp.id}>
                        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
                          <h4 className="font-semibold text-gray-900" style={{ fontSize: fs.itemTitle }}>{exp.company}</h4>
                          <div className="flex items-baseline gap-1 shrink-0">
                            <span className="text-gray-400" style={{ fontSize: fs.tiny }}>{exp.startDate}</span>
                            <span className="text-gray-400" style={{ fontSize: fs.tiny }}>—</span>
                            <span className="text-gray-400" style={{ fontSize: fs.tiny }}>{exp.endDate}</span>
                          </div>
                        </div>
                        <p className="mt-0.5 font-medium text-gray-600" style={{ fontSize: fs.small }}>{exp.position}</p>
                        {exp.description && (<div className="mt-1.5" style={{ fontSize: fs.body, "--bullet-color": colors.bullet } as React.CSSProperties}>{renderRichDocument(exp.description)}</div>)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {education.length > 0 && (
                <div>
                  {tlHeading(t("education"))}
                  <div className="space-y-2.5">
                    {education.map((edu) => (
                      <div key={edu.id}>
                        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
                          <h4 className="font-semibold text-gray-900" style={{ fontSize: fs.itemTitle }}>{edu.institution}</h4>
                          <div className="flex items-baseline gap-1 shrink-0">
                            <span className="text-gray-400" style={{ fontSize: fs.tiny }}>{edu.startDate}</span>
                            <span className="text-gray-400" style={{ fontSize: fs.tiny }}>—</span>
                            <span className="text-gray-400" style={{ fontSize: fs.tiny }}>{edu.endDate}</span>
                          </div>
                        </div>
                        <p className="mt-0.5 font-medium text-gray-600" style={{ fontSize: fs.small }}>{edu.degree}</p>
                        {edu.description && (<div className="mt-1.5" style={{ fontSize: fs.body, "--bullet-color": colors.bullet } as React.CSSProperties}>{renderRichDocument(edu.description)}</div>)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {visibility.courses && courses.length > 0 && (
                <div>
                  {tlHeading(t("courses"))}
                  <div className="space-y-2.5">
                    {courses.map((course) => (
                      <div key={course.id}>
                        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
                          <h4 className="font-semibold text-gray-900" style={{ fontSize: fs.itemTitle }}>{course.name}</h4>
                          <span className="shrink-0 text-gray-400" style={{ fontSize: fs.tiny }}>{course.date}</span>
                        </div>
                        <p className="mt-0.5 font-medium text-gray-600" style={{ fontSize: fs.small }}>{course.institution}</p>
                        {course.description && (<div className="mt-1.5" style={{ fontSize: fs.body, "--bullet-color": colors.bullet } as React.CSSProperties}>{renderRichDocument(course.description)}</div>)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {visibility.certifications && certifications.length > 0 && (
                <div>
                  {tlHeading(t("certifications"))}
                  <div className="space-y-2.5">
                    {certifications.map((cert) => (
                      <div key={cert.id}>
                        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
                          <h4 className="font-semibold text-gray-900" style={{ fontSize: fs.itemTitle }}>{cert.name}</h4>
                          <span className="shrink-0 text-gray-400" style={{ fontSize: fs.tiny }}>{cert.date}</span>
                        </div>
                        <p className="mt-0.5 font-medium text-gray-600" style={{ fontSize: fs.small }}>{cert.issuer}</p>
                        {cert.description && (<div className="mt-1.5" style={{ fontSize: fs.body, "--bullet-color": colors.bullet } as React.CSSProperties}>{renderRichDocument(cert.description)}</div>)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {visibility.awards && awards.length > 0 && (
                <div>
                  {tlHeading(t("awards"))}
                  <div className="space-y-2.5">
                    {awards.map((award) => (
                      <div key={award.id}>
                        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
                          <h4 className="font-semibold text-gray-900" style={{ fontSize: fs.itemTitle }}>{award.name}</h4>
                          <span className="shrink-0 text-gray-400" style={{ fontSize: fs.tiny }}>{award.date}</span>
                        </div>
                        <p className="mt-0.5 font-medium text-gray-600" style={{ fontSize: fs.small }}>{award.issuer}</p>
                        {award.description && (<div className="mt-1.5" style={{ fontSize: fs.body, "--bullet-color": colors.bullet } as React.CSSProperties}>{renderRichDocument(award.description)}</div>)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Languages + Skills — outside timeline */}
          {visibility.languages && langItems.length > 0 && (
            <div>
              {bottomHeading(t("languages"))}
              <div className="flex flex-wrap gap-2">
                {langItems.map((lang) => (
                  <span key={lang.id} style={{ color: "#111827", fontSize: fs.body }}>
                    {lang.language}{lang.level && <span style={{ color: "#9ca3af", marginLeft: 4 }}>({lang.level})</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {skillCategories.length > 0 && (
            <div>
              {bottomHeading(t("skills"))}
              <div className="space-y-2.5">
                {skillCategories.map((group) => (
                  <div key={group.id}>
                    <p className="text-[9px] font-bold tracking-widest uppercase mb-1.5" style={{ color: colors.heading }}>{group.category}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.items.map((item, i) => (
                        <span key={i} className="inline-flex items-center rounded px-2 py-0.5 text-[11px]" style={{ backgroundColor: `${colors.heading}15`, color: colors.heading }}>{item}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="cv-preview-content bg-white font-sans overflow-x-hidden"
      style={{ fontFamily: fontFamilyOverride ?? "var(--font-inter), Inter, sans-serif" }}
    >
      {/* Mobile Header */}
      <div className="flex flex-col items-center px-6 pt-16">
        <div className="flex flex-col items-center mb-6">
          <div
            className="w-36 h-36 rounded-full grid place-items-center overflow-hidden relative"
            style={{ backgroundColor: `${colors.nameAccent}18` }}
          >
            <span
              className={`text-3xl font-medium leading-none tracking-wide select-none transition-opacity duration-300 ${imageLoaded ? "opacity-0" : "opacity-100"}`}
              style={{ color: `${colors.nameAccent}90` }}
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

        <div className="mb-4">
          <h1
            className="font-semibold tracking-tight text-gray-900"
            style={{ fontSize: fs.heading }}
          >
            {personalInfo.fullName}
          </h1>
          {colors.nameAccent !== "transparent" && (
            <div
              className="mt-1 h-0.5 w-12 rounded-full"
              style={{ backgroundColor: colors.nameAccent }}
            />
          )}
          <div className="mt-0.5">
            <p
              className="font-medium uppercase tracking-wide text-gray-500"
              style={{ fontSize: fs.subheading }}
            >
              {personalInfo.jobTitle}
            </p>
          </div>
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
                      <Mail className="h-3 w-3 shrink-0" />
                      <a href={`mailto:${personalInfo.email}`} style={{ color: "inherit", textDecoration: "none" }}>{personalInfo.email}</a>
                    </div>
                  )}
                  {personalInfo.phone && (
                    <div className="flex items-center gap-2" style={{ color: colors.sidebarText, fontSize: fs.small }}>
                      <Phone className="h-3 w-3 shrink-0" />
                      <a href={`tel:${personalInfo.phone}`} style={{ color: "inherit", textDecoration: "none" }}>{personalInfo.phone}</a>
                    </div>
                  )}
                  {visibility.location && personalInfo.location && (
                    <div className="flex items-center gap-2" style={{ color: colors.sidebarText, fontSize: fs.small }}>
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span>{personalInfo.location}</span>
                    </div>
                  )}
                  {visibility.linkedin && personalInfo.linkedin && (
                    <div className="flex items-center gap-2" style={{ color: colors.sidebarText, fontSize: fs.small }}>
                      <Linkedin className="h-3 w-3 shrink-0" />
                      {personalInfo.linkedinUrl ? (
                        <a href={ensureProtocol(personalInfo.linkedinUrl)} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>{personalInfo.linkedin}</a>
                      ) : (
                        <span>{personalInfo.linkedin}</span>
                      )}
                    </div>
                  )}
                  {visibility.website && personalInfo.website && (
                    <div className="flex items-center gap-2" style={{ color: colors.sidebarText, fontSize: fs.small }}>
                      <Globe className="h-3 w-3 shrink-0" />
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
                    <h4 className="font-semibold text-gray-900" style={{ fontSize: fs.itemTitle }}>{exp.company}</h4>
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
                    <h4 className="font-semibold text-gray-900" style={{ fontSize: fs.itemTitle }}>{edu.institution}</h4>
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
                    <h4 className="font-semibold text-gray-900" style={{ fontSize: fs.itemTitle }}>{course.name}</h4>
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
                    <h4 className="font-semibold text-gray-900" style={{ fontSize: fs.itemTitle }}>{cert.name}</h4>
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
                    <h4 className="font-semibold text-gray-900" style={{ fontSize: fs.itemTitle }}>{award.name}</h4>
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
