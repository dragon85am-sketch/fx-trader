"use client";

import type { DrawTool } from "@/components/DrawingsLayer";
import React from "react";
import { Card, CardContent, Pill, cn, Button } from "@/components/ui";
import MarketChart, {
  type EmaConfig,
  type BbConfig,
  type Levels,
  type Zone,
} from "@/components/MarketChart";
import type { UTCTimestamp } from "lightweight-charts";

import {
  MousePointer2,
  Minus,
  MoveHorizontal,
  MoveVertical,
  TrendingUp,
  ArrowUpRight,
  RectangleHorizontal,
  Brush,
  Waves,
  ChartNoAxesCombined,
} from "lucide-react";
const EMA_FAST = 14;
const WMA_SLOW = 40;
type DataSource = "AUTO" | "HYBRID";
const DEFAULT_SOURCE: DataSource = "AUTO";

type RenkoSource = "AUTO" | "M1" | "M5" | "CURRENT";

type SupertrendSettings = {
  atrPeriod: number;
  factor: number;
  waitForClose: boolean;
  upTrend: boolean;
  downTrend: boolean;
  upBackground: boolean;
  downBackground: boolean;
  upColor: string;
  downColor: string;
};

const DEFAULT_SUPERTREND_SETTINGS: SupertrendSettings = {
  atrPeriod: 10,
  factor: 3,
  waitForClose: true,
  upTrend: true,
  downTrend: true,
  upBackground: true,
  downBackground: true,
  upColor: "#22c55e",
  downColor: "#ef4444",
};

const TIMEFRAMES = ["M1", "M5", "M15", "M30", "H1", "H4"] as const;
type Timeframe = (typeof TIMEFRAMES)[number];

const TWELVE_INTERVAL: Record<Timeframe, string> = {
  M1: "1min",
  M5: "5min",
  M15: "15min",
  M30: "30min",
  H1: "1h",
  H4: "4h",
};

const COINBASE_GRANULARITY: Record<Timeframe, number> = {
  M1: 60,
  M5: 300,
  M15: 900,
  M30: 1800,
  H1: 3600,
  H4: 14400,
};

type Signal = "UP" | "DOWN" | "NONE";
type Status = "READY" | "CLOSE";
type Side = "BUY" | "SELL";

type CandlePattern =
  | "BULLISH_ENGULFING"
  | "BEARISH_ENGULFING"
  | "HAMMER"
  | "BULLISH_PIN_BAR"
  | "BEARISH_PIN_BAR"
  | "MORNING_STAR"
  | "EVENING_STAR"
  | "THREE_INSIDE_UP"
  | "THREE_OUTSIDE_UP"
  | "THREE_INSIDE_DOWN"
  | "THREE_OUTSIDE_DOWN"
  | "NONE";

type Row = {
  symbol: string;
  liquidity: number;
  tf: Timeframe;
  status: Status;
  signal: Signal;
  tradeActive?: boolean;
  side?: Side;
  levels?: Levels;
  hammerTime?: UTCTimestamp;
  signalCandleTime?: UTCTimestamp;
  signalPattern?: CandlePattern;
  confirmationCount?: 0 | 1 | 2 | 3;
  confirmationSide?: Side | null;
  higherTfSignal?: Signal;
  tp1Hit?: boolean;
  
};

type ClosedTrade = {
  id: string;
  date: string;
  instrument: string;
  direction: Side;
  entry: number;
  tp1?: number;
  tp2?: number;
  sl: number;
  status: "TP2" | "SL" | "BE" | "TP1_BE";
  
};

type Candle = {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};



const FOREX_SYMBOLS = [
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "USDCHF",
  "AUDUSD",
  "NZDUSD",
  "USDCAD",
  "EURJPY",
  "GBPJPY",
  "XAUUSD",
];

const CRYPTO_SYMBOLS = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT"];

const COINBASE_MAP: Record<string, string> = {
  BTCUSDT: "BTC-USD",
  ETHUSDT: "ETH-USD",
  BNBUSDT: "BNB-USD",
  SOLUSDT: "SOL-USD",
  XRPUSDT: "XRP-USD",
  ADAUSDT: "ADA-USD",
  DOGEUSDT: "DOGE-USD",
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function clamp0_100(v: number) {
  return Math.max(0, Math.min(100, v));
}

function normalize01(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);

  if (!isFinite(min) || !isFinite(max) || max - min <= 1e-9) {
    return values.map(() => 0.5);
  }

  return values.map((v) => (v - min) / (max - min));
}

function round(v: number, dp = 6) {
  const p = Math.pow(10, dp);
  return Math.round(v * p) / p;
}

function calcATR14(candles: Array<{ high: number; low: number; close: number }>) {
  const period = 14;
  if (candles.length < period + 1) return 0;

  const trs: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1];
    const cur = candles[i];

    trs.push(
      Math.max(
        cur.high - cur.low,
        Math.abs(cur.high - prev.close),
        Math.abs(cur.low - prev.close)
      )
    );
  }

  let atr = trs.slice(0, period).reduce((a, v) => a + v, 0) / period;

  for (let i = period; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
  }

  return atr;
}

function getSupertrendSignal(
  candles: Candle[],
  period = 10,
  factor = 3,
  waitForClose = true
): Signal {
  if (candles.length < period + 2) return "NONE";

  const tr: number[] = new Array(candles.length).fill(0);

  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1];
    const cur = candles[i];

    tr[i] = Math.max(
      cur.high - cur.low,
      Math.abs(cur.high - prev.close),
      Math.abs(cur.low - prev.close)
    );
  }

  // Wilder / RMA ATR — zachowanie zgodne z ta.supertrend().
  const atr: number[] = new Array(candles.length).fill(NaN);

  let seed = 0;
  for (let i = 1; i <= period; i++) {
    seed += tr[i] ?? 0;
  }

  atr[period] = seed / period;

  for (let i = period + 1; i < candles.length; i++) {
    atr[i] = (atr[i - 1] * (period - 1) + tr[i]) / period;
  }

  const finalUpper: number[] = new Array(candles.length).fill(NaN);
  const finalLower: number[] = new Array(candles.length).fill(NaN);
  const trendUp: boolean[] = new Array(candles.length).fill(true);

  for (let i = period; i < candles.length; i++) {
    const cur = candles[i];
    const hl2 = (cur.high + cur.low) / 2;

    const basicUpper = hl2 + factor * atr[i];
    const basicLower = hl2 - factor * atr[i];

    if (i === period) {
      finalUpper[i] = basicUpper;
      finalLower[i] = basicLower;
      trendUp[i] = cur.close >= hl2;
      continue;
    }

    const prev = candles[i - 1];

    finalUpper[i] =
      basicUpper < finalUpper[i - 1] || prev.close > finalUpper[i - 1]
        ? basicUpper
        : finalUpper[i - 1];

    finalLower[i] =
      basicLower > finalLower[i - 1] || prev.close < finalLower[i - 1]
        ? basicLower
        : finalLower[i - 1];

    if (!trendUp[i - 1]) {
      trendUp[i] = cur.close > finalUpper[i];
    } else {
      trendUp[i] = !(cur.close < finalLower[i]);
    }
  }

  const targetIdx = waitForClose
    ? Math.max(period, candles.length - 2)
    : Math.max(period, candles.length - 1);

  return trendUp[targetIdx] ? "UP" : "DOWN";
}

function ema(values: number[], period: number) {
  const out: number[] = [];
  const k = 2 / (period + 1);
  let prev = values[0] ?? 0;

  out.push(prev);

  for (let i = 1; i < values.length; i++) {
    const next = values[i] * k + prev * (1 - k);
    out.push(next);
    prev = next;
  }

  return out;
}
function wma(values: number[], period: number) {
  const out: number[] = [];
  const denom = (period * (period + 1)) / 2;

  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      out.push(values[i] ?? 0);
      continue;
    }

    let sum = 0;

    for (let j = 0; j < period; j++) {
      sum += values[i - j] * (period - j);
    }

    out.push(sum / denom);
  }

  return out;
}



function lastClosedCandle(candles: Candle[]) {
  if (!candles.length) return undefined;
  return candles.length >= 2 ? candles[candles.length - 2] : candles[candles.length - 1];
}

function getTrendSignal(candles: Candle[]) {
  if (candles.length < 60) return { signal: "NONE" as Signal };

  const closes = candles.map((c) => c.close);
  const ema50 = ema(closes, 50);
  const ema200 = ema(closes, 200);
  const last = lastClosedCandle(candles);

  if (!last) return { signal: "NONE" as Signal };

  const idx = candles.findIndex((c) => Number(c.time) === Number(last.time));
  const lastEma50 = ema50[idx] ?? last.close;
  const lastEma200 = ema200[idx] ?? last.close;

  const up = last.close > lastEma200 && lastEma50 > lastEma200;
  const down = last.close < lastEma200 && lastEma50 < lastEma200;

  return { signal: up ? "UP" as Signal : down ? "DOWN" as Signal : "NONE" as Signal };
}
function getEmaWmaSignal(candles: Candle[]): Signal {
  if (candles.length < WMA_SLOW + 5) return "NONE";

  const closes = candles.map((c) => c.close);

  const ema14 = ema(closes, EMA_FAST);
  const wma40 = wma(closes, WMA_SLOW);

  const last = lastClosedCandle(candles);

  if (!last) return "NONE";

  const idx = candles.findIndex(
    (c) => Number(c.time) === Number(last.time)
  );

  const e = ema14[idx];
  const w = wma40[idx];

  if (!Number.isFinite(e) || !Number.isFinite(w))
    return "NONE";

  if (last.close > e && e > w) return "UP";

  if (last.close < e && e < w) return "DOWN";

  return "NONE";
}
function isTradingSession(
  symbol: string,
  date: Date
) {
  const hour = date.getUTCHours();

  const isCrypto =
    symbol.includes("BTC") ||
    symbol.includes("ETH") ||
    symbol.includes("SOL") ||
    symbol.includes("BNB") ||
    symbol.includes("XRP");

  if (isCrypto) {
    return hour >= 13 && hour <= 22;
  }

  return (
    (hour >= 7 && hour <= 11) ||
    (hour >= 13 && hour <= 17)
  );
}

function computeLiquidityScores(items: Array<{ atrPct: number; volume: number }>) {
  const atrs = items.map((i) => i.atrPct);
  const vols = items.map((i) => Math.log(1 + Math.max(0, i.volume)));
  const atrN = normalize01(atrs);
  const volN = normalize01(vols);

  return items.map((_, idx) => {
    const score01 = clamp01(0.55 * volN[idx] + 0.45 * atrN[idx]);
    return clamp0_100(Math.round(score01 * 100));
  });
}

function getTickSize(symbol: string) {
  const s = symbol.toUpperCase();

  if (s === "XAUUSD") return 0.1;

  if (s.endsWith("USDT")) {
    if (s.startsWith("BTC")) return 0.5;
    if (s.startsWith("ETH")) return 0.05;
    return 0.001;
  }

  return 0.0001;
}

function roundToTick(x: number, tick: number) {
  if (!tick || tick <= 0) return x;
  return Math.round(x / tick) * tick;
}

function makeZone(price: number, tick: number, zoneTicks: number, label: Zone["label"]): Zone {
  const half = Math.max(1, zoneTicks) * tick;
  const from = roundToTick(price - half, tick);
  const to = roundToTick(price + half, tick);

  return {
    label,
    from: Math.min(from, to),
    to: Math.max(from, to),
  };
}

function candleBody(c: Candle) {
  return Math.abs(c.close - c.open);
}

function candleRange(c: Candle) {
  return Math.max(0, c.high - c.low);
}

function upperWick(c: Candle) {
  return c.high - Math.max(c.open, c.close);
}

function lowerWick(c: Candle) {
  return Math.min(c.open, c.close) - c.low;
}

function isBullish(c: Candle) {
  return c.close > c.open;
}

function isBearish(c: Candle) {
  return c.close < c.open;
}
function isInPullbackBuyZone(
  candles: Candle[],
  idx: number,
  lookback = 12
) {
  const start = Math.max(0, idx - lookback);

  const rangeCandles = candles.slice(start, idx + 1);

  const highest = Math.max(...rangeCandles.map((c) => c.high));
  const lowest = Math.min(...rangeCandles.map((c) => c.low));

  const currentLow = candles[idx].low;

  const zone = lowest + (highest - lowest) * 0.20;

  return currentLow <= zone;
}
function hasBullishLiquiditySweep(
  candles: Candle[],
  idx: number
) {
  if (idx < 2) return false;

  const c = candles[idx];
  const prev = candles[idx - 1];

  const sweptLow = c.low < prev.low;

  const bullishClose = c.close > c.open;

  const lowerWick =
    Math.min(c.open, c.close) - c.low;

  const body =
    Math.abs(c.close - c.open);

  const strongWick = lowerWick > body * 0.5;

  return sweptLow && bullishClose && strongWick;
}

function hasBearishLiquiditySweep(
  candles: Candle[],
  idx: number
) {
  if (idx < 2) return false;

  const c = candles[idx];
  const prev = candles[idx - 1];

  const sweptHigh = c.high > prev.high;

  const bearishClose = c.close < c.open;

  const upperWick =
    c.high - Math.max(c.open, c.close);

  const body =
    Math.abs(c.close - c.open);

  const strongWick = upperWick > body * 0.5;

  return sweptHigh && bearishClose && strongWick;
}
function isInPullbackSellZone(
  candles: Candle[],
  idx: number,
  lookback = 12
) {
  const start = Math.max(0, idx - lookback);

  const rangeCandles = candles.slice(start, idx + 1);

  const highest = Math.max(...rangeCandles.map((c) => c.high));
  const lowest = Math.min(...rangeCandles.map((c) => c.low));

  const currentHigh = candles[idx].high;

  const zone = highest - (highest - lowest) * 0.20;

  return currentHigh >= zone;
}


function hasMomentumCandle(c: Candle, side: Side) {
  const body = Math.abs(c.close - c.open);
  const range = c.high - c.low;

  if (range <= 0) return false;

  const bodyRatio = body / range;

  if (side === "BUY") {
    const closeNearHigh = (c.high - c.close) / range <= 0.25;
    return c.close > c.open && bodyRatio >= 0.65 && closeNearHigh;
  }

  const closeNearLow = (c.close - c.low) / range <= 0.25;
  return c.close < c.open && bodyRatio >= 0.65 && closeNearLow;
}

function hasTwoBullishConfirmationCandles(candles: Candle[], patternIdx: number) {
  const c1 = candles[patternIdx + 1];
  const c2 = candles[patternIdx + 2];

  if (!c1 || !c2) return false;
  return isBullish(c1) && isBullish(c2);
}

function hasTwoBearishConfirmationCandles(candles: Candle[], patternIdx: number) {
  const c1 = candles[patternIdx + 1];
  const c2 = candles[patternIdx + 2];

  if (!c1 || !c2) return false;
  return isBearish(c1) && isBearish(c2);
}

function isBullishEngulfing(prev: Candle, cur: Candle) {
  return isBearish(prev) && isBullish(cur) && cur.open <= prev.close && cur.close >= prev.open;
}

function isBearishEngulfing(prev: Candle, cur: Candle) {
  return isBullish(prev) && isBearish(cur) && cur.open >= prev.close && cur.close <= prev.open;
}

