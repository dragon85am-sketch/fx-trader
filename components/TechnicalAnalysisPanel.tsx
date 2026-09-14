"use client";

import React, { useMemo, useState } from "react";

type Lang = "pl" | "en" | "de" | "nl" | "es";
type Signal = "BUY" | "SELL" | "NEUTRAL";

type TechnicalInstrument = {
  symbol: string;
  name: string;
  flag: string;
  price: string;
  change: string;
  score: number;
  bias: "BULLISH" | "BEARISH" | "NEUTRAL";
  strength: "STRONG" | "MODERATE" | "WEAK";
  adx: number;
  diPlus: number;
  diMinus: number;
  support: string;
  resistance: string;
  breakAbove: string;
  movingAverages: Array<{ period: string; simple: string; exponential: string; signal: Signal }>;
  oscillators: Array<{ period: string; rsi: string; stochastic: string; rsiSignal: Signal; stochasticSignal: Signal }>;
  pivots: Array<{ level: string; classic: string; woodie: string; fibonacci: string }>;
};

const DATA: Record<string, TechnicalInstrument> = {
  GBPCHF: {
    symbol: "GBPCHF", name: "British Pound / Swiss Franc", flag: "🇬🇧 🇨🇭", price: "1.06777", change: "+0.00126 (+0.12%)",
    score: 57, bias: "BULLISH", strength: "MODERATE", adx: 28.4, diPlus: 23.1, diMinus: 18.6,
    support: "1.0665", resistance: "1.0707", breakAbove: "1.0685",
    movingAverages: [
      { period: "10", simple: "1.0678", exponential: "1.0678", signal: "BUY" },
      { period: "20", simple: "1.0676", exponential: "1.0677", signal: "BUY" },
      { period: "50", simple: "1.0674", exponential: "1.0671", signal: "SELL" },
      { period: "100", simple: "1.0667", exponential: "1.0647", signal: "BUY" },
    ],
    oscillators: [
      { period: "10", rsi: "58.6", stochastic: "79.3", rsiSignal: "BUY", stochasticSignal: "BUY" },
      { period: "20", rsi: "59.0", stochastic: "80.1", rsiSignal: "SELL", stochasticSignal: "BUY" },
      { period: "50", rsi: "57.9", stochastic: "72.2", rsiSignal: "NEUTRAL", stochasticSignal: "BUY" },
      { period: "100", rsi: "53.7", stochastic: "96.0", rsiSignal: "BUY", stochasticSignal: "BUY" },
    ],
    pivots: [
      { level: "R3", classic: "1.0707", woodie: "1.0701", fibonacci: "1.0714" },
      { level: "R2", classic: "1.0687", woodie: "1.0697", fibonacci: "1.0699" },
      { level: "R1", classic: "1.0682", woodie: "1.0664", fibonacci: "1.0687" },
      { level: "PP", classic: "1.0670", woodie: "1.0665", fibonacci: "1.0666" },
      { level: "S1", classic: "1.0630", woodie: "1.0667", fibonacci: "1.0649" },
      { level: "S2", classic: "1.0643", woodie: "1.0644", fibonacci: "1.0644" },
      { level: "S3", classic: "1.0628", woodie: "1.0624", fibonacci: "1.0633" },
    ],
  },
  EURUSD: {
    symbol: "EURUSD", name: "Euro / US Dollar", flag: "🇪🇺 🇺🇸", price: "1.18420", change: "+0.00084 (+0.07%)",
    score: 64, bias: "BULLISH", strength: "MODERATE", adx: 31.2, diPlus: 25.6, diMinus: 17.4,
    support: "1.1818", resistance: "1.1874", breakAbove: "1.1855",
    movingAverages: [
      { period: "10", simple: "1.1839", exponential: "1.1841", signal: "BUY" },
      { period: "20", simple: "1.1835", exponential: "1.1837", signal: "BUY" },
      { period: "50", simple: "1.1828", exponential: "1.1829", signal: "BUY" },
      { period: "100", simple: "1.1819", exponential: "1.1816", signal: "BUY" },
    ],
    oscillators: [
      { period: "10", rsi: "61.2", stochastic: "76.8", rsiSignal: "BUY", stochasticSignal: "BUY" },
      { period: "20", rsi: "58.7", stochastic: "71.4", rsiSignal: "BUY", stochasticSignal: "BUY" },
      { period: "50", rsi: "55.9", stochastic: "68.2", rsiSignal: "BUY", stochasticSignal: "NEUTRAL" },
      { period: "100", rsi: "53.2", stochastic: "63.5", rsiSignal: "NEUTRAL", stochasticSignal: "NEUTRAL" },
    ],
    pivots: [
      { level: "R3", classic: "1.1900", woodie: "1.1895", fibonacci: "1.1908" },
      { level: "R2", classic: "1.1874", woodie: "1.1879", fibonacci: "1.1882" },
      { level: "R1", classic: "1.1857", woodie: "1.1859", fibonacci: "1.1861" },
      { level: "PP", classic: "1.1838", woodie: "1.1839", fibonacci: "1.1838" },
      { level: "S1", classic: "1.1818", woodie: "1.1819", fibonacci: "1.1816" },
      { level: "S2", classic: "1.1799", woodie: "1.1801", fibonacci: "1.1795" },
      { level: "S3", classic: "1.1776", woodie: "1.1778", fibonacci: "1.1769" },
    ],
  },
  XAUUSD: {
    symbol: "XAUUSD", name: "Gold / US Dollar", flag: "🥇 🇺🇸", price: "3652.40", change: "+8.60 (+0.24%)",
    score: 71, bias: "BULLISH", strength: "STRONG", adx: 34.8, diPlus: 29.3, diMinus: 15.1,
    support: "3638.20", resistance: "3668.50", breakAbove: "3658.00",
    movingAverages: [
      { period: "10", simple: "3649.2", exponential: "3650.1", signal: "BUY" },
      { period: "20", simple: "3645.6", exponential: "3647.0", signal: "BUY" },
      { period: "50", simple: "3638.4", exponential: "3640.3", signal: "BUY" },
      { period: "100", simple: "3624.1", exponential: "3628.7", signal: "BUY" },
    ],
    oscillators: [
      { period: "10", rsi: "64.8", stochastic: "82.4", rsiSignal: "BUY", stochasticSignal: "SELL" },
      { period: "20", rsi: "61.7", stochastic: "77.2", rsiSignal: "BUY", stochasticSignal: "BUY" },
      { period: "50", rsi: "58.4", stochastic: "69.8", rsiSignal: "BUY", stochasticSignal: "BUY" },
      { period: "100", rsi: "55.1", stochastic: "62.9", rsiSignal: "NEUTRAL", stochasticSignal: "BUY" },
    ],
    pivots: [
      { level: "R3", classic: "3688.4", woodie: "3686.9", fibonacci: "3691.2" },
      { level: "R2", classic: "3678.1", woodie: "3676.4", fibonacci: "3681.6" },
      { level: "R1", classic: "3668.5", woodie: "3667.2", fibonacci: "3671.0" },
      { level: "PP", classic: "3653.1", woodie: "3652.4", fibonacci: "3653.1" },
      { level: "S1", classic: "3638.2", woodie: "3639.1", fibonacci: "3635.2" },
      { level: "S2", classic: "3628.0", woodie: "3629.4", fibonacci: "3624.6" },
      { level: "S3", classic: "3616.7", woodie: "3618.2", fibonacci: "3615.0" },
    ],
  },
};

