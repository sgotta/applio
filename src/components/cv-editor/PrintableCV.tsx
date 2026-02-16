"use client";

import { forwardRef, useState } from "react";
import { useTranslations } from "next-intl";
import { CVData } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { useColorScheme } from "@/lib/color-scheme-context";
import { useSidebarPattern } from "@/lib/sidebar-pattern-context";
import { type ColorScheme } from "@/lib/color-schemes";
import { type PatternSettings, getSidebarPattern } from "@/lib/sidebar-patterns";
import { renderFormattedText } from "@/lib/format-text";
import { Mail, Phone, MapPin, Linkedin, Globe } from "lucide-react";

function ensureProtocol(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function SectionHeading({
  children,
  color,
  separatorColor,
  fontSize,
}: {
  children: React.ReactNode;
  color: string;
  separatorColor: string;
  fontSize: number;
}) {
  return (
    <div className="mb-3 mt-1">
      <h3
        className="font-semibold uppercase tracking-[0.15em]"
        style={{ color, fontSize }}
      >
        {children}
      </h3>
      <Separator
        className="mt-1.5"
        style={{ backgroundColor: separatorColor }}
      />
    </div>
  );
}

interface PrintableCVProps {
  data: CVData;
  forceInitials?: boolean;
  photoUrl?: string;
  colorSchemeOverride?: ColorScheme;
  fontScaleOverride?: number;
  marginScaleOverride?: number;
  patternOverride?: PatternSettings;
  footer?: React.ReactNode;
}

export const PrintableCV = forwardRef<HTMLDivElement, PrintableCVProps>(
  function PrintableCV(
    { data, forceInitials, photoUrl, colorSchemeOverride, fontScaleOverride, marginScaleOverride, patternOverride, footer },
    ref
  ) {
    const {
      personalInfo,
      summary,
      experience,
      education,
      skills,
      courses,
      certifications,
      awards,
      visibility,
    } = data;
    const t = useTranslations("printable");
    const { colorScheme: contextColors } = useColorScheme();
    const { pattern: ctxPattern, sidebarIntensity: ctxSidebarIntensity, mainIntensity: ctxMainIntensity, scope: ctxScope } = useSidebarPattern();

    const colors = colorSchemeOverride ?? contextColors;

    // Use override (shared view) or context values
    const pattern = patternOverride ? getSidebarPattern(patternOverride.name) : ctxPattern;
    const sidebarIntensity = patternOverride?.sidebarIntensity ?? ctxSidebarIntensity;
    const mainIntensity = patternOverride?.mainIntensity ?? ctxMainIntensity;
    const scope = patternOverride?.scope ?? ctxScope;
    /** Scale a base pixel size by the font-size factor */
    const fs = (px: number) => Math.round(px * (fontScaleOverride ?? 1.08));
    /** Scale a base pixel size by the margin factor */
    const mg = (px: number) => Math.round(px * (marginScaleOverride ?? 1.6));

    const [photoUrlError, setPhotoUrlError] = useState(false);
    const [photoUrlLoaded, setPhotoUrlLoaded] = useState(false);
    const hasLocalPhoto = !forceInitials && !!personalInfo.photo;
    const initials = personalInfo.fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2);

    return (
      <div
        ref={ref}
        className="printable-cv font-sans"
        style={{ fontFamily: "var(--font-inter), Inter, sans-serif", display: "flex", alignItems: "stretch" }}
      >
        {/* ===== SIDEBAR ===== */}
        <div
          style={{
            position: "relative",
            width: "250px",
            flexShrink: 0,
            padding: `${mg(24)}px`,
            backgroundColor: colors.sidebarBg,
            borderRight: `1px solid ${colors.sidebarSeparator}`,
          }}
        >
          {pattern.name !== "none" && (scope === "sidebar" || scope === "full") && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: "none" as const,
                ...pattern.getStyle(colors.sidebarText, sidebarIntensity),
              }}
            />
          )}
          <div className="relative space-y-5">
            {/* Photo / Initials */}
            <div
              className="mx-auto h-36 w-36 rounded-full grid place-items-center overflow-hidden relative"
              style={{ backgroundColor: colors.sidebarBadgeBg }}
            >
              {hasLocalPhoto ? (
                <img
                  src={personalInfo.photo}
                  alt={t("profilePhotoAlt")}
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  {/* Initials always visible as base layer */}
                  <span
                    className={`font-medium select-none leading-none tracking-wide transition-opacity duration-300 ${photoUrlLoaded ? "opacity-0" : "opacity-100"}`}
                    style={{
                      fontSize: fs(22),
                      color: colors.sidebarMuted,
                    }}
                  >
                    {initials}
                  </span>
                  {/* Remote photo overlays on top, fades in when loaded */}
                  {photoUrl && !photoUrlError && (
                    <img
                      src={photoUrl}
                      alt={t("profilePhotoAlt")}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${photoUrlLoaded ? "opacity-100" : "opacity-0"}`}
                      onLoad={() => setPhotoUrlLoaded(true)}
                      onError={() => setPhotoUrlError(true)}
                    />
                  )}
                </>
              )}
            </div>

            {/* Contact */}
            {(visibility.email ||
              visibility.phone ||
              visibility.location ||
              visibility.linkedin ||
              visibility.website) && (
              <div className="space-y-2">
                <SectionHeading color={colors.sidebarText} separatorColor={colors.sidebarSeparator} fontSize={fs(10)}>{t("contact")}</SectionHeading>
                <div className="space-y-1.5">
                  {visibility.email && personalInfo.email && (
                    <div className="flex items-center gap-2" style={{ color: colors.sidebarText, fontSize: fs(11) }}>
                      <Mail
                        className="h-3 w-3 shrink-0"
                        style={{ color: colors.sidebarMuted }}
                      />
                      <a href={`mailto:${personalInfo.email}`} className="truncate" style={{ color: "inherit", textDecoration: "none" }}>{personalInfo.email}</a>
                    </div>
                  )}
                  {visibility.phone && personalInfo.phone && (
                    <div className="flex items-center gap-2" style={{ color: colors.sidebarText, fontSize: fs(11) }}>
                      <Phone
                        className="h-3 w-3 shrink-0"
                        style={{ color: colors.sidebarMuted }}
                      />
                      <a href={`tel:${personalInfo.phone}`} className="truncate" style={{ color: "inherit", textDecoration: "none" }}>{personalInfo.phone}</a>
                    </div>
                  )}
                  {visibility.location && personalInfo.location && (
                    <div className="flex items-center gap-2" style={{ color: colors.sidebarText, fontSize: fs(11) }}>
                      <MapPin
                        className="h-3 w-3 shrink-0"
                        style={{ color: colors.sidebarMuted }}
                      />
                      <span className="truncate">{personalInfo.location}</span>
                    </div>
                  )}
                  {visibility.linkedin && personalInfo.linkedin && (
                    <div className="flex items-center gap-2" style={{ color: colors.sidebarText, fontSize: fs(11) }}>
                      <Linkedin
                        className="h-3 w-3 shrink-0"
                        style={{ color: colors.sidebarMuted }}
                      />
                      {personalInfo.linkedinUrl ? (
                        <a href={ensureProtocol(personalInfo.linkedinUrl)} target="_blank" rel="noopener noreferrer" className="truncate" style={{ color: "inherit", textDecoration: "none" }}>{personalInfo.linkedin}</a>
                      ) : (
                        <span className="truncate">{personalInfo.linkedin}</span>
                      )}
                    </div>
                  )}
                  {visibility.website && personalInfo.website && (
                    <div className="flex items-center gap-2" style={{ color: colors.sidebarText, fontSize: fs(11) }}>
                      <Globe
                        className="h-3 w-3 shrink-0"
                        style={{ color: colors.sidebarMuted }}
                      />
                      {personalInfo.websiteUrl ? (
                        <a href={ensureProtocol(personalInfo.websiteUrl)} target="_blank" rel="noopener noreferrer" className="truncate" style={{ color: "inherit", textDecoration: "none" }}>{personalInfo.website}</a>
                      ) : (
                        <span className="truncate">{personalInfo.website}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Summary */}
            {summary && (
              <div>
                <SectionHeading color={colors.sidebarText} separatorColor={colors.sidebarSeparator} fontSize={fs(10)}>
                  {t("aboutMe")}
                </SectionHeading>
                <p className="leading-relaxed" style={{ color: colors.sidebarText, fontSize: fs(11) }}>
                  {summary}
                </p>
              </div>
            )}

            {/* Skills */}
            {skills.length > 0 && (
              <div>
                <SectionHeading color={colors.sidebarText} separatorColor={colors.sidebarSeparator} fontSize={fs(10)}>
                  {t("skills")}
                </SectionHeading>
                <div className="space-y-3">
                  {skills.map((skillGroup) => (
                    <div key={skillGroup.id} style={{ pageBreakInside: "avoid" }}>
                      <p
                        className="font-semibold uppercase tracking-wide mb-1"
                        style={{ color: colors.sidebarText, fontSize: fs(10) }}
                      >
                        {skillGroup.category}
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap" }}>
                        {skillGroup.items.map((item, i) => (
                          <span
                            key={i}
                            style={{
                              display: "inline-block",
                              borderRadius: "4px",
                              padding: "2px 8px",
                              margin: "0 4px 4px 0",
                              backgroundColor: colors.sidebarBadgeBg,
                              color: colors.sidebarBadgeText,
                              fontSize: fs(10),
                            }}
                          >
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

        {/* ===== MAIN CONTENT (block flow — page breaks work here) ===== */}
        <div style={{ flex: 1, padding: `${mg(24)}px`, position: "relative" }}>
          {pattern.name !== "none" && (scope === "main" || scope === "full") && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: "none" as const,
                ...pattern.getStyle(colors.heading, mainIntensity),
              }}
            />
          )}
          <div className="relative space-y-5">
            {/* Header */}
            <div className="mb-8">
              <h1
                className="font-semibold tracking-tight text-gray-900"
                style={{ fontSize: fs(24) }}
              >
                {personalInfo.fullName}
              </h1>
              {colors.nameAccent !== "transparent" && (
                <div
                  className="mt-1 h-0.5 w-12 rounded-full"
                  style={{ backgroundColor: colors.nameAccent }}
                />
              )}
              <p
                className="mt-0.5 font-medium uppercase tracking-wide text-gray-600"
                style={{ fontSize: fs(14) }}
              >
                {personalInfo.title}
              </p>
            </div>

            {/* Experience */}
            {experience.length > 0 && (
              <div>
                <SectionHeading color={colors.heading} separatorColor={colors.separator} fontSize={fs(10)}>
                  {t("experience")}
                </SectionHeading>
                <div className="space-y-4">
                  {experience.map((exp) => (
                    <div key={exp.id} style={{ pageBreakInside: "avoid" }}>
                      <div className="flex items-baseline justify-between gap-2">
                        <h4
                          className="font-semibold text-gray-900"
                          style={{ fontSize: fs(13) }}
                        >
                          {exp.company}
                        </h4>
                        <span
                          className="shrink-0 text-gray-500"
                          style={{ fontSize: fs(10) }}
                        >
                          {exp.startDate} — {exp.endDate}
                        </span>
                      </div>
                      <p
                        className="font-medium uppercase tracking-wide text-gray-600"
                        style={{ fontSize: fs(11) }}
                      >
                        {exp.position}
                      </p>
                      {exp.roleDescription && exp.roleDescription.trim() && (
                        <p
                          className="mt-1 leading-relaxed text-gray-700"
                          style={{ fontSize: fs(11) }}
                        >
                          {renderFormattedText(exp.roleDescription)}
                        </p>
                      )}
                      {exp.description.length > 0 && (
                        <ul className="mt-1.5 space-y-1">
                          {exp.description.map((bullet, i) => {
                            if (bullet.type === "title") {
                              return (
                                <li key={i} className="font-semibold text-gray-900 mt-2 first:mt-0" style={{ fontSize: fs(11), listStyle: "none" }}>
                                  {renderFormattedText(bullet.text)}
                                </li>
                              );
                            }
                            if (bullet.type === "subtitle") {
                              return (
                                <li key={i} className="font-medium text-gray-800" style={{ fontSize: fs(11), listStyle: "none" }}>
                                  {renderFormattedText(bullet.text)}
                                </li>
                              );
                            }
                            if (bullet.type === "comment") {
                              return (
                                <li key={i} className="italic text-gray-400" style={{ fontSize: fs(11), listStyle: "none" }}>
                                  {renderFormattedText(bullet.text)}
                                </li>
                              );
                            }
                            return (
                              <li key={i} className="leading-relaxed text-gray-700 pl-3 relative" style={{ fontSize: fs(11) }}>
                                <span className="absolute left-0" style={{ color: colors.bullet }}>&bull;</span>
                                {renderFormattedText(bullet.text)}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {education.length > 0 && (
              <div>
                <SectionHeading color={colors.heading} separatorColor={colors.separator} fontSize={fs(10)}>
                  {t("education")}
                </SectionHeading>
                <div className="space-y-4">
                  {education.map((edu) => (
                    <div key={edu.id} style={{ pageBreakInside: "avoid" }}>
                      <div className="flex items-baseline justify-between gap-2">
                        <h4
                          className="font-semibold text-gray-900"
                          style={{ fontSize: fs(13) }}
                        >
                          {edu.institution}
                        </h4>
                        <span
                          className="shrink-0 text-gray-500"
                          style={{ fontSize: fs(10) }}
                        >
                          {edu.startDate} — {edu.endDate}
                        </span>
                      </div>
                      <p
                        className="font-medium text-gray-600"
                        style={{ fontSize: fs(11) }}
                      >
                        {edu.degree}
                      </p>
                      {edu.description && (
                        <p
                          className="mt-1 leading-relaxed text-gray-700"
                          style={{ fontSize: fs(11) }}
                        >
                          {edu.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Courses */}
            {visibility.courses && courses.length > 0 && (
              <div>
                <SectionHeading color={colors.heading} separatorColor={colors.separator} fontSize={fs(10)}>
                  {t("courses")}
                </SectionHeading>
                <div className="space-y-3">
                  {courses.map((course) => (
                    <div key={course.id} style={{ pageBreakInside: "avoid" }}>
                      <div className="flex items-baseline justify-between gap-2">
                        <h4
                          className="font-semibold text-gray-900"
                          style={{ fontSize: fs(13) }}
                        >
                          {course.name}
                        </h4>
                        <span
                          className="shrink-0 text-gray-500"
                          style={{ fontSize: fs(10) }}
                        >
                          {course.date}
                        </span>
                      </div>
                      <p
                        className="font-medium text-gray-600"
                        style={{ fontSize: fs(11) }}
                      >
                        {course.institution}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {visibility.certifications && certifications.length > 0 && (
              <div>
                <SectionHeading color={colors.heading} separatorColor={colors.separator} fontSize={fs(10)}>
                  {t("certifications")}
                </SectionHeading>
                <div className="space-y-3">
                  {certifications.map((cert) => (
                    <div key={cert.id} style={{ pageBreakInside: "avoid" }}>
                      <div className="flex items-baseline justify-between gap-2">
                        <h4
                          className="font-semibold text-gray-900"
                          style={{ fontSize: fs(13) }}
                        >
                          {cert.name}
                        </h4>
                        <span
                          className="shrink-0 text-gray-500"
                          style={{ fontSize: fs(10) }}
                        >
                          {cert.date}
                        </span>
                      </div>
                      <p
                        className="font-medium text-gray-600"
                        style={{ fontSize: fs(11) }}
                      >
                        {cert.issuer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Awards */}
            {visibility.awards && awards.length > 0 && (
              <div>
                <SectionHeading color={colors.heading} separatorColor={colors.separator} fontSize={fs(10)}>
                  {t("awards")}
                </SectionHeading>
                <div className="space-y-3">
                  {awards.map((award) => (
                    <div key={award.id} style={{ pageBreakInside: "avoid" }}>
                      <div className="flex items-baseline justify-between gap-2">
                        <h4
                          className="font-semibold text-gray-900"
                          style={{ fontSize: fs(13) }}
                        >
                          {award.name}
                        </h4>
                        <span
                          className="shrink-0 text-gray-500"
                          style={{ fontSize: fs(10) }}
                        >
                          {award.date}
                        </span>
                      </div>
                      <p
                        className="font-medium text-gray-600"
                        style={{ fontSize: fs(11) }}
                      >
                        {award.issuer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          </div>
        {footer}
      </div>
    );
  }
);
