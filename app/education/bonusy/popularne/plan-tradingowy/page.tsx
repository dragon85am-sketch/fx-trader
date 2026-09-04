"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, FileText, BookOpen, PlayCircle, Table2, ShieldCheck, Target, TrendingUp } from "lucide-react";

export default function MaterialPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020817] text-white">
      <div className="pointer-events-none fixed inset-0 bg-cover bg-center" style={{ backgroundImage: "linear-gradient(rgba(2,8,23,.42),rgba(2,8,23,.72)),url('/materialy-bonusowe-bg.png')" }} />
      <div className="relative z-10 mx-auto max-w-6xl space-y-4 px-4 py-6">
        <header className="rounded-3xl border border-sky-400/30 bg-[linear-gradient(135deg,#105b9d,#07345f)] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[.18em] text-cyan-300/70">FX TRADE / BONUSYY / CHECKLISTA</div>
              <h1 className="mt-2 text-3xl font-black">Checklista: Plan Tradingowy</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-sky-100/65">Gotowa checklista do przygotowania sesji tradingowej.</p>
            </div>
            <Link href="/education/bonusy" className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-2.5 text-sm font-bold text-cyan-100 hover:bg-cyan-300/15">
              <ArrowLeft className="h-4 w-4" /> Materiały bonusowe
            </Link>
          </div>
        </header>
        <section className="rounded-2xl border border-sky-400/25 bg-[#0b477e]/90 p-5 shadow-[0_0_25px_rgba(14,165,233,.10)]">
          <h2 className="text-lg font-black text-white">Przed sesją</h2>
          <div className="mt-4 space-y-2.5">
            <div className="flex gap-2.5 text-sm leading-6 text-sky-100/75"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span>Sprawdź kalendarz ekonomiczny.</span></div>
            <div className="flex gap-2.5 text-sm leading-6 text-sky-100/75"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span>Określ kierunek i strukturę wyższego TF.</span></div>
            <div className="flex gap-2.5 text-sm leading-6 text-sky-100/75"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span>Zaznacz kluczowe strefy oraz płynność.</span></div>
            <div className="flex gap-2.5 text-sm leading-6 text-sky-100/75"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span>Ustal maksymalną stratę dzienną.</span></div>
          </div>
        </section>
        <section className="rounded-2xl border border-sky-400/25 bg-[#0b477e]/90 p-5 shadow-[0_0_25px_rgba(14,165,233,.10)]">
          <h2 className="text-lg font-black text-white">Przed wejściem</h2>
          <div className="mt-4 space-y-2.5">
            <div className="flex gap-2.5 text-sm leading-6 text-sky-100/75"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span>Setup musi spełniać zasady strategii.</span></div>
            <div className="flex gap-2.5 text-sm leading-6 text-sky-100/75"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span>SL ustaw za logicznym swingiem.</span></div>
            <div className="flex gap-2.5 text-sm leading-6 text-sky-100/75"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span>RR minimum 1.5R.</span></div>
            <div className="flex gap-2.5 text-sm leading-6 text-sky-100/75"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span>Nie wchodź z FOMO.</span></div>
          </div>
        </section>
        <section className="rounded-2xl border border-sky-400/25 bg-[#0b477e]/90 p-5 shadow-[0_0_25px_rgba(14,165,233,.10)]">
          <h2 className="text-lg font-black text-white">Po transakcji</h2>
          <div className="mt-4 space-y-2.5">
            <div className="flex gap-2.5 text-sm leading-6 text-sky-100/75"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span>Zapisz wynik w journalu.</span></div>
            <div className="flex gap-2.5 text-sm leading-6 text-sky-100/75"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span>Dodaj screenshot wejścia i wyjścia.</span></div>
            <div className="flex gap-2.5 text-sm leading-6 text-sky-100/75"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span>Oceń wykonanie planu, nie tylko wynik.</span></div>
            <div className="flex gap-2.5 text-sm leading-6 text-sky-100/75"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span>Zapisz jeden wniosek na kolejną sesję.</span></div>
          </div>
        </section>
      </div>
    </main>
  );
}
