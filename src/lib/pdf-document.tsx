import {
  Document,
  Page,
  View,
  Text,
  Image,
  Font,
  StyleSheet,
  Svg,
  Path,
  Circle,
  Rect,
  Link,
  pdf,
} from "@react-pdf/renderer";
import type { CVData } from "@/lib/types";
import { DEFAULT_SIDEBAR_SECTIONS } from "@/lib/default-data";
import type { ColorScheme } from "@/lib/color-schemes";
import { PdfRichText, PdfRichDocument } from "@/lib/render-rich-text-pdf";

/* ── Font registration ──────────────────────────────────── */

Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v20/UcCM3FwrK3iLTcvneQg7Ca725JhhKnNqk4j1ebLhAm8SrXTc2dthjQ.ttf",
      fontWeight: 400,
      fontStyle: "italic",
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fMZg.ttf",
      fontWeight: 500,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v20/UcCM3FwrK3iLTcvneQg7Ca725JhhKnNqk4j1ebLhAm8SrXTc69thjQ.ttf",
      fontWeight: 500,
      fontStyle: "italic",
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZg.ttf",
      fontWeight: 600,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v20/UcCM3FwrK3iLTcvneQg7Ca725JhhKnNqk4j1ebLhAm8SrXTcB9xhjQ.ttf",
      fontWeight: 600,
      fontStyle: "italic",
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZg.ttf",
      fontWeight: 700,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v20/UcCM3FwrK3iLTcvneQg7Ca725JhhKnNqk4j1ebLhAm8SrXTcPtxhjQ.ttf",
      fontWeight: 700,
      fontStyle: "italic",
    },
  ],
});

/* ── User-selectable fonts (Latin) ────────────────────── */

Font.register({
  family: "Lato",
  fonts: [
    { src: "https://fonts.gstatic.com/s/lato/v25/S6uyw4BMUTPHvxk.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/lato/v25/S6uyw4BMUTPHvxk.ttf", fontWeight: 500 },
    { src: "https://fonts.gstatic.com/s/lato/v25/S6u9w4BMUTPHh6UVew8.ttf", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/lato/v25/S6u9w4BMUTPHh6UVew8.ttf", fontWeight: 700 },
  ],
});

Font.register({
  family: "SourceSans3",
  fonts: [
    { src: "https://fonts.gstatic.com/s/sourcesans3/v19/nwpBtKy2OAdR1K-IwhWudF-R9QMylBJAV3Bo8Ky461EN.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/sourcesans3/v19/nwpBtKy2OAdR1K-IwhWudF-R9QMylBJAV3Bo8KyK61EN.ttf", fontWeight: 500 },
    { src: "https://fonts.gstatic.com/s/sourcesans3/v19/nwpBtKy2OAdR1K-IwhWudF-R9QMylBJAV3Bo8Kxm7FEN.ttf", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/sourcesans3/v19/nwpBtKy2OAdR1K-IwhWudF-R9QMylBJAV3Bo8Kxf7FEN.ttf", fontWeight: 700 },
  ],
});

Font.register({
  family: "Merriweather",
  fonts: [
    { src: "https://fonts.gstatic.com/s/merriweather/v33/u-4D0qyriQwlOrhSvowK_l5UcA6zuSYEqOzpPe3HOZJ5eX1WtLaQwmYiScCmDxhtNOKl8yDr3icqEw.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/merriweather/v33/u-4D0qyriQwlOrhSvowK_l5UcA6zuSYEqOzpPe3HOZJ5eX1WtLaQwmYiScCmDxhtNOKl8yDr7CcqEw.ttf", fontWeight: 500 },
    { src: "https://fonts.gstatic.com/s/merriweather/v33/u-4D0qyriQwlOrhSvowK_l5UcA6zuSYEqOzpPe3HOZJ5eX1WtLaQwmYiScCmDxhtNOKl8yDrACAqEw.ttf", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/merriweather/v33/u-4D0qyriQwlOrhSvowK_l5UcA6zuSYEqOzpPe3HOZJ5eX1WtLaQwmYiScCmDxhtNOKl8yDrOSAqEw.ttf", fontWeight: 700 },
  ],
});

/** Return the correct font family for a given locale and optional user choice */
function getFontFamily(_locale: string, userFontFamily?: string): string {
  return userFontFamily || "Inter";
}

Font.registerHyphenationCallback((word) => [word]);

/* ── Layout constants (points) ──────────────────────────── *
 * Derived from CVPreview.tsx mg() values × 0.75 (96→72 dpi).
 * Sidebar width 250px → 188pt, mg(24)=38px → 29pt,
 * mg(16)=26px → 20pt, space-y-5=20px → 15pt, space-y-4=16px → 12pt. */

const SIDEBAR_WIDTH = 188;
const PAGE_PADDING = 29;     // mg(24)=38px → 29pt
const SIDEBAR_H_PAD = 29;
const MAIN_H_PAD = 29;       // mg(24)=38px → 29pt
const SECTION_GAP = 15;   // matches space-y-5 (20px)
const ITEM_GAP = 12;      // matches space-y-4 (16px)
const PHOTO_SIZE = 108;   // w-36 h-36 (144px) × 0.75 pt/px
const NOPHOTO_PAD = 34;   // mg(28)=45px → 34pt — noPhoto template horizontal padding

/* ── SVG contact icons (Lucide paths) ───────────────────── */

function MailIcon({ size = 10, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={2} y={4} width={20} height={16} rx={2} stroke={color} strokeWidth={2} fill="none" />
      <Path d="M22 7l-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" stroke={color} strokeWidth={2} fill="none" />
    </Svg>
  );
}

function PhoneIcon({ size = 10, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
        stroke={color}
        strokeWidth={2}
        fill="none"
      />
    </Svg>
  );
}

function MapPinIcon({ size = 10, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 01-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0116 0"
        stroke={color}
        strokeWidth={2}
        fill="none"
      />
      <Circle cx={12} cy={10} r={3} stroke={color} strokeWidth={2} fill="none" />
    </Svg>
  );
}

function LinkedinIcon({ size = 10, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"
        stroke={color}
        strokeWidth={2}
        fill="none"
      />
      <Rect x={2} y={9} width={4} height={12} stroke={color} strokeWidth={2} fill="none" />
      <Circle cx={4} cy={4} r={2} stroke={color} strokeWidth={2} fill="none" />
    </Svg>
  );
}

function HeartIcon({ size = 10, color = "#aaaaaa" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3.332.882-4.5 2.286C10.832 3.882 9.26 3 7.5 3A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"
        fill={color}
      />
    </Svg>
  );
}

function GlobeIcon({ size = 10, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={2} fill="none" />
      <Path d="M12 2a14.5 14.5 0 000 20 14.5 14.5 0 000-20" stroke={color} strokeWidth={2} fill="none" />
      <Path d="M2 12h20" stroke={color} strokeWidth={2} fill="none" />
    </Svg>
  );
}

/* ── Shared sub-components ──────────────────────────────── */

function SidebarSectionHeading({
  children,
  color,
  separatorColor,
  fontSize,
}: {
  children: string;
  color: string;
  separatorColor: string;
  fontSize: number;
}) {
  return (
    <View style={{ marginBottom: 6, marginTop: 2 }}>
      <Text
        style={{
          fontSize,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 1.5,
          color,
        }}
      >
        {children}
      </Text>
      <View style={{ height: 1, backgroundColor: separatorColor, marginTop: 3 }} />
    </View>
  );
}

function MainSectionHeading({
  children,
  color,
  separatorColor,
  fontSize,
}: {
  children: string;
  color: string;
  separatorColor: string;
  fontSize: number;
}) {
  return (
    <View style={{ marginBottom: 8, marginTop: 4 }}>
      <Text
        style={{
          fontSize,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 1.5,
          color,
        }}
      >
        {children}
      </Text>
      <View style={{ height: 1, backgroundColor: separatorColor, marginTop: 4 }} />
    </View>
  );
}

function NoPhotoSectionHeading({
  children,
  color,
  fontSize,
}: {
  children: string;
  color: string;
  fontSize: number;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, marginTop: 4 }}>
      <View style={{ width: 2, height: 11, backgroundColor: color, borderRadius: 1, marginRight: 5 }} />
      <Text
        style={{
          fontSize,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 1.8,
          color,
          marginRight: 6,
        }}
      >
        {children}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: safePdfColor(color + "18") }} />
    </View>
  );
}

function ExecutiveSectionHeading({
  children,
  color,
  separatorColor,
  fontSize,
}: {
  children: string;
  color: string;
  separatorColor: string;
  fontSize: number;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, marginTop: 4 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: separatorColor }} />
      <View style={{ marginHorizontal: 6 }}>
        <Svg width={5} height={5} viewBox="0 0 5 5">
          <Path d="M2.5 0 L5 2.5 L2.5 5 L0 2.5 Z" fill={color} />
        </Svg>
      </View>
      <Text
        style={{
          fontSize,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 2,
          color,
          marginHorizontal: 2,
        }}
      >
        {children}
      </Text>
      <View style={{ marginHorizontal: 6 }}>
        <Svg width={5} height={5} viewBox="0 0 5 5">
          <Path d="M2.5 0 L5 2.5 L2.5 5 L0 2.5 Z" fill={color} />
        </Svg>
      </View>
      <View style={{ flex: 1, height: 1, backgroundColor: separatorColor }} />
    </View>
  );
}

/* ── Props ──────────────────────────────────────────────── */

export interface PDFLabels {
  contact: string;
  aboutMe: string;
  skills: string;
  experience: string;
  education: string;
  courses: string;
  certifications: string;
  awards: string;
  languages: string;
}

export interface PDFDocumentProps {
  data: CVData;
  colors: ColorScheme;
  labels: PDFLabels;
  locale?: string;
  fontScale?: number;
  marginScale?: number;
  fontFamily?: string;
  isPremium?: boolean;
}

/* ── Base styles ────────────────────────────────────────── */

