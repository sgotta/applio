import { describe, it, expect } from "vitest";
import {
  getDefaultCVData,
  defaultVisibility,
  DEFAULT_SIDEBAR_ORDER,
} from "@/lib/default-data";

describe("getDefaultCVData", () => {
  it("returns English data for 'en'", () => {
    const data = getDefaultCVData("en");
    expect(data.personalInfo.fullName).toBe("John Doe");
  });

  it("returns Spanish data for 'es'", () => {
    const data = getDefaultCVData("es");
    expect(data.personalInfo.fullName).toBe("Simón Gotta");
  });

  it("falls back to English for unknown locale", () => {
    const data = getDefaultCVData("ja");
    expect(data.personalInfo.fullName).toBe("John Doe");
  });

  it("returned data has all required fields", () => {
    const data = getDefaultCVData("en");
    expect(data.personalInfo).toBeDefined();
    expect(data.summary).toBeTruthy();
    expect(data.experience.length).toBeGreaterThan(0);
    expect(data.education.length).toBeGreaterThan(0);
    expect(data.skills.length).toBeGreaterThan(0);
    expect(data.visibility).toEqual(defaultVisibility);
    expect(data.sidebarOrder).toEqual(DEFAULT_SIDEBAR_ORDER);
  });
});

describe("defaultVisibility", () => {
  it("has expected defaults", () => {
    expect(defaultVisibility.location).toBe(true);
    expect(defaultVisibility.linkedin).toBe(true);
    expect(defaultVisibility.website).toBe(true);
    expect(defaultVisibility.summary).toBe(true);
    expect(defaultVisibility.courses).toBe(false);
    expect(defaultVisibility.certifications).toBe(false);
    expect(defaultVisibility.awards).toBe(false);
  });
});

describe("DEFAULT_SIDEBAR_ORDER", () => {
  it("has 3 sections in expected order", () => {
    expect(DEFAULT_SIDEBAR_ORDER).toEqual(["contact", "summary", "skills"]);
  });
});
