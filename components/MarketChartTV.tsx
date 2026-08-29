"use client";

import React from "react";
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
  widths?: { upper?: 1 | 2 | 3 | 4; basis?: 1 | 2 | 3 | 4; lower?: 1 | 2 | 3 | 4 };
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
  renkoBoxSize?: number;

  showTradeLines?: boolean;
  levels?: Levels;

  height?: number;
  pricePrecision?: number;

  showEntryTimeMarker?: boolean;
  highlightTime?: UTCTimestamp | null;
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
  // number ms
  if (typeof t === "number" && Number.isFinite(t) && t > 1e12) return Math.floor(t / 1000) as UTCTimestamp;
  // number sec
  if (typeof t === "number" && Number.isFinite(t)) return Math.floor(t) as UTCTimestamp;

  // Date
  if (t instanceof Date) return Math.floor(t.getTime() / 1000) as UTCTimestamp;

  // string
  if (typeof t === "string") {
    const ms = Date.parse(t);
    if (Number.isFinite(ms)) return Math.floor(ms / 1000) as UTCTimestamp;
  }

  // business day
  if (isBusinessDayLike(t)) {
    const ms = Date.UTC(t.year, t.month - 1, t.day);
    return Math.floor(ms / 1000) as UTCTimestamp;
  }

  // common WS shapes (defensive)
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

  const deduped = Array.from(map.values()).sort((a, b) => (a.time as number) - (b.time as number));
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
  if (![r, g, b].every((x) => Number.isFinite(x))) return `rgba(226,232,240,${a})`;
  return `rgba(${r},${g},${b},${a})`;
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
  let haClose = (toNum(first.open) + toNum(first.high) + toNum(first.low) + toNum(first.close)) / 4;

  let haHigh = Math.max(toNum(first.high), haOpen, haClose);
  let haLow = Math.min(toNum(first.low), haOpen, haClose);

  out.push({ time: first.time, open: haOpen, high: haHigh, low: haLow, close: haClose });

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

    out.push({ time: c.time, open: nextOpen, high: nextHigh, low: nextLow, close: nextClose });
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
  for (let i = period; i < trs.length; i++) atr = (atr * (period - 1) + trs[i]) / period;
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
   TRADE HELPERS
========================= */
function calcRR(entry: number, sl: number, tp: number) {
  const risk = Math.abs(entry - sl);
  const reward = Math.abs(tp - entry);
  if (!risk) return undefined;
  return reward / risk;
}

