"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Layers3,
  ShieldCheck,
  Target,
} from "lucide-react";

const materials = [{"id": 1, "title": "XAUUSD M5 → M1 Price Action", "subtitle": "Bias z M5, timing na M1 i wejścia zgodne ze strukturą.", "trades": [{"id": 1, "direction": "BUY", "setup": "HH/HL na M5 + reakcja ze strefy", "entry": "Po zamknięciu bullish engulfing M1", "sl": "Pod lokalnym swing low M1", "tp": "TP1 1.5R, TP2 kolejny HH", "result": "+2.2R", "lesson": "Wejście dopiero po potwierdzeniu, bez łapania impulsu.", "image": "/education/przyklady/material-1-trade-1.png"}, {"id": 2, "direction": "SELL", "setup": "LH/LL na M5 + odrzucenie oporu", "entry": "Po bearish rejection M1", "sl": "Nad lokalnym swing high", "tp": "TP1 1.5R, TP2 kolejne LL", "result": "+1.8R", "lesson": "Najważniejsze było utrzymanie kierunku z M5.", "image": "/education/przyklady/material-1-trade-2.png"}, {"id": 3, "direction": "BUY", "setup": "Pullback do strefy popytu", "entry": "Po mocnym zamknięciu świecy nad poziomem", "sl": "Pod knotem reakcyjnym", "tp": "TP1 1.5R, TP2 2.5R", "result": "+2.0R", "lesson": "Nie wchodzić przed zamknięciem świecy potwierdzającej.", "image": "/education/przyklady/material-1-trade-3.png"}]}, {"id": 2, "title": "EURUSD M15 → M5 Trend Continuation", "subtitle": "Kontynuacja trendu po korekcie i potwierdzeniu momentum.", "trades": [{"id": 1, "direction": "SELL", "setup": "LH/LL na M15", "entry": "Bearish engulfing na M5 po retestcie", "sl": "Nad LH", "tp": "TP1 poprzednie LL, TP2 rozszerzenie", "result": "+1.9R", "lesson": "Retest był ważniejszy niż samo wybicie.", "image": "/education/przyklady/material-2-trade-1.png"}, {"id": 2, "direction": "BUY", "setup": "HH/HL na M15", "entry": "Bullish rejection z popytu M5", "sl": "Pod HL", "tp": "TP1 1.6R, TP2 2.2R", "result": "+2.1R", "lesson": "Wejście zgodne z trendem było spokojniejsze.", "image": "/education/przyklady/material-2-trade-2.png"}, {"id": 3, "direction": "SELL", "setup": "Powrót do podaży w trendzie spadkowym", "entry": "Momentum candle M5", "sl": "Nad strefą", "tp": "TP 2R", "result": "+2.0R", "lesson": "Nie skracać TP bez powodu, gdy struktura pozostaje czytelna.", "image": "/education/przyklady/material-2-trade-3.png"}]}, {"id": 3, "title": "XAUUSD Bollinger + Price Action", "subtitle": "Reakcje na zewnętrznych pasmach Bollingera z potwierdzeniem świecowym.", "trades": [{"id": 1, "direction": "BUY", "setup": "Wybicie dolnego pasma BB", "entry": "Hammer + powrót do środka BB", "sl": "Pod knotem hammera", "tp": "TP1 środek BB, TP2 lokalny opór", "result": "+2.0R", "lesson": "Samo dotknięcie pasma nie było sygnałem.", "image": "/education/przyklady/material-3-trade-1.png"}, {"id": 2, "direction": "SELL", "setup": "Wybicie górnego pasma BB", "entry": "Bearish rejection", "sl": "Nad knotem świecy", "tp": "TP1 środek BB, TP2 dolne pasmo", "result": "+1.7R", "lesson": "Najlepsze wejście pojawiło się po powrocie ceny do pasma.", "image": "/education/przyklady/material-3-trade-2.png"}, {"id": 3, "direction": "BUY", "setup": "Rozszerzenie BB po konsolidacji", "entry": "Mocna świeca momentum", "sl": "Pod bazą wybicia", "tp": "TP 2.3R", "result": "+2.3R", "lesson": "Momentum było kluczowym filtrem.", "image": "/education/przyklady/material-3-trade-3.png"}]}, {"id": 4, "title": "GBPUSD M5 Breakout + Retest", "subtitle": "Wybicie struktury i wejście po retestcie zamiast pogoni za ceną.", "trades": [{"id": 1, "direction": "BUY", "setup": "Wybicie lokalnego HH", "entry": "Retest poziomu + bullish close", "sl": "Pod retestem", "tp": "TP 2R", "result": "+2.0R", "lesson": "Retest ograniczył ryzyko wejścia na szczycie.", "image": "/education/przyklady/material-4-trade-1.png"}, {"id": 2, "direction": "SELL", "setup": "Wybicie lokalnego LL", "entry": "Bearish retest", "sl": "Nad retestem", "tp": "TP 1.8R", "result": "+1.8R", "lesson": "Nie każde wybicie wymaga natychmiastowego wejścia.", "image": "/education/przyklady/material-4-trade-2.png"}, {"id": 3, "direction": "BUY", "setup": "Konsolidacja + wybicie górą", "entry": "Powrót do wybitego poziomu", "sl": "Pod konsolidacją", "tp": "TP 2.4R", "result": "+2.4R", "lesson": "Najlepszy setup pojawił się po cierpliwym czekaniu.", "image": "/education/przyklady/material-4-trade-3.png"}]}, {"id": 5, "title": "US30 Opening Momentum", "subtitle": "Scalping momentum na otwarciu z kontrolą zmienności.", "trades": [{"id": 1, "direction": "BUY", "setup": "Impuls po wybiciu high sesji", "entry": "Momentum candle + brak szybkiego odrzucenia", "sl": "Pod świecą sygnałową", "tp": "TP 1.7R", "result": "+1.7R", "lesson": "Na otwarciu mniejszy SL nie zawsze znaczy mniejsze ryzyko.", "image": "/education/przyklady/material-5-trade-1.png"}, {"id": 2, "direction": "SELL", "setup": "Fałszywe wybicie high", "entry": "Mocne odrzucenie i powrót pod poziom", "sl": "Nad knotem", "tp": "TP 2.1R", "result": "+2.1R", "lesson": "False breakout był lepszym sygnałem niż pierwszy impuls.", "image": "/education/przyklady/material-5-trade-2.png"}, {"id": 3, "direction": "BUY", "setup": "Reclaim poziomu po cofnięciu", "entry": "Bullish close nad poziomem", "sl": "Pod swingiem", "tp": "TP 1.9R", "result": "+1.9R", "lesson": "Potwierdzenie po reclaimie ograniczyło FOMO.", "image": "/education/przyklady/material-5-trade-3.png"}]}, {"id": 6, "title": "XAUUSD Liquidity Sweep", "subtitle": "Sweep lokalnych szczytów/dołków i wejście po reakcji.", "trades": [{"id": 1, "direction": "SELL", "setup": "Sweep lokalnego high", "entry": "Bearish rejection po zabraniu płynności", "sl": "Nad knotem sweepu", "tp": "TP 2R", "result": "+2.0R", "lesson": "Sweep bez reakcji nie jest jeszcze setupem.", "image": "/education/przyklady/material-6-trade-1.png"}, {"id": 2, "direction": "BUY", "setup": "Sweep lokalnego low", "entry": "Bullish engulfing", "sl": "Pod knotem sweepu", "tp": "TP 2.2R", "result": "+2.2R", "lesson": "Najlepsze wejście było dopiero po odzyskaniu poziomu.", "image": "/education/przyklady/material-6-trade-2.png"}, {"id": 3, "direction": "SELL", "setup": "Sweep high + powrót pod strefę", "entry": "Momentum candle w dół", "sl": "Nad strefą", "tp": "TP 1.8R", "result": "+1.8R", "lesson": "Reakcja po sweepie potwierdziła kierunek.", "image": "/education/przyklady/material-6-trade-3.png"}]}, {"id": 7, "title": "EURUSD Pullback to EMA", "subtitle": "Powrót do EMA w trendzie i kontynuacja po świecy sygnałowej.", "trades": [{"id": 1, "direction": "BUY", "setup": "Trend wzrostowy + pullback do EMA", "entry": "Bullish rejection", "sl": "Pod HL", "tp": "TP 1.6R", "result": "+1.6R", "lesson": "EMA była filtrem, nie samodzielnym sygnałem.", "image": "/education/przyklady/material-7-trade-1.png"}, {"id": 2, "direction": "SELL", "setup": "Trend spadkowy + pullback do EMA", "entry": "Bearish engulfing", "sl": "Nad LH", "tp": "TP 2R", "result": "+2.0R", "lesson": "Połączenie EMA i struktury poprawiło jakość setupu.", "image": "/education/przyklady/material-7-trade-2.png"}, {"id": 3, "direction": "BUY", "setup": "HL przy EMA + wsparcie", "entry": "Mocne bullish close", "sl": "Pod swingiem", "tp": "TP 2.1R", "result": "+2.1R", "lesson": "Najlepszy sygnał pojawił się przy zbieżności kilku elementów.", "image": "/education/przyklady/material-7-trade-3.png"}]}, {"id": 8, "title": "GBPJPY Momentum + Structure", "subtitle": "Dynamiczne ruchy GBPJPY z filtrem struktury i momentum.", "trades": [{"id": 1, "direction": "SELL", "setup": "LH/LL + impuls spadkowy", "entry": "Bearish momentum candle", "sl": "Nad LH", "tp": "TP 2R", "result": "+2.0R", "lesson": "Momentum bez struktury było pomijane.", "image": "/education/przyklady/material-8-trade-1.png"}, {"id": 2, "direction": "BUY", "setup": "HH/HL po odzyskaniu poziomu", "entry": "Bullish momentum close", "sl": "Pod HL", "tp": "TP 1.8R", "result": "+1.8R", "lesson": "Reclaim poziomu był kluczowym potwierdzeniem.", "image": "/education/przyklady/material-8-trade-2.png"}, {"id": 3, "direction": "SELL", "setup": "Retest wybitego wsparcia", "entry": "Odrzucenie + mocny close", "sl": "Nad retestem", "tp": "TP 2.3R", "result": "+2.3R", "lesson": "Retest dał lepszy RR niż wejście na pierwszym wybiciu.", "image": "/education/przyklady/material-8-trade-3.png"}]}];

