export interface PersonalInfo {
  fullName: string;
  title: string;
  photo?: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
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

export interface CourseItem {
  id: string;
  name: string;
  institution: string;
  date: string;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

export interface AwardItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

export interface SectionVisibility {
  email: boolean;
  phone: boolean;
  location: boolean;
  linkedin: boolean;
  website: boolean;
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
}

export interface SharedCVData {
  cv: Omit<CVData, "personalInfo"> & {
    personalInfo: Omit<PersonalInfo, "photo">;
  };
  settings: {
    colorScheme: string;
    fontSizeLevel: number;
    marginLevel: number;
  };
  sharedAt: string;
}
