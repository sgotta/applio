"use client";

import React, { memo, useState, useCallback } from "react";
import { useCV } from "@/lib/cv-context";
import { useTranslations } from "next-intl";
import { useColorScheme } from "@/lib/color-scheme-context";
import { useIsViewMode } from "@/hooks/useIsViewMode";
import { ExperienceItem, BulletItem } from "@/lib/types";
import { EditableText } from "./EditableText";
import { SectionTitle } from "./SectionTitle";
import { renderFormattedText } from "@/lib/format-text";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Plus, Trash2, ChevronUp, ChevronDown, X, Heading, Heading2, List, ListOrdered, GripVertical, Move, MousePointerClick } from "lucide-react";
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
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const BULLET_TYPE_CONFIG: Record<BulletItem["type"], { icon: typeof List; as: "itemTitle" | "body" | "small"; className?: string }> = {
  title:    { icon: Heading,     as: "itemTitle" },
  subtitle: { icon: Heading2,    as: "body",  className: "font-semibold! text-gray-800!" },
  bullet:   { icon: List,        as: "body" },
  numbered: { icon: ListOrdered, as: "body" },
};

function EditableBullet({
  bullet,
  bulletNumber,
  sortableId,
  onChange,
  onRemove,
  onSetType,
  bulletPlaceholder,
  deleteAriaLabel,
  bulletColor,
  gripDragHint,
  gripClickHint,
  gripLongPressHint,
  hasSeenHint,
  onHintSeen,
  typeLabels,
}: {
  bullet: BulletItem;
  bulletNumber: number;
  sortableId: string;
  onChange: (v: string) => void;
  onRemove: () => void;
  onSetType: (type: BulletItem["type"]) => void;
  bulletPlaceholder: string;
  deleteAriaLabel: string;
  bulletColor: string;
  gripDragHint: string;
  gripClickHint: string;
  gripLongPressHint: string;
  hasSeenHint: boolean;
  onHintSeen: () => void;
  typeLabels: Record<BulletItem["type"], string>;
}) {
  const isBullet = bullet.type === "bullet";
  const isNumbered = bullet.type === "numbered";
  const config = BULLET_TYPE_CONFIG[bullet.type];
  const [menuOpen, setMenuOpen] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const viewMode = useIsViewMode();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId, disabled: viewMode });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-1 group/bullet ${bullet.type === "title" ? "mt-2 first:mt-0" : ""}`}
    >
      {/* Grip handle — drag to reorder, click to open type menu */}
      {!viewMode && (
        <TooltipProvider>
          <Tooltip open={tooltipOpen && !menuOpen}>
            <Popover
              open={menuOpen}
              onOpenChange={(open) => {
                setMenuOpen(open);
                if (!open && !hasSeenHint) onHintSeen();
              }}
            >
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button
                    className="mt-0.5 p-0.5 rounded transition-colors hover:bg-gray-100 shrink-0 touch-manipulation cursor-grab active:cursor-grabbing"
                    onPointerEnter={(e) => {
                      if (e.pointerType === "mouse") {
                        setTooltipOpen(true);
                        onHintSeen();
                      }
                    }}
                    onPointerLeave={(e) => {
                      if (e.pointerType === "mouse") setTooltipOpen(false);
                    }}
                    {...attributes}
                    {...listeners}
                  >
                    <GripVertical className="h-3 w-3 text-gray-300" />
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              <PopoverContent
                className={hasSeenHint ? "w-44 p-1" : "w-auto bg-foreground text-background border-foreground p-2"}
                align="start"
                side="left"
              >
                {hasSeenHint ? (
                  <>
                    {(Object.keys(BULLET_TYPE_CONFIG) as BulletItem["type"][]).map((type) => {
                      const Icon = BULLET_TYPE_CONFIG[type].icon;
                      const isActive = bullet.type === type;
                      return (
                        <button
                          key={type}
                          onClick={() => { onSetType(type); setMenuOpen(false); }}
                          className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs transition-colors ${
                            isActive ? "bg-gray-100 dark:bg-accent font-medium text-gray-900 dark:text-gray-100" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-accent/50"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {typeLabels[type]}
                        </button>
                      );
                    })}
                    <div className="mt-1 border-t border-gray-100 dark:border-gray-700 pt-1.5 px-2 pb-1">
                      <p className="hidden can-hover:flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
                        <Move className="h-3 w-3 shrink-0" />
                        {gripDragHint}
                      </p>
                      <p className="flex can-hover:hidden items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
                        <Move className="h-3 w-3 shrink-0" />
                        {gripLongPressHint}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-1 text-xs">
                    <span className="hidden can-hover:flex items-center gap-1.5">
                      <Move className="h-3 w-3 shrink-0" />
                      {gripDragHint}
                    </span>
                    <span className="flex can-hover:hidden items-center gap-1.5">
                      <Move className="h-3 w-3 shrink-0" />
                      {gripLongPressHint}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MousePointerClick className="h-3 w-3 shrink-0" />
                      {gripClickHint}
                    </span>
                  </div>
                )}
              </PopoverContent>
            </Popover>
            <TooltipContent side="left" className="p-2">
              <div className="flex flex-col gap-1 text-xs">
                <span className="flex items-center gap-1.5">
                  <Move className="h-3 w-3 shrink-0" />
                  {gripDragHint}
                </span>
                <span className="flex items-center gap-1.5">
                  <MousePointerClick className="h-3 w-3 shrink-0" />
                  {gripClickHint}
                </span>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {/* Bullet marker (dot or number) */}
      {isBullet && (
        <span className="text-[0.917em] select-none mt-0.5 shrink-0" style={{ color: bulletColor }}>&bull;</span>
      )}
      {isNumbered && (
        <span className="text-[0.917em] select-none mt-0.5 shrink-0 tabular-nums" style={{ color: bulletColor }}>{bulletNumber}.</span>
      )}
      <EditableText
        value={bullet.text}
        onChange={onChange}
        as={config.as}
        className={`flex-1 ${config.className || ""}`}
        placeholder={bulletPlaceholder}
        formatDisplay={renderFormattedText}
      />
      {!viewMode && (
        <button
          onClick={onRemove}
          className="mt-0.5 p-0.5 rounded hover:bg-gray-100 can-hover:opacity-0 can-hover:group-hover/bullet:opacity-100 transition-opacity duration-150 shrink-0"
          aria-label={deleteAriaLabel}
        >
          <X className="h-3 w-3 text-gray-400" />
        </button>
      )}
    </li>
  );
}

function ExperienceCard({
  exp,
  isFirst,
  isLast,
  onRequestDelete,
  hintSeen,
  onHintSeen,
}: {
  exp: ExperienceItem;
  isFirst: boolean;
  isLast: boolean;
  onRequestDelete: (message: string, onConfirm: () => void) => void;
  hintSeen: boolean;
  onHintSeen: () => void;
}) {
  const { updateExperience, removeExperience, moveExperience } = useCV();
  const t = useTranslations("experience");
  const { colorScheme } = useColorScheme();
  const viewMode = useIsViewMode();

  const updateBullet = (index: number, value: string) => {
    const newDesc = [...exp.description];
    newDesc[index] = { ...newDesc[index], text: value };
    updateExperience(exp.id, { description: newDesc });
  };

  const removeBullet = (index: number) => {
    const newDesc = exp.description.filter((_, i) => i !== index);
    updateExperience(exp.id, { description: newDesc });
  };

  const setBulletType = (index: number, type: BulletItem["type"]) => {
    const newDesc = [...exp.description];
    newDesc[index] = { ...newDesc[index], type };
    updateExperience(exp.id, { description: newDesc });
  };

  // Precompute running counter for numbered bullets (1, 2, 3…)
  const numberedCounters = (() => {
    let counter = 0;
    return exp.description.map(b => b.type === "numbered" ? ++counter : 0);
  })();

  // Drag-and-drop sensors: click = edit/menu, drag 8px+ = reorder, long-press on mobile
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleBulletDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = Number(active.id);
      const newIndex = Number(over.id);
      updateExperience(exp.id, {
        description: arrayMove(exp.description, oldIndex, newIndex),
      });
    }
  }, [exp.id, exp.description, updateExperience]);

  const addBullet = () => {
    updateExperience(exp.id, {
      description: [...exp.description, { text: t("newBulletDefault"), type: "bullet" as const }],
    });
  };

  const handleDelete = () => {
    const label = exp.company.trim() || exp.position.trim();
    onRequestDelete(
      label
        ? t("confirmDeleteExperience", { name: label })
        : t("confirmDeleteExperienceEmpty"),
      () => removeExperience(exp.id)
    );
  };

  return (
    <div className="group/exp relative rounded-sm transition-colors duration-150 -mx-1.5 px-1.5 py-1 hover:bg-gray-50/50">
      {/* Action buttons — always visible on mobile, hover-reveal on desktop */}
      {!viewMode && (
        <div className="absolute -right-1 top-1 flex items-center gap-0.5 can-hover:opacity-0 can-hover:group-hover/exp:opacity-100 transition-opacity duration-150">
          {!isFirst && (
            <button
              onClick={() => moveExperience(exp.id, "up")}
              className="p-1 rounded hover:bg-gray-200 transition-colors"
              aria-label={t("moveUp")}
            >
              <ChevronUp className="h-3 w-3 text-gray-400" />
            </button>
          )}
          {!isLast && (
            <button
              onClick={() => moveExperience(exp.id, "down")}
              className="p-1 rounded hover:bg-gray-200 transition-colors"
              aria-label={t("moveDown")}
            >
              <ChevronDown className="h-3 w-3 text-gray-400" />
            </button>
          )}
          <button
            onClick={handleDelete}
            className="p-1 rounded hover:bg-red-50 transition-colors"
            aria-label={t("deleteExperience")}
          >
            <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-500" />
          </button>
        </div>
      )}

      {/* Company + dates */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0 pr-16">
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
        className="font-medium! text-gray-500!"
        placeholder={t("positionPlaceholder")}
      />

      {/* Role description (optional intro paragraph) */}
      <div className="mt-1">
        <EditableText
          value={exp.roleDescription || ""}
          onChange={(v) => updateExperience(exp.id, { roleDescription: v })}
          as="body"
          multiline
          placeholder={t("roleDescriptionPlaceholder")}
          formatDisplay={renderFormattedText}
        />
      </div>

      {/* Bullet points — drag to reorder, click grip for type menu */}
      <DndContext
        id={`bullets-dnd-${exp.id}`}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleBulletDragEnd}
      >
        <SortableContext
          items={exp.description.map((_, i) => String(i))}
          strategy={verticalListSortingStrategy}
        >
          <ul className="mt-1.5 space-y-1">
            {exp.description.map((bullet, i) => (
              <EditableBullet
                key={i}
                bullet={bullet}
                bulletNumber={numberedCounters[i]}
                sortableId={String(i)}
                onChange={(v) => updateBullet(i, v)}
                onRemove={() => removeBullet(i)}
                onSetType={(type) => setBulletType(i, type)}
                bulletPlaceholder={t("bulletPlaceholder")}
                deleteAriaLabel={t("deleteBullet")}
                bulletColor={colorScheme.bullet}
                gripDragHint={t("gripDragHint")}
                gripClickHint={t("gripClickHint")}
                gripLongPressHint={t("gripLongPressHint")}
                hasSeenHint={hintSeen}
                onHintSeen={onHintSeen}
                typeLabels={{
                  title: t("typeTitle"),
                  subtitle: t("typeSubtitle"),
                  bullet: t("typeBullet"),
                  numbered: t("typeNumbered"),
                }}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      {/* Add bullet */}
      {!viewMode && (
        <button
          onClick={addBullet}
          className="mt-1 flex items-center gap-1 text-[0.833em] text-gray-300 hover:text-gray-500 transition-colors duration-150 pl-3"
        >
          <Plus className="h-2.5 w-2.5" />
          {t("addBullet")}
        </button>
      )}
    </div>
  );
}

export const Experience = memo(function Experience() {
  const {
    data: { experience },
    addExperience,
  } = useCV();
  const t = useTranslations("experience");
  const viewMode = useIsViewMode();
  const [hintSeen, setHintSeen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  return (
    <div>
      <SectionTitle>{t("title")}</SectionTitle>
      <div className="space-y-3">
        {experience.map((exp, i) => (
          <ExperienceCard
            key={exp.id}
            exp={exp}
            isFirst={i === 0}
            isLast={i === experience.length - 1}
            onRequestDelete={(message, onConfirm) =>
              setPendingDelete({ message, onConfirm })
            }
            hintSeen={hintSeen}
            onHintSeen={() => setHintSeen(true)}
          />
        ))}
      </div>
      {!viewMode && (
        <Button
          variant="ghost"
          size="sm"
          onClick={addExperience}
          className="mt-2 h-7 px-2 text-[0.917em] text-gray-400 hover:text-gray-600"
        >
          <Plus className="mr-1 h-3 w-3" />
          {t("addExperience")}
        </Button>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <DialogContent showCloseButton={false} className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-base font-medium">
              {pendingDelete?.message}
            </DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPendingDelete(null)}
            >
              {t("deleteCancel")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                pendingDelete?.onConfirm();
                setPendingDelete(null);
              }}
            >
              {t("deleteConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});
