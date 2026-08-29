"use client";

import React from "react";
import {
  CheckCircle2,
  ChevronDown,
  Loader2,
  Search,
  Star,
  Zap,
} from "lucide-react";
import type { CandlestickData, UTCTimestamp } from "lightweight-charts";
import HarmonicChart, {
  type HarmonicLevels,
  type HarmonicPattern,
  type HarmonicPoint,
} from "./HarmonicChart";

type SymbolKey = "XAUUSD" | "EURUSD" | "GBPUSD" | "USDJPY" | "US30";
type TF = "M5" | "M15" | "H1" | "H4";
type PatternName = "Gartley" | "Bat" | "Butterfly" | "Crab" | "Shark";
type Direction = "Bullish" | "Bearish";

type ScanResult = {
  id: string;
  symbol: SymbolKey;
  tf: TF;
  name: PatternName;
  direction: Direction;
  score: number;
  age: string;
};

const DEFAULT_RESULTS: ScanResult[] = [
  { id: "xau-gartley-m15", symbol: "XAUUSD", tf: "M15", name: "Gartley", direction: "Bullish", score: 92, age: "2m temu" },
  { id: "eur-bat-h1", symbol: "EURUSD", tf: "H1", name: "Bat", direction: "Bearish", score: 88, age: "12m temu" },
  { id: "gbp-butterfly-m15", symbol: "GBPUSD", tf: "M15", name: "Butterfly", direction: "Bullish", score: 85, age: "18m temu" },
  { id: "jpy-gartley-h1", symbol: "USDJPY", tf: "H1", name: "Gartley", direction: "Bearish", score: 82, age: "27m temu" },
  { id: "xau-crab-m15", symbol: "XAUUSD", tf: "M15", name: "Crab", direction: "Bullish", score: 78, age: "35m temu" },
  { id: "us30-shark-m5", symbol: "US30", tf: "M5", name: "Shark", direction: "Bearish", score: 76, age: "41m temu" },
];

const SYMBOL_BASE: Record<SymbolKey, number> = {
  XAUUSD: 2030,
  EURUSD: 1.09,
  GBPUSD: 1.275,
  USDJPY: 156,
  US30: 38900,
};

const TF_SECONDS: Record<TF, number> = {
  M5: 300,
  M15: 900,
  H1: 3600,
  H4: 14400,
};


const TWELVE_INTERVAL: Record<TF, string> = {
  M5: "5min",
  M15: "15min",
  H1: "1h",
  H4: "4h",
};

const TWELVE_SYMBOL: Record<SymbolKey, string> = {
  XAUUSD: "XAU/USD",
  EURUSD: "EUR/USD",
  GBPUSD: "GBP/USD",
  USDJPY: "USD/JPY",
  // If your Twelve Data plan/provider uses a different US30 ticker,
  // change only this mapping.
  US30: "DJI",
};


const AUTO_SCAN_SYMBOLS: SymbolKey[] = [
  "XAUUSD",
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "US30",
];

const AUTO_SCAN_TFS: TF[] = ["M5", "M15", "H1", "H4"];
const AUTO_SCAN_PATTERNS: PatternName[] = [
  "Gartley",
  "Bat",
  "Butterfly",
  "Crab",
  "Shark",
];
const AUTO_SCAN_DIRECTIONS: Direction[] = ["Bullish", "Bearish"];

type AutoScanMatch = ScanResult & {
  pattern: HarmonicPattern;
  candles: CandlestickData[];
  levels: HarmonicLevels | null;
};

type TwelveDataCandle = {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
};

function twelveDatetimeToUtc(value: string): UTCTimestamp {
  // Twelve Data FX timestamps are commonly returned without an offset.
  // Treating them as UTC keeps Lightweight Charts stable across browsers.
  const normalized = value.includes("T")
    ? value
    : value.replace(" ", "T");
  const withZone =
    /Z$|[+-]\d{2}:\d{2}$/.test(normalized) ? normalized : `${normalized}Z`;

  return Math.floor(new Date(withZone).getTime() / 1000) as UTCTimestamp;
}

function normalizeTwelveCandles(values: TwelveDataCandle[]): CandlestickData[] {
  return values
    .map((c) => ({
      time: twelveDatetimeToUtc(c.datetime),
      open: Number(c.open),
      high: Number(c.high),
      low: Number(c.low),
      close: Number(c.close),
    }))
    .filter(
      (c) =>
        Number.isFinite(c.open) &&
        Number.isFinite(c.high) &&
        Number.isFinite(c.low) &&
        Number.isFinite(c.close)
    )
    .sort((a, b) => Number(a.time) - Number(b.time));
}

async function fetchLiveCandles(
  symbol: SymbolKey,
  tf: TF,
  signal?: AbortSignal
): Promise<CandlestickData[]> {
  const params = new URLSearchParams({
    symbol: TWELVE_SYMBOL[symbol],
    interval: TWELVE_INTERVAL[tf],
    outputsize: "220",
  });

  const res = await fetch(`/api/twelve-data/candles?${params.toString()}`, {
    cache: "no-store",
    signal,
  });

  const payload = await res.json();

  if (!res.ok) {
    throw new Error(payload?.message || "Nie udaÅ‚o siÄ™ pobraÄ‡ Å›wiec z Twelve Data.");
  }

  if (!Array.isArray(payload?.values)) {
    throw new Error(payload?.message || "Twelve Data nie zwrÃ³ciÅ‚o danych OHLC.");
  }

  return normalizeTwelveCandles(payload.values);
}

