"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

type Lang = "pl" | "en" | "de" | "nl" | "es";
type Signal = "BUY" | "SELL" | "NEUTRAL";
type Bias = "BULLISH" | "BEARISH" | "NEUTRAL";
type Strength = "STRONG" | "MODERATE" | "WEAK";

type Candle = {
  datetime?: string;
  time?: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

type PivotRow = { level: string; classic: number; woodie: number; fibonacci: number };
type MovingRow = { period: number; simple: number; exponential: number; signal: Signal };
type OscRow = { period: number; rsi: number; stochastic: number; rsiSignal: Signal; stochasticSignal: Signal };

type LiveAnalysis = {
  price: number;
  change: number;
  changePct: number;
  score: number;
  bias: Bias;
  strength: Strength;
  adx: number;
  diPlus: number;
  diMinus: number;
  support: number;
  resistance: number;
  breakAbove: number;
  movingAverages: MovingRow[];
  oscillators: OscRow[];
  pivots: PivotRow[];
  updatedAt: Date;
};

const INSTRUMENTS = [
  { symbol: "GBPCHF", api: "GBP/CHF", name: "British Pound / Swiss Franc", flag: "🇬🇧 🇨🇭" },
  { symbol: "EURUSD", api: "EUR/USD", name: "Euro / US Dollar", flag: "🇪🇺 🇺🇸" },
  { symbol: "GBPUSD", api: "GBP/USD", name: "British Pound / US Dollar", flag: "🇬🇧 🇺🇸" },
  { symbol: "USDJPY", api: "USD/JPY", name: "US Dollar / Japanese Yen", flag: "🇺🇸 🇯🇵" },
  { symbol: "XAUUSD", api: "XAU/USD", name: "Gold / US Dollar", flag: "🥇 🇺🇸" },
  { symbol: "US30", api: "DJI", name: "Dow Jones Industrial Average", flag: "🇺🇸" },
  { symbol: "USDCAD", api: "USD/CAD", name: "US Dollar / Canadian Dollar", flag: "🇺🇸 🇨🇦" },
  { symbol: "AUDUSD", api: "AUD/USD", name: "Australian Dollar / US Dollar", flag: "🇦🇺 🇺🇸" },
  { symbol: "BTCUSD", api: "BTC/USD", name: "Bitcoin / US Dollar", flag: "₿ 🇺🇸" },
] as const;

const TF_MAP: Record<string, string> = {
  M1: "1min",
  M5: "5min",
  M15: "15min",
  M30: "30min",
  H1: "1h",
  H4: "4h",
  D1: "1day",
};

const I18N = {
  pl: { title: "Technical Analysis", subtitle: "Analiza techniczna liczona automatycznie z danych rynkowych", instrument: "Instrument", timeframe: "Interwał", indicators: "Wskaźniki", load: "Odśwież analizę", favorites: "Ulubione", score: "TA Score", buy: "Kupno", sell: "Sprzedaż", moving: "Średnie kroczące", period: "Okres", simple: "Prosta", exponential: "Wykładnicza", signal: "Sygnał", oscillators: "Oscylatory", stochastic: "Stochastic", trend: "Sygnał trendu", direction: "Kierunek", strength: "Siła", uptrend: "TREND WZROSTOWY", downtrend: "TREND SPADKOWY", neutral: "NEUTRALNY", break: "Wybicie powyżej", pivot: "Punkty Pivot", overall: "Ogólny bias", key: "Kluczowe poziomy", support: "Wsparcie", resistance: "Opór", technical: "TECHNICAL", moderate: "UMIARKOWANA", strong: "SILNA", weak: "SŁABA", live: "DANE LIVE", updated: "Aktualizacja", loading: "Pobieranie danych...", error: "Nie udało się pobrać danych live.", apiHint: "Sprawdź TWELVE_DATA_API_KEY w Vercel oraz dostępność instrumentu w planie Twelve Data." },
  en: { title: "Technical Analysis", subtitle: "Technical analysis calculated automatically from market data", instrument: "Instrument", timeframe: "Timeframe", indicators: "Indicators", load: "Refresh Analysis", favorites: "Favorites", score: "TA Score", buy: "Buy", sell: "Sell", moving: "Moving Averages", period: "Period", simple: "Simple", exponential: "Exponential", signal: "Signal", oscillators: "Oscillators", stochastic: "Stochastic", trend: "Trend Signal", direction: "Direction", strength: "Strength", uptrend: "UPTREND", downtrend: "DOWNTREND", neutral: "NEUTRAL", break: "Break above", pivot: "Pivot Points", overall: "Overall Bias", key: "Key Levels", support: "Support", resistance: "Resistance", technical: "TECHNICAL", moderate: "MODERATE", strong: "STRONG", weak: "WEAK", live: "LIVE DATA", updated: "Updated", loading: "Loading market data...", error: "Could not load live data.", apiHint: "Check TWELVE_DATA_API_KEY in Vercel and whether your Twelve Data plan supports this instrument." },
  de: { title: "Technische Analyse", subtitle: "Automatisch aus Marktdaten berechnete technische Analyse", instrument: "Instrument", timeframe: "Zeitrahmen", indicators: "Indikatoren", load: "Analyse aktualisieren", favorites: "Favoriten", score: "TA Score", buy: "Kaufen", sell: "Verkaufen", moving: "Gleitende Durchschnitte", period: "Periode", simple: "Einfach", exponential: "Exponentiell", signal: "Signal", oscillators: "Oszillatoren", stochastic: "Stochastic", trend: "Trendsignal", direction: "Richtung", strength: "Stärke", uptrend: "AUFWÄRTSTREND", downtrend: "ABWÄRTSTREND", neutral: "NEUTRAL", break: "Ausbruch über", pivot: "Pivot-Punkte", overall: "Gesamtbias", key: "Schlüsselniveaus", support: "Unterstützung", resistance: "Widerstand", technical: "TECHNISCH", moderate: "MODERAT", strong: "STARK", weak: "SCHWACH", live: "LIVE-DATEN", updated: "Aktualisiert", loading: "Marktdaten werden geladen...", error: "Live-Daten konnten nicht geladen werden.", apiHint: "Prüfe TWELVE_DATA_API_KEY in Vercel und die Verfügbarkeit des Instruments im Twelve-Data-Tarif." },
  nl: { title: "Technische Analyse", subtitle: "Technische analyse automatisch berekend uit marktdata", instrument: "Instrument", timeframe: "Tijdsframe", indicators: "Indicatoren", load: "Analyse vernieuwen", favorites: "Favorieten", score: "TA Score", buy: "Kopen", sell: "Verkopen", moving: "Moving Averages", period: "Periode", simple: "Simpel", exponential: "Exponentieel", signal: "Signaal", oscillators: "Oscillatoren", stochastic: "Stochastic", trend: "Trendsignaal", direction: "Richting", strength: "Sterkte", uptrend: "OPWAARTSE TREND", downtrend: "NEERWAARTSE TREND", neutral: "NEUTRAAL", break: "Uitbraak boven", pivot: "Pivot Points", overall: "Algemene bias", key: "Belangrijke niveaus", support: "Steun", resistance: "Weerstand", technical: "TECHNISCH", moderate: "GEMIDDELD", strong: "STERK", weak: "ZWAK", live: "LIVE DATA", updated: "Bijgewerkt", loading: "Marktdata laden...", error: "Live data kon niet worden geladen.", apiHint: "Controleer TWELVE_DATA_API_KEY in Vercel en of je Twelve Data-plan dit instrument ondersteunt." },
  es: { title: "Análisis Técnico", subtitle: "Análisis técnico calculado automáticamente con datos de mercado", instrument: "Instrumento", timeframe: "Temporalidad", indicators: "Indicadores", load: "Actualizar análisis", favorites: "Favoritos", score: "TA Score", buy: "Compra", sell: "Venta", moving: "Medias móviles", period: "Periodo", simple: "Simple", exponential: "Exponencial", signal: "Señal", oscillators: "Osciladores", stochastic: "Estocástico", trend: "Señal de tendencia", direction: "Dirección", strength: "Fuerza", uptrend: "TENDENCIA ALCISTA", downtrend: "TENDENCIA BAJISTA", neutral: "NEUTRAL", break: "Ruptura por encima de", pivot: "Puntos Pivot", overall: "Sesgo general", key: "Niveles clave", support: "Soporte", resistance: "Resistencia", technical: "TÉCNICO", moderate: "MODERADA", strong: "FUERTE", weak: "DÉBIL", live: "DATOS LIVE", updated: "Actualizado", loading: "Cargando datos...", error: "No se pudieron cargar los datos live.", apiHint: "Comprueba TWELVE_DATA_API_KEY en Vercel y la disponibilidad del instrumento en tu plan de Twelve Data." },
} as const;

function getLang(): Lang {
  if (typeof window === "undefined") return "pl";
  const raw = localStorage.getItem("fxtrade_language") || localStorage.getItem("language") || document.documentElement.lang || "pl";
  return (["pl", "en", "de", "nl", "es"] as Lang[]).includes(raw as Lang) ? (raw as Lang) : "pl";
}

function round(value: number, digits = 5) {
  if (!Number.isFinite(value)) return 0;
  const m = 10 ** digits;
  return Math.round(value * m) / m;
}

function sma(values: number[], period: number) {
  if (values.length < period) return NaN;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function ema(values: number[], period: number) {
  if (values.length < period) return NaN;
  const k = 2 / (period + 1);
  let result = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < values.length; i += 1) result = values[i] * k + result * (1 - k);
  return result;
}

function rsi(values: number[], period: number) {
  if (values.length <= period) return NaN;
  const start = Math.max(1, values.length - period);
  let gains = 0;
  let losses = 0;
  let count = 0;
  for (let i = start; i < values.length; i += 1) {
    const diff = values[i] - values[i - 1];
    if (diff > 0) gains += diff;
    else losses += -diff;
    count += 1;
  }
  if (!count) return NaN;
  const avgGain = gains / count;
  const avgLoss = losses / count;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function stochastic(candles: Candle[], period: number) {
  if (candles.length < period) return NaN;
  const slice = candles.slice(-period);
  const highest = Math.max(...slice.map((c) => c.high));
  const lowest = Math.min(...slice.map((c) => c.low));
  const close = slice[slice.length - 1].close;
  if (highest === lowest) return 50;
  return ((close - lowest) / (highest - lowest)) * 100;
}

function adx(candles: Candle[], period = 14) {
  if (candles.length < period * 2 + 1) return { adx: NaN, diPlus: NaN, diMinus: NaN };
  const tr: number[] = [];
  const plusDM: number[] = [];
  const minusDM: number[] = [];
  for (let i = 1; i < candles.length; i += 1) {
    const c = candles[i];
    const p = candles[i - 1];
    tr.push(Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close)));
    const up = c.high - p.high;
    const down = p.low - c.low;
    plusDM.push(up > down && up > 0 ? up : 0);
    minusDM.push(down > up && down > 0 ? down : 0);
  }
  const dx: number[] = [];
  let lastPlus = 0;
  let lastMinus = 0;
  for (let i = period - 1; i < tr.length; i += 1) {
    const trSum = tr.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    const plusSum = plusDM.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    const minusSum = minusDM.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    const diP = trSum ? (100 * plusSum) / trSum : 0;
    const diM = trSum ? (100 * minusSum) / trSum : 0;
    const denom = diP + diM;
    dx.push(denom ? (100 * Math.abs(diP - diM)) / denom : 0);
    lastPlus = diP;
    lastMinus = diM;
  }
  const lastDx = dx.slice(-period);
  return {
    adx: lastDx.length ? lastDx.reduce((a, b) => a + b, 0) / lastDx.length : NaN,
    diPlus: lastPlus,
    diMinus: lastMinus,
  };
}

