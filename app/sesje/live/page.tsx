"use client";

import Link from "next/link";
import { ArrowLeft, Clock3, Headphones, MessageCircle, Radio, ShieldCheck, Users, Video } from "lucide-react";

export default function DolaczDoSesjiPage() {
  return (
    <main className="min-h-screen bg-[#020914] text-white">
      <div className="mx-auto w-full max-w-[1700px] px-4 py-5 md:px-6 xl:px-8">
        <header className="rounded-[18px] border border-emerald-500/40 bg-[linear-gradient(135deg,rgba(3,64,47,.42),rgba(3,14,23,.96))] p-5">
          <div className="flex items-center justify-between gap-4"><div className="flex items-center gap-4"><Link href="/sesje" className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-[#081522]"><ArrowLeft className="h-5 w-5" /></Link><div className="flex h-14 w-14 items-center justify-center rounded-[14px] border border-emerald-400/45 bg-emerald-500/10 text-emerald-300"><Radio className="h-8 w-8" /></div><div><div className="text-[9px] font-bold uppercase tracking-[.22em] text-emerald-300/70">FX TRADE PROFESSIONAL</div><h1 className="mt-1 text-3xl font-black">DOÅÄ„CZ DO <span className="text-emerald-300">SESJI</span></h1><p className="mt-1 text-[11px] text-slate-400">Aktualna sesja na Å¼ywo i dostÄ™p do trading room.</p></div></div><span className="inline-flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-[10px] font-black text-rose-300"><span className="h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,.8)]"/> LIVE</span></div>
        </header>

        <section className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
          <div className="overflow-hidden rounded-[16px] border border-emerald-500/40 bg-[#050e15]">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4"><div><div className="text-[9px] font-bold text-emerald-300">AKTUALNIE TRWA</div><h2 className="mt-1 text-xl font-black">GOLD SESSION LIVE <span className="text-sm font-medium text-slate-500">(XAUUSD)</span></h2></div><div className="text-right"><div className="text-2xl font-black">16:00</div><div className="text-[8px] text-slate-500">START CET</div></div></div>
            <div className="relative flex h-[460px] items-center justify-center bg-[linear-gradient(180deg,#03151b,#02070b)]"><div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(16,185,129,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,.08)_1px,transparent_1px)] [background-size:40px_40px]"/><div className="relative z-10 text-center"><div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-emerald-400/35 bg-emerald-500/10 text-emerald-300 shadow-[0_0_34px_rgba(16,185,129,.17)]"><Video className="h-12 w-12" /></div><div className="mt-5 text-xl font-black">TRANSMISJA SESJI LIVE</div><p className="mt-2 text-[10px] text-slate-500">Tutaj osadzisz player transmisji / webinaru / streamu.</p><button className="mt-5 rounded-xl border border-emerald-300/30 bg-[linear-gradient(90deg,#0ca45f,#16c773)] px-8 py-3 text-[11px] font-black">URUCHOM TRANSMISJÄ˜</button></div></div>
          </div>

          <aside className="space-y-4"><div className="rounded-[16px] border border-slate-700/70 bg-[#06111d] p-5"><div className="text-[11px] font-black text-emerald-300">INFORMACJE O SESJI</div><div className="mt-4 space-y-3 text-[10px]"><div className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#040c15] px-3 py-3"><span className="inline-flex items-center gap-2 text-slate-400"><Clock3 className="h-4 w-4" /> Godzina</span><b>16:00 CET</b></div><div className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#040c15] px-3 py-3"><span className="inline-flex items-center gap-2 text-slate-400"><Users className="h-4 w-4" /> Uczestnicy</span><b>342</b></div><div className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#040c15] px-3 py-3"><span className="inline-flex items-center gap-2 text-slate-400"><ShieldCheck className="h-4 w-4" /> Status</span><b className="text-emerald-300">AKTYWNA</b></div></div></div><div className="rounded-[16px] border border-sky-500/30 bg-[#06111d] p-5"><div className="flex items-center gap-2 text-[11px] font-black text-sky-300"><MessageCircle className="h-5 w-5" /> CZAT SESJI</div><div className="mt-4 h-56 rounded-xl border border-slate-800 bg-[#030a11] p-3 text-[9px] text-slate-500">Czat sesji / wiadomoÅ›ci uczestnikÃ³w.</div><button className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sky-400/25 bg-sky-500/10 px-4 py-2.5 text-[10px] font-black text-sky-300"><Headphones className="h-4 w-4" /> OTWÃ“RZ CZAT</button></div></aside>
        </section>
      </div>
    </main>
  );
}

