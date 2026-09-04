"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Candle,
  GoldScannerResult,
  scanGoldScalping,
} from "@/lib/scanners/goldScalpingEngine";
import GoldChart from "./GoldChart";

const emptyResult: GoldScannerResult = {
  side: "NONE",
  status: "WAIT",
  score: 0,
  momentum: 0,
  m5Trend: "NEUTRAL",
  structure: "NEUTRAL",
  liquiditySweep: false,
  structureShift: false,
  displacement: false,
  ema50: 0,
  ema200: 0,
  atr: 0,
  rsi: 50,
  entry: null,
  stopLoss: null,
  tp1: null,
  tp2: null,
  rr1: null,
  rr2: null,
  reasons: [],
};


// ======================================================
// GOLD SCALPING — MTF CONFIRMATION TABLE
// M15 Bias -> M5 Setup -> M1 Timing
// ======================================================

type MtfState = "BULL" | "BEAR" | "NEUTRAL";

type MtfRow = {
  tf: "H1" | "M30" | "M15" | "M5" | "M1";
  state: MtfState;
  wt1: number | null;
  mfi: number | null;
  signal: "BUY" | "SELL" | "WAIT";
};

function mtfEma(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const k = 2 / (period + 1);
  let value = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < values.length; i += 1) {
    value = values[i] * k + value * (1 - k);
  }
  return value;
}

function mtfAtr(candles: Candle[], period = 14): number | null {
  if (candles.length < period + 1) return null;
  const tr: number[] = [];
  for (let i = 1; i < candles.length; i += 1) {
    const c = candles[i];
    const p = candles[i - 1];
    tr.push(Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close)));
  }
  const recent = tr.slice(-period);
  return recent.reduce((a, b) => a + b, 0) / recent.length;
}

function mtfMfi(candles: Candle[], period = 14): number | null {
  if (candles.length < period + 1) return null;
  let positive = 0;
  let negative = 0;

  for (let i = candles.length - period; i < candles.length; i += 1) {
    const c = candles[i];
    const p = candles[i - 1];
    const typical = (c.high + c.low + c.close) / 3;
    const prevTypical = (p.high + p.low + p.close) / 3;
    const rawVolume = "volume" in c ? Number((c as Candle & { volume?: number }).volume) : 1;
    const volume = Number.isFinite(rawVolume) && rawVolume > 0 ? rawVolume : 1;
    const flow = typical * volume;

    if (typical >= prevTypical) positive += flow;
    else negative += flow;
  }

  if (negative === 0) return 100;
  const ratio = positive / negative;
  return 100 - 100 / (1 + ratio);
}

function mtfWaveTrend(candles: Candle[]): number | null {
  if (candles.length < 32) return null;

  const ap = candles.map((c) => (c.high + c.low + c.close) / 3);
  const alpha10 = 2 / 11;
  const esa: number[] = [];
  let esaValue = ap[0];

  for (const value of ap) {
    esaValue = value * alpha10 + esaValue * (1 - alpha10);
    esa.push(esaValue);
  }

  const deviation: number[] = [];
  let devValue = Math.abs(ap[0] - esa[0]);

  for (let i = 0; i < ap.length; i += 1) {
    const current = Math.abs(ap[i] - esa[i]);
    devValue = current * alpha10 + devValue * (1 - alpha10);
    deviation.push(devValue);
  }

  const ci = ap.map((value, i) =>
    deviation[i] > 0 ? (value - esa[i]) / (0.015 * deviation[i]) : 0
  );

  const alpha21 = 2 / 22;
  let wt = ci[0];
  for (const value of ci) wt = value * alpha21 + wt * (1 - alpha21);

  return wt;
}

function mtfAdx(candles: Candle[], period = 14): number | null {
  if (candles.length < period * 2 + 1) return null;

  const tr: number[] = [];
  const plusDm: number[] = [];
  const minusDm: number[] = [];

  for (let i = 1; i < candles.length; i += 1) {
    const c = candles[i];
    const p = candles[i - 1];

    tr.push(Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close)));

    const up = c.high - p.high;
    const down = p.low - c.low;
    plusDm.push(up > down && up > 0 ? up : 0);
    minusDm.push(down > up && down > 0 ? down : 0);
  }

  const dx: number[] = [];

  for (let end = period; end <= tr.length; end += 1) {
    const trSum = tr.slice(end - period, end).reduce((a, b) => a + b, 0);
    if (trSum <= 0) continue;

    const plus = plusDm.slice(end - period, end).reduce((a, b) => a + b, 0);
    const minus = minusDm.slice(end - period, end).reduce((a, b) => a + b, 0);
    const plusDi = (plus / trSum) * 100;
    const minusDi = (minus / trSum) * 100;
    const total = plusDi + minusDi;

    if (total > 0) dx.push((Math.abs(plusDi - minusDi) / total) * 100);
  }

  if (dx.length < period) return null;
  const recent = dx.slice(-period);
  return recent.reduce((a, b) => a + b, 0) / recent.length;
}

