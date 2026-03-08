import { describe, it, expect } from "vitest";
import {
  getColorScheme,
  COLOR_SCHEMES,
  COLOR_SCHEME_NAMES,
  DEFAULT_COLOR_SCHEME,
  ACCENT_PRESETS,
  SCHEME_METADATA,
  resolveColorScheme,
  relativeLuminance,
  computeSidebarColors,
  migrateColorSchemeName,
  hexToTintedPageBg,
  hexToTintedPageBgDark,
  hexToTintedSeparator,
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
  it("returns base default scheme when accent is null", () => {
    const scheme = resolveColorScheme("default", null);
    expect(scheme).toEqual(COLOR_SCHEMES.default);
  });

  it("returns base wetAsphalt scheme when accent is null", () => {
    const scheme = resolveColorScheme("wetAsphalt", null);
    expect(scheme).toEqual(COLOR_SCHEMES.wetAsphalt);
  });

  it("applies accent to default scheme (nameColor, entryTitle, sidebarAccent, separator, pageBg, pageBgDark)", () => {
    const scheme = resolveColorScheme("default", "#1a7ed6");
    expect(scheme.nameColor).toBe("#1a7ed6");
    expect(scheme.entryTitle).toBe("#1a7ed6");
    expect(scheme.sidebarAccent).toBe("#1a7ed6");
    expect(scheme.sidebarSeparator).toBe(hexToTintedSeparator("#1a7ed6"));
    expect(scheme.pageBg).not.toBe(COLOR_SCHEMES.default.pageBg);
    expect(scheme.pageBgDark).not.toBe(COLOR_SCHEMES.default.pageBgDark);
    // Other properties remain unchanged
    expect(scheme.sidebarBg).toBe(COLOR_SCHEMES.default.sidebarBg);
    expect(scheme.heading).toBe(COLOR_SCHEMES.default.heading);
  });

  it("wetAsphalt always ignores accent", () => {
    const scheme = resolveColorScheme("wetAsphalt", "#1a7ed6");
    expect(scheme).toEqual(COLOR_SCHEMES.wetAsphalt);
  });

  it("esmeralda accepts accent override", () => {
    const scheme = resolveColorScheme("esmeralda", "#ff0000");
    expect(scheme.nameColor).toBe("#ff0000");
    expect(scheme.entryTitle).toBe("#ff0000");
    expect(scheme.sidebarAccent).toBe("#ff0000");
    // Sidebar bg stays the same
    expect(scheme.sidebarBg).toBe(COLOR_SCHEMES.esmeralda.sidebarBg);
  });

  it("hielo accepts accent override", () => {
    const scheme = resolveColorScheme("hielo", "#ff0000");
    expect(scheme.nameColor).toBe("#ff0000");
    expect(scheme.sidebarBg).toBe(COLOR_SCHEMES.hielo.sidebarBg);
  });

  it("floral accepts accent override", () => {
    const scheme = resolveColorScheme("floral", "#ff0000");
    expect(scheme.nameColor).toBe("#ff0000");
    expect(scheme.sidebarBg).toBe(COLOR_SCHEMES.floral.sidebarBg);
  });

  it("esmeralda returns base when accent is null", () => {
    const scheme = resolveColorScheme("esmeralda", null);
    expect(scheme).toEqual(COLOR_SCHEMES.esmeralda);
  });

  it("hielo returns base when accent is null", () => {
    const scheme = resolveColorScheme("hielo", null);
    expect(scheme).toEqual(COLOR_SCHEMES.hielo);
  });

  it("floral returns base when accent is null", () => {
    const scheme = resolveColorScheme("floral", null);
    expect(scheme).toEqual(COLOR_SCHEMES.floral);
  });
});

