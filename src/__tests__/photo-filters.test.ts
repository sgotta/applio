import { describe, it, expect } from "vitest";
import { getPhotoFilter, PHOTO_FILTERS } from "@/lib/photo-filters";

describe("photo-filters", () => {
  it("returns 'none' filter for undefined input", () => {
    const result = getPhotoFilter(undefined);
    expect(result.id).toBe("none");
  });

  it("returns 'none' filter for unknown input", () => {
    const result = getPhotoFilter("unknown-filter");
    expect(result.id).toBe("none");
  });

  it("returns correct filter for each valid id", () => {
    for (const def of PHOTO_FILTERS) {
      const result = getPhotoFilter(def.id);
      expect(result.id).toBe(def.id);
      expect(result.cssFilter).toBe(def.cssFilter);
      expect(result.canvasFilter).toBe(def.canvasFilter);
    }
  });

  it("all filters have non-empty cssFilter and canvasFilter", () => {
    for (const def of PHOTO_FILTERS) {
      expect(def.cssFilter).toBeTruthy();
      expect(def.canvasFilter).toBeTruthy();
    }
  });

  it("all filters are free", () => {
    const premiumFilters = PHOTO_FILTERS.filter((f) => f.premium);
    expect(premiumFilters).toHaveLength(0);
  });

  it("has exactly 5 filters defined", () => {
    expect(PHOTO_FILTERS).toHaveLength(5);
  });

  it("each filter has a unique labelKey", () => {
    const labelKeys = PHOTO_FILTERS.map((f) => f.labelKey);
    expect(new Set(labelKeys).size).toBe(labelKeys.length);
  });
});
