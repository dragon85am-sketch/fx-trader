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


// =========================
// LOCAL CHART TIME
// =========================
// Lightweight Charts używa timestampów UTC.
// Te formatery zmieniają tylko sposób wyświetlania czasu na lokalny czas
// przeglądarki. Same timestampy pozostają bez zmian, więc RENKO i zwykłe
// świece nadal są zsynchronizowane 1:1 po przełączaniu.
function localChartDate(time: unknown) {
  const ts = Number(toUTCTimestamp(time));
  return new Date(ts * 1000);
}

function formatLocalChartTime(time: unknown) {
  return localChartDate(time).toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatLocalChartDateTime(time: unknown) {
  return localChartDate(time).toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
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
  let lastUsedTime = Number(first.time) - 1;

  // RENKO ma korzystać z TEJ SAMEJ osi czasu co zwykłe świece.
  // Pierwsza cegła utworzona z danej świecy dostaje dokładny czas tej świecy.
  // Jeśli jedna świeca tworzy kilka cegieł, kolejne dostają +1s, +2s...
  // Dzięki temu czasy pozostają unikalne dla Lightweight Charts, ale wizualnie
  // wszystkie cegły nadal siedzą dokładnie przy czasie świecy źródłowej.
  const renkoTimeForSource = (sourceTimeRaw: unknown, brickOffset: number) => {
    const sourceTime = Number(sourceTimeRaw);
    const base = Number.isFinite(sourceTime)
      ? Math.floor(sourceTime)
      : Math.max(lastUsedTime + 1, Math.floor(Date.now() / 1000));

    const candidate = base + brickOffset;
    const next = Math.max(candidate, lastUsedTime + 1);
    lastUsedTime = next;
    return next as UTCTimestamp;
  };

  for (let i = 1; i < safeRaw.length; i++) {
    const c = safeRaw[i] as any;
    const price = Number(c.close);
    let brickOffset = 0;

    while (price >= lastClose + box) {
      const open = lastClose;
      const close = lastClose + box;
      out.push({
        time: renkoTimeForSource(c.time, brickOffset++),
        open,
        high: close,
        low: open,
        close,
        // Oryginalny czas świecy źródłowej zachowujemy także osobno do mapowania
        // sygnałów Bollingera na odpowiadającą cegłę RENKO.
        sourceTime: Number(c.time),
      } as any);
      lastClose = close;
    }

    while (price <= lastClose - box) {
      const open = lastClose;
      const close = lastClose - box;
      out.push({
        time: renkoTimeForSource(c.time, brickOffset++),
        open,
        high: open,
        low: close,
        close,
        sourceTime: Number(c.time),
      } as any);
      lastClose = close;
    }
  }

  if (!out.length) {
    const base = safeRaw[safeRaw.length - 1] as any;
    const p = Number(base.close);
    out.push({
      time: renkoTimeForSource(base.time, 0),
      open: p,
      high: p,
      low: p,
      close: p,
      sourceTime: Number(base.time),
    } as any);
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

function detectClassicCandlePatterns(candles: CandlestickData[]): CandlePattern[] {
  const out: CandlePattern[] = [];
  if (candles.length < 30) return out;

  const n = (v: any) => toNum(v);
  const body = (c: any) => Math.abs(n(c.close) - n(c.open));
  const range = (c: any) => Math.max(1e-12, n(c.high) - n(c.low));
  const bull = (c: any) => n(c.close) > n(c.open);
  const bear = (c: any) => n(c.close) < n(c.open);

  const push = (
    c: any,
    label: string,
    side: "BUY" | "SELL"
  ) => {
    out.push({
      time: c.time as UTCTimestamp,
      label,
      side,
      price: side === "BUY" ? n(c.low) : n(c.high),
    });
  };

  // ============================================================
  // HH + HL + BREAKOUT
  //
  // BUY:
  // 1. wykrywamy swing low
  // 2. potem swing high = HH
  // 3. kolejny swing low musi być wyżej = HL
  // 4. poziom wejścia = poprzedni HH
  // 5. BUY dopiero gdy zamknięta zielona świeca wybije HH
  //
  // SELL:
  // 1. swing high
  // 2. potem swing low = LL
  // 3. kolejny swing high niżej = LH
  // 4. poziom wejścia = poprzedni LL
  // 5. SELL po zamknięciu czerwonej świecy poniżej LL
  // ============================================================

  const SWING = 3;
  const MIN_BODY_RATIO = 0.45;

  const isSwingHigh = (idx: number) => {
    if (idx < SWING || idx >= candles.length - SWING) return false;
    const h = n((candles[idx] as any).high);

    for (let j = idx - SWING; j <= idx + SWING; j++) {
      if (j === idx) continue;
      if (n((candles[j] as any).high) >= h) return false;
    }
    return true;
  };

  const isSwingLow = (idx: number) => {
    if (idx < SWING || idx >= candles.length - SWING) return false;
    const l = n((candles[idx] as any).low);

    for (let j = idx - SWING; j <= idx + SWING; j++) {
      if (j === idx) continue;
      if (n((candles[j] as any).low) <= l) return false;
    }
    return true;
  };

  const highs: number[] = [];
  const lows: number[] = [];

  for (let i = SWING; i < candles.length - SWING; i++) {
    if (isSwingHigh(i)) highs.push(i);
    if (isSwingLow(i)) lows.push(i);
  }

  // ========================= BUY =========================
  // Szukamy sekwencji:
  // LOW -> HH -> HL -> breakout HH
  for (let h = 0; h < highs.length; h++) {
    const hhIdx = highs[h];

    const prevLowIdx = [...lows]
      .filter((i) => i < hhIdx)
      .pop();

    const hlIdx = lows.find((i) => i > hhIdx);

    if (prevLowIdx == null || hlIdx == null) continue;

    const prevLow = n((candles[prevLowIdx] as any).low);
    const hh = n((candles[hhIdx] as any).high);
    const hl = n((candles[hlIdx] as any).low);

    // HL musi być wyżej niż poprzedni swing low.
    if (!(hl > prevLow)) continue;

    // HH powinien być wyżej niż wcześniejszy swing high.
    const previousHighIdx = [...highs]
      .filter((i) => i < hhIdx)
      .pop();

    if (previousHighIdx != null) {
      const previousHigh = n((candles[previousHighIdx] as any).high);
      if (!(hh > previousHigh)) continue;
    }

    // Po HL szukamy wybicia HH świecą zamkniętą.
    for (let i = hlIdx + 1; i < candles.length; i++) {
      const c: any = candles[i];

      // Jeśli przed wybiciem cena zaneguje HL, setup anulowany.
      if (n(c.low) < hl) break;

      const bodyRatio = body(c) / range(c);

      const breakout =
        bull(c) &&
        bodyRatio >= MIN_BODY_RATIO &&
        n(c.close) > hh;

      if (breakout) {
        push(c, "BUY", "BUY");
        break;
      }
    }
  }

  // ========================= SELL =========================
  // Szukamy sekwencji:
  // HIGH -> LL -> LH -> breakout LL
  for (let l = 0; l < lows.length; l++) {
    const llIdx = lows[l];

    const prevHighIdx = [...highs]
      .filter((i) => i < llIdx)
      .pop();

    const lhIdx = highs.find((i) => i > llIdx);

    if (prevHighIdx == null || lhIdx == null) continue;

    const prevHigh = n((candles[prevHighIdx] as any).high);
    const ll = n((candles[llIdx] as any).low);
    const lh = n((candles[lhIdx] as any).high);

    // LH musi być niżej niż poprzedni swing high.
    if (!(lh < prevHigh)) continue;

    // LL powinien być niżej niż wcześniejszy swing low.
    const previousLowIdx = [...lows]
      .filter((i) => i < llIdx)
      .pop();

    if (previousLowIdx != null) {
      const previousLow = n((candles[previousLowIdx] as any).low);
      if (!(ll < previousLow)) continue;
    }

    // Po LH szukamy wybicia LL świecą zamkniętą.
    for (let i = lhIdx + 1; i < candles.length; i++) {
      const c: any = candles[i];

      // Jeśli przed wybiciem cena zaneguje LH, setup anulowany.
      if (n(c.high) > lh) break;

      const bodyRatio = body(c) / range(c);

      const breakout =
        bear(c) &&
        bodyRatio >= MIN_BODY_RATIO &&
        n(c.close) < ll;

      if (breakout) {
        push(c, "SELL", "SELL");
        break;
      }
    }
  }

  // Bez duplikatów, maksymalnie 40 najnowszych sygnałów.
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

function detectCandlePatterns(
  candles: CandlestickData[],
  bb?: BbConfig
): CandlePattern[] {
  const out: CandlePattern[] = [];

  // LOGIKA BB — tylko zewnętrzne bandy + potwierdzenie BAR 2.
  // BUY:
  //   Bar 1 wychodzi LOW pod dolną BB i zamyka się z powrotem w paśmie.
  //   Bar 2 MUSI być zamkniętą zieloną świecą -> BUY na Bar 2.
  // SELL:
  //   Bar 1 wychodzi HIGH nad górną BB i zamyka się z powrotem w paśmie.
  //   Bar 2 MUSI być zamkniętą czerwoną świecą -> SELL na Bar 2.
  // Brak zgodnego koloru Bar 2 = brak sygnału.
  // Środkowa banda nigdy nie generuje sygnału.
  // WAŻNE: logika formacji BB działa niezależnie od widoczności pasm.
  // `bb.enabled` steruje tylko rysowaniem Bollingera na wykresie.
  // Gdy FORMACJE są włączone, nadal używamy tych samych ustawień BB
  // do wykrywania BUY/SELL nawet jeśli pasma są wizualnie wyłączone.
  if (!bb) return out;

  const len = clampInt(bb.length, 2, 500);
  if (candles.length < len + 3) return out;

  const n = (v: any) => toNum(v);
  const isBullish = (c: any) => n(c.close) > n(c.open);
  const isBearish = (c: any) => n(c.close) < n(c.open);

  const lines = buildBbLines(candles, bb, 8);
  const upperByTime = new Map<number, number>();
  const lowerByTime = new Map<number, number>();

  for (const p of lines.upper as any[]) {
    upperByTime.set(Number(p.time), n(p.value));
  }
  for (const p of lines.lower as any[]) {
    lowerByTime.set(Number(p.time), n(p.value));
  }

  // Ostatnia świeca może być otwarta. Bar 2 musi być ZAMKNIĘTY.
  const lastClosedIdx = Math.max(0, candles.length - 2);

  for (let signalIdx = len - 1; signalIdx < lastClosedIdx; signalIdx++) {
    const signal: any = candles[signalIdx];
    const confirm: any = candles[signalIdx + 1];
    if (!signal || !confirm) continue;

    const t = Number(signal.time);
    const upper = upperByTime.get(t);
    const lower = lowerByTime.get(t);
    if (!Number.isFinite(upper) || !Number.isFinite(lower)) continue;

    const lowerReentry =
      n(signal.low) < Number(lower) &&
      n(signal.close) > Number(lower);

    const upperReentry =
      n(signal.high) > Number(upper) &&
      n(signal.close) < Number(upper);

    // BUY tylko wtedy, gdy po odrzuceniu dolnej BB Bar 2 jest zielony.
    if (lowerReentry && isBullish(confirm)) {
      out.push({
        time: confirm.time as UTCTimestamp,
        label: "BUY",
        side: "BUY",
        price: n(confirm.low),
      });
      continue;
    }

    // SELL tylko wtedy, gdy po odrzuceniu górnej BB Bar 2 jest czerwony.
    if (upperReentry && isBearish(confirm)) {
      out.push({
        time: confirm.time as UTCTimestamp,
        label: "SELL",
        side: "SELL",
        price: n(confirm.high),
      });
    }

    // lowerReentry + czerwony Bar 2 = NIC.
    // upperReentry + zielony Bar 2 = NIC.
  }

  return out.slice(-40);
}

/* =========================
   RENKO SIGNALS = TA SAMA LOGIKA CO BOLLINGER

   Sygnały nie są już liczone z układu kolorów cegieł RENKO.
   Najpierw wykrywamy BUY/SELL na zwykłych świecach dokładnie tą samą
   logiką BB Bar1 + Bar2 co na wykresie Bollinger, a potem przypinamy
   wynik do cegły RENKO utworzonej z tej samej świecy źródłowej.

   Dzięki temu:
   - Bollinger BUY  -> BUY na odpowiadającej cegle RENKO
   - Bollinger SELL -> SELL na odpowiadającej cegle RENKO
   - nie powstają dodatkowe sygnały tylko dlatego, że zmienił się kolor cegieł
========================= */
function detectRenkoPatternsFromBollinger(
  rawCandles: CandlestickData[],
  renkoBricks: CandlestickData[],
  bb?: BbConfig
): CandlePattern[] {
  if (!bb || !rawCandles.length || !renkoBricks.length) return [];

  const bbSignals = detectCandlePatterns(rawCandles, bb);
  if (!bbSignals.length) return [];

  const out: CandlePattern[] = [];
  const n = (v: any) => toNum(v);

  for (const signal of bbSignals) {
    const signalSourceTime = Number(signal.time);

    // Najlepiej: ostatnia cegła wygenerowana przez dokładnie tę świecę Bar 2.
    const exact = renkoBricks.filter(
      (brick: any) => Number(brick?.sourceTime) === signalSourceTime
    );

    let brick: any = exact.length ? exact[exact.length - 1] : undefined;

    // Jeżeli Bar 2 nie utworzył nowej cegły, przypnij sygnał do pierwszej
    // kolejnej cegły. To zachowuje sygnał z BB bez wymyślania nowego RENKO setupu.
    if (!brick) {
      brick = renkoBricks.find(
        (b: any) => Number(b?.sourceTime) > signalSourceTime
      ) as any;
    }

    if (!brick) continue;

    out.push({
      time: brick.time as UTCTimestamp,
      label: signal.label,
      side: signal.side,
      price:
        signal.side === "SELL"
          ? n(brick.high)
          : n(brick.low),
    });
  }

  const unique = Array.from(
    new Map(
      out.map((p) => [
        `${Number(p.time)}-${p.side}`,
        p,
      ])
    ).values()
  ).sort((a, b) => Number(a.time) - Number(b.time));

  return unique.slice(-40);
}

/* =========================
   RENKO PATTERN HIGHLIGHT
========================= */
function highlightRenkoPatternBricks(
  candles: CandlestickData[],
  signals: CandlePattern[]
) {
  if (!candles.length) return candles;
  if (!signals.length) return candles;

  const signalTimes = new Set(signals.map((s) => Number(s.time)));

  return candles.map((c) => {
    if (!signalTimes.has(Number(c.time))) return c;

    return {
      ...c,
      color: "#facc15",
      borderColor: "#fde047",
      wickColor: "#facc15",
    } as CandlestickData;
  });
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

  // Własne uchwyty osi — gwarantują skalowanie nawet wtedy,
  // gdy natywny hit-test osi Lightweight Charts jest przykryty przez layout.
  const priceAxisDragRef = React.useRef<{
    startY: number;
    minValue: number;
    maxValue: number;
  } | null>(null);

  const timeAxisDragRef = React.useRef<{
    startX: number;
    from: number;
    to: number;
  } | null>(null);

  // Ręczne przesuwanie całego obszaru wykresu w trybie SELECT.
  // Działa identycznie dla myszy, palca i rysika.
  const plotPanRef = React.useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    from: number;
    to: number;
    width: number;
    height: number;
    priceMin: number;
    priceMax: number;
  } | null>(null);
  const manualPanRef = React.useRef(false);

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
    if (!patternsEnabled) return [] as Array<{
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
      const detectedPatterns = renko
        ? detectRenkoPatternsFromBollinger(
            rawCacheRef.current?.length
              ? rawCacheRef.current
              : normalizeCandles(candles),
            safe,
            bbConfig
          )
        : detectCandlePatterns(safe, bbConfig);

      return detectedPatterns.flatMap((p, idx) => {
        const x = chart.timeScale().timeToCoordinate(p.time);
        const signalCandle = safe.find(
          (c) => Number(c.time) === Number(p.time)
        ) as any;

        // W RENKO etykieta BUY / SELL ma być POD wykrytą cegłą.
        const labelPrice = renko
          ? toNum(signalCandle?.low ?? p.price)
          : p.price;

        const y0 = candleSeries.priceToCoordinate(labelPrice);
        if (x == null || y0 == null) return [];

        const y = renko
          ? Number(y0) + 12
          : Number(y0) + (p.side === "SELL" ? -26 : 14);

        return [{
          key: `${Number(p.time)}-${p.label}-${idx}`,
          x: Number(x),
          y,
          label: renko ? p.side : p.label,
          side: p.side,
        }];
      });
    } catch {
      return [];
    }
  }, [patternsEnabled, overlayTick, candles, liveCandle, heikinAshi, renko, bbConfig]);

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

    const signals = detectCandlePatterns(safe, bbConfig);
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
  }, [patternsEnabled, overlayTick, candles, liveCandle, heikinAshi, renko, bbConfig]);

  // Czas świecy sygnałowej dla automatycznych stref FORMATION.
  // Dzięki temu strefy zaczynają się dokładnie przy świecy breakout,
  // zamiast od lewej krawędzi całego wykresu.
  const patternTradeSignalTime = React.useMemo<UTCTimestamp | null>(() => {
    if (!patternsEnabled || renko) return null;

    const safe = displayCacheRef.current;
    if (!safe?.length) return null;

    const signals = detectCandlePatterns(safe, bbConfig);
    const latest = signals[signals.length - 1];
    if (!latest) return null;

    const signalIdx = safe.findIndex(
      (c) => Number(c.time) === Number(latest.time)
    );

    // Ta sama zasada co dla patternTradeLevels: tylko świeży sygnał.
    if (signalIdx < 0 || signalIdx < safe.length - 4) return null;

    return latest.time as UTCTimestamp;
  }, [patternsEnabled, overlayTick, candles, liveCandle, heikinAshi, renko, bbConfig]);

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
    if (followOnTick && !detached && !manualPanRef.current) {
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
        borderColor: "rgba(148,163,184,0.38)",
        entireTextOnly: false,
        scaleMargins: {
          top: 0.08,
          bottom: 0.12,
        },
      },
      localization: {
        locale: "pl-PL",
        timeFormatter: (time: any) => formatLocalChartDateTime(time),
      },
      timeScale: {
        borderVisible: true,
        borderColor: "rgba(148,163,184,0.38)",
        rightOffset,
        barSpacing: 10,
        minBarSpacing: 2,
        fixLeftEdge: false,
        fixRightEdge: false,
        lockVisibleTimeRangeOnResize: false,
        rightBarStaysOnScroll: true,
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time: any) => formatLocalChartTime(time),
      },
