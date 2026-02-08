"use client";

import { useRef } from "react";
import { useCV } from "@/lib/cv-context";
import { CVData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Download, FileUp, FileDown, FileText } from "lucide-react";

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

export function Toolbar({ onPrintPDF }: ToolbarProps) {
  const { data, importData } = useCV();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          alert(
            "El archivo no tiene el formato correcto. Asegurate de que sea un JSON exportado desde QuickCV."
          );
          return;
        }

        if (
          confirm(
            "¿Querés cargar este CV? Se van a sobrescribir los datos actuales."
          )
        ) {
          importData(parsed);
        }
      } catch {
        alert(
          "Error al leer el archivo. Asegurate de que sea un archivo JSON válido."
        );
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
            QuickCV
          </span>
          <span className="hidden text-xs text-gray-400 sm:inline">
            gratis, sin registro
          </span>
        </div>

        {/* Actions — uniform gap-2 */}
        <div className="flex items-center gap-2">
          {/* Import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileImport}
            className="hidden"
            aria-label="Importar archivo JSON"
          />
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-gray-900"
            onClick={() => fileInputRef.current?.click()}
            title="Cargar CV desde archivo JSON"
          >
            <FileUp className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Importar</span>
          </Button>

          {/* Export JSON */}
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-gray-900"
            onClick={exportToJSON}
            title="Exportar CV como archivo JSON"
          >
            <FileDown className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>

          {/* Export PDF */}
          <Button
            variant="default"
            size="sm"
            className="bg-gray-900 text-white hover:bg-gray-800"
            onClick={onPrintPDF}
            title="Generar PDF para imprimir o enviar"
          >
            <Download className="mr-1.5 h-4 w-4" />
            <span>PDF</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