const I18N = {
  pl: { title: "Technical Analysis", subtitle: "Analiza techniczna instrumentu w jednym panelu", instrument: "Instrument", timeframe: "Interwał", indicators: "Wskaźniki", load: "Załaduj analizę", favorites: "Ulubione", score: "TA Score", buy: "Kupno", sell: "Sprzedaż", moving: "Średnie kroczące", period: "Okres", simple: "Prosta", exponential: "Wykładnicza", signal: "Sygnał", oscillators: "Oscylatory", stochastic: "Stochastic", trend: "Sygnał trendu", direction: "Kierunek", strength: "Siła", uptrend: "TREND WZROSTOWY", downtrend: "TREND SPADKOWY", break: "Wybicie powyżej", pivot: "Punkty Pivot", overall: "Ogólny bias", key: "Kluczowe poziomy", support: "Wsparcie", resistance: "Opór", technical: "TECHNICAL", moderate: "UMIARKOWANA", strong: "SILNA", weak: "SŁABA", liveNote: "Snapshot techniczny — podłącz do live feed, aby używać danych czasu rzeczywistego." },
  en: { title: "Technical Analysis", subtitle: "Technical instrument analysis in one panel", instrument: "Instrument", timeframe: "Timeframe", indicators: "Indicators", load: "Load Analysis", favorites: "Favorites", score: "TA Score", buy: "Buy", sell: "Sell", moving: "Moving Averages", period: "Period", simple: "Simple", exponential: "Exponential", signal: "Signal", oscillators: "Oscillators", stochastic: "Stochastic", trend: "Trend Signal", direction: "Direction", strength: "Strength", uptrend: "UPTREND", downtrend: "DOWNTREND", break: "Break above", pivot: "Pivot Points", overall: "Overall Bias", key: "Key Levels", support: "Support", resistance: "Resistance", technical: "TECHNICAL", moderate: "MODERATE", strong: "STRONG", weak: "WEAK", liveNote: "Technical snapshot — connect to your live feed for real-time values." },
  de: { title: "Technische Analyse", subtitle: "Technische Instrumentenanalyse in einem Panel", instrument: "Instrument", timeframe: "Zeitrahmen", indicators: "Indikatoren", load: "Analyse laden", favorites: "Favoriten", score: "TA Score", buy: "Kaufen", sell: "Verkaufen", moving: "Gleitende Durchschnitte", period: "Periode", simple: "Einfach", exponential: "Exponentiell", signal: "Signal", oscillators: "Oszillatoren", stochastic: "Stochastic", trend: "Trendsignal", direction: "Richtung", strength: "Stärke", uptrend: "AUFWÄRTSTREND", downtrend: "ABWÄRTSTREND", break: "Ausbruch über", pivot: "Pivot-Punkte", overall: "Gesamtbias", key: "Schlüsselniveaus", support: "Unterstützung", resistance: "Widerstand", technical: "TECHNISCH", moderate: "MODERAT", strong: "STARK", weak: "SCHWACH", liveNote: "Technischer Snapshot — für Echtzeitwerte an Live-Feed anbinden." },
  nl: { title: "Technische Analyse", subtitle: "Technische instrumentanalyse in één paneel", instrument: "Instrument", timeframe: "Tijdsframe", indicators: "Indicatoren", load: "Analyse laden", favorites: "Favorieten", score: "TA Score", buy: "Kopen", sell: "Verkopen", moving: "Moving Averages", period: "Periode", simple: "Simpel", exponential: "Exponentieel", signal: "Signaal", oscillators: "Oscillatoren", stochastic: "Stochastic", trend: "Trendsignaal", direction: "Richting", strength: "Sterkte", uptrend: "OPWAARTSE TREND", downtrend: "NEERWAARTSE TREND", break: "Uitbraak boven", pivot: "Pivot Points", overall: "Algemene bias", key: "Belangrijke niveaus", support: "Steun", resistance: "Weerstand", technical: "TECHNISCH", moderate: "GEMIDDELD", strong: "STERK", weak: "ZWAK", liveNote: "Technische snapshot — koppel aan live feed voor realtime waarden." },
  es: { title: "Análisis Técnico", subtitle: "Análisis técnico del instrumento en un solo panel", instrument: "Instrumento", timeframe: "Temporalidad", indicators: "Indicadores", load: "Cargar análisis", favorites: "Favoritos", score: "TA Score", buy: "Compra", sell: "Venta", moving: "Medias móviles", period: "Periodo", simple: "Simple", exponential: "Exponencial", signal: "Señal", oscillators: "Osciladores", stochastic: "Estocástico", trend: "Señal de tendencia", direction: "Dirección", strength: "Fuerza", uptrend: "TENDENCIA ALCISTA", downtrend: "TENDENCIA BAJISTA", break: "Ruptura por encima de", pivot: "Puntos Pivot", overall: "Sesgo general", key: "Niveles clave", support: "Soporte", resistance: "Resistencia", technical: "TÉCNICO", moderate: "MODERADA", strong: "FUERTE", weak: "DÉBIL", liveNote: "Snapshot técnico — conecta el live feed para valores en tiempo real." },
} as const;

