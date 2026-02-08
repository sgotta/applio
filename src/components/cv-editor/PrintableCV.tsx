"use client";

import { forwardRef } from "react";
import { CVData, ContactItem } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Globe,
  Link,
  LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Globe,
  Link,
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 mt-1">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-500">
        {children}
      </h3>
      <Separator className="mt-1.5" />
    </div>
  );
}

function ContactLine({ contact }: { contact: ContactItem }) {
  const Icon = contact.icon ? iconMap[contact.icon] || Link : Link;

  return (
    <div className="flex items-center gap-2 text-[11px] text-gray-600">
      <Icon className="h-3 w-3 flex-shrink-0 text-gray-400" />
      <span className="truncate">{contact.value}</span>
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
      customSections,
    } = data;

    const leftSections = customSections?.filter(
      (s) => s.placement === "left"
    ) || [];
    const rightSections = customSections?.filter(
      (s) => s.placement === "right"
    ) || [];

    return (
      <div
        ref={ref}
        className="printable-cv bg-white font-sans"
        style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
      >
        <div className="grid grid-cols-[220px_1fr]" style={{ minHeight: "297mm" }}>
          {/* ===== LEFT COLUMN ===== */}
          <div className="border-r border-gray-100 bg-gray-50/50 p-6 space-y-5">
            {/* Photo / Initials */}
            <div className="mx-auto h-28 w-28 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {personalInfo.photo ? (
                <img
                  src={personalInfo.photo}
                  alt="Foto de perfil"
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
            {personalInfo.contacts && personalInfo.contacts.length > 0 && (
              <div className="space-y-2">
                <SectionHeading>Contacto</SectionHeading>
                <div className="space-y-1.5">
                  {personalInfo.contacts.map((contact) => (
                    <ContactLine key={contact.id} contact={contact} />
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {summary && (
              <div>
                <SectionHeading>Sobre mí</SectionHeading>
                <p className="text-[11px] leading-relaxed text-gray-600">
                  {summary}
                </p>
              </div>
            )}

            {/* Skills */}
            {skills.length > 0 && (
              <div>
                <SectionHeading>Habilidades</SectionHeading>
                <div className="space-y-3">
                  {skills.map((skillGroup) => (
                    <div key={skillGroup.id}>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
                        {skillGroup.category}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {skillGroup.items.map((item, i) => (
                          <span
                            key={i}
                            className="inline-block rounded bg-gray-100 px-2 py-0.5 text-[10px] text-gray-700"
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

            {/* Custom Sections - Left Column */}
            {leftSections.map((section) => (
              <div key={section.id}>
                <SectionHeading>{section.title}</SectionHeading>
                <div className="space-y-3">
                  {section.items.map((item) => (
                    <div key={item.id}>
                      <p className="text-[11px] font-semibold text-gray-900">
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className="text-[10px] text-gray-500">
                          {item.subtitle}
                        </p>
                      )}
                      {item.description && (
                        <p className="mt-1 text-[10px] leading-relaxed text-gray-600">
                          {item.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ===== RIGHT COLUMN ===== */}
          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="mb-4">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                {personalInfo.fullName}
              </h1>
              <p className="mt-0.5 text-sm font-medium uppercase tracking-wide text-gray-500">
                {personalInfo.title}
              </p>
            </div>

            {/* Experience */}
            {experience.length > 0 && (
              <div>
                <SectionHeading>Experiencia</SectionHeading>
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
                              className="text-[11px] leading-relaxed text-gray-600 pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-gray-400"
                            >
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
                <SectionHeading>Educación</SectionHeading>
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

            {/* Custom Sections - Right Column */}
            {rightSections.map((section) => (
              <div key={section.id}>
                <SectionHeading>{section.title}</SectionHeading>
                <div className="space-y-4">
                  {section.items.map((item) => (
                    <div key={item.id}>
                      <p className="text-[13px] font-semibold text-gray-900">
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className="text-[11px] text-gray-500">
                          {item.subtitle}
                        </p>
                      )}
                      {item.description && (
                        <p className="mt-1 text-[11px] leading-relaxed text-gray-600">
                          {item.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
);
