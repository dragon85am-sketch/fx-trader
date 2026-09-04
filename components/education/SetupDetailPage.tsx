"use client";

import type React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldCheck, Target, TrendingUp, Images } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

type Example = { src: string; title: string; caption?: string };
type Props = {
  title: string;
  subtitle: string;
  image: string;
  timeframe: string;
  rr: string;
  rules: string[];
  buy: string[];
  sell: string[];
  examples?: Example[];
};

export default function SetupDetailPage(p: Props) {
  const { tText } = useLanguage();
  const tr = (text: string) => tText(text);
  const examples = p.examples?.length ? p.examples : [
    { src: p.image, title: `${p.title} — przykład`, caption: "Przeanalizuj kierunek, miejsce wejścia, SL i TP przed wykonaniem transakcji." },
  ];

  return (
    <main className="min-h-screen bg-[#020817] p-4 text-white md:p-7">
      <div className="mx-auto max-w-[1500px]">
        <Link href="/education/setupy" className="inline-flex items-center gap-2 rounded-xl border border-sky-400/20 bg-sky-500/10 px-3 py-2 text-xs text-sky-200">
          <ArrowLeft className="h-4 w-4" /> Wróć do setupów
        </Link>

        <section className="mt-4 overflow-hidden rounded-[22px] border border-sky-400/25 bg-[linear-gradient(135deg,#0b4b83,#06294f)] p-5 md:p-7">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.05fr] lg:items-center">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[.2em] text-sky-300">FX TRADE • SETUP EDUKACYJNY</div>
              <h1 className="mt-2 text-3xl font-black md:text-4xl">{tr(p.title)}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-sky-100/65">{tr(p.subtitle)}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-lg bg-black/20 px-3 py-2 text-xs">Interwał: <b>{p.timeframe}</b></span>
                <span className="rounded-lg bg-black/20 px-3 py-2 text-xs">Minimalne RR: <b>{p.rr}</b></span>
              </div>
            </div>
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-white/10 bg-[#020817]">
              <Image src={p.image} alt={p.title} fill className="object-contain" sizes="(max-width:1024px) 100vw,50vw" priority />
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-3">
          <Card title={tr("Zasady setupu")} icon={<ShieldCheck className="h-5 w-5" />} items={p.rules.map(tr)} />
          <Card title={tr("Warunki BUY")} icon={<TrendingUp className="h-5 w-5 text-emerald-300" />} items={p.buy.map(tr)} />
          <Card title={tr("Warunki SELL")} icon={<TrendingUp className="h-5 w-5 rotate-180 text-red-300" />} items={p.sell.map(tr)} />
        </section>

        <section className="mt-4 rounded-[18px] border border-sky-400/20 bg-[#071522] p-5">
          <div className="flex items-center gap-2">
            <Images className="h-5 w-5 text-sky-300" />
            <div>
              <h2 className="font-black">Screeny i przykłady</h2>
              <p className="mt-1 text-xs text-slate-400">Przykładowe układy z materiałów FX TRADE. Kliknij obraz, aby zobaczyć go w pełnym rozmiarze.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {examples.map((example) => (
              <a key={`${example.src}-${example.title}`} href={example.src} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-2xl border border-sky-400/15 bg-[#04101f]">
                <div className="aspect-video overflow-hidden bg-[#020817]">
                  <img src={example.src} alt={example.title} className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.02]" />
                </div>
                <div className="p-4">
                  <div className="text-sm font-black text-sky-100">{tr(example.title)}</div>
                  {example.caption ? <div className="mt-1 text-xs leading-5 text-slate-400">{tr(example.caption)}</div> : null}
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className="mt-4 rounded-[18px] border border-amber-400/20 bg-amber-500/[.06] p-5">
          <div className="flex items-start gap-3"><Target className="mt-0.5 h-5 w-5 text-amber-300" /><div><h2 className="font-black">Zarządzanie pozycją</h2><p className="mt-1 text-xs leading-5 text-slate-300">SL ustawiaj za logicznym swingiem lub strefą unieważnienia. Nie przesuwaj SL szerzej po wejściu. TP planuj przed transakcją i pomijaj setup, gdy rynek nie daje minimalnego RR.</p></div></div>
        </section>
      </div>
    </main>
  );
}

function Card({ title, icon, items }: { title: string; icon: React.ReactNode; items: string[] }) {
  return <div className="rounded-[18px] border border-sky-400/15 bg-[#071522] p-5"><div className="flex items-center gap-2 font-black text-sky-100">{icon}{title}</div><div className="mt-4 space-y-3">{items.map((x) => <div key={x} className="flex gap-2 text-xs leading-5 text-slate-300"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />{x}</div>)}</div></div>;
}
