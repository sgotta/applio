import { CVData } from "./types";

export const defaultCVData: CVData = {
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
        "Led the development of a new digital onboarding system, reducing customer sign-up time by 40%.",
        "Migrated monolithic application to microservices using Node.js and AWS Lambda.",
        "Mentored a team of 4 junior developers through code reviews and pair programming.",
      ],
    },
    {
      id: "exp-2",
      company: "Tech Solutions Inc.",
      position: "Frontend Developer",
      startDate: "Sep 2019",
      endDate: "Feb 2021",
      description: [
        "Built enterprise user interfaces for clients using React and TypeScript.",
        "Implemented a shared design system adopted across 3 product teams.",
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
};
