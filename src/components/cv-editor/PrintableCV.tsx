"use client";

import { forwardRef } from "react";
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
}: {
  children: React.ReactNode;
  colors: ColorScheme;
  sidebar?: boolean;
}) {
  const headingColor = sidebar ? colors.sidebarText : colors.heading;
  const separatorColor = sidebar ? colors.sidebarSeparator : colors.separator;

  return (
    <div className="mb-3 mt-1">
      <h3
        className="text-[10px] font-semibold uppercase tracking-[0.15em]"
        style={{ color: headingColor }}
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

export const PrintableCV = forwardRef<HTMLDivElement, { data: CVData }>(
  function PrintableCV({ data }, ref) {
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
    const { colorScheme: colors } = useColorScheme();

    return (
      <div
        ref={ref}
        className="printable-cv bg-white font-sans"
        style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
      >
        <div
          className="grid grid-cols-[220px_1fr]"
          style={{ minHeight: "297mm" }}
        >
          {/* ===== LEFT COLUMN ===== */}
          <div
            className="p-6 space-y-5"
            style={{ backgroundColor: colors.sidebarBg }}
          >
            {/* Photo / Initials */}
            <div
              className="mx-auto h-28 w-28 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden"
            >
              {personalInfo.photo ? (
                <img
                  src={personalInfo.photo}
                  alt={t("profilePhotoAlt")}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-semibold text-gray-400 select-none">
                  {personalInfo.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </span>
              )}
            </div>

            {/* Contact */}
            {(visibility.email ||
              visibility.phone ||
              visibility.location ||
              visibility.linkedin ||
              visibility.website) && (
              <div className="space-y-2">
                <SectionHeading colors={colors} sidebar>{t("contact")}</SectionHeading>
                <div className="space-y-1.5">
                  {visibility.email && personalInfo.email && (
                    <div className="flex items-center gap-2 text-[11px]" style={{ color: colors.sidebarText }}>
                      <Mail
                        className="h-3 w-3 shrink-0"
                        style={{ color: colors.sidebarText }}
                      />
                      <span className="truncate">{personalInfo.email}</span>
                    </div>
                  )}
                  {visibility.phone && personalInfo.phone && (
                    <div className="flex items-center gap-2 text-[11px]" style={{ color: colors.sidebarText }}>
                      <Phone
                        className="h-3 w-3 shrink-0"
                        style={{ color: colors.sidebarText }}
                      />
                      <span className="truncate">{personalInfo.phone}</span>
                    </div>
                  )}
                  {visibility.location && personalInfo.location && (
                    <div className="flex items-center gap-2 text-[11px]" style={{ color: colors.sidebarText }}>
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
                    <div className="flex items-center gap-2 text-[11px]" style={{ color: colors.sidebarText }}>
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
                    <div className="flex items-center gap-2 text-[11px]" style={{ color: colors.sidebarText }}>
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
                <SectionHeading colors={colors} sidebar>
                  {t("aboutMe")}
                </SectionHeading>
                <p className="text-[11px] leading-relaxed" style={{ color: colors.sidebarText }}>
                  {summary}
                </p>
              </div>
            )}

            {/* Skills */}
            {skills.length > 0 && (
              <div>
                <SectionHeading colors={colors} sidebar>
                  {t("skills")}
                </SectionHeading>
                <div className="space-y-3">
                  {skills.map((skillGroup) => (
                    <div key={skillGroup.id}>
                      <p
                        className="text-[10px] font-semibold uppercase tracking-wide mb-1"
                        style={{ color: colors.sidebarText }}
                      >
                        {skillGroup.category}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {skillGroup.items.map((item, i) => (
                          <span
                            key={i}
                            className="inline-block rounded px-2 py-0.5 text-[10px]"
                            style={{
                              backgroundColor: colors.sidebarBadgeBg,
                              color: colors.sidebarBadgeText,
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
          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                {personalInfo.fullName}
              </h1>
              {colors.nameAccent !== "transparent" && (
                <div
                  className="mt-1 h-0.5 w-12 rounded-full"
                  style={{ backgroundColor: colors.nameAccent }}
                />
              )}
              <p className="mt-0.5 text-sm font-medium uppercase tracking-wide text-gray-500">
                {personalInfo.title}
              </p>
            </div>

            {/* Experience */}
            {experience.length > 0 && (
              <div>
                <SectionHeading colors={colors}>
                  {t("experience")}
                </SectionHeading>
                <div className="space-y-4">
                  {experience.map((exp) => (
                    <div key={exp.id}>
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="text-[13px] font-semibold text-gray-900">
                          {exp.company}
                        </h4>
                        <span className="flex-shrink-0 text-[10px] text-gray-400">
                          {exp.startDate} — {exp.endDate}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                        {exp.position}
                      </p>
                      {exp.description.length > 0 && (
                        <ul className="mt-1.5 space-y-1">
                          {exp.description.map((bullet, i) => (
                            <li
                              key={i}
                              className="text-[11px] leading-relaxed text-gray-600 pl-3 relative"
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
                <SectionHeading colors={colors}>
                  {t("education")}
                </SectionHeading>
                <div className="space-y-4">
                  {education.map((edu) => (
                    <div key={edu.id}>
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="text-[13px] font-semibold text-gray-900">
                          {edu.institution}
                        </h4>
                        <span className="flex-shrink-0 text-[10px] text-gray-400">
                          {edu.startDate} — {edu.endDate}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-gray-500">
                        {edu.degree}
                      </p>
                      {edu.description && (
                        <p className="mt-1 text-[11px] leading-relaxed text-gray-600">
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
                <SectionHeading colors={colors}>
                  {t("courses")}
                </SectionHeading>
                <div className="space-y-3">
                  {courses.map((course) => (
                    <div key={course.id}>
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="text-[13px] font-semibold text-gray-900">
                          {course.name}
                        </h4>
                        <span className="flex-shrink-0 text-[10px] text-gray-400">
                          {course.date}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-gray-500">
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
                <SectionHeading colors={colors}>
                  {t("certifications")}
                </SectionHeading>
                <div className="space-y-3">
                  {certifications.map((cert) => (
                    <div key={cert.id}>
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="text-[13px] font-semibold text-gray-900">
                          {cert.name}
                        </h4>
                        <span className="flex-shrink-0 text-[10px] text-gray-400">
                          {cert.date}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-gray-500">
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
                <SectionHeading colors={colors}>
                  {t("awards")}
                </SectionHeading>
                <div className="space-y-3">
                  {awards.map((award) => (
                    <div key={award.id}>
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="text-[13px] font-semibold text-gray-900">
                          {award.name}
                        </h4>
                        <span className="flex-shrink-0 text-[10px] text-gray-400">
                          {award.date}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-gray-500">
                        {award.issuer}
                      </p>
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
);
