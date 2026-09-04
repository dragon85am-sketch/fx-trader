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
              <div className="text-[10px] font-bold uppercase tracking-[.18em] text-cyan-300/70">FX TRADE / BONUSYY / POPULARNE</div>
              <h1 className="mt-2 text-3xl font-black">Najczęściej pobierane</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-sky-100/65">Najpopularniejsze checklisty i przykłady tradingowe w jednym miejscu.</p>
            </div>
            <Link href="/education/bonusy" className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-2.5 text-sm font-bold text-cyan-100 hover:bg-cyan-300/15">
              <ArrowLeft className="h-4 w-4" /> Materiały bonusowe
            </Link>
          </div>
        </header>
        <section className="rounded-2xl border border-sky-400/25 bg-[#0b477e]/90 p-5 shadow-[0_0_25px_rgba(14,165,233,.10)]">
          <h2 className="text-lg font-black text-white">Plan Tradingowy</h2>
          <div className="mt-4 space-y-2.5">
            <div className="flex gap-2.5 text-sm leading-6 text-sky-100/75"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span>Warunki wejścia zapisane przed sesją.</span></div>
            <div className="flex gap-2.5 text-sm leading-6 text-sky-100/75"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span>Maksymalne ryzyko na pojedynczy trade.</span></div>
            <div className="flex gap-2.5 text-sm leading-6 text-sky-100/75"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span>Dzienny limit straty i liczba transakcji.</span></div>
            <div className="flex gap-2.5 text-sm leading-6 text-sky-100/75"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span>Scenariusz BUY, SELL oraz brak transakcji.</span></div>
          </div>
        </section>
        <section className="rounded-2xl border border-sky-400/25 bg-[#0b477e]/90 p-5 shadow-[0_0_25px_rgba(14,165,233,.10)]">
          <h2 className="text-lg font-black text-white">Zarządzanie Ryzykiem</h2>
          <div className="mt-4 space-y-2.5">
            <div className="flex gap-2.5 text-sm leading-6 text-sky-100/75"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span>Ryzyko 0.5–1% kapitału na trade.</span></div>
            <div className="flex gap-2.5 text-sm leading-6 text-sky-100/75"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span>Minimum RR 1.5R, preferowane 2R+.</span></div>
            <div className="flex gap-2.5 text-sm leading-6 text-sky-100/75"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span>Nie zwiększaj lota po stracie.</span></div>
            <div className="flex gap-2.5 text-sm leading-6 text-sky-100/75"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span>Po serii strat zakończ handel i przeanalizuj sesję.</span></div>
          </div>
        </section>
        <section className="rounded-2xl border border-sky-400/25 bg-[#0b477e]/90 p-5 shadow-[0_0_25px_rgba(14,165,233,.10)]">
          <h2 className="text-lg font-black text-white">EURUSD Scalping</h2>
          <div className="mt-4 space-y-2.5">
            <div className="flex gap-2.5 text-sm leading-6 text-sky-100/75"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span>Najpierw bias M5, następnie timing M1.</span></div>
            <div className="flex gap-2.5 text-sm leading-6 text-sky-100/75"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span>Wejście dopiero po zamknięciu świecy potwierdzającej.</span></div>
            <div className="flex gap-2.5 text-sm leading-6 text-sky-100/75"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span>SL za lokalnym swingiem.</span></div>
            <div className="flex gap-2.5 text-sm leading-6 text-sky-100/75"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span>TP przed kolejną strefą płynności.</span></div>
          </div>
        </section>
      </div>
    </main>
  );
}
