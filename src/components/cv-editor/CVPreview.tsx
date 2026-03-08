"use client";

import { useCV } from "@/lib/cv-context";
import { useTranslations } from "next-intl";
import { useColorScheme } from "@/lib/color-scheme-context";
import { useFontSettings } from "@/lib/font-context";
import { getFontDefinition, FONT_SIZE_LEVELS } from "@/lib/fonts";
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

function CVHeader({ noPhoto }: { noPhoto?: boolean }) {
  const {
    data: { personalInfo },
    updatePersonalInfo,
  } = useCV();
  const t = useTranslations("cvPreview");
  const { colorScheme } = useColorScheme();

  // When no photo on white bg: use sidebarBadgeBg (falls back to heading for alpha values)
  const noPhotoBg = colorScheme.sidebarBadgeBg.length <= 7 ? colorScheme.sidebarBadgeBg : colorScheme.heading;
  const nameClr = noPhoto ? noPhotoBg : colorScheme.nameColor;
  const titleClr = noPhoto ? noPhotoBg : undefined;

  return (
    <div className={noPhoto ? "" : "mb-4"}>
      <EditableText
        value={personalInfo.fullName}
        onChange={(v) => updatePersonalInfo("fullName", v)}
        as="heading"
        placeholder={t("fullNamePlaceholder")}
        displayStyle={{ color: nameClr }}
      />
      {!noPhoto && colorScheme.nameAccent !== "transparent" && (
        <div
          className="mt-1 h-0.5 w-12 rounded-full"
          style={{ backgroundColor: colorScheme.nameAccent }}
        />
      )}
      <div className="mt-3">
        <EditableText
          value={personalInfo.jobTitle}
          onChange={(v) => updatePersonalInfo("jobTitle", v)}
          as={noPhoto ? "small" : "subheading"}
          className={noPhoto ? "uppercase! tracking-wide!" : ""}
          placeholder={t("titlePlaceholder")}
          displayStyle={titleClr ? { color: titleClr } : undefined}
        />
      </div>
    </div>
  );
}

function MobileHeader() {
  const {
    data: { personalInfo, visibility },
    updatePersonalInfo,
  } = useCV();

  return (
    <div className={`flex flex-col items-center px-6 ${visibility.photo ? "pt-6" : "pt-12 pb-12"}`}>
      {visibility.photo && (
        <ProfilePhotoUpload
          currentPhoto={personalInfo.photoUrl}
          fullName={personalInfo.fullName}
          onPhotoChange={(photoUrl) => updatePersonalInfo("photoUrl", photoUrl)}
          photoFilter={personalInfo.photoFilter}
          onPhotoFilterChange={(filter) => updatePersonalInfo("photoFilter", filter)}
          sizeClass="w-44 h-44"
          initialsClass="text-4xl"
        />
      )}
      <CVHeader noPhoto={!visibility.photo} />
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
            {/* Desktop header — hidden when photo is off (name moves to sidebar) */}
            {visibility.photo && (
              <div data-testid="desktop-header" className="hidden md:block" style={{ padding: `${mg(24)}px ${mg(24)}px 0` }}>
                <CVHeader />
              </div>
            )}
            {/* Content */}
            <div style={{ padding: `${visibility.photo ? mg(16) : mg(44)}px ${mg(24)}px ${mg(24)}px` }}>
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

export function CVPreview() {
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
        <ClassicTemplate />
      </div>
    </div>
  );
}
