"use client";

import React, { memo } from "react";
import { useCV } from "@/lib/cv-context";
import { useTranslations } from "next-intl";
import { useColorScheme } from "@/lib/color-scheme-context";
import { ExperienceItem } from "@/lib/types";
import { EditableText } from "./EditableText";
import { SectionTitle } from "./SectionTitle";
import { Button } from "@/components/ui/button";
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
        className="opacity-0 group-hover/bullet:opacity-100 mt-0.5 p-0.5 rounded hover:bg-gray-100 dark:hover:bg-accent transition-opacity duration-150 flex-shrink-0"
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
}: {
  exp: ExperienceItem;
  isFirst: boolean;
  isLast: boolean;
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

  return (
    <div className="group/exp relative rounded-sm transition-colors duration-150 -mx-1.5 px-1.5 py-1 hover:bg-gray-50/50 dark:hover:bg-accent/50">
      {/* Action buttons — visible on hover */}
      <div className="absolute -right-1 top-1 flex items-center gap-0.5 opacity-0 group-hover/exp:opacity-100 transition-opacity duration-150">
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
  );
}

export const Experience = memo(function Experience() {
  const {
    data: { experience },
    addExperience,
  } = useCV();
  const t = useTranslations("experience");

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
    </div>
  );
});