function classicPivot(h: number, l: number, c: number) {
  const p = (h + l + c) / 3;
  return { p, r1: 2 * p - l, s1: 2 * p - h, r2: p + (h - l), s2: p - (h - l), r3: h + 2 * (p - l), s3: l - 2 * (h - p) };
}

function woodiePivot(h: number, l: number, c: number) {
  const p = (h + l + 2 * c) / 4;
  return { p, r1: 2 * p - l, s1: 2 * p - h, r2: p + (h - l), s2: p - (h - l), r3: h + 2 * (p - l), s3: l - 2 * (h - p) };
}

function fibonacciPivot(h: number, l: number, c: number) {
  const p = (h + l + c) / 3;
  const d = h - l;
  return { p, r1: p + d * 0.382, s1: p - d * 0.382, r2: p + d * 0.618, s2: p - d * 0.618, r3: p + d, s3: p - d };
}

function signalFromRsi(value: number): Signal {
  if (value >= 55 && value <= 72) return "BUY";
  if (value <= 45 && value >= 28) return "SELL";
  return "NEUTRAL";
}

function signalFromStoch(value: number): Signal {
  if (value <= 20) return "BUY";
  if (value >= 80) return "SELL";
  return "NEUTRAL";
}

function buildAnalysis(candles: Candle[], daily: Candle[]): LiveAnalysis {
  const closes = candles.map((c) => c.close);
  const latest = candles[candles.length - 1];
  const previous = candles[candles.length - 2] ?? latest;
  const periods = [10, 20, 50, 100];
  const movingAverages = periods.map((period) => {
    const simple = sma(closes, period);
    const exponential = ema(closes, period);
    const compare = Number.isFinite(exponential) ? exponential : simple;
    return { period, simple, exponential, signal: latest.close > compare ? "BUY" as Signal : latest.close < compare ? "SELL" as Signal : "NEUTRAL" as Signal };
  });
  const oscillators = periods.map((period) => {
    const rv = rsi(closes, Math.min(period, 50));
    const sv = stochastic(candles, Math.min(period, 50));
    return { period, rsi: rv, stochastic: sv, rsiSignal: signalFromRsi(rv), stochasticSignal: signalFromStoch(sv) };
  });
  const ema20 = ema(closes, 20);
  const ema50 = ema(closes, 50);
  const ema100 = ema(closes, 100);
  const rsi14 = rsi(closes, 14);
  const adxData = adx(candles, 14);
  let bullVotes = 0;
  let bearVotes = 0;
  if (latest.close > ema20) bullVotes += 1; else bearVotes += 1;
  if (ema20 > ema50) bullVotes += 1; else bearVotes += 1;
  if (ema50 > ema100) bullVotes += 1; else bearVotes += 1;
  if (adxData.diPlus > adxData.diMinus) bullVotes += 1; else bearVotes += 1;
  if (rsi14 >= 50) bullVotes += 1; else bearVotes += 1;
  const bias: Bias = bullVotes >= 4 ? "BULLISH" : bearVotes >= 4 ? "BEARISH" : "NEUTRAL";
  const strength: Strength = adxData.adx >= 25 ? "STRONG" : adxData.adx >= 18 ? "MODERATE" : "WEAK";
  let score = 50;
  score += latest.close > ema20 ? 8 : -8;
  score += ema20 > ema50 ? 10 : -10;
  score += ema50 > ema100 ? 10 : -10;
  score += adxData.diPlus > adxData.diMinus ? 8 : -8;
  score += rsi14 >= 50 && rsi14 <= 70 ? 8 : rsi14 < 45 ? -8 : 0;
  score += adxData.adx >= 25 ? 6 : adxData.adx < 15 ? -4 : 0;
  score += latest.close >= previous.close ? 5 : -5;
  score = Math.max(0, Math.min(100, Math.round(score)));
  const recent = candles.slice(-50);
  const support = Math.min(...recent.map((c) => c.low));
  const resistance = Math.max(...recent.map((c) => c.high));
  const breakAbove = bias === "BEARISH" ? support : resistance;
  const pivotCandle = daily.length >= 2 ? daily[daily.length - 2] : daily[daily.length - 1] ?? latest;
  const cp = classicPivot(pivotCandle.high, pivotCandle.low, pivotCandle.close);
  const wp = woodiePivot(pivotCandle.high, pivotCandle.low, pivotCandle.close);
  const fp = fibonacciPivot(pivotCandle.high, pivotCandle.low, pivotCandle.close);
  const pivots: PivotRow[] = [
    ["R3", cp.r3, wp.r3, fp.r3], ["R2", cp.r2, wp.r2, fp.r2], ["R1", cp.r1, wp.r1, fp.r1], ["PP", cp.p, wp.p, fp.p],
    ["S1", cp.s1, wp.s1, fp.s1], ["S2", cp.s2, wp.s2, fp.s2], ["S3", cp.s3, wp.s3, fp.s3],
  ].map(([level, classic, woodie, fibonacci]) => ({ level: String(level), classic: Number(classic), woodie: Number(woodie), fibonacci: Number(fibonacci) }));
  return {
    price: latest.close,
    change: latest.close - previous.close,
    changePct: previous.close ? ((latest.close - previous.close) / previous.close) * 100 : 0,
    score,
    bias,
    strength,
    adx: adxData.adx,
    diPlus: adxData.diPlus,
    diMinus: adxData.diMinus,
    support,
    resistance,
    breakAbove,
    movingAverages,
    oscillators,
    pivots,
    updatedAt: new Date(),
  };
}

