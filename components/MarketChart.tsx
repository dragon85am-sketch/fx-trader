"use client";

import React from "react";
import DrawingsLayer, { type DrawTool } from "./DrawingsLayer";
import {
  createChart,
  CrosshairMode,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type LineData,
  type UTCTimestamp,
  type SeriesMarker,
} from "lightweight-charts";
/* =========================
   TYPES
========================= */
export type Zone = {
  label: "ENTRY" | "SL" | "TP1" | "TP2" | "TP3";
  from: number;
  to: number;
};

export type Levels = {
  side?: "BUY" | "SELL";
  entry: number;
  sl: number;
  tps?: number[];
  tp?: number;
  rr?: number;
  zones?: Zone[];
};

export type EmaConfig = {
  period: number;
  color: string;
  width: 1 | 2 | 3 | 4;
};

export type BbConfig = {
  enabled: boolean;
  length: number;
  maType: "SMA" | "EMA";
  source: "close";
  stdDev: number;
  offset: number;
  colors?: { upper?: string; basis?: string; lower?: string };
  widths?: {
    upper?: 1 | 2 | 3 | 4;
    basis?: 1 | 2 | 3 | 4;
    lower?: 1 | 2 | 3 | 4;
  };
  background?: {
    enabled?: boolean;
    color?: string;
    opacity?: number;
  };
};

type Props = {
  symbol: string;
  tf?: string;
  candles: CandlestickData[];
  liveCandle?: CandlestickData | null;
  emaConfigs?: EmaConfig[];
  showEma?: boolean;
  emaPeriod?: number;
  bbConfig?: BbConfig;
  heikinAshi?: boolean;
  renko?: boolean;
  renkoCandles?: CandlestickData[];
  renkoBoxSize?: number;
  showTradeLines?: boolean;
  levels?: Levels;
  height?: number;
  pricePrecision?: number;
  showEntryTimeMarker?: boolean;
  highlightTime?: UTCTimestamp | null;

  // 🔥 DODAJ TO:
  activeDrawTool?: DrawTool;
  onDrawToolChange?: (tool: DrawTool) => void;
  showSignalPanel?: boolean;
  supertrendEnabled?: boolean;
  supertrendPeriod?: number;
  supertrendMultiplier?: number;
  supertrendUpLineEnabled?: boolean;
  supertrendDownLineEnabled?: boolean;
  supertrendUpBackground?: boolean;
  supertrendDownBackground?: boolean;
  supertrendUpColor?: string;
  supertrendDownColor?: string;
  patternsEnabled?: boolean;
};

/* =========================
   HELPERS (time / normalize)
========================= */
type BusinessDayLike = { year: number; month: number; day: number };

function isBusinessDayLike(x: unknown): x is BusinessDayLike {
  return (
    !!x &&
    typeof x === "object" &&
    "year" in x &&
    "month" in x &&
    "day" in x &&
    typeof (x as { year: unknown }).year === "number" &&
    typeof (x as { month: unknown }).month === "number" &&
    typeof (x as { day: unknown }).day === "number"
  );
}

function toUTCTimestamp(t: unknown): UTCTimestamp {
  if (typeof t === "number" && Number.isFinite(t) && t > 1e12) {
    return Math.floor(t / 1000) as UTCTimestamp;
  }
  if (typeof t === "number" && Number.isFinite(t)) {
    return Math.floor(t) as UTCTimestamp;
  }
  if (t instanceof Date) return Math.floor(t.getTime() / 1000) as UTCTimestamp;

  if (typeof t === "string") {
    const ms = Date.parse(t);
    if (Number.isFinite(ms)) return Math.floor(ms / 1000) as UTCTimestamp;
  }

  if (isBusinessDayLike(t)) {
    const ms = Date.UTC(t.year, t.month - 1, t.day);
    return Math.floor(ms / 1000) as UTCTimestamp;
  }

  if (t && typeof t === "object") {
    const obj = t as any;
    const maybe =
      obj?.timestamp ??
      obj?.time ??
      obj?.t ??
      obj?.T ??
      obj?.openTime ??
      obj?.open_time ??
      obj?.startTime ??
      obj?.start_time;

    if (typeof maybe === "number" && Number.isFinite(maybe)) {
      return (maybe > 1e12 ? Math.floor(maybe / 1000) : Math.floor(maybe)) as UTCTimestamp;
    }

    if (typeof maybe === "string") {
      const ms = Date.parse(maybe);
      if (Number.isFinite(ms)) return Math.floor(ms / 1000) as UTCTimestamp;
    }
  }

  return Math.floor(Date.now() / 1000) as UTCTimestamp;
}

function toNum(x: unknown) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function normalizeCandle(c: CandlestickData): CandlestickData {
  const anyC = c as any;
  return {
    ...c,
    time: toUTCTimestamp(anyC.time),
    open: toNum(anyC.open),
    high: toNum(anyC.high),
    low: toNum(anyC.low),
    close: toNum(anyC.close),
  };
}

function ensureStrictlyIncreasingTimes(arr: CandlestickData[]): CandlestickData[] {
  if (!arr.length) return arr;

  const out = [...arr];
  let prev = out[0].time as number;

  if (!Number.isFinite(prev)) {
    prev = Math.floor(Date.now() / 1000);
    out[0] = { ...out[0], time: prev as UTCTimestamp };
  }

  for (let i = 1; i < out.length; i++) {
    let t = out[i].time as number;
    if (!Number.isFinite(t)) t = prev + 1;
    if (t <= prev) t = prev + 1;
    out[i] = { ...out[i], time: t as UTCTimestamp };
    prev = t;
  }

  return out;
}

function normalizeCandles(arr: CandlestickData[]): CandlestickData[] {
  const out = (arr ?? []).map(normalizeCandle);
  out.sort((a, b) => (a.time as number) - (b.time as number));

  const map = new Map<number, CandlestickData>();
  for (const c of out) map.set(c.time as number, c);

  const deduped = Array.from(map.values()).sort(
    (a, b) => (a.time as number) - (b.time as number)
  );

  return ensureStrictlyIncreasingTimes(deduped);
}

function guessPrecision(symbol: string, lastPrice: number) {
  const s = symbol.toUpperCase();
  const looksForex = /^[A-Z]{6}$/.test(s) && !s.endsWith("USDT");
  if (looksForex) return 5;

  const p = Math.abs(lastPrice);
  if (!Number.isFinite(p) || p <= 0) return 4;
  if (p < 0.01) return 7;
  if (p < 0.1) return 6;
  if (p < 1) return 5;
  if (p < 10) return 4;
  if (p < 100) return 3;
  return 2;
}

function minMoveFromPrecision(precision: number) {
  return Math.pow(10, -precision);
}

