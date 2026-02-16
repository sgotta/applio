/* ── Font definitions registry ────────────────────────────
 * Single source of truth for all font metadata.
 * Consumed by: font-context, pdf-document, toolbar, CVPreview, PrintableCV, view/page
 */

export type FontFamilyId =
  | "inter"
  | "lato"
  | "openSans"
  | "montserrat"
  | "sourceSans3"
  | "raleway"
  | "nunitoSans"
  | "merriweather"
  | "ebGaramond"
  | "lora";

export type FontCategory = "sans-serif" | "serif";
export type FontSizeLevel = 1 | 2 | 3;

export interface FontDefinition {
  id: FontFamilyId;
  displayName: string;
  googleFontsName: string;
  cssStack: string;
  category: FontCategory;
  pdfFamilyName: string;
  pdfFonts: { src: string; fontWeight: number }[];
  /** Empty string for Inter (already loaded via next/font) */
  googleFontsCss2Url: string;
}

/* ── Font size levels ──────────────────────────────────── */

export const FONT_SIZE_LEVELS: Record<FontSizeLevel, number> = {
  1: 0.85,
  2: 1.0,
  3: 1.18,
};

export const FONT_SIZE_LEVEL_IDS: readonly FontSizeLevel[] = [1, 2, 3] as const;
export const DEFAULT_FONT_SIZE_LEVEL: FontSizeLevel = 2;

/** Base PDF font scale — applied on top of the size level multiplier */
export const PDF_BASE_FONT_SCALE = 1.08;

/* ── CJK / special-script locales ─────────────────────── */

export const CJK_LOCALES = new Set(["ja", "zh", "ko", "hi", "th"]);

/* ── Font definitions ──────────────────────────────────── */

export const DEFAULT_FONT_FAMILY: FontFamilyId = "inter";

