"use client";

import React from "react";
import Link from "next/link";
import {
  BarChart3,
  Bolt,
  Boxes,
  Layers3,
  Gauge,
  CandlestickChart,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Crown,
  Gift,
  
  Lock,
  ShieldCheck,
  Star,
  Target,
  TrendingUp,
} from "lucide-react";

type Strat = {
  key:
    | "scalping"
    | "day-trading"
    | "swing-trading"
    | "renko"
    | "supertrend"
    | "bollinger"
    | "price-action";
  title: string;
  desc: string;
  badge: "FREE" | "PREMIUM";
  href: string;
  tags: string[];
  rating: string;
  success: string;
  timeframe: string;
  rr: string;
  duration: string;
  session: string;
  markets: string[];
  icon: React.ComponentType<{ className?: string }>;
  accent: "amber" | "emerald" | "sky" | "violet" | "rose" | "cyan";
};

const STRATEGIES: Strat[] = [
  {
    key: "scalping",
    title: "SCALPING",
    desc: "Szybkie wejścia i wyjścia. Filtr M5 → timing M1. Selekcja ponad ilość.",
    badge: "FREE",
    href: "/strategie/scalping",
    tags: ["M5 → M1", "3–5 trade", "RR 1.5R+"],
    rating: "4.8",
    success: "85%",
    timeframe: "M1 - M5",
    rr: "1.2 - 1.5",
    duration: "5 - 60 min",
    session: "London / NY",
    markets: ["EURUSD", "GBPUSD", "XAUUSD", "US30"],
    icon: Bolt,
    accent: "amber",
  },
  {
    key: "day-trading",
    title: "DAY TRADING",
    desc: "Plan dnia i 1–3 najlepsze okazje. Mniej klikania, więcej jakości.",
    badge: "PREMIUM",
    href: "/strategie/day-trading",
    tags: ["London/NY", "1–3 trade", "RR 2R+"],
    rating: "4.9",
    success: "82%",
    timeframe: "M15 - H1",
    rr: "1.2 - 1.4",
    duration: "1 - 8 godzin",
    session: "London / NY",
    markets: ["EURUSD", "US30", "NAS100", "GBPUSD"],
    icon: TrendingUp,
    accent: "emerald",
  },
  {
    key: "swing-trading",
    title: "SWING TRADING",
    desc: "Mniej wejść, większe ruchy. HTF poziomy + cierpliwość.",
    badge: "PREMIUM",
    href: "/strategie/swing-trading",
    tags: ["H1/H4", "1–5 / tydz.", "RR 3R+"],
    rating: "4.7",
    success: "80%",
    timeframe: "H4 - D1",
    rr: "1.3 - 1.8",
    duration: "2 - 10 dni",
    session: "Cały tydzień",
    markets: ["EURUSD", "GBPUSD", "USOIL", "XAUUSD"],
    icon: BarChart3,
    accent: "sky",
  },
  {
    key: "renko",
    title: "RENKO STRATEGY",
    desc: "Czysty wykres Renko filtrujący szum i pokazujący trend.",
    badge: "PREMIUM",
    href: "/strategie/renko",
    tags: ["Renko 10/20/30", "Trend", "RR 1.6R+"],
    rating: "4.8",
    success: "83%",
    timeframe: "Renko 10 · 20 · 30",
    rr: "1.2 - 1.6",
    duration: "30 min - kilka dni",
    session: "London / NY",
    markets: ["EURUSD", "XAUUSD", "US30", "NAS100"],
    icon: Boxes,
    accent: "violet",
  },
  {
    key: "supertrend",
    title: "SUPERTREND STRATEGY",
    desc: "Podążaj za trendem z wykorzystaniem wskaźnika SuperTrend.",
    badge: "PREMIUM",
    href: "/strategie/supertrend",
    tags: ["M15/H1/H4", "Trend", "RR 1.5R+"],
    rating: "4.7",
    success: "86%",
    timeframe: "M15 - H1 - H4",
    rr: "1.2 - 1.5",
    duration: "1 - 6 godzin",
    session: "London / NY",
    markets: ["EURUSD", "USDJPY", "US30", "XAUUSD"],
    icon: Gauge,
    accent: "rose",
  },
  {
    key: "bollinger",
    title: "BOLLINGER BANDS",
    desc: "Wykorzystaj zmienność rynku, wybicia i powroty do pasm Bollingera.",
    badge: "PREMIUM",
    href: "/strategie/bollinger",
    tags: ["M5/M15/H1", "Volatility", "RR 1.4R+"],
    rating: "4.8",
    success: "84%",
    timeframe: "M5 - M15 - H1",
    rr: "1.2 - 1.4",
    duration: "15 min - 4 godz.",
    session: "London / NY",
    markets: ["EURUSD", "GBPUSD", "US30", "XAUUSD"],
    icon: Layers3,
    accent: "cyan",
  },
  {
    key: "price-action",
    title: "PRICE ACTION",
    desc: "Klasyczne Price Action, struktura rynku i potwierdzenia świecowe.",
    badge: "FREE",
    href: "/strategie/price-action",
    tags: ["M5/H1/H4", "Structure", "RR 1.6R+"],
    rating: "4.6",
    success: "78%",
    timeframe: "M5 - H1 - H4",
    rr: "1.2 - 1.6",
    duration: "1 - kilka dni",
    session: "Cały tydzień",
    markets: ["EURUSD", "GBPUSD", "US30", "XAUUSD"],
    icon: CandlestickChart,
    accent: "emerald",
  },
];

