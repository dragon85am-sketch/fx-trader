"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckSquare,
  Clock3,
  Crown,
  Download,
  FileText,
  GraduationCap,
  PlaySquare,
  Star,
  Table2,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";

const bonusCards = [
  {
    title: "Checklisty PDF",
    description:
      "Gotowe checklisty do analizy rynku, wejÅ›Ä‡ i zarzÄ…dzania pozycjÄ….",
    meta1: "6 plikÃ³w",
    meta2: "1h 20m",
    tag: "CHECKLISTY",
    accent: "sky",
    image: "/bonus-checklisty.png",
    icon: FileText,
  },
  {
    title: "PrzykÅ‚ady trade",
    description:
      "Rzeczywiste przykÅ‚ady trade z opisem wejÅ›Ä‡, exita i zarzÄ…dzania.",
    meta1: "8 materiaÅ‚Ã³w",
    meta2: "3h 15m",
    tag: "PRZYKÅADY",
    accent: "emerald",
    image: "/bonus-przyklady-trade.png",
    icon: TrendingUp,
  },
  {
    title: "Case studies",
    description:
      "SzczegÃ³Å‚owe analizy przypadkÃ³w i strategii w praktyce.",
    meta1: "5 materiaÅ‚Ã³w",
    meta2: "2h 40m",
    tag: "CASE STUDIES",
    accent: "violet",
    image: "/bonus-case-studies.png",
    icon: BarChart3,
  },
  {
    title: "Typowe bÅ‚Ä™dy traderÃ³w",
    description:
      "NajczÄ™stsze bÅ‚Ä™dy oraz sposoby jak ich unikaÄ‡ i poprawiaÄ‡ wyniki.",
    meta1: "5 materiaÅ‚Ã³w",
    meta2: "1h 30m",
    tag: "PORADNIK",
    accent: "rose",
    image: "/bonus-bledy-traderow.png",
    icon: TriangleAlert,
  },
];

const popular = [
  ["Checklista: Plan Tradingowy", "PDF â€¢ 12 stron", "892"],
  ["Checklista: ZarzÄ…dzanie Ryzykiem", "PDF â€¢ 8 stron", "756"],
  ["PrzykÅ‚ad trade: EURUSD Scalping", "PDF â€¢ 15 stron", "645"],
];

const premium = [
  {
    icon: BookOpen,
    title: "E-Book: Psychologia Tradingu",
    desc: "Kompletny przewodnik po psychologii tradingu i dyscyplinie.",
    accent: "amber",
  },
  {
    icon: PlaySquare,
    title: "Kurs Video: Price Action Mastery",
    desc: "Kompletny kurs video o Price Action od podstaw do zaawansowanych.",
    accent: "violet",
  },
  {
    icon: Table2,
    title: "Szablony Excel",
    desc: "Gotowe szablony do dziennika tradingowego, analizy i zarzÄ…dzania kapitaÅ‚em.",
    accent: "emerald",
  },
];

function accentClasses(accent: string) {
  if (accent === "emerald")
    return {
      border: "border-emerald-500/45",
      text: "text-emerald-300",
      bg: "bg-emerald-500/10",
      glow: "shadow-[0_0_25px_rgba(16,185,129,.08)]",
    };
  if (accent === "violet")
    return {
      border: "border-violet-500/45",
      text: "text-violet-300",
      bg: "bg-violet-500/10",
      glow: "shadow-[0_0_25px_rgba(139,92,246,.08)]",
    };
  if (accent === "rose")
    return {
      border: "border-rose-500/45",
      text: "text-rose-300",
      bg: "bg-rose-500/10",
      glow: "shadow-[0_0_25px_rgba(244,63,94,.08)]",
    };
  if (accent === "amber")
    return {
      border: "border-amber-500/45",
      text: "text-amber-300",
      bg: "bg-amber-500/10",
      glow: "",
    };
  return {
    border: "border-sky-500/45",
    text: "text-sky-300",
    bg: "bg-sky-500/10",
    glow: "shadow-[0_0_25px_rgba(14,165,233,.08)]",
  };
}

