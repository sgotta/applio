export interface PersonalInfo {
  fullName: string;
  jobTitle: string;
  photoUrl?: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  linkedinUrl?: string;
  websiteUrl?: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
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

export interface CourseItem {
  id: string;
  name: string;
  institution: string;
  date: string;
  description?: string;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  description?: string;
}

export interface AwardItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  description?: string;
}

export interface LanguageItem {
  id: string;
  language: string;
  level: string;
}

export type SidebarSectionId = "contact" | "summary" | "skills" | "languages";

export type TemplateId = "classic" | "noPhoto" | "executive" | "modern" | "timeline";

export interface SectionVisibility {
  location: boolean;
  linkedin: boolean;
  website: boolean;
  summary: boolean;
  courses: boolean;
  certifications: boolean;
  awards: boolean;
  languages: boolean;
}

export interface CVData {
  personalInfo: PersonalInfo;
  summary: string;
  experiences: ExperienceItem[];
  education: EducationItem[];
  skillCategories: SkillCategory[];
  courses: CourseItem[];
  certifications: CertificationItem[];
  awards: AwardItem[];
  languages: LanguageItem[];
  visibility: SectionVisibility;
  sidebarSections: SidebarSectionId[];
  templateId?: TemplateId;
}

/** Shape of the settings stored alongside a CV in the cloud */
export interface CloudSettings {
  colorScheme: string;
  fontFamily: string;
  fontSizeLevel: number;
  theme: string;
  locale: string;
  templateId?: TemplateId;
}

/** Shape of a CV row as returned from the database */
export interface CVRow {
  id: string;
  user_id: string;
  title: string;
  cv_data: CVData;
  settings: CloudSettings;
  is_published: boolean;
  slug: string | null;
  created_at: string;
  updated_at: string;
}
