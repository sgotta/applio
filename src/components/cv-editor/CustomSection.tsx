"use client";

import { memo } from "react";
import { CustomSection as CustomSectionType } from "@/lib/types";
import { EditableText } from "./EditableText";
import { SectionTitle } from "./SectionTitle";
import { Button } from "@/components/ui/button";
import { Trash2, X } from "lucide-react";

interface CustomSectionProps {
  section: CustomSectionType;
  onUpdateSection: (updates: Partial<CustomSectionType>) => void;
  onRemoveSection: () => void;
  onAddItem: () => void;
  onUpdateItem: (itemId: string, updates: any) => void;
  onRemoveItem: (itemId: string) => void;
}

export const CustomSection = memo(function CustomSection({
  section,
  onUpdateSection,
  onRemoveSection,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
}: CustomSectionProps) {
  return (
    <div className="space-y-4">
      {/* Header de la sección con título editable y botón eliminar */}
      <div className="flex items-center justify-between group/section">
        <EditableText
          value={section.title}
          onChange={(title) => onUpdateSection({ title })}
          as="subheading"
          className="uppercase tracking-wide font-semibold"
        />
        <button
          onClick={onRemoveSection}
          className="opacity-0 group-hover/section:opacity-100 p-1 rounded hover:bg-gray-200 transition-all duration-150"
          aria-label={`Eliminar sección ${section.title}`}
        >
          <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
        </button>
      </div>

      <SectionTitle>{section.title}</SectionTitle>

      {/* Items de la sección */}
      <div className="space-y-3">
        {section.items.map((item) => (
          <div
            key={item.id}
            className="space-y-1 group/item hover:bg-gray-50 -mx-2 px-2 py-1 rounded transition-colors duration-150"
          >
            <div className="flex items-start justify-between gap-2">
              <EditableText
                value={item.title}
                onChange={(title) => onUpdateItem(item.id, { title })}
                as="body"
                className="font-semibold flex-1"
                placeholder="Título"
              />
              <button
                onClick={() => onRemoveItem(item.id)}
                className="opacity-0 group-hover/item:opacity-100 p-0.5 rounded hover:bg-gray-200 transition-all duration-150"
                aria-label={`Eliminar ${item.title}`}
              >
                <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
              </button>
            </div>

            {/* Subtitle opcional */}
            <EditableText
              value={item.subtitle || ""}
              onChange={(subtitle) => onUpdateItem(item.id, { subtitle })}
              as="small"
              placeholder="Subtítulo (ej: institución, fecha)"
              className="text-gray-500"
            />

            {/* Description opcional */}
            <EditableText
              value={item.description || ""}
              onChange={(description) => onUpdateItem(item.id, { description })}
              as="small"
              multiline
              placeholder="Descripción (opcional)"
              className="text-gray-600"
            />
          </div>
        ))}
      </div>

      {/* Botón para agregar item */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onAddItem}
        className="h-7 px-2 text-xs text-gray-400 hover:text-gray-600"
      >
        + Agregar item
      </Button>
    </div>
  );
});
