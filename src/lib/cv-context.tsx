"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  CVData,
  ExperienceItem,
  EducationItem,
  SkillCategory,
  CourseItem,
  CertificationItem,
  AwardItem,
  SectionVisibility,
} from "./types";
import { getDefaultCVData, defaultVisibility } from "./default-data";
import { loadCVData, saveCVData } from "./storage";

interface CVContextValue {
  data: CVData;
  updatePersonalInfo: (field: string, value: string | undefined) => void;
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
  updateCourse: (id: string, updates: Partial<CourseItem>) => void;
  addCourse: () => void;
  removeCourse: (id: string) => void;
  updateCertification: (id: string, updates: Partial<CertificationItem>) => void;
  addCertification: () => void;
  removeCertification: (id: string) => void;
  updateAward: (id: string, updates: Partial<AwardItem>) => void;
  addAward: () => void;
  removeAward: (id: string) => void;
  toggleSection: (key: keyof SectionVisibility) => void;
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

// Migración: si los datos guardados tienen el formato viejo (contacts array), convertir a campos individuales
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateCVData(data: any): CVData {
  const personalInfo = data.personalInfo || {};

  // Si tiene contacts array (formato viejo), extraer los valores
  if (Array.isArray(personalInfo.contacts)) {
    const contacts = personalInfo.contacts;
    const findContact = (type: string) =>
      contacts.find((c: { type: string }) => c.type === type)?.value || "";

    return {
      personalInfo: {
        fullName: personalInfo.fullName || "",
        title: personalInfo.title || "",
        photo: personalInfo.photo,
        email: findContact("email") || personalInfo.email || "",
        phone: findContact("phone") || personalInfo.phone || "",
        location: findContact("location") || personalInfo.location || "",
        linkedin: findContact("linkedin") || personalInfo.linkedin || "",
        website: findContact("website") || personalInfo.website || "",
      },
      summary: data.summary || "",
      experience: data.experience || [],
      education: data.education || [],
      skills: data.skills || [],
      courses: data.courses || [],
      certifications: data.certifications || [],
      awards: data.awards || [],
      visibility: { ...defaultVisibility, ...data.visibility },
    };
  }

  // Already in new format, just ensure all fields exist
  return {
    personalInfo: {
      fullName: personalInfo.fullName || "",
      title: personalInfo.title || "",
      photo: personalInfo.photo,
      email: personalInfo.email || "",
      phone: personalInfo.phone || "",
      location: personalInfo.location || "",
      linkedin: personalInfo.linkedin || "",
      website: personalInfo.website || "",
    },
    summary: data.summary || "",
    experience: data.experience || [],
    education: data.education || [],
    skills: data.skills || [],
    courses: data.courses || [],
    certifications: data.certifications || [],
    awards: data.awards || [],
    visibility: { ...defaultVisibility, ...data.visibility },
  };
}

export function CVProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const t = useTranslations("defaults");
  const tRef = useRef(t);
  const localeRef = useRef(locale);

  useEffect(() => {
    tRef.current = t;
    localeRef.current = locale;
  }, [t, locale]);

  const [data, setData] = useState<CVData>(() => getDefaultCVData(locale));
  const initialized = useRef(false);

  // Load from localStorage on mount (useEffect is correct here to avoid SSR hydration mismatch)
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const saved = loadCVData();
    if (saved) {
      const migrated = migrateCVData(saved);
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
      company: tRef.current("company"),
      position: tRef.current("position"),
      startDate: "2024",
      endDate: tRef.current("endDatePresent"),
      description: [tRef.current("experienceDescription")],
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
      institution: tRef.current("institution"),
      degree: tRef.current("degree"),
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
      category: tRef.current("category"),
      items: [tRef.current("skill")],
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

  const updateCourse = useCallback(
    (id: string, updates: Partial<CourseItem>) => {
      setData((prev) => ({
        ...prev,
        courses: prev.courses.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      }));
    },
    []
  );

  const addCourse = useCallback(() => {
    const newCourse: CourseItem = {
      id: `course-${generateId()}`,
      name: tRef.current("courseName"),
      institution: tRef.current("courseInstitution"),
      date: "2024",
    };
    setData((prev) => ({
      ...prev,
      courses: [...prev.courses, newCourse],
    }));
  }, []);

  const removeCourse = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      courses: prev.courses.filter((c) => c.id !== id),
    }));
  }, []);

  const updateCertification = useCallback(
    (id: string, updates: Partial<CertificationItem>) => {
      setData((prev) => ({
        ...prev,
        certifications: prev.certifications.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      }));
    },
    []
  );

  const addCertification = useCallback(() => {
    const newCert: CertificationItem = {
      id: `cert-${generateId()}`,
      name: tRef.current("certificationName"),
      issuer: tRef.current("certificationIssuer"),
      date: "2024",
    };
    setData((prev) => ({
      ...prev,
      certifications: [...prev.certifications, newCert],
    }));
  }, []);

  const removeCertification = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((c) => c.id !== id),
    }));
  }, []);

  const updateAward = useCallback(
    (id: string, updates: Partial<AwardItem>) => {
      setData((prev) => ({
        ...prev,
        awards: prev.awards.map((a) =>
          a.id === id ? { ...a, ...updates } : a
        ),
      }));
    },
    []
  );

  const addAward = useCallback(() => {
    const newAward: AwardItem = {
      id: `award-${generateId()}`,
      name: tRef.current("awardName"),
      issuer: tRef.current("awardIssuer"),
      date: "2024",
    };
    setData((prev) => ({
      ...prev,
      awards: [...prev.awards, newAward],
    }));
  }, []);

  const removeAward = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      awards: prev.awards.filter((a) => a.id !== id),
    }));
  }, []);

  const toggleSection = useCallback((key: keyof SectionVisibility) => {
    setData((prev) => ({
      ...prev,
      visibility: { ...prev.visibility, [key]: !prev.visibility[key] },
    }));
  }, []);

  const resetData = useCallback(() => {
    setData(getDefaultCVData(localeRef.current));
  }, []);

  const importData = useCallback((imported: CVData) => {
    setData(imported);
  }, []);

  return (
    <CVContext.Provider
      value={{
        data,
        updatePersonalInfo,
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
        updateCourse,
        addCourse,
        removeCourse,
        updateCertification,
        addCertification,
        removeCertification,
        updateAward,
        addAward,
        removeAward,
        toggleSection,
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
