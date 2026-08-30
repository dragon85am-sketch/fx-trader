"use client";

import React from "react";
import { translations, type TranslationKey } from "@/lib/i18n";
import {
  languages,
  normalizeLanguage,
  translateExact,
  type AppLanguage,
} from "@/lib/i18n/catalog";

type LanguageContextValue = {
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  t: (key: TranslationKey) => string;
  tText: (text: string) => string;
  locale: string;
};

const LanguageContext = React.createContext<LanguageContextValue | null>(null);

function persistLanguage(lang: AppLanguage) {
  localStorage.setItem("lang", lang);
  localStorage.setItem("fxtrade-language", lang);
  document.cookie = `fxtrade-language=${lang}; path=/; max-age=31536000; samesite=lax`;
}

export function LanguageProvider({
  children,
  initialLanguage = "pl",
}: {
  children: React.ReactNode;
  initialLanguage?: AppLanguage;
}) {
  const [lang, setLangState] = React.useState<AppLanguage>(initialLanguage);

  React.useEffect(() => {
    const storedRaw =
      localStorage.getItem("fxtrade-language") ?? localStorage.getItem("lang");

    if (storedRaw) {
      const stored = normalizeLanguage(storedRaw);
      if (stored !== lang) setLangState(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLang = React.useCallback((nextLang: AppLanguage) => {
    persistLanguage(nextLang);
    setLangState(nextLang);
    document.documentElement.lang = nextLang;
  }, []);

  const t = React.useCallback(
    (key: TranslationKey) => translations[lang]?.[key] ?? translations.pl[key] ?? key,
    [lang]
  );

  const tText = React.useCallback(
    (text: string) => translateExact(text, lang) ?? text,
    [lang]
  );

  const locale = languages.find((item) => item.code === lang)?.locale ?? "pl-PL";

  const value = React.useMemo(
    () => ({ lang, setLang, t, tText, locale }),
    [lang, setLang, t, tText, locale]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = React.useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}
