"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { LocaleProvider } from "@/lib/locale-context";
import { ThemeProvider } from "@/lib/theme-context";
import { ColorSchemeProvider } from "@/lib/color-scheme-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PrintableCV } from "@/components/cv-editor/PrintableCV";
import { decompressSharedData } from "@/lib/sharing";
import type { SharedCVData, CVData } from "@/lib/types";
import { getColorScheme, type ColorSchemeName, type ColorScheme } from "@/lib/color-schemes";
import { Separator } from "@/components/ui/separator";
import {
  FileText, AlertCircle, Heart, Download,
  Mail, Phone, MapPin, Linkedin, Globe,
} from "lucide-react";

const FONT_SIZE_SCALES: Record<number, number> = { 1: 1, 2: 1.08 };
const MARGIN_SCALES: Record<number, number> = { 1: 1.3, 2: 1.6 };

/* ── Mobile-only read-only CV view ────────────────────────── */

function MobileSectionHeading({
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
      <Separator className="mt-1.5" style={{ backgroundColor: separatorColor }} />
    </div>
  );
}

function MobileCVView({
  data,
  colors,
  photoUrl,
}: {
  data: CVData;
  colors: ColorScheme;
  photoUrl?: string;
}) {
  const t = useTranslations("printable");
  const { personalInfo, summary, experience, education, skills, courses, certifications, awards, visibility } = data;
  const [photoError, setPhotoError] = useState(false);

  const initials = personalInfo.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const showPhoto = !!photoUrl && !photoError;

  /* Match editor's hardcoded scales (CVPreview, EditableText, SectionTitle) */
  const fontScale = 1.08;
  const mg = (px: number) => Math.round(px * 1.6);

  /* Scaled font sizes — same values as EditableText baseSizeMap × 1.08 */
  const fs = {
    heading: Math.round(24 * fontScale),    /* 26px */
    subheading: Math.round(14 * fontScale), /* 15px */
    itemTitle: Math.round(13 * fontScale),  /* 14px */
    body: Math.round(11 * fontScale),       /* 12px */
    small: Math.round(11 * fontScale),      /* 12px */
    tiny: Math.round(10 * fontScale),       /* 11px */
    section: Math.round(10 * fontScale),    /* 11px */
  };

  return (
    <div
      className="bg-white font-sans overflow-x-hidden"
      style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
    >
      {/* Mobile Header — extra top padding compensates for missing toolbar */}
      <div className="flex flex-col items-center px-6 pt-16">
        {/* Photo circle — w-32 h-32 matches ProfilePhotoUpload, colors match MobileHeader */}
        <div className="flex flex-col items-center mb-6">
          <div
            className="w-32 h-32 rounded-full grid place-items-center overflow-hidden"
            style={{ backgroundColor: `${colors.nameAccent}18` }}
          >
            {showPhoto ? (
              <img
                src={photoUrl}
                alt={personalInfo.fullName}
                className="w-full h-full object-cover"
                onError={() => setPhotoError(true)}
              />
            ) : (
              <span
                className="text-3xl font-medium leading-none tracking-wide select-none"
                style={{ color: `${colors.nameAccent}90` }}
              >
                {initials}
              </span>
            )}
          </div>
        </div>

        {/* Name + Title — matches CVHeader mb-4, left-aligned inside centered block */}
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
              {personalInfo.title}
            </p>
          </div>
        </div>
      </div>

      {/* Sidebar content — matches left column: sidebarBg, padding mg(24) */}
      <div className="space-y-5" style={{ backgroundColor: colors.sidebarBg, padding: mg(24) }}>
        {/* Contact */}
        {(visibility.email || visibility.phone || visibility.location || visibility.linkedin || visibility.website) && (
          <div className="space-y-2">
            <MobileSectionHeading color={colors.sidebarText} separatorColor={colors.sidebarSeparator} fontSize={fs.section}>
              {t("contact")}
            </MobileSectionHeading>
            <div className="space-y-1.5">
              {visibility.email && personalInfo.email && (
                <div className="flex items-center gap-2" style={{ color: colors.sidebarText, fontSize: fs.small }}>
                  <Mail className="h-3 w-3 shrink-0" />
                  <span>{personalInfo.email}</span>
                </div>
              )}
              {visibility.phone && personalInfo.phone && (
                <div className="flex items-center gap-2" style={{ color: colors.sidebarText, fontSize: fs.small }}>
                  <Phone className="h-3 w-3 shrink-0" />
                  <span>{personalInfo.phone}</span>
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
                  <span>{personalInfo.linkedin}</span>
                </div>
              )}
              {visibility.website && personalInfo.website && (
                <div className="flex items-center gap-2" style={{ color: colors.sidebarText, fontSize: fs.small }}>
                  <Globe className="h-3 w-3 shrink-0" />
                  <span>{personalInfo.website}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div>
            <MobileSectionHeading color={colors.sidebarText} separatorColor={colors.sidebarSeparator} fontSize={fs.section}>
              {t("aboutMe")}
            </MobileSectionHeading>
            <p className="leading-relaxed" style={{ color: colors.sidebarText, fontSize: fs.body }}>
              {summary}
            </p>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div>
            <MobileSectionHeading color={colors.sidebarText} separatorColor={colors.sidebarSeparator} fontSize={fs.section}>
              {t("skills")}
            </MobileSectionHeading>
            <div className="space-y-3">
              {skills.map((group) => (
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
        )}
      </div>

      {/* Main content — matches right column: padding mg(16) mg(24) mg(24) */}
      <div className="space-y-5" style={{ padding: `${mg(16)}px ${mg(24)}px ${mg(24)}px` }}>
        {/* Experience */}
        {experience.length > 0 && (
          <div>
            <MobileSectionHeading color={colors.heading} separatorColor={colors.separator} fontSize={fs.section}>
              {t("experience")}
            </MobileSectionHeading>
            <div className="space-y-3">
              {experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <h4
                      className="font-semibold text-gray-900"
                      style={{ fontSize: fs.itemTitle }}
                    >
                      {exp.company}
                    </h4>
                    <div className="flex items-baseline gap-1 shrink-0">
                      <span className="text-gray-400" style={{ fontSize: fs.tiny }}>
                        {exp.startDate}
                      </span>
                      <span className="text-gray-400" style={{ fontSize: fs.tiny }}>—</span>
                      <span className="text-gray-400" style={{ fontSize: fs.tiny }}>
                        {exp.endDate}
                      </span>
                    </div>
                  </div>
                  <p
                    className="font-medium uppercase tracking-wide text-gray-500"
                    style={{ fontSize: fs.subheading }}
                  >
                    {exp.position}
                  </p>
                  {exp.description.length > 0 && (
                    <ul className="mt-1.5 space-y-1">
                      {exp.description.map((bullet, i) => (
                        <li
                          key={i}
                          className="leading-relaxed text-gray-600 pl-3 relative"
                          style={{ fontSize: fs.body }}
                        >
                          <span
                            className="absolute left-0"
                            style={{ color: colors.bullet, fontSize: fs.tiny }}
                          >
                            &bull;
                          </span>
                          {bullet}
                        </li>
                      ))}
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
            <MobileSectionHeading color={colors.heading} separatorColor={colors.separator} fontSize={fs.section}>
              {t("education")}
            </MobileSectionHeading>
            <div className="space-y-3">
              {education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <h4
                      className="font-semibold text-gray-900"
                      style={{ fontSize: fs.itemTitle }}
                    >
                      {edu.institution}
                    </h4>
                    <div className="flex items-baseline gap-1 shrink-0">
                      <span className="text-gray-400" style={{ fontSize: fs.tiny }}>
                        {edu.startDate}
                      </span>
                      <span className="text-gray-400" style={{ fontSize: fs.tiny }}>—</span>
                      <span className="text-gray-400" style={{ fontSize: fs.tiny }}>
                        {edu.endDate}
                      </span>
                    </div>
                  </div>
                  <p
                    className="font-medium text-gray-500"
                    style={{ fontSize: fs.small }}
                  >
                    {edu.degree}
                  </p>
                  {edu.description && (
                    <p
                      className="mt-1 leading-relaxed text-gray-600"
                      style={{ fontSize: fs.body }}
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
            <MobileSectionHeading color={colors.heading} separatorColor={colors.separator} fontSize={fs.section}>
              {t("courses")}
            </MobileSectionHeading>
            <div className="space-y-3">
              {courses.map((course) => (
                <div key={course.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <h4
                      className="font-semibold text-gray-900"
                      style={{ fontSize: fs.itemTitle }}
                    >
                      {course.name}
                    </h4>
                    <span className="shrink-0 text-gray-400" style={{ fontSize: fs.tiny }}>
                      {course.date}
                    </span>
                  </div>
                  <p className="font-medium text-gray-500" style={{ fontSize: fs.small }}>
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
            <MobileSectionHeading color={colors.heading} separatorColor={colors.separator} fontSize={fs.section}>
              {t("certifications")}
            </MobileSectionHeading>
            <div className="space-y-3">
              {certifications.map((cert) => (
                <div key={cert.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <h4
                      className="font-semibold text-gray-900"
                      style={{ fontSize: fs.itemTitle }}
                    >
                      {cert.name}
                    </h4>
                    <span className="shrink-0 text-gray-400" style={{ fontSize: fs.tiny }}>
                      {cert.date}
                    </span>
                  </div>
                  <p className="font-medium text-gray-500" style={{ fontSize: fs.small }}>
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
            <MobileSectionHeading color={colors.heading} separatorColor={colors.separator} fontSize={fs.section}>
              {t("awards")}
            </MobileSectionHeading>
            <div className="space-y-3">
              {awards.map((award) => (
                <div key={award.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <h4
                      className="font-semibold text-gray-900"
                      style={{ fontSize: fs.itemTitle }}
                    >
                      {award.name}
                    </h4>
                    <span className="shrink-0 text-gray-400" style={{ fontSize: fs.tiny }}>
                      {award.date}
                    </span>
                  </div>
                  <p className="font-medium text-gray-500" style={{ fontSize: fs.small }}>
                    {award.issuer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main view page ───────────────────────────────────────── */

function ViewContent() {
  const t = useTranslations("sharedView");
  const [sharedData, setSharedData] = useState<SharedCVData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) {
      setError(true);
      setLoading(false);
      return;
    }
    const data = decompressSharedData(hash);
    if (!data) {
      setError(true);
      setLoading(false);
      return;
    }
    setSharedData(data);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400 text-sm">
          {t("loading")}
        </div>
      </div>
    );
  }

  if (error || !sharedData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h1 className="text-lg font-semibold text-gray-700 mb-2">
            {t("errorTitle")}
          </h1>
          <p className="text-sm text-gray-500 mb-6">{t("errorMessage")}</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            <FileText className="h-4 w-4" />
            {t("createYourCV")}
          </a>
        </div>
      </div>
    );
  }

  const photoUrl = sharedData.cv.personalInfo.photoUrl;

  const cvData: CVData = {
    ...sharedData.cv,
    personalInfo: {
      ...sharedData.cv.personalInfo,
      photo: undefined,
    },
  };

  const colorScheme = getColorScheme(
    sharedData.settings.colorScheme as ColorSchemeName
  );
  const fontScale =
    FONT_SIZE_SCALES[sharedData.settings.fontSizeLevel] ?? 1;
  const marginScale =
    MARGIN_SCALES[sharedData.settings.marginLevel] ?? 1.3;

  return (
    <div className="min-h-screen bg-gray-50 md:bg-gray-100 md:py-8 md:px-4 print:bg-white print:p-0 overflow-x-hidden">
      {/* PDF button */}
      <div className="print:hidden fixed top-3 right-3 md:top-4 md:right-4 z-10">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 shadow-lg transition-colors"
        >
          <Download className="h-4 w-4" />
          PDF
        </button>
      </div>

      {/* Desktop: PrintableCV with zoom (hidden on mobile) */}
      <div className="hidden md:block print:block">
        <div
          className="cv-zoom-shared mx-auto bg-white shadow-lg print:shadow-none"
          style={{ width: "210mm" }}
        >
          <PrintableCV
            data={cvData}
            forceInitials={!photoUrl}
            photoUrl={photoUrl}
            colorSchemeOverride={colorScheme}
            fontScaleOverride={fontScale}
            marginScaleOverride={marginScale}
          />
        </div>
      </div>

      {/* Mobile: responsive single-column layout (hidden on desktop) */}
      <div className="md:hidden print:hidden">
        <MobileCVView data={cvData} colors={colorScheme} photoUrl={photoUrl} />
      </div>

      <div className="text-center py-6 print:hidden">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-500 transition-colors"
        >
          <FileText className="h-3 w-3" />
          <span className="text-[11px] font-semibold tracking-tight">Applio</span>
          <Heart className="h-2.5 w-2.5 fill-current" />
          <span className="text-[11px]">{t("madeWith")}</span>
        </a>
      </div>
    </div>
  );
}

export default function ViewPage() {
  return (
    <ThemeProvider>
      <ColorSchemeProvider>
        <LocaleProvider>
          <TooltipProvider delayDuration={300}>
            <ViewContent />
          </TooltipProvider>
        </LocaleProvider>
      </ColorSchemeProvider>
    </ThemeProvider>
  );
}
