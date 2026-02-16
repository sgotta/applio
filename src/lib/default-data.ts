import { CVData, SectionVisibility } from "./types";

export const defaultVisibility: SectionVisibility = {
  email: true,
  phone: true,
  location: true,
  linkedin: true,
  website: true,
  courses: false,
  certifications: false,
  awards: false,
};

const enData: CVData = {
  personalInfo: {
    fullName: "John Doe",
    title: "Sr. Software Engineer",
    email: "john.doe@email.com",
    phone: "+1 (555) 123-4567",
    location: "New York, NY",
    linkedin: "linkedin.com/in/johndoe",
    website: "johndoe.dev",
  },
  summary:
    "Software engineer with 5+ years of experience building scalable web applications. Specialized in React, TypeScript, and microservices architectures. Passionate about clean code and delivering high-quality user experiences.",
  experience: [
    {
      id: "exp-1",
      company: "Acme Corp",
      position: "Senior Software Engineer",
      startDate: "Mar 2021",
      endDate: "Present",
      description: [
        { text: "Led the development of a new digital onboarding system, reducing customer sign-up time by 40%.", type: "bullet" },
        { text: "Migrated monolithic application to microservices using **Node.js** and **AWS Lambda**.", type: "bullet" },
        { text: "Mentored a team of 4 junior developers through code reviews and pair programming.", type: "bullet" },
      ],
    },
    {
      id: "exp-2",
      company: "Tech Solutions Inc.",
      position: "Frontend Developer",
      startDate: "Sep 2019",
      endDate: "Feb 2021",
      description: [
        { text: "Built enterprise user interfaces for clients using **React** and **TypeScript**.", type: "bullet" },
        { text: "Implemented a shared design system adopted across 3 product teams.", type: "bullet" },
      ],
    },
  ],
  education: [
    {
      id: "edu-1",
      institution: "University of California, Berkeley",
      degree: "B.S. in Computer Science",
      startDate: "2015",
      endDate: "2019",
      description:
        "Thesis: Optimization of search algorithms in distributed graph systems.",
    },
  ],
  skills: [
    {
      id: "skill-1",
      category: "Frontend",
      items: ["React", "TypeScript", "Next.js", "Tailwind CSS"],
    },
    {
      id: "skill-2",
      category: "Backend",
      items: ["Node.js", "Python", "PostgreSQL", "AWS"],
    },
    {
      id: "skill-3",
      category: "Tools",
      items: ["Git", "Docker", "CI/CD", "Figma"],
    },
  ],
  courses: [],
  certifications: [],
  awards: [],
  visibility: defaultVisibility,
};

const esData: CVData = {
  personalInfo: {
    fullName: "Simón Gotta",
    title: "Ingeniero de Software Sr.",
    email: "simon@ejemplo.com",
    phone: "+54 11 1234-5678",
    location: "Buenos Aires, Argentina",
    linkedin: "linkedin.com/in/simongotta",
    website: "",
  },
  summary:
    "Ingeniero de software con más de 5 años de experiencia desarrollando aplicaciones web escalables. Especializado en React, TypeScript y arquitecturas de microservicios.",
  experience: [
    {
      id: "exp-1",
      company: "Santander Tecnología",
      position: "Senior Software Engineer",
      startDate: "marzo 2021",
      endDate: "Actualidad",
      description: [
        { text: "Lideré el desarrollo del nuevo sistema de onboarding digital, reduciendo el tiempo de alta de clientes en un 40%.", type: "bullet" },
        { text: "Migración de aplicación monolítica a microservicios con **Node.js** y **AWS Lambda**.", type: "bullet" },
        { text: "Mentoría a equipo de 4 desarrolladores junior.", type: "bullet" },
      ],
    },
    {
      id: "exp-2",
      company: "Globant",
      position: "Frontend Developer",
      startDate: "septiembre 2019",
      endDate: "febrero 2021",
      description: [
        { text: "Desarrollo de interfaces de usuario para clientes enterprise con **React** y **TypeScript**.", type: "bullet" },
        { text: "Implementación de design system compartido entre 3 equipos.", type: "bullet" },
      ],
    },
  ],
  education: [
    {
      id: "edu-1",
      institution: "Universidad de Buenos Aires",
      degree: "Licenciatura en Ciencias de la Computación",
      startDate: "2015",
      endDate: "2019",
      description:
        "Tesis: Optimización de algoritmos de búsqueda en grafos distribuidos.",
    },
  ],
  skills: [
    {
      id: "skill-1",
      category: "Frontend",
      items: ["React", "TypeScript", "Next.js", "Tailwind CSS"],
    },
    {
      id: "skill-2",
      category: "Backend",
      items: ["Node.js", "Python", "PostgreSQL", "AWS"],
    },
    {
      id: "skill-3",
      category: "Herramientas",
      items: ["Git", "Docker", "CI/CD", "Figma"],
    },
  ],
  courses: [],
  certifications: [],
  awards: [],
  visibility: defaultVisibility,
};

const dataByLocale: Record<string, CVData> = { en: enData, es: esData };

export function getDefaultCVData(locale: string): CVData {
  return dataByLocale[locale] || enData;
}

export const defaultCVData: CVData = enData;