function buildMtfRow(tf: MtfRow["tf"], candles: Candle[]): MtfRow {
  const closes = candles.map((c) => c.close);
  const fast = mtfEma(closes, 8);
  const slow = mtfEma(closes, 21);
  const last = closes.at(-1) ?? null;
  const wt1 = mtfWaveTrend(candles);
  const mfi = mtfMfi(candles);

  let state: MtfState = "NEUTRAL";
  if (last !== null && fast !== null && slow !== null) {
    if (fast > slow && last >= fast) state = "BULL";
    else if (fast < slow && last <= fast) state = "BEAR";
  }

  let signal: MtfRow["signal"] = "WAIT";
  if (state === "BULL" && (mfi ?? 50) >= 50 && (wt1 ?? 0) >= -15) signal = "BUY";
  if (state === "BEAR" && (mfi ?? 50) <= 50 && (wt1 ?? 0) <= 15) signal = "SELL";

  return { tf, state, wt1, mfi, signal };
}


type FastMtfDecision = {
  side: "BUY" | "SELL" | "NONE";
  label: "STRONG BUY" | "STRONG SELL" | "FAST BUY" | "FAST SELL" | "WAIT";
  aligned: number;
  ready: boolean;
  adx: number | null;
};

function getFastMtfDecision(
  m1: Candle[],
  m5: Candle[],
  m15: Candle[],
  scanner?: GoldScannerResult
): FastMtfDecision {
  const rowM15 = buildMtfRow("M15", m15);
  const rowM5 = buildMtfRow("M5", m5);
  const rowM1 = buildMtfRow("M1", m1);
  const adx = mtfAdx(m1);

  const buyFast = rowM5.signal === "BUY" && rowM1.signal === "BUY";
  const sellFast = rowM5.signal === "SELL" && rowM1.signal === "SELL";

  let side: FastMtfDecision["side"] = "NONE";
  if (buyFast) side = "BUY";
  if (sellFast) side = "SELL";

  const m15Aligned =
    side === "BUY"
      ? rowM15.signal === "BUY"
      : side === "SELL"
        ? rowM15.signal === "SELL"
        : false;

  const aligned = side === "NONE" ? 0 : m15Aligned ? 3 : 2;

  const engineDirectionOk =
    !scanner ||
    (side === "BUY" && scanner.m5Trend === "BULLISH") ||
    (side === "SELL" && scanner.m5Trend === "BEARISH");

  const priceActionCount = scanner
    ? [
        scanner.liquiditySweep,
        scanner.structureShift,
        scanner.displacement,
      ].filter(Boolean).length
    : 0;

  const fastQualityOk =
    !scanner ||
    (
      scanner.score >= 60 &&
      scanner.momentum >= 55 &&
      (scanner.rr1 ?? 0) >= 1.5 &&
      priceActionCount >= 2
    );

  const strongQualityOk =
    !scanner ||
    (
      scanner.score >= 80 &&
      scanner.momentum >= 70 &&
      (scanner.rr1 ?? 0) >= 1.5 &&
      priceActionCount === 3
    );

  const qualityOk = m15Aligned ? strongQualityOk : fastQualityOk;
  const adxOk = (adx ?? 0) >= (m15Aligned ? 25 : 18);

  const ready =
    side !== "NONE" &&
    engineDirectionOk &&
    qualityOk &&
    adxOk;

  let label: FastMtfDecision["label"] = "WAIT";

  if (side === "BUY") {
    label = m15Aligned ? "STRONG BUY" : "FAST BUY";
  }

  if (side === "SELL") {
    label = m15Aligned ? "STRONG SELL" : "FAST SELL";
  }

  return { side, label, aligned, ready, adx };
}

function applyFastMtfEntry(
  scanner: GoldScannerResult,
  m1: Candle[],
  m5: Candle[],
  m15: Candle[]
): GoldScannerResult {
  // Oryginalny READY ma najwyższy priorytet.
  if (scanner.status === "READY") return scanner;

  const decision = getFastMtfDecision(m1, m5, m15, scanner);

  if (!decision.ready || decision.side === "NONE") {
    return scanner;
  }

  const atrValue = mtfAtr(m1) ?? scanner.atr ?? 0;
  const last = m1.at(-1);

  if (!last || atrValue <= 0) return scanner;

  const entry = last.close;
  const lookback = m1.slice(-8);

  if (!lookback.length) return scanner;

  const stopLoss =
    decision.side === "BUY"
      ? Math.min(...lookback.map((c) => c.low)) - atrValue * 0.15
      : Math.max(...lookback.map((c) => c.high)) + atrValue * 0.15;

  const risk = Math.abs(entry - stopLoss);
  if (risk <= 0) return scanner;

  const tp1 =
    decision.side === "BUY"
      ? entry + risk * 1.5
      : entry - risk * 1.5;

  const tp2 =
    decision.side === "BUY"
      ? entry + risk * 2.5
      : entry - risk * 2.5;

  const tableReason =
    decision.aligned === 3
      ? `MTF 3/3 ${decision.side} — M15 + M5 + M1`
      : `FAST MTF 2/3 ${decision.side} — M5 + M1`;

  return {
    ...scanner,
    side: decision.side,
    status: "READY",
    entry,
    stopLoss,
    tp1,
    tp2,
    rr1: 1.5,
    rr2: 2.5,
    reasons: [
      ...scanner.reasons,
      tableReason,
      decision.aligned === 3
        ? `ADX ${decision.adx?.toFixed(1) ?? "—"} >= 25`
        : `ADX ${decision.adx?.toFixed(1) ?? "—"} >= 18`,
      decision.aligned === 3
        ? "STRONG: Sweep + BOS/CHOCH + Displacement 3/3"
        : "FAST: minimum 2/3 Sweep / BOS-CHOCH / Displacement",
      decision.aligned === 3
        ? "Mocne wejście aktywowane przez tabelę MTF"
        : "Szybkie wejście aktywowane przez tabelę MTF",
    ],
  };
}