function findNearestIndexByValue(candles: CandlestickData[], target: number) {
  if (!candles.length) return 0;
  let bestIdx = 0;
  let best = Infinity;
  for (let i = 0; i < candles.length; i++) {
    const d = Math.abs(toNum((candles[i] as any).close) - target);
    if (d < best) {
      best = d;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function safeStepSeconds(ds: CandlestickData[]) {
  if (ds.length < 2) return 60;
  const a = (ds[ds.length - 1].time as number) || 0;
  const b = (ds[ds.length - 2].time as number) || 0;
  const step = Math.abs(a - b);
  return Math.max(1, Number.isFinite(step) && step > 0 ? step : 60);
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
  renkoBoxSize,

  showTradeLines = false,
  levels,

  height = 560,
  pricePrecision,

  showEntryTimeMarker = true,
  highlightTime = null,
}: Props) {
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const chartRef = React.useRef<IChartApi | null>(null);
  const candleSeriesRef = React.useRef<ISeriesApi<"Candlestick"> | null>(null);

  const emaSeriesMapRef = React.useRef<Map<number, ISeriesApi<"Line">>>(new Map());
  const bbSeriesRef = React.useRef<{ upper?: ISeriesApi<"Line">; basis?: ISeriesApi<"Line">; lower?: ISeriesApi<"Line"> }>({});

  const tradeLineSeriesRef = React.useRef<{
    entry?: ISeriesApi<"Line">;
    sl?: ISeriesApi<"Line">;
    tps: ISeriesApi<"Line">[];
  }>({ tps: [] });

  const lastBarTimeRef = React.useRef<UTCTimestamp | null>(null);
  const seriesKeyRef = React.useRef<string>("");

  const rawCacheRef = React.useRef<CandlestickData[]>([]);
  const displayCacheRef = React.useRef<CandlestickData[]>([]);

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
  const rightOffset = rightPadOn ? 28 : 8;

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
    if (followOnTick && !detached) {
      try {
        chart.timeScale().scrollToRealTime();
      } catch {}
    }
  }, [rightOffset, followOnTick, detached]);

  const [renkoAuto, setRenkoAuto] = React.useState<boolean>(() => {
    try {
      const raw = localStorage.getItem("renko_auto");
      if (raw != null) return raw === "1";
    } catch {}
    return !(renkoBoxSize && renkoBoxSize > 0);
  });

  const [renkoManualBox, setRenkoManualBox] = React.useState<number>(() => {
    try {
      const raw = localStorage.getItem("renko_manual_box");
      if (raw != null) return Number(raw) || 0;
    } catch {}
    return renkoBoxSize && renkoBoxSize > 0 ? renkoBoxSize : 0;
  });

  React.useEffect(() => {
    if (renkoBoxSize && renkoBoxSize > 0) setRenkoManualBox(renkoBoxSize);
  }, [renkoBoxSize]);

  React.useEffect(() => {
    try {
      localStorage.setItem("renko_auto", renkoAuto ? "1" : "0");
      localStorage.setItem("renko_manual_box", String(renkoManualBox ?? 0));
    } catch {}
  }, [renkoAuto, renkoManualBox]);

  const currentRenkoBox = React.useMemo(() => {
    const safeRaw = rawCacheRef.current;
    if (!safeRaw?.length) return 0;
    const auto = autoRenkoBoxSize(safeRaw);
    if (renkoAuto) return auto;
    const manual = Number(renkoManualBox);
    return manual > 0 ? manual : auto;
  }, [renkoAuto, renkoManualBox, candles]);

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
      existing.applyOptions({ color: hexToRgba(colorHex, 0.95), lineWidth: width as any });
      return existing;
    }

    const series = chart.addLineSeries({ color: hexToRgba(colorHex, 0.95), lineWidth: width as any });
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

    if (!bbSeriesRef.current.upper) bbSeriesRef.current.upper = chart.addLineSeries({ color: hexToRgba(colors.upper, 0.9), lineWidth: widths.upper as any });
    else bbSeriesRef.current.upper.applyOptions({ color: hexToRgba(colors.upper, 0.9), lineWidth: widths.upper as any });

    if (!bbSeriesRef.current.basis) bbSeriesRef.current.basis = chart.addLineSeries({ color: hexToRgba(colors.basis, 0.8), lineWidth: widths.basis as any, lineStyle: LineStyle.Dotted });
    else bbSeriesRef.current.basis.applyOptions({ color: hexToRgba(colors.basis, 0.8), lineWidth: widths.basis as any, lineStyle: LineStyle.Dotted });

    if (!bbSeriesRef.current.lower) bbSeriesRef.current.lower = chart.addLineSeries({ color: hexToRgba(colors.lower, 0.9), lineWidth: widths.lower as any });
    else bbSeriesRef.current.lower.applyOptions({ color: hexToRgba(colors.lower, 0.9), lineWidth: widths.lower as any });
  }

  function clearBbSeriesData() {
    bbSeriesRef.current.upper?.setData([]);
    bbSeriesRef.current.basis?.setData([]);
    bbSeriesRef.current.lower?.setData([]);
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

  const [zoneRects, setZoneRects] = React.useState<
    Array<{ key: string; x: number; w: number; y: number; h: number; kind: "TP1" | "TP2" | "TP3" | "SL" | "ENTRY" }>
  >([]);

  const [overlayLines, setOverlayLines] = React.useState<Array<{ key: string; x: number; w: number; y: number; color: string; width: number }>>([]);

  const [zoneLabels, setZoneLabels] = React.useState<
    Array<{ key: string; y: number; text: string; kind: "TP1" | "TP2" | "TP3" | "SL" | "ENTRY"; price?: number }>
  >([]);

  const applyTradeLines = React.useCallback(
    (safeForChart: CandlestickData[], prec: number, startT: UTCTimestamp) => {
      const chart = chartRef.current;
      const candleSeries = candleSeriesRef.current;
      if (!chart || !candleSeries) return;

      if (!levels) return;
      if (!safeForChart.length) return;

      let endT = safeForChart[safeForChart.length - 1].time as UTCTimestamp;
      if ((endT as number) <= (startT as number)) endT = ((startT as number) + 1) as UTCTimestamp;

      const tps = (levels.tps?.length ? levels.tps : levels.tp !== undefined ? [levels.tp] : [])
        .filter((x) => Number.isFinite(x))
        .slice(0, 3) as number[];

      const rr = levels.rr ?? (tps.length ? calcRR(levels.entry, levels.sl, tps[tps.length - 1]) : undefined);
      const rrText = rr !== undefined ? `RR ${rr.toFixed(2)}` : "";

      const side: "BUY" | "SELL" = levels.side ?? (tps[0] !== undefined && tps[0] < levels.entry ? "SELL" : "BUY");
      const entryLineColor = side === "BUY" ? "rgba(16,185,129,0.35)" : "rgba(239,68,68,0.35)";

      const ensureHLine = (key: "entry" | "sl", price: number, color: string, lw: number) => {
        let s = tradeLineSeriesRef.current[key];
        if (!s) {
          s = chart.addLineSeries({
            color,
            lineWidth: lw as any,
            lineStyle: LineStyle.Solid,
            crosshairMarkerVisible: false,
            lastValueVisible: false,
            priceLineVisible: false,
            priceFormat: { type: "price", precision: prec, minMove: minMoveFromPrecision(prec) },
          });
          tradeLineSeriesRef.current[key] = s;
        } else {
          s.applyOptions({
            color,
            lineWidth: lw as any,
            priceFormat: { type: "price", precision: prec, minMove: minMoveFromPrecision(prec) },
          });
        }

        const t1 = startT;
        const t2 = ((endT as number) <= (startT as number) ? (startT as number) + 1 : (endT as number)) as UTCTimestamp;
        s.setData([{ time: t1, value: price }, { time: t2, value: price }]);
      };

      const ensureTpLines = (tpArr: number[]) => {
        const need = tpArr.length;
        const cur = tradeLineSeriesRef.current.tps;

        while (cur.length < need) {
          const s = chart.addLineSeries({
            color: "rgba(16,185,129,0.18)",
            lineWidth: 1 as any,
            lineStyle: LineStyle.Solid,
            crosshairMarkerVisible: false,
            lastValueVisible: false,
            priceLineVisible: false,
            priceFormat: { type: "price", precision: prec, minMove: minMoveFromPrecision(prec) },
          });
          cur.push(s);
        }

        while (cur.length > need) {
          const s = cur.pop();
          if (s) {
            try {
              chart.removeSeries(s);
            } catch {}
          }
        }

        const t1 = startT;
        const t2 = ((endT as number) <= (startT as number) ? (startT as number) + 1 : (endT as number)) as UTCTimestamp;

        tpArr.forEach((tp, i) => {
          const s = cur[i];
          s.applyOptions({
            color: "rgba(16,185,129,0.18)",
            lineWidth: 1 as any,
            priceFormat: { type: "price", precision: prec, minMove: minMoveFromPrecision(prec) },
          });
          s.setData([{ time: t1, value: tp }, { time: t2, value: tp }]);
        });
      };

      ensureHLine("entry", levels.entry, entryLineColor, 2);
      ensureHLine("sl", levels.sl, "rgba(239,68,68,0.22)", 2);
      ensureTpLines(tps);

      candleSeries.setMarkers([]);
      if (showEntryTimeMarker && safeForChart.length) {
        const idx = findNearestIndexByValue(safeForChart, levels.entry);
        const t = safeForChart[idx]?.time as UTCTimestamp | undefined;
        if (t) {
          const markers: SeriesMarker<UTCTimestamp>[] = [
            {
              time: t,
              position: "belowBar",
              color: side === "BUY" ? "rgba(16,185,129,0.95)" : "rgba(239,68,68,0.95)",
              shape: side === "BUY" ? "arrowUp" : "arrowDown",
              text: rrText ? `Entry • ${rrText}` : "Entry",
            },
          ];
          candleSeries.setMarkers(markers);
        }
      }
    },
    [levels, showEntryTimeMarker]
  );

  /* =========================
     INIT CHART
  ========================= */
  React.useEffect(() => {
    if (!wrapRef.current) return;

    const chart = createChart(wrapRef.current, {
      width: wrapRef.current.clientWidth,
      height,
      layout: { background: { color: "#0B1220" }, textColor: "rgba(226,232,240,0.92)" },
      grid: { vertLines: { color: "rgba(148,163,184,0.08)" }, horzLines: { color: "rgba(148,163,184,0.08)" } },
      rightPriceScale: { borderColor: "rgba(148,163,184,0.18)", textColor: "rgba(226,232,240,0.92)", scaleMargins: { top: 0.12, bottom: 0.1 } },
      timeScale: {
        borderColor: "rgba(148,163,184,0.18)",
        timeVisible: true,
        secondsVisible: false,
        rightOffset,
        barSpacing: 8,
        fixLeftEdge: false,
        lockVisibleTimeRangeOnResize: true,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { width: 1, color: "rgba(226,232,240,0.22)", style: LineStyle.Dashed },
        horzLine: { width: 1, color: "rgba(226,232,240,0.22)", style: LineStyle.Dashed },
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#22C55E",
      downColor: "#EF4444",
      borderVisible: false,
      wickUpColor: "#22C55E",
      wickDownColor: "#EF4444",
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    const onRangeChange = () => {
      try {
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
          const step = safeStepSeconds(ds);
          const maxT = (vr.to as number) ?? 0;
          setDetached((last as number) - maxT > step * TH);
        }
      } catch {}
    };

    try {
      (chart.timeScale() as any).subscribeVisibleTimeRangeChange?.(onRangeChange);
    } catch {}

    const ro = new ResizeObserver(() => {
      if (!wrapRef.current || !chartRef.current) return;
      chartRef.current.applyOptions({ width: wrapRef.current.clientWidth, height });
    });
    ro.observe(wrapRef.current);

    return () => {
      ro.disconnect();

      try {
        (chart.timeScale() as any).unsubscribeVisibleTimeRangeChange?.(onRangeChange);
      } catch {}

      clearTradeLineSeries();

      for (const p of Array.from(emaSeriesMapRef.current.keys())) removeEmaSeries(p);

      try {
        if (bbSeriesRef.current.upper) chart.removeSeries(bbSeriesRef.current.upper);
        if (bbSeriesRef.current.basis) chart.removeSeries(bbSeriesRef.current.basis);
        if (bbSeriesRef.current.lower) chart.removeSeries(bbSeriesRef.current.lower);
      } catch {}
      bbSeriesRef.current = {};

      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;

      setZoneRects([]);
      setOverlayLines([]);
      setZoneLabels([]);

      rawCacheRef.current = [];
      displayCacheRef.current = [];
      lastBarTimeRef.current = null;
      seriesKeyRef.current = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearTradeLineSeries, height]);

  /* =========================
     FULL DATA RENDER
  ========================= */
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
      return;
    }

    const lastCloseRaw = toNum((safeRaw[safeRaw.length - 1] as any)?.close);
    const prec = pricePrecision ?? guessPrecision(symbol, lastCloseRaw);
    const minMove = minMoveFromPrecision(prec);
    candleSeries.applyOptions({ priceFormat: { type: "price", precision: prec, minMove } });

    let safeForChart = safeRaw;

    if (renko) {
      const box = renkoAuto ? autoRenkoBoxSize(safeRaw) : Number(renkoManualBox) > 0 ? Number(renkoManualBox) : autoRenkoBoxSize(safeRaw);
      safeForChart = toRenkoCandles(safeRaw, box);
    } else if (heikinAshi) {
      safeForChart = toHeikinAshi(safeRaw);
    }

    displayCacheRef.current = safeForChart;
    candleSeries.setData(safeForChart);

    lastBarTimeRef.current = safeForChart.length ? (safeForChart[safeForChart.length - 1].time as UTCTimestamp) : null;
    seriesKeyRef.current = `${symbol}|${tf ?? ""}`;

    if (followOnTick && !detached) {
      try {
        chart.timeScale().scrollToRealTime();
      } catch {
        chart.timeScale().fitContent();
      }
    } else {
      chart.timeScale().fitContent();
    }

    const want = new Set(effectiveEmaConfigs.map((x) => x.period));
    for (const p of Array.from(emaSeriesMapRef.current.keys())) if (!want.has(p)) removeEmaSeries(p);

    if (safeForChart.length >= 3 && effectiveEmaConfigs.length) {
      const closes = safeForChart.map((c) => toNum((c as any).close));
      for (const cfg of effectiveEmaConfigs) {
        const s = ensureEmaSeries(cfg.period, cfg.color, cfg.width);
        if (!s) continue;
        s.applyOptions({ priceFormat: { type: "price", precision: prec, minMove } });

        const emaArr = calcEMA(closes, cfg.period);
        const emaData: LineData[] = safeForChart.map((c, i) => ({
          time: c.time as UTCTimestamp,
          value: Number((emaArr[i] ?? 0).toFixed(Math.min(prec + 1, 8))),
        }));
        s.setData(emaData);
      }
    } else {
      for (const p of Array.from(emaSeriesMapRef.current.keys())) emaSeriesMapRef.current.get(p)?.setData([]);
    }

    const bb = bbConfig;
    if (bb?.enabled) {
      ensureBbSeries(bb);
      const lines = buildBbLines(safeForChart, bb, prec);

      bbSeriesRef.current.upper?.applyOptions({ priceFormat: { type: "price", precision: prec, minMove } });
      bbSeriesRef.current.basis?.applyOptions({ priceFormat: { type: "price", precision: prec, minMove } });
      bbSeriesRef.current.lower?.applyOptions({ priceFormat: { type: "price", precision: prec, minMove } });

      bbSeriesRef.current.upper?.setData(lines.upper);
      bbSeriesRef.current.basis?.setData(lines.basis);
      bbSeriesRef.current.lower?.setData(lines.lower);
    } else {
      clearBbSeriesData();
    }

    const startT =
      (highlightTime as UTCTimestamp | null) ??
      (safeForChart[0]?.time as UTCTimestamp | undefined) ??
      (safeRaw[0]?.time as UTCTimestamp | undefined);

    if (showTradeLines && levels && safeForChart.length && startT) {
      applyTradeLines(safeForChart, prec, startT);

      const containerW = wrapRef.current?.clientWidth ?? 0;
      const RIGHT_MARGIN_PX = rightPadOn ? 160 : 110;
      const LABEL_GAP_PX = 14;

      const x1 = chart.timeScale().timeToCoordinate(startT);
      const startX = x1 ?? 0;

      const lineEndX = Math.max(startX + 60, containerW - RIGHT_MARGIN_PX - LABEL_GAP_PX);
      const w = Math.max(12, lineEndX - startX);

      const tps = (levels.tps?.length ? levels.tps : levels.tp !== undefined ? [levels.tp] : [])
        .filter((x) => Number.isFinite(x))
        .slice(0, 3) as number[];

      const tp1 = tps[0];
      const tp2 = tps[1];
      const tp3 = tps[2];

      const side: "BUY" | "SELL" = levels.side ?? (tp1 !== undefined && tp1 < levels.entry ? "SELL" : "BUY");

      const zr: Array<{ key: string; x: number; w: number; y: number; h: number; kind: "TP1" | "TP2" | "TP3" | "SL" | "ENTRY" }> = [];
      const ol: Array<{ key: string; x: number; w: number; y: number; color: string; width: number }> = [];
      const lbls: Array<{ key: string; y: number; text: string; kind: "TP1" | "TP2" | "TP3" | "SL" | "ENTRY"; price?: number }> = [];

      const addBand = (from: number, to: number, kind: "TP1" | "TP2" | "TP3" | "SL" | "ENTRY", key: string) => {
        const y1p = candleSeries.priceToCoordinate(from);
        const y2p = candleSeries.priceToCoordinate(to);
        if (y1p === null || y2p === null) return;

        const y = Math.min(y1p, y2p);
        const h = Math.max(2, Math.abs(y2p - y1p));
        zr.push({ key, x: startX, w, y, h, kind });
      };

      const addOL = (price: number, key: string, color: string, widthPx: number) => {
        const y = candleSeries.priceToCoordinate(price);
        if (y === null) return;
        ol.push({ key, x: startX, w, y, color, width: widthPx });
      };

      const addLabelAtPrice = (price: number, text: string, kind: "TP1" | "TP2" | "TP3" | "SL" | "ENTRY") => {
        const y = candleSeries.priceToCoordinate(price);
        if (y === null) return;
        lbls.push({ key: `${text}-${price}`, y, text, kind, price });
      };

      const entryZone = levels.zones?.find((z) => z.label === "ENTRY");
      if (entryZone && Number.isFinite(entryZone.from) && Number.isFinite(entryZone.to)) {
        addBand(entryZone.from, entryZone.to, "ENTRY", "ENTRY");
      } else {
        const pad = Math.max(1, Math.abs(levels.entry - levels.sl) * 0.06);
        addBand(levels.entry - pad, levels.entry + pad, "ENTRY", "ENTRY-FB");
      }

      if (Number.isFinite(levels.sl) && Number.isFinite(levels.entry)) addBand(levels.sl, levels.entry, "SL", "SL");

      if (side === "BUY") {
        if (tp1 !== undefined) addBand(levels.entry, tp1, "TP1", "TP1");
        if (tp2 !== undefined && tp1 !== undefined) addBand(tp1, tp2, "TP2", "TP2");
        if (tp3 !== undefined && tp2 !== undefined) addBand(tp2, tp3, "TP3", "TP3");
      } else {
        if (tp1 !== undefined) addBand(tp1, levels.entry, "TP1", "TP1");
        if (tp2 !== undefined && tp1 !== undefined) addBand(tp2, tp1, "TP2", "TP2");
        if (tp3 !== undefined && tp2 !== undefined) addBand(tp3, tp2, "TP3", "TP3");
      }

      const entryLineColor = side === "BUY" ? "rgba(16,185,129,0.95)" : "rgba(239,68,68,0.95)";
      addOL(levels.entry, `OL-ENTRY-${levels.entry}`, entryLineColor, 3);
      addOL(levels.sl, `OL-SL-${levels.sl}`, "rgba(239,68,68,0.95)", 3);
      if (tp1 !== undefined) addOL(tp1, `OL-TP1-${tp1}`, "rgba(16,185,129,0.92)", 2);
      if (tp2 !== undefined) addOL(tp2, `OL-TP2-${tp2}`, "rgba(16,185,129,0.85)", 2);
      if (tp3 !== undefined) addOL(tp3, `OL-TP3-${tp3}`, "rgba(16,185,129,0.78)", 2);

      addLabelAtPrice(levels.entry, "ENTRY", "ENTRY");
      addLabelAtPrice(levels.sl, "SL", "SL");
      if (tp1 !== undefined) addLabelAtPrice(tp1, "TP1", "TP1");
      if (tp2 !== undefined) addLabelAtPrice(tp2, "TP2", "TP2");
      if (tp3 !== undefined) addLabelAtPrice(tp3, "TP3", "TP3");

      setZoneRects(zr);
      setOverlayLines(ol);
      setZoneLabels(lbls);
    } else {
      if (!showTradeLines) {
        try {
          candleSeries.setMarkers([]);
        } catch {}
        setZoneRects([]);
        setOverlayLines([]);
        setZoneLabels([]);
      }
    }
  }, [
    candles,
    symbol,
    tf,
    effectiveEmaConfigs,
    bbConfig,
    heikinAshi,
    renko,
    renkoAuto,
    renkoManualBox,
    currentRenkoBox,
    showTradeLines,
    levels,
    applyTradeLines,
    height,
    pricePrecision,
    highlightTime,
    followOnTick,
    rightPadOn,
    detached,
  ]);

  /* =========================
     LIVE UPDATE
  ========================= */
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
      const box = currentRenkoBox > 0 ? currentRenkoBox : autoRenkoBoxSize(safeRaw);
      const renkoData = toRenkoCandles(safeRaw, box);
      displayCacheRef.current = renkoData;
      candleSeries.setData(renkoData);
      lastBarTimeRef.current = renkoData[renkoData.length - 1]?.time as UTCTimestamp;

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

      if (followOnTick && !detached) {
        try {
          chart.timeScale().scrollToRealTime();
        } catch {}
      }
      return;
    }

    const tt = lc.time as UTCTimestamp;
    const lastT = lastBarTimeRef.current;
    if (lastT !== null && (tt as number) < (lastT as number)) return;

    candleSeries.update(lc);
    lastBarTimeRef.current = lc.time as UTCTimestamp;

    if (followOnTick && !detached) {
      try {
        chart.timeScale().scrollToRealTime();
      } catch {}
    }
  }, [liveCandle, symbol, tf, heikinAshi, renko, currentRenkoBox, followOnTick, detached]);

  const labelX = React.useMemo(() => {
    const containerW = wrapRef.current?.clientWidth ?? 0;
    const RIGHT_MARGIN_PX = rightPadOn ? 160 : 110;
    return Math.max(0, containerW - RIGHT_MARGIN_PX);
  }, [rightPadOn, candles, height]);

  const bandStyle = (kind: "TP1" | "TP2" | "TP3" | "SL" | "ENTRY") => {
    if (kind === "SL") return { fill: "url(#slGrad)", stroke: "rgba(239,68,68,0.55)", strokeWidth: 1.3 };
    if (kind === "TP1") return { fill: "url(#tpGrad1)", stroke: "rgba(16,185,129,0.45)", strokeWidth: 1.1 };
    if (kind === "TP2") return { fill: "url(#tpGrad2)", stroke: "rgba(16,185,129,0.40)", strokeWidth: 1.0 };
    if (kind === "TP3") return { fill: "url(#tpGrad3)", stroke: "rgba(16,185,129,0.36)", strokeWidth: 0.95 };

    const side: "BUY" | "SELL" = levels?.side ?? "BUY";
    return side === "BUY"
      ? { fill: "url(#entryGradBuy)", stroke: "rgba(16,185,129,0.92)", strokeWidth: 2.8 }
      : { fill: "url(#entryGradSell)", stroke: "rgba(239,68,68,0.92)", strokeWidth: 2.8 };
  };

  const pillClasses = (kind: "TP1" | "TP2" | "TP3" | "SL" | "ENTRY") => {
    if (kind === "SL") return "bg-red-600/85 border-red-200/30 text-white";
    if (kind === "ENTRY") {
      const side: "BUY" | "SELL" = levels?.side ?? "BUY";
      return side === "BUY"
        ? "bg-emerald-500/90 border-emerald-200/30 text-white"
        : "bg-red-500/90 border-red-200/30 text-white";
    }
    return "bg-emerald-500/75 border-emerald-200/25 text-white";
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0B1220] overflow-hidden relative">
      {/* mini toolbar */}
      <div className="absolute z-50 left-3 top-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setDetached(false);
            setFollowOnTick(true);
            try {
              chartRef.current?.timeScale().scrollToRealTime();
            } catch {}
          }}
          className={`rounded-2xl border px-3 py-2 text-xs font-bold transition ${
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
          onClick={() => setRightPadOn((v) => !v)}
          className={`rounded-2xl border px-3 py-2 text-xs font-bold transition ${
            rightPadOn
              ? "border-fuchsia-400/35 bg-fuchsia-500/15 text-fuchsia-100"
              : "border-white/10 bg-white/5 text-zinc-200/70 hover:bg-white/10 hover:text-white"
          }`}
          title="Odsuń koniec wykresu"
        >
          PAD
        </button>

        {renko ? (
          <button
            type="button"
            onClick={() => setRenkoAuto((v) => !v)}
            className={`rounded-2xl border px-3 py-2 text-xs font-bold transition ${
              renkoAuto
                ? "border-emerald-400/35 bg-emerald-500/15 text-emerald-100"
                : "border-white/10 bg-white/5 text-zinc-200/70 hover:bg-white/10 hover:text-white"
            }`}
            title="Renko Auto box"
          >
            RENKO AUTO
          </button>
        ) : null}
      </div>

      <style jsx>{`
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

      {/* ✅ stabilny stacking context, żeby panele nie znikały */}
      <div className="relative" style={{ isolation: "isolate" as any }}>
        {/* ✅ wrapper MA wysokość */}
        <div ref={wrapRef} className="w-full" style={{ height }} />

        {/* ✅ DRAWINGS LAYER (panele + rysowanie) */}
        <DrawingsLayerPro wrapRef={wrapRef} chartRef={chartRef} candleSeriesRef={candleSeriesRef} rightPadOn={rightPadOn} />

        {/* SVG overlay */}
        <svg className="pointer-events-none absolute inset-0 w-full h-full z-40">
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

        {/* labels */}
        <div className="pointer-events-none absolute inset-0 z-50">
          {zoneLabels.map((lb) => {
            const dp = Math.min(8, (pricePrecision ?? 5) + 0);
            const priceText = lb.price !== undefined ? ` ${Number(lb.price).toFixed(dp)}` : "";

            return (
              <div
                key={lb.key}
                className={`pro-pill absolute rounded-xl border px-3 py-1.5 text-xs font-extrabold tracking-wide ${pillClasses(lb.kind)}`}
                style={{
                  left: labelX,
                  top: lb.y - 14,
                  transform: "translateY(-50%)",
                  whiteSpace: "nowrap",
                }}
              >
                {lb.text}
                <span className="opacity-95 font-black">{priceText}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* =========================
   DRAWINGS LAYER (ULTRA)
========================= */

type DrawTool = "SELECT" | "HLINE" | "VLINE" | "RECT" | "CIRCLE" | "FIBO";

type DrawBase = {
  id: string;
  type: DrawTool;
  name: string;
  color: string; // hex
  visible: boolean;
  createdAt: number;
};

type HLineObj = DrawBase & { type: "HLINE"; price: number };
type VLineObj = DrawBase & { type: "VLINE"; time: UTCTimestamp };
type RectObj = DrawBase & { type: "RECT"; t1: UTCTimestamp; p1: number; t2: UTCTimestamp; p2: number };
type CircleObj = DrawBase & { type: "CIRCLE"; t1: UTCTimestamp; p1: number; t2: UTCTimestamp; p2: number };
type FiboObj = DrawBase & { type: "FIBO"; t1: UTCTimestamp; p1: number; t2: UTCTimestamp; p2: number; levels: number[] };

type AnyObj = HLineObj | VLineObj | RectObj | CircleObj | FiboObj;

const DRAWINGS_KEY = "fx_drawings_global_v1";

function uid() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function safeTimeToCoord(chart: IChartApi, t: UTCTimestamp) {
  try {
    const x = chart.timeScale().timeToCoordinate(t);
    return typeof x === "number" && Number.isFinite(x) ? x : null;
  } catch {
    return null;
  }
}

function safeCoordToTime(chart: IChartApi, x: number): UTCTimestamp | null {
  try {
    const t: any = (chart.timeScale() as any).coordinateToTime?.(x);
    if (typeof t === "number" && Number.isFinite(t)) return Math.floor(t) as UTCTimestamp;
    return null;
  } catch {
    return null;
  }
}

function safePriceToCoord(series: ISeriesApi<"Candlestick">, p: number) {
  try {
    const y = series.priceToCoordinate(p);
    return typeof y === "number" && Number.isFinite(y) ? y : null;
  } catch {
    return null;
  }
}

function safeCoordToPrice(series: ISeriesApi<"Candlestick">, y: number) {
  try {
    const p = series.coordinateToPrice(y);
    return typeof p === "number" && Number.isFinite(p) ? p : null;
  } catch {
    return null;
  }
}

function DrawingsLayerPro(props: {
  wrapRef: React.RefObject<HTMLDivElement | null>;
  chartRef: React.RefObject<IChartApi | null>;
  candleSeriesRef: React.RefObject<ISeriesApi<"Candlestick"> | null>;
  rightPadOn: boolean;
}) {
  const { wrapRef, chartRef, candleSeriesRef } = props;

  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const [tool, setTool] = React.useState<DrawTool>("SELECT");
  const [objs, setObjs] = React.useState<AnyObj[]>(() => {
    try {
      const raw = localStorage.getItem(DRAWINGS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as AnyObj[];
    } catch {}
    return [];
  });

  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const draftRef = React.useRef<null | { type: "RECT" | "CIRCLE" | "FIBO"; t1: UTCTimestamp; p1: number; t2: UTCTimestamp; p2: number }>(null);

  React.useEffect(() => {
    try {
      localStorage.setItem(DRAWINGS_KEY, JSON.stringify(objs));
    } catch {}
  }, [objs]);

  const resizeCanvas = React.useCallback(() => {
    const wrap = wrapRef.current;
    const cv = canvasRef.current;
    if (!wrap || !cv) return;

    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    const dpr = window.devicePixelRatio || 1;

    cv.width = Math.max(1, Math.floor(w * dpr));
    cv.height = Math.max(1, Math.floor(h * dpr));
    cv.style.width = `${w}px`;
    cv.style.height = `${h}px`;

    const ctx = cv.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, [wrapRef]);

  React.useEffect(() => {
    resizeCanvas();
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => resizeCanvas());
    ro.observe(el);
    return () => ro.disconnect();
  }, [resizeCanvas, wrapRef]);

  const redraw = React.useCallback(() => {
    const chart = chartRef.current;
    const series = candleSeriesRef.current;
    const cv = canvasRef.current;
    if (!chart || !series || !cv) return;

    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const w = cv.clientWidth;
    const h = cv.clientHeight;

    ctx.clearRect(0, 0, w, h);

    const drawLine = (x1: number, y1: number, x2: number, y2: number, color: string, width = 2, alpha = 1) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    };

    const drawRect = (x: number, y: number, rw: number, rh: number, color: string, alphaFill = 0.1) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.fillStyle = color;
      ctx.globalAlpha = alphaFill;
      ctx.fillRect(x, y, rw, rh);
      ctx.globalAlpha = 0.9;
      ctx.strokeRect(x, y, rw, rh);
      ctx.restore();
    };

    const drawCircle = (cx: number, cy: number, r: number, color: string, alphaFill = 0.08) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = alphaFill;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.95;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    };

    const drawText = (x: number, y: number, txt: string, color: string) => {
      ctx.save();
      ctx.font = "12px ui-sans-serif, system-ui, -apple-system";
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.95;
      ctx.fillText(txt, x, y);
      ctx.restore();
    };

    const visible = objs.filter((o) => o.visible);

    for (const o of visible) {
      const isSel = o.id === selectedId;
      const width = isSel ? 3 : 2;
      const alpha = isSel ? 1 : 0.9;

      const rgba = hexToRgba(o.color || "#e2e8f0", 0.95);

      if (o.type === "HLINE") {
        const y = safePriceToCoord(series, o.price);
        if (y == null) continue;
        drawLine(0, y, w, y, rgba, width, alpha);
      }

      if (o.type === "VLINE") {
        const x = safeTimeToCoord(chart, o.time);
        if (x == null) continue;
        drawLine(x, 0, x, h, rgba, width, alpha);
      }

      if (o.type === "RECT") {
        const x1 = safeTimeToCoord(chart, o.t1);
        const x2 = safeTimeToCoord(chart, o.t2);
        const y1 = safePriceToCoord(series, o.p1);
        const y2 = safePriceToCoord(series, o.p2);
        if (x1 == null || x2 == null || y1 == null || y2 == null) continue;
        const rx = Math.min(x1, x2);
        const ry = Math.min(y1, y2);
        const rw = Math.max(2, Math.abs(x2 - x1));
        const rh = Math.max(2, Math.abs(y2 - y1));
        drawRect(rx, ry, rw, rh, rgba, isSel ? 0.14 : 0.1);
      }

      if (o.type === "CIRCLE") {
        const x1 = safeTimeToCoord(chart, o.t1);
        const x2 = safeTimeToCoord(chart, o.t2);
        const y1 = safePriceToCoord(series, o.p1);
        const y2 = safePriceToCoord(series, o.p2);
        if (x1 == null || x2 == null || y1 == null || y2 == null) continue;
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;
        const r = Math.max(6, Math.hypot(x2 - x1, y2 - y1) / 2);
        drawCircle(cx, cy, r, rgba, isSel ? 0.12 : 0.08);
      }

      if (o.type === "FIBO") {
        const x1 = safeTimeToCoord(chart, o.t1);
        const x2 = safeTimeToCoord(chart, o.t2);
        const y1 = safePriceToCoord(series, o.p1);
        const y2 = safePriceToCoord(series, o.p2);
        if (x1 == null || x2 == null || y1 == null || y2 == null) continue;

        const left = Math.min(x1, x2);
        const right = Math.max(x1, x2);

        const pA = o.p1;
        const pB = o.p2;

        const levels = (o.levels?.length ? o.levels : [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1]).filter((n) => Number.isFinite(n));
        for (const lv of levels) {
          const price = pA + (pB - pA) * lv;
          const yy = safePriceToCoord(series, price);
          if (yy == null) continue;

          drawLine(left, yy, right, yy, rgba, isSel ? 2 : 1.5, isSel ? 0.95 : 0.75);
          drawText(right + 6, clamp(yy + 4, 12, h - 6), `${Math.round(lv * 1000) / 10}%`, rgba);
        }

        drawLine(x1, y1, x2, y2, rgba, isSel ? 2.5 : 2, 0.85);
      }
    }

    const d = draftRef.current;
    if (d) {
      const x1 = safeTimeToCoord(chart, d.t1);
      const x2 = safeTimeToCoord(chart, d.t2);
      const y1 = safePriceToCoord(series, d.p1);
      const y2 = safePriceToCoord(series, d.p2);
      if (x1 != null && x2 != null && y1 != null && y2 != null) {
        drawLine(x1, y1, x2, y2, "rgba(148,163,184,0.9)", 2, 0.9);
      }
    }
  }, [objs, selectedId, chartRef, candleSeriesRef]);

  React.useEffect(() => {
    redraw();
  }, [redraw]);

  React.useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const ts: any = chart.timeScale();

    const cb = () => redraw();
    try {
      ts.subscribeVisibleTimeRangeChange?.(cb);
      ts.subscribeVisibleLogicalRangeChange?.(cb);
    } catch {}

    return () => {
      try {
        ts.unsubscribeVisibleTimeRangeChange?.(cb);
        ts.unsubscribeVisibleLogicalRangeChange?.(cb);
      } catch {}
    };
  }, [chartRef, redraw]);

  const getXY = (e: PointerEvent) => {
    const host = hostRef.current;
    if (!host) return null;
    const r = host.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    return { x, y, w: r.width, h: r.height };
  };

  const pickObject = React.useCallback(
    (x: number, y: number) => {
      const chart = chartRef.current;
      const series = candleSeriesRef.current;
      if (!chart || !series) return null;

      const HIT = 8;
      let best: { id: string; d: number } | null = null;

      for (const o of objs) {
        if (!o.visible) continue;

        if (o.type === "HLINE") {
          const yy = safePriceToCoord(series, o.price);
          if (yy == null) continue;
          const d = Math.abs(y - yy);
          if (d <= HIT && (!best || d < best.d)) best = { id: o.id, d };
        }

        if (o.type === "VLINE") {
          const xx = safeTimeToCoord(chart, o.time);
          if (xx == null) continue;
          const d = Math.abs(x - xx);
          if (d <= HIT && (!best || d < best.d)) best = { id: o.id, d };
        }

        if (o.type === "RECT" || o.type === "CIRCLE" || o.type === "FIBO") {
          const x1 = safeTimeToCoord(chart, o.t1);
          const x2 = safeTimeToCoord(chart, o.t2);
          const y1 = safePriceToCoord(series, o.p1);
          const y2 = safePriceToCoord(series, o.p2);
          if (x1 == null || x2 == null || y1 == null || y2 == null) continue;

          const rx = Math.min(x1, x2);
          const ry = Math.min(y1, y2);
          const rw = Math.abs(x2 - x1);
          const rh = Math.abs(y2 - y1);

          const inside = x >= rx - HIT && x <= rx + rw + HIT && y >= ry - HIT && y <= ry + rh + HIT;
          if (inside) {
            const d = 4;
            if (!best || d < best.d) best = { id: o.id, d };
          }
        }
      }

      return best?.id ?? null;
    },
    [objs, chartRef, candleSeriesRef]
  );

  React.useEffect(() => {
    const host = hostRef.current;
    const chart = chartRef.current;
    const series = candleSeriesRef.current;
    if (!host || !chart || !series) return;

    let down = false;

    const onDown = (e: PointerEvent) => {
      const pos = getXY(e);
      if (!pos) return;

      down = true;
      host.setPointerCapture(e.pointerId);

      if (tool === "SELECT") {
        const id = pickObject(pos.x, pos.y);
        setSelectedId(id);
        return;
      }

      const t = safeCoordToTime(chart, pos.x);
      const p = safeCoordToPrice(series, pos.y);
      if (!t || p == null) return;

      if (tool === "HLINE") {
        const o: HLineObj = { id: uid(), type: "HLINE", name: "HLINE", color: "#e2e8f0", visible: true, createdAt: Date.now(), price: p };
        setObjs((prev) => [o, ...prev]);
        setSelectedId(o.id);
      }

      if (tool === "VLINE") {
        const o: VLineObj = { id: uid(), type: "VLINE", name: "VLINE", color: "#e2e8f0", visible: true, createdAt: Date.now(), time: t };
        setObjs((prev) => [o, ...prev]);
        setSelectedId(o.id);
      }

      if (tool === "RECT" || tool === "CIRCLE" || tool === "FIBO") {
        draftRef.current = { type: tool, t1: t, p1: p, t2: t, p2: p };
        redraw();
      }
    };

    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const pos = getXY(e);
      if (!pos) return;

      if (tool === "RECT" || tool === "CIRCLE" || tool === "FIBO") {
        const d = draftRef.current;
        if (!d) return;

        const t = safeCoordToTime(chart, pos.x);
        const p = safeCoordToPrice(series, pos.y);
        if (!t || p == null) return;

        d.t2 = t;
        d.p2 = p;
        redraw();
      }
    };

    const onUp = (e: PointerEvent) => {
      down = false;
      try {
        host.releasePointerCapture(e.pointerId);
      } catch {}

      if (tool === "RECT" || tool === "CIRCLE" || tool === "FIBO") {
        const d = draftRef.current;
        draftRef.current = null;
        if (!d) return;

        if (d.type === "RECT") {
          const o: RectObj = { id: uid(), type: "RECT", name: "RECT", color: "#e2e8f0", visible: true, createdAt: Date.now(), t1: d.t1, p1: d.p1, t2: d.t2, p2: d.p2 };
          setObjs((prev) => [o, ...prev]);
          setSelectedId(o.id);
        }

        if (d.type === "CIRCLE") {
          const o: CircleObj = { id: uid(), type: "CIRCLE", name: "CIRCLE", color: "#e2e8f0", visible: true, createdAt: Date.now(), t1: d.t1, p1: d.p1, t2: d.t2, p2: d.p2 };
          setObjs((prev) => [o, ...prev]);
          setSelectedId(o.id);
        }

        if (d.type === "FIBO") {
          const o: FiboObj = {
            id: uid(),
            type: "FIBO",
            name: "FIBO",
            color: "#22c55e",
            visible: true,
            createdAt: Date.now(),
            t1: d.t1,
            p1: d.p1,
            t2: d.t2,
            p2: d.p2,
            levels: [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1],
          };
          setObjs((prev) => [o, ...prev]);
          setSelectedId(o.id);
        }
      }

      redraw();
    };

    host.addEventListener("pointerdown", onDown);
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerup", onUp);
    host.addEventListener("pointercancel", onUp);

    return () => {
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerup", onUp);
      host.removeEventListener("pointercancel", onUp);
    };
  }, [tool, chartRef, candleSeriesRef, pickObject, redraw]);

  const toolBtn = (t: DrawTool, label: string) => {
    const active = tool === t;
    return (
      <button
        type="button"
        onClick={() => setTool(t)}
        className={`rounded-xl border px-2.5 py-1.5 text-[11px] font-extrabold transition ${
          active ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-100" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
        }`}
        title={label}
      >
        {label}
      </button>
    );
  };

  const updateObj = (id: string, patch: Partial<AnyObj>) => {
    setObjs((prev) => prev.map((o) => (o.id === id ? ({ ...o, ...patch } as AnyObj) : o)));
  };

  const removeObj = (id: string) => {
    setObjs((prev) => prev.filter((o) => o.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
  };

  return (
    // ✅ Najważniejsze: pointer-events-none na całości, a panele + host mają auto
    <div className="absolute inset-0 z-[9999] pointer-events-none">
      {/* host do rysowania */}
      <div ref={hostRef} className="absolute inset-0 pointer-events-auto">
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
      </div>

      {/* toolbar (left) */}
      <div className="absolute left-3 top-14 pointer-events-auto flex items-center gap-2 bg-black/30 border border-white/10 rounded-2xl px-2 py-2 backdrop-blur">
        {toolBtn("SELECT", "SELECT")}
        {toolBtn("HLINE", "H-LINE")}
        {toolBtn("VLINE", "V-LINE")}
        {toolBtn("RECT", "RECT")}
        {toolBtn("CIRCLE", "CIRCLE")}
        {toolBtn("FIBO", "FIBO")}

        <button
          type="button"
          onClick={() => {
            setTool("SELECT");
            setSelectedId(null);
          }}
          className="ml-1 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-extrabold text-white/70 hover:bg-white/10 hover:text-white"
          title="Odznacz"
        >
          ✕
        </button>

        <button
          type="button"
          onClick={() => {
            setObjs([]);
            setSelectedId(null);
          }}
          className="rounded-xl border border-red-400/20 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-extrabold text-red-100 hover:bg-red-500/15"
          title="Usuń wszystko"
        >
          CLEAR
        </button>
      </div>

      {/* objects list (right) */}
      <div className="absolute right-3 top-14 pointer-events-auto w-[280px] max-h-[70%] overflow-auto rounded-2xl border border-white/10 bg-black/30 backdrop-blur p-2">
        <div className="flex items-center justify-between px-2 py-1">
          <div className="text-[11px] font-extrabold text-white/80">OBIEKTY</div>
          <div className="text-[10px] text-white/40">{objs.length}</div>
        </div>

        <div className="space-y-2 p-1">
          {objs.map((o) => {
            const active = o.id === selectedId;
            return (
              <div
                key={o.id}
                className={`rounded-2xl border px-2 py-2 transition ${
                  active ? "border-emerald-400/25 bg-emerald-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
                onClick={() => setSelectedId(o.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[11px] font-extrabold text-white/85">{o.name}</div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateObj(o.id, { visible: !o.visible } as any);
                      }}
                      className={`rounded-xl border px-2 py-1 text-[11px] font-extrabold ${
                        o.visible ? "border-white/10 bg-white/10 text-white" : "border-white/10 bg-white/5 text-white/50"
                      }`}
                      title="Pokaż/ukryj"
                    >
                      {o.visible ? "👁" : "🚫"}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeObj(o.id);
                      }}
                      className="rounded-xl border border-red-400/20 bg-red-500/10 px-2 py-1 text-[11px] font-extrabold text-red-100 hover:bg-red-500/15"
                      title="Usuń"
                    >
                      🗑
                    </button>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-white/50">{o.type}</div>

                  <input
                    type="color"
                    value={o.color}
                    onChange={(e) => updateObj(o.id, { color: e.target.value } as any)}
                    className="h-8 w-10 rounded-xl border border-white/10 bg-transparent"
                    title="Kolor"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            );
          })}

          {!objs.length ? <div className="px-2 py-3 text-xs text-white/35">Brak obiektów. Wybierz narzędzie i rysuj na wykresie.</div> : null}
        </div>
      </div>
    </div>
  );
}