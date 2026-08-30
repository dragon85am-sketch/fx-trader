"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  Clock3,
  Gift,
  GraduationCap,
  Lightbulb,
  LockKeyhole,
  PlayCircle,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";

const tiles = [
  {
    title: "FX Trade Academy",
    description:
      "Kompleksowa akademia tradingu od podstaw po zaawansowane strategie.",
    icon: BookOpen,
    href: "/education/kurs",
    badge: "POPULARNE",
    meta: "28 lekcji",
    time: "8h 30m",
    accent: "violet",
    image: "/education/academy-bull.png",
  },
  {
    title: "Gotowe Setupy",
    description:
      "Gotowe setupy wejścia, zarządzania pozycją i analizy na przykładach.",
    icon: TrendingUp,
    href: "/education/setupy",
    badge: "NOWE",
    meta: "16 materiałów",
    time: "6h 15m",
    accent: "blue",
    image: "/education/setups-chess.png",
  },
  {
    title: "Materiały bonusowe",
    description:
      "Dodatkowe poradniki, checklisty, e-booki i narzędzia dla traderów.",
    icon: Lightbulb,
    href: "/education/bonusy",
    badge: "",
    meta: "8 materiałów",
    time: "2h 45m",
    accent: "green",
    image: "/education/bonus-gift.png",
  },
];

const popularMaterials = [
  {
    title: "Price Action – Struktura Rynku",
    description: "Zrozum strukturę rynku i wykorzystuj ją w swoich zagraniach.",
    type: "LEKCJA",
    time: "24 min",
    level: "Średni",
    rating: "4.9",
    image: "/education/price-action.png",
  },
  {
    title: "Wskaźniki – Trend i Momentum",
    description: "Skuteczne wykorzystanie wskaźników trendu i momentum.",
    type: "LEKCJA",
    time: "32 min",
    level: "Średni",
    rating: "4.8",
    image: "/education/momentum.png",
  },
  {
    title: "Zarządzanie ryzykiem",
    description: "Jak chronić kapitał i zarządzać ryzykiem jak profesjonalista.",
    type: "PORADNIK",
    time: "18 min",
    level: "Łatwy",
    rating: "4.9",
    image: "/education/risk-management.png",
  },
];

const learningPath = [
  { title: "Podstawy tradingu", meta: "8 / 8 materiałów", progress: 100 },
  { title: "Analiza techniczna", meta: "12 / 12 materiałów", progress: 100 },
  { title: "Zarządzanie ryzykiem", meta: "5 / 8 materiałów", progress: 63 },
  { title: "Strategie tradingowe", meta: "0 / 10 materiałów", progress: 0 },
  { title: "Psychologia tradera", meta: "0 / 6 materiałów", progress: 0 },
];

function MiniCandles() {
  const bars: Array<[number, number, number, boolean]> = [
    [18, 44, 30, true], [34, 58, 38, false], [28, 49, 32, true],
    [43, 72, 48, true], [52, 82, 57, false], [60, 91, 66, true],
    [72, 104, 78, true], [67, 96, 73, false], [86, 118, 91, true],
  ];
  return (
    <svg viewBox="0 0 150 92" className="h-full w-full">
      <defs>
        <linearGradient id="gridFade" x1="0" x2="1">
          <stop offset="0" stopColor="#0ea5e9" stopOpacity=".18" />
          <stop offset="1" stopColor="#0ea5e9" stopOpacity=".02" />
        </linearGradient>
      </defs>
      {[18, 38, 58, 78].map((y) => (
        <line key={y} x1="0" y1={y} x2="150" y2={y} stroke="url(#gridFade)" />
      ))}
      {bars.map(([x, high, body, up], i) => (
        <g key={i}>
          <line
            x1={x}
            y1={92 - high}
            x2={x}
            y2={92 - body + 22}
            stroke={up ? "#34d399" : "#fb7185"}
            strokeWidth="1.5"
          />
          <rect
            x={x - 3.5}
            y={92 - body}
            width="7"
            height="16"
            rx="1"
            fill={up ? "#34d399" : "#fb7185"}
          />
        </g>
      ))}
      <path
        d="M3 78 C20 72,24 76,38 62 S58 58,68 48 S86 50,100 32 S122 34,147 15"
        fill="none"
        stroke="#38bdf8"
        strokeWidth="2"
        opacity=".8"
      />
    </svg>
  );
}

