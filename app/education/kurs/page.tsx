"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  MonitorUp,
  CandlestickChart,
  Network,
  Timer,
  Droplets,
  PieChart,
  Brain,
  ClipboardCheck,
  NotebookPen,
  Search,
  Settings,
  Rocket,
  TriangleAlert,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  GraduationCap,
  LayoutGrid,
  List,
  Lock,
  Play,
  RotateCcw,
  ShieldCheck,
  Target,
  TrendingUp,
} from "lucide-react";

type Module = {
  id: number;
  title: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
};

const modules: Module[] = [
  { id: 0, title: "Podstawy tradingu", icon: BookOpen },
  { id: 1, title: "Platforma tradingowa", icon: MonitorUp },
  { id: 2, title: "Wykresy i timeframe", icon: CandlestickChart },
  { id: 3, title: "Struktura rynku", icon: Network },
  { id: 4, title: "Trend", icon: TrendingUp },
  { id: 5, title: "Price Action", icon: CandlestickChart },
  { id: 6, title: "Setup tradingowy", icon: Timer },
  { id: 7, title: "Timing", icon: Clock3 },
  { id: 8, title: "Liquidity", icon: Droplets },
  { id: 9, title: "Risk management", icon: ShieldCheck },
  { id: 10, title: "Zarządzanie pozycją", icon: PieChart },
  { id: 11, title: "Psychologia tradingu", icon: Brain },
  { id: 12, title: "Rutyna tradera", icon: ClipboardCheck },
  { id: 13, title: "Trading journal", icon: NotebookPen },
  { id: 14, title: "Case study", icon: Search },
  { id: 15, title: "System tradingowy", icon: Settings },
  { id: 16, title: "Statystyka tradingowa", icon: BarChart3 },
  { id: 17, title: "Skalowanie konta", icon: Rocket },
  { id: 18, title: "Błędy traderów", icon: TriangleAlert },
];

function getProgressBar(percent: number) {
  const total = 16;
  const filled = Math.round((percent / 100) * total);
  return "█".repeat(filled) + "░".repeat(total - filled);
}

const moduleAccents = [
  "sky",
  "emerald",
  "violet",
  "cyan",
  "orange",
  "violet",
  "sky",
  "cyan",
  "orange",
  "emerald",
  "rose",
  "violet",
  "sky",
  "orange",
  "rose",
  "cyan",
  "rose",
  "pink",
  "violet",
];

function accentClasses(accent: string) {
  if (accent === "emerald")
    return "border-emerald-500/35 text-emerald-300 bg-emerald-500/10";
  if (accent === "violet")
    return "border-violet-500/35 text-violet-300 bg-violet-500/10";
  if (accent === "cyan")
    return "border-cyan-500/35 text-cyan-300 bg-cyan-500/10";
  if (accent === "orange")
    return "border-orange-500/35 text-orange-300 bg-orange-500/10";
  if (accent === "rose")
    return "border-rose-500/35 text-rose-300 bg-rose-500/10";
  if (accent === "pink")
    return "border-pink-500/35 text-pink-300 bg-pink-500/10";
  return "border-sky-500/35 text-sky-300 bg-sky-500/10";
}