function accentClasses(accent: Strat["accent"]) {
  if (accent === "emerald") {
    return {
      icon: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
      progress: "bg-emerald-400",
      glow: "shadow-[0_0_30px_rgba(16,185,129,.18)]",
    };
  }

  if (accent === "amber") {
    return {
      icon: "border-amber-400/30 bg-amber-500/10 text-amber-300",
      progress: "bg-amber-400",
      glow: "shadow-[0_0_30px_rgba(245,158,11,.18)]",
    };
  }

  if (accent === "violet") {
    return {
      icon: "border-violet-400/30 bg-violet-500/10 text-violet-300",
      progress: "bg-violet-400",
      glow: "shadow-[0_0_30px_rgba(139,92,246,.18)]",
    };
  }

  if (accent === "rose") {
    return {
      icon: "border-rose-400/30 bg-rose-500/10 text-rose-300",
      progress: "bg-rose-400",
      glow: "shadow-[0_0_30px_rgba(244,63,94,.18)]",
    };
  }

  if (accent === "cyan") {
    return {
      icon: "border-cyan-400/30 bg-cyan-500/10 text-cyan-300",
      progress: "bg-cyan-400",
      glow: "shadow-[0_0_30px_rgba(34,211,238,.18)]",
    };
  }

  return {
    icon: "border-sky-400/30 bg-sky-500/10 text-sky-300",
    progress: "bg-sky-400",
    glow: "shadow-[0_0_30px_rgba(14,165,233,.18)]",
  };
}

function Stars({ rating }: { rating: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex text-amber-300">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-3 w-3 fill-current" />
        ))}
      </div>
      <span className="text-[9px] text-sky-100/55">{rating}</span>
    </div>
  );
}