function isHammer(c: Candle) {
  const body = candleBody(c);
  const range = candleRange(c);
  const lowW = lowerWick(c);
  const upW = upperWick(c);

  if (range <= 0) return false;
  return lowW >= body * 2 && upW <= Math.max(body, range * 0.15);
}

function isBullishPinBar(c: Candle) {
  const body = candleBody(c);
  const range = candleRange(c);
  const lowW = lowerWick(c);
  const upW = upperWick(c);

  if (range <= 0) return false;
  return lowW >= body * 2.5 && upW <= body && c.close > c.open;
}

function isBearishPinBar(c: Candle) {
  const body = candleBody(c);
  const range = candleRange(c);
  const lowW = lowerWick(c);
  const upW = upperWick(c);

  if (range <= 0) return false;
  return upW >= body * 2.5 && lowW <= body && c.close < c.open;
}

function isMorningStar(a: Candle, b: Candle, c: Candle) {
  const aBody = candleBody(a);
  const bBody = candleBody(b);

  return isBearish(a) && bBody < aBody * 0.6 && isBullish(c) && c.close > a.open - aBody * 0.5;
}

function isEveningStar(a: Candle, b: Candle, c: Candle) {
  const aBody = candleBody(a);
  const bBody = candleBody(b);

  return isBullish(a) && bBody < aBody * 0.6 && isBearish(c) && c.close < a.open + aBody * 0.5;
}




function isInvertedHammer(c: Candle) {
  const body = candleBody(c);
  const range = candleRange(c);
  const lowW = lowerWick(c);
  const upW = upperWick(c);

  if (range <= 0) return false;
  return upW >= body * 2 && lowW <= Math.max(body, range * 0.15);
}

function isThreeWhiteSoldiers(candles: Candle[], idx: number) {
  if (idx < 2) return false;

  const a = candles[idx - 2];
  const b = candles[idx - 1];
  const c = candles[idx];

  return (
    isBullish(a) &&
    isBullish(b) &&
    isBullish(c) &&
    b.close > a.close &&
    c.close > b.close &&
    candleBody(b) >= candleBody(a) * 0.7 &&
    candleBody(c) >= candleBody(b) * 0.7
  );
}

function isThreeBlackCrows(candles: Candle[], idx: number) {
  if (idx < 2) return false;

  const a = candles[idx - 2];
  const b = candles[idx - 1];
  const c = candles[idx];

  return (
    isBearish(a) &&
    isBearish(b) &&
    isBearish(c) &&
    b.close < a.close &&
    c.close < b.close &&
    candleBody(b) >= candleBody(a) * 0.7 &&
    candleBody(c) >= candleBody(b) * 0.7
  );
}

function isNearRecentLow(candles: Candle[], idx: number, lookback = 8) {
  const from = Math.max(0, idx - lookback);
  const slice = candles.slice(from, idx + 1);

  if (!slice.length) return false;

  const minLow = Math.min(...slice.map((x) => x.low));
  return candles[idx].low <= minLow * 1.001;
}

function isNearRecentHigh(candles: Candle[], idx: number, lookback = 8) {
  const from = Math.max(0, idx - lookback);
  const slice = candles.slice(from, idx + 1);

  if (!slice.length) return false;

  const maxHigh = Math.max(...slice.map((x) => x.high));
  return candles[idx].high >= maxHigh * 0.999;
}
function isThreeInsideUp(a: Candle, b: Candle, c: Candle) {
  return (
    isBearish(a) &&
    isBullish(b) &&
    b.open > a.close &&
    b.close < a.open &&
    isBullish(c) &&
    c.close > a.open
  );
}

function isThreeInsideDown(a: Candle, b: Candle, c: Candle) {
  return (
    isBullish(a) &&
    isBearish(b) &&
    b.open < a.close &&
    b.close > a.open &&
    isBearish(c) &&
    c.close < a.open
  );
}

function isThreeOutsideUp(a: Candle, b: Candle, c: Candle) {
  return (
    isBearish(a) &&
    isBullishEngulfing(a, b) &&
    isBullish(c) &&
    c.close > b.close
  );
}

function isThreeOutsideDown(a: Candle, b: Candle, c: Candle) {
  return (
    isBullish(a) &&
    isBearishEngulfing(a, b) &&
    isBearish(c) &&
    c.close < b.close
  );
}



function isBullishPatternAt(candles: Candle[], idx: number): CandlePattern | null {
  if (idx < 2) return null;

  const c = candles[idx];
  const p1 = candles[idx - 1];
  const p2 = candles[idx - 2];

  if (!c || !p1 || !p2) return null;

  if (isBullishEngulfing(p1, c)) return "BULLISH_ENGULFING";
  if (isBullishPinBar(c)) return "BULLISH_PIN_BAR";
  if (isHammer(c)) return "HAMMER";
  if (isMorningStar(p2, p1, c)) return "MORNING_STAR";
  if (isInvertedHammer(c)) return "HAMMER";
  if (isThreeWhiteSoldiers(candles, idx)) return "MORNING_STAR";

  return null;
}

function isBearishPatternAt(candles: Candle[], idx: number): CandlePattern | null {
  if (idx < 2) return null;

  const c = candles[idx];
  const p1 = candles[idx - 1];
  const p2 = candles[idx - 2];

  if (!c || !p1 || !p2) return null;

  if (isBearishEngulfing(p1, c)) return "BEARISH_ENGULFING";
  if (isBearishPinBar(c)) return "BEARISH_PIN_BAR";
  if (isEveningStar(p2, p1, c)) return "EVENING_STAR";
  if (isInvertedHammer(c)) return "HAMMER";
  if (isThreeBlackCrows(candles, idx)) return "EVENING_STAR";

  return null;
}

function countConfirmations(params: {
  side: Side;
  liquidity: number;
  candles: Candle[];
}): {
  count: 0 | 1 | 2 | 3;
  pattern: CandlePattern | "NONE";
} {
  const { side, liquidity, candles } = params;

  let count = 0;
  let pattern: CandlePattern | "NONE" = "NONE";

  if (side === "BUY") {
    if (liquidity >= 70) count += 1;

    if (candles.length >= 5) {
      const patternIdx = candles.length - 4;

      const p = isBullishPatternAt(
        candles,
        patternIdx
      );

      const confirmCandle =
        candles[patternIdx + 1];

      if (
        p &&
        confirmCandle &&
        isNearRecentLow(candles, patternIdx, 8) &&
        isInPullbackBuyZone(
          candles,
          patternIdx
        ) &&
        hasBullishLiquiditySweep(
          candles,
          patternIdx
        ) &&
        hasMomentumCandle(
          confirmCandle,
          "BUY"
        )
      ) {
        count += 2;
        pattern = p;
      }
    }
  } else {
    if (liquidity <= 30) count += 1;

    if (candles.length >= 5) {
      const patternIdx = candles.length - 4;

      const p = isBearishPatternAt(
        candles,
        patternIdx
      );

      const confirmCandle =
        candles[patternIdx + 1];

      if (
        p &&
        confirmCandle &&
        isNearRecentHigh(candles, patternIdx, 8) &&
        isInPullbackSellZone(
          candles,
          patternIdx
        ) &&
        hasBearishLiquiditySweep(
          candles,
          patternIdx
        ) &&
        hasMomentumCandle(
          confirmCandle,
          "SELL"
        )
      ) {
        count += 2;
        pattern = p;
      }
    }
  }

  return {
    count: Math.min(count, 3) as
      | 0
      | 1
      | 2
      | 3,
    pattern,
  };
}
function getBestConfirmation(params: {
  liquidity: number;
  candles: Candle[];
}): {
  side: Side | null;
  count: 0 | 1 | 2 | 3;
  pattern: CandlePattern | "NONE";
} {
  const { liquidity, candles } = params;
  const buy = countConfirmations({ side: "BUY", liquidity, candles });
  const sell = countConfirmations({ side: "SELL", liquidity, candles });

  if (buy.count === 0 && sell.count === 0) return { side: null, count: 0, pattern: "NONE" };
  if (buy.count > sell.count) return { side: "BUY", count: buy.count, pattern: buy.pattern };
  if (sell.count > buy.count) return { side: "SELL", count: sell.count, pattern: sell.pattern };

  return { side: null, count: 0, pattern: "NONE" };
}

function buildLevelsLiquidityOnly(params: {
  candles: Candle[];
  tickSize: number;
  zoneTicks: number;
  side: Side;
  signalTime?: UTCTimestamp;
}): Levels | undefined {
  const { candles, tickSize, zoneTicks, side, signalTime } = params;

  if (!candles.length) return undefined;

  const signalCandle = signalTime
    ? candles.find((c) => Number(c.time) === Number(signalTime))
    : lastClosedCandle(candles);

  if (!signalCandle) return undefined;

  const atr = calcATR14(candles);
  const minBuffer = Math.max(tickSize * 3, atr * 0.15);
  const entry = roundToTick(signalCandle.close, tickSize);
  const entryPad = Math.max(tickSize * 2, Math.abs(signalCandle.high - signalCandle.low) * 0.12);

  if (side === "BUY") {
    const sl = roundToTick(signalCandle.low - minBuffer, tickSize);
    const risk = entry - sl;

    if (risk <= 0) return undefined;

    const tp1 = roundToTick(entry + risk * 1, tickSize);
    const tp2 = roundToTick(entry + risk * 2, tickSize);
    const tp3 = roundToTick(entry + risk * 3, tickSize);

    return {
      side: "BUY",
      entry,
      sl,
      tps: [tp1, tp2, tp3],
      rr: Number(((tp3 - entry) / risk).toFixed(2)),
      zones: [
        { label: "ENTRY", from: roundToTick(entry - entryPad, tickSize), to: roundToTick(entry + entryPad, tickSize) },
        makeZone(tp1, tickSize, zoneTicks, "TP1"),
        makeZone(tp2, tickSize, zoneTicks, "TP2"),
        makeZone(tp3, tickSize, zoneTicks, "TP3"),
        makeZone(sl, tickSize, zoneTicks, "SL"),
      ],
    };
  }

  const sl = roundToTick(signalCandle.high + minBuffer, tickSize);
  const risk = sl - entry;

  if (risk <= 0) return undefined;

  const tp1 = roundToTick(entry - risk * 1, tickSize);
  const tp2 = roundToTick(entry - risk * 2, tickSize);
  const tp3 = roundToTick(entry - risk * 3, tickSize);

  return {
    side: "SELL",
    entry,
    sl,
    tps: [tp1, tp2, tp3],
    rr: Number(((entry - tp3) / risk).toFixed(2)),
    zones: [
      { label: "ENTRY", from: roundToTick(entry - entryPad, tickSize), to: roundToTick(entry + entryPad, tickSize) },
      makeZone(tp1, tickSize, zoneTicks, "TP1"),
      makeZone(tp2, tickSize, zoneTicks, "TP2"),
      makeZone(tp3, tickSize, zoneTicks, "TP3"),
      makeZone(sl, tickSize, zoneTicks, "SL"),
    ],
  };
}

function detectClosedTradeStatus(params: {
  candles: Candle[];
  side: Side;
  levels: Levels;
  signalTime: UTCTimestamp;
  tp1Hit?: boolean;
}): { status: "TP2" | "SL" | "BE" | "TP1_BE" | null; tp1Hit: boolean } {
  const { candles, side, levels, signalTime } = params;
  let tp1Hit = params.tp1Hit ?? false;

  if (!candles.length) return { status: null, tp1Hit };

  const startIdx = candles.findIndex(
    (c) => Number(c.time) > Number(signalTime)
  );

  if (startIdx < 0) return { status: null, tp1Hit };

  const tp1 = levels.tps?.[0];
  const tp2 = levels.tps?.[1];

  if (tp1 == null || tp2 == null) return { status: null, tp1Hit };

  for (let i = startIdx; i < candles.length; i++) {
    const c = candles[i];

    if (side === "BUY") {
      if (!tp1Hit && c.high >= tp1) tp1Hit = true;

      if (c.high >= tp2) {
        return { status: "TP2", tp1Hit };
      }

      if (tp1Hit && c.close <= levels.entry) {
        return { status: "TP1_BE", tp1Hit };
      }

      if (!tp1Hit && c.low <= levels.sl) {
        return { status: "SL", tp1Hit };
      }
    }

    if (side === "SELL") {
      if (!tp1Hit && c.low <= tp1) tp1Hit = true;

      if (c.low <= tp2) {
        return { status: "TP2", tp1Hit };
      }

      if (tp1Hit && c.close >= levels.entry) {
        return { status: "TP1_BE", tp1Hit };
      }

      if (!tp1Hit && c.high >= levels.sl) {
        return { status: "SL", tp1Hit };
      }
    }
  }

  return { status: null, tp1Hit };
}

function toTwelveSymbol(symbol: string) {
  const s = symbol.toUpperCase();

  if (s === "XAUUSD") return "XAU/USD";
  if (s === "XAGUSD") return "XAG/USD";
  if (s.endsWith("USDT")) return `${s.slice(0, -4)}/USD`;
  if (s.length === 6) return `${s.slice(0, 3)}/${s.slice(3)}`;

  return s;
}

async function fetchTwelveCandles(symbol: string, tf: Timeframe): Promise<{ candles: Candle[]; volume: number }> {
  const interval = TWELVE_INTERVAL[tf];
  const tdSymbol = toTwelveSymbol(symbol);

  const url = `/api/twelve?path=/time_series&symbol=${encodeURIComponent(tdSymbol)}&interval=${encodeURIComponent(
    interval
  )}&outputsize=220&format=JSON`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());

  const data = await res.json();
  if (data?.status === "error") throw new Error(data.message);

const candles: Candle[] = (data.values ?? [])
  .slice()
  .reverse()
  .map((v: any) => ({
    time: Math.floor(
      new Date(v.datetime.replace(" ", "T") + "Z").getTime() / 1000
    ) as UTCTimestamp,
    open: Number(v.open),
    high: Number(v.high),
    low: Number(v.low),
    close: Number(v.close),
    volume: Number(v.volume ?? 0),
  }))
  .filter(
    (c: Candle) =>
      Number.isFinite(c.time) &&
      c.open > 0 &&
      c.high > 0 &&
      c.low > 0 &&
      c.close > 0
  );
  const volume = candles.reduce((sum, c) => sum + (c.volume ?? 0), 0);

  return {
    candles,
    volume,
  };
}
  

async function fetchCoinbaseCandles(symbol: string, tf: Timeframe): Promise<{ candles: Candle[]; volume: number }> {
  const productId = COINBASE_MAP[symbol.toUpperCase()];

  if (!productId) throw new Error(`Coinbase unsupported symbol: ${symbol}`);

  const granularity = COINBASE_GRANULARITY[tf];
  const url = `/api/coinbase?product_id=${encodeURIComponent(productId)}&granularity=${granularity}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Coinbase error: ${symbol} | ${await res.text()}`);

  const data = await res.json();
  const raw = Array.isArray(data) ? data : Array.isArray(data?.candles) ? data.candles : [];

  const candles: Candle[] = raw
    .map((c: any) => ({
      time: Number(c[0]) as UTCTimestamp,
      low: Number(c[1]),
      high: Number(c[2]),
      open: Number(c[3]),
      close: Number(c[4]),
      volume: Number(c[5] ?? 0),
    }))
    .filter(
      (c: Candle) =>
        Number.isFinite(c.time) &&
        Number.isFinite(c.open) &&
        Number.isFinite(c.high) &&
        Number.isFinite(c.low) &&
        Number.isFinite(c.close) &&
        c.open > 0 &&
        c.high > 0 &&
        c.low > 0 &&
        c.close > 0
    )
    .sort((a: Candle, b: Candle) => Number(a.time) - Number(b.time));

  const volume = candles.reduce((sum, c) => sum + (c.volume ?? 0), 0);

  return { candles, volume };
}


