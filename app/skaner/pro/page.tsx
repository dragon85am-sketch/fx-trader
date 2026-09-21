"use client";

import React from "react";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Circle,
  Clock3,
  Crosshair,
  Loader2,
  Maximize2,
  Minimize2,
  RefreshCw,
  Search,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";

import type {
  CandlestickData,
  UTCTimestamp,
} from "lightweight-charts";

import AlphaPriceChart from "@/components/AlphaPriceChart";

import {
  scanGoldUs30,
  type ScannerCandle,
  type ScannerResult,
  type ScannerSymbol,
} from "@/lib/scanners/goldUs30Scanner";

// ======================================================
// LIVE-RATES US30 + XAUUSD TYPES
// ======================================================

type TwelveValue = {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume?: string;
};

type TwelveResponse = {
  values?: TwelveValue[];
  status?: string;
  message?: string;
  error?: string;
  code?: number;
};

// ======================================================
// MARKET STATE
// ======================================================

type MarketState = {
  symbol: ScannerSymbol;

  scanner: ScannerResult | null;

  m1: ScannerCandle[];
  m5: ScannerCandle[];

  chartCandles: CandlestickData[];

  loading: boolean;

  error: string | null;

  updatedAt: Date | null;
};

// ======================================================
// LIVE-RATES US30 + XAUUSD SYMBOLS
// ======================================================

const TWELVE_SYMBOLS: Record<ScannerSymbol, string> = {
  XAUUSD: "XAU/USD",

  // Jeśli FX Trade Candle Engine / Live-Rates nie zaakceptuje DJI,
  // zmienimy później tylko ten ticker.
  US30: "DJI",
};

// ======================================================
// INITIAL STATE
// ======================================================

function createEmptyMarket(
  symbol: ScannerSymbol,
): MarketState {
  return {
    symbol,

    scanner: null,

    m1: [],
    m5: [],

    chartCandles: [],

    loading: false,

    error: null,

    updatedAt: null,
  };
}

// ======================================================
// LIVE-RATES US30 + XAUUSD -> SCANNER
// ======================================================

function toScannerCandles(
  values: TwelveValue[],
): ScannerCandle[] {
  return values
    .map((item) => ({
      datetime: item.datetime,

      open: Number(item.open),
      high: Number(item.high),
      low: Number(item.low),
      close: Number(item.close),

      volume:
        item.volume !== undefined
          ? Number(item.volume)
          : undefined,
    }))
    .filter(
      (item) =>
        Number.isFinite(item.open) &&
        Number.isFinite(item.high) &&
        Number.isFinite(item.low) &&
        Number.isFinite(item.close),
    )
    .sort((a, b) =>
      a.datetime.localeCompare(
        b.datetime,
      ),
    );
}

// ======================================================
// DATETIME -> LIGHTWEIGHT CHARTS
// ======================================================

const DISPLAY_TIME_ZONE = "Europe/Amsterdam";

function getTimeZoneParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
    second: value("second"),
  };
}

function wallClockToUtcMs(datetime: string, sourceTimeZone: string): number {
  const [datePart, timePart = "00:00:00"] = datetime.split(" ");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour = 0, minute = 0, second = 0] = timePart.split(":").map(Number);

  const wantedWallClock = Date.UTC(year, month - 1, day, hour, minute, second);
  let instant = wantedWallClock;

  // Two passes are enough to resolve the timezone/DST offset for the instant.
  for (let i = 0; i < 2; i += 1) {
    const parts = getTimeZoneParts(new Date(instant), sourceTimeZone);
    const representedWallClock = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );
    instant += wantedWallClock - representedWallClock;
  }

  return instant;
}

function toDisplayTimestamp(
  datetime: string,
  sourceTimeZone: "UTC" | "America/New_York",
): UTCTimestamp {
  const instantMs =
    sourceTimeZone === "UTC"
      ? (() => {
          const [datePart, timePart = "00:00:00"] = datetime.split(" ");
          const [year, month, day] = datePart.split("-").map(Number);
          const [hour = 0, minute = 0, second = 0] = timePart.split(":").map(Number);
          return Date.UTC(year, month - 1, day, hour, minute, second);
        })()
      : wallClockToUtcMs(datetime, sourceTimeZone);

  // Lightweight Charts renders UTCTimestamp labels in UTC. Shift the epoch to
  // the Amsterdam wall-clock value so the axis shows the user's market clock.
  // Intl resolves CET/CEST automatically, so DST changes do not need +1/+2 hacks.
  const local = getTimeZoneParts(new Date(instantMs), DISPLAY_TIME_ZONE);
  const displayMs = Date.UTC(
    local.year,
    local.month - 1,
    local.day,
    local.hour,
    local.minute,
    local.second,
  );

  return Math.floor(displayMs / 1000) as UTCTimestamp;
}

// ======================================================
// LIVE-RATES US30 + XAUUSD -> CHART
// ======================================================

function toChartCandles(
  values: TwelveValue[],
  symbol: ScannerSymbol,
): CandlestickData[] {
  const sourceTimeZone = "UTC";

  return values
    .map((item) => ({
      time: toDisplayTimestamp(
        item.datetime,
        sourceTimeZone,
      ),

      open: Number(item.open),
      high: Number(item.high),
      low: Number(item.low),
      close: Number(item.close),
    }))
    .filter(
      (item) =>
        Number.isFinite(item.open) &&
        Number.isFinite(item.high) &&
        Number.isFinite(item.low) &&
        Number.isFinite(item.close),
    )
    .sort(
      (a, b) =>
        Number(a.time) -
        Number(b.time),
    );
}

// ======================================================
// FETCH LIVE-RATES US30 + XAUUSD
// ======================================================

