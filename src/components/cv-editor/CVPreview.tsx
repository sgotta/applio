"use client";

import { useCV } from "@/lib/cv-context";
import { EditableText } from "./EditableText";
import { PersonalInfo } from "./PersonalInfo";
import { Experience } from "./Experience";
import { Education } from "./Education";
import { CustomSection } from "./CustomSection";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus } from "lucide-react";

function CVHeader() {
  const {
    data: { personalInfo },
    updatePersonalInfo,
  } = useCV();

  return (
    <div className="mb-4">
      <EditableText
        value={personalInfo.fullName}
        onChange={(v) => updatePersonalInfo("fullName", v)}
        as="heading"
        placeholder="Tu Nombre Completo"
      />
      <div className="mt-0.5">
        <EditableText
          value={personalInfo.title}
          onChange={(v) => updatePersonalInfo("title", v)}
          as="subheading"
          placeholder="Tu Título Profesional"
        />
      </div>
    </div>
  );
}

export function CVPreview() {
  const {
    data: { customSections },
    addCustomSection,
    updateCustomSection,
    removeCustomSection,
    addCustomSectionItem,
    updateCustomSectionItem,
    removeCustomSectionItem,
  } = useCV();

  const sectionTypes = [
    { type: "courses" as const, title: "CURSOS", placement: "right" as const },
    {
      type: "certifications" as const,
      title: "CERTIFICACIONES",
      placement: "right" as const,
    },
    {
      type: "awards" as const,
      title: "PREMIOS Y RECONOCIMIENTOS",
      placement: "right" as const,
    },
    {
      type: "publications" as const,
      title: "PUBLICACIONES",
      placement: "right" as const,
    },
    {
      type: "custom" as const,
      title: "Sección personalizada",
      placement: "right" as const,
    },
  ];

  const leftSections = customSections.filter((s) => s.placement === "left");
  const rightSections = customSections.filter((s) => s.placement === "right");

  return (
    <div className="mx-auto w-full max-w-[210mm] bg-white shadow-sm border border-gray-100 print:shadow-none print:border-none">
      {/* CV Content — A4-like aspect ratio */}
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] min-h-[297mm]">
        {/* ===== LEFT COLUMN ===== */}
        <div className="border-r border-gray-100 bg-gray-50/50 p-6 space-y-5">
          <PersonalInfo />

          {/* Custom sections for left column */}
          {leftSections.map((section) => (
            <CustomSection
              key={section.id}
              section={section}
              onUpdateSection={(updates) =>
                updateCustomSection(section.id, updates)
              }
              onRemoveSection={() => removeCustomSection(section.id)}
              onAddItem={() => addCustomSectionItem(section.id)}
              onUpdateItem={(itemId, updates) =>
                updateCustomSectionItem(section.id, itemId, updates)
              }
              onRemoveItem={(itemId) =>
                removeCustomSectionItem(section.id, itemId)
              }
            />
          ))}
        </div>

        {/* ===== RIGHT COLUMN ===== */}
        <div className="p-6 space-y-5">
          <CVHeader />
          <Experience />
          <Education />

          {/* Custom sections for right column */}
          {rightSections.map((section) => (
            <CustomSection
              key={section.id}
              section={section}
              onUpdateSection={(updates) =>
                updateCustomSection(section.id, updates)
              }
              onRemoveSection={() => removeCustomSection(section.id)}
              onAddItem={() => addCustomSectionItem(section.id)}
              onUpdateItem={(itemId, updates) =>
                updateCustomSectionItem(section.id, itemId, updates)
              }
              onRemoveItem={(itemId) =>
                removeCustomSectionItem(section.id, itemId)
              }
            />
          ))}

          {/* Add Section Button */}
          <div className="pt-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-gray-500 border-dashed"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Sección
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {sectionTypes.map((sectionType) => (
                  <DropdownMenuItem
                    key={sectionType.type}
                    onClick={() =>
                      addCustomSection(
                        sectionType.type,
                        sectionType.title,
                        sectionType.placement
                      )
                    }
                  >
                    {sectionType.title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