handleScroll: {
  // Pan lewo/prawo obsługujemy własnym pointer handlerem poniżej.
  // Wyłączenie natywnego drag usuwa podwójne/przeciwne przesuwanie.
  pressedMouseMove: false,
  horzTouchDrag: false,
  vertTouchDrag: false,
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
          if (approxLast - lr.to > TH) setDetached(true);
          return;
        }

        const vr = ts.getVisibleRange?.();
        const last = lastBarTimeRef.current;
        if (vr && last) {
          const maxT = (vr.to as number) ?? 0;
          if ((last as number) - maxT > TH) setDetached(true);
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

    const renkoBbSignals =
      renko && patternsEnabled
        ? detectRenkoPatternsFromBollinger(safeRaw, safeForChart, bbConfig)
        : [];

    const chartData =
      renko && patternsEnabled
        ? highlightRenkoPatternBricks(safeForChart, renkoBbSignals)
        : safeForChart;

    candleSeries.setData(chartData);

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
    } else if (followOnTick && !detached && !manualPanRef.current) {
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
      const lastClosedIdx = Math.max(0, safeForChart.length - 2);
      let anchorIdx = lastClosedIdx;

      if (showTradeLines && levels) {
        // GŁÓWNY SKANER:
        // page.tsx przekazuje highlightTime z pattern/hammer candle.
        // Sygnał wejścia jest następną zamkniętą świecą, dlatego
        // przesuwamy kotwicę o 1 świecę do przodu.
        if (highlightTime != null) {
          const patternIdx = findNearestIndexByTime(safeForChart, highlightTime);
          if (patternIdx >= 0) {
            anchorIdx = Math.min(patternIdx + 1, lastClosedIdx);
          }
        }
      } else if (patternTradeSignalTime != null) {
        // FORMACJE HH/HL / LL/LH:
        // tutaj latest.time jest już świecą breakout = świecą sygnałową.
        const formationSignalIdx = findNearestIndexByTime(
          safeForChart,
          patternTradeSignalTime
        );
        if (formationSignalIdx >= 0) {
          anchorIdx = Math.min(formationSignalIdx, lastClosedIdx);
        }
      }

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

      // STREFY: od sygnału -> krótki, czytelny blok zamiast aż do prawej osi.
      // Maksymalna szerokość odpowiada mniej więcej odległości zaznaczonej na screenie.
      const SIGNAL_TO_ZONE_GAP_PX = 10;
      const PRICE_AXIS_RESERVE_PX = 78;
      const ZONE_TO_PRICE_AXIS_GAP_PX = 8;
      const MAX_ZONE_WIDTH_PX = 520;

      const startXCoord = chart.timeScale().timeToCoordinate(anchorTime);

      if (startXCoord == null || !Number.isFinite(Number(startXCoord))) {
        setZoneRects([]);
        setOverlayLines([]);
        setZoneLabels([]);
        return;
      }

      const rawStartX = Number(startXCoord) + SIGNAL_TO_ZONE_GAP_PX;
      const maxRightX = Math.max(
        rawStartX + 1,
        containerW - PRICE_AXIS_RESERVE_PX - ZONE_TO_PRICE_AXIS_GAP_PX
      );
      const endX = Math.min(maxRightX, rawStartX + MAX_ZONE_WIDTH_PX);
      const startX = Math.min(rawStartX, endX - 1);
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

      // Strefy trade bez nakładania osobnej zielonej strefy ENTRY.
      // ENTRY pozostaje tylko linią/etykietą graniczną.
      // Dzięki temu:
      // BUY  -> czerwony dokładnie ENTRY -> SL, zielony ENTRY -> TP1 -> TP2 -> TP3.
      // SELL -> czerwony dokładnie ENTRY -> SL, zielony ENTRY -> TP1 -> TP2 -> TP3
      //         (po przeciwnej stronie ceny, zgodnie z kierunkiem pozycji).
      if (Number.isFinite(activeLevels.sl) && Number.isFinite(activeLevels.entry)) {
        addBand(activeLevels.entry, activeLevels.sl, "SL", "SL");
      }

      if (tp1 !== undefined) {
        addBand(activeLevels.entry, tp1, "TP1", "TP1");
      }
      if (tp2 !== undefined && tp1 !== undefined) {
        addBand(tp1, tp2, "TP2", "TP2");
      }
      if (tp3 !== undefined && tp2 !== undefined) {
        addBand(tp2, tp3, "TP3", "TP3");
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

      const renkoBbSignals = patternsEnabled
        ? detectRenkoPatternsFromBollinger(safeRaw, renkoData, bbConfig)
        : [];

      const renkoChartData =
        patternsEnabled
          ? highlightRenkoPatternBricks(renkoData, renkoBbSignals)
          : renkoData;

      candleSeries.setData(renkoChartData);
      lastBarTimeRef.current = renkoData[renkoData.length - 1]?.time as UTCTimestamp;

      const lastClose = toNum((renkoData[renkoData.length - 1] as any)?.close);
      const prec = pricePrecision ?? guessPrecision(symbol, lastClose);
      const minMove = minMoveFromPrecision(prec);
      applyIndicators(renkoData, prec, minMove);

      if (followOnTick && !detached && !manualPanRef.current) {
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

      if (followOnTick && !detached && !manualPanRef.current) {
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

    if (followOnTick && !detached && !manualPanRef.current) {
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
    patternsEnabled,
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

  const beginPriceAxisDrag = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (activeDrawTool !== "SELECT") return;

      const chart = chartRef.current;
      const candleSeries = candleSeriesRef.current;
      const safe = displayCacheRef.current;

      if (!chart || !candleSeries || !safe?.length) return;

      try {
        // Bierzemy tylko świece aktualnie widoczne na ekranie.
        const logical = (chart.timeScale() as any).getVisibleLogicalRange?.();

        let fromIdx = 0;
        let toIdx = safe.length - 1;

        if (logical) {
          fromIdx = Math.max(0, Math.floor(Number(logical.from ?? 0)));
          toIdx = Math.min(
            safe.length - 1,
            Math.ceil(Number(logical.to ?? safe.length - 1))
          );
        }

        const visible = safe.slice(fromIdx, toIdx + 1);
        const source = visible.length ? visible : safe;

        const lows = source
          .map((c: any) => Number(c.low))
          .filter(Number.isFinite);

        const highs = source
          .map((c: any) => Number(c.high))
          .filter(Number.isFinite);

        if (!lows.length || !highs.length) return;

        const minValue = Math.min(...lows);
        const maxValue = Math.max(...highs);

        if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) return;
        if (maxValue <= minValue) return;

        priceAxisDragRef.current = {
          startY: e.clientY,
          minValue,
          maxValue,
        };

        e.currentTarget.setPointerCapture?.(e.pointerId);
        e.preventDefault();
        e.stopPropagation();
      } catch {}
    },
    [activeDrawTool]
  );

  const movePriceAxisDrag = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const state = priceAxisDragRef.current;
      const chart = chartRef.current;
      const candleSeries = candleSeriesRef.current;

      if (!state || !chart || !candleSeries) return;

      try {
        const dy = e.clientY - state.startY;

        const center = (state.minValue + state.maxValue) / 2;
        const initialSpan = Math.max(
          1e-12,
          state.maxValue - state.minValue
        );

        // Ruch w dół = większy zakres cen.
        // Ruch w górę = mniejszy zakres cen.
        const factor = Math.exp(dy * 0.008);
        const span = initialSpan * factor;

        const minValue = center - span / 2;
        const maxValue = center + span / 2;

        // Lightweight Charts nie udostępnia publicznego setVisibleRange()
        // dla priceScale. Dlatego wymuszamy zakres przez autoscaleInfoProvider
        // na głównej serii świec.
        candleSeries.applyOptions({
          autoscaleInfoProvider: (() => ({
            priceRange: {
              minValue,
              maxValue,
            },
            margins: {
              above: 0,
              below: 0,
            },
          })) as any,
        } as any);

        chart.priceScale("right").applyOptions({
          autoScale: true,
        });

        setOverlayTick((v) => v + 1);

        e.preventDefault();
        e.stopPropagation();
      } catch {}
    },
    []
  );

  const endPriceAxisDrag = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      priceAxisDragRef.current = null;

      try {
        e.currentTarget.releasePointerCapture?.(e.pointerId);
      } catch {}
    },
    []
  );

  const resetPriceAxis = React.useCallback(() => {
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;

    if (!chart || !candleSeries) return;

    try {
      // Przywracamy normalny autoscale Lightweight Charts.
      candleSeries.applyOptions({
        autoscaleInfoProvider: undefined,
      } as any);

      chart.priceScale("right").applyOptions({
        autoScale: true,
      });

      setOverlayTick((v) => v + 1);
    } catch {}
  }, []);

  const beginTimeAxisDrag = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (activeDrawTool !== "SELECT") return;

      const chart = chartRef.current;
      if (!chart) return;

      try {
        const ts: any = chart.timeScale();
        const range = ts.getVisibleLogicalRange?.();
        if (!range || !Number.isFinite(range.from) || !Number.isFinite(range.to)) {
          return;
        }

        timeAxisDragRef.current = {
          startX: e.clientX,
          from: Number(range.from),
          to: Number(range.to),
        };

        setDetached(true);
        e.currentTarget.setPointerCapture?.(e.pointerId);
        e.preventDefault();
        e.stopPropagation();
      } catch {}
    },
    [activeDrawTool]
  );

  const moveTimeAxisDrag = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const state = timeAxisDragRef.current;
      const chart = chartRef.current;
      if (!state || !chart) return;

      try {
        const dx = e.clientX - state.startX;
        const center = (state.from + state.to) / 2;
        const initialSpan = Math.max(2, state.to - state.from);

        // W prawo = rozszerz oś czasu, w lewo = zawęź.
        const factor = Math.exp(dx * 0.006);
        const span = Math.max(2, initialSpan * factor);

        const ts: any = chart.timeScale();
        ts.setVisibleLogicalRange?.({
          from: center - span / 2,
          to: center + span / 2,
        });

        setOverlayTick((v) => v + 1);
        e.preventDefault();
        e.stopPropagation();
      } catch {}
    },
    []
  );

  const endTimeAxisDrag = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      timeAxisDragRef.current = null;
      try {
        e.currentTarget.releasePointerCapture?.(e.pointerId);
      } catch {}
    },
    []
  );

  const resetTimeAxis = React.useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return;

    try {
      chart.timeScale().fitContent();
      manualPanRef.current = true;
      setDetached(true);
      setFollowOnTick(false);
      setOverlayTick((v) => v + 1);
    } catch {}
  }, []);

  const beginPlotPan = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (activeDrawTool !== "SELECT") return;
    if (e.pointerType === "mouse" && e.button !== 0) return;

    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    const safe = displayCacheRef.current;
    if (!chart || !candleSeries) return;

    try {
      const ts: any = chart.timeScale();
      const range = ts.getVisibleLogicalRange?.();
      if (!range || !Number.isFinite(range.from) || !Number.isFinite(range.to)) return;

      const fromIdx = Math.max(0, Math.floor(Number(range.from)));
      const toIdx = Math.min(safe.length - 1, Math.ceil(Number(range.to)));
      const visible = safe.slice(fromIdx, toIdx + 1) as any[];
      const lows = visible.map((c) => Number(c.low)).filter(Number.isFinite);
      const highs = visible.map((c) => Number(c.high)).filter(Number.isFinite);

      let priceMin = lows.length ? Math.min(...lows) : 0;
      let priceMax = highs.length ? Math.max(...highs) : 1;
      if (!Number.isFinite(priceMin) || !Number.isFinite(priceMax) || priceMax <= priceMin) {
        priceMin = 0;
        priceMax = 1;
      }

      manualPanRef.current = true;
      setFollowOnTick(false);
      setDetached(true);

      plotPanRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        from: Number(range.from),
        to: Number(range.to),
        width: Math.max(1, e.currentTarget.clientWidth),
        height: Math.max(1, e.currentTarget.clientHeight),
        priceMin,
        priceMax,
      };

      e.currentTarget.setPointerCapture?.(e.pointerId);
      e.preventDefault();
      e.stopPropagation();
    } catch {}
  }, [activeDrawTool]);

  const movePlotPan = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const state = plotPanRef.current;
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    if (!state || !chart || !candleSeries || state.pointerId !== e.pointerId) return;

    try {
      // PAN X — przeciąganie lewo/prawo.
      const span = Math.max(1, state.to - state.from);
      const dx = e.clientX - state.startX;
      const barsDelta = (dx / state.width) * span;

      (chart.timeScale() as any).setVisibleLogicalRange?.({
        from: state.from - barsDelta,
        to: state.to - barsDelta,
      });

      // PAN Y — przeciąganie góra/dół po środku wykresu.
      // Przesuwamy cały widoczny zakres cen bez zmiany jego wysokości.
      const dy = e.clientY - state.startY;
      const priceSpan = Math.max(1e-12, state.priceMax - state.priceMin);
      const priceShift = (dy / state.height) * priceSpan;
      const minValue = state.priceMin + priceShift;
      const maxValue = state.priceMax + priceShift;

      candleSeries.applyOptions({
        autoscaleInfoProvider: (() => ({
          priceRange: { minValue, maxValue },
          margins: { above: 0, below: 0 },
        })) as any,
      } as any);
      chart.priceScale("right").applyOptions({ autoScale: true });

      setOverlayTick((v) => v + 1);
      e.preventDefault();
      e.stopPropagation();
    } catch {}
  }, []);

  const handlePlotWheel = React.useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (activeDrawTool !== "SELECT") return;
    const chart = chartRef.current;
    if (!chart) return;

    try {
      const ts: any = chart.timeScale();
      const range = ts.getVisibleLogicalRange?.();
      if (!range || !Number.isFinite(range.from) || !Number.isFinite(range.to)) return;

      manualPanRef.current = true;
      setFollowOnTick(false);
      setDetached(true);

      const from = Number(range.from);
      const to = Number(range.to);
      const span = Math.max(2, to - from);
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
      const anchor = from + span * ratio;

      // scroll w górę = zoom in, w dół = zoom out
      const zoomFactor = e.deltaY < 0 ? 0.88 : 1.14;
      const nextSpan = Math.max(6, Math.min(500, span * zoomFactor));
      const nextFrom = anchor - nextSpan * ratio;
      const nextTo = nextFrom + nextSpan;

      ts.setVisibleLogicalRange?.({ from: nextFrom, to: nextTo });
      setOverlayTick((v) => v + 1);

      e.preventDefault();
      e.stopPropagation();
    } catch {}
  }, [activeDrawTool]);

  const endPlotPan = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (plotPanRef.current?.pointerId !== e.pointerId) return;
    plotPanRef.current = null;
    try { e.currentTarget.releasePointerCapture?.(e.pointerId); } catch {}
    e.preventDefault();
    e.stopPropagation();
  }, []);


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
                  if (followOnTick && !detached && !manualPanRef.current) {
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

        <div className="pointer-events-none absolute left-3 top-16 z-[31] rounded-2xl border border-white/10 bg-black/50 px-3 py-2 text-[11px] text-white/80 backdrop-blur">
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
              touchAction: "none",
              userSelect: "none",
              WebkitUserSelect: "none",
              cursor: activeDrawTool === "SELECT" ? "grab" : "crosshair",
            }}
          />

          {/* SELECT / ŁAPKA:
              Nie kładziemy osobnego overlay PAN nad wykresem, ponieważ blokował on
              kliknięcie i przesuwanie narysowanych obiektów (BOX/FIBO/TREND).
              DrawingsLayer sam rozróżnia:
              - klik na rysunku -> zaznacz / przesuń rysunek,
              - klik na pustym wykresie -> przesuń wykres.
              Osie ceny i czasu nadal mają własne uchwyty poniżej. */}

          {/* Własny uchwyt PRAWEJ OSI CENY.
              Jest aktywny tylko w SELECT i ma prawdziwy kursor ns-resize. */}
          {activeDrawTool === "SELECT" ? (
            <div
              className="absolute right-0 top-0 z-[45]"
              style={{
                width: 86,
                bottom: 30,
                cursor: "ns-resize",
                touchAction: "none",
                background: "transparent",
              }}
              onPointerDown={beginPriceAxisDrag}
              onPointerMove={movePriceAxisDrag}
              onPointerUp={endPriceAxisDrag}
              onPointerCancel={endPriceAxisDrag}
              onDoubleClick={resetPriceAxis}
              title="Przeciągnij góra/dół, aby skalować cenę"
            />
          ) : null}

          {/* Własny uchwyt DOLNEJ OSI CZASU.
              Ostatnie 72 px zostawiamy osi ceny. */}
          {activeDrawTool === "SELECT" ? (
            <div
              className="absolute bottom-0 left-0 z-[45]"
              style={{
                height: 30,
                right: 86,
                cursor: "ew-resize",
                touchAction: "none",
                background: "transparent",
              }}
              onPointerDown={beginTimeAxisDrag}
              onPointerMove={moveTimeAxisDrag}
              onPointerUp={endTimeAxisDrag}
              onPointerCancel={endTimeAxisDrag}
              onDoubleClick={resetTimeAxis}
              title="Przeciągnij lewo/prawo, aby skalować czas"
            />
          ) : null}

          {patternsEnabled && patternLabels.length ? (
            <div className="pointer-events-none absolute inset-0 z-[18] overflow-hidden">
              {patternLabels.map((p) => (
                <div
                  key={p.key}
                  className={`absolute -translate-x-1/2 whitespace-nowrap border font-black text-slate-950 shadow-[0_0_10px_rgba(250,204,21,.35)] ${
                    renko
                      ? "rounded px-1.5 py-0.5 text-[9px] border-yellow-200 bg-yellow-400"
                      : "rounded-md px-1.5 py-0.5 text-[9px] tracking-[0.03em] border-yellow-300/70 bg-yellow-400/95"
                  }`}
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
            DrawingsLayer musi odbierać zdarzenia także w trybie SELECT.
            Dzięki temu łapka działa kontekstowo:
            - nad BOX-em przesuwa BOX,
            - nad pustym miejscem przesuwa cały wykres.
            Sam rysunek pozostaje przypięty do TIME + PRICE podczas pan/zoom.
          */}
          <div
            className="absolute inset-0 z-[20] pointer-events-auto"
            style={{
              cursor: activeDrawTool === "SELECT" ? "grab" : "crosshair",
              // Tablet / telefon: blokujemy natywny scroll strony nad wykresem,
              // żeby Pointer Events mogły przesuwać wykres jednym palcem.
              touchAction: activeDrawTool === "SELECT" ? "none" : "none",
              userSelect: "none",
              WebkitUserSelect: "none",
            }}
            // WAŻNE: wcześniej funkcje beginPlotPan/movePlotPan istniały, ale nie były
            // podpięte do warstwy nad wykresem. Dlatego na tablecie działały tylko
            // osobne uchwyty osi ceny/czasu. Teraz pusty obszar wykresu obsługuje
            // pan X/Y dla touch, pen i myszy. DrawingsLayer nadal ma pierwszeństwo
            // nad obiektami i może zatrzymać propagację podczas edycji rysunku.
            onPointerDown={activeDrawTool === "SELECT" ? beginPlotPan : undefined}
            onPointerMove={activeDrawTool === "SELECT" ? movePlotPan : undefined}
            onPointerUp={activeDrawTool === "SELECT" ? endPlotPan : undefined}
            onPointerCancel={activeDrawTool === "SELECT" ? endPlotPan : undefined}
            onWheel={activeDrawTool === "SELECT" ? handlePlotWheel : undefined}
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



