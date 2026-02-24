import { describe, it, expect, beforeEach } from "vitest";
import { saveCVData, loadCVData, clearCVData } from "@/lib/storage";
import type { CVData } from "@/lib/types";

const mockData: CVData = {
  personalInfo: {
    fullName: "Test User",
    jobTitle: "Dev",
    email: "test@test.com",
    phone: "",
    location: "",
    linkedin: "",
    website: "",
  },
  summary: "A summary",
  experiences: [],
  education: [],
  skillCategories: [],
  courses: [],
  certifications: [],
  awards: [],
  visibility: {
    location: true,
    linkedin: true,
    website: true,
    summary: true,
    courses: false,
    certifications: false,
    awards: false,
  },
  sidebarSections: ["contact", "summary", "skills"],
};

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("save and load round-trip", () => {
    saveCVData(mockData);
    const loaded = loadCVData();
    expect(loaded).toEqual(mockData);
  });

  it("loadCVData returns null when no data saved", () => {
    expect(loadCVData()).toBeNull();
  });

  it("clearCVData removes saved data", () => {
    saveCVData(mockData);
    clearCVData();
    expect(loadCVData()).toBeNull();
  });

  it("loadCVData returns null on invalid JSON", () => {
    localStorage.setItem("cv-builder-data", "not valid json{");
    expect(loadCVData()).toBeNull();
  });
});
