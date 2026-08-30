"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { languages, type AppLanguage } from "@/lib/i18n/catalog";

function Flag({ code }: { code: AppLanguage }) {
  const base =
    "relative h-[20px] w-[30px] shrink-0 overflow-hidden rounded-[2px] shadow-[0_0_0_1px_rgba(255,255,255,.22)]";

  if (code === "pl") {
    return (
      <span
        className={`${base} bg-[linear-gradient(to_bottom,#fff_0_50%,#dc143c_50%_100%)]`}
      />
    );
  }

  if (code === "de") {
    return (
      <span
        className={`${base} bg-[linear-gradient(to_bottom,#000_0_33.33%,#dd0000_33.33%_66.66%,#ffce00_66.66%_100%)]`}
      />
    );
  }

  if (code === "nl") {
    return (
      <span
        className={`${base} bg-[linear-gradient(to_bottom,#ae1c28_0_33.33%,#fff_33.33%_66.66%,#21468b_66.66%_100%)]`}
      />
    );
  }

  if (code === "es") {
    return (
      <span
        className={`${base} bg-[linear-gradient(to_bottom,#aa151b_0_25%,#f1bf00_25%_75%,#aa151b_75%_100%)]`}
      />
    );
  }

  return (
    <span className={`${base} bg-[#012169]`}>
      <span className="absolute left-0 top-0 h-full w-full bg-[linear-gradient(33deg,transparent_43%,white_44%_56%,transparent_57%),linear-gradient(-33deg,transparent_43%,white_44%_56%,transparent_57%)]" />
      <span className="absolute left-1/2 top-0 h-full w-[5px] -translate-x-1/2 bg-white" />
      <span className="absolute left-0 top-1/2 h-[5px] w-full -translate-y-1/2 bg-white" />
      <span className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-[#c8102e]" />
      <span className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-[#c8102e]" />
    </span>
  );
}

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const current = languages.find((item) => item.code === lang) ?? languages[0];

  return (
    <div ref={rootRef} className="relative z-[500]" data-i18n-skip="true">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex items-center gap-3 rounded-[12px] border border-sky-300/20 bg-[#0b6aa8] font-bold text-white shadow-[0_8px_22px_rgba(0,65,110,.24)] transition hover:bg-[#0d75b7] ${
          compact ? "h-[42px] min-w-[116px] px-3 text-[13px]" : "h-[46px] min-w-[142px] px-4 text-[14px]"
        }`}
      >
        <Flag code={current.code} />
        <span>{current.short}</span>
        <ChevronDown
          className={`ml-auto h-4 w-4 text-sky-200 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-[600] w-[225px] overflow-hidden rounded-[12px] border border-sky-300/20 bg-[#0b6aa8] p-2 shadow-[0_18px_45px_rgba(0,30,60,.42)]">
          {languages.map((item) => {
            const active = item.code === lang;

            return (
              <button
                key={item.code}
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (!active) setLang(item.code);
                }}
                className={`flex w-full items-center gap-3 rounded-[9px] px-3 py-2.5 text-left text-[13px] font-semibold transition ${
                  active
                    ? "bg-white/12 text-white"
                    : "text-sky-50 hover:bg-white/10"
                }`}
              >
                <Flag code={item.code} />
                <span className="flex-1">{item.label}</span>
                {active ? <Check className="h-4 w-4 text-cyan-200" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
