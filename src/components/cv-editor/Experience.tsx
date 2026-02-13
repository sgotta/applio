"use client";

import React, { memo, useState } from "react";
import { useCV } from "@/lib/cv-context";
import { useTranslations } from "next-intl";
import { useColorScheme } from "@/lib/color-scheme-context";
import { ExperienceItem } from "@/lib/types";
import { EditableText } from "./EditableText";
import { SectionTitle } from "./SectionTitle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { SwipeToDelete } from "@/components/ui/swipe-to-delete";
import { Plus, Trash2, ChevronUp, ChevronDown, X } from "lucide-react";

function EditableBullet({
  value,
  onChange,
  onRemove,
  bulletPlaceholder,
  deleteAriaLabel,
  bulletColor,
}: {
  value: string;
  onChange: (v: string) => void;
  onRemove: () => void;
  bulletPlaceholder: string;
  deleteAriaLabel: string;
  bulletColor: string;
}) {
  return (
    <li className="flex items-start gap-1 group/bullet pl-3 relative">
      <span className="absolute left-0 text-[11px] select-none" style={{ color: bulletColor }}>
        &bull;
      </span>
      <EditableText
        value={value}
        onChange={onChange}
        as="body"
        className="flex-1"
        placeholder={bulletPlaceholder}
      />
      <button
        onClick={onRemove}
        className="opacity-0 group-hover/bullet:opacity-100 mt-0.5 p-0.5 rounded hover:bg-gray-100 dark:hover:bg-accent transition-opacity duration-150 flex-shrink-0 hidden md:inline-flex"
        aria-label={deleteAriaLabel}
      >
        <X className="h-3 w-3 text-gray-400 dark:text-gray-500" />
      </button>
    </li>
  );
}

function ExperienceCard({
  exp,
  isFirst,
  isLast,
  onRequestDelete,
}: {
  exp: ExperienceItem;
  isFirst: boolean;
  isLast: boolean;
  onRequestDelete: (message: string, onConfirm: () => void) => void;
}) {
  const { updateExperience, removeExperience, moveExperience } = useCV();
  const t = useTranslations("experience");
  const { colorScheme } = useColorScheme();

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
      description: [...exp.description, t("newBulletDefault")],
    });
  };

  const handleSwipeDelete = () => {
    const label = exp.company.trim() || exp.position.trim();
    onRequestDelete(
      label
        ? t("confirmDeleteExperience", { name: label })
        : t("confirmDeleteExperienceEmpty"),
      () => removeExperience(exp.id)
    );
  };

  return (
    <SwipeToDelete onDelete={handleSwipeDelete}>
      <div className="group/exp relative rounded-sm transition-colors duration-150 -mx-1.5 px-1.5 py-1 hover:bg-gray-50/50 dark:hover:bg-accent/50">
        {/* Action buttons — desktop only, visible on hover */}
        <div className="absolute -right-1 top-1 hidden md:flex items-center gap-0.5 opacity-0 group-hover/exp:opacity-100 transition-opacity duration-150">
          {!isFirst && (
            <button
              onClick={() => moveExperience(exp.id, "up")}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-muted transition-colors"
              aria-label={t("moveUp")}
            >
              <ChevronUp className="h-3 w-3 text-gray-400 dark:text-gray-500" />
            </button>
          )}
          {!isLast && (
            <button
              onClick={() => moveExperience(exp.id, "down")}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-muted transition-colors"
              aria-label={t("moveDown")}
            >
              <ChevronDown className="h-3 w-3 text-gray-400 dark:text-gray-500" />
            </button>
          )}
          <button
            onClick={() => removeExperience(exp.id)}
            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            aria-label={t("deleteExperience")}
          >
            <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-500" />
          </button>
        </div>

        {/* Company + dates */}
        <div className="flex items-baseline justify-between gap-2 pr-16">
          <EditableText
            value={exp.company}
            onChange={(v) => updateExperience(exp.id, { company: v })}
            as="itemTitle"
            placeholder={t("companyPlaceholder")}
          />
          <div className="flex items-baseline gap-1 flex-shrink-0">
            <EditableText
              value={exp.startDate}
              onChange={(v) => updateExperience(exp.id, { startDate: v })}
              as="tiny"
              placeholder={t("startDatePlaceholder")}
            />
            <span className="text-[10px] text-gray-400 dark:text-gray-500">—</span>
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
          as="subheading"
          placeholder={t("positionPlaceholder")}
        />

        {/* Bullet points */}
        <ul className="mt-1.5 space-y-1">
          {exp.description.map((bullet, i) => (
            <EditableBullet
              key={i}
              value={bullet}
              onChange={(v) => updateBullet(i, v)}
              onRemove={() => removeBullet(i)}
              bulletPlaceholder={t("bulletPlaceholder")}
              deleteAriaLabel={t("deleteBullet")}
              bulletColor={colorScheme.bullet}
            />
          ))}
        </ul>

        {/* Add bullet */}
        <button
          onClick={addBullet}
          className="mt-1 flex items-center gap-1 text-[10px] text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors duration-150 pl-3"
        >
          <Plus className="h-2.5 w-2.5" />
          {t("addBullet")}
        </button>
      </div>
    </SwipeToDelete>
  );
}

export const Experience = memo(function Experience() {
  const {
    data: { experience },
    addExperience,
  } = useCV();
  const t = useTranslations("experience");
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
          />
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={addExperience}
        className="mt-2 h-7 px-2 text-[11px] text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
      >
        <Plus className="mr-1 h-3 w-3" />
        {t("addExperience")}
      </Button>

      {/* Delete confirmation dialog (mobile swipe) */}
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
