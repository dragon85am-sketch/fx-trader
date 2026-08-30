"use client";

import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Crown,
  Radar,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";

type ScannerCard = {
  title: string;
  description: string;
  href: string;
  badge: "POPULARNY" | "PREMIUM" | "NOWOŚĆ";
  image: string;
  accent: "blue" | "green" | "violet" | "cyan" | "gold";
  features: string[];
};

const scanners: ScannerCard[] = [
  {
    title: "FX Scanner",
    description: "Klasyczny skaner rynku Forex",
    href: "/skaner/fx",
    badge: "POPULARNY",
    image: "/fx-scanner.png",
    accent: "blue",
    features: [
      "Pary walutowe Forex",
      "Filtry techniczne (EMA, RSI, ADX)",
      "Poziomy wsparcia i oporu",
      "Sygnały wejścia i wyjścia",
    ],
  },
  {
    title: "Harmonic Scanner",
    description: "Wykrywanie formacji harmonicznych",
    href: "/skaner/harmonic",
    badge: "PREMIUM",
    image: "/harmonic-scanner.png",
    accent: "green",
    features: [
      "Formacje harmoniczne (Gartley, Bat)",
      "Automatyczne wykrywanie wzorców",
      "Poziomy Fibo i PRZ",
      "Wskaźnik skuteczności formacji",
    ],
  },
  {
    title: "PRO SESSION Scanner",
    description: "GOLD & US30 · New York Session",
    href: "/skaner/pro",
    badge: "PREMIUM",
    image: "/pro-session-scanner-card.png",
    accent: "violet",
    features: [
      "Automatyczne Asian / London / NY levels",
      "Liquidity Sweep + NY Opening Range",
      "M1 BOS / CHOCH confirmation",
      "Setup Score + Entry / SL / TP",
    ],
  },
  {
    title: "Alpha Scanner",
    description: "AI market scanner with confirmations",
    href: "/skaner/alpha",
    badge: "NOWOŚĆ",
    image: "/alpha-scanner.png",
    accent: "cyan",
    features: [
      "AI analiza rynków",
      "Potwierdzenia wieloczynnikowe",
      "Skanowanie sentymentu",
      "Inteligentne alerty i powiadomienia",
    ],
  },  {
    title: "GOLD Scalping Scanner",
    description: "XAUUSD · Momentum Scalping M1 / M5",
    href: "/skaner/gold",
    badge: "NOWOŚĆ",
    image: "/gold-scalping-scanner.png",
    accent: "gold",
    features: [
      "XAUUSD scalping M1 / M5",
      "Momentum Score ≥ 70",
      "Liquidity Sweep + BOS / CHOCH",
      "Setup Score + Entry / SL / TP",
    ],
  },
];

function accentClasses(accent: ScannerCard["accent"]) {
  if (accent === "green") {
    return {
      border: "border-emerald-500/35",
      text: "text-emerald-300",
      bg: "bg-emerald-500/10",
      button: "border-emerald-400/30 bg-[linear-gradient(90deg,#047857,#10b981)]",
    };
  }

  if (accent === "violet") {
    return {
      border: "border-violet-500/35",
      text: "text-violet-300",
      bg: "bg-violet-500/10",
      button: "border-violet-400/30 bg-[linear-gradient(90deg,#4c1d95,#7c3aed)]",
    };
  }

  if (accent === "gold") {
    return {
      border: "border-amber-400/35",
      text: "text-amber-300",
      bg: "bg-amber-400/10",
      button:
        "border-amber-300/30 bg-[linear-gradient(90deg,#b45309,#f59e0b)]",
    };
  }

  if (accent === "cyan") {
    return {
      border: "border-cyan-500/35",
      text: "text-cyan-300",
      bg: "bg-cyan-500/10",
      button: "border-cyan-400/30 bg-[linear-gradient(90deg,#0369a1,#06b6d4)]",
    };
  }

  return {
    border: "border-sky-500/35",
    text: "text-sky-300",
    bg: "bg-sky-500/10",
    button: "border-sky-400/30 bg-[linear-gradient(90deg,#075ECB,#0B8FE4)]",
  };
}