export default function BonusyPage() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#020817] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "linear-gradient(rgba(2,8,23,.42), rgba(2,8,23,.68)), url('/materialy-bonusowe-bg.png')",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(circle_at_50%_8%,rgba(34,211,238,.16),transparent_46%)]"
      />
      <div className="relative z-10">
      <div className="mx-auto w-full max-w-[1900px] space-y-4 px-4 py-5 md:px-6 xl:px-8">
        {/* HEADER */}
        <section className="relative overflow-hidden rounded-[16px] border border-[#1784cf] bg-[linear-gradient(120deg,#105b9d_0%,#0b477f_52%,#07345f_100%)] px-5 py-5 shadow-[0_0_32px_rgba(56,189,248,.16),inset_0_1px_0_rgba(255,255,255,.08)]">
          <div className="pointer-events-none absolute right-[8%] top-0 h-full w-[38%] opacity-[.12] [background-image:radial-gradient(circle,#38bdf8_1px,transparent_1px)] [background-size:7px_7px] [mask-image:radial-gradient(ellipse_at_center,black_0%,transparent_72%)]" />

          <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-[14px] border border-sky-400/30 bg-sky-500/10 text-sky-300 shadow-[0_0_22px_rgba(14,165,233,.13)]">
                <GraduationCap className="h-7 w-7" />
              </div>

              <div>
                <div className="text-[9px] font-semibold uppercase tracking-[.18em] text-sky-200/55">
                  FX TRADE / EDUCATION / BONUS
                </div>
                <h1 className="mt-1 text-[28px] font-semibold tracking-tight">
                  MateriaÅ‚y bonusowe
                </h1>
                <p className="mt-1 max-w-[620px] text-[11px] leading-5 text-sky-100/50">
                  Dodatkowe materiaÅ‚y, ktÃ³re pomogÄ… Ci staÄ‡ siÄ™ lepszym traderem.
                </p>
              </div>
            </div>

            <Link
              href="/education"
              className="inline-flex items-center justify-center gap-2 rounded-[9px] border border-[#1784cf] bg-[#0a3f73] px-4 py-2.5 text-[10px] font-semibold text-sky-100/75 transition hover:bg-[#1263a5] hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Education
            </Link>
          </div>
        </section>

        {/* STATS */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [FileText, "24", "MateriaÅ‚y dostÄ™pne"],
            [Clock3, "12h 45m", "ÅÄ…czny czas materiaÅ‚Ã³w"],
            [Download, "1.8k", "PobraÅ„ Å‚Ä…cznie"],
            [Star, "4.9 / 5", "Åšrednia ocena materiaÅ‚Ã³w"],
          ].map(([Icon, value, label], index) => {
            const StatIcon = Icon as typeof FileText;
            return (
              <div
                key={index}
                className="rounded-[12px] border border-[#1784cf] bg-[linear-gradient(145deg,#105d9d_0%,#0b477e_55%,#073866_100%)] shadow-[0_0_24px_rgba(14,165,233,.12),inset_0_1px_0_rgba(255,255,255,.055)] px-4 py-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-sky-400/25 bg-sky-500/10 text-sky-300">
                    <StatIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[20px] font-bold">{String(value)}</div>
                    <div className="text-[9px] text-sky-100/45">{String(label)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* BONUS CARDS */}
        <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
          {bonusCards.map((card) => {
            const a = accentClasses(card.accent);
            const Icon = card.icon;

            return (
              <article
                key={card.title}
                className={`group relative overflow-hidden rounded-[14px] border ${a.border} bg-[linear-gradient(145deg,#105d9d_0%,#0b477e_55%,#073866_100%)] shadow-[0_0_26px_rgba(14,165,233,.14),inset_0_1px_0_rgba(255,255,255,.06)] p-5 ${a.glow}`}
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,.06),transparent_45%)]" />

                <div className="relative z-10 flex h-full flex-col">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-[10px] border ${a.border} ${a.bg} ${a.text}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-[17px] font-semibold">{card.title}</h2>
                  </div>

                  <p className="mt-3 min-h-[42px] text-[10px] leading-5 text-sky-100/50">
                    {card.description}
                  </p>

                  {/* VISUAL */}
                  <div
                    className={`mt-4 h-[150px] overflow-hidden rounded-[11px] border ${a.border} bg-[#06284d]`}
                  >
                    <img
                      src={card.image}
                      alt={card.title}
                      className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.025]"
                    />
                  </div>

                  <div className="mt-4 flex justify-center">
                    <span className={`rounded-full border ${a.border} ${a.bg} px-3 py-1 text-[8px] font-bold ${a.text}`}>
                      {card.tag}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 divide-x divide-[#1573b5] border-y border-[#1573b5] py-3">
                    <div className="flex items-center gap-2 text-[9px] text-sky-100/65">
                      <FileText className={`h-3.5 w-3.5 ${a.text}`} />
                      {card.meta1}
                    </div>
                    <div className="flex items-center gap-2 pl-4 text-[9px] text-sky-100/65">
                      <Clock3 className={`h-3.5 w-3.5 ${a.text}`} />
                      {card.meta2}
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[9px] border ${a.border} bg-[#0a3f73] px-4 py-2.5 text-[10px] font-bold ${a.text} transition hover:bg-[#1263a5]`}
                  >
                    OtwÃ³rz materiaÅ‚y
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </section>

        {/* BOTTOM */}
        <section className="grid gap-3 xl:grid-cols-2">
          <div className="rounded-[14px] border border-[#1784cf] bg-[linear-gradient(145deg,#105d9d_0%,#0b477e_55%,#073866_100%)] shadow-[0_0_24px_rgba(14,165,233,.12),inset_0_1px_0_rgba(255,255,255,.055)] p-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-300" />
              <h2 className="text-[15px] font-semibold">NajczÄ™Å›ciej pobierane</h2>
            </div>

            <div className="mt-4 divide-y divide-[#1573b5]">
              {popular.map(([title, desc, downloads], index) => (
                <div key={title} className="flex items-center gap-3 py-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-sky-400/40 bg-sky-500/10 text-[10px] font-bold text-sky-300">
                    {index + 1}
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-sky-400/20 bg-sky-500/10 text-sky-300">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[10px] font-semibold">{title}</div>
                    <div className="mt-0.5 text-[8px] text-sky-100/40">{desc}</div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-semibold">
                    <Download className="h-3.5 w-3.5 text-sky-300" />
                    {downloads}
                  </div>
                </div>
              ))}
            </div>

            <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[9px] border border-[#1784cf] bg-[#0a3f73] px-4 py-2.5 text-[10px] font-semibold text-sky-300 transition hover:bg-[#1263a5]">
              Zobacz wszystkie
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="rounded-[14px] border border-[#1784cf] bg-[linear-gradient(145deg,#105d9d_0%,#0b477e_55%,#073866_100%)] shadow-[0_0_24px_rgba(14,165,233,.12),inset_0_1px_0_rgba(255,255,255,.055)] p-5">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-300" />
              <h2 className="text-[15px] font-semibold">MateriaÅ‚y premium</h2>
            </div>

            <div className="mt-4 divide-y divide-[#1573b5]">
              {premium.map((item) => {
                const a = accentClasses(item.accent);
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex items-center gap-3 py-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border ${a.border} ${a.bg} ${a.text}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-semibold">{item.title}</div>
                      <div className="mt-0.5 max-w-[460px] text-[8px] leading-4 text-sky-100/40">
                        {item.desc}
                      </div>
                    </div>
                    <span className={`rounded-full border ${a.border} ${a.bg} px-2.5 py-1 text-[8px] font-bold ${a.text}`}>
                      PREMIUM
                    </span>
                  </div>
                );
              })}
            </div>

            <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[9px] border border-[#1784cf] bg-[#0a3f73] px-4 py-2.5 text-[10px] font-semibold text-sky-300 transition hover:bg-[#1263a5]">
              Zobacz wszystkie premium
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </section>
      </div>
      </div>
    </main>
  );
}

