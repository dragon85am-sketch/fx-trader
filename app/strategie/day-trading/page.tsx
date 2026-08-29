"use client";

import React from "react";
import Link from "next/link";
import { Button, Card, CardContent, Pill, cn } from "@/components/ui";

type SetupCardProps = {
  side: "BUY" | "SELL";
  title: string;
  bias: string;
  confirmations: string[];
};

function Metric({
  icon,
  label,
  value,
  sub,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-cyan-400/15 bg-[#071728]/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.04)]">
      <div className="flex items-start gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-xl text-cyan-300">
          {icon}
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[.18em] text-cyan-300/70">
            {label}
          </div>
          <div className="mt-1 text-[17px] font-black text-white">{value}</div>
          {sub ? <div className="mt-1 text-[10px] text-sky-100/40">{sub}</div> : null}
        </div>
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  children,
  icon,
  image,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
  icon: string;
  image?: string;
}) {
  return (
    <div className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-cyan-400/10 bg-[#071728] p-3">
      <div className="flex h-10 items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-400/5 text-[13px] font-black text-cyan-300">
          {n}
        </span>
        <span className="text-xl">{icon}</span>
      </div>

      {image ? (
        <div className="relative mt-1 h-[172px] w-full overflow-hidden rounded-xl border border-cyan-400/20 bg-[#030b14] p-1.5">
          <img
            src={image}
            alt={title}
            className="block h-full w-full object-contain object-center"
          />
        </div>
      ) : null}

      <div className="flex items-center pt-2 text-[12px] font-black uppercase leading-4 tracking-[.08em] text-cyan-300">
        {title}
      </div>
      <p className="pt-2 text-[11px] leading-5 text-sky-100/60">{children}</p>
    </div>
  );
}

function TrendChart({ side }: { side: "BUY" | "SELL" }) {
  const buy = side === "BUY";

  return (
    <div className="relative h-[180px] overflow-hidden rounded-xl border border-white/10 bg-[#030b14]">
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(56,189,248,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,.08)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div
        className={cn(
          "absolute left-[10%] right-[8%] h-[2px] rotate-[-10deg]",
          buy ? "top-[70%] bg-emerald-400/70" : "top-[26%] bg-rose-400/70 rotate-[10deg]"
        )}
      />

      <div className="absolute inset-x-5 bottom-4 flex items-end justify-between gap-[4px]">
        {(buy
          ? [34, 52, 44, 60, 72, 64, 82, 91, 78, 102, 116, 108, 132, 146, 158]
          : [150, 138, 126, 135, 110, 102, 116, 92, 80, 88, 68, 56, 63, 44, 35]
        ).map((h, i) => (
          <span
            key={i}
            className={cn(
              "w-[6px] rounded-sm",
              i % 3 === 0
                ? buy
                  ? "bg-rose-500"
                  : "bg-emerald-400"
                : buy
                ? "bg-emerald-400"
                : "bg-rose-500"
            )}
            style={{ height: `${Math.max(18, Math.min(h, 145))}px` }}
          />
        ))}
      </div>

      <div className="absolute bottom-3 left-4 text-[9px] font-bold text-cyan-200/70">
        EMA 50
      </div>
      <div className="absolute bottom-3 left-20 text-[9px] font-bold text-amber-200/70">
        EMA 200
      </div>

      <div
        className={cn(
          "absolute rounded-md px-2 py-1 text-[9px] font-black",
          buy
            ? "right-4 top-4 bg-emerald-500/15 text-emerald-300"
            : "right-4 bottom-4 bg-rose-500/15 text-rose-300"
        )}
      >
        {buy ? "HH / HL" : "LH / LL"}
      </div>
    </div>
  );
}

function ZoneChart({ side }: { side: "BUY" | "SELL" }) {
  const buy = side === "BUY";
  return (
    <div className="relative h-[180px] overflow-hidden rounded-xl border border-white/10 bg-[#030b14]">
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(56,189,248,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,.08)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div
        className={cn(
          "absolute left-4 right-4 h-14 rounded-md border",
          buy
            ? "bottom-7 border-emerald-400/40 bg-emerald-500/15"
            : "top-7 border-rose-400/40 bg-rose-500/15"
        )}
      >
        <span
          className={cn(
            "absolute left-1/2 -translate-x-1/2 text-[9px] font-black uppercase",
            buy ? "bottom-2 text-emerald-300" : "top-2 text-rose-300"
          )}
        >
          {buy ? "STREFA POPYTU" : "STREFA PODAŻY"}
        </span>
      </div>

      <div className="absolute inset-x-5 bottom-4 flex items-end justify-between gap-[4px]">
        {(buy
          ? [110, 95, 82, 76, 68, 58, 50, 44, 39, 35, 48, 63, 77]
          : [45, 54, 62, 72, 84, 93, 102, 112, 121, 130, 118, 105, 90]
        ).map((h, i) => (
          <span
            key={i}
            className={cn(
              "w-[7px] rounded-sm",
              i % 4 === 0 ? "bg-rose-500" : "bg-emerald-400"
            )}
            style={{ height: `${h}px` }}
          />
        ))}
      </div>
    </div>
  );
}

function EntryChart({ side }: { side: "BUY" | "SELL" }) {
  const buy = side === "BUY";

  return (
    <div className="relative h-[180px] overflow-hidden rounded-xl border border-white/10 bg-[#030b14]">
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(56,189,248,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,.08)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div
        className={cn(
          "absolute left-4 right-4 h-12 rounded-md",
          buy ? "bottom-12 bg-emerald-500/10" : "top-12 bg-rose-500/10"
        )}
      />

      <div className="absolute inset-x-5 bottom-4 flex items-end justify-between gap-[4px]">
        {(buy
          ? [52, 45, 57, 49, 66, 72, 64, 78, 92, 126, 145]
          : [130, 116, 122, 110, 98, 104, 90, 72, 60, 48, 42]
        ).map((h, i) => (
          <span
            key={i}
            className={cn(
              "w-[8px] rounded-sm",
              i % 3 === 0 ? "bg-rose-500" : "bg-emerald-400"
            )}
            style={{ height: `${h}px` }}
          />
        ))}
      </div>

      <div
        className={cn(
          "absolute left-[62%] text-[10px] font-black",
          buy ? "top-8 text-emerald-300" : "bottom-8 text-rose-300"
        )}
      >
        WEJŚCIE ↘
      </div>

      <div
        className={cn(
          "absolute right-3 border-t border-dashed px-2 pt-1 text-[9px] font-black",
          buy
            ? "top-4 border-emerald-400 text-emerald-300"
            : "top-4 border-rose-400 text-rose-300"
        )}
      >
        {buy ? "TP 2R+" : "SL"}
      </div>

      <div
        className={cn(
          "absolute right-3 border-t border-dashed px-2 pt-1 text-[9px] font-black",
          buy
            ? "bottom-3 border-rose-400 text-rose-300"
            : "bottom-3 border-emerald-400 text-emerald-300"
        )}
      >
        {buy ? "SL" : "TP 2R+"}
      </div>
    </div>
  );
}

function SetupCard({ side, title, bias, confirmations }: SetupCardProps) {
  const buy = side === "BUY";

  return (
    <div
      className={cn(
        "rounded-2xl border p-3",
        buy
          ? "border-emerald-400/30 bg-emerald-500/[0.025]"
          : "border-rose-400/30 bg-rose-500/[0.025]"
      )}
    >
      <div className="mb-3">
        <div
          className={cn(
            "text-[17px] font-black",
            buy ? "text-emerald-400" : "text-rose-400"
          )}
        >
          {title}
        </div>
        <div
          className={cn(
            "mt-1 text-[10px] font-bold",
            buy ? "text-emerald-300/70" : "text-rose-300/70"
          )}
        >
          {bias}
        </div>
      </div>

      <div className="mb-3 overflow-hidden rounded-xl border border-white/10 bg-[#030b14]">
        <img
          src={
            buy
              ? "/strategie/day-trading/day-trading-buy.png"
              : "/strategie/day-trading/day-trading-sell.png"
          }
          alt={buy ? "Day Trading BUY setup" : "Day Trading SELL setup"}
          className="h-auto w-full object-contain"
        />
      </div>

      <div className="mb-3 overflow-hidden rounded-xl border border-white/10 bg-[#030b14]">
        <img
          src={
            buy
              ? "/strategie/day-trading/day-trading-buy-confirmation.png"
              : "/strategie/day-trading/day-trading-sell-confirmation.png"
          }
          alt={buy ? "Potwierdzenia BUY" : "Potwierdzenia SELL"}
          className="h-[180px] w-full object-cover object-center md:h-[200px]"
        />
      </div>

      <div
        className={cn(
          "mt-3 rounded-xl border p-4",
          buy
            ? "border-emerald-400/25 bg-emerald-500/[0.035]"
            : "border-rose-400/25 bg-rose-500/[0.035]"
        )}
      >
        <div
          className={cn(
            "mb-3 text-[12px] font-black uppercase tracking-[.08em]",
            buy ? "text-emerald-400" : "text-rose-400"
          )}
        >
          Potwierdzenia {side}
        </div>
        <div className="grid gap-2">
          {confirmations.map((item) => (
            <div key={item} className="flex gap-2 text-[10px] text-sky-100/65">
              <span className={buy ? "text-emerald-400" : "text-rose-400"}>✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DayTradingPage() {
  const paid = true;

  const checklist = [
    "Określiłem trend na H1",
    "Zaznaczyłem strefę popytu / podaży",
    "Czekam na setup na M15",
    "Świeca sygnałowa potwierdzona",
    "SL ustawiony za swingiem",
    "RR minimum 1.5R",
    "Ryzyko maks. 1–1.5%",
    "Zarządzam pozycją zgodnie z planem",
    "Zamykam pozycję przed końcem sesji",
  ];

  return (
    <main className="min-h-screen bg-[#020914] text-white">
      <div className="mx-auto w-full max-w-[1900px] space-y-4 px-2 py-5 sm:px-3 lg:px-3 2xl:px-4">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-[24px] border border-cyan-400/20 bg-[#04111f] p-5 shadow-[0_0_50px_rgba(14,165,233,.08)] lg:p-7">
          <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_72%_20%,rgba(14,165,233,.24),transparent_28%),radial-gradient(circle_at_88%_55%,rgba(245,158,11,.10),transparent_26%)]" />

          <div className="relative grid gap-6 xl:grid-cols-[1.05fr_.95fr] xl:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2">
                <span className="text-xl">♛</span>
                <span className="text-[10px] font-black uppercase tracking-[.20em] text-amber-300">
                  FX TRADE PREMIUM
                </span>
              </div>

              <h1 className="text-4xl font-black tracking-tight md:text-6xl">
                STRATEGIA{" "}
                <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
                  DAY TRADING
                </span>
              </h1>

              <div className="mt-2 text-sm font-black uppercase tracking-[.16em] text-cyan-300 md:text-base">
                Trend • Struktura • Strefy • Timing
              </div>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-sky-100/60">
                Profesjonalna strategia dzienna oparta na trendzie, strukturze rynku i
                precyzyjnym wejściu. Proste zasady. Jasny plan. Konsekwentne wyniki.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <Pill className="border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
                  H1 → M15
                </Pill>
                <Pill className="border-emerald-400/20 bg-emerald-400/10 text-emerald-200">
                  RR 2R+
                </Pill>
                <Pill className="border-amber-400/20 bg-amber-400/10 text-amber-200">
                  London / New York
                </Pill>
              </div>
            </div>

            <div className="relative min-h-[260px] overflow-hidden rounded-2xl border border-cyan-400/15 bg-[#051424]">
              <img
                src="/strategie/day-trading/day-trading-hero.png"
                alt="Strategia Day Trading"
                className="h-full min-h-[260px] w-full object-cover object-center"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#04111f]/30" />
            </div>
          </div>
        </section>

        {/* CHARACTERISTICS */}
        <section className="rounded-[20px] border border-cyan-400/15 bg-[#04111f] p-4">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xl text-amber-300">◎</span>
            <h2 className="text-[15px] font-black uppercase tracking-[.08em] text-cyan-300">
              Charakterystyka strategii
            </h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Metric icon="📈" label="Timeframe" value="M15 / H1" sub="Analiza H1 • Wejście M15" />
            <Metric icon="◷" label="Sesje" value="London / New York" sub="08:00–12:00 • 14:00–18:00" />
            <Metric icon="↗" label="Średni RR" value="2.0R+" sub="Minimum 1.5R" />
            <Metric icon="⌛" label="Średni czas" value="1–4 godziny" sub="Pozycje zamykane tego samego dnia" />
          </div>
        </section>

        {/* RULES */}
        <section className="rounded-[20px] border border-cyan-400/15 bg-[#04111f] p-5">
          <div className="mb-5 flex items-center gap-2">
            <span className="text-xl">⚙</span>
            <h2 className="text-[15px] font-black uppercase tracking-[.08em] text-cyan-300">
              Zasady działania
            </h2>
          </div>

          <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3 min-[1700px]:grid-cols-5">
            <Step n={1} icon="📊" title="Analiza trendu H1" image="/strategie/day-trading/rules/rule-1-trend.png">
              Określ kierunek rynku. Szukaj HH/HL dla BUY lub LH/LL dla SELL.
              Pomocniczo użyj EMA 50/200.
            </Step>
            <Step n={2} icon="▣" title="Znajdź strefę" image="/strategie/day-trading/rules/rule-2-zone.png">
              Zidentyfikuj wsparcie, opór, FVG, Order Block lub kluczowy poziom
              płynności.
            </Step>
            <Step n={3} icon="🎯" title="Wejście M15" image="/strategie/day-trading/rules/rule-3-entry.png">
              Szukaj pin bara, engulfingu, breakout + retestu albo silnej reakcji ze
              strefy.
            </Step>
            <Step n={4} icon="〽" title="Zarządzaj pozycją" image="/strategie/day-trading/rules/rule-4-manage.png">
              SL za swingiem. TP 1.5R–3R. Po 1R możesz przesunąć SL na BE lub realizować
              część zysku.
            </Step>
            <Step n={5} icon="🛡" title="Zamknięcie" image="/strategie/day-trading/rules/rule-5-risk.png">
              Nie trzymaj pozycji na noc. Zamknij przed końcem sesji lub po osiągnięciu
              celu.
            </Step>
          </div>
        </section>

        {/* MAPA DNIA */}
        <section className="rounded-[20px] border border-cyan-400/15 bg-[#04111f] p-4">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xl text-cyan-300">⌖</span>
            <h2 className="text-[15px] font-black uppercase tracking-[.08em] text-cyan-300">
              Mapa dnia przed wejściem
            </h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["1", "Bias H1", "Najpierw ustal kierunek: BUY, SELL albo brak trade."],
              ["2", "Kluczowe strefy", "Zaznacz wsparcie, opór, FVG, Order Block i płynność."],
              ["3", "Scenariusz A / B", "Zapisz co musi się wydarzyć, aby wejście było ważne."],
              ["4", "Timing M15", "Czekaj na reakcję świecową, breakout + retest lub engulfing."],
            ].map(([n, title, desc]) => (
              <div key={title} className="rounded-xl border border-cyan-400/10 bg-[#071728] p-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-cyan-400/30 text-[10px] font-black text-cyan-300">
                    {n}
                  </span>
                  <div className="text-[11px] font-black uppercase tracking-[.08em] text-white">
                    {title}
                  </div>
                </div>
                <p className="mt-2 text-[10px] leading-5 text-sky-100/50">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SETUPS */}
        <section className="rounded-[20px] border border-cyan-400/15 bg-[#04111f] p-4">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xl text-cyan-300">☆</span>
            <h2 className="text-[15px] font-black uppercase tracking-[.08em] text-cyan-300">
              Przykłady setupów
            </h2>
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            <SetupCard
              side="BUY"
              title="BUY SETUP"
              bias="TREND WZROSTOWY"
              confirmations={[
                "Trend wzrostowy H1 (HH/HL)",
                "Cena w strefie popytu / wsparcia / FVG / Order Block",
                "Silna reakcja świecowa na M15",
                "Pin Bar / Engulfing / Breakout + Retest",
                "SL za swing low",
                "RR minimum 1.5R — cel 2R+",
              ]}
            />

            <SetupCard
              side="SELL"
              title="SELL SETUP"
              bias="TREND SPADKOWY"
              confirmations={[
                "Trend spadkowy H1 (LH/LL)",
                "Cena w strefie podaży / oporu / FVG / Order Block",
                "Silna reakcja świecowa na M15",
                "Pin Bar / Engulfing / Breakout + Retest",
                "SL za swing high",
                "RR minimum 1.5R — cel 2R+",
              ]}
            />
          </div>
        </section>

        {/* BOTTOM */}
        <section className="grid gap-4 xl:grid-cols-3">
          <Card className="border-cyan-400/15 bg-[#04111f]">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <span className="text-xl">☑</span>
                <h3 className="text-[14px] font-black uppercase text-cyan-300">
                  Checklista tradera
                </h3>
              </div>

              <div className="space-y-2">
                {checklist.map((item) => (
                  <label key={item} className="flex cursor-pointer items-start gap-2 text-[11px] text-sky-100/65">
                    <input
                      type="checkbox"
                      className="mt-[2px] h-4 w-4 rounded border-cyan-400/30 accent-sky-500"
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-cyan-400/15 bg-[#04111f]">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <span className="text-xl">🛡</span>
                <h3 className="text-[14px] font-black uppercase text-cyan-300">
                  Zarządzanie ryzykiem
                </h3>
              </div>

              <div className="space-y-3">
                {[
                  ["%", "Ryzyko na trade", "Maks. 1%–1.5% kapitału"],
                  ["⚖", "RR minimalne", "1.5R — celuj w 2R+"],
                  ["◔", "Częściowa realizacja", "TP1: 1R • TP2: 2R+"],
                  ["↗", "Przesuwanie SL", "Po 1R ustaw SL na BE"],
                ].map(([icon, title, text]) => (
                  <div
                    key={title}
                    className="flex items-center gap-3 rounded-xl border border-cyan-400/10 bg-[#071728] p-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-xl text-cyan-300">
                      {icon}
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[.08em] text-cyan-300">
                        {title}
                      </div>
                      <div className="mt-1 text-[11px] text-sky-100/60">{text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-cyan-400/15 bg-[#04111f]">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <span className="text-xl">🌐</span>
                <h3 className="text-[14px] font-black uppercase text-cyan-300">
                  Najlepsze sesje
                </h3>
              </div>

              <div className="space-y-3">
                {[
                  ["🇬🇧", "LONDYN", "08:00 – 12:00", "NAJLEPSZA"],
                  ["🇺🇸", "NOWY JORK", "14:00 – 18:00", "BARDZO DOBRA"],
                  ["🇬🇧🇺🇸", "NAKŁADANIE SESJI", "13:00 – 16:00", "IDEALNA"],
                ].map(([flag, name, time, rating]) => (
                  <div
                    key={name}
                    className="grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-xl border border-cyan-400/10 bg-[#071728] p-3"
                  >
                    <div className="text-2xl">{flag}</div>
                    <div>
                      <div className="text-[10px] font-black text-cyan-300">{name}</div>
                      <div className="mt-1 text-[11px] text-sky-100/60">{time}</div>
                    </div>
                    <div className="text-right">
                      <div className="mb-1 text-lg text-emerald-400">▮▮▮</div>
                      <div className="text-[8px] font-black text-cyan-300">{rating}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* REMEMBER */}
        <section className="rounded-[20px] border border-amber-400/20 bg-[linear-gradient(90deg,#0b1420,#111728,#0b1420)] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="text-3xl text-amber-300">💡</div>
              <div>
                <div className="text-[15px] font-black uppercase tracking-[.08em] text-amber-300">
                  Pamiętaj
                </div>
                <div className="mt-1 text-sm font-semibold text-white">
                  PLAN + DYSCYPLINA + CIERPLIWOŚĆ = SUKCES
                </div>
                <div className="mt-1 text-[11px] text-sky-100/50">
                  Nie szukaj transakcji na siłę — czekaj na idealny setup zgodny z planem.
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Link href="/strategie">
                <Button variant="outline">← Strategie</Button>
              </Link>

              {!paid ? (
                <Link href="/paywall">
                  <Button>Odblokuj PREMIUM</Button>
                </Link>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