export default function PrzykladyPage() {
  const [page, setPage] = useState(1);
  const totalPages = 4;

  const visibleMaterials = useMemo(() => {
    const start = (page - 1) * 2;
    return materials.slice(start, start + 2);
  }, [page]);

  const goToPage = (nextPage: number) => {
    const safePage = Math.min(totalPages, Math.max(1, nextPage));
    setPage(safePage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B4F83] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "linear-gradient(rgba(7,54,92,.48),rgba(7,54,92,.60)),url('/materialy-bonusowe-bg.png')",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[1840px] space-y-4 px-3 py-4 sm:px-5 lg:px-6">
        <header className="rounded-[20px] border border-cyan-300/25 bg-[linear-gradient(135deg,#0C5792,#0A4B7C)] px-5 py-5 shadow-[0_0_34px_rgba(34,211,238,.10)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[.18em] text-cyan-300/70">
                FX TRADE / EDUKACJA / BONUSYY
              </div>
              <h1 className="mt-1 text-3xl font-black sm:text-4xl">PRZYKŁADY TRADE</h1>
              <p className="mt-2 max-w-3xl text-xs leading-5 text-sky-100/65">
                8 materiałów edukacyjnych. Na każdej stronie są 2 materiały po 3 trade — razem 6 czytelnych przykładów.
              </p>
            </div>

            <Link
              href="/education/bonusy"
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-2.5 text-xs font-bold text-cyan-100 hover:bg-cyan-300/15"
            >
              <ArrowLeft className="h-4 w-4" />
              Materiały bonusowe
            </Link>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              [Layers3, "8", "Materiałów"],
              [BarChart3, "24", "Przykłady transakcji"],
              [Target, "3", "Trade w materiale"],
              [ShieldCheck, "4", "Strony"],
            ].map(([Icon, value, label], index) => {
              const StatIcon = Icon as typeof Layers3;
              return (
                <div key={index} className="rounded-xl border border-sky-400/20 bg-[#0B5A95] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <StatIcon className="h-5 w-5 text-cyan-300" />
                    <div>
                      <div className="text-xl font-black">{String(value)}</div>
                      <div className="text-[10px] text-sky-100/45">{String(label)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </header>

        {visibleMaterials.map((material) => (
          <section
            key={material.id}
            className="overflow-hidden rounded-[18px] border border-[#2B8CCC] bg-[#0B548C] shadow-[0_0_28px_rgba(14,165,233,.08)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#126aa7] bg-[#0D5F9B] px-4 py-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[.14em] text-sky-200/70">
                  MATERIAŁ {material.id} / 8
                </div>
                <h2 className="mt-0.5 text-lg font-black sm:text-xl">{material.title}</h2>
                <p className="mt-1 text-xs text-sky-100/50">{material.subtitle}</p>
              </div>
              <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[9px] font-black text-emerald-300">
                3 TRADE
              </span>
            </div>

            <div className="divide-y divide-[#126aa7]">
              {material.trades.map((trade) => (
                <article
                  key={trade.id}
                  className="grid xl:grid-cols-[minmax(0,1.15fr)_minmax(480px,.85fr)]"
                >
                  <div className="border-[#126aa7] p-3 sm:p-4 xl:border-r">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <h3
                        className={`text-base font-black ${
                          trade.direction === "BUY" ? "text-lime-400" : "text-red-400"
                        }`}
                      >
                        {trade.id}. TRADE {trade.id} — {trade.direction}
                      </h3>

                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-black ${
                          trade.direction === "BUY"
                            ? "border-lime-400/30 bg-lime-400/10 text-lime-300"
                            : "border-red-400/30 bg-red-400/10 text-red-300"
                        }`}
                      >
                        {trade.direction}
                      </span>
                    </div>

                    <div className="flex min-h-[260px] items-center justify-center overflow-hidden rounded-xl border border-sky-300/15 bg-[#073B66] p-2">
                      <img
                        src={trade.image}
                        alt={`${material.title} — Trade ${trade.id} ${trade.direction}`}
                        className="block h-auto max-h-[360px] w-full object-contain object-center"
                        loading="lazy"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col justify-center bg-[#0A4A7B] p-4 sm:p-5">
                    <div className="grid gap-2.5">
                      {[
                        ["Setup", trade.setup, "text-cyan-200"],
                        ["Wejście", trade.entry, "text-cyan-200"],
                        ["Stop Loss", trade.sl, "text-red-300"],
                        ["Take Profit", trade.tp, "text-emerald-300"],
                      ].map(([label, value, tone]) => (
                        <div
                          key={label}
                          className="grid grid-cols-[105px_1fr] items-start gap-3 border-b border-sky-300/10 pb-2"
                        >
                          <div className={`text-xs font-black ${tone}`}>{label}:</div>
                          <div className="text-sm font-semibold leading-5 text-sky-50/90">{value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-[140px_1fr] xl:grid-cols-1 2xl:grid-cols-[140px_1fr]">
                      <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/5 p-3">
                        <div className="text-[10px] font-black uppercase tracking-[.12em] text-emerald-300">
                          Wynik
                        </div>
                        <div className="mt-1 text-2xl font-black text-lime-400">{trade.result}</div>
                      </div>

                      <div className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-3">
                        <div className="text-[10px] font-black uppercase tracking-[.12em] text-amber-300">
                          Wniosek
                        </div>
                        <div className="mt-1 text-sm leading-5 text-sky-100/75">{trade.lesson}</div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}

        <div className="rounded-2xl border border-[#126aa7] bg-[#0A4674] p-3">
          <div className="grid items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-300/20 bg-[#062e57] px-4 py-2.5 text-xs font-bold text-sky-100 transition hover:bg-[#126AA7] disabled:cursor-not-allowed disabled:opacity-35 md:justify-self-start"
            >
              <ArrowLeft className="h-4 w-4" />
              Poprzednia strona
            </button>

            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4].map((number) => (
                <button
                  key={number}
                  type="button"
                  onClick={() => goToPage(number)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-black transition ${
                    page === number
                      ? "border-cyan-300 bg-cyan-300/15 text-white shadow-[0_0_15px_rgba(34,211,238,.16)]"
                      : "border-sky-300/20 bg-[#0A4A7B] text-sky-100/70 hover:bg-[#126AA7]"
                  }`}
                >
                  {number}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-300/20 bg-[#062e57] px-4 py-2.5 text-xs font-bold text-sky-100 transition hover:bg-[#126AA7] disabled:cursor-not-allowed disabled:opacity-35 md:justify-self-end"
            >
              Następna strona
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <section className="rounded-2xl border border-amber-300/20 bg-[#0A4674] px-4 py-3">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <p className="text-sm leading-6 text-sky-100/75">
              <span className="font-black text-amber-300">PAMIĘTAJ:</span>{" "}
              Nie wchodzimy w każdy setup. Czekamy na potwierdzenie i zarządzamy ryzykiem w każdym trade.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
