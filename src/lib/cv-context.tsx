"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  CVData,
  ExperienceItem,
  EducationItem,
  SkillCategory,
  ContactItem,
  PersonalInfo,
  CustomSection,
  CustomSectionItem,
} from "./types";
import { defaultCVData } from "./default-data";
import { loadCVData, saveCVData } from "./storage";

interface CVContextValue {
  data: CVData;
  updatePersonalInfo: (field: string, value: string | undefined) => void;
  updateContact: (id: string, updates: Partial<ContactItem>) => void;
  addContact: () => void;
  removeContact: (id: string) => void;
  updateSummary: (value: string) => void;
  updateExperience: (id: string, updates: Partial<ExperienceItem>) => void;
  addExperience: () => void;
  removeExperience: (id: string) => void;
  moveExperience: (id: string, direction: "up" | "down") => void;
  updateEducation: (id: string, updates: Partial<EducationItem>) => void;
  addEducation: () => void;
  removeEducation: (id: string) => void;
  moveEducation: (id: string, direction: "up" | "down") => void;
  updateSkillCategory: (id: string, updates: Partial<SkillCategory>) => void;
  addSkillCategory: () => void;
  removeSkillCategory: (id: string) => void;
  addCustomSection: (
    type: CustomSection["type"],
    title: string,
    placement: "left" | "right"
  ) => void;
  updateCustomSection: (id: string, updates: Partial<CustomSection>) => void;
  removeCustomSection: (id: string) => void;
  addCustomSectionItem: (sectionId: string) => void;
  updateCustomSectionItem: (
    sectionId: string,
    itemId: string,
    updates: Partial<CustomSectionItem>
  ) => void;
  removeCustomSectionItem: (sectionId: string, itemId: string) => void;
  resetData: () => void;
  importData: (data: CVData) => void;
}

const CVContext = createContext<CVContextValue | null>(null);

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function moveItem<T>(arr: T[], index: number, direction: "up" | "down"): T[] {
  const newArr = [...arr];
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= newArr.length) return newArr;
  [newArr[index], newArr[targetIndex]] = [newArr[targetIndex], newArr[index]];
  return newArr;
}

// Migración de formato viejo a nuevo
function migratePersonalInfo(oldData: any): PersonalInfo {
  // Si ya tiene el formato nuevo (contacts array), retornar tal cual
  if (Array.isArray(oldData.contacts)) {
    return oldData as PersonalInfo;
  }

  // Convertir formato viejo a nuevo
  const contacts: ContactItem[] = [];
  let idCounter = 1;

  if (oldData.email) {
    contacts.push({
      id: `contact-${idCounter++}`,
      type: "email",
      label: "Email",
      value: oldData.email,
      icon: "Mail",
    });
  }

  if (oldData.phone) {
    contacts.push({
      id: `contact-${idCounter++}`,
      type: "phone",
      label: "Teléfono",
      value: oldData.phone,
      icon: "Phone",
    });
  }

  if (oldData.location) {
    contacts.push({
      id: `contact-${idCounter++}`,
      type: "location",
      label: "Ubicación",
      value: oldData.location,
      icon: "MapPin",
    });
  }

  if (oldData.linkedin) {
    contacts.push({
      id: `contact-${idCounter++}`,
      type: "linkedin",
      label: "LinkedIn",
      value: oldData.linkedin,
      icon: "Linkedin",
    });
  }

  if (oldData.website) {
    contacts.push({
      id: `contact-${idCounter++}`,
      type: "website",
      label: "Sitio web",
      value: oldData.website,
      icon: "Globe",
    });
  }

  return {
    fullName: oldData.fullName || "",
    title: oldData.title || "",
    photo: oldData.photo,
    contacts,
  };
}

function migrateCVData(data: any): CVData {
  return {
    ...data,
    personalInfo: migratePersonalInfo(data.personalInfo),
    customSections: data.customSections || [],
  };
}

