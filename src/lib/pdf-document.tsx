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
import type { CVData, BulletItem } from "@/lib/types";
import type { ColorScheme } from "@/lib/color-schemes";
import type { PatternSettings } from "@/lib/sidebar-patterns";
import type { Style } from "@react-pdf/types";

/** Render **bold** markdown as pdf <Text> with fontWeight 700 */
function PdfFormattedText({ text, style }: { text: string; style: Style }) {
  if (!text.includes("**")) return <Text style={style}>{text}</Text>;
  const parts = text.split("**");
  return (
    <Text style={style}>
      {parts.map((part, i) =>
        i % 2 === 1 ? <Text key={i} style={{ fontWeight: 700 }}>{part}</Text> : part
      )}
    </Text>
  );
}

/* ── Font registration ──────────────────────────────────── */

Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fMZg.ttf",
      fontWeight: 500,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZg.ttf",
      fontWeight: 600,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZg.ttf",
      fontWeight: 700,
    },
  ],
});

/* CJK fonts for Japanese, Chinese, and Korean */
Font.register({
  family: "NotoSansJP",
  fonts: [
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-jp@latest/japanese-400-normal.ttf", fontWeight: 400 },
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-jp@latest/japanese-500-normal.ttf", fontWeight: 500 },
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-jp@latest/japanese-600-normal.ttf", fontWeight: 600 },
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-jp@latest/japanese-700-normal.ttf", fontWeight: 700 },
  ],
});

Font.register({
  family: "NotoSansSC",
  fonts: [
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-sc@latest/chinese-simplified-400-normal.ttf", fontWeight: 400 },
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-sc@latest/chinese-simplified-500-normal.ttf", fontWeight: 500 },
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-sc@latest/chinese-simplified-600-normal.ttf", fontWeight: 600 },
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-sc@latest/chinese-simplified-700-normal.ttf", fontWeight: 700 },
  ],
});

Font.register({
  family: "NotoSansKR",
  fonts: [
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-kr@latest/korean-400-normal.ttf", fontWeight: 400 },
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-kr@latest/korean-500-normal.ttf", fontWeight: 500 },
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-kr@latest/korean-600-normal.ttf", fontWeight: 600 },
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-kr@latest/korean-700-normal.ttf", fontWeight: 700 },
  ],
});

/* Devanagari font for Hindi */
Font.register({
  family: "NotoSansDevanagari",
  fonts: [
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-devanagari@latest/devanagari-400-normal.ttf", fontWeight: 400 },
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-devanagari@latest/devanagari-500-normal.ttf", fontWeight: 500 },
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-devanagari@latest/devanagari-600-normal.ttf", fontWeight: 600 },
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-devanagari@latest/devanagari-700-normal.ttf", fontWeight: 700 },
  ],
});

/* Thai font */
Font.register({
  family: "NotoSansThai",
  fonts: [
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-thai@latest/thai-400-normal.ttf", fontWeight: 400 },
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-thai@latest/thai-500-normal.ttf", fontWeight: 500 },
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-thai@latest/thai-600-normal.ttf", fontWeight: 600 },
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-thai@latest/thai-700-normal.ttf", fontWeight: 700 },
  ],
});

/** Return the correct font family for a given locale */
function getFontFamily(locale: string): string {
  switch (locale) {
    case "ja": return "NotoSansJP";
    case "zh": return "NotoSansSC";
    case "ko": return "NotoSansKR";
    case "hi": return "NotoSansDevanagari";
    case "th": return "NotoSansThai";
    default:   return "Inter";
  }
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
    <View style={{ marginBottom: 6, marginTop: 2 }} minPresenceAhead={40}>
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
    <View style={{ marginBottom: 8, marginTop: 4 }} minPresenceAhead={40}>
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
}