function HeroArtwork() {
  return (
    <div className="relative hidden h-[190px] w-[390px] shrink-0 overflow-hidden rounded-[22px] lg:block">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,.25),transparent_65%)]" />
      <img
        src="/education/education-hero.png"
        alt="FX Trade Education"
        className="absolute inset-0 h-full w-full object-cover object-center drop-shadow-[0_0_28px_rgba(37,99,235,.35)]"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#07325f]/20 via-transparent to-[#062b52]/15" />
    </div>
  );
}

function CategoryArtwork({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 w-[48%] overflow-hidden">
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover object-center opacity-95 transition duration-500 group-hover:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#083866] via-[#083866]/35 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#062b52]/45 via-transparent to-transparent" />
    </div>
  );
}

function MaterialArtwork({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 ring-1 ring-inset ring-blue-400/10" />
    </div>
  );
}

export default function EducationPage() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#020817] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "linear-gradient(rgba(2,8,23,.44), rgba(2,8,23,.68)), url('/education-glow-bg.png')",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(circle_at_50%_8%,rgba(34,211,238,.16),transparent_46%)]"
      />
      <div className="relative z-10 mx-auto w-full max-w-[1900px] space-y-4 px-4 py-5 md:px-6 xl:px-8">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-[22px] border border-sky-400/35 bg-[linear-gradient(115deg,#0d4f8f_0%,#0a3f78_48%,#07325f_100%)] shadow-[0_0_38px_rgba(14,165,233,.18),0_24px_70px_rgba(2,12,27,.20)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_35%_40%,rgba(37,99,235,.16),transparent_28%),radial-gradient(circle_at_65%_0%,rgba(124,58,237,.09),transparent_28%)]" />
          <div className="relative z-10 grid min-h-[230px] gap-5 px-6 py-5 xl:grid-cols-[1fr_auto_1.35fr] xl:items-center">
            <div className="flex items-start gap-5">
              <div className="mt-1 flex h-16 w-16 shrink-0 items-center justify-center rounded-[18px] border border-blue-400/50 bg-gradient-to-br from-blue-500/20 to-blue-950/40 text-cyan-300 shadow-[0_0_30px_rgba(37,99,235,.18)]">
                <GraduationCap className="h-8 w-8" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-200/65">
                  FX TRADE / EDUKACJA
                </div>
                <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-[38px]">
                  Edukacja
                </h1>
                <p className="mt-2 max-w-md text-[12px] leading-5 text-slate-300/75">
                  Rozwijaj swoje umiejętności i stań się lepszym traderem.
                </p>
                <Link
                  href="/education/kurs"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl border border-cyan-400/50 bg-gradient-to-r from-blue-600 to-sky-500 px-5 py-3 text-[11px] font-bold shadow-[0_10px_30px_rgba(14,165,233,.2)] transition hover:-translate-y-0.5 hover:brightness-110"
                >
                  Kontynuuj naukę <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <HeroArtwork />

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                [BookOpen, "54", "Materiały", "Wiedza w Twoim zasięgu"],
                [Clock3, "29 h 45 min", "Łączny czas nauki", "Inwestycja w siebie"],
                [TrendingUp, "87%", "Postęp nauki", "Świetna robota!"],
                [Trophy, "12", "Certyfikaty", "Zdobyte osiągnięcia"],
              ].map(([Icon, value, label, sub], index) => {
                const StatIcon = Icon as typeof BookOpen;
                return (
                  <div
                    key={String(label)}
                    className="group min-h-[145px] rounded-[16px] border border-blue-400/25 bg-[linear-gradient(145deg,rgba(13,72,128,.94),rgba(7,48,91,.96))] p-4 shadow-[0_0_24px_rgba(56,189,248,.10),inset_0_1px_0_rgba(125,211,252,.08)] transition hover:border-cyan-300/60 hover:shadow-[0_0_32px_rgba(56,189,248,.20)]"
                  >
                    <StatIcon
                      className={`h-7 w-7 ${
                        index === 1
                          ? "text-violet-400"
                          : index === 2
                          ? "text-emerald-400"
                          : index === 3
                          ? "text-amber-300"
                          : "text-blue-400"
                      }`}
                    />
                    <div className="mt-4 text-[24px] font-bold">{String(value)}</div>
                    <div className="mt-1 text-[10px] font-medium text-slate-300">
                      {String(label)}
                    </div>
                    <div className="mt-2 text-[8px] text-slate-500">{String(sub)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CATEGORIES */}
        <section className="grid gap-4 xl:grid-cols-3">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            const border =
              tile.accent === "violet"
                ? "border-violet-500/40 hover:border-violet-400/70"
                : tile.accent === "green"
                ? "border-emerald-500/35 hover:border-emerald-400/65"
                : "border-blue-500/35 hover:border-blue-400/70";
            const icon =
              tile.accent === "violet"
                ? "border-violet-500/45 bg-violet-500/15 text-violet-300"
                : tile.accent === "green"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-blue-500/40 bg-blue-500/10 text-blue-300";

            return (
              <Link
                key={tile.title}
                href={tile.href}
                className={`group relative min-h-[210px] overflow-hidden rounded-[20px] border ${border} bg-[linear-gradient(145deg,#0b477f_0%,#083866_55%,#062d55_100%)] p-5 shadow-[0_0_32px_rgba(14,165,233,.14),0_18px_45px_rgba(2,12,27,.18)] transition hover:-translate-y-0.5`}
              >
                <CategoryArtwork src={tile.image} alt={tile.title} />
                <div className="relative z-10 flex h-full max-w-[66%] flex-col">
                  <div className="flex items-start justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-[14px] border ${icon}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    {tile.badge && (
                      <span className="absolute left-[calc(100%+80px)] top-0 whitespace-nowrap rounded-full border border-blue-400/30 bg-blue-500/10 px-2.5 py-1 text-[8px] font-bold tracking-[.08em] text-blue-200">
                        {tile.badge}
                      </span>
                    )}
                  </div>
                  <h2 className="mt-5 text-[18px] font-bold">{tile.title}</h2>
                  <p className="mt-2 text-[10px] leading-5 text-slate-400">
                    {tile.description}
                  </p>
                  <div className="mt-auto flex items-center gap-3 border-t border-white/[.07] pt-4 text-[9px] text-slate-400">
                    <span>{tile.meta}</span><span>•</span><span>{tile.time}</span>
                    <span className="ml-auto flex h-8 w-8 items-center justify-center rounded-full border border-blue-400/40 text-blue-300 transition group-hover:translate-x-1">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>

        {/* PROGRESS */}
        <section className="relative overflow-hidden rounded-[20px] border border-sky-400/35 bg-[linear-gradient(110deg,#0b477f,#07325f)] px-5 py-4 shadow-[0_0_34px_rgba(14,165,233,.14)]">
          <div className="pointer-events-none absolute right-[24%] top-1/2 h-28 w-40 -translate-y-1/2 bg-[radial-gradient(circle,rgba(37,99,235,.18),transparent_65%)]" />
          <div className="grid gap-5 lg:grid-cols-[360px_1fr_170px] lg:items-center">
            <div className="flex items-center gap-5">
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-[conic-gradient(#2563eb_0_87%,#0b2446_87%_100%)] p-[8px] shadow-[0_0_30px_rgba(37,99,235,.22)]">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-[#07315a] text-[25px] font-bold">
                  87%
                </div>
              </div>
              <div>
                <h2 className="text-[17px] font-bold">Twój postęp w nauce</h2>
                <p className="mt-2 text-[11px] font-semibold">Świetna robota! 🔥</p>
                <p className="mt-1 text-[10px] leading-5 text-slate-400">
                  Kontynuuj naukę i zdobywaj nowe umiejętności.
                </p>
              </div>
            </div>

            <div>
              <div className="mb-3 text-[10px] text-slate-300">
                <b className="text-white">47 z 54</b> materiałów ukończonych
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[#05284c] shadow-inner">
                <div className="h-full w-[87%] rounded-full bg-gradient-to-r from-blue-600 via-sky-400 to-cyan-300 shadow-[0_0_18px_rgba(34,211,238,.35)]" />
              </div>
            </div>

            <Link
              href="/education/kurs"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-400/40 bg-gradient-to-r from-blue-600 to-sky-500 px-4 py-3 text-[10px] font-bold shadow-[0_10px_30px_rgba(37,99,235,.18)] hover:brightness-110"
            >
              Kontynuuj naukę <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* MATERIALS + PATH */}
        <section className="grid gap-4 2xl:grid-cols-[1.7fr_1fr]">
          <div className="rounded-[20px] border border-sky-400/35 bg-[linear-gradient(145deg,#0b477f,#07325f)] p-4 shadow-[0_0_30px_rgba(14,165,233,.13)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-sky-400" />
                  <h2 className="text-[17px] font-bold">Popularne materiały</h2>
                </div>
                <p className="mt-1 text-[9px] text-slate-500">
                  Najczęściej oglądane i najwyżej oceniane materiały
                </p>
              </div>
              <button className="rounded-xl border border-sky-400/35 bg-blue-500/[.06] px-4 py-2.5 text-[9px] font-semibold text-sky-300 hover:bg-blue-500/10">
                Zobacz wszystkie
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {popularMaterials.map((item) => (
                <div
                  key={item.title}
                  className="group grid gap-4 rounded-[14px] border border-sky-400/25 bg-[#083866]/90 p-2.5 shadow-[inset_0_1px_0_rgba(125,211,252,.05)] transition hover:border-blue-400/40 md:grid-cols-[155px_1fr_auto] md:items-center"
                >
                  <div className="h-[76px] overflow-hidden rounded-[10px] border border-sky-400/30 bg-[#062b52]">
                    <MaterialArtwork src={item.image} alt={item.title} />
                  </div>
                  <div>
                    <span className={`rounded-full border px-2 py-1 text-[7px] font-bold ${
                      item.type === "PORADNIK"
                        ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
                        : "border-blue-400/25 bg-blue-500/10 text-sky-300"
                    }`}>
                      {item.type}
                    </span>
                    <h3 className="mt-2 text-[12px] font-bold">{item.title}</h3>
                    <p className="mt-1 text-[9px] text-slate-400">{item.description}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-[9px] text-slate-400 md:justify-end">
                    <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{item.time}</span>
                    <span>{item.level}</span>
                    <span className="flex items-center gap-1 text-amber-300"><Star className="h-3.5 w-3.5 fill-current" />{item.rating}</span>
                    <button className="inline-flex items-center gap-2 rounded-[9px] border border-blue-500/40 bg-blue-500/[.06] px-3 py-2.5 font-semibold text-white hover:bg-blue-500/15">
                      <PlayCircle className="h-4 w-4 text-blue-300" /> Otwórz materiał
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[20px] border border-sky-400/35 bg-[linear-gradient(145deg,#0b477f,#07325f)] p-5 shadow-[0_0_30px_rgba(14,165,233,.13)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-cyan-300" />
                <h2 className="text-[17px] font-bold">Twoja ścieżka nauki</h2>
              </div>
              <span className="rounded-lg border border-sky-400/35 px-3 py-2 text-[8px] text-blue-300">Plan nauki</span>
            </div>

            <div className="mt-5 space-y-4">
              {learningPath.map((step, index) => {
                const done = step.progress === 100;
                const active = step.progress > 0 && step.progress < 100;
                return (
                  <div key={step.title} className="grid grid-cols-[38px_1fr] gap-3">
                    <div className="relative flex justify-center">
                      {index < learningPath.length - 1 && (
                        <div className="absolute left-1/2 top-8 h-[calc(100%+16px)] w-px -translate-x-1/2 bg-blue-500/25" />
                      )}
                      <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-[10px] font-bold ${
                        done
                          ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-300"
                          : active
                          ? "border-blue-400/70 bg-blue-600 text-white shadow-[0_0_18px_rgba(37,99,235,.45)]"
                          : "border-slate-600 bg-[#07315a] text-slate-400"
                      }`}>
                        {done ? <Check className="h-4 w-4" /> : active ? index + 1 : <LockKeyhole className="h-3.5 w-3.5" />}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[10px] font-semibold">{step.title}</div>
                          <div className="mt-1 text-[8px] text-slate-500">{step.meta}</div>
                        </div>
                        <div className="text-[9px] text-slate-400">{step.progress}%</div>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#08315a]">
                        <div
                          className={`h-full rounded-full ${done ? "bg-emerald-400" : "bg-blue-500"}`}
                          style={{ width: `${step.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* BENEFITS */}
        <section className="grid gap-3 rounded-[18px] border border-sky-400/30 bg-[linear-gradient(90deg,#0a3f73,#08345f,#0a3f73)] p-3 shadow-[0_0_28px_rgba(14,165,233,.12)] md:grid-cols-2 xl:grid-cols-4">
          {[
            [Clock3, "Ucz się w swoim tempie", "Dostęp do materiałów 24/7", "text-emerald-300"],
            [Rocket, "Praktyczna wiedza", "Realne przykłady i case study", "text-blue-300"],
            [Sparkles, "Ekspercka jakość", "Materiały od profesjonalnych traderów", "text-violet-300"],
            [Trophy, "Certyfikaty", "Zdobywaj certyfikaty i wyróżnij się", "text-amber-300"],
          ].map(([Icon, title, desc, color]) => {
            const BenefitIcon = Icon as typeof Clock3;
            return (
              <div key={String(title)} className="flex items-center gap-3 rounded-xl px-3 py-2">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[.035] ${String(color)}`}>
                  <BenefitIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] font-semibold">{String(title)}</div>
                  <div className="mt-1 text-[8px] text-slate-500">{String(desc)}</div>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
