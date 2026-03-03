"use client";

import { forwardRef, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { CVData } from "@/lib/types";
import { DEFAULT_SIDEBAR_SECTIONS } from "@/lib/default-data";
import { Separator } from "@/components/ui/separator";
import { useColorScheme } from "@/lib/color-scheme-context";
import { useFontSettings } from "@/lib/font-context";
import { getFontDefinition, FONT_SIZE_LEVELS } from "@/lib/fonts";
import { useAppLocale } from "@/lib/locale-context";
import { type ColorScheme } from "@/lib/color-schemes";
import { renderRichDocument } from "@/lib/render-rich-text";
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
  fontFamilyOverride?: string;
  footer?: React.ReactNode;
}

export const PrintableCV = forwardRef<HTMLDivElement, PrintableCVProps>(
  function PrintableCV(
    { data, forceInitials, photoUrl, colorSchemeOverride, fontScaleOverride, marginScaleOverride, fontFamilyOverride, footer },
    ref
  ) {
    const {
      personalInfo,
      summary,
      experiences,
      education,
      skillCategories,
      courses,
      certifications,
      awards,
      visibility,
      languages,
    } = data;
    const sidebarSections = data.sidebarSections ?? DEFAULT_SIDEBAR_SECTIONS;
    const templateId = data.templateId;
    const t = useTranslations("printable");
    const { colorScheme: contextColors } = useColorScheme();
    const { fontFamilyId, fontSizeLevel } = useFontSettings();
    const { locale } = useAppLocale();

    const colors = colorSchemeOverride ?? contextColors;

    // Determine font family: override (shared view) > context > default
    const effectiveFontFamily = fontFamilyOverride ?? getFontDefinition(fontFamilyId).cssStack;

    /** Font-size level multiplier — matches CVPreview wrapper */
    const fontSizeLevelEm = fontScaleOverride ?? FONT_SIZE_LEVELS[fontSizeLevel];
    /** Scale a base pixel size by the margin factor */
    const mg = (px: number) => Math.round(px * (marginScaleOverride ?? 1.6));

    const [photoUrlError, setPhotoUrlError] = useState(false);
    const [photoUrlLoaded, setPhotoUrlLoaded] = useState(false);
    const [localPhotoError, setLocalPhotoError] = useState(false);
    const [localPhotoLoaded, setLocalPhotoLoaded] = useState(false);
    const hasLocalPhoto = !forceInitials && !!personalInfo.photoUrl && !localPhotoError;

    // SSR hydration fix: if the image loaded before React hydrated, onLoad won't fire.
    // The ref callback checks img.complete to catch already-loaded images.
    const localPhotoRef = useCallback((el: HTMLImageElement | null) => {
      if (el?.complete && el.naturalWidth > 0) setLocalPhotoLoaded(true);
    }, []);
    const remotePhotoRef = useCallback((el: HTMLImageElement | null) => {
      if (el?.complete && el.naturalWidth > 0) setPhotoUrlLoaded(true);
    }, []);
    const initials = personalInfo.fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2);

    // ===== NO PHOTO TEMPLATE =====
    if (templateId === "noPhoto") {
      const flexSectionOrder = sidebarSections.filter(
        (s): s is "skills" | "languages" => s === "skills" || s === "languages"
      );
      const hasContact = personalInfo.email || personalInfo.phone ||
        (visibility.location && personalInfo.location) ||
        (visibility.linkedin && personalInfo.linkedin) ||
        (visibility.website && personalInfo.website);

      const npHeading = (label: string, showLine = true) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, marginTop: 4 }}>
          <div style={{ width: 2, height: 14, borderRadius: 9999, backgroundColor: colors.heading, flexShrink: 0 }} />
          <h3 style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: colors.heading, flexShrink: 0, margin: 0, padding: 0 }}>
            {label}
          </h3>
          {showLine && <div style={{ flex: 1, height: 1, backgroundColor: `${colors.heading}18` }} />}
        </div>
      );

      return (
        <div
          ref={ref}
          className="printable-cv cv-preview-content font-sans"
          style={{ fontFamily: effectiveFontFamily, display: "flex", flexDirection: "column", minHeight: "297mm", ...(fontSizeLevelEm !== 1 ? { fontSize: `${fontSizeLevelEm}em` } : {}) }}
        >
          {/* Top accent bar */}
          <div style={{ height: 3, backgroundColor: colors.heading }} />

          {/* Header */}
          <div style={{ padding: `${mg(28)}px ${mg(32)}px ${mg(8)}px` }}>
            <h1 style={{ fontSize: FS.heading, fontWeight: 600, color: "#111827", margin: 0 }}>{personalInfo.fullName}</h1>
            {colors.nameAccent !== "transparent" && (
              <div style={{ marginTop: 6, height: 2, width: 56, borderRadius: 9999, backgroundColor: colors.nameAccent }} />
            )}
            <div style={{ marginTop: 10 }}>
              <p style={{ fontSize: FS.subheading, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", color: `${colors.heading}BF`, margin: 0 }}>
                {personalInfo.jobTitle}
              </p>
            </div>
            {hasContact && (
              <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: "6px 20px", alignItems: "center" }}>
                {personalInfo.email && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Mail style={{ width: 12, height: 12, color: colors.heading }} />
                    <a href={`mailto:${personalInfo.email}`} style={{ color: "#64748b", fontSize: FS.small, textDecoration: "none" }}>{personalInfo.email}</a>
                  </div>
                )}
                {personalInfo.phone && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Phone style={{ width: 12, height: 12, color: colors.heading }} />
                    <a href={`tel:${personalInfo.phone}`} style={{ color: "#64748b", fontSize: FS.small, textDecoration: "none" }}>{personalInfo.phone}</a>
                  </div>
                )}
                {visibility.location && personalInfo.location && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <MapPin style={{ width: 12, height: 12, color: colors.heading }} />
                    <span style={{ color: "#64748b", fontSize: FS.small }}>{personalInfo.location}</span>
                  </div>
                )}
                {visibility.linkedin && personalInfo.linkedin && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Linkedin style={{ width: 12, height: 12, color: colors.heading }} />
                    {personalInfo.linkedinUrl ? (
                      <a href={ensureProtocol(personalInfo.linkedinUrl)} target="_blank" rel="noopener noreferrer" style={{ color: "#64748b", fontSize: FS.small, textDecoration: "none" }}>{personalInfo.linkedin}</a>
                    ) : (
                      <span style={{ color: "#64748b", fontSize: FS.small }}>{personalInfo.linkedin}</span>
                    )}
                  </div>
                )}
                {visibility.website && personalInfo.website && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Globe style={{ width: 12, height: 12, color: colors.heading }} />
                    {personalInfo.websiteUrl ? (
                      <a href={ensureProtocol(personalInfo.websiteUrl)} target="_blank" rel="noopener noreferrer" style={{ color: "#64748b", fontSize: FS.small, textDecoration: "none" }}>{personalInfo.website}</a>
                    ) : (
                      <span style={{ color: "#64748b", fontSize: FS.small }}>{personalInfo.website}</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Main content */}
          <div style={{ flex: 1, padding: `${mg(10)}px ${mg(32)}px ${mg(28)}px` }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

              {/* Summary — tinted card */}
              {visibility.summary && summary && (
                <div style={{ backgroundColor: `${colors.heading}0F`, border: `1px solid ${colors.heading}1A`, borderRadius: 12, padding: "14px 16px" }}>
                  {npHeading(t("aboutMe"), false)}
                  <div style={{ fontSize: FS.body, lineHeight: 1.6 }}>{renderRichDocument(summary)}</div>
                </div>
              )}

              {/* Experience */}
              {experiences.length > 0 && (
                <div>
                  {npHeading(t("experience"))}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {experiences.map((exp) => (
                      <div key={exp.id} style={{ pageBreakInside: "avoid" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                          <h4 style={{ fontWeight: 600, color: "#111827", fontSize: FS.itemTitle, margin: 0 }}>{exp.company}</h4>
                          <span style={{ color: "#9ca3af", fontSize: FS.tiny, flexShrink: 0 }}>{exp.startDate} — {exp.endDate}</span>
                        </div>
                        <p style={{ margin: "2px 0 0 0", fontWeight: 500, color: "#4b5563", fontSize: FS.small }}>{exp.position}</p>
                        {exp.description && (
                          <div style={{ marginTop: 6, fontSize: FS.body, ["--bullet-color" as string]: colors.bullet }}>{renderRichDocument(exp.description)}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {education.length > 0 && (
                <div>
                  {npHeading(t("education"))}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {education.map((edu) => (
                      <div key={edu.id} style={{ pageBreakInside: "avoid" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                          <h4 style={{ fontWeight: 600, color: "#111827", fontSize: FS.itemTitle, margin: 0 }}>{edu.institution}</h4>
                          <span style={{ color: "#9ca3af", fontSize: FS.tiny, flexShrink: 0 }}>{edu.startDate} — {edu.endDate}</span>
                        </div>
                        <p style={{ margin: "2px 0 0 0", fontWeight: 500, color: "#4b5563", fontSize: FS.small }}>{edu.degree}</p>
                        {edu.description && (
                          <div style={{ marginTop: 6, fontSize: FS.body, ["--bullet-color" as string]: colors.bullet }}>{renderRichDocument(edu.description)}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Courses */}
              {visibility.courses && courses.length > 0 && (
                <div>
                  {npHeading(t("courses"))}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {courses.map((course) => (
                      <div key={course.id} style={{ pageBreakInside: "avoid" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                          <h4 style={{ fontWeight: 600, color: "#111827", fontSize: FS.itemTitle, margin: 0 }}>{course.name}</h4>
                          <span style={{ color: "#9ca3af", fontSize: FS.tiny, flexShrink: 0 }}>{course.date}</span>
                        </div>
                        <p style={{ margin: "2px 0 0 0", fontWeight: 500, color: "#4b5563", fontSize: FS.small }}>{course.institution}</p>
                        {course.description && (
                          <div style={{ marginTop: 6, fontSize: FS.body, ["--bullet-color" as string]: colors.bullet }}>{renderRichDocument(course.description)}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {visibility.certifications && certifications.length > 0 && (
                <div>
                  {npHeading(t("certifications"))}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {certifications.map((cert) => (
                      <div key={cert.id} style={{ pageBreakInside: "avoid" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                          <h4 style={{ fontWeight: 600, color: "#111827", fontSize: FS.itemTitle, margin: 0 }}>{cert.name}</h4>
                          <span style={{ color: "#9ca3af", fontSize: FS.tiny, flexShrink: 0 }}>{cert.date}</span>
                        </div>
                        <p style={{ margin: "2px 0 0 0", fontWeight: 500, color: "#4b5563", fontSize: FS.small }}>{cert.issuer}</p>
                        {cert.description && (
                          <div style={{ marginTop: 6, fontSize: FS.body, ["--bullet-color" as string]: colors.bullet }}>{renderRichDocument(cert.description)}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Awards */}
              {visibility.awards && awards.length > 0 && (
                <div>
                  {npHeading(t("awards"))}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {awards.map((award) => (
                      <div key={award.id} style={{ pageBreakInside: "avoid" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                          <h4 style={{ fontWeight: 600, color: "#111827", fontSize: FS.itemTitle, margin: 0 }}>{award.name}</h4>
                          <span style={{ color: "#9ca3af", fontSize: FS.tiny, flexShrink: 0 }}>{award.date}</span>
                        </div>
                        <p style={{ margin: "2px 0 0 0", fontWeight: 500, color: "#4b5563", fontSize: FS.small }}>{award.issuer}</p>
                        {award.description && (
                          <div style={{ marginTop: 6, fontSize: FS.body, ["--bullet-color" as string]: colors.bullet }}>{renderRichDocument(award.description)}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages + Skills — respects sidebarSections order */}
              {flexSectionOrder.map((sectionId) => {
                if (sectionId === "languages" && visibility.languages && languages.length > 0) {
                  return (
                    <div key="languages">
                      {npHeading(t("languages"))}
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {languages.map((lang) => (
                          <div key={lang.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontWeight: 600, color: "#111827", fontSize: FS.body }}>{lang.language}</span>
                            {lang.level && (
                              <span style={{ backgroundColor: `${colors.heading}12`, color: colors.heading, fontSize: FS.tiny, padding: "2px 8px", borderRadius: 4 }}>{lang.level}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                if (sectionId === "skills" && skillCategories.length > 0) {
                  return (
                    <div key="skills">
                      {npHeading(t("skills"))}
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {skillCategories.map((skillGroup) => (
                          <div key={skillGroup.id}>
                            <p style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: colors.heading, fontSize: FS.tiny, margin: "0 0 4px 0" }}>{skillGroup.category}</p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                              {skillGroup.items.map((item, i) => (
                                <span key={i} style={{ backgroundColor: `${colors.heading}15`, color: colors.heading, fontSize: FS.tiny, padding: "2px 8px", borderRadius: 4 }}>{item}</span>
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

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: `${mg(8)}px ${mg(32)}px ${mg(12)}px`, color: "#aaaaaa", fontSize: "0.75rem" }}>
            <a href="https://www.applio.dev/" target="_blank" rel="noopener noreferrer" style={{ color: "#bbbbbb", textDecoration: "none" }}>Applio ♥</a>
            <span>
              {personalInfo.fullName}&nbsp;&nbsp;·&nbsp;&nbsp;
              {new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date())}&nbsp;&nbsp;·&nbsp;&nbsp;1 / 1
            </span>
          </div>
        </div>
      );
    }
    // ===== END NO PHOTO TEMPLATE =====

    return (
      <div
        ref={ref}
        className="printable-cv cv-preview-content font-sans"
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
          <div className="relative space-y-5">
            {/* Photo / Initials */}
            <div
              className="mx-auto h-36 w-36 rounded-full grid place-items-center overflow-hidden relative"
              style={{ backgroundColor: colors.sidebarText + "28" }}
            >
              {/* Initials always visible as base layer */}
              <span
                className={`font-medium select-none leading-none tracking-wide ${photoUrlLoaded ? "opacity-0 transition-opacity duration-300" : ""}`}
                style={{
                  fontSize: FS.initials,
                  color: colors.sidebarMuted,
                }}
              >
                {initials}
              </span>
              {/* Local photo overlay — starts invisible, shown only on successful load */}
              {hasLocalPhoto && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  ref={localPhotoRef}
                  src={personalInfo.photoUrl}
                  alt={t("profilePhotoAlt")}
                  className={`absolute inset-0 w-full h-full object-cover ${localPhotoLoaded ? "" : "invisible"}`}
                  onLoad={() => setLocalPhotoLoaded(true)}
                  onError={() => setLocalPhotoError(true)}
                />
              )}
              {/* Remote photo overlay (shared view) */}
              {!hasLocalPhoto && photoUrl && !photoUrlError && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  ref={remotePhotoRef}
                  src={photoUrl}
                  alt={t("profilePhotoAlt")}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${photoUrlLoaded ? "opacity-100" : "opacity-0"}`}
                  onLoad={() => setPhotoUrlLoaded(true)}
                  onError={() => setPhotoUrlError(true)}
                />
              )}
            </div>

            {sidebarSections.map((sectionId) => {
              if (sectionId === "contact") {
                const hasFields = personalInfo.email || personalInfo.phone || (visibility.location && personalInfo.location) || (visibility.linkedin && personalInfo.linkedin) || (visibility.website && personalInfo.website);
                if (!hasFields) return null;
                return (
                  <div key="contact" className="space-y-2">
                    <SectionHeading color={colors.sidebarText} separatorColor={colors.sidebarSeparator}>{t("contact")}</SectionHeading>
                    <div className="space-y-1.5">
                      {personalInfo.email && (
                        <div className="flex items-center gap-2" style={{ color: colors.sidebarText, fontSize: FS.small }}>
                          <Mail className="h-3 w-3 shrink-0" />
                          <a href={`mailto:${personalInfo.email}`} className="truncate" style={{ color: "inherit", textDecoration: "none" }}>{personalInfo.email}</a>
                        </div>
                      )}
                      {personalInfo.phone && (
                        <div className="flex items-center gap-2" style={{ color: colors.sidebarText, fontSize: FS.small }}>
                          <Phone className="h-3 w-3 shrink-0" />
                          <a href={`tel:${personalInfo.phone}`} className="truncate" style={{ color: "inherit", textDecoration: "none" }}>{personalInfo.phone}</a>
                        </div>
                      )}
                      {visibility.location && personalInfo.location && (
                        <div className="flex items-center gap-2" style={{ color: colors.sidebarText, fontSize: FS.small }}>
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{personalInfo.location}</span>
                        </div>
                      )}
                      {visibility.linkedin && personalInfo.linkedin && (
                        <div className="flex items-center gap-2" style={{ color: colors.sidebarText, fontSize: FS.small }}>
                          <Linkedin className="h-3 w-3 shrink-0" />
                          {personalInfo.linkedinUrl ? (
                            <a href={ensureProtocol(personalInfo.linkedinUrl)} target="_blank" rel="noopener noreferrer" className="truncate" style={{ color: "inherit", textDecoration: "none" }}>{personalInfo.linkedin}</a>
                          ) : (
                            <span className="truncate">{personalInfo.linkedin}</span>
                          )}
                        </div>
                      )}
                      {visibility.website && personalInfo.website && (
                        <div className="flex items-center gap-2" style={{ color: colors.sidebarText, fontSize: FS.small }}>
                          <Globe className="h-3 w-3 shrink-0" />
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
                    <div className="leading-relaxed" style={{ color: colors.sidebarText, fontSize: FS.body }}>
                      {renderRichDocument(summary)}
                    </div>
                  </div>
                );
              }
              if (sectionId === "skills") {
                if (skillCategories.length === 0) return null;
                return (
                  <div key="skills">
                    <SectionHeading color={colors.sidebarText} separatorColor={colors.sidebarSeparator}>
                      {t("skills")}
                    </SectionHeading>
                    <div className="space-y-3">
                      {skillCategories.map((skillGroup) => (
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
                    {personalInfo.jobTitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Content — padding matches CVPreview content area */}
            <div style={{ padding: `${mg(16)}px ${mg(24)}px ${mg(24)}px` }}>
              <div className="space-y-5">
                {/* Experience */}
                {experiences.length > 0 && (
                  <div>
                    <SectionHeading color={colors.heading} separatorColor={colors.separator}>
                      {t("experience")}
                    </SectionHeading>
                    <div className="space-y-2.5">
                      {experiences.map((exp) => (
                        <div key={exp.id} style={{ pageBreakInside: "avoid" }}>
                          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
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
                          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
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
                          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
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
                          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
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
                          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
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
