"use client";

import { memo, useRef, useCallback, useState } from "react";
import { useCV } from "@/lib/cv-context";
import { useTranslations } from "next-intl";
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
import { Plus, X } from "lucide-react";
import { Mail, Phone, MapPin, Linkedin, Globe } from "lucide-react";

function ContactLine({
  icon: Icon,
  value,
  field,
  placeholder,
  onChange,
}: {
  icon: React.ElementType;
  value: string;
  field: string;
  placeholder: string;
  onChange: (field: string, value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 group/contact">
      <Icon className="h-3 w-3 shrink-0 text-gray-400 dark:text-gray-500" />
      <EditableText
        value={value}
        onChange={(v) => onChange(field, v)}
        as="tiny"
        className="!text-[11px] !text-gray-600 dark:text-gray-300!"
        placeholder={placeholder}
      />
    </div>
  );
}

function SkillBadge({
  value,
  onChange,
  onRemove,
  onLongPressDelete,
  skillPlaceholder,
  deleteAriaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  onRemove: () => void;
  onLongPressDelete: () => void;
  skillPlaceholder: string;
  deleteAriaLabel: string;
}) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const handleTouchStart = useCallback(() => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      onLongPressDelete();
    }, 500);
  }, [onLongPressDelete]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  return (
    <span
      className="inline-flex items-center gap-0.5 rounded bg-gray-100 dark:bg-accent pl-2 pr-2 md:pr-0.5 py-0.5 group/badge"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <EditableText
        value={value}
        onChange={onChange}
        as="tiny"
        className="!text-[10px] !text-gray-700 dark:text-gray-300!"
        placeholder={skillPlaceholder}
      />
      <button
        onClick={onRemove}
        className="opacity-0 group-hover/badge:opacity-100 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-muted transition-opacity duration-150 hidden md:inline-flex"
        aria-label={deleteAriaLabel}
      >
        <X className="h-2.5 w-2.5 text-gray-400 dark:text-gray-500" />
      </button>
    </span>
  );
}

