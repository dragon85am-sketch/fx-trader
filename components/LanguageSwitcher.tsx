"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";

type LanguageCode = "pl" | "en" | "de" | "nl" | "es";

type Language = {
  code: LanguageCode;
  short: string;
  label: string;
};

const languages: Language[] = [
  { code: "pl", short: "PL", label: "Polski" },
  { code: "en", short: "EN", label: "English" },
  { code: "de", short: "DE", label: "Deutsch" },
  { code: "nl", short: "NL", label: "Nederlands" },
  { code: "es", short: "ES", label: "Español" },
];

const STORAGE_KEY = "fxtrade-language";

function Flag({ code }: { code: LanguageCode }) {
  const base =
    "relative h-[22px] w-[34px] shrink-0 overflow-hidden rounded-[4px] shadow-[0_0_0_1px_rgba(255,255,255,.22),0_0_10px_rgba(56,189,248,.16)]";

  if (code === "pl") {
    return (
      <span className={`${base} flex flex-col bg-white`} aria-hidden="true">
        <span className="h-1/2 w-full bg-white" />
        <span className="h-1/2 w-full bg-[#dc143c]" />
      </span>
    );
  }

  if (code === "de") {
    return (
      <span className={`${base} flex flex-col`} aria-hidden="true">
        <span className="h-1/3 w-full bg-black" />
        <span className="h-1/3 w-full bg-[#dd0000]" />
        <span className="h-1/3 w-full bg-[#ffce00]" />
      </span>
    );
  }

  if (code === "nl") {
    return (
      <span className={`${base} flex flex-col`} aria-hidden="true">
        <span className="h-1/3 w-full bg-[#ae1c28]" />
        <span className="h-1/3 w-full bg-white" />
        <span className="h-1/3 w-full bg-[#21468b]" />
      </span>
    );
  }

  if (code === "es") {
    return (
      <span className={`${base} flex flex-col`} aria-hidden="true">
        <span className="h-1/4 w-full bg-[#aa151b]" />
        <span className="h-1/2 w-full bg-[#f1bf00]" />
        <span className="h-1/4 w-full bg-[#aa151b]" />
      </span>
    );
  }

  return (
    <span className={`${base} bg-[#012169]`} aria-hidden="true">
      <span className="absolute left-1/2 top-1/2 h-[5px] w-[46px] -translate-x-1/2 -translate-y-1/2 rotate-[33deg] bg-white" />
      <span className="absolute left-1/2 top-1/2 h-[5px] w-[46px] -translate-x-1/2 -translate-y-1/2 -rotate-[33deg] bg-white" />
      <span className="absolute left-1/2 top-1/2 h-[2px] w-[46px] -translate-x-1/2 -translate-y-1/2 rotate-[33deg] bg-[#c8102e]" />
      <span className="absolute left-1/2 top-1/2 h-[2px] w-[46px] -translate-x-1/2 -translate-y-1/2 -rotate-[33deg] bg-[#c8102e]" />
      <span className="absolute left-1/2 top-0 h-full w-[8px] -translate-x-1/2 bg-white" />
      <span className="absolute left-0 top-1/2 h-[8px] w-full -translate-y-1/2 bg-white" />
      <span className="absolute left-1/2 top-0 h-full w-[4px] -translate-x-1/2 bg-[#c8102e]" />
      <span className="absolute left-0 top-1/2 h-[4px] w-full -translate-y-1/2 bg-[#c8102e]" />
    </span>
  );
}

export default function LanguageSwitcher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>("pl");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
    if (saved && languages.some((item) => item.code === saved)) {
      setLanguage(saved);
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const current = languages.find((item) => item.code === language) ?? languages[0];

  function selectLanguage(code: LanguageCode) {
    setLanguage(code);
    localStorage.setItem(STORAGE_KEY, code);
    localStorage.setItem("lang", code);
    document.cookie = `fxtrade-language=${code}; path=/; max-age=31536000; samesite=lax`;
    setOpen(false);

    window.dispatchEvent(
      new CustomEvent("fxtrade-language-change", { detail: code })
    );

    // HomePage is a Server Component and reads the language cookie.
    // Refresh rerenders it immediately without a full browser reload.
    router.refresh();
  }

  return (
    <div ref={rootRef} className="relative z-[200]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="group flex h-11 min-w-[116px] items-center gap-2.5 rounded-2xl border border-cyan-300/45 bg-[linear-gradient(180deg,rgba(7,44,78,.82),rgba(3,27,52,.76))] px-3.5 text-[12px] font-black text-white shadow-[0_0_0_1px_rgba(255,255,255,.03)_inset,0_0_18px_rgba(34,211,238,.12)] backdrop-blur-md transition duration-300 hover:border-cyan-200/85 hover:shadow-[0_0_0_1px_rgba(255,255,255,.05)_inset,0_0_28px_rgba(34,211,238,.24)] sm:min-w-[122px] sm:px-4"
      >
        <Flag code={current.code} />
        <span className="leading-none">{current.short}</span>
        <ChevronDown
          className={`ml-auto h-4 w-4 text-cyan-200 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[52px] z-[250] w-[214px] space-y-1.5 bg-transparent p-0 shadow-none"
        >
          {languages.map((item) => {
            const active = item.code === language;
            return (
              <button
                key={item.code}
                type="button"
                role="menuitem"
                onClick={() => selectLanguage(item.code)}
                className={`group grid h-11 w-full grid-cols-[34px_minmax(0,1fr)_16px] items-center gap-3 rounded-2xl border px-3.5 text-left text-[12px] font-semibold text-white backdrop-blur-[2px] transition duration-200 ${
                  active
                    ? "border-cyan-300/80 bg-transparent shadow-[0_0_22px_rgba(34,211,238,.16)]"
                    : "border-transparent bg-transparent hover:border-cyan-300/35 hover:shadow-[0_0_18px_rgba(34,211,238,.10)]"
                }`}
              >
                <Flag code={item.code} />
                <span className="min-w-0 truncate">{item.label}</span>
                {active ? (
                  <Check className="h-4 w-4 text-cyan-300 drop-shadow-[0_0_6px_rgba(34,211,238,.55)]" />
                ) : (
                  <span className="h-4 w-4" />
                )}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
