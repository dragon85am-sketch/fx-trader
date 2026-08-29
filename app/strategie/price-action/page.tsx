"use client";

import Link from "next/link";
import React from "react";

const rules = [
  {
    n: 1,
    title: "Struktura rynku",
    text: "OkreÅ›l strukturÄ™ rynku na H1/H4. Szukaj HH/HL w trendzie wzrostowym lub LH/LL w trendzie spadkowym.",
    image: "/strategie/price-action/rules/rule-1-structure.png",
  },
  {
    n: 2,
    title: "Strefa kluczowa",
    text: "Zaznacz wsparcie, opÃ³r, poprzednie szczyty/doÅ‚ki, liniÄ™ trendu, strefÄ™ podaÅ¼y lub popytu.",
    image: "/strategie/price-action/rules/rule-2-zone.png",
  },
  {
    n: 3,
    title: "SygnaÅ‚ Å›wiecowy",
    text: "Szukaj Å›wiecy sygnaÅ‚owej w strefie: pin bar, engulfing, inside bar, fakey lub rejection.",
    image: "/strategie/price-action/rules/rule-3-candle.png",
  },
  {
    n: 4,
    title: "ZarzÄ…dzanie",
    text: "SL ustaw za swingiem lub strefÄ…. TP 1.2Râ€“1.6R albo przy kolejnym poziomie/strukturze.",
    image: "/strategie/price-action/rules/rule-4-manage.png",
  },
  {
    n: 5,
    title: "ZarzÄ…dzaj ryzykiem",
    text: "Ryzykuj maksymalnie 1â€“2% kapitaÅ‚u na transakcjÄ™. Nie zwiÄ™kszaj pozycji po stracie.",
    image: "/strategie/price-action/rules/rule-5-risk.png",
  },
];

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-emerald-400/15 bg-[#07182c]/90 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-500/10 text-xl">
          {icon}
        </div>
        <div>
          <div className="text-[10px] text-slate-400">{label}</div>
          <div className="mt-1 text-sm font-black text-white">{value}</div>
        </div>
      </div>
    </div>
  );
}

function RuleCard({
  n,
  title,
  text,
  image,
}: {
  n: number;
  title: string;
  text: string;
  image: string;
}) {
  return (
    <div className="grid h-full grid-rows-[38px_170px_38px_1fr] overflow-hidden rounded-2xl border border-emerald-400/10 bg-[#07182c] p-3">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-black">
          {n}
        </span>
      </div>

      <div className="relative mt-1 overflow-hidden rounded-xl border border-emerald-400/15 bg-[#020b18] p-1">
        <img src={image} alt={title} className="h-full w-full object-contain object-center" />
      </div>

      <div className="flex items-center pt-2 text-[11px] font-black uppercase tracking-[.08em] text-emerald-300">
        {title}
      </div>

      <p className="pt-2 text-[10px] leading-4 text-slate-400">{text}</p>
    </div>
  );
}

