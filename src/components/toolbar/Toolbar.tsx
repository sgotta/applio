"use client";

import { useRef, useState, useCallback } from "react";
import { useCV } from "@/lib/cv-context";
import { useTranslations } from "next-intl";
import { useAppLocale, LOCALES, LOCALE_NAMES } from "@/lib/locale-context";
import { CVData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme, Theme } from "@/lib/theme-context";
import { useColorScheme } from "@/lib/color-scheme-context";
import { COLOR_SCHEME_NAMES, COLOR_SCHEMES, type ColorSchemeName } from "@/lib/color-schemes";
import { useFontSize, type FontSizeLevel } from "@/lib/font-size-context";
import { useMargin, type MarginLevel } from "@/lib/margin-context";
import {
  Download, FileUp, FileDown, FileText, Globe,
  SlidersHorizontal, Check, Sun, Moon, Monitor,
  Menu, X, ChevronRight, ChevronLeft, AlertTriangle, Palette,
  Minus, Plus, Type, Maximize2,
} from "lucide-react";

interface ToolbarProps {
  onPrintPDF: () => void;
  isOverflowing?: boolean;
}

function isValidCVData(data: unknown): data is CVData {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.personalInfo === "object" &&
    d.personalInfo !== null &&
    typeof (d.personalInfo as Record<string, unknown>).fullName === "string" &&
    Array.isArray(d.experience) &&
    Array.isArray(d.education) &&
    Array.isArray(d.skills) &&
    typeof d.summary === "string"
  );
}

function SectionToggle({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 py-1 cursor-pointer">
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      <Switch checked={checked} onCheckedChange={onToggle} />
    </label>
  );
}

type MobileMenuPage = "main" | "language" | "theme" | "color" | "fontSize" | "margins" | "sections";