function getLang(): Lang {
  if (typeof window === "undefined") return "pl";
  const raw = (localStorage.getItem("fxtrade-language") || localStorage.getItem("lang") || document.documentElement.lang || "pl").toLowerCase();
  return (["pl", "en", "de", "nl", "es"] as Lang[]).includes(raw as Lang) ? (raw as Lang) : "pl";
}

function SignalBadge({ value }: { value: Signal }) {
  const classes = value === "BUY" ? "bg-emerald-500 text-white" : value === "SELL" ? "bg-rose-500 text-white" : "bg-sky-500 text-white";
  return <span className={`inline-flex min-w-[66px] justify-center rounded px-2 py-1 text-[10px] font-bold ${classes}`}>{value}</span>;
}

export default function TechnicalAnalysisPanel() {
  const [symbol, setSymbol] = useState("GBPCHF");
  const [timeframe, setTimeframe] = useState("M5");
  const [lang, setLang] = useState<Lang>("pl");

  React.useEffect(() => {
    const sync = () => setLang(getLang());
    sync();
    window.addEventListener("fxtrade-language-change", sync as EventListener);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("fxtrade-language-change", sync as EventListener);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const t = I18N[lang];
  const item = DATA[symbol] ?? DATA.GBPCHF;
  const scoreRotation = useMemo(() => Math.max(0, Math.min(100, item.score)), [item.score]);
  const strengthLabel = item.strength === "STRONG" ? t.strong : item.strength === "WEAK" ? t.weak : t.moderate;

  return (
    <div className="space-y-4">
      <div className="rounded-[18px] border border-cyan-400/25 bg-[linear-gradient(135deg,#07192b,#082947)] p-4 shadow-[0_0_28px_rgba(34,211,238,.08)]">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.22em] text-cyan-300/75">FX TRADE • {t.technical}</div>
            <h2 className="mt-1 text-[22px] font-black text-white">{t.title}</h2>
            <p className="mt-1 text-[11px] text-sky-100/50">{t.subtitle}</p>
          </div>
          <div className="rounded-full border border-amber-300/25 bg-amber-300/5 px-3 py-1.5 text-[9px] text-amber-100/70">{t.liveNote}</div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.1fr_.55fr_1.15fr_auto]">
          <label className="space-y-1.5">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-sky-100/45">{t.instrument}</span>
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="h-11 w-full rounded-xl border border-cyan-300/15 bg-[#06182a] px-3 text-[12px] font-bold text-white outline-none">
              {Object.values(DATA).map((row) => <option key={row.symbol} value={row.symbol}>{row.flag} {row.symbol}</option>)}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-sky-100/45">{t.timeframe}</span>
            <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className="h-11 w-full rounded-xl border border-cyan-300/15 bg-[#06182a] px-3 text-[12px] font-bold text-white outline-none">
              {["M1","M5","M15","M30","H1","H4","D1"].map((tf) => <option key={tf}>{tf}</option>)}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-sky-100/45">{t.indicators}</span>
            <div className="flex h-11 items-center rounded-xl border border-cyan-300/15 bg-[#06182a] px-3 text-[11px] font-semibold text-sky-50">Default (EMA + RSI + CCI)</div>
          </label>
          <button type="button" className="mt-auto h-11 rounded-xl bg-blue-600 px-5 text-[11px] font-black text-white shadow-[0_8px_24px_rgba(37,99,235,.28)] transition hover:bg-blue-500">⌕ {t.load}</button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[9px] text-sky-100/40">{t.favorites}:</span>
          {["EURUSD","GBPUSD","USDJPY","XAUUSD","GBPCHF","USDCAD","AUDUSD"].map((fav) => (
            <button key={fav} type="button" onClick={() => DATA[fav] && setSymbol(fav)} className={`rounded-lg border px-3 py-1.5 text-[9px] font-semibold transition ${symbol === fav ? "border-blue-400/70 bg-blue-500/30 text-white" : "border-cyan-300/10 bg-[#071c31] text-sky-100/55 hover:border-cyan-300/30"}`}>{fav}</button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-4">
          <div className="rounded-[16px] border border-cyan-300/15 bg-[#07192b] p-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{item.flag}</div>
              <div>
                <div className="flex items-center gap-2"><h3 className="text-[18px] font-black">{item.symbol}</h3><span className="rounded bg-white/5 px-2 py-1 text-[9px] text-sky-100/55">{timeframe}</span></div>
                <div className="text-[9px] text-sky-100/40">{item.name}</div>
              </div>
            </div>
            <div className="mt-4 flex items-end gap-4"><div className="text-[31px] font-black tracking-tight">{item.price}</div><div className="pb-1 text-[13px] font-bold text-emerald-300">{item.change}</div></div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[16px] border border-cyan-300/15 bg-[#07192b] p-4">
              <div className="mb-3 flex items-center justify-between"><h3 className="text-[14px] font-bold">〽 {t.moving}</h3><span className="text-sky-300/60">⚙</span></div>
              <div className="grid grid-cols-4 gap-2 border-b border-white/5 pb-2 text-[9px] uppercase text-sky-100/40"><span>{t.period}</span><span>{t.simple}</span><span>{t.exponential}</span><span>{t.signal}</span></div>
              <div className="divide-y divide-white/5">
                {item.movingAverages.map((row) => <div key={row.period} className="grid grid-cols-4 items-center gap-2 py-2 text-[10px]"><span>{row.period}</span><span>{row.simple}</span><span>{row.exponential}</span><SignalBadge value={row.signal}/></div>)}
              </div>
            </div>

            <div className="rounded-[16px] border border-cyan-300/15 bg-[#07192b] p-4">
              <div className="mb-3 flex items-center justify-between"><h3 className="text-[14px] font-bold">◉ {t.oscillators}</h3><span className="text-sky-300/60">⚙</span></div>
              <div className="grid grid-cols-5 gap-2 border-b border-white/5 pb-2 text-[9px] uppercase text-sky-100/40"><span>{t.period}</span><span>RSI</span><span>{t.stochastic}</span><span>RSI</span><span>{t.signal}</span></div>
              <div className="divide-y divide-white/5">
                {item.oscillators.map((row) => <div key={row.period} className="grid grid-cols-5 items-center gap-2 py-2 text-[10px]"><span>{row.period}</span><span>{row.rsi}</span><span>{row.stochastic}</span><SignalBadge value={row.rsiSignal}/><SignalBadge value={row.stochasticSignal}/></div>)}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[16px] border border-cyan-300/15 bg-[#07192b] p-4"><div className="text-[11px] text-sky-100/45">◉ {t.overall}</div><div className={`mt-3 text-[23px] font-black ${item.bias === "BULLISH" ? "text-emerald-300" : item.bias === "BEARISH" ? "text-rose-300" : "text-sky-300"}`}>{item.bias}</div></div>
            <div className="rounded-[16px] border border-cyan-300/15 bg-[#07192b] p-4"><div className="text-[11px] text-sky-100/45">▥ {t.strength}</div><div className="mt-3 inline-flex rounded bg-amber-400/15 px-3 py-1 text-[12px] font-black text-amber-300">{strengthLabel}</div><div className="mt-3 flex gap-1">{Array.from({length:5}).map((_,i)=><span key={i} className={`h-2 w-7 rounded-sm ${i < Math.ceil(item.score/20) ? "bg-amber-400" : "bg-white/10"}`}/>)}</div></div>
            <div className="rounded-[16px] border border-cyan-300/15 bg-[#07192b] p-4"><div className="text-[11px] text-sky-100/45">⌖ {t.key}</div><div className="mt-3 space-y-2 text-[11px]"><div className="flex justify-between"><span>{t.support}</span><b className="text-emerald-300">{item.support}</b></div><div className="flex justify-between"><span>{t.resistance}</span><b className="text-rose-300">{item.resistance}</b></div></div></div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <div className="rounded-[16px] border border-cyan-300/15 bg-[#07192b] p-4">
              <div className="text-[13px] font-bold">{t.score}</div>
              <div className="mt-4 flex justify-center">
                <div className="relative h-32 w-56 overflow-hidden">
                  <div className="absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 rounded-full" style={{background:`conic-gradient(from 270deg, #10b981 0deg ${scoreRotation*1.8}deg, #f59e0b ${scoreRotation*1.8}deg 180deg, transparent 180deg 360deg)`}} />
                  <div className="absolute left-1/2 top-7 h-36 w-36 -translate-x-1/2 rounded-full bg-[#07192b]" />
                  <div className="absolute inset-x-0 top-16 text-center text-[30px] font-black">{item.score}%</div>
                  <div className="absolute bottom-1 left-2 text-[9px] text-emerald-300">{t.buy}</div><div className="absolute bottom-1 right-2 text-[9px] text-rose-300">{t.sell}</div>
                </div>
              </div>
            </div>

            <div className="rounded-[16px] border border-cyan-300/15 bg-[#07192b] p-4">
              <h3 className="text-[14px] font-bold">▱ {t.trend}</h3>
              <div className="mt-4 space-y-3 text-[11px]"><div className="flex justify-between"><span className="text-sky-100/45">{t.direction}</span><b className={item.bias === "BEARISH" ? "text-rose-300" : "text-emerald-300"}>{item.bias === "BEARISH" ? t.downtrend : t.uptrend} ↗</b></div><div className="flex justify-between"><span className="text-sky-100/45">{t.strength}</span><b className="text-amber-300">▥ {strengthLabel}</b></div><div className="flex justify-between"><span className="text-sky-100/45">ADX (14)</span><b>{item.adx.toFixed(1)}</b></div><div className="flex justify-between"><span className="text-sky-100/45">+DI / -DI</span><b>{item.diPlus.toFixed(1)} / {item.diMinus.toFixed(1)}</b></div></div>
              <div className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/5 p-3 text-[10px] text-amber-100/75">💡 {t.break} <b className="text-amber-300">{item.breakAbove}</b></div>
            </div>
          </div>

          <div className="rounded-[16px] border border-cyan-300/15 bg-[#07192b] p-4">
            <h3 className="mb-3 text-[14px] font-bold">▰ {t.pivot}</h3>
            <div className="grid grid-cols-4 gap-2 border-b border-white/5 pb-2 text-[9px] uppercase text-sky-100/40"><span>Level</span><span>Classic</span><span>Woodie</span><span>Fibonacci</span></div>
            <div className="divide-y divide-white/5">{item.pivots.map((row)=><div key={row.level} className="grid grid-cols-4 gap-2 py-2 text-[10px]"><b>{row.level}</b><span className={row.level === "R2" ? "font-bold text-amber-300" : ""}>{row.classic}</span><span>{row.woodie}</span><span>{row.fibonacci}</span></div>)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
