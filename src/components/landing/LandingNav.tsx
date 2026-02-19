"use client";

import { memo, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  FileText,
  Globe,
  Moon,
  Sun,
  Check,
  ArrowRight,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import {
  useAppLocale,
  LOCALES,
  LOCALE_NAMES,
} from "@/lib/locale-context";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export const LandingNav = memo(function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useAppLocale();
  const t = useTranslations("landing");
  const tl = useTranslations("languages");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 dark:bg-background/90 backdrop-blur-md shadow-sm dark:shadow-white/[0.03]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 md:h-14 flex items-center justify-between gap-2">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900 dark:text-gray-100" />
          <span className="font-display text-base sm:text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Applio
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* Language selector */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
              >
                <Globe className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1" align="end">
              <div className="space-y-0.5 max-h-80 overflow-y-auto scrollbar-thin">
                {LOCALES.map((code) => {
                  const translated = tl(code);
                  const native = LOCALE_NAMES[code];
                  return (
                    <button
                      key={code}
                      onClick={() => setLocale(code)}
                      className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-accent transition-colors"
                    >
                      <span>
                        {native}
                        <span className="ml-1.5 text-xs text-gray-400">
                          ({translated})
                        </span>
                      </span>
                      {locale === code && (
                        <Check className="h-4 w-4 text-gray-900 dark:text-gray-100" />
                      )}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

          {/* CTA — hidden on mobile, hero has it */}
          <Link
            href="/editor"
            className="hidden sm:inline-flex items-center gap-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-full px-5 py-2.5 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors ml-2"
          >
            {t("nav.cta")}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </nav>
  );
});
