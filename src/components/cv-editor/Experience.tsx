"use client";

import React, { memo } from "react";
import { useCV } from "@/lib/cv-context";
import { ExperienceItem } from "@/lib/types";
import { EditableText } from "./EditableText";
import { SectionTitle } from "./SectionTitle";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ChevronUp, ChevronDown, X } from "lucide-react";

function EditableBullet({
  value,
  onChange,
  onRemove,
}: {
  value: string;
  onChange: (v: string) => void;
  onRemove: () => void;
}) {
  return (
    <li className="flex items-start gap-1 group/bullet pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-gray-400 before:text-[11px]">
      <EditableText
        value={value}
        onChange={onChange}
        as="body"
        className="flex-1"
        placeholder="Describe un logro o responsabilidad..."
      />
      <button
        onClick={onRemove}
        className="opacity-0 group-hover/bullet:opacity-100 mt-0.5 p-0.5 rounded hover:bg-gray-100 transition-opacity duration-150 flex-shrink-0"
        aria-label="Eliminar bullet"
      >
        <X className="h-3 w-3 text-gray-400" />
      </button>
    </li>
  );
}

function ExperienceCard({
  exp,
  isFirst,
  isLast,
}: {
  exp: ExperienceItem;
  isFirst: boolean;
  isLast: boolean;
}) {
  const { updateExperience, removeExperience, moveExperience } = useCV();

  const updateBullet = (index: number, value: string) => {
    const newDesc = [...exp.description];
    newDesc[index] = value;
    updateExperience(exp.id, { description: newDesc });
  };

  const removeBullet = (index: number) => {
    const newDesc = exp.description.filter((_, i) => i !== index);
    updateExperience(exp.id, { description: newDesc });
  };

  const addBullet = () => {
    updateExperience(exp.id, {
      description: [...exp.description, "Nuevo logro o responsabilidad."],
    });
  };

  return (
    <div className="group/exp relative rounded-sm transition-colors duration-150 -mx-1.5 px-1.5 py-1 hover:bg-gray-50/50">
      {/* Action buttons — visible on hover */}
      <div className="absolute -right-1 top-1 flex items-center gap-0.5 opacity-0 group-hover/exp:opacity-100 transition-opacity duration-150">
        {!isFirst && (
          <button
            onClick={() => moveExperience(exp.id, "up")}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
            aria-label="Mover arriba"
          >
            <ChevronUp className="h-3 w-3 text-gray-400" />
          </button>
        )}
        {!isLast && (
          <button
            onClick={() => moveExperience(exp.id, "down")}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
            aria-label="Mover abajo"
          >
            <ChevronDown className="h-3 w-3 text-gray-400" />
          </button>
        )}
        <button
          onClick={() => removeExperience(exp.id)}
          className="p-1 rounded hover:bg-red-50 transition-colors"
          aria-label="Eliminar experiencia"
        >
          <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-500" />
        </button>
      </div>

      {/* Company + dates */}
      <div className="flex items-baseline justify-between gap-2 pr-16">
        <EditableText
          value={exp.company}
          onChange={(v) => updateExperience(exp.id, { company: v })}
          as="small"
          className="!text-[13px] !font-semibold !text-gray-900"
          placeholder="Nombre de la empresa"
        />
        <div className="flex items-baseline gap-1 flex-shrink-0">
          <EditableText
            value={exp.startDate}
            onChange={(v) => updateExperience(exp.id, { startDate: v })}
            as="tiny"
            placeholder="inicio"
          />
          <span className="text-[10px] text-gray-400">—</span>
          <EditableText
            value={exp.endDate}
            onChange={(v) => updateExperience(exp.id, { endDate: v })}
            as="tiny"
            placeholder="fin"
          />
        </div>
      </div>

      {/* Position */}
      <EditableText
        value={exp.position}
        onChange={(v) => updateExperience(exp.id, { position: v })}
        as="subheading"
        className="!text-[11px]"
        placeholder="Título del puesto"
      />

      {/* Bullet points */}
      <ul className="mt-1.5 space-y-1">
        {exp.description.map((bullet, i) => (
          <EditableBullet
            key={i}
            value={bullet}
            onChange={(v) => updateBullet(i, v)}
            onRemove={() => removeBullet(i)}
          />
        ))}
      </ul>

      {/* Add bullet */}
      <button
        onClick={addBullet}
        className="mt-1 flex items-center gap-1 text-[10px] text-gray-300 hover:text-gray-500 transition-colors duration-150 pl-3"
      >
        <Plus className="h-2.5 w-2.5" />
        Agregar logro
      </button>
    </div>
  );
}

export const Experience = memo(function Experience() {
  const {
    data: { experience },
    addExperience,
  } = useCV();

  return (
    <div>
      <SectionTitle>Experiencia</SectionTitle>
      <div className="space-y-3">
        {experience.map((exp, i) => (
          <ExperienceCard
            key={exp.id}
            exp={exp}
            isFirst={i === 0}
            isLast={i === experience.length - 1}
          />
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={addExperience}
        className="mt-2 h-7 px-2 text-[11px] text-gray-400 hover:text-gray-600"
      >
        <Plus className="mr-1 h-3 w-3" />
        Agregar experiencia
      </Button>
    </div>
  );
});
