"use client";

import Link from "next/link";
import React from "react";
import {
  Brain,
  ChevronLeft,
  Loader2,
  RefreshCw,
  Search,
  Star,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { CandlestickData, UTCTimestamp } from "lightweight-charts";
import AlphaPriceChart from "./AlphaPriceChart";

type TF = "M5" | "M15" | "H1" | "H4" | "D1";
type TrendFilter = "All" | "Uptrend" | "Downtrend";
type LiquidityFilter = "All" | "High" | "Medium";

type Setup = {
  instrument: string;
  name: string;
  tf: TF;
  trend: boolean;
  trendDirection?: "UP" | "DOWN" | "NEUTRAL";
  sweep: boolean;
  momentum: boolean;
  liquidityPct: number;
  priceAction: string;
  session: string;
  confidence: number;
  direction: "BUY" | "SELL";
  status: "READY" | "WATCH" | "WARMUP";
  entry: string;
  sl: string;
  tp1: string;
  tp2: string;
  rr: string;
};

const SETUPS: Setup[] = [
  {
    instrument: "XAUUSD",
    name: "Gold / U.S. Dollar",
    tf: "M5",
    trend: true,
    sweep: true,
    momentum: true,
    liquidityPct: 88,
    priceAction: "Bullish Engulfing",
    session: "London",
    confidence: 94,
    direction: "BUY",
    status: "READY",
    entry: "3384.20",
    sl: "3378.50",
    tp1: "3392.50",
    tp2: "3398.80",
    rr: "1 : 2.6",
  },
  {
    instrument: "US30",
    name: "Dow Jones 30",
    tf: "M5",
    trend: true,
    sweep: true,
    momentum: true,
    liquidityPct: 82,
    priceAction: "Strong Bullish",
    session: "New York",
    confidence: 88,
    direction: "BUY",
    status: "READY",
    entry: "38720",
    sl: "38640",
    tp1: "38880",
    tp2: "39020",
    rr: "1 : 2.4",
  },
  {
    instrument: "EURUSD",
    name: "Euro / U.S. Dollar",
    tf: "M15",
    trend: true,
    sweep: false,
    momentum: true,
    liquidityPct: 58,
    priceAction: "Pin Bar Bullish",
    session: "London",
    confidence: 76,
    direction: "BUY",
    status: "WATCH",
    entry: "1.08420",
    sl: "1.08150",
    tp1: "1.08800",
    tp2: "1.09100",
    rr: "1 : 2.1",
  },
  {
    instrument: "GBPUSD",
    name: "GBP / U.S. Dollar",
    tf: "M15",
    trend: true,
    sweep: true,
    momentum: true,
    liquidityPct: 72,
    priceAction: "Inside Bar",
    session: "London",
    confidence: 72,
    direction: "BUY",
    status: "WATCH",
    entry: "1.27680",
    sl: "1.27300",
    tp1: "1.28200",
    tp2: "1.28600",
    rr: "1 : 2.3",
  },
  {
    instrument: "USDJPY",
    name: "U.S. Dollar / Yen",
    tf: "M15",
    trend: false,
    sweep: true,
    momentum: true,
    liquidityPct: 79,
    priceAction: "Bearish Engulfing",
    session: "Tokyo",
    confidence: 83,
    direction: "SELL",
    status: "READY",
    entry: "156.830",
    sl: "157.120",
    tp1: "156.300",
    tp2: "155.900",
    rr: "1 : 2.5",
  },
  {
    instrument: "BTCUSD",
    name: "Bitcoin / U.S. Dollar",
    tf: "M5",
    trend: true,
    sweep: true,
    momentum: true,
    liquidityPct: 94,
    priceAction: "Bullish Engulfing",
    session: "Crypto 24/7",
    confidence: 91,
    direction: "BUY",
    status: "READY",
    entry: "0",
    sl: "0",
    tp1: "0",
    tp2: "0",
    rr: "1 : 2.5",
  },
  {
    instrument: "ETHUSD",
    name: "Ethereum / U.S. Dollar",
    tf: "M5",
    trend: true,
    sweep: true,
    momentum: true,
    liquidityPct: 91,
    priceAction: "Strong Bullish",
    session: "Crypto 24/7",
    confidence: 89,
    direction: "BUY",
    status: "READY",
    entry: "0",
    sl: "0",
    tp1: "0",
    tp2: "0",
    rr: "1 : 2.5",
  },
  {
    instrument: "SOLUSD",
    name: "Solana / U.S. Dollar",
    tf: "M15",
    trend: true,
    sweep: true,
    momentum: true,
    liquidityPct: 86,
    priceAction: "Inside Bar",
    session: "Crypto 24/7",
    confidence: 84,
    direction: "BUY",
    status: "WATCH",
    entry: "0",
    sl: "0",
    tp1: "0",
    tp2: "0",
    rr: "1 : 2.5",
  },
];

function FilterButton({
  active,
  children,
  onClick,
  tone = "blue",
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  tone?: "blue" | "green" | "red";
}) {
  const activeStyle =
    tone === "green"
      ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-300"
      : tone === "red"
      ? "border-rose-400/35 bg-rose-500/10 text-rose-300"
      : "border-sky-400/50 bg-sky-500/15 text-sky-200";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3.5 py-2 text-[11px] font-medium transition ${
        active
          ? activeStyle
          : "border-sky-300/15 bg-sky-300/[0.055] text-white/55 hover:bg-sky-300/[0.10] hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function Pass({ value }: { value: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${
        value ? "text-emerald-300" : "text-rose-300"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${value ? "bg-emerald-400" : "bg-rose-400"}`} />
      {value ? "PASS" : "FAIL"}
    </span>
  );
}


const INTERVAL_MAP: Record<TF, string> = {
  M5: "5min",
  M15: "15min",
  H1: "1h",
  H4: "4h",
  D1: "1day",
};

const SYMBOL_MAP: Record<string, string> = {
  XAUUSD: "XAU/USD",
  EURUSD: "EUR/USD",
  GBPUSD: "GBP/USD",
  USDJPY: "USD/JPY",
  US30: "DJI",
  BTCUSD: "BTC/USD",
  ETHUSD: "ETH/USD",
  SOLUSD: "SOL/USD",
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function emaValue(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const k = 2 / (period + 1);
  let ema = values.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  for (let i = period; i < values.length; i += 1) {
    ema = values[i] * k + ema * (1 - k);
  }
  return ema;
}

function formatSetupNumber(instrument: string, value: number) {
  if (instrument === "EURUSD" || instrument === "GBPUSD") return value.toFixed(5);
  if (instrument === "USDJPY") return value.toFixed(3);
  if (instrument === "SOLUSD") return value.toFixed(3);
  return value.toFixed(2);
}

function analyzeSetup(base: Setup, candles: CandlestickData[]): Setup {
  const data = candles as any[];
  const minCandles = 50;

  if (data.length < minCandles) {
    return {
      ...base,
      trend: false,
      trendDirection: "NEUTRAL",
      sweep: false,
      momentum: false,
      liquidityPct: 0,
      priceAction: `WARMUP ${data.length}/${minCandles} świec`,
      confidence: 0,
      status: "WARMUP",
      entry: "-",
      sl: "-",
      tp1: "-",
      tp2: "-",
      rr: "-",
    };
  }

  const closes = data.map((c) => Number(c.close));
  const ema20 = emaValue(closes, 20);
  const ema50 = emaValue(closes, 50) ?? emaValue(closes, Math.min(30, closes.length));
  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  const lastClose = Number(last.close);

  const upTrend = ema20 !== null && ema50 !== null && ema20 > ema50 && lastClose >= ema20;
  const downTrend = ema20 !== null && ema50 !== null && ema20 < ema50 && lastClose <= ema20;
  const trendDirection: Setup["trendDirection"] = upTrend ? "UP" : downTrend ? "DOWN" : "NEUTRAL";

  const recentBodySource = data.slice(-16, -1);
  const avgBody =
    recentBodySource.reduce(
      (sum, c) => sum + Math.abs(Number(c.close) - Number(c.open)),
      0
    ) / Math.max(1, recentBodySource.length);

  const lastBody = Math.abs(Number(last.close) - Number(last.open));
  const lastBull = Number(last.close) > Number(last.open);
  const lastBear = Number(last.close) < Number(last.open);
  const momentumBull = lastBull && lastBody >= avgBody * 1.15 && lastClose > Number(data[data.length - 4]?.close ?? lastClose);
  const momentumBear = lastBear && lastBody >= avgBody * 1.15 && lastClose < Number(data[data.length - 4]?.close ?? lastClose);

  const rangeWindow = data.slice(-24, -3);
  const priorHigh = Math.max(...rangeWindow.map((c) => Number(c.high)));
  const priorLow = Math.min(...rangeWindow.map((c) => Number(c.low)));
  const sweepWindow = data.slice(-3);
  const bullishSweep = sweepWindow.some(
    (c) => Number(c.low) < priorLow && Number(c.close) > priorLow
  );
  const bearishSweep = sweepWindow.some(
    (c) => Number(c.high) > priorHigh && Number(c.close) < priorHigh
  );

  const prevOpen = Number(prev.open);
  const prevClose = Number(prev.close);
  const lastOpen = Number(last.open);
  const lastHigh = Number(last.high);
  const lastLow = Number(last.low);
  const lastRange = Math.max(1e-12, lastHigh - lastLow);
  const upperWick = lastHigh - Math.max(lastOpen, lastClose);
  const lowerWick = Math.min(lastOpen, lastClose) - lastLow;

  const bullishEngulfing =
    prevClose < prevOpen && lastClose > lastOpen && lastOpen <= prevClose && lastClose >= prevOpen;
  const bearishEngulfing =
    prevClose > prevOpen && lastClose < lastOpen && lastOpen >= prevClose && lastClose <= prevOpen;
  const bullishPin = lowerWick / lastRange >= 0.55 && lastClose >= lastLow + lastRange * 0.6;
  const bearishPin = upperWick / lastRange >= 0.55 && lastClose <= lastLow + lastRange * 0.4;
  const insideBar = lastHigh < Number(prev.high) && lastLow > Number(prev.low);

  let priceAction = "Neutral Price Action";
  let paDirection: "BUY" | "SELL" | null = null;
  if (bullishEngulfing) {
    priceAction = "Bullish Engulfing";
    paDirection = "BUY";
  } else if (bearishEngulfing) {
    priceAction = "Bearish Engulfing";
    paDirection = "SELL";
  } else if (bullishPin) {
    priceAction = "Bullish Pin Bar";
    paDirection = "BUY";
  } else if (bearishPin) {
    priceAction = "Bearish Pin Bar";
    paDirection = "SELL";
  } else if (insideBar) {
    priceAction = "Inside Bar";
  } else if (momentumBull) {
    priceAction = "Strong Bullish";
    paDirection = "BUY";
  } else if (momentumBear) {
    priceAction = "Strong Bearish";
    paDirection = "SELL";
  }

  let bullScore = 0;
  let bearScore = 0;
  if (upTrend) bullScore += 3;
  if (downTrend) bearScore += 3;
  if (bullishSweep) bullScore += 2;
  if (bearishSweep) bearScore += 2;
  if (momentumBull) bullScore += 2;
  if (momentumBear) bearScore += 2;
  if (paDirection === "BUY") bullScore += 2;
  if (paDirection === "SELL") bearScore += 2;

  if (bullScore === bearScore) {
    const shortMove = lastClose - Number(data[data.length - 6]?.close ?? lastClose);
    if (shortMove >= 0) bullScore += 1;
    else bearScore += 1;
  }

  const direction: Setup["direction"] = bullScore >= bearScore ? "BUY" : "SELL";
  const trendConfirmed = direction === "BUY" ? upTrend : downTrend;
  const sweepConfirmed = direction === "BUY" ? bullishSweep : bearishSweep;
  const momentumConfirmed = direction === "BUY" ? momentumBull : momentumBear;
  const paConfirmed = paDirection === direction;

  const recentRanges = data.slice(-20).map((c) => Math.abs(Number(c.high) - Number(c.low)));
  const avgRange = recentRanges.reduce((sum, value) => sum + value, 0) / Math.max(1, recentRanges.length);
  const currentRange = Math.abs(lastHigh - lastLow);
  const activityRatio = avgRange > 0 ? currentRange / avgRange : 1;
  const liquidityPct = Math.round(
    clamp(48 + Math.min(22, activityRatio * 12) + (sweepConfirmed ? 24 : 0), 40, 96)
  );

  let confidence = 45;
  if (trendConfirmed) confidence += 22;
  if (sweepConfirmed) confidence += 16;
  if (momentumConfirmed) confidence += 14;
  if (paConfirmed) confidence += 10;
  if (liquidityPct >= 70) confidence += 5;
  if (Math.max(bullScore, bearScore) >= 7) confidence += 4;
  confidence = Math.round(clamp(confidence, 45, 98));

  const risk = Math.max(avgRange * 1.6, Math.abs(lastClose) * 0.001);
  const sl = direction === "BUY" ? lastClose - risk : lastClose + risk;
  const tp1 = direction === "BUY" ? lastClose + risk * 1.5 : lastClose - risk * 1.5;
  const tp2 = direction === "BUY" ? lastClose + risk * 2.5 : lastClose - risk * 2.5;

  return {
    ...base,
    trend: trendConfirmed,
    trendDirection,
    sweep: sweepConfirmed,
    momentum: momentumConfirmed,
    liquidityPct,
    priceAction,
    confidence,
    direction,
    status: confidence >= 78 ? "READY" : "WATCH",
    entry: formatSetupNumber(base.instrument, lastClose),
    sl: formatSetupNumber(base.instrument, sl),
    tp1: formatSetupNumber(base.instrument, tp1),
    tp2: formatSetupNumber(base.instrument, tp2),
    rr: "1 : 2.5",
  };
}

async function fetchSetupCandles(setup: Setup): Promise<CandlestickData[]> {
  const isUs30 = setup.instrument === "US30";
  const qs = isUs30
    ? new URLSearchParams({
        interval: INTERVAL_MAP[setup.tf],
        limit: "220",
      })
    : new URLSearchParams({
        path: "/time_series",
        symbol: SYMBOL_MAP[setup.instrument] ?? setup.instrument,
        interval: INTERVAL_MAP[setup.tf],
        outputsize: "220",
        format: "JSON",
      });

  const response = await fetch(
    isUs30
      ? `/api/us30/candles?${qs.toString()}`
      : `/api/twelve-data?${qs.toString()}`,
    { method: "GET", cache: "no-store" }
  );

  const rawResponse = await response.text();
  let data: any;

  try {
    data = JSON.parse(rawResponse);
  } catch {
    const looksLikeHtml = rawResponse.trim().startsWith("<");
    throw new Error(
      looksLikeHtml
        ? "Endpoint danych zwrócił HTML zamiast JSON. Sprawdź route API."
        : `Nieprawidłowa odpowiedź API: ${rawResponse.slice(0, 140)}`
    );
  }

  if (!response.ok || data?.status === "error" || data?.error) {
    throw new Error(
      data?.message ||
        data?.error ||
        (isUs30
          ? "US30: FX Trade Candle Engine nie ma jeszcze wystarczającej historii."
          : "Nie udało się pobrać świec z Twelve Data.")
    );
  }

  const values = Array.isArray(data?.values) ? data.values : [];
  const next: CandlestickData[] = values
    .map((c: any) => {
      const raw = String(c.datetime ?? "");
      const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
      const parsed = Date.parse(
        /Z$|[+-]\d\d:\d\d$/.test(normalized) ? normalized : `${normalized}Z`
      );

      return {
        time: Math.floor(parsed / 1000) as UTCTimestamp,
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
      };
    })
    .filter(
      (c: any) =>
        Number.isFinite(Number(c.time)) &&
        Number.isFinite(c.open) &&
        Number.isFinite(c.high) &&
        Number.isFinite(c.low) &&
        Number.isFinite(c.close)
    )
    .sort((a: any, b: any) => Number(a.time) - Number(b.time));

  if (!next.length) {
    throw new Error(`Brak świec dla ${setup.instrument} ${setup.tf}.`);
  }

  return next;
}

export default function AlphaScannerPage() {
  const [tf, setTf] = React.useState<"All" | TF>("All");
  const [trend, setTrend] = React.useState<TrendFilter>("All");
  const [liquidity, setLiquidity] = React.useState<LiquidityFilter>("All");
  const [liveSetups, setLiveSetups] = React.useState<Setup[]>(SETUPS);
  const [selected, setSelected] = React.useState<Setup>(SETUPS[0]);
  const [candles, setCandles] = React.useState<CandlestickData[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [scanLoading, setScanLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [fullChart, setFullChart] = React.useState(false);
  const [lastScanAt, setLastScanAt] = React.useState<Date | null>(null);
  const [autoScan, setAutoScan] = React.useState(true);

  const filtered = React.useMemo(() => {
    return liveSetups.filter((s) => {
      if (tf !== "All" && s.tf !== tf) return false;
      if (trend === "Uptrend" && (s.trendDirection ?? (s.direction === "BUY" ? "UP" : "DOWN")) !== "UP") return false;
      if (trend === "Downtrend" && (s.trendDirection ?? (s.direction === "SELL" ? "DOWN" : "UP")) !== "DOWN") return false;
      if (liquidity === "High" && s.liquidityPct < 70) return false;
      if (
        liquidity === "Medium" &&
        (s.liquidityPct < 40 || s.liquidityPct >= 70)
      )
        return false;
      return true;
    });
  }, [liveSetups, tf, trend, liquidity]);

  const loadCandles = React.useCallback(async (setup: Setup) => {
    setLoading(true);
    setError("");

    try {
      const next = await fetchSetupCandles(setup);
      const analyzed = analyzeSetup(setup, next);
      setCandles(next);
      setLiveSetups((previous) =>
        previous.map((item) =>
          item.instrument === analyzed.instrument && item.tf === analyzed.tf
            ? analyzed
            : item
        )
      );
      setSelected((current) =>
        current.instrument === analyzed.instrument && current.tf === analyzed.tf
          ? analyzed
          : current
      );
    } catch (e) {
      setCandles([]);
      setError(e instanceof Error ? e.message : "Błąd pobierania danych rynkowych");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadCandles(selected);
  }, [selected.instrument, selected.tf, loadCandles]);

  React.useEffect(() => {
    if (!fullChart) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFullChart(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [fullChart]);

  const selectSetup = (setup: Setup) => {
    setSelected(setup);
  };

  const runScan = React.useCallback(async () => {
    if (scanLoading) return;
    setScanLoading(true);
    setError("");

    try {
      const results = await Promise.allSettled(
        liveSetups.map(async (setup) => {
          const nextCandles = await fetchSetupCandles(setup);
          return {
            setup: analyzeSetup(setup, nextCandles),
            candles: nextCandles,
          };
        })
      );

      const successful = results
        .filter((result): result is PromiseFulfilledResult<{ setup: Setup; candles: CandlestickData[] }> => result.status === "fulfilled")
        .map((result) => result.value);

      if (!successful.length) {
        throw new Error("Skaner nie otrzymał poprawnych danych dla żadnego instrumentu.");
      }

      const nextSetups = liveSetups.map((oldSetup) => {
        const updated = successful.find(
          (item) =>
            item.setup.instrument === oldSetup.instrument && item.setup.tf === oldSetup.tf
        );
        return updated?.setup ?? oldSetup;
      });

      setLiveSetups(nextSetups);
      setLastScanAt(new Date());

      const selectedResult = successful.find(
        (item) =>
          item.setup.instrument === selected.instrument && item.setup.tf === selected.tf
      );

      const best = [...successful].sort((a, b) => b.setup.confidence - a.setup.confidence)[0];
      const active = selectedResult ?? best;
      setSelected(active.setup);
      setCandles(active.candles);

      const failedCount = results.length - successful.length;
      if (failedCount > 0) {
        setError(`Skan zakończony. ${successful.length}/${results.length} rynków zaktualizowano; ${failedCount} bez świeżych danych.`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd skanowania rynku");
    } finally {
      setScanLoading(false);
    }
  }, [liveSetups, selected.instrument, selected.tf, scanLoading]);

  React.useEffect(() => {
    if (!autoScan) return;

    const timer = window.setInterval(() => {
      void runScan();
    }, 15 * 60_000); // AUTO SCAN co 15 minut

    return () => window.clearInterval(timer);
  }, [autoScan, runScan]);

  const reset = () => {
    setTf("All");
    setTrend("All");
    setLiquidity("All");
    const first = liveSetups[0] ?? SETUPS[0];
    setSelected(first);
  };

  const liveLevels = React.useMemo(() => {
    if (selected.status === "WARMUP") {
      return {
        entry: Number.NaN,
        sl: Number.NaN,
        tp1: Number.NaN,
        tp2: Number.NaN,
        rr: "—",
      };
    }

    const fallback = {
      entry: Number(selected.entry),
      sl: Number(selected.sl),
      tp1: Number(selected.tp1),
      tp2: Number(selected.tp2),
      rr: selected.rr,
    };

    if (!candles.length) return fallback;

    const recent = candles.slice(-20) as any[];
    const last = candles[candles.length - 1] as any;
    const close = Number(last.close);

    const avgRange =
      recent.reduce(
        (sum, c) => sum + Math.abs(Number(c.high) - Number(c.low)),
        0
      ) / Math.max(1, recent.length);

    const risk = Math.max(avgRange * 1.6, Math.abs(close) * 0.001);

    if (selected.direction === "BUY") {
      return {
        entry: close,
        sl: close - risk,
        tp1: close + risk * 1.5,
        tp2: close + risk * 2.5,
        rr: "1 : 2.5",
      };
    }

    return {
      entry: close,
      sl: close + risk,
      tp1: close - risk * 1.5,
      tp2: close - risk * 2.5,
      rr: "1 : 2.5",
    };
  }, [candles, selected]);

  const formatLevel = (value: number) => {
    if (!Number.isFinite(value)) return "—";
    if (selected.instrument === "EURUSD" || selected.instrument === "GBPUSD")
      return value.toFixed(5);
    if (selected.instrument === "USDJPY") return value.toFixed(3);
    if (selected.instrument === "BTCUSD" || selected.instrument === "ETHUSD")
      return value.toFixed(2);
    if (selected.instrument === "SOLUSD") return value.toFixed(3);
    return value.toFixed(2);
  };

  const ready = liveSetups.filter((x) => x.status === "READY").length;
  const buys = liveSetups.filter((x) => x.status !== "WARMUP" && x.direction === "BUY").length;
  const sells = liveSetups.filter((x) => x.status !== "WARMUP" && x.direction === "SELL").length;
  const avg = Math.round(
    liveSetups.reduce((sum, x) => sum + x.confidence, 0) / Math.max(1, liveSetups.length)
  );

  return (
    <main className="min-h-screen bg-[#061a33] bg-[linear-gradient(rgba(3,18,38,0.58),rgba(3,18,38,0.58)),url('/alpha-scanner-bg.png')] bg-cover bg-center bg-fixed bg-no-repeat px-3 py-4 text-white md:px-5">
      <div className="mx-auto max-w-[1950px] space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/skaner"
              className="inline-flex items-center gap-1 text-[11px] text-sky-300"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to scanners
            </Link>
            <h1 className="mt-2 text-[34px] font-bold tracking-tight">
              Alpha Scanner
            </h1>
            <p className="text-[12px] text-white/45">
              Live market scanner · Trend · Liquidity Sweep · Momentum · Price Action
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2.5 text-[11px] font-bold text-emerald-300">
              ● LIVE
            </div>

            <div className="rounded-xl border border-sky-300/15 bg-[#0d3158] px-4 py-2.5 text-[10px] text-white/55">
              LAST SCAN <span className="ml-1 font-bold text-white">{lastScanAt ? lastScanAt.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" }) : "—"}</span>
            </div>

            <button
              type="button"
              onClick={() => setAutoScan((value) => !value)}
              className={`inline-flex min-w-[145px] items-center justify-center gap-2 rounded-xl border px-5 py-3 text-[12px] font-bold transition ${
                autoScan
                  ? "border-emerald-400/35 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/20"
                  : "border-sky-300/15 bg-[#0d3158] text-white/65 hover:bg-sky-300/[0.10]"
              }`}
            >
              <RefreshCw className={`h-4 w-4 ${autoScan ? "animate-spin [animation-duration:3s]" : ""}`} />
              AUTO SCAN {autoScan ? "ON" : "OFF"}
            </button>

            <button
              type="button"
              onClick={() => void runScan()}
              disabled={scanLoading}
              className="inline-flex min-w-[175px] items-center justify-center gap-2 rounded-xl border border-cyan-200/30 bg-sky-500 px-6 py-3 text-[13px] font-extrabold shadow-[0_0_22px_rgba(14,165,233,0.38)] transition hover:bg-sky-400 hover:shadow-[0_0_30px_rgba(56,189,248,0.50)] disabled:opacity-60"
            >
              {scanLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              {scanLoading ? "SCANNING..." : "SCAN NOW"}
            </button>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-4">
          {[
            ["READY SETUPS", ready, "High probability", "text-sky-300", <Zap key="i1" className="h-6 w-6" />],
            ["BUY SIGNALS", buys, "Bullish setups", "text-emerald-300", <TrendingUp key="i2" className="h-6 w-6" />],
            ["SELL SIGNALS", sells, "Bearish setups", "text-rose-300", <TrendingDown key="i3" className="h-6 w-6" />],
            ["AI CONFIDENCE", `${avg}%`, "Average confidence", "text-purple-300", <Brain key="i4" className="h-6 w-6" />],
          ].map(([title, value, sub, color, icon]) => (
            <div
              key={String(title)}
              className="flex items-center justify-between rounded-[20px] border border-sky-300/30 bg-[#0b2a4b]/95 p-5 shadow-[0_0_22px_rgba(14,165,233,0.16),inset_0_0_22px_rgba(56,189,248,0.05)] backdrop-blur-sm"
            >
              <div>
                <div className="text-[10px] text-white/40">{title}</div>
                <div className={`mt-2 text-3xl font-bold ${String(color)}`}>
                  {String(value)}
                </div>
                <div className="mt-1 text-[10px] text-white/35">{sub}</div>
              </div>
              <div className={`rounded-xl bg-black/15 p-3 ${String(color)}`}>
                {icon}
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-4 rounded-[20px] border border-sky-300/30 bg-[#0b2a4b]/95 p-4 shadow-[0_0_24px_rgba(14,165,233,0.14),inset_0_0_24px_rgba(56,189,248,0.04)] backdrop-blur-sm xl:grid-cols-[1fr_1fr_1.15fr_auto]">
          <div>
            <div className="mb-2 text-[9px] uppercase text-white/35">
              Timeframe
            </div>
            <div className="flex flex-wrap gap-2">
              {(["All", "M5", "M15", "H1", "H4", "D1"] as const).map((x) => (
                <FilterButton
                  key={x}
                  active={tf === x}
                  onClick={() => setTf(x)}
                >
                  {x}
                </FilterButton>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-[9px] uppercase text-white/35">
              Trend Filter
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterButton
                active={trend === "All"}
                onClick={() => setTrend("All")}
              >
                All
              </FilterButton>
              <FilterButton
                tone="green"
                active={trend === "Uptrend"}
                onClick={() => setTrend("Uptrend")}
              >
                Uptrend
              </FilterButton>
              <FilterButton
                tone="red"
                active={trend === "Downtrend"}
                onClick={() => setTrend("Downtrend")}
              >
                Downtrend
              </FilterButton>
            </div>
          </div>

          <div>
            <div className="mb-2 text-[9px] uppercase text-white/35">
              Liquidity Filter
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterButton
                active={liquidity === "All"}
                onClick={() => setLiquidity("All")}
              >
                All
              </FilterButton>
              <FilterButton
                active={liquidity === "High"}
                onClick={() => setLiquidity("High")}
              >
                High (70%+)
              </FilterButton>
              <FilterButton
                active={liquidity === "Medium"}
                onClick={() => setLiquidity("Medium")}
              >
                Medium (40–70%)
              </FilterButton>
            </div>
          </div>

          <div className="flex items-end justify-end">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-xl border border-sky-300/15 bg-sky-300/[0.06] px-4 py-2.5 text-[11px] text-white/70 hover:bg-sky-300/[0.12]"
            >
              <RefreshCw className="h-4 w-4" />
              Reset Filters
            </button>
          </div>
        </section>

        {/* Cleaner layout: no internal Signal panel. Chart gets all available center space. */}
        <section className="grid gap-3 xl:grid-cols-[455px_minmax(0,1fr)_285px]">
          <aside className="min-w-0 overflow-hidden rounded-[20px] border border-cyan-300/35 bg-[#0b2a4b]/95 shadow-[0_0_28px_rgba(14,165,233,0.20),0_0_8px_rgba(34,211,238,0.14),inset_0_0_28px_rgba(56,189,248,0.05)] backdrop-blur-sm">
            <div className="border-b border-sky-300/15 px-4 py-3 text-[11px] font-bold">
              SETUPS ({filtered.length})
            </div>

            <div className="grid grid-cols-[minmax(190px,1fr)_48px_58px_56px_68px] border-b border-sky-300/15 bg-sky-300/[0.035] px-3 py-2.5 text-[8px] uppercase text-white/30">
              <div>Instrument</div>
              <div>TF</div>
              <div>AI</div>
              <div>Dir.</div>
              <div>Status</div>
            </div>

            {filtered.map((s) => {
              const active =
                selected.instrument === s.instrument && selected.tf === s.tf;

              return (
                <button
                  key={`${s.instrument}-${s.tf}`}
                  onClick={() => selectSetup(s)}
                  className={`grid w-full grid-cols-[minmax(190px,1fr)_48px_58px_56px_68px] items-center border-b border-white/[0.07] px-3 py-3.5 text-left transition ${
                    active
                      ? "bg-sky-400/18 ring-1 ring-inset ring-cyan-300/70 shadow-[inset_0_0_18px_rgba(34,211,238,0.10)]"
                      : "hover:bg-sky-300/[0.08] hover:shadow-[inset_0_0_14px_rgba(56,189,248,0.06)]"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Star
                      className={`h-3.5 w-3.5 shrink-0 ${
                        active ? "fill-amber-300 text-amber-300" : "text-white/25"
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="text-[12px] font-bold leading-tight">
                        {s.instrument}
                      </div>
                      <div className="mt-0.5 truncate text-[8px] leading-tight text-white/40">
                        {s.name}
                      </div>
                    </div>
                  </div>

                  <div className="text-[9px] font-semibold">{s.tf}</div>
                  <div
                    className={`text-[9px] font-bold ${
                      s.confidence >= 80
                        ? "text-emerald-300"
                        : "text-amber-300"
                    }`}
                  >
                    {s.confidence}%
                  </div>
                  <div
                    className={`text-[8px] font-bold ${
                      s.direction === "BUY"
                        ? "text-emerald-300"
                        : "text-rose-300"
                    }`}
                  >
                    {s.direction}
                  </div>
                  <div>
                    <span
                      className={`rounded px-1.5 py-1 text-[7px] font-bold ${
                        s.status === "READY"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-amber-500/15 text-amber-300"
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                </button>
              );
            })}
          </aside>

          <div className="min-w-0">
            <AlphaPriceChart
              key={`${selected.instrument}-${selected.tf}`}
              symbol={selected.instrument}
              tf={selected.tf}
              candles={candles}
              loading={loading}
              priceAction={selected.priceAction}
              direction={selected.direction}
              entry={liveLevels.entry}
              sl={liveLevels.sl}
              tp1={liveLevels.tp1}
              tp2={liveLevels.tp2}
              height={760}
            />

            {error ? (
              <div className="mt-2 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-[10px] text-rose-200">
                {selected.instrument === "US30" ? "FX Trade Candle Engine" : "Market Data"}: {error}
              </div>
            ) : null}
          </div>

          <aside className="rounded-[20px] border border-cyan-300/35 bg-[#0b2a4b]/95 p-4 shadow-[0_0_28px_rgba(14,165,233,0.20),0_0_8px_rgba(34,211,238,0.14),inset_0_0_28px_rgba(56,189,248,0.05)] backdrop-blur-sm">
            <div className="text-[24px] font-bold">{selected.instrument}</div>
            <div className="text-[10px] text-white/40">{selected.name}</div>

            <div className="mt-4">
              <span
                className={`rounded-lg px-3 py-1.5 text-[9px] font-bold ${
                  selected.direction === "BUY"
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-rose-500/15 text-rose-300"
                }`}
              >
                {selected.direction} SETUP
              </span>
            </div>

            <div className="mt-5 space-y-3 border-t border-sky-300/15 pt-4">
              <div className="flex justify-between gap-2">
                <span className="text-[10px]">Trend Filter</span>
                <Pass value={selected.trend} />
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[10px]">Liquidity Sweep</span>
                <Pass value={selected.sweep} />
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[10px]">Momentum Candle</span>
                <Pass value={selected.momentum} />
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-[10px]">Price Action</span>
                <span className="max-w-[120px] text-right text-[9px] font-semibold">
                  {selected.priceAction}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-[10px]">Session Filter</span>
                <span className="text-[9px]">{selected.session}</span>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-[#082746]/95 p-5 text-center shadow-[0_0_18px_rgba(34,211,238,0.12),inset_0_0_18px_rgba(56,189,248,0.05)]">
              <div className="text-[10px] text-white/40">AI Confidence</div>
              <div className="mt-2 text-5xl font-bold text-emerald-300">
                {selected.confidence}%
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {[
                ["Entry", formatLevel(liveLevels.entry), "text-sky-300"],
                ["Stop Loss", formatLevel(liveLevels.sl), "text-rose-300"],
                ["Take Profit 1", formatLevel(liveLevels.tp1), "text-emerald-300"],
                ["Take Profit 2", formatLevel(liveLevels.tp2), "text-emerald-300"],
                ["Risk / Reward", liveLevels.rr, "text-white"],
              ].map(([label, value, cls]) => (
                <div
                  key={label}
                  className="flex items-center justify-between text-[10px]"
                >
                  <span className="text-white/40">{label}</span>
                  <span className={`font-semibold ${cls}`}>{value}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setFullChart(true)}
              className="mt-5 w-full rounded-xl border border-cyan-200/30 bg-sky-500 py-3 text-[11px] font-bold shadow-[0_0_18px_rgba(14,165,233,0.35)] transition hover:bg-sky-400 hover:shadow-[0_0_24px_rgba(56,189,248,0.45)]"
            >
              View Full Chart
            </button>
          </aside>
        </section>

        {fullChart ? (
          <div
            className="fixed inset-0 z-[100] bg-[#061a33]/98 p-3 md:p-5"
            role="dialog"
            aria-modal="true"
            aria-label="Full screen chart"
          >
            <div className="flex h-full flex-col overflow-hidden rounded-[22px] border border-sky-500/25 bg-[#071f39] shadow-2xl shadow-black/50">
              <div className="flex items-center justify-between border-b border-sky-300/15 px-4 py-3">
                <div>
                  <div className="text-[16px] font-bold text-white">
                    {selected.instrument} · {selected.tf}
                  </div>
                  <div className="mt-1 text-[9px] text-white/40">
                    Full Chart · {selected.instrument === "US30" ? "Live-Rates / FX Trade Candle Engine" : "Twelve Data"} · {selected.priceAction}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="hidden text-[9px] text-white/35 sm:inline">
                    ESC — zamknij
                  </span>
                  <button
                    type="button"
                    onClick={() => setFullChart(false)}
                    className="rounded-xl border border-sky-300/15 bg-sky-300/[0.06] px-4 py-2 text-[11px] font-semibold text-white/80 transition hover:bg-sky-300/[0.12]"
                  >
                    Zamknij ✕
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 p-2">
                <AlphaPriceChart
                  key={`fullscreen-${selected.instrument}-${selected.tf}`}
                  symbol={selected.instrument}
                  tf={selected.tf}
                  candles={candles}
                  loading={loading}
                  priceAction={selected.priceAction}
                  direction={selected.direction}
                  entry={liveLevels.entry}
                  sl={liveLevels.sl}
                  tp1={liveLevels.tp1}
                  tp2={liveLevels.tp2}
                  height={Math.max(520, typeof window !== "undefined" ? window.innerHeight - 115 : 760)}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
