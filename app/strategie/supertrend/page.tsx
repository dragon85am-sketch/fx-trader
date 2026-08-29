"use client";

import Link from "next/link";
import React from "react";

const rules = [
  {
    n: 1,
    title: "Trend (kierunek)",
    text: "Określ kierunek trendu na H4 / H1. Dla BUY SuperTrend powinien być zielony i rosnący, dla SELL czerwony i spadkowy.",
    image: "/strategie/supertrend/rules/rule-1-trend.png",
  },
  {
    n: 2,
    title: "Strefa kluczowa",
    text: "Zaznacz wsparcie / opór, strefę podaży lub popytu, FVG albo zniesienie Fibo 38.2%–61.8%.",
    image: "/strategie/supertrend/rules/rule-2-zone.png",
  },
  {
    n: 3,
    title: "Wejście",
    text: "Wejście dopiero po zamknięciu świecy po właściwej stronie linii SuperTrend i po reakcji ze strefy.",
    image: "/strategie/supertrend/rules/rule-3-entry.png",
  },
  {
    n: 4,
    title: "Zarządzanie",
    text: "SL ustaw po drugiej stronie SuperTrend lub za swingiem. TP 1.2R–1.5R albo kolejna strefa.",
    image: "/strategie/supertrend/rules/rule-4-manage.png",
  },
  {
    n: 5,
    title: "Zarządzaj ryzykiem",
    text: "Ryzykuj maksymalnie 1–2% kapitału na transakcję. Nie zwiększaj ryzyka po stracie.",
    image: "/strategie/supertrend/rules/rule-5-risk.png",
  },
];

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-pink-400/15 bg-[#07182c]/90 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-pink-400/20 bg-pink-500/10 text-xl">
          {icon}
        </div>
        <div>
          <div className="text-[10px] text-slate-400">{label}</div>
          <div className="mt-1 text-sm font-black text-white">{value}</div>
        </div>
      </div>
    </div>
  );
}

function RuleCard({
  n,
  title,
  text,
  image,
}: {
  n: number;
  title: string;
  text: string;
  image: string;
}) {
  return (
    <div className="grid h-full grid-rows-[38px_170px_38px_1fr] overflow-hidden rounded-2xl border border-pink-400/10 bg-[#07182c] p-3">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-500 text-[11px] font-black">
          {n}
        </span>
      </div>

      <div className="relative mt-1 overflow-hidden rounded-xl border border-pink-400/15 bg-[#020b18] p-1">
        <img src={image} alt={title} className="h-full w-full object-contain object-center" />
      </div>

      <div className="flex items-center pt-2 text-[11px] font-black uppercase tracking-[.08em] text-pink-300">
        {title}
      </div>

      <p className="pt-2 text-[10px] leading-4 text-slate-400">{text}</p>
    </div>
  );
}

