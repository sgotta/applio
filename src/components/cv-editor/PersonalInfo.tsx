"use client";

import { memo, useCallback, useState } from "react";
import { useCV } from "@/lib/cv-context";
import { useTranslations } from "next-intl";
import { useColorScheme } from "@/lib/color-scheme-context";
import { useIsViewMode } from "@/hooks/useIsViewMode";
import { EditableText } from "./EditableText";
import { SectionTitle } from "./SectionTitle";
import { ProfilePhotoUpload } from "./ProfilePhotoUpload";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, X, ChevronUp, ChevronDown, Trash2, Pencil } from "lucide-react";
import { Mail, Phone, MapPin, Linkedin, Globe } from "lucide-react";
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
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function ContactLine({
  icon: Icon,
  value,
  field,
  placeholder,
  onChange,
  iconColor,
  urlField,
  urlValue,
  urlPlaceholder,
}: {
  icon: React.ElementType;
  value: string;
  field: string;
  placeholder: string;
  onChange: (field: string, value: string | undefined) => void;
  iconColor: string;
  urlField?: string;
  urlValue?: string;
  urlPlaceholder?: string;
}) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const hasUrl = !!urlValue;
  const linkable = !!urlField;
  const viewMode = useIsViewMode();

  // Clickable href for view mode: external URLs, mailto:, or tel:
  const viewHref = viewMode && value
    ? urlValue || (field === "email" ? `mailto:${value}` : field === "phone" ? `tel:${value}` : undefined)
    : undefined;

  // Reset to preview mode when popover closes
  const handleOpenChange = (open: boolean) => {
    setLinkOpen(open);
    if (!open) setEditing(false);
  };

  return (
    <div className="flex items-center gap-1 group/contact">
      {linkable && !viewMode ? (
        /* Icon is the popover trigger for linkable fields */
        <Popover open={linkOpen} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <button className="p-0.5 rounded transition-colors hover:bg-white/20 shrink-0">
              <Icon className="h-3 w-3" style={{ color: iconColor }} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-1.5" align="start" side="bottom" sideOffset={4}>
            {hasUrl && !editing ? (
              /* Preview mode — show URL with actions */
              <div className="flex items-center gap-1">
                <a
                  href={urlValue}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-0 truncate rounded-md px-2 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-accent transition-colors"
                >
                  {urlValue!.replace(/^https?:\/\//, "")}
                </a>
                <button
                  onClick={() => setEditing(true)}
                  className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-accent transition-colors shrink-0"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  onClick={() => {
                    onChange(urlField, undefined);
                    setLinkOpen(false);
                  }}
                  className="p-1 rounded-md text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-accent transition-colors shrink-0"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              /* Edit mode — input field */
              <div className="flex items-center gap-1.5">
                <input
                  type="url"
                  value={urlValue || ""}
                  onChange={(e) => onChange(urlField, e.target.value || undefined)}
                  placeholder={urlPlaceholder}
                  className="flex-1 min-w-0 rounded-md bg-gray-50 dark:bg-accent px-2 py-1.5 text-xs text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setLinkOpen(false);
                  }}
                />
                {hasUrl && (
                  <button
                    onClick={() => {
                      onChange(urlField, undefined);
                      setLinkOpen(false);
                    }}
                    className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-accent transition-colors shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
          </PopoverContent>
        </Popover>
      ) : (
        /* Non-linkable fields — plain icon */
        <Icon className="h-3 w-3 shrink-0" style={{ color: iconColor }} />
      )}
      {viewHref ? (
        <a
          href={viewHref}
          target={urlValue ? "_blank" : undefined}
          rel={urlValue ? "noopener noreferrer" : undefined}
          className="text-gray-600 dark:text-gray-300 inline-block rounded-sm px-1.5 py-0.5 -mx-1.5 -my-0.5 hover:opacity-80 transition-opacity"
          style={{ fontSize: Math.round(11 * 1.08), color: iconColor }}
        >
          {value}
        </a>
      ) : (
        <EditableText
          value={value}
          onChange={(v) => onChange(field, v)}
          as="small"
          placeholder={placeholder}
          displayStyle={{ color: iconColor }}
        />
      )}
    </div>
  );
}

function SkillBadge({
  value,
  onChange,
  onRemove,
  skillPlaceholder,
  deleteAriaLabel,
  badgeBg,
  badgeText,
  autoEdit,
}: {
  value: string;
  onChange: (v: string) => void;
  onRemove: () => void;
  skillPlaceholder: string;
  deleteAriaLabel: string;
  badgeBg: string;
  badgeText: string;
  autoEdit?: boolean;
}) {
  const viewMode = useIsViewMode();

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded pl-2 ${viewMode ? "pr-2" : "pr-0.5"} py-0.5 group/badge`}
      style={{ backgroundColor: badgeBg, color: badgeText }}
    >
      <EditableText
        value={value}
        onChange={onChange}
        as="tiny"
        placeholder={skillPlaceholder}
        displayStyle={{ color: badgeText }}
        autoEdit={autoEdit}
      />
      {!viewMode && (
        <button
          onClick={onRemove}
          className="inline-flex can-hover:opacity-0 can-hover:group-hover/badge:opacity-100 p-0.5 rounded hover:bg-white/20 transition-opacity duration-150"
          aria-label={deleteAriaLabel}
        >
          <X className="h-2.5 w-2.5" style={{ color: badgeText }} />
        </button>
      )}
    </span>
  );
}

function SortableSkillBadge({
  sortableId,
  children,
}: {
  sortableId: string;
  children: React.ReactNode;
}) {
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
    cursor: viewMode ? "default" : isDragging ? "grabbing" : "grab",
  };

  return (
    <span
      ref={setNodeRef}
      style={style}
      className="inline-flex touch-manipulation"
      {...attributes}
      {...(viewMode ? {} : listeners)}
    >
      {children}
    </span>
  );
}

function CategoryHeader({
  category,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  categoryPlaceholder,
  deleteAriaLabel,
  moveUpAriaLabel,
  moveDownAriaLabel,
  onCategoryChange,
  categoryColor,
  autoEdit,
}: {
  category: string;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  categoryPlaceholder: string;
  deleteAriaLabel: string;
  moveUpAriaLabel: string;
  moveDownAriaLabel: string;
  onCategoryChange: (v: string) => void;
  categoryColor: string;
  autoEdit?: boolean;
}) {
  const viewMode = useIsViewMode();

  return (
    <div className="flex items-center gap-1 mb-1 relative">
      <EditableText
        value={category}
        onChange={onCategoryChange}
        as="tiny"
        className="!font-semibold !uppercase !tracking-wide"
        placeholder={categoryPlaceholder}
        displayStyle={{ color: categoryColor }}
        autoEdit={autoEdit}
      />
      {!viewMode && (
        <div className="flex items-center gap-0.5 can-hover:opacity-0 can-hover:group-hover/skillcat:opacity-100 transition-opacity duration-150">
          {!isFirst && (
            <button
              onClick={onMoveUp}
              className="p-0.5 rounded hover:bg-white/20 transition-colors"
              aria-label={moveUpAriaLabel}
            >
              <ChevronUp className="h-3 w-3" style={{ color: categoryColor }} />
            </button>
          )}
          {!isLast && (
            <button
              onClick={onMoveDown}
              className="p-0.5 rounded hover:bg-white/20 transition-colors"
              aria-label={moveDownAriaLabel}
            >
              <ChevronDown className="h-3 w-3" style={{ color: categoryColor }} />
            </button>
          )}
          <button
            onClick={onRemove}
            className="p-0.5 rounded hover:bg-white/20 transition-colors"
            aria-label={deleteAriaLabel}
          >
            <Trash2 className="h-3 w-3" style={{ color: categoryColor }} />
          </button>
        </div>
      )}
    </div>
  );
}

export const PersonalInfo = memo(function PersonalInfo() {
  const {
    data: { personalInfo, summary, skills, visibility },
    updatePersonalInfo,
    updateSummary,
    updateSkillCategory,
    addSkillCategory,
    removeSkillCategory,
    moveSkillCategory,
  } = useCV();
  const t = useTranslations("personalInfo");
  const { colorScheme } = useColorScheme();
  const viewMode = useIsViewMode();

  // Confirmation dialog — only used for category deletion (destructive, removes all skills)
  const [pendingDelete, setPendingDelete] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Track which newly added item should auto-enter edit mode.
  // Uses unique value (with timestamp) so consecutive adds always trigger re-render.
  // No cleanup needed: autoEdit only affects initial mount state of EditableText.
  const [autoEditTarget, setAutoEditTarget] = useState<string | null>(null);

  // Multi-device sensors:
  // Desktop: click = edit, drag 8px+ = reorder
  // Mobile: tap = edit, hold 250ms + move = drag
  // Keyboard: Space to pick up, arrows to move, Space to drop
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSkillDragEnd = useCallback(
    (skillGroupId: string, items: string[]) => (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = Number(active.id);
        const newIndex = Number(over.id);
        updateSkillCategory(skillGroupId, {
          items: arrayMove(items, oldIndex, newIndex),
        });
      }
    },
    [updateSkillCategory]
  );

  return (
    <div className="space-y-5">
      {/* Profile photo upload — hidden on mobile (shown separately in CVPreview) */}
      <div className="hidden md:block">
        <ProfilePhotoUpload
          currentPhoto={personalInfo.photo}
          fullName={personalInfo.fullName}
          onPhotoChange={(photo) => updatePersonalInfo("photo", photo)}
          placeholderBg={colorScheme.sidebarBadgeBg}
          placeholderText={colorScheme.sidebarMuted}
        />
      </div>

      {/* Contact */}
      {(visibility.email || visibility.phone || visibility.location || visibility.linkedin || visibility.website) && (
        <div className="space-y-2">
          <SectionTitle sidebar>{t("contact")}</SectionTitle>
          <div className="space-y-1.5">
            {visibility.email && (
              <ContactLine
                icon={Mail}
                value={personalInfo.email}
                field="email"
                placeholder={t("emailPlaceholder")}
                onChange={(f, v) => updatePersonalInfo(f, v)}
                iconColor={colorScheme.sidebarText}
              />
            )}
            {visibility.phone && (
              <ContactLine
                icon={Phone}
                value={personalInfo.phone}
                field="phone"
                placeholder={t("phonePlaceholder")}
                onChange={(f, v) => updatePersonalInfo(f, v)}
                iconColor={colorScheme.sidebarText}
              />
            )}
            {visibility.location && (
              <ContactLine
                icon={MapPin}
                value={personalInfo.location}
                field="location"
                placeholder={t("locationPlaceholder")}
                onChange={(f, v) => updatePersonalInfo(f, v)}
                iconColor={colorScheme.sidebarText}
              />
            )}
            {visibility.linkedin && (
              <ContactLine
                icon={Linkedin}
                value={personalInfo.linkedin}
                field="linkedin"
                placeholder={t("linkedinPlaceholder")}
                onChange={(f, v) => updatePersonalInfo(f, v)}
                iconColor={colorScheme.sidebarText}
                urlField="linkedinUrl"
                urlValue={personalInfo.linkedinUrl}
                urlPlaceholder={t("urlPlaceholder")}
              />
            )}
            {visibility.website && (
              <ContactLine
                icon={Globe}
                value={personalInfo.website}
                field="website"
                placeholder={t("websitePlaceholder")}
                onChange={(f, v) => updatePersonalInfo(f, v)}
                iconColor={colorScheme.sidebarText}
                urlField="websiteUrl"
                urlValue={personalInfo.websiteUrl}
                urlPlaceholder={t("urlPlaceholder")}
              />
            )}
          </div>
        </div>
      )}

      {/* Summary */}
      <div>
        <SectionTitle sidebar>{t("aboutMe")}</SectionTitle>
        <EditableText
          value={summary}
          onChange={updateSummary}
          placeholder={t("summaryPlaceholder")}
          multiline
          as="body"
          displayStyle={{ color: colorScheme.sidebarText }}
        />
      </div>

      {/* Skills */}
      <div>
        <SectionTitle sidebar>{t("skills")}</SectionTitle>
        <div className="space-y-3">
          {skills.map((skillGroup, index) => (
            <div key={skillGroup.id} className="group/skillcat">
              <CategoryHeader
                category={skillGroup.category}
                categoryPlaceholder={t("categoryPlaceholder")}
                deleteAriaLabel={t("deleteCategoryAriaLabel", { category: skillGroup.category })}
                moveUpAriaLabel={t("moveUp")}
                moveDownAriaLabel={t("moveDown")}
                isFirst={index === 0}
                isLast={index === skills.length - 1}
                autoEdit={!!autoEditTarget?.startsWith("newCategory:") && index === skills.length - 1}
                onCategoryChange={(v) =>
                  updateSkillCategory(skillGroup.id, { category: v })
                }
                onRemove={() =>
                  setPendingDelete({
                    message: skillGroup.category.trim()
                      ? t("confirmDeleteCategory", { category: skillGroup.category })
                      : t("confirmDeleteCategoryEmpty"),
                    onConfirm: () => removeSkillCategory(skillGroup.id),
                  })
                }
                onMoveUp={() => moveSkillCategory(skillGroup.id, "up")}
                onMoveDown={() => moveSkillCategory(skillGroup.id, "down")}
                categoryColor={colorScheme.sidebarText}
              />
              <DndContext
                id={`skills-dnd-${skillGroup.id}`}
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleSkillDragEnd(skillGroup.id, skillGroup.items)}
              >
                <SortableContext
                  items={skillGroup.items.map((_, i) => String(i))}
                  strategy={rectSortingStrategy}
                >
                  <div className="flex flex-wrap gap-1">
                    {skillGroup.items.map((item, i) => {
                      const removeSkill = () => {
                        const newItems = skillGroup.items.filter(
                          (_, idx) => idx !== i
                        );
                        updateSkillCategory(skillGroup.id, { items: newItems });
                      };
                      return (
                        <SortableSkillBadge key={i} sortableId={String(i)}>
                          <SkillBadge
                            value={item}
                            skillPlaceholder={t("skillPlaceholder")}
                            deleteAriaLabel={t("deleteSkillAriaLabel", { skill: item })}
                            badgeBg={colorScheme.sidebarBadgeBg}
                            badgeText={colorScheme.sidebarBadgeText}
                            autoEdit={!!autoEditTarget?.startsWith(skillGroup.id + ":") && i === skillGroup.items.length - 1}
                            onChange={(v) => {
                              const newItems = [...skillGroup.items];
                              newItems[i] = v;
                              updateSkillCategory(skillGroup.id, { items: newItems });
                            }}
                            onRemove={removeSkill}
                          />
                        </SortableSkillBadge>
                      );
                    })}
                    {!viewMode && (
                      <button
                        onClick={() => {
                          setAutoEditTarget(skillGroup.id + ":" + Date.now());
                          updateSkillCategory(skillGroup.id, {
                            items: [...skillGroup.items, "Skill"],
                          });
                        }}
                        className="inline-flex items-center gap-0.5 rounded border border-dashed px-2 py-0.5 text-[10px] transition-colors duration-150 hover:opacity-80"
                        style={{ borderColor: colorScheme.sidebarMuted, color: colorScheme.sidebarMuted }}
                      >
                        <Plus className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          ))}
          {!viewMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAutoEditTarget("newCategory:" + Date.now());
                addSkillCategory();
              }}
              className="h-6 px-2 text-[10px] hover:opacity-80"
              style={{ color: colorScheme.sidebarMuted }}
            >
              <Plus className="mr-1 h-3 w-3" />
              {t("addCategory")}
            </Button>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog — categories only */}
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
              {t("deleteSkillCancel")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                pendingDelete?.onConfirm();
                setPendingDelete(null);
              }}
            >
              {t("deleteSkillConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});
