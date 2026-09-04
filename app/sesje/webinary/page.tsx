"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  PlayCircle,
  Radio,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Video,
  Zap,
} from "lucide-react";

const webinars = [
  {
    date: "22 SIE",
    title: "Price Action PRO – Struktura Rynku",
    time: "19:00",
    duration: "90 min",
    host: "Artur FX",
    status: "NAJBLIŻSZY",
    tone: "sky",
    description:
      "Praktyczna analiza HH/HL, LH/LL, stref reakcji i wejść zgodnych z kierunkiem rynku.",
  },
  {
    date: "26 SIE",
    title: "GOLD M5 – Scalping Session",
    time: "19:30",
    duration: "75 min",
    host: "Artur FX",
    status: "ZAPISY",
    tone: "amber",
    description:
      "Scalping XAUUSD na M5 z timingiem M1, reakcjami ceny i zarządzaniem pozycją.",
  },
  {
    date: "29 SIE",
    title: "Risk Management PRO",
    time: "18:00",
    duration: "60 min",
    host: "Artur FX",
    status: "ZAPISY",
    tone: "violet",
    description:
      "Ryzyko, wielkość pozycji, R:R i plan transakcyjny bez przypadkowych decyzji.",
  },
  {
    date: "02 WRZ",
    title: "Trading Psychology – Q&A",
    time: "19:00",
    duration: "90 min",
    host: "Gość specjalny",
    status: "ZAPISY",
    tone: "emerald",
    description:
      "Sesja pytań i odpowiedzi o dyscyplinie, błędach tradera i pracy z planem.",
  },
];

const recordings = [
  { title: "Scalping GOLD – Momentum M5", date: "15 sierpnia 2026", duration: "01:18:42" },
  { title: "Price Action – Bias & Timing", date: "8 sierpnia 2026", duration: "01:34:11" },
  { title: "Risk Management – Masterclass", date: "1 sierpnia 2026", duration: "01:06:28" },
];

function toneClass(tone: string) {
  if (tone === "amber") return "border-amber-500/35 bg-amber-500/10 text-amber-300";
  if (tone === "violet") return "border-violet-500/35 bg-violet-500/10 text-violet-300";
  if (tone === "emerald") return "border-emerald-500/35 bg-emerald-500/10 text-emerald-300";
  return "border-sky-500/35 bg-sky-500/10 text-sky-300";
}

