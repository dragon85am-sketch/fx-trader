"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

const shell =
  "min-h-screen bg-[linear-gradient(rgba(3,23,47,.42),rgba(3,23,47,.58)),url('/materialy-bonusowe-bg.png')] bg-cover bg-center bg-fixed text-white";

function Card({
  title,
  children,
  accent = "cyan",
}: {
  title: string;
  children: React.ReactNode;
  accent?: "cyan" | "emerald" | "violet" | "rose" | "amber";
}) {
  const tone = {
    cyan: "border-cyan-300/20 shadow-[0_0_30px_rgba(34,211,238,.08)]",
    emerald: "border-emerald-300/20 shadow-[0_0_30px_rgba(16,185,129,.08)]",
    violet: "border-violet-300/20 shadow-[0_0_30px_rgba(139,92,246,.08)]",
    rose: "border-rose-300/20 shadow-[0_0_30px_rgba(244,63,94,.08)]",
    amber: "border-amber-300/20 shadow-[0_0_30px_rgba(245,158,11,.08)]",
  }[accent];

  return (
    <section
      className={`rounded-2xl border bg-[#062447]/88 p-4 backdrop-blur-md ${tone}`}
    >
      <h2 className="text-lg font-black text-white">{title}</h2>
      <div className="mt-3 text-sm leading-6 text-sky-100/78">
        {children}
      </div>
    </section>
  );
}

function Header({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-3xl border border-cyan-300/25 bg-[linear-gradient(135deg,rgba(8,76,132,.92),rgba(4,37,72,.92))] p-5 shadow-[0_0_35px_rgba(34,211,238,.12)] backdrop-blur-xl sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[.18em] text-cyan-300/70">
            {eyebrow}
          </div>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            {title}
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-sky-100/65">
            {subtitle}
          </p>
        </div>

        <Link
          href="/education/bonusy"
          className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-2.5 text-sm font-bold text-cyan-100 transition hover:bg-cyan-300/15"
        >
          <ArrowLeft className="h-4 w-4" />
          Materiały bonusowe
        </Link>
      </div>
    </div>
  );
}

export default function ChecklistyPage() {
  const sections = [
    {
      title: "Checklista przed wejściem BUY / SELL",
      items: [
        "Kierunek z wyższego interwału jest jasny i nie handlujesz w środku chaosu.",
        "Cena znajduje się przy strefie reakcji: swing, HH/HL, LH/LL, baza, POC lub pasmo Bollingera.",
        "Masz konkretny sygnał wejścia, a nie tylko przeczucie.",
        "SL jest za logicznym swingiem, a nie ustawiony przypadkowo.",
        "RR do TP1 wynosi minimum 1.5R, preferowane 2R+.",
        "Nie wchodzisz bezpośrednio przed ważną publikacją makro.",
      ],
    },
    {
      title: "Scalping M5 Bias + M1 Timing",
      items: [
        "M5: struktura HH/HL dla BUY albo LH/LL dla SELL.",
        "M5: cena reaguje na ważny poziom lub strefę.",
        "M1: pojawia się setup zgodny z biasem M5.",
        "M1: świeca sygnałowa jest zamknięta przed wejściem.",
        "SL za lokalnym swingiem M1.",
        "Po TP1 rozważ BE tylko wtedy, gdy struktura nadal wspiera trade.",
      ],
    },
    {
      title: "Gold XAUUSD M1/M5",
      items: [
        "Sprawdź zmienność i spread przed wejściem.",
        "Unikaj wejścia w sam środek dużej świecy impulsowej.",
        "Szukaj potwierdzenia momentum, sweepu lub świecy reakcyjnej.",
        "Nie zwiększaj lota po stracie.",
        "Ustal dzienny limit straty przed pierwszym trade.",
        "Po 3 słabych wejściach zakończ sesję i przeanalizuj błędy.",
      ],
    },
    {
      title: "Bollinger + Price Action",
      items: [
        "Cena dotknęła lub wybiła zewnętrzne pasmo.",
        "Nie wchodzisz tylko dlatego, że cena jest poza pasmem.",
        "Czekasz na świecę reakcyjną: hammer, engulfing, rejection albo mocne zamknięcie.",
        "Kierunek wejścia nie koliduje z wyraźnym trendem wyższego TF.",
        "SL znajduje się za knotem lub logiczną strukturą.",
        "TP ustawiasz przed kolejną ważną strefą / średnią / przeciwległym pasmem.",
      ],
    },
  ];

  return (
    <main className={shell}>
      <div className="mx-auto max-w-7xl space-y-5 px-3 py-5 sm:px-5 lg:px-8">
        <Header
          eyebrow="FX TRADE / EDUKACJA / BONUSY / CHECKLISTY"
          title="Checklisty tradingowe"
          subtitle="Gotowe checklisty do użycia przed wejściem, w trakcie zarządzania pozycją i po zakończeniu trade."
        />

        <div className="grid gap-4 lg:grid-cols-2">
          {sections.map((section, index) => (
            <Card
              key={section.title}
              title={section.title}
              accent={index % 2 ? "emerald" : "cyan"}
            >
              <div className="space-y-2.5">
                {section.items.map((item) => (
                  <div key={item} className="flex gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <Card title="Pliki PDF do pobrania" accent="violet">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Przed wejściem BUY / SELL", "/downloads/checklista-przed-wejsciem.pdf"],
              ["Gold Scalping M1 / M5", "/downloads/checklista-gold-scalping.pdf"],
              ["Risk Management", "/downloads/checklista-risk-management.pdf"],
              ["Plan Tradingowy", "/downloads/checklista-plan-tradingowy.pdf"],
              ["Price Action", "/downloads/checklista-price-action.pdf"],
              ["Przed sesją", "/downloads/checklista-przed-sesja.pdf"],
            ].map(([name, href]) => (
              <div key={href} className="rounded-xl border border-white/10 bg-black/15 p-4">
                <div className="font-black text-white">{name}</div>
                <div className="mt-1 text-[10px] text-sky-100/45">PDF • gotowy do pobrania</div>
                <a href={href} download className="mt-3 inline-flex rounded-lg bg-cyan-500 px-3 py-2 text-xs font-black text-white hover:bg-cyan-400">Pobierz PDF</a>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Checklista zarządzania ryzykiem" accent="amber">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Ryzyko / trade", "0.5–1% kapitału"],
              ["Minimum RR", "1.5R"],
              ["Max straty / dzień", "2–3 przegrane trade"],
              ["Po serii strat", "przerwa + analiza"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-white/10 bg-black/15 p-3"
              >
                <div className="text-xs text-sky-100/45">{label}</div>
                <div className="mt-1 font-black text-white">{value}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}
