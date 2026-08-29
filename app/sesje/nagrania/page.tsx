"use client";

import Link from "next/link";
import { ArrowLeft, Clock3, Filter, Play, Search, Video } from "lucide-react";

const recordings = [
  { title: "Live Trading â€“ Scalping EURUSD", date: "14 maja 2026", duration: "01:35:42", category: "FOREX", tone: "emerald" },
  { title: "GOLD Session Live â€“ New York", date: "13 maja 2026", duration: "01:18:16", category: "GOLD", tone: "amber" },
  { title: "Analiza Rynku â€“ Week Ahead", date: "12 maja 2026", duration: "01:12:08", category: "ANALIZA", tone: "sky" },
  { title: "DJ30 Session Live â€“ US Open", date: "9 maja 2026", duration: "01:26:51", category: "DJ30", tone: "blue" },
  { title: "ZarzÄ…dzanie Ryzykiem â€“ Masterclass", date: "7 maja 2026", duration: "01:28:33", category: "EDUKACJA", tone: "violet" },
  { title: "BTC Weekend Session", date: "4 maja 2026", duration: "01:44:09", category: "BTC", tone: "orange" },
];

const toneMap: Record<string, string> = {
  emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  sky: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  blue: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  violet: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  orange: "border-orange-500/30 bg-orange-500/10 text-orange-300",
};

export default function NagraniaSesjiPage() {
  return (
    <main className="min-h-screen bg-[#020914] text-white">
      <div className="mx-auto w-full max-w-[1800px] px-4 py-5 md:px-6 xl:px-8">
        <header className="rounded-[18px] border border-violet-500/35 bg-[linear-gradient(135deg,rgba(76,29,149,.28),rgba(4,12,23,.96))] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Link href="/sesje" className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-[#081522] text-slate-300 hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex h-14 w-14 items-center justify-center rounded-[14px] border border-violet-400/40 bg-violet-500/10 text-violet-300 shadow-[0_0_24px_rgba(168,85,247,.16)]">
                <Video className="h-7 w-7" />
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase tracking-[.22em] text-violet-300/70">FX TRADE PROFESSIONAL</div>
                <h1 className="mt-1 text-3xl font-black">NAGRANIA <span className="text-violet-300">SESJI</span></h1>
                <p className="mt-1 text-[11px] text-slate-400">Wszystkie nagrania sesji live, analiz i materiaÅ‚Ã³w edukacyjnych w jednym miejscu.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="rounded-xl border border-slate-700 bg-[#07131f] px-4 py-3 text-center"><div className="text-xl font-black">24</div><div className="text-[8px] text-slate-500">NAGRANIA</div></div>
              <div className="rounded-xl border border-slate-700 bg-[#07131f] px-4 py-3 text-center"><div className="text-xl font-black">31h+</div><div className="text-[8px] text-slate-500">MATERIAÅU</div></div>
            </div>
          </div>
        </header>

        <section className="mt-4 flex flex-col gap-3 rounded-[15px] border border-slate-700/70 bg-[#06111d] p-4 md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-700 bg-[#030b14] px-3 py-2.5 text-slate-400"><Search className="h-4 w-4" /><input className="w-full bg-transparent text-[11px] outline-none placeholder:text-slate-600" placeholder="Szukaj nagrania..." /></div>
          <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-[#081522] px-4 py-2.5 text-[10px] font-bold text-slate-300"><Filter className="h-4 w-4" /> FILTRY</button>
        </section>

        <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recordings.map((item) => (
            <article key={item.title} className="group overflow-hidden rounded-[16px] border border-slate-700/70 bg-[linear-gradient(145deg,#071522,#030a12)] transition hover:border-violet-400/50">
              <div className="relative h-44 overflow-hidden border-b border-slate-800 bg-[radial-gradient(circle_at_70%_35%,rgba(56,189,248,.15),transparent_35%),linear-gradient(135deg,#071426,#02070d)]">
                <div className="absolute inset-x-6 bottom-5 h-20 opacity-90"><svg viewBox="0 0 300 80" className="h-full w-full text-violet-400"><path d="M0 65 30 54 55 61 82 42 105 48 130 31 155 45 180 24 205 34 230 18 260 26 300 8" fill="none" stroke="currentColor" strokeWidth="3"/></svg></div>
                <button className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-violet-300/50 bg-violet-500/20 text-violet-200 shadow-[0_0_28px_rgba(168,85,247,.25)]"><Play className="ml-1 h-7 w-7 fill-current" /></button>
                <span className={`absolute left-4 top-4 rounded-md border px-2 py-1 text-[8px] font-black ${toneMap[item.tone]}`}>{item.category}</span>
                <span className="absolute bottom-3 right-3 rounded-md bg-black/70 px-2 py-1 text-[9px] font-bold">{item.duration}</span>
              </div>
              <div className="p-4"><h2 className="text-[14px] font-bold">{item.title}</h2><div className="mt-3 flex items-center justify-between text-[9px] text-slate-500"><span>{item.date}</span><span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {item.duration}</span></div><button className="mt-4 w-full rounded-[10px] border border-violet-400/30 bg-violet-500/10 px-4 py-2.5 text-[10px] font-black text-violet-300 transition hover:bg-violet-500/20">ODTWÃ“RZ NAGRANIE</button></div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

