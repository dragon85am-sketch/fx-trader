"use client";

import Link from "next/link";
import React from "react";

const rules = [
  {
    n: 1,
    title: "Trend (kierunek)",
    text: "Określ kierunek trendu na wyższym interwale D1 lub H4. Cena powinna być zgodna z EMA 50/200.",
    type: "trend",
  },
  {
    n: 2,
    title: "Strefa kluczowa",
    text: "Zidentyfikuj wsparcie / opór, strefę supply & demand, FVG albo Order Block.",
    type: "zone",
  },
  {
    n: 3,
    title: "Wejście",
    text: "Wejście dopiero po zamknięciu cegły Renko w kierunku trendu po wybiciu lub reakcji ze strefy.",
    type: "entry",
  },
  {
    n: 4,
    title: "Zarządzanie",
    text: "SL ustaw za ostatnim swingiem lub strefą. TP 1.2R–1.6R albo kolejna strefa.",
    type: "manage",
  },
  {
    n: 5,
    title: "Zarządzaj ryzykiem",
    text: "Ryzykuj maksymalnie 1–2% kapitału na jedną transakcję. Dyscyplina to podstawa.",
    type: "risk",
  },
];

function RenkoMini({
  direction = "up",
  zone = false,
  entry = false,
  levels = false,
}: {
  direction?: "up" | "down";
  zone?: boolean;
  entry?: boolean;
  levels?: boolean;
}) {
  const up = direction === "up";
  const heights = up
    ? [34, 48, 42, 58, 72, 86, 98, 114]
    : [112, 98, 86, 72, 58, 46, 36, 28];

  return (
    <div className="relative h-[150px] overflow-hidden rounded-xl border border-white/10 bg-[#020b18]">
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(99,102,241,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,.07)_1px,transparent_1px)] [background-size:26px_26px]" />

      {zone ? (
        <div
          className={`absolute left-[18%] right-[16%] h-9 rounded border ${
            up
              ? "bottom-[42%] border-emerald-400/30 bg-emerald-400/10"
              : "top-[30%] border-rose-400/30 bg-rose-400/10"
          }`}
        />
      ) : null}

      <div className="absolute inset-x-4 bottom-4 flex items-end gap-2">
        {heights.map((h, i) => (
          <span
            key={i}
            className={`w-5 rounded-[2px] shadow-[0_0_10px_rgba(34,197,94,.12)] ${
              up
                ? i === 1 || i === 2
                  ? "bg-rose-500"
                  : "bg-emerald-400"
                : i === 5
                ? "bg-emerald-400"
                : "bg-rose-500"
            }`}
            style={{ height: h }}
          />
        ))}
      </div>

      {entry ? (
        <div
          className={`absolute ${
            up ? "right-5 top-10 text-emerald-300" : "right-5 bottom-10 text-rose-300"
          } text-[10px] font-black`}
        >
          {up ? "BUY ↗" : "SELL ↘"}
        </div>
      ) : null}

      {levels ? (
        <>
          <div
            className={`absolute right-3 top-5 border-t border-dashed px-2 pt-1 text-[9px] font-black ${
              up ? "border-emerald-400 text-emerald-300" : "border-rose-400 text-rose-300"
            }`}
          >
            {up ? "TP" : "SL"}
          </div>
          <div
            className={`absolute right-3 bottom-4 border-t border-dashed px-2 pt-1 text-[9px] font-black ${
              up ? "border-rose-400 text-rose-300" : "border-emerald-400 text-emerald-300"
            }`}
          >
            {up ? "SL" : "TP"}
          </div>
        </>
      ) : null}
    </div>
  );
}

function RuleVisual({ type }: { type: string }) {
  const images: Record<string, string> = {
    trend: "/strategie/renko/rules/rule-1-trend.png",
    zone: "/strategie/renko/rules/rule-2-zone.png",
    entry: "/strategie/renko/rules/rule-3-entry.png",
    manage: "/strategie/renko/rules/rule-4-manage.png",
    risk: "/strategie/renko/rules/rule-5-risk.png",
  };

  return (
    <div className="relative h-[170px] overflow-hidden rounded-xl border border-violet-400/15 bg-[#020b18] p-1">
      <img
        src={images[type]}
        alt=""
        className="block h-full w-full rounded-lg object-cover object-center"
      />
    </div>
  );
}

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
    <div className="rounded-2xl border border-violet-400/15 bg-[#07182c]/90 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-xl">
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

