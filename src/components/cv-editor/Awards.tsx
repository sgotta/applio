"use client";

import React, { memo, useCallback } from "react";
import { useCV } from "@/lib/cv-context";
import { useTranslations } from "next-intl";
import { useColorScheme } from "@/lib/color-scheme-context";

import { AwardItem } from "@/lib/types";
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

function AwardCard({
  award,
  index,
  total,
  sortableId,
  onAddBelow,
}: {
  award: AwardItem;
  index: number;
  total: number;
  sortableId: string;
  onAddBelow: () => void;
}) {
  const { updateAward, removeAward, moveAward } = useCV();
  const t = useTranslations("awards");
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
    zIndex: isDragging ? 50 : undefined,
    ...(isDragging && {
      boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.06)",
    }),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group/entry relative transition-[box-shadow,border-radius,background-color] duration-200 px-2.5 py-2 ${isDragging ? "rounded-lg bg-white" : "rounded-md shadow-[inset_0_0_0_1px_rgba(0,0,0,0.07)] hover:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.13),0_2px_8px_rgba(0,0,0,0.06)]"}`}
    >
      <EntryGrip
        onMoveUp={index > 0 ? () => moveAward(award.id, "up") : undefined}
        onMoveDown={index < total - 1 ? () => moveAward(award.id, "down") : undefined}
        onDelete={() => removeAward(award.id)}
        onAddBelow={onAddBelow}
        sortableAttributes={attributes}
        sortableListeners={listeners}
        labels={{
          delete: tc("delete"),
          moveUp: tc("moveUp"),
          moveDown: tc("moveDown"),
          addBelow: t("addAward"),
          dragHint: tc("gripDragHint"),
          longPressHint: tc("gripLongPressHint"),
        }}
      />

      <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
        <EditableText
          value={award.name}
          onChange={(v) => updateAward(award.id, { name: v })}
          as="itemTitle"
          className="min-w-[60%]"
          placeholder={t("namePlaceholder")}
        />
        <EditableText
          value={award.date}
          onChange={(v) => updateAward(award.id, { date: v })}
          as="tiny"
          className="flex-shrink-0"
          placeholder={t("datePlaceholder")}
        />
      </div>

      <EditableText
        value={award.issuer}
        onChange={(v) => updateAward(award.id, { issuer: v })}
        as="small"
        className="mt-0.5 font-medium! text-gray-600!"
        placeholder={t("issuerPlaceholder")}
      />

      {/* Description — block editor */}
      <div
        className="mt-1.5"
        style={{ "--bullet-color": colorScheme.bullet } as React.CSSProperties}
      >
        <EditableText
          value={award.description || ""}
          onChange={(html) => updateAward(award.id, { description: html })}
          as="body"
          placeholder={t("descriptionPlaceholder")}
          blockEditing
        />
      </div>
      </div>
    </div>
  );
}

export const Awards = memo(function Awards() {
  const {
    data: { awards },
    addAward,
    reorderAward,
  } = useCV();
  const t = useTranslations("awards");
  const cardSensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleCardDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = awards.findIndex(a => a.id === active.id);
      const newIndex = awards.findIndex(a => a.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderAward(oldIndex, newIndex);
      }
    }
  }, [awards, reorderAward]);

  return (
    <div>
      <SectionTitle>{t("title")}</SectionTitle>
      <DndContext
        id="award-entries-dnd"
        sensors={cardSensors}
        collisionDetection={closestCenter}
        onDragEnd={handleCardDragEnd}
      >
        <SortableContext
          items={awards.map(a => a.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2.5">
            {awards.map((award, i) => (
              <AwardCard
                key={award.id}
                award={award}
                index={i}
                total={awards.length}
                sortableId={award.id}
                onAddBelow={() => addAward(i)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
});