function CategoryHeader({
  category,
  onRemove,
  onLongPressDelete,
  categoryPlaceholder,
  deleteAriaLabel,
  onCategoryChange,
}: {
  category: string;
  onRemove: () => void;
  onLongPressDelete: () => void;
  categoryPlaceholder: string;
  deleteAriaLabel: string;
  onCategoryChange: (v: string) => void;
}) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const handleTouchStart = useCallback(() => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      onLongPressDelete();
    }, 500);
  }, [onLongPressDelete]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  return (
    <div
      className="flex items-center gap-1 mb-1"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <EditableText
        value={category}
        onChange={onCategoryChange}
        as="tiny"
        className="!font-semibold !uppercase !tracking-wide !text-gray-500 dark:text-gray-400!"
        placeholder={categoryPlaceholder}
      />
      <button
        onClick={onRemove}
        className="opacity-0 group-hover/skillcat:opacity-100 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-muted transition-opacity duration-150 hidden md:inline-flex"
        aria-label={deleteAriaLabel}
      >
        <X className="h-3 w-3 text-gray-400 dark:text-gray-500" />
      </button>
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
  } = useCV();
  const t = useTranslations("personalInfo");
  const [pendingDelete, setPendingDelete] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  return (
    <div className="space-y-5">
      {/* Profile photo upload — hidden on mobile (shown separately in CVPreview) */}
      <div className="hidden md:block">
        <ProfilePhotoUpload
          currentPhoto={personalInfo.photo}
        fullName={personalInfo.fullName}
        onPhotoChange={(photo) => updatePersonalInfo("photo", photo)}
      />
      </div>

      {/* Contact */}
      {(visibility.email || visibility.phone || visibility.location || visibility.linkedin || visibility.website) && (
        <div className="space-y-2">
          <SectionTitle>{t("contact")}</SectionTitle>
          <div className="space-y-1.5">
            {visibility.email && (
              <ContactLine
                icon={Mail}
                value={personalInfo.email}
                field="email"
                placeholder={t("emailPlaceholder")}
                onChange={(f, v) => updatePersonalInfo(f, v)}
              />
            )}
            {visibility.phone && (
              <ContactLine
                icon={Phone}
                value={personalInfo.phone}
                field="phone"
                placeholder={t("phonePlaceholder")}
                onChange={(f, v) => updatePersonalInfo(f, v)}
              />
            )}
            {visibility.location && (
              <ContactLine
                icon={MapPin}
                value={personalInfo.location}
                field="location"
                placeholder={t("locationPlaceholder")}
                onChange={(f, v) => updatePersonalInfo(f, v)}
              />
            )}
            {visibility.linkedin && (
              <ContactLine
                icon={Linkedin}
                value={personalInfo.linkedin}
                field="linkedin"
                placeholder={t("linkedinPlaceholder")}
                onChange={(f, v) => updatePersonalInfo(f, v)}
              />
            )}
            {visibility.website && (
              <ContactLine
                icon={Globe}
                value={personalInfo.website}
                field="website"
                placeholder={t("websitePlaceholder")}
                onChange={(f, v) => updatePersonalInfo(f, v)}
              />
            )}
          </div>
        </div>
      )}

      {/* Summary */}
      <div>
        <SectionTitle>{t("aboutMe")}</SectionTitle>
        <EditableText
          value={summary}
          onChange={updateSummary}
          placeholder={t("summaryPlaceholder")}
          multiline
          as="body"
        />
      </div>

      {/* Skills */}
      <div>
        <SectionTitle>{t("skills")}</SectionTitle>
        <div className="space-y-3">
          {skills.map((skillGroup) => (
            <div key={skillGroup.id} className="group/skillcat">
              <CategoryHeader
                category={skillGroup.category}
                categoryPlaceholder={t("categoryPlaceholder")}
                deleteAriaLabel={t("deleteCategoryAriaLabel", { category: skillGroup.category })}
                onCategoryChange={(v) =>
                  updateSkillCategory(skillGroup.id, { category: v })
                }
                onRemove={() => removeSkillCategory(skillGroup.id)}
                onLongPressDelete={() =>
                  setPendingDelete({
                    message: skillGroup.category.trim()
                      ? t("confirmDeleteCategory", { category: skillGroup.category })
                      : t("confirmDeleteCategoryEmpty"),
                    onConfirm: () => removeSkillCategory(skillGroup.id),
                  })
                }
              />
              <div className="flex flex-wrap gap-1">
                {skillGroup.items.map((item, i) => {
                  const removeSkill = () => {
                    const newItems = skillGroup.items.filter(
                      (_, idx) => idx !== i
                    );
                    updateSkillCategory(skillGroup.id, { items: newItems });
                  };
                  return (
                    <SkillBadge
                      key={i}
                      value={item}
                      skillPlaceholder={t("skillPlaceholder")}
                      deleteAriaLabel={t("deleteSkillAriaLabel", { skill: item })}
                      onChange={(v) => {
                        const newItems = [...skillGroup.items];
                        newItems[i] = v;
                        updateSkillCategory(skillGroup.id, { items: newItems });
                      }}
                      onRemove={removeSkill}
                      onLongPressDelete={() =>
                        setPendingDelete({
                          message: item.trim()
                            ? t("confirmDeleteSkill", { skill: item })
                            : t("confirmDeleteSkillEmpty"),
                          onConfirm: removeSkill,
                        })
                      }
                    />
                  );
                })}
                <button
                  onClick={() =>
                    updateSkillCategory(skillGroup.id, {
                      items: [...skillGroup.items, "Skill"],
                    })
                  }
                  className="inline-flex items-center gap-0.5 rounded border border-dashed border-gray-300 dark:border-border px-2 py-0.5 text-[10px] text-gray-400 dark:text-gray-500 hover:border-gray-400 dark:hover:border-ring hover:text-gray-500 dark:hover:text-gray-400 transition-colors duration-150"
                >
                  <Plus className="h-2.5 w-2.5" />
                </button>
              </div>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={addSkillCategory}
            className="h-6 px-2 text-[10px] text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <Plus className="mr-1 h-3 w-3" />
            {t("addCategory")}
          </Button>
        </div>
      </div>

      {/* Delete confirmation dialog (mobile long-press) */}
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
