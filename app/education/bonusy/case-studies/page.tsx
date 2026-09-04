"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Target,
  ShieldCheck,
  TrendingUp,
  Clock3,
  BarChart3,
  FileText,
} from "lucide-react";

const shell =
  "min-h-screen bg-[linear-gradient(rgba(3,23,47,.42),rgba(3,23,47,.58)),url('/materialy-bonusowe-bg.png')] bg-cover bg-center bg-fixed text-white";

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[11px] font-bold text-cyan-200">
      {children}
    </span>
  );
}

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
    <section className={`rounded-2xl border bg-[#062447]/88 p-4 backdrop-blur-md ${tone}`}>
      <h2 className="text-lg font-black text-white">{title}</h2>
      <div className="mt-3 text-sm leading-6 text-sky-100/78">{children}</div>
    </section>
  );
}

function Header({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="rounded-3xl border border-cyan-300/25 bg-[linear-gradient(135deg,rgba(8,76,132,.92),rgba(4,37,72,.92))] p-5 shadow-[0_0_35px_rgba(34,211,238,.12)] backdrop-blur-xl sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[.18em] text-cyan-300/70">
            {eyebrow}
          </div>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-sky-100/65">{subtitle}</p>
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

export default function CaseStudiesPage() {
  const studies = [
    {
      title: "Case Study 01 — Gold Scalping",
      result: "WIN +2.4R",
      steps: [
        "M5 pokazywał HH/HL oraz utrzymanie ceny nad średnią trendową.",
        "Cena zeszła do wcześniejszej strefy reakcji i wykonała sweep lokalnego low.",
        "Na M1 pojawił się hammer, a następna świeca zamknęła się powyżej jego high.",
        "Entry po zamknięciu potwierdzenia, SL pod sweepem.",
        "TP1 przy 1.5R, pozostała część pozycji prowadzona do 2.4R.",
      ],
      lesson: "Najlepsze wejście pojawiło się dopiero po zgodności M5 + M1. Wcześniejsze próby kupna byłyby zbyt agresywne.",
    },
    {
      title: "Case Study 02 — Zły trade przeciw trendowi",
      result: "LOSS -1R",
      steps: [
        "H1 i M15 pozostawały w strukturze spadkowej.",
        "Trader zobaczył jedną mocną zieloną świecę i założył odwrócenie.",
        "Brak HL, brak wybicia LH i brak potwierdzenia struktury.",
        "BUY został otwarty zbyt wcześnie.",
        "Cena wróciła do trendu i wybiła SL.",
      ],
      lesson: "Jedna mocna świeca nie zmienia struktury. Najpierw musi pojawić się potwierdzenie zmiany trendu.",
    },
    {
      title: "Case Study 03 — Dobry setup, złe zarządzanie",
      result: "BE zamiast +3R",
      steps: [
        "Setup BUY był poprawny i zgodny z trendem.",
        "Po małym ruchu trader zbyt szybko przesunął SL na BE.",
        "Normalny retest wyrzucił pozycję.",
        "Cena następnie osiągnęła planowany TP2.",
        "Błąd nie był w analizie, lecz w zarządzaniu.",
      ],
      lesson: "BE powinien wynikać ze struktury, a nie z emocji. Rynek potrzebuje miejsca na retest.",
    },
  ];

  return (
    <main className={shell}>
      <div className="mx-auto max-w-7xl space-y-5 px-3 py-5 sm:px-5 lg:px-8">
        <Header
          eyebrow="FX TRADE / EDUKACJA / BONUSY"
          title="Case Studies"
          subtitle="Pełne analizy transakcji krok po kroku — nie tylko wejście, ale również proces decyzyjny i wnioski po trade."
        />

        <div className="space-y-4">
          {studies.map((study, i) => (
            <Card key={study.title} title={study.title} accent={i === 0 ? "emerald" : i === 1 ? "rose" : "amber"}>
              <div className="mb-3">
                <Badge>{study.result}</Badge>
              </div>
              <div className="grid gap-2">
                {study.steps.map((step, idx) => (
                  <div key={step} className="flex gap-3 rounded-xl border border-white/10 bg-black/15 p-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-xs font-black text-cyan-200">
                      {idx + 1}
                    </div>
                    <div>{step}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-violet-300/20 bg-violet-400/5 p-3">
                <span className="font-black text-violet-300">Lekcja: </span>
                {study.lesson}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