export default function WebinaryPage() {
  return (
    <main className="min-h-screen bg-[#020914] text-white">
      <div className="mx-auto w-full max-w-[1900px] px-4 py-5 md:px-6 xl:px-8">
        {/* HEADER */}
        <header className="relative overflow-hidden rounded-[18px] border border-sky-900/70 bg-[linear-gradient(135deg,#06172b_0%,#03111f_55%,#020914_100%)] p-5">
          <div className="pointer-events-none absolute right-[8%] top-0 h-full w-[35%] opacity-[.10] [background-image:radial-gradient(circle,#38bdf8_1px,transparent_1px)] [background-size:8px_8px]" />

          <div className="relative z-10 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/sesje"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] border border-slate-700/80 bg-[#071522] text-slate-300 transition hover:border-sky-500/50 hover:text-sky-300"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] border border-sky-400/35 bg-sky-500/10 text-sky-300 shadow-[0_0_26px_rgba(14,165,233,.12)]">
                <GraduationCap className="h-8 w-8" />
              </div>

              <div>
                <div className="text-[9px] font-black uppercase tracking-[.24em] text-sky-300/65">
                  FX TRADE PROFESSIONAL
                </div>
                <h1 className="mt-1 text-[28px] font-black tracking-tight md:text-[34px]">
                  WEBINARY <span className="text-sky-400">LIVE</span>
                </h1>
                <p className="mt-1 max-w-[760px] text-[10px] leading-5 text-slate-400">
                  Edukacyjne spotkania na żywo, analiza rynku, strategie i praktyczne warsztaty tradingowe.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-3 rounded-[12px] border border-slate-700/70 bg-[#07121f] px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,.9)]" />
                <div>
                  <div className="text-[11px] font-black">WEBINAR SCHEDULE</div>
                  <div className="text-[8px] text-slate-500">AKTUALNY HARMONOGRAM</div>
                </div>
              </div>

              <button className="flex h-[48px] w-[48px] items-center justify-center rounded-[12px] border border-orange-500/25 bg-orange-500/10 text-orange-300">
                <Bell className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* KPI */}
        <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [CalendarDays, "NAJBLIŻSZY WEBINAR", "22 SIE • 19:00", "Price Action PRO", "text-sky-300"],
            [Video, "WEBINARY W MIESIĄCU", "4", "6h+ materiału LIVE", "text-violet-300"],
            [Users, "MIEJSCA", "500", "Limit uczestników", "text-emerald-300"],
            [PlayCircle, "NAGRANIA", "12+", "Dostęp po webinarze", "text-amber-300"],
          ].map(([Icon, label, value, hint, color]) => {
            const CardIcon = Icon as typeof CalendarDays;
            return (
              <div
                key={String(label)}
                className="rounded-[14px] border border-slate-700/70 bg-[linear-gradient(145deg,#071726,#04101b)] p-4"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-[11px] border border-slate-700 bg-[#091829] ${color}`}>
                    <CardIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-[8px] font-black tracking-[.08em] text-slate-500">{String(label)}</div>
                    <div className="mt-1 text-[19px] font-black">{String(value)}</div>
                    <div className="mt-1 text-[8px] text-slate-400">{String(hint)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* FEATURED */}
        <section className="mt-4 grid gap-3 xl:grid-cols-[1.4fr_.6fr]">
          <article className="relative overflow-hidden rounded-[16px] border border-emerald-400/55 bg-[linear-gradient(145deg,rgba(3,64,47,.68),rgba(3,18,25,.96))] p-5 shadow-[0_0_34px_rgba(16,185,129,.13)]">
            <div className="pointer-events-none absolute right-0 top-0 h-full w-[44%] opacity-[.28] [background:radial-gradient(circle_at_center,rgba(16,185,129,.25),transparent_65%)]" />

            <div className="relative z-10 flex flex-col gap-5 lg:grid lg:grid-cols-[1fr_360px] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-1 text-[8px] font-black text-emerald-300">
                    NAJBLIŻSZY WEBINAR
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/25 bg-rose-500/10 px-3 py-1 text-[8px] font-black text-rose-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> LIVE SOON
                  </span>
                </div>

                <h2 className="mt-4 text-[24px] font-black md:text-[30px]">
                  Price Action PRO
                  <span className="block text-emerald-300">Struktura Rynku</span>
                </h2>

                <p className="mt-3 max-w-[760px] text-[10px] leading-5 text-slate-300/75">
                  Kompletny webinar o trendzie, HH/HL, LH/LL, punktach reakcji, biasie oraz wejściach
                  zgodnych ze strukturą rynku. Praktyka na realnych przykładach z rynku.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-[9px] border border-slate-700/70 bg-[#06131b] px-3 py-2 text-[9px]">
                    <CalendarDays className="h-4 w-4 text-sky-300" /> 22 sierpnia 2026
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-[9px] border border-slate-700/70 bg-[#06131b] px-3 py-2 text-[9px]">
                    <Clock3 className="h-4 w-4 text-sky-300" /> 19:00 CET
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-[9px] border border-slate-700/70 bg-[#06131b] px-3 py-2 text-[9px]">
                    <Users className="h-4 w-4 text-sky-300" /> Max 500 osób
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button className="inline-flex items-center gap-2 rounded-[10px] border border-emerald-300/30 bg-[linear-gradient(90deg,#0ca45f,#16c773)] px-5 py-3 text-[10px] font-black text-white transition hover:brightness-110">
                    ZAPISZ SIĘ NA WEBINAR <ArrowRight className="h-4 w-4" />
                  </button>
                  <button className="inline-flex items-center gap-2 rounded-[10px] border border-slate-700 bg-[#071522] px-5 py-3 text-[10px] font-bold text-slate-300">
                    DODAJ DO KALENDARZA <CalendarDays className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="relative h-[240px] overflow-hidden rounded-[15px] border border-emerald-500/25 bg-[#06141a]">
                <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(14,165,233,.08),transparent_45%,rgba(16,185,129,.10))]" />
                <div className="absolute left-5 top-5 rounded-full border border-sky-400/25 bg-sky-500/10 px-3 py-1 text-[8px] font-black text-sky-300">
                  WEBINAR LIVE
                </div>
                <div className="flex h-full flex-col items-center justify-center">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border border-sky-400/35 bg-sky-500/10 text-sky-300 shadow-[0_0_35px_rgba(14,165,233,.18)]">
                    <GraduationCap className="h-14 w-14" />
                  </div>
                  <div className="mt-4 text-[15px] font-black">PRICE ACTION PRO</div>
                  <div className="mt-1 text-[9px] text-slate-500">FX TRADE PROFESSIONAL</div>
                </div>
              </div>
            </div>
          </article>

          <aside className="rounded-[16px] border border-sky-500/30 bg-[linear-gradient(145deg,rgba(3,105,161,.14),rgba(4,15,27,.95))] p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-sky-300" />
              <h3 className="text-[13px] font-black">CO OTRZYMUJESZ?</h3>
            </div>

            <div className="mt-5 space-y-3">
              {[
                "Praktyczna analiza rynku LIVE",
                "Strategia krok po kroku",
                "Sesja pytań i odpowiedzi",
                "Przykłady wejść i zarządzania",
                "Dostęp do nagrania po webinarze",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-[10px] border border-slate-700/60 bg-[#06121e] px-3 py-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
                  <span className="text-[9px] text-slate-300">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[12px] border border-violet-500/25 bg-violet-500/10 p-4">
              <div className="flex items-center gap-2 text-violet-300">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-[10px] font-black">FX TRADE PRO QUALITY</span>
              </div>
              <p className="mt-2 text-[9px] leading-5 text-slate-400">
                Materiał edukacyjny przygotowany w spójnym formacie z platformą FX Trade Professional.
              </p>
            </div>
          </aside>
        </section>

        {/* UPCOMING */}
        <section className="mt-4 rounded-[16px] border border-slate-700/70 bg-[#06111d] p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[8px] font-black uppercase tracking-[.16em] text-sky-300/70">HARMONOGRAM</div>
              <h2 className="mt-1 text-[17px] font-black">NADCHODZĄCE WEBINARY</h2>
            </div>
            <div className="rounded-[9px] border border-slate-700 bg-[#081522] px-3 py-2 text-[8px] font-semibold text-slate-400">
              SIERPIEŃ / WRZESIEŃ 2026
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {webinars.map((w) => (
              <article
                key={w.title}
                className="group rounded-[14px] border border-slate-700/70 bg-[linear-gradient(145deg,#071521,#030b13)] p-4 transition hover:border-sky-500/45"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-[11px] border ${toneClass(w.tone)}`}>
                    <div className="text-[8px] font-black">{w.date.split(" ")[1]}</div>
                    <div className="text-[20px] font-black leading-none">{w.date.split(" ")[0]}</div>
                  </div>
                  <span className={`rounded-full border px-2 py-1 text-[7px] font-black ${toneClass(w.tone)}`}>{w.status}</span>
                </div>

                <h3 className="mt-4 min-h-[38px] text-[12px] font-black leading-5">{w.title}</h3>
                <p className="mt-2 min-h-[54px] text-[8px] leading-4 text-slate-500">{w.description}</p>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-[9px] border border-slate-800 bg-[#07111c] p-2">
                    <div className="text-[7px] text-slate-600">GODZINA</div>
                    <div className="mt-1 text-[10px] font-black">{w.time}</div>
                  </div>
                  <div className="rounded-[9px] border border-slate-800 bg-[#07111c] p-2">
                    <div className="text-[7px] text-slate-600">CZAS</div>
                    <div className="mt-1 text-[10px] font-black">{w.duration}</div>
                  </div>
                </div>

                <div className="mt-3 text-[8px] text-slate-500">Prowadzący: <span className="font-bold text-slate-300">{w.host}</span></div>

                <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[9px] border border-sky-400/25 bg-sky-500/10 px-3 py-2.5 text-[8px] font-black text-sky-300 transition group-hover:bg-sky-500/15">
                  {w.status === "NAJBLIŻSZY" ? "ZAPISZ SIĘ" : "REZERWUJ MIEJSCE"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </article>
            ))}
          </div>
        </section>

        {/* LOWER */}
        <section className="mt-4 grid gap-3 xl:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-[16px] border border-violet-500/30 bg-[linear-gradient(145deg,rgba(76,29,149,.16),rgba(5,10,20,.96))] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[8px] font-black uppercase tracking-[.16em] text-violet-300/70">BIBLIOTEKA</div>
                <h2 className="mt-1 text-[16px] font-black">OSTATNIE WEBINARY</h2>
              </div>
              <Link href="/sesje/nagrania" className="text-[8px] font-bold text-violet-300">
                ZOBACZ NAGRANIA →
              </Link>
            </div>

            <div className="mt-4 space-y-2">
              {recordings.map((item) => (
                <div key={item.title} className="flex items-center gap-3 rounded-[11px] border border-slate-700/60 bg-[#080d17] p-3">
                  <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-[9px] border border-violet-400/20 bg-violet-500/10 text-violet-300">
                    <PlayCircle className="h-7 w-7" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[10px] font-black">{item.title}</div>
                    <div className="mt-1 text-[8px] text-slate-500">{item.date}</div>
                  </div>
                  <div className="rounded-full border border-slate-700 bg-[#07111c] px-2 py-1 text-[7px] text-slate-400">
                    {item.duration}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[16px] border border-amber-500/30 bg-[linear-gradient(145deg,rgba(120,53,15,.13),rgba(5,10,20,.96))] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[11px] border border-amber-400/30 bg-amber-500/10 text-amber-300">
                <TrendingUp className="h-7 w-7" />
              </div>
              <div>
                <div className="text-[8px] font-black uppercase tracking-[.12em] text-amber-300/70">POZIOM PRO</div>
                <h2 className="mt-1 text-[15px] font-black">WEBINARY PRAKTYCZNE</h2>
              </div>
            </div>

            <p className="mt-4 text-[9px] leading-5 text-slate-400">
              Każdy webinar jest nastawiony na praktykę: analiza rynku, setup, timing, zarządzanie pozycją
              i omówienie najczęstszych błędów.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-[10px] border border-slate-700/60 bg-[#08131d] p-3">
                <Zap className="h-5 w-5 text-emerald-300" />
                <div className="mt-2 text-[9px] font-black">LIVE ANALYSIS</div>
                <div className="mt-1 text-[7px] text-slate-500">Rynek na żywo</div>
              </div>
              <div className="rounded-[10px] border border-slate-700/60 bg-[#08131d] p-3">
                <Radio className="h-5 w-5 text-rose-300" />
                <div className="mt-2 text-[9px] font-black">Q&A</div>
                <div className="mt-1 text-[7px] text-slate-500">Pytania na żywo</div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER INFO */}
        <section className="mt-4 grid overflow-hidden rounded-[15px] border border-slate-700/70 bg-[#06111d] md:grid-cols-4">
          {[
            [Clock3, "CZAS CET", "Sprawdź godzinę przed webinarem", "text-sky-300"],
            [Radio, "WEBINARY LIVE", "Spotkania edukacyjne na żywo", "text-rose-300"],
            [Video, "NAGRANIA", "Dostęp do wybranych powtórek", "text-violet-300"],
            [Bell, "POWIADOMIENIA", "Nie przegap kolejnego webinaru", "text-orange-300"],
          ].map(([Icon, title, text, color], index) => {
            const InfoIcon = Icon as typeof Clock3;
            return (
              <div
                key={String(title)}
                className={`flex items-center gap-3 p-4 ${index > 0 ? "border-t border-slate-800 md:border-l md:border-t-0" : ""}`}
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-[#091829] ${color}`}>
                  <InfoIcon className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-[9px] font-black">{String(title)}</div>
                  <div className="mt-1 text-[8px] leading-4 text-slate-400">{String(text)}</div>
                </div>
              </div>
            );
          })}
        </section>

        <div className="mt-4 flex items-center justify-center gap-4 py-2 text-[8px] font-semibold uppercase tracking-[.35em] text-slate-500">
          <span className="h-px w-24 bg-sky-500/30" />
          FX TRADE PROFESSIONAL – WEBINARY LIVE
          <span className="h-px w-24 bg-sky-500/30" />
        </div>
      </div>
    </main>
  );
}