export default function KursPage() {
  const [continueHref, setContinueHref] = useState("/education/kurs/0");
  const [unlockedModule, setUnlockedModule] = useState(0);
  const [progress, setProgress] = useState(0);
  const [streak, setStreak] = useState(1);
  const [passedCount, setPassedCount] = useState(0);

  useEffect(() => {
    const lastModule = localStorage.getItem("lastOpenedModule");
    if (lastModule !== null) {
      setContinueHref(`/education/kurs/${lastModule}`);
    }

    const passedQuizzes = JSON.parse(
      localStorage.getItem("passedQuizzes") || "{}"
    ) as Record<string, boolean>;

    const passedModules = Object.keys(passedQuizzes).length;
    setPassedCount(passedModules);

    const unlocked = Math.min(passedModules, modules.length - 1);
    setUnlockedModule(unlocked);

    const progressPercent = Math.round((passedModules / modules.length) * 100);
    setProgress(progressPercent);

    const today = new Date().toDateString();
    const lastStudyDay = localStorage.getItem("lastStudyDay");
    const savedStreak = Number(localStorage.getItem("studyStreak") || "1");

    if (lastStudyDay !== today) {
      localStorage.setItem("lastStudyDay", today);
      localStorage.setItem("studyStreak", String(savedStreak + 1));
      setStreak(savedStreak + 1);
    } else {
      setStreak(savedStreak);
    }
  }, []);

  const progressBar = useMemo(() => getProgressBar(progress), [progress]);

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#020817] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "linear-gradient(rgba(2,8,23,.44), rgba(2,8,23,.68)), url('/fx-trade-academy-bg.png')",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(circle_at_50%_8%,rgba(34,211,238,.16),transparent_46%)]"
      />
      <div className="relative z-10">
      <div className="mx-auto w-full max-w-[1900px] space-y-4 px-4 py-5 md:px-6 xl:px-8">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-[16px] border border-cyan-300/35 bg-[linear-gradient(120deg,#0d5b9b_0%,#0a477f_52%,#073866_100%)] p-5 shadow-[0_0_28px_rgba(34,211,238,.18),inset_0_1px_0_rgba(255,255,255,.10)]">
          <div className="pointer-events-none absolute right-[4%] top-0 h-full w-[34%] opacity-[.14] [background-image:radial-gradient(circle,#38bdf8_1px,transparent_1px)] [background-size:7px_7px] [mask-image:radial-gradient(ellipse_at_center,black_0%,transparent_72%)]" />

          <div className="relative z-10 grid gap-5 xl:grid-cols-[1fr_330px]">
            <div>
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[15px] border border-sky-400/30 bg-sky-500/10 text-sky-300 shadow-[0_0_24px_rgba(14,165,233,.15)]">
                  <GraduationCap className="h-8 w-8" />
                </div>

                <div>
                  <div className="text-[9px] font-semibold uppercase tracking-[.18em] text-sky-200/55">
                    FX TRADE / EDUCATION / ACADEMY
                  </div>
                  <h1 className="mt-1 text-[30px] font-semibold tracking-tight">
                    FX Trade Academy
                  </h1>
                  <p className="mt-1 text-[11px] text-sky-100/50">
                    Professional Trading Program
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      [BookOpen, `${modules.length} modułów`],
                      [BrainCircuit, `${modules.length} quizów`],
                      [Flame, `Streak: ${streak} dni`],
                    ].map(([Icon, label], index) => {
                      const StatIcon = Icon as typeof BookOpen;
                      return (
                        <span
                          key={index}
                          className="inline-flex items-center gap-2 rounded-[8px] border border-[#0d579e] bg-[#052348] px-3 py-2 text-[9px] text-sky-100/70"
                        >
                          <StatIcon className="h-3.5 w-3.5 text-sky-300" />
                          {String(label)}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-[12px] border border-[#0a417b] bg-[#031a36] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[11px] font-semibold">
                    Postęp kursu: <span className="text-sky-300">{progress}%</span>
                  </div>
                  <div className="text-[9px] text-sky-100/50">
                    Ukończone moduły:{" "}
                    <span className="font-semibold text-emerald-300">
                      {passedCount}/{modules.length}
                    </span>
                  </div>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#061425]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#1689ff,#6d5dfc)] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <p className="mt-3 text-[9px] font-mono tracking-[.16em] text-sky-300">
                  {progressBar}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={continueHref}
                    className="inline-flex items-center gap-2 rounded-[9px] border border-sky-300/25 bg-[linear-gradient(90deg,#075ECB,#0B8FE4)] px-4 py-2.5 text-[10px] font-bold text-white transition hover:brightness-110"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Kontynuuj naukę
                  </Link>

                  <Link
                    href={continueHref}
                    className="inline-flex items-center gap-2 rounded-[9px] border border-[#0d579e] bg-[#052348] px-4 py-2.5 text-[10px] font-semibold text-sky-100/70 transition hover:bg-[#0a3264]"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Powtórz ostatni moduł
                  </Link>
                </div>
              </div>
            </div>

            <div className="relative hidden min-h-[250px] items-center justify-center xl:flex">
              <div className="absolute bottom-8 left-8 right-8 h-px bg-sky-400/10" />
              <svg viewBox="0 0 320 220" className="h-[220px] w-full">
                {[42, 64, 88, 116, 146].map((h, i) => (
                  <rect
                    key={i}
                    x={25 + i * 45}
                    y={190 - h}
                    width="24"
                    height={h}
                    rx="3"
                    fill="rgba(14,165,233,.10)"
                    stroke="rgba(56,189,248,.55)"
                  />
                ))}
                <polyline
                  points="25,165 70,135 105,150 145,108 180,128 220,86 250,103 295,38"
                  fill="none"
                  stroke="#27b3ff"
                  strokeWidth="4"
                />
                <polyline
                  points="288,51 295,38 282,42"
                  fill="none"
                  stroke="#27b3ff"
                  strokeWidth="4"
                />
              </svg>
            </div>
          </div>
        </section>

        {/* KPI */}
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              icon: BookOpen,
              label: "Moduły ukończone",
              value: `${passedCount} / ${modules.length}`,
              hint: `${progress}%`,
              tone: "sky",
            },
            {
              icon: TrendingUp,
              label: "Postęp kursu",
              value: `${progress}%`,
              hint: progress >= 100 ? "Świetna robota! 🎉" : "Kontynuuj naukę",
              tone: "emerald",
            },
            {
              icon: GraduationCap,
              label: "Odblokowany moduł",
              value: `${unlockedModule + 1} / ${modules.length}`,
              hint: unlockedModule + 1 >= modules.length ? "Wszystkie odblokowane" : "Ucz się dalej",
              tone: "violet",
            },
            {
              icon: CalendarDays,
              label: "Streak nauki",
              value: `${streak} dni`,
              hint: "Konsekwencja popłaca!",
              tone: "orange",
            },
          ].map((stat) => {
            const Icon = stat.icon;
            const tone =
              stat.tone === "emerald"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : stat.tone === "violet"
                ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
                : stat.tone === "orange"
                ? "border-orange-500/30 bg-orange-500/10 text-orange-300"
                : "border-sky-500/30 bg-sky-500/10 text-sky-300";

            return (
              <div
                key={stat.label}
                className="rounded-[13px] border border-cyan-300/30 bg-[linear-gradient(145deg,#0d5a96,#08477d)] p-4 shadow-[0_0_20px_rgba(14,165,233,.14),inset_0_1px_0_rgba(255,255,255,.08)]"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-[10px] border ${tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[9px] text-sky-100/45">{stat.label}</div>
                    <div className="mt-1 text-[20px] font-bold">{stat.value}</div>
                    <div className="mt-1 text-[8px] font-semibold text-emerald-300/80">
                      {stat.hint}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* MODULES */}
        <section className="rounded-[14px] border border-cyan-300/30 bg-[linear-gradient(145deg,#0d5a96,#08477d)] p-4 shadow-[0_0_28px_rgba(14,165,233,.16),inset_0_1px_0_rgba(255,255,255,.08)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-sky-300" />
              <h2 className="text-[16px] font-semibold">Moduły kursu</h2>
            </div>

            <div className="flex items-center gap-2">
              <button className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-sky-400/30 bg-sky-500/10 text-sky-300">
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#0d579e] bg-[#052348] text-sky-100/45">
                <List className="h-4 w-4" />
              </button>
              <button className="rounded-[8px] border border-[#0d579e] bg-[#052348] px-3 py-2 text-[9px] text-sky-100/60">
                Wszystkie moduły
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
            {modules.map((module, index) => {
              const locked = module.id > unlockedModule;
              const completed = module.id < passedCount;
              const accent = accentClasses(moduleAccents[index] || "sky");
              const ModuleIcon = module.icon;

              const cardContent = (
                <div
                  className={`group relative min-h-[108px] overflow-hidden rounded-[10px] border bg-[linear-gradient(145deg,#0b4b82,#073765)] p-3.5 shadow-[0_0_14px_rgba(34,211,238,.08),inset_0_1px_0_rgba(255,255,255,.05)] transition ${
                    locked
                      ? "border-slate-600/30 opacity-45"
                      : `border-cyan-300/25 hover:${accent.split(" ")[0]} hover:brightness-110 hover:shadow-[0_0_22px_rgba(34,211,238,.20)]`
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border text-[13px] font-bold ${accent}`}
                      >
                        {String(module.id + 1).padStart(2, "0")}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-[11px] font-semibold text-white">
                          {module.title}
                        </h3>
                        <p className="mt-1 text-[8px] text-sky-100/45">
                          6 lekcji • 1 quiz
                        </p>

                        <div
                          className={`mt-2 flex items-center gap-1.5 text-[8px] font-semibold ${
                            locked
                              ? "text-rose-300"
                              : completed
                              ? "text-emerald-300"
                              : "text-sky-300"
                          }`}
                        >
                          {locked ? (
                            <>
                              <Lock className="h-3 w-3" />
                              Zablokowany
                            </>
                          ) : completed ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              Ukończony
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3" />
                              Dostępny
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-[9px] border border-sky-400/10 bg-sky-400/[0.03] text-sky-300/35 transition group-hover:border-sky-400/25 group-hover:text-sky-300/70">
                      <ModuleIcon className="h-7 w-7" strokeWidth={1.7} />
                    </div>
                  </div>

                  {!locked && (
                    <ArrowRight className="absolute bottom-3 right-3 h-3.5 w-3.5 text-sky-300/0 transition group-hover:text-sky-300/70" />
                  )}
                </div>
              );

              if (locked) {
                return <div key={module.id}>{cardContent}</div>;
              }

              return (
                <Link key={module.id} href={`/education/kurs/${module.id}`}>
                  {cardContent}
                </Link>
              );
            })}
          </div>
        </section>
      </div>
      </div>
    </main>
  );
}