async function fetchAutoCandles(symbol: string, tf: Timeframe, _source: DataSource): Promise<{ candles: Candle[]; volume: number }> {
  if (symbol.endsWith("USDT")) return fetchCoinbaseCandles(symbol, tf);
  return fetchTwelveCandles(symbol, tf);
}

// ======================================================
// POC MINI SCANNER
// ======================================================

const POC_TIMEFRAMES = ["M1", "M5", "M15", "M30", "H1", "H4", "D"] as const;
type PocTimeframe = (typeof POC_TIMEFRAMES)[number];
type PocRelation = "ABOVE" | "BELOW" | "NEAR";

type PocCell = {
  tf: PocTimeframe;
  poc: number;
  last: number;
  relation: PocRelation;
  trend: Signal;
};

type PocScannerState = {
  symbol: string;
  cells: PocCell[];
  loading: boolean;
  error: string | null;
};

const POC_INTERVAL: Record<PocTimeframe, string> = {
  M1: "1min",
  M5: "5min",
  M15: "15min",
  M30: "30min",
  H1: "1h",
  H4: "4h",
  D: "1day",
};

const POC_COINBASE_GRANULARITY: Record<PocTimeframe, number> = {
  M1: 60,
  M5: 300,
  M15: 900,
  M30: 1800,
  H1: 3600,
  H4: 14400,
  D: 86400,
};

function calcVolumePoc(candles: Candle[], bins = 28): number | null {
  if (!candles.length) return null;

  const slice = candles.slice(-180);
  const low = Math.min(...slice.map((c) => c.low));
  const high = Math.max(...slice.map((c) => c.high));

  if (!Number.isFinite(low) || !Number.isFinite(high) || high <= low) {
    return lastClosedCandle(slice)?.close ?? null;
  }

  const step = (high - low) / bins;
  const profile = new Array<number>(bins).fill(0);

  for (const candle of slice) {
    const typical = (candle.high + candle.low + candle.close) / 3;
    const rawIndex = Math.floor((typical - low) / step);
    const index = Math.max(0, Math.min(bins - 1, rawIndex));

    // Forex z Twelve Data czasem nie ma realnego wolumenu.
    // Wtedy każda świeca dostaje wagę 1, żeby POC nadal działał.
    const weight =
      Number.isFinite(candle.volume) && (candle.volume ?? 0) > 0
        ? Number(candle.volume)
        : 1;

    profile[index] += weight;
  }

  let bestIndex = 0;
  for (let i = 1; i < profile.length; i++) {
    if (profile[i] > profile[bestIndex]) bestIndex = i;
  }

  return low + step * (bestIndex + 0.5);
}

function getPocRelation(candles: Candle[], poc: number): PocRelation {
  const last = lastClosedCandle(candles);
  if (!last) return "NEAR";

  const atr = calcATR14(candles);
  const tolerance = Math.max(
    Math.abs(last.close) * 0.00035,
    Number.isFinite(atr) ? atr * 0.08 : 0
  );

  if (Math.abs(last.close - poc) <= tolerance) return "NEAR";
  return last.close > poc ? "ABOVE" : "BELOW";
}

function getPocTrend(candles: Candle[]): Signal {
  const fast = getEmaWmaSignal(candles);
  if (fast !== "NONE") return fast;
  return getTrendSignal(candles).signal;
}

async function fetchPocCandles(
  symbol: string,
  tf: PocTimeframe
): Promise<Candle[]> {
  if (symbol.endsWith("USDT")) {
    const productId = COINBASE_MAP[symbol.toUpperCase()];
    if (!productId) throw new Error(`Coinbase unsupported symbol: ${symbol}`);

    const granularity = POC_COINBASE_GRANULARITY[tf];
    const url = `/api/coinbase?product_id=${encodeURIComponent(
      productId
    )}&granularity=${granularity}`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`POC Coinbase error: ${symbol} ${tf}`);

    const data = await res.json();
    const raw = Array.isArray(data)
      ? data
      : Array.isArray(data?.candles)
        ? data.candles
        : [];

    return raw
      .map((c: any) => ({
        time: Number(c[0]) as UTCTimestamp,
        low: Number(c[1]),
        high: Number(c[2]),
        open: Number(c[3]),
        close: Number(c[4]),
        volume: Number(c[5] ?? 0),
      }))
      .filter(
        (c: Candle) =>
          Number.isFinite(c.time) &&
          Number.isFinite(c.open) &&
          Number.isFinite(c.high) &&
          Number.isFinite(c.low) &&
          Number.isFinite(c.close) &&
          c.open > 0 &&
          c.high > 0 &&
          c.low > 0 &&
          c.close > 0
      )
      .sort((a: Candle, b: Candle) => Number(a.time) - Number(b.time));
  }

  const tdSymbol = toTwelveSymbol(symbol);
  const interval = POC_INTERVAL[tf];

  const url = `/api/twelve?path=/time_series&symbol=${encodeURIComponent(
    tdSymbol
  )}&interval=${encodeURIComponent(interval)}&outputsize=220&format=JSON`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`POC Twelve Data error: ${symbol} ${tf}`);

  const data = await res.json();
  if (data?.status === "error") {
    throw new Error(data?.message ?? `POC Twelve Data error: ${symbol} ${tf}`);
  }

  return (data.values ?? [])
    .slice()
    .reverse()
    .map((v: any) => ({
      time: Math.floor(
        new Date(v.datetime.replace(" ", "T") + "Z").getTime() / 1000
      ) as UTCTimestamp,
      open: Number(v.open),
      high: Number(v.high),
      low: Number(v.low),
      close: Number(v.close),
      volume: Number(v.volume ?? 0),
    }))
    .filter(
      (c: Candle) =>
        Number.isFinite(c.time) &&
        Number.isFinite(c.open) &&
        Number.isFinite(c.high) &&
        Number.isFinite(c.low) &&
        Number.isFinite(c.close) &&
        c.open > 0 &&
        c.high > 0 &&
        c.low > 0 &&
        c.close > 0
    );
}

function getPocSummary(cells: PocCell[]) {
  let buy = 0;
  let sell = 0;

  for (const cell of cells) {
    if (cell.relation === "ABOVE") buy += 1;
    if (cell.relation === "BELOW") sell += 1;

    if (cell.trend === "UP") buy += 1;
    if (cell.trend === "DOWN") sell += 1;

    if (cell.relation === "ABOVE" && cell.trend === "UP") buy += 1;
    if (cell.relation === "BELOW" && cell.trend === "DOWN") sell += 1;
  }

  const totalPossible = Math.max(1, cells.length * 3);
  const net = buy - sell;
  const strength = Math.max(
    0,
    Math.min(6, Math.round((Math.abs(net) / totalPossible) * 8))
  );

  const label =
    net >= 8
      ? "STRONG BUY"
      : net >= 4
        ? "BUY"
        : net <= -8
          ? "STRONG SELL"
          : net <= -4
            ? "SELL"
            : "WAIT";

  return { label, strength, net };
}