const styles = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 10,
    // NOTE: Do NOT set lineHeight here — it breaks the render prop on <Text>
    // (see https://github.com/diegomura/react-pdf/issues/2988)
    // Instead, set lineHeight on individual Text elements.
    paddingTop: PAGE_PADDING,
    paddingBottom: PAGE_PADDING + 10, // extra space for page number
  },
  sidebarBg: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
  },
  columns: {
    flexDirection: "row",
    minHeight: "100%",
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    paddingLeft: SIDEBAR_H_PAD,
    paddingRight: SIDEBAR_H_PAD,
  },
  main: {
    flex: 1,
    paddingLeft: MAIN_H_PAD,
    paddingRight: MAIN_H_PAD,
  },
  pageNumber: {
    fontSize: 9,
    color: "#999999",
    fontWeight: 400,
  },
});

/** Convert any hex colour (#rrggbb or #rrggbbaa) to a format
 *  that @react-pdf/renderer can render. 6-digit hex passes through;
 *  8-digit hex is converted to an rgba() string. */
function safePdfColor(hex: string): string {
  if (hex.length <= 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const a = parseInt(hex.slice(7, 9), 16) / 255;
  return `rgba(${r}, ${g}, ${b}, ${+(a.toFixed(3))})`;
}

/** Blend 8-digit hex (#rrggbbaa) over a solid background (#rrggbb)
 *  to produce an opaque hex safe for SVG fills. */
function blendOver(fg: string, bg: string): string {
  if (fg.length <= 7) return fg;
  const a = parseInt(fg.slice(7, 9), 16) / 255;
  const r = Math.round(parseInt(fg.slice(1, 3), 16) * a + parseInt(bg.slice(1, 3), 16) * (1 - a));
  const g = Math.round(parseInt(fg.slice(3, 5), 16) * a + parseInt(bg.slice(3, 5), 16) * (1 - a));
  const b = Math.round(parseInt(fg.slice(5, 7), 16) * a + parseInt(bg.slice(5, 7), 16) * (1 - a));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}


/* ── PDF Dots Pattern ──────────────────────────────────── */

/* ── Document component ─────────────────────────────────── */

function CVPDFDocument({ data, colors, labels, locale = "en", fontScale = 1.08, fontFamily: userFontFamily, isPremium }: PDFDocumentProps) {
  const {
    personalInfo,
    summary,
    experiences,
    education,
    skillCategories,
    courses,
    certifications,
    awards,
    languages,
    visibility,
  } = data;
  const sidebarSections = data.sidebarSections ?? DEFAULT_SIDEBAR_SECTIONS;
  const templateId = data.templateId ?? "classic";

  // PrintableCV uses CSS pixels; react-pdf uses PDF points.
  // A4 is the same physical size in both, so we convert: 1px = 0.75pt (96dpi → 72dpi).
  // Base values below match PrintableCV.tsx exactly (in px), converted here automatically.
  const PX_TO_PT = 0.75;
  const fs = (px: number) => Math.round(px * fontScale * PX_TO_PT);

  const initials = personalInfo.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const hasContact =
    personalInfo.email ||
    personalInfo.phone ||
    (visibility.location && personalInfo.location) ||
    (visibility.linkedin && personalInfo.linkedin) ||
    (visibility.website && personalInfo.website);

  // Use sidebarText for icons — sidebarMuted may contain 8-digit hex (#ffffff66)
  // which React-PDF doesn't render correctly in SVG strokes
  const iconColor = colors.sidebarText;
  const fontFamily = getFontFamily(locale, userFontFamily);

  return (
    <Document>
      <Page size="A4" style={[styles.page, { fontFamily }]}>
        {/* Fixed sidebar background — classic template only */}
        {templateId === "classic" && (
          <View
            style={[styles.sidebarBg, { backgroundColor: colors.sidebarBg }]}
            fixed
          />
        )}

        {/* ===== Classic: two-column layout ===== */}
        {templateId === "classic" && (
        <View style={styles.columns}>
          {/* ===== SIDEBAR ===== */}
          <View style={styles.sidebar}>
            {/* Photo / Initials — always render initials as base layer;
                photo overlays on top (mirrors PrintableCV pattern so
                silent Image failures still show initials) */}
            <View style={{ alignItems: "center", marginBottom: SECTION_GAP }}>
              <View style={{ width: PHOTO_SIZE, height: PHOTO_SIZE }}>
                {/* Base layer: initials circle (always rendered)
                    Uses sidebarText at low opacity for subtle contrast on any sidebar color */}
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: PHOTO_SIZE,
                    height: PHOTO_SIZE,
                    borderRadius: PHOTO_SIZE / 2,
                    backgroundColor: safePdfColor(colors.sidebarText + "33"),
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: fs(22),
                      fontWeight: 500,
                      color: safePdfColor(colors.sidebarMuted),
                      letterSpacing: 1,
                    }}
                  >
                    {initials}
                  </Text>
                </View>
                {/* Overlay: photo on top (if available).
                    Wrap in a clipping View because react-pdf doesn't clip
                    borderRadius on <Image> directly. */}
                {personalInfo.photoUrl && (
                  <View
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: PHOTO_SIZE,
                      height: PHOTO_SIZE,
                      borderRadius: PHOTO_SIZE / 2,
                      overflow: "hidden",
                    }}
                  >
                    {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image is PDF-only, not an HTML <img> */}
                    <Image
                      src={personalInfo.photoUrl}
                      style={{
                        width: PHOTO_SIZE,
                        height: PHOTO_SIZE,
                        objectFit: "cover",
                      }}
                    />
                  </View>
                )}
              </View>
            </View>

            {sidebarSections.map((sectionId) => {
              if (sectionId === "contact") {
                if (!hasContact) return null;
                return (
                  <View key="contact" style={{ marginBottom: SECTION_GAP }}>
                    <SidebarSectionHeading
                      color={colors.sidebarText}
                      separatorColor={colors.sidebarSeparator}
                      fontSize={fs(10)}
                    >
                      {labels.contact}
                    </SidebarSectionHeading>
                    <View style={{ gap: 5 }}>
                      {personalInfo.email && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                          <MailIcon size={9} color={iconColor} />
                          <Link src={`mailto:${personalInfo.email}`} style={{ fontSize: fs(11), color: colors.sidebarText, flex: 1, textDecoration: "none" }}>
                            {personalInfo.email}
                          </Link>
                        </View>
                      )}
                      {personalInfo.phone && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                          <PhoneIcon size={9} color={iconColor} />
                          <Link src={`tel:${personalInfo.phone}`} style={{ fontSize: fs(11), color: colors.sidebarText, flex: 1, textDecoration: "none" }}>
                            {personalInfo.phone}
                          </Link>
                        </View>
                      )}
                      {visibility.location && personalInfo.location && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                          <MapPinIcon size={9} color={iconColor} />
                          <Text style={{ fontSize: fs(11), color: colors.sidebarText, flex: 1 }}>
                            {personalInfo.location}
                          </Text>
                        </View>
                      )}
                      {visibility.linkedin && personalInfo.linkedin && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                          <LinkedinIcon size={9} color={iconColor} />
                          {personalInfo.linkedinUrl ? (
                            <Link src={personalInfo.linkedinUrl} style={{ fontSize: fs(11), color: colors.sidebarText, flex: 1, textDecoration: "none" }}>
                              {personalInfo.linkedin}
                            </Link>
                          ) : (
                            <Text style={{ fontSize: fs(11), color: colors.sidebarText, flex: 1 }}>
                              {personalInfo.linkedin}
                            </Text>
                          )}
                        </View>
                      )}
                      {visibility.website && personalInfo.website && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                          <GlobeIcon size={9} color={iconColor} />
                          {personalInfo.websiteUrl ? (
                            <Link src={personalInfo.websiteUrl} style={{ fontSize: fs(11), color: colors.sidebarText, flex: 1, textDecoration: "none" }}>
                              {personalInfo.website}
                            </Link>
                          ) : (
                            <Text style={{ fontSize: fs(11), color: colors.sidebarText, flex: 1 }}>
                              {personalInfo.website}
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                );
              }
              if (sectionId === "summary") {
                if (!visibility.summary || !summary) return null;
                return (
                  <View key="summary" style={{ marginBottom: SECTION_GAP }}>
                    <SidebarSectionHeading
                      color={colors.sidebarText}
                      separatorColor={colors.sidebarSeparator}
                      fontSize={fs(10)}
                    >
                      {labels.aboutMe}
                    </SidebarSectionHeading>
                    <PdfRichText html={summary} style={{ fontSize: fs(11), color: colors.sidebarText, lineHeight: 1.5 }} />
                  </View>
                );
              }
              if (sectionId === "skills") {
                if (skillCategories.length === 0) return null;
                return (
                  <View key="skills">
                    <SidebarSectionHeading
                      color={colors.sidebarText}
                      separatorColor={colors.sidebarSeparator}
                      fontSize={fs(10)}
                    >
                      {labels.skills}
                    </SidebarSectionHeading>
                    <View style={{ gap: 8 }}>
                      {skillCategories.map((skillGroup) => (
                        <View key={skillGroup.id} wrap={false}>
                          <Text
                            style={{
                              fontSize: fs(10),
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                              color: colors.sidebarText,
                              marginBottom: 3,
                            }}
                          >
                            {skillGroup.category}
                          </Text>
                          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 3 }}>
                            {skillGroup.items.map((item, i) => (
                              <View
                                key={i}
                                style={{
                                  backgroundColor: safePdfColor(colors.sidebarBadgeBg),
                                  borderRadius: 3,
                                  paddingHorizontal: 5,
                                  paddingVertical: 2,
                                }}
                              >
                                <Text style={{ fontSize: fs(10), color: colors.sidebarBadgeText }}>
                                  {item}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              }
              if (sectionId === "languages") {
                if (!visibility.languages || !languages || languages.length === 0) return null;
                return (
                  <View key="languages" style={{ marginBottom: SECTION_GAP }}>
                    <SidebarSectionHeading
                      color={colors.sidebarText}
                      separatorColor={colors.sidebarSeparator}
                      fontSize={fs(10)}
                    >
                      {labels.languages}
                    </SidebarSectionHeading>
                    <View style={{ gap: 5 }}>
                      {languages.map((lang) => (
                        <View key={lang.id} style={{ flexDirection: "row", gap: 4 }}>
                          <Text style={{ fontSize: fs(11), fontWeight: 600, color: colors.sidebarText, flex: 1 }}>
                            {lang.language}
                          </Text>
                          <Text style={{ fontSize: fs(11), color: colors.sidebarMuted, flex: 1 }}>
                            {lang.level}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              }
              return null;
            })}
          </View>

          {/* ===== MAIN CONTENT ===== */}
          <View style={styles.main}>
            {/* Header: Name + Title */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: fs(24),
                  fontWeight: 600,
                  color: "#111827",
                  letterSpacing: -0.5,
                }}
              >
                {personalInfo.fullName}
              </Text>
              {colors.nameAccent !== "transparent" && (
                <View
                  style={{
                    height: 2,
                    width: 36,
                    backgroundColor: colors.nameAccent,
                    borderRadius: 1,
                    marginTop: 5,
                    marginBottom: 5,
                  }}
                />
              )}
              <Text
                style={{
                  fontSize: fs(14),
                  fontWeight: 500,
                  color: "#4b5563",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginTop: 0,
                }}
              >
                {personalInfo.jobTitle}
              </Text>
            </View>

            {/* Experience */}
            {experiences.length > 0 && (
              <View style={{ marginBottom: SECTION_GAP }}>
                {/* Heading + first entry kept together */}
                <View wrap={false}>
                  <MainSectionHeading
                    color={colors.heading}
                    separatorColor={colors.separator}
                    fontSize={fs(10)}
                  >
                    {labels.experience}
                  </MainSectionHeading>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>
                      {experiences[0].company}
                    </Text>
                    <Text style={{ fontSize: fs(10), color: "#6b7280", flexShrink: 0, marginTop: 2 }}>
                      {experiences[0].startDate} — {experiences[0].endDate}
                    </Text>
                  </View>
                  <Text style={{ fontSize: fs(10), fontWeight: 500, color: "#6b7280", marginTop: 2 }}>
                    {experiences[0].position}
                  </Text>
                  {experiences[0].description.length > 0 && (
                    <View style={{ marginTop: 4 }}>
                      <PdfRichDocument html={experiences[0].description} fontSize={fs(11)} bulletColor={colors.bullet} />
                    </View>
                  )}
                </View>
                {/* Remaining entries */}
                {experiences.slice(1).map((exp) => (
                  <View key={exp.id} wrap={false} style={{ marginTop: ITEM_GAP }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>
                        {exp.company}
                      </Text>
                      <Text style={{ fontSize: fs(10), color: "#6b7280", flexShrink: 0, marginTop: 2 }}>
                        {exp.startDate} — {exp.endDate}
                      </Text>
                    </View>
                    <Text style={{ fontSize: fs(10), fontWeight: 500, color: "#6b7280", marginTop: 2 }}>
                      {exp.position}
                    </Text>
                    {exp.description.length > 0 && (
                      <View style={{ marginTop: 4 }}>
                        <PdfRichDocument html={exp.description} fontSize={fs(11)} bulletColor={colors.bullet} />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Education */}
            {education.length > 0 && (
              <View style={{ marginBottom: SECTION_GAP }}>
                <View wrap={false}>
                  <MainSectionHeading
                    color={colors.heading}
                    separatorColor={colors.separator}
                    fontSize={fs(10)}
                  >
                    {labels.education}
                  </MainSectionHeading>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>
                      {education[0].institution}
                    </Text>
                    <Text style={{ fontSize: fs(10), color: "#6b7280", flexShrink: 0, marginTop: 2 }}>
                      {education[0].startDate} — {education[0].endDate}
                    </Text>
                  </View>
                  <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>
                    {education[0].degree}
                  </Text>
                  {education[0].description && (
                    <View style={{ marginTop: 4 }}>
                      <PdfRichDocument html={education[0].description} fontSize={fs(11)} bulletColor={colors.bullet} />
                    </View>
                  )}
                </View>
                {education.slice(1).map((edu) => (
                  <View key={edu.id} wrap={false} style={{ marginTop: ITEM_GAP }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>
                        {edu.institution}
                      </Text>
                      <Text style={{ fontSize: fs(10), color: "#6b7280", flexShrink: 0, marginTop: 2 }}>
                        {edu.startDate} — {edu.endDate}
                      </Text>
                    </View>
                    <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>
                      {edu.degree}
                    </Text>
                    {edu.description && (
                      <View style={{ marginTop: 4 }}>
                        <PdfRichDocument html={edu.description} fontSize={fs(11)} bulletColor={colors.bullet} />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Courses */}
            {visibility.courses && courses.length > 0 && (
              <View style={{ marginBottom: SECTION_GAP }}>
                <View wrap={false}>
                  <MainSectionHeading
                    color={colors.heading}
                    separatorColor={colors.separator}
                    fontSize={fs(10)}
                  >
                    {labels.courses}
                  </MainSectionHeading>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>
                      {courses[0].name}
                    </Text>
                    <Text style={{ fontSize: fs(10), color: "#6b7280", flexShrink: 0, marginTop: 2 }}>
                      {courses[0].date}
                    </Text>
                  </View>
                  <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>
                    {courses[0].institution}
                  </Text>
                  {courses[0].description && (
                    <View style={{ marginTop: 4 }}>
                      <PdfRichDocument html={courses[0].description} fontSize={fs(11)} bulletColor={colors.bullet} />
                    </View>
                  )}
                </View>
                {courses.slice(1).map((course) => (
                  <View key={course.id} wrap={false} style={{ marginTop: 8 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>
                        {course.name}
                      </Text>
                      <Text style={{ fontSize: fs(10), color: "#6b7280", flexShrink: 0, marginTop: 2 }}>
                        {course.date}
                      </Text>
                    </View>
                    <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>
                      {course.institution}
                    </Text>
                    {course.description && (
                      <View style={{ marginTop: 4 }}>
                        <PdfRichDocument html={course.description} fontSize={fs(11)} bulletColor={colors.bullet} />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Certifications */}
            {visibility.certifications && certifications.length > 0 && (
              <View style={{ marginBottom: SECTION_GAP }}>
                <View wrap={false}>
                  <MainSectionHeading
                    color={colors.heading}
                    separatorColor={colors.separator}
                    fontSize={fs(10)}
                  >
                    {labels.certifications}
                  </MainSectionHeading>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>
                      {certifications[0].name}
                    </Text>
                    <Text style={{ fontSize: fs(10), color: "#6b7280", flexShrink: 0, marginTop: 2 }}>
                      {certifications[0].date}
                    </Text>
                  </View>
                  <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>
                    {certifications[0].issuer}
                  </Text>
                  {certifications[0].description && (
                    <View style={{ marginTop: 4 }}>
                      <PdfRichDocument html={certifications[0].description} fontSize={fs(11)} bulletColor={colors.bullet} />
                    </View>
                  )}
                </View>
                {certifications.slice(1).map((cert) => (
                  <View key={cert.id} wrap={false} style={{ marginTop: 8 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>
                        {cert.name}
                      </Text>
                      <Text style={{ fontSize: fs(10), color: "#6b7280", flexShrink: 0, marginTop: 2 }}>
                        {cert.date}
                      </Text>
                    </View>
                    <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>
                      {cert.issuer}
                    </Text>
                    {cert.description && (
                      <View style={{ marginTop: 4 }}>
                        <PdfRichDocument html={cert.description} fontSize={fs(11)} bulletColor={colors.bullet} />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Awards */}
            {visibility.awards && awards.length > 0 && (
              <View style={{ marginBottom: SECTION_GAP }}>
                <View wrap={false}>
                  <MainSectionHeading
                    color={colors.heading}
                    separatorColor={colors.separator}
                    fontSize={fs(10)}
                  >
                    {labels.awards}
                  </MainSectionHeading>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>
                      {awards[0].name}
                    </Text>
                    <Text style={{ fontSize: fs(10), color: "#6b7280", flexShrink: 0, marginTop: 2 }}>
                      {awards[0].date}
                    </Text>
                  </View>
                  <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>
                    {awards[0].issuer}
                  </Text>
                  {awards[0].description && (
                    <View style={{ marginTop: 4 }}>
                      <PdfRichDocument html={awards[0].description} fontSize={fs(11)} bulletColor={colors.bullet} />
                    </View>
                  )}
                </View>
                {awards.slice(1).map((award) => (
                  <View key={award.id} wrap={false} style={{ marginTop: 8 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>
                        {award.name}
                      </Text>
                      <Text style={{ fontSize: fs(10), color: "#6b7280", flexShrink: 0, marginTop: 2 }}>
                        {award.date}
                      </Text>
                    </View>
                    <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>
                      {award.issuer}
                    </Text>
                    {award.description && (
                      <View style={{ marginTop: 4 }}>
                        <PdfRichDocument html={award.description} fontSize={fs(11)} bulletColor={colors.bullet} />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
        )}

        {/* ===== Executive: single-column centered layout ===== */}
        {templateId === "executive" && (
          <>
          {/* Top accent bar */}
          <View style={{ height: 6, backgroundColor: colors.heading, marginTop: -PAGE_PADDING }} />

          <View style={{ paddingHorizontal: NOPHOTO_PAD }}>
            {/* Header — centered */}
            <View style={{ paddingTop: 22, paddingBottom: 6, alignItems: "center" }}>
              {/* Photo / Initials */}
              <View style={{ alignItems: "center", marginBottom: 12 }}>
                {personalInfo.photoUrl ? (
                  <View style={{ width: 90, height: 90, borderRadius: 45, overflow: "hidden" }}>
                    {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image is PDF-only, not an HTML <img> */}
                    <Image src={personalInfo.photoUrl} style={{ width: 90, height: 90, objectFit: "cover" }} />
                  </View>
                ) : (
                  <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: safePdfColor(`${colors.heading}12`), alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 28, fontWeight: 500, color: colors.heading }}>
                      {personalInfo.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: fs(24), fontWeight: 600, color: colors.heading, letterSpacing: -0.3 }}>
                {personalInfo.fullName}
              </Text>
              {colors.nameAccent !== "transparent" && (
                <View style={{ height: 3, width: 40, backgroundColor: colors.nameAccent, borderRadius: 1, marginTop: 6 }} />
              )}
              <Text style={{ fontSize: fs(12), fontWeight: 500, color: safePdfColor(colors.heading + "BF"), textTransform: "uppercase", letterSpacing: 0.5, marginTop: 7 }}>
                {personalInfo.jobTitle}
              </Text>
            </View>

            {/* Tinted contact bar */}
            {hasContact && (
              <View style={{ backgroundColor: safePdfColor(colors.heading + "0A"), paddingVertical: 8, paddingHorizontal: NOPHOTO_PAD, marginHorizontal: -NOPHOTO_PAD }}>
                <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center" }}>
                  {[
                    personalInfo.email ? { key: "email", value: personalInfo.email } : null,
                    personalInfo.phone ? { key: "phone", value: personalInfo.phone } : null,
                    (visibility.location && personalInfo.location) ? { key: "loc", value: personalInfo.location } : null,
                    (visibility.linkedin && personalInfo.linkedin) ? { key: "li", value: personalInfo.linkedin } : null,
                    (visibility.website && personalInfo.website) ? { key: "web", value: personalInfo.website } : null,
                  ]
                    .filter((x): x is { key: string; value: string } => Boolean(x))
                    .map(({ key, value }, idx) => (
                      <View key={key} style={{ flexDirection: "row", alignItems: "center" }}>
                        {idx > 0 && (
                          <Text style={{ fontSize: fs(9), color: "#cbd5e1", marginHorizontal: 6 }}>|</Text>
                        )}
                        <Text style={{ fontSize: fs(10), color: "#64748b" }}>{value}</Text>
                      </View>
                    ))}
                </View>
              </View>
            )}

            {/* Double rule separator */}
            <View style={{ marginBottom: 14, marginTop: 6 }}>
              <View style={{ height: 1, backgroundColor: colors.separator }} />
              <View style={{ height: 3 }} />
              <View style={{ height: 1, backgroundColor: colors.separator }} />
            </View>

            {/* Summary */}
            {visibility.summary && summary && (
              <View style={{ marginBottom: SECTION_GAP }}>
                <ExecutiveSectionHeading color={colors.heading} separatorColor={colors.separator} fontSize={fs(8)}>
                  {labels.aboutMe}
                </ExecutiveSectionHeading>
                <PdfRichText html={summary} style={{ fontSize: fs(11), color: "#374151", lineHeight: 1.6 }} />
              </View>
            )}

            {/* Experience */}
            {experiences.length > 0 && (
              <View style={{ marginBottom: SECTION_GAP }}>
                <View wrap={false}>
                  <ExecutiveSectionHeading color={colors.heading} separatorColor={colors.separator} fontSize={fs(8)}>
                    {labels.experience}
                  </ExecutiveSectionHeading>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{experiences[0].company}</Text>
                    <Text style={{ fontSize: fs(10), color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>{experiences[0].startDate} — {experiences[0].endDate}</Text>
                  </View>
                  <Text style={{ fontSize: fs(10), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{experiences[0].position}</Text>
                  {experiences[0].description.length > 0 && (
                    <View style={{ marginTop: 4 }}>
                      <PdfRichDocument html={experiences[0].description} fontSize={fs(11)} bulletColor={colors.bullet} />
                    </View>
                  )}
                </View>
                {experiences.slice(1).map((exp) => (
                  <View key={exp.id} wrap={false} style={{ marginTop: ITEM_GAP }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{exp.company}</Text>
                      <Text style={{ fontSize: fs(10), color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>{exp.startDate} — {exp.endDate}</Text>
                    </View>
                    <Text style={{ fontSize: fs(10), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{exp.position}</Text>
                    {exp.description.length > 0 && (
                      <View style={{ marginTop: 4 }}>
                        <PdfRichDocument html={exp.description} fontSize={fs(11)} bulletColor={colors.bullet} />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Education */}
            {education.length > 0 && (
              <View style={{ marginBottom: SECTION_GAP }}>
                <View wrap={false}>
                  <ExecutiveSectionHeading color={colors.heading} separatorColor={colors.separator} fontSize={fs(8)}>
                    {labels.education}
                  </ExecutiveSectionHeading>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{education[0].institution}</Text>
                    <Text style={{ fontSize: fs(10), color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>{education[0].startDate} — {education[0].endDate}</Text>
                  </View>
                  <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{education[0].degree}</Text>
                  {education[0].description && (
                    <View style={{ marginTop: 4 }}>
                      <PdfRichDocument html={education[0].description} fontSize={fs(11)} bulletColor={colors.bullet} />
                    </View>
                  )}
                </View>
                {education.slice(1).map((edu) => (
                  <View key={edu.id} wrap={false} style={{ marginTop: ITEM_GAP }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{edu.institution}</Text>
                      <Text style={{ fontSize: fs(10), color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>{edu.startDate} — {edu.endDate}</Text>
                    </View>
                    <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{edu.degree}</Text>
                    {edu.description && (
                      <View style={{ marginTop: 4 }}>
                        <PdfRichDocument html={edu.description} fontSize={fs(11)} bulletColor={colors.bullet} />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Courses */}
            {visibility.courses && courses.length > 0 && (
              <View style={{ marginBottom: SECTION_GAP }}>
                <View wrap={false}>
                  <ExecutiveSectionHeading color={colors.heading} separatorColor={colors.separator} fontSize={fs(8)}>
                    {labels.courses}
                  </ExecutiveSectionHeading>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{courses[0].name}</Text>
                    <Text style={{ fontSize: fs(10), color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>{courses[0].date}</Text>
                  </View>
                  <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{courses[0].institution}</Text>
                  {courses[0].description && (
                    <View style={{ marginTop: 4 }}>
                      <PdfRichDocument html={courses[0].description} fontSize={fs(11)} bulletColor={colors.bullet} />
                    </View>
                  )}
                </View>
                {courses.slice(1).map((course) => (
                  <View key={course.id} wrap={false} style={{ marginTop: 8 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{course.name}</Text>
                      <Text style={{ fontSize: fs(10), color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>{course.date}</Text>
                    </View>
                    <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{course.institution}</Text>
                    {course.description && (
                      <View style={{ marginTop: 4 }}>
                        <PdfRichDocument html={course.description} fontSize={fs(11)} bulletColor={colors.bullet} />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Certifications */}
            {visibility.certifications && certifications.length > 0 && (
              <View style={{ marginBottom: SECTION_GAP }}>
                <View wrap={false}>
                  <ExecutiveSectionHeading color={colors.heading} separatorColor={colors.separator} fontSize={fs(8)}>
                    {labels.certifications}
                  </ExecutiveSectionHeading>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{certifications[0].name}</Text>
                    <Text style={{ fontSize: fs(10), color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>{certifications[0].date}</Text>
                  </View>
                  <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{certifications[0].issuer}</Text>
                  {certifications[0].description && (
                    <View style={{ marginTop: 4 }}>
                      <PdfRichDocument html={certifications[0].description} fontSize={fs(11)} bulletColor={colors.bullet} />
                    </View>
                  )}
                </View>
                {certifications.slice(1).map((cert) => (
                  <View key={cert.id} wrap={false} style={{ marginTop: 8 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{cert.name}</Text>
                      <Text style={{ fontSize: fs(10), color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>{cert.date}</Text>
                    </View>
                    <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{cert.issuer}</Text>
                    {cert.description && (
                      <View style={{ marginTop: 4 }}>
                        <PdfRichDocument html={cert.description} fontSize={fs(11)} bulletColor={colors.bullet} />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Awards */}
            {visibility.awards && awards.length > 0 && (
              <View style={{ marginBottom: SECTION_GAP }}>
                <View wrap={false}>
                  <ExecutiveSectionHeading color={colors.heading} separatorColor={colors.separator} fontSize={fs(8)}>
                    {labels.awards}
                  </ExecutiveSectionHeading>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{awards[0].name}</Text>
                    <Text style={{ fontSize: fs(10), color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>{awards[0].date}</Text>
                  </View>
                  <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{awards[0].issuer}</Text>
                  {awards[0].description && (
                    <View style={{ marginTop: 4 }}>
                      <PdfRichDocument html={awards[0].description} fontSize={fs(11)} bulletColor={colors.bullet} />
                    </View>
                  )}
                </View>
                {awards.slice(1).map((award) => (
                  <View key={award.id} wrap={false} style={{ marginTop: 8 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{award.name}</Text>
                      <Text style={{ fontSize: fs(10), color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>{award.date}</Text>
                    </View>
                    <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{award.issuer}</Text>
                    {award.description && (
                      <View style={{ marginTop: 4 }}>
                        <PdfRichDocument html={award.description} fontSize={fs(11)} bulletColor={colors.bullet} />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Languages — inline with level in parentheses */}
            {visibility.languages && languages && languages.length > 0 && (
              <View style={{ marginBottom: SECTION_GAP }}>
                <ExecutiveSectionHeading color={colors.heading} separatorColor={colors.separator} fontSize={fs(8)}>
                  {labels.languages}
                </ExecutiveSectionHeading>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
                  {languages.map((lang, idx) => (
                    <View key={lang.id} style={{ flexDirection: "row" }}>
                      {idx > 0 && <Text style={{ fontSize: fs(11), color: "#cbd5e1", marginHorizontal: 4 }}>·</Text>}
                      <Text style={{ fontSize: fs(11), color: "#111827" }}>
                        {lang.language}{lang.level ? ` (${lang.level})` : ""}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Skills */}
            {skillCategories.length > 0 && (
              <View style={{ marginBottom: SECTION_GAP }}>
                <ExecutiveSectionHeading color={colors.heading} separatorColor={colors.separator} fontSize={fs(8)}>
                  {labels.skills}
                </ExecutiveSectionHeading>
                <View style={{ gap: 5 }}>
                  {skillCategories.map((cat) => (
                    <View key={cat.id} wrap={false}>
                      <Text style={{ fontSize: fs(9), fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: colors.heading, marginBottom: 3 }}>
                        {cat.category}
                      </Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 3 }}>
                        {cat.items.map((skill, i) => (
                          <View key={i} style={{ borderWidth: 1.5, borderColor: colors.heading, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2 }}>
                            <Text style={{ fontSize: fs(10), color: colors.heading }}>{skill}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
          </>
        )}

        {/* ===== Modern: two-column layout (main left + sidebar right) ===== */}
        {templateId === "modern" && (
          <>
            {/* Top accent strip */}
            <View style={{ height: 4, backgroundColor: colors.nameAccent, marginTop: -PAGE_PADDING }} />
            {/* Fixed sidebar background — right side (solid heading color) */}
            <View fixed style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 200, backgroundColor: colors.heading }} />

            {/* Header — full-width */}
            <View style={{ paddingHorizontal: NOPHOTO_PAD, paddingTop: 20, paddingBottom: 10 }}>
              <Text style={{ fontSize: fs(24), fontWeight: 600, color: colors.heading, letterSpacing: -0.3 }}>
                {personalInfo.fullName}
              </Text>
              {colors.nameAccent !== "transparent" && (
                <View style={{ height: 2, width: 32, backgroundColor: colors.nameAccent, borderRadius: 1, marginTop: 4, marginBottom: 4 }} />
              )}
              <Text style={{ fontSize: fs(12), fontWeight: 500, color: safePdfColor(colors.heading + "BF"), textTransform: "uppercase", letterSpacing: 0.5 }}>
                {personalInfo.jobTitle}
              </Text>
            </View>

            {/* Two columns */}
            <View style={{ flexDirection: "row", flex: 1 }}>
              {/* Main content (left) */}
              <View style={{ flex: 1, paddingLeft: NOPHOTO_PAD, paddingRight: 14 }}>
                {/* Experience */}
                {experiences.length > 0 && (
                  <View style={{ marginBottom: SECTION_GAP }}>
                    <View wrap={false}>
                      <NoPhotoSectionHeading color={colors.heading} fontSize={fs(10)}>
                        {labels.experience}
                      </NoPhotoSectionHeading>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{experiences[0].company}</Text>
                        <Text style={{ fontSize: fs(10), color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>{experiences[0].startDate} — {experiences[0].endDate}</Text>
                      </View>
                      <Text style={{ fontSize: fs(10), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{experiences[0].position}</Text>
                      {experiences[0].description.length > 0 && (
                        <View style={{ marginTop: 4 }}>
                          <PdfRichDocument html={experiences[0].description} fontSize={fs(11)} bulletColor={colors.bullet} />
                        </View>
                      )}
                    </View>
                    {experiences.slice(1).map((exp) => (
                      <View key={exp.id} wrap={false} style={{ marginTop: ITEM_GAP }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{exp.company}</Text>
                          <Text style={{ fontSize: fs(10), color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>{exp.startDate} — {exp.endDate}</Text>
                        </View>
                        <Text style={{ fontSize: fs(10), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{exp.position}</Text>
                        {exp.description.length > 0 && (
                          <View style={{ marginTop: 4 }}>
                            <PdfRichDocument html={exp.description} fontSize={fs(11)} bulletColor={colors.bullet} />
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Education */}
                {education.length > 0 && (
                  <View style={{ marginBottom: SECTION_GAP }}>
                    <View wrap={false}>
                      <NoPhotoSectionHeading color={colors.heading} fontSize={fs(10)}>
                        {labels.education}
                      </NoPhotoSectionHeading>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{education[0].institution}</Text>
                        <Text style={{ fontSize: fs(10), color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>{education[0].startDate} — {education[0].endDate}</Text>
                      </View>
                      <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{education[0].degree}</Text>
                      {education[0].description && (
                        <View style={{ marginTop: 4 }}>
                          <PdfRichDocument html={education[0].description} fontSize={fs(11)} bulletColor={colors.bullet} />
                        </View>
                      )}
                    </View>
                    {education.slice(1).map((edu) => (
                      <View key={edu.id} wrap={false} style={{ marginTop: ITEM_GAP }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{edu.institution}</Text>
                          <Text style={{ fontSize: fs(10), color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>{edu.startDate} — {edu.endDate}</Text>
                        </View>
                        <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{edu.degree}</Text>
                        {edu.description && (
                          <View style={{ marginTop: 4 }}>
                            <PdfRichDocument html={edu.description} fontSize={fs(11)} bulletColor={colors.bullet} />
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Courses */}
                {visibility.courses && courses.length > 0 && (
                  <View style={{ marginBottom: SECTION_GAP }}>
                    <View wrap={false}>
                      <NoPhotoSectionHeading color={colors.heading} fontSize={fs(10)}>{labels.courses}</NoPhotoSectionHeading>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{courses[0].name}</Text>
                        <Text style={{ fontSize: fs(10), color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>{courses[0].date}</Text>
                      </View>
                      <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{courses[0].institution}</Text>
                      {courses[0].description && (<View style={{ marginTop: 4 }}><PdfRichDocument html={courses[0].description} fontSize={fs(11)} bulletColor={colors.bullet} /></View>)}
                    </View>
                    {courses.slice(1).map((course) => (
                      <View key={course.id} wrap={false} style={{ marginTop: 8 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{course.name}</Text>
                          <Text style={{ fontSize: fs(10), color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>{course.date}</Text>
                        </View>
                        <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{course.institution}</Text>
                        {course.description && (<View style={{ marginTop: 4 }}><PdfRichDocument html={course.description} fontSize={fs(11)} bulletColor={colors.bullet} /></View>)}
                      </View>
                    ))}
                  </View>
                )}

                {/* Certifications */}
                {visibility.certifications && certifications.length > 0 && (
                  <View style={{ marginBottom: SECTION_GAP }}>
                    <View wrap={false}>
                      <NoPhotoSectionHeading color={colors.heading} fontSize={fs(10)}>{labels.certifications}</NoPhotoSectionHeading>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{certifications[0].name}</Text>
                        <Text style={{ fontSize: fs(10), color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>{certifications[0].date}</Text>
                      </View>
                      <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{certifications[0].issuer}</Text>
                      {certifications[0].description && (<View style={{ marginTop: 4 }}><PdfRichDocument html={certifications[0].description} fontSize={fs(11)} bulletColor={colors.bullet} /></View>)}
                    </View>
                    {certifications.slice(1).map((cert) => (
                      <View key={cert.id} wrap={false} style={{ marginTop: 8 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{cert.name}</Text>
                          <Text style={{ fontSize: fs(10), color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>{cert.date}</Text>
                        </View>
                        <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{cert.issuer}</Text>
                        {cert.description && (<View style={{ marginTop: 4 }}><PdfRichDocument html={cert.description} fontSize={fs(11)} bulletColor={colors.bullet} /></View>)}
                      </View>
                    ))}
                  </View>
                )}

                {/* Awards */}
                {visibility.awards && awards.length > 0 && (
                  <View style={{ marginBottom: SECTION_GAP }}>
                    <View wrap={false}>
                      <NoPhotoSectionHeading color={colors.heading} fontSize={fs(10)}>{labels.awards}</NoPhotoSectionHeading>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{awards[0].name}</Text>
                        <Text style={{ fontSize: fs(10), color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>{awards[0].date}</Text>
                      </View>
                      <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{awards[0].issuer}</Text>
                      {awards[0].description && (<View style={{ marginTop: 4 }}><PdfRichDocument html={awards[0].description} fontSize={fs(11)} bulletColor={colors.bullet} /></View>)}
                    </View>
                    {awards.slice(1).map((award) => (
                      <View key={award.id} wrap={false} style={{ marginTop: 8 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{award.name}</Text>
                          <Text style={{ fontSize: fs(10), color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>{award.date}</Text>
                        </View>
                        <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{award.issuer}</Text>
                        {award.description && (<View style={{ marginTop: 4 }}><PdfRichDocument html={award.description} fontSize={fs(11)} bulletColor={colors.bullet} /></View>)}
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Sidebar (right) — white text on solid heading background */}
              <View style={{ width: 200, paddingHorizontal: 14 }}>
                {/* Photo / Initials */}
                <View style={{ alignItems: "center", marginBottom: 16 }}>
                  {personalInfo.photoUrl ? (
                    <View style={{ width: 90, height: 90, borderRadius: 45, overflow: "hidden" }}>
                      {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image is PDF-only, not an HTML <img> */}
                      <Image src={personalInfo.photoUrl} style={{ width: 90, height: 90, objectFit: "cover" }} />
                    </View>
                  ) : (
                    <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontSize: 28, fontWeight: 500, color: "rgba(255,255,255,0.85)" }}>
                        {personalInfo.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Contact */}
                {hasContact && (
                  <View style={{ marginBottom: SECTION_GAP }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, marginTop: 4 }}>
                      <View style={{ width: 2, height: 11, backgroundColor: colors.nameAccent, borderRadius: 1, marginRight: 5 }} />
                      <Text style={{ fontSize: fs(9), fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.8, color: "#ffffff" }}>
                        {labels.contact}
                      </Text>
                    </View>
                    <View style={{ gap: 5 }}>
                      {personalInfo.email && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <MailIcon size={8} color="#ffffff" />
                          <Link src={`mailto:${personalInfo.email}`} style={{ fontSize: fs(9), color: "#ffffff", textDecoration: "none" }}>{personalInfo.email}</Link>
                        </View>
                      )}
                      {personalInfo.phone && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <PhoneIcon size={8} color="#ffffff" />
                          <Link src={`tel:${personalInfo.phone}`} style={{ fontSize: fs(9), color: "#ffffff", textDecoration: "none" }}>{personalInfo.phone}</Link>
                        </View>
                      )}
                      {visibility.location && personalInfo.location && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <MapPinIcon size={8} color="#ffffff" />
                          <Text style={{ fontSize: fs(9), color: "#ffffff" }}>{personalInfo.location}</Text>
                        </View>
                      )}
                      {visibility.linkedin && personalInfo.linkedin && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <LinkedinIcon size={8} color="#ffffff" />
                          {personalInfo.linkedinUrl ? (
                            <Link src={personalInfo.linkedinUrl} style={{ fontSize: fs(9), color: "#ffffff", textDecoration: "none" }}>{personalInfo.linkedin}</Link>
                          ) : (
                            <Text style={{ fontSize: fs(9), color: "#ffffff" }}>{personalInfo.linkedin}</Text>
                          )}
                        </View>
                      )}
                      {visibility.website && personalInfo.website && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <GlobeIcon size={8} color="#ffffff" />
                          {personalInfo.websiteUrl ? (
                            <Link src={personalInfo.websiteUrl} style={{ fontSize: fs(9), color: "#ffffff", textDecoration: "none" }}>{personalInfo.website}</Link>
                          ) : (
                            <Text style={{ fontSize: fs(9), color: "#ffffff" }}>{personalInfo.website}</Text>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Summary */}
                {visibility.summary && summary && (
                  <View style={{ marginBottom: SECTION_GAP }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, marginTop: 4 }}>
                      <View style={{ width: 2, height: 11, backgroundColor: colors.nameAccent, borderRadius: 1, marginRight: 5 }} />
                      <Text style={{ fontSize: fs(9), fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.8, color: "#ffffff" }}>
                        {labels.aboutMe}
                      </Text>
                    </View>
                    <PdfRichText html={summary} style={{ fontSize: fs(9), color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }} />
                  </View>
                )}

                {/* Skills */}
                {skillCategories.length > 0 && (
                  <View style={{ marginBottom: SECTION_GAP }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, marginTop: 4 }}>
                      <View style={{ width: 2, height: 11, backgroundColor: colors.nameAccent, borderRadius: 1, marginRight: 5 }} />
                      <Text style={{ fontSize: fs(9), fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.8, color: "#ffffff" }}>
                        {labels.skills}
                      </Text>
                    </View>
                    <View style={{ gap: 6 }}>
                      {skillCategories.map((cat) => (
                        <View key={cat.id} wrap={false}>
                          <Text style={{ fontSize: fs(8), fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#ffffff", marginBottom: 3 }}>
                            {cat.category}
                          </Text>
                          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 3 }}>
                            {cat.items.map((skill, i) => (
                              <View key={i} style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 }}>
                                <Text style={{ fontSize: fs(8), color: "#ffffff" }}>{skill}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Languages */}
                {visibility.languages && languages && languages.length > 0 && (
                  <View style={{ marginBottom: SECTION_GAP }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, marginTop: 4 }}>
                      <View style={{ width: 2, height: 11, backgroundColor: colors.nameAccent, borderRadius: 1, marginRight: 5 }} />
                      <Text style={{ fontSize: fs(9), fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.8, color: "#ffffff" }}>
                        {labels.languages}
                      </Text>
                    </View>
                    <View style={{ gap: 4 }}>
                      {languages.map((lang) => (
                        <View key={lang.id} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Text style={{ fontSize: fs(10), fontWeight: 600, color: "#ffffff" }}>{lang.language}</Text>
                          {lang.level && (
                            <View style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 }}>
                              <Text style={{ fontSize: fs(8), color: "#ffffff" }}>{lang.level}</Text>
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </View>
          </>
        )}

        {/* ===== Timeline: single-column with vertical timeline ===== */}
        {templateId === "timeline" && (
          <View style={{ paddingHorizontal: NOPHOTO_PAD }}>
            {/* Header — left-aligned with contact icons + photo */}
            <View style={{ flexDirection: "row", gap: 16, alignItems: "flex-start", paddingTop: 22, paddingBottom: 6 }}>
              {/* Photo / Initials */}
              {personalInfo.photoUrl ? (
                <View style={{ width: 90, height: 90, borderRadius: 45, overflow: "hidden" }}>
                  {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image is PDF-only, not an HTML <img> */}
                  <Image src={personalInfo.photoUrl} style={{ width: 90, height: 90, objectFit: "cover" }} />
                </View>
              ) : (
                <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: safePdfColor(`${colors.heading}12`), alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 28, fontWeight: 500, color: colors.heading }}>
                    {personalInfo.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fs(24), fontWeight: 600, color: colors.heading, letterSpacing: -0.3 }}>
                  {personalInfo.fullName}
                </Text>
                {colors.nameAccent !== "transparent" && (
                  <View style={{ height: 2, width: 40, backgroundColor: colors.nameAccent, borderRadius: 1, marginTop: 4, marginBottom: 4 }} />
                )}
                <Text style={{ fontSize: fs(12), fontWeight: 500, color: safePdfColor(colors.heading + "BF"), textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                  {personalInfo.jobTitle}
                </Text>
                {hasContact && (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center" }}>
                    {[
                      personalInfo.email ? { key: "email", value: personalInfo.email, IconComp: MailIcon } : null,
                      personalInfo.phone ? { key: "phone", value: personalInfo.phone, IconComp: PhoneIcon } : null,
                      (visibility.location && personalInfo.location) ? { key: "loc", value: personalInfo.location, IconComp: MapPinIcon } : null,
                      (visibility.linkedin && personalInfo.linkedin) ? { key: "li", value: personalInfo.linkedin, IconComp: LinkedinIcon } : null,
                      (visibility.website && personalInfo.website) ? { key: "web", value: personalInfo.website, IconComp: GlobeIcon } : null,
                    ]
                      .filter((x): x is { key: string; value: string; IconComp: typeof MailIcon } => Boolean(x))
                      .map(({ key, value, IconComp }, idx) => (
                        <View key={key} style={{ flexDirection: "row", alignItems: "center" }}>
                          {idx > 0 && (
                            <Text style={{ fontSize: fs(9), color: safePdfColor(colors.heading + "35"), marginHorizontal: 5 }}>·</Text>
                          )}
                          <IconComp size={8} color={colors.heading} />
                          <Text style={{ fontSize: fs(10), color: "#64748b", marginLeft: 3 }}>{value}</Text>
                        </View>
                      ))}
                  </View>
                )}
              </View>
            </View>

            {/* Header divider */}
            <View style={{ height: 1, backgroundColor: safePdfColor(colors.heading + "14"), marginBottom: 14 }} />

            {/* Summary — outside timeline, in accent card */}
            {visibility.summary && summary && (
              <View style={{ marginBottom: SECTION_GAP }}>
                <NoPhotoSectionHeading color={colors.heading} fontSize={fs(10)}>
                  {labels.aboutMe}
                </NoPhotoSectionHeading>
                <View style={{ backgroundColor: safePdfColor(colors.heading + "08"), borderLeftWidth: 3, borderLeftColor: colors.heading, borderRadius: 4, paddingVertical: 8, paddingHorizontal: 12 }}>
                  <PdfRichText html={summary} style={{ fontSize: fs(11), color: "#374151", lineHeight: 1.6 }} />
                </View>
              </View>
            )}

            {/* Timeline sections — vertical line + dots */}
            <View style={{ marginLeft: 18, paddingLeft: 20, borderLeftWidth: 3, borderLeftColor: safePdfColor(colors.heading + "40") }}>

              {/* Experience */}
              {experiences.length > 0 && (
                <View style={{ marginBottom: SECTION_GAP }}>
                  {/* Timeline section heading with large dot */}
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, marginTop: 4, marginLeft: -31 }}>
                    <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: colors.heading, borderWidth: 2, borderColor: "#ffffff", marginRight: 6 }} />
                    <Text style={{ fontSize: fs(10), fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.8, color: colors.heading, marginRight: 6 }}>
                      {labels.experience}
                    </Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: safePdfColor(colors.heading + "18") }} />
                  </View>
                  <View wrap={false}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{experiences[0].company}</Text>
                      <Text style={{ fontSize: fs(10), color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>{experiences[0].startDate} — {experiences[0].endDate}</Text>
                    </View>
                    <Text style={{ fontSize: fs(10), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{experiences[0].position}</Text>
                    {experiences[0].description.length > 0 && (
                      <View style={{ marginTop: 4 }}>
                        <PdfRichDocument html={experiences[0].description} fontSize={fs(11)} bulletColor={colors.bullet} />
                      </View>
                    )}
                  </View>
                  {experiences.slice(1).map((exp) => (
                    <View key={exp.id} wrap={false} style={{ marginTop: ITEM_GAP }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{exp.company}</Text>
                        <Text style={{ fontSize: fs(10), color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>{exp.startDate} — {exp.endDate}</Text>
                      </View>
                      <Text style={{ fontSize: fs(10), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{exp.position}</Text>
                      {exp.description.length > 0 && (
                        <View style={{ marginTop: 4 }}>
                          <PdfRichDocument html={exp.description} fontSize={fs(11)} bulletColor={colors.bullet} />
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Education */}
              {education.length > 0 && (
                <View style={{ marginBottom: SECTION_GAP }}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, marginTop: 4, marginLeft: -31 }}>
                    <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: colors.heading, borderWidth: 2, borderColor: "#ffffff", marginRight: 6 }} />
                    <Text style={{ fontSize: fs(10), fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.8, color: colors.heading, marginRight: 6 }}>
                      {labels.education}
                    </Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: safePdfColor(colors.heading + "18") }} />
                  </View>
                  <View wrap={false}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{education[0].institution}</Text>
                      <Text style={{ fontSize: fs(10), color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>{education[0].startDate} — {education[0].endDate}</Text>
                    </View>
                    <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{education[0].degree}</Text>
                    {education[0].description && (
                      <View style={{ marginTop: 4 }}>
                        <PdfRichDocument html={education[0].description} fontSize={fs(11)} bulletColor={colors.bullet} />
                      </View>
                    )}
                  </View>
                  {education.slice(1).map((edu) => (
                    <View key={edu.id} wrap={false} style={{ marginTop: ITEM_GAP }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{edu.institution}</Text>
                        <Text style={{ fontSize: fs(10), color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>{edu.startDate} — {edu.endDate}</Text>
                      </View>
                      <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{edu.degree}</Text>
                      {edu.description && (
                        <View style={{ marginTop: 4 }}>
                          <PdfRichDocument html={edu.description} fontSize={fs(11)} bulletColor={colors.bullet} />
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Courses */}
              {visibility.courses && courses.length > 0 && (
                <View style={{ marginBottom: SECTION_GAP }}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, marginTop: 4, marginLeft: -31 }}>
                    <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: colors.heading, borderWidth: 2, borderColor: "#ffffff", marginRight: 6 }} />
                    <Text style={{ fontSize: fs(10), fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.8, color: colors.heading, marginRight: 6 }}>
                      {labels.courses}
                    </Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: safePdfColor(colors.heading + "18") }} />
                  </View>
                  <View wrap={false}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{courses[0].name}</Text>
                      <Text style={{ fontSize: fs(10), color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>{courses[0].date}</Text>
                    </View>
                    <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{courses[0].institution}</Text>
                    {courses[0].description && (
                      <View style={{ marginTop: 4 }}>
                        <PdfRichDocument html={courses[0].description} fontSize={fs(11)} bulletColor={colors.bullet} />
                      </View>
                    )}
                  </View>
                  {courses.slice(1).map((course) => (
                    <View key={course.id} wrap={false} style={{ marginTop: 8 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{course.name}</Text>
                        <Text style={{ fontSize: fs(10), color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>{course.date}</Text>
                      </View>
                      <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{course.institution}</Text>
                      {course.description && (
                        <View style={{ marginTop: 4 }}>
                          <PdfRichDocument html={course.description} fontSize={fs(11)} bulletColor={colors.bullet} />
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Certifications */}
              {visibility.certifications && certifications.length > 0 && (
                <View style={{ marginBottom: SECTION_GAP }}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, marginTop: 4, marginLeft: -31 }}>
                    <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: colors.heading, borderWidth: 2, borderColor: "#ffffff", marginRight: 6 }} />
                    <Text style={{ fontSize: fs(10), fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.8, color: colors.heading, marginRight: 6 }}>
                      {labels.certifications}
                    </Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: safePdfColor(colors.heading + "18") }} />
                  </View>
                  <View wrap={false}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{certifications[0].name}</Text>
                      <Text style={{ fontSize: fs(10), color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>{certifications[0].date}</Text>
                    </View>
                    <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{certifications[0].issuer}</Text>
                    {certifications[0].description && (
                      <View style={{ marginTop: 4 }}>
                        <PdfRichDocument html={certifications[0].description} fontSize={fs(11)} bulletColor={colors.bullet} />
                      </View>
                    )}
                  </View>
                  {certifications.slice(1).map((cert) => (
                    <View key={cert.id} wrap={false} style={{ marginTop: 8 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{cert.name}</Text>
                        <Text style={{ fontSize: fs(10), color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>{cert.date}</Text>
                      </View>
                      <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{cert.issuer}</Text>
                      {cert.description && (
                        <View style={{ marginTop: 4 }}>
                          <PdfRichDocument html={cert.description} fontSize={fs(11)} bulletColor={colors.bullet} />
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Awards */}
              {visibility.awards && awards.length > 0 && (
                <View style={{ marginBottom: SECTION_GAP }}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, marginTop: 4, marginLeft: -31 }}>
                    <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: colors.heading, borderWidth: 2, borderColor: "#ffffff", marginRight: 6 }} />
                    <Text style={{ fontSize: fs(10), fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.8, color: colors.heading, marginRight: 6 }}>
                      {labels.awards}
                    </Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: safePdfColor(colors.heading + "18") }} />
                  </View>
                  <View wrap={false}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{awards[0].name}</Text>
                      <Text style={{ fontSize: fs(10), color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>{awards[0].date}</Text>
                    </View>
                    <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{awards[0].issuer}</Text>
                    {awards[0].description && (
                      <View style={{ marginTop: 4 }}>
                        <PdfRichDocument html={awards[0].description} fontSize={fs(11)} bulletColor={colors.bullet} />
                      </View>
                    )}
                  </View>
                  {awards.slice(1).map((award) => (
                    <View key={award.id} wrap={false} style={{ marginTop: 8 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{award.name}</Text>
                        <Text style={{ fontSize: fs(10), color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>{award.date}</Text>
                      </View>
                      <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{award.issuer}</Text>
                      {award.description && (
                        <View style={{ marginTop: 4 }}>
                          <PdfRichDocument html={award.description} fontSize={fs(11)} bulletColor={colors.bullet} />
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Languages — outside timeline, noPhoto-style heading */}
            {visibility.languages && languages && languages.length > 0 && (
              <View style={{ marginBottom: SECTION_GAP }}>
                <NoPhotoSectionHeading color={colors.heading} fontSize={fs(10)}>
                  {labels.languages}
                </NoPhotoSectionHeading>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
                  {languages.map((lang, idx) => (
                    <View key={lang.id} style={{ flexDirection: "row" }}>
                      {idx > 0 && <Text style={{ fontSize: fs(11), color: "#cbd5e1", marginHorizontal: 4 }}>·</Text>}
                      <Text style={{ fontSize: fs(11), color: "#111827" }}>
                        {lang.language}{lang.level ? ` (${lang.level})` : ""}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Skills — outside timeline, noPhoto-style heading */}
            {skillCategories.length > 0 && (
              <View style={{ marginBottom: SECTION_GAP }}>
                <NoPhotoSectionHeading color={colors.heading} fontSize={fs(10)}>
                  {labels.skills}
                </NoPhotoSectionHeading>
                <View style={{ gap: 5 }}>
                  {skillCategories.map((cat) => (
                    <View key={cat.id} wrap={false}>
                      <Text style={{ fontSize: fs(9), fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: colors.heading, marginBottom: 3 }}>
                        {cat.category}
                      </Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 3 }}>
                        {cat.items.map((skill, i) => (
                          <View key={i} style={{ backgroundColor: safePdfColor(colors.heading + "15"), borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2 }}>
                            <Text style={{ fontSize: fs(10), color: colors.heading }}>{skill}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* ===== noPhoto: single-column layout ===== */}
        {templateId === "noPhoto" && (
          <>
            {/* Top accent bar — escapes page padding via absolute positioning */}
            <View fixed style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, backgroundColor: colors.heading }} />

            <View style={{ paddingHorizontal: NOPHOTO_PAD }}>
            {/* Header: name + title + contact row */}
            <View style={{ paddingTop: 22, paddingBottom: 14 }}>
              <Text style={{ fontSize: fs(24), fontWeight: 600, color: "#111827", letterSpacing: -0.5 }}>
                {personalInfo.fullName}
              </Text>
              {colors.nameAccent !== "transparent" && (
                <View style={{ height: 2, width: 32, backgroundColor: colors.nameAccent, borderRadius: 1, marginTop: 4, marginBottom: 4 }} />
              )}
              <Text style={{ fontSize: fs(12), fontWeight: 500, color: "#4b5563", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                {personalInfo.jobTitle}
              </Text>
              {hasContact && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center" }}>
                  {[
                    personalInfo.email ? { key: "email", value: personalInfo.email, IconComp: MailIcon } : null,
                    personalInfo.phone ? { key: "phone", value: personalInfo.phone, IconComp: PhoneIcon } : null,
                    (visibility.location && personalInfo.location) ? { key: "loc", value: personalInfo.location, IconComp: MapPinIcon } : null,
                    (visibility.linkedin && personalInfo.linkedin) ? { key: "li", value: personalInfo.linkedin, IconComp: LinkedinIcon } : null,
                    (visibility.website && personalInfo.website) ? { key: "web", value: personalInfo.website, IconComp: GlobeIcon } : null,
                  ]
                    .filter((x): x is { key: string; value: string; IconComp: typeof MailIcon } => Boolean(x))
                    .map(({ key, value, IconComp }, idx) => (
                      <View key={key} style={{ flexDirection: "row", alignItems: "center" }}>
                        {idx > 0 && (
                          <Text style={{ fontSize: fs(9), color: safePdfColor(colors.heading + "35"), marginHorizontal: 5 }}>·</Text>
                        )}
                        <IconComp size={8} color={colors.heading} />
                        <Text style={{ fontSize: fs(10), color: "#6b7280", marginLeft: 3 }}>{value}</Text>
                      </View>
                    ))}
                </View>
              )}
            </View>
            {/* Header divider — standalone View avoids @react-pdf borderBottom color bug */}
            <View style={{ height: 1, backgroundColor: safePdfColor(colors.heading + "14"), marginBottom: 16 }} />

            {/* Summary */}
            {visibility.summary && summary && (
              <View style={{ marginBottom: SECTION_GAP }}>
                <NoPhotoSectionHeading color={colors.heading} fontSize={fs(10)}>
                  {labels.aboutMe}
                </NoPhotoSectionHeading>
                <PdfRichText html={summary} style={{ fontSize: fs(11), color: "#374151", lineHeight: 1.5 }} />
              </View>
            )}

            {/* Experience */}
            {experiences.length > 0 && (
              <View style={{ marginBottom: SECTION_GAP }}>
                <View wrap={false}>
                  <NoPhotoSectionHeading color={colors.heading} fontSize={fs(10)}>
                    {labels.experience}
                  </NoPhotoSectionHeading>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{experiences[0].company}</Text>
                    <Text style={{ fontSize: fs(10), color: "#6b7280", flexShrink: 0, marginTop: 2 }}>{experiences[0].startDate} — {experiences[0].endDate}</Text>
                  </View>
                  <Text style={{ fontSize: fs(10), fontWeight: 500, color: "#6b7280", marginTop: 2 }}>{experiences[0].position}</Text>
                  {experiences[0].description.length > 0 && (
                    <View style={{ marginTop: 4 }}>
                      <PdfRichDocument html={experiences[0].description} fontSize={fs(11)} bulletColor={colors.bullet} />
                    </View>
                  )}
                </View>
                {experiences.slice(1).map((exp) => (
                  <View key={exp.id} wrap={false} style={{ marginTop: ITEM_GAP }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{exp.company}</Text>
                      <Text style={{ fontSize: fs(10), color: "#6b7280", flexShrink: 0, marginTop: 2 }}>{exp.startDate} — {exp.endDate}</Text>
                    </View>
                    <Text style={{ fontSize: fs(10), fontWeight: 500, color: "#6b7280", marginTop: 2 }}>{exp.position}</Text>
                    {exp.description.length > 0 && (
                      <View style={{ marginTop: 4 }}>
                        <PdfRichDocument html={exp.description} fontSize={fs(11)} bulletColor={colors.bullet} />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Education */}
            {education.length > 0 && (
              <View style={{ marginBottom: SECTION_GAP }}>
                <View wrap={false}>
                  <NoPhotoSectionHeading color={colors.heading} fontSize={fs(10)}>
                    {labels.education}
                  </NoPhotoSectionHeading>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{education[0].institution}</Text>
                    <Text style={{ fontSize: fs(10), color: "#6b7280", flexShrink: 0, marginTop: 2 }}>{education[0].startDate} — {education[0].endDate}</Text>
                  </View>
                  <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{education[0].degree}</Text>
                  {education[0].description && (
                    <View style={{ marginTop: 4 }}>
                      <PdfRichDocument html={education[0].description} fontSize={fs(11)} bulletColor={colors.bullet} />
                    </View>
                  )}
                </View>
                {education.slice(1).map((edu) => (
                  <View key={edu.id} wrap={false} style={{ marginTop: ITEM_GAP }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{edu.institution}</Text>
                      <Text style={{ fontSize: fs(10), color: "#6b7280", flexShrink: 0, marginTop: 2 }}>{edu.startDate} — {edu.endDate}</Text>
                    </View>
                    <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{edu.degree}</Text>
                    {edu.description && (
                      <View style={{ marginTop: 4 }}>
                        <PdfRichDocument html={edu.description} fontSize={fs(11)} bulletColor={colors.bullet} />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Courses */}
            {visibility.courses && courses.length > 0 && (
              <View style={{ marginBottom: SECTION_GAP }}>
                <View wrap={false}>
                  <NoPhotoSectionHeading color={colors.heading} fontSize={fs(10)}>
                    {labels.courses}
                  </NoPhotoSectionHeading>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{courses[0].name}</Text>
                    <Text style={{ fontSize: fs(10), color: "#6b7280", flexShrink: 0, marginTop: 2 }}>{courses[0].date}</Text>
                  </View>
                  <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{courses[0].institution}</Text>
                  {courses[0].description && (
                    <View style={{ marginTop: 4 }}>
                      <PdfRichDocument html={courses[0].description} fontSize={fs(11)} bulletColor={colors.bullet} />
                    </View>
                  )}
                </View>
                {courses.slice(1).map((course) => (
                  <View key={course.id} wrap={false} style={{ marginTop: 8 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{course.name}</Text>
                      <Text style={{ fontSize: fs(10), color: "#6b7280", flexShrink: 0, marginTop: 2 }}>{course.date}</Text>
                    </View>
                    <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{course.institution}</Text>
                    {course.description && (
                      <View style={{ marginTop: 4 }}>
                        <PdfRichDocument html={course.description} fontSize={fs(11)} bulletColor={colors.bullet} />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Certifications */}
            {visibility.certifications && certifications.length > 0 && (
              <View style={{ marginBottom: SECTION_GAP }}>
                <View wrap={false}>
                  <NoPhotoSectionHeading color={colors.heading} fontSize={fs(10)}>
                    {labels.certifications}
                  </NoPhotoSectionHeading>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{certifications[0].name}</Text>
                    <Text style={{ fontSize: fs(10), color: "#6b7280", flexShrink: 0, marginTop: 2 }}>{certifications[0].date}</Text>
                  </View>
                  <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{certifications[0].issuer}</Text>
                  {certifications[0].description && (
                    <View style={{ marginTop: 4 }}>
                      <PdfRichDocument html={certifications[0].description} fontSize={fs(11)} bulletColor={colors.bullet} />
                    </View>
                  )}
                </View>
                {certifications.slice(1).map((cert) => (
                  <View key={cert.id} wrap={false} style={{ marginTop: 8 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{cert.name}</Text>
                      <Text style={{ fontSize: fs(10), color: "#6b7280", flexShrink: 0, marginTop: 2 }}>{cert.date}</Text>
                    </View>
                    <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{cert.issuer}</Text>
                    {cert.description && (
                      <View style={{ marginTop: 4 }}>
                        <PdfRichDocument html={cert.description} fontSize={fs(11)} bulletColor={colors.bullet} />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Awards */}
            {visibility.awards && awards.length > 0 && (
              <View style={{ marginBottom: SECTION_GAP }}>
                <View wrap={false}>
                  <NoPhotoSectionHeading color={colors.heading} fontSize={fs(10)}>
                    {labels.awards}
                  </NoPhotoSectionHeading>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{awards[0].name}</Text>
                    <Text style={{ fontSize: fs(10), color: "#6b7280", flexShrink: 0, marginTop: 2 }}>{awards[0].date}</Text>
                  </View>
                  <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{awards[0].issuer}</Text>
                  {awards[0].description && (
                    <View style={{ marginTop: 4 }}>
                      <PdfRichDocument html={awards[0].description} fontSize={fs(11)} bulletColor={colors.bullet} />
                    </View>
                  )}
                </View>
                {awards.slice(1).map((award) => (
                  <View key={award.id} wrap={false} style={{ marginTop: 8 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>{award.name}</Text>
                      <Text style={{ fontSize: fs(10), color: "#6b7280", flexShrink: 0, marginTop: 2 }}>{award.date}</Text>
                    </View>
                    <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563", marginTop: 2 }}>{award.issuer}</Text>
                    {award.description && (
                      <View style={{ marginTop: 4 }}>
                        <PdfRichDocument html={award.description} fontSize={fs(11)} bulletColor={colors.bullet} />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Languages */}
            {visibility.languages && languages && languages.length > 0 && (
              <View style={{ marginBottom: SECTION_GAP }}>
                <NoPhotoSectionHeading color={colors.heading} fontSize={fs(10)}>
                  {labels.languages}
                </NoPhotoSectionHeading>
                <View style={{ gap: 4 }}>
                  {languages.map((lang) => (
                    <View key={lang.id} style={{ flexDirection: "row", gap: 8 }}>
                      <Text style={{ fontSize: fs(12), fontWeight: 600, color: "#111827", flex: 1 }}>
                        {lang.language}
                      </Text>
                      <Text style={{ fontSize: fs(12), color: "#6b7280", flex: 1 }}>
                        {lang.level}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Skills — two-column: category label | chips (at end for noPhoto) */}
            {skillCategories.length > 0 && (
              <View style={{ marginBottom: SECTION_GAP }}>
                <NoPhotoSectionHeading color={colors.heading} fontSize={fs(10)}>
                  {labels.skills}
                </NoPhotoSectionHeading>
                <View style={{ gap: 5 }}>
                  {skillCategories.map((cat) => (
                    <View key={cat.id} style={{ flexDirection: "row", alignItems: "flex-start" }}>
                      <Text
                        style={{
                          fontSize: fs(9),
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: 0.8,
                          color: safePdfColor(colors.heading + "70"),
                          width: 80,
                          textAlign: "right",
                          paddingTop: 2,
                          paddingRight: 8,
                        }}
                      >
                        {cat.category}
                      </Text>
                      <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 3 }}>
                        {cat.items.map((skill, i) => (
                          <View
                            key={i}
                            style={{
                              backgroundColor: safePdfColor(colors.heading + "12"),
                              borderRadius: 3,
                              paddingHorizontal: 5,
                              paddingVertical: 2,
                            }}
                          >
                            <Text style={{ fontSize: fs(10), color: colors.heading }}>{skill}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
            </View>
          </>
        )}

        {/* Fixed footer */}
        {(() => {
          const footerDate = new Intl.DateTimeFormat(locale, {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }).format(new Date());
          const isModern = templateId === "modern";
          const isSingleColumn = templateId !== "classic" && !isModern;
          const brandingColor = (isSingleColumn || isModern) ? "#bbbbbb" : blendOver(colors.sidebarMuted, colors.sidebarBg);

          if (isModern) {
            /* Modern: two-column footer matching sidebar layout */
            return (
              <View style={{ flexDirection: "row", marginTop: "auto" }} fixed>
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", paddingTop: 6, paddingHorizontal: 16, paddingBottom: 10 }}>
                  <Text
                    style={{ fontSize: 8, color: "#aaaaaa", fontFamily }}
                    render={({ pageNumber, totalPages }) =>
                      `${personalInfo.fullName}  ·  ${footerDate}  ·  ${pageNumber} / ${totalPages}`
                    }
                  />
                </View>
                {!isPremium && (
                  <View style={{ width: 200, backgroundColor: colors.heading, alignItems: "center", justifyContent: "center", paddingTop: 6, paddingHorizontal: 14, paddingBottom: 10 }}>
                    <Link src="https://www.applio.dev/" style={{ fontSize: 8, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>
                      Applio
                    </Link>
                  </View>
                )}
                {isPremium && (
                  <View style={{ width: 200 }} />
                )}
              </View>
            );
          }

          return (
            <>
              {/* Left: branding (free users only) */}
              {!isPremium && (
                <View
                  style={{
                    position: "absolute",
                    bottom: 10,
                    left: isSingleColumn ? NOPHOTO_PAD : 0,
                    width: isSingleColumn ? undefined : SIDEBAR_WIDTH,
                    alignItems: "center",
                  }}
                  fixed
                >
                  <Link src="https://www.applio.dev/" style={{ textDecoration: "none" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                      <Text style={{ fontSize: 8, color: brandingColor, fontFamily }}>
                        Applio
                      </Text>
                      <HeartIcon size={7} color={brandingColor} />
                    </View>
                  </Link>
                </View>
              )}

              {/* Right: name · date · page */}
              <View
                style={{
                  position: "absolute",
                  bottom: 10,
                  left: isSingleColumn ? NOPHOTO_PAD : SIDEBAR_WIDTH + MAIN_H_PAD,
                  right: isSingleColumn ? NOPHOTO_PAD : MAIN_H_PAD,
                  alignItems: "flex-end",
                }}
                fixed
              >
                <Text
                  style={{ fontSize: 8, color: "#aaaaaa", fontFamily }}
                  render={({ pageNumber, totalPages }) =>
                    `${personalInfo.fullName}  ·  ${footerDate}  ·  ${pageNumber} / ${totalPages}`
                  }
                />
              </View>
            </>
          );
        })()}
      </Page>
    </Document>
  );
}

/* ── Public API ─────────────────────────────────────────── */

export async function generatePDFBlob(props: PDFDocumentProps): Promise<Blob> {
  return pdf(<CVPDFDocument {...props} />).toBlob();
}