async function fetchCandles(
  symbol: ScannerSymbol,
  interval: "1min" | "5min",
  outputsize: number,
): Promise<TwelveValue[]> {
  // US30 and XAUUSD use our shared FX Trade candle engine fed by Live-Rates.
  const routeSymbol = symbol === "XAUUSD" ? "xauusd" : "us30";

  const params = new URLSearchParams({
    interval,
    limit: String(outputsize),
  });

  const response = await fetch(`/api/${routeSymbol}/candles?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  let data: TwelveResponse & { warmup?: boolean };

  try {
    data = (await response.json()) as TwelveResponse & { warmup?: boolean };
  } catch {
    throw new Error(`${symbol} ${interval}: FX Trade candle engine zwrócił invalid JSON`);
  }

  if (!response.ok || data?.status === "error" || !Array.isArray(data?.values)) {
    throw new Error(
      data?.message ||
        data?.error ||
        `${symbol} ${interval}: FX Trade candle engine nie ma jeszcze danych`,
    );
  }

  if (data.values.length === 0) {
    throw new Error(`${symbol} ${interval}: candle engine rozgrzewa historię`);
  }

  return data.values;
}

// ======================================================
// FORMAT PRICE
// ======================================================

function formatPrice(
  value: number | undefined,
  symbol: ScannerSymbol,
) {
  if (
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return value.toLocaleString(
    "en-US",
    {
      minimumFractionDigits:
        symbol === "US30"
          ? 1
          : 2,

      maximumFractionDigits:
        symbol === "US30"
          ? 1
          : 2,
    },
  );
}

// ======================================================
// SCORE
// ======================================================

function ScoreCircle({
  score,
}: {
  score: number;
}) {
  let className =
    "border-slate-600/50 bg-slate-500/5 text-sky-100/70";

  if (score >= 90) {
    className =
      "border-emerald-400/70 bg-emerald-500/10 text-emerald-300";
  } else if (score >= 80) {
    className =
      "border-cyan-400/70 bg-cyan-500/10 text-cyan-300";
  } else if (score >= 60) {
    className =
      "border-amber-400/70 bg-amber-500/10 text-amber-300";
  }

  return (
    <div
      className={`flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-full border-[4px] ${className}`}
    >
      <div className="text-center">
        <div className="text-sm font-black">
          {score}
        </div>

        <div className="text-[8px] font-bold opacity-60">
          SCORE
        </div>
      </div>
    </div>
  );
}

// ======================================================
// STATUS BADGE
// ======================================================

function StatusBadge({
  status,
}: {
  status: ScannerResult["status"];
}) {
  let className =
    "border-slate-500/20 bg-slate-500/5 text-sky-100/70";

  if (status === "A+ SETUP") {
    className =
      "border-emerald-400/25 bg-emerald-500/10 text-emerald-300";
  } else if (status === "READY") {
    className =
      "border-cyan-400/25 bg-cyan-500/10 text-cyan-300";
  } else if (
    status === "FORMING"
  ) {
    className =
      "border-amber-400/25 bg-amber-500/10 text-amber-300";
  }

  return (
    <span
      className={`inline-flex rounded-lg border px-2.5 py-1 text-[9px] font-black tracking-wide ${className}`}
    >
      {status}
    </span>
  );
}

// ======================================================
// CONFIRMATION CARD
// ======================================================

function ConfirmationCard({
  number,
  title,
  active,
  description,
  points,
}: {
  number: string;
  title: string;
  active: boolean;
  description: string;
  points: string;
}) {
  return (
    <div
      className={`rounded-[18px] border p-4 transition ${
        active
          ? "border-emerald-400/25 bg-[linear-gradient(145deg,#222a34,#142334)]"
          : "border-slate-300/15 bg-[linear-gradient(145deg,#131f2e,#111d2b)]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg border text-[10px] font-black ${
              active
                ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                : "border-white/10 bg-white/[0.03] text-sky-100/55"
            }`}
          >
            {number}
          </div>

          <div>
            <div className="text-[11px] font-black text-white">
              {title}
            </div>

            <div className="mt-1 text-[9px] text-sky-200/45">
              {points}
            </div>
          </div>
        </div>

        {active ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
        ) : (
          <Circle className="h-4 w-4 text-sky-200/30" />
        )}
      </div>

      <p className="mt-4 min-h-[34px] text-[10px] leading-[17px] text-sky-100/55">
        {description}
      </p>
    </div>
  );
}

// ======================================================
// LEVEL BOX
// ======================================================

function LevelBox({
  label,
  value,
  symbol,
}: {
  label: string;

  value: number | undefined;

  symbol: ScannerSymbol;
}) {
  return (
    <div className="rounded-xl border border-slate-300/15 bg-[#162536]/85 px-3 py-3">
      <div className="text-[8px] font-bold uppercase tracking-wider text-sky-200/45">
        {label}
      </div>

      <div className="mt-1.5 font-mono text-[12px] font-bold text-white/90">
        {formatPrice(
          value,
          symbol,
        )}
      </div>
    </div>
  );
}


// ======================================================
// MTF TECHNICAL MATRIX
// ======================================================

type MatrixState = "BULL" | "BEAR" | "NEUTRAL";

type MatrixRow = {
  tf: string;
  state: MatrixState;
  wt1: number | null;
  mfi: number | null;
  signal: "BUY" | "SELL" | "WAIT";
};

type TechMatrix = {
  rows: MatrixRow[];
  bullCount: number;
  bearCount: number;
  adx: number | null;
  emaBullish: boolean | null;
  momentum: number | null;
  atr: number | null;
};

function ema(values: number[], period: number): number | null {
  if (values.length < period) return null;

  const k = 2 / (period + 1);
  let value = values.slice(0, period).reduce((sum, item) => sum + item, 0) / period;

  for (let i = period; i < values.length; i += 1) {
    value = values[i] * k + value * (1 - k);
  }

  return value;
}

function aggregateCandles(
  candles: ScannerCandle[],
  groupSize: number,
): ScannerCandle[] {
  if (groupSize <= 1) return candles;

  const result: ScannerCandle[] = [];

  for (let i = 0; i + groupSize <= candles.length; i += groupSize) {
    const group = candles.slice(i, i + groupSize);
    const first = group[0];
    const last = group[group.length - 1];

    result.push({
      datetime: last.datetime,
      open: first.open,
      high: Math.max(...group.map((item) => item.high)),
      low: Math.min(...group.map((item) => item.low)),
      close: last.close,
      volume: group.reduce(
        (sum, item) => sum + (Number.isFinite(item.volume) ? Number(item.volume) : 0),
        0,
      ),
    });
  }

  return result;
}

function calcAtr(candles: ScannerCandle[], period = 14): number | null {
  if (candles.length < period + 1) return null;

  const trs: number[] = [];

  for (let i = 1; i < candles.length; i += 1) {
    const current = candles[i];
    const previous = candles[i - 1];
    trs.push(
      Math.max(
        current.high - current.low,
        Math.abs(current.high - previous.close),
        Math.abs(current.low - previous.close),
      ),
    );
  }

  const recent = trs.slice(-period);
  return recent.reduce((sum, value) => sum + value, 0) / recent.length;
}

function calcRsi(values: number[], period = 14): number | null {
  if (values.length < period + 1) return null;

  let gains = 0;
  let losses = 0;

  for (let i = values.length - period; i < values.length; i += 1) {
    const change = values[i] - values[i - 1];
    if (change >= 0) gains += change;
    else losses += Math.abs(change);
  }

  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

function calcMfi(candles: ScannerCandle[], period = 14): number | null {
  if (candles.length < period + 1) return null;

  let positive = 0;
  let negative = 0;

  for (let i = candles.length - period; i < candles.length; i += 1) {
    const current = candles[i];
    const previous = candles[i - 1];
    const currentTypical = (current.high + current.low + current.close) / 3;
    const previousTypical = (previous.high + previous.low + previous.close) / 3;
    const volume =
      Number.isFinite(current.volume) && Number(current.volume) > 0
        ? Number(current.volume)
        : 1;
    const flow = currentTypical * volume;

    if (currentTypical >= previousTypical) positive += flow;
    else negative += flow;
  }

  if (negative === 0) return 100;
  const ratio = positive / negative;
  return 100 - 100 / (1 + ratio);
}

function calcWaveTrend(candles: ScannerCandle[]): number | null {
  if (candles.length < 30) return null;

  const typical = candles.map((item) => (item.high + item.low + item.close) / 3);
  const esa = ema(typical, 10);
  if (esa === null) return null;

  const deviations = typical.map((value) => Math.abs(value - esa));
  const d = ema(deviations, 10);
  if (d === null || d === 0) return null;

  const ci = typical.map((value) => (value - esa) / (0.015 * d));
  return ema(ci, 21);
}

function calcAdx(candles: ScannerCandle[], period = 14): number | null {
  if (candles.length < period * 2 + 1) return null;

  const tr: number[] = [];
  const plusDm: number[] = [];
  const minusDm: number[] = [];

  for (let i = 1; i < candles.length; i += 1) {
    const current = candles[i];
    const previous = candles[i - 1];

    tr.push(
      Math.max(
        current.high - current.low,
        Math.abs(current.high - previous.close),
        Math.abs(current.low - previous.close),
      ),
    );

    const upMove = current.high - previous.high;
    const downMove = previous.low - current.low;

    plusDm.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDm.push(downMove > upMove && downMove > 0 ? downMove : 0);
  }

  const dxValues: number[] = [];

  for (let end = period; end <= tr.length; end += 1) {
    const trSum = tr.slice(end - period, end).reduce((sum, value) => sum + value, 0);
    if (trSum === 0) continue;

    const plusSum = plusDm.slice(end - period, end).reduce((sum, value) => sum + value, 0);
    const minusSum = minusDm.slice(end - period, end).reduce((sum, value) => sum + value, 0);

    const plusDi = (plusSum / trSum) * 100;
    const minusDi = (minusSum / trSum) * 100;
    const denominator = plusDi + minusDi;

    if (denominator === 0) continue;
    dxValues.push((Math.abs(plusDi - minusDi) / denominator) * 100);
  }

  if (dxValues.length < period) return null;
  const recent = dxValues.slice(-period);
  return recent.reduce((sum, value) => sum + value, 0) / recent.length;
}

function buildMatrixRow(tf: string, candles: ScannerCandle[]): MatrixRow {
  const closes = candles.map((item) => item.close);
  const fast = ema(closes, 8);
  const slow = ema(closes, 21);
  const last = closes.at(-1) ?? null;
  const wt1 = calcWaveTrend(candles);
  const mfi = calcMfi(candles);

  let state: MatrixState = "NEUTRAL";

  if (last !== null && fast !== null && slow !== null) {
    if (fast > slow && last >= fast) state = "BULL";
    else if (fast < slow && last <= fast) state = "BEAR";
  }

  let signal: MatrixRow["signal"] = "WAIT";
  if (state === "BULL" && (mfi ?? 50) >= 50 && (wt1 ?? 0) >= -15) signal = "BUY";
  if (state === "BEAR" && (mfi ?? 50) <= 50 && (wt1 ?? 0) <= 15) signal = "SELL";

  return { tf, state, wt1, mfi, signal };
}

function buildTechMatrix(m1: ScannerCandle[], m5: ScannerCandle[]): TechMatrix {
  const m15 = aggregateCandles(m5, 3);
  const h1 = aggregateCandles(m5, 12);
  const h4 = aggregateCandles(m5, 48);

  const rows = [
    buildMatrixRow("4H", h4),
    buildMatrixRow("1H", h1),
    buildMatrixRow("15m", m15),
    buildMatrixRow("5m", m5),
  ];

  const bullCount = rows.filter((row) => row.state === "BULL").length;
  const bearCount = rows.filter((row) => row.state === "BEAR").length;

  const closes = m1.map((item) => item.close);
  const ema50 = ema(closes, 50);
  const ema200 = ema(closes, 200);
  const last = closes.at(-1) ?? null;

  return {
    rows,
    bullCount,
    bearCount,
    adx: calcAdx(m1),
    emaBullish:
      ema50 !== null && ema200 !== null && last !== null
        ? ema50 > ema200 && last > ema50
        : ema50 !== null && ema200 !== null && last !== null
          ? false
          : null,
    momentum:
      closes.length >= 11 && last !== null
        ? ((last - closes[closes.length - 11]) / closes[closes.length - 11]) * 100
        : null,
    atr: calcAtr(m1),
  };
}

function MatrixLight({ value }: { value: number | null }) {
  const bullish = value !== null && value >= 50;

  return (
    <span
      className={`inline-flex h-4 w-4 rounded-full border ${
        value === null
          ? "border-slate-500/30 bg-slate-500/20"
          : bullish
            ? "border-emerald-300/70 bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,.72)]"
            : "border-rose-300/70 bg-rose-500 shadow-[0_0_14px_rgba(244,63,94,.65)]"
      }`}
    />
  );
}

function TechnicalMatrix({ matrix }: { matrix: TechMatrix }) {
  const totalSignal = Math.max(matrix.bullCount, matrix.bearCount);

  return (
    <section className="overflow-hidden rounded-[22px] border border-cyan-400/25 bg-[linear-gradient(145deg,#142131_0%,#0d1824_58%,#071421_100%)] shadow-[0_16px_40px_rgba(0,0,0,.28)]">
      <div className="overflow-x-auto">
        <div className="min-w-[680px]">
          <div className="grid grid-cols-[100px_1.15fr_.9fr_.8fr_.9fr] border-b border-slate-300/20 bg-[#142131] text-center text-[10px] font-black text-sky-100/85">
            {["TF", "STATE", "WT1", "MFI", "SIGNAL"].map((label) => (
              <div key={label} className="border-r border-slate-300/15 px-3 py-3 last:border-r-0">
                {label}
              </div>
            ))}
          </div>

          {matrix.rows.map((row) => {
            const bull = row.state === "BULL";
            const bear = row.state === "BEAR";

            return (
              <div
                key={row.tf}
                className={`grid grid-cols-[100px_1.15fr_.9fr_.8fr_.9fr] border-b border-sky-400/12 text-center ${
                  bull
                    ? "bg-emerald-500/[0.075]"
                    : bear
                      ? "bg-rose-500/[0.075]"
                      : "bg-slate-500/[0.035]"
                }`}
              >
                <div className="border-r border-sky-400/12 px-3 py-3 text-[12px] font-black">
                  {row.tf}
                </div>

                <div className="flex items-center justify-center gap-2 border-r border-sky-400/12 px-3 py-3">
                  <span
                    className={`text-[11px] font-black ${
                      bull ? "text-emerald-300" : bear ? "text-rose-300" : "text-slate-300"
                    }`}
                  >
                    {row.state}
                  </span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      bull ? "bg-emerald-400" : bear ? "bg-rose-500" : "bg-slate-500"
                    }`}
                  />
                </div>

                <div className="border-r border-sky-400/12 px-3 py-3 font-mono text-[12px] font-black text-white/90">
                  {row.wt1 === null ? "—" : row.wt1.toFixed(1)}
                </div>

                <div className="flex items-center justify-center border-r border-sky-400/12 px-3 py-3">
                  <MatrixLight value={row.mfi} />
                </div>

                <div
                  className={`px-3 py-3 text-[10px] font-black ${
                    row.signal === "BUY"
                      ? "text-emerald-300"
                      : row.signal === "SELL"
                        ? "text-rose-300"
                        : "text-slate-500"
                  }`}
                >
                  {row.signal === "WAIT" ? "•••" : row.signal}
                </div>
              </div>
            );
          })}

          <div className="grid grid-cols-[100px_1.15fr_.9fr_.8fr_.9fr] bg-[#0f1b28] text-center">
            <div className="border-r border-slate-300/15 px-3 py-3 text-[11px] font-black">
              TOTAL
            </div>
            <div className="border-r border-slate-300/15 px-3 py-3 text-[11px] font-black">
              <span className="text-emerald-300">{matrix.bullCount}B</span>
              <span className="text-slate-400"> / </span>
              <span className="text-rose-300">{matrix.bearCount}R</span>
            </div>
            <div className="border-r border-slate-300/15 px-3 py-3 text-slate-500">—</div>
            <div className="flex items-center justify-center border-r border-slate-300/15 px-3 py-3">
              <MatrixLight value={matrix.bullCount >= matrix.bearCount ? 60 : 40} />
            </div>
            <div className="px-3 py-3 text-[12px] font-black text-white">{totalSignal}/4</div>
          </div>
        </div>
      </div>

      <div className="grid gap-px border-t border-slate-300/20 bg-sky-400/10 sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-[#0c1824] p-4">
          <div className="flex items-center gap-2 text-[9px] font-black text-sky-100/65">
            <TrendingUp className="h-4 w-4 text-sky-300" />
            ADX
          </div>
          <div className={`mt-2 text-[22px] font-black ${
            (matrix.adx ?? 0) >= 25 ? "text-emerald-300" : "text-amber-300"
          }`}>
            {matrix.adx === null ? "—" : matrix.adx.toFixed(1)}
          </div>
          <div className="mt-1 text-[8px] font-bold uppercase tracking-wider text-sky-200/40">
            {(matrix.adx ?? 0) >= 25 ? "TREND STRONG" : "TREND WEAK"}
          </div>
        </div>

        <div className="bg-[#0c1824] p-4">
          <div className="flex items-center gap-2 text-[9px] font-black text-sky-100/65">
            <BarChart3 className="h-4 w-4 text-cyan-300" />
            EMA 50 / 200
          </div>
          <div className={`mt-2 text-[16px] font-black ${
            matrix.emaBullish === null
              ? "text-slate-400"
              : matrix.emaBullish
                ? "text-emerald-300"
                : "text-rose-300"
          }`}>
            {matrix.emaBullish === null ? "NO DATA" : matrix.emaBullish ? "BULLISH" : "BEARISH"}
          </div>
          <div className="mt-1 text-[8px] font-bold uppercase tracking-wider text-sky-200/40">
            M1 trend filter
          </div>
        </div>

        <div className="bg-[#0c1824] p-4">
          <div className="flex items-center gap-2 text-[9px] font-black text-sky-100/65">
            <Zap className="h-4 w-4 text-cyan-300" />
            MOMENTUM
          </div>
          <div className={`mt-2 text-[16px] font-black ${
            (matrix.momentum ?? 0) > 0
              ? "text-emerald-300"
              : (matrix.momentum ?? 0) < 0
                ? "text-rose-300"
                : "text-slate-400"
          }`}>
            {matrix.momentum === null
              ? "—"
              : `${matrix.momentum > 0 ? "+" : ""}${matrix.momentum.toFixed(2)}%`}
          </div>
          <div className="mt-1 text-[8px] font-bold uppercase tracking-wider text-sky-200/40">
            10 candles M1
          </div>
        </div>

        <div className="bg-[#0c1824] p-4">
          <div className="flex items-center gap-2 text-[9px] font-black text-sky-100/65">
            <Activity className="h-4 w-4 text-sky-300" />
            ATR (14)
          </div>
          <div className="mt-2 text-[18px] font-black text-sky-300">
            {matrix.atr === null ? "—" : matrix.atr.toFixed(2)}
          </div>
          <div className="mt-1 text-[8px] font-bold uppercase tracking-wider text-sky-200/40">
            M1 volatility
          </div>
        </div>
      </div>
    </section>
  );
}