function Badge({ badge }: { badge: ScannerCard["badge"] }) {
  const cls =
    badge === "PREMIUM"
      ? "border-violet-400/25 bg-violet-500/10 text-violet-300"
      : badge === "NOWOŚĆ"
      ? "border-cyan-400/25 bg-cyan-500/10 text-cyan-300"
      : "border-sky-400/25 bg-sky-500/10 text-sky-300";

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[8px] font-bold tracking-[.08em] ${cls}`}>
      {badge}
    </span>
  );
}

export default function SkanerPage() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#020817] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "linear-gradient(rgba(2,8,23,.44), rgba(2,8,23,.68)), url('/scanners-glow-bg.png')",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(circle_at_50%_8%,rgba(34,211,238,.16),transparent_46%)]"
      />
      <div className="relative z-10 mx-auto w-full max-w-[1900px] space-y-4 px-4 py-5 md:px-6 xl:px-8">
        {/* HEADER */}
        <section className="relative overflow-hidden rounded-[16px] border border-cyan-300/45 bg-[linear-gradient(120deg,rgba(18,105,181,.96)_0%,rgba(13,82,151,.96)_52%,rgba(8,58,116,.97)_100%)] p-5 shadow-[0_0_28px_rgba(34,211,238,.18),inset_0_1px_0_rgba(255,255,255,.10)]">
          <div className="pointer-events-none absolute right-[8%] top-0 h-full w-[34%] opacity-[.12] [background-image:radial-gradient(circle,#38bdf8_1px,transparent_1px)] [background-size:7px_7px] [mask-image:radial-gradient(ellipse_at_center,black_0%,transparent_72%)]" />

          <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-[14px] border border-sky-400/30 bg-sky-500/10 text-sky-300 shadow-[0_0_22px_rgba(14,165,233,.13)]">
                <Radar className="h-7 w-7" />
              </div>

              <div>
                <div className="text-[9px] font-semibold uppercase tracking-[.18em] text-sky-200/55">
                  FX TRADE / SKANER RYNKU
                </div>
                <h1 className="mt-1 text-[30px] font-semibold tracking-tight">
                  Skaner rynku
                </h1>
                <p className="mt-1 text-[11px] text-sky-100/50">
                  Wybierz typ skanera tradingowego
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {[
                [ScanSearch, "5", "Skanery dostępne"],
                [TrendingUp, "10+", "Rynki obsługiwane"],
                [Zap, "24/7", "Skanowanie realtime"],
                [BrainCircuit, "AI", "Inteligentne analizy"],
              ].map(([Icon, value, label], index) => {
                const StatIcon = Icon as typeof ScanSearch;

                return (
                  <div
                    key={index}
                    className="min-w-[145px] rounded-[11px] border border-cyan-300/30 bg-[linear-gradient(145deg,rgba(17,91,166,.95),rgba(8,65,132,.96))] px-4 py-3 shadow-[0_0_18px_rgba(34,211,238,.10),inset_0_1px_0_rgba(255,255,255,.07)]"
                  >
                    <div className="flex items-center gap-3">
                      <StatIcon className="h-5 w-5 text-sky-300" />
                      <div>
                        <div className="text-[17px] font-bold">{String(value)}</div>
                        <div className="text-[8px] text-sky-100/40">{String(label)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SCANNERS */}
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {scanners.map((scanner) => {
            const a = accentClasses(scanner.accent);

            return (
              <article
                key={scanner.title}
                className={`group relative overflow-hidden rounded-[14px] border ${a.border} bg-[linear-gradient(145deg,rgba(15,91,168,.98)_0%,rgba(8,64,132,.98)_55%,rgba(5,48,104,.99)_100%)] p-4 shadow-[0_10px_28px_rgba(0,25,70,.20),0_0_20px_rgba(34,211,238,.10),inset_0_1px_0_rgba(255,255,255,.08)] transition duration-300 hover:-translate-y-[3px] hover:brightness-[1.08] hover:shadow-[0_14px_34px_rgba(0,25,70,.24),0_0_32px_rgba(34,211,238,.24),inset_0_1px_0_rgba(255,255,255,.12)]`}
              >
                <div className="flex items-center justify-between gap-3">
                  <Badge badge={scanner.badge} />

                  {scanner.badge === "PREMIUM" ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-violet-400/20 bg-violet-500/10 text-violet-300">
                      <Crown className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className={`flex h-8 w-8 items-center justify-center rounded-[8px] border ${a.border} ${a.bg} ${a.text}`}>
                      <Star className="h-4 w-4" />
                    </div>
                  )}
                </div>

                {/* IMAGE */}
                <div className={`mt-4 h-[220px] overflow-hidden rounded-[11px] border ${a.border} bg-[linear-gradient(145deg,#062d5d,#031c3c)] shadow-[0_0_18px_rgba(34,211,238,.10),inset_0_0_18px_rgba(2,15,34,.45)]`}>
                  <img
                    src={scanner.image}
                    alt={scanner.title}
                    className="h-full w-full object-contain object-center transition duration-300 group-hover:scale-[1.015]"
                  />
                </div>

                <div className="mt-4">
                  <h2 className="text-[18px] font-semibold">{scanner.title}</h2>
                  <p className={`mt-1 text-[10px] font-medium ${a.text}`}>
                    {scanner.description}
                  </p>
                </div>

                <div className="mt-4 space-y-2.5">
                  {scanner.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-start gap-2 text-[9px] leading-4 text-sky-100/65"
                    >
                      <CheckCircle2 className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${a.text}`} />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href={scanner.href}
                  className={`mt-5 flex w-full items-center justify-center gap-2 rounded-[9px] border px-4 py-2.5 text-[10px] font-bold text-white transition hover:brightness-110 ${a.button}`}
                >
                  Otwórz skaner
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </article>
            );
          })}
        </section>

        {/* INFO */}
        <section className="rounded-[14px] border border-cyan-300/35 bg-[linear-gradient(145deg,rgba(16,99,177,.97),rgba(7,61,126,.98))] p-4 shadow-[0_0_26px_rgba(34,211,238,.14),inset_0_1px_0_rgba(255,255,255,.08)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-sky-400/25 bg-sky-500/10 text-sky-300">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div>
                <h3 className="text-[14px] font-semibold">Inteligentne skanowanie rynku</h3>
                <p className="mt-1 max-w-[760px] text-[9px] leading-4 text-sky-100/45">
                  Nasze skanery wykorzystują zaawansowane algorytmy do analizy rynku w czasie rzeczywistym.
                  Wybierz skaner dopasowany do Twojej strategii i zacznij znajdować najlepsze okazje.
                </p>
              </div>
            </div>

            <button className="inline-flex items-center justify-center gap-2 rounded-[9px] border border-cyan-300/35 bg-[linear-gradient(90deg,#0b67c2,#089bd8)] px-4 py-2.5 text-[9px] font-semibold text-white shadow-[0_0_18px_rgba(34,211,238,.16)] transition hover:brightness-110 hover:shadow-[0_0_26px_rgba(34,211,238,.28)]">
              Jak używać skanerów?
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
