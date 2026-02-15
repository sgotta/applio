"use client";

import { forwardRef, useState } from "react";
import { useTranslations } from "next-intl";
import { CVData } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { useColorScheme } from "@/lib/color-scheme-context";
import { type ColorScheme } from "@/lib/color-schemes";
import { Mail, Phone, MapPin, Linkedin, Globe } from "lucide-react";

function SectionHeading({
  children,
  colors,
  sidebar,
  fontSize,
}: {
  children: React.ReactNode;
  colors: ColorScheme;
  sidebar?: boolean;
  fontSize: number;
}) {
  const headingColor = sidebar ? colors.sidebarText : colors.heading;
  const separatorColor = sidebar ? colors.sidebarSeparator : colors.separator;

  return (
    <div className="mb-3 mt-1">
      <h3
        className="font-semibold uppercase tracking-[0.15em]"
        style={{ color: headingColor, fontSize }}
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
  footer?: React.ReactNode;
}

export const PrintableCV = forwardRef<HTMLDivElement, PrintableCVProps>(
  function PrintableCV(
    { data, forceInitials, photoUrl, colorSchemeOverride, fontScaleOverride, marginScaleOverride, footer },
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

    const colors = colorSchemeOverride ?? contextColors;
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
        className="printable-cv bg-white font-sans"
        style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
      >
        <div
          className="grid grid-cols-[220px_1fr]"
          style={{ minHeight: "100vh" }}
        >
          {/* ===== LEFT COLUMN ===== */}
          <div
            className="space-y-5"
            style={{ backgroundColor: colors.sidebarBg, padding: `${mg(32)}px ${mg(24)}px` }}
          >
            {/* Photo / Initials */}
            <div
              className="mx-auto h-28 w-28 rounded-full grid place-items-center overflow-hidden relative"
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
                <SectionHeading colors={colors} sidebar fontSize={fs(10)}>{t("contact")}</SectionHeading>
                <div className="space-y-1.5">
                  {visibility.email && personalInfo.email && (
                    <div className="flex items-center gap-2" style={{ color: colors.sidebarText, fontSize: fs(11) }}>
                      <Mail
                        className="h-3 w-3 shrink-0"
                        style={{ color: colors.sidebarText }}
                      />
                      <span className="truncate">{personalInfo.email}</span>
                    </div>
                  )}
                  {visibility.phone && personalInfo.phone && (
                    <div className="flex items-center gap-2" style={{ color: colors.sidebarText, fontSize: fs(11) }}>
                      <Phone
                        className="h-3 w-3 shrink-0"
                        style={{ color: colors.sidebarText }}
                      />
                      <span className="truncate">{personalInfo.phone}</span>
                    </div>
                  )}
                  {visibility.location && personalInfo.location && (
                    <div className="flex items-center gap-2" style={{ color: colors.sidebarText, fontSize: fs(11) }}>
                      <MapPin
                        className="h-3 w-3 shrink-0"
                        style={{ color: colors.sidebarText }}
                      />
                      <span className="truncate">
                        {personalInfo.location}
                      </span>
                    </div>
                  )}
                  {visibility.linkedin && personalInfo.linkedin && (
                    <div className="flex items-center gap-2" style={{ color: colors.sidebarText, fontSize: fs(11) }}>
                      <Linkedin
                        className="h-3 w-3 shrink-0"
                        style={{ color: colors.sidebarText }}
                      />
                      <span className="truncate">
                        {personalInfo.linkedin}
                      </span>
                    </div>
                  )}
                  {visibility.website && personalInfo.website && (
                    <div className="flex items-center gap-2" style={{ color: colors.sidebarText, fontSize: fs(11) }}>
                      <Globe
                        className="h-3 w-3 shrink-0"
                        style={{ color: colors.sidebarText }}
                      />
                      <span className="truncate">
                        {personalInfo.website}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Summary */}
            {summary && (
              <div>
                <SectionHeading colors={colors} sidebar fontSize={fs(10)}>
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
                <SectionHeading colors={colors} sidebar fontSize={fs(10)}>
                  {t("skills")}
                </SectionHeading>
                <div className="space-y-3">
                  {skills.map((skillGroup) => (
                    <div key={skillGroup.id}>
                      <p
                        className="font-semibold uppercase tracking-wide mb-1"
                        style={{ color: colors.sidebarText, fontSize: fs(10) }}
                      >
                        {skillGroup.category}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {skillGroup.items.map((item, i) => (
                          <span
                            key={i}
                            className="inline-block rounded px-2 py-0.5"
                            style={{
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

          {/* ===== RIGHT COLUMN ===== */}
          <div className="space-y-5" style={{ padding: mg(32) }}>
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
                <SectionHeading colors={colors} fontSize={fs(10)}>
                  {t("experience")}
                </SectionHeading>
                <div className="space-y-4">
                  {experience.map((exp) => (
                    <div key={exp.id}>
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
                      {exp.description.length > 0 && (
                        <ul className="mt-1.5 space-y-1">
                          {exp.description.map((bullet, i) => (
                            <li
                              key={i}
                              className="leading-relaxed text-gray-700 pl-3 relative"
                              style={{ fontSize: fs(11) }}
                            >
                              <span
                                className="absolute left-0"
                                style={{ color: colors.bullet }}
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
                <SectionHeading colors={colors} fontSize={fs(10)}>
                  {t("education")}
                </SectionHeading>
                <div className="space-y-4">
                  {education.map((edu) => (
                    <div key={edu.id}>
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
                <SectionHeading colors={colors} fontSize={fs(10)}>
                  {t("courses")}
                </SectionHeading>
                <div className="space-y-3">
                  {courses.map((course) => (
                    <div key={course.id}>
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
                <SectionHeading colors={colors} fontSize={fs(10)}>
                  {t("certifications")}
                </SectionHeading>
                <div className="space-y-3">
                  {certifications.map((cert) => (
                    <div key={cert.id}>
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
                <SectionHeading colors={colors} fontSize={fs(10)}>
                  {t("awards")}
                </SectionHeading>
                <div className="space-y-3">
                  {awards.map((award) => (
                    <div key={award.id}>
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
