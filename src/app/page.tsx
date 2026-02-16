"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { CVProvider, useCV } from "@/lib/cv-context";
import { LocaleProvider, useAppLocale } from "@/lib/locale-context";
import { ThemeProvider } from "@/lib/theme-context";
import { ColorSchemeProvider, useColorScheme } from "@/lib/color-scheme-context";
import { SidebarPatternProvider, useSidebarPattern } from "@/lib/sidebar-pattern-context";
import { downloadPDF } from "@/lib/generate-pdf";
import { filenameDateStamp } from "@/lib/utils";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Toolbar } from "@/components/toolbar/Toolbar";
import { CVEditor } from "@/components/cv-editor/CVEditor";

function AppContent() {
  const { data } = useCV();
  const t = useTranslations("toolbar");
  const tp = useTranslations("printable");
  const { colorScheme } = useColorScheme();
  const { patternSettings } = useSidebarPattern();
  const { locale } = useAppLocale();
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
      await downloadPDF(data, filename, colorScheme, labels, locale, patternSettings);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [isGeneratingPDF, data, colorScheme, tp, patternSettings, locale]);

  return (
    <div className="min-h-screen transition-colors duration-300 dark:bg-background" style={{ backgroundColor: colorScheme.pageBg }}>
      <Toolbar
        onPrintPDF={handlePrint}
        isGeneratingPDF={isGeneratingPDF}
      />
      <CVEditor />

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
          <LocaleProvider>
            <CVProvider>
            <TooltipProvider delayDuration={300}>
              <AppContent />
              <Toaster
                position="bottom-center"
                duration={5000}
                icons={{ success: null }}
                toastOptions={{
                  classNames: {
                    toast: "!bg-gray-900 !text-white !border-none !shadow-lg !rounded-xl !py-3 !px-5 !text-sm !max-w-[calc(100vw-2rem)] !w-auto dark:!bg-gray-100 dark:!text-gray-900",
                  },
                }}
              />
            </TooltipProvider>
            </CVProvider>
          </LocaleProvider>
        </SidebarPatternProvider>
      </ColorSchemeProvider>
    </ThemeProvider>
  );
}
