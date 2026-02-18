"use client";

import { useCV } from "@/lib/cv-context";
import { useTranslations } from "next-intl";
import { useColorScheme } from "@/lib/color-scheme-context";
import { useSidebarPattern } from "@/lib/sidebar-pattern-context";
import { useFontSettings } from "@/lib/font-context";
import { getFontDefinition, FONT_SIZE_LEVELS, CJK_LOCALES } from "@/lib/fonts";
import { useAppLocale } from "@/lib/locale-context";

import { Heart } from "lucide-react";
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
          value={personalInfo.title}
          onChange={(v) => updatePersonalInfo("title", v)}
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
        currentPhoto={personalInfo.photo}
        fullName={personalInfo.fullName}
        onPhotoChange={(photo) => updatePersonalInfo("photo", photo)}
        placeholderBg={`${colorScheme.nameAccent}18`}
        placeholderText={`${colorScheme.nameAccent}90`}
      />
      <CVHeader />
    </div>
  );
}

export function CVPreview() {
  const { data: { visibility, personalInfo } } = useCV();
  const t = useTranslations("cvPreview");
  const { colorScheme } = useColorScheme();
  const { pattern, sidebarIntensity, mainIntensity, scope } = useSidebarPattern();
  const { fontFamilyId, fontSizeLevel } = useFontSettings();
  const { locale } = useAppLocale();
  const isCJK = CJK_LOCALES.has(locale);
  const fontDef = isCJK ? null : getFontDefinition(fontFamilyId);
  const mg = (px: number) => Math.round(px * 1.6);

  return (
    <div
      className="cv-preview-content mx-auto w-full lg:w-[210mm] max-w-[210mm] bg-white md:shadow-[0_2px_20px_-6px_rgba(0,0,0,0.12)] dark:md:shadow-[0_2px_20px_-6px_rgba(0,0,0,0.45)] print:shadow-none"
      style={fontDef ? { fontFamily: fontDef.cssStack } : undefined}
    >
      {/* Font-size scale wrapper — flex column to push footer to bottom */}
      <div
        className="md:flex md:flex-col md:min-h-[297mm]"
        style={fontSizeLevel !== 2 ? { fontSize: `${FONT_SIZE_LEVELS[fontSizeLevel]}em` } : undefined}
      >
      {/* CV Content — two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] md:flex-1">
        {/* ===== MOBILE HEADER: photo + name centered (mobile only) ===== */}
        <div className="order-1 md:hidden">
          <MobileHeader />
        </div>

        {/* ===== LEFT COLUMN — sidebar on desktop, below header on mobile ===== */}
        <div
          className={`order-2 md:order-0 md:col-start-1 md:row-start-1 relative${colorScheme.sidebarText === "#ffffff" ? " cv-sidebar-dark" : ""}`}
          style={{ backgroundColor: colorScheme.sidebarBg, padding: mg(24) }}
        >
          {pattern.name !== "none" && (scope === "sidebar" || scope === "full") && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={pattern.getStyle(colorScheme.sidebarText, sidebarIntensity)}
            />
          )}
          <div className="relative space-y-5">
            <PersonalInfo />
          </div>
        </div>

        {/* ===== RIGHT COLUMN — single cell so pattern tiles seamlessly ===== */}
        <div className="order-3 md:order-0 md:col-start-2 md:row-start-1 relative">
          {pattern.name !== "none" && (scope === "main" || scope === "full") && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={pattern.getStyle(colorScheme.heading, mainIntensity)}
            />
          )}
          <div className="relative">
            {/* Desktop header */}
            <div className="hidden md:block" style={{ padding: `${mg(24)}px ${mg(24)}px 0` }}>
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
          className={`relative flex items-center justify-center${colorScheme.sidebarText === "#ffffff" ? " cv-sidebar-dark" : ""}`}
          style={{ backgroundColor: colorScheme.sidebarBg, padding: `${mg(8)}px ${mg(24)}px ${mg(12)}px` }}
        >
          {pattern.name !== "none" && (scope === "sidebar" || scope === "full") && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={pattern.getStyle(colorScheme.sidebarText, sidebarIntensity)}
            />
          )}
          <a
            href="https://www.applio.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="relative inline-flex items-center gap-1 text-xs transition-opacity hover:opacity-70"
            style={{ color: colorScheme.sidebarMuted }}
          >
            Applio
            <Heart className="h-3 w-3 fill-current" strokeWidth={0} />
          </a>
        </div>
        {/* Right: Name · Date · Page */}
        <div
          className="relative flex items-center justify-end text-xs text-[#aaaaaa]"
          style={{ padding: `${mg(8)}px ${mg(24)}px ${mg(12)}px` }}
        >
          {pattern.name !== "none" && (scope === "main" || scope === "full") && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={pattern.getStyle(colorScheme.heading, mainIntensity)}
            />
          )}
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
      </div>
    </div>
  );
}
