import { describe, it, expect } from "vitest";
import {
  getColorScheme,
  COLOR_SCHEMES,
  COLOR_SCHEME_NAMES,
  DEFAULT_COLOR_SCHEME,
  type ColorSchemeName,
} from "@/lib/color-schemes";

describe("getColorScheme", () => {
  it("returns correct scheme for each name", () => {
    for (const name of COLOR_SCHEME_NAMES) {
      const scheme = getColorScheme(name);
      expect(scheme.name).toBe(name);
      expect(scheme.swatch).toBeTruthy();
    }
  });

  it("falls back to default for unknown name", () => {
    const result = getColorScheme("nonexistent" as ColorSchemeName);
    expect(result.name).toBe("default");
  });
});

describe("COLOR_SCHEMES integrity", () => {
  it("has 5 color schemes", () => {
    expect(COLOR_SCHEME_NAMES).toHaveLength(5);
  });

  it("COLOR_SCHEME_NAMES matches COLOR_SCHEMES keys", () => {
    expect(COLOR_SCHEME_NAMES.sort()).toEqual(
      Object.keys(COLOR_SCHEMES).sort()
    );
  });

  it("default is the default scheme", () => {
    expect(DEFAULT_COLOR_SCHEME).toBe("default");
  });

  const requiredFields = [
    "name",
    "swatch",
    "sidebarBg",
    "sidebarText",
    "sidebarMuted",
    "sidebarSeparator",
    "sidebarBadgeBg",
    "sidebarBadgeText",
    "heading",
    "separator",
    "bullet",
    "nameAccent",
    "pageBg",
    "pageBgDark",
  ] as const;

  it("all schemes have all required fields", () => {
    for (const name of COLOR_SCHEME_NAMES) {
      const scheme = COLOR_SCHEMES[name];
      for (const field of requiredFields) {
        expect(scheme[field], `${name}.${field} should be defined`).toBeTruthy();
      }
    }
  });
});
