"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Download, Heart, Loader2, FileText } from "lucide-react";
import { LocaleProvider, useAppLocale } from "@/lib/locale-context";
import { ThemeProvider } from "@/lib/theme-context";
import { ColorSchemeProvider } from "@/lib/color-scheme-context";
import { SidebarPatternProvider } from "@/lib/sidebar-pattern-context";
import { FontSettingsProvider } from "@/lib/font-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PrintableCV } from "@/components/cv-editor/PrintableCV";
import { MobileCVView } from "@/components/cv-editor/MobileCVView";
import { downloadPDF } from "@/lib/generate-pdf";
import { filenameDateStamp } from "@/lib/utils";
import { getColorScheme, type ColorSchemeName } from "@/lib/color-schemes";
import type { PatternSettings } from "@/lib/sidebar-patterns";
import {
  FONT_SIZE_LEVELS,
  FONT_FAMILY_IDS,
  getFontDefinition,
  PDF_BASE_FONT_SCALE,
  type FontFamilyId,
  type FontSizeLevel,
} from "@/lib/fonts";
import type { CVData } from "@/lib/types";
import type { CloudSettings } from "@/lib/supabase/db";

const FONT_SIZE_SCALES: Record<number, number> = { 1: 0.85, 2: 1.0, 3: 1.18 };

interface SharedCVContentProps {
  cvData: CVData;
  settings: CloudSettings;
}

function SharedCVInner({ cvData, settings }: SharedCVContentProps) {
  const t = useTranslations("sharedView");
  const tt = useTranslations("toolbar");
  const tp = useTranslations("printable");
  const { locale } = useAppLocale();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Resolve visual settings
  const colorScheme = getColorScheme(settings.colorScheme as ColorSchemeName);
  const fontScale = FONT_SIZE_SCALES[settings.fontSizeLevel] ?? 1.0;
  const fontFamilyId = settings.fontFamily as FontFamilyId | undefined;
  const fontDef = fontFamilyId && FONT_FAMILY_IDS.includes(fontFamilyId)
    ? getFontDefinition(fontFamilyId)
    : null;

  const patternSettings: PatternSettings | undefined = settings.pattern
    ? {
        name: settings.pattern.name as PatternSettings["name"],
        sidebarIntensity: (settings.pattern.sidebarIntensity ?? 3) as PatternSettings["sidebarIntensity"],
        mainIntensity: (settings.pattern.mainIntensity ?? 2) as PatternSettings["mainIntensity"],
        scope: settings.pattern.scope as PatternSettings["scope"],
      }
    : undefined;

  // The photo is already an R2 URL in cv_data.personalInfo.photo (not base64)
  const photoUrl = cvData.personalInfo.photo;

  // Dynamically load Google Font
  useEffect(() => {
    if (!fontDef?.googleFontsCss2Url) return;
    const id = `google-font-${fontDef.id}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = fontDef.googleFontsCss2Url;
    document.head.appendChild(link);
  }, [fontDef]);

  const handleDownloadPDF = useCallback(async () => {
    if (isGeneratingPDF) return;
    setIsGeneratingPDF(true);
    try {
      const name = cvData.personalInfo.fullName.replace(/\s+/g, "-");
      const filename = `CV-${name}_${filenameDateStamp(locale)}.pdf`;
      const labels = {
        contact: tp("contact"),
        aboutMe: tp("aboutMe"),
        skills: tp("skills"),
        experience: tp("experience"),
        education: tp("education"),
        courses: tp("courses"),
        certifications: tp("certifications"),
        awards: tp("awards"),
      };
      const pdfFontFamily = fontDef?.pdfFamilyName;
      const pdfFontScale = (FONT_SIZE_LEVELS[(settings.fontSizeLevel ?? 2) as FontSizeLevel] ?? 1) * PDF_BASE_FONT_SCALE;
      await downloadPDF(cvData, filename, colorScheme, labels, locale, patternSettings, pdfFontFamily, pdfFontScale);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [isGeneratingPDF, cvData, colorScheme, tp, locale, patternSettings, fontDef, settings.fontSizeLevel]);

  return (
    <div className="min-h-screen bg-gray-50 lg:bg-gray-100 lg:py-8 lg:px-4 overflow-x-auto">
      {/* PDF button */}
      <div className="fixed top-3 right-3 lg:top-4 lg:right-4 z-10">
        <button
          onClick={handleDownloadPDF}
          disabled={isGeneratingPDF}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 shadow-lg transition-colors disabled:opacity-50"
        >
          {isGeneratingPDF ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          PDF
        </button>
      </div>

      {/* Desktop: PrintableCV with zoom */}
      <div className="hidden lg:block">
        <div
          className="cv-zoom-shared mx-auto bg-white shadow-lg"
          style={{ width: "210mm" }}
        >
          <PrintableCV
            data={cvData}
            forceInitials={!photoUrl}
            photoUrl={photoUrl}
            colorSchemeOverride={colorScheme}
            fontScaleOverride={fontScale}
            marginScaleOverride={1.6}
            patternOverride={patternSettings}
            fontFamilyOverride={fontDef?.cssStack}
          />
        </div>
      </div>

      {/* Mobile/tablet */}
      <div className="lg:hidden">
        <MobileCVView
          data={cvData}
          colors={colorScheme}
          photoUrl={photoUrl}
          patternSettings={patternSettings}
          fontFamilyOverride={fontDef?.cssStack}
        />
      </div>

      <div className="text-center py-6 space-y-1">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-500 transition-colors"
        >
          <span className="text-sm font-normal tracking-tight">Applio</span>
          <Heart className="h-3 w-3 fill-current" />
        </a>
        <p className="text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Applio. {tt("copyright")}
        </p>
      </div>

      {/* PDF loading overlay */}
      {isGeneratingPDF && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          role="alert"
          aria-busy="true"
        >
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-white" />
            <p className="text-sm font-medium text-white">{t("generating")}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function SharedCVContent({ cvData, settings }: SharedCVContentProps) {
  return (
    <ThemeProvider>
      <ColorSchemeProvider>
        <SidebarPatternProvider>
          <FontSettingsProvider>
            <LocaleProvider>
              <TooltipProvider delayDuration={300}>
                <SharedCVInner cvData={cvData} settings={settings} />
              </TooltipProvider>
            </LocaleProvider>
          </FontSettingsProvider>
        </SidebarPatternProvider>
      </ColorSchemeProvider>
    </ThemeProvider>
  );
}