function PremiumLock() {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[14px] bg-[#031a36]/58 p-4 backdrop-blur-[4px]">
      <div className="w-full max-w-[260px] rounded-[12px] border border-violet-400/25 bg-[linear-gradient(145deg,#123f72,#24245f)] p-4 shadow-[0_0_36px_rgba(139,92,246,.22)] shadow-[0_0_32px_rgba(139,92,246,.12)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[8px] uppercase tracking-[.12em] text-sky-100/45">Dostęp</div>
            <div className="mt-1 text-[15px] font-bold">PREMIUM</div>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-violet-400/25 bg-violet-500/10 text-violet-300">
            <Lock className="h-4 w-4" />
          </div>
        </div>

        <p className="mt-3 text-[9px] leading-4 text-sky-100/50">
          Odblokuj premium, żeby zobaczyć pełny plan, checklistę i szczegóły strategii.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            href="/paywall"
            className="rounded-[8px] border border-violet-400/30 bg-[linear-gradient(90deg,#4c1d95,#6d28d9)] px-3 py-2.5 text-center text-[9px] font-bold text-white"
          >
            Odblokuj
          </Link>

          <Link
            href="/app"
            className="rounded-[8px] border border-[#0d579e] bg-[#0a3a69] px-3 py-2.5 text-center text-[9px] font-semibold text-sky-100/65"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function StrategyCard({
  strategy,
  locked,
}: {
  strategy: Strat;
  locked: boolean;
}) {
  const Icon = strategy.icon;
  const a = accentClasses(strategy.accent);

  return (
    <article
      className={`group relative overflow-hidden rounded-[14px] border border-[#0d579e] bg-[linear-gradient(145deg,#0b477f_0%,#083866_55%,#062d55_100%)] p-4 transition hover:border-sky-300/60 hover:shadow-[0_0_34px_rgba(56,189,248,.22)] ${a.glow}`}
    >
      {locked ? <PremiumLock /> : null}

      <div className={locked ? "opacity-35" : ""}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] border ${a.icon}`}>
              <Icon className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-[15px] font-semibold text-white">{strategy.title}</h2>
              <div className="mt-1">
                <Stars rating={strategy.rating} />
              </div>
            </div>
          </div>

          <span
            className={`rounded-full border px-2.5 py-1 text-[7px] font-bold tracking-[.08em] ${
              strategy.badge === "FREE"
                ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
                : "border-violet-400/25 bg-violet-500/10 text-violet-300"
            }`}
          >
            {strategy.badge}
          </span>
        </div>

        <p className="mt-4 min-h-[42px] text-[10px] leading-5 text-sky-100/50">
          {strategy.desc}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-[10px] border border-[#0a417b] bg-[#07315a]/90 p-3 shadow-[inset_0_0_18px_rgba(14,165,233,.05)]">
          <div>
            <div className="flex items-center justify-between text-[8px] text-sky-100/45">
              <span>Skuteczność</span>
              <span className="font-semibold text-white">{strategy.success}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#061425]">
              <div className={`h-full ${a.progress}`} style={{ width: strategy.success }} />
            </div>
          </div>

          <div>
            <div className="text-[8px] text-sky-100/45">Interwały</div>
            <div className="mt-1 text-[11px] font-semibold text-sky-300">{strategy.timeframe}</div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 border-b border-[#0a417b] pb-3">
          <div>
            <div className="text-[7px] text-sky-100/40">RR</div>
            <div className="mt-1 text-[9px] font-semibold">{strategy.rr}</div>
          </div>
          <div>
            <div className="text-[7px] text-sky-100/40">Czas trwania</div>
            <div className="mt-1 text-[9px] font-semibold">{strategy.duration}</div>
          </div>
          <div>
            <div className="text-[7px] text-sky-100/40">Sesje</div>
            <div className="mt-1 text-[9px] font-semibold">{strategy.session}</div>
          </div>
        </div>

        <div className="mt-3">
          <div className="text-[8px] text-sky-100/45">Najlepiej działa na:</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {strategy.markets.map((market) => (
              <span
                key={market}
                className="rounded-[6px] border border-[#0a417b] bg-[#0a3a69] px-2 py-1 text-[7px] font-semibold text-sky-100/65"
              >
                {market}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            href={locked ? "/paywall" : strategy.href}
            className="rounded-[8px] border border-[#0d579e] bg-[#0a3a69] px-3 py-2.5 text-center text-[9px] font-semibold text-sky-100/70 hover:bg-[#0a3264]"
          >
            Szczegóły
          </Link>

          <Link
            href={locked ? "/paywall" : strategy.href}
            className={`rounded-[8px] border px-3 py-2.5 text-center text-[9px] font-bold text-white ${
              strategy.badge === "PREMIUM"
                ? "border-violet-400/30 bg-[linear-gradient(90deg,#4c1d95,#6d28d9)]"
                : "border-sky-300/25 bg-[linear-gradient(90deg,#075ECB,#0B8FE4)]"
            }`}
          >
            Otwórz strategię
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function StrategieDashboardPage() {
  // Tymczasowo odblokowane wszystkie strategie podczas dodawania treści.
  const paid = true;

  const freeCount = STRATEGIES.filter((s) => s.badge === "FREE").length;
  const premiumCount = STRATEGIES.filter((s) => s.badge === "PREMIUM").length;

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#020817] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "linear-gradient(rgba(2,8,23,.42), rgba(2,8,23,.66)), url('/strategie-glow-bg.png')",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(circle_at_50%_8%,rgba(34,211,238,.18),transparent_46%)]"
      />
      <div className="relative z-10 mx-auto w-full max-w-[1900px] space-y-4 px-4 py-5 md:px-6 xl:px-8">
        {/* HEADER */}
        <section className="relative overflow-hidden rounded-[16px] border border-[#0d579e] bg-[linear-gradient(120deg,#0d4f8f_0%,#0a3f78_52%,#072f5f_100%)] p-5 shadow-[0_0_35px_rgba(14,165,233,.18),inset_0_1px_0_rgba(125,211,252,.10)]">
          <div className="pointer-events-none absolute right-[8%] top-0 h-full w-[34%] opacity-[.12] [background-image:radial-gradient(circle,#38bdf8_1px,transparent_1px)] [background-size:7px_7px] [mask-image:radial-gradient(ellipse_at_center,black_0%,transparent_72%)]" />

          <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[.18em] text-sky-200/55">
                FX TRADE / STRATEGIE
              </div>

              <h1 className="mt-1 text-[30px] font-semibold tracking-tight">
                Trading Strategies
              </h1>

              <p className="mt-1 max-w-[680px] text-[11px] leading-5 text-sky-100/50">
                Wybierz strategię dopasowaną do rynku i swojego stylu handlu.
                Każda strategia ma plan, warunki wejścia i checklistę.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {["FREE + PREMIUM", "Spójny proces", "Selekcja > ilość"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[#0d579e] bg-[#0a3a69] px-3 py-1.5 text-[8px] font-semibold text-sky-100/60"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {[
                [Gift, String(freeCount), "Free strategies", "Dostępne"],
                [Crown, String(premiumCount), "Premium strategies", paid ? "Odblokowane" : "Pełny dostęp"],
                [TrendingUp, "83%", "Średnia skuteczność", "7 strategii"],
                [BookOpenCheck, "48+", "Checklisty", "Gotowe listy"],
              ].map(([Icon, value, label, sub], index) => {
                const StatIcon = Icon as typeof Gift;

                return (
                  <div
                    key={index}
                    className="min-w-[145px] rounded-[11px] border border-[#0d579e] bg-[#0a3f73] px-4 py-3 shadow-[0_0_20px_rgba(14,165,233,.08)]"
                  >
                    <div className="flex items-center gap-3">
                      <StatIcon className="h-5 w-5 text-sky-300" />
                      <div>
                        <div className="text-[8px] uppercase tracking-[.08em] text-sky-100/40">
                          {String(label)}
                        </div>
                        <div className="mt-0.5 text-[18px] font-bold">{String(value)}</div>
                        <div className="text-[7px] text-sky-100/35">{String(sub)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* STRATEGIES + GUIDE */}
        <section className="grid gap-3 xl:grid-cols-[1fr_300px]">
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
            {STRATEGIES.map((strategy) => (
              <StrategyCard
                key={strategy.key}
                strategy={strategy}
                locked={strategy.badge === "PREMIUM" && !paid}
              />
            ))}
          </div>

          <aside className="space-y-3">
            <div className="rounded-[14px] border border-[#0d579e] bg-[linear-gradient(145deg,#0b477f,#07325d)] p-5 shadow-[0_0_28px_rgba(14,165,233,.13)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-emerald-400/25 bg-emerald-500/10 text-emerald-300">
                  <Target className="h-5 w-5" />
                </div>
                <h2 className="text-[14px] font-semibold">Jak wybrać strategię?</h2>
              </div>

              <div className="mt-5 space-y-3">
                {[
                  "Dopasuj interwał do swojego czasu.",
                  "Sprawdź najlepsze sesje.",
                  "Upewnij się, że RR jest akceptowalne.",
                  "Przetestuj strategię na koncie demo.",
                  "Stosuj checklistę za każdym razem.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 text-[9px] text-sky-100/65">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {!paid ? (
              <div className="rounded-[14px] border border-violet-500/25 bg-[linear-gradient(145deg,#163f73,#25245f)] p-5 shadow-[0_0_30px_rgba(139,92,246,.16)]">
                <Crown className="h-6 w-6 text-amber-300" />
                <h3 className="mt-3 text-[15px] font-semibold">Odblokuj Premium</h3>
                <p className="mt-2 text-[9px] leading-4 text-sky-100/45">
                  Uzyskaj dostęp do Day Trading i Swing Trading oraz pełnych checklist.
                </p>

                <Link
                  href="/paywall"
                  className="mt-4 block rounded-[9px] border border-violet-400/30 bg-[linear-gradient(90deg,#4c1d95,#6d28d9)] px-4 py-2.5 text-center text-[9px] font-bold text-white"
                >
                  Odblokuj PREMIUM
                </Link>
              </div>
            ) : (
              <div className="rounded-[14px] border border-emerald-500/25 bg-emerald-500/[0.06] p-5">
                <ShieldCheck className="h-6 w-6 text-emerald-300" />
                <h3 className="mt-3 text-[15px] font-semibold">Premium aktywne</h3>
                <p className="mt-2 text-[9px] leading-4 text-sky-100/45">
                  Wszystkie strategie premium są odblokowane.
                </p>
              </div>
            )}
          </aside>
        </section>

        {/* BOTTOM BENEFITS */}
        <section className="grid gap-3 rounded-[14px] border border-[#0d579e] bg-[linear-gradient(145deg,#0b477f,#07325d)] p-4 shadow-[0_0_28px_rgba(14,165,233,.13)] md:grid-cols-2 xl:grid-cols-5">
          {[
            [BookOpenCheck, "Gotowe checklisty", "Do każdej strategii"],
            [BarChart3, "Przykłady na wykresach", "Realne setupy"],
            [ShieldCheck, "Zarządzanie ryzykiem", "Ochrona kapitału"],
            [TrendingUp, "Statystyki skuteczności", "Backtest + wyniki"],
            [Clock3, "Aktualizacje strategii", "Na bieżąco"],
          ].map(([Icon, title, desc], index) => {
            const BenefitIcon = Icon as typeof BookOpenCheck;

            return (
              <div key={index} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-sky-400/20 bg-sky-500/10 text-sky-300">
                  <BenefitIcon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[9px] font-semibold">{String(title)}</div>
                  <div className="mt-1 text-[7px] text-sky-100/40">{String(desc)}</div>
                </div>
              </div>
            );
          })}
        </section>

        <style jsx global>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </main>
  );
}
