"use client";

import React from "react";
import Link from "next/link";
import { Button, Card, CardContent, Pill, cn } from "@/components/ui";

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
    <div className="rounded-2xl border border-cyan-400/15 bg-[#071728]/85 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-xl">
          {icon}
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[.16em] text-cyan-300/70">
            {label}
          </div>
          <div className="mt-1 text-[17px] font-black text-white">{value}</div>
          {sub ? <div className="mt-1 text-[10px] text-sky-100/40">{sub}</div> : null}
        </div>
      </div>
    </div>
  );
}

function RuleCard({
  n,
  title,
  image,
  children,
}: {
  n: number;
  title: string;
  image: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid h-full grid-rows-[36px_170px_38px_1fr] overflow-hidden rounded-2xl border border-cyan-400/15 bg-[#071728] p-3">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-400/5 text-[12px] font-black text-cyan-300">
          {n}
        </span>
      </div>

      <div className="relative mt-1 overflow-hidden rounded-xl border border-cyan-400/20 bg-[#030b14] p-1">
        <img src={image} alt={title} className="h-full w-full object-contain object-center" />
      </div>

      <div className="flex items-center pt-2 text-[11px] font-black uppercase tracking-[.08em] text-cyan-300">
        {title}
      </div>

      <p className="pt-2 text-[10px] leading-4 text-sky-100/55">{children}</p>
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
      className={cn(
        "rounded-2xl border p-3",
        buy
          ? "border-emerald-400/30 bg-emerald-500/[0.025]"
          : "border-rose-400/30 bg-rose-500/[0.025]"
      )}
    >
      <div className={cn("text-[18px] font-black", buy ? "text-emerald-400" : "text-rose-400")}>
        {buy ? "BUY SETUP" : "SELL SETUP"}
      </div>
      <div className={cn("mt-1 text-[10px] font-bold", buy ? "text-emerald-300/70" : "text-rose-300/70")}>
        {buy ? "TREND WZROSTOWY" : "TREND SPADKOWY"}
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-[#030b14]">
        <img src={image} alt={`${side} Swing Trading setup`} className="h-auto w-full object-contain" />
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-[#030b14]">
        <img
          src={confirmationImage}
          alt={`Potwierdzenia ${side}`}
          className="h-[200px] w-full object-cover object-center"
        />
      </div>
    </div>
  );
}

export default function SwingTradingPage() {
  const paid = true;

  const checklist = [
    "Określiłem trend na D1",
    "Cena jest w kluczowej strefie",
    "Czekam na potwierdzenie H4 / H1",
    "SL ustawiony za swingiem",
    "RR minimum 1.5R–3R+",
    "Ryzyko maks. 1–2%",
    "Zarządzam pozycją zgodnie z planem",
    "Nie przesuwam SL na stracie",
    "Zamykam pozycję zgodnie z planem",
  ];

  return (
    <main className="min-h-screen bg-[#020914] text-white">
      <div className="mx-auto w-full max-w-[1900px] space-y-4 px-2 py-5 sm:px-3 lg:px-4">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-[24px] border border-cyan-400/20 bg-[#04111f]">
          <img
            src="/strategie/swing-trading/swing-hero.png"
            alt="Strategia Swing Trading"
            className="h-[290px] w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#020914]/80 via-[#020914]/20 to-transparent" />
          <div className="absolute left-5 top-5 max-w-[650px] md:left-8 md:top-7">
            <div className="text-[11px] font-bold uppercase tracking-[.18em] text-amber-300">
              FX TRADE PREMIUM
            </div>
            <h1 className="mt-2 text-4xl font-black tracking-tight md:text-6xl">
              STRATEGIA{" "}
              <span className="bg-gradient-to-r from-sky-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                SWING TRADING
              </span>
            </h1>
            <div className="mt-2 text-sm font-black uppercase tracking-[.14em] text-amber-300">
              Trend • Struktura • Cierpliwość
            </div>
            <p className="mt-4 max-w-xl text-sm leading-6 text-sky-100/70">
              Strategia swing trading oparta na analizie trendu wyższych interwałów,
              strukturze rynku i wejściu w najlepsze strefy.
            </p>
          </div>
        </section>

        {/* METRICS */}
        <section className="rounded-[20px] border border-cyan-400/15 bg-[#04111f] p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Metric icon="◷" label="Timeframe" value="D1 / H4" sub="Wejście: H4 / H1" />
            <Metric icon="🌐" label="Sesje" value="London / New York" sub="Najlepsza płynność" />
            <Metric icon="📈" label="Średni RR" value="2.5R+" sub="Cel 3R+" />
            <Metric icon="⏱" label="Średni czas" value="3–10 dni" sub="Pozycje wielodniowe" />
            <Metric icon="🎯" label="Częstotliwość" value="1–3 trade" sub="Tygodniowo" />
          </div>
        </section>

        {/* RULES */}
        <section className="rounded-[20px] border border-cyan-400/15 bg-[#04111f] p-4">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xl">①</span>
            <h2 className="text-[15px] font-black uppercase tracking-[.08em] text-cyan-300">
              Zasady działania
            </h2>
          </div>

          <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3 min-[1700px]:grid-cols-5">
            <RuleCard
              n={1}
              title="Analiza trendu D1"
              image="/strategie/swing-trading/rules/rule-1-trend.png"
            >
              Określ kierunek trendu na D1 przez strukturę HH/HL lub LH/LL oraz EMA 50/200.
            </RuleCard>
            <RuleCard
              n={2}
              title="Znajdź strefę"
              image="/strategie/swing-trading/rules/rule-2-zone.png"
            >
              Zidentyfikuj kluczowe wsparcie, opór, FVG lub Order Block zgodny z trendem.
            </RuleCard>
            <RuleCard
              n={3}
              title="Wejście H4 / H1"
              image="/strategie/swing-trading/rules/rule-3-entry.png"
            >
              Poczekaj na reakcję ceny i potwierdzenie na H4 lub H1 zgodne z kierunkiem D1.
            </RuleCard>
            <RuleCard
              n={4}
              title="Zarządzaj pozycją"
              image="/strategie/swing-trading/rules/rule-4-manage.png"
            >
              SL za swingiem. TP 2R–3R+ lub prowadzenie pozycji po strukturze.
            </RuleCard>
            <RuleCard
              n={5}
              title="Zarządzaj ryzykiem"
              image="/strategie/swing-trading/rules/rule-5-risk.png"
            >
              Ryzykuj maksymalnie 1–2% kapitału na transakcję i nie zwiększaj ryzyka po stracie.
            </RuleCard>
          </div>
        </section>

        {/* PREPARATION */}
        <section className="rounded-[20px] border border-cyan-400/15 bg-[#04111f] p-4">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xl">②</span>
            <h2 className="text-[15px] font-black uppercase tracking-[.08em] text-cyan-300">
              Mapa dnia – przygotowanie
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {[
              ["📅", "Kalendarz ekonomiczny", "Unikaj najważniejszych danych HTF bez planu."],
              ["📊", "Bias na D1", "Trend, struktura i najważniejsze poziomy."],
              ["🔎", "Kluczowe strefy", "Wsparcie, opór, FVG i Order Block."],
              ["🎯", "Setup zgodny z biasem", "D1 wyznacza kierunek, H4/H1 timing."],
              ["☑", "1–3 okazje tygodniowo", "Jakość ponad ilość."],
            ].map(([icon, title, desc]) => (
              <div key={title} className="rounded-xl border border-cyan-400/10 bg-[#071728] p-4">
                <div className="text-2xl">{icon}</div>
                <div className="mt-2 text-[11px] font-black uppercase text-white">{title}</div>
                <div className="mt-2 text-[10px] leading-4 text-sky-100/50">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* SETUPS */}
        <section className="rounded-[20px] border border-cyan-400/15 bg-[#04111f] p-4">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xl">③</span>
            <h2 className="text-[15px] font-black uppercase tracking-[.08em] text-cyan-300">
              Przykłady setupów
            </h2>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <SetupPanel
              side="BUY"
              image="/strategie/swing-trading/swing-buy.png"
              confirmationImage="/strategie/swing-trading/swing-buy-confirmation.png"
            />
            <SetupPanel
              side="SELL"
              image="/strategie/swing-trading/swing-sell.png"
              confirmationImage="/strategie/swing-trading/swing-sell-confirmation.png"
            />
          </div>
        </section>

        {/* BOTTOM */}
        <section className="grid gap-4 xl:grid-cols-3">
          <Card className="border-cyan-400/15 bg-[#04111f]">
            <CardContent className="p-5">
              <h3 className="text-[14px] font-black uppercase text-cyan-300">Checklista tradera</h3>
              <div className="mt-4 space-y-2">
                {checklist.map((item) => (
                  <label key={item} className="flex items-start gap-2 text-[11px] text-sky-100/65">
                    <input type="checkbox" className="mt-[2px] h-4 w-4 accent-sky-500" />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-cyan-400/15 bg-[#04111f]">
            <CardContent className="p-5">
              <h3 className="text-[14px] font-black uppercase text-cyan-300">
                Zarządzanie pozycją
              </h3>
              <div className="mt-4 space-y-3">
                {[
                  ["%", "Przenieś SL na BE", "Po osiągnięciu 1R i potwierdzeniu struktury."],
                  ["⚖", "Trailing Stop", "Podążaj za trendem lub EMA 20/50."],
                  ["◔", "Częściowa realizacja", "Zrealizuj część przy 2R, resztę zostaw na 3R+."],
                ].map(([icon, title, desc]) => (
                  <div key={title} className="flex gap-3 rounded-xl border border-cyan-400/10 bg-[#071728] p-3">
                    <div className="text-xl">{icon}</div>
                    <div>
                      <div className="text-[10px] font-black uppercase text-cyan-300">{title}</div>
                      <div className="mt-1 text-[11px] text-sky-100/55">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-cyan-400/15 bg-[#04111f]">
            <CardContent className="p-5">
              <h3 className="text-[14px] font-black uppercase text-cyan-300">Najlepsze sesje</h3>
              <div className="mt-4 space-y-3">
                {[
                  ["🇬🇧", "LONDYN", "08:00–12:00", "NAJLEPSZA"],
                  ["🇺🇸", "NOWY JORK", "14:00–18:00", "BARDZO DOBRA"],
                  ["🇬🇧🇺🇸", "NAKŁADANIE SESJI", "13:00–16:00", "IDEALNA"],
                ].map(([flag, name, time, rating]) => (
                  <div key={name} className="grid grid-cols-[48px_1fr_auto] items-center gap-3 rounded-xl border border-cyan-400/10 bg-[#071728] p-3">
                    <div className="text-2xl">{flag}</div>
                    <div>
                      <div className="text-[10px] font-black text-cyan-300">{name}</div>
                      <div className="mt-1 text-[11px] text-sky-100/55">{time}</div>
                    </div>
                    <div className="text-[9px] font-black text-emerald-300">{rating}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* FOOTER */}
        <section className="rounded-[20px] border border-amber-400/20 bg-[linear-gradient(90deg,#0b1420,#111728,#0b1420)] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-[18px] font-black uppercase tracking-[.08em] text-amber-300">
                PLAN + CIERPLIWOŚĆ + DYSCYPLINA = SUKCES
              </div>
              <div className="mt-1 text-[11px] text-sky-100/50">
                Czekaj na najlepsze setupy zgodne z planem i zarządzaj ryzykiem.
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