export interface PDFDocumentProps {
  data: CVData;
  colors: ColorScheme;
  labels: PDFLabels;
  locale?: string;
  fontScale?: number;
  marginScale?: number;
  patternSettings?: PatternSettings;
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


/* ── PDF Dots Pattern ──────────────────────────────────── */

/** Intensity 1–5 → multiplier (matches sidebar-patterns.ts) */
const INTENSITY_MUL: Record<number, number> = { 1: 0.35, 2: 0.7, 3: 1.2, 4: 2.0, 5: 3.0 };
function intensityMul(level: number): number {
  return INTENSITY_MUL[level] ?? 1.2;
}

/** Renders a fixed SVG grid of dots over a given area (in pt).
 *  Uses `fill` + `fillOpacity` separately because react-pdf's SVG
 *  renderer doesn't reliably interpret `rgba()` strings. */
function PdfDotsPattern({
  width,
  height,
  color,
  intensity,
}: {
  width: number;
  height: number;
  color: string;
  intensity: number;
}) {
  const spacing = 9; // 12px × 0.75
  const radius = 0.5; // smaller than web (1px) to compensate for solid SVG rendering
  // PDF SVG circles with fillOpacity render much lighter than CSS radial-gradient,
  // so we use ~2× the web base (0.18) to match visual weight
  const fillOpacity = 0.35 * intensityMul(intensity);
  const fillColor = color.startsWith("#") ? color : "#000000";

  const cols = Math.ceil(width / spacing);
  const rows = Math.ceil(height / spacing);
  const circles: React.ReactElement[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      circles.push(
        <Circle
          key={`${r}-${c}`}
          cx={c * spacing + spacing / 2}
          cy={r * spacing + spacing / 2}
          r={radius}
          fill={fillColor}
          fillOpacity={fillOpacity}
        />
      );
    }
  }

  return (
    <Svg width={width} height={height} style={{ position: "absolute", top: 0, left: 0 }}>
      {circles}
    </Svg>
  );
}

/* ── Document component ─────────────────────────────────── */

