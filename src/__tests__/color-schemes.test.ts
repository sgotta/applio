import { describe, it, expect } from "vitest";
import {
  getColorScheme,
  COLOR_SCHEMES,
  COLOR_SCHEME_NAMES,
  DEFAULT_COLOR_SCHEME,
  ACCENT_PRESETS,
  resolveColorScheme,
  migrateColorSchemeName,
  hexToTintedPageBg,
  hexToTintedPageBgDark,
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
  it("has 2 color schemes", () => {
    expect(COLOR_SCHEME_NAMES).toHaveLength(2);
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
    "nameColor",
    "entryTitle",
    "sidebarAccent",
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

describe("ACCENT_PRESETS", () => {
  it("has 3 presets", () => {
    expect(ACCENT_PRESETS).toHaveLength(3);
  });

  it("each preset has name and valid hex color", () => {
    for (const preset of ACCENT_PRESETS) {
      expect(preset.name).toBeTruthy();
      expect(preset.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});

describe("resolveColorScheme", () => {
  it("returns base default scheme when accentColor is null", () => {
    const scheme = resolveColorScheme("default", null);
    expect(scheme).toEqual(COLOR_SCHEMES.default);
  });

  it("returns base wetAsphalt scheme when accentColor is null", () => {
    const scheme = resolveColorScheme("wetAsphalt", null);
    expect(scheme).toEqual(COLOR_SCHEMES.wetAsphalt);
  });

  it("applies accent to default scheme (nameColor, entryTitle, sidebarAccent, pageBg, pageBgDark)", () => {
    const scheme = resolveColorScheme("default", "#1a7ed6");
    expect(scheme.nameColor).toBe("#1a7ed6");
    expect(scheme.entryTitle).toBe("#1a7ed6");
    expect(scheme.sidebarAccent).toBe("#1a7ed6");
    expect(scheme.pageBg).not.toBe(COLOR_SCHEMES.default.pageBg);
    expect(scheme.pageBgDark).not.toBe(COLOR_SCHEMES.default.pageBgDark);
    // Other properties remain unchanged
    expect(scheme.sidebarBg).toBe(COLOR_SCHEMES.default.sidebarBg);
    expect(scheme.heading).toBe(COLOR_SCHEMES.default.heading);
  });

  it("applies accent to wetAsphalt only on right column (nameColor, entryTitle)", () => {
    const scheme = resolveColorScheme("wetAsphalt", "#1a7ed6");
    expect(scheme.nameColor).toBe("#1a7ed6");
    expect(scheme.entryTitle).toBe("#1a7ed6");
    // Sidebar stays unchanged
    expect(scheme.sidebarAccent).toBe(COLOR_SCHEMES.wetAsphalt.sidebarAccent);
    expect(scheme.pageBg).toBe(COLOR_SCHEMES.wetAsphalt.pageBg);
    expect(scheme.pageBgDark).toBe(COLOR_SCHEMES.wetAsphalt.pageBgDark);
    expect(scheme.sidebarBg).toBe(COLOR_SCHEMES.wetAsphalt.sidebarBg);
  });
});

describe("hexToTintedPageBg", () => {
  it("returns a valid hex string", () => {
    expect(hexToTintedPageBg("#1a7ed6")).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("produces a light tint close to expected for blue", () => {
    const result = hexToTintedPageBg("#1a7ed6");
    // Light tint of blue over #ebebeb base
    expect(result).toBe("#dae2e9");
  });
});

describe("hexToTintedPageBgDark", () => {
  it("returns a valid hex string", () => {
    expect(hexToTintedPageBgDark("#1a7ed6")).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("produces a dark tint (stays close to base dark)", () => {
    const result = hexToTintedPageBgDark("#1a7ed6");
    // Should be very close to #1a1c20 with slight blue tint
    expect(result.startsWith("#1")).toBe(true);
  });
});

describe("migrateColorSchemeName", () => {
  it("migrates peterRiver to default + blue accent", () => {
    const result = migrateColorSchemeName("peterRiver");
    expect(result.baseName).toBe("default");
    expect(result.accentColor).toBe("#1a7ed6");
  });

  it("migrates emerald to default + green accent", () => {
    const result = migrateColorSchemeName("emerald");
    expect(result.baseName).toBe("default");
    expect(result.accentColor).toBe("#27ae60");
  });

  it("migrates carrot to default + orange accent", () => {
    const result = migrateColorSchemeName("carrot");
    expect(result.baseName).toBe("default");
    expect(result.accentColor).toBe("#d35400");
  });

  it("keeps wetAsphalt with no accent", () => {
    const result = migrateColorSchemeName("wetAsphalt");
    expect(result.baseName).toBe("wetAsphalt");
    expect(result.accentColor).toBeNull();
  });

  it("keeps default with no accent", () => {
    const result = migrateColorSchemeName("default");
    expect(result.baseName).toBe("default");
    expect(result.accentColor).toBeNull();
  });

  it("falls back to default for unknown names", () => {
    const result = migrateColorSchemeName("unknown");
    expect(result.baseName).toBe("default");
    expect(result.accentColor).toBeNull();
  });
});
