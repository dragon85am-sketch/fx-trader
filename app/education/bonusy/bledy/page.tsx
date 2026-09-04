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

export default function BledyPage() {
  const mistakes = [
    ["FOMO", "Wejście po dużej świecy tylko dlatego, że rynek już ruszył.", "Czekaj na cofnięcie, strukturę lub nowe potwierdzenie."],
    ["Overtrading", "Zbyt wiele wejść bez jakościowego setupu.", "Ustal maksymalną liczbę trade dziennie i wymagaj checklisty."],
    ["Za duży lot", "Ryzyko pozycji jest większe niż zakłada plan.", "Najpierw określ kwotę ryzyka, dopiero potem lot."],
    ["Przesuwanie SL", "Oddalanie SL, żeby uniknąć realizacji straty.", "SL ma wynikać z unieważnienia setupu i nie powinien być rozszerzany."],
    ["Zbyt szybki BE", "Przesunięcie SL na wejście przed potwierdzeniem struktury.", "Przenoś na BE dopiero po logicznym impulsie / zabezpieczeniu struktury."],
    ["Revenge trading", "Natychmiastowy kolejny trade po stracie.", "Zrób przerwę i wróć dopiero po nowym pełnym setupie."],
    ["Handel przeciw trendowi", "Próba łapania każdego szczytu i dołka.", "Najpierw szukaj setupów zgodnych z dominującym biasem."],
    ["Brak planu wyjścia", "Decyzje o TP podejmowane dopiero w trakcie trade.", "Przed Entry określ SL, TP1, TP2 i warunek wcześniejszego wyjścia."],
  ];

  return (
    <main className={shell}>
      <div className="mx-auto max-w-7xl space-y-5 px-3 py-5 sm:px-5 lg:px-8">
        <Header
          eyebrow="FX TRADE / EDUKACJA / BONUSY"
          title="Typowe błędy traderów"
          subtitle="Najczęstsze błędy techniczne i psychologiczne oraz konkretne zasady, które pomagają je ograniczać."
        />

        <div className="grid gap-4 lg:grid-cols-2">
          {mistakes.map(([title, problem, fix], i) => (
            <Card key={title} title={title} accent={i % 3 === 0 ? "rose" : i % 3 === 1 ? "amber" : "cyan"}>
              <div className="space-y-3">
                <div className="flex gap-2.5 rounded-xl border border-rose-300/15 bg-rose-400/5 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                  <div>
                    <div className="text-xs font-black uppercase tracking-wide text-rose-300">Problem</div>
                    <div className="mt-1">{problem}</div>
                  </div>
                </div>
                <div className="flex gap-2.5 rounded-xl border border-emerald-300/15 bg-emerald-400/5 p-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                  <div>
                    <div className="text-xs font-black uppercase tracking-wide text-emerald-300">Zasada naprawcza</div>
                    <div className="mt-1">{fix}</div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card title="Zasada końcowa" accent="emerald">
          <p>
            Dobry trader nie próbuje wyeliminować każdej straty. Celem jest wykonywanie tego samego procesu:
            właściwy kontekst, potwierdzenie, kontrolowane ryzyko i konsekwentne zarządzanie.
          </p>
        </Card>
      </div>
    </main>
  );
}
