"use client";

import { useCV } from "@/lib/cv-context";
import { useTranslations } from "next-intl";
import { useColorScheme } from "@/lib/color-scheme-context";
import { useFontSettings } from "@/lib/font-context";
import { getFontDefinition, FONT_SIZE_LEVELS } from "@/lib/fonts";
import { useAppLocale } from "@/lib/locale-context";

import { Heart, Mail, Phone, MapPin, Linkedin, Globe } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EditableText } from "./EditableText";
import { PersonalInfo } from "./PersonalInfo";
import { ProfilePhotoUpload } from "./ProfilePhotoUpload";
import { Experience } from "./Experience";
import { Education } from "./Education";
import { Courses } from "./Courses";
import { Certifications } from "./Certifications";
import { Awards } from "./Awards";

function CVHeader() {
  const {
    data: { personalInfo },
    updatePersonalInfo,
  } = useCV();
  const t = useTranslations("cvPreview");
  const { colorScheme } = useColorScheme();

  return (
    <div className="mb-4">
      <EditableText
        value={personalInfo.fullName}
        onChange={(v) => updatePersonalInfo("fullName", v)}
        as="heading"
        placeholder={t("fullNamePlaceholder")}
      />
      {colorScheme.nameAccent !== "transparent" && (
        <div
          className="mt-1 h-0.5 w-12 rounded-full"
          style={{ backgroundColor: colorScheme.nameAccent }}
        />
      )}
      <div className="mt-0.5">
        <EditableText
          value={personalInfo.jobTitle}
          onChange={(v) => updatePersonalInfo("jobTitle", v)}
          as="subheading"
          placeholder={t("titlePlaceholder")}
        />
      </div>
    </div>
  );
}

function MobileHeader() {
  const {
    data: { personalInfo },
    updatePersonalInfo,
  } = useCV();
  const { colorScheme } = useColorScheme();

  return (
    <div className="flex flex-col items-center px-6 pt-6">
      <ProfilePhotoUpload
        currentPhoto={personalInfo.photoUrl}
        fullName={personalInfo.fullName}
        onPhotoChange={(photoUrl) => updatePersonalInfo("photoUrl", photoUrl)}
        placeholderBg={`${colorScheme.nameAccent}18`}
        placeholderText={`${colorScheme.nameAccent}90`}
      />
      <CVHeader />
    </div>
  );
}

function ClassicTemplate() {
  const { data: { visibility, personalInfo } } = useCV();
  const t = useTranslations("cvPreview");
  const { colorScheme } = useColorScheme();
  const { locale } = useAppLocale();
  const mg = (px: number) => Math.round(px * 1.6);

  return (
    <>
      {/* CV Content — two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] md:flex-1">
        {/* ===== MOBILE HEADER: photo + name centered (mobile only) ===== */}
        <div className="order-1 md:hidden">
          <MobileHeader />
        </div>

        {/* ===== LEFT COLUMN — sidebar ===== */}
        <div
          data-testid="cv-sidebar"
          className={`order-2 md:order-0 md:col-start-1 md:row-start-1 relative${colorScheme.sidebarText === "#ffffff" ? " cv-sidebar-dark" : ""}`}
          style={{ backgroundColor: colorScheme.sidebarBg, padding: mg(24) }}
        >
          <div className="relative space-y-5">
            <PersonalInfo />
          </div>
        </div>

        {/* ===== RIGHT COLUMN ===== */}
        <div className="order-3 md:order-0 md:col-start-2 md:row-start-1 relative">
          <div className="relative">
            {/* Desktop header */}
            <div data-testid="desktop-header" className="hidden md:block" style={{ padding: `${mg(24)}px ${mg(24)}px 0` }}>
              <CVHeader />
            </div>
            {/* Content */}
            <div style={{ padding: `${mg(16)}px ${mg(24)}px ${mg(24)}px` }}>
              <div className="space-y-5">
                <Experience />
                <Education />
                {visibility.courses && <Courses />}
                {visibility.certifications && <Certifications />}
                {visibility.awards && <Awards />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== FOOTER — single row spanning both columns ===== */}
      <div className="hidden md:grid grid-cols-[250px_1fr] mt-auto">
        {/* Left: Applio branding on sidebar */}
        <div
          className={`flex items-center justify-center${colorScheme.sidebarText === "#ffffff" ? " cv-sidebar-dark" : ""}`}
          style={{ backgroundColor: colorScheme.sidebarBg, padding: `${mg(8)}px ${mg(24)}px ${mg(12)}px` }}
        >
          <a
            href="https://www.applio.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs transition-opacity hover:opacity-70"
            style={{ color: colorScheme.sidebarMuted }}
          >
            Applio
            <Heart className="h-3 w-3 fill-current" strokeWidth={0} />
          </a>
        </div>
        {/* Right: Name · Date · Page */}
        <div
          className="flex items-center justify-end text-xs text-[#aaaaaa]"
          style={{ padding: `${mg(8)}px ${mg(24)}px ${mg(12)}px` }}
        >
          {personalInfo.fullName}
          &nbsp;&nbsp;·&nbsp;&nbsp;
          {new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date())}
          &nbsp;&nbsp;·&nbsp;&nbsp;
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help border-b border-dashed border-[#cccccc]">1 / 1</span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-56 text-center">
              {t("paginationHint")}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </>
  );
}

