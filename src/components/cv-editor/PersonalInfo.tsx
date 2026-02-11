"use client";

import { memo } from "react";
import { useCV } from "@/lib/cv-context";
import { useTranslations } from "next-intl";
import { EditableText } from "./EditableText";
import { SectionTitle } from "./SectionTitle";
import { ProfilePhotoUpload } from "./ProfilePhotoUpload";
import { Button } from "@/components/ui/button";
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
      <Icon className="h-3 w-3 shrink-0 text-gray-400" />
      <EditableText
        value={value}
        onChange={(v) => onChange(field, v)}
        as="tiny"
        className="!text-[11px] !text-gray-600"
        placeholder={placeholder}
      />
    </div>
  );
}

function SkillBadge({
  value,
  onChange,
  onRemove,
  skillPlaceholder,
  deleteAriaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  onRemove: () => void;
  skillPlaceholder: string;
  deleteAriaLabel: string;
}) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded bg-gray-100 pl-2 pr-0.5 py-0.5 group/badge">
      <EditableText
        value={value}
        onChange={onChange}
        as="tiny"
        className="!text-[10px] !text-gray-700"
        placeholder={skillPlaceholder}
      />
      <button
        onClick={onRemove}
        className="opacity-0 group-hover/badge:opacity-100 p-0.5 rounded hover:bg-gray-200 transition-opacity duration-150"
        aria-label={deleteAriaLabel}
      >
        <X className="h-2.5 w-2.5 text-gray-400" />
      </button>
    </span>
  );
}

export const PersonalInfo = memo(function PersonalInfo() {
  const {
    data: { personalInfo, summary, skills },
    updatePersonalInfo,
    updateSummary,
    updateSkillCategory,
    addSkillCategory,
    removeSkillCategory,
  } = useCV();
  const t = useTranslations("personalInfo");

  return (
    <div className="space-y-5">
      {/* Profile photo upload */}
      <ProfilePhotoUpload
        currentPhoto={personalInfo.photo}
        fullName={personalInfo.fullName}
        onPhotoChange={(photo) => updatePersonalInfo("photo", photo)}
      />

      {/* Contact */}
      <div className="space-y-2">
        <SectionTitle>{t("contact")}</SectionTitle>
        <div className="space-y-1.5">
          <ContactLine
            icon={Mail}
            value={personalInfo.email}
            field="email"
            placeholder={t("emailPlaceholder")}
            onChange={(f, v) => updatePersonalInfo(f, v)}
          />
          <ContactLine
            icon={Phone}
            value={personalInfo.phone}
            field="phone"
            placeholder={t("phonePlaceholder")}
            onChange={(f, v) => updatePersonalInfo(f, v)}
          />
          <ContactLine
            icon={MapPin}
            value={personalInfo.location}
            field="location"
            placeholder={t("locationPlaceholder")}
            onChange={(f, v) => updatePersonalInfo(f, v)}
          />
          <ContactLine
            icon={Linkedin}
            value={personalInfo.linkedin}
            field="linkedin"
            placeholder={t("linkedinPlaceholder")}
            onChange={(f, v) => updatePersonalInfo(f, v)}
          />
          <ContactLine
            icon={Globe}
            value={personalInfo.website}
            field="website"
            placeholder={t("websitePlaceholder")}
            onChange={(f, v) => updatePersonalInfo(f, v)}
          />
        </div>
      </div>

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
              <div className="flex items-center gap-1 mb-1">
                <EditableText
                  value={skillGroup.category}
                  onChange={(v) =>
                    updateSkillCategory(skillGroup.id, { category: v })
                  }
                  as="tiny"
                  className="!font-semibold !uppercase !tracking-wide !text-gray-500"
                  placeholder={t("categoryPlaceholder")}
                />
                <button
                  onClick={() => removeSkillCategory(skillGroup.id)}
                  className="opacity-0 group-hover/skillcat:opacity-100 p-0.5 rounded hover:bg-gray-200 transition-opacity duration-150"
                  aria-label={t("deleteCategoryAriaLabel", { category: skillGroup.category })}
                >
                  <X className="h-3 w-3 text-gray-400" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {skillGroup.items.map((item, i) => (
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
                    onRemove={() => {
                      const newItems = skillGroup.items.filter(
                        (_, idx) => idx !== i
                      );
                      updateSkillCategory(skillGroup.id, { items: newItems });
                    }}
                  />
                ))}
                <button
                  onClick={() =>
                    updateSkillCategory(skillGroup.id, {
                      items: [...skillGroup.items, "Skill"],
                    })
                  }
                  className="inline-flex items-center gap-0.5 rounded border border-dashed border-gray-300 px-2 py-0.5 text-[10px] text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors duration-150"
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
            className="h-6 px-2 text-[10px] text-gray-400 hover:text-gray-600"
          >
            <Plus className="mr-1 h-3 w-3" />
            {t("addCategory")}
          </Button>
        </div>
      </div>
    </div>
  );
});