// ======================================================
// MAIN
// ======================================================

export default function ProScanner() {
  const [
    selectedSymbol,
    setSelectedSymbol,
  ] =
    React.useState<ScannerSymbol>(
      "XAUUSD",
    );

  const [gold, setGold] =
    React.useState<MarketState>(
      createEmptyMarket(
        "XAUUSD",
      ),
    );

  const [us30, setUs30] =
    React.useState<MarketState>(
      createEmptyMarket(
        "US30",
      ),
    );

  const [scanning, setScanning] =
    React.useState(false);

  const scannerRootRef = React.useRef<HTMLElement | null>(null);
  const chartFullscreenRef = React.useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  React.useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === chartFullscreenRef.current);
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = React.useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await chartFullscreenRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("[PRO SCANNER FULLSCREEN]", error);
    }
  }, []);

  const current =
    selectedSymbol === "XAUUSD"
      ? gold
      : us30;

  // ====================================================
  // SCAN ONE
  // ====================================================

  const scanSymbol =
    React.useCallback(
      async (
        symbol: ScannerSymbol,
      ): Promise<MarketState> => {
        try {
          const [
            rawM1,
            rawM5,
          ] =
            await Promise.all([
              fetchCandles(
                symbol,
                "1min",
                1800,
              ),

              fetchCandles(
                symbol,
                "5min",
                300,
              ),
            ]);

          const m1 =
            toScannerCandles(
              rawM1,
            );

          const m5 =
            toScannerCandles(
              rawM5,
            );

          if (
            m1.length < 60
          ) {
            throw new Error(
              `${symbol}: WARMUP M1 ${m1.length}/60 świec`,
            );
          }

          if (
            m5.length < 50
          ) {
            throw new Error(
              `${symbol}: WARMUP M5 ${m5.length}/50 świec`,
            );
          }

          const scanner =
            scanGoldUs30({
              symbol,

              m1Candles: m1,

              m5Candles: m5,
            });

          return {
            symbol,

            scanner,

            m1,
            m5,

            chartCandles:
              toChartCandles(
                rawM1,
                symbol,
              ),

            loading: false,

            error: null,

            updatedAt:
              new Date(),
          };
        } catch (error) {
          console.error(
            `[PRO SCANNER ${symbol}]`,
            error,
          );

          return {
            ...createEmptyMarket(
              symbol,
            ),

            loading: false,

            error:
              error instanceof Error
                ? error.message
                : "Scanner error",

            updatedAt:
              new Date(),
          };
        }
      },
      [],
    );

  // ====================================================
  // SCAN GOLD + US30
  // ====================================================

  const runScan =
    React.useCallback(
      async () => {
        if (scanning) {
          return;
        }

        setScanning(true);

        setGold(
          (previous) => ({
            ...previous,

            loading: true,

            error: null,
          }),
        );

        setUs30(
          (previous) => ({
            ...previous,

            loading: true,

            error: null,
          }),
        );

        try {
          const [
            goldResult,
            us30Result,
          ] =
            await Promise.all([
              scanSymbol(
                "XAUUSD",
              ),

              scanSymbol(
                "US30",
              ),
            ]);

          setGold(
            goldResult,
          );

          setUs30(
            us30Result,
          );
        } finally {
          setScanning(
            false,
          );
        }
      },
      [
        scanSymbol,
        scanning,
      ],
    );

  // ====================================================
  // INITIAL SCAN
  // ====================================================

  React.useEffect(() => {
    void runScan();

    // wykonujemy tylko po pierwszym wejściu
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markets = [
    gold,
    us30,
  ];

  const scanner =
    current.scanner;

  const chartDirection:
    | "BUY"
    | "SELL" =
    scanner?.direction ===
    "SELL"
      ? "SELL"
      : "BUY";

  const technicalMatrix = React.useMemo(
    () => buildTechMatrix(current.m1, current.m5),
    [current.m1, current.m5],
  );

  return (
    <main ref={scannerRootRef} className="min-h-screen overflow-y-auto bg-[radial-gradient(circle_at_top,#162536_0%,#0e1a27_34%,#091521_70%,#06111c_100%)] text-white fullscreen:h-screen fullscreen:w-screen">
      <div className="mx-auto max-w-[1760px] px-4 py-5 lg:px-6 xl:px-7">
        {/* ============================================ */}
        {/* HEADER */}
        {/* ============================================ */}

        <header className="mb-5 overflow-hidden rounded-[24px] border border-slate-300/25 bg-[linear-gradient(135deg,#1b2a3a_0%,#142131_55%,#0c1722_100%)] shadow-[0_18px_55px_rgba(0,0,0,.30)]">
          <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between lg:p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-cyan-400/20 bg-cyan-500/10 shadow-[0_0_30px_rgba(34,211,238,.06)]">
                <Crosshair className="h-5 w-5 text-cyan-300" />
              </div>

              <div>
                <div className="text-[9px] font-black uppercase tracking-[.22em] text-cyan-400">
                  FX Trade Professional
                </div>

                <h1 className="mt-1.5 text-xl font-black tracking-tight sm:text-2xl">
                  GOLD & US30 PRO SCANNER
                </h1>

                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-sky-100/55">
                  <span>
                    M5 Bias
                  </span>

                  <span>→</span>

                  <span>
                    M1 Timing
                  </span>

                  <span>·</span>

                  <span>
                    New York Session
                  </span>

                  <span>·</span>

                  <span>
                    FX Trade Candle Engine / Live-Rates
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-11 items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-400/[0.08] px-4">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />

                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>

                <span className="text-[9px] font-black text-emerald-300">
                  LIVE-RATES US30 + XAUUSD
                </span>
              </div>

              <button
                type="button"
                onClick={() => void toggleFullscreen()}
                className="flex h-11 items-center gap-2 rounded-xl border border-cyan-300/20 bg-[#172536]/95 px-4 text-[10px] font-black text-cyan-100 transition hover:border-cyan-300/40 hover:bg-[#343c46]"
                title={isFullscreen ? "Wyjdź z pełnego ekranu" : "Pełny ekran"}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
                {isFullscreen ? "WYJDŹ" : "PEŁNY EKRAN"}
              </button>

              <button
                type="button"
                onClick={() =>
                  void runScan()
                }
                disabled={
                  scanning
                }
                className="flex h-11 items-center gap-2 rounded-xl border border-cyan-300/20 bg-gradient-to-r from-sky-400 via-blue-500 to-blue-600 px-5 text-[10px] font-black shadow-[0_10px_35px_rgba(14,165,233,.14)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {scanning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}

                {scanning
                  ? "SCANNING..."
                  : "SCAN SETUPS"}
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[370px_minmax(0,1fr)]">
          {/* ========================================== */}
          {/* LEFT PANEL */}
          {/* ========================================== */}

          <aside className="space-y-5">
            <section className="overflow-hidden rounded-[22px] border border-slate-300/20 bg-[linear-gradient(145deg,#172536_0%,#0d1824_100%)] shadow-[0_14px_34px_rgba(0,0,0,.22)]">
              <div className="flex items-center justify-between border-b border-slate-300/15 px-5 py-4">
                <div>
                  <div className="text-[11px] font-black">
                    SESSION MARKETS
                  </div>

                  <div className="mt-1 text-[9px] text-sky-200/45">
                    GOLD + US30
                  </div>
                </div>

                <Activity className="h-4 w-4 text-cyan-300" />
              </div>

              <div className="divide-y divide-sky-300/10">
                {markets.map(
                  (market) => {
                    const item =
                      market.scanner;

                    const selected =
                      market.symbol ===
                      selectedSymbol;

                    return (
                      <button
                        type="button"
                        key={
                          market.symbol
                        }
                        onClick={() =>
                          setSelectedSymbol(
                            market.symbol,
                          )
                        }
                        className={`w-full p-5 text-left transition ${
                          selected
                            ? "bg-gradient-to-r from-sky-400/[0.18] via-blue-500/[0.08] to-transparent"
                            : "hover:bg-sky-300/[0.06]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="text-[15px] font-black">
                                {
                                  market.symbol
                                }
                              </div>

                              <span
                                className={`rounded-md border px-2 py-0.5 text-[8px] font-bold ${
                                  market.symbol ===
                                  "XAUUSD"
                                    ? "border-amber-400/15 bg-amber-500/[0.06] text-amber-300"
                                    : "border-slate-300/15 bg-sky-500/[0.06] text-sky-300"
                                }`}
                              >
                                {market.symbol ===
                                "XAUUSD"
                                  ? "GOLD"
                                  : "DOW"}
                              </span>
                            </div>

                            {market.loading ? (
                              <div className="mt-4 flex items-center gap-2 text-[10px] text-cyan-300">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />

                                Analiza rynku...
                              </div>
                            ) : market.error ? (
                              <div className="mt-3 max-w-[210px] text-[9px] leading-4 text-rose-300">
                                {
                                  market.error
                                }
                              </div>
                            ) : item ? (
                              <>
                                <div className="mt-3 text-[10px] font-semibold text-sky-50/85">
                                  {
                                    item.setup
                                  }
                                </div>

                                <div className="mt-2 flex items-center gap-2">
                                  {item.direction ===
                                  "BUY" ? (
                                    <TrendingUp className="h-4 w-4 text-emerald-300" />
                                  ) : item.direction ===
                                    "SELL" ? (
                                    <TrendingDown className="h-4 w-4 text-rose-300" />
                                  ) : (
                                    <Activity className="h-4 w-4 text-sky-200/45" />
                                  )}

                                  <span
                                    className={`text-[11px] font-black ${
                                      item.direction ===
                                      "BUY"
                                        ? "text-emerald-300"
                                        : item.direction ===
                                            "SELL"
                                          ? "text-rose-300"
                                          : "text-sky-100/55"
                                    }`}
                                  >
                                    {
                                      item.direction
                                    }
                                  </span>
                                </div>

                                <div className="mt-3">
                                  <StatusBadge
                                    status={
                                      item.status
                                    }
                                  />
                                </div>
                              </>
                            ) : (
                              <div className="mt-3 text-[9px] text-sky-200/45">
                                Brak analizy
                              </div>
                            )}
                          </div>

                          {item ? (
                            <ScoreCircle
                              score={
                                item.score
                              }
                            />
                          ) : null}
                        </div>
                      </button>
                    );
                  },
                )}
              </div>
            </section>

            {/* SCORING */}

            <section className="rounded-[22px] border border-slate-300/20 bg-[linear-gradient(145deg,#172536_0%,#0d1824_100%)] shadow-[0_14px_34px_rgba(0,0,0,.22)] p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-cyan-300" />

                <div className="text-[11px] font-black">
                  SETUP SCORE
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-sky-100/55">
                    Liquidity / OR
                  </span>

                  <span className="font-bold text-white">
                    40
                  </span>
                </div>

                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-sky-100/55">
                    Structure
                  </span>

                  <span className="font-bold text-white">
                    35
                  </span>
                </div>

                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-sky-100/55">
                    VWAP + Momentum
                  </span>

                  <span className="font-bold text-white">
                    25
                  </span>
                </div>
              </div>

              <div className="mt-4 border-t border-slate-300/15 pt-4 text-[9px] leading-5 text-sky-200/45">
                60+ FORMING · 80+ READY · 90+ A+
              </div>
            </section>
          </aside>

          {/* ========================================== */}
          {/* MAIN CONTENT */}
          {/* ========================================== */}

          <section className="min-w-0 space-y-5">
            {/* SELECTED MARKET HEADER */}

            <div className="rounded-[22px] border border-slate-300/20 bg-[linear-gradient(145deg,#172536_0%,#0d1824_100%)] shadow-[0_14px_34px_rgba(0,0,0,.22)] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl border ${
                      selectedSymbol ===
                      "XAUUSD"
                        ? "border-amber-400/15 bg-amber-500/[0.07]"
                        : "border-cyan-400/15 bg-cyan-500/[0.07]"
                    }`}
                  >
                    <Zap
                      className={`h-5 w-5 ${
                        selectedSymbol ===
                        "XAUUSD"
                          ? "text-amber-300"
                          : "text-cyan-300"
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black">
                        {
                          selectedSymbol
                        }
                      </h2>

                      <span className="rounded-md border border-slate-300/15 bg-[#172536]/90 px-2 py-1 text-[8px] font-bold text-sky-100/55">
                        M5 → M1
                      </span>
                    </div>

                    <div className="mt-1 text-[9px] text-sky-200/45">
                      New York Session
                    </div>
                  </div>
                </div>

                {scanner ? (
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-slate-300/15 bg-[#172536]/90 px-4 py-2">
                      <div className="text-[8px] font-bold text-sky-200/45">
                        M5 BIAS
                      </div>

                      <div
                        className={`mt-1 text-[11px] font-black ${
                          scanner.biasM5 ===
                          "BULLISH"
                            ? "text-emerald-300"
                            : scanner.biasM5 ===
                                "BEARISH"
                              ? "text-rose-300"
                              : "text-sky-100/70"
                        }`}
                      >
                        {
                          scanner.biasM5
                        }
                      </div>
                    </div>

                    <ScoreCircle
                      score={
                        scanner.score
                      }
                    />
                  </div>
                ) : null}
              </div>
            </div>

            {/* ERROR */}

            {current.error ? (
              <div className="rounded-[22px] border border-rose-400/15 bg-rose-500/[0.045] p-5">
                <div className="text-[12px] font-black text-rose-300">
                  DATA ERROR
                </div>

                <p className="mt-2 text-[10px] leading-5 text-rose-200/70">
                  {
                    current.error
                  }
                </p>

                {selectedSymbol ===
                "US30" ? (
                  <p className="mt-3 text-[9px] leading-5 text-sky-100/55">
                    Jeśli GOLD działa,
                    a US30 zwraca błąd,
                    sprawdzimy ticker
                    indeksu dostępny w
                    Twoim planie Twelve
                    Data.
                  </p>
                ) : null}
              </div>
            ) : null}

            {/* LOADING */}

            {current.loading ? (
              <div className="flex h-[620px] items-center justify-center rounded-[22px] border border-slate-300/20 bg-[#0c1824] shadow-[0_14px_34px_rgba(2,132,199,.08)]">
                <div className="text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-cyan-300" />

                  <div className="mt-3 text-[11px] font-bold text-cyan-200">
                    Pobieranie M1 + M5
                  </div>

                  <div className="mt-1 text-[9px] text-sky-200/45">
                    FX Trade Candle Engine / Live-Rates
                  </div>
                </div>
              </div>
            ) : null}

            {/* CHART */}

            {!current.loading && current.chartCandles.length > 0 ? (
              <div
                key={selectedSymbol}
                ref={chartFullscreenRef}
                className="overflow-hidden rounded-[22px] bg-[#071421] fullscreen:h-screen fullscreen:w-screen fullscreen:rounded-none fullscreen:p-0"
              >
                <AlphaPriceChart
                  symbol={selectedSymbol}
                  tf="M1"
                  candles={current.chartCandles}
                  loading={false}
                  priceAction={
                    scanner
                      ? scanner.direction === "WAIT"
                        ? "WAIT · NO TRADE"
                        : scanner.priceAction
                      : "LIVE MARKET"
                  }
                  direction={scanner?.direction === "SELL" ? "SELL" : "BUY"}
                  entry={scanner && scanner.direction !== "WAIT" ? scanner.entry : 0}
                  sl={scanner && scanner.direction !== "WAIT" ? scanner.sl : 0}
                  tp1={scanner && scanner.direction !== "WAIT" ? scanner.tp1 : 0}
                  tp2={scanner && scanner.direction !== "WAIT" ? scanner.tp2 : 0}
                  asianHigh={scanner?.asianHigh}
                  asianLow={scanner?.asianLow}
                  londonHigh={scanner?.londonHigh}
                  londonLow={scanner?.londonLow}
                  nyOpenHigh={scanner?.nyOpenHigh}
                  nyOpenLow={scanner?.nyOpenLow}
                  vwap={scanner?.vwap}
                  bosPrice={scanner?.bosPrice}
                  chochPrice={scanner?.chochPrice}
                  height={
                    isFullscreen && typeof window !== "undefined"
                      ? Math.max(420, window.innerHeight - 53)
                      : 620
                  }
                />
              </div>
            ) : null}

            {/* MULTI-TIMEFRAME TECHNICAL MATRIX — BELOW CHART */}

            {!current.loading && current.m1.length > 0 && current.m5.length > 0 ? (
              <TechnicalMatrix matrix={technicalMatrix} />
            ) : null}

            {/* CONFIRMATIONS */}

            {scanner &&
            !current.loading ? (
              <div className="grid gap-4 md:grid-cols-3">
                <ConfirmationCard
                  number="01"
                  title="LIQUIDITY"
                  points="40 POINTS"
                  active={
                    scanner.liquidityConfirmed
                  }
                  description={
                    scanner.sweepType
                      ? `Sweep: ${scanner.sweepType.replaceAll(
                          "_",
                          " ",
                        )}`
                      : scanner.setup ===
                          "NY OR Breakout"
                        ? "NY Opening Range breakout potwierdzony."
                        : "Czekamy na sweep Asian/London lub NY Opening Range."
                  }
                />

                <ConfirmationCard
                  number="02"
                  title="M1 STRUCTURE"
                  points="35 POINTS"
                  active={
                    scanner.structureConfirmed
                  }
                  description={
                    scanner.structureType
                      ? `Potwierdzenie: ${scanner.structureType.replaceAll(
                          "_",
                          " ",
                        )}`
                      : "Czekamy na BOS / CHOCH po reakcji z płynności."
                  }
                />

                <ConfirmationCard
                  number="03"
                  title="VWAP + MOMENTUM"
                  points="25 POINTS"
                  active={
                    scanner.vwapConfirmed &&
                    scanner.momentumConfirmed
                  }
                  description={`VWAP ${
                    scanner.vwapConfirmed
                      ? "✓"
                      : "—"
                  } · Momentum ${
                    scanner.momentumConfirmed
                      ? "✓"
                      : "—"
                  }`}
                />
              </div>
            ) : null}

            {/* LEVELS / PLAN */}

            {scanner &&
            !current.loading ? (
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_370px]">
                {/* LEVELS */}

                <div className="rounded-[22px] border border-slate-300/20 bg-[linear-gradient(145deg,#172536_0%,#0d1824_100%)] shadow-[0_14px_34px_rgba(0,0,0,.22)] p-5">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-cyan-300" />

                    <h3 className="text-[11px] font-black">
                      SESSION LEVELS
                    </h3>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <LevelBox
                      label="Asian High"
                      value={
                        scanner.asianHigh
                      }
                      symbol={
                        selectedSymbol
                      }
                    />

                    <LevelBox
                      label="Asian Low"
                      value={
                        scanner.asianLow
                      }
                      symbol={
                        selectedSymbol
                      }
                    />

                    <LevelBox
                      label="London High"
                      value={
                        scanner.londonHigh
                      }
                      symbol={
                        selectedSymbol
                      }
                    />

                    <LevelBox
                      label="London Low"
                      value={
                        scanner.londonLow
                      }
                      symbol={
                        selectedSymbol
                      }
                    />

                    <LevelBox
                      label="NY OR High"
                      value={
                        scanner.nyOpenHigh
                      }
                      symbol={
                        selectedSymbol
                      }
                    />

                    <LevelBox
                      label="NY OR Low"
                      value={
                        scanner.nyOpenLow
                      }
                      symbol={
                        selectedSymbol
                      }
                    />

                    <LevelBox
                      label="VWAP"
                      value={
                        scanner.vwap
                      }
                      symbol={
                        selectedSymbol
                      }
                    />

                    <LevelBox
                      label="Last Price"
                      value={
                        scanner.lastPrice
                      }
                      symbol={
                        selectedSymbol
                      }
                    />
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-300/15 bg-[#132131]/90 p-4">
                      <div className="text-[8px] font-bold text-sky-200/45">
                        BOS LEVEL
                      </div>

                      <div className="mt-1.5 font-mono text-[12px] font-bold text-emerald-300">
                        {formatPrice(
                          scanner.bosPrice,
                          selectedSymbol,
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-300/15 bg-[#132131]/90 p-4">
                      <div className="text-[8px] font-bold text-sky-200/45">
                        CHOCH LEVEL
                      </div>

                      <div className="mt-1.5 font-mono text-[12px] font-bold text-fuchsia-300">
                        {formatPrice(
                          scanner.chochPrice,
                          selectedSymbol,
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* TRADE PLAN */}

                <div className="rounded-[22px] border border-slate-300/20 bg-[linear-gradient(145deg,#172536_0%,#0d1824_100%)] shadow-[0_14px_34px_rgba(0,0,0,.22)] p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-emerald-300" />

                      <h3 className="text-[11px] font-black">
                        TRADE PLAN
                      </h3>
                    </div>

                    <StatusBadge
                      status={
                        scanner.status
                      }
                    />
                  </div>

                  {scanner.direction ===
                  "WAIT" ? (
                    <div className="mt-5 rounded-[16px] border border-slate-300/15 bg-[#111e2c]/90 p-5 text-center">
                      <Activity className="mx-auto h-5 w-5 text-sky-200/45" />

                      <div className="mt-3 text-[12px] font-black text-sky-100/70">
                        NO TRADE
                      </div>

                      <div className="mt-2 text-[9px] leading-5 text-sky-200/45">
                        Scanner czeka na
                        setup o odpowiedniej
                        jakości.
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 space-y-3">
                      <div className="flex items-center justify-between rounded-xl border border-slate-300/15 bg-[#132131]/90 px-3 py-3">
                        <span className="text-[9px] text-sky-100/55">
                          Direction
                        </span>

                        <span
                          className={`text-[11px] font-black ${
                            scanner.direction ===
                            "BUY"
                              ? "text-emerald-300"
                              : "text-rose-300"
                          }`}
                        >
                          {
                            scanner.direction
                          }
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl border border-cyan-400/10 bg-cyan-500/[0.035] px-3 py-3">
                        <span className="text-[9px] text-sky-100/55">
                          ENTRY
                        </span>

                        <span className="font-mono text-[12px] font-black text-cyan-300">
                          {formatPrice(
                            scanner.entry,
                            selectedSymbol,
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl border border-rose-400/10 bg-rose-500/[0.035] px-3 py-3">
                        <span className="text-[9px] text-sky-100/55">
                          STOP LOSS
                        </span>

                        <span className="font-mono text-[12px] font-black text-rose-300">
                          {formatPrice(
                            scanner.sl,
                            selectedSymbol,
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl border border-emerald-400/10 bg-emerald-500/[0.035] px-3 py-3">
                        <span className="text-[9px] text-sky-100/55">
                          TP1 · 1R
                        </span>

                        <span className="font-mono text-[12px] font-black text-emerald-300">
                          {formatPrice(
                            scanner.tp1,
                            selectedSymbol,
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl border border-emerald-400/10 bg-emerald-500/[0.035] px-3 py-3">
                        <span className="text-[9px] text-sky-100/55">
                          TP2 · 2R
                        </span>

                        <span className="font-mono text-[12px] font-black text-emerald-300">
                          {formatPrice(
                            scanner.tp2,
                            selectedSymbol,
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-300/15 pt-4">
                        <span className="text-[9px] text-sky-100/55">
                          Risk / Reward
                        </span>

                        <span className="text-[12px] font-black">
                          1:
                          {
                            scanner.rr
                          }
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* ANALYSIS */}

            {scanner &&
            !current.loading ? (
              <div className="rounded-[22px] border border-slate-300/20 bg-[linear-gradient(145deg,#172536_0%,#0d1824_100%)] shadow-[0_14px_34px_rgba(0,0,0,.22)] p-5">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-black">
                    SCANNER ANALYSIS
                  </div>

                  {current.updatedAt ? (
                    <div className="flex items-center gap-1.5 text-[8px] text-sky-200/45">
                      <Clock3 className="h-3 w-3" />

                      {current.updatedAt.toLocaleTimeString(
                        "pl-PL",
                        {
                          hour:
                            "2-digit",
                          minute:
                            "2-digit",
                          second:
                            "2-digit",
                        },
                      )}
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-2">
                  {scanner.reasons.map(
                    (
                      reason,
                      index,
                    ) => (
                      <div
                        key={`${reason}-${index}`}
                        className="flex items-center gap-3 rounded-xl border border-slate-300/15 bg-[#101d2a]/85 px-3 py-2.5"
                      >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />

                        <span className="text-[9px] text-sky-100/55">
                          {reason}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            ) : null}

            {/* EMPTY */}

            {!current.loading &&
            !scanner &&
            !current.error ? (
              <div className="flex min-h-[400px] items-center justify-center rounded-[22px] border border-slate-300/20 bg-[linear-gradient(145deg,#172536_0%,#0d1824_100%)] shadow-[0_14px_34px_rgba(0,0,0,.22)]">
                <div className="text-center">
                  <Crosshair className="mx-auto h-7 w-7 text-sky-200/30" />

                  <div className="mt-3 text-[12px] font-black text-sky-100/70">
                    PRO SCANNER
                  </div>

                  <div className="mt-2 text-[9px] text-sky-200/45">
                    Kliknij SCAN SETUPS
                  </div>
                </div>
              </div>
            ) : null}

            {/* FOOTER */}

            <div className="flex flex-col gap-2 border-t border-sky-300/10 px-1 pt-4 text-[8px] leading-4 text-sky-200/30 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Scanner edukacyjny ·
                wyniki nie stanowią
                rekomendacji
                inwestycyjnej.
              </span>

              <span>
                GOLD / US30 · M5
                Bias → M1 Timing
              </span>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}