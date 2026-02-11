"use client";

import { useRef } from "react";
import { useCV } from "@/lib/cv-context";
import { useTranslations } from "next-intl";
import { useAppLocale, Locale } from "@/lib/locale-context";
import { CVData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Download, FileUp, FileDown, FileText, Globe, SlidersHorizontal } from "lucide-react";

interface ToolbarProps {
  onPrintPDF: () => void;
}

function isValidCVData(data: unknown): data is CVData {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.personalInfo === "object" &&
    d.personalInfo !== null &&
    typeof (d.personalInfo as Record<string, unknown>).fullName === "string" &&
    Array.isArray(d.experience) &&
    Array.isArray(d.education) &&
    Array.isArray(d.skills) &&
    typeof d.summary === "string"
  );
}

function SectionToggle({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 py-1 cursor-pointer">
      <span className="text-sm text-gray-700">{label}</span>
      <Switch checked={checked} onCheckedChange={onToggle} />
    </label>
  );
}

export function Toolbar({ onPrintPDF }: ToolbarProps) {
  const { data, importData, toggleSection } = useCV();
  const t = useTranslations("toolbar");
  const { locale, setLocale } = useAppLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleLocale = () => {
    setLocale(locale === "en" ? "es" : ("en" as Locale));
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `cv-${data.personalInfo.fullName
      .toLowerCase()
      .replace(/\s+/g, "-")}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        const parsed = JSON.parse(result);

        if (!isValidCVData(parsed)) {
          alert(t("importFormatError"));
          return;
        }

        if (confirm(t("importConfirm"))) {
          importData(parsed);
        }
      } catch {
        alert(t("importReadError"));
      }
    };
    reader.readAsText(file);

    e.target.value = "";
  };

  return (
    <header className="no-print sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-900" />
          <span className="text-sm font-semibold tracking-tight text-gray-900">
            Applio
          </span>
          <span className="hidden text-xs text-gray-400 sm:inline">
            {t("tagline")}
          </span>
        </div>

        {/* Actions — icon-only except PDF */}
        <div className="flex items-center gap-1">
          {/* Language toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-600 hover:text-gray-900"
                onClick={toggleLocale}
              >
                <Globe className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {locale === "en" ? "Cambiar a Español" : "Switch to English"}
            </TooltipContent>
          </Tooltip>

          {/* Sections toggle */}
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-600 hover:text-gray-900"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>{t("sections")}</TooltipContent>
            </Tooltip>
            <PopoverContent className="w-64" align="end">
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">{t("sectionsTitle")}</p>
                  <SectionToggle label={t("sectionEmail")} checked={data.visibility.email} onToggle={() => toggleSection("email")} />
                  <SectionToggle label={t("sectionPhone")} checked={data.visibility.phone} onToggle={() => toggleSection("phone")} />
                  <SectionToggle label={t("sectionLocation")} checked={data.visibility.location} onToggle={() => toggleSection("location")} />
                  <SectionToggle label={t("sectionLinkedin")} checked={data.visibility.linkedin} onToggle={() => toggleSection("linkedin")} />
                  <SectionToggle label={t("sectionWebsite")} checked={data.visibility.website} onToggle={() => toggleSection("website")} />
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">{t("optionalSections")}</p>
                  <SectionToggle label={t("sectionCourses")} checked={data.visibility.courses} onToggle={() => toggleSection("courses")} />
                  <SectionToggle label={t("sectionCertifications")} checked={data.visibility.certifications} onToggle={() => toggleSection("certifications")} />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileImport}
            className="hidden"
            aria-label={t("importAriaLabel")}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-600 hover:text-gray-900"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUp className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("importTitle")}</TooltipContent>
          </Tooltip>

          {/* Export JSON */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-600 hover:text-gray-900"
                onClick={exportToJSON}
              >
                <FileDown className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("exportTitle")}</TooltipContent>
          </Tooltip>

          {/* Export PDF */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className="ml-1 bg-gray-900 text-white hover:bg-gray-800"
                onClick={onPrintPDF}
              >
                <Download className="mr-1.5 h-4 w-4" />
                <span>PDF</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("pdfTitle")}</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}
