"use client";

import { memo } from "react";
import { useCV } from "@/lib/cv-context";
import { EditableText } from "./EditableText";
import { EditableContact } from "./EditableContact";
import { SectionTitle } from "./SectionTitle";
import { ProfilePhotoUpload } from "./ProfilePhotoUpload";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

function SkillBadge({
  value,
  onChange,
  onRemove,
}: {
  value: string;
  onChange: (v: string) => void;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded bg-gray-100 pl-2 pr-0.5 py-0.5 group/badge">
      <EditableText
        value={value}
        onChange={onChange}
        as="tiny"
        className="!text-[10px] !text-gray-700"
        placeholder="skill"
      />
      <button
        onClick={onRemove}
        className="opacity-0 group-hover/badge:opacity-100 p-0.5 rounded hover:bg-gray-200 transition-opacity duration-150"
        aria-label={`Eliminar ${value}`}
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
    updateContact,
    addContact,
    removeContact,
    updateSummary,
    updateSkillCategory,
    addSkillCategory,
    removeSkillCategory,
  } = useCV();

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
        <SectionTitle>Contacto</SectionTitle>
        <div className="space-y-1">
          {personalInfo.contacts.map((contact) => (
            <EditableContact
              key={contact.id}
              contact={contact}
              onChange={(updated) => updateContact(contact.id, updated)}
              onRemove={() => removeContact(contact.id)}
            />
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={addContact}
            className="h-6 px-2 text-[10px] text-gray-400 hover:text-gray-600 w-full justify-start"
          >
            <Plus className="mr-1 h-3 w-3" />
            Agregar contacto
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div>
        <SectionTitle>Sobre mí</SectionTitle>
        <EditableText
          value={summary}
          onChange={updateSummary}
          placeholder="Escribí un resumen profesional..."
          multiline
          as="body"
        />
      </div>

      {/* Skills */}
      <div>
        <SectionTitle>Habilidades</SectionTitle>
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
                  placeholder="Categoría"
                />
                <button
                  onClick={() => removeSkillCategory(skillGroup.id)}
                  className="opacity-0 group-hover/skillcat:opacity-100 p-0.5 rounded hover:bg-gray-200 transition-opacity duration-150"
                  aria-label={`Eliminar categoría ${skillGroup.category}`}
                >
                  <X className="h-3 w-3 text-gray-400" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {skillGroup.items.map((item, i) => (
                  <SkillBadge
                    key={i}
                    value={item}
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
            Agregar categoría
          </Button>
        </div>
      </div>
    </div>
  );
});