function SignalBadge({ value }: { value: Signal }) {
  const classes = value === "BUY" ? "bg-emerald-500 text-white" : value === "SELL" ? "bg-rose-500 text-white" : "bg-sky-500 text-white";
  return <span className={`inline-flex min-w-[62px] justify-center rounded px-2 py-1 text-[10px] font-bold ${classes}`}>{value}</span>;
}

function fmt(value: number, symbol: string) {
  if (!Number.isFinite(value)) return "–";
  const digits = symbol === "XAUUSD" || symbol === "US30" ? 2 : symbol === "USDJPY" ? 3 : 5;
  return value.toFixed(digits);
}

async function loadSeries(apiSymbol: string, interval: string, outputsize: number) {
  const qs = new URLSearchParams({ symbol: apiSymbol, interval, outputsize: String(outputsize), format: "JSON", order: "asc" });
  const res = await fetch(`/api/twelve-data?${qs.toString()}`, { cache: "no-store" });
  const raw = await res.text();
  let data: any = null;
  try { data = JSON.parse(raw); } catch { throw new Error("Twelve Data returned invalid JSON"); }
  if (!res.ok || data?.status === "error" || data?.error) throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
  const source = Array.isArray(data?.values) ? data.values : Array.isArray(data?.candles) ? data.candles : [];
  const candles: Candle[] = source.map((v: any) => ({
    datetime: v.datetime,
    time: Number(v.time),
    open: Number(v.open), high: Number(v.high), low: Number(v.low), close: Number(v.close),
  })).filter((c: Candle) => [c.open, c.high, c.low, c.close].every(Number.isFinite));
  if (!candles.length) throw new Error(data?.message || "No candles returned");
  return candles;
}