function NoPhotoTemplate() {
  const { data: { visibility, personalInfo, skillCategories, summary }, updatePersonalInfo, updateSummary } = useCV();
  const t = useTranslations("cvPreview");
  const tpi = useTranslations("personalInfo");
  const { colorScheme } = useColorScheme();
  const { locale } = useAppLocale();
  const mg = (px: number) => Math.round(px * 1.6);

  const hasContact = personalInfo.email || personalInfo.phone ||
    (visibility.location && personalInfo.location) ||
    (visibility.linkedin && personalInfo.linkedin) ||
    (visibility.website && personalInfo.website);

  // Section title helper: left accent bar + label + separator line
  const sectionTitle = (label: string) => (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-0.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: colorScheme.heading }} />
      <h3 className="text-[10px] font-bold tracking-[0.18em] uppercase shrink-0" style={{ color: colorScheme.heading }}>
        {label}
      </h3>
      <div className="flex-1 h-px" style={{ backgroundColor: `${colorScheme.heading}18` }} />
    </div>
  );

  return (
    <>
      {/* ===== TOP ACCENT BAR — premium signature ===== */}
      <div style={{ height: 3, backgroundColor: colorScheme.heading }} />

      {/* ===== HEADER ===== */}
      <div style={{ padding: `${mg(26)}px ${mg(32)}px ${mg(18)}px` }}>
        <EditableText
          value={personalInfo.fullName}
          onChange={(v) => updatePersonalInfo("fullName", v)}
          as="heading"
          placeholder={t("fullNamePlaceholder")}
        />
        {colorScheme.nameAccent !== "transparent" && (
          <div className="mt-1 h-0.5 w-10 rounded-full" style={{ backgroundColor: colorScheme.nameAccent }} />
        )}
        <div className="mt-1">
          <EditableText
            value={personalInfo.jobTitle}
            onChange={(v) => updatePersonalInfo("jobTitle", v)}
            as="subheading"
            placeholder={t("titlePlaceholder")}
          />
        </div>

        {/* Contact row — inline with · separators */}
        {hasContact && (
          <div className="mt-3 flex flex-wrap items-center gap-y-1">
            {[
              personalInfo.email && { icon: Mail, value: personalInfo.email, key: "email", onChange: (v: string) => updatePersonalInfo("email", v), ph: "email" },
              personalInfo.phone && { icon: Phone, value: personalInfo.phone, key: "phone", onChange: (v: string) => updatePersonalInfo("phone", v), ph: "phone" },
              (visibility.location && personalInfo.location) && { icon: MapPin, value: personalInfo.location, key: "location", onChange: (v: string) => updatePersonalInfo("location", v), ph: "location" },
              (visibility.linkedin && personalInfo.linkedin) && { icon: Linkedin, value: personalInfo.linkedin, key: "linkedin", onChange: (v: string) => updatePersonalInfo("linkedin", v), ph: "linkedin" },
              (visibility.website && personalInfo.website) && { icon: Globe, value: personalInfo.website, key: "website", onChange: (v: string) => updatePersonalInfo("website", v), ph: "website" },
            ].filter(Boolean).map((item, idx) => {
              if (!item) return null;
              const Icon = item.icon;
              return (
                <span key={item.key} className="inline-flex items-center">
                  {idx > 0 && (
                    <span className="mx-2.5 select-none text-[10px]" style={{ color: `${colorScheme.heading}35` }}>·</span>
                  )}
                  <span className="inline-flex items-center gap-1" style={{ color: colorScheme.sidebarMuted }}>
                    <Icon className="h-2.5 w-2.5 shrink-0" style={{ color: colorScheme.heading }} />
                    <EditableText value={item.value} onChange={item.onChange} as="small" placeholder={item.ph} />
                  </span>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Header bottom divider */}
      <div style={{ height: 1, backgroundColor: `${colorScheme.heading}14`, marginLeft: mg(32), marginRight: mg(32) }} />

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1" style={{ padding: `${mg(22)}px ${mg(32)}px ${mg(28)}px` }}>
        <div className="space-y-6">

          {/* Summary */}
          {visibility.summary && summary && (
            <section>
              {sectionTitle(tpi("aboutMe"))}
              <EditableText
                value={summary}
                onChange={updateSummary}
                as="body"
                multiline
                richText
                placeholder={tpi("summaryPlaceholder")}
              />
            </section>
          )}

          {/* Skills — two-column: category label | chips */}
          {skillCategories.length > 0 && (
            <section>
              {sectionTitle(tpi("skills"))}
              <div className="space-y-2">
                {skillCategories.map((cat) => (
                  <div key={cat.id} className="flex items-start gap-4">
                    <span
                      className="text-[9px] font-bold tracking-widest uppercase shrink-0 pt-0.5"
                      style={{ width: "5.5rem", textAlign: "right", color: `${colorScheme.heading}70` }}
                    >
                      {cat.category}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.items.map((skill, i) => (
                        <span
                          key={`${cat.id}-${i}`}
                          className="text-[11px] px-2 py-0.5 rounded"
                          style={{ backgroundColor: `${colorScheme.heading}12`, color: colorScheme.heading }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <Experience />
          <Education />
          {visibility.courses && <Courses />}
          {visibility.certifications && <Certifications />}
          {visibility.awards && <Awards />}
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <div
        className="hidden md:flex items-center justify-between text-xs text-[#aaaaaa] mt-auto"
        style={{ padding: `${mg(8)}px ${mg(32)}px ${mg(12)}px`, borderTop: `1px solid ${colorScheme.heading}12` }}
      >
        <a
          href="https://www.applio.dev/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 transition-opacity hover:opacity-70"
          style={{ color: "#bbbbbb" }}
        >
          Applio
          <Heart className="h-3 w-3 fill-current" strokeWidth={0} />
        </a>
        <span>
          {personalInfo.fullName}
          &nbsp;&nbsp;·&nbsp;&nbsp;
          {new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date())}
          &nbsp;&nbsp;·&nbsp;&nbsp;
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help border-b border-dashed border-[#cccccc]">1 / 1</span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-56 text-center">
              {t("paginationHint")}
            </TooltipContent>
          </Tooltip>
        </span>
      </div>
    </>
  );
}

export function CVPreview() {
  const { data: { templateId } } = useCV();
  const { fontFamilyId, fontSizeLevel } = useFontSettings();
  const fontDef = getFontDefinition(fontFamilyId);

  return (
    <div
      className="cv-preview-content mx-auto w-full lg:w-[210mm] max-w-[210mm] bg-white md:shadow-[0_2px_20px_-6px_rgba(0,0,0,0.12)] dark:md:shadow-[0_2px_20px_-6px_rgba(0,0,0,0.45)] print:shadow-none"
      style={{ fontFamily: fontDef.cssStack }}
    >
      <div
        className="md:flex md:flex-col md:min-h-[297mm]"
        style={fontSizeLevel !== 2 ? { fontSize: `${FONT_SIZE_LEVELS[fontSizeLevel]}em` } : undefined}
      >
        {templateId === "noPhoto" ? <NoPhotoTemplate /> : <ClassicTemplate />}
      </div>
    </div>
  );
}
