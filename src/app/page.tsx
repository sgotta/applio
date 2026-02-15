"use client";

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { CVProvider, useCV } from "@/lib/cv-context";
import { LocaleProvider } from "@/lib/locale-context";
import { ThemeProvider } from "@/lib/theme-context";
import { ColorSchemeProvider } from "@/lib/color-scheme-context";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toolbar } from "@/components/toolbar/Toolbar";
import { CVEditor } from "@/components/cv-editor/CVEditor";
import { PrintableCV } from "@/components/cv-editor/PrintableCV";
import { useOverflowDetection } from "@/hooks/useOverflowDetection";

function AppContent() {
  const { data } = useCV();
  const printRef = useRef<HTMLDivElement>(null);
  const printContainerRef = useRef<HTMLDivElement>(null);
  const { isOverflowing } = useOverflowDetection(printContainerRef);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `CV-${data.personalInfo.fullName.replace(/\s+/g, "-")}`,
    pageStyle: `
      @page {
        size: auto;
        margin: 0;
      }
      @media print {
        html, body {
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
  });

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-background">
      <Toolbar onPrintPDF={() => handlePrint()} isOverflowing={isOverflowing} />
      <CVEditor />

      {/* Off-screen printable version for PDF generation & overflow detection */}
      <div
        ref={printContainerRef}
        className="absolute -left-[9999px] top-0"
        style={{ width: "210mm", height: "297mm", overflow: "hidden" }}
      >
        <PrintableCV ref={printRef} data={data} />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <ColorSchemeProvider>
        <LocaleProvider>
          <CVProvider>
            <TooltipProvider delayDuration={300}>
              <AppContent />
            </TooltipProvider>
          </CVProvider>
        </LocaleProvider>
      </ColorSchemeProvider>
    </ThemeProvider>
  );
}
