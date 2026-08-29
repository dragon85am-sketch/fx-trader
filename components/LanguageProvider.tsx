"use client";

import React from "react";
import { translations, type AppLanguage, type TranslationKey } from "@/lib/i18n";

type LanguageContextValue = {
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = React.createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  children,
  initialLanguage = "pl",
}: {
  children: React.ReactNode;
  initialLanguage?: AppLanguage;
}) {
  const [lang, setLangState] = React.useState<AppLanguage>(initialLanguage);

  React.useEffect(() => {
    const stored = localStorage.getItem("lang");
    if (stored === "pl" || stored === "en") {
      setLangState(stored);
    }
  }, []);

  const setLang = React.useCallback((nextLang: AppLanguage) => {
    setLangState(nextLang);
    localStorage.setItem("lang", nextLang);
  }, []);

  const t = React.useCallback(
    (key: TranslationKey) => {
      return translations[lang]?.[key] ?? key;
    },
    [lang]
  );

  const value = React.useMemo(
    () => ({
      lang,
      setLang,
      t,
    }),
    [lang, setLang, t]
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