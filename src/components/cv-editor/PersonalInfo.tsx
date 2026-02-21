"use client";

import React, { memo, useCallback, useState } from "react";
import { useCV } from "@/lib/cv-context";
import { useTranslations } from "next-intl";
import { useColorScheme } from "@/lib/color-scheme-context";
import { toast } from "sonner";

import { EditableText } from "./EditableText";
import { EntryGrip } from "./EntryGrip";
import { SectionTitle } from "./SectionTitle";
import { ProfilePhotoUpload } from "./ProfilePhotoUpload";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, GripVertical, ExternalLink, Trash2, Link2 } from "lucide-react";
import { Mail, Phone, MapPin, Linkedin, Globe } from "lucide-react";
import type { SidebarSectionId } from "@/lib/types";
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
  verticalListSortingStrategy,
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
  const hasUrl = !!urlValue;
  const linkable = !!urlField;
  const t = useTranslations("personalInfo");

  /* Non-linkable fields (email, phone, location): plain icon + inline editable text */
  if (!linkable) {
    return (
      <div className="flex items-center gap-1 group/contact">
        <Icon className="h-3 w-3 shrink-0" style={{ color: iconColor }} />
        <EditableText
          value={value}
          onChange={(v) => onChange(field, v)}
          as="small"
          placeholder={placeholder}
          displayStyle={{ color: iconColor }}
        />
      </div>
    );
  }

  /* Linkable fields (linkedin, website): entire row opens popover */
  return (
    <Popover open={linkOpen} onOpenChange={setLinkOpen}>
      <PopoverTrigger asChild>
        <button
          className={`flex items-center gap-1 -mx-1.5 px-1.5 py-0.5 rounded-md transition-colors text-left w-full ${
            linkOpen ? "bg-white/10" : "hover:bg-white/5"
          }`}
        >
          <span className="relative shrink-0">
            <Icon className="h-3 w-3" style={{ color: iconColor }} />
            {hasUrl && (
              <span className="absolute -top-px -right-px h-1.5 w-1.5 rounded-full bg-white/80" />
            )}
          </span>
          <span
            className={value ? "" : "italic opacity-50"}
            style={{ color: iconColor, fontSize: "1em" }}
          >
            {value || placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 border-0 bg-gray-900 p-3.5 rounded-xl shadow-xl"
        align="start"
        side="bottom"
        sideOffset={6}
      >
        <div className="space-y-3">
          {/* Display text field */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-white/40">
              {t("linkTextLabel")}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(field, e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-lg bg-white/10 px-3 py-2 text-[13px] text-white placeholder:text-white/30 outline-none focus:bg-white/15 transition-colors"
              autoFocus
            />
          </div>
          {/* URL field */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-white/40">
              {t("linkUrlLabel")}
            </label>
            <div className="flex items-center rounded-lg bg-white/10 focus-within:bg-white/15 transition-colors">
              <Link2 className="h-3.5 w-3.5 text-white/30 ml-3 shrink-0" />
              <input
                type="url"
                value={urlValue || ""}
                onChange={(e) => onChange(urlField!, e.target.value || undefined)}
                placeholder={urlPlaceholder}
                className="flex-1 min-w-0 bg-transparent px-2.5 py-2 text-[13px] text-white/80 placeholder:text-white/30 outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "Escape") setLinkOpen(false);
                }}
              />
            </div>
          </div>
          {/* Actions */}
          {hasUrl && (
            <>
              <div className="w-full h-px bg-white/10" />
              <div className="flex items-center gap-0.5">
                <a
                  href={urlValue}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  {t("linkOpen")}
                </a>
                <button
                  onClick={() => { onChange(urlField!, undefined); setLinkOpen(false); }}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-white/60 hover:text-red-300 hover:bg-white/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5 shrink-0" />
                  {t("linkRemove")}
                </button>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SkillBadge({
  value,
  onChange,
  skillPlaceholder,
  badgeBg,
  badgeText,
  autoEdit,
  isEditing,
  onEditingChange,
}: {
  value: string;
  onChange: (v: string) => void;
  skillPlaceholder: string;
  badgeBg: string;
  badgeText: string;
  autoEdit?: boolean;
  isEditing?: boolean;
  onEditingChange?: (editing: boolean) => void;
}) {
  return (
    <span
      className={`inline-flex items-center rounded px-2.5 py-1.5 md:px-2 md:py-0.5 transition-all duration-150 [&_.tiptap]:text-inherit ${isEditing ? "brightness-125 shadow-md shadow-black/15 scale-105 ring-[1.5px] ring-white" : ""}`}
      style={{ backgroundColor: badgeBg, color: badgeText }}
    >
      <EditableText
        value={value}
        onChange={onChange}
        as="tiny"
        placeholder={skillPlaceholder}
        displayStyle={{ color: badgeText }}
        autoEdit={autoEdit}
        editOutline={false}
        doubleClickToEdit
        deleteOnEmpty
        onEditingChange={onEditingChange}
      />
    </span>
  );
}

function SortableSkillBadge({
  sortableId,
  value,
  onChange,
  skillPlaceholder,
  badgeBg,
  badgeText,
  autoEdit,
  isGroupDragging,
}: {
  sortableId: string;
  value: string;
  onChange: (v: string) => void;
  skillPlaceholder: string;
  badgeBg: string;
  badgeText: string;
  autoEdit?: boolean;
  isGroupDragging?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId, disabled: isEditing });

  const isSibling = isGroupDragging && !isDragging;

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    zIndex: isDragging ? 10 : undefined,
    cursor: isEditing ? undefined : isDragging ? "grabbing" : "grab",
  };

  return (
    <span
      ref={setNodeRef}
      style={style}
      className={`inline-flex touch-manipulation${isSibling ? " animate-wiggle" : ""}`}
      {...attributes}
      {...listeners}
    >
      <SkillBadge
        value={value}
        onChange={onChange}
        skillPlaceholder={skillPlaceholder}
        badgeBg={badgeBg}
        badgeText={badgeText}
        autoEdit={autoEdit}
        isEditing={isEditing}
        onEditingChange={setIsEditing}
      />
    </span>
  );
}

function SortableSkillCategory({
  skillGroup,
  index,
  total,
  sensors,
  onSkillDragEnd,
  onAddBelow,
  autoEditTarget,
  setAutoEditTarget,
}: {
  skillGroup: { id: string; category: string; items: string[] };
  index: number;
  total: number;
  sensors: ReturnType<typeof useSensors>;
  onSkillDragEnd: (skillGroupId: string, items: string[]) => (event: DragEndEvent) => void;
  onAddBelow: () => void;
  autoEditTarget: string | null;
  setAutoEditTarget: (v: string | null) => void;
}) {
  const { updateSkillCategory, removeSkillCategory, moveSkillCategory } = useCV();
  const t = useTranslations("personalInfo");
  const tc = useTranslations("common");
  const { colorScheme } = useColorScheme();
  const [isDraggingSkills, setIsDraggingSkills] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: skillGroup.id });

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
      className="group/entry relative"
    >
      <EntryGrip
        sidebar
        onMoveUp={index > 0 ? () => moveSkillCategory(skillGroup.id, "up") : undefined}
        onMoveDown={index < total - 1 ? () => moveSkillCategory(skillGroup.id, "down") : undefined}
        onDelete={() => removeSkillCategory(skillGroup.id)}
        onAddBelow={onAddBelow}
        sortableAttributes={attributes}
        sortableListeners={listeners}
        labels={{
          delete: tc("delete"),
          moveUp: tc("moveUp"),
          moveDown: tc("moveDown"),
          addBelow: t("addCategory"),
          dragHint: tc("gripDragHint"),
          longPressHint: tc("gripLongPressHint"),
        }}
      />

      <div>
        {/* Category name */}
        <div className="mb-1">
          <EditableText
            value={skillGroup.category}
            onChange={(v) => updateSkillCategory(skillGroup.id, { category: v })}
            as="tiny"
            className="!font-semibold !uppercase !tracking-wide"
            placeholder={t("categoryPlaceholder")}
            displayStyle={{ color: colorScheme.sidebarText }}
            autoEdit={!!autoEditTarget?.startsWith("newCategory:") && index === total - 1}
          />
        </div>

        {/* Skill badges — drag to reorder within category */}
        <DndContext
          id={`skills-dnd-${skillGroup.id}`}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={() => setIsDraggingSkills(true)}
          onDragEnd={(e) => {
            setIsDraggingSkills(false);
            (document.activeElement as HTMLElement)?.blur?.();
            onSkillDragEnd(skillGroup.id, skillGroup.items)(e);
          }}
          onDragCancel={() => {
            setIsDraggingSkills(false);
            (document.activeElement as HTMLElement)?.blur?.();
          }}
        >
          <SortableContext
            items={skillGroup.items.map((_, i) => String(i))}
            strategy={rectSortingStrategy}
          >
            <div className="flex flex-wrap gap-1">
              {skillGroup.items.map((item, i) => (
                  <SortableSkillBadge
                    key={i}
                    sortableId={String(i)}
                    value={item}
                    skillPlaceholder={t("skillPlaceholder")}
                    badgeBg={colorScheme.sidebarBadgeBg}
                    badgeText={colorScheme.sidebarBadgeText}
                    autoEdit={!!autoEditTarget?.startsWith(skillGroup.id + ":") && i === skillGroup.items.length - 1}
                    isGroupDragging={isDraggingSkills}
                    onChange={(v) => {
                      if (!v) {
                        const deleted = skillGroup.items[i];
                        const newItems = skillGroup.items.filter((_, idx) => idx !== i);
                        updateSkillCategory(skillGroup.id, { items: newItems });
                        if (deleted) toast(t("skillDeleted", { tag: deleted }), {
                          icon: <Trash2 className="h-4 w-4 shrink-0 opacity-60" />,
                          action: {
                            label: tc("undo"),
                            onClick: () => {
                              updateSkillCategory(skillGroup.id, {
                                items: [...newItems.slice(0, i), deleted, ...newItems.slice(i)],
                              });
                            },
                          },
                        });
                      } else {
                        const newItems = [...skillGroup.items];
                        newItems[i] = v;
                        updateSkillCategory(skillGroup.id, { items: newItems });
                      }
                    }}
                  />
                ))}
              <button
                onClick={() => {
                  setAutoEditTarget(skillGroup.id + ":" + Date.now());
                  updateSkillCategory(skillGroup.id, {
                    items: [...skillGroup.items, "Skill"],
                  });
                }}
                className="inline-flex items-center justify-center rounded border border-dashed px-2.5 py-1.5 md:px-2 md:py-0.5 transition-all duration-200 hover:scale-105 active:scale-95"
                style={{ borderColor: colorScheme.sidebarMuted, color: colorScheme.sidebarMuted, fontSize: "0.9em" }}
              >
                {"\u200B"}<Plus className="h-[0.75em] w-[0.75em]" strokeWidth={2} />
              </button>
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

function SortableSidebarSection({
  id,
  children,
}: {
  id: SidebarSectionId;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="group/sidebar-section relative">
      <button
        className="absolute -left-5 top-0.5 can-hover:opacity-0 can-hover:group-hover/sidebar-section:opacity-100 transition-opacity duration-150 p-0.5 rounded cursor-grab active:cursor-grabbing touch-manipulation"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5 opacity-50" />
      </button>
      {children}
    </div>
  );
}

export const PersonalInfo = memo(function PersonalInfo() {
  const {
    data: { personalInfo, summary, skills, visibility, sidebarOrder },
    updatePersonalInfo,
    updateSummary,
    updateSkillCategory,
    addSkillCategory,
    reorderSkillCategory,
    reorderSidebarSection,
  } = useCV();
  const t = useTranslations("personalInfo");
  const { colorScheme } = useColorScheme();

  // Track which newly added item should auto-enter edit mode.
  const [autoEditTarget, setAutoEditTarget] = useState<string | null>(null);

  // Multi-device sensors for badge reorder
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

  // Category-level DnD sensors
  const categorySensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
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

  const handleCategoryDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = skills.findIndex(s => s.id === active.id);
      const newIndex = skills.findIndex(s => s.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderSkillCategory(oldIndex, newIndex);
      }
    }
  }, [skills, reorderSkillCategory]);

  // Section-level DnD
  const sectionSensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleSectionDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sidebarOrder.indexOf(active.id as SidebarSectionId);
      const newIndex = sidebarOrder.indexOf(over.id as SidebarSectionId);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderSidebarSection(oldIndex, newIndex);
      }
    }
  }, [sidebarOrder, reorderSidebarSection]);

  const contactSection = (
    <div className="space-y-2">
      <SectionTitle sidebar>{t("contact")}</SectionTitle>
      <div className="space-y-1.5">
        <ContactLine
          icon={Mail}
          value={personalInfo.email}
          field="email"
          placeholder={t("emailPlaceholder")}
          onChange={(f, v) => updatePersonalInfo(f, v)}
          iconColor={colorScheme.sidebarText}
        />
        <ContactLine
          icon={Phone}
          value={personalInfo.phone}
          field="phone"
          placeholder={t("phonePlaceholder")}
          onChange={(f, v) => updatePersonalInfo(f, v)}
          iconColor={colorScheme.sidebarText}
        />
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
  );

  const summarySection = (
    <div>
      <SectionTitle sidebar>{t("aboutMe")}</SectionTitle>
      <EditableText
        value={summary}
        onChange={updateSummary}
        placeholder={t("summaryPlaceholder")}
        multiline
        richText
        as="body"
        displayStyle={{ color: colorScheme.sidebarText }}
      />
    </div>
  );

  const skillsSection = skills.length > 0 ? (
    <div>
      <SectionTitle sidebar>{t("skills")}</SectionTitle>
      <DndContext
        id="skill-categories-dnd"
        sensors={categorySensors}
        collisionDetection={closestCenter}
        onDragEnd={handleCategoryDragEnd}
      >
        <SortableContext
          items={skills.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {skills.map((skillGroup, index) => (
              <SortableSkillCategory
                key={skillGroup.id}
                skillGroup={skillGroup}
                index={index}
                total={skills.length}
                sensors={sensors}
                onSkillDragEnd={handleSkillDragEnd}
                onAddBelow={() => {
                  setAutoEditTarget("newCategory:" + Date.now());
                  addSkillCategory(index);
                }}
                autoEditTarget={autoEditTarget}
                setAutoEditTarget={setAutoEditTarget}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  ) : null;

  const sectionContent: Record<SidebarSectionId, React.ReactNode> = {
    contact: contactSection,
    summary: visibility.summary ? summarySection : null,
    skills: skillsSection,
  };

  return (
    <div className="space-y-5">
      {/* Profile photo upload — hidden on mobile (shown separately in CVPreview) */}
      <div className="hidden md:block">
        <ProfilePhotoUpload
          currentPhoto={personalInfo.photo}
          fullName={personalInfo.fullName}
          onPhotoChange={(photo) => updatePersonalInfo("photo", photo)}
          placeholderBg={colorScheme.sidebarText + "28"}
          placeholderText={colorScheme.sidebarMuted}
        />
      </div>

      {/* Sortable sidebar sections */}
      <DndContext
        id="sidebar-sections-dnd"
        sensors={sectionSensors}
        collisionDetection={closestCenter}
        onDragEnd={handleSectionDragEnd}
      >
        <SortableContext items={sidebarOrder} strategy={verticalListSortingStrategy}>
          <div className="space-y-5">
            {sidebarOrder.map((sectionId) => {
              const content = sectionContent[sectionId];
              if (!content) return null;
              return (
                <SortableSidebarSection key={sectionId} id={sectionId}>
                  {content}
                </SortableSidebarSection>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
});