function CVPDFDocument({ data, colors, labels, locale = "en", fontScale = 1.08, patternSettings }: PDFDocumentProps) {
  const {
    personalInfo,
    summary,
    experience,
    education,
    skills,
    courses,
    certifications,
    awards,
    visibility,
  } = data;

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
    (visibility.email && personalInfo.email) ||
    (visibility.phone && personalInfo.phone) ||
    (visibility.location && personalInfo.location) ||
    (visibility.linkedin && personalInfo.linkedin) ||
    (visibility.website && personalInfo.website);

  // Use sidebarText for icons — sidebarMuted may contain 8-digit hex (#ffffff66)
  // which React-PDF doesn't render correctly in SVG strokes
  const iconColor = colors.sidebarText;
  const fontFamily = getFontFamily(locale);

  return (
    <Document>
      <Page size="A4" style={[styles.page, { fontFamily }]}>
        {/* Fixed sidebar background — repeats on every page */}
        <View
          style={[styles.sidebarBg, { backgroundColor: colors.sidebarBg }]}
          fixed
        />

        {/* Fixed pattern overlays — dots */}
        {patternSettings && patternSettings.name === "dots" && (patternSettings.scope === "sidebar" || patternSettings.scope === "full") && (
          <View style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: SIDEBAR_WIDTH }} fixed>
            <PdfDotsPattern width={SIDEBAR_WIDTH} height={842} color={colors.sidebarText} intensity={patternSettings.sidebarIntensity} />
          </View>
        )}
        {patternSettings && patternSettings.name === "dots" && (patternSettings.scope === "main" || patternSettings.scope === "full") && (
          <View style={{ position: "absolute", top: 0, left: SIDEBAR_WIDTH, bottom: 0, width: 595 - SIDEBAR_WIDTH }} fixed>
            <PdfDotsPattern width={595 - SIDEBAR_WIDTH} height={842} color={colors.heading} intensity={patternSettings.mainIntensity} />
          </View>
        )}

        {/* Two-column layout */}
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
                {personalInfo.photo && (
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
                      src={personalInfo.photo}
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

            {/* Contact */}
            {hasContact && (
              <View style={{ marginBottom: SECTION_GAP }}>
                <SidebarSectionHeading
                  color={colors.sidebarText}
                  separatorColor={colors.sidebarSeparator}
                  fontSize={fs(10)}
                >
                  {labels.contact}
                </SidebarSectionHeading>
                <View style={{ gap: 5 }}>
                  {visibility.email && personalInfo.email && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                      <MailIcon size={9} color={iconColor} />
                      <Link src={`mailto:${personalInfo.email}`} style={{ fontSize: fs(11), color: colors.sidebarText, flex: 1, textDecoration: "none" }}>
                        {personalInfo.email}
                      </Link>
                    </View>
                  )}
                  {visibility.phone && personalInfo.phone && (
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
            )}

            {/* About Me */}
            {summary && (
              <View style={{ marginBottom: SECTION_GAP }}>
                <SidebarSectionHeading
                  color={colors.sidebarText}
                  separatorColor={colors.sidebarSeparator}
                  fontSize={fs(10)}
                >
                  {labels.aboutMe}
                </SidebarSectionHeading>
                <Text style={{ fontSize: fs(11), color: colors.sidebarText, lineHeight: 1.5 }}>
                  {summary}
                </Text>
              </View>
            )}

            {/* Skills */}
            {skills.length > 0 && (
              <View>
                <SidebarSectionHeading
                  color={colors.sidebarText}
                  separatorColor={colors.sidebarSeparator}
                  fontSize={fs(10)}
                >
                  {labels.skills}
                </SidebarSectionHeading>
                <View style={{ gap: 8 }}>
                  {skills.map((skillGroup) => (
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
                              backgroundColor: colors.sidebarBadgeBg,
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
            )}
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
                {personalInfo.title}
              </Text>
            </View>

            {/* Experience */}
            {experience.length > 0 && (
              <View style={{ marginBottom: SECTION_GAP }}>
                <MainSectionHeading
                  color={colors.heading}
                  separatorColor={colors.separator}
                  fontSize={fs(10)}
                >
                  {labels.experience}
                </MainSectionHeading>
                <View style={{ gap: ITEM_GAP }}>
                  {experience.map((exp) => (
                    <View key={exp.id} wrap={false} style={{ width: "100%" }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>
                          {exp.company}
                        </Text>
                        <Text style={{ fontSize: fs(10), color: "#6b7280", flexShrink: 0, marginTop: 2 }}>
                          {exp.startDate} — {exp.endDate}
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: fs(11),
                          fontWeight: 500,
                          color: "#4b5563",
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        {exp.position}
                      </Text>
                      {exp.roleDescription && exp.roleDescription.trim() && (
                        <View style={{ marginTop: 4, width: "100%" }}>
                          <PdfFormattedText
                            text={exp.roleDescription}
                            style={{ fontSize: fs(11), color: "#374151", lineHeight: 1.55, width: "100%" }}
                          />
                        </View>
                      )}
                      {exp.description.length > 0 && (
                        <View style={{ marginTop: 4, gap: 3 }}>
                          {exp.description.map((bullet: string | BulletItem, i: number) => {
                            const item: BulletItem = typeof bullet === "string" ? { text: bullet, type: "bullet" } : bullet;
                            if (item.type === "title") {
                              return <PdfFormattedText key={i} text={item.text} style={{ fontSize: fs(11), fontWeight: 600, color: "#111827", marginTop: 6 }} />;
                            }
                            if (item.type === "subtitle") {
                              return <PdfFormattedText key={i} text={item.text} style={{ fontSize: fs(11), fontWeight: 500, color: "#1f2937" }} />;
                            }
                            if (item.type === "comment") {
                              return <PdfFormattedText key={i} text={item.text} style={{ fontSize: fs(11), fontStyle: "italic", color: "#9ca3af" }} />;
                            }
                            return (
                              <View key={i} style={{ flexDirection: "row", paddingLeft: 9 }}>
                                <Text style={{ color: colors.bullet, marginRight: 5, fontSize: fs(11) }}>{"\u2022"}</Text>
                                <PdfFormattedText text={item.text} style={{ fontSize: fs(11), color: "#374151", flex: 1, lineHeight: 1.55 }} />
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Education */}
            {education.length > 0 && (
              <View style={{ marginBottom: SECTION_GAP }}>
                <MainSectionHeading
                  color={colors.heading}
                  separatorColor={colors.separator}
                  fontSize={fs(10)}
                >
                  {labels.education}
                </MainSectionHeading>
                <View style={{ gap: ITEM_GAP }}>
                  {education.map((edu) => (
                    <View key={edu.id} wrap={false}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>
                          {edu.institution}
                        </Text>
                        <Text style={{ fontSize: fs(10), color: "#6b7280", flexShrink: 0, marginTop: 2 }}>
                          {edu.startDate} — {edu.endDate}
                        </Text>
                      </View>
                      <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563" }}>
                        {edu.degree}
                      </Text>
                      {edu.description && (
                        <Text style={{ fontSize: fs(11), color: "#374151", marginTop: 3, lineHeight: 1.5 }}>
                          {edu.description}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Courses */}
            {visibility.courses && courses.length > 0 && (
              <View style={{ marginBottom: SECTION_GAP }}>
                <MainSectionHeading
                  color={colors.heading}
                  separatorColor={colors.separator}
                  fontSize={fs(10)}
                >
                  {labels.courses}
                </MainSectionHeading>
                <View style={{ gap: 8 }}>
                  {courses.map((course) => (
                    <View key={course.id} wrap={false}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>
                          {course.name}
                        </Text>
                        <Text style={{ fontSize: fs(10), color: "#6b7280", flexShrink: 0, marginTop: 2 }}>
                          {course.date}
                        </Text>
                      </View>
                      <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563" }}>
                        {course.institution}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Certifications */}
            {visibility.certifications && certifications.length > 0 && (
              <View style={{ marginBottom: SECTION_GAP }}>
                <MainSectionHeading
                  color={colors.heading}
                  separatorColor={colors.separator}
                  fontSize={fs(10)}
                >
                  {labels.certifications}
                </MainSectionHeading>
                <View style={{ gap: 8 }}>
                  {certifications.map((cert) => (
                    <View key={cert.id} wrap={false}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>
                          {cert.name}
                        </Text>
                        <Text style={{ fontSize: fs(10), color: "#6b7280", flexShrink: 0, marginTop: 2 }}>
                          {cert.date}
                        </Text>
                      </View>
                      <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563" }}>
                        {cert.issuer}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Awards */}
            {visibility.awards && awards.length > 0 && (
              <View style={{ marginBottom: SECTION_GAP }}>
                <MainSectionHeading
                  color={colors.heading}
                  separatorColor={colors.separator}
                  fontSize={fs(10)}
                >
                  {labels.awards}
                </MainSectionHeading>
                <View style={{ gap: 8 }}>
                  {awards.map((award) => (
                    <View key={award.id} wrap={false}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Text style={{ fontSize: fs(13), fontWeight: 600, color: "#111827", flex: 1, paddingRight: 6 }}>
                          {award.name}
                        </Text>
                        <Text style={{ fontSize: fs(10), color: "#6b7280", flexShrink: 0, marginTop: 2 }}>
                          {award.date}
                        </Text>
                      </View>
                      <Text style={{ fontSize: fs(11), fontWeight: 500, color: "#4b5563" }}>
                        {award.issuer}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Fixed footer: branding left, name + date + page right */}
        {(() => {
          const footerDate = new Intl.DateTimeFormat(locale, {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }).format(new Date());
          const footerStyle = { fontSize: 8, color: "#aaaaaa", fontFamily };
          return (
            <View
              style={{
                position: "absolute",
                bottom: 10,
                left: SIDEBAR_WIDTH + MAIN_H_PAD,
                right: MAIN_H_PAD,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              fixed
            >
              <Link src="https://www.applio.dev/" style={{ textDecoration: "none" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                  <Text style={footerStyle}>Applio</Text>
                  <HeartIcon size={7} color="#aaaaaa" />
                </View>
              </Link>
              <Text
                style={footerStyle}
                render={({ pageNumber, totalPages }) =>
                  `${personalInfo.fullName}  ·  ${footerDate}  ·  ${pageNumber} / ${totalPages}`
                }
              />
            </View>
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
