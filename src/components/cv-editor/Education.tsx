"use client";

import React, { memo, useState } from "react";
import { useCV } from "@/lib/cv-context";
import { useTranslations } from "next-intl";
import { EducationItem } from "@/lib/types";
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
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";

function EducationCard({
  edu,
  isFirst,
  isLast,
  onRequestDelete,
}: {
  edu: EducationItem;
  isFirst: boolean;
  isLast: boolean;
  onRequestDelete: (message: string, onConfirm: () => void) => void;
}) {
  const { updateEducation, removeEducation, moveEducation } = useCV();
  const t = useTranslations("education");

  const handleDelete = () => {
    const label = edu.institution.trim() || edu.degree.trim();
    onRequestDelete(
      label
        ? t("confirmDeleteEducation", { name: label })
        : t("confirmDeleteEducationEmpty"),
      () => removeEducation(edu.id)
    );
  };

  return (
    <div className="group/edu relative rounded-sm transition-colors duration-150 -mx-1.5 px-1.5 py-1 hover:bg-gray-50/50 dark:hover:bg-accent/50">
      {/* Action buttons — always visible on mobile, hover-reveal on desktop */}
      <div className="absolute -right-1 top-1 flex items-center gap-0.5 can-hover:opacity-0 can-hover:group-hover/edu:opacity-100 transition-opacity duration-150">
        {!isFirst && (
          <button
            onClick={() => moveEducation(edu.id, "up")}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-muted transition-colors"
            aria-label={t("moveUp")}
          >
            <ChevronUp className="h-3 w-3 text-gray-400 dark:text-gray-500" />
          </button>
        )}
        {!isLast && (
          <button
            onClick={() => moveEducation(edu.id, "down")}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-muted transition-colors"
            aria-label={t("moveDown")}
          >
            <ChevronDown className="h-3 w-3 text-gray-400 dark:text-gray-500" />
          </button>
        )}
        <button
          onClick={handleDelete}
          className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          aria-label={t("deleteEducation")}
        >
          <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-500" />
        </button>
      </div>

      {/* Institution + dates */}
      <div className="flex items-baseline justify-between gap-2 pr-16">
        <EditableText
          value={edu.institution}
          onChange={(v) => updateEducation(edu.id, { institution: v })}
          as="itemTitle"
          placeholder={t("institutionPlaceholder")}
        />
        <div className="flex items-baseline gap-1 flex-shrink-0">
          <EditableText
            value={edu.startDate}
            onChange={(v) => updateEducation(edu.id, { startDate: v })}
            as="tiny"
            placeholder={t("startDatePlaceholder")}
          />
          <span className="text-[10px] text-gray-400 dark:text-gray-500">—</span>
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
        className="!font-medium !text-gray-500 dark:text-gray-400!"
        placeholder={t("degreePlaceholder")}
      />

      {/* Description (optional) */}
      <div className="mt-1">
        <EditableText
          value={edu.description || ""}
          onChange={(v) => updateEducation(edu.id, { description: v })}
          as="body"
          placeholder={t("descriptionPlaceholder")}
        />
      </div>
    </div>
  );
}

export const Education = memo(function Education() {
  const {
    data: { education },
    addEducation,
  } = useCV();
  const t = useTranslations("education");
  const [pendingDelete, setPendingDelete] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  return (
    <div>
      <SectionTitle>{t("title")}</SectionTitle>
      <div className="space-y-3">
        {education.map((edu, i) => (
          <EducationCard
            key={edu.id}
            edu={edu}
            isFirst={i === 0}
            isLast={i === education.length - 1}
            onRequestDelete={(message, onConfirm) =>
              setPendingDelete({ message, onConfirm })
            }
          />
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={addEducation}
        className="mt-2 h-7 px-2 text-[11px] text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
      >
        <Plus className="mr-1 h-3 w-3" />
        {t("addEducation")}
      </Button>

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
