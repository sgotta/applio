"use client";

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { CVProvider, useCV } from "@/lib/cv-context";
import { LocaleProvider } from "@/lib/locale-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toolbar } from "@/components/toolbar/Toolbar";
import { CVEditor } from "@/components/cv-editor/CVEditor";
import { PrintableCV } from "@/components/cv-editor/PrintableCV";

function AppContent() {
  const { data } = useCV();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `CV-${data.personalInfo.fullName.replace(/\s+/g, "-")}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 0;
      }
      @media print {
        html, body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
  });

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Toolbar onPrintPDF={() => handlePrint()} />
      <CVEditor />

      {/* Hidden printable version for PDF generation */}
      <div className="hidden">
        <PrintableCV ref={printRef} data={data} />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <LocaleProvider>
      <CVProvider>
        <TooltipProvider delayDuration={300}>
          <AppContent />
        </TooltipProvider>
      </CVProvider>
    </LocaleProvider>
  );
}
