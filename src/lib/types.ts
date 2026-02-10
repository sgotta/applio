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

export interface CVData {
  personalInfo: PersonalInfo;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillCategory[];
}