function GoldMtfConfirmation({
  m1,
  m5,
  m15,
  m30,
  h1,
}: {
  m1: Candle[];
  m5: Candle[];
  m15: Candle[];
  m30: Candle[];
  h1: Candle[];
}) {
  const rows = useMemo(
    () => [
      buildGoldOverviewRow("M1", m1),
      buildGoldOverviewRow("M5", m5),
      buildGoldOverviewRow("M15", m15),
      buildGoldOverviewRow("M30", m30),
      buildGoldOverviewRow("H1", h1),
    ],
    [m1, m5, m15, m30, h1]
  );

  return (
    <div className="relative overflow-hidden rounded-[18px] border border-slate-200/80 bg-[#061019] shadow-[0_0_0_1px_rgba(255,255,255,.16),0_16px_45px_rgba(0,0,0,.45),inset_0_1px_0_rgba(255,255,255,.18)]">
      {/* srebrna rama */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[18px] p-[2px]"
        style={{
          background:
            "linear-gradient(135deg,#f8fafc 0%,#94a3b8 18%,#e2e8f0 38%,#64748b 58%,#f8fafc 80%,#94a3b8 100%)",
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />

      <div className="relative z-[1]">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🟨</span>
            <div>
              <div className="text-[12px] font-black tracking-[0.08em] text-slate-100">
                GOLDSCALP
              </div>
              <div className="text-[8px] font-bold uppercase tracking-[0.16em] text-slate-500">
                XAUUSD MARKET SCANNER
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[9px] font-black text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.85)]" />
            LIVE
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[560px]">
            <div className="grid grid-cols-[62px_1.05fr_1.2fr_.9fr_.85fr] border-b border-white/[0.08] bg-white/[0.015] px-1 text-[9px] font-black uppercase tracking-[0.08em] text-slate-400">
              {['TIMEFRAME', 'TREND', 'MOMENTUM', 'VOLATILITY', 'SYGNAŁ'].map((label) => (
                <div key={label} className="px-2 py-2.5">
                  {label}
                </div>
              ))}
            </div>

            {rows.map((row) => (
              <div
                key={row.tf}
                className="grid grid-cols-[62px_1.05fr_1.2fr_.9fr_.85fr] items-center border-b border-white/[0.06] px-1 last:border-b-0"
              >
                <div className="px-2 py-3 text-[12px] font-black text-slate-100">
                  {row.tf}
                </div>

                <div className="flex items-center gap-2 px-2 py-3">
                  <span
                    className={`h-3 w-3 rounded-full border ${
                      row.state === 'BULL'
                        ? 'border-emerald-200/70 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.7)]'
                        : row.state === 'BEAR'
                          ? 'border-red-200/70 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,.65)]'
                          : 'border-violet-200/70 bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,.55)]'
                    }`}
                  />
                  <span className="text-[11px] font-semibold text-slate-200">
                    {row.state === 'BULL' ? 'Bullish' : row.state === 'BEAR' ? 'Bearish' : 'Neutral'}
                  </span>
                </div>

                <div className="flex items-center gap-1 px-2 py-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <span
                      key={index}
                      className={`h-3.5 flex-1 max-w-[18px] rounded-[2px] border ${
                        index < row.momentumBars
                          ? 'border-emerald-300/30 bg-gradient-to-b from-emerald-300 to-emerald-500 shadow-[0_0_7px_rgba(34,197,94,.25)]'
                          : 'border-slate-700/60 bg-slate-800/80'
                      }`}
                    />
                  ))}
                </div>

                <div
                  className={`px-2 py-3 text-[10px] font-black ${
                    row.volatility === 'HIGH'
                      ? 'text-emerald-400'
                      : row.volatility === 'MEDIUM'
                        ? 'text-amber-300'
                        : 'text-red-400'
                  }`}
                >
                  {row.volatility}
                </div>

                <div className="px-2 py-3">
                  <span
                    className={`inline-flex min-w-[60px] justify-center rounded-md border px-2 py-1 text-[10px] font-black ${
                      row.signal === 'BUY'
                        ? 'border-emerald-400/35 bg-emerald-500/15 text-emerald-400'
                        : row.signal === 'SELL'
                          ? 'border-red-400/35 bg-red-500/15 text-red-400'
                          : 'border-amber-400/30 bg-amber-400/10 text-amber-300'
                    }`}
                  >
                    {row.signal === 'WAIT' ? 'WATCH' : row.signal}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type GoldOverviewRow = MtfRow & {
  momentumBars: number;
  volatility: "HIGH" | "MEDIUM" | "LOW";
};

function buildGoldOverviewRow(
  tf: MtfRow["tf"],
  candles: Candle[]
): GoldOverviewRow {
  const base = buildMtfRow(tf, candles);
  const closes = candles.map((c) => c.close);
  const last = closes.at(-1) ?? 0;
  const atr = mtfAtr(candles);

  const momentumRaw = Math.abs((base.wt1 ?? 0) * 0.55) + Math.abs((base.mfi ?? 50) - 50) * 1.35;
  const momentumBars = candles.length < 32
    ? 0
    : Math.max(1, Math.min(5, Math.ceil(momentumRaw / 18)));

  const atrPct = last > 0 && atr !== null ? (atr / last) * 100 : 0;
  const volatility: GoldOverviewRow["volatility"] =
    atrPct >= 0.18 ? "HIGH" : atrPct >= 0.08 ? "MEDIUM" : "LOW";

  return {
    ...base,
    momentumBars,
    volatility,
  };
}

function MtfMetric({
  label,
  value,
  note,
  state,
}: {
  label: string;
  value: string;
  note: string;
  state: "good" | "bad" | "warn" | "info" | "neutral";
}) {
  const valueClass =
    state === "good"
      ? "text-emerald-400"
      : state === "bad"
        ? "text-red-400"
        : state === "warn"
          ? "text-amber-400"
          : state === "info"
            ? "text-sky-400"
            : "text-slate-400";

  return (
    <div className="bg-[linear-gradient(145deg,rgba(39,45,50,.95),rgba(18,24,29,.98))] p-2.5">
      <div className="text-[8px] font-black uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className={`mt-1.5 text-[15px] font-black ${valueClass}`}>{value}</div>
      <div className="mt-0.5 text-[7px] font-bold uppercase tracking-wider text-slate-600">
        {note}
      </div>
    </div>
  );
}


export default function GoldScalpingScanner() {
  const [m1, setM1] = useState<Candle[]>([]);
  const [m5, setM5] = useState<Candle[]>([]);
  const [m15, setM15] = useState<Candle[]>([]);
  const [m30, setM30] = useState<Candle[]>([]);
  const [h1, setH1] = useState<Candle[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] =
    useState<"M1" | "M5" | "M15">("M1");

  const chartFullscreenRef = useRef<HTMLDivElement | null>(null);
  const [isChartFullscreen, setIsChartFullscreen] = useState(false);

  const [result, setResult] = useState<GoldScannerResult>(emptyResult);
  const [loading, setLoading] = useState(false);
  const [lastScan, setLastScan] = useState<Date | null>(null);

  async function scan() {
    try {
      setLoading(true);

      const [m1Response, m5Response, m15Response, m30Response, h1Response] = await Promise.all([
        fetch("/api/gold-candles?interval=1min&symbol=XAUUSD", { cache: "no-store" }),
        fetch("/api/gold-candles?interval=5min&symbol=XAUUSD", { cache: "no-store" }),
        fetch("/api/gold-candles?interval=15min&symbol=XAUUSD", { cache: "no-store" }),
        fetch("/api/gold-candles?interval=30min&symbol=XAUUSD", { cache: "no-store" }),
        fetch("/api/gold-candles?interval=1h&symbol=XAUUSD", { cache: "no-store" }),
      ]);

      if (
        !m1Response.ok ||
        !m5Response.ok ||
        !m15Response.ok ||
        !m30Response.ok ||
        !h1Response.ok
      ) {
        throw new Error("Błąd pobierania danych XAUUSD");
      }

      const [m1Data, m5Data, m15Data, m30Data, h1Data] = await Promise.all([
        m1Response.json(),
        m5Response.json(),
        m15Response.json(),
        m30Response.json(),
        h1Response.json(),
      ]);

      const candlesM1: Candle[] = Array.isArray(m1Data?.candles)
        ? m1Data.candles
        : [];

      const candlesM5: Candle[] = Array.isArray(m5Data?.candles)
        ? m5Data.candles
        : [];

      const candlesM15: Candle[] = Array.isArray(m15Data?.candles)
        ? m15Data.candles
        : [];

      const candlesM30: Candle[] = Array.isArray(m30Data?.candles)
        ? m30Data.candles
        : [];

      const candlesH1: Candle[] = Array.isArray(h1Data?.candles)
        ? h1Data.candles
        : [];

      setM1(candlesM1);
      setM5(candlesM5);
      setM15(candlesM15);
      setM30(candlesM30);
      setH1(candlesH1);

      const scanner = scanGoldScalping({
        m1: candlesM1,
        m5: candlesM5,
        minMomentum: 70,
        minScore: 80,
        minRR: 1.5,
      });

      const finalScanner = applyFastMtfEntry(
        scanner,
        candlesM1,
        candlesM5,
        candlesM15
      );

      setResult(finalScanner);
      setLastScan(new Date());
    } catch (error) {
      console.error("Gold scanner error:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    scan();

    const timer = setInterval(scan, 30_000);

    return () => clearInterval(timer);
  }, []);

  async function toggleChartFullscreen() {
    try {
      const element = chartFullscreenRef.current;

      if (!element) return;

      if (!document.fullscreenElement) {
        await element.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen chart error:", error);
    }
  }

  useEffect(() => {
    function handleFullscreenChange() {
      setIsChartFullscreen(
        document.fullscreenElement === chartFullscreenRef.current
      );
    }

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  const ready = result.status === "READY";

  const selectedCandles = useMemo(() => {
    if (selectedTimeframe === "M5") return m5;
    if (selectedTimeframe === "M15") return m15;
    return m1;
  }, [selectedTimeframe, m1, m5, m15]);

  const currentPrice = useMemo(() => {
    if (!selectedCandles.length) return null;
    return selectedCandles[selectedCandles.length - 1]?.close ?? null;
  }, [selectedCandles]);

  const modules = [
    {
      label: "M5 Trend",
      value: result.m5Trend === "NEUTRAL" ? 35 : 82,
      active: result.m5Trend !== "NEUTRAL",
    },
    {
      label: "M5 Structure",
      value: result.structure === "NEUTRAL" ? 30 : 80,
      active: result.structure !== "NEUTRAL",
    },
    {
      label: "Liquidity Sweep",
      value: result.liquiditySweep ? 92 : 28,
      active: result.liquiditySweep,
    },
    {
      label: "M1 BOS / CHOCH",
      value: result.structureShift ? 90 : 26,
      active: result.structureShift,
    },
    {
      label: "Displacement",
      value: result.displacement ? 88 : 30,
      active: result.displacement,
    },
    {
      label: "Momentum",
      value: Math.max(0, Math.min(100, result.momentum)),
      active: result.momentum >= 70,
    },
  ];

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#03070d] text-white">
      <div className="mx-auto w-[97%] max-w-[2500px] px-3 py-3 lg:px-5 lg:py-4">
        <section className="mb-3 flex flex-col gap-3 rounded-[18px] border border-amber-400/20 bg-[linear-gradient(145deg,rgba(31,37,42,.98),rgba(10,15,20,.98))] px-5 py-4 shadow-[0_18px_55px_rgba(0,0,0,.35)] xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-400">FXTRADE PREMIUM</div>
            <h1 className="mt-0.5 text-2xl font-black tracking-tight xl:text-[30px]">GOLD SCALPING SCANNER</h1>
            <p className="mt-1 text-[12px] text-slate-400">M5 = kierunek • M1 = wejście • płynność + struktura + momentum</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-2.5"><div className="text-[9px] uppercase tracking-widest text-slate-500">Status</div><div className="mt-1 flex items-center gap-2 text-[12px] font-bold"><span className="h-2 w-2 rounded-full bg-emerald-400"/>LIVE</div></div>
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-2.5"><div className="text-[9px] uppercase tracking-widest text-slate-500">Ostatni skan</div><div className="mt-1 text-[12px] font-bold text-slate-200">{lastScan ? lastScan.toLocaleTimeString() : "--:--:--"}</div></div>
            <button onClick={scan} disabled={loading} className="min-w-[180px] rounded-xl border border-amber-300/30 bg-gradient-to-b from-amber-300 to-amber-500 px-6 py-3 text-[12px] font-black text-black transition hover:brightness-110 disabled:opacity-50">{loading ? "SKANOWANIE..." : "◉ SKANUJ GOLD"}</button>
          </div>
        </section>

        <section className="mb-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Panel className="p-4"><Label>SYGNAŁ</Label><div className={`mt-2 text-[25px] font-black ${ready ? result.side === "BUY" ? "text-emerald-400" : "text-red-400" : "text-slate-300"}`}>{ready ? result.side : "WAIT"}</div><div className="mt-1 text-[10px] text-slate-500">{ready ? "Warunki wejścia spełnione" : "Czekamy na potwierdzenie"}</div></Panel>
          <Panel className="p-4"><Label>OCENA</Label><div className="mt-2 text-[25px] font-black text-amber-300">{result.score}<span className="text-xs text-slate-500">/100</span></div><Progress value={result.score}/></Panel>
          <Panel className="p-4"><Label>MOMENTUM</Label><div className={`mt-2 text-[25px] font-black ${result.momentum >= 70 ? "text-emerald-400" : "text-amber-300"}`}>{result.momentum}<span className="text-xs text-slate-500">/100</span></div><div className="mt-1 text-[10px] text-slate-500">Minimum dla mocnego setupu: 70</div></Panel>
          <Panel className="p-4"><Label>KIERUNEK M5</Label><div className={`mt-2 text-[20px] font-black ${result.m5Trend === "BULLISH" ? "text-emerald-400" : result.m5Trend === "BEARISH" ? "text-red-400" : "text-slate-300"}`}>{result.m5Trend}</div><div className="mt-1 text-[10px] text-slate-500">Struktura: {result.structure}</div></Panel>
          <Panel className="p-4"><Label>PLAN</Label><div className="mt-2 grid grid-cols-2 gap-x-3 text-[10px]"><Metric title="Entry" value={format(result.entry)}/><Metric title="SL" value={format(result.stopLoss)} valueClass="text-red-400"/><Metric title="TP1" value={format(result.tp1)} valueClass="text-emerald-400"/><Metric title="TP2" value={format(result.tp2)} valueClass="text-emerald-400"/></div></Panel>
        </section>

        <section className="grid grid-cols-12 gap-3">
          <div className="col-span-12 xl:col-span-9">
            <div ref={chartFullscreenRef} className={isChartFullscreen ? "h-screen w-screen overflow-auto bg-[#03070d] p-3" : ""}>
              <Panel className={`overflow-hidden p-0 ${isChartFullscreen ? "min-h-[calc(100vh-24px)]" : ""}`}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
                  <div><div className="text-[20px] font-black">XAUUSD · {selectedTimeframe}</div><div className="text-[10px] text-slate-500">Duży wykres roboczy — szybki scalping</div></div>
                  <div className="flex items-center gap-2">{(["M1","M5","M15"] as const).map(tf => <button key={tf} onClick={()=>setSelectedTimeframe(tf)} className={`min-w-[56px] rounded-lg border px-3 py-2 text-[10px] font-black ${selectedTimeframe===tf ? "border-amber-400/50 bg-amber-400/15 text-amber-300" : "border-white/10 text-slate-400"}`}>{tf}</button>)}<button type="button" onClick={toggleChartFullscreen} className="rounded-lg border border-sky-400/25 bg-sky-500/10 px-3 py-2 text-[10px] font-black text-sky-300">{isChartFullscreen ? "ZAMKNIJ" : "⛶ PEŁNY EKRAN"}</button></div>
                </div>
                <div className={isChartFullscreen ? "p-2" : "p-3"}><div className={isChartFullscreen ? "[&>div]:h-[calc(100vh-78px)] [&>div]:min-h-[calc(100vh-78px)]" : "[&>div]:min-h-[650px] 2xl:[&>div]:min-h-[760px]"}><GoldChart candles={selectedCandles} entry={result.entry} stopLoss={result.stopLoss} tp1={result.tp1} tp2={result.tp2} timeframe={selectedTimeframe}/></div></div>
              </Panel>
            </div>
          </div>

          <aside className="col-span-12 space-y-3 xl:col-span-3">
            <GoldMtfConfirmation m1={m1} m5={m5} m15={m15} m30={m30} h1={h1}/>
            <Panel className="p-4"><SectionTitle>5 POTWIERDZEŃ WEJŚCIA</SectionTitle><div className="mt-3"><Condition label="Trend + struktura M5" passed={result.m5Trend !== "NEUTRAL" && result.structure !== "NEUTRAL"}/><Condition label="Sweep płynności M1" passed={result.liquiditySweep}/><Condition label="BOS / CHOCH M1" passed={result.structureShift}/><Condition label="Displacement świecy" passed={result.displacement}/><Condition label="Momentum ≥ 70" passed={result.momentum >= 70}/></div></Panel>
            <Panel className="p-4"><SectionTitle>DLACZEGO SYGNAŁ?</SectionTitle><div className="mt-3 space-y-2">{result.reasons.length ? result.reasons.slice(0,5).map(reason=><div key={reason} className="text-[10px] leading-4 text-emerald-300">✓ {reason}</div>) : <div className="text-[10px] text-slate-500">Brak pełnego potwierdzenia. Skaner czeka.</div>}</div></Panel>
          </aside>
        </section>

        <section className="mt-3"><MomentumPanel value={result.momentum} candles={selectedCandles} timeframe={selectedTimeframe}/></section>
      </div>
    </main>
  );
}

function MomentumPanel({
  value,
  candles,
  timeframe,
}: {
  value: number;
  candles: Candle[];
  timeframe: "M1" | "M5" | "M15";
}) {
  const momentumData = useMemo(() => {
    const recent = candles.slice(-56);

    if (recent.length < 3) {
      return {
        bars: Array.from({ length: 56 }, (_, index) => {
          const wave = Math.sin(index / 4.2) * 62;
          return Math.round(wave);
        }),
        directional: 0,
      };
    }

    const raw = recent.map((candle, index) => {
      const range = Math.max(candle.high - candle.low, 0.00001);
      const body = candle.close - candle.open;

      const previousClose =
        index > 0 ? recent[index - 1].close : candle.open;

      const change = candle.close - previousClose;

      // Korpus świecy + zmiana ceny względem poprzedniej świecy.
      // Dzięki temu histogram pokazuje realny nacisk BUY / SELL.
      const bodyPressure = (body / range) * 68;
      const closePressure = (change / range) * 32;

      return Math.max(
        -100,
        Math.min(100, bodyPressure + closePressure)
      );
    });

    // Delikatne wygładzenie 3-świecowe, żeby histogram wyglądał
    // jak prawdziwy momentum oscillator, a nie losowe pojedyncze słupki.
    const smoothed = raw.map((current, index) => {
      const previous = raw[index - 1] ?? current;
      const next = raw[index + 1] ?? current;

      return (previous + current * 2 + next) / 4;
    });

    const last14 = smoothed.slice(-14);

    const directional =
      last14.length > 0
        ? last14.reduce((sum, item, index) => {
            const weight = index + 1;
            return sum + item * weight;
          }, 0) /
          last14.reduce((sum, _, index) => sum + index + 1, 0)
        : 0;

    return {
      bars: smoothed,
      directional: Math.max(-100, Math.min(100, directional)),
    };
  }, [candles]);

  const score = Math.max(0, Math.min(100, value));
  const direction = momentumData.directional;

  const momentumLabel =
    direction >= 70
      ? "STRONG BULLISH"
      : direction >= 30
      ? "BULLISH"
      : direction > -30
      ? "NEUTRAL"
      : direction > -70
      ? "BEARISH"
      : "STRONG BEARISH";

  const momentumLabelClass =
    direction >= 30
      ? "text-emerald-400"
      : direction <= -30
      ? "text-red-400"
      : "text-slate-300";

  const markerPosition = Math.max(
    0,
    Math.min(100, (direction + 100) / 2)
  );

  return (
    <Panel className="overflow-hidden p-0">
      <div className="px-5 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[13px] font-black uppercase tracking-[0.06em] text-white">
              MOMENTUM (14)
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              {timeframe} candle pressure
            </div>
          </div>

          <div
            className={`rounded-lg border px-3 py-1.5 font-mono text-sm font-black ${
              score >= 70
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : score >= 45
                ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                : "border-red-500/30 bg-red-500/10 text-red-400"
            }`}
          >
            {score}/100
          </div>
        </div>
      </div>

      {/* HISTOGRAM */}
      <div className="relative mx-5 mt-4 h-[190px] overflow-hidden rounded-xl border border-white/8 bg-[#040a11]">
        {/* poziome poziomy */}
        <div className="pointer-events-none absolute inset-x-0 top-[10%] border-t border-white/[0.035]" />
        <div className="pointer-events-none absolute inset-x-0 top-[30%] border-t border-white/[0.035]" />
        <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-white/15" />
        <div className="pointer-events-none absolute inset-x-0 top-[70%] border-t border-white/[0.035]" />
        <div className="pointer-events-none absolute inset-x-0 top-[90%] border-t border-white/[0.035]" />

        {/* pionowa siatka */}
        <div className="pointer-events-none absolute inset-0 grid grid-cols-8">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="border-r border-white/[0.025] last:border-r-0"
            />
          ))}
        </div>

        {/* prawa oś */}
        <div className="pointer-events-none absolute bottom-3 right-2 top-3 z-20 flex flex-col justify-between text-[9px] font-semibold text-slate-500">
          <span>100</span>
          <span>50</span>
          <span className="text-slate-400">0</span>
          <span>-50</span>
          <span>-100</span>
        </div>

        {/* zero */}
        <div className="pointer-events-none absolute bottom-0 left-3 right-10 top-0">
          <div className="absolute left-0 right-0 top-1/2 h-px bg-slate-500/35" />
        </div>

        {/* słupki */}
        <div className="absolute bottom-3 left-3 right-11 top-3 flex items-center gap-[2px]">
          {momentumData.bars.map((bar, index) => {
            const positive = bar >= 0;
            const height = Math.max(3, Math.min(48, Math.abs(bar) * 0.48));

            return (
              <div
                key={`${index}-${bar.toFixed(2)}`}
                className="relative h-full min-w-0 flex-1"
              >
                <div
                  className={`absolute left-[1px] right-[1px] rounded-[1px] ${
                    positive
                      ? "bottom-1/2 bg-gradient-to-t from-emerald-600 to-emerald-300"
                      : "top-1/2 bg-gradient-to-b from-red-500 to-red-700"
                  }`}
                  style={{ height: `${height}%` }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* STREFY MOMENTUM */}
      <div className="mx-5 mt-3 grid grid-cols-5 overflow-hidden rounded-lg border border-white/[0.055] text-center">
        <MomentumZone
          title="STRONG BEARISH"
          range="-100 do -70"
          className="bg-red-500/10 text-red-400"
        />
        <MomentumZone
          title="BEARISH"
          range="-70 do -30"
          className="bg-red-500/[0.07] text-red-300"
        />
        <MomentumZone
          title="NEUTRAL"
          range="-30 do 30"
          className="bg-slate-500/10 text-slate-300"
        />
        <MomentumZone
          title="BULLISH"
          range="30 do 70"
          className="bg-emerald-500/[0.07] text-emerald-300"
        />
        <MomentumZone
          title="STRONG BULLISH"
          range="70 do 100"
          className="bg-emerald-500/10 text-emerald-400"
        />
      </div>

      {/* MOMENTUM STRENGTH */}
      <div className="px-5 pb-5 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] text-slate-500">
            Momentum strength
          </span>

          <div className="flex items-center gap-3">
            <span className={`text-[10px] font-black ${momentumLabelClass}`}>
              {momentumLabel}
            </span>

            <span
              className={`font-mono text-[10px] font-black ${
                direction >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {direction > 0 ? "+" : ""}
              {direction.toFixed(0)}
            </span>
          </div>
        </div>

        <div className="relative h-2.5 overflow-visible rounded-full bg-[linear-gradient(90deg,#ef4444_0%,#7f1d1d_22%,#334155_50%,#065f46_78%,#22c55e_100%)]">
          <div
            className="absolute top-1/2 h-4 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,.65)] transition-all duration-500"
            style={{ left: `${markerPosition}%` }}
          />
        </div>

        <div className="mt-1.5 flex justify-between font-mono text-[8px] text-slate-600">
          <span>-100</span>
          <span>-70</span>
          <span>-30</span>
          <span>0</span>
          <span>30</span>
          <span>70</span>
          <span>100</span>
        </div>
      </div>
    </Panel>
  );
}

function MomentumZone({
  title,
  range,
  className,
}: {
  title: string;
  range: string;
  className: string;
}) {
  return (
    <div
      className={`border-r border-white/[0.055] px-1 py-2.5 last:border-r-0 ${className}`}
    >
      <div className="text-[8px] font-black leading-tight xl:text-[9px]">
        {title}
      </div>
      <div className="mt-1 text-[8px] opacity-70">{range}</div>
    </div>
  );
}

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[18px] border border-slate-500/40 bg-[linear-gradient(145deg,rgba(42,48,53,.97),rgba(18,24,29,.98)_48%,rgba(34,40,45,.97))] p-5 shadow-[0_18px_50px_rgba(0,0,0,.30),inset_0_1px_0_rgba(255,255,255,.06)] ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.15] mix-blend-screen"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 22%, rgba(255,255,255,.22) 0 1px, transparent 1.5px), radial-gradient(circle at 72% 68%, rgba(148,163,184,.18) 0 1px, transparent 1.5px), linear-gradient(118deg, transparent 0 34%, rgba(255,255,255,.035) 35%, transparent 37% 63%, rgba(148,163,184,.04) 64%, transparent 66%)",
          backgroundSize: "31px 29px, 37px 41px, 170px 130px",
        }}
      />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-black uppercase tracking-[0.08em] text-slate-200">
      {children}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-amber-400/10 bg-amber-400/10 px-3 py-2 text-sm font-black text-amber-400">
      {children}
    </div>
  );
}

function StatusPill({
  ready,
  status,
}: {
  ready: boolean;
  status: string;
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-2 text-sm font-black ${
        ready
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
          : "border-white/8 bg-white/[0.03] text-slate-400"
      }`}
    >
      {status}
    </div>
  );
}

function Metric({
  title,
  value,
  valueClass = "text-slate-100",
}: {
  title: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.055] py-3 last:border-b-0">
      <span className="text-xs text-slate-500">{title}</span>
      <span className={`text-sm font-black ${valueClass}`}>{value}</span>
    </div>
  );
}

function Filter({
  name,
  value,
}: {
  name: string;
  value: string;
}) {
  return (
    <div className="mb-2 flex items-center justify-between rounded-lg border border-white/[0.055] bg-white/[0.02] px-3 py-2.5 last:mb-0">
      <span className="text-xs text-slate-500">{name}</span>
      <span className="text-xs font-black text-amber-400">{value}</span>
    </div>
  );
}

function Progress({ value }: { value: number }) {
  const safe = Math.max(0, Math.min(100, value));

  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-[#111c27]">
      <div
        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all duration-500"
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}

function ModuleBar({
  label,
  value,
  active,
}: {
  label: string;
  value: number;
  active: boolean;
}) {
  const safe = Math.max(0, Math.min(100, value));

  return (
    <div className="rounded-xl border border-white/[0.055] bg-black/10 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className={active ? "text-emerald-400" : "text-amber-400"}>
            ◉
          </span>
          {label}
        </div>
        <div className="text-xs font-bold text-slate-300">{safe}/100</div>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#111c27]">
        <div
          className={`h-full rounded-full ${
            active ? "bg-emerald-400" : "bg-amber-400"
          }`}
          style={{ width: `${safe}%` }}
        />
      </div>
    </div>
  );
}

function Condition({
  label,
  passed,
}: {
  label: string;
  passed: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.055] py-3 last:border-b-0">
      <span className="text-xs text-slate-400">{label}</span>
      <span
        className={`text-xs font-black ${
          passed ? "text-emerald-400" : "text-slate-600"
        }`}
      >
        {passed ? "PASS" : "WAIT"}
      </span>
    </div>
  );
}

function RuleStep({
  label,
  passed,
  last = false,
}: {
  label: string;
  passed: boolean;
  last?: boolean;
}) {
  return (
    <div className="relative flex min-h-11 items-start gap-3">
      {!last && (
        <span className="absolute left-[6px] top-4 h-7 border-l border-dashed border-slate-700" />
      )}

      <span
        className={`relative z-10 mt-1.5 h-[13px] w-[13px] rounded-full border ${
          passed
            ? "border-emerald-400 bg-emerald-400"
            : "border-slate-600 bg-[#08111c]"
        }`}
      />

      <span className="text-xs leading-6 text-slate-400">{label}</span>
    </div>
  );
}

function TradeRow({
  name,
  value,
  danger = false,
}: {
  name: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.055] py-3.5 last:border-b-0">
      <span className="text-xs text-slate-500">{name}</span>
      <span
        className={`font-mono text-sm font-black ${
          danger ? "text-red-400" : "text-emerald-400"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function format(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "--";
  return value.toFixed(2);
}