describe("new palettes have correct accent colors and tinted separators", () => {
  it("esmeralda uses green accent + tinted separator", () => {
    expect(COLOR_SCHEMES.esmeralda.nameColor).toBe("#27ae60");
    expect(COLOR_SCHEMES.esmeralda.entryTitle).toBe("#27ae60");
    expect(COLOR_SCHEMES.esmeralda.sidebarAccent).toBe("#27ae60");
    expect(COLOR_SCHEMES.esmeralda.sidebarBg).toBe("#e8f5e9");
    expect(COLOR_SCHEMES.esmeralda.sidebarSeparator).toBe("#bddcd3");
  });

  it("hielo uses blue accent + tinted separator", () => {
    expect(COLOR_SCHEMES.hielo.nameColor).toBe("#1a7ed6");
    expect(COLOR_SCHEMES.hielo.entryTitle).toBe("#1a7ed6");
    expect(COLOR_SCHEMES.hielo.sidebarAccent).toBe("#1a7ed6");
    expect(COLOR_SCHEMES.hielo.sidebarBg).toBe("#e8f0fe");
    expect(COLOR_SCHEMES.hielo.sidebarSeparator).toBe("#bad3eb");
  });

  it("floral uses orange accent + tinted separator", () => {
    expect(COLOR_SCHEMES.floral.nameColor).toBe("#d35400");
    expect(COLOR_SCHEMES.floral.entryTitle).toBe("#d35400");
    expect(COLOR_SCHEMES.floral.sidebarAccent).toBe("#d35400");
    expect(COLOR_SCHEMES.floral.sidebarBg).toBe("#fce4ec");
    expect(COLOR_SCHEMES.floral.sidebarSeparator).toBe("#dfcac0");
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

describe("hexToTintedSeparator", () => {
  it("returns a valid hex string", () => {
    expect(hexToTintedSeparator("#1a7ed6")).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("produces expected tint for blue", () => {
    expect(hexToTintedSeparator("#1a7ed6")).toBe("#bad3eb");
  });

  it("produces expected tint for green", () => {
    expect(hexToTintedSeparator("#27ae60")).toBe("#bddcd3");
  });
});

describe("SCHEME_METADATA", () => {
  it("has metadata for every scheme", () => {
    for (const name of COLOR_SCHEME_NAMES) {
      const meta = SCHEME_METADATA.find(m => m.name === name);
      expect(meta, `metadata missing for ${name}`).toBeDefined();
    }
  });

  it("each entry has valid category", () => {
    for (const meta of SCHEME_METADATA) {
      expect(["customizable", "palette"]).toContain(meta.category);
    }
  });

  it("default is customizable", () => {
    const meta = SCHEME_METADATA.find(m => m.name === "default");
    expect(meta?.category).toBe("customizable");
  });

  it("wetAsphalt is a palette", () => {
    const meta = SCHEME_METADATA.find(m => m.name === "wetAsphalt");
    expect(meta?.category).toBe("palette");
  });

  it("all non-default palettes are premium", () => {
    for (const meta of SCHEME_METADATA) {
      if (meta.name === "default") {
        expect(meta.premium).toBe(false);
      } else {
        expect(meta.premium, `${meta.name} should be premium`).toBe(true);
      }
    }
  });
});

describe("relativeLuminance", () => {
  it("returns 0 for black", () => {
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 4);
  });

  it("returns 1 for white", () => {
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 4);
  });

  it("returns mid-range for gray", () => {
    const lum = relativeLuminance("#808080");
    expect(lum).toBeGreaterThan(0.15);
    expect(lum).toBeLessThan(0.25);
  });
});

describe("computeSidebarColors", () => {
  it("dark bg → white text system", () => {
    const colors = computeSidebarColors("#2c3e50");
    expect(colors.sidebarBg).toBe("#2c3e50");
    expect(colors.sidebarText).toBe("#ffffff");
    expect(colors.sidebarBadgeText).toBe("#ffffff");
  });

  it("light bg → dark text system", () => {
    const colors = computeSidebarColors("#e8f0fe");
    expect(colors.sidebarBg).toBe("#e8f0fe");
    expect(colors.sidebarText).toBe("#1e293b");
    expect(colors.sidebarBadgeText).toBe("#ffffff");
  });
});

describe("migrateColorSchemeName", () => {
  it("migrates peterRiver to hielo palette", () => {
    const result = migrateColorSchemeName("peterRiver");
    expect(result.baseName).toBe("hielo");
    expect(result.accentColor).toBeNull();
  });

  it("migrates emerald to esmeralda palette", () => {
    const result = migrateColorSchemeName("emerald");
    expect(result.baseName).toBe("esmeralda");
    expect(result.accentColor).toBeNull();
  });

  it("migrates carrot to floral palette", () => {
    const result = migrateColorSchemeName("carrot");
    expect(result.baseName).toBe("floral");
    expect(result.accentColor).toBeNull();
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
