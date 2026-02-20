export interface PersonalInfo {
  fullName: string;
  title: string;
  photo?: string;
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

export type SidebarSectionId = "contact" | "summary" | "skills";

export interface SectionVisibility {
  location: boolean;
  linkedin: boolean;
  website: boolean;
  summary: boolean;
  courses: boolean;
  certifications: boolean;
  awards: boolean;
}

export interface CVData {
  personalInfo: PersonalInfo;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillCategory[];
  courses: CourseItem[];
  certifications: CertificationItem[];
  awards: AwardItem[];
  visibility: SectionVisibility;
  sidebarOrder: SidebarSectionId[];
}
