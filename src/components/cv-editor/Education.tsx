"use client";

import React, { memo, useCallback } from "react";
import { useCV } from "@/lib/cv-context";
import { useTranslations } from "next-intl";
import { useColorScheme } from "@/lib/color-scheme-context";

import { EducationItem } from "@/lib/types";
import { EditableText } from "./EditableText";
import { EntryGrip } from "./EntryGrip";
import { SectionTitle } from "./SectionTitle";
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function EducationCard({
  edu,
  index,
  total,
  sortableId,
  onAddBelow,
}: {
  edu: EducationItem;
  index: number;
  total: number;
  sortableId: string;
  onAddBelow: () => void;
}) {
  const { updateEducation, removeEducation, moveEducation } = useCV();
  const t = useTranslations("education");
  const tc = useTranslations("common");
  const { colorScheme } = useColorScheme();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group/entry relative rounded-sm transition-colors duration-150 -mx-1.5 px-1.5 py-1.5 hover:bg-gray-50/50"
    >
      {/* Entry grip — left side */}
      <EntryGrip
        onMoveUp={index > 0 ? () => moveEducation(edu.id, "up") : undefined}
        onMoveDown={index < total - 1 ? () => moveEducation(edu.id, "down") : undefined}
        onDelete={() => removeEducation(edu.id)}
        onAddBelow={onAddBelow}
        sortableAttributes={attributes}
        sortableListeners={listeners}
        labels={{
          delete: tc("delete"),
          moveUp: tc("moveUp"),
          moveDown: tc("moveDown"),
          addBelow: t("addEducation"),
          dragHint: tc("gripDragHint"),
          longPressHint: tc("gripLongPressHint"),
        }}
      />

      {/* Card content */}
      <div>
      {/* Institution + dates */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
        <EditableText
          value={edu.institution}
          onChange={(v) => updateEducation(edu.id, { institution: v })}
          as="itemTitle"
          className="min-w-[60%]"
          placeholder={t("institutionPlaceholder")}
        />
        <div className="flex items-baseline gap-1 flex-shrink-0">
          <EditableText
            value={edu.startDate}
            onChange={(v) => updateEducation(edu.id, { startDate: v })}
            as="tiny"
            placeholder={t("startDatePlaceholder")}
          />
          <span className="text-[0.833em] text-gray-400">—</span>
          <EditableText
            value={edu.endDate}
            onChange={(v) => updateEducation(edu.id, { endDate: v })}
            as="tiny"
            placeholder={t("endDatePlaceholder")}
          />
        </div>
      </div>

      {/* Degree */}
      <EditableText
        value={edu.degree}
        onChange={(v) => updateEducation(edu.id, { degree: v })}
        as="small"
        className="mt-0.5 font-medium! text-gray-600!"
        placeholder={t("degreePlaceholder")}
      />

      {/* Description — block editor */}
      <div
        className="mt-1.5"
        style={{ "--bullet-color": colorScheme.bullet } as React.CSSProperties}
      >
        <EditableText
          value={edu.description || ""}
          onChange={(html) => updateEducation(edu.id, { description: html })}
          as="body"
          placeholder={t("descriptionPlaceholder")}
          blockEditing
        />
      </div>
      </div>{/* /flex-1 content wrapper */}
    </div>
  );
}

export const Education = memo(function Education() {
  const {
    data: { education },
    addEducation,
    reorderEducation,
  } = useCV();
  const t = useTranslations("education");
  const cardSensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleCardDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = education.findIndex(e => e.id === active.id);
      const newIndex = education.findIndex(e => e.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderEducation(oldIndex, newIndex);
      }
    }
  }, [education, reorderEducation]);

  return (
    <div>
      <SectionTitle>{t("title")}</SectionTitle>
      <DndContext
        id="edu-entries-dnd"
        sensors={cardSensors}
        collisionDetection={closestCenter}
        onDragEnd={handleCardDragEnd}
      >
        <SortableContext
          items={education.map(e => e.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2.5">
            {education.map((edu, i) => (
              <EducationCard
                key={edu.id}
                edu={edu}
                index={i}
                total={education.length}
                sortableId={edu.id}
                onAddBelow={() => addEducation(i)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
});