function PocMiniScanner({
  state,
}: {
  state: PocScannerState;
}) {
  const summary = getPocSummary(state.cells);
  const bullish = summary.net > 0;
  const bearish = summary.net < 0;

  const resultLabel = state.loading ? "LOADING" : summary.label;

  return (
    <div className="w-[860px] max-w-full self-start overflow-hidden rounded-[22px] border border-sky-300/35 bg-[linear-gradient(180deg,#174f86_0%,#123f6d_48%,#0d335a_100%)] shadow-[0_14px_35px_rgba(0,0,0,.22),0_0_28px_rgba(14,165,233,.08),inset_0_1px_0_rgba(255,255,255,.08)]">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-4 border-b border-sky-200/10 bg-[#123d68]/70 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-fuchsia-300/20 bg-fuchsia-400/10 shadow-[0_0_16px_rgba(217,70,239,.10)]">
            <ChartNoAxesCombined className="h-4 w-4 text-fuchsia-300" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-black tracking-wide text-white">
                POC MINI
              </span>
              <span className="truncate rounded-md bg-white/5 px-2 py-0.5 text-[9px] font-bold text-sky-100/45">
                {state.symbol}
              </span>
            </div>
            <div className="mt-0.5 text-[8px] font-medium uppercase tracking-[0.18em] text-sky-100/30">
              Multi timeframe signal
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span
            className={cn(
              "rounded-lg border px-3 py-1 text-[10px] font-black shadow-[inset_0_1px_0_rgba(255,255,255,.08)]",
              resultLabel.includes("BUY")
                ? "border-emerald-300/25 bg-emerald-400/12 text-emerald-300"
                : resultLabel.includes("SELL")
                  ? "border-red-300/25 bg-red-500/12 text-red-300"
                  : "border-amber-300/25 bg-amber-500/12 text-amber-200"
            )}
          >
            {resultLabel}
          </span>

          <div className="flex items-end gap-1" title="Siła całego sygnału">
            {Array.from({ length: 6 }).map((_, index) => {
              const heights = ["h-2", "h-2.5", "h-3", "h-3.5", "h-4", "h-4.5"];
              return (
                <span
                  key={index}
                  className={cn(
                    "w-3.5 rounded-[3px] border transition-all",
                    heights[index] ?? "h-3",
                    index < summary.strength
                      ? bullish
                        ? "border-emerald-200/40 bg-emerald-400 shadow-[0_0_7px_rgba(52,211,153,.20)]"
                        : bearish
                          ? "border-red-200/40 bg-red-400 shadow-[0_0_7px_rgba(248,113,113,.18)]"
                          : "border-amber-200/35 bg-amber-400"
                      : "border-sky-100/10 bg-sky-100/10"
                  )}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* TIMEFRAMES */}
      <div className="grid grid-cols-7 gap-2 px-3.5 py-3">
        {POC_TIMEFRAMES.map((pocTf) => {
          const cell = state.cells.find((item) => item.tf === pocTf);

          const isBuy =
            cell?.relation === "ABOVE" && cell?.trend === "UP";
          const isSell =
            cell?.relation === "BELOW" && cell?.trend === "DOWN";

          const relationText =
            !cell
              ? "—"
              : cell.relation === "ABOVE"
                ? "Above"
                : cell.relation === "BELOW"
                  ? "Below"
                  : "Near";

          const trendText =
            !cell
              ? "—"
              : cell.trend === "UP"
                ? "↑ Up"
                : cell.trend === "DOWN"
                  ? "↓ Down"
                  : "Flat";

          const activeSegments = isBuy
            ? 4
            : isSell
              ? 3
              : cell
                ? 1
                : 0;

          return (
            <div
              key={pocTf}
              className={cn(
                "group rounded-[14px] border px-2 py-2.5 text-center transition",
                isBuy
                  ? "border-emerald-300/15 bg-[linear-gradient(180deg,#104b69_0%,#0d3f61_100%)]"
                  : isSell
                    ? "border-red-300/12 bg-[linear-gradient(180deg,#173d61_0%,#123654_100%)]"
                    : "border-sky-300/10 bg-[#10385f]/85"
              )}
            >
              <div className="text-[9px] font-black uppercase tracking-[0.12em] text-sky-100/35">
                {pocTf}
              </div>

              <div
                className={cn(
                  "mt-1.5 text-[10px] font-black",
                  !cell
                    ? "text-sky-100/25"
                    : cell.relation === "ABOVE"
                      ? "text-emerald-300"
                      : cell.relation === "BELOW"
                        ? "text-red-300"
                        : "text-amber-200"
                )}
              >
                {relationText}
              </div>

              <div
                className={cn(
                  "mt-0.5 text-[9px] font-black",
                  !cell
                    ? "text-sky-100/25"
                    : cell.trend === "UP"
                      ? "text-emerald-300"
                      : cell.trend === "DOWN"
                        ? "text-red-300"
                        : "text-sky-100/35"
                )}
              >
                {trendText}
              </div>

              <div className="mt-2 flex justify-center gap-[2px]">
                {Array.from({ length: 5 }).map((_, segmentIndex) => (
                  <span
                    key={segmentIndex}
                    className={cn(
                      "h-2 w-2.5 rounded-[2px] border",
                      segmentIndex < activeSegments && isBuy
                        ? "border-emerald-200/40 bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,.18)]"
                        : segmentIndex < activeSegments && isSell
                          ? "border-red-200/40 bg-red-400 shadow-[0_0_6px_rgba(248,113,113,.15)]"
                          : segmentIndex < activeSegments
                            ? "border-amber-200/30 bg-amber-400"
                            : "border-sky-100/15 bg-[#214e78]/80"
                    )}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER */}
      <div className="flex min-h-[27px] items-center justify-between border-t border-sky-200/10 bg-[#0b3156]/65 px-4 py-1.5">
        <div className="text-[8px] font-semibold text-sky-100/35">
          {state.error ? (
            <span className="text-rose-300">{state.error}</span>
          ) : state.cells.length < POC_TIMEFRAMES.length ? (
            <span className="text-rose-300/70">
              {`${POC_TIMEFRAMES.length - state.cells.length} TF bez danych`}
            </span>
          ) : (
            <span>Wszystkie interwały aktywne</span>
          )}
        </div>

        <div className="text-[8px] font-bold uppercase tracking-[0.12em] text-sky-100/25">
          POC + Trend
        </div>
      </div>
    </div>
  );
}

function LiquidityBar({ value }: { value: number }) {
  const v = clamp0_100(value);
  const color = v >= 80
    ? "bg-[linear-gradient(90deg,#2dd4bf,#22d3ee)]"
    : v >= 50
      ? "bg-[linear-gradient(90deg,#38bdf8,#0ea5e9)]"
      : "bg-[linear-gradient(90deg,#f59e0b,#f97316)]";

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 w-36 overflow-hidden rounded-full bg-[#03172e]/70 ring-1 ring-sky-300/10">
        <div className={cn("h-full", color)} style={{ width: `${v}%` }} />
      </div>
      <span className="w-10 text-sm font-semibold text-sky-50/85">{v}%</span>
    </div>
  );
}

function SignalDot({ s }: { s: Signal }) {
  const cls =
    s === "UP"
      ? "bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.4)]"
      : s === "DOWN"
        ? "bg-red-400 shadow-[0_0_14px_rgba(248,113,113,0.4)]"
        : "bg-zinc-500/60";

  return <span className={cn("inline-block h-3 w-3 rounded-full", cls)} />;
}

function ConfirmationBadge({ count, side }: { count: 0 | 1 | 2 | 3; side: Side | null }) {
  const cls =
    count === 3
      ? side === "BUY"
        ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
        : "border-red-400/30 bg-red-500/15 text-red-200"
      : count === 2
        ? "border-amber-400/30 bg-amber-500/15 text-amber-200"
        : count === 1
          ? "border-sky-400/30 bg-sky-500/15 text-sky-200"
          : "border-sky-300/15 bg-[#0b315c]/70 text-sky-100/55";

  const label = side && count > 0 ? `${count}/3 ${side}` : `${count}/3`;

  return <span className={cn("rounded-full border px-2 py-1 text-[11px] font-extrabold", cls)}>{label}</span>;
}

function GearIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
      <path d="M19.4 15a7.8 7.8 0 0 0 .1-2l2-1.5-2-3.5-2.4 1a7.7 7.7 0 0 0-1.7-1l-.3-2.6H10l-.3 2.6a7.7 7.7 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a7.8 7.8 0 0 0 .1 2l-2 1.5 2 3.5 2.4-1a7.7 7.7 0 0 0 1.7 1l.3 2.6h4l.3-2.6a7.7 7.7 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5z" />
    </svg>
  );
}

type SortKey = "LIQ_DESC" | "LIQ_ASC";

type EmaSlot = {
  id: number;
  period: number;
  enabled: boolean;
  color: string;
  width: 1 | 2 | 3 | 4;
};

type EmaState = EmaSlot[];

const DEFAULT_EMA: EmaState = [
  { id: 1, period: 20, enabled: false, color: "#ef4444", width: 2 },
  { id: 2, period: 50, enabled: false, color: "#f97316", width: 2 },
  { id: 3, period: 100, enabled: false, color: "#22d3ee", width: 2 },
  { id: 4, period: 200, enabled: true, color: "#3b82f6", width: 2 },
];

function clampEmaPeriod(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(500, Math.round(value)));
}

type BbState = {
  enabled: boolean;
  length: number;
  maType: "SMA" | "EMA";
  source: "close";
  stdDev: number;
  offset: number;

  colors: {
    upper: string;
    basis: string;
    lower: string;
  };

  widths?: {
    upper?: 1 | 2 | 3 | 4;
    basis?: 1 | 2 | 3 | 4;
    lower?: 1 | 2 | 3 | 4;
  };

  background: {
    enabled: boolean;
    color: string;
    opacity: number;
  };
};

const DEFAULT_BB: BbState = {
  enabled: false,
  length: 20,
  maType: "SMA",
  source: "close",
  stdDev: 2,
  offset: 0,
  colors: {
    upper: "#84cc16",
    basis: "#f97316",
    lower: "#facc15",
  },
  widths: {
    upper: 2,
    basis: 2,
    lower: 2,
  },
  background: {
    enabled: true,
    color: "#2563eb",
    opacity: 0.12,
  },
};

function formatSyncUTC(ts: number) {
  try {
    return new Date(ts).toISOString().slice(11, 19) + " UTC";
  } catch {
    return "—";
  }
}

function tradeKey(symbol: string, tf: Timeframe) {
  return `${symbol}|${tf}`;
}

const ACTIVE_TRADES_KEY = "fx_active_trades_v1";
const CLOSED_TRADES_KEY = "fx_closed_trades_v1";
function saveClosedTradesToStorage(trades: ClosedTrade[]) {
  try {
    localStorage.setItem(CLOSED_TRADES_KEY, JSON.stringify(trades)); 
  } catch {}
}

function loadClosedTradesFromStorage(): ClosedTrade[] {
  try {
    const raw = localStorage.getItem(CLOSED_TRADES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
const SUPER_ATR_PERIOD = 10;
const SUPER_FACTOR = 3;



const ATR_PERIOD = 14;

const SL_ATR_MULT = 5;
const TP1_ATR_MULT = 0.5;
const TP2_ATR_MULT = 1;
const TP3_ATR_MULT = 1.5;
function getScannerSupertrendSignal(
  candles: Candle[],
  period = 90,
  factor = 12
): Signal {
  if (candles.length < period + 5) return "NONE";

  const atr = calcATR14(candles);
  if (!atr || !Number.isFinite(atr)) return "NONE";

  const last = lastClosedCandle(candles);
  if (!last) return "NONE";

  const hl2 = (last.high + last.low) / 2;
  const upperBand = hl2 + factor * atr;
  const lowerBand = hl2 - factor * atr;

  if (last.close > lowerBand) return "UP";
  if (last.close < upperBand) return "DOWN";

  return "NONE";
}
export default function MarketScannerPage() {
  const [source, setSource] = React.useState<DataSource>(DEFAULT_SOURCE);
  const [tf, setTf] = React.useState<Timeframe>("M5");
  const [selectedSymbol, setSelectedSymbol] = React.useState<string>("BTCUSDT");

  const [pocScanner, setPocScanner] = React.useState<PocScannerState>({
    symbol: "BTCUSDT",
    cells: [],
    loading: true,
    error: null,
  });

  const LIQ_THRESHOLD_HIGH = 70;
  const LIQ_THRESHOLD_LOW = 30;
  const ZONE_TICKS = 12;
  



  const TELEGRAM_ON = true;
  const REFRESH_MS = 300000;

  const [heikinAshi, setHeikinAshi] = React.useState(false);
  const [renko, setRenko] = React.useState(false);
  const [renkoBoxSize, setRenkoBoxSize] = React.useState<number>(0);
  const [renkoPanelOpen, setRenkoPanelOpen] = React.useState(false);
  const [renkoDraftMode, setRenkoDraftMode] =
    React.useState<"AUTO" | "MANUAL">("AUTO");
  const [renkoDraftBoxSize, setRenkoDraftBoxSize] = React.useState<number>(0);
  const [renkoSource, setRenkoSource] = React.useState<RenkoSource>("M1");
  const [renkoDraftSource, setRenkoDraftSource] = React.useState<RenkoSource>("M1");
  const [renkoCandles, setRenkoCandles] = React.useState<Candle[]>([]);
  const [renkoLoading, setRenkoLoading] = React.useState(false);
  const [supertrendEnabled, setSupertrendEnabled] = React.useState(false);
  const [patternsEnabled, setPatternsEnabled] = React.useState(false);
  const [supertrendPanelOpen, setSupertrendPanelOpen] = React.useState(false);
  const [supertrendSettings, setSupertrendSettings] =
    React.useState<SupertrendSettings>(DEFAULT_SUPERTREND_SETTINGS);
  const [supertrendDraft, setSupertrendDraft] =
    React.useState<SupertrendSettings>(DEFAULT_SUPERTREND_SETTINGS);

  const [scannerEnabled, setScannerEnabled] = React.useState(true);
  const [toolsPanelOpen, setToolsPanelOpen] = React.useState(false);
  const toolsPanelRef = React.useRef<HTMLDivElement | null>(null);

  const rightPanelRef = React.useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const [emaState, setEmaState] = React.useState<EmaState>(DEFAULT_EMA);
  const [emaPanelOpen, setEmaPanelOpen] = React.useState(false);
  const emaPanelWrapRef = React.useRef<HTMLDivElement | null>(null);

  const [bbState, setBbState] = React.useState<BbState>(DEFAULT_BB);

  React.useEffect(() => {
    setBbState((prev) => ({
      ...DEFAULT_BB,
      ...prev,
      colors: {
        ...DEFAULT_BB.colors,
        ...(prev?.colors ?? {}),
      },
      widths: {
        ...DEFAULT_BB.widths,
        ...(prev?.widths ?? {}),
      },
      background: {
        ...DEFAULT_BB.background,
        ...(prev?.background ?? {}),
      },
    }));
  }, []);

  const [bbPanelOpen, setBbPanelOpen] = React.useState(false);
  const bbPanelWrapRef = React.useRef<HTMLDivElement | null>(null);

  const [activeDrawTool, setActiveDrawTool] = React.useState<DrawTool>("SELECT");
  const DRAW_TOOL_BUTTONS: Array<{
  tool: DrawTool;
  icon: React.ElementType;
  title: string;
}> = [
  { tool: "SELECT", icon: MousePointer2, title: "Select" },
  { tool: "HLINE", icon: Minus, title: "Horizontal line" },
  { tool: "VLINE", icon: MoveVertical, title: "Vertical line" },
  { tool: "TREND", icon: TrendingUp, title: "Trend line" },
  { tool: "RAY", icon: ArrowUpRight, title: "Ray" },
  { tool: "HORIZONTAL_RAY", icon: MoveHorizontal, title: "Horizontal ray" },
  { tool: "RECT", icon: RectangleHorizontal, title: "Rectangle" },
  { tool: "FIBO", icon: ChartNoAxesCombined, title: "Fibonacci" },
  { tool: "PATH", icon: Waves, title: "Path" },
  { tool: "BRUSH", icon: Brush, title: "Brush" },
];
  const [search, setSearch] = React.useState("");
  const [sortKey, setSortKey] = React.useState<SortKey>("LIQ_DESC");
  const [onlyReady, setOnlyReady] = React.useState(false);

  const [panelH, setPanelH] = React.useState<number>(780);
  const [chartHeight, setChartHeight] = React.useState<number>(600);

  const candlesCache = React.useRef<Map<string, Candle[]>>(new Map());
  const [loading, setLoading] = React.useState(false);
  const [lastSync, setLastSync] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [closedTrades, setClosedTrades] = React.useState<ClosedTrade[]>(() =>
  typeof window !== "undefined" ? loadClosedTradesFromStorage() : []
);
  
  const closedTradesLoadedRef = React.useRef(false);

  const scannerPrevRef = React.useRef<Map<string, boolean>>(new Map());
  const setupPrevRef = React.useRef<Map<string, boolean>>(new Map());
  const tradesMemoryRef = React.useRef<Map<string, Partial<Row>>>(new Map());
  const flashMapRef = React.useRef<Map<string, number>>(new Map());

  const [flashKey, setFlashKey] = React.useState(0);
  const rowRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  const instruments = React.useMemo(() => [...CRYPTO_SYMBOLS, ...FOREX_SYMBOLS], []);

  const [rows, setRows] = React.useState<Row[]>(() => {
  try {
    const raw = localStorage.getItem(ACTIVE_TRADES_KEY);
    const saved = raw
  ? new Map<string, Partial<Row>>(JSON.parse(raw) as Array<[string, Partial<Row>]>)
  : new Map<string, Partial<Row>>();
const DRAW_TOOL_BUTTONS = [
  { tool: "SELECT", icon: MousePointer2, title: "Select" },
  { tool: "HLINE", icon: Minus, title: "Horizontal line" },
  { tool: "VLINE", icon: MoveVertical, title: "Vertical line" },
  { tool: "TREND", icon: TrendingUp, title: "Trend line" },
  { tool: "RAY", icon: ArrowUpRight, title: "Ray" },
  { tool: "HORIZONTAL_RAY", icon: MoveHorizontal, title: "Horizontal ray" },
  { tool: "RECT", icon: RectangleHorizontal, title: "Rectangle" },
  { tool: "FIBO", icon: ChartNoAxesCombined, title: "Fibonacci" },
  { tool: "PATH", icon: Waves, title: "Path" },
  { tool: "BRUSH", icon: Brush, title: "Brush" },
] as const;
    return instruments.map((s) => {
      const savedRow = saved.get(s);

      return {
        symbol: s,
        liquidity: 50,
        tf: "M5",
        status: "CLOSE" as Status,
        signal: "NONE" as Signal,

        tradeActive: savedRow?.tradeActive ?? false,
        side: savedRow?.side,
        levels: savedRow?.levels,
        hammerTime: savedRow?.hammerTime,
        signalCandleTime: savedRow?.signalCandleTime,
        signalPattern: (savedRow?.signalPattern ?? "NONE") as CandlePattern,
confirmationCount: (savedRow?.confirmationCount ?? 0) as 0 | 1 | 2 | 3,
higherTfSignal: (savedRow?.higherTfSignal ?? "NONE") as Signal,
      };
    });
  } catch {
    return instruments.map((s) => ({
      symbol: s,
      liquidity: 50,
      tf: "M5",
      status: "CLOSE" as Status,
      signal: "NONE" as Signal,
      tradeActive: false,
      side: undefined,
      levels: undefined,
      hammerTime: undefined,
      signalCandleTime: undefined,
      signalPattern: "NONE" as CandlePattern,
      confirmationCount: 0,
      confirmationSide: null,
      higherTfSignal: "NONE",
    }));
  }
});
React.useEffect(() => {
  try {
    const raw = localStorage.getItem(CLOSED_TRADES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      setClosedTrades(Array.isArray(parsed) ? parsed : []);
    }
  } catch {
    setClosedTrades([]);
  }
}, []);



  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(ACTIVE_TRADES_KEY);
      if (raw) {
        const arr = JSON.parse(raw) as Array<[string, Partial<Row>]>;
        tradesMemoryRef.current = new Map(arr);
      }

      const closedRaw = localStorage.getItem(CLOSED_TRADES_KEY);
      if (closedRaw) {
        const parsed = JSON.parse(closedRaw);
        setClosedTrades(Array.isArray(parsed) ? parsed : []);
      }
    } catch {
      setClosedTrades([]);
    } finally {
      closedTradesLoadedRef.current = true;
    }
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem(
        ACTIVE_TRADES_KEY,
        JSON.stringify(Array.from(tradesMemoryRef.current.entries()))
      );
    } catch {}
  }, [rows]);

  React.useEffect(() => {
    if (!closedTradesLoadedRef.current) return;

    try {
      localStorage.setItem(CLOSED_TRADES_KEY, JSON.stringify(closedTrades));
    } catch {}
  }, [closedTrades]);

  React.useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && document.fullscreenElement) {
        void document.exitFullscreen?.();
      }
    };

    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const toggleFullscreen = React.useCallback(async () => {
    try {
      if (!document.fullscreenElement) await rightPanelRef.current?.requestFullscreen?.();
      else await document.exitFullscreen?.();
    } catch {}
  }, []);

  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
  const t = e.target as Node;

  // ❌ EMA NIE ZAMYKA SIĘ NA KLIK
  if (false) {}

  // ❌ BB NIE ZAMYKA SIĘ NA KLIK
  if (false) {}

  // ✅ tylko TOOLS się zamyka
  if (toolsPanelOpen && toolsPanelRef.current && !toolsPanelRef.current.contains(t)) {
    setToolsPanelOpen(false);
  }
};

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setEmaPanelOpen(false);
        setBbPanelOpen(false);
        setToolsPanelOpen(false);
      }
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [emaPanelOpen, bbPanelOpen, toolsPanelOpen]);

  React.useEffect(() => {
    setRows(
      instruments.map((s) => {
        const saved = tradesMemoryRef.current.get(tradeKey(s, tf));

        return {
          symbol: s,
          liquidity: 50,
          tf,
          status: "CLOSE" as Status,
          signal: "NONE" as Signal,
          tradeActive: saved?.tradeActive ?? false,
          side: saved?.side,
          levels: saved?.levels,
          hammerTime: saved?.hammerTime,
          signalCandleTime: saved?.signalCandleTime,
          signalPattern: (saved?.signalPattern ?? "NONE") as CandlePattern,
          confirmationCount: 0,
          confirmationSide: null,
          higherTfSignal: "NONE",
        };
      })
    );
  }, [instruments, tf]);

  React.useEffect(() => {
    setSelectedSymbol((prev) =>
      prev && instruments.includes(prev) ? prev : instruments[0] ?? "BTCUSDT"
    );
  }, [instruments]);

  React.useEffect(() => {
    const HEADER_OFFSET = 130;
    const BOTTOM_PAD = 24;

    const compute = () => {
      const h = Math.max(620, window.innerHeight - HEADER_OFFSET - BOTTOM_PAD);

      // Lewa lista może dalej dopasowywać się do wysokości ekranu.
      setPanelH(h);

      // Wykres rośnie tylko w kontrolowanym zakresie.
      // Closed Trades ma osobną stałą wysokość i zawsze zostaje POD wykresem.
      setChartHeight(
        Math.max(560, Math.min(780, window.innerHeight - 360))
      );
    };

    compute();
    window.addEventListener("resize", compute);

    return () => window.removeEventListener("resize", compute);
  }, []);

  const emaConfigs = React.useMemo<EmaConfig[]>(
    () =>
      emaState
        .filter((cfg) => cfg.enabled)
        .map((cfg) => ({
          period: clampEmaPeriod(cfg.period),
          color: cfg.color,
          width: cfg.width,
        })),
    [emaState]
  );

  const bbConfig = React.useMemo<BbConfig>(
  () => ({
    enabled: bbState.enabled,
    length: bbState.length,
    maType: bbState.maType,
    source: bbState.source,
    stdDev: bbState.stdDev,
    offset: bbState.offset,
    colors: bbState.colors,
    widths: bbState.widths,
    background: bbState.background ?? DEFAULT_BB.background,
  }),
  [bbState]
);

  const filteredRows = React.useMemo(() => {
    const q = search.trim().toUpperCase();
    const base = q ? rows.filter((r) => r.symbol.toUpperCase().includes(q)) : rows;
    const sorted = [...base].sort((a, b) =>
      sortKey === "LIQ_DESC" ? b.liquidity - a.liquidity : a.liquidity - b.liquidity
    );

    return onlyReady ? sorted.filter((r) => r.status === "READY") : sorted;
  }, [rows, search, sortKey, onlyReady]);

  const beep = React.useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();

      o.type = "sine";
      o.frequency.value = 880;
      g.gain.value = 0.0001;

      o.connect(g);
      g.connect(ctx.destination);
      o.start();

      const now = ctx.currentTime;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      o.stop(now + 0.2);

      setTimeout(() => {
        try {
          ctx.close();
        } catch {}
      }, 250);
    } catch {}
  }, []);

  const triggerFlash = React.useCallback((symbol: string) => {
    const prevTimeout = flashMapRef.current.get(symbol);
    if (prevTimeout) window.clearTimeout(prevTimeout);

    const id = window.setTimeout(() => {
      flashMapRef.current.delete(symbol);
      setFlashKey((k) => k + 1);
    }, 900);

    flashMapRef.current.set(symbol, id);
    setFlashKey((k) => k + 1);
  }, []);

  const scrollToRow = React.useCallback((symbol: string) => {
    const el = rowRefs.current[symbol];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  const sendTelegram = React.useCallback(
    async (payload: {
      instrument: string;
      side: Side;
      tf: string;
      liquidity: number;
      rr: number;
      entry: number;
      sl: number;
      tp1?: number;
      tp2?: number;
      tp3?: number;
      timeISO: string;
    }) => {
      if (!TELEGRAM_ON) return;

      try {
        await fetch("/api/telegram/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {}
    },
    []
  );

  React.useEffect(() => {
    let alive = true;

    async function refresh() {
      try {
        setError(null);
        setLoading(true);

        const results = await Promise.allSettled(
          instruments.map(async (symbol) => {
            const { candles, volume } = await fetchAutoCandles(symbol, tf, source);
            return { symbol, candles, volume };
          })
        );

        const metrics: Array<{
          symbol: string;
          atrPct: number;
          volume: number;
          candles: Candle[];
        }> = [];

        for (const res of results) {
          if (res.status !== "fulfilled") continue;

          const { symbol, candles, volume } = res.value;
          candlesCache.current.set(symbol, candles);

          if (!candles || candles.length < 30) {
            metrics.push({ symbol, atrPct: 0, volume: 0, candles: candles ?? [] });
            continue;
          }

          const atr = calcATR14(candles);
          const closed = lastClosedCandle(candles);
          const lastClose = closed?.close ?? 0;
          const atrPct = lastClose > 0 ? atr / lastClose : 0;

          metrics.push({ symbol, atrPct, volume, candles });
        }

        const liqs = computeLiquidityScores(
          metrics.map((m) => ({ atrPct: m.atrPct, volume: m.volume }))
        );

        const patchMap = new Map<string, Partial<Row>>();

        metrics.forEach((m, idx) => {
          const cs = m.candles ?? [];
          const supertrendSignal = getSupertrendSignal(
            cs,
            supertrendSettings.atrPeriod,
            supertrendSettings.factor,
            supertrendSettings.waitForClose
          );


const emaWmaSignal = getEmaWmaSignal(cs);

const signal: Signal = supertrendEnabled
  ? supertrendSignal !== "NONE" && supertrendSignal === emaWmaSignal
    ? supertrendSignal
    : "NONE"
  : emaWmaSignal;
          const liquidity = liqs[idx] ?? 0;
          const status: Status =
            liquidity >= LIQ_THRESHOLD_HIGH || liquidity <= LIQ_THRESHOLD_LOW ? "READY" : "CLOSE";

          patchMap.set(m.symbol, { liquidity, tf, signal, status });
        });

        if (!alive) return;

        setRows((prev) => {
  const closedNow: ClosedTrade[] = [];

  const nextRows = prev.map((r) => {
    const p = patchMap.get(r.symbol);

    const nextLiquidity = p?.liquidity ?? r.liquidity;
    const isOnNow =
      nextLiquidity >= LIQ_THRESHOLD_HIGH || nextLiquidity <= LIQ_THRESHOLD_LOW;
    const wasOn = scannerPrevRef.current.get(r.symbol) ?? false;

    scannerPrevRef.current.set(r.symbol, isOnNow);

    if (!wasOn && isOnNow) {
      beep();
      triggerFlash(r.symbol);
      scrollToRow(r.symbol);
    }

    let levels = r.levels;
    let tradeActive = !!r.tradeActive;
    let hammerTime = r.hammerTime;
    let sideOut: Row["side"] = r.side;
    let signalCandleTime = r.signalCandleTime;
    let signalPattern = r.signalPattern ?? "NONE";
    let tp1Hit = r.tp1Hit ?? false;
    const cs = candlesCache.current.get(r.symbol) ?? [];
    const tick = getTickSize(r.symbol);

    const best = getBestConfirmation({
      liquidity: nextLiquidity,
      candles: cs,
    });

    const htfOk =
  !r.higherTfSignal ||
  r.higherTfSignal === "NONE" ||
  (best.side === "BUY" && r.higherTfSignal === "UP") ||
  (best.side === "SELL" && r.higherTfSignal === "DOWN");

const sessionOk = isTradingSession(
  r.symbol,
  new Date()
);

const setupReadyNow =
  best.count === 3 &&
  !!best.side;
    const setupReadyPrev = setupPrevRef.current.get(r.symbol) ?? false;
    setupPrevRef.current.set(r.symbol, setupReadyNow);

    if (!tradeActive && setupReadyNow && best.side && cs.length >= 5) {
      const signalTime = cs[cs.length - 2]?.time;
      const patternTime = cs[cs.length - 3]?.time;

      if (signalTime && patternTime) {
        const lv = buildLevelsLiquidityOnly({
          
          candles: cs,
          tickSize: tick,
          zoneTicks: ZONE_TICKS,
          side: best.side,
          signalTime,
        });

       if (lv) {
  const signalCandle = cs.find((c) => Number(c.time) === Number(signalTime));
  const buffer = tick * 2;

  const newSL =
    signalCandle && best.side === "BUY"
      ? signalCandle.low - buffer
      : signalCandle && best.side === "SELL"
      ? signalCandle.high + buffer
      : lv.sl;

  
    
const entryPrice = lv.entry;

const atr = calcATR14(cs);

let slPrice = lv.sl;

let tp1Price = lv.tps?.[0] ?? entryPrice;
let tp2Price = lv.tps?.[1] ?? entryPrice;
let tp3Price = lv.tps?.[2] ?? entryPrice;

if (atr && Number.isFinite(atr)) {
  if (best.side === "BUY") {
    const signalCandle = cs.find(
  (c) => Number(c.time) === Number(signalTime)
);

if (best.side === "BUY") {
  slPrice = signalCandle
    ? signalCandle.low - buffer
    : entryPrice - atr;

  tp1Price = entryPrice + atr * TP1_ATR_MULT;
  tp2Price = entryPrice + atr * TP2_ATR_MULT;
  tp3Price = entryPrice + atr * TP3_ATR_MULT;
}

    tp1Price = entryPrice + atr * TP1_ATR_MULT;
    tp2Price = entryPrice + atr * TP2_ATR_MULT;
    tp3Price = entryPrice + atr * TP3_ATR_MULT;
  }

  if (best.side === "SELL") {
    if (best.side === "SELL") {
  slPrice = signalCandle
    ? signalCandle.high + buffer
    : entryPrice + atr;

  tp1Price = entryPrice - atr * TP1_ATR_MULT;
  tp2Price = entryPrice - atr * TP2_ATR_MULT;
  tp3Price = entryPrice - atr * TP3_ATR_MULT;
}

    tp1Price = entryPrice - atr * TP1_ATR_MULT;
    tp2Price = entryPrice - atr * TP2_ATR_MULT;
    tp3Price = entryPrice - atr * TP3_ATR_MULT;
  }
}

levels = {
  ...lv,
  side: best.side,

  entry: round(entryPrice, 6),

  sl: round(slPrice, 6),

  tps: [
    round(tp1Price, 6),
    round(tp2Price, 6),
    round(tp3Price, 6),
  ],

  rr: 2,

  zones: (() => {
    const entryPad = Math.max(
      tick * 2,
      Math.abs(entryPrice - slPrice) * 0.04
    );

    return [
      {
        label: "ENTRY" as const,
        from: round(entryPrice - entryPad, 6),
        to: round(entryPrice + entryPad, 6),
      },
      {
        label: "TP1" as const,
        from: round(tp1Price - entryPad, 6),
        to: round(tp1Price + entryPad, 6),
      },
      {
        label: "TP2" as const,
        from: round(tp2Price - entryPad, 6),
        to: round(tp2Price + entryPad, 6),
      },
      {
        label: "TP3" as const,
        from: round(tp3Price - entryPad, 6),
        to: round(tp3Price + entryPad, 6),
      },
      {
        label: "SL" as const,
        from: round(slPrice - entryPad, 6),
        to: round(slPrice + entryPad, 6),
      },
    ];
  })(),
};

          tradeActive = true;
sideOut = best.side;
hammerTime = patternTime;
signalCandleTime = signalTime;
signalPattern = best.pattern;
tp1Hit = false;

          if (!setupReadyPrev) {
            const now = new Date();

            void sendTelegram({
              instrument: r.symbol,
              side: best.side,
              tf,
              liquidity: Math.round(nextLiquidity),
              rr: Number((levels.rr ?? 0).toFixed(2)),
              entry: Number(levels.entry),
              sl: Number(levels.sl),
              tp1: Number(levels.tps?.[0] ?? 0) || undefined,
              tp2: Number(levels.tps?.[1] ?? 0) || undefined,
              tp3: Number(levels.tps?.[2] ?? 0) || undefined,
              timeISO: now.toISOString(),
            });
          }
        }
      }
    }

    if (
      tradeActive &&
      levels &&
      signalCandleTime &&
      (sideOut === "BUY" || sideOut === "SELL")
    ) {
      const activeLevels = levels;
      const activeSide = sideOut;

      const closedResult = detectClosedTradeStatus({
  candles: cs,
  side: activeSide,
  levels: activeLevels,
  signalTime: signalCandleTime,
  tp1Hit,
});

tp1Hit = closedResult.tp1Hit;
const closedStatus = closedResult.status;

      if (closedStatus) {
  const tradeId = `${r.symbol}-${tf}-${activeSide}-${Number(signalCandleTime)}`;

  closedNow.push({
    id: tradeId,
    date: new Date(Number(signalCandleTime) * 1000).toISOString(),
    instrument: r.symbol,
    direction: activeSide,
    entry: Number(activeLevels.entry),
    tp1: activeLevels.tps?.[0] ? Number(activeLevels.tps[0]) : undefined,
    tp2: activeLevels.tps?.[1] ? Number(activeLevels.tps[1]) : undefined,
    sl: Number(activeLevels.sl),
    status: closedStatus,
  });

  tradeActive = false;
  sideOut = undefined;
  levels = undefined;
  hammerTime = undefined;
  signalCandleTime = undefined;
  signalPattern = "NONE";
}
    }

    if (tradeActive && levels && (sideOut === "BUY" || sideOut === "SELL")) {
      tradesMemoryRef.current.set(tradeKey(r.symbol, tf), {
        tradeActive,
        side: sideOut,
        levels,
        hammerTime,
        signalCandleTime,
        signalPattern,
        tp1Hit,
      });
    } else {
      tradesMemoryRef.current.delete(tradeKey(r.symbol, tf));
    }

    return {
      ...r,
      ...p,
      tf,
      liquidity: nextLiquidity,
      tradeActive,
      side: sideOut,
      levels,
      hammerTime,
      signalCandleTime,
      signalPattern,
      tp1Hit,
      confirmationCount: best.count,
      confirmationSide: best.side,
      higherTfSignal: r.higherTfSignal ?? "NONE",
    };
  });

if (closedNow.length) {
  setClosedTrades((prevClosed) => {
    const stored = loadClosedTradesFromStorage();

    const existing = new Set([
      ...stored.map((t) => t.id),
      ...prevClosed.map((t) => t.id),
    ]);

    const unique = closedNow.filter((t) => !existing.has(t.id));
    const updated = [...unique, ...stored];

    saveClosedTradesToStorage(updated);

    return updated;
  });
}

  return nextRows;
});
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Błąd pobierania danych");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    if (scannerEnabled) {
      void refresh();
    }

    const id = window.setInterval(() => {
      if (scannerEnabled) {
        void refresh();
      }
    }, REFRESH_MS);

    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [source, tf, instruments, scannerEnabled, beep, triggerFlash, scrollToRow, sendTelegram]);


  React.useEffect(() => {
    let alive = true;

    async function refreshPoc() {
      setPocScanner((prev) => ({
        ...prev,
        symbol: selectedSymbol,
        loading: true,
        error: null,
      }));

      try {
        const results = await Promise.allSettled(
          POC_TIMEFRAMES.map(async (pocTf) => {
            const candles = await fetchPocCandles(selectedSymbol, pocTf);
            const poc = calcVolumePoc(candles);

            if (poc == null || !candles.length) {
              throw new Error(`${pocTf}: brak danych POC`);
            }

            const last = lastClosedCandle(candles)?.close ?? poc;

            return {
              tf: pocTf,
              poc,
              last,
              relation: getPocRelation(candles, poc),
              trend: getPocTrend(candles),
            } satisfies PocCell;
          })
        );

        if (!alive) return;

        const cells = results
          .filter(
            (result): result is PromiseFulfilledResult<PocCell> =>
              result.status === "fulfilled"
          )
          .map((result) => result.value);

        const rejected = results.filter(
          (result) => result.status === "rejected"
        ).length;

        setPocScanner({
          symbol: selectedSymbol,
          cells,
          loading: false,
          error:
            rejected === POC_TIMEFRAMES.length
              ? "Brak danych POC dla instrumentu"
              : rejected > 0
                ? `${rejected} TF bez danych`
                : null,
        });
      } catch (error) {
        if (!alive) return;

        setPocScanner({
          symbol: selectedSymbol,
          cells: [],
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "POC scanner error",
        });
      }
    }

    void refreshPoc();

    const id = window.setInterval(() => {
      void refreshPoc();
    }, REFRESH_MS);

    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [selectedSymbol, source]);

  const selected = React.useMemo(
    () => rows.find((r) => r.symbol === selectedSymbol) ?? rows[0],
    [rows, selectedSymbol]
  );

  if (!selected) return null;

  const selectedCandles = React.useMemo(
    () => candlesCache.current.get(selected.symbol) ?? [],
    [selected.symbol, lastSync]
  );

  // RENKO ma własne źródło danych niezależne od głównego interwału wykresu.
  // Domyślnie: M1. CURRENT = aktualny TF. AUTO = M1.
  React.useEffect(() => {
    let alive = true;

    async function refreshRenkoCandles() {
      if (!renko) {
        if (alive) setRenkoCandles([]);
        return;
      }

      const renkoTf: Timeframe =
        renkoSource === "M5"
          ? "M5"
          : renkoSource === "CURRENT"
            ? tf
            : "M1";

      // Jeżeli Renko ma korzystać dokładnie z aktualnego TF,
      // nie robimy drugiego requestu.
      if (renkoTf === tf) {
        if (alive) setRenkoCandles(selectedCandles);
        return;
      }

      try {
        setRenkoLoading(true);
        const result = await fetchAutoCandles(selected.symbol, renkoTf, source);
        if (!alive) return;
        setRenkoCandles(result.candles ?? []);
      } catch (error) {
        console.error("RENKO SOURCE ERROR:", error);
        if (alive) setRenkoCandles([]);
      } finally {
        if (alive) setRenkoLoading(false);
      }
    }

    void refreshRenkoCandles();

    // Odświeżenie razem ze skanerem.
    const id = window.setInterval(() => {
      void refreshRenkoCandles();
    }, REFRESH_MS);

    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [
    renko,
    renkoSource,
    tf,
    selected.symbol,
    source,
    lastSync,
  ]);


  const highlightTime: UTCTimestamp | null = selected.tradeActive ? selected.hammerTime ?? null : null;
  const hasTrade = !!selected.tradeActive && !!selected.levels;

  

  return (
    <main className="min-h-screen w-full space-y-4 bg-[radial-gradient(circle_at_top,#0d3d72_0%,#082b52_34%,#061a33_70%,#041325_100%)] px-4 py-4 text-sky-50">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-[0_0_16px_rgba(56,189,248,.20)] md:text-3xl">Skaner rynku</h1>
          <p className="mt-2 text-sky-100/70">
            Live: <span className="font-semibold">{source}</span> • 3 potwierdzenia: Liquidity + Price Action + 2 Confirmation Candles
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Pill className="border-sky-300/20 bg-[#0b315c]/80 text-sky-100 shadow-[inset_0_1px_0_rgba(255,255,255,.05)]">Market Scanner</Pill>

          <button
            onClick={() => setScannerEnabled((v) => !v)}
            className={cn(
              "rounded-2xl border px-3 py-2 text-sm font-semibold transition",
              scannerEnabled
                ? "border-emerald-300/30 bg-emerald-500/20 text-emerald-100 shadow-[0_0_16px_rgba(16,185,129,.16)]"
                : "border-red-300/30 bg-red-500/20 text-red-100"
            )}
            type="button"
          >
            {scannerEnabled ? "SCANNER ON" : "SCANNER OFF"}
          </button>
        </div>
      </div>

      <div className="flex w-full gap-4">
        <Card className="w-[420px] shrink-0 overflow-hidden border-sky-300/20 bg-[linear-gradient(180deg,rgba(20,74,128,.96)_0%,rgba(12,54,101,.96)_52%,rgba(8,40,78,.98)_100%)] shadow-[0_18px_45px_rgba(0,10,35,.34),0_0_28px_rgba(14,165,233,.10),inset_0_1px_0_rgba(255,255,255,.06)]" style={{ height: panelH }}>
          <CardContent className="flex h-full flex-col gap-3 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold text-white">Lista instrumentów</p>
                <p className="text-sm text-sky-100/60">Search • Sort Liquidity • Filter READY</p>
              </div>

              <div className="text-right text-xs text-sky-100/55">
                {loading ? "Sync…" : lastSync ? `Sync: ${formatSyncUTC(lastSync)}` : "—"}
              </div>
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Szukaj… (np. EURUSD / BTCUSDT)"
              className="w-full rounded-2xl border border-sky-300/20 bg-[#061c37]/80 px-4 py-2.5 text-sm text-white shadow-[inset_0_1px_8px_rgba(0,0,0,.16)] outline-none placeholder:text-sky-100/35 focus:border-cyan-300/45 focus:ring-2 focus:ring-cyan-400/10"
            />

            <div className="flex flex-wrap gap-2">
              <button
                className={cn(
                  "rounded-2xl border px-3 py-2 text-sm font-semibold transition",
                  sortKey === "LIQ_DESC"
                    ? "border-cyan-300/45 bg-[linear-gradient(135deg,#0ea5e9_0%,#2563eb_100%)] text-white shadow-[0_0_18px_rgba(14,165,233,.22)]"
                    : "border-sky-300/15 bg-[#0b315c]/75 text-sky-100/75 hover:border-sky-300/30 hover:bg-[#12477f] hover:text-white"
                )}
                onClick={() => setSortKey("LIQ_DESC")}
                type="button"
              >
                Liquidity ↓
              </button>

              <button
                className={cn(
                  "rounded-2xl border px-3 py-2 text-sm font-semibold transition",
                  sortKey === "LIQ_ASC"
                    ? "border-cyan-300/45 bg-[linear-gradient(135deg,#0ea5e9_0%,#2563eb_100%)] text-white shadow-[0_0_18px_rgba(14,165,233,.22)]"
                    : "border-sky-300/15 bg-[#0b315c]/75 text-sky-100/75 hover:border-sky-300/30 hover:bg-[#12477f] hover:text-white"
                )}
                onClick={() => setSortKey("LIQ_ASC")}
                type="button"
              >
                Liquidity ↑
              </button>

              <button
                className={cn(
                  "rounded-2xl border px-3 py-2 text-sm font-semibold transition",
                  onlyReady
                    ? "border-emerald-300/30 bg-emerald-500/20 text-emerald-100 shadow-[0_0_16px_rgba(16,185,129,.16)]"
                    : "border-sky-300/15 bg-[#0b315c]/75 text-sky-100/75 hover:border-sky-300/30 hover:bg-[#12477f] hover:text-white"
                )}
                onClick={() => setOnlyReady((v) => !v)}
                type="button"
              >
                Tylko READY
              </button>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            )}

            <div className="min-h-0 flex-1 space-y-2 overflow-auto pr-1">
              {filteredRows.map((r) => {
                const active = r.symbol === selectedSymbol;
                const scannerOn = r.liquidity >= LIQ_THRESHOLD_HIGH || r.liquidity <= LIQ_THRESHOLD_LOW;
                const isFlashing = flashMapRef.current.has(r.symbol);

                return (
                  <div
                    key={r.symbol}
                    ref={(el) => {
                      rowRefs.current[r.symbol] = el;
                    }}
                    onClick={() => setSelectedSymbol(r.symbol)}
                    className={cn(
                      "relative cursor-pointer overflow-hidden rounded-2xl border p-4 transition-all duration-200",
                      active ? "border-cyan-300/45 bg-[linear-gradient(135deg,rgba(13,107,184,.88),rgba(10,67,125,.88))] shadow-[0_0_24px_rgba(34,211,238,.16),inset_0_1px_0_rgba(255,255,255,.06)]" : "border-sky-300/14 bg-[linear-gradient(180deg,rgba(11,49,92,.78),rgba(7,37,72,.84))] hover:border-sky-300/28 hover:bg-[#10477e]",
                      isFlashing ? "ring-2 ring-emerald-400/60 shadow-[0_0_24px_rgba(52,211,153,0.25)]" : ""
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{r.symbol}</span>

                      <div className="flex items-center gap-2">
                        <ConfirmationBadge count={r.confirmationCount ?? 0} side={r.confirmationSide ?? null} />

                        <span
                          className={cn(
                            "rounded-full border px-2 py-1 text-[11px] font-extrabold",
                            scannerOn
                              ? "border-emerald-300/30 bg-emerald-500/20 text-emerald-100 shadow-[0_0_16px_rgba(16,185,129,.16)]"
                              : "border-sky-300/15 bg-[#082749]/75 text-sky-100/40"
                          )}
                        >
                          {scannerOn ? "SCANNER ON" : "SCANNER OFF"}
                        </span>

                        <SignalDot s={r.signal} />
                      </div>
                    </div>

                    <div className="mt-2">
                      <LiquidityBar value={r.liquidity} />
                    </div>

                    <div className="mt-2 flex justify-between text-sm text-sky-100/78">
                      <span>TF: {tf}</span>
                      <span>{r.signal === "UP" ? "Trend UP" : r.signal === "DOWN" ? "Trend DOWN" : "Brak"}</span>
                    </div>

                    {r.tradeActive && r.side ? (
                      <div className="mt-2 text-xs text-amber-200/90">
                        ✅ <span className="font-extrabold">FX TRADE • {r.side}</span> • RR {r.levels?.rr?.toFixed?.(2) ?? "—"}
                        {r.signalPattern && r.signalPattern !== "NONE" ? <span className="ml-2 text-yellow-200">• {r.signalPattern}</span> : null}
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-sky-100/30">—</div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div ref={rightPanelRef} className="min-w-0 flex-1">
          <Card className="overflow-visible border-sky-300/18 bg-[linear-gradient(180deg,rgba(17,66,117,.94)_0%,rgba(10,48,91,.97)_45%,rgba(7,35,69,.98)_100%)] shadow-[0_18px_50px_rgba(0,10,35,.34),0_0_30px_rgba(14,165,233,.08),inset_0_1px_0_rgba(255,255,255,.05)]">
            <CardContent className="flex flex-col gap-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-extrabold tracking-tight text-white">{selected.symbol}</h2>

                  <div className="flex flex-wrap items-center gap-2">
                    {TIMEFRAMES.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTf(t)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-sm font-semibold transition",
                          tf === t
                            ? "border-cyan-300/45 bg-[linear-gradient(135deg,#0ea5e9_0%,#2563eb_100%)] text-white shadow-[0_0_18px_rgba(14,165,233,.22)]"
                            : "border-sky-300/15 bg-[#0b315c]/75 text-sky-100/75 hover:border-sky-300/30 hover:bg-[#12477f] hover:text-white"
                        )}
                        type="button"
                      >
                        {t}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setToolsPanelOpen((v) => !v)}
                      className={cn(
                        "ml-1 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold transition",
                        toolsPanelOpen
                          ? "border-cyan-300/45 bg-[linear-gradient(135deg,#0ea5e9_0%,#2563eb_100%)] text-white shadow-[0_0_18px_rgba(14,165,233,.22)]"
                          : "border-sky-300/15 bg-[#0b315c]/75 text-sky-100/75 hover:border-sky-300/30 hover:bg-[#12477f] hover:text-white"
                      )}
                    >
                      TOOLS
                    </button>

                    <button
                      type="button"
              onClick={() => {
  setEmaState((prev) => {
    const anyEnabled = prev.some((cfg) => cfg.enabled);

    return prev.map((cfg) => ({
      ...cfg,
      enabled: !anyEnabled,
    }));
  });
}}
                      className={cn(
                        "ml-1 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold transition",
                        emaState.some((cfg) => cfg.enabled)
                          ? "border-sky-400/30 bg-sky-500/15 text-sky-100"
                          : "border-sky-300/15 bg-[#0b315c]/75 text-sky-100/75 hover:border-sky-300/30 hover:bg-[#12477f] hover:text-white"
                      )}
                    >
                      EMA
                    </button>
                    <button
  type="button"
  onClick={(e) => {
  e.stopPropagation();
  setEmaPanelOpen((v) => !v);
}}
  className="rounded-full border border-sky-300/15 bg-[#0b315c]/75 px-2 py-2 text-sky-100/70"
>
  <GearIcon />
  {emaPanelOpen ? (
  <div
 className="absolute top-07 z-50 w-[360px] rounded-3xl border border-sky-300/20 bg-[linear-gradient(180deg,#0f3f72,#082749)] p-4 shadow-[0_24px_60px_rgba(0,0,0,.45),0_0_24px_rgba(14,165,233,.10)]"
  onClick={(e) => e.stopPropagation()}
  onMouseDown={(e) => e.stopPropagation()}
>
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-semibold text-slate-100">EMA SETTINGS</div>
        <div className="mt-0.5 text-[10px] text-sky-100/40">
          Wybierz dowolny okres EMA od 1 do 500
        </div>
      </div>

      <button
        type="button"
        onClick={() => setEmaPanelOpen(false)}
        className="rounded-full border border-sky-300/15 bg-[#0b315c]/75 px-2 py-1 text-xs text-sky-100/75 hover:border-sky-300/30 hover:bg-[#12477f] hover:text-white"
      >
        ✕
      </button>
    </div>

    <div className="mt-3 space-y-2">
      {emaState.map((cfg, index) => (
        <div
          key={cfg.id}
          className="rounded-2xl border border-sky-300/15 bg-[#061c37]/75 px-3 py-3"
        >
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={cfg.enabled}
              onChange={() =>
                setEmaState((prev) =>
                  prev.map((item) =>
                    item.id === cfg.id
                      ? { ...item, enabled: !item.enabled }
                      : item
                  )
                )
              }
              className="h-4 w-4 shrink-0 accent-sky-400"
            />

            <span className="w-9 shrink-0 text-xs font-black text-sky-100/65">
              EMA
            </span>

            <input
              type="number"
              min={1}
              max={500}
              step={1}
              value={cfg.period}
              onChange={(e) => {
                const value = Number(e.target.value);

                setEmaState((prev) =>
                  prev.map((item) =>
                    item.id === cfg.id
                      ? {
                          ...item,
                          period: Number.isFinite(value) ? value : 1,
                        }
                      : item
                  )
                );
              }}
              onBlur={() =>
                setEmaState((prev) =>
                  prev.map((item) =>
                    item.id === cfg.id
                      ? {
                          ...item,
                          period: clampEmaPeriod(item.period),
                        }
                      : item
                  )
                )
              }
              className="h-9 w-[78px] rounded-xl border border-sky-300/20 bg-[#04172e] px-2 text-center text-sm font-bold text-white outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/10"
            />

            <input
              type="color"
              value={cfg.color}
              onChange={(e) => {
                const color = e.target.value;

                setEmaState((prev) =>
                  prev.map((item) =>
                    item.id === cfg.id
                      ? { ...item, color }
                      : item
                  )
                );
              }}
              className="h-9 w-10 cursor-pointer rounded-lg border border-sky-300/20 bg-transparent"
              title="Kolor EMA"
            />

            <select
              value={cfg.width}
              onChange={(e) => {
                const width = Number(e.target.value) as 1 | 2 | 3 | 4;

                setEmaState((prev) =>
                  prev.map((item) =>
                    item.id === cfg.id
                      ? { ...item, width }
                      : item
                  )
                );
              }}
              className="h-9 rounded-xl border border-sky-300/20 bg-[#04172e] px-2 text-xs font-bold text-sky-100 outline-none"
            >
              <option value={1}>1px</option>
              <option value={2}>2px</option>
              <option value={3}>3px</option>
              <option value={4}>4px</option>
            </select>
          </div>

          <div className="mt-2 flex items-center gap-2 pl-7">
            <div
              className="h-1 flex-1 rounded-full"
              style={{
                background: cfg.enabled
                  ? cfg.color
                  : "rgba(148,163,184,0.22)",
              }}
            />

            <span className="min-w-[54px] text-right text-[10px] font-bold text-sky-100/45">
              EMA {clampEmaPeriod(cfg.period)}
            </span>

            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[9px] font-black",
                cfg.enabled
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-white/5 text-sky-100/30"
              )}
            >
              {cfg.enabled ? "ON" : "OFF"}
            </span>
          </div>

          <div className="mt-1 pl-7 text-[9px] text-sky-100/25">
            Slot {index + 1} • zakres 1–500
          </div>
        </div>
      ))}
    </div>
  </div>
) : null}
</button>
<div className="relative flex items-center gap-1" ref={bbPanelWrapRef}>
  <button
    type="button"
    onClick={() => setBbState((p) => ({ ...p, enabled: !p.enabled }))}
    className={cn(
      "ml-1 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold transition",
      bbState.enabled
        ? "border-fuchsia-400/30 bg-fuchsia-500/15 text-fuchsia-100"
        : "border-white/10 bg-white/5 text-zinc-200/70 hover:bg-white/10 hover:text-white"
    )}
  >
    BB
  </button>

  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      setBbPanelOpen((v) => !v);
    }}
    className="rounded-full border border-sky-300/15 bg-[#0b315c]/75 px-2 py-2 text-sky-100/70 hover:border-sky-300/30 hover:bg-[#12477f]"
  >
    <GearIcon />
  </button>

  {bbPanelOpen ? (
  <div
    className="absolute right-0 top-full mt-3 z-[99999] w-[420px] rounded-3xl border border-sky-300/20 bg-[linear-gradient(180deg,#10477f_0%,#0b315c_48%,#082749_100%)] p-5 shadow-[0_24px_60px_rgba(0,0,0,.45),0_0_28px_rgba(14,165,233,.12)]"
    onClick={(e) => e.stopPropagation()}
    onMouseDown={(e) => e.stopPropagation()}
  >
    <div className="flex items-center justify-between">
      <div className="text-2xl font-bold text-white">Bollinger Bands</div>

      <button
        type="button"
        onClick={() => setBbPanelOpen(false)}
        className="text-4xl font-bold leading-none text-slate-300 hover:text-white"
      >
        ×
      </button>
    </div>

    <div className="mt-4">
  <div className="rounded-2xl border border-sky-400 bg-sky-500/20 px-6 py-2 text-lg font-bold text-white text-center">
    Ustawienia BB
  </div>
</div>

    <div className="mt-6 space-y-4">
      <label className="flex items-center justify-between text-lg font-semibold text-white">
        <span>Okres</span>
        <input
          type="number"
          value={bbState.length}
          onChange={(e) =>
            setBbState((p) => ({ ...p, length: Number(e.target.value) }))
          }
          className="h-11 w-36 rounded-lg border border-sky-300/20 bg-[#061c37]/85 px-4 text-lg text-white outline-none focus:border-cyan-300/45"
        />
      </label>

      <label className="flex items-center justify-between text-lg font-semibold text-white">
        <span>Odstępstwo</span>
        <input
          type="number"
          step="0.1"
          value={bbState.stdDev}
          onChange={(e) =>
            setBbState((p) => ({ ...p, stdDev: Number(e.target.value) }))
          }
          className="h-11 w-36 rounded-lg border border-sky-300/20 bg-[#061c37]/85 px-4 text-lg text-white outline-none focus:border-cyan-300/45"
        />
      </label>
    </div>

    <div className="mt-8 space-y-4">
      {[
        ["top", "upper", "#84cc16"],
        ["middle", "basis", "#f97316"],
        ["bottom", "lower", "#facc15"],
      ].map(([label, key, fallback]) => (
        <div key={key} className="flex items-center justify-between">
          <label className="flex items-center gap-3 text-xl font-semibold text-white">
            <input type="checkbox" defaultChecked className="h-5 w-5 accent-sky-400" />
            <span>{label}</span>
          </label>

          <div className="flex items-center gap-3 rounded-lg border border-sky-300/20 bg-[#061c37]/85 px-2 py-2">
            <input
              type="color"
              value={(bbState.colors as any)?.[key] ?? fallback}
              onChange={(e) =>
                setBbState((p) => ({
                  ...p,
                  colors: {
                    ...(p.colors ?? {}),
                    [key]: e.target.value,
                  },
                }))
              }
              className="h-8 w-12 rounded border-0 bg-transparent"
            />

            <select
              value={(bbState.widths as any)?.[key] ?? 2}
              onChange={(e) =>
                setBbState((p) => ({
                  ...p,
                  widths: {
                    ...(p.widths ?? {}),
                    [key]: Number(e.target.value) as 1 | 2 | 3 | 4,
                  },
                }))
              }
              className="bg-transparent text-lg font-bold text-white outline-none"
            >
              <option value={1}>1px</option>
              <option value={2}>2px</option>
              <option value={3}>3px</option>
              <option value={4}>4px</option>
            </select>
          </div>
        </div>
      ))}

      <div className="rounded-2xl border border-sky-300/12 bg-[#061c37]/55 px-3 py-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-3 text-xl font-semibold text-white">
            <input
              type="checkbox"
              checked={bbState.background?.enabled ?? DEFAULT_BB.background.enabled}
              onChange={() =>
                setBbState((p) => ({
                  ...p,
                  background: {
                    ...(p.background ?? DEFAULT_BB.background),
                    enabled: !(p.background?.enabled ?? DEFAULT_BB.background.enabled),
                  },
                }))
              }
              className="h-5 w-5 accent-sky-400"
            />
            <span>background</span>
          </label>

          <input
            type="color"
            value={bbState.background?.color ?? DEFAULT_BB.background.color}
            onChange={(e) =>
              setBbState((p) => ({
                ...p,
                background: {
                  ...(p.background ?? DEFAULT_BB.background),
                  color: e.target.value,
                },
              }))
            }
            className="h-10 w-12 rounded-lg border border-white/15 bg-transparent"
            title="Kolor tła Bollinger Bands"
          />
        </div>

        <div className="mt-3 flex items-center gap-3">
          <span className="w-20 text-sm font-semibold text-sky-100/60">
            Krycie
          </span>
          <input
            type="range"
            min={3}
            max={35}
            step={1}
            value={Math.round((bbState.background?.opacity ?? DEFAULT_BB.background.opacity) * 100)}
            onChange={(e) =>
              setBbState((p) => ({
                ...p,
                background: {
                  ...(p.background ?? DEFAULT_BB.background),
                  opacity: Number(e.target.value) / 100,
                },
              }))
            }
            className="flex-1 accent-sky-400"
          />
          <span className="w-10 text-right text-sm font-bold text-white">
            {Math.round((bbState.background?.opacity ?? DEFAULT_BB.background.opacity) * 100)}%
          </span>
        </div>
      </div>
    </div>

    <div className="mt-8 flex gap-3">
      <button
        type="button"
        onClick={() => setBbState(DEFAULT_BB)}
        className="rounded-xl border border-sky-300/20 bg-[#0b315c]/80 px-6 py-3 text-lg font-bold text-white hover:bg-[#12477f]"
      >
        Usuń
      </button>

      <button
        type="button"
        onClick={() => setBbPanelOpen(false)}
        className="rounded-xl border border-red-400/40 bg-red-500/10 px-6 py-3 text-lg font-bold text-white"
      >
        Anuluj
      </button>

      <button
        type="button"
        onClick={() => setBbPanelOpen(false)}
        className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-6 py-3 text-lg font-bold text-white"
      >
        Zapisz
      </button>
    </div>
  </div>
) : null}
</div>
                    <button
                      type="button"
                      onClick={() => {
                        setHeikinAshi((v) => {
                          const next = !v;
                          if (next) setRenko(false);
                          return next;
                        });
                      }}
                      className={cn(
                        "ml-1 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold transition",
                        heikinAshi
                          ? "border-amber-400/30 bg-amber-500/15 text-amber-100"
                          : "border-sky-300/15 bg-[#0b315c]/75 text-sky-100/75 hover:border-sky-300/30 hover:bg-[#12477f] hover:text-white"
                      )}
                    >
                      HA
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRenko((v) => {
                          const next = !v;
                          if (next) setHeikinAshi(false);
                          return next;
                        });
                      }}
                      className={cn(
                        "ml-1 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold transition",
                        renko
                          ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-100"
                          : "border-sky-300/15 bg-[#0b315c]/75 text-sky-100/75 hover:border-sky-300/30 hover:bg-[#12477f] hover:text-white"
                      )}
                    >
                      RENKO
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRenkoDraftMode(renkoBoxSize > 0 ? "MANUAL" : "AUTO");
                        setRenkoDraftBoxSize(renkoBoxSize > 0 ? renkoBoxSize : 0);
                        setRenkoDraftSource(renkoSource);
                        setRenkoPanelOpen(true);
                      }}
                      title="Ustawienia Renko"
                      className={cn(
                        "grid h-8 w-8 place-items-center rounded-full border transition",
                        renkoPanelOpen
                          ? "border-emerald-300/50 bg-emerald-500/15 text-emerald-100 shadow-[0_0_14px_rgba(34,197,94,.16)]"
                          : "border-sky-300/15 bg-[#0b315c]/75 text-sky-100/70 hover:border-emerald-300/35 hover:bg-emerald-500/10 hover:text-emerald-100"
                      )}
                    >
                      <GearIcon className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setPatternsEnabled((v) => !v)}
                      title={patternsEnabled ? "Formacje świecowe aktywne — kliknij, aby wyłączyć" : "Pokaż formacje świecowe"}
                      className={cn(
                        "ml-1 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold transition",
                        patternsEnabled
                          ? "border-yellow-300/55 bg-yellow-400/15 text-yellow-100 shadow-[0_0_16px_rgba(250,204,21,.20)]"
                          : "border-sky-300/15 bg-[#0b315c]/75 text-sky-100/75 hover:border-yellow-300/35 hover:bg-yellow-400/10 hover:text-yellow-100"
                      )}
                    >
                      FORMACJE
                    </button>

                    <button
                      type="button"
                      onClick={() => setSupertrendEnabled((v) => !v)}
                      title={
                        supertrendEnabled
                          ? "SuperTrend aktywny — kliknij, aby wyłączyć"
                          : "Włącz SuperTrend"
                      }
                      className={cn(
                        "ml-1 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold transition",
                        supertrendEnabled
                          ? "border-emerald-300/45 bg-emerald-500/15 text-emerald-100 shadow-[0_0_16px_rgba(34,197,94,.18)]"
                          : "border-sky-300/15 bg-[#0b315c]/75 text-sky-100/75 hover:border-sky-300/30 hover:bg-[#12477f] hover:text-white"
                      )}
                    >
                      SUPERTREND
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSupertrendDraft({ ...supertrendSettings });
                        setSupertrendPanelOpen(true);
                      }}
                      title="Ustawienia SuperTrend"
                      className={cn(
                        "grid h-8 w-8 place-items-center rounded-full border transition",
                        supertrendPanelOpen
                          ? "border-emerald-300/50 bg-emerald-500/15 text-emerald-100 shadow-[0_0_14px_rgba(34,197,94,.16)]"
                          : "border-sky-300/15 bg-[#0b315c]/75 text-sky-100/70 hover:border-emerald-300/35 hover:bg-emerald-500/10 hover:text-emerald-100"
                      )}
                    >
                      <GearIcon className="h-4 w-4" />
                    </button>

                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <LiquidityBar value={selected.liquidity} />
                  <SignalDot s={selected.signal} />
                  <ConfirmationBadge count={selected.confirmationCount ?? 0} side={selected.confirmationSide ?? null} />
                </div>
              </div>

              <div className="flex justify-start"><PocMiniScanner state={pocScanner} /></div>

              <div className="min-w-0">

<div className="mb-3 flex flex-wrap gap-2">
  <button
    type="button"
    onClick={toggleFullscreen}
    title={isFullscreen ? "Wyjdź z pełnego ekranu" : "Pełny ekran"}
    className={cn(
      "grid h-10 w-10 place-items-center rounded-xl border text-lg font-black transition",
      isFullscreen
        ? "border-cyan-300/50 bg-[linear-gradient(135deg,#0ea5e9,#2563eb)] text-white shadow-[0_0_16px_rgba(14,165,233,.18)]"
        : "border-sky-300/15 bg-[#0b315c]/75 text-sky-100/75 hover:border-sky-300/30 hover:bg-[#12477f] hover:text-white"
    )}
  >
    ⛶
  </button>

  {DRAW_TOOL_BUTTONS.map(({ tool, icon: Icon, title }) => (
    <button
      key={tool}
      type="button"
      title={title}
      onClick={() => setActiveDrawTool(tool)}
      className={`grid h-10 w-10 place-items-center rounded-xl border transition ${
        activeDrawTool === tool
          ? "border-cyan-300/50 bg-[linear-gradient(135deg,#0ea5e9,#2563eb)] text-white shadow-[0_0_16px_rgba(14,165,233,.18)]"
          : "border-sky-300/15 bg-[#0b315c]/75 text-sky-100/75 hover:border-sky-300/30 hover:bg-[#12477f] hover:text-white"
      }`}
    >
      <Icon size={18} strokeWidth={2.4} />
    </button>
  ))}
</div>
                <MarketChart
                  symbol={selected.symbol}
                  tf={tf}
                  candles={selectedCandles as any}
                  liveCandle={null}
                  height={chartHeight}
                  emaConfigs={emaConfigs}
                  bbConfig={bbConfig}
                  heikinAshi={heikinAshi}
                  renko={renko}
                  renkoCandles={renkoCandles as any}
                  renkoBoxSize={renkoBoxSize > 0 ? renkoBoxSize : undefined}
                  showTradeLines={hasTrade}
                  levels={hasTrade ? selected.levels : undefined}
                  highlightTime={highlightTime}
                  activeDrawTool={activeDrawTool}
                  onDrawToolChange={setActiveDrawTool}
                  showSignalPanel={false}
                  supertrendEnabled={supertrendEnabled}
                  supertrendPeriod={supertrendSettings.atrPeriod}
                  supertrendMultiplier={supertrendSettings.factor}
                  supertrendUpLineEnabled={supertrendSettings.upTrend}
                  supertrendDownLineEnabled={supertrendSettings.downTrend}
                  supertrendUpBackground={supertrendSettings.upBackground}
                  supertrendDownBackground={supertrendSettings.downBackground}
                  supertrendUpColor={supertrendSettings.upColor}
                  supertrendDownColor={supertrendSettings.downColor}
                  patternsEnabled={patternsEnabled}
                />
              </div>

              <div className="mt-1 w-full overflow-hidden rounded-2xl border border-sky-300/16 bg-[#061c37]/78 shadow-[inset_0_1px_0_rgba(255,255,255,.03)]">
                <div className="border-b border-sky-300/12 bg-[#0b315c]/75 px-4 py-3">
                  <div className="text-sm font-semibold text-white">Closed Trades</div>
                </div>

                <div className="h-[250px] overflow-auto rounded-b-2xl">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-[#082749] text-sky-100/80">
                      <tr className="border-b border-sky-300/12">
                        <th className="px-3 py-2 text-left">Data</th>
                        <th className="px-3 py-2 text-left">Instrument</th>
                        <th className="px-3 py-2 text-left">Kierunek</th>
                        <th className="px-3 py-2 text-left">Wejście</th>
                        <th className="px-3 py-2 text-left">TP1</th>
                        <th className="px-3 py-2 text-left">TP2</th>
                        <th className="px-3 py-2 text-left">SL</th>
                        <th className="px-3 py-2 text-left">Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {closedTrades.length ? (
closedTrades.map((t) => (
  <tr key={t.id} className="border-b border-sky-300/8 text-sky-50 transition hover:bg-sky-400/[0.05]">
    <td className="whitespace-nowrap px-3 py-2">
      {new Date(t.date).toISOString().slice(0, 16).replace("T", " ")}
    </td>

    <td className="px-3 py-2">{t.instrument}</td>

    {/* 🔥 KIERUNEK */}
    <td className="px-3 py-2">
      <span
        className={cn(
          "rounded-full px-2 py-1 text-xs font-bold",
          t.direction === "BUY"
            ? "bg-emerald-500/15 text-emerald-300"
            : "bg-red-500/15 text-red-300"
        )}
      >
        {t.direction}
      </span>
    </td>

    <td className="px-3 py-2">{t.entry}</td>
    <td className="px-3 py-2">{t.tp1 ?? "—"}</td>
    <td className="px-3 py-2">{t.tp2 ?? "—"}</td>
    <td className="px-3 py-2">{t.sl}</td>

    {/* 🔥 STATUS */}
    <td className="px-3 py-2">
      {(() => {
        const safeStatus =
          typeof t.status === "object" ? (t.status as any).status : t.status;

        return (
          <span
            className={cn(
  "rounded-full px-3 py-1 text-xs font-bold",

  safeStatus === "TP2"
    ? "bg-emerald-500/20 text-emerald-300"

    : safeStatus === "TP1_BE"
    ? "bg-yellow-500/20 text-yellow-300"

    : safeStatus === "BE"
    ? "bg-blue-500/20 text-blue-300"

    : "bg-red-500/20 text-red-300"
)}
          >
            {safeStatus || "—"}
          </span>
        );
      })()}
    </td>
  </tr>
))
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-3 py-6 text-center text-sky-100/45">
                            Brak zamkniętych trade’ów
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end border-t border-sky-300/10 px-4 py-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setClosedTrades([]);
                    try {
                      localStorage.removeItem(CLOSED_TRADES_KEY);
                    } catch {}
                  }}
                >
                  Clean log
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>

      <div className="hidden">{flashKey}</div>
    
      {renkoPanelOpen ? (
        <div className="fixed inset-0 z-[119] flex items-start justify-end bg-black/25 p-4 pt-20 backdrop-blur-[2px]">
          <div className="w-full max-w-[620px] overflow-hidden rounded-[22px] border border-emerald-300/35 bg-[#07182c] text-white shadow-[0_30px_90px_rgba(0,0,0,.55),0_0_35px_rgba(34,197,94,.10)]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <div className="text-lg font-black">Renko</div>
                <div className="mt-0.5 text-[11px] text-sky-100/45">
                  Ustawienia wielkości cegły Renko
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRenkoPanelOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-xl text-sky-100/70 transition hover:bg-white/[0.08] hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="p-5">
              <div className="mb-5">
                <div className="mb-3 text-[10px] font-black uppercase tracking-[.15em] text-sky-100/35">
                  Tryb Box Size
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRenkoDraftMode("AUTO")}
                    className={cn(
                      "rounded-xl border px-4 py-3 text-left transition",
                      renkoDraftMode === "AUTO"
                        ? "border-emerald-300/40 bg-emerald-500/12 text-emerald-100"
                        : "border-white/10 bg-white/[0.025] text-sky-100/65 hover:bg-white/[0.05]"
                    )}
                  >
                    <div className="text-sm font-black">AUTO ATR</div>
                    <div className="mt-1 text-[10px] leading-4 opacity-60">
                      ATR(14) × 0.8, minimum 0.1% ceny — jak w dotychczasowym RENKO AUTO.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRenkoDraftMode("MANUAL")}
                    className={cn(
                      "rounded-xl border px-4 py-3 text-left transition",
                      renkoDraftMode === "MANUAL"
                        ? "border-sky-300/40 bg-sky-500/12 text-sky-100"
                        : "border-white/10 bg-white/[0.025] text-sky-100/65 hover:bg-white/[0.05]"
                    )}
                  >
                    <div className="text-sm font-black">MANUAL</div>
                    <div className="mt-1 text-[10px] leading-4 opacity-60">
                      Sam ustawiasz stałą wielkość każdej cegły Renko.
                    </div>
                  </button>
                </div>
              </div>

              <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                <div className="mb-3 text-sm font-black">Źródło danych Renko</div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {([
                    ["M1", "M1"],
                    ["M5", "M5"],
                    ["CURRENT", "Aktualny TF"],
                    ["AUTO", "AUTO"],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRenkoDraftSource(value)}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-xs font-black transition",
                        renkoDraftSource === value
                          ? "border-emerald-300/45 bg-emerald-500/15 text-emerald-100"
                          : "border-white/10 bg-white/[0.025] text-sky-100/60 hover:bg-white/[0.06]"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="mt-3 text-[10px] leading-4 text-sky-100/40">
                  Domyślnie M1 — np. wykres M15 może wyświetlać Renko budowane z danych M1.
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-black">Box Size</div>
                    <div className="mt-1 text-[10px] text-sky-100/40">
                      {renkoDraftMode === "AUTO"
                        ? "AUTO — wartość wyliczana z ATR."
                        : "Wpisz ręczną wielkość cegły dla aktualnego instrumentu."}
                    </div>
                  </div>

                  <input
                    type="number"
                    min={0}
                    step="any"
                    disabled={renkoDraftMode === "AUTO"}
                    value={renkoDraftMode === "AUTO" ? 0 : renkoDraftBoxSize}
                    onChange={(e) =>
                      setRenkoDraftBoxSize(
                        Math.max(0, Number(e.target.value) || 0)
                      )
                    }
                    className="h-11 w-36 rounded-xl border border-sky-300/20 bg-[#0b315c]/75 px-3 text-sm font-black text-white outline-none transition focus:border-emerald-300/45 disabled:cursor-not-allowed disabled:opacity-40"
                  />
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-emerald-300/15 bg-emerald-500/[0.045] px-3 py-2.5 text-[10px] leading-4 text-sky-100/50">
                AUTO ATR jest najlepszy, gdy przełączasz instrumenty i interwały.
                Manual przydaje się, gdy chcesz zawsze identyczny Box Size.
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#061425] px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  setRenkoDraftMode("AUTO");
                  setRenkoDraftBoxSize(0);
                  setRenkoDraftSource("M1");
                }}
                className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-2 text-sm font-bold text-sky-100/75 transition hover:bg-white/[0.07] hover:text-white"
              >
                Domyślne
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRenkoPanelOpen(false)}
                  className="rounded-xl border border-white/10 bg-white/[0.035] px-5 py-2 text-sm font-bold text-sky-100/75 transition hover:bg-white/[0.07] hover:text-white"
                >
                  Anuluj
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const nextBox =
                      renkoDraftMode === "AUTO"
                        ? 0
                        : Math.max(0, renkoDraftBoxSize);

                    setRenkoBoxSize(nextBox);
                    setRenkoSource(renkoDraftSource);
                    setRenko(true);
                    setHeikinAshi(false);
                    setRenkoPanelOpen(false);
                  }}
                  className="rounded-xl border border-emerald-300/35 bg-emerald-500/15 px-5 py-2 text-sm font-black text-emerald-100 shadow-[0_0_18px_rgba(34,197,94,.12)] transition hover:bg-emerald-500/25"
                >
                  Zapisz
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {supertrendPanelOpen ? (
        <div className="fixed inset-0 z-[120] flex items-start justify-end bg-black/25 p-4 pt-20 backdrop-blur-[2px]">
          <div className="w-full max-w-[760px] overflow-hidden rounded-[22px] border border-emerald-300/35 bg-[#07182c] text-white shadow-[0_30px_90px_rgba(0,0,0,.55),0_0_35px_rgba(34,197,94,.10)]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <div className="text-lg font-black">SuperTrend</div>
                <div className="mt-0.5 text-[11px] text-sky-100/45">
                  Parametry i styl wskaźnika
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSupertrendPanelOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-xl text-sky-100/70 transition hover:bg-white/[0.08] hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="grid gap-0 md:grid-cols-2">
              <section className="border-b border-white/10 p-5 md:border-b-0 md:border-r">
                <div className="mb-5 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                  <h3 className="text-sm font-black">Argumenty</h3>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center justify-between gap-4">
                    <span className="text-sm text-sky-100/80">Długość ATR</span>
                    <input
                      type="number"
                      min={2}
                      max={200}
                      value={supertrendDraft.atrPeriod}
                      onChange={(e) =>
                        setSupertrendDraft((prev) => ({
                          ...prev,
                          atrPeriod: Math.max(2, Math.min(200, Number(e.target.value) || 10)),
                        }))
                      }
                      className="h-10 w-28 rounded-xl border border-sky-300/20 bg-[#0b315c]/75 px-3 text-sm font-bold text-white outline-none focus:border-emerald-300/45"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-4">
                    <span className="text-sm text-sky-100/80">Współczynnik</span>
                    <input
                      type="number"
                      min={0.1}
                      max={20}
                      step={0.1}
                      value={supertrendDraft.factor}
                      onChange={(e) =>
                        setSupertrendDraft((prev) => ({
                          ...prev,
                          factor: Math.max(0.1, Math.min(20, Number(e.target.value) || 3)),
                        }))
                      }
                      className="h-10 w-28 rounded-xl border border-sky-300/20 bg-[#0b315c]/75 px-3 text-sm font-bold text-white outline-none focus:border-emerald-300/45"
                    />
                  </label>

                  <div className="mt-6 border-t border-white/10 pt-5">
                    <div className="mb-3 text-[10px] font-black uppercase tracking-[.15em] text-sky-100/35">
                      Obliczenie
                    </div>

                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-3">
                      <input
                        type="checkbox"
                        checked={supertrendDraft.waitForClose}
                        onChange={(e) =>
                          setSupertrendDraft((prev) => ({
                            ...prev,
                            waitForClose: e.target.checked,
                          }))
                        }
                        className="mt-0.5 h-4 w-4 accent-emerald-500"
                      />
                      <span>
                        <span className="block text-sm font-bold">
                          Poczekaj na zamknięcie świecy
                        </span>
                        <span className="mt-1 block text-[10px] leading-4 text-sky-100/40">
                          Sygnał SuperTrend jest liczony z ostatniej zamkniętej świecy.
                        </span>
                      </span>
                    </label>
                  </div>
                </div>
              </section>

              <section className="p-5">
                <div className="mb-5 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <h3 className="text-sm font-black">Styl</h3>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      key: "upTrend" as const,
                      label: "Up Trend",
                      colorKey: "upColor" as const,
                    },
                    {
                      key: "downTrend" as const,
                      label: "Down Trend",
                      colorKey: "downColor" as const,
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.025] px-3 py-2.5"
                    >
                      <label className="flex cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          checked={supertrendDraft[item.key]}
                          onChange={(e) =>
                            setSupertrendDraft((prev) => ({
                              ...prev,
                              [item.key]: e.target.checked,
                            }))
                          }
                          className="h-4 w-4 accent-emerald-500"
                        />
                        <span className="text-sm font-bold">{item.label}</span>
                      </label>

                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={supertrendDraft[item.colorKey]}
                          onChange={(e) =>
                            setSupertrendDraft((prev) => ({
                              ...prev,
                              [item.colorKey]: e.target.value,
                            }))
                          }
                          className="h-8 w-11 cursor-pointer rounded-lg border border-white/15 bg-transparent p-1"
                        />
                        <span
                          className="h-[2px] w-8 rounded-full"
                          style={{ background: supertrendDraft[item.colorKey] }}
                        />
                      </div>
                    </div>
                  ))}

                  <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/8 bg-white/[0.025] px-3 py-3">
                    <span className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={supertrendDraft.upBackground}
                        onChange={(e) =>
                          setSupertrendDraft((prev) => ({
                            ...prev,
                            upBackground: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 accent-emerald-500"
                      />
                      <span className="text-sm font-bold">Uptrend background</span>
                    </span>
                    <span className="grid h-7 w-7 place-items-center rounded-lg border border-emerald-300/20 bg-emerald-500/10">
                      <span className="h-3.5 w-3.5 rounded-sm bg-emerald-400/35" />
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/8 bg-white/[0.025] px-3 py-3">
                    <span className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={supertrendDraft.downBackground}
                        onChange={(e) =>
                          setSupertrendDraft((prev) => ({
                            ...prev,
                            downBackground: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 accent-emerald-500"
                      />
                      <span className="text-sm font-bold">Downtrend background</span>
                    </span>
                    <span className="grid h-7 w-7 place-items-center rounded-lg border border-red-300/20 bg-red-500/10">
                      <span className="h-3.5 w-3.5 rounded-sm bg-red-400/30" />
                    </span>
                  </label>
                </div>

                <div className="mt-5 rounded-xl border border-emerald-300/15 bg-emerald-500/[0.045] px-3 py-2.5 text-[10px] leading-4 text-sky-100/50">
                  Zielona linia jest rysowana pod świecami w trendzie wzrostowym,
                  a czerwona nad świecami w trendzie spadkowym.
                </div>
              </section>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#061425] px-5 py-4">
              <button
                type="button"
                onClick={() =>
                  setSupertrendDraft({ ...DEFAULT_SUPERTREND_SETTINGS })
                }
                className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-2 text-sm font-bold text-sky-100/75 transition hover:bg-white/[0.07] hover:text-white"
              >
                Domyślne
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSupertrendPanelOpen(false)}
                  className="rounded-xl border border-white/10 bg-white/[0.035] px-5 py-2 text-sm font-bold text-sky-100/75 transition hover:bg-white/[0.07] hover:text-white"
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSupertrendSettings({ ...supertrendDraft });
                    setSupertrendEnabled(true);
                    setSupertrendPanelOpen(false);
                  }}
                  className="rounded-xl border border-emerald-300/35 bg-emerald-500/15 px-5 py-2 text-sm font-black text-emerald-100 shadow-[0_0_18px_rgba(34,197,94,.12)] transition hover:bg-emerald-500/25"
                >
                  Zapisz
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

</main>
  );
}
