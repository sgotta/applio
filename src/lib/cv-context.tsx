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
import type {
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
import { arrayMove } from "@dnd-kit/sortable";
import { moveItem, migrateCVData, migrateSidebarSections } from "./cv-migrations";

interface CVContextValue {
  data: CVData;
  loading: boolean;
  /** Whether localStorage had saved CV data when the app loaded */
  hadSavedData: boolean;
  updatePersonalInfo: (field: string, value: string | undefined) => void;
  updateSummary: (value: string) => void;
  updateExperience: (id: string, updates: Partial<ExperienceItem>) => void;
  addExperience: (afterIndex?: number) => void;
  removeExperience: (id: string) => void;
  moveExperience: (id: string, direction: "up" | "down") => void;
  reorderExperience: (fromIndex: number, toIndex: number) => void;
  updateEducation: (id: string, updates: Partial<EducationItem>) => void;
  addEducation: (afterIndex?: number) => void;
  removeEducation: (id: string) => void;
  moveEducation: (id: string, direction: "up" | "down") => void;
  reorderEducation: (fromIndex: number, toIndex: number) => void;
  updateSkillCategory: (id: string, updates: Partial<SkillCategory>) => void;
  addSkillCategory: (afterIndex?: number) => void;
  removeSkillCategory: (id: string) => void;
  moveSkillCategory: (id: string, direction: "up" | "down") => void;
  reorderSkillCategory: (fromIndex: number, toIndex: number) => void;
  updateCourse: (id: string, updates: Partial<CourseItem>) => void;
  addCourse: (afterIndex?: number) => void;
  removeCourse: (id: string) => void;
  moveCourse: (id: string, direction: "up" | "down") => void;
  reorderCourse: (fromIndex: number, toIndex: number) => void;
  updateCertification: (id: string, updates: Partial<CertificationItem>) => void;
  addCertification: (afterIndex?: number) => void;
  removeCertification: (id: string) => void;
  moveCertification: (id: string, direction: "up" | "down") => void;
  reorderCertification: (fromIndex: number, toIndex: number) => void;
  updateAward: (id: string, updates: Partial<AwardItem>) => void;
  addAward: (afterIndex?: number) => void;
  removeAward: (id: string) => void;
  moveAward: (id: string, direction: "up" | "down") => void;
  reorderAward: (fromIndex: number, toIndex: number) => void;
  toggleSection: (key: keyof SectionVisibility) => void;
  reorderSidebarSection: (fromIndex: number, toIndex: number) => void;
  resetData: () => void;
  importData: (data: CVData) => void;
}

const CVContext = createContext<CVContextValue | null>(null);

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
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
  const [loading, setLoading] = useState(true);
  const [hadSavedData, setHadSavedData] = useState(false);
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
      setHadSavedData(true);
    }
    setLoading(false);
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
        experiences: prev.experiences.map((exp) =>
          exp.id === id ? { ...exp, ...updates } : exp
        ),
      }));
    },
    []
  );

  const addExperience = useCallback((afterIndex?: number) => {
    const newExp: ExperienceItem = {
      id: `exp-${generateId()}`,
      company: tRef.current("company"),
      position: tRef.current("position"),
      startDate: "2024",
      endDate: tRef.current("endDatePresent"),
      description: `<ul><li><p>${tRef.current("experienceDescription")}</p></li></ul>`,
    };
    setData((prev) => {
      if (afterIndex !== undefined) {
        const arr = [...prev.experiences];
        arr.splice(afterIndex + 1, 0, newExp);
        return { ...prev, experiences: arr };
      }
      return { ...prev, experiences: [...prev.experiences, newExp] };
    });
  }, []);

  const removeExperience = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((exp) => exp.id !== id),
    }));
  }, []);

  const moveExperience = useCallback(
    (id: string, direction: "up" | "down") => {
      setData((prev) => {
        const index = prev.experiences.findIndex((exp) => exp.id === id);
        if (index === -1) return prev;
        return {
          ...prev,
          experiences: moveItem(prev.experiences, index, direction),
        };
      });
    },
    []
  );

  const reorderExperience = useCallback((from: number, to: number) => {
    setData((prev) => ({ ...prev, experiences: arrayMove(prev.experiences, from, to) }));
  }, []);

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

  const addEducation = useCallback((afterIndex?: number) => {
    const newEdu: EducationItem = {
      id: `edu-${generateId()}`,
      institution: tRef.current("institution"),
      degree: tRef.current("degree"),
      startDate: "2020",
      endDate: "2024",
    };
    setData((prev) => {
      if (afterIndex !== undefined) {
        const arr = [...prev.education];
        arr.splice(afterIndex + 1, 0, newEdu);
        return { ...prev, education: arr };
      }
      return { ...prev, education: [...prev.education, newEdu] };
    });
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

  const reorderEducation = useCallback((from: number, to: number) => {
    setData((prev) => ({ ...prev, education: arrayMove(prev.education, from, to) }));
  }, []);

  const updateSkillCategory = useCallback(
    (id: string, updates: Partial<SkillCategory>) => {
      setData((prev) => ({
        ...prev,
        skillCategories: prev.skillCategories.map((skill) =>
          skill.id === id ? { ...skill, ...updates } : skill
        ),
      }));
    },
    []
  );

  const addSkillCategory = useCallback((afterIndex?: number) => {
    const newSkill: SkillCategory = {
      id: `skill-${generateId()}`,
      category: tRef.current("category"),
      items: [tRef.current("skill")],
    };
    setData((prev) => {
      if (afterIndex !== undefined) {
        const arr = [...prev.skillCategories];
        arr.splice(afterIndex + 1, 0, newSkill);
        return { ...prev, skillCategories: arr };
      }
      return { ...prev, skillCategories: [...prev.skillCategories, newSkill] };
    });
  }, []);

  const removeSkillCategory = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      skillCategories: prev.skillCategories.filter((skill) => skill.id !== id),
    }));
  }, []);

  const moveSkillCategory = useCallback(
    (id: string, direction: "up" | "down") => {
      setData((prev) => {
        const index = prev.skillCategories.findIndex((s) => s.id === id);
        if (index === -1) return prev;
        return {
          ...prev,
          skillCategories: moveItem(prev.skillCategories, index, direction),
        };
      });
    },
    []
  );

  const reorderSkillCategory = useCallback((from: number, to: number) => {
    setData((prev) => ({ ...prev, skillCategories: arrayMove(prev.skillCategories, from, to) }));
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

  const addCourse = useCallback((afterIndex?: number) => {
    const newCourse: CourseItem = {
      id: `course-${generateId()}`,
      name: tRef.current("courseName"),
      institution: tRef.current("courseInstitution"),
      date: "2024",
    };
    setData((prev) => {
      if (afterIndex !== undefined) {
        const arr = [...prev.courses];
        arr.splice(afterIndex + 1, 0, newCourse);
        return { ...prev, courses: arr };
      }
      return { ...prev, courses: [...prev.courses, newCourse] };
    });
  }, []);

  const removeCourse = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      courses: prev.courses.filter((c) => c.id !== id),
    }));
  }, []);

  const moveCourse = useCallback(
    (id: string, direction: "up" | "down") => {
      setData((prev) => {
        const index = prev.courses.findIndex((c) => c.id === id);
        if (index === -1) return prev;
        return {
          ...prev,
          courses: moveItem(prev.courses, index, direction),
        };
      });
    },
    []
  );

  const reorderCourse = useCallback((from: number, to: number) => {
    setData((prev) => ({ ...prev, courses: arrayMove(prev.courses, from, to) }));
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

  const addCertification = useCallback((afterIndex?: number) => {
    const newCert: CertificationItem = {
      id: `cert-${generateId()}`,
      name: tRef.current("certificationName"),
      issuer: tRef.current("certificationIssuer"),
      date: "2024",
    };
    setData((prev) => {
      if (afterIndex !== undefined) {
        const arr = [...prev.certifications];
        arr.splice(afterIndex + 1, 0, newCert);
        return { ...prev, certifications: arr };
      }
      return { ...prev, certifications: [...prev.certifications, newCert] };
    });
  }, []);

  const removeCertification = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((c) => c.id !== id),
    }));
  }, []);

  const moveCertification = useCallback(
    (id: string, direction: "up" | "down") => {
      setData((prev) => {
        const index = prev.certifications.findIndex((c) => c.id === id);
        if (index === -1) return prev;
        return {
          ...prev,
          certifications: moveItem(prev.certifications, index, direction),
        };
      });
    },
    []
  );

  const reorderCertification = useCallback((from: number, to: number) => {
    setData((prev) => ({ ...prev, certifications: arrayMove(prev.certifications, from, to) }));
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

  const addAward = useCallback((afterIndex?: number) => {
    const newAward: AwardItem = {
      id: `award-${generateId()}`,
      name: tRef.current("awardName"),
      issuer: tRef.current("awardIssuer"),
      date: "2024",
    };
    setData((prev) => {
      if (afterIndex !== undefined) {
        const arr = [...prev.awards];
        arr.splice(afterIndex + 1, 0, newAward);
        return { ...prev, awards: arr };
      }
      return { ...prev, awards: [...prev.awards, newAward] };
    });
  }, []);

  const removeAward = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      awards: prev.awards.filter((a) => a.id !== id),
    }));
  }, []);

  const moveAward = useCallback(
    (id: string, direction: "up" | "down") => {
      setData((prev) => {
        const index = prev.awards.findIndex((a) => a.id === id);
        if (index === -1) return prev;
        return {
          ...prev,
          awards: moveItem(prev.awards, index, direction),
        };
      });
    },
    []
  );

  const reorderAward = useCallback((from: number, to: number) => {
    setData((prev) => ({ ...prev, awards: arrayMove(prev.awards, from, to) }));
  }, []);

  const toggleSection = useCallback((key: keyof SectionVisibility) => {
    setData((prev) => {
      const willBeVisible = !prev.visibility[key];
      const next = {
        ...prev,
        visibility: { ...prev.visibility, [key]: willBeVisible },
      };
      // Seed first entry when enabling an empty optional section
      if (willBeVisible) {
        if (key === "courses" && prev.courses.length === 0) {
          next.courses = [{ id: `course-${generateId()}`, name: tRef.current("courseName"), institution: tRef.current("courseInstitution"), date: "2024" }];
        } else if (key === "certifications" && prev.certifications.length === 0) {
          next.certifications = [{ id: `cert-${generateId()}`, name: tRef.current("certificationName"), issuer: tRef.current("certificationIssuer"), date: "2024" }];
        } else if (key === "awards" && prev.awards.length === 0) {
          next.awards = [{ id: `award-${generateId()}`, name: tRef.current("awardName"), issuer: tRef.current("awardIssuer"), date: "2024" }];
        }
      }
      return next;
    });
  }, []);

  const reorderSidebarSection = useCallback((from: number, to: number) => {
    setData((prev) => ({
      ...prev,
      sidebarSections: arrayMove(prev.sidebarSections, from, to),
    }));
  }, []);

  const resetData = useCallback(() => {
    setData(getDefaultCVData(localeRef.current));
  }, []);

  const importData = useCallback((imported: CVData) => {
    const migrated = migrateCVData(imported);
    setData({
      ...migrated,
      visibility: { ...defaultVisibility, ...migrated.visibility },
      sidebarSections: migrateSidebarSections(migrated.sidebarSections),
    });
  }, []);

  return (
    <CVContext.Provider
      value={{
        data,
        loading,
        hadSavedData,
        updatePersonalInfo,
        updateSummary,
        updateExperience,
        addExperience,
        removeExperience,
        moveExperience,
        reorderExperience,
        updateEducation,
        addEducation,
        removeEducation,
        moveEducation,
        reorderEducation,
        updateSkillCategory,
        addSkillCategory,
        removeSkillCategory,
        moveSkillCategory,
        reorderSkillCategory,
        updateCourse,
        addCourse,
        removeCourse,
        moveCourse,
        reorderCourse,
        updateCertification,
        addCertification,
        removeCertification,
        moveCertification,
        reorderCertification,
        updateAward,
        addAward,
        removeAward,
        moveAward,
        reorderAward,
        toggleSection,
        reorderSidebarSection,
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
