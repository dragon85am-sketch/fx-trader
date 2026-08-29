"use client";
import { translations } from "@/lib/i18n";
import { useEffect, useState } from "react";

export function useTranslation() {
  const [lang, setLang] = useState<"pl" | "en">("pl");

  useEffect(() => {
    const stored = localStorage.getItem("lang") as "pl" | "en";
    if (stored) setLang(stored);
  }, []);

  const t = (key: keyof (typeof translations)["pl"]) => {
    return translations[lang][key] || key;
  };

  return { t, lang, setLang };
}