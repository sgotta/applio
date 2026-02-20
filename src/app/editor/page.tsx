"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Loader2, FileText } from "lucide-react";
import { CVProvider, useCV } from "@/lib/cv-context";
import { LocaleProvider, useAppLocale } from "@/lib/locale-context";
import { ThemeProvider } from "@/lib/theme-context";
import { AuthProvider } from "@/lib/auth-context";
import { PlanProvider, usePlan } from "@/lib/plan-context";
import { ColorSchemeProvider, useColorScheme } from "@/lib/color-scheme-context";
import { SidebarPatternProvider, useSidebarPattern } from "@/lib/sidebar-pattern-context";
import { FontSettingsProvider, useFontSettings } from "@/lib/font-context";
import { SyncStatusProvider } from "@/lib/sync-status-context";
import { downloadPDF } from "@/lib/generate-pdf";
import { filenameDateStamp } from "@/lib/utils";
import { getFontDefinition, FONT_SIZE_LEVELS, PDF_BASE_FONT_SCALE } from "@/lib/fonts";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Toolbar } from "@/components/toolbar/Toolbar";
import { CVEditor } from "@/components/cv-editor/CVEditor";
import { CloudSync } from "@/components/cloud-sync/CloudSync";

function AppContent() {
  const { data, loading } = useCV();
  const t = useTranslations("toolbar");
  const tp = useTranslations("printable");
  const { colorScheme } = useColorScheme();
  const { patternSettings } = useSidebarPattern();
  const { fontFamilyId, fontSizeLevel } = useFontSettings();
  const { locale } = useAppLocale();
  const { isPremium } = usePlan();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handlePrint = useCallback(async () => {
    if (isGeneratingPDF) return;
    setIsGeneratingPDF(true);
    try {
      const name = data.personalInfo.fullName.replace(/\s+/g, "-");
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
      const pdfFontFamily = getFontDefinition(fontFamilyId).pdfFamilyName;
      const pdfFontScale = FONT_SIZE_LEVELS[fontSizeLevel] * PDF_BASE_FONT_SCALE;
      await downloadPDF(data, filename, colorScheme, labels, locale, patternSettings, pdfFontFamily, pdfFontScale, isPremium);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [isGeneratingPDF, data, colorScheme, tp, patternSettings, locale, fontFamilyId, fontSizeLevel, isPremium]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 dark:bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-background animate-editor-enter">
      <Toolbar
        onPrintPDF={handlePrint}
        isGeneratingPDF={isGeneratingPDF}
      />
      <CVEditor />

      <footer className="mt-4 border-t border-gray-200 dark:border-white/6 bg-white/60 dark:bg-card/60 backdrop-blur-sm py-6 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span className="text-sm font-semibold tracking-tight text-gray-500 dark:text-gray-400">Applio</span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            &copy; {new Date().getFullYear()} Applio v{process.env.NEXT_PUBLIC_APP_VERSION}. {t("copyright")}
          </p>
        </div>
      </footer>

      {/* Full-screen loading overlay while generating PDF */}
      {isGeneratingPDF && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          role="alert"
          aria-busy="true"
        >
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-white" />
            <p className="text-sm font-medium text-white">
              {t("pdfGenerating")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <ColorSchemeProvider>
        <SidebarPatternProvider>
          <FontSettingsProvider>
          <LocaleProvider>
            <AuthProvider>
            <PlanProvider>
            <SyncStatusProvider>
            <CVProvider>
            <TooltipProvider delayDuration={300}>
              <CloudSync />
              <AppContent />
              <Toaster
                position="top-center"
                offset="4.5rem"
                duration={5000}
                icons={{ success: null }}
                toastOptions={{
                  classNames: {
                    toast: "!bg-gray-900 !text-white !border-none !shadow-lg !rounded-xl !py-3 !px-5 !text-sm !max-w-[calc(100vw-2rem)] dark:!bg-gray-100 dark:!text-gray-900",
                  },
                }}
              />
            </TooltipProvider>
            </CVProvider>
            </SyncStatusProvider>
            </PlanProvider>
            </AuthProvider>
          </LocaleProvider>
          </FontSettingsProvider>
        </SidebarPatternProvider>
      </ColorSchemeProvider>
    </ThemeProvider>
  );
}