export const FONT_FAMILIES: FontDefinition[] = [
  {
    id: "inter",
    displayName: "Inter",
    googleFontsName: "Inter",
    cssStack: "'Inter', sans-serif",
    category: "sans-serif",
    pdfFamilyName: "Inter",
    pdfFonts: [], // already registered in pdf-document.tsx
    googleFontsCss2Url: "",
  },
  {
    id: "lato",
    displayName: "Lato",
    googleFontsName: "Lato",
    cssStack: "'Lato', sans-serif",
    category: "sans-serif",
    pdfFamilyName: "Lato",
    pdfFonts: [
      { src: "https://fonts.gstatic.com/s/lato/v25/S6uyw4BMUTPHvxk.ttf", fontWeight: 400 },
      { src: "https://fonts.gstatic.com/s/lato/v25/S6uyw4BMUTPHvxk.ttf", fontWeight: 500 },
      { src: "https://fonts.gstatic.com/s/lato/v25/S6u9w4BMUTPHh6UVew8.ttf", fontWeight: 600 },
      { src: "https://fonts.gstatic.com/s/lato/v25/S6u9w4BMUTPHh6UVew8.ttf", fontWeight: 700 },
    ],
    googleFontsCss2Url: "https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap",
  },
  {
    id: "openSans",
    displayName: "Open Sans",
    googleFontsName: "Open Sans",
    cssStack: "'Open Sans', sans-serif",
    category: "sans-serif",
    pdfFamilyName: "OpenSans",
    pdfFonts: [
      { src: "https://fonts.gstatic.com/s/opensans/v44/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0C4n.ttf", fontWeight: 400 },
      { src: "https://fonts.gstatic.com/s/opensans/v44/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjr0C4n.ttf", fontWeight: 500 },
      { src: "https://fonts.gstatic.com/s/opensans/v44/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsgH1y4n.ttf", fontWeight: 600 },
      { src: "https://fonts.gstatic.com/s/opensans/v44/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsg-1y4n.ttf", fontWeight: 700 },
    ],
    googleFontsCss2Url: "https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&display=swap",
  },
  {
    id: "montserrat",
    displayName: "Montserrat",
    googleFontsName: "Montserrat",
    cssStack: "'Montserrat', sans-serif",
    category: "sans-serif",
    pdfFamilyName: "Montserrat",
    pdfFonts: [
      { src: "https://fonts.gstatic.com/s/montserrat/v31/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Ew-.ttf", fontWeight: 400 },
      { src: "https://fonts.gstatic.com/s/montserrat/v31/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtZ6Ew-.ttf", fontWeight: 500 },
      { src: "https://fonts.gstatic.com/s/montserrat/v31/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCu170w-.ttf", fontWeight: 600 },
      { src: "https://fonts.gstatic.com/s/montserrat/v31/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCuM70w-.ttf", fontWeight: 700 },
    ],
    googleFontsCss2Url: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap",
  },
  {
    id: "sourceSans3",
    displayName: "Source Sans 3",
    googleFontsName: "Source Sans 3",
    cssStack: "'Source Sans 3', sans-serif",
    category: "sans-serif",
    pdfFamilyName: "SourceSans3",
    pdfFonts: [
      { src: "https://fonts.gstatic.com/s/sourcesans3/v19/nwpBtKy2OAdR1K-IwhWudF-R9QMylBJAV3Bo8Ky461EN.ttf", fontWeight: 400 },
      { src: "https://fonts.gstatic.com/s/sourcesans3/v19/nwpBtKy2OAdR1K-IwhWudF-R9QMylBJAV3Bo8KyK61EN.ttf", fontWeight: 500 },
      { src: "https://fonts.gstatic.com/s/sourcesans3/v19/nwpBtKy2OAdR1K-IwhWudF-R9QMylBJAV3Bo8Kxm7FEN.ttf", fontWeight: 600 },
      { src: "https://fonts.gstatic.com/s/sourcesans3/v19/nwpBtKy2OAdR1K-IwhWudF-R9QMylBJAV3Bo8Kxf7FEN.ttf", fontWeight: 700 },
    ],
    googleFontsCss2Url: "https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600;700&display=swap",
  },
  {
    id: "raleway",
    displayName: "Raleway",
    googleFontsName: "Raleway",
    cssStack: "'Raleway', sans-serif",
    category: "sans-serif",
    pdfFamilyName: "Raleway",
    pdfFonts: [
      { src: "https://fonts.gstatic.com/s/raleway/v37/1Ptxg8zYS_SKggPN4iEgvnHyvveLxVvaooCP.ttf", fontWeight: 400 },
      { src: "https://fonts.gstatic.com/s/raleway/v37/1Ptxg8zYS_SKggPN4iEgvnHyvveLxVvoooCP.ttf", fontWeight: 500 },
      { src: "https://fonts.gstatic.com/s/raleway/v37/1Ptxg8zYS_SKggPN4iEgvnHyvveLxVsEpYCP.ttf", fontWeight: 600 },
      { src: "https://fonts.gstatic.com/s/raleway/v37/1Ptxg8zYS_SKggPN4iEgvnHyvveLxVs9pYCP.ttf", fontWeight: 700 },
    ],
    googleFontsCss2Url: "https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700&display=swap",
  },
  {
    id: "nunitoSans",
    displayName: "Nunito Sans",
    googleFontsName: "Nunito Sans",
    cssStack: "'Nunito Sans', sans-serif",
    category: "sans-serif",
    pdfFamilyName: "NunitoSans",
    pdfFonts: [
      { src: "https://fonts.gstatic.com/s/nunitosans/v19/pe1mMImSLYBIv1o4X1M8ce2xCx3yop4tQpF_MeTm0lfGWVpNn64CL7U8upHZIbMV51Q42ptCp5F5bxqqtQ1yiU4G1ilntA.ttf", fontWeight: 400 },
      { src: "https://fonts.gstatic.com/s/nunitosans/v19/pe1mMImSLYBIv1o4X1M8ce2xCx3yop4tQpF_MeTm0lfGWVpNn64CL7U8upHZIbMV51Q42ptCp5F5bxqqtQ1yiU4G5ClntA.ttf", fontWeight: 500 },
      { src: "https://fonts.gstatic.com/s/nunitosans/v19/pe1mMImSLYBIv1o4X1M8ce2xCx3yop4tQpF_MeTm0lfGWVpNn64CL7U8upHZIbMV51Q42ptCp5F5bxqqtQ1yiU4GCC5ntA.ttf", fontWeight: 600 },
      { src: "https://fonts.gstatic.com/s/nunitosans/v19/pe1mMImSLYBIv1o4X1M8ce2xCx3yop4tQpF_MeTm0lfGWVpNn64CL7U8upHZIbMV51Q42ptCp5F5bxqqtQ1yiU4GMS5ntA.ttf", fontWeight: 700 },
    ],
    googleFontsCss2Url: "https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600;700&display=swap",
  },
  {
    id: "merriweather",
    displayName: "Merriweather",
    googleFontsName: "Merriweather",
    cssStack: "'Merriweather', serif",
    category: "serif",
    pdfFamilyName: "Merriweather",
    pdfFonts: [
      { src: "https://fonts.gstatic.com/s/merriweather/v33/u-4D0qyriQwlOrhSvowK_l5UcA6zuSYEqOzpPe3HOZJ5eX1WtLaQwmYiScCmDxhtNOKl8yDr3icqEw.ttf", fontWeight: 400 },
      { src: "https://fonts.gstatic.com/s/merriweather/v33/u-4D0qyriQwlOrhSvowK_l5UcA6zuSYEqOzpPe3HOZJ5eX1WtLaQwmYiScCmDxhtNOKl8yDr7CcqEw.ttf", fontWeight: 500 },
      { src: "https://fonts.gstatic.com/s/merriweather/v33/u-4D0qyriQwlOrhSvowK_l5UcA6zuSYEqOzpPe3HOZJ5eX1WtLaQwmYiScCmDxhtNOKl8yDrACAqEw.ttf", fontWeight: 600 },
      { src: "https://fonts.gstatic.com/s/merriweather/v33/u-4D0qyriQwlOrhSvowK_l5UcA6zuSYEqOzpPe3HOZJ5eX1WtLaQwmYiScCmDxhtNOKl8yDrOSAqEw.ttf", fontWeight: 700 },
    ],
    googleFontsCss2Url: "https://fonts.googleapis.com/css2?family=Merriweather:wght@400;500;600;700&display=swap",
  },
  {
    id: "ebGaramond",
    displayName: "EB Garamond",
    googleFontsName: "EB Garamond",
    cssStack: "'EB Garamond', serif",
    category: "serif",
    pdfFamilyName: "EBGaramond",
    pdfFonts: [
      { src: "https://fonts.gstatic.com/s/ebgaramond/v32/SlGDmQSNjdsmc35JDF1K5E55YMjF_7DPuGi-6_RUAw.ttf", fontWeight: 400 },
      { src: "https://fonts.gstatic.com/s/ebgaramond/v32/SlGDmQSNjdsmc35JDF1K5E55YMjF_7DPuGi-2fRUAw.ttf", fontWeight: 500 },
      { src: "https://fonts.gstatic.com/s/ebgaramond/v32/SlGDmQSNjdsmc35JDF1K5E55YMjF_7DPuGi-NfNUAw.ttf", fontWeight: 600 },
      { src: "https://fonts.gstatic.com/s/ebgaramond/v32/SlGDmQSNjdsmc35JDF1K5E55YMjF_7DPuGi-DPNUAw.ttf", fontWeight: 700 },
    ],
    googleFontsCss2Url: "https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700&display=swap",
  },
  {
    id: "lora",
    displayName: "Lora",
    googleFontsName: "Lora",
    cssStack: "'Lora', serif",
    category: "serif",
    pdfFamilyName: "Lora",
    pdfFonts: [
      { src: "https://fonts.gstatic.com/s/lora/v37/0QI6MX1D_JOuGQbT0gvTJPa787weuyJG.ttf", fontWeight: 400 },
      { src: "https://fonts.gstatic.com/s/lora/v37/0QI6MX1D_JOuGQbT0gvTJPa787wsuyJG.ttf", fontWeight: 500 },
      { src: "https://fonts.gstatic.com/s/lora/v37/0QI6MX1D_JOuGQbT0gvTJPa787zAvCJG.ttf", fontWeight: 600 },
      { src: "https://fonts.gstatic.com/s/lora/v37/0QI6MX1D_JOuGQbT0gvTJPa787z5vCJG.ttf", fontWeight: 700 },
    ],
    googleFontsCss2Url: "https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap",
  },
];

export const FONT_FAMILY_IDS: FontFamilyId[] = FONT_FAMILIES.map((f) => f.id);

export function getFontDefinition(id: FontFamilyId): FontDefinition {
  return FONT_FAMILIES.find((f) => f.id === id) ?? FONT_FAMILIES[0];
}