export function CVProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<CVData>(defaultCVData);
  const initialized = useRef(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const saved = loadCVData();
    if (saved) {
      // Aplicar migración si es necesario
      const migrated = migrateCVData(saved);
      setData(migrated);
    }
  }, []);

  // Auto-save on changes (debounced)
  useEffect(() => {
    if (!initialized.current) return;
    const timeout = setTimeout(() => saveCVData(data), 500);
    return () => clearTimeout(timeout);
  }, [data]);

  const updatePersonalInfo = useCallback((field: string, value: string | undefined) => {
    setData((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value },
    }));
  }, []);

  const updateContact = useCallback(
    (id: string, updates: Partial<ContactItem>) => {
      setData((prev) => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          contacts: prev.personalInfo.contacts.map((contact) =>
            contact.id === id ? { ...contact, ...updates } : contact
          ),
        },
      }));
    },
    []
  );

  const addContact = useCallback(() => {
    const newContact: ContactItem = {
      id: `contact-${generateId()}`,
      type: "custom",
      label: "Nuevo contacto",
      value: "",
      icon: "Link",
    };
    setData((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        contacts: [...prev.personalInfo.contacts, newContact],
      },
    }));
  }, []);

  const removeContact = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        contacts: prev.personalInfo.contacts.filter(
          (contact) => contact.id !== id
        ),
      },
    }));
  }, []);

  const updateSummary = useCallback((value: string) => {
    setData((prev) => ({ ...prev, summary: value }));
  }, []);

  const updateExperience = useCallback(
    (id: string, updates: Partial<ExperienceItem>) => {
      setData((prev) => ({
        ...prev,
        experience: prev.experience.map((exp) =>
          exp.id === id ? { ...exp, ...updates } : exp
        ),
      }));
    },
    []
  );

  const addExperience = useCallback(() => {
    const newExp: ExperienceItem = {
      id: `exp-${generateId()}`,
      company: "Empresa",
      position: "Puesto",
      startDate: "2024",
      endDate: "Actualidad",
      description: ["Descripción de responsabilidades y logros."],
    };
    setData((prev) => ({
      ...prev,
      experience: [...prev.experience, newExp],
    }));
  }, []);

  const removeExperience = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      experience: prev.experience.filter((exp) => exp.id !== id),
    }));
  }, []);

  const moveExperience = useCallback(
    (id: string, direction: "up" | "down") => {
      setData((prev) => {
        const index = prev.experience.findIndex((exp) => exp.id === id);
        if (index === -1) return prev;
        return {
          ...prev,
          experience: moveItem(prev.experience, index, direction),
        };
      });
    },
    []
  );

  const updateEducation = useCallback(
    (id: string, updates: Partial<EducationItem>) => {
      setData((prev) => ({
        ...prev,
        education: prev.education.map((edu) =>
          edu.id === id ? { ...edu, ...updates } : edu
        ),
      }));
    },
    []
  );

  const addEducation = useCallback(() => {
    const newEdu: EducationItem = {
      id: `edu-${generateId()}`,
      institution: "Institución",
      degree: "Título",
      startDate: "2020",
      endDate: "2024",
    };
    setData((prev) => ({
      ...prev,
      education: [...prev.education, newEdu],
    }));
  }, []);

  const removeEducation = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      education: prev.education.filter((edu) => edu.id !== id),
    }));
  }, []);

  const moveEducation = useCallback(
    (id: string, direction: "up" | "down") => {
      setData((prev) => {
        const index = prev.education.findIndex((edu) => edu.id === id);
        if (index === -1) return prev;
        return {
          ...prev,
          education: moveItem(prev.education, index, direction),
        };
      });
    },
    []
  );

  const updateSkillCategory = useCallback(
    (id: string, updates: Partial<SkillCategory>) => {
      setData((prev) => ({
        ...prev,
        skills: prev.skills.map((skill) =>
          skill.id === id ? { ...skill, ...updates } : skill
        ),
      }));
    },
    []
  );

  const addSkillCategory = useCallback(() => {
    const newSkill: SkillCategory = {
      id: `skill-${generateId()}`,
      category: "Categoría",
      items: ["Habilidad 1"],
    };
    setData((prev) => ({
      ...prev,
      skills: [...prev.skills, newSkill],
    }));
  }, []);

  const removeSkillCategory = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill.id !== id),
    }));
  }, []);

  const addCustomSection = useCallback(
    (
      type: CustomSection["type"],
      title: string,
      placement: "left" | "right"
    ) => {
      const newSection: CustomSection = {
        id: `section-${generateId()}`,
        type,
        title,
        placement,
        items: [],
      };
      setData((prev) => ({
        ...prev,
        customSections: [...prev.customSections, newSection],
      }));
    },
    []
  );

  const updateCustomSection = useCallback(
    (id: string, updates: Partial<CustomSection>) => {
      setData((prev) => ({
        ...prev,
        customSections: prev.customSections.map((section) =>
          section.id === id ? { ...section, ...updates } : section
        ),
      }));
    },
    []
  );

  const removeCustomSection = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      customSections: prev.customSections.filter(
        (section) => section.id !== id
      ),
    }));
  }, []);

  const addCustomSectionItem = useCallback((sectionId: string) => {
    const newItem: CustomSectionItem = {
      id: `item-${generateId()}`,
      title: "Nuevo item",
      subtitle: "",
      description: "",
    };
    setData((prev) => ({
      ...prev,
      customSections: prev.customSections.map((section) =>
        section.id === sectionId
          ? { ...section, items: [...section.items, newItem] }
          : section
      ),
    }));
  }, []);

  const updateCustomSectionItem = useCallback(
    (sectionId: string, itemId: string, updates: Partial<CustomSectionItem>) => {
      setData((prev) => ({
        ...prev,
        customSections: prev.customSections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                items: section.items.map((item) =>
                  item.id === itemId ? { ...item, ...updates } : item
                ),
              }
            : section
        ),
      }));
    },
    []
  );

  const removeCustomSectionItem = useCallback(
    (sectionId: string, itemId: string) => {
      setData((prev) => ({
        ...prev,
        customSections: prev.customSections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                items: section.items.filter((item) => item.id !== itemId),
              }
            : section
        ),
      }));
    },
    []
  );

  const resetData = useCallback(() => {
    setData(defaultCVData);
  }, []);

  const importData = useCallback((imported: CVData) => {
    setData(imported);
  }, []);

  return (
    <CVContext.Provider
      value={{
        data,
        updatePersonalInfo,
        updateContact,
        addContact,
        removeContact,
        updateSummary,
        updateExperience,
        addExperience,
        removeExperience,
        moveExperience,
        updateEducation,
        addEducation,
        removeEducation,
        moveEducation,
        updateSkillCategory,
        addSkillCategory,
        removeSkillCategory,
        addCustomSection,
        updateCustomSection,
        removeCustomSection,
        addCustomSectionItem,
        updateCustomSectionItem,
        removeCustomSectionItem,
        resetData,
        importData,
      }}
    >
      {children}
    </CVContext.Provider>
  );
}

export function useCV(): CVContextValue {
  const context = useContext(CVContext);
  if (!context) {
    throw new Error("useCV must be used within a CVProvider");
  }
  return context;
}
