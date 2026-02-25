"use client";

import React, { memo, useCallback } from "react";
import { useCV } from "@/lib/cv-context";
import { useTranslations } from "next-intl";
import { useColorScheme } from "@/lib/color-scheme-context";
import type { ExperienceItem } from "@/lib/types";
import { EditableText } from "./EditableText";
import { EntryGrip } from "./EntryGrip";
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
import { SectionTitle } from "./SectionTitle";

function ExperienceCard({
  exp,
  index,
  total,
  sortableId,
  onAddBelow,
}: {
  exp: ExperienceItem;
  index: number;
  total: number;
  sortableId: string;
  onAddBelow: () => void;
}) {
  const { updateExperience, removeExperience, moveExperience } = useCV();
  const t = useTranslations("experience");
  const tc = useTranslations("common");
  const { colorScheme } = useColorScheme();

  const {
    attributes: cardAttributes,
    listeners: cardListeners,
    setNodeRef: setCardNodeRef,
    transform: cardTransform,
    transition: cardTransition,
    isDragging: isCardDragging,
  } = useSortable({ id: sortableId });

  const cardStyle: React.CSSProperties = {
    transform: CSS.Translate.toString(cardTransform),
    transition: cardTransition,
    zIndex: isCardDragging ? 50 : undefined,
    ...(isCardDragging && {
      boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.06)",
    }),
  };

  return (
    <div
      ref={setCardNodeRef}
      style={cardStyle}
      className={`group/entry relative transition-[box-shadow,border-radius,background-color] duration-200 px-2.5 py-2 ${isCardDragging ? "rounded-lg bg-white" : "rounded-md shadow-[inset_0_0_0_1px_rgba(0,0,0,0.07)] hover:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.13),0_2px_8px_rgba(0,0,0,0.06)]"}`}
    >
      {/* Entry grip — left side */}
      <EntryGrip
        onMoveUp={index > 0 ? () => moveExperience(exp.id, "up") : undefined}
        onMoveDown={index < total - 1 ? () => moveExperience(exp.id, "down") : undefined}
        onDelete={() => removeExperience(exp.id)}
        onAddBelow={onAddBelow}
        sortableAttributes={cardAttributes}
        sortableListeners={cardListeners}
        labels={{
          delete: tc("delete"),
          moveUp: tc("moveUp"),
          moveDown: tc("moveDown"),
          addBelow: t("addExperience"),
          dragHint: tc("gripDragHint"),
          longPressHint: tc("gripLongPressHint"),
        }}
      />

      {/* Card content */}
      <div>
      {/* Company + dates */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
        <EditableText
          value={exp.company}
          onChange={(v) => updateExperience(exp.id, { company: v })}
          as="itemTitle"
          className="min-w-[60%]"
          placeholder={t("companyPlaceholder")}
        />
        <div className="flex items-baseline gap-1 shrink-0">
          <EditableText
            value={exp.startDate}
            onChange={(v) => updateExperience(exp.id, { startDate: v })}
            as="tiny"
            placeholder={t("startDatePlaceholder")}
          />
          <span className="text-[0.833em] text-gray-400">—</span>
          <EditableText
            value={exp.endDate}
            onChange={(v) => updateExperience(exp.id, { endDate: v })}
            as="tiny"
            placeholder={t("endDatePlaceholder")}
          />
        </div>
      </div>

      {/* Position */}
      <EditableText
        value={exp.position}
        onChange={(v) => updateExperience(exp.id, { position: v })}
        as="small"
        className="mt-1 font-medium! text-gray-600!"
        placeholder={t("positionPlaceholder")}
      />

      {/* Description — single Tiptap block editor */}
      <div
        className="mt-1.5"
        style={{ "--bullet-color": colorScheme.bullet } as React.CSSProperties}
      >
        <EditableText
          value={exp.description}
          onChange={(html) => updateExperience(exp.id, { description: html })}
          as="body"
          placeholder={t("bulletPlaceholder")}
          blockEditing
        />
      </div>

      </div>{/* /content wrapper */}
    </div>
  );
}

export const Experience = memo(function Experience() {
  const {
    data: { experiences },
    addExperience,
    reorderExperience,
  } = useCV();
  const t = useTranslations("experience");
  // Card-level DnD sensors
  const cardSensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleCardDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = experiences.findIndex(e => e.id === active.id);
      const newIndex = experiences.findIndex(e => e.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderExperience(oldIndex, newIndex);
      }
    }
  }, [experiences, reorderExperience]);

  return (
    <div>
      <SectionTitle>{t("title")}</SectionTitle>
      <DndContext
        id="exp-entries-dnd"
        sensors={cardSensors}
        collisionDetection={closestCenter}
        onDragEnd={handleCardDragEnd}
      >
        <SortableContext
          items={experiences.map(e => e.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2.5">
            {experiences.map((exp, i) => (
              <ExperienceCard
                key={exp.id}
                exp={exp}
                index={i}
                total={experiences.length}
                sortableId={exp.id}
                onAddBelow={() => addExperience(i)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
});