export function Toolbar({ onPrintPDF, isOverflowing }: ToolbarProps) {
  const { data, importData, toggleSection } = useCV();
  const t = useTranslations("toolbar");
  const { locale, setLocale } = useAppLocale();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { colorSchemeName, setColorScheme } = useColorScheme();
  const { fontSizeLevel, setFontSizeLevel } = useFontSize();
  const { marginLevel, setMarginLevel } = useMargin();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuPage, setMobileMenuPage] = useState<MobileMenuPage>("main");

  const THEME_OPTIONS: { value: Theme; icon: typeof Sun; label: string }[] = [
    { value: "light", icon: Sun, label: t("themeLight") },
    { value: "dark", icon: Moon, label: t("themeDark") },
    { value: "system", icon: Monitor, label: t("themeSystem") },
  ];

  const ThemeIcon = resolvedTheme === "dark" ? Moon : Sun;

  const exportToJSON = () => {
    const exportData = {
      ...data,
      settings: {
        colorScheme: colorSchemeName,
        fontSizeLevel,
        marginLevel,
      },
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `cv-${data.personalInfo.fullName
      .toLowerCase()
      .replace(/\s+/g, "-")}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        const parsed = JSON.parse(result);

        if (!isValidCVData(parsed)) {
          alert(t("importFormatError"));
          return;
        }

        if (confirm(t("importConfirm"))) {
          importData(parsed);
          // Restore visual settings if present
          const settings = (parsed as unknown as Record<string, unknown>).settings as
            | { colorScheme?: string; fontSizeLevel?: number; marginLevel?: number }
            | undefined;
          if (settings) {
            if (settings.colorScheme) setColorScheme(settings.colorScheme as ColorSchemeName);
            if (settings.fontSizeLevel) setFontSizeLevel(settings.fontSizeLevel as FontSizeLevel);
            if (settings.marginLevel) setMarginLevel(settings.marginLevel as MarginLevel);
          }
        }
      } catch {
        alert(t("importReadError"));
      }
    };
    reader.readAsText(file);

    e.target.value = "";
  };

  const handleMobileMenuOpen = useCallback((open: boolean) => {
    setMobileMenuOpen(open);
    if (!open) setMobileMenuPage("main");
  }, []);

  const menuItemClass =
    "flex w-full items-center justify-between rounded-sm px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-accent transition-colors";

  const backButtonClass =
    "flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors";

  return (
    <>
    <header className="no-print sticky top-0 z-50 border-b border-border bg-white/80 dark:bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-900 dark:text-gray-100" />
          <span className="text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            Applio
          </span>
          <span className="hidden text-xs text-gray-400 dark:text-gray-500 sm:inline">
            {t("tagline")}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Hidden file input for import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileImport}
            className="hidden"
            aria-label={t("importAriaLabel")}
          />

          {/* ===== DESKTOP BUTTONS (hidden on mobile) ===== */}
          <div className="hidden md:flex items-center gap-1">
            {/* Language selector */}
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                    >
                      <Globe className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>{t("language")}</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-48 p-1" align="end">
                <div className="space-y-0.5">
                  {LOCALES.map((code) => (
                    <button
                      key={code}
                      onClick={() => setLocale(code)}
                      className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-accent transition-colors"
                    >
                      <span>{LOCALE_NAMES[code]}</span>
                      {locale === code && (
                        <Check className="h-4 w-4 text-gray-900 dark:text-gray-100" />
                      )}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Theme toggle */}
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                    >
                      <ThemeIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>{t("theme")}</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-40 p-1" align="end">
                <div className="space-y-0.5">
                  {THEME_OPTIONS.map(({ value, icon: Icon, label }) => (
                    <button
                      key={value}
                      onClick={() => setTheme(value)}
                      className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-accent transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {label}
                      </span>
                      {theme === value && (
                        <Check className="h-4 w-4 text-gray-900 dark:text-gray-100" />
                      )}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Color scheme picker */}
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                    >
                      <Palette className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>{t("colorScheme")}</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-auto p-3" align="end">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                  {t("colorScheme")}
                </p>
                <div className="flex gap-2">
                  {COLOR_SCHEME_NAMES.map((name) => {
                    const scheme = COLOR_SCHEMES[name];
                    const isLight = scheme.sidebarText !== "#ffffff";
                    return (
                      <Tooltip key={name}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setColorScheme(name)}
                            className={`relative h-7 w-7 rounded-full transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400 ${isLight ? "ring-1 ring-inset ring-black/10" : ""}`}
                            style={{ backgroundColor: scheme.sidebarBg }}
                          >
                            {colorSchemeName === name && (
                              <Check className={`absolute inset-0 m-auto h-3.5 w-3.5 drop-shadow-sm ${isLight ? "text-gray-800" : "text-white"}`} />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {t(`colorScheme${name.charAt(0).toUpperCase() + name.slice(1)}` as Parameters<typeof t>[0])}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            {/* Font size */}
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                    >
                      <Type className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>{t("fontSize")}</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-auto p-3" align="end">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                  {t("fontSize")}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFontSizeLevel((fontSizeLevel - 1) as FontSizeLevel)}
                    disabled={fontSizeLevel <= 1}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 dark:border-border text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-accent transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                    {fontSizeLevel}
                  </span>
                  <button
                    onClick={() => setFontSizeLevel((fontSizeLevel + 1) as FontSizeLevel)}
                    disabled={fontSizeLevel >= 2}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 dark:border-border text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-accent transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Margins */}
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>{t("margins")}</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-auto p-3" align="end">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                  {t("margins")}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMarginLevel((marginLevel - 1) as MarginLevel)}
                    disabled={marginLevel <= 1}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 dark:border-border text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-accent transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                    {marginLevel}
                  </span>
                  <button
                    onClick={() => setMarginLevel((marginLevel + 1) as MarginLevel)}
                    disabled={marginLevel >= 2}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 dark:border-border text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-accent transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Sections toggle */}
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>{t("sections")}</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-64" align="end">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">{t("sectionsTitle")}</p>
                    <SectionToggle label={t("sectionEmail")} checked={data.visibility.email} onToggle={() => toggleSection("email")} />
                    <SectionToggle label={t("sectionPhone")} checked={data.visibility.phone} onToggle={() => toggleSection("phone")} />
                    <SectionToggle label={t("sectionLocation")} checked={data.visibility.location} onToggle={() => toggleSection("location")} />
                    <SectionToggle label={t("sectionLinkedin")} checked={data.visibility.linkedin} onToggle={() => toggleSection("linkedin")} />
                    <SectionToggle label={t("sectionWebsite")} checked={data.visibility.website} onToggle={() => toggleSection("website")} />
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">{t("optionalSections")}</p>
                    <SectionToggle label={t("sectionCourses")} checked={data.visibility.courses} onToggle={() => toggleSection("courses")} />
                    <SectionToggle label={t("sectionCertifications")} checked={data.visibility.certifications} onToggle={() => toggleSection("certifications")} />
                    <SectionToggle label={t("sectionAwards")} checked={data.visibility.awards} onToggle={() => toggleSection("awards")} />
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Import */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileUp className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("importTitle")}</TooltipContent>
            </Tooltip>

            {/* Export JSON */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  onClick={exportToJSON}
                >
                  <FileDown className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("exportTitle")}</TooltipContent>
            </Tooltip>
          </div>

          {/* ===== MOBILE HAMBURGER MENU (visible only on mobile) ===== */}
          <Popover open={mobileMenuOpen} onOpenChange={handleMobileMenuOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-8 w-8 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                <span className="relative h-4 w-4">
                  <Menu
                    className={`h-4 w-4 absolute inset-0 transition-all duration-200 ${
                      mobileMenuOpen
                        ? "opacity-0 rotate-90 scale-75"
                        : "opacity-100 rotate-0 scale-100"
                    }`}
                  />
                  <X
                    className={`h-4 w-4 absolute inset-0 transition-all duration-200 ${
                      mobileMenuOpen
                        ? "opacity-100 rotate-0 scale-100"
                        : "opacity-0 -rotate-90 scale-75"
                    }`}
                  />
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-1.5" align="end">
              {mobileMenuPage === "main" && (
                <div className="space-y-0.5">
                  {/* Language */}
                  <button onClick={() => setMobileMenuPage("language")} className={menuItemClass}>
                    <span className="flex items-center gap-2.5">
                      <Globe className="h-4 w-4" />
                      {t("language")}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                      {LOCALE_NAMES[locale]}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </button>

                  {/* Theme */}
                  <button onClick={() => setMobileMenuPage("theme")} className={menuItemClass}>
                    <span className="flex items-center gap-2.5">
                      <ThemeIcon className="h-4 w-4" />
                      {t("theme")}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                      {THEME_OPTIONS.find((o) => o.value === theme)?.label}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </button>

                  {/* Color */}
                  <button onClick={() => setMobileMenuPage("color")} className={menuItemClass}>
                    <span className="flex items-center gap-2.5">
                      <Palette className="h-4 w-4" />
                      {t("colorScheme")}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: COLOR_SCHEMES[colorSchemeName].sidebarBg }}
                      />
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </button>

                  {/* Font size */}
                  <button onClick={() => setMobileMenuPage("fontSize")} className={menuItemClass}>
                    <span className="flex items-center gap-2.5">
                      <Type className="h-4 w-4" />
                      {t("fontSize")}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                      {fontSizeLevel}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </button>

                  {/* Margins */}
                  <button onClick={() => setMobileMenuPage("margins")} className={menuItemClass}>
                    <span className="flex items-center gap-2.5">
                      <Maximize2 className="h-4 w-4" />
                      {t("margins")}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                      {marginLevel}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </button>

                  {/* Sections */}
                  <button onClick={() => setMobileMenuPage("sections")} className={menuItemClass}>
                    <span className="flex items-center gap-2.5">
                      <SlidersHorizontal className="h-4 w-4" />
                      {t("sections")}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                  </button>

                  {/* Divider */}
                  <div className="my-1.5 border-t border-gray-100 dark:border-border" />

                  {/* Import */}
                  <button onClick={() => fileInputRef.current?.click()} className={menuItemClass}>
                    <span className="flex items-center gap-2.5">
                      <FileUp className="h-4 w-4" />
                      {t("import")}
                    </span>
                  </button>

                  {/* Export JSON */}
                  <button onClick={exportToJSON} className={menuItemClass}>
                    <span className="flex items-center gap-2.5">
                      <FileDown className="h-4 w-4" />
                      {t("export")}
                    </span>
                  </button>

                  {/* Divider */}
                  <div className="mt-1.5 mb-3 border-t border-gray-100 dark:border-border" />

                  {/* Export PDF — prominent */}
                  <button
                    onClick={onPrintPDF}
                    className={`mx-auto mb-1.5 flex items-center justify-center gap-2 rounded-md px-8 py-2.5 text-sm font-medium transition-colors ${
                      isOverflowing
                        ? "bg-amber-600 text-white hover:bg-amber-700"
                        : "bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
                    }`}
                  >
                    {isOverflowing ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    PDF
                  </button>
                </div>
              )}

              {mobileMenuPage === "language" && (
                <div>
                  <button onClick={() => setMobileMenuPage("main")} className={backButtonClass}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                    {t("language")}
                  </button>
                  <div className="space-y-0.5 mt-1">
                    {LOCALES.map((code) => (
                      <button
                        key={code}
                        onClick={() => {
                          setLocale(code);
                          setMobileMenuPage("main");
                        }}
                        className={menuItemClass}
                      >
                        <span>{LOCALE_NAMES[code]}</span>
                        {locale === code && (
                          <Check className="h-4 w-4 text-gray-900 dark:text-gray-100" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mobileMenuPage === "theme" && (
                <div>
                  <button onClick={() => setMobileMenuPage("main")} className={backButtonClass}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                    {t("theme")}
                  </button>
                  <div className="space-y-0.5 mt-1">
                    {THEME_OPTIONS.map(({ value, icon: Icon, label }) => (
                      <button
                        key={value}
                        onClick={() => {
                          setTheme(value);
                          setMobileMenuPage("main");
                        }}
                        className={menuItemClass}
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon className="h-4 w-4" />
                          {label}
                        </span>
                        {theme === value && (
                          <Check className="h-4 w-4 text-gray-900 dark:text-gray-100" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mobileMenuPage === "color" && (
                <div>
                  <button onClick={() => setMobileMenuPage("main")} className={backButtonClass}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                    {t("colorScheme")}
                  </button>
                  <div className="flex flex-wrap gap-2 px-3 pt-2 pb-1">
                    {COLOR_SCHEME_NAMES.map((name) => {
                      const scheme = COLOR_SCHEMES[name];
                      const isLight = scheme.sidebarText !== "#ffffff";
                      return (
                        <button
                          key={name}
                          onClick={() => {
                            setColorScheme(name);
                            setMobileMenuPage("main");
                          }}
                          className="relative flex flex-col items-center gap-1"
                        >
                          <span
                            className={`relative h-8 w-8 rounded-full transition-transform hover:scale-110 ${isLight ? "ring-1 ring-inset ring-black/10" : ""}`}
                            style={{ backgroundColor: scheme.sidebarBg }}
                          >
                            {colorSchemeName === name && (
                              <Check className={`absolute inset-0 m-auto h-4 w-4 drop-shadow-sm ${isLight ? "text-gray-800" : "text-white"}`} />
                            )}
                          </span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">
                            {t(`colorScheme${name.charAt(0).toUpperCase() + name.slice(1)}` as Parameters<typeof t>[0])}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {mobileMenuPage === "fontSize" && (
                <div>
                  <button onClick={() => setMobileMenuPage("main")} className={backButtonClass}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                    {t("fontSize")}
                  </button>
                  <div className="flex items-center justify-center gap-3 px-3 pt-3 pb-2">
                    <button
                      onClick={() => setFontSizeLevel((fontSizeLevel - 1) as FontSizeLevel)}
                      disabled={fontSizeLevel <= 1}
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 dark:border-border text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-accent transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center text-base font-medium text-gray-700 dark:text-gray-300">
                      {fontSizeLevel}
                    </span>
                    <button
                      onClick={() => setFontSizeLevel((fontSizeLevel + 1) as FontSizeLevel)}
                      disabled={fontSizeLevel >= 2}
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 dark:border-border text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-accent transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {mobileMenuPage === "margins" && (
                <div>
                  <button onClick={() => setMobileMenuPage("main")} className={backButtonClass}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                    {t("margins")}
                  </button>
                  <div className="flex items-center justify-center gap-3 px-3 pt-3 pb-2">
                    <button
                      onClick={() => setMarginLevel((marginLevel - 1) as MarginLevel)}
                      disabled={marginLevel <= 1}
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 dark:border-border text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-accent transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center text-base font-medium text-gray-700 dark:text-gray-300">
                      {marginLevel}
                    </span>
                    <button
                      onClick={() => setMarginLevel((marginLevel + 1) as MarginLevel)}
                      disabled={marginLevel >= 2}
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 dark:border-border text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-accent transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {mobileMenuPage === "sections" && (
                <div>
                  <button onClick={() => setMobileMenuPage("main")} className={backButtonClass}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                    {t("sections")}
                  </button>
                  <div className="px-2 pt-2 pb-1 space-y-3">
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">{t("sectionsTitle")}</p>
                      <SectionToggle label={t("sectionEmail")} checked={data.visibility.email} onToggle={() => toggleSection("email")} />
                      <SectionToggle label={t("sectionPhone")} checked={data.visibility.phone} onToggle={() => toggleSection("phone")} />
                      <SectionToggle label={t("sectionLocation")} checked={data.visibility.location} onToggle={() => toggleSection("location")} />
                      <SectionToggle label={t("sectionLinkedin")} checked={data.visibility.linkedin} onToggle={() => toggleSection("linkedin")} />
                      <SectionToggle label={t("sectionWebsite")} checked={data.visibility.website} onToggle={() => toggleSection("website")} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">{t("optionalSections")}</p>
                      <SectionToggle label={t("sectionCourses")} checked={data.visibility.courses} onToggle={() => toggleSection("courses")} />
                      <SectionToggle label={t("sectionCertifications")} checked={data.visibility.certifications} onToggle={() => toggleSection("certifications")} />
                      <SectionToggle label={t("sectionAwards")} checked={data.visibility.awards} onToggle={() => toggleSection("awards")} />
                    </div>
                  </div>
                </div>
              )}
            </PopoverContent>
          </Popover>

          {/* Export PDF — desktop only (on mobile it's inside the hamburger menu) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className={`hidden md:inline-flex ml-1 ${
                  isOverflowing
                    ? "bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-600 dark:text-white dark:hover:bg-amber-700"
                    : "bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
                }`}
                onClick={onPrintPDF}
              >
                {isOverflowing ? (
                  <AlertTriangle className="mr-1.5 h-4 w-4" />
                ) : (
                  <Download className="mr-1.5 h-4 w-4" />
                )}
                <span>PDF</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isOverflowing ? t("pdfOverflowTooltip") : t("pdfTitle")}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>

    {/* Overflow warning banner */}
    {isOverflowing && (
      <div className="no-print border-b border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 sm:px-6">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500" />
          <p className="text-xs text-amber-800 dark:text-amber-200">
            {t("overflowWarning")}
          </p>
        </div>
      </div>
    )}
    </>
  );
}