function SetupBox({ side }: { side: "BUY" | "SELL" }) {
  const buy = side === "BUY";
  const setupImage = buy
    ? "/strategie/renko/renko-buy.png"
    : "/strategie/renko/renko-sell.png";
  const confirmationImage = buy
    ? "/strategie/renko/renko-buy-confirmation.png"
    : "/strategie/renko/renko-sell-confirmation.png";

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
      <div className={`mt-1 text-[10px] font-bold ${buy ? "text-emerald-300/70" : "text-rose-300/70"}`}>
        {buy ? "TREND WZROSTOWY" : "TREND SPADKOWY"}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-[#020b18]">
        <img
          src={setupImage}
          alt={`${side} Renko setup`}
          className="block h-auto w-full object-contain"
        />
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-[#020b18]">
        <img
          src={confirmationImage}
          alt={`Potwierdzenia ${side}`}
          className="block h-[190px] w-full object-cover object-center"
        />
      </div>
    </div>
  );
}

export default function RenkoStrategyPage() {
  const buyConfirmations = [
    "Trend wzrostowy D1 / H4 (cena powyżej EMA 50/200)",
    "Cegła Renko zamyka się powyżej strefy",
    "Momentum: ADX > 20 lub rosnący wolumen",
    "Brak dywergencji na RSI",
    "Kierunek zgodny z aktywną sesją",
  ];

  const sellConfirmations = [
    "Trend spadkowy D1 / H4 (cena poniżej EMA 50/200)",
    "Cegła Renko zamyka się poniżej strefy",
    "Momentum: ADX > 20 lub rosnący wolumen",
    "Brak dywergencji na RSI",
    "Kierunek zgodny z aktywną sesją",
  ];

  return (
    <main className="min-h-screen bg-[#020916] text-white">
      <div className="mx-auto w-full max-w-[1800px] space-y-4 px-3 py-5 lg:px-5">
        {/* HERO */}
        <section className="overflow-hidden rounded-[24px] border border-violet-400/20 bg-[#061425] shadow-[0_0_45px_rgba(139,92,246,.07)]">
          <div className="grid xl:grid-cols-[1.15fr_.85fr]">
            <div className="p-5 lg:p-7">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-400/25 bg-violet-500/15 text-3xl">
                  ◈
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                      RENKO STRATEGY
                    </h1>
                    <span className="rounded-full border border-violet-400/30 bg-violet-500/15 px-3 py-1 text-[10px] font-black text-violet-300">
                      PREMIUM
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-amber-400">
                    <span className="text-xl">★★★★★</span>
                    <span className="text-xs text-slate-300">4.8</span>
                  </div>
                </div>
              </div>

              <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-400">
                Czysty wykres Renko filtrujący szum i pokazujący trend.
                Prosta struktura, jasne strefy i wejścia zgodne z kierunkiem rynku.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <Metric label="Skuteczność" value="83%" icon="📊" />
                <Metric label="Interwały" value="Renko 10 · 20 · 30" icon="▦" />
                <Metric label="RR" value="1.2 – 1.6" icon="🎯" />
                <Metric label="Czas trwania" value="30 min – kilka dni" icon="◷" />
                <Metric label="Sesje" value="London / NY" icon="🌐" />
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="mr-2 text-[11px] text-slate-400">Najlepiej działa na:</span>
                {["EURUSD", "XAUUSD", "US30", "NAS100"].map((x) => (
                  <span
                    key={x}
                    className="rounded-xl border border-cyan-400/15 bg-[#07182c] px-4 py-2 text-[10px] font-bold text-slate-200"
                  >
                    {x}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative min-h-[300px] overflow-hidden border-t border-violet-400/10 bg-[#030d1c] xl:border-l xl:border-t-0">
              <img
                src="/strategie/renko/renko-hero.png"
                alt="Renko Strategy"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#061425]/25 to-transparent" />
            </div>
          </div>
        </section>

        {/* RULES */}
        <section className="rounded-[22px] border border-violet-400/15 bg-[#061425] p-4">
          <h2 className="mb-4 text-[16px] font-black uppercase tracking-[.08em] text-violet-300">
            Zasady działania
          </h2>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 min-[1700px]:grid-cols-5">
            {rules.map((rule) => (
              <div
                key={rule.n}
                className="overflow-hidden rounded-2xl border border-violet-400/10 bg-[#07182c] p-3"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500 text-[11px] font-black">
                    {rule.n}
                  </span>
                  <span className="text-[11px] font-black uppercase text-white">{rule.title}</span>
                </div>

                <RuleVisual type={rule.type} />

                <p className="mt-3 text-[10px] leading-5 text-slate-400">{rule.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SETUPS */}
        <section className="rounded-[22px] border border-violet-400/15 bg-[#061425] p-4">
          <h2 className="mb-4 text-[16px] font-black uppercase tracking-[.08em] text-violet-300">
            Setupy Renko
          </h2>

          <div className="grid gap-4 xl:grid-cols-2">
            <SetupBox side="BUY" />
            <SetupBox side="SELL" />
          </div>
        </section>

        {/* CONFIRMATIONS */}
        <section className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-[22px] border border-emerald-400/25 bg-[#061425] p-5">
            <h3 className="text-lg font-black text-emerald-400">POTWIERDZENIA BUY</h3>
            <div className="mt-4 space-y-2">
              {buyConfirmations.map((x) => (
                <div key={x} className="flex gap-2 text-[11px] text-slate-300">
                  <span className="text-emerald-400">●</span>
                  {x}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[22px] border border-rose-400/25 bg-[#061425] p-5">
            <h3 className="text-lg font-black text-rose-400">POTWIERDZENIA SELL</h3>
            <div className="mt-4 space-y-2">
              {sellConfirmations.map((x) => (
                <div key={x} className="flex gap-2 text-[11px] text-slate-300">
                  <span className="text-rose-400">●</span>
                  {x}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BOTTOM */}
        <section className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-[22px] border border-violet-400/15 bg-[#061425] p-5">
            <h3 className="text-[14px] font-black uppercase text-violet-300">
              Mapa przygotowania
            </h3>
            <div className="mt-4 space-y-2">
              {[
                "Sprawdź kierunek na D1 / H4",
                "Zaznacz kluczowe strefy S/R",
                "Otwórz wykres Renko 10 / 20 / 30",
                "Poczekaj na test strefy",
                "Szukaj wejścia zgodnego z trendem",
                "Zarządzaj pozycją zgodnie z planem",
              ].map((x) => (
                <div key={x} className="flex gap-2 text-[11px] text-slate-300">
                  <span className="text-violet-400">●</span>
                  {x}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[22px] border border-violet-400/15 bg-[#061425] p-5">
            <h3 className="text-[14px] font-black uppercase text-violet-300">
              Zarządzanie pozycją
            </h3>
            <div className="mt-4 space-y-3">
              {[
                ["BE", "Po osiągnięciu 1R przenieś SL na Break Even."],
                ["Trailing Stop", "Przesuwaj SL za każdy nowy swing Renko."],
                ["Częściowa realizacja", "Zamknij 50% przy 1.2R–1.6R."],
                ["Zamknij ręcznie", "Wyjdź przy silnym sygnale przeciwnym."],
              ].map(([t, d]) => (
                <div key={t} className="rounded-xl border border-violet-400/10 bg-[#07182c] p-3">
                  <div className="text-[10px] font-black uppercase text-violet-300">{t}</div>
                  <div className="mt-1 text-[10px] leading-4 text-slate-400">{d}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[22px] border border-violet-400/15 bg-[#061425] p-5">
            <h3 className="text-[14px] font-black uppercase text-violet-300">
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
                  className="grid grid-cols-[48px_1fr_auto] items-center gap-3 rounded-xl border border-violet-400/10 bg-[#07182c] p-3"
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
        <section className="rounded-[22px] border border-violet-400/15 bg-[#061425] p-5">
          <h3 className="text-[14px] font-black uppercase text-violet-300">
            Checklista tradera
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[
              "Trend zgodny z D1 / H4",
              "Strefa wsparcia / oporu potwierdzona",
              "Wejście zgodne z kierunkiem trendu",
              "Zamknięcie cegły Renko poza strefą",
              "RR minimum 1.2R",
              "SL w logicznym miejscu",
              "Zarządzanie pozycją aktywne",
              "Brak emocji — zgodnie z planem",
              "Dziennik transakcji prowadzony",
            ].map((x) => (
              <label key={x} className="flex items-center gap-2 text-[11px] text-slate-300">
                <input type="checkbox" className="h-4 w-4 accent-violet-500" />
                {x}
              </label>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <section className="rounded-[22px] border border-violet-400/20 bg-[linear-gradient(90deg,#071425,#0d1630,#071425)] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-lg font-black uppercase tracking-[.08em] text-violet-300">
                PLAN + DYSCYPLINA + CIERPLIWOŚĆ = SUKCES
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                Handluj prostotą. Renko pokazuje trend, ale to plan kontroluje ryzyko.
              </div>
            </div>

            <Link
              href="/strategie"
              className="rounded-xl border border-violet-400/20 bg-violet-500/10 px-5 py-3 text-[11px] font-black text-violet-200 transition hover:bg-violet-500/20"
            >
              ← Wróć do strategii
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