function SetupPanel({
  side,
  image,
  confirmationImage,
}: {
  side: "BUY" | "SELL";
  image: string;
  confirmationImage: string;
}) {
  const buy = side === "BUY";

  return (
    <div
      className={`rounded-2xl border p-4 ${
        buy
          ? "border-emerald-400/25 bg-emerald-500/[0.025]"
          : "border-rose-400/25 bg-rose-500/[0.025]"
      }`}
    >
      <h3 className={`text-lg font-black ${buy ? "text-emerald-400" : "text-rose-400"}`}>
        {side} SETUP
      </h3>
      <div
        className={`mt-1 text-[10px] font-bold ${
          buy ? "text-emerald-300/70" : "text-rose-300/70"
        }`}
      >
        {buy ? "TREND WZROSTOWY" : "TREND SPADKOWY"}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-[#020b18]">
        <img src={image} alt={`${side} SuperTrend setup`} className="h-auto w-full object-contain" />
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-[#020b18]">
        <img
          src={confirmationImage}
          alt={`Potwierdzenia ${side}`}
          className="h-[200px] w-full object-cover object-center"
        />
      </div>
    </div>
  );
}

export default function SuperTrendStrategyPage() {
  const checklist = [
    "Trend zgodny z H4 / H1",
    "Cena względem SuperTrend potwierdzona",
    "Strefa wsparcia / oporu potwierdzona",
    "Wejście zgodne z kierunkiem trendu",
    "RR minimum 1.2R",
    "SL za SuperTrend lub swingiem",
    "Zarządzanie pozycją aktywne",
    "Brak emocji — działam zgodnie z planem",
    "Dziennik transakcji uzupełniony",
  ];

  return (
    <main className="min-h-screen bg-[#020916] text-white">
      <div className="mx-auto w-full max-w-[1800px] space-y-4 px-3 py-5 lg:px-5">
        {/* HERO */}
        <section className="overflow-hidden rounded-[24px] border border-pink-400/20 bg-[#061425] shadow-[0_0_45px_rgba(236,72,153,.07)]">
          <div className="grid xl:grid-cols-[1.1fr_.9fr]">
            <div className="p-5 lg:p-7">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-pink-400/25 bg-pink-500/15 text-3xl">
                  ◔
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                      SUPERTREND STRATEGY
                    </h1>
                    <span className="rounded-full border border-pink-400/30 bg-pink-500/15 px-3 py-1 text-[10px] font-black text-pink-300">
                      PREMIUM
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-amber-400">
                    <span className="text-xl">★★★★★</span>
                    <span className="text-xs text-slate-300">4.7</span>
                  </div>
                </div>
              </div>

              <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-400">
                Podążaj za trendem z wykorzystaniem wskaźnika SuperTrend. Strategia łączy
                kierunek H4/H1, reakcję ze strefy i potwierdzenie świecy.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <Metric label="Skuteczność" value="86%" icon="📊" />
                <Metric label="Interwały" value="M15 · H1 · H4" icon="▦" />
                <Metric label="RR" value="1.2 – 1.5" icon="🎯" />
                <Metric label="Czas trwania" value="1 – 6 godzin" icon="◷" />
                <Metric label="Sesje" value="London / NY" icon="🌐" />
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="mr-2 text-[11px] text-slate-400">Najlepiej działa na:</span>
                {["EURUSD", "USDJPY", "US30", "XAUUSD"].map((x) => (
                  <span
                    key={x}
                    className="rounded-xl border border-cyan-400/15 bg-[#07182c] px-4 py-2 text-[10px] font-bold text-slate-200"
                  >
                    {x}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative min-h-[300px] overflow-hidden border-t border-pink-400/10 bg-[#030d1c] xl:border-l xl:border-t-0">
              <img
                src="/strategie/supertrend/supertrend-hero.png"
                alt="SuperTrend Strategy"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#061425]/20 to-transparent" />
            </div>
          </div>
        </section>

        {/* RULES */}
        <section className="rounded-[22px] border border-pink-400/15 bg-[#061425] p-4">
          <h2 className="mb-4 text-[16px] font-black uppercase tracking-[.08em] text-pink-300">
            Zasady działania
          </h2>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 min-[1700px]:grid-cols-5">
            {rules.map((rule) => (
              <RuleCard key={rule.n} {...rule} />
            ))}
          </div>
        </section>

        {/* SETUPS */}
        <section className="rounded-[22px] border border-pink-400/15 bg-[#061425] p-4">
          <h2 className="mb-4 text-[16px] font-black uppercase tracking-[.08em] text-pink-300">
            Setupy SuperTrend
          </h2>

          <div className="grid gap-4 xl:grid-cols-2">
            <SetupPanel
              side="BUY"
              image="/strategie/supertrend/supertrend-buy.png"
              confirmationImage="/strategie/supertrend/supertrend-buy-confirmation.png"
            />
            <SetupPanel
              side="SELL"
              image="/strategie/supertrend/supertrend-sell.png"
              confirmationImage="/strategie/supertrend/supertrend-sell-confirmation.png"
            />
          </div>
        </section>

        {/* BOTTOM */}
        <section className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-[22px] border border-pink-400/15 bg-[#061425] p-5">
            <h3 className="text-[14px] font-black uppercase text-pink-300">
              Mapa przygotowania
            </h3>
            <div className="mt-4 space-y-2">
              {[
                "Sprawdź trend na H4 / H1",
                "Zaznacz kluczowe strefy S/R",
                "Dodaj SuperTrend (10, 3)",
                "Określ potencjalne scenariusze",
                "Czekaj na potwierdzenie wejścia",
                "Zarządzaj pozycją zgodnie z planem",
              ].map((x) => (
                <div key={x} className="flex gap-2 text-[11px] text-slate-300">
                  <span className="text-pink-400">●</span>
                  {x}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[22px] border border-pink-400/15 bg-[#061425] p-5">
            <h3 className="text-[14px] font-black uppercase text-pink-300">
              Zarządzanie pozycją
            </h3>
            <div className="mt-4 space-y-3">
              {[
                ["BE", "Po osiągnięciu 1R przenieś SL na Break Even."],
                ["Trailing Stop", "Przesuwaj SL razem z linią SuperTrend."],
                ["Częściowa realizacja", "Zamknij 50% pozycji przy 1.2R–1.5R."],
                ["Zamknięcie ręczne", "Wyjdź po zmianie koloru SuperTrend lub silnym odwróceniu."],
              ].map(([t, d]) => (
                <div key={t} className="rounded-xl border border-pink-400/10 bg-[#07182c] p-3">
                  <div className="text-[10px] font-black uppercase text-pink-300">{t}</div>
                  <div className="mt-1 text-[10px] leading-4 text-slate-400">{d}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[22px] border border-pink-400/15 bg-[#061425] p-5">
            <h3 className="text-[14px] font-black uppercase text-pink-300">
              Najlepsze sesje
            </h3>
            <div className="mt-4 space-y-3">
              {[
                ["🇬🇧", "LONDON", "08:00 – 12:00", "NAJLEPSZA"],
                ["🇺🇸", "NOWY JORK", "14:00 – 18:00", "BARDZO DOBRA"],
                ["🇬🇧🇺🇸", "NAKŁADANIE SESJI", "13:00 – 16:00", "IDEALNA"],
              ].map(([flag, name, time, rate]) => (
                <div
                  key={name}
                  className="grid grid-cols-[48px_1fr_auto] items-center gap-3 rounded-xl border border-pink-400/10 bg-[#07182c] p-3"
                >
                  <div className="text-2xl">{flag}</div>
                  <div>
                    <div className="text-[10px] font-black text-cyan-300">{name}</div>
                    <div className="mt-1 text-[10px] text-slate-400">{time}</div>
                  </div>
                  <div className="text-[9px] font-black text-emerald-300">{rate}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CHECKLIST */}
        <section className="rounded-[22px] border border-pink-400/15 bg-[#061425] p-5">
          <h3 className="text-[14px] font-black uppercase text-pink-300">
            Checklista tradera
          </h3>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {checklist.map((x) => (
              <label key={x} className="flex items-center gap-2 text-[11px] text-slate-300">
                <input type="checkbox" className="h-4 w-4 accent-pink-500" />
                {x}
              </label>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <section className="rounded-[22px] border border-pink-400/20 bg-[linear-gradient(90deg,#071425,#16112e,#071425)] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-lg font-black uppercase tracking-[.08em] text-pink-300">
                PLAN + DYSCYPLINA + CIERPLIWOŚĆ = SUKCES
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                SuperTrend pokaże Ci trend — Ty podążaj za nim konsekwentnie.
              </div>
            </div>

            <Link
              href="/strategie"
              className="rounded-xl border border-pink-400/20 bg-pink-500/10 px-5 py-3 text-[11px] font-black text-pink-200 transition hover:bg-pink-500/20"
            >
              ← Wróć do strategii
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
