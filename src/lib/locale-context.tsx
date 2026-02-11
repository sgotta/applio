"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en.json";
import esMessages from "@/messages/es.json";
import frMessages from "@/messages/fr.json";
import ptMessages from "@/messages/pt.json";
import deMessages from "@/messages/de.json";
import itMessages from "@/messages/it.json";
import zhMessages from "@/messages/zh.json";
import jaMessages from "@/messages/ja.json";
import koMessages from "@/messages/ko.json";

export type Locale = "en" | "es" | "fr" | "pt" | "de" | "it" | "zh" | "ja" | "ko";

export const LOCALES: Locale[] = ["en", "es", "fr", "pt", "de", "it", "zh", "ja", "ko"];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  pt: "Português",
  de: "Deutsch",
  it: "Italiano",
  zh: "中文",
  ja: "日本語",
  ko: "한국어",
};

const STORAGE_KEY = "quickcv-locale";
const DEFAULT_LOCALE: Locale = "en";

const messages: Record<Locale, typeof enMessages> = {
  en: enMessages,
  es: esMessages,
  fr: frMessages,
  pt: ptMessages,
  de: deMessages,
  it: itMessages,
  zh: zhMessages,
  ja: jaMessages,
  ko: koMessages,
};

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && LOCALES.includes(saved as Locale)) return saved as Locale;
  return DEFAULT_LOCALE;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocaleState(getInitialLocale());
    setMounted(true);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
    document.documentElement.lang = newLocale;
  }, []);

  // Update document lang on mount
  useEffect(() => {
    if (mounted) {
      document.documentElement.lang = locale;
    }
  }, [locale, mounted]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} messages={messages[locale]} timeZone="UTC">
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}

export function useAppLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useAppLocale must be used within a LocaleProvider");
  }
  return context;
}