const PATTERN_PROFILE: Record<
  PatternName,
  { a: number; b: number; c: number; d: number; score: number }
> = {
  Gartley:   { a: -0.42, b: 0.08, c: -0.28, d: 0.18, score: 92 },
  Bat:       { a: -0.46, b: -0.02, c: -0.31, d: 0.12, score: 88 },
  Butterfly: { a: -0.40, b: 0.12, c: -0.22, d: 0.34, score: 86 },
  Crab:      { a: -0.44, b: 0.04, c: -0.26, d: 0.40, score: 84 },
  Shark:     { a: -0.36, b: 0.16, c: -0.18, d: 0.28, score: 81 },
};

function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function noise(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function lerpAnchors(anchors: Array<{ i: number; value: number }>, i: number) {
  for (let k = 0; k < anchors.length - 1; k++) {
    const a = anchors[k];
    const b = anchors[k + 1];
    if (i >= a.i && i <= b.i) {
      const t = (i - a.i) / Math.max(1, b.i - a.i);
      const smooth = t * t * (3 - 2 * t);
      return a.value + (b.value - a.value) * smooth;
    }
  }
  return anchors[anchors.length - 1].value;
}

function getRange(symbol: SymbolKey) {
  if (symbol === "EURUSD" || symbol === "GBPUSD") return 0.018;
  if (symbol === "USDJPY") return 3.2;
  if (symbol === "US30") return 520;
  return 32;
}

function makeCandles(setup: ScanResult): CandlestickData[] {
  const base = SYMBOL_BASE[setup.symbol];
  const range = getRange(setup.symbol);
  const profile = PATTERN_PROFILE[setup.name];
  const step = TF_SECONDS[setup.tf];
  const count = 160;
  const now = Math.floor(Date.now() / step) * step;
  const start = now - step * (count - 1);

  // X-A-B-C-D target swing skeleton. Different formation => different geometry.
  const bullAnchors = [
    { i: 0, value: base - range * 0.08 },
    { i: 28, value: base + range * 0.34 }, // X
    { i: 58, value: base + range * profile.a }, // A
    { i: 82, value: base + range * profile.b }, // B
    { i: 108, value: base + range * profile.c }, // C
    { i: 132, value: base + range * profile.d }, // D
    { i: 159, value: base + range * 0.02 },
  ];

  const anchors =
    setup.direction === "Bullish"
      ? bullAnchors
      : bullAnchors.map((a) => ({ i: a.i, value: base - (a.value - base) }));

  const seedBase = hashString(`${setup.symbol}|${setup.tf}|${setup.name}|${setup.direction}`);
  const out: CandlestickData[] = [];
  let prev = anchors[0].value;

  for (let i = 0; i < count; i++) {
    const target = lerpAnchors(anchors, i);
    const close =
      target +
      (noise(seedBase + i * 17) - 0.5) * range * 0.028;
    const open =
      prev +
      (noise(seedBase + i * 31 + 3) - 0.5) * range * 0.014;
    const wick =
      range * (0.010 + noise(seedBase + i * 11 + 7) * 0.020);

    out.push({
      time: (start + i * step) as UTCTimestamp,
      open,
      high: Math.max(open, close) + wick,
      low: Math.min(open, close) - wick,
      close,
    });
    prev = close;
  }

  return out;
}

type Pivot = {
  index: number;
  time: UTCTimestamp;
  price: number;
  kind: "high" | "low";
};

function detectPivots(candles: CandlestickData[], window = 4): Pivot[] {
  const found: Pivot[] = [];

  for (let i = window; i < candles.length - window; i++) {
    const c = candles[i] as any;
    let isHigh = true;
    let isLow = true;

    for (let j = i - window; j <= i + window; j++) {
      if (j === i) continue;
      const x = candles[j] as any;
      if (Number(x.high) >= Number(c.high)) isHigh = false;
      if (Number(x.low) <= Number(c.low)) isLow = false;
    }

    if (isHigh) {
      found.push({
        index: i,
        time: candles[i].time as UTCTimestamp,
        price: Number(c.high),
        kind: "high",
      });
    }

    if (isLow) {
      found.push({
        index: i,
        time: candles[i].time as UTCTimestamp,
        price: Number(c.low),
        kind: "low",
      });
    }
  }

  found.sort((a, b) => a.index - b.index);

  const alternating: Pivot[] = [];
  for (const p of found) {
    const last = alternating[alternating.length - 1];
    if (!last || last.kind !== p.kind) {
      alternating.push(p);
    } else if (
      (p.kind === "high" && p.price > last.price) ||
      (p.kind === "low" && p.price < last.price)
    ) {
      alternating[alternating.length - 1] = p;
    }
  }

  return alternating;
}

function safeRatio(a: number, b: number) {
  return Math.abs(b) < 1e-12 ? 0 : Math.abs(a / b);
}


type RatioRule = {
  min: number;
  max: number;
  ideal?: number;
};

type PatternRules = {
  AB_XA: RatioRule;
  BC_AB: RatioRule;
  CD_BC: RatioRule;
  XD_XA: RatioRule;
};

const HARMONIC_RULES: Record<PatternName, PatternRules> = {
  Gartley: {
    AB_XA: { min: 0.56, max: 0.68, ideal: 0.618 },
    BC_AB: { min: 0.382, max: 0.886 },
    CD_BC: { min: 1.13, max: 1.72, ideal: 1.414 },
    XD_XA: { min: 0.73, max: 0.83, ideal: 0.786 },
  },
  Bat: {
    AB_XA: { min: 0.382, max: 0.55 },
    BC_AB: { min: 0.382, max: 0.886 },
    CD_BC: { min: 1.55, max: 2.72, ideal: 2.0 },
    XD_XA: { min: 0.84, max: 0.93, ideal: 0.886 },
  },
  Butterfly: {
    AB_XA: { min: 0.73, max: 0.83, ideal: 0.786 },
    BC_AB: { min: 0.382, max: 0.886 },
    CD_BC: { min: 1.55, max: 2.72 },
    XD_XA: { min: 1.22, max: 1.70, ideal: 1.272 },
  },
  Crab: {
    AB_XA: { min: 0.382, max: 0.68 },
    BC_AB: { min: 0.382, max: 0.886 },
    CD_BC: { min: 2.15, max: 3.75, ideal: 3.14 },
    XD_XA: { min: 1.50, max: 1.72, ideal: 1.618 },
  },
  // Shark is normally described as O-X-A-B-C rather than X-A-B-C-D.
  // Here we map OXABC -> XABCD so it can be rendered by the same chart component.
  Shark: {
    AB_XA: { min: 1.08, max: 1.70 },
    BC_AB: { min: 1.08, max: 1.70 },
    CD_BC: { min: 1.55, max: 2.35, ideal: 2.0 },
    XD_XA: { min: 0.82, max: 1.18, ideal: 0.886 },
  },
};

function ratioInside(value: number, rule: RatioRule) {
  return value >= rule.min && value <= rule.max;
}

function ratioScore(value: number, rule: RatioRule) {
  const ideal = rule.ideal ?? (rule.min + rule.max) / 2;
  const halfRange = Math.max((rule.max - rule.min) / 2, 1e-9);
  const distance = Math.abs(value - ideal);
  return Math.max(0, 1 - distance / halfRange);
}

function structureIsValid(group: Pivot[], direction: Direction) {
  const kinds = group.map((p) => p.kind).join(",");

  // Bullish harmonic completes on a LOW at D and expects an upward reaction.
  if (direction === "Bullish") {
    return kinds === "low,high,low,high,low";
  }

  // Bearish harmonic completes on a HIGH at D and expects a downward reaction.
  return kinds === "high,low,high,low,high";
}

type HarmonicDetection = {
  pattern: HarmonicPattern;
  score: number;
  dIndex: number;
};

function detectHarmonicPatterns(
  candles: CandlestickData[],
  name: PatternName,
  direction: Direction
): HarmonicDetection[] {
  if (candles.length < 30) return [];

  const pivots = detectPivots(candles, 3);
  const rules = HARMONIC_RULES[name];
  const matches: HarmonicDetection[] = [];

  for (let i = 0; i <= pivots.length - 5; i++) {
    const group = pivots.slice(i, i + 5);
    if (!structureIsValid(group, direction)) continue;

    const [X, A, B, C, D] = group;

    // Ignore tiny/noisy patterns and patterns that are compressed into too few candles.
    const span = D.index - X.index;
    if (span < 12) continue;

    const XA = A.price - X.price;
    const AB = B.price - A.price;
    const BC = C.price - B.price;
    const CD = D.price - C.price;
    const XD = D.price - X.price;

    const ratios = {
      AB_XA: safeRatio(AB, XA),
      BC_AB: safeRatio(BC, AB),
      CD_BC: safeRatio(CD, BC),
      XD_XA: safeRatio(XD, XA),
    };

    if (
      !ratioInside(ratios.AB_XA, rules.AB_XA) ||
      !ratioInside(ratios.BC_AB, rules.BC_AB) ||
      !ratioInside(ratios.CD_BC, rules.CD_BC) ||
      !ratioInside(ratios.XD_XA, rules.XD_XA)
    ) {
      continue;
    }

    // D should be reasonably recent. This prevents the scanner from promoting
    // an old pattern buried far back in the loaded history.
    const barsAgo = candles.length - 1 - D.index;
    if (barsAgo > 80) continue;

    const rawQuality =
      (ratioScore(ratios.AB_XA, rules.AB_XA) +
        ratioScore(ratios.BC_AB, rules.BC_AB) +
        ratioScore(ratios.CD_BC, rules.CD_BC) +
        ratioScore(ratios.XD_XA, rules.XD_XA)) /
      4;

    const recencyBonus = Math.max(0, 1 - barsAgo / 80) * 0.08;
    const score = Math.round(
      Math.max(1, Math.min(99, (rawQuality + recencyBonus) * 100))
    );

    const points: HarmonicPoint[] = [
      { label: "X", index: X.index, time: X.time, price: X.price },
      { label: "A", index: A.index, time: A.time, price: A.price },
      { label: "B", index: B.index, time: B.time, price: B.price },
      { label: "C", index: C.index, time: C.time, price: C.price },
      { label: "D", index: D.index, time: D.time, price: D.price },
    ];

    matches.push({
      score,
      dIndex: D.index,
      pattern: {
        name,
        direction,
        points,
        ratios,
      },
    });
  }

  // Prefer newest valid pattern; quality breaks ties.
  return matches.sort((a, b) => {
    if (b.dIndex !== a.dIndex) return b.dIndex - a.dIndex;
    return b.score - a.score;
  });
}

function buildPattern(
  candles: CandlestickData[],
  setup: ScanResult
): HarmonicPattern | null {
  return (
    detectHarmonicPatterns(candles, setup.name, setup.direction)[0]?.pattern ??
    null
  );
}

function makeLevels(pattern: HarmonicPattern | null): HarmonicLevels | null {
  if (!pattern) return null;

  const C = pattern.points[3].price;
  const D = pattern.points[4].price;
  const move = Math.max(Math.abs(D - C), Math.abs(D) * 0.002);

  if (pattern.direction === "Bullish") {
    return {
      entry: D,
      sl: D - move * 0.75,
      tp1: D + move * 0.65,
      tp2: D + move * 1.25,
      przFrom: D - move * 0.12,
      przTo: D + move * 0.08,
    };
  }

  return {
    entry: D,
    sl: D + move * 0.75,
    tp1: D - move * 0.65,
    tp2: D - move * 1.25,
    przFrom: D - move * 0.08,
    przTo: D + move * 0.12,
  };
}

function makeVirtualResult(
  symbol: SymbolKey,
  tf: TF,
  name: PatternName,
  direction: Direction
): ScanResult {
  const profile = PATTERN_PROFILE[name];
  return {
    id: `virtual-${symbol}-${tf}-${name}-${direction}`,
    symbol,
    tf,
    name,
    direction,
    score: profile.score,
    age: "teraz",
  };
}

function SelectBox({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative rounded-xl border border-[#0d579e] bg-[#041b36] px-3 py-2">
      <div className="text-[8px] text-sky-100/40">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full appearance-none bg-transparent pr-7 text-[11px] font-semibold text-white outline-none"
      >
        {options.map((x) => (
          <option key={x} value={x} className="bg-[#041b36] text-white">
            {x}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 text-sky-100/40" />
    </label>
  );
}

export default function HarmonicScannerPage() {
  const [instrument, setInstrument] = React.useState<SymbolKey>("XAUUSD");
  const [tf, setTf] = React.useState<TF>("M15");
  const [formacja, setFormacja] = React.useState<PatternName>("Gartley");
  const [direction, setDirection] = React.useState<Direction>("Bullish");
  const [scanning, setScanning] = React.useState(false);
  const [scanMessage, setScanMessage] = React.useState<string | null>(null);
  const [autoScanning, setAutoScanning] = React.useState(false);
  const [autoProgress, setAutoProgress] = React.useState({
    done: 0,
    total: AUTO_SCAN_SYMBOLS.length * AUTO_SCAN_TFS.length,
  });
  const autoMatchCacheRef = React.useRef<Map<string, AutoScanMatch>>(new Map());

  // IMPORTANT: chart has its own active setup and never falls back to old XAUUSD.
  const [activeSetup, setActiveSetup] = React.useState<ScanResult>(
    DEFAULT_RESULTS[0]
  );
  const [results, setResults] = React.useState<ScanResult[]>([]);

  const changeInstrument = (value: SymbolKey) => {
    setInstrument(value);
    setResults([]);
    setScanMessage(null);
    setActiveSetup(makeVirtualResult(value, tf, formacja, direction));
  };

  const changeTf = (value: TF) => {
    setTf(value);
    setResults([]);
    setScanMessage(null);
    setActiveSetup(makeVirtualResult(instrument, value, formacja, direction));
  };

  const changePattern = (value: PatternName) => {
    setFormacja(value);
    setResults([]);
    setScanMessage(null);
    setActiveSetup(makeVirtualResult(instrument, tf, value, direction));
  };

  const changeDirection = (value: Direction) => {
    setDirection(value);
    setResults([]);
    setScanMessage(null);
    setActiveSetup(makeVirtualResult(instrument, tf, formacja, value));
  };

  const scan = async () => {
    setScanning(true);
    setChartError(null);

    try {
      const liveCandles = await fetchLiveCandles(instrument, tf);
      setCandles(liveCandles);
      setLastLiveUpdate(new Date());

      const matches = detectHarmonicPatterns(
        liveCandles,
        formacja,
        direction
      );

      if (!matches.length) {
        setResults([]);
        setActiveSetup(
          makeVirtualResult(instrument, tf, formacja, direction)
        );
        setScanMessage(
          `Nie znaleziono aktywnej formacji ${formacja} ${direction} na ${instrument} ${tf}.`
        );
        return;
      }

      const best = matches[0];
      const dTime = Number(best.pattern.points[4].time);
      const ageSeconds = Math.max(
        0,
        Math.floor(Date.now() / 1000) - dTime
      );

      const age =
        ageSeconds < 3600
          ? `${Math.max(1, Math.round(ageSeconds / 60))}m temu`
          : `${Math.max(1, Math.round(ageSeconds / 3600))}h temu`;

      const found: ScanResult = {
        id: `live-${instrument}-${tf}-${formacja}-${direction}-${dTime}`,
        symbol: instrument,
        tf,
        name: formacja,
        direction,
        score: best.score,
        age,
      };

      setResults([found]);
      setActiveSetup(found);
      setScanMessage(
        `Znaleziono ${formacja} ${direction} â€¢ jakoÅ›Ä‡ ${best.score}%`
      );
    } catch (error) {
      setResults([]);
      setScanMessage(null);
      setChartError(
        error instanceof Error
          ? error.message
          : "Nie udaÅ‚o siÄ™ wykonaÄ‡ skanowania."
      );
    } finally {
      setScanning(false);
    }
  };


  const formatAgeFromTime = (time: UTCTimestamp) => {
    const ageSeconds = Math.max(
      0,
      Math.floor(Date.now() / 1000) - Number(time)
    );

    if (ageSeconds < 3600) {
      return `${Math.max(1, Math.round(ageSeconds / 60))}m temu`;
    }

    return `${Math.max(1, Math.round(ageSeconds / 3600))}h temu`;
  };

  const autoScan = async () => {
    setAutoScanning(true);
    setScanning(false);
    setChartError(null);
    setScanMessage("AUTO SCAN uruchomiony â€” analizujÄ™ wszystkie instrumenty i timeframe'y...");
    setAutoProgress({
      done: 0,
      total: AUTO_SCAN_SYMBOLS.length * AUTO_SCAN_TFS.length,
    });

    const allMatches: AutoScanMatch[] = [];
    autoMatchCacheRef.current.clear();

    try {
      let done = 0;

      // Fetch one candle series per symbol/timeframe, then test all
      // supported patterns/directions locally. This keeps API usage much lower
      // than making a separate Twelve Data request for every pattern.
      for (const symbol of AUTO_SCAN_SYMBOLS) {
        for (const scanTf of AUTO_SCAN_TFS) {
          try {
            const liveCandles = await fetchLiveCandles(symbol, scanTf);

            for (const name of AUTO_SCAN_PATTERNS) {
              for (const scanDirection of AUTO_SCAN_DIRECTIONS) {
                const matches = detectHarmonicPatterns(
                  liveCandles,
                  name,
                  scanDirection
                );

                const best = matches[0];
                if (!best) continue;

                // Quality gate for AUTO SCAN. Lower this if you want more,
                // but weaker, setups in the result list.
                if (best.score < 70) continue;

                const levels = makeLevels(best.pattern);
                const dTime = best.pattern.points[4].time;
                const id = `auto-${symbol}-${scanTf}-${name}-${scanDirection}-${Number(dTime)}`;

                const result: AutoScanMatch = {
                  id,
                  symbol,
                  tf: scanTf,
                  name,
                  direction: scanDirection,
                  score: best.score,
                  age: formatAgeFromTime(dTime),
                  pattern: best.pattern,
                  candles: liveCandles,
                  levels,
                };

                allMatches.push(result);
                autoMatchCacheRef.current.set(id, result);
              }
            }
          } catch (error) {
            console.warn(`AUTO SCAN failed for ${symbol} ${scanTf}`, error);
          } finally {
            done += 1;
            setAutoProgress({
              done,
              total: AUTO_SCAN_SYMBOLS.length * AUTO_SCAN_TFS.length,
            });
          }
        }
      }

      // Deduplicate by symbol/TF/pattern/direction and rank by quality,
      // then by recency of D.
      const deduped = Array.from(
        new Map(
          allMatches.map((m) => [
            `${m.symbol}|${m.tf}|${m.name}|${m.direction}`,
            m,
          ])
        ).values()
      ).sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (
          Number(b.pattern.points[4].time) -
          Number(a.pattern.points[4].time)
        );
      });

      setResults(deduped);

      if (!deduped.length) {
        setScanMessage(
          "AUTO SCAN zakoÅ„czony â€” brak aktywnych formacji 70%+ w aktualnie zeskanowanych rynkach."
        );
        return;
      }

      const best = deduped[0];
      setInstrument(best.symbol);
      setTf(best.tf);
      setFormacja(best.name);
      setDirection(best.direction);
      setActiveSetup(best);
      setCandles(best.candles);
      setLastLiveUpdate(new Date());
      setScanMessage(
        `AUTO SCAN: znaleziono ${deduped.length} aktywnych formacji. Najlepsza: ${best.symbol} ${best.tf} ${best.name} ${best.direction} â€¢ ${best.score}%`
      );
    } finally {
      setAutoScanning(false);
    }
  };

  const chooseResult = (r: ScanResult) => {
    setInstrument(r.symbol);
    setTf(r.tf);
    setFormacja(r.name);
    setDirection(r.direction);
    setActiveSetup(r);

    const cached = autoMatchCacheRef.current.get(r.id);
    if (cached) {
      setCandles(cached.candles);
      setLastLiveUpdate(new Date());
    }
  };

  const [candles, setCandles] = React.useState<CandlestickData[]>([]);
  const [chartLoading, setChartLoading] = React.useState(true);
  const [chartError, setChartError] = React.useState<string | null>(null);
  const [lastLiveUpdate, setLastLiveUpdate] = React.useState<Date | null>(null);

  const loadCandles = React.useCallback(
    async (signal?: AbortSignal, silent = false) => {
      if (!silent) setChartLoading(true);

      try {
        const next = await fetchLiveCandles(
          activeSetup.symbol,
          activeSetup.tf,
          signal
        );

        if (!next.length) {
          throw new Error("Brak Å›wiec dla wybranego instrumentu i interwaÅ‚u.");
        }

        setCandles(next);
        setChartError(null);
        setLastLiveUpdate(new Date());
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return;
        setChartError(
          error instanceof Error ? error.message : "BÅ‚Ä…d pobierania danych."
        );
      } finally {
        if (!silent) setChartLoading(false);
      }
    },
    [activeSetup.symbol, activeSetup.tf]
  );

  React.useEffect(() => {
    const controller = new AbortController();
    void loadCandles(controller.signal);

    // Live candle refresh. 5 s is responsive enough for the UI while avoiding
    // excessive REST requests. Increase to 10â€“15 s if your plan has a low API limit.
    const interval = window.setInterval(() => {
      void loadCandles(controller.signal, true);
    }, 5000);

    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [loadCandles]);

  const pattern = React.useMemo(() => {
    if (!candles.length || !results.length) return null;

    const cached = autoMatchCacheRef.current.get(activeSetup.id);
    if (cached) return cached.pattern;

    return buildPattern(candles, activeSetup);
  }, [candles, activeSetup, results.length]);

  const levels = React.useMemo(
    () => makeLevels(pattern),
    [pattern]
  );

  const activeRows = React.useMemo(() => {
    return results.map((setup) => {
      const cached = autoMatchCacheRef.current.get(setup.id);

      if (cached?.levels) {
        const rowLevels = cached.levels;
        const rr =
          Math.abs(rowLevels.entry - rowLevels.sl) > 0
            ? Math.abs(rowLevels.tp2 - rowLevels.entry) /
              Math.abs(rowLevels.entry - rowLevels.sl)
            : 0;

        return {
          ...setup,
          entry: rowLevels.entry,
          sl: rowLevels.sl,
          tp1: rowLevels.tp1,
          tp2: rowLevels.tp2,
          rr,
        };
      }

      if (setup.id === activeSetup.id && levels) {
        const rr =
          Math.abs(levels.entry - levels.sl) > 0
            ? Math.abs(levels.tp2 - levels.entry) /
              Math.abs(levels.entry - levels.sl)
            : 0;

        return {
          ...setup,
          entry: levels.entry,
          sl: levels.sl,
          tp1: levels.tp1,
          tp2: levels.tp2,
          rr,
        };
      }

      return {
        ...setup,
        entry: 0,
        sl: 0,
        tp1: 0,
        tp2: 0,
        rr: 0,
      };
    });
  }, [results, activeSetup.id, levels]);

  const formatPrice = (symbol: SymbolKey, value: number) => {
    if (symbol === "EURUSD" || symbol === "GBPUSD") return value.toFixed(5);
    if (symbol === "USDJPY") return value.toFixed(3);
    return value.toFixed(2);
  };

  return (
    <main className="min-h-screen bg-[#03172f] text-white">
      <div className="mx-auto max-w-[1980px] space-y-3 px-3 py-4">
        <section className="rounded-2xl border border-[#0d579e] bg-[linear-gradient(145deg,#082d59,#041f40)] p-4">
          <div className="text-[9px] font-semibold uppercase tracking-[.18em] text-cyan-300/70">
            FX TRADE / SKANER RYNKU
          </div>
          <h1 className="mt-1 text-[28px] font-bold">Harmonic Scanner</h1>
          <p className="mt-1 text-[10px] text-sky-100/45">
            Wybierz instrument, TF, formacjÄ™ i kierunek. SKANUJ pobiera realne Å›wiece Twelve Data i pokazuje X-A-B-C-D tylko wtedy, gdy ukÅ‚ad speÅ‚nia reguÅ‚y harmoniczne.
          </p>
        </section>

        <section className="grid gap-2 rounded-2xl border border-[#0d579e] bg-[#061426] p-3 xl:grid-cols-[1fr_1fr_1fr_1.05fr_1.1fr_1.15fr]">
          <SelectBox
            label="Instrument"
            value={instrument}
            options={["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "US30"]}
            onChange={(v) => changeInstrument(v as SymbolKey)}
          />

          <SelectBox
            label="Timeframe"
            value={tf}
            options={["M5", "M15", "H1", "H4"]}
            onChange={(v) => changeTf(v as TF)}
          />

          <SelectBox
            label="Formacja"
            value={formacja}
            options={["Gartley", "Bat", "Butterfly", "Crab", "Shark"]}
            onChange={(v) => changePattern(v as PatternName)}
          />

          <button
            onClick={scan}
            disabled={scanning}
            className="flex items-center justify-center gap-2 rounded-xl bg-[linear-gradient(90deg,#0ea5e9,#7c3aed)] px-4 py-3 text-[11px] font-black disabled:opacity-60"
          >
            {scanning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {scanning ? "SKANOWANIE..." : "SKANUJ"}
          </button>


          <button
            onClick={autoScan}
            disabled={autoScanning}
            className="relative overflow-hidden rounded-xl border border-emerald-400/25 bg-[linear-gradient(90deg,rgba(16,185,129,.20),rgba(6,182,212,.18))] px-4 py-3 text-[11px] font-black text-emerald-200 disabled:opacity-60"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {autoScanning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              {autoScanning ? "AUTO SCAN..." : "AUTO SCAN"}
            </span>

            {autoScanning ? (
              <span
                className="absolute bottom-0 left-0 h-[2px] bg-emerald-400 transition-all"
                style={{
                  width: `${Math.round(
                    (autoProgress.done / Math.max(1, autoProgress.total)) * 100
                  )}%`,
                }}
              />
            ) : null}
          </button>

          <div className="rounded-xl border border-[#0d579e] bg-[#041b36] px-3 py-2">
            <div className="text-[8px] text-sky-100/40">Kierunek</div>
            <div className="mt-2 flex gap-2">
              {(["Bullish", "Bearish"] as Direction[]).map((value) => (
                <button
                  key={value}
                  onClick={() => changeDirection(value)}
                  className={`rounded-lg border px-3 py-1.5 text-[8px] ${
                    value === "Bullish"
                      ? "border-emerald-400/25 text-emerald-400"
                      : "border-rose-400/25 text-rose-400"
                  } ${direction === value ? "bg-white/10" : ""}`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        </section>

        {scanMessage ? (
          <div
            className={`rounded-xl border px-3 py-2 text-[9px] font-semibold ${
              results.length
                ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                : "border-amber-400/20 bg-amber-500/10 text-amber-200"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span>{scanMessage}</span>
              {autoScanning ? (
                <span className="whitespace-nowrap text-[8px] text-cyan-200">
                  {autoProgress.done}/{autoProgress.total} rynkÃ³w
                </span>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Wider chart: 190px left + huge middle + 220px right */}
        <section className="grid gap-3 xl:grid-cols-[230px_minmax(0,1fr)_220px]">
          <aside className="rounded-2xl border border-[#0d579e] bg-[#061426] p-3">
            <h2 className="text-[12px] font-bold">
              Znalezione ({results.length})
            </h2>

            <div className="mt-3 max-h-[610px] space-y-2 overflow-y-auto pr-1">
              {!results.length ? (
                <div className="rounded-xl border border-dashed border-[#0d579e] bg-[#041b36]/50 p-4 text-center text-[8px] text-sky-100/40">
                  Kliknij SKANUJ. Wynik pojawi siÄ™ tylko wtedy, gdy prawdziwe Å›wiece speÅ‚niÄ… proporcje wybranej formacji.
                </div>
              ) : null}

              {results.map((r) => (
                <button
                  key={r.id}
                  onClick={() => chooseResult(r)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    activeSetup.id === r.id
                      ? "border-cyan-400/55 bg-cyan-400/[0.07]"
                      : "border-[#0d579e] bg-[#041b36] hover:bg-[#062851]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Star className="h-3.5 w-3.5 text-slate-500" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[7px] text-slate-500">
                        {r.symbol} Â· {r.tf}
                      </div>
                      <div className="text-[10px] font-bold">{r.name}</div>
                      <div
                        className={`text-[8px] font-semibold ${
                          r.direction === "Bullish"
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {r.direction}
                      </div>
                    </div>
                    <div className="rounded-md bg-emerald-500/15 px-1.5 py-1 text-[9px] font-bold text-emerald-300">
                      {r.score}%
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <div className="relative min-w-0">
            <div className="pointer-events-none absolute left-4 top-3 z-20 flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-[#03172f]/85 px-2.5 py-1.5 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-[8px] font-bold uppercase tracking-[.12em] text-emerald-300">
                Twelve Data Live
              </span>
              {lastLiveUpdate ? (
                <span className="text-[7px] text-sky-100/35">
                  {lastLiveUpdate.toLocaleTimeString("pl-PL")}
                </span>
              ) : null}
            </div>

            {chartLoading && candles.length === 0 ? (
              <div className="flex h-[675px] items-center justify-center rounded-2xl border border-[#0d579e] bg-[#061426]">
                <div className="flex items-center gap-2 text-[10px] text-sky-100/60">
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                  Åadowanie Å›wiec LIVE...
                </div>
              </div>
            ) : chartError && candles.length === 0 ? (
              <div className="flex h-[675px] flex-col items-center justify-center gap-3 rounded-2xl border border-rose-500/25 bg-[#061426] px-6 text-center">
                <div className="text-[11px] font-bold text-rose-300">
                  Brak danych z Twelve Data
                </div>
                <div className="max-w-md text-[8px] text-sky-100/45">
                  {chartError}
                </div>
                <button
                  onClick={() => void loadCandles(undefined)}
                  className="rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-[8px] font-bold text-cyan-300"
                >
                  SprÃ³buj ponownie
                </button>
              </div>
            ) : (
              <HarmonicChart
                key={`${activeSetup.symbol}-${activeSetup.tf}`}
                symbol={activeSetup.symbol}
                tf={activeSetup.tf}
                candles={candles}
                pattern={pattern}
                levels={levels}
                height={675}
              />
            )}

            {chartError && candles.length > 0 ? (
              <div className="absolute bottom-3 right-3 z-20 rounded-lg border border-amber-400/20 bg-[#03172f]/90 px-2.5 py-1.5 text-[7px] text-amber-200 backdrop-blur">
                LIVE chwilowo niedostÄ™pne â€” pokazujÄ™ ostatnie poprawne Å›wiece.
              </div>
            ) : null}
          </div>

          <aside className="rounded-2xl border border-[#0d579e] bg-[#061426] p-4">
            <h2 className="text-[12px] font-bold">SzczegÃ³Å‚y</h2>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-[16px] font-bold text-fuchsia-400">
                {activeSetup.name}
              </div>
              <span
                className={`text-[9px] font-bold ${
                  activeSetup.direction === "Bullish"
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
              >
                {activeSetup.direction}
              </span>
            </div>

            <div className="mt-2 text-[8px] text-slate-500">
              {activeSetup.symbol} Â· {activeSetup.tf}
            </div>

            {pattern ? (
              <div className="mt-4 rounded-xl border border-[#0d579e] bg-[#041b36] p-3">
                <div className="text-[9px] font-bold">
                  Swing high / low X-A-B-C-D
                </div>

                <div className="mt-3 space-y-2">
                  {pattern.points.map((p) => (
                    <div key={p.label} className="flex justify-between text-[8px]">
                      <span className="text-slate-500">
                        {p.label} Â· candle {p.index}
                      </span>
                      <span className="font-semibold">
                        {p.price.toFixed(4)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 border-t border-[#0d579e] pt-3 text-[8px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">AB/XA</span>
                    <span>{pattern.ratios.AB_XA.toFixed(3)}</span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span className="text-slate-500">BC/AB</span>
                    <span>{pattern.ratios.BC_AB.toFixed(3)}</span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span className="text-slate-500">CD/BC</span>
                    <span>{pattern.ratios.CD_BC.toFixed(3)}</span>
                  </div>
                </div>
              </div>
            ) : null}

            {levels ? (
              <div className="mt-4 space-y-2 border-t border-[#0d579e] pt-4">
                {[
                  ["Entry", levels.entry, "text-sky-300"],
                  ["SL", levels.sl, "text-rose-300"],
                  ["TP1", levels.tp1, "text-emerald-300"],
                  ["TP2", levels.tp2, "text-emerald-300"],
                ].map(([a, b, c]) => (
                  <div
                    key={String(a)}
                    className="flex items-center justify-between text-[8px]"
                  >
                    <span className="text-sky-100/45">{String(a)}</span>
                    <span className={`font-bold ${String(c)}`}>
                      {Number(b).toFixed(4)}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-4 border-t border-[#0d579e] pt-4">
              <div className="grid grid-cols-2 gap-2">
                {["Swing X", "Swing A", "Swing B", "Swing C", "Swing D", "PRZ"].map(
                  (x) => (
                    <div
                      key={x}
                      className="flex items-center gap-1.5 text-[7px] text-slate-300"
                    >
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      {x}
                    </div>
                  )
                )}
              </div>
            </div>

            <button
              disabled={!pattern || !levels}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(90deg,#0ea5e9,#7c3aed)] px-4 py-3 text-[10px] font-black disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Zap className="h-4 w-4" />
              {pattern ? "Trade Setup" : "Brak aktywnej formacji"}
            </button>
          </aside>
        </section>

        {/* ACTIVE HARMONIC FORMATIONS */}
        <section className="overflow-hidden rounded-2xl border border-[#0d579e] bg-[#061426]">
          <div className="flex flex-col gap-2 border-b border-[#0d579e] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[12px] font-bold">
                Aktywne formacje harmoniczne ({activeRows.length})
              </h2>
              <p className="mt-1 text-[8px] text-sky-100/40">
                Aktualne setupy z PRZ, SL, TP i RRR. Kliknij wiersz, aby otworzyÄ‡ formacjÄ™ na wykresie.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1.5 text-[8px] font-semibold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                LIVE SETUPS
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-left">
              <thead className="bg-[#071c35] text-[7px] uppercase tracking-[.06em] text-sky-100/35">
                <tr>
                  {[
                    "Instrument",
                    "TF",
                    "Formacja",
                    "Kierunek",
                    "TrafnoÅ›Ä‡",
                    "Wiek",
                    "WejÅ›cie / PRZ",
                    "SL",
                    "TP1",
                    "TP2",
                    "RRR",
                    "Status",
                  ].map((head) => (
                    <th key={head} className="px-4 py-3 font-semibold">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {activeRows.map((row) => (
                  <tr
                    key={`active-${row.id}`}
                    onClick={() => chooseResult(row)}
                    className={`cursor-pointer border-t border-[#0d579e]/70 text-[8px] transition hover:bg-cyan-400/[0.05] ${
                      activeSetup.id === row.id ? "bg-cyan-400/[0.06]" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-bold text-white">
                      {row.symbol}
                    </td>

                    <td className="px-4 py-3 text-sky-100/65">
                      {row.tf}
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-bold text-fuchsia-400">
                        {row.name}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`font-bold ${
                          row.direction === "Bullish"
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {row.direction}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="rounded-md bg-emerald-500/10 px-2 py-1 font-bold text-emerald-300">
                        {row.score}%
                      </span>
                    </td>

                    <td className="px-4 py-3 text-sky-100/55">
                      {row.age}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-sky-300">
                        {formatPrice(row.symbol, row.entry)}
                      </div>
                      <div className="mt-0.5 text-[7px] text-sky-100/35">
                        PRZ / Entry
                      </div>
                    </td>

                    <td className="px-4 py-3 font-semibold text-rose-300">
                      {formatPrice(row.symbol, row.sl)}
                    </td>

                    <td className="px-4 py-3 font-semibold text-emerald-300">
                      {formatPrice(row.symbol, row.tp1)}
                    </td>

                    <td className="px-4 py-3 font-semibold text-emerald-300">
                      {formatPrice(row.symbol, row.tp2)}
                    </td>

                    <td className="px-4 py-3 font-bold text-white">
                      1:{row.rr.toFixed(1)}
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.7)]" />
                        Aktywna
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

