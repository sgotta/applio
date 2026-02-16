"use client";

import React, { memo, useState } from "react";
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
import { Plus, Trash2, ChevronUp, ChevronDown, X, Heading, Heading2, List, MessageSquareText, GripVertical } from "lucide-react";

const BULLET_TYPE_CONFIG: Record<BulletItem["type"], { icon: typeof List; as: "itemTitle" | "body" | "small"; className?: string }> = {
  bullet:   { icon: List,              as: "body" },
  title:    { icon: Heading,           as: "itemTitle" },
  subtitle: { icon: Heading2,          as: "body",  className: "!font-medium !text-gray-800" },
  comment:  { icon: MessageSquareText, as: "small", className: "!italic !text-gray-400" },
};

function EditableBullet({
  bullet,
  onChange,
  onRemove,
  onSetType,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  bulletPlaceholder,
  deleteAriaLabel,
  bulletColor,
  typeLabels,
}: {
  bullet: BulletItem;
  onChange: (v: string) => void;
  onRemove: () => void;
  onSetType: (type: BulletItem["type"]) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  bulletPlaceholder: string;
  deleteAriaLabel: string;
  bulletColor: string;
  typeLabels: Record<BulletItem["type"], string>;
}) {
  const isBullet = bullet.type === "bullet";
  const config = BULLET_TYPE_CONFIG[bullet.type];
  const [menuOpen, setMenuOpen] = useState(false);
  const viewMode = useIsViewMode();

  return (
    <li className={`flex items-start gap-1 group/bullet ${bullet.type === "title" ? "mt-2 first:mt-0" : ""}`}>
      {/* Grip handle — type menu trigger (all types) */}
      {!viewMode && (
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <button className="mt-0.5 p-0.5 rounded transition-colors hover:bg-gray-100 shrink-0">
              <GripVertical className="h-3 w-3 text-gray-300" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-1" align="start" side="left">
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
          </PopoverContent>
        </Popover>
      )}
      {/* Bullet dot (decorative, only for bullet type) */}
      {isBullet && (
        <span className="text-[0.917em] select-none mt-0.5 shrink-0" style={{ color: bulletColor }}>&bull;</span>
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
        <div className="flex items-center can-hover:opacity-0 can-hover:group-hover/bullet:opacity-100 transition-opacity duration-150 shrink-0">
          {!isFirst && (
            <button
              onClick={onMoveUp}
              className="mt-0.5 p-0.5 rounded hover:bg-gray-100"
            >
              <ChevronUp className="h-3 w-3 text-gray-400" />
            </button>
          )}
          {!isLast && (
            <button
              onClick={onMoveDown}
              className="mt-0.5 p-0.5 rounded hover:bg-gray-100"
            >
              <ChevronDown className="h-3 w-3 text-gray-400" />
            </button>
          )}
          <button
            onClick={onRemove}
            className="mt-0.5 p-0.5 rounded hover:bg-gray-100"
            aria-label={deleteAriaLabel}
          >
            <X className="h-3 w-3 text-gray-400" />
          </button>
        </div>
      )}
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

  const moveBullet = (index: number, direction: "up" | "down") => {
    const newDesc = [...exp.description];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= newDesc.length) return;
    [newDesc[index], newDesc[target]] = [newDesc[target], newDesc[index]];
    updateExperience(exp.id, { description: newDesc });
  };

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
      <div className="flex items-baseline justify-between gap-2 pr-16">
        <EditableText
          value={exp.company}
          onChange={(v) => updateExperience(exp.id, { company: v })}
          as="itemTitle"
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
        as="subheading"
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

      {/* Bullet points */}
      <ul className="mt-1.5 space-y-1">
        {exp.description.map((bullet, i) => (
          <EditableBullet
            key={i}
            bullet={bullet}
            onChange={(v) => updateBullet(i, v)}
            onRemove={() => removeBullet(i)}
            onSetType={(type) => setBulletType(i, type)}
            onMoveUp={() => moveBullet(i, "up")}
            onMoveDown={() => moveBullet(i, "down")}
            isFirst={i === 0}
            isLast={i === exp.description.length - 1}
            bulletPlaceholder={t("bulletPlaceholder")}
            deleteAriaLabel={t("deleteBullet")}
            bulletColor={colorScheme.bullet}
            typeLabels={{
              bullet: t("typeBullet"),
              title: t("typeTitle"),
              subtitle: t("typeSubtitle"),
              comment: t("typeComment"),
            }}
          />
        ))}
      </ul>

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
