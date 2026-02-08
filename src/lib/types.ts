export interface ContactItem {
  id: string;
  type: "email" | "phone" | "location" | "linkedin" | "website" | "custom";
  label: string;
  value: string;
  icon?: string;
}

export interface PersonalInfo {
  fullName: string;
  title: string;
  photo?: string;
  contacts: ContactItem[];
  // Legacy fields for migration (optional)
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  website?: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  startDate: string;
  endDate: string;
  description?: string;
}

export interface SkillCategory {
  id: string;
  category: string;
  items: string[];
}

export interface CustomSectionItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
}

export interface CustomSection {
  id: string;
  type: "courses" | "certifications" | "awards" | "publications" | "custom";
  title: string;
  placement: "left" | "right";
  items: CustomSectionItem[];
}

export interface CVData {
  personalInfo: PersonalInfo;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillCategory[];
  customSections: CustomSection[];
}
