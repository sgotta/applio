"use client";

import React, { memo } from "react";
import { useCV } from "@/lib/cv-context";
import { EducationItem } from "@/lib/types";
import { EditableText } from "./EditableText";
import { SectionTitle } from "./SectionTitle";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";

function EducationCard({
  edu,
  isFirst,
  isLast,
}: {
  edu: EducationItem;
  isFirst: boolean;
  isLast: boolean;
}) {
  const { updateEducation, removeEducation, moveEducation } = useCV();

  return (
    <div className="group/edu relative rounded-sm transition-colors duration-150 -mx-1.5 px-1.5 py-1 hover:bg-gray-50/50">
      {/* Action buttons */}
      <div className="absolute -right-1 top-1 flex items-center gap-0.5 opacity-0 group-hover/edu:opacity-100 transition-opacity duration-150">
        {!isFirst && (
          <button
            onClick={() => moveEducation(edu.id, "up")}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
            aria-label="Mover arriba"
          >
            <ChevronUp className="h-3 w-3 text-gray-400" />
          </button>
        )}
        {!isLast && (
          <button
            onClick={() => moveEducation(edu.id, "down")}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
            aria-label="Mover abajo"
          >
            <ChevronDown className="h-3 w-3 text-gray-400" />
          </button>
        )}
        <button
          onClick={() => removeEducation(edu.id)}
          className="p-1 rounded hover:bg-red-50 transition-colors"
          aria-label="Eliminar educación"
        >
          <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-500" />
        </button>
      </div>

      {/* Institution + dates */}
      <div className="flex items-baseline justify-between gap-2 pr-16">
        <EditableText
          value={edu.institution}
          onChange={(v) => updateEducation(edu.id, { institution: v })}
          as="small"
          className="!text-[13px] !font-semibold !text-gray-900"
          placeholder="Institución"
        />
        <div className="flex items-baseline gap-1 flex-shrink-0">
          <EditableText
            value={edu.startDate}
            onChange={(v) => updateEducation(edu.id, { startDate: v })}
            as="tiny"
            placeholder="inicio"
          />
          <span className="text-[10px] text-gray-400">—</span>
          <EditableText
            value={edu.endDate}
            onChange={(v) => updateEducation(edu.id, { endDate: v })}
            as="tiny"
            placeholder="fin"
          />
        </div>
      </div>

      {/* Degree */}
      <EditableText
        value={edu.degree}
        onChange={(v) => updateEducation(edu.id, { degree: v })}
        as="small"
        className="!font-medium !text-gray-500"
        placeholder="Título obtenido"
      />

      {/* Description (optional) */}
      <div className="mt-1">
        <EditableText
          value={edu.description || ""}
          onChange={(v) => updateEducation(edu.id, { description: v })}
          as="body"
          placeholder="Descripción opcional..."
        />
      </div>
    </div>
  );
}

export const Education = memo(function Education() {
  const {
    data: { education },
    addEducation,
  } = useCV();

  return (
    <div>
      <SectionTitle>Educación</SectionTitle>
      <div className="space-y-3">
        {education.map((edu, i) => (
          <EducationCard
            key={edu.id}
            edu={edu}
            isFirst={i === 0}
            isLast={i === education.length - 1}
          />
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={addEducation}
        className="mt-2 h-7 px-2 text-[11px] text-gray-400 hover:text-gray-600"
      >
        <Plus className="mr-1 h-3 w-3" />
        Agregar educación
      </Button>
    </div>
  );
});
