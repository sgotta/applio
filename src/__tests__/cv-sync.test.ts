import { describe, it, expect } from "vitest";
import {
  stableStringify,
  cvContentFingerprint,
  STRIP_KEYS,
  sortBySortOrder,
  toSettings,
  docToCVData,
  cvDataToDoc,
} from "@/lib/cv-sync";
import type { CVData, CloudSettings } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal valid CVData for testing */
function makeCVData(overrides?: Partial<CVData>): CVData {
  return {
    personalInfo: {
      fullName: "Juan Pérez",
      jobTitle: "Dev",
      email: "juan@test.com",
      phone: "+54 11 1234-5678",
      location: "Buenos Aires",
      linkedin: "",
      website: "",
    },
    summary: "About me",
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
    ...overrides,
  };
}

// =========================================================================
// stableStringify
// =========================================================================

describe("stableStringify", () => {
  it("sorts keys alphabetically", () => {
    const result = stableStringify({ b: 1, a: 2 });
    expect(result).toBe(`{"a":2,"b":1}`);
  });

  it("normalizes null, undefined, and empty string to same output", () => {
    expect(stableStringify(null)).toBe("null");
    expect(stableStringify(undefined)).toBe("null");
    expect(stableStringify("")).toBe("null");
  });

  it("skips keys with empty values in objects", () => {
    const result = stableStringify({ a: 1, b: null, c: undefined, d: "" });
    expect(result).toBe(`{"a":1}`);
  });

  it("strips specified keys at all nesting levels", () => {
    const obj = { id: "x", name: "A", nested: { id: "y", value: 1 } };
    const result = stableStringify(obj, new Set(["id"]));
    expect(result).toBe(`{"name":"A","nested":{"value":1}}`);
  });

  it("preserves array order", () => {
    const result = stableStringify([3, 1, 2]);
    expect(result).toBe("[3,1,2]");
  });

  it("recursively sorts nested objects", () => {
    const result = stableStringify({ z: { b: 1, a: 2 }, a: 0 });
    expect(result).toBe(`{"a":0,"z":{"a":2,"b":1}}`);
  });

  it("handles primitives", () => {
    expect(stableStringify(42)).toBe("42");
    expect(stableStringify("hello")).toBe(`"hello"`);
    expect(stableStringify(true)).toBe("true");
  });

  it("handles empty array", () => {
    expect(stableStringify([])).toBe("[]");
  });

  it("handles empty object", () => {
    expect(stableStringify({})).toBe("{}");
  });

  it("strips keys inside arrays of objects", () => {
    const arr = [{ id: "1", name: "A" }, { id: "2", name: "B" }];
    const result = stableStringify(arr, new Set(["id"]));
    expect(result).toBe(`[{"name":"A"},{"name":"B"}]`);
  });
});

// =========================================================================
// cvContentFingerprint
// =========================================================================

describe("cvContentFingerprint", () => {
  it("strips base64 photos from fingerprint", () => {
    const withPhoto = makeCVData({
      personalInfo: {
        ...makeCVData().personalInfo,
        photoUrl: "data:image/jpeg;base64,abc123",
      },
    });
    const withoutPhoto = makeCVData();
    expect(cvContentFingerprint(withPhoto)).toBe(cvContentFingerprint(withoutPhoto));
  });

  it("keeps R2 URLs in fingerprint", () => {
    const withR2 = makeCVData({
      personalInfo: {
        ...makeCVData().personalInfo,
        photoUrl: "https://r2.example.com/photo.webp",
      },
    });
    const withoutPhoto = makeCVData();
    expect(cvContentFingerprint(withR2)).not.toBe(cvContentFingerprint(withoutPhoto));
  });

  it("strips 'id' keys at all levels", () => {
    const data1 = makeCVData({
      experiences: [{ id: "abc", company: "Acme", position: "Dev", startDate: "2020", endDate: "2021", description: "" }],
    });
    const data2 = makeCVData({
      experiences: [{ id: "xyz", company: "Acme", position: "Dev", startDate: "2020", endDate: "2021", description: "" }],
    });
    expect(cvContentFingerprint(data1)).toBe(cvContentFingerprint(data2));
  });

  it("detects real content changes", () => {
    const data1 = makeCVData({ summary: "Version A" });
    const data2 = makeCVData({ summary: "Version B" });
    expect(cvContentFingerprint(data1)).not.toBe(cvContentFingerprint(data2));
  });

  it("produces identical fingerprints for identical data", () => {
    const data = makeCVData();
    expect(cvContentFingerprint(data)).toBe(cvContentFingerprint(data));
  });
});

// =========================================================================
// sortBySortOrder
// =========================================================================

describe("sortBySortOrder", () => {
  it("sorts ascending by sortOrder", () => {
    const arr = [{ sortOrder: 2, name: "B" }, { sortOrder: 0, name: "A" }, { sortOrder: 1, name: "C" }];
    expect(sortBySortOrder(arr).map((x) => x.name)).toEqual(["A", "C", "B"]);
  });

  it("defaults missing sortOrder to 0", () => {
    const arr = [{ sortOrder: 1, name: "B" }, { name: "A" }];
    expect(sortBySortOrder(arr).map((x) => x.name)).toEqual(["A", "B"]);
  });

  it("does not mutate original array", () => {
    const arr = [{ sortOrder: 2 }, { sortOrder: 1 }];
    const copy = [...arr];
    sortBySortOrder(arr);
    expect(arr).toEqual(copy);
  });

  it("handles empty array", () => {
    expect(sortBySortOrder([])).toEqual([]);
  });
});

// =========================================================================
// docToCVData
// =========================================================================

