"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Crosshair,
  ShieldCheck,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

const buyM5 = [
  "Jasna struktura HH/HL",
  "Trend wzrostowy",
  "Cena przy punkcie reakcji",
  "Strefa popytu / wsparcie",
  "Jest miejsce na target",
];

const buyM1 = [
  "Setup zgodny z biasem",
  "Formacja / odrzucenie",
  "BOS / CHOCH w gÃ³rÄ™",
  "Åšwieca sygnaÅ‚owa",
  "Nie wchodzÄ™ kontra",
];

const sellM5 = [
  "Jasna struktura LH/LL",
  "Trend spadkowy",
  "Cena przy punkcie reakcji",
  "Strefa podaÅ¼y / opÃ³r",
  "Jest miejsce na target",
];

const sellM1 = [
  "Setup zgodny z biasem",
  "Formacja / odrzucenie",
  "BOS / CHOCH w dÃ³Å‚",
  "Åšwieca sygnaÅ‚owa",
  "Nie wchodzÄ™ kontra",
];

const keyRules = [
  "Handluj tylko w zgodzie z biasem M5",
  "Czekaj aÅ¼ cena dotrze do punktu reakcji",
  "M1 sÅ‚uÅ¼y tylko do precyzyjnego wejÅ›cia",
  "SL zawsze za swingiem (logiczny)",
  "RR minimum 1.5R",
  "Nie goÅ„ ceny",
  "Brak setupu = brak wejÅ›cia",
  "Dyscyplina = dÅ‚ugoterminowe wyniki",
];

