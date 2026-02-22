import { describe, it, expect } from "vitest";
import {
  getFontDefinition,
  FONT_FAMILIES,
  FONT_FAMILY_IDS,
  FONT_SIZE_LEVELS,
  DEFAULT_FONT_FAMILY,
  type FontFamilyId,
} from "@/lib/fonts";

describe("getFontDefinition", () => {
  it("returns correct definition for each font ID", () => {
    for (const id of FONT_FAMILY_IDS) {
      const def = getFontDefinition(id);
      expect(def.id).toBe(id);
      expect(def.displayName).toBeTruthy();
      expect(def.cssStack).toBeTruthy();
    }
  });

  it("falls back to first font (inter) for unknown ID", () => {
    const result = getFontDefinition("nonexistent" as FontFamilyId);
    expect(result.id).toBe("inter");
  });

  it("returns inter as default font", () => {
    expect(DEFAULT_FONT_FAMILY).toBe("inter");
    expect(getFontDefinition("inter").displayName).toBe("Inter");
  });
});

describe("FONT_FAMILIES integrity", () => {
  it("has 4 font definitions", () => {
    expect(FONT_FAMILIES).toHaveLength(4);
  });

  it("FONT_FAMILY_IDS matches FONT_FAMILIES", () => {
    expect(FONT_FAMILY_IDS).toEqual(FONT_FAMILIES.map((f) => f.id));
  });

  it("all fonts have required fields", () => {
    for (const font of FONT_FAMILIES) {
      expect(font.id).toBeTruthy();
      expect(font.displayName).toBeTruthy();
      expect(font.cssStack).toBeTruthy();
      expect(font.category).toMatch(/^(sans-serif|serif)$/);
      expect(font.pdfFamilyName).toBeTruthy();
      expect(Array.isArray(font.pdfFonts)).toBe(true);
    }
  });

  it("non-Inter fonts have PDF font URLs", () => {
    for (const font of FONT_FAMILIES.filter((f) => f.id !== "inter")) {
      expect(font.pdfFonts.length).toBeGreaterThan(0);
      for (const pf of font.pdfFonts) {
        expect(pf.src).toMatch(/^https:\/\//);
        expect(pf.fontWeight).toBeGreaterThan(0);
      }
    }
  });
});

describe("FONT_SIZE_LEVELS", () => {
  it("has 3 levels", () => {
    expect(Object.keys(FONT_SIZE_LEVELS)).toHaveLength(3);
  });

  it("level 2 is the base (1.0)", () => {
    expect(FONT_SIZE_LEVELS[2]).toBe(1.0);
  });

  it("levels are ordered ascending", () => {
    expect(FONT_SIZE_LEVELS[1]).toBeLessThan(FONT_SIZE_LEVELS[2]);
    expect(FONT_SIZE_LEVELS[2]).toBeLessThan(FONT_SIZE_LEVELS[3]);
  });
});
