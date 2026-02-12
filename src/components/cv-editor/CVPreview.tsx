"use client";

import { useCV } from "@/lib/cv-context";
import { useTranslations } from "next-intl";
import { useColorScheme } from "@/lib/color-scheme-context";
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

  return (
    <div className="flex flex-col items-center px-6 pt-6">
      <ProfilePhotoUpload
        currentPhoto={personalInfo.photo}
        fullName={personalInfo.fullName}
        onPhotoChange={(photo) => updatePersonalInfo("photo", photo)}
      />
      <CVHeader />
    </div>
  );
}

export function CVPreview() {
  const { data: { visibility } } = useCV();
  const { colorScheme } = useColorScheme();

  return (
    <div className="mx-auto w-full md:w-[210mm] max-w-[210mm] bg-white dark:bg-card shadow-sm border border-gray-100 dark:border-border print:shadow-none print:border-none">
      {/* CV Content — A4-like aspect ratio */}
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] min-h-[297mm]">
        {/* ===== MOBILE HEADER: photo + name centered (mobile only) ===== */}
        <div className="order-1 md:hidden">
          <MobileHeader />
        </div>

        {/* ===== NAME & TITLE — desktop only, top-right ===== */}
        <div className="hidden md:block md:col-start-2 md:row-start-1 px-6 pt-6">
          <CVHeader />
        </div>

        {/* ===== LEFT COLUMN — sidebar on desktop, below header on mobile ===== */}
        <div
          className="order-2 md:order-0 md:col-start-1 md:row-start-1 md:row-span-2 p-6 md:pt-6 pt-2 space-y-5"
          style={{ backgroundColor: colorScheme.sidebarBg }}
        >
          <PersonalInfo />
        </div>

        {/* ===== RIGHT COLUMN — experience/education ===== */}
        <div className="order-3 md:order-0 md:col-start-2 md:row-start-2 px-6 pb-6 space-y-5">
          <Experience />
          <Education />
          {visibility.courses && <Courses />}
          {visibility.certifications && <Certifications />}
          {visibility.awards && <Awards />}
        </div>
      </div>
    </div>
  );
}
