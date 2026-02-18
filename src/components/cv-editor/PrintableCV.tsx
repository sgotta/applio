"use client";

import { forwardRef, useState } from "react";
import { useTranslations } from "next-intl";
import { CVData } from "@/lib/types";
import { DEFAULT_SIDEBAR_ORDER } from "@/lib/default-data";
import { Separator } from "@/components/ui/separator";
import { useColorScheme } from "@/lib/color-scheme-context";
import { useSidebarPattern } from "@/lib/sidebar-pattern-context";
import { useFontSettings } from "@/lib/font-context";
import { getFontDefinition, FONT_SIZE_LEVELS, CJK_LOCALES } from "@/lib/fonts";
import { useAppLocale } from "@/lib/locale-context";
import { type ColorScheme } from "@/lib/color-schemes";
import { type PatternSettings, getSidebarPattern } from "@/lib/sidebar-patterns";
import { renderRichText, renderRichDocument } from "@/lib/render-rich-text";
import { Mail, Phone, MapPin, Linkedin, Globe } from "lucide-react";

function ensureProtocol(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/** Font sizes in em — matches EditableText fontSizeMap + SectionTitle exactly */
const FS = {
  heading: "2.16em",
  subheading: "1.26em",
  itemTitle: "1.17em",
  body: "1em",
  small: "1em",
  tiny: "0.9em",
  section: "0.9em",
  initials: "2em",
} as const;

function SectionHeading({
  children,
  color,
  separatorColor,
}: {
  children: React.ReactNode;
  color: string;
  separatorColor: string;
}) {
  return (
    <div className="mb-3 mt-1">
      <h3
        className="font-semibold uppercase tracking-[0.15em]"
        style={{ color, fontSize: FS.section }}
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
  fontFamilyOverride?: string;
  footer?: React.ReactNode;
}

export const PrintableCV = forwardRef<HTMLDivElement, PrintableCVProps>(
  function PrintableCV(
    { data, forceInitials, photoUrl, colorSchemeOverride, fontScaleOverride, marginScaleOverride, patternOverride, fontFamilyOverride, footer },
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
    const sidebarOrder = data.sidebarOrder ?? DEFAULT_SIDEBAR_ORDER;
    const t = useTranslations("printable");
    const { colorScheme: contextColors } = useColorScheme();
    const { pattern: ctxPattern, sidebarIntensity: ctxSidebarIntensity, mainIntensity: ctxMainIntensity, scope: ctxScope } = useSidebarPattern();
    const { fontFamilyId, fontSizeLevel } = useFontSettings();
    const { locale } = useAppLocale();

    const colors = colorSchemeOverride ?? contextColors;

    // Use override (shared view) or context values
    const pattern = patternOverride ? getSidebarPattern(patternOverride.name) : ctxPattern;
    const sidebarIntensity = patternOverride?.sidebarIntensity ?? ctxSidebarIntensity;
    const mainIntensity = patternOverride?.mainIntensity ?? ctxMainIntensity;
    const scope = patternOverride?.scope ?? ctxScope;

    // Determine font family: override (shared view) > context > default
    const isCJK = CJK_LOCALES.has(locale);
    const effectiveFontFamily = fontFamilyOverride
      ?? (isCJK ? "var(--font-inter), Inter, sans-serif" : getFontDefinition(fontFamilyId).cssStack);

    /** Font-size level multiplier — matches CVPreview wrapper */
    const fontSizeLevelEm = fontScaleOverride ?? FONT_SIZE_LEVELS[fontSizeLevel];
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
        style={{
          fontFamily: effectiveFontFamily,
          display: "flex",
          alignItems: "stretch",
          ...(fontSizeLevelEm !== 1 ? { fontSize: `${fontSizeLevelEm}em` } : {}),
        }}
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
              style={{ backgroundColor: colors.sidebarText + "33" }}
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
                      fontSize: FS.initials,
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

            {sidebarOrder.map((sectionId) => {
              if (sectionId === "contact") {
                if (!visibility.contact) return null;
                const hasFields = (visibility.email && personalInfo.email) || (visibility.phone && personalInfo.phone) || (visibility.location && personalInfo.location) || (visibility.linkedin && personalInfo.linkedin) || (visibility.website && personalInfo.website);
                if (!hasFields) return null;
                return (
                  <div key="contact" className="space-y-2">
                    <SectionHeading color={colors.sidebarText} separatorColor={colors.sidebarSeparator}>{t("contact")}</SectionHeading>
                    <div className="space-y-1.5">
                      {visibility.email && personalInfo.email && (
                        <div className="flex items-center gap-2" style={{ color: colors.sidebarText, fontSize: FS.small }}>
                          <Mail className="h-3 w-3 shrink-0" style={{ color: colors.sidebarMuted }} />
                          <a href={`mailto:${personalInfo.email}`} className="truncate" style={{ color: "inherit", textDecoration: "none" }}>{personalInfo.email}</a>
                        </div>
                      )}
                      {visibility.phone && personalInfo.phone && (
                        <div className="flex items-center gap-2" style={{ color: colors.sidebarText, fontSize: FS.small }}>
                          <Phone className="h-3 w-3 shrink-0" style={{ color: colors.sidebarMuted }} />
                          <a href={`tel:${personalInfo.phone}`} className="truncate" style={{ color: "inherit", textDecoration: "none" }}>{personalInfo.phone}</a>
                        </div>
                      )}
                      {visibility.location && personalInfo.location && (
                        <div className="flex items-center gap-2" style={{ color: colors.sidebarText, fontSize: FS.small }}>
                          <MapPin className="h-3 w-3 shrink-0" style={{ color: colors.sidebarMuted }} />
                          <span className="truncate">{personalInfo.location}</span>
                        </div>
                      )}
                      {visibility.linkedin && personalInfo.linkedin && (
                        <div className="flex items-center gap-2" style={{ color: colors.sidebarText, fontSize: FS.small }}>
                          <Linkedin className="h-3 w-3 shrink-0" style={{ color: colors.sidebarMuted }} />
                          {personalInfo.linkedinUrl ? (
                            <a href={ensureProtocol(personalInfo.linkedinUrl)} target="_blank" rel="noopener noreferrer" className="truncate" style={{ color: "inherit", textDecoration: "none" }}>{personalInfo.linkedin}</a>
                          ) : (
                            <span className="truncate">{personalInfo.linkedin}</span>
                          )}
                        </div>
                      )}
                      {visibility.website && personalInfo.website && (
                        <div className="flex items-center gap-2" style={{ color: colors.sidebarText, fontSize: FS.small }}>
                          <Globe className="h-3 w-3 shrink-0" style={{ color: colors.sidebarMuted }} />
                          {personalInfo.websiteUrl ? (
                            <a href={ensureProtocol(personalInfo.websiteUrl)} target="_blank" rel="noopener noreferrer" className="truncate" style={{ color: "inherit", textDecoration: "none" }}>{personalInfo.website}</a>
                          ) : (
                            <span className="truncate">{personalInfo.website}</span>
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
                    <SectionHeading color={colors.sidebarText} separatorColor={colors.sidebarSeparator}>
                      {t("aboutMe")}
                    </SectionHeading>
                    <p className="leading-relaxed" style={{ color: colors.sidebarText, fontSize: FS.body }}>
                      {renderRichText(summary)}
                    </p>
                  </div>
                );
              }
              if (sectionId === "skills") {
                if (!visibility.skills || skills.length === 0) return null;
                return (
                  <div key="skills">
                    <SectionHeading color={colors.sidebarText} separatorColor={colors.sidebarSeparator}>
                      {t("skills")}
                    </SectionHeading>
                    <div className="space-y-3">
                      {skills.map((skillGroup) => (
                        <div key={skillGroup.id} style={{ pageBreakInside: "avoid" }}>
                          <p
                            className="font-semibold uppercase tracking-wide mb-1"
                            style={{ color: colors.sidebarText, fontSize: FS.tiny }}
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
                                  fontSize: FS.tiny,
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
                );
              }
              return null;
            })}
          </div>
        </div>

        {/* ===== MAIN CONTENT (block flow — page breaks work here) ===== */}
        <div style={{ flex: 1, position: "relative" }}>
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
          <div className="relative">
            {/* Header — padding matches CVPreview desktop header */}
            <div style={{ padding: `${mg(24)}px ${mg(24)}px 0` }}>
              <div className="mb-4">
                <h1
                  className="font-semibold tracking-tight text-gray-900"
                  style={{ fontSize: FS.heading }}
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
                    style={{ fontSize: FS.subheading }}
                  >
                    {personalInfo.title}
                  </p>
                </div>
              </div>
            </div>

            {/* Content — padding matches CVPreview content area */}
            <div style={{ padding: `${mg(16)}px ${mg(24)}px ${mg(24)}px` }}>
              <div className="space-y-5">
                {/* Experience */}
                {experience.length > 0 && (
                  <div>
                    <SectionHeading color={colors.heading} separatorColor={colors.separator}>
                      {t("experience")}
                    </SectionHeading>
                    <div className="space-y-2.5">
                      {experience.map((exp) => (
                        <div key={exp.id} style={{ pageBreakInside: "avoid" }}>
                          <div className="flex items-baseline justify-between gap-2">
                            <h4
                              className="font-semibold text-gray-900"
                              style={{ fontSize: FS.itemTitle }}
                            >
                              {exp.company}
                            </h4>
                            <span
                              className="shrink-0 text-gray-400"
                              style={{ fontSize: FS.tiny }}
                            >
                              {exp.startDate} — {exp.endDate}
                            </span>
                          </div>
                          <p
                            className="mt-0.5 font-medium text-gray-600"
                            style={{ fontSize: FS.small }}
                          >
                            {exp.position}
                          </p>
                          {exp.description && (
                            <div className="mt-1.5" style={{ fontSize: FS.body, "--bullet-color": colors.bullet } as React.CSSProperties}>
                              {renderRichDocument(exp.description)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {education.length > 0 && (
                  <div>
                    <SectionHeading color={colors.heading} separatorColor={colors.separator}>
                      {t("education")}
                    </SectionHeading>
                    <div className="space-y-2.5">
                      {education.map((edu) => (
                        <div key={edu.id} style={{ pageBreakInside: "avoid" }}>
                          <div className="flex items-baseline justify-between gap-2">
                            <h4
                              className="font-semibold text-gray-900"
                              style={{ fontSize: FS.itemTitle }}
                            >
                              {edu.institution}
                            </h4>
                            <span
                              className="shrink-0 text-gray-400"
                              style={{ fontSize: FS.tiny }}
                            >
                              {edu.startDate} — {edu.endDate}
                            </span>
                          </div>
                          <p
                            className="mt-0.5 font-medium text-gray-600"
                            style={{ fontSize: FS.small }}
                          >
                            {edu.degree}
                          </p>
                          {edu.description && (
                            <div className="mt-1.5" style={{ fontSize: FS.body, "--bullet-color": colors.bullet } as React.CSSProperties}>
                              {renderRichDocument(edu.description)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Courses */}
                {visibility.courses && courses.length > 0 && (
                  <div>
                    <SectionHeading color={colors.heading} separatorColor={colors.separator}>
                      {t("courses")}
                    </SectionHeading>
                    <div className="space-y-2.5">
                      {courses.map((course) => (
                        <div key={course.id} style={{ pageBreakInside: "avoid" }}>
                          <div className="flex items-baseline justify-between gap-2">
                            <h4
                              className="font-semibold text-gray-900"
                              style={{ fontSize: FS.itemTitle }}
                            >
                              {course.name}
                            </h4>
                            <span
                              className="shrink-0 text-gray-400"
                              style={{ fontSize: FS.tiny }}
                            >
                              {course.date}
                            </span>
                          </div>
                          <p
                            className="mt-0.5 font-medium text-gray-600"
                            style={{ fontSize: FS.small }}
                          >
                            {course.institution}
                          </p>
                          {course.description && (
                            <div className="mt-1.5" style={{ fontSize: FS.body, "--bullet-color": colors.bullet } as React.CSSProperties}>
                              {renderRichDocument(course.description)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {visibility.certifications && certifications.length > 0 && (
                  <div>
                    <SectionHeading color={colors.heading} separatorColor={colors.separator}>
                      {t("certifications")}
                    </SectionHeading>
                    <div className="space-y-2.5">
                      {certifications.map((cert) => (
                        <div key={cert.id} style={{ pageBreakInside: "avoid" }}>
                          <div className="flex items-baseline justify-between gap-2">
                            <h4
                              className="font-semibold text-gray-900"
                              style={{ fontSize: FS.itemTitle }}
                            >
                              {cert.name}
                            </h4>
                            <span
                              className="shrink-0 text-gray-400"
                              style={{ fontSize: FS.tiny }}
                            >
                              {cert.date}
                            </span>
                          </div>
                          <p
                            className="mt-0.5 font-medium text-gray-600"
                            style={{ fontSize: FS.small }}
                          >
                            {cert.issuer}
                          </p>
                          {cert.description && (
                            <div className="mt-1.5" style={{ fontSize: FS.body, "--bullet-color": colors.bullet } as React.CSSProperties}>
                              {renderRichDocument(cert.description)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Awards */}
                {visibility.awards && awards.length > 0 && (
                  <div>
                    <SectionHeading color={colors.heading} separatorColor={colors.separator}>
                      {t("awards")}
                    </SectionHeading>
                    <div className="space-y-2.5">
                      {awards.map((award) => (
                        <div key={award.id} style={{ pageBreakInside: "avoid" }}>
                          <div className="flex items-baseline justify-between gap-2">
                            <h4
                              className="font-semibold text-gray-900"
                              style={{ fontSize: FS.itemTitle }}
                            >
                              {award.name}
                            </h4>
                            <span
                              className="shrink-0 text-gray-400"
                              style={{ fontSize: FS.tiny }}
                            >
                              {award.date}
                            </span>
                          </div>
                          <p
                            className="mt-0.5 font-medium text-gray-600"
                            style={{ fontSize: FS.small }}
                          >
                            {award.issuer}
                          </p>
                          {award.description && (
                            <div className="mt-1.5" style={{ fontSize: FS.body, "--bullet-color": colors.bullet } as React.CSSProperties}>
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
          {footer}
        </div>
      </div>
    );
  }
);
