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
              <div className="text-[10px] font-bold uppercase tracking-[.18em] text-cyan-300/70">FX TRADE / BONUSYY / RISK MANAGEMENT</div>
              <h1 className="mt-2 text-3xl font-black">Checklista: Zarządzanie Ryzykiem</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-sky-100/65">Zasady ochrony kapitału przed i podczas sesji.</p>
            </div>
            <Link href="/education/bonusy" className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-2.5 text-sm font-bold text-cyan-100 hover:bg-cyan-300/15">
              <ArrowLeft className="h-4 w-4" /> Materiały bonusowe
            </Link>
          </div>
        </header>
        <section className="rounded-2xl border border-sky-400/25 bg-[#0b477e]/90 p-5 shadow-[0_0_25px_rgba(14,165,233,.10)]">
          <h2 className="text-lg font-black text-white">Limity</h2>
          <div className="mt-4 space-y-2.5">
            <div className="flex gap-2.5 text-sm leading-6 text-sky-100/75"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span>0.5–1% ryzyka na pojedynczy trade.</span></div>
            <div className="flex gap-2.5 text-sm leading-6 text-sky-100/75"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span>Maksymalnie 2–3 przegrane transakcje dziennie.</span></div>
            <div className="flex gap-2.5 text-sm leading-6 text-sky-100/75"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span>Nie zwiększaj ryzyka po stracie.</span></div>
            <div className="flex gap-2.5 text-sm leading-6 text-sky-100/75"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span>Po osiągnięciu limitu kończysz sesję.</span></div>
          </div>
        </section>
        <section className="rounded-2xl border border-sky-400/25 bg-[#0b477e]/90 p-5 shadow-[0_0_25px_rgba(14,165,233,.10)]">
          <h2 className="text-lg font-black text-white">Zarządzanie pozycją</h2>
          <div className="mt-4 space-y-2.5">
            <div className="flex gap-2.5 text-sm leading-6 text-sky-100/75"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span>SL ustawiony przed wejściem.</span></div>
            <div className="flex gap-2.5 text-sm leading-6 text-sky-100/75"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span>Nie rozszerzaj SL przeciwko pozycji.</span></div>
            <div className="flex gap-2.5 text-sm leading-6 text-sky-100/75"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span>TP1 zgodny z planowanym RR.</span></div>
            <div className="flex gap-2.5 text-sm leading-6 text-sky-100/75"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span>BE dopiero gdy struktura rynku to uzasadnia.</span></div>
          </div>
        </section>
      </div>
    </main>
  );
}
