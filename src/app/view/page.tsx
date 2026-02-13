"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { LocaleProvider } from "@/lib/locale-context";
import { ThemeProvider } from "@/lib/theme-context";
import { ColorSchemeProvider } from "@/lib/color-scheme-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PrintableCV } from "@/components/cv-editor/PrintableCV";
import { decompressSharedData } from "@/lib/sharing";
import type { SharedCVData, CVData } from "@/lib/types";
import { getColorScheme, type ColorSchemeName } from "@/lib/color-schemes";
import { FileText, AlertCircle, Heart, Download } from "lucide-react";

const FONT_SIZE_SCALES: Record<number, number> = { 1: 1, 2: 1.08 };
const MARGIN_SCALES: Record<number, number> = { 1: 1.3, 2: 1.6 };

function ViewContent() {
  const t = useTranslations("sharedView");
  const [sharedData, setSharedData] = useState<SharedCVData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) {
      setError(true);
      setLoading(false);
      return;
    }
    const data = decompressSharedData(hash);
    if (!data) {
      setError(true);
      setLoading(false);
      return;
    }
    setSharedData(data);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400 text-sm">
          {t("loading")}
        </div>
      </div>
    );
  }

  if (error || !sharedData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h1 className="text-lg font-semibold text-gray-700 mb-2">
            {t("errorTitle")}
          </h1>
          <p className="text-sm text-gray-500 mb-6">{t("errorMessage")}</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            <FileText className="h-4 w-4" />
            {t("createYourCV")}
          </a>
        </div>
      </div>
    );
  }

  const cvData: CVData = {
    ...sharedData.cv,
    personalInfo: {
      ...sharedData.cv.personalInfo,
      photo: undefined,
    },
  };

  const colorScheme = getColorScheme(
    sharedData.settings.colorScheme as ColorSchemeName
  );
  const fontScale =
    FONT_SIZE_SCALES[sharedData.settings.fontSizeLevel] ?? 1;
  const marginScale =
    MARGIN_SCALES[sharedData.settings.marginLevel] ?? 1.3;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 print:bg-white print:p-0">
      {/* PDF button */}
      <div className="print:hidden fixed top-4 right-4 z-10">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 shadow-lg transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          PDF
        </button>
      </div>

      <div
        className="cv-zoom-shared mx-auto bg-white shadow-lg print:shadow-none"
        style={{ width: "210mm", maxWidth: "100%" }}
      >
        <PrintableCV
          data={cvData}
          forceInitials
          colorSchemeOverride={colorScheme}
          fontScaleOverride={fontScale}
          marginScaleOverride={marginScale}
        />
      </div>

      <div className="text-center mt-6 print:hidden">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-500 transition-colors"
        >
          <FileText className="h-3 w-3" />
          <span className="text-[11px] font-semibold tracking-tight">Applio</span>
          <Heart className="h-2.5 w-2.5 fill-current" />
          <span className="text-[11px]">{t("madeWith")}</span>
        </a>
      </div>
    </div>
  );
}

export default function ViewPage() {
  return (
    <ThemeProvider>
      <ColorSchemeProvider>
        <LocaleProvider>
          <TooltipProvider delayDuration={300}>
            <ViewContent />
          </TooltipProvider>
        </LocaleProvider>
      </ColorSchemeProvider>
    </ThemeProvider>
  );
}