function hexToRgba(hex: string, a = 0.95) {
  const h = (hex ?? "").replace("#", "").trim();
  if (h.length !== 6) return `rgba(226,232,240,${a})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if (![r, g, b].every((x) => Number.isFinite(x))) {
    return `rgba(226,232,240,${a})`;
  }
  return `rgba(${r},${g},${b},${a})`;
}

function formatPrice(value: number, precision = 2) {
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
}

function rightUiReservePx(rightPadOn: boolean) {
  const DRAW_PANEL_W = 180;
  const BASE = rightPadOn ? 120 : 90;
  return BASE + DRAW_PANEL_W;
}

/* =========================
   INDICATORS
========================= */
function calcEMA(values: number[], period: number) {
  const k = 2 / (period + 1);
  let e = values[0] ?? 0;
  const out: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const v = values[i] ?? 0;
    e = i === 0 ? v : v * k + e * (1 - k);
    out.push(e);
  }
  return out;
}

function calcSMA(values: number[], period: number) {
  const out: number[] = new Array(values.length).fill(NaN);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i] ?? 0;
    if (i >= period) sum -= values[i - period] ?? 0;
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

function rollingStd(values: number[], period: number) {
  const out: number[] = new Array(values.length).fill(NaN);
  let sum = 0;
  let sumSq = 0;

  for (let i = 0; i < values.length; i++) {
    const v = values[i] ?? 0;
    sum += v;
    sumSq += v * v;

    if (i >= period) {
      const old = values[i - period] ?? 0;
      sum -= old;
      sumSq -= old * old;
    }

    if (i >= period - 1) {
      const mean = sum / period;
      const variance = Math.max(0, sumSq / period - mean * mean);
      out[i] = Math.sqrt(variance);
    }
  }
  return out;
}

function clampInt(v: number, min: number, max: number) {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function buildBbLines(safe: CandlestickData[], bb: BbConfig, prec: number) {
  const len = clampInt(bb.length, 2, 500);
  const std = Number(bb.stdDev);
  const offset = clampInt(bb.offset ?? 0, -500, 500);

  const closes = safe.map((c) => toNum((c as any).close));
  const basisArr = bb.maType === "EMA" ? calcEMA(closes, len) : calcSMA(closes, len);
  const stdArr = rollingStd(closes, len);

  const upper: LineData[] = [];
  const basis: LineData[] = [];
  const lower: LineData[] = [];

  for (let i = 0; i < safe.length; i++) {
    const b = basisArr[i];
    const s = stdArr[i];
    if (!Number.isFinite(b) || !Number.isFinite(s)) continue;

    const j = i + offset;
    if (j < 0 || j >= safe.length) continue;

    const t = safe[j].time as UTCTimestamp;
    const u = b + std * s;
    const l = b - std * s;

    upper.push({ time: t, value: Number(u.toFixed(Math.min(prec + 1, 8))) });
    basis.push({ time: t, value: Number(b.toFixed(Math.min(prec + 1, 8))) });
    lower.push({ time: t, value: Number(l.toFixed(Math.min(prec + 1, 8))) });
  }

  return { upper, basis, lower };
}

/* =========================
   HEIKIN ASHI
========================= */
function toHeikinAshi(src: CandlestickData[]): CandlestickData[] {
  if (!src.length) return [];
  const out: CandlestickData[] = [];

  const first = src[0] as any;
  let haOpen = (toNum(first.open) + toNum(first.close)) / 2;
  let haClose =
    (toNum(first.open) + toNum(first.high) + toNum(first.low) + toNum(first.close)) / 4;

  let haHigh = Math.max(toNum(first.high), haOpen, haClose);
  let haLow = Math.min(toNum(first.low), haOpen, haClose);

  out.push({
    time: first.time,
    open: haOpen,
    high: haHigh,
    low: haLow,
    close: haClose,
  });

  for (let i = 1; i < src.length; i++) {
    const c = src[i] as any;
    const o = toNum(c.open);
    const h = toNum(c.high);
    const l = toNum(c.low);
    const cl = toNum(c.close);

    const nextClose = (o + h + l + cl) / 4;
    const nextOpen = (haOpen + haClose) / 2;
    const nextHigh = Math.max(h, nextOpen, nextClose);
    const nextLow = Math.min(l, nextOpen, nextClose);

    haOpen = nextOpen;
    haClose = nextClose;

    out.push({
      time: c.time,
      open: nextOpen,
      high: nextHigh,
      low: nextLow,
      close: nextClose,
    });
  }

  return ensureStrictlyIncreasingTimes(out);
}

/* =========================
   RENKO
========================= */
function calcATR14Simple(candles: CandlestickData[]) {
  const period = 14;
  if (candles.length < period + 2) return 0;

  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1] as any;
    const cur = candles[i] as any;
    const tr = Math.max(
      Number(cur.high) - Number(cur.low),
      Math.abs(Number(cur.high) - Number(prev.close)),
      Math.abs(Number(cur.low) - Number(prev.close))
    );
    trs.push(tr);
  }

  let atr = trs.slice(0, period).reduce((a, v) => a + v, 0) / period;
  for (let i = period; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
  }
  return atr;
}

function autoRenkoBoxSize(safeRaw: CandlestickData[]) {
  const last = safeRaw[safeRaw.length - 1] as any;
  const lastClose = Number(last?.close ?? 0);
  const atr = calcATR14Simple(safeRaw);
  const box = Math.max(atr * 0.8, lastClose * 0.001);
  return box;
}

function toRenkoCandles(safeRaw: CandlestickData[], boxSize: number): CandlestickData[] {
  if (!safeRaw.length) return [];

  const box = Math.max(Number(boxSize) || 0, 0);
  if (!box || !Number.isFinite(box)) return safeRaw;

  const out: CandlestickData[] = [];
  const first = safeRaw[0] as any;

  let lastClose = Number(first.close);
  let t = (safeRaw[0].time as number) || Math.floor(Date.now() / 1000);

  const nextTime = () => {
    t += 1;
    return t as UTCTimestamp;
  };

  for (let i = 1; i < safeRaw.length; i++) {
    const c = safeRaw[i] as any;
    const price = Number(c.close);

    while (price >= lastClose + box) {
      const open = lastClose;
      const close = lastClose + box;
      out.push({ time: nextTime(), open, high: close, low: open, close });
      lastClose = close;
    }

    while (price <= lastClose - box) {
      const open = lastClose;
      const close = lastClose - box;
      out.push({ time: nextTime(), open, high: open, low: close, close });
      lastClose = close;
    }
  }

  if (!out.length) {
    const base = safeRaw[safeRaw.length - 1] as any;
    const p = Number(base.close);
    out.push({ time: nextTime(), open: p, high: p, low: p, close: p });
  }

  return ensureStrictlyIncreasingTimes(out);
}

/* =========================
   SUPERTREND
========================= */
function buildSupertrendLines(
  safe: CandlestickData[],
  period = 10,
  multiplier = 3,
  prec = 6
) {
  const up: any[] = [];
  const down: any[] = [];

  if (safe.length < period + 2) {
    return { up, down };
  }

  const tr: number[] = new Array(safe.length).fill(0);

  for (let i = 1; i < safe.length; i++) {
    const prev = safe[i - 1] as any;
    const cur = safe[i] as any;

    tr[i] = Math.max(
      toNum(cur.high) - toNum(cur.low),
      Math.abs(toNum(cur.high) - toNum(prev.close)),
      Math.abs(toNum(cur.low) - toNum(prev.close))
    );
  }

  // Wilder / RMA ATR, zgodnie z ta.supertrend() z TradingView.
  const atr: number[] = new Array(safe.length).fill(NaN);

  let seed = 0;
  for (let i = 1; i <= period; i++) {
    seed += tr[i] ?? 0;
  }

  atr[period] = seed / period;

  for (let i = period + 1; i < safe.length; i++) {
    atr[i] =
      (atr[i - 1] * (period - 1) + tr[i]) /
      period;
  }

  const finalUpper: number[] =
    new Array(safe.length).fill(NaN);

  const finalLower: number[] =
    new Array(safe.length).fill(NaN);

  const trendUp: boolean[] =
    new Array(safe.length).fill(true);

  for (let i = period; i < safe.length; i++) {
    const cur = safe[i] as any;

    const hl2 =
      (toNum(cur.high) + toNum(cur.low)) / 2;

    const basicUpper =
      hl2 + multiplier * atr[i];

    const basicLower =
      hl2 - multiplier * atr[i];

    if (i === period) {
      finalUpper[i] = basicUpper;
      finalLower[i] = basicLower;
      trendUp[i] = toNum(cur.close) >= hl2;
    } else {
      const prev = safe[i - 1] as any;

      finalUpper[i] =
        basicUpper < finalUpper[i - 1] ||
        toNum(prev.close) > finalUpper[i - 1]
          ? basicUpper
          : finalUpper[i - 1];

      finalLower[i] =
        basicLower > finalLower[i - 1] ||
        toNum(prev.close) < finalLower[i - 1]
          ? basicLower
          : finalLower[i - 1];

      if (!trendUp[i - 1]) {
        trendUp[i] =
          toNum(cur.close) > finalUpper[i];
      } else {
        trendUp[i] =
          !(toNum(cur.close) < finalLower[i]);
      }
    }

    const t = safe[i].time as UTCTimestamp;
    const decimals =
      Math.min(Math.max(prec + 1, 2), 8);

    const changedDirection =
      i > period &&
      trendUp[i] !== trendUp[i - 1];

    // TradingView używa plot.style_linebr.
    // Na świecy zmiany trendu wstawiamy NA dla OBU linii.
    // Dzięki temu stara linia kończy się przed zmianą, a nowa
    // zaczyna od następnej świecy i zostaje wyraźna luka.
    if (changedDirection) {
      up.push({ time: t });
      down.push({ time: t });
      continue;
    }

    if (trendUp[i]) {
      up.push({
        time: t,
        value: Number(
          finalLower[i].toFixed(decimals)
        ),
      });

      down.push({ time: t });
    } else {
      up.push({ time: t });

      down.push({
        time: t,
        value: Number(
          finalUpper[i].toFixed(decimals)
        ),
      });
    }
  }

  return { up, down };
}

/* =========================
   CANDLE PATTERNS
========================= */
type CandlePattern = {
  time: UTCTimestamp;
  label: string;
  side: "BUY" | "SELL" | "NEUTRAL";
  price: number;
};

function detectCandlePatterns(candles: CandlestickData[]): CandlePattern[] {
  const out: CandlePattern[] = [];
  if (candles.length < 35) return out;

  const n = (v: any) => toNum(v);
  const body = (c: any) => Math.abs(n(c.close) - n(c.open));
  const range = (c: any) => Math.max(1e-12, n(c.high) - n(c.low));
  const bull = (c: any) => n(c.close) > n(c.open);
  const bear = (c: any) => n(c.close) < n(c.open);
  const top = (c: any) => Math.max(n(c.open), n(c.close));
  const bottom = (c: any) => Math.min(n(c.open), n(c.close));
  const upper = (c: any) => n(c.high) - top(c);
  const lower = (c: any) => bottom(c) - n(c.low);
  const mid = (c: any) => (n(c.open) + n(c.close)) / 2;

  const push = (c: any, label: string, side: "BUY" | "SELL") => {
    out.push({
      time: c.time as UTCTimestamp,
      label,
      side,
      price: side === "BUY" ? n(c.low) : n(c.high),
    });
  };

  // ============================================================
  // FX TRADE PRO HYBRID
  //
  // BUY:
  // TREND PASS
  // + HH/HL STRUCTURE PASS
  // + LIQUIDITY SWEEP HL PASS
  // + PRICE ACTION PASS
  // + MOMENTUM/POTWIERDZENIE PASS
  // + BREAKOUT HH PASS
  // = BUY
  //
  // SELL = dokładne odbicie lustrzane:
  // DOWN + LL/LH + sweep LH + bearish PA + momentum + breakout LL.
  // ============================================================

  const SWING = 3;
  const MIN_MOMENTUM_BODY = 0.55;
  const SWEEP_LOOKBACK = 8;

  const isSwingHigh = (idx: number) => {
    if (idx < SWING || idx >= candles.length - SWING) return false;
    const h = n((candles[idx] as any).high);
    for (let j = idx - SWING; j <= idx + SWING; j++) {
      if (j !== idx && n((candles[j] as any).high) >= h) return false;
    }
    return true;
  };

  const isSwingLow = (idx: number) => {
    if (idx < SWING || idx >= candles.length - SWING) return false;
    const l = n((candles[idx] as any).low);
    for (let j = idx - SWING; j <= idx + SWING; j++) {
      if (j !== idx && n((candles[j] as any).low) <= l) return false;
    }
    return true;
  };

  const highs: number[] = [];
  const lows: number[] = [];

  for (let i = SWING; i < candles.length - SWING; i++) {
    if (isSwingHigh(i)) highs.push(i);
    if (isSwingLow(i)) lows.push(i);
  }

  // PRICE ACTION na końcu korekty.
  const bullishPAAt = (i: number) => {
    if (i < 0) return null;
    const c: any = candles[i];

    // Hammer
    if (
      lower(c) >= Math.max(body(c) * 2, range(c) * 0.42) &&
      upper(c) <= Math.max(body(c) * 0.8, range(c) * 0.18)
    ) {
      return { start: i, end: i, label: "HAMMER" };
    }

    // Bullish Engulfing
    if (i >= 1) {
      const p: any = candles[i - 1];
      if (
        bear(p) &&
        bull(c) &&
        bottom(c) <= bottom(p) &&
        top(c) >= top(p) &&
        body(c) >= body(p) * 0.9
      ) {
        return { start: i - 1, end: i, label: "BULL ENGULF" };
      }
    }

    // Morning Star
    if (i >= 2) {
      const a: any = candles[i - 2];
      const b: any = candles[i - 1];
      if (
        bear(a) &&
        body(a) / range(a) >= 0.50 &&
        body(b) / range(b) <= 0.38 &&
        bull(c) &&
        body(c) / range(c) >= 0.50 &&
        n(c.close) > mid(a)
      ) {
        return { start: i - 2, end: i, label: "MORNING STAR" };
      }
    }

    // Bullish Harami
    if (i >= 1) {
      const p: any = candles[i - 1];
      if (
        bear(p) &&
        bull(c) &&
        body(c) < body(p) * 0.65 &&
        top(c) <= top(p) &&
        bottom(c) >= bottom(p)
      ) {
        return { start: i - 1, end: i, label: "BULL HARAMI" };
      }
    }

    return null;
  };

  const bearishPAAt = (i: number) => {
    if (i < 0) return null;
    const c: any = candles[i];

    // Shooting Star
    if (
      upper(c) >= Math.max(body(c) * 2, range(c) * 0.42) &&
      lower(c) <= Math.max(body(c) * 0.8, range(c) * 0.18)
    ) {
      return { start: i, end: i, label: "SHOOTING STAR" };
    }

    // Bearish Engulfing
    if (i >= 1) {
      const p: any = candles[i - 1];
      if (
        bull(p) &&
        bear(c) &&
        bottom(c) <= bottom(p) &&
        top(c) >= top(p) &&
        body(c) >= body(p) * 0.9
      ) {
        return { start: i - 1, end: i, label: "BEAR ENGULF" };
      }
    }

    // Evening Star
    if (i >= 2) {
      const a: any = candles[i - 2];
      const b: any = candles[i - 1];
      if (
        bull(a) &&
        body(a) / range(a) >= 0.50 &&
        body(b) / range(b) <= 0.38 &&
        bear(c) &&
        body(c) / range(c) >= 0.50 &&
        n(c.close) < mid(a)
      ) {
        return { start: i - 2, end: i, label: "EVENING STAR" };
      }
    }

    // Bearish Harami
    if (i >= 1) {
      const p: any = candles[i - 1];
      if (
        bull(p) &&
        bear(c) &&
        body(c) < body(p) * 0.65 &&
        top(c) <= top(p) &&
        bottom(c) >= bottom(p)
      ) {
        return { start: i - 1, end: i, label: "BEAR HARAMI" };
      }
    }

    return null;
  };

  // Liquidity sweep BUY:
  // knot schodzi poniżej wcześniejszego lokalnego minimum,
  // ale świeca zamyka się ponownie NAD tym poziomem.
  const bullishSweepAt = (idx: number) => {
    if (idx < 2) return false;
    const c: any = candles[idx];
    const from = Math.max(0, idx - SWEEP_LOOKBACK);
    const prev = candles.slice(from, idx) as any[];
    if (!prev.length) return false;

    const liquidityLow = Math.min(...prev.map((x) => n(x.low)));
    return n(c.low) < liquidityLow && n(c.close) > liquidityLow;
  };

  // Liquidity sweep SELL:
  // knot wybija wcześniejszy lokalny szczyt,
  // ale świeca zamyka się z powrotem POD nim.
  const bearishSweepAt = (idx: number) => {
    if (idx < 2) return false;
    const c: any = candles[idx];
    const from = Math.max(0, idx - SWEEP_LOOKBACK);
    const prev = candles.slice(from, idx) as any[];
    if (!prev.length) return false;

    const liquidityHigh = Math.max(...prev.map((x) => n(x.high)));
    return n(c.high) > liquidityHigh && n(c.close) < liquidityHigh;
  };

  // ============================================================
  // BUY: HH -> HL -> sweep -> PA -> momentum -> breakout HH
  // ============================================================
  for (let h = 1; h < highs.length; h++) {
    const hhIdx = highs[h];
    const previousHighIdx = highs[h - 1];

    const hh = n((candles[hhIdx] as any).high);
    const previousHigh = n((candles[previousHighIdx] as any).high);

    // STRUCTURE/TREND PASS: Higher High.
    if (hh <= previousHigh) continue;

    const previousLowIdx = [...lows].filter((i) => i < hhIdx).pop();
    const hlIdx = lows.find((i) => i > hhIdx);
    if (previousLowIdx == null || hlIdx == null) continue;

    const previousLow = n((candles[previousLowIdx] as any).low);
    const hl = n((candles[hlIdx] as any).low);

    // STRUCTURE/TREND PASS: Higher Low.
    if (hl <= previousLow) continue;

    // Szukamy PA w strefie HL: od 2 świec przed HL do 4 po HL.
    const paFrom = Math.max(hhIdx + 1, hlIdx - 2);
    const paTo = Math.min(candles.length - 2, hlIdx + 4);

    for (let paIdx = paFrom; paIdx <= paTo; paIdx++) {
      const pa = bullishPAAt(paIdx);
      if (!pa) continue;

      // LIQUIDITY PASS:
      // sweep może być na jednej ze świec samej formacji lub bezpośrednio przed nią.
      let sweepPass = false;
      for (let s = Math.max(hhIdx + 1, pa.start - 1); s <= pa.end; s++) {
        if (bullishSweepAt(s)) {
          sweepPass = true;
          break;
        }
      }
      if (!sweepPass) continue;

      const formation = candles.slice(pa.start, pa.end + 1) as any[];
      const formationHigh = Math.max(...formation.map((c) => n(c.high)));

      // Następna świeca = POTWIERDZENIE/MOMENTUM.
      const confirmIdx = pa.end + 1;
      if (confirmIdx >= candles.length) continue;
      const confirm: any = candles[confirmIdx];

      const momentumPass =
        bull(confirm) &&
        body(confirm) / range(confirm) >= MIN_MOMENTUM_BODY &&
        n(confirm.close) > formationHigh;

      if (!momentumPass) continue;

      // BREAKOUT HH może nastąpić na świecy momentum albo kilka świec później.
      for (let i = confirmIdx; i < candles.length; i++) {
        const c: any = candles[i];

        // Setup zanegowany przed breakoutem.
        if (n(c.close) < hl) break;

        const breakoutPass =
          bull(c) &&
          body(c) / range(c) >= 0.45 &&
          n(c.close) > hh;

        if (breakoutPass) {
          push(c, "BUY", "BUY");
          break;
        }

        // Nie czekamy bez końca na stare setupy.
        if (i - confirmIdx >= 8) break;
      }

      break;
    }
  }

  // ============================================================
  // SELL: LL -> LH -> sweep -> PA -> momentum -> breakout LL
  // ============================================================
  for (let l = 1; l < lows.length; l++) {
    const llIdx = lows[l];
    const previousLowIdx = lows[l - 1];

    const ll = n((candles[llIdx] as any).low);
    const previousLow = n((candles[previousLowIdx] as any).low);

    // STRUCTURE/TREND PASS: Lower Low.
    if (ll >= previousLow) continue;

    const previousHighIdx = [...highs].filter((i) => i < llIdx).pop();
    const lhIdx = highs.find((i) => i > llIdx);
    if (previousHighIdx == null || lhIdx == null) continue;

    const previousHigh = n((candles[previousHighIdx] as any).high);
    const lh = n((candles[lhIdx] as any).high);

    // STRUCTURE/TREND PASS: Lower High.
    if (lh >= previousHigh) continue;

    const paFrom = Math.max(llIdx + 1, lhIdx - 2);
    const paTo = Math.min(candles.length - 2, lhIdx + 4);

    for (let paIdx = paFrom; paIdx <= paTo; paIdx++) {
      const pa = bearishPAAt(paIdx);
      if (!pa) continue;

      let sweepPass = false;
      for (let s = Math.max(llIdx + 1, pa.start - 1); s <= pa.end; s++) {
        if (bearishSweepAt(s)) {
          sweepPass = true;
          break;
        }
      }
      if (!sweepPass) continue;

      const formation = candles.slice(pa.start, pa.end + 1) as any[];
      const formationLow = Math.min(...formation.map((c) => n(c.low)));

      const confirmIdx = pa.end + 1;
      if (confirmIdx >= candles.length) continue;
      const confirm: any = candles[confirmIdx];

      const momentumPass =
        bear(confirm) &&
        body(confirm) / range(confirm) >= MIN_MOMENTUM_BODY &&
        n(confirm.close) < formationLow;

      if (!momentumPass) continue;

      for (let i = confirmIdx; i < candles.length; i++) {
        const c: any = candles[i];

        if (n(c.close) > lh) break;

        const breakoutPass =
          bear(c) &&
          body(c) / range(c) >= 0.45 &&
          n(c.close) < ll;

        if (breakoutPass) {
          push(c, "SELL", "SELL");
          break;
        }

        if (i - confirmIdx >= 8) break;
      }

      break;
    }
  }

  const unique = Array.from(
    new Map(
      out.map((p) => [
        `${Number(p.time)}-${p.label}-${p.side}`,
        p,
      ])
    ).values()
  ).sort((a, b) => Number(a.time) - Number(b.time));

  return unique.slice(-40);
}
/* =========================
   TRADE HELPERS
========================= */
function calcRR(entry: number, sl: number, tp: number) {
  const risk = Math.abs(entry - sl);
  const reward = Math.abs(tp - entry);
  if (!risk) return undefined;
  return reward / risk;
}

function findNearestIndexByTime(
  candles: CandlestickData[],
  target: UTCTimestamp | null | undefined
) {
  if (!candles.length || target == null) return -1;

  let bestIdx = 0;
  let bestDiff = Infinity;

  for (let i = 0; i < candles.length; i++) {
    const diff = Math.abs(Number(candles[i].time) - Number(target));
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  }

  return bestIdx;
}

function makeTradeAnchorKey(symbol: string, tf: string | undefined, levels?: Levels) {
  return [
    symbol,
    tf ?? "",
    levels?.side ?? "",
    levels?.entry ?? "",
    levels?.sl ?? "",
    (levels?.tps ?? []).join(","),
    levels?.tp ?? "",
  ].join("|");
}

function Row({
  label,
  value,
  strong = false,
  valueClassName = "",
}: {
  label: string;
  value: string;
  strong?: boolean;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-2 last:border-b-0 last:pb-0">
      <span className="text-sm font-medium text-slate-400">{label}</span>
      <span
        className={`${
          strong ? "text-[28px] font-black text-white" : "text-base font-semibold text-white"
        } ${valueClassName}`}
      >
        {value}
      </span>
    </div>
  );
}

/* =========================
   COMPONENT
========================= */
export default function MarketChart({
  symbol,
  tf,
  candles,
  liveCandle = null,
  emaConfigs,
  showEma = true,
  emaPeriod = 200,
  bbConfig,
  heikinAshi = false,
  renko = false,
  renkoCandles = [],
  renkoBoxSize,
  showTradeLines = false,
  levels,
  height = 430,
  pricePrecision,
  showEntryTimeMarker = true,
 highlightTime = null,
activeDrawTool = "SELECT",
onDrawToolChange,
showSignalPanel = true,
supertrendEnabled = false,
supertrendPeriod = 10,
supertrendMultiplier = 3,
supertrendUpLineEnabled = true,
supertrendDownLineEnabled = true,
supertrendUpBackground = true,
supertrendDownBackground = true,
supertrendUpColor = "#22c55e",
supertrendDownColor = "#ef4444",
patternsEnabled = false,
}: Props) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const chartRef = React.useRef<IChartApi | null>(null);
  const candleSeriesRef = React.useRef<ISeriesApi<"Candlestick"> | null>(null);

  const emaSeriesMapRef = React.useRef<Map<number, ISeriesApi<"Line">>>(new Map());
  const bbSeriesRef = React.useRef<{
    upper?: ISeriesApi<"Line">;
    basis?: ISeriesApi<"Line">;
    lower?: ISeriesApi<"Line">;
  }>({});

  const supertrendSeriesRef = React.useRef<{
    up?: ISeriesApi<"Line">;
    down?: ISeriesApi<"Line">;
  }>({});

  const tradeLineSeriesRef = React.useRef<{
    entry?: ISeriesApi<"Line">;
    sl?: ISeriesApi<"Line">;
    tps: ISeriesApi<"Line">[];
  }>({ tps: [] });

  const lastBarTimeRef = React.useRef<UTCTimestamp | null>(null);
  const seriesKeyRef = React.useRef<string>("");

  const rawCacheRef = React.useRef<CandlestickData[]>([]);
  const displayCacheRef = React.useRef<CandlestickData[]>([]);

  const frozenAnchorTimeRef = React.useRef<UTCTimestamp | null>(null);
  const frozenAnchorKeyRef = React.useRef<string>("");

  const [freezeDebug, setFreezeDebug] = React.useState<{
    frozen: boolean;
    entry: number | null;
    anchorTime: number | null;
    crossedIdx: number | null;
  }>({
    frozen: false,
    entry: null,
    anchorTime: null,
    crossedIdx: null,
  });

  const [followOnTick, setFollowOnTick] = React.useState<boolean>(() => {
    try {
      const raw = localStorage.getItem("chart_follow_tick");
      if (raw != null) return raw === "1";
    } catch {}
    return true;
  });

  const [rightPadOn, setRightPadOn] = React.useState<boolean>(() => {
    try {
      const raw = localStorage.getItem("chart_right_pad");
      if (raw != null) return raw === "1";
    } catch {}
    return true;
  });

  const [detached, setDetached] = React.useState<boolean>(false);
  const [overlayTick, setOverlayTick] = React.useState(0);
  const rightOffset = rightPadOn ? 28 : 8;

  const patternLabels = React.useMemo(() => {
    if (!patternsEnabled || renko) return [] as Array<{
      key: string;
      x: number;
      y: number;
      label: string;
      side: "BUY" | "SELL" | "NEUTRAL";
    }>;

    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    const safe = displayCacheRef.current;
    if (!chart || !candleSeries || !safe?.length) return [];

    try {
      return detectCandlePatterns(safe).flatMap((p, idx) => {
        const x = chart.timeScale().timeToCoordinate(p.time);
        const y0 = candleSeries.priceToCoordinate(p.price);
        if (x == null || y0 == null) return [];
        const y = Number(y0) + (p.side === "SELL" ? -26 : 14);
        return [{
          key: `${Number(p.time)}-${p.label}-${idx}`,
          x: Number(x),
          y,
          label: p.label,
          side: p.side,
        }];
      });
    } catch {
      return [];
    }
  }, [patternsEnabled, overlayTick, candles, liveCandle, heikinAshi, renko]);

  // ============================================================
  // AUTO STREFY DLA NOWEJ LOGIKI HH/HL / LL/LH
  //
  // Jeżeli główny skaner nie przekazał aktywnych `levels`,
  // a FORMATIONS wykryje świeży BUY/SELL, MarketChart sam wyznaczy:
  // ENTRY, SL, TP1 = 1R, TP2 = 2R, TP3 = 3R.
  //
  // BUY: SL pod ostatnim lokalnym HL / dołkiem przed wybiciem.
  // SELL: SL nad ostatnim lokalnym LH / szczytem przed wybiciem.
  // ============================================================
  const patternTradeLevels = React.useMemo<Levels | undefined>(() => {
    if (!patternsEnabled || renko) return undefined;

    const safe = displayCacheRef.current;
    if (!safe?.length) return undefined;

    const signals = detectCandlePatterns(safe);
    const latest = signals[signals.length - 1];
    if (!latest) return undefined;

    const signalIdx = safe.findIndex(
      (c) => Number(c.time) === Number(latest.time)
    );
    if (signalIdx < 0) return undefined;

    // Nie pokazujemy starych, historycznych stref jako aktywnego setupu.
    // Sygnał musi należeć do 4 najnowszych świec.
    if (signalIdx < safe.length - 4) return undefined;

    const signal = safe[signalIdx] as any;
    const entry = toNum(signal.close);
    if (!Number.isFinite(entry) || entry <= 0) return undefined;

    const lookbackFrom = Math.max(0, signalIdx - 12);
    const beforeSignal = safe.slice(lookbackFrom, signalIdx + 1) as any[];
    if (!beforeSignal.length) return undefined;

    const atr = calcATR14Simple(safe.slice(Math.max(0, signalIdx - 30), signalIdx + 1));
    const fallbackBuffer = Math.max(entry * 0.0005, atr * 0.12);

    if (latest.side === "BUY") {
      // HL / najniższy lokalny dołek korekty przed breakoutem.
      const structureLow = Math.min(
        ...beforeSignal
          .slice(0, -1)
          .map((c) => toNum(c.low))
          .filter(Number.isFinite)
      );

      if (!Number.isFinite(structureLow)) return undefined;

      const sl = structureLow - fallbackBuffer;
      const risk = entry - sl;
      if (!Number.isFinite(risk) || risk <= 0) return undefined;

      const tp1 = entry + risk;
      const tp2 = entry + risk * 2;
      const tp3 = entry + risk * 3;
      const entryPad = Math.max(risk * 0.05, atr * 0.05, entry * 0.00008);

      return {
        side: "BUY",
        entry,
        sl,
        tps: [tp1, tp2, tp3],
        rr: 3,
        zones: [
          { label: "ENTRY", from: entry - entryPad, to: entry + entryPad },
          { label: "SL", from: sl - entryPad, to: sl + entryPad },
          { label: "TP1", from: tp1 - entryPad, to: tp1 + entryPad },
          { label: "TP2", from: tp2 - entryPad, to: tp2 + entryPad },
          { label: "TP3", from: tp3 - entryPad, to: tp3 + entryPad },
        ],
      };
    }

    if (latest.side === "SELL") {
      // LH / najwyższy lokalny szczyt korekty przed breakoutem.
      const structureHigh = Math.max(
        ...beforeSignal
          .slice(0, -1)
          .map((c) => toNum(c.high))
          .filter(Number.isFinite)
      );

      if (!Number.isFinite(structureHigh)) return undefined;

      const sl = structureHigh + fallbackBuffer;
      const risk = sl - entry;
      if (!Number.isFinite(risk) || risk <= 0) return undefined;

      const tp1 = entry - risk;
      const tp2 = entry - risk * 2;
      const tp3 = entry - risk * 3;
      const entryPad = Math.max(risk * 0.05, atr * 0.05, entry * 0.00008);

      return {
        side: "SELL",
        entry,
        sl,
        tps: [tp1, tp2, tp3],
        rr: 3,
        zones: [
          { label: "ENTRY", from: entry - entryPad, to: entry + entryPad },
          { label: "SL", from: sl - entryPad, to: sl + entryPad },
          { label: "TP1", from: tp1 - entryPad, to: tp1 + entryPad },
          { label: "TP2", from: tp2 - entryPad, to: tp2 + entryPad },
          { label: "TP3", from: tp3 - entryPad, to: tp3 + entryPad },
        ],
      };
    }

    return undefined;
  }, [patternsEnabled, overlayTick, candles, liveCandle, heikinAshi, renko]);

  // Priorytet ma setup przesłany z głównego skanera.
  // Jeśli go nie ma, używamy stref z HH/HL / LL/LH breakout.
  const activeLevels = showTradeLines && levels ? levels : patternTradeLevels;
  const activeShowTradeLines = !!activeLevels;

  const bbFillOverlay = React.useMemo(() => {
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    const bb = bbConfig;

    if (
      !chart ||
      !candleSeries ||
      !bb?.enabled ||
      !bb.background?.enabled
    ) {
      return { points: "", color: "transparent" };
    }

    const safe = displayCacheRef.current;
    if (!safe?.length) {
      return { points: "", color: "transparent" };
    }

    try {
      const lines = buildBbLines(safe, bb, pricePrecision ?? 8);
      const count = Math.min(lines.upper.length, lines.lower.length);
      if (count < 2) return { points: "", color: "transparent" };

      const upperPoints: string[] = [];
      const lowerPoints: string[] = [];

      for (let i = 0; i < count; i++) {
        const upper = lines.upper[i] as any;
        const lower = lines.lower[i] as any;

        const x = chart.timeScale().timeToCoordinate(upper.time);
        const yu = candleSeries.priceToCoordinate(upper.value);
        const yl = candleSeries.priceToCoordinate(lower.value);

        if (
          x == null ||
          yu == null ||
          yl == null ||
          !Number.isFinite(Number(x)) ||
          !Number.isFinite(Number(yu)) ||
          !Number.isFinite(Number(yl))
        ) {
          continue;
        }

        upperPoints.push(`${Number(x)},${Number(yu)}`);
        lowerPoints.push(`${Number(x)},${Number(yl)}`);
      }

      if (upperPoints.length < 2 || lowerPoints.length < 2) {
        return { points: "", color: "transparent" };
      }

      const opacity = Math.max(
        0,
        Math.min(0.5, Number(bb.background.opacity ?? 0.12))
      );
      const color = hexToRgba(bb.background.color ?? "#2563eb", opacity);

      return {
        points: [...upperPoints, ...lowerPoints.reverse()].join(" "),
        color,
      };
    } catch {
      return { points: "", color: "transparent" };
    }
  }, [
    overlayTick,
    bbConfig,
    candles,
    liveCandle,
    heikinAshi,
    renko,
    renkoBoxSize,
    pricePrecision,
  ]);

  const supertrendStrokePaths = React.useMemo(() => {
    if (!supertrendEnabled) {
      return {
        up: [] as string[],
        down: [] as string[],
      };
    }

    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    const safe = displayCacheRef.current;

    if (!chart || !candleSeries || !safe?.length) {
      return {
        up: [] as string[],
        down: [] as string[],
      };
    }

    try {
      const st = buildSupertrendLines(
        safe,
        Math.max(2, Math.floor(supertrendPeriod)),
        Math.max(0.1, Number(supertrendMultiplier)),
        pricePrecision ?? 8
      );

      const toPaths = (line: any[]) => {
        const paths: string[] = [];
        let points: string[] = [];

        const flush = () => {
          if (points.length >= 2) {
            paths.push(points.join(" "));
          }
          points = [];
        };

        for (const p of line) {
          if (!Number.isFinite(Number((p as any).value))) {
            flush();
            continue;
          }

          const x =
            chart.timeScale().timeToCoordinate(
              (p as any).time
            );

          const y =
            candleSeries.priceToCoordinate(
              Number((p as any).value)
            );

          if (
            x == null ||
            y == null ||
            !Number.isFinite(Number(x)) ||
            !Number.isFinite(Number(y))
          ) {
            flush();
            continue;
          }

          points.push(`${Number(x)},${Number(y)}`);
        }

        flush();
        return paths;
      };

      return {
        up: toPaths(st.up as any[]),
        down: toPaths(st.down as any[]),
      };
    } catch {
      return {
        up: [] as string[],
        down: [] as string[],
      };
    }
  }, [
    overlayTick,
    supertrendEnabled,
    supertrendPeriod,
    supertrendMultiplier,
    supertrendUpLineEnabled,
    supertrendDownLineEnabled,
    supertrendUpColor,
    supertrendDownColor,
    candles,
    liveCandle,
    heikinAshi,
    renko,
    renkoBoxSize,
    pricePrecision,
  ]);

  const supertrendFillPolygons = React.useMemo(() => {
    if (!supertrendEnabled) {
      return [] as Array<{
        key: string;
        points: string;
        fill: string;
      }>;
    }

    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    const safe = displayCacheRef.current;

    if (!chart || !candleSeries || !safe?.length) {
      return [];
    }

    try {
      const st = buildSupertrendLines(
        safe,
        Math.max(2, Math.floor(supertrendPeriod)),
        Math.max(0.1, Number(supertrendMultiplier)),
        pricePrecision ?? 8
      );

      // TradingView:
      // bodyMiddle = (open + close) / 2
      const bodyMiddleMap = new Map<number, number>();

      for (const c of safe) {
        const anyC = c as any;
        bodyMiddleMap.set(
          Number(c.time),
          (toNum(anyC.open) + toNum(anyC.close)) / 2
        );
      }

      const buildPolygons = (
        line: any[],
        enabled: boolean,
        fill: string,
        prefix: string
      ) => {
        if (!enabled) {
          return [] as Array<{
            key: string;
            points: string;
            fill: string;
          }>;
        }

        const segments: Array<
          Array<{
            x: number;
            yLine: number;
            yBody: number;
          }>
        > = [];

        let current: Array<{
          x: number;
          yLine: number;
          yBody: number;
        }> = [];

        const flush = () => {
          if (current.length >= 2) {
            segments.push(current);
          }
          current = [];
        };

        for (const p of line) {
          // Gdy buildSupertrendLines daje brak value,
          // traktujemy to jak fillgaps=false z TradingView.
          if (!Number.isFinite(Number((p as any).value))) {
            flush();
            continue;
          }

          const bodyMiddle =
            bodyMiddleMap.get(Number((p as any).time));

          if (!Number.isFinite(Number(bodyMiddle))) {
            flush();
            continue;
          }

          const x =
            chart.timeScale().timeToCoordinate(
              (p as any).time
            );

          const yLine =
            candleSeries.priceToCoordinate(
              Number((p as any).value)
            );

          const yBody =
            candleSeries.priceToCoordinate(
              Number(bodyMiddle)
            );

          if (
            x == null ||
            yLine == null ||
            yBody == null ||
            !Number.isFinite(Number(x)) ||
            !Number.isFinite(Number(yLine)) ||
            !Number.isFinite(Number(yBody))
          ) {
            flush();
            continue;
          }

          current.push({
            x: Number(x),
            yLine: Number(yLine),
            yBody: Number(yBody),
          });
        }

        flush();

        return segments.map((segment, index) => {
          const bodySide =
            segment.map(
              (p) => `${p.x},${p.yBody}`
            );

          const lineSide =
            [...segment]
              .reverse()
              .map(
                (p) => `${p.x},${p.yLine}`
              );

          return {
            key: `${prefix}-${index}`,
            points: [
              ...bodySide,
              ...lineSide,
            ].join(" "),
            fill,
          };
        });
      };

      return [
        ...buildPolygons(
          st.up as any[],
          supertrendUpBackground,
          hexToRgba(
            supertrendUpColor,
            0.10
          ),
          "st-up"
        ),
        ...buildPolygons(
          st.down as any[],
          supertrendDownBackground,
          hexToRgba(
            supertrendDownColor,
            0.10
          ),
          "st-down"
        ),
      ];
    } catch {
      return [];
    }
  }, [
    overlayTick,
    supertrendEnabled,
    supertrendPeriod,
    supertrendMultiplier,
    supertrendUpBackground,
    supertrendDownBackground,
    supertrendUpColor,
    supertrendDownColor,
    candles,
    liveCandle,
    heikinAshi,
    renko,
    renkoBoxSize,
    pricePrecision,
  ]);

  React.useEffect(() => {
    try {
      localStorage.setItem("chart_follow_tick", followOnTick ? "1" : "0");
      localStorage.setItem("chart_right_pad", rightPadOn ? "1" : "0");
    } catch {}
  }, [followOnTick, rightPadOn]);

  React.useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.applyOptions({ timeScale: { rightOffset } });
    setOverlayTick((v) => v + 1);
    if (followOnTick && !detached) {
      try {
        chart.timeScale().scrollToRealTime();
      } catch {}
    }
  }, [rightOffset, followOnTick, detached]);

  // Jedno źródło ustawień Renko:
  // renkoBoxSize > 0 = MANUAL
  // brak / 0 = AUTO ATR(14) × 0.8, minimum 0.1% ceny.
  const currentRenkoBox = React.useMemo(() => {
    const source =
      renkoCandles && renkoCandles.length
        ? normalizeCandles(renkoCandles)
        : normalizeCandles(candles ?? []);

    if (!source.length) return 0;

    const manual = Number(renkoBoxSize);
    if (Number.isFinite(manual) && manual > 0) return manual;

    return autoRenkoBoxSize(source);
  }, [renkoBoxSize, renkoCandles, candles]);

  const effectiveEmaConfigs = React.useMemo(() => {
    if (emaConfigs !== undefined) {
      return (emaConfigs ?? [])
        .filter((x) => Number.isFinite(x.period) && x.period > 0)
        .map((x) => ({
          period: Math.floor(x.period),
          color: x.color || "#e2e8f0",
          width: (x.width ?? 2) as 1 | 2 | 3 | 4,
        }));
    }
    return showEma ? [{ period: emaPeriod, color: "#3b82f6", width: 2 as const }] : [];
  }, [emaConfigs, showEma, emaPeriod]);

  function ensureEmaSeries(period: number, colorHex: string, width: 1 | 2 | 3 | 4) {
    const chart = chartRef.current;
    if (!chart) return null;

    const map = emaSeriesMapRef.current;
    const existing = map.get(period);
    if (existing) {
      existing.applyOptions({
        color: hexToRgba(colorHex, 0.95),
        lineWidth: width as any,
        visible: true,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      return existing;
    }

    const series = chart.addLineSeries({
      color: hexToRgba(colorHex, 0.95),
      lineWidth: width as any,
      visible: true,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    map.set(period, series);
    return series;
  }

  function removeEmaSeries(period: number) {
    const chart = chartRef.current;
    if (!chart) return;
    const map = emaSeriesMapRef.current;
    const s = map.get(period);
    if (!s) return;
    try {
      chart.removeSeries(s);
    } catch {}
    map.delete(period);
  }

  function ensureBbSeries(bb: BbConfig) {
    const chart = chartRef.current;
    if (!chart) return;

    const colors = {
      upper: bb?.colors?.upper ?? "#a855f7",
      basis: bb?.colors?.basis ?? "#e2e8f0",
      lower: bb?.colors?.lower ?? "#a855f7",
    };

    const widths = {
      upper: (bb?.widths?.upper ?? 2) as 1 | 2 | 3 | 4,
      basis: (bb?.widths?.basis ?? 2) as 1 | 2 | 3 | 4,
      lower: (bb?.widths?.lower ?? 2) as 1 | 2 | 3 | 4,
    };

    if (!bbSeriesRef.current.upper) {
      bbSeriesRef.current.upper = chart.addLineSeries({
        color: hexToRgba(colors.upper, 0.9),
        lineWidth: widths.upper as any,
        visible: true,
        priceLineVisible: false,
        lastValueVisible: false,
      });
    } else {
      bbSeriesRef.current.upper.applyOptions({
        color: hexToRgba(colors.upper, 0.9),
        lineWidth: widths.upper as any,
        visible: true,
        priceLineVisible: false,
        lastValueVisible: false,
      });
    }

    if (!bbSeriesRef.current.basis) {
      bbSeriesRef.current.basis = chart.addLineSeries({
        color: hexToRgba(colors.basis, 0.8),
        lineWidth: widths.basis as any,
        lineStyle: LineStyle.Dotted,
        visible: true,
        priceLineVisible: false,
        lastValueVisible: false,
      });
    } else {
      bbSeriesRef.current.basis.applyOptions({
        color: hexToRgba(colors.basis, 0.8),
        lineWidth: widths.basis as any,
        lineStyle: LineStyle.Dotted,
        visible: true,
        priceLineVisible: false,
        lastValueVisible: false,
      });
    }

    if (!bbSeriesRef.current.lower) {
      bbSeriesRef.current.lower = chart.addLineSeries({
        color: hexToRgba(colors.lower, 0.9),
        lineWidth: widths.lower as any,
        visible: true,
        priceLineVisible: false,
        lastValueVisible: false,
      });
    } else {
      bbSeriesRef.current.lower.applyOptions({
        color: hexToRgba(colors.lower, 0.9),
        lineWidth: widths.lower as any,
        visible: true,
        priceLineVisible: false,
        lastValueVisible: false,
      });
    }
  }

  function ensureSupertrendSeries() {
    const chart = chartRef.current;
    if (!chart) return;

    if (!supertrendSeriesRef.current.up) {
      supertrendSeriesRef.current.up = chart.addLineSeries({
        color: supertrendUpColor,
        lineWidth: 4,
        visible: supertrendUpLineEnabled,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
    } else {
      supertrendSeriesRef.current.up.applyOptions({
        color: supertrendUpColor,
        lineWidth: 4,
        visible: supertrendUpLineEnabled,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
    }

    if (!supertrendSeriesRef.current.down) {
      supertrendSeriesRef.current.down = chart.addLineSeries({
        color: supertrendDownColor,
        lineWidth: 4,
        visible: supertrendDownLineEnabled,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
    } else {
      supertrendSeriesRef.current.down.applyOptions({
        color: supertrendDownColor,
        lineWidth: 4,
        visible: supertrendDownLineEnabled,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
    }
  }

  const clearTradeLineSeries = React.useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return;
    try {
      if (tradeLineSeriesRef.current.entry) chart.removeSeries(tradeLineSeriesRef.current.entry);
      if (tradeLineSeriesRef.current.sl) chart.removeSeries(tradeLineSeriesRef.current.sl);
      for (const s of tradeLineSeriesRef.current.tps) chart.removeSeries(s);
    } catch {}
    tradeLineSeriesRef.current = { tps: [] };
  }, []);

  const applyIndicators = React.useCallback(
    (safeForChart: CandlestickData[], prec: number, minMove: number) => {
      const chart = chartRef.current;
      if (!chart || !safeForChart.length) return;

      const want = new Set<number>(effectiveEmaConfigs.map((c) => c.period));

      for (const p of Array.from(emaSeriesMapRef.current.keys())) {
        if (!want.has(p)) removeEmaSeries(p);
      }

      const closes = safeForChart.map((c) => toNum((c as any).close));

      for (const cfg of effectiveEmaConfigs) {
        const period = Math.max(1, Math.floor(cfg.period));
        const s = ensureEmaSeries(period, cfg.color, cfg.width);
        if (!s) continue;

        s.applyOptions({
          priceFormat: { type: "price", precision: prec, minMove },
          visible: true,
          priceLineVisible: false,
          lastValueVisible: false,
        });

        const emaArr = calcEMA(closes, period);
        const data: LineData[] = safeForChart.map((c, i) => ({
          time: c.time as UTCTimestamp,
          value: Number(emaArr[i].toFixed(Math.min(prec + 1, 8))),
        }));
        s.setData(data);
      }

      const bb = bbConfig;
      if (bb?.enabled) {
        ensureBbSeries(bb);
        const lines = buildBbLines(safeForChart, bb, prec);

        bbSeriesRef.current.upper?.applyOptions({
          visible: true,
          priceFormat: { type: "price", precision: prec, minMove },
          priceLineVisible: false,
          lastValueVisible: false,
        });
        bbSeriesRef.current.basis?.applyOptions({
          visible: true,
          priceFormat: { type: "price", precision: prec, minMove },
          priceLineVisible: false,
          lastValueVisible: false,
        });
        bbSeriesRef.current.lower?.applyOptions({
          visible: true,
          priceFormat: { type: "price", precision: prec, minMove },
          priceLineVisible: false,
          lastValueVisible: false,
        });

        bbSeriesRef.current.upper?.setData(lines.upper);
        bbSeriesRef.current.basis?.setData(lines.basis);
        bbSeriesRef.current.lower?.setData(lines.lower);
      } else {
        bbSeriesRef.current.upper?.setData([]);
        bbSeriesRef.current.basis?.setData([]);
        bbSeriesRef.current.lower?.setData([]);

        bbSeriesRef.current.upper?.applyOptions({ visible: false });
        bbSeriesRef.current.basis?.applyOptions({ visible: false });
        bbSeriesRef.current.lower?.applyOptions({ visible: false });
      }

      if (supertrendEnabled) {
        ensureSupertrendSeries();

        const st = buildSupertrendLines(
          safeForChart,
          Math.max(2, Math.floor(supertrendPeriod)),
          Math.max(0.1, Number(supertrendMultiplier)),
          prec
        );

        // WAŻNE: właściwe grube linie SuperTrend rysujemy w warstwie SVG
        // (supertrendStrokePaths). Natywne serie lightweight-charts są ukryte,
        // ponieważ potrafią połączyć dwa segmenty cienką ukośną linią
        // podczas zmiany trendu. Dzięki temu po zmianie kierunku zostaje luka.
        supertrendSeriesRef.current.up?.applyOptions({
          color: supertrendUpColor,
          visible: false,
          priceFormat: { type: "price", precision: prec, minMove },
        });
        supertrendSeriesRef.current.down?.applyOptions({
          color: supertrendDownColor,
          visible: false,
          priceFormat: { type: "price", precision: prec, minMove },
        });

        supertrendSeriesRef.current.up?.setData([]);
        supertrendSeriesRef.current.down?.setData([]);
      } else {
        supertrendSeriesRef.current.up?.setData([]);
        supertrendSeriesRef.current.down?.setData([]);
        supertrendSeriesRef.current.up?.applyOptions({ visible: false });
        supertrendSeriesRef.current.down?.applyOptions({ visible: false });
      }
    },
    [
      bbConfig,
      effectiveEmaConfigs,
      supertrendEnabled,
      supertrendPeriod,
      supertrendMultiplier,
      supertrendUpLineEnabled,
      supertrendDownLineEnabled,
      supertrendUpColor,
      supertrendDownColor,
    ]
  );

  const [zoneRects, setZoneRects] = React.useState<
    Array<{
      key: string;
      x: number;
      w: number;
      y: number;
      h: number;
      kind: "TP1" | "TP2" | "TP3" | "SL" | "ENTRY";
    }>
  >([]);

  const [overlayLines, setOverlayLines] = React.useState<
    Array<{ key: string; x: number; w: number; y: number; color: string; width: number }>
  >([]);

  const [zoneLabels, setZoneLabels] = React.useState<
    Array<{
      key: string;
      y: number;
      text: string;
      kind: "TP1" | "TP2" | "TP3" | "SL" | "ENTRY";
      price?: number;
    }>
  >([]);

  const applyTradeLinesWithLevels = React.useCallback(
    (
      safeForChart: CandlestickData[],
      prec: number,
      startT: UTCTimestamp,
      drawLevels: Levels
    ) => {
      const chart = chartRef.current;
      const candleSeries = candleSeriesRef.current;
      if (!chart || !candleSeries || !drawLevels || !safeForChart.length) return;

      clearTradeLineSeries();

      const tps = (
        drawLevels.tps?.length ? drawLevels.tps : drawLevels.tp !== undefined ? [drawLevels.tp] : []
      )
        .filter((x) => Number.isFinite(x))
        .slice(0, 3) as number[];

      const rr =
        drawLevels.rr ??
        (tps.length ? calcRR(drawLevels.entry, drawLevels.sl, tps[tps.length - 1]) : undefined);
      const rrText = rr !== undefined ? `RR ${rr.toFixed(2)}` : "";

      const side: "BUY" | "SELL" =
        drawLevels.side ?? (tps[0] !== undefined && tps[0] < drawLevels.entry ? "SELL" : "BUY");

      const markers: SeriesMarker<UTCTimestamp>[] = [];

      if (highlightTime != null) {
        const signalIdx = findNearestIndexByTime(safeForChart, highlightTime);
        const signalTime =
          signalIdx >= 0 ? (safeForChart[signalIdx].time as UTCTimestamp) : startT;

        markers.push({
          time: signalTime,
          position: side === "BUY" ? "belowBar" : "aboveBar",
          color: "rgba(245,200,76,0.98)",
          shape: side === "BUY" ? "arrowUp" : "arrowDown",
          text: "SIGNAL",
        });
      }

      if (showEntryTimeMarker && safeForChart.length) {
        markers.push({
          time: startT,
          position: side === "BUY" ? "belowBar" : "aboveBar",
          color: side === "BUY" ? "rgba(16,185,129,0.95)" : "rgba(239,68,68,0.95)",
          shape: side === "BUY" ? "arrowUp" : "arrowDown",
          text: rrText ? `Entry • ${rrText}` : "Entry",
        });
      }

      const sortedMarkers = markers
        .filter((m) => m.time != null && Number.isFinite(Number(m.time)))
        .sort((a, b) => Number(a.time) - Number(b.time));

      candleSeries.setMarkers(sortedMarkers);
    },
    [showEntryTimeMarker, highlightTime, clearTradeLineSeries]
  );

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch {}
      chartRef.current = null;
      candleSeriesRef.current = null;
    }

    const chart = createChart(el, {
      width: el.clientWidth || 800,
      height,
      layout: {
        background: { color: "#0B1220" },
        textColor: "#d1d5db",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.05)" },
        horzLines: { color: "rgba(255,255,255,0.05)" },
      },
      rightPriceScale: {
        visible: true,
        borderVisible: true,
        borderColor: "rgba(148,163,184,0.32)",
        entireTextOnly: false,
        scaleMargins: {
          top: 0.08,
          bottom: 0.12,
        },
      },
      timeScale: {
        borderVisible: true,
        borderColor: "rgba(148,163,184,0.32)",
        rightOffset,
        barSpacing: 10,
        minBarSpacing: 2,
        fixLeftEdge: false,
        fixRightEdge: false,
        lockVisibleTimeRangeOnResize: false,
        rightBarStaysOnScroll: true,
        timeVisible: true,
        secondsVisible: false,
      },
handleScroll: {
  pressedMouseMove: true,
  horzTouchDrag: true,
  vertTouchDrag: true,
  mouseWheel: true,
},

handleScale: {
  mouseWheel: true,
  pinch: true,
  axisPressedMouseMove: {
    time: true,
    price: true,
  },
  axisDoubleClickReset: true,
},

kineticScroll: {
  mouse: true,
  touch: true,
},
      crosshair: { mode: CrosshairMode.Normal },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#22C55E",
      downColor: "#EF4444",
      borderVisible: false,
      wickUpColor: "#22C55E",
      wickDownColor: "#EF4444",

      // Zostawiamy tylko aktualną linię ceny.
      priceLineVisible: true,
      lastValueVisible: true,
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    const onRangeChange = () => {
      try {
        setOverlayTick((v) => v + 1);

        const ts: any = chart.timeScale();
        const ds = displayCacheRef.current;
        if (!ds?.length) return;

        const TH = 6;

        const lr = ts.getVisibleLogicalRange?.();
        if (lr && typeof lr.to === "number") {
          const approxLast = ds.length - 1;
          setDetached(approxLast - lr.to > TH);
          return;
        }

        const vr = ts.getVisibleRange?.();
        const last = lastBarTimeRef.current;
        if (vr && last) {
          const maxT = (vr.to as number) ?? 0;
          setDetached((last as number) - maxT > TH);
        }
      } catch {}
    };

    try {
      (chart.timeScale() as any).subscribeVisibleTimeRangeChange?.(onRangeChange);
      (chart.timeScale() as any).subscribeVisibleLogicalRangeChange?.(onRangeChange);
    } catch {}

    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: el.clientWidth || 800, height });
      setOverlayTick((v) => v + 1);
    });
    ro.observe(el);

    return () => {
      ro.disconnect();

      try {
        (chart.timeScale() as any).unsubscribeVisibleTimeRangeChange?.(onRangeChange);
        (chart.timeScale() as any).unsubscribeVisibleLogicalRangeChange?.(onRangeChange);
      } catch {}

      clearTradeLineSeries();
      for (const p of Array.from(emaSeriesMapRef.current.keys())) {
        removeEmaSeries(p);
      }

      try {
        if (bbSeriesRef.current.upper) chart.removeSeries(bbSeriesRef.current.upper);
        if (bbSeriesRef.current.basis) chart.removeSeries(bbSeriesRef.current.basis);
        if (bbSeriesRef.current.lower) chart.removeSeries(bbSeriesRef.current.lower);
      } catch {}

      bbSeriesRef.current = {};

      try {
        chart.remove();
      } catch {}

      chartRef.current = null;
      candleSeriesRef.current = null;

      setZoneRects([]);
      setOverlayLines([]);
      setZoneLabels([]);

      rawCacheRef.current = [];
      displayCacheRef.current = [];
      lastBarTimeRef.current = null;
      seriesKeyRef.current = "";
      frozenAnchorTimeRef.current = null;
      frozenAnchorKeyRef.current = "";
      setFreezeDebug({
        frozen: false,
        entry: null,
        anchorTime: null,
        crossedIdx: null,
      });
    };
  }, [clearTradeLineSeries, height, rightOffset]);

  React.useEffect(() => {
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    if (!chart || !candleSeries) return;

    const safeRaw = normalizeCandles(candles ?? []);
    rawCacheRef.current = safeRaw;

    if (!safeRaw.length) {
      candleSeries.setData([]);
      setZoneRects([]);
      setOverlayLines([]);
      setZoneLabels([]);
      displayCacheRef.current = [];
      setFreezeDebug({
        frozen: false,
        entry: null,
        anchorTime: null,
        crossedIdx: null,
      });
      return;
    }

    const lastCloseRaw = toNum((safeRaw[safeRaw.length - 1] as any)?.close);
    const prec = pricePrecision ?? guessPrecision(symbol, lastCloseRaw);
    const minMove = minMoveFromPrecision(prec);

    candleSeries.applyOptions({
      priceFormat: { type: "price", precision: prec, minMove },
    });

    let safeForChart = safeRaw;

    if (renko) {
      const renkoRaw =
        renkoCandles && renkoCandles.length
          ? normalizeCandles(renkoCandles)
          : safeRaw;

      const manualBox = Number(renkoBoxSize);
      const box =
        Number.isFinite(manualBox) && manualBox > 0
          ? manualBox
          : autoRenkoBoxSize(renkoRaw);

      safeForChart = toRenkoCandles(renkoRaw, box);
    } else if (heikinAshi) {
      safeForChart = toHeikinAshi(safeRaw);
    }

    displayCacheRef.current = safeForChart;
    candleSeries.setData(safeForChart);

    lastBarTimeRef.current = safeForChart.length
      ? (safeForChart[safeForChart.length - 1].time as UTCTimestamp)
      : null;

    const keyNow = `${symbol}|${tf ?? ""}`;
    const isNewSeries = seriesKeyRef.current !== keyNow;
    seriesKeyRef.current = keyNow;

    if (isNewSeries) {
      try {
        chart.timeScale().fitContent();
      } catch {}
    } else if (followOnTick && !detached) {
      try {
        chart.timeScale().scrollToRealTime();
      } catch {}
    }

    applyIndicators(safeForChart, prec, minMove);

    // Odśwież także wypełnienie pomiędzy górnym i dolnym pasmem BB.
    requestAnimationFrame(() => setOverlayTick((v) => v + 1));

    const anchorKey = makeTradeAnchorKey(symbol, tf, activeLevels);

    if (frozenAnchorKeyRef.current !== anchorKey) {
      frozenAnchorKeyRef.current = anchorKey;
      frozenAnchorTimeRef.current = null;
      setFreezeDebug({
        frozen: false,
        entry: activeLevels?.entry ?? null,
        anchorTime: null,
        crossedIdx: null,
      });
    }

    if (frozenAnchorTimeRef.current == null && activeShowTradeLines && activeLevels && safeForChart.length) {
  const signalIdx =
    highlightTime != null ? findNearestIndexByTime(safeForChart, highlightTime) : 0;

  const anchorIdx = signalIdx >= 0 ? signalIdx : Math.max(0, safeForChart.length - 1);
  const anchorTime = safeForChart[anchorIdx].time as UTCTimestamp;

  frozenAnchorTimeRef.current = anchorTime;

  setFreezeDebug({
    frozen: true,
    entry: activeLevels.entry,
    anchorTime: Number(anchorTime),
    crossedIdx: anchorIdx,
  });
}
    const anchorTime = frozenAnchorTimeRef.current;

    if (activeShowTradeLines && activeLevels && safeForChart.length && anchorTime != null) {
      applyTradeLinesWithLevels(safeForChart, prec, anchorTime, activeLevels);

      const containerW = containerRef.current?.clientWidth ?? 0;
      const RIGHT_MARGIN_PX = rightUiReservePx(rightPadOn);
      const LABEL_GAP_PX = 14;
      const ZONE_TO_LABEL_GAP_PX = 18;

      const startXCoord = chart.timeScale().timeToCoordinate(anchorTime);

      if (startXCoord == null || !Number.isFinite(Number(startXCoord))) {
        setZoneRects([]);
        setOverlayLines([]);
        setZoneLabels([]);
        return;
      }

      const startX = Number(startXCoord);
      const endX = containerW - RIGHT_MARGIN_PX - LABEL_GAP_PX - ZONE_TO_LABEL_GAP_PX;
      const zoneW = Math.max(1, endX - startX);

      const tps = (
        activeLevels.tps?.length ? activeLevels.tps : activeLevels.tp !== undefined ? [activeLevels.tp] : []
      )
        .filter((x) => Number.isFinite(x))
        .slice(0, 3) as number[];

      const tp1 = tps[0];
      const tp2 = tps[1];
      const tp3 = tps[2];

      const side: "BUY" | "SELL" =
        activeLevels.side ?? (tp1 !== undefined && tp1 < activeLevels.entry ? "SELL" : "BUY");

      const zr: Array<{
        key: string;
        x: number;
        w: number;
        y: number;
        h: number;
        kind: "TP1" | "TP2" | "TP3" | "SL" | "ENTRY";
      }> = [];

      const ol: Array<{
        key: string;
        x: number;
        w: number;
        y: number;
        color: string;
        width: number;
      }> = [];

      const lbls: Array<{
        key: string;
        y: number;
        text: string;
        kind: "TP1" | "TP2" | "TP3" | "SL" | "ENTRY";
        price?: number;
      }> = [];

      const addBand = (
        from: number,
        to: number,
        kind: "TP1" | "TP2" | "TP3" | "SL" | "ENTRY",
        key: string
      ) => {
        const y1p = candleSeries.priceToCoordinate(from);
        const y2p = candleSeries.priceToCoordinate(to);
        if (y1p == null || y2p == null) return;

        const y1n = y1p as number;
        const y2n = y2p as number;

        const top = Math.min(y1n, y2n);
        const bottom = Math.max(y1n, y2n);
        const minHeight = kind === "ENTRY" ? 18 : 6;
        const h = Math.max(minHeight, bottom - top);

        zr.push({
          key,
          x: startX,
          w: zoneW,
          y: top,
          h,
          kind,
        });
      };

      const addOL = (price: number, key: string, color: string, widthPx: number) => {
        const yv = candleSeries.priceToCoordinate(price);
        if (yv == null) return;
        const y = yv as number;
        ol.push({ key, x: startX, w: zoneW, y, color, width: widthPx });
      };

      const addLabelAtPrice = (
        price: number,
        text: string,
        kind: "TP1" | "TP2" | "TP3" | "SL" | "ENTRY"
      ) => {
        const yv = candleSeries.priceToCoordinate(price);
        if (yv == null) return;
        const y = yv as number;
        lbls.push({ key: `${text}-${price}`, y, text, kind, price });
      };

      const entryZone = activeLevels.zones?.find((z) => z.label === "ENTRY");
      if (entryZone && Number.isFinite(entryZone.from) && Number.isFinite(entryZone.to)) {
        addBand(entryZone.from, entryZone.to, "ENTRY", "ENTRY");
      } else {
        const pad = Math.max(1, Math.abs(activeLevels.entry - activeLevels.sl) * 0.06);
        addBand(activeLevels.entry - pad, activeLevels.entry + pad, "ENTRY", "ENTRY-FB");
      }

      if (Number.isFinite(activeLevels.sl) && Number.isFinite(activeLevels.entry)) {
        addBand(activeLevels.sl, activeLevels.entry, "SL", "SL");
      }

      if (side === "BUY") {
        if (tp1 !== undefined) addBand(activeLevels.entry, tp1, "TP1", "TP1");
        if (tp2 !== undefined && tp1 !== undefined) addBand(tp1, tp2, "TP2", "TP2");
        if (tp3 !== undefined && tp2 !== undefined) addBand(tp2, tp3, "TP3", "TP3");
      } else {
        if (tp1 !== undefined) addBand(tp1, activeLevels.entry, "TP1", "TP1");
        if (tp2 !== undefined && tp1 !== undefined) addBand(tp2, tp1, "TP2", "TP2");
        if (tp3 !== undefined && tp2 !== undefined) addBand(tp3, tp2, "TP3", "TP3");
      }

      const entryLineColor =
        side === "BUY" ? "rgba(16,185,129,0.95)" : "rgba(239,68,68,0.95)";

      addOL(activeLevels.entry, `OL-ENTRY-${activeLevels.entry}`, entryLineColor, 3);
      addOL(activeLevels.sl, `OL-SL-${activeLevels.sl}`, "rgba(239,68,68,0.95)", 3);
      if (tp1 !== undefined) addOL(tp1, `OL-TP1-${tp1}`, "rgba(16,185,129,0.92)", 2);
      if (tp2 !== undefined) addOL(tp2, `OL-TP2-${tp2}`, "rgba(16,185,129,0.85)", 2);
      if (tp3 !== undefined) addOL(tp3, `OL-TP3-${tp3}`, "rgba(16,185,129,0.78)", 2);

      addLabelAtPrice(activeLevels.entry, "ENTRY", "ENTRY");
      addLabelAtPrice(activeLevels.sl, "SL", "SL");
      if (tp1 !== undefined) addLabelAtPrice(tp1, "TP1", "TP1");
      if (tp2 !== undefined) addLabelAtPrice(tp2, "TP2", "TP2");
      if (tp3 !== undefined) addLabelAtPrice(tp3, "TP3", "TP3");

      setZoneRects(zr);
      setOverlayLines(ol);
      setZoneLabels(lbls);
    } else if (!activeShowTradeLines) {
      try {
        candleSeries.setMarkers([]);
      } catch {}
      clearTradeLineSeries();
      setZoneRects([]);
      setOverlayLines([]);
      setZoneLabels([]);
      frozenAnchorTimeRef.current = null;
      frozenAnchorKeyRef.current = "";
      setFreezeDebug({
        frozen: false,
        entry: null,
        anchorTime: null,
        crossedIdx: null,
      });
    }
  }, [
    candles,
    symbol,
    tf,
    effectiveEmaConfigs,
    bbConfig,
    heikinAshi,
    renko,
    renkoCandles,
    renkoBoxSize,
    currentRenkoBox,
    activeShowTradeLines,
    activeLevels,
    applyTradeLinesWithLevels,
    height,
    pricePrecision,
    highlightTime,
    followOnTick,
    rightPadOn,
    detached,
    overlayTick,
    applyIndicators,
    clearTradeLineSeries,
  ]);

  React.useEffect(() => {
    if (!liveCandle) return;

    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    if (!chart || !candleSeries) return;

    const keyNow = `${symbol}|${tf ?? ""}`;
    if (seriesKeyRef.current && seriesKeyRef.current !== keyNow) return;

    const lc = normalizeCandle(liveCandle);

    const raw = rawCacheRef.current ?? [];
    const last = raw[raw.length - 1];

    if (!last) {
      rawCacheRef.current = [lc];
    } else {
      const t = lc.time as number;
      const lastT = last.time as number;

      if (t === lastT) rawCacheRef.current = [...raw.slice(0, -1), lc];
      else if (t > lastT) rawCacheRef.current = [...raw, lc].slice(-900);
      else return;
    }

    const safeRaw = rawCacheRef.current;

    if (renko) {
      if (!safeRaw.length) return;
      const renkoRaw =
        renkoCandles && renkoCandles.length
          ? normalizeCandles(renkoCandles)
          : safeRaw;
      const box =
        currentRenkoBox > 0
          ? currentRenkoBox
          : autoRenkoBoxSize(renkoRaw);
      const renkoData = toRenkoCandles(renkoRaw, box);
      displayCacheRef.current = renkoData;
      candleSeries.setData(renkoData);
      lastBarTimeRef.current = renkoData[renkoData.length - 1]?.time as UTCTimestamp;

      const lastClose = toNum((renkoData[renkoData.length - 1] as any)?.close);
      const prec = pricePrecision ?? guessPrecision(symbol, lastClose);
      const minMove = minMoveFromPrecision(prec);
      applyIndicators(renkoData, prec, minMove);

      if (followOnTick && !detached) {
        try {
          chart.timeScale().scrollToRealTime();
        } catch {}
      }
      return;
    }

    if (heikinAshi) {
      const ha = toHeikinAshi(safeRaw);
      displayCacheRef.current = ha;
      candleSeries.setData(ha);
      lastBarTimeRef.current = ha[ha.length - 1]?.time as UTCTimestamp;

      const lastClose = toNum((ha[ha.length - 1] as any)?.close);
      const prec = pricePrecision ?? guessPrecision(symbol, lastClose);
      const minMove = minMoveFromPrecision(prec);
      applyIndicators(ha, prec, minMove);

      if (followOnTick && !detached) {
        try {
          chart.timeScale().scrollToRealTime();
        } catch {}
      }
      return;
    }

    candleSeries.update(lc);
    lastBarTimeRef.current = lc.time as UTCTimestamp;

    const ds = displayCacheRef.current;
    if (ds?.length) {
      const lastClose = toNum((ds[ds.length - 1] as any)?.close);
      const prec = pricePrecision ?? guessPrecision(symbol, lastClose);
      const minMove = minMoveFromPrecision(prec);
      applyIndicators(ds, prec, minMove);
    }

    if (followOnTick && !detached) {
      try {
        chart.timeScale().scrollToRealTime();
      } catch {}
    }
  }, [
    liveCandle,
    symbol,
    tf,
    heikinAshi,
    renko,
    currentRenkoBox,
    followOnTick,
    detached,
    applyIndicators,
    pricePrecision,
  ]);

  const bandStyle = (kind: "TP1" | "TP2" | "TP3" | "SL" | "ENTRY") => {
    if (kind === "SL")
      return {
        fill: "url(#slGrad)",
        stroke: "rgba(239,68,68,0.55)",
        strokeWidth: 1.3,
      };
    if (kind === "TP1")
      return {
        fill: "url(#tpGrad1)",
        stroke: "rgba(16,185,129,0.45)",
        strokeWidth: 1.1,
      };
    if (kind === "TP2")
      return {
        fill: "url(#tpGrad2)",
        stroke: "rgba(16,185,129,0.40)",
        strokeWidth: 1.0,
      };
    if (kind === "TP3")
      return {
        fill: "url(#tpGrad3)",
        stroke: "rgba(16,185,129,0.36)",
        strokeWidth: 0.95,
      };

    const sideForBand: "BUY" | "SELL" = activeLevels?.side ?? "BUY";
    return sideForBand === "BUY"
      ? {
          fill: "url(#entryGradBuy)",
          stroke: "rgba(16,185,129,0.92)",
          strokeWidth: 2.8,
        }
      : {
          fill: "url(#entryGradSell)",
          stroke: "rgba(239,68,68,0.92)",
          strokeWidth: 2.8,
        };
  };

  const pillClasses = (kind: "TP1" | "TP2" | "TP3" | "SL" | "ENTRY") => {
    if (kind === "SL") return "bg-red-600/85 border-red-200/30 text-white";
    if (kind === "ENTRY") {
      const sideForEntry: "BUY" | "SELL" = activeLevels?.side ?? "BUY";
      return sideForEntry === "BUY"
        ? "bg-emerald-500/90 border-emerald-200/30 text-white"
        : "bg-red-500/90 border-red-200/30 text-white";
    }
    return "bg-emerald-500/75 border-emerald-200/25 text-white";
  };

  const safeCandles = React.useMemo(() => normalizeCandles(candles ?? []), [candles]);
  const lastCandle = safeCandles[safeCandles.length - 1] as CandlestickData | undefined;
  const prevCandle = safeCandles[safeCandles.length - 2] as CandlestickData | undefined;

  const lastClose = toNum((lastCandle as any)?.close);
  const prevClose = toNum((prevCandle as any)?.close);
  const priceDelta = lastClose - prevClose;

  const tps = (
    activeLevels?.tps?.length
      ? activeLevels.tps
      : activeLevels?.tp !== undefined
        ? [activeLevels.tp]
        : []
  )
    .filter((x) => Number.isFinite(x))
    .slice(0, 3) as number[];

  const side: "BUY" | "SELL" =
    activeLevels?.side ?? (tps[0] !== undefined && tps[0] < (activeLevels?.entry ?? 0) ? "SELL" : "BUY");

  const rrValue =
    activeLevels?.rr ??
    (activeLevels && tps.length ? calcRR(activeLevels.entry, activeLevels.sl, tps[tps.length - 1]) : undefined);

  const trendScore = Math.max(40, Math.min(96, Math.round(Math.abs(priceDelta) > 0 ? 74 : 68)));
  const qualityLabel =
    rrValue !== undefined ? (rrValue >= 3 ? "STRONG" : rrValue >= 2 ? "GOOD" : "NORMAL") : "GOOD";

  return (
    <div
      className={
        showSignalPanel
          ? "grid grid-cols-[minmax(0,1fr)_250px] gap-3"
          : "grid grid-cols-1 gap-0"
      }
    >
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0B1220]">
        <div className="pointer-events-auto absolute left-2 top-2 z-[30] flex items-center gap-1.5 sm:left-3 sm:top-3 sm:gap-2">
          <button
            type="button"
            onClick={() => {
              setDetached(false);
              setFollowOnTick(true);
              try {
                chartRef.current?.timeScale().scrollToRealTime();
              } catch {}
            }}
            className={`rounded-lg border px-2 py-1.5 text-[10px] font-bold transition sm:rounded-xl sm:px-2.5 sm:text-xs xl:rounded-2xl xl:px-3 xl:py-2 ${
              followOnTick && !detached
                ? "border-sky-400/35 bg-sky-500/15 text-sky-100"
                : "border-white/10 bg-white/5 text-zinc-200/70 hover:bg-white/10 hover:text-white"
            }`}
            title="Follow (smart)"
          >
            FOLLOW
          </button>

          <button
            type="button"
            onClick={() => {
              setRightPadOn((v) => {
                const next = !v;
                try {
                  chartRef.current?.applyOptions({
                    timeScale: { rightOffset: next ? 28 : 8 },
                  });
                  setOverlayTick((x) => x + 1);
                  if (followOnTick && !detached) {
                    chartRef.current?.timeScale().scrollToRealTime();
                  }
                } catch {}
                return next;
              });
            }}
            className={`rounded-lg border px-2 py-1.5 text-[10px] font-bold transition sm:rounded-xl sm:px-2.5 sm:text-xs xl:rounded-2xl xl:px-3 xl:py-2 ${
              rightPadOn
                ? "border-fuchsia-400/35 bg-fuchsia-500/15 text-fuchsia-100"
                : "border-white/10 bg-white/5 text-zinc-200/70 hover:bg-white/10 hover:text-white"
            }`}
            title="Odsuń koniec wykresu"
          >
            PAD
          </button>
        </div>

        <div className="pointer-events-none absolute left-2 top-12 z-[31] hidden rounded-xl border border-white/10 bg-black/45 px-2 py-1.5 text-[9px] text-white/70 backdrop-blur min-[420px]:block sm:left-3 sm:top-14 sm:text-[10px] xl:top-16 xl:rounded-2xl xl:px-3 xl:py-2 xl:text-[11px]">
          <div>
            <span className="text-slate-400">FREEZE:</span> {freezeDebug.frozen ? "YES" : "NO"}
          </div>
          <div>
            <span className="text-slate-400">ENTRY:</span> {freezeDebug.entry ?? "—"}
          </div>
          <div>
            <span className="text-slate-400">ANCHOR:</span> {freezeDebug.anchorTime ?? "—"}
          </div>
          <div>
            <span className="text-slate-400">IDX:</span> {freezeDebug.crossedIdx ?? "—"}
          </div>
        </div>

        <style>{`
          @keyframes entryPulse {
            0% {
              opacity: 0.22;
              transform: scale(1);
            }
            45% {
              opacity: 0.68;
              transform: scale(1.01);
            }
            100% {
              opacity: 0.22;
              transform: scale(1);
            }
          }
          @keyframes entryGlow {
            0% {
              opacity: 0.3;
            }
            50% {
              opacity: 0.85;
            }
            100% {
              opacity: 0.3;
            }
          }
          .entry-pulse {
            transform-origin: center;
            animation: entryPulse 1.6s ease-in-out infinite;
          }
          .entry-glow {
            animation: entryGlow 1.6s ease-in-out infinite;
          }
          .pro-pill {
            filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.35));
          }
        `}</style>

        <div className="relative">
          <div
            ref={containerRef}
            style={{
              width: "100%",
              height,
              cursor: activeDrawTool === "SELECT" ? "grab" : "crosshair",
              touchAction: "none",
            }}
          />

          {patternsEnabled && patternLabels.length ? (
            <div className="pointer-events-none absolute inset-0 z-[18] overflow-hidden">
              {patternLabels.map((p) => (
                <div
                  key={p.key}
                  className="absolute -translate-x-1/2 whitespace-nowrap rounded-md border border-yellow-300/70 bg-yellow-400/95 px-1.5 py-0.5 text-[9px] font-black tracking-[0.03em] text-slate-950 shadow-[0_0_10px_rgba(250,204,21,.35)]"
                  style={{ left: p.x, top: p.y }}
                >
                  {p.label}
                </div>
              ))}
            </div>
          ) : null}

          {supertrendFillPolygons.length ? (
            <svg className="pointer-events-none absolute inset-0 z-[3] h-full w-full">
              {supertrendFillPolygons.map((poly) => (
                <polygon
                  key={poly.key}
                  points={poly.points}
                  fill={poly.fill}
                  stroke="none"
                />
              ))}
            </svg>
          ) : null}

          {(supertrendStrokePaths.up.length ||
            supertrendStrokePaths.down.length) ? (
            <svg className="pointer-events-none absolute inset-0 z-[6] h-full w-full">
              {supertrendUpLineEnabled
                ? supertrendStrokePaths.up.map((points, index) => (
                    <polyline
                      key={`supertrend-up-${index}`}
                      points={points}
                      fill="none"
                      stroke={supertrendUpColor}
                      strokeWidth="7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))
                : null}

              {supertrendDownLineEnabled
                ? supertrendStrokePaths.down.map((points, index) => (
                    <polyline
                      key={`supertrend-down-${index}`}
                      points={points}
                      fill="none"
                      stroke={supertrendDownColor}
                      strokeWidth="7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))
                : null}
            </svg>
          ) : null}

          {bbFillOverlay.points ? (
            <svg
              className="pointer-events-none absolute inset-0 z-[4] h-full w-full"
              aria-hidden="true"
            >
              <polygon
                points={bbFillOverlay.points}
                fill={bbFillOverlay.color}
              />
            </svg>
          ) : null}

          {/*
            IMPORTANT:
            DrawingsLayer has its own canvas above lightweight-charts.
            In SELECT mode we let mouse/touch events pass through to the chart,
            so drag left/right + wheel zoom + axis scaling work normally.
            Drawing tools re-enable the drawing overlay.
          */}
          <div
            className={`absolute inset-0 z-[20] ${
              activeDrawTool === "SELECT" ? "pointer-events-none" : "pointer-events-auto"
            }`}
          >
            <DrawingsLayer
              wrapRef={containerRef}
              chartRef={chartRef}
              candleSeriesRef={candleSeriesRef}
              getCandles={() => displayCacheRef.current}
              activeDrawTool={activeDrawTool}
              onDrawToolChange={onDrawToolChange}
              symbol={symbol}
              timeframe={tf ?? "default"}
            />
          </div>
          <svg className="pointer-events-none absolute inset-0 z-[5] h-full w-full">
            <defs>
              <linearGradient id="entryGradBuy" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(16,185,129,0.05)" />
                <stop offset="45%" stopColor="rgba(16,185,129,0.25)" />
                <stop offset="100%" stopColor="rgba(16,185,129,0.10)" />
              </linearGradient>
              <linearGradient id="entryGradSell" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(239,68,68,0.05)" />
                <stop offset="45%" stopColor="rgba(239,68,68,0.25)" />
                <stop offset="100%" stopColor="rgba(239,68,68,0.10)" />
              </linearGradient>

              <linearGradient id="tpGrad1" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(16,185,129,0.22)" />
                <stop offset="70%" stopColor="rgba(16,185,129,0.12)" />
                <stop offset="100%" stopColor="rgba(16,185,129,0.00)" />
              </linearGradient>
              <linearGradient id="tpGrad2" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(16,185,129,0.18)" />
                <stop offset="70%" stopColor="rgba(16,185,129,0.10)" />
                <stop offset="100%" stopColor="rgba(16,185,129,0.00)" />
              </linearGradient>
              <linearGradient id="tpGrad3" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(16,185,129,0.14)" />
                <stop offset="70%" stopColor="rgba(16,185,129,0.08)" />
                <stop offset="100%" stopColor="rgba(16,185,129,0.00)" />
              </linearGradient>

              <linearGradient id="slGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(239,68,68,0.28)" />
                <stop offset="70%" stopColor="rgba(239,68,68,0.14)" />
                <stop offset="100%" stopColor="rgba(239,68,68,0.00)" />
              </linearGradient>

              <filter id="softGlow" x="-35%" y="-35%" width="170%" height="170%">
                <feGaussianBlur stdDeviation="3.0" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {zoneRects.map((r) => {
              const st = bandStyle(r.kind);
              const isEntry = r.kind === "ENTRY";

              if (!isEntry) {
                return (
                  <rect
                    key={r.key}
                    x={r.x}
                    y={r.y}
                    width={r.w}
                    height={r.h}
                    fill={st.fill}
                    stroke={st.stroke}
                    strokeWidth={st.strokeWidth}
                    rx={8}
                    ry={8}
                  />
                );
              }

              return (
                <g key={r.key}>
                  <rect
                    x={r.x}
                    y={r.y}
                    width={r.w}
                    height={r.h}
                    fill={st.fill}
                    stroke={st.stroke}
                    strokeWidth={st.strokeWidth}
                    rx={12}
                    ry={12}
                    filter="url(#softGlow)"
                    className="entry-glow"
                  />
                  <rect
                    className="entry-pulse"
                    x={r.x - 3}
                    y={r.y - 3}
                    width={r.w + 6}
                    height={r.h + 6}
                    fill="transparent"
                    stroke={st.stroke}
                    strokeWidth={2}
                    rx={14}
                    ry={14}
                    style={{ opacity: 0.35 }}
                  />
                </g>
              );
            })}

            {overlayLines.map((l) => (
              <line
                key={l.key}
                x1={l.x}
                x2={l.x + l.w}
                y1={l.y}
                y2={l.y}
                stroke={l.color}
                strokeWidth={l.width}
                strokeLinecap="round"
                opacity={0.92}
              />
            ))}
          </svg>

          <div className="pointer-events-none absolute inset-0 z-[15]">
            {zoneLabels.map((lb) => {
              const dp = Math.min(8, (pricePrecision ?? 5) + 0);
              const priceText =
                lb.price !== undefined ? ` ${Number(lb.price).toFixed(dp)}` : "";

              const rightMost =
                zoneRects.length > 0 ? Math.max(...zoneRects.map((z) => z.x + z.w)) : 20;

              return (
                <div
                  key={lb.key}
                  className={`pro-pill absolute rounded-xl border px-3 py-1.5 text-xs font-extrabold tracking-wide ${pillClasses(
                    lb.kind
                  )}`}
                  style={{
                    left: rightMost + 10,
                    top: lb.y - 14,
                    transform: "translateY(-50%)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {lb.text}
                  <span className="font-black opacity-95">{priceText}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showSignalPanel ? (
      <aside className="overflow-hidden rounded-3xl border border-white/10 bg-[#091425] shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
        <div className="px-4 pt-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[30px] font-black leading-none text-white">Sygnał</h3>
            <div className="h-1.5 w-14 rounded-full bg-white/10">
              <div className="h-full w-8 rounded-full bg-[#f5c84c]" />
            </div>
          </div>

          <div
            className={`mb-5 rounded-2xl py-4 text-center text-[28px] font-black tracking-wide text-white ${
              side === "BUY"
                ? "bg-gradient-to-r from-[#17b26a] to-[#8eea4f]"
                : "bg-gradient-to-r from-[#ef4444] to-[#fb7185]"
            }`}
          >
            {side}
          </div>

          <div className="mb-5">
            <div className="mb-1 text-sm font-semibold text-slate-400">Trend</div>
            <div className="mb-2 text-[42px] font-black leading-none text-white">
              {side === "BUY" ? "Bullish" : "Bearish"}
            </div>

            <div className="mb-2 flex items-end justify-between">
              <span className="text-sm text-slate-400">Trend score</span>
              <div className="text-[32px] font-black leading-none text-white">
                {trendScore}
                <span className="text-lg text-slate-500">/100</span>
              </div>
            </div>

            <div className="h-2 rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#1ee28d] to-[#34d7ff]"
                style={{ width: `${trendScore}%` }}
              />
            </div>
          </div>

          <div className="mb-5">
            <div className="mb-2 text-sm font-semibold text-slate-400">Quality</div>
            <div className="rounded-2xl bg-gradient-to-r from-[#12b76a] to-[#7ee34f] py-3 text-center text-[24px] font-black text-white">
              {qualityLabel}
            </div>
          </div>

          <div className="space-y-3 border-t border-white/10 pb-4 pt-4">
            <Row label="Entry" value={activeLevels ? formatPrice(activeLevels.entry, pricePrecision ?? 2) : "—"} />
            <Row label="SL" value={activeLevels ? formatPrice(activeLevels.sl, pricePrecision ?? 2) : "—"} />
            <Row label="TP1" value={tps[0] ? formatPrice(tps[0], pricePrecision ?? 2) : "—"} />
            <Row label="TP2" value={tps[1] ? formatPrice(tps[1], pricePrecision ?? 2) : "—"} />
            <Row label="TP3" value={tps[2] ? formatPrice(tps[2], pricePrecision ?? 2) : "—"} />
            <Row label="RR" value={rrValue !== undefined ? rrValue.toFixed(2) : "—"} strong />
            <Row
              label="Change"
              value={`${priceDelta >= 0 ? "+" : ""}${formatPrice(priceDelta, pricePrecision ?? 2)}`}
              valueClassName={priceDelta >= 0 ? "text-emerald-400" : "text-red-400"}
            />
          </div>
        </div>

        <div className="h-0 border-t border-white/10 bg-[#08111f]" />
      </aside>
      ) : null}
    </div>
  );
}




