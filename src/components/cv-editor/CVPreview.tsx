"use client";

import { useCV } from "@/lib/cv-context";
import { useTranslations } from "next-intl";
import { EditableText } from "./EditableText";
import { PersonalInfo } from "./PersonalInfo";
import { Experience } from "./Experience";
import { Education } from "./Education";

function CVHeader() {
  const {
    data: { personalInfo },
    updatePersonalInfo,
  } = useCV();
  const t = useTranslations("cvPreview");

  return (
    <div className="mb-4">
      <EditableText
        value={personalInfo.fullName}
        onChange={(v) => updatePersonalInfo("fullName", v)}
        as="heading"
        placeholder={t("fullNamePlaceholder")}
      />
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

export function CVPreview() {
  return (
    <div className="mx-auto w-full max-w-[210mm] bg-white shadow-sm border border-gray-100 print:shadow-none print:border-none">
      {/* CV Content — A4-like aspect ratio */}
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] min-h-[297mm]">
        {/* ===== LEFT COLUMN ===== */}
        <div className="border-r border-gray-100 bg-gray-50/50 p-6 space-y-5">
          <PersonalInfo />
        </div>

        {/* ===== RIGHT COLUMN ===== */}
        <div className="p-6 space-y-5">
          <CVHeader />
          <Experience />
          <Education />
        </div>
      </div>
    </div>
  );
}