export default function TechnicalAnalysisPanel() {
  const [symbol, setSymbol] = useState("GBPCHF");
  const [timeframe, setTimeframe] = useState("M5");
  const [lang, setLang] = useState<Lang>("pl");
  const [analysis, setAnalysis] = useState<LiveAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
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
  const instrument = INSTRUMENTS.find((x) => x.symbol === symbol) ?? INSTRUMENTS[0];

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [candles, daily] = await Promise.all([
        loadSeries(instrument.api, TF_MAP[timeframe] ?? "5min", 260),
        loadSeries(instrument.api, "1day", 10),
      ]);
      setAnalysis(buildAnalysis(candles, daily));
    } catch (e) {
      setAnalysis(null);
      setError(e instanceof Error ? e.message : "Unknown market data error");
    } finally {
      setLoading(false);
    }
  }, [instrument.api, timeframe]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const id = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(id);
  }, [refresh]);

  const strengthLabel = analysis?.strength === "STRONG" ? t.strong : analysis?.strength === "WEAK" ? t.weak : t.moderate;
  const trendLabel = analysis?.bias === "BULLISH" ? t.uptrend : analysis?.bias === "BEARISH" ? t.downtrend : t.neutral;
  const score = analysis?.score ?? 0;
  const positive = (analysis?.change ?? 0) >= 0;

  return (
    <div className="space-y-4">
      <div className="rounded-[18px] border border-cyan-400/25 bg-[linear-gradient(135deg,#07192b,#082947)] p-4 shadow-[0_0_28px_rgba(34,211,238,.08)]">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.22em] text-cyan-300/75">FX TRADE • {t.technical}</div>
            <h2 className="mt-1 text-[22px] font-black text-white">{t.title}</h2>
            <p className="mt-1 text-[11px] text-sky-100/50">{t.subtitle}</p>
          </div>
          <div className={`rounded-full border px-3 py-1.5 text-[9px] ${error ? "border-rose-300/25 bg-rose-300/5 text-rose-100/80" : "border-emerald-300/25 bg-emerald-300/5 text-emerald-100/80"}`}>
            {error ? t.error : `${t.live} • ${t.updated}: ${analysis?.updatedAt.toLocaleTimeString() ?? "–"}`}
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.1fr_.55fr_1.15fr_auto]">
          <label className="space-y-1.5">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-sky-100/45">{t.instrument}</span>
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="h-11 w-full rounded-xl border border-cyan-300/15 bg-[#06182a] px-3 text-[12px] font-bold text-white outline-none">
              {INSTRUMENTS.map((row) => <option key={row.symbol} value={row.symbol}>{row.flag} {row.symbol}</option>)}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-sky-100/45">{t.timeframe}</span>
            <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className="h-11 w-full rounded-xl border border-cyan-300/15 bg-[#06182a] px-3 text-[12px] font-bold text-white outline-none">
              {Object.keys(TF_MAP).map((tf) => <option key={tf}>{tf}</option>)}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-sky-100/45">{t.indicators}</span>
            <div className="flex h-11 items-center rounded-xl border border-cyan-300/15 bg-[#06182a] px-3 text-[11px] font-semibold text-sky-50">EMA + SMA + RSI + Stochastic + ADX + Pivot</div>
          </label>
          <button type="button" onClick={refresh} disabled={loading} className="mt-auto h-11 rounded-xl bg-blue-600 px-5 text-[11px] font-black text-white shadow-[0_8px_24px_rgba(37,99,235,.28)] transition hover:bg-blue-500 disabled:cursor-wait disabled:opacity-60">↻ {loading ? t.loading : t.load}</button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[9px] text-sky-100/40">{t.favorites}:</span>
          {INSTRUMENTS.map((fav) => <button key={fav.symbol} type="button" onClick={() => setSymbol(fav.symbol)} className={`rounded-lg border px-3 py-1.5 text-[9px] font-semibold transition ${symbol === fav.symbol ? "border-blue-400/70 bg-blue-500/30 text-white" : "border-cyan-300/10 bg-[#071c31] text-sky-100/55 hover:border-cyan-300/30"}`}>{fav.symbol}</button>)}
        </div>
        {error && <div className="mt-3 rounded-xl border border-rose-300/15 bg-rose-500/5 p-3 text-[10px] text-rose-100/80"><b>{error}</b><div className="mt-1 text-rose-100/55">{t.apiHint}</div></div>}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-4">
          <div className="rounded-[16px] border border-cyan-300/15 bg-[#07192b] p-4">
            <div className="flex items-center gap-3"><div className="text-2xl">{instrument.flag}</div><div><div className="flex items-center gap-2"><h3 className="text-[18px] font-black">{instrument.symbol}</h3><span className="rounded bg-white/5 px-2 py-1 text-[9px] text-sky-100/55">{timeframe}</span></div><div className="text-[9px] text-sky-100/40">{instrument.name}</div></div></div>
            <div className="mt-4 flex items-end gap-4"><div className="text-[31px] font-black tracking-tight">{analysis ? fmt(analysis.price, symbol) : "–"}</div><div className={`pb-1 text-[13px] font-bold ${positive ? "text-emerald-300" : "text-rose-300"}`}>{analysis ? `${positive ? "+" : ""}${fmt(analysis.change, symbol)} (${positive ? "+" : ""}${analysis.changePct.toFixed(2)}%)` : "–"}</div></div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[16px] border border-cyan-300/15 bg-[#07192b] p-4">
              <h3 className="mb-3 text-[14px] font-bold">〽 {t.moving}</h3>
              <div className="grid grid-cols-4 gap-2 border-b border-white/5 pb-2 text-[9px] uppercase text-sky-100/40"><span>{t.period}</span><span>{t.simple}</span><span>{t.exponential}</span><span>{t.signal}</span></div>
              <div className="divide-y divide-white/5">{(analysis?.movingAverages ?? []).map((row) => <div key={row.period} className="grid grid-cols-4 items-center gap-2 py-2 text-[10px]"><span>{row.period}</span><span>{fmt(row.simple, symbol)}</span><span>{fmt(row.exponential, symbol)}</span><SignalBadge value={row.signal}/></div>)}</div>
            </div>
            <div className="rounded-[16px] border border-cyan-300/15 bg-[#07192b] p-4">
              <h3 className="mb-3 text-[14px] font-bold">◉ {t.oscillators}</h3>
              <div className="grid grid-cols-5 gap-2 border-b border-white/5 pb-2 text-[9px] uppercase text-sky-100/40"><span>{t.period}</span><span>RSI</span><span>{t.stochastic}</span><span>RSI</span><span>{t.signal}</span></div>
              <div className="divide-y divide-white/5">{(analysis?.oscillators ?? []).map((row) => <div key={row.period} className="grid grid-cols-5 items-center gap-2 py-2 text-[10px]"><span>{row.period}</span><span>{Number.isFinite(row.rsi) ? row.rsi.toFixed(1) : "–"}</span><span>{Number.isFinite(row.stochastic) ? row.stochastic.toFixed(1) : "–"}</span><SignalBadge value={row.rsiSignal}/><SignalBadge value={row.stochasticSignal}/></div>)}</div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[16px] border border-cyan-300/15 bg-[#07192b] p-4"><div className="text-[11px] text-sky-100/45">◉ {t.overall}</div><div className={`mt-3 text-[23px] font-black ${analysis?.bias === "BULLISH" ? "text-emerald-300" : analysis?.bias === "BEARISH" ? "text-rose-300" : "text-sky-300"}`}>{analysis?.bias ?? "–"}</div></div>
            <div className="rounded-[16px] border border-cyan-300/15 bg-[#07192b] p-4"><div className="text-[11px] text-sky-100/45">▥ {t.strength}</div><div className="mt-3 inline-flex rounded bg-amber-400/15 px-3 py-1 text-[12px] font-black text-amber-300">{analysis ? strengthLabel : "–"}</div><div className="mt-3 flex gap-1">{Array.from({ length: 5 }).map((_, i) => <span key={i} className={`h-2 w-7 rounded-sm ${analysis && i < Math.ceil(score / 20) ? "bg-amber-400" : "bg-white/10"}`} />)}</div></div>
            <div className="rounded-[16px] border border-cyan-300/15 bg-[#07192b] p-4"><div className="text-[11px] text-sky-100/45">⌖ {t.key}</div><div className="mt-3 space-y-2 text-[11px]"><div className="flex justify-between"><span>{t.support}</span><b className="text-emerald-300">{analysis ? fmt(analysis.support, symbol) : "–"}</b></div><div className="flex justify-between"><span>{t.resistance}</span><b className="text-rose-300">{analysis ? fmt(analysis.resistance, symbol) : "–"}</b></div></div></div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <div className="rounded-[16px] border border-cyan-300/15 bg-[#07192b] p-4"><div className="text-[13px] font-bold">{t.score}</div><div className="mt-4 flex justify-center"><div className="relative h-32 w-56 overflow-hidden"><div className="absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 rounded-full" style={{ background: `conic-gradient(from 270deg, #10b981 0deg ${score * 1.8}deg, #f59e0b ${score * 1.8}deg 180deg, transparent 180deg 360deg)` }} /><div className="absolute left-1/2 top-7 h-36 w-36 -translate-x-1/2 rounded-full bg-[#07192b]"/><div className="absolute inset-x-0 top-16 text-center text-[30px] font-black">{analysis ? `${score}%` : "–"}</div><div className="absolute bottom-1 left-2 text-[9px] text-emerald-300">{t.buy}</div><div className="absolute bottom-1 right-2 text-[9px] text-rose-300">{t.sell}</div></div></div></div>
            <div className="rounded-[16px] border border-cyan-300/15 bg-[#07192b] p-4"><h3 className="text-[14px] font-bold">▱ {t.trend}</h3><div className="mt-4 space-y-3 text-[11px]"><div className="flex justify-between"><span className="text-sky-100/45">{t.direction}</span><b className={analysis?.bias === "BEARISH" ? "text-rose-300" : analysis?.bias === "BULLISH" ? "text-emerald-300" : "text-sky-300"}>{analysis ? trendLabel : "–"}</b></div><div className="flex justify-between"><span className="text-sky-100/45">{t.strength}</span><b className="text-amber-300">{analysis ? strengthLabel : "–"}</b></div><div className="flex justify-between"><span className="text-sky-100/45">ADX (14)</span><b>{analysis && Number.isFinite(analysis.adx) ? analysis.adx.toFixed(1) : "–"}</b></div><div className="flex justify-between"><span className="text-sky-100/45">+DI / -DI</span><b>{analysis ? `${analysis.diPlus.toFixed(1)} / ${analysis.diMinus.toFixed(1)}` : "–"}</b></div></div><div className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/5 p-3 text-[10px] text-amber-100/75">💡 {t.break} <b className="text-amber-300">{analysis ? fmt(analysis.breakAbove, symbol) : "–"}</b></div></div>
          </div>
          <div className="rounded-[16px] border border-cyan-300/15 bg-[#07192b] p-4"><h3 className="mb-3 text-[14px] font-bold">▰ {t.pivot}</h3><div className="grid grid-cols-4 gap-2 border-b border-white/5 pb-2 text-[9px] uppercase text-sky-100/40"><span>Level</span><span>Classic</span><span>Woodie</span><span>Fibonacci</span></div><div className="divide-y divide-white/5">{(analysis?.pivots ?? []).map((row) => <div key={row.level} className="grid grid-cols-4 gap-2 py-2 text-[10px]"><b>{row.level}</b><span className={row.level === "PP" ? "font-bold text-amber-300" : ""}>{fmt(row.classic, symbol)}</span><span>{fmt(row.woodie, symbol)}</span><span>{fmt(row.fibonacci, symbol)}</span></div>)}</div></div>
        </div>
      </div>
    </div>
  );
}
