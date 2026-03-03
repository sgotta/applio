"use client";

import React, { memo, useCallback } from "react";
import { useCV } from "@/lib/cv-context";
import { useTranslations } from "next-intl";
import { useColorScheme } from "@/lib/color-scheme-context";
import { Plus } from "lucide-react";

import type { LanguageItem } from "@/lib/types";
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

function LanguageCard({
  language,
  index,
  total,
  sortableId,
  onAddBelow,
  sidebar,
  noPhoto,
}: {
  language: LanguageItem;
  index: number;
  total: number;
  sortableId: string;
  onAddBelow: () => void;
  sidebar?: boolean;
  noPhoto?: boolean;
}) {
  const { updateLanguage, removeLanguage, moveLanguage } = useCV();
  const t = useTranslations("cvLanguages");
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
    opacity: isDragging ? 0.5 : undefined,
  };

  const gripLabels = {
    delete: tc("delete"),
    moveUp: tc("moveUp"),
    moveDown: tc("moveDown"),
    addBelow: t("addLanguage"),
    dragHint: tc("gripDragHint"),
    longPressHint: tc("gripLongPressHint"),
  };

  /* ---- Sidebar variant: flat, sidebar color tokens ---- */
  if (sidebar) {
    return (
      <div ref={setNodeRef} style={style} className="group/entry relative">
        <EntryGrip
          sidebar
          onMoveUp={index > 0 ? () => moveLanguage(language.id, "up") : undefined}
          onMoveDown={
            index < total - 1 ? () => moveLanguage(language.id, "down") : undefined
          }
          onDelete={() => removeLanguage(language.id)}
          onAddBelow={onAddBelow}
          sortableAttributes={attributes}
          sortableListeners={listeners}
          labels={gripLabels}
        />
        <div className="flex items-baseline gap-x-2">
          <EditableText
            value={language.language}
            onChange={(v) => updateLanguage(language.id, { language: v })}
            as="small"
            placeholder={t("languagePlaceholder")}
            displayStyle={{ color: colorScheme.sidebarText }}
          />
          <EditableText
            value={language.level}
            onChange={(v) => updateLanguage(language.id, { level: v })}
            as="small"
            placeholder={t("levelPlaceholder")}
            displayStyle={{ color: colorScheme.sidebarMuted }}
          />
        </div>
      </div>
    );
  }

  /* ---- NoPhoto variant: flat inline row, grip close to text ---- */
  if (noPhoto) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="group/entry relative flex items-baseline gap-3"
      >
        <EntryGrip
          onMoveUp={index > 0 ? () => moveLanguage(language.id, "up") : undefined}
          onMoveDown={
            index < total - 1 ? () => moveLanguage(language.id, "down") : undefined
          }
          onDelete={() => removeLanguage(language.id)}
          onAddBelow={onAddBelow}
          sortableAttributes={attributes}
          sortableListeners={listeners}
          labels={gripLabels}
        />
        <EditableText
          value={language.language}
          onChange={(v) => updateLanguage(language.id, { language: v })}
          as="small"
          className="font-semibold!"
          placeholder={t("languagePlaceholder")}
          displayStyle={{ color: colorScheme.heading }}
        />
        <span
          className="inline-flex items-center rounded px-2 py-0.5 shrink-0"
          style={{ backgroundColor: `${colorScheme.heading}12`, color: colorScheme.heading, fontSize: "11px" }}
        >
          <EditableText
            value={language.level}
            onChange={(v) => updateLanguage(language.id, { level: v })}
            as="tiny"
            placeholder={t("levelPlaceholder")}
            displayStyle={{ color: colorScheme.heading }}
          />
        </span>
      </div>
    );
  }

  /* ---- Default (fallback) ---- */
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group/entry relative flex items-baseline gap-x-3"
    >
      <EntryGrip
        onMoveUp={index > 0 ? () => moveLanguage(language.id, "up") : undefined}
        onMoveDown={
          index < total - 1 ? () => moveLanguage(language.id, "down") : undefined
        }
        onDelete={() => removeLanguage(language.id)}
        onAddBelow={onAddBelow}
        sortableAttributes={attributes}
        sortableListeners={listeners}
        labels={gripLabels}
      />
      <EditableText
        value={language.language}
        onChange={(v) => updateLanguage(language.id, { language: v })}
        as="small"
        className="font-medium!"
        placeholder={t("languagePlaceholder")}
      />
      <EditableText
        value={language.level}
        onChange={(v) => updateLanguage(language.id, { level: v })}
        as="small"
        className="text-gray-500!"
        placeholder={t("levelPlaceholder")}
      />
    </div>
  );
}

export const Languages = memo(function Languages({
  sidebar,
  noPhoto,
}: {
  sidebar?: boolean;
  noPhoto?: boolean;
}) {
  const {
    data: { languages },
    addLanguage,
    reorderLanguage,
  } = useCV();
  const t = useTranslations("cvLanguages");
  const { colorScheme } = useColorScheme();
  const cardSensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleCardDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = languages.findIndex((l) => l.id === active.id);
        const newIndex = languages.findIndex((l) => l.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
          reorderLanguage(oldIndex, newIndex);
        }
      }
    },
    [languages, reorderLanguage],
  );

  return (
    <div className="group/lang-section">
      {/* Title is suppressed in noPhoto — CVPreview provides it via sectionTitle() */}
      {!noPhoto && <SectionTitle sidebar={sidebar}>{t("title")}</SectionTitle>}
      <DndContext
        id="language-entries-dnd"
        sensors={cardSensors}
        collisionDetection={closestCenter}
        onDragEnd={handleCardDragEnd}
      >
        <SortableContext
          items={languages.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className={noPhoto ? "space-y-2" : sidebar ? "space-y-2" : "space-y-1.5"}>
            {languages.map((lang, i) => (
              <LanguageCard
                key={lang.id}
                language={lang}
                index={i}
                total={languages.length}
                sortableId={lang.id}
                onAddBelow={() => addLanguage(i)}
                sidebar={sidebar}
                noPhoto={noPhoto}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {sidebar && (
        <button
          onClick={() => addLanguage(languages.length - 1)}
          className="mt-1.5 flex items-center gap-1 opacity-40 group-hover/lang-section:opacity-100 transition-opacity duration-150"
          style={{ color: colorScheme.sidebarMuted, fontSize: "0.85em" }}
        >
          <Plus className="h-[0.75em] w-[0.75em]" strokeWidth={2} />
          {t("addLanguage")}
        </button>
      )}
    </div>
  );
});
