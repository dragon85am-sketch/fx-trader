"use client";

import Link from "next/link";
import React from "react";

const rules = [
  {
    n: 1,
    title: "Trend i kontekst",
    text: "OkreÅ›l kierunek trendu na H1. Dla BUY cena powinna byÄ‡ nad SMA 20, dla SELL pod SMA 20.",
    image: "/strategie/bollinger/rules/rule-1-trend.png",
  },
  {
    n: 2,
    title: "DotkniÄ™cie pasma",
    text: "Cena dotyka dolnego lub gÃ³rnego pasma Bollingera. Szukaj reakcji przy zwiÄ™kszonej zmiennoÅ›ci.",
    image: "/strategie/bollinger/rules/rule-2-touch.png",
  },
  {
    n: 3,
    title: "SygnaÅ‚ wejÅ›cia",
    text: "WejÅ›cie po zamkniÄ™ciu Å›wiecy sygnaÅ‚owej zgodnej z kierunkiem trendu albo po wybiciu i retescie.",
    image: "/strategie/bollinger/rules/rule-3-entry.png",
  },
  {
    n: 4,
    title: "ZarzÄ…dzanie",
    text: "SL za przeciwnym pasmem lub swingiem. TP 1.2Râ€“1.4R albo przy kolejnym paÅ›mie.",
    image: "/strategie/bollinger/rules/rule-4-manage.png",
  },
  {
    n: 5,
    title: "ZarzÄ…dzaj ryzykiem",
    text: "Ryzykuj maksymalnie 1â€“2% kapitaÅ‚u na jednÄ… transakcjÄ™. Nie zwiÄ™kszaj pozycji po stracie.",
    image: "/strategie/bollinger/rules/rule-5-risk.png",
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
    <div className="rounded-2xl border border-cyan-400/15 bg-[#07182c]/90 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 text-xl">
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
    <div className="grid h-full grid-rows-[38px_170px_38px_1fr] overflow-hidden rounded-2xl border border-cyan-400/10 bg-[#07182c] p-3">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-[11px] font-black">
          {n}
        </span>
      </div>

      <div className="relative mt-1 overflow-hidden rounded-xl border border-cyan-400/15 bg-[#020b18] p-1">
        <img src={image} alt={title} className="h-full w-full object-contain object-center" />
      </div>

      <div className="flex items-center pt-2 text-[11px] font-black uppercase tracking-[.08em] text-cyan-300">
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
        {buy ? "POWRÃ“T LUB WYBICIE W GÃ“RÄ˜" : "POWRÃ“T LUB WYBICIE W DÃ“Å"}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-[#020b18]">
        <img src={image} alt={`${side} Bollinger setup`} className="h-auto w-full object-contain" />
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

export default function BollingerBandsStrategyPage() {
  const checklist = [
    "Trend zgodny z H1",
    "Cena przy dolnym / gÃ³rnym paÅ›mie",
    "Åšwieca sygnaÅ‚owa potwierdzona",
    "Cena wzglÄ™dem SMA 20 potwierdzona",
    "RR minimum 1.2R",
    "SL w logicznym miejscu",
    "ZarzÄ…dzanie pozycjÄ… aktywne",
    "Brak emocji â€” dziaÅ‚am wedÅ‚ug planu",
    "Dziennik transakcji prowadzony",
  ];

  return (
    <main className="min-h-screen bg-[#020916] text-white">
      <div className="mx-auto w-full max-w-[1800px] space-y-4 px-3 py-5 lg:px-5">
        {/* HERO */}
        <section className="overflow-hidden rounded-[24px] border border-cyan-400/20 bg-[#061425] shadow-[0_0_45px_rgba(34,211,238,.07)]">
          <div className="grid xl:grid-cols-[1.1fr_.9fr]">
            <div className="p-5 lg:p-7">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-500/15 text-3xl">
                  â—«
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                      BOLLINGER BANDS
                    </h1>
                    <span className="rounded-full border border-violet-400/30 bg-violet-500/15 px-3 py-1 text-[10px] font-black text-violet-300">
                      PREMIUM
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-amber-400">
                    <span className="text-xl">â˜…â˜…â˜…â˜…â˜…</span>
                    <span className="text-xs text-slate-300">4.8</span>
                  </div>
                </div>
              </div>

              <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-400">
                Wykorzystaj zmiennoÅ›Ä‡ rynku, wybicia i powroty do pasm Bollingera.
                Strategia Å‚Ä…czy Bollinger Bands 20/2, SMA 20 i potwierdzenie Å›wiecy.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <Metric label="SkutecznoÅ›Ä‡" value="84%" icon="ðŸ“Š" />
                <Metric label="InterwaÅ‚y" value="M5 Â· M15 Â· H1" icon="â–¦" />
                <Metric label="RR" value="1.2 â€“ 1.4" icon="ðŸŽ¯" />
                <Metric label="Czas trwania" value="15 min â€“ 4 godz." icon="â—·" />
                <Metric label="Sesje" value="London / NY" icon="ðŸŒ" />
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

            <div className="relative min-h-[300px] overflow-hidden border-t border-cyan-400/10 bg-[#030d1c] xl:border-l xl:border-t-0">
              <img
                src="/strategie/bollinger/bollinger-hero.png"
                alt="Bollinger Bands Strategy"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#061425]/20 to-transparent" />
            </div>
          </div>
        </section>

        {/* RULES */}
        <section className="rounded-[22px] border border-cyan-400/15 bg-[#061425] p-4">
          <h2 className="mb-4 text-[16px] font-black uppercase tracking-[.08em] text-cyan-300">
            Zasady dziaÅ‚ania
          </h2>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 min-[1700px]:grid-cols-5">
            {rules.map((rule) => (
              <RuleCard key={rule.n} {...rule} />
            ))}
          </div>
        </section>

        {/* SETUPS */}
        <section className="rounded-[22px] border border-cyan-400/15 bg-[#061425] p-4">
          <h2 className="mb-4 text-[16px] font-black uppercase tracking-[.08em] text-cyan-300">
            Setupy Bollinger Bands
          </h2>

          <div className="grid gap-4 xl:grid-cols-2">
            <SetupPanel
              side="BUY"
              image="/strategie/bollinger/bollinger-buy.png"
              confirmationImage="/strategie/bollinger/bollinger-buy-confirmation.png"
            />
            <SetupPanel
              side="SELL"
              image="/strategie/bollinger/bollinger-sell.png"
              confirmationImage="/strategie/bollinger/bollinger-sell-confirmation.png"
            />
          </div>
        </section>

        {/* BOTTOM */}
        <section className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-[22px] border border-cyan-400/15 bg-[#061425] p-5">
            <h3 className="text-[14px] font-black uppercase text-cyan-300">
              Mapa przygotowania
            </h3>
            <div className="mt-4 space-y-2">
              {[
                "SprawdÅº trend na H1",
                "Zaznacz poziomy wsparcia / oporu",
                "Dodaj Bollinger Bands (20, 2)",
                "SprawdÅº kierunek SMA 20",
                "OceÅ„ zmiennoÅ›Ä‡ rynku",
                "Poczekaj na dotkniÄ™cie pasma",
                "Szukaj Å›wiecy sygnaÅ‚owej",
                "Zaplanuj wejÅ›cie, SL i TP",
              ].map((x) => (
                <div key={x} className="flex gap-2 text-[11px] text-slate-300">
                  <span className="text-cyan-400">â—</span>
                  {x}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[22px] border border-cyan-400/15 bg-[#061425] p-5">
            <h3 className="text-[14px] font-black uppercase text-cyan-300">
              ZarzÄ…dzanie pozycjÄ…
            </h3>
            <div className="mt-4 space-y-3">
              {[
                ["BE", "Po osiÄ…gniÄ™ciu 1R przenieÅ› SL na Break Even."],
                ["Trailing Stop", "Przesuwaj SL za SMA 20 lub kolejne minima / maksima."],
                ["CzÄ™Å›ciowa realizacja", "Zamknij 50% pozycji przy 1.2R, resztÄ™ prowadÅº do 1.4R."],
                ["ZamkniÄ™cie rÄ™czne", "WyjdÅº przy wybiciu przeciwnego pasma lub silnym odwrÃ³ceniu."],
              ].map(([t, d]) => (
                <div key={t} className="rounded-xl border border-cyan-400/10 bg-[#07182c] p-3">
                  <div className="text-[10px] font-black uppercase text-cyan-300">{t}</div>
                  <div className="mt-1 text-[10px] leading-4 text-slate-400">{d}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[22px] border border-cyan-400/15 bg-[#061425] p-5">
            <h3 className="text-[14px] font-black uppercase text-cyan-300">
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
                  className="grid grid-cols-[48px_1fr_auto] items-center gap-3 rounded-xl border border-cyan-400/10 bg-[#07182c] p-3"
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
        <section className="rounded-[22px] border border-cyan-400/15 bg-[#061425] p-5">
          <h3 className="text-[14px] font-black uppercase text-cyan-300">
            Checklista tradera
          </h3>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {checklist.map((x) => (
              <label key={x} className="flex items-center gap-2 text-[11px] text-slate-300">
                <input type="checkbox" className="h-4 w-4 accent-cyan-500" />
                {x}
              </label>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <section className="rounded-[22px] border border-violet-400/20 bg-[linear-gradient(90deg,#071425,#10142b,#071425)] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-lg font-black uppercase tracking-[.08em] text-violet-300">
                PLAN + DYSCYPLINA + CIERPLIWOÅšÄ† = SUKCES
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                Bollinger Bands pokazuje zmiennoÅ›Ä‡ â€” Ty podejmujesz decyzjÄ™.
              </div>
            </div>

            <Link
              href="/strategie"
              className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-5 py-3 text-[11px] font-black text-cyan-200 transition hover:bg-cyan-500/20"
            >
              â† WrÃ³Ä‡ do strategii
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

