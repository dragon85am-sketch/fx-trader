"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ColorType,
  CrosshairMode,
  LineStyle,
  UTCTimestamp,
  createChart,
} from "lightweight-charts";

type Category = "Forex" | "Crypto";
type Timeframe = "4h" | "1d" | "1w";

type Candle = {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type SignalSide = "BUY" | "SELL" | "NONE";

type SignalResult = {
  side: SignalSide;
  entry: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  reason: string;
  rr: string;
  trend: "Bullish" | "Bearish" | "Neutral";
  score: number;
  quality: "WEAK" | "GOOD" | "STRONG" | "NONE";
};

type TradeStatus = "ACTIVE" | "TP1" | "TP2" | "SL";

type StoredTrade = {
  id: string;
  date: string;
  instrument: string;
  side: "BUY" | "SELL";
  entry: number;
  tp1: number;
  tp2: number;
  tp3: number;
  sl: number;
  active: boolean;
  status: TradeStatus;
  timeframe: Timeframe;
  lastPrice?: number;
};

const ACTIVE_TRADES_STORAGE_KEY = "fxtrade_active_scanner_trades_v3";

const instrumentOptions: Record<Category, string[]> = {
  Forex: [
    "EUR/USD",
    "GBP/USD",
    "USD/JPY",
    "USD/CHF",
    "AUD/USD",
    "USD/CAD",
    "NZD/USD",
    "EUR/JPY",
    "EUR/GBP",
    "EUR/CHF",
    "EUR/AUD",
    "EUR/CAD",
    "EUR/NZD",
    "GBP/JPY",
    "GBP/CHF",
    "GBP/AUD",
    "GBP/CAD",
    "GBP/NZD",
    "AUD/JPY",
    "AUD/NZD",
    "AUD/CAD",
    "AUD/CHF",
    "CAD/JPY",
    "CAD/CHF",
    "CHF/JPY",
    "NZD/JPY",
    "NZD/CAD",
    "NZD/CHF",
    "XAU/USD",
    "XAG/USD",
  ],
  Crypto: [
    "BTC/USD",
    "ETH/USD",
    "SOL/USD",
    "XRP/USD",
    "BNB/USD",
    "ADA/USD",
    "DOGE/USD",
    "AVAX/USD",
    "DOT/USD",
    "LINK/USD",
    "LTC/USD",
    "BCH/USD",
    "TRX/USD",
    "MATIC/USD",
    "UNI/USD",
    "ATOM/USD",
    "ETC/USD",
    "APT/USD",
    "ARB/USD",
    "OP/USD",
  ],
};

const timeframeOptions: Timeframe[] = ["4h", "1d", "1w"];

function cn(...xs: Array<string | undefined | false>) {
  return xs.filter(Boolean).join(" ");
}

function toUtcTimestampFromString(value: string): UTCTimestamp {
  return Math.floor(new Date(value).getTime() / 1000) as UTCTimestamp;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getDecimals(pair: string) {
  if (
    pair.includes("BTC") ||
    pair.includes("ETH") ||
    pair.includes("SOL") ||
    pair.includes("BNB") ||
    pair.includes("AVAX") ||
    pair.includes("DOT") ||
    pair.includes("LINK") ||
    pair.includes("LTC") ||
    pair.includes("BCH") ||
    pair.includes("UNI") ||
    pair.includes("ATOM") ||
    pair.includes("ETC") ||
    pair.includes("APT") ||
    pair.includes("OP")
  ) {
    return 2;
  }

  if (
    pair.includes("XRP") ||
    pair.includes("ADA") ||
    pair.includes("DOGE") ||
    pair.includes("TRX") ||
    pair.includes("MATIC") ||
    pair.includes("ARB")
  ) {
    return 4;
  }

  if (pair.includes("XAU")) return 2;
  if (pair.includes("XAG")) return 3;
  if (pair.includes("JPY")) return 3;
  return 5;
}

function calcEMA(values: number[], period: number) {
  if (!values.length) return [];
  const k = 2 / (period + 1);
  let prev = values[0];

  return values.map((value, index) => {
    if (index === 0) {
      prev = value;
      return value;
    }
    prev = value * k + prev * (1 - k);
    return prev;
  });
}

function calcATR(candles: Candle[], period = 14) {
  if (!candles.length) return [];

  const trs = candles.map((c, i) => {
    if (i === 0) return c.high - c.low;
    const prevClose = candles[i - 1].close;
    return Math.max(
      c.high - c.low,
      Math.abs(c.high - prevClose),
      Math.abs(c.low - prevClose)
    );
  });

  const atr: number[] = [];
  let rolling = 0;

  for (let i = 0; i < trs.length; i++) {
    rolling += trs[i];
    if (i < period) {
      atr.push(rolling / (i + 1));
    } else {
      rolling = atr[i - 1] * (period - 1) + trs[i];
      atr.push(rolling / period);
    }
  }

  return atr;
}

function normalizeCandles(input: Candle[]): Candle[] {
  const map = new Map<number, Candle>();

  for (const c of input) {
    const normalized: Candle = {
      time: Number(c.time) as UTCTimestamp,
      open: Number(c.open),
      high: Number(c.high),
      low: Number(c.low),
      close: Number(c.close),
      volume: Number(c.volume ?? 0),
    };

    if (
      Number.isFinite(normalized.time) &&
      Number.isFinite(normalized.open) &&
      Number.isFinite(normalized.high) &&
      Number.isFinite(normalized.low) &&
      Number.isFinite(normalized.close) &&
      Number.isFinite(normalized.volume)
    ) {
      map.set(Number(normalized.time), normalized);
    }
  }

  return Array.from(map.values()).sort((a, b) => Number(a.time) - Number(b.time));
}

function detectSignal(
  candles: Candle[],
  pair: string,
  autoSignals: boolean,
  autoRisk: boolean
): SignalResult {
  if (!autoSignals || candles.length < 120) {
    return {
      side: "NONE",
      entry: null,
      stopLoss: null,
      takeProfit: null,
      reason: "Auto signals OFF",
      rr: "—",
      trend: "Neutral",
      score: 0,
      quality: "NONE",
    };
  }

  const closes = candles.map((c) => c.close);
  const ema50 = calcEMA(closes, 50);
  const ema100 = calcEMA(closes, 100);
  const atr = calcATR(candles, 14);

  const last = candles[candles.length - 1];
  const lastAtr = atr[atr.length - 1] || 0;
  const decimals = getDecimals(pair);

  const ema50Last = ema50[ema50.length - 1];
  const ema100Last = ema100[ema100.length - 1];

  const trend: "Bullish" | "Bearish" | "Neutral" =
    last.close > ema50Last && ema50Last > ema100Last
      ? "Bullish"
      : last.close < ema50Last && ema50Last < ema100Last
      ? "Bearish"
      : "Neutral";

  const avgVolume =
    candles.slice(-20).reduce((sum, c) => sum + (c.volume || 0), 0) / 20;

  const atrPct = last.close > 0 ? (lastAtr / last.close) * 100 : 0;
  const volumeRatio = avgVolume > 0 ? last.volume / avgVolume : 0;

  const minAtrPct =
    pair.includes("BTC") || pair.includes("ETH") || pair.includes("SOL")
      ? 1.0
      : pair.includes("XRP")
      ? 1.2
      : 0.18;

  const atrOk = atrPct >= minAtrPct;
  const volumeOk = avgVolume === 0 ? true : volumeRatio >= 1.05;

  const bullishPullback = last.close > ema50Last && last.low <= ema50Last * 1.01;
  const bearishPullback = last.close < ema50Last && last.high >= ema50Last * 0.99;

  let score = 0;
  if (trend === "Bullish" || trend === "Bearish") score += 30;
  if (trend === "Bullish" && bullishPullback) score += 25;
  if (trend === "Bearish" && bearishPullback) score += 25;
  if (atrOk) score += 20;
  if (volumeOk) score += 15;
  if (score > 100) score = 100;

  let quality: "WEAK" | "GOOD" | "STRONG" | "NONE" = "NONE";
  if (score >= 80) quality = "STRONG";
  else if (score >= 60) quality = "GOOD";
  else if (score >= 45) quality = "WEAK";

  if (trend === "Neutral") {
    return {
      side: "NONE",
      entry: null,
      stopLoss: null,
      takeProfit: null,
      reason: "Brak trendu",
      rr: "—",
      trend,
      score,
      quality: "NONE",
    };
  }

  const bullishSignal =
    trend === "Bullish" && bullishPullback && atrOk && volumeOk;

  const bearishSignal =
    trend === "Bearish" && bearishPullback && atrOk && volumeOk;

  if (!bullishSignal && !bearishSignal) {
    return {
      side: "NONE",
      entry: null,
      stopLoss: null,
      takeProfit: null,
      reason: "Brak potwierdzonego pullbacku",
      rr: "—",
      trend,
      score,
      quality,
    };
  }

  const side: SignalSide = bullishSignal ? "BUY" : "SELL";
  const entry = last.close;

  let stopLoss: number | null = null;
  let takeProfit: number | null = null;

  if (autoRisk) {
    const slDistance = Math.max(
      lastAtr * 1.8,
      pair.includes("BTC") || pair.includes("ETH") || pair.includes("SOL")
        ? entry * 0.02
        : pair.includes("XRP")
        ? entry * 0.03
        : entry * 0.004
    );

    const tpDistance = slDistance * 2.5;

    if (side === "BUY") {
      stopLoss = Number((entry - slDistance).toFixed(decimals));
      takeProfit = Number((entry + tpDistance).toFixed(decimals));
    } else {
      stopLoss = Number((entry + slDistance).toFixed(decimals));
      takeProfit = Number((entry - tpDistance).toFixed(decimals));
    }
  }

  return {
    side,
    entry: Number(entry.toFixed(decimals)),
    stopLoss,
    takeProfit,
    reason:
      side === "BUY"
        ? "Trend bullish + pullback do EMA50 + ATR + volume"
        : "Trend bearish + pullback do EMA50 + ATR + volume",
    rr: autoRisk ? "1:2.50" : "—",
    trend,
    score,
    quality,
  };
}

function fmt(value: number | null, pair: string) {
  if (value === null) return "—";
  return value.toFixed(getDecimals(pair));
}

function fmtTime(ts?: UTCTimestamp) {
  if (!ts) return "—";
  const d = new Date(ts * 1000);
  return d.toLocaleString("pl-PL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildStoredTrade(
  signal: SignalResult,
  pair: string,
  timeframe: Timeframe,
  lastTime?: UTCTimestamp
): StoredTrade | null {
  if (
    signal.side === "NONE" ||
    signal.entry === null ||
    signal.stopLoss === null
  ) {
    return null;
  }

  const decimals = getDecimals(pair);
  const risk = Math.abs(signal.entry - signal.stopLoss);

  let tp1 = 0;
  let tp2 = 0;
  let tp3 = 0;

  if (signal.side === "BUY") {
    tp1 = signal.entry + risk * 1;
    tp2 = signal.entry + risk * 2;
    tp3 = signal.entry + risk * 3;
  } else {
    tp1 = signal.entry - risk * 1;
    tp2 = signal.entry - risk * 2;
    tp3 = signal.entry - risk * 3;
  }

  return {
    id: `${pair}-${timeframe}-${lastTime ?? Date.now()}`,
    date: fmtTime(lastTime),
    instrument: pair,
    side: signal.side,
    entry: Number(signal.entry.toFixed(decimals)),
    tp1: Number(tp1.toFixed(decimals)),
    tp2: Number(tp2.toFixed(decimals)),
    tp3: Number(tp3.toFixed(decimals)),
    sl: Number(signal.stopLoss.toFixed(decimals)),
    active: true,
    status: "ACTIVE",
    timeframe,
  };
}

function loadStoredTrades(): StoredTrade[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ACTIVE_TRADES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredTrades(trades: StoredTrade[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACTIVE_TRADES_STORAGE_KEY, JSON.stringify(trades));
  } catch {}
}

function resolveTradeStatus(
  trade: StoredTrade,
  latestPrice: number
): TradeStatus {
  if (trade.side === "BUY") {
    if (latestPrice <= trade.sl) return "SL";
    if (latestPrice >= trade.tp2) return "TP2";
    if (latestPrice >= trade.tp1) return "TP1";
    return "ACTIVE";
  }

  if (latestPrice >= trade.sl) return "SL";
  if (latestPrice <= trade.tp2) return "TP2";
  if (latestPrice <= trade.tp1) return "TP1";
  return "ACTIVE";
}

function statusTone(status: TradeStatus) {
  if (status === "SL") return "text-rose-300 bg-rose-500/15";
  if (status === "TP1" || status === "TP2") {
    return "text-emerald-300 bg-emerald-500/15";
  }
  return "text-blue-300 bg-blue-500/15";
}

function StatBox({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "positive" | "negative";
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="text-[11px] uppercase tracking-[0.18em] text-white/35">
        {label}
      </div>
      <div
        className={cn(
          "mt-2 text-base font-semibold",
          tone === "positive" && "text-emerald-300",
          tone === "negative" && "text-rose-300",
          tone === "default" && "text-white"
        )}
      >
        {value}
      </div>
    </div>
  );
}

async function fetchTwelveDataCandles(
  pair: string,
  timeframe: Timeframe
): Promise<Candle[]> {
  const apiKey = process.env.NEXT_PUBLIC_TWELVE_DATA_API_KEY;

  if (!apiKey) {
    throw new Error("Brak NEXT_PUBLIC_TWELVE_DATA_API_KEY w .env.local");
  }

  const interval =
    timeframe === "4h" ? "4h" : timeframe === "1d" ? "1day" : "1week";

  const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(
    pair
  )}&interval=${interval}&outputsize=240&apikey=${apiKey}`;

  const response = await fetch(url, { cache: "no-store" });
  const json = await response.json();

  if (!response.ok || json.status === "error" || !json.values) {
    throw new Error(json.message || "Nie udało się pobrać danych z Twelve Data");
  }

  return normalizeCandles(
    json.values.map((row: any) => ({
      time: toUtcTimestampFromString(row.datetime),
      open: Number(row.open),
      high: Number(row.high),
      low: Number(row.low),
      close: Number(row.close),
      volume: Number(row.volume ?? 0),
    }))
  );
}

export default function FxTradeProScanner() {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const chartSectionRef = useRef<HTMLDivElement | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<Category>("Forex");
  const [selectedPair, setSelectedPair] = useState("EUR/USD");
  const [instrumentSearch, setInstrumentSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>("1d");
  const [autoSignals, setAutoSignals] = useState(true);
  const [autoRisk, setAutoRisk] = useState(true);

  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const [storedTrades, setStoredTrades] = useState<StoredTrade[]>([]);
  const [scanLoading, setScanLoading] = useState(false);
  const [hasLoadedStoredTrades, setHasLoadedStoredTrades] = useState(false);

  const allCategoryInstruments = instrumentOptions[selectedCategory];

  const filteredPairs = allCategoryInstruments.filter((instrument) =>
    instrument.toLowerCase().includes(instrumentSearch.toLowerCase())
  );

  const activeTrades = storedTrades.filter(
    (t) => t.status !== "SL" && t.status !== "TP2"
  );

  const closedTrades = storedTrades.filter(
    (t) => t.status === "SL" || t.status === "TP2"
  );

  const chartActiveTrades = activeTrades.filter(
    (t) => t.instrument === selectedPair && t.timeframe === selectedTimeframe
  );

  useEffect(() => {
    const stored = loadStoredTrades();
    setStoredTrades(stored);
    setHasLoadedStoredTrades(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedStoredTrades) return;
    saveStoredTrades(storedTrades);
  }, [storedTrades, hasLoadedStoredTrades]);

  useEffect(() => {
    if (filteredPairs.length > 0 && !filteredPairs.includes(selectedPair)) {
      setSelectedPair(filteredPairs[0]);
    }
  }, [filteredPairs, selectedPair]);

  useEffect(() => {
    setInstrumentSearch("");
    setSearchOpen(false);
  }, [selectedCategory]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!searchRef.current) return;
      if (!searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCandles() {
      try {
        setLoading(true);
        setDataError(null);
        const rows = await fetchTwelveDataCandles(
          selectedPair,
          selectedTimeframe
        );
        if (!cancelled) setCandles(normalizeCandles(rows));
      } catch (error: any) {
        if (!cancelled) {
          setDataError(error.message || "Błąd pobierania danych");
          setCandles([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCandles();
    return () => {
      cancelled = true;
    };
  }, [selectedPair, selectedTimeframe]);

  const cleanCandles = useMemo(() => normalizeCandles(candles), [candles]);

  const lastCandle = cleanCandles[cleanCandles.length - 1];
  const prevCandle = cleanCandles[cleanCandles.length - 2];

  const signal = useMemo(
    () => detectSignal(cleanCandles, selectedPair, autoSignals, autoRisk),
    [cleanCandles, selectedPair, autoSignals, autoRisk]
  );

  const previewTrade = useMemo(
    () =>
      buildStoredTrade(
        signal,
        selectedPair,
        selectedTimeframe,
        lastCandle?.time
      ),
    [signal, selectedPair, selectedTimeframe, lastCandle]
  );

  const priceChange =
    lastCandle && prevCandle ? lastCandle.close - prevCandle.close : 0;
  const changePct =
    lastCandle && prevCandle ? (priceChange / prevCandle.close) * 100 : 0;

  const handleScanAll = async () => {
    setScanLoading(true);

    try {
      const existingTrades = loadStoredTrades();
      const updatedTrades: StoredTrade[] = [...existingTrades];

      for (const instrument of allCategoryInstruments) {
        try {
          const rows = await fetchTwelveDataCandles(instrument, selectedTimeframe);
          await sleep(900);

          const latestPrice = rows[rows.length - 1]?.close;
          if (latestPrice == null) continue;

          const existingIndex = updatedTrades.findIndex(
            (t) =>
              t.instrument === instrument &&
              t.timeframe === selectedTimeframe &&
              t.status !== "SL" &&
              t.status !== "TP2"
          );

          if (existingIndex >= 0) {
            const existingTrade = updatedTrades[existingIndex];
            const status = resolveTradeStatus(existingTrade, latestPrice);

            updatedTrades[existingIndex] = {
              ...existingTrade,
              lastPrice: latestPrice,
              status,
              active: status !== "SL" && status !== "TP2",
            };

            saveStoredTrades(updatedTrades);
            setStoredTrades([...updatedTrades]);
            continue;
          }

          const instrumentSignal = detectSignal(
            rows,
            instrument,
            autoSignals,
            autoRisk
          );

          const trade = buildStoredTrade(
            instrumentSignal,
            instrument,
            selectedTimeframe,
            rows[rows.length - 1]?.time
          );

          if (trade) {
            const alreadyExists = updatedTrades.some(
              (t) =>
                t.instrument === trade.instrument &&
                t.timeframe === trade.timeframe &&
                t.status !== "SL" &&
                t.status !== "TP2"
            );

            if (!alreadyExists) {
              updatedTrades.push(trade);
              saveStoredTrades(updatedTrades);
              setStoredTrades([...updatedTrades]);
            }
          }
        } catch (error) {
          console.error(`Scan error for ${instrument}`, error);
        }
      }

      saveStoredTrades(updatedTrades);
      setStoredTrades([...updatedTrades]);
    } finally {
      setScanLoading(false);
    }
  };

  const handleSelectTradeInstrument = (instrument: string) => {
    const foundCategory = (Object.keys(instrumentOptions) as Category[]).find(
      (category) => instrumentOptions[category].includes(instrument)
    );

    if (foundCategory && foundCategory !== selectedCategory) {
      setSelectedCategory(foundCategory);
    }

    setSelectedPair(instrument);
    setInstrumentSearch(instrument);
    setSearchOpen(false);

    window.setTimeout(() => {
      chartSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 120);
  };

  useEffect(() => {
    if (!chartContainerRef.current || cleanCandles.length === 0) return;

    chartContainerRef.current.innerHTML = "";

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 760,
      layout: {
        background: { type: ColorType.Solid, color: "#09111f" },
        textColor: "rgba(255,255,255,0.72)",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.05)" },
        horzLines: { color: "rgba(255,255,255,0.05)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.12)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.12)",
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "rgba(59,130,246,0.35)" },
        horzLine: { color: "rgba(59,130,246,0.35)" },
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#10b981",
      downColor: "#f43f5e",
      borderUpColor: "#10b981",
      borderDownColor: "#f43f5e",
      wickUpColor: "#10b981",
      wickDownColor: "#f43f5e",
      priceLineVisible: true,
      lastValueVisible: true,
    });

    candleSeries.setData(
      cleanCandles.map((c) => ({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );

    const closeValues = cleanCandles.map((c) => c.close);
    const ema50 = calcEMA(closeValues, 50);
    const ema100 = calcEMA(closeValues, 100);

    const ema50Series = chart.addLineSeries({
      color: "#3b82f6",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const ema100Series = chart.addLineSeries({
      color: "#f59e0b",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    ema50Series.setData(
      cleanCandles.map((c, i) => ({
        time: c.time,
        value: Number(ema50[i].toFixed(getDecimals(selectedPair))),
      }))
    );

    ema100Series.setData(
      cleanCandles.map((c, i) => ({
        time: c.time,
        value: Number(ema100[i].toFixed(getDecimals(selectedPair))),
      }))
    );

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.78,
        bottom: 0,
      },
    });

    volumeSeries.setData(
      cleanCandles.map((c) => ({
        time: c.time,
        value: c.volume,
        color:
          c.close >= c.open
            ? "rgba(16,185,129,0.35)"
            : "rgba(244,63,94,0.35)",
      }))
    );

    if (chartActiveTrades.length > 0) {
      chartActiveTrades.forEach((trade, index) => {
        candleSeries.createPriceLine({
          price: trade.entry,
          color: "#38bdf8",
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `ENTRY ${index + 1}`,
        });

        candleSeries.createPriceLine({
          price: trade.tp1,
          color: "#22c55e",
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: `TP1 ${index + 1}`,
        });

        candleSeries.createPriceLine({
          price: trade.tp2,
          color: "#eab308",
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `TP2 ${index + 1}`,
        });

        candleSeries.createPriceLine({
          price: trade.sl,
          color: "#ef4444",
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `SL ${index + 1}`,
        });
      });
    } else if (signal.entry !== null) {
      candleSeries.createPriceLine({
        price: signal.entry,
        color: "#38bdf8",
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: "ENTRY",
      });

      if (signal.stopLoss !== null) {
        candleSeries.createPriceLine({
          price: signal.stopLoss,
          color: "#ef4444",
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: "SL",
        });
      }

      if (signal.takeProfit !== null) {
        candleSeries.createPriceLine({
          price: signal.takeProfit,
          color: "#f59e0b",
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: "TP",
        });
      }
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (!chartContainerRef.current) return;
      chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [cleanCandles, selectedPair, signal, chartActiveTrades]);

  return (
    <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,17,35,0.92),rgba(6,12,24,0.98))] p-5 text-white shadow-[0_0_50px_rgba(0,0,0,0.3)] md:p-6">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-blue-300/80">
            FX Trade Scanner
          </div>
          <div className="mt-2 text-2xl font-semibold">Long Term Scanner</div>
          <div className="mt-1 text-sm text-white/45">
            H4 / D1 / W1 • aktualny wykres ceny z API
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {filteredPairs.slice(0, 6).map((instrument) => (
            <button
              key={instrument}
              onClick={() => setSelectedPair(instrument)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs transition",
                selectedPair === instrument
                  ? "bg-blue-500/20 text-white ring-1 ring-blue-400/30 shadow-[0_0_16px_rgba(59,130,246,0.18)]"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              )}
            >
              {instrument}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 rounded-[24px] border border-white/10 bg-[#091424] p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedCategory("Forex")}
              className={cn(
                "rounded-xl px-4 py-2 text-sm transition",
                selectedCategory === "Forex"
                  ? "bg-blue-500/20 text-white ring-1 ring-blue-400/35"
                  : "bg-white/5 text-white/65 hover:bg-white/10"
              )}
            >
              Forex
            </button>
            <button
              onClick={() => setSelectedCategory("Crypto")}
              className={cn(
                "rounded-xl px-4 py-2 text-sm transition",
                selectedCategory === "Crypto"
                  ? "bg-blue-500/20 text-white ring-1 ring-blue-400/35"
                  : "bg-white/5 text-white/65 hover:bg-white/10"
              )}
            >
              Crypto
            </button>

            <div className="mx-2 hidden h-6 w-px bg-white/10 md:block" />

            {timeframeOptions.map((tf) => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm transition",
                  selectedTimeframe === tf
                    ? "bg-white/15 text-white"
                    : "bg-white/5 text-white/65 hover:bg-white/10"
                )}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex flex-1 justify-center xl:px-6">
            <div ref={searchRef} className="relative w-full max-w-[420px]">
              <input
                type="text"
                value={instrumentSearch}
                onChange={(e) => {
                  setInstrumentSearch(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Szukaj instrumentu forex / crypto..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-blue-400/30 focus:bg-white/[0.07]"
              />

              {instrumentSearch && (
                <button
                  onClick={() => {
                    setInstrumentSearch("");
                    setSearchOpen(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-white/40 hover:text-white"
                >
                  ✕
                </button>
              )}

              {searchOpen && (
                <div className="absolute left-0 right-0 top-[110%] z-50 overflow-hidden rounded-2xl border border-white/10 bg-[#091424] shadow-[0_0_30px_rgba(0,0,0,0.35)]">
                  <div className="max-h-[320px] overflow-auto p-2">
                    {filteredPairs.length > 0 ? (
                      filteredPairs.map((instrument) => (
                        <button
                          key={instrument}
                          onClick={() => {
                            setSelectedPair(instrument);
                            setInstrumentSearch(instrument);
                            setSearchOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition",
                            selectedPair === instrument
                              ? "bg-blue-500/15 text-white"
                              : "text-white/75 hover:bg-white/5 hover:text-white"
                          )}
                        >
                          <span>{instrument}</span>
                          <span className="text-[10px] uppercase tracking-[0.16em] text-white/30">
                            {selectedCategory}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-3 text-sm text-white/45">
                        Brak wyników dla:{" "}
                        <span className="text-white/70">{instrumentSearch}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleScanAll}
              disabled={scanLoading}
              className={cn(
                "rounded-xl px-4 py-2 text-sm transition",
                scanLoading
                  ? "cursor-not-allowed bg-blue-500/10 text-blue-200/60 ring-1 ring-blue-400/20"
                  : "bg-blue-500/20 text-blue-200 ring-1 ring-blue-400/30 hover:bg-blue-500/25"
              )}
            >
              {scanLoading ? "Skanuję..." : "Skanuj"}
            </button>

            <button
              onClick={() => setAutoSignals((v) => !v)}
              className={cn(
                "rounded-xl px-4 py-2 text-sm transition",
                autoSignals
                  ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30"
                  : "bg-white/5 text-white/65 hover:bg-white/10"
              )}
            >
              Auto Signals {autoSignals ? "ON" : "OFF"}
            </button>

            <button
              onClick={() => setAutoRisk((v) => !v)}
              className={cn(
                "rounded-xl px-4 py-2 text-sm transition",
                autoRisk
                  ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/30"
                  : "bg-white/5 text-white/65 hover:bg-white/10"
              )}
            >
              Auto TP/SL {autoRisk ? "ON" : "OFF"}
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
        {loading ? (
          <span className="text-blue-300">Pobieram aktualne dane...</span>
        ) : dataError ? (
          <span className="text-rose-300">{dataError}</span>
        ) : (
          <span className="text-emerald-300">Dane załadowane</span>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.62fr_0.72fr]">
        <div className="space-y-4">
          <div
            ref={chartSectionRef}
            className="overflow-hidden rounded-[24px] border border-white/10 bg-[#091424] shadow-[0_0_30px_rgba(0,0,0,0.22)]"
          >
            <div className="border-b border-white/10 px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xl font-semibold">{selectedPair}</div>
                  <div className="mt-1 text-sm text-white/45">
                    {selectedTimeframe.toUpperCase()} · O{" "}
                    {fmt(lastCandle?.open ?? null, selectedPair)} · H{" "}
                    {fmt(lastCandle?.high ?? null, selectedPair)} · L{" "}
                    {fmt(lastCandle?.low ?? null, selectedPair)} · C{" "}
                    {fmt(lastCandle?.close ?? null, selectedPair)}
                  </div>
                </div>

                <div
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm font-medium",
                    priceChange >= 0
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-rose-500/15 text-rose-300"
                  )}
                >
                  {priceChange >= 0 ? "+" : ""}
                  {fmt(priceChange, selectedPair)} (
                  {priceChange >= 0 ? "+" : ""}
                  {changePct.toFixed(2)}%)
                </div>
              </div>
            </div>

            <div className="relative h-[760px] bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_28%)]">
              <div ref={chartContainerRef} className="h-full w-full" />

              <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
                <div className="rounded-full bg-blue-500/15 px-3 py-1 text-xs text-blue-200 ring-1 ring-blue-400/15">
                  EMA 50
                </div>
                <div className="rounded-full bg-amber-500/15 px-3 py-1 text-xs text-amber-200 ring-1 ring-amber-400/15">
                  EMA 100
                </div>

                {chartActiveTrades.length > 0 ? (
                  <div className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-200 ring-1 ring-blue-400/15">
                    ACTIVE TRADES: {chartActiveTrades.length}
                  </div>
                ) : signal.side !== "NONE" ? (
                  <div
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold ring-1",
                      signal.side === "BUY"
                        ? "bg-emerald-500/15 text-emerald-200 ring-emerald-400/15"
                        : "bg-rose-500/15 text-rose-200 ring-rose-400/15"
                    )}
                  >
                    {signal.side} SIGNAL
                  </div>
                ) : (
                  <div className="rounded-full bg-white/8 px-3 py-1 text-xs text-white/60 ring-1 ring-white/10">
                    NO SIGNAL
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#091424] p-4 shadow-[0_0_20px_rgba(0,0,0,0.18)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">Trade Active</div>
                <div className="mt-1 text-sm text-white/45">
                  Trade aktywne do TP2 albo SL
                </div>
              </div>

              <div
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  activeTrades.length > 0 || previewTrade
                    ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/20"
                    : "bg-white/8 text-white/60 ring-1 ring-white/10"
                )}
              >
                {activeTrades.length > 0
                  ? `${activeTrades.length} ACTIVE`
                  : previewTrade
                  ? "PREVIEW"
                  : "BRAK AKTYWNEGO TRADE"}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.04] text-white/45">
                  <tr>
                    <th className="px-4 py-3 font-medium">Data</th>
                    <th className="px-4 py-3 font-medium">Instrument</th>
                    <th className="px-4 py-3 font-medium">Side</th>
                    <th className="px-4 py-3 font-medium">Wejście</th>
                    <th className="px-4 py-3 font-medium">TP1</th>
                    <th className="px-4 py-3 font-medium">TP2</th>
                    <th className="px-4 py-3 font-medium">TP3</th>
                    <th className="px-4 py-3 font-medium">SL</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {activeTrades.length > 0 ? (
                    activeTrades.map((trade) => (
                      <tr
                        key={trade.id}
                        onClick={() =>
                          handleSelectTradeInstrument(trade.instrument)
                        }
                        className="cursor-pointer border-t border-white/10 text-white/85 transition hover:bg-white/[0.03]"
                      >
                        <td className="px-4 py-4">{trade.date}</td>
                        <td className="px-4 py-4 font-medium text-blue-300">
                          {trade.instrument}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1 text-xs font-semibold",
                              trade.side === "BUY"
                                ? "bg-emerald-500/15 text-emerald-300"
                                : "bg-rose-500/15 text-rose-300"
                            )}
                          >
                            {trade.side}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-blue-300">
                          {trade.entry}
                        </td>
                        <td className="px-4 py-4 text-emerald-300">
                          {trade.tp1}
                        </td>
                        <td className="px-4 py-4 text-emerald-300">
                          {trade.tp2}
                        </td>
                        <td className="px-4 py-4 text-emerald-300">
                          {trade.tp3}
                        </td>
                        <td className="px-4 py-4 text-rose-300">{trade.sl}</td>
                        <td className="px-4 py-4">
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1 text-xs font-semibold",
                              statusTone(trade.status)
                            )}
                          >
                            {trade.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : previewTrade ? (
                    <tr
                      onClick={() =>
                        handleSelectTradeInstrument(previewTrade.instrument)
                      }
                      className="cursor-pointer border-t border-white/10 text-white/85 transition hover:bg-white/[0.03]"
                    >
                      <td className="px-4 py-4">{previewTrade.date}</td>
                      <td className="px-4 py-4 font-medium text-blue-300">
                        {previewTrade.instrument}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-semibold",
                            previewTrade.side === "BUY"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-rose-500/15 text-rose-300"
                          )}
                        >
                          {previewTrade.side}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-blue-300">
                        {previewTrade.entry}
                      </td>
                      <td className="px-4 py-4 text-emerald-300">
                        {previewTrade.tp1}
                      </td>
                      <td className="px-4 py-4 text-emerald-300">
                        {previewTrade.tp2}
                      </td>
                      <td className="px-4 py-4 text-emerald-300">
                        {previewTrade.tp3}
                      </td>
                      <td className="px-4 py-4 text-rose-300">
                        {previewTrade.sl}
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-blue-500/15 px-2.5 py-1 text-xs font-semibold text-blue-300">
                          PREVIEW
                        </span>
                      </td>
                    </tr>
                  ) : (
                    <tr className="border-t border-white/10 text-white/55">
                      <td colSpan={9} className="px-4 py-6 text-center">
                        {scanLoading
                          ? "Skanuję aktywne instrumenty..."
                          : "Brak aktywnego trade — kliknij Skanuj, aby przeskanować wszystkie instrumenty."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#091424] p-4 shadow-[0_0_20px_rgba(0,0,0,0.18)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">Closed Trades</div>
                <div className="mt-1 text-sm text-white/45">
                  Zamknięte po TP2 albo SL
                </div>
              </div>

              <div
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  closedTrades.length > 0
                    ? "bg-white/10 text-white ring-1 ring-white/10"
                    : "bg-white/8 text-white/60 ring-1 ring-white/10"
                )}
              >
                {closedTrades.length} CLOSED
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.04] text-white/45">
                  <tr>
                    <th className="px-4 py-3 font-medium">Data</th>
                    <th className="px-4 py-3 font-medium">Instrument</th>
                    <th className="px-4 py-3 font-medium">Side</th>
                    <th className="px-4 py-3 font-medium">Wejście</th>
                    <th className="px-4 py-3 font-medium">TP2</th>
                    <th className="px-4 py-3 font-medium">SL</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {closedTrades.length > 0 ? (
                    closedTrades.map((trade) => (
                      <tr
                        key={trade.id}
                        onClick={() =>
                          handleSelectTradeInstrument(trade.instrument)
                        }
                        className="cursor-pointer border-t border-white/10 text-white/75 transition hover:bg-white/[0.03]"
                      >
                        <td className="px-4 py-4">{trade.date}</td>
                        <td className="px-4 py-4 font-medium text-blue-300">
                          {trade.instrument}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1 text-xs font-semibold",
                              trade.side === "BUY"
                                ? "bg-emerald-500/15 text-emerald-300"
                                : "bg-rose-500/15 text-rose-300"
                            )}
                          >
                            {trade.side}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-blue-300">
                          {trade.entry}
                        </td>
                        <td className="px-4 py-4 text-emerald-300">
                          {trade.tp2}
                        </td>
                        <td className="px-4 py-4 text-rose-300">{trade.sl}</td>
                        <td className="px-4 py-4">
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1 text-xs font-semibold",
                              statusTone(trade.status)
                            )}
                          >
                            {trade.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-t border-white/10 text-white/55">
                      <td colSpan={7} className="px-4 py-6 text-center">
                        Brak zamkniętych trade.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[24px] border border-white/10 bg-[#091424] p-4">
            <div className="mb-3 text-lg font-semibold">Long Term Signal</div>

            <div
              className={cn(
                "mb-4 rounded-2xl border p-4",
                signal.side === "BUY"
                  ? "border-emerald-400/25 bg-emerald-500/10"
                  : signal.side === "SELL"
                    ? "border-rose-400/25 bg-rose-500/10"
                    : "border-white/10 bg-white/5"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm text-white/60">Signal</div>
                <div
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    signal.side === "BUY"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : signal.side === "SELL"
                        ? "bg-rose-500/20 text-rose-300"
                        : "bg-white/10 text-white/65"
                  )}
                >
                  {signal.side}
                </div>
              </div>

              <div className="mt-3 text-sm text-white/75">{signal.reason}</div>
            </div>

            <div className="grid gap-3">
              <StatBox label="Trend bias" value={signal.trend} />
              <StatBox label="Signal score" value={`${signal.score}/100`} />
              <StatBox
                label="Signal quality"
                value={signal.quality}
                tone={
                  signal.quality === "STRONG"
                    ? "positive"
                    : signal.quality === "WEAK"
                      ? "negative"
                      : "default"
                }
              />
              <StatBox label="Entry" value={fmt(signal.entry, selectedPair)} />
              <StatBox
                label="Stop Loss"
                value={fmt(signal.stopLoss, selectedPair)}
                tone="negative"
              />
              <StatBox
                label="Take Profit"
                value={fmt(signal.takeProfit, selectedPair)}
                tone="positive"
              />
              <StatBox label="RR" value={signal.rr} />
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#091424] p-4">
            <div className="mb-3 text-lg font-semibold">Quick Filters</div>

            <div className="space-y-3 text-sm">
              <StatBox label="Category" value={selectedCategory} />
              <StatBox label="Instrument" value={selectedPair} />
              <StatBox
                label="Timeframe"
                value={selectedTimeframe.toUpperCase()}
              />
              <StatBox
                label="Last candle time"
                value={fmtTime(lastCandle?.time)}
              />
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#091424] p-4">
            <div className="mb-3 text-lg font-semibold">Status</div>

            <div className="space-y-3 text-sm text-white/75">
              <div className="rounded-xl bg-white/5 p-3">
                Trade zostaje aktywny, dopóki nie dojdzie do TP2 albo SL.
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                Po trafieniu TP1 trade dalej zostaje aktywny.
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                Po trafieniu TP2 albo SL trade zostaje zamknięty i przeniesiony
                do Closed Trades.
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                Na wykresie pokazują się wszystkie aktywne poziomy ENTRY / TP1 /
                TP2 / SL dla aktualnie wybranego instrumentu.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}