function SetupPanel({
  side,
  image,
  confirmationImage,
}: {
  side: "BUY" | "SELL";
  image: string;
  confirmationImage: string;
}) {
  const buy = side === "BUY";

  return (
    <div
      className={`rounded-2xl border p-4 ${
        buy
          ? "border-emerald-400/25 bg-emerald-500/[0.025]"
          : "border-rose-400/25 bg-rose-500/[0.025]"
      }`}
    >
      <h3 className={`text-lg font-black ${buy ? "text-emerald-400" : "text-rose-400"}`}>
        {side} SETUP
      </h3>
      <div
        className={`mt-1 text-[10px] font-bold ${
          buy ? "text-emerald-300/70" : "text-rose-300/70"
        }`}
      >
        {buy ? "TREND WZROSTOWY" : "TREND SPADKOWY"}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-[#020b18]">
        <img src={image} alt={`${side} Price Action setup`} className="h-auto w-full object-contain" />
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-[#020b18]">
        <img
          src={confirmationImage}
          alt={`Potwierdzenia ${side}`}
          className="h-[210px] w-full object-cover object-center"
        />
      </div>
    </div>
  );
}

export default function PriceActionStrategyPage() {
  const checklist = [
    "Struktura trendu potwierdzona",
    "Strefa wsparcia / oporu zidentyfikowana",
    "Formacja Å›wiecowa potwierdzona",
    "Kierunek zgodny z wyÅ¼szym TF",
    "RR minimum 1.2R",
    "SL za swingiem lub strefÄ…",
    "Brak dywergencji",
    "Wolumen potwierdza ruch",
    "ZarzÄ…dzanie pozycjÄ… zaplanowane",
    "CzÄ™Å›ciowa realizacja zaplanowana",
    "Dziennik transakcji prowadzony",
    "Emocje pod kontrolÄ…",
  ];

  return (
    <main className="min-h-screen bg-[#020916] text-white">
      <div className="mx-auto w-full max-w-[1800px] space-y-4 px-3 py-5 lg:px-5">
        {/* HERO */}
        <section className="overflow-hidden rounded-[24px] border border-emerald-400/20 bg-[#061425] shadow-[0_0_45px_rgba(16,185,129,.07)]">
          <div className="grid xl:grid-cols-[1.1fr_.9fr]">
            <div className="p-5 lg:p-7">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-500/15 text-3xl">
                  â—«
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                      PRICE ACTION
                    </h1>
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-[10px] font-black text-emerald-300">
                      FREE
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-amber-400">
                    <span className="text-xl">â˜…â˜…â˜…â˜…â˜…</span>
                    <span className="text-xs text-slate-300">4.6</span>
                  </div>
                </div>
              </div>

              <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-400">
                Klasyczne Price Action, struktura rynku i potwierdzenia Å›wiecowe.
                Bez przeÅ‚adowania wskaÅºnikami â€” czytasz zachowanie ceny i reakcjÄ™ na kluczowych poziomach.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <Metric label="SkutecznoÅ›Ä‡" value="78%" icon="ðŸ“Š" />
                <Metric label="InterwaÅ‚y" value="M5 Â· H1 Â· H4" icon="â–¦" />
                <Metric label="RR" value="1.2 â€“ 1.6" icon="ðŸŽ¯" />
                <Metric label="Czas trwania" value="1 â€“ kilka dni" icon="â—·" />
                <Metric label="Sesje" value="CaÅ‚y tydzieÅ„" icon="ðŸŒ" />
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="mr-2 text-[11px] text-slate-400">Najlepiej dziaÅ‚a na:</span>
                {["EURUSD", "GBPUSD", "US30", "XAUUSD"].map((x) => (
                  <span
                    key={x}
                    className="rounded-xl border border-cyan-400/15 bg-[#07182c] px-4 py-2 text-[10px] font-bold text-slate-200"
                  >
                    {x}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative min-h-[300px] overflow-hidden border-t border-emerald-400/10 bg-[#030d1c] xl:border-l xl:border-t-0">
              <img
                src="/strategie/price-action/price-action-hero.png"
                alt="Price Action Strategy"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#061425]/20 to-transparent" />
            </div>
          </div>
        </section>

        {/* RULES */}
        <section className="rounded-[22px] border border-emerald-400/15 bg-[#061425] p-4">
          <h2 className="mb-4 text-[16px] font-black uppercase tracking-[.08em] text-emerald-300">
            Zasady dziaÅ‚ania
          </h2>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 min-[1700px]:grid-cols-5">
            {rules.map((rule) => (
              <RuleCard key={rule.n} {...rule} />
            ))}
          </div>
        </section>

        {/* SETUPS */}
        <section className="rounded-[22px] border border-emerald-400/15 bg-[#061425] p-4">
          <h2 className="mb-4 text-[16px] font-black uppercase tracking-[.08em] text-emerald-300">
            Setupy Price Action
          </h2>

          <div className="grid gap-4 xl:grid-cols-2">
            <SetupPanel
              side="BUY"
              image="/strategie/price-action/price-action-buy.png"
              confirmationImage="/strategie/price-action/price-action-buy-confirmation.png"
            />
            <SetupPanel
              side="SELL"
              image="/strategie/price-action/price-action-sell.png"
              confirmationImage="/strategie/price-action/price-action-sell-confirmation.png"
            />
          </div>
        </section>

        {/* BOTTOM */}
        <section className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-[22px] border border-emerald-400/15 bg-[#061425] p-5">
            <h3 className="text-[14px] font-black uppercase text-emerald-300">
              Mapa przygotowania
            </h3>
            <div className="mt-4 space-y-2">
              {[
                "SprawdÅº strukturÄ™ na H1 / H4",
                "Zaznacz kluczowe strefy wsparcia / oporu",
                "Zidentyfikuj trend i kierunek",
                "Szukaj formacji Å›wiecowych",
                "Przeanalizuj wolumen i zmiennoÅ›Ä‡",
                "Zaplanuj wejÅ›cie, SL i TP",
              ].map((x) => (
                <div key={x} className="flex gap-2 text-[11px] text-slate-300">
                  <span className="text-emerald-400">â—</span>
                  {x}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[22px] border border-emerald-400/15 bg-[#061425] p-5">
            <h3 className="text-[14px] font-black uppercase text-emerald-300">
              ZarzÄ…dzanie pozycjÄ…
            </h3>
            <div className="mt-4 space-y-3">
              {[
                ["BE", "Po osiÄ…gniÄ™ciu 1R przenieÅ› SL na Break Even."],
                ["Trailing Stop", "Przesuwaj SL za swingiem lub Å›wiecÄ…."],
                ["CzÄ™Å›ciowa realizacja", "Zamknij 50% pozycji przy 1.2Râ€“1.6R."],
                ["ZamkniÄ™cie rÄ™czne", "WyjdÅº po zmianie struktury lub mocnym sygnale przeciwnym."],
              ].map(([t, d]) => (
                <div key={t} className="rounded-xl border border-emerald-400/10 bg-[#07182c] p-3">
                  <div className="text-[10px] font-black uppercase text-emerald-300">{t}</div>
                  <div className="mt-1 text-[10px] leading-4 text-slate-400">{d}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[22px] border border-emerald-400/15 bg-[#061425] p-5">
            <h3 className="text-[14px] font-black uppercase text-emerald-300">
              Najlepsze sesje
            </h3>
            <div className="mt-4 space-y-3">
              {[
                ["ðŸ‡¬ðŸ‡§", "LONDON", "08:00 â€“ 12:00", "NAJLEPSZA"],
                ["ðŸ‡ºðŸ‡¸", "NOWY JORK", "14:00 â€“ 18:00", "BARDZO DOBRA"],
                ["ðŸ‡¬ðŸ‡§ðŸ‡ºðŸ‡¸", "NAKÅADANIE SESJI", "13:00 â€“ 16:00", "IDEALNA"],
              ].map(([flag, name, time, rate]) => (
                <div
                  key={name}
                  className="grid grid-cols-[48px_1fr_auto] items-center gap-3 rounded-xl border border-emerald-400/10 bg-[#07182c] p-3"
                >
                  <div className="text-2xl">{flag}</div>
                  <div>
                    <div className="text-[10px] font-black text-cyan-300">{name}</div>
                    <div className="mt-1 text-[10px] text-slate-400">{time}</div>
                  </div>
                  <div className="text-[9px] font-black text-emerald-300">{rate}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CHECKLIST */}
        <section className="rounded-[22px] border border-emerald-400/15 bg-[#061425] p-5">
          <h3 className="text-[14px] font-black uppercase text-emerald-300">
            Checklista tradera
          </h3>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {checklist.map((x) => (
              <label key={x} className="flex items-center gap-2 text-[11px] text-slate-300">
                <input type="checkbox" className="h-4 w-4 accent-emerald-500" />
                {x}
              </label>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <section className="rounded-[22px] border border-emerald-400/20 bg-[linear-gradient(90deg,#071425,#0c1a23,#071425)] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-lg font-black uppercase tracking-[.08em] text-emerald-300">
                PLAN + DYSCYPLINA + CIERPLIWOÅšÄ† = SUKCES
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                Price Action to czysta gra rynku. Zrozum, obserwuj i dziaÅ‚aj.
              </div>
            </div>

            <Link
              href="/strategie"
              className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-3 text-[11px] font-black text-emerald-200 transition hover:bg-emerald-500/20"
            >
              â† WrÃ³Ä‡ do strategii
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

