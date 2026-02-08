import { CVData } from "./types";

export const defaultCVData: CVData = {
  personalInfo: {
    fullName: "Simón Gotta",
    title: "Sr. Software Engineer",
    contacts: [
      {
        id: "contact-1",
        type: "email",
        label: "Email",
        value: "simon@ejemplo.com",
        icon: "Mail",
      },
      {
        id: "contact-2",
        type: "phone",
        label: "Teléfono",
        value: "+54 11 1234-5678",
        icon: "Phone",
      },
      {
        id: "contact-3",
        type: "location",
        label: "Ubicación",
        value: "Buenos Aires, Argentina",
        icon: "MapPin",
      },
      {
        id: "contact-4",
        type: "linkedin",
        label: "LinkedIn",
        value: "linkedin.com/in/simongotta",
        icon: "Linkedin",
      },
    ],
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
        "Lideré el desarrollo del nuevo sistema de onboarding digital, reduciendo el tiempo de alta de clientes en un 40%.",
        "Migración de aplicación monolítica a microservicios con Node.js y AWS Lambda.",
        "Mentoría a equipo de 4 desarrolladores junior.",
      ],
    },
    {
      id: "exp-2",
      company: "Globant",
      position: "Frontend Developer",
      startDate: "septiembre 2019",
      endDate: "febrero 2021",
      description: [
        "Desarrollo de interfaces de usuario para clientes enterprise con React y TypeScript.",
        "Implementación de design system compartido entre 3 equipos.",
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
  customSections: [],
};