describe("docToCVData", () => {
  it("maps personalInfo and summary from personalInfo.summary", () => {
    const plain = {
      personalInfo: { fullName: "Ana", jobTitle: "PM", summary: "My summary" },
    };
    const cv = docToCVData(plain);
    expect(cv.personalInfo.fullName).toBe("Ana");
    expect(cv.summary).toBe("My summary");
  });

  it("converts _id to id in experiences", () => {
    const plain = {
      experiences: [{ _id: { toString: () => "mongo123" }, company: "Acme", sortOrder: 0 }],
    };
    const cv = docToCVData(plain);
    expect(cv.experiences[0].id).toBe("mongo123");
  });

  it("sorts entries by sortOrder", () => {
    const plain = {
      experiences: [
        { _id: { toString: () => "b" }, company: "B", sortOrder: 1 },
        { _id: { toString: () => "a" }, company: "A", sortOrder: 0 },
      ],
    };
    const cv = docToCVData(plain);
    expect(cv.experiences.map((e) => e.company)).toEqual(["A", "B"]);
  });

  it("maps skillCategories with nested items", () => {
    const plain = {
      skillCategories: [{
        _id: { toString: () => "s1" },
        name: "Frontend",
        sortOrder: 0,
        items: [
          { name: "React", sortOrder: 1 },
          { name: "CSS", sortOrder: 0 },
        ],
      }],
    };
    const cv = docToCVData(plain);
    expect(cv.skillCategories[0].category).toBe("Frontend");
    expect(cv.skillCategories[0].items).toEqual(["CSS", "React"]);
  });

  it("provides defaults for missing fields", () => {
    const cv = docToCVData({});
    expect(cv.personalInfo.fullName).toBe("");
    expect(cv.summary).toBe("");
    expect(cv.experiences).toEqual([]);
    expect(cv.visibility.location).toBe(true);
    expect(cv.visibility.courses).toBe(false);
  });

  it("sorts sidebarSections by sortOrder", () => {
    const plain = {
      sidebarSections: [
        { sectionId: "skills", sortOrder: 2 },
        { sectionId: "contact", sortOrder: 0 },
        { sectionId: "summary", sortOrder: 1 },
      ],
    };
    const cv = docToCVData(plain);
    expect(cv.sidebarSections).toEqual(["contact", "summary", "skills"]);
  });
});

// =========================================================================
// cvDataToDoc
// =========================================================================

describe("cvDataToDoc", () => {
  const cvData = makeCVData({
    experiences: [
      { id: "e1", company: "Acme", position: "Dev", startDate: "2020", endDate: "2021", description: "Worked" },
    ],
    skillCategories: [
      { id: "s1", category: "Front", items: ["React", "CSS"] },
    ],
  });

  it("nests summary inside personalInfo", () => {
    const doc = cvDataToDoc(cvData);
    expect(doc.personalInfo.summary).toBe("About me");
  });

  it("assigns sortOrder indices to experiences", () => {
    const doc = cvDataToDoc(cvData);
    expect(doc.experiences[0].sortOrder).toBe(0);
  });

  it("maps skillCategory.category to name", () => {
    const doc = cvDataToDoc(cvData);
    expect(doc.skillCategories[0].name).toBe("Front");
    expect(doc.skillCategories[0].items).toEqual([
      { name: "React", sortOrder: 0 },
      { name: "CSS", sortOrder: 1 },
    ]);
  });

  it("includes settings when provided", () => {
    const settings: CloudSettings = {
      colorScheme: "ivory",
      fontFamily: "inter",
      fontSizeLevel: 2,
      theme: "light",
      locale: "es",
      pattern: { name: "none", sidebarIntensity: 3, mainIntensity: 2, scope: "sidebar" },
    };
    const doc = cvDataToDoc(cvData, settings);
    expect(doc.settings).toEqual(settings);
  });

  it("omits settings when not provided", () => {
    const doc = cvDataToDoc(cvData);
    expect("settings" in doc).toBe(false);
  });

  it("uses fullName as title, falls back to 'Untitled CV'", () => {
    expect(cvDataToDoc(cvData).title).toBe("Juan Pérez");
    const empty = makeCVData({ personalInfo: { ...makeCVData().personalInfo, fullName: "" } });
    expect(cvDataToDoc(empty).title).toBe("Untitled CV");
  });
});

// =========================================================================
// toSettings
// =========================================================================

describe("toSettings", () => {
  it("extracts settings from document", () => {
    const plain = {
      settings: {
        colorScheme: "midnight",
        fontFamily: "lato",
        fontSizeLevel: 3,
        theme: "dark",
        locale: "en",
        pattern: { name: "dots", sidebarIntensity: 5, mainIntensity: 4, scope: "both" },
      },
    };
    const s = toSettings(plain);
    expect(s.colorScheme).toBe("midnight");
    expect(s.pattern.name).toBe("dots");
  });

  it("provides defaults for missing settings", () => {
    const s = toSettings({});
    expect(s.colorScheme).toBe("ivory");
    expect(s.fontFamily).toBe("inter");
    expect(s.fontSizeLevel).toBe(2);
    expect(s.theme).toBe("light");
    expect(s.locale).toBe("es");
    expect(s.pattern.name).toBe("none");
  });

  it("handles partial pattern", () => {
    const plain = { settings: { pattern: { name: "grid" } } };
    const s = toSettings(plain);
    expect(s.pattern.name).toBe("grid");
    expect(s.pattern.sidebarIntensity).toBe(3);
    expect(s.pattern.scope).toBe("sidebar");
  });
});

// =========================================================================
// STRIP_KEYS constant
// =========================================================================

describe("STRIP_KEYS", () => {
  it("contains 'id'", () => {
    expect(STRIP_KEYS.has("id")).toBe(true);
  });

  it("has exactly 1 entry", () => {
    expect(STRIP_KEYS.size).toBe(1);
  });
});