function Checklist({
  title,
  items,
  tone = "buy",
}: {
  title: string;
  items: string[];
  tone?: "buy" | "sell";
}) {
  const isSell = tone === "sell";

  return (
    <div>
      <div
        className={`mb-2 text-[10px] font-black uppercase tracking-[.06em] ${
          isSell ? "text-rose-400" : "text-emerald-400"
        }`}
      >
        {title}
      </div>

      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-2 text-[9px] leading-4 text-slate-200/85">
            <CheckCircle2
              className={`mt-[2px] h-3.5 w-3.5 shrink-0 ${
                isSell ? "text-rose-400" : "text-emerald-400"
              }`}
            />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImagePanel({
  title,
  tf,
  src,
  tone = "buy",
}: {
  title: string;
  tf: string;
  src: string;
  tone?: "buy" | "sell";
}) {
  const isSell = tone === "sell";

  return (
    <div
      className={`overflow-hidden rounded-xl border ${
        isSell ? "border-rose-500/40" : "border-emerald-500/40"
      } bg-[#051426]`}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <h3 className="text-[11px] font-black uppercase tracking-[.04em] text-white">
          {title}
        </h3>
        <span
          className={`rounded-md border px-2 py-0.5 text-[10px] font-black ${
            isSell
              ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
              : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {tf}
        </span>
      </div>

      <div className="bg-[#020a14] p-1.5">
        <img
          src={src}
          alt={title}
          className="h-[230px] w-full object-contain"
        />
      </div>
    </div>
  );
}


function CandlePattern({
  type,
}: {
  type:
    | "bullish-engulfing"
    | "hammer"
    | "pin-bull"
    | "bearish-engulfing"
    | "shooting-star"
    | "pin-bear";
}) {
  const green = "#34d399";
  const red = "#fb7185";
  const wick = "#cbd5e1";

  if (type === "bullish-engulfing") {
    return (
      <svg viewBox="0 0 120 72" className="h-[62px] w-full">
        <line x1="38" y1="12" x2="38" y2="58" stroke={wick} strokeWidth="2" />
        <rect x="31" y="28" width="14" height="20" rx="2" fill={red} />
        <line x1="76" y1="8" x2="76" y2="64" stroke={wick} strokeWidth="2" />
        <rect x="66" y="18" width="20" height="34" rx="2" fill={green} />
      </svg>
    );
  }

  if (type === "bearish-engulfing") {
    return (
      <svg viewBox="0 0 120 72" className="h-[62px] w-full">
        <line x1="38" y1="8" x2="38" y2="64" stroke={wick} strokeWidth="2" />
        <rect x="31" y="20" width="14" height="20" rx="2" fill={green} />
        <line x1="76" y1="8" x2="76" y2="64" stroke={wick} strokeWidth="2" />
        <rect x="66" y="18" width="20" height="34" rx="2" fill={red} />
      </svg>
    );
  }

  if (type === "hammer") {
    return (
      <svg viewBox="0 0 120 72" className="h-[62px] w-full">
        <line x1="60" y1="14" x2="60" y2="67" stroke={wick} strokeWidth="2" />
        <rect x="50" y="18" width="20" height="19" rx="2" fill={green} />
      </svg>
    );
  }

  if (type === "shooting-star") {
    return (
      <svg viewBox="0 0 120 72" className="h-[62px] w-full">
        <line x1="60" y1="5" x2="60" y2="58" stroke={wick} strokeWidth="2" />
        <rect x="50" y="36" width="20" height="18" rx="2" fill={red} />
      </svg>
    );
  }

  if (type === "pin-bull") {
    return (
      <svg viewBox="0 0 120 72" className="h-[62px] w-full">
        <line x1="60" y1="8" x2="60" y2="67" stroke={wick} strokeWidth="2" />
        <rect x="50" y="15" width="20" height="14" rx="2" fill={green} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 120 72" className="h-[62px] w-full">
      <line x1="60" y1="5" x2="60" y2="64" stroke={wick} strokeWidth="2" />
      <rect x="50" y="42" width="20" height="14" rx="2" fill={red} />
    </svg>
  );
}

function PlanBox({ tone = "buy" }: { tone?: "buy" | "sell" }) {
  const isSell = tone === "sell";

  const rows = isSell
    ? [
        ["ENTRY", "po sygnale M1"],
        ["SL", "za swing high"],
        ["TP1", "min. 1.5R"],
        ["TP2", "min. 2R"],
        ["RR", "minimum 1.5R"],
      ]
    : [
        ["ENTRY", "po sygnale M1"],
        ["SL", "za swing low"],
        ["TP1", "min. 1.5R"],
        ["TP2", "min. 2R"],
        ["RR", "minimum 1.5R"],
      ];

  return (
    <div className="rounded-xl border border-white/10 bg-[#06172c] p-3">
      <div
        className={`mb-3 text-[10px] font-black uppercase ${
          isSell ? "text-rose-400" : "text-emerald-400"
        }`}
      >
        Plan trade {isSell ? "sell" : "buy"}
      </div>

      <div className="space-y-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-3 text-[9px]">
            <span className="text-slate-500">{k}</span>
            <span className="font-semibold text-white">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ScalpingPage() {
  return (
    <main className="min-h-screen bg-[#020a14] text-white">
      <div className="mx-auto max-w-[1600px] p-2.5 md:p-4">
        {/* MAIN BOARD */}
        <div className="overflow-hidden rounded-[18px] border border-white/10 bg-[#061426] shadow-[0_0_50px_rgba(0,0,0,.35)]">
          {/* HEADER */}
          <div className="relative border-b border-white/10 bg-[#020a14] px-4 py-4">
            <Link
              href="/strategie"
              className="absolute left-4 top-4 inline-flex items-center gap-1 text-[9px] font-semibold text-sky-300 hover:text-sky-200"
            >
              <ArrowLeft className="h-3 w-3" />
              Strategie
            </Link>

            <div className="text-center">
              <h1 className="text-[28px] font-black tracking-tight md:text-[42px]">
                M5 <span className="text-emerald-400">BIAS</span>
                <span className="mx-2 text-white">+</span>
                M1 <span className="text-blue-400">TIMING</span>
              </h1>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[.08em] text-slate-300">
                Scalping strategia â€” proste zasady, wysoka selekcja
              </p>
            </div>
          </div>

          {/* TOP 4 RULES */}
          <div className="grid gap-px bg-white/10 md:grid-cols-4">
            {[
              {
                nr: "1",
                title: "M5 jasna struktura",
                desc: "HH / HL albo LH / LL",
                icon: TrendingUp,
              },
              {
                nr: "2",
                title: "Cena w punkcie reakcji",
                desc: "Swing â€¢ baza â€¢ HH / LL",
                icon: Target,
              },
              {
                nr: "3",
                title: "M1 setup zgodny z biasem",
                desc: "M1 wejÅ›cie, M5 kierunek",
                icon: Crosshair,
              },
              {
                nr: "4",
                title: "SL logiczny",
                desc: "Za swingiem â€¢ RR min. 1.5R",
                icon: ShieldCheck,
              },
            ].map((x) => {
              const Icon = x.icon;
              return (
                <div key={x.nr} className="bg-[#061426] p-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[10px] font-black">
                      {x.nr}
                    </span>
                    <div className="text-[10px] font-black uppercase tracking-[.03em]">{x.title}</div>
                    <Icon className="ml-auto h-4 w-4 text-slate-400" />
                  </div>
                  <div className="mt-2 pl-8 text-[9px] text-slate-400">{x.desc}</div>
                </div>
              );
            })}
          </div>

          {/* BUY SETUP */}
          <section className="border-t border-emerald-500/40 bg-[#04151c]">
            <div className="grid lg:grid-cols-[205px_1fr_1.16fr_180px_180px]">
              {/* checklist */}
              <div className="border-b border-r border-emerald-500/30 p-3 lg:border-b-0">
                <div className="mb-3 rounded-md bg-emerald-500/10 px-3 py-2 text-center text-[14px] font-black text-emerald-300">
                  BUY SETUP
                </div>

                <Checklist title="Checklista M5" items={buyM5} />
                <div className="my-3 h-px bg-white/10" />
                <Checklist title="Checklista M1" items={buyM1} />

                <div className="my-3 h-px bg-white/10" />

                <div className="text-[10px] font-black uppercase text-emerald-400">
                  ZarzÄ…dzanie ryzykiem
                </div>
                <div className="mt-2 space-y-1 text-[9px] text-slate-300">
                  <div>SL za swing low</div>
                  <div>RR minimum 1.5R</div>
                  <div>Ryzyko 0.5% â€“ 1%</div>
                </div>
              </div>

              {/* M5 */}
              <div className="border-b border-r border-emerald-500/30 p-2 lg:border-b-0">
                <ImagePanel
                  title="Krok 1: M5 Bias (kierunek)"
                  tf="M5"
                  src="/images/strategies/m5-buy-bias.png"
                />

                <div className="mt-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] p-3">
                  <Checklist
                    title="Warunki M5 Buy"
                    items={[
                      "M5 ma jasnÄ… strukturÄ™ HH/HL",
                      "Cena przy punkcie reakcji",
                      "Trend wzrostowy",
                      "Jest miejsce na target",
                    ]}
                  />
                </div>
              </div>

              {/* M1 */}
              <div className="border-b border-r border-emerald-500/30 p-2 lg:border-b-0">
                <ImagePanel
                  title="Krok 2: M1 Timing (wejÅ›cie)"
                  tf="M1"
                  src="/images/strategies/m1-buy-timing.png"
                />

                <div className="mt-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] p-3">
                  <Checklist
                    title="Warunki M1 Buy"
                    items={[
                      "M1 zgodny z biasem",
                      "Sweep liquidity + odrzucenie",
                      "BOS / CHOCH w gÃ³rÄ™",
                      "Retest zakoÅ„czony akceptacjÄ…",
                      "WejÅ›cie po Å›wiecy sygnaÅ‚owej",
                    ]}
                  />
                </div>
              </div>

              {/* buy conditions */}
              <div className="border-b border-r border-emerald-500/30 p-3 lg:border-b-0">
                <Checklist
                  title="Warunki M1 Buy"
                  items={[
                    "M1 nie gra kontra M5",
                    "Sweep liquidity",
                    "BOS / CHOCH",
                    "Retest",
                    "Åšwieca sygnaÅ‚owa",
                  ]}
                />
              </div>

              {/* plan */}
              <div className="p-3">
                <PlanBox />
              </div>
            </div>
          </section>

          {/* SELL SETUP */}
          <section className="border-t border-rose-500/40 bg-[#160a11]">
            <div className="grid lg:grid-cols-[205px_1fr_1.16fr_180px_180px]">
              {/* checklist */}
              <div className="border-b border-r border-rose-500/30 p-3 lg:border-b-0">
                <div className="mb-3 rounded-md bg-rose-500/10 px-3 py-2 text-center text-[14px] font-black text-rose-300">
                  SELL SETUP
                </div>

                <Checklist title="Checklista M5" items={sellM5} tone="sell" />
                <div className="my-3 h-px bg-white/10" />
                <Checklist title="Checklista M1" items={sellM1} tone="sell" />

                <div className="my-3 h-px bg-white/10" />

                <div className="text-[10px] font-black uppercase text-rose-400">
                  ZarzÄ…dzanie ryzykiem
                </div>
                <div className="mt-2 space-y-1 text-[9px] text-slate-300">
                  <div>SL za swing high</div>
                  <div>RR minimum 1.5R</div>
                  <div>Ryzyko 0.5% â€“ 1%</div>
                </div>
              </div>

              {/* M5 */}
              <div className="border-b border-r border-rose-500/30 p-2 lg:border-b-0">
                <ImagePanel
                  title="Krok 1: M5 Bias (kierunek)"
                  tf="M5"
                  src="/images/strategies/m5-sell-bias.png"
                  tone="sell"
                />

                <div className="mt-2 rounded-lg border border-rose-500/20 bg-rose-500/[0.04] p-3">
                  <Checklist
                    title="Warunki M5 Sell"
                    items={[
                      "M5 ma jasnÄ… strukturÄ™ LH/LL",
                      "Cena przy punkcie reakcji",
                      "Trend spadkowy",
                      "Jest miejsce na target",
                    ]}
                    tone="sell"
                  />
                </div>
              </div>

              {/* M1 */}
              <div className="border-b border-r border-rose-500/30 p-2 lg:border-b-0">
                <ImagePanel
                  title="Krok 2: M1 Timing (wejÅ›cie)"
                  tf="M1"
                  src="/images/strategies/m1-sell-timing.png"
                  tone="sell"
                />

                <div className="mt-2 rounded-lg border border-rose-500/20 bg-rose-500/[0.04] p-3">
                  <Checklist
                    title="Warunki M1 Sell"
                    items={[
                      "M1 zgodny z biasem",
                      "Sweep liquidity + odrzucenie",
                      "BOS / CHOCH w dÃ³Å‚",
                      "Retest zakoÅ„czony odrzuceniem",
                      "WejÅ›cie po Å›wiecy sygnaÅ‚owej",
                    ]}
                    tone="sell"
                  />
                </div>
              </div>

              {/* sell conditions */}
              <div className="border-b border-r border-rose-500/30 p-3 lg:border-b-0">
                <Checklist
                  title="Warunki M1 Sell"
                  items={[
                    "M1 nie gra kontra M5",
                    "Sweep liquidity",
                    "BOS / CHOCH",
                    "Retest",
                    "Åšwieca sygnaÅ‚owa",
                  ]}
                  tone="sell"
                />
              </div>

              {/* plan */}
              <div className="p-3">
                <PlanBox tone="sell" />
              </div>
            </div>
          </section>

          {/* BOTTOM ROW */}
          <section className="grid gap-px border-t border-white/10 bg-white/10 lg:grid-cols-[1.25fr_1fr_1.45fr]">
            {/* formations */}
            <div className="bg-[#061426] p-4">
              <div className="mb-1 text-[12px] font-black uppercase tracking-[.04em]">
                Formacje M1 (przykÅ‚ady)
              </div>
              <p className="mb-4 text-[8px] text-slate-500">
                NajczÄ™stsze Å›wiece potwierdzajÄ…ce wejÅ›cie po reakcji / retescie.
              </p>

              <div className="mb-2 text-[9px] font-black uppercase text-emerald-400">
                BUY SETUP
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  ["Bullish Engulfing", "bullish-engulfing"],
                  ["Hammer", "hammer"],
                  ["Pin Bar Bullish", "pin-bull"],
                ].map(([label, type]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-emerald-500/20 bg-[#020a14] p-3 text-center"
                  >
                    <CandlePattern type={type as any} />
                    <div className="mt-1 text-[8px] font-semibold text-slate-200">{label}</div>
                    <div className="mt-1 text-[7px] text-emerald-400/70">potwierdzenie BUY</div>
                  </div>
                ))}
              </div>

              <div className="mb-2 mt-4 text-[9px] font-black uppercase text-rose-400">
                SELL SETUP
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  ["Bearish Engulfing", "bearish-engulfing"],
                  ["Shooting Star", "shooting-star"],
                  ["Pin Bar Bearish", "pin-bear"],
                ].map(([label, type]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-rose-500/20 bg-[#020a14] p-3 text-center"
                  >
                    <CandlePattern type={type as any} />
                    <div className="mt-1 text-[8px] font-semibold text-slate-200">{label}</div>
                    <div className="mt-1 text-[7px] text-rose-400/70">potwierdzenie SELL</div>
                  </div>
                ))}
              </div>
            </div>

            {/* key rules */}
            <div className="bg-[#061426] p-3">
              <div className="mb-3 text-[11px] font-black uppercase tracking-[.04em]">
                Zasady kluczowe
              </div>

              <div className="space-y-1.5">
                {keyRules.map((rule) => (
                  <div key={rule} className="flex items-start gap-2 text-[9px] text-slate-300">
                    <Star className="mt-[2px] h-3 w-3 shrink-0 fill-amber-300 text-amber-300" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* sample trade */}
            <div className="bg-[#061426] p-3">
              <div className="mb-3 text-[11px] font-black uppercase tracking-[.04em]">
                PrzykÅ‚adowy Trade BUY
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-[#020a14] p-2">
                  <div className="text-[8px] font-bold text-emerald-300">M5 (BIAS)</div>
                  <img
                    src="/images/strategies/m5-buy-bias.png"
                    alt="PrzykÅ‚adowy trade M5"
                    className="mt-1 h-[120px] w-full object-contain"
                  />
                </div>

                <div className="rounded-lg border border-white/10 bg-[#020a14] p-2">
                  <div className="text-[8px] font-bold text-sky-300">M1 (WEJÅšCIE)</div>
                  <img
                    src="/images/strategies/m1-buy-timing.png"
                    alt="PrzykÅ‚adowy trade M1"
                    className="mt-1 h-[120px] w-full object-contain"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <div className="grid gap-px border-t border-white/10 bg-white/10 sm:grid-cols-4">
            {[
              ["M5", "PowÃ³d dlaczego?"],
              ["M1", "Moment kiedy?"],
              ["PLAN", "Dyscyplina = sukces"],
              ["RISK", "ZarzÄ…dzaj ryzykiem"],
            ].map(([a, b]) => (
              <div key={a} className="bg-[#020a14] px-4 py-3">
                <div className="text-[9px] font-black text-sky-300">{a}</div>
                <div className="mt-1 text-[8px] text-slate-400">{b}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

