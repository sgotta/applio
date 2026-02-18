"use client";

import React, { memo, useCallback } from "react";
import { useCV } from "@/lib/cv-context";
import { useTranslations } from "next-intl";
import { useColorScheme } from "@/lib/color-scheme-context";

import { CourseItem } from "@/lib/types";
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

function CourseCard({
  course,
  index,
  total,
  sortableId,
  onAddBelow,
}: {
  course: CourseItem;
  index: number;
  total: number;
  sortableId: string;
  onAddBelow: () => void;
}) {
  const { updateCourse, removeCourse, moveCourse } = useCV();
  const t = useTranslations("courses");
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
      <EntryGrip
        onMoveUp={index > 0 ? () => moveCourse(course.id, "up") : undefined}
        onMoveDown={index < total - 1 ? () => moveCourse(course.id, "down") : undefined}
        onDelete={() => removeCourse(course.id)}
        onAddBelow={onAddBelow}
        sortableAttributes={attributes}
        sortableListeners={listeners}
        labels={{
          delete: tc("delete"),
          moveUp: tc("moveUp"),
          moveDown: tc("moveDown"),
          addBelow: t("addCourse"),
          dragHint: tc("gripDragHint"),
          longPressHint: tc("gripLongPressHint"),
        }}
      />

      <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
        <EditableText
          value={course.name}
          onChange={(v) => updateCourse(course.id, { name: v })}
          as="itemTitle"
          className="min-w-[60%]"
          placeholder={t("namePlaceholder")}
        />
        <EditableText
          value={course.date}
          onChange={(v) => updateCourse(course.id, { date: v })}
          as="tiny"
          className="flex-shrink-0"
          placeholder={t("datePlaceholder")}
        />
      </div>

      <EditableText
        value={course.institution}
        onChange={(v) => updateCourse(course.id, { institution: v })}
        as="small"
        className="mt-0.5 font-medium! text-gray-600!"
        placeholder={t("institutionPlaceholder")}
      />

      {/* Description — block editor */}
      <div
        className="mt-1.5"
        style={{ "--bullet-color": colorScheme.bullet } as React.CSSProperties}
      >
        <EditableText
          value={course.description || ""}
          onChange={(html) => updateCourse(course.id, { description: html })}
          as="body"
          placeholder={t("descriptionPlaceholder")}
          blockEditing
        />
      </div>
      </div>
    </div>
  );
}

export const Courses = memo(function Courses() {
  const {
    data: { courses },
    addCourse,
    reorderCourse,
  } = useCV();
  const t = useTranslations("courses");
  const cardSensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleCardDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = courses.findIndex(c => c.id === active.id);
      const newIndex = courses.findIndex(c => c.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderCourse(oldIndex, newIndex);
      }
    }
  }, [courses, reorderCourse]);

  return (
    <div>
      <SectionTitle>{t("title")}</SectionTitle>
      <DndContext
        id="course-entries-dnd"
        sensors={cardSensors}
        collisionDetection={closestCenter}
        onDragEnd={handleCardDragEnd}
      >
        <SortableContext
          items={courses.map(c => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2.5">
            {courses.map((course, i) => (
              <CourseCard
                key={course.id}
                course={course}
                index={i}
                total={courses.length}
                sortableId={course.id}
                onAddBelow={() => addCourse(i)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
});
