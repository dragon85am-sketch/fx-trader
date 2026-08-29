"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";

type Candle = {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

const instrumentOptions: Record<string, string[]> = {
  Forex: ["EUR/USD", "GBP/JPY", "USD/JPY", "AUD/USD", "USD/CAD", "EUR/JPY"],
  Crypto: ["BTC/USDT", "ETH/USDT", "SOL/USDT", "XRP/USDT"],
  Indeksy: ["NAS100", "US30", "SPX500", "GER40"],
  Surowce: ["XAU/USD", "XAG/USD", "WTI", "BRENT"],
};

function isForexPair(instrument: string) {
  return (
    instrument.includes("EUR") ||
    instrument.includes("GBP") ||
    instrument.includes("JPY") ||
    instrument.includes("AUD") ||
    instrument.includes("CAD")
  );
}

function formatInstrumentToBase(instrument: string) {
  if (instrument === "BTC/USDT") return 72400;
  if (instrument === "ETH/USDT") return 3850;
  if (instrument === "SOL/USDT") return 178;
  if (instrument === "XRP/USDT") return 0.62;
  if (instrument === "XAU/USD") return 2325;
  if (instrument === "XAG/USD") return 29.4;
  if (instrument === "WTI") return 78.2;
  if (instrument === "BRENT") return 82.5;
  if (instrument === "EUR/USD") return 1.083;
  if (instrument === "GBP/JPY") return 189.2;
  if (instrument === "USD/JPY") return 149.4;
  if (instrument === "AUD/USD") return 0.6614;
  if (instrument === "USD/CAD") return 1.352;
  if (instrument === "EUR/JPY") return 161.2;
  if (instrument === "NAS100") return 17820;
  if (instrument === "US30") return 39200;
  if (instrument === "SPX500") return 5230;
  if (instrument === "GER40") return 18420;
  return 100;
}

function generateCandles(instrument: string, count = 140): Candle[] {
  const candles: Candle[] = [];
  let price = formatInstrumentToBase(instrument);
  const start = new Date("2024-10-15T08:00:00Z");
  const forex = isForexPair(instrument);

  for (let i = 0; i < count; i++) {
    const time = Math.floor(
      (start.getTime() + i * 60 * 60 * 1000) / 1000
    ) as UTCTimestamp;

    const move = forex
      ? (Math.random() - 0.45) * 0.0022
      : (Math.random() - 0.45) * Math.max(price * 0.002, 1.2);

    const open = price;
    const close = Math.max(0.0001, open + move);

    const wickSize = forex
      ? Math.random() * 0.0009
      : Math.random() * Math.max(price * 0.001, 0.8);

    const high = Math.max(open, close) + wickSize;
    const low = Math.min(open, close) - wickSize;
    const volume = 80 + Math.floor(Math.random() * 220);

    candles.push({
      time,
      open: Number(open.toFixed(forex ? 4 : 2)),
      high: Number(high.toFixed(forex ? 4 : 2)),
      low: Number(low.toFixed(forex ? 4 : 2)),
      close: Number(close.toFixed(forex ? 4 : 2)),
      volume,
    });

    price = close;
  }

  return candles;
}

function buildSeriesData(instrument: string, timeframe: string) {
  const count =
    timeframe === "M1"
      ? 180
      : timeframe === "M5"
        ? 140
        : timeframe === "M15"
          ? 110
          : timeframe === "M30"
            ? 95
            : timeframe === "H1"
              ? 80
              : 70;

  return generateCandles(instrument, count);
}

export default function ProBacktestingTerminal() {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const emaSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const entryLineRef = useRef<ReturnType<ISeriesApi<"Candlestick">["createPriceLine"]> | null>(null);
  const slLineRef = useRef<ReturnType<ISeriesApi<"Candlestick">["createPriceLine"]> | null>(null);
  const tpLineRef = useRef<ReturnType<ISeriesApi<"Candlestick">["createPriceLine"]> | null>(null);

  const [selectedCategory, setSelectedCategory] = useState("Crypto");
  const [selectedInstrument, setSelectedInstrument] = useState("BTC/USDT");
  const [timeframe, setTimeframe] = useState("M5");
  const [dateFrom, setDateFrom] = useState("2024-10-15");
  const [dateTo, setDateTo] = useState("2024-10-31");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState("x1");
  const [replayIndex, setReplayIndex] = useState(60);

  const [entry, setEntry] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");

  const allCandles = useMemo(
    () => buildSeriesData(selectedInstrument, timeframe),
    [selectedInstrument, timeframe, dateFrom, dateTo]
  );

  const visibleCandles = useMemo(
    () => allCandles.slice(0, replayIndex),
    [allCandles, replayIndex]
  );

  const currentCandle = visibleCandles[visibleCandles.length - 1];
  const progress = Math.round((replayIndex / Math.max(allCandles.length, 1)) * 100);

  const emaData = useMemo(() => {
    const length = 20;
    const k = 2 / (length + 1);
    let prevEma = 0;
    const forex = isForexPair(selectedInstrument);

    return visibleCandles.map((candle, idx) => {
      const close = candle.close;
      if (idx === 0) prevEma = close;
      else prevEma = close * k + prevEma * (1 - k);

      return {
        time: candle.time,
        value: Number(prevEma.toFixed(forex ? 4 : 2)),
      };
    });
  }, [visibleCandles, selectedInstrument]);

  const volumeData = useMemo(() => {
    return visibleCandles.map((c) => ({
      time: c.time,
      value: c.volume,
      color: c.close >= c.open ? "rgba(34,197,94,0.45)" : "rgba(239,68,68,0.45)",
    }));
  }, [visibleCandles]);

  const rrValue = useMemo(() => {
    const e = Number(entry);
    const sl = Number(stopLoss);
    const tp = Number(takeProfit);
    const risk = Math.abs(e - sl);
    const reward = Math.abs(tp - e);
    if (!risk || !reward || Number.isNaN(risk) || Number.isNaN(reward)) return "—";
    return `1:${(reward / risk).toFixed(2)}`;
  }, [entry, stopLoss, takeProfit]);

  const trend = useMemo(() => {
    if (visibleCandles.length < 2) return "NONE";
    const first = visibleCandles[Math.max(0, visibleCandles.length - 20)]?.close ?? 0;
    const last = visibleCandles[visibleCandles.length - 1]?.close ?? 0;
    if (last > first) return "BULLISH";
    if (last < first) return "BEARISH";
    return "SIDEWAYS";
  }, [visibleCandles]);

  // create chart ONCE
  useEffect(() => {
    if (!chartContainerRef.current) return;
    if (chartRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 560,
      layout: {
        background: { type: ColorType.Solid, color: "#071120" },
        textColor: "rgba(255,255,255,0.72)",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      crosshair: {
        vertLine: { color: "rgba(96,165,250,0.35)" },
        horzLine: { color: "rgba(96,165,250,0.35)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.08)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.08)",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    const emaSeries = chart.addLineSeries({
      color: "#3b82f6",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.82,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    emaSeriesRef.current = emaSeries;
    volumeSeriesRef.current = volumeSeries;

    const resizeObserver = new ResizeObserver(() => {
      if (!chartContainerRef.current || !chartRef.current) return;
      chartRef.current.applyOptions({
        width: chartContainerRef.current.clientWidth,
      });
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();

      entryLineRef.current = null;
      slLineRef.current = null;
      tpLineRef.current = null;

      candleSeriesRef.current = null;
      emaSeriesRef.current = null;
      volumeSeriesRef.current = null;

      chart.remove();
      chartRef.current = null;
    };
  }, []);

  // update data only
  useEffect(() => {
    if (!candleSeriesRef.current || !emaSeriesRef.current || !volumeSeriesRef.current) return;

    candleSeriesRef.current.setData(
      visibleCandles.map((c) => ({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );

    emaSeriesRef.current.setData(emaData);
    volumeSeriesRef.current.setData(volumeData);

    chartRef.current?.timeScale().fitContent();
  }, [visibleCandles, emaData, volumeData]);

  // update price lines separately
  useEffect(() => {
    if (!candleSeriesRef.current) return;

    if (entryLineRef.current) {
      candleSeriesRef.current.removePriceLine(entryLineRef.current);
      entryLineRef.current = null;
    }
    if (slLineRef.current) {
      candleSeriesRef.current.removePriceLine(slLineRef.current);
      slLineRef.current = null;
    }
    if (tpLineRef.current) {
      candleSeriesRef.current.removePriceLine(tpLineRef.current);
      tpLineRef.current = null;
    }

    if (entry && !Number.isNaN(Number(entry))) {
      entryLineRef.current = candleSeriesRef.current.createPriceLine({
        price: Number(entry),
        color: "#38bdf8",
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: "ENTRY",
      });
    }

    if (stopLoss && !Number.isNaN(Number(stopLoss))) {
      slLineRef.current = candleSeriesRef.current.createPriceLine({
        price: Number(stopLoss),
        color: "#ef4444",
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: "SL",
      });
    }

    if (takeProfit && !Number.isNaN(Number(takeProfit))) {
      tpLineRef.current = candleSeriesRef.current.createPriceLine({
        price: Number(takeProfit),
        color: "#f59e0b",
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: "TP",
      });
    }
  }, [entry, stopLoss, takeProfit]);

  useEffect(() => {
    if (!isPlaying) return;

    const speedMap: Record<string, number> = {
      x1: 1200,
      x2: 700,
      x5: 350,
      x10: 180,
    };

    const timer = window.setInterval(() => {
      setReplayIndex((prev) => {
        if (prev >= allCandles.length) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, speedMap[playSpeed]);

    return () => clearInterval(timer);
  }, [isPlaying, playSpeed, allCandles.length]);

  useEffect(() => {
    setReplayIndex(60);
    setIsPlaying(false);
    setEntry("");
    setStopLoss("");
    setTakeProfit("");
  }, [selectedInstrument, timeframe, dateFrom, dateTo]);

  return (
    <section className="rounded-[28px] border border-white/10 bg-[#081226] p-5 text-white">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-blue-300/80">
            FX Trader
          </div>
          <h2 className="mt-1 text-3xl font-semibold">PRO Backtesting Terminal</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {["M1", "M5", "M15", "M30", "H1", "H4"].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`rounded-xl px-4 py-2 text-sm transition ${
                timeframe === tf
                  ? "bg-blue-500/20 text-white ring-1 ring-blue-400/40"
                  : "bg-white/5 text-white/65 hover:bg-white/10"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 grid gap-4 xl:grid-cols-[0.8fr_1fr_0.9fr_0.9fr]">
        <div>
          <div className="mb-2 text-sm text-white/70">Kategoria</div>
          <div className="flex flex-wrap gap-2">
            {Object.keys(instrumentOptions).map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  setSelectedInstrument(instrumentOptions[category][0]);
                }}
                className={`rounded-xl px-4 py-2 text-sm transition ${
                  selectedCategory === category
                    ? "bg-blue-500/20 text-white ring-1 ring-blue-400/40"
                    : "bg-white/5 text-white/65 hover:bg-white/10"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-sm text-white/70">Instrument</div>
          <select
            value={selectedInstrument}
            onChange={(e) => setSelectedInstrument(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#091424] px-4 py-3 text-sm outline-none"
          >
            {instrumentOptions[selectedCategory].map((instrument) => (
              <option key={instrument} value={instrument}>
                {instrument}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="mb-2 text-sm text-white/70">Data od</div>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#091424] px-4 py-3 text-sm outline-none"
          />
        </div>

        <div>
          <div className="mb-2 text-sm text-white/70">Data do</div>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#091424] px-4 py-3 text-sm outline-none"
          />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.55fr_0.8fr]">
        <div className="rounded-[24px] border border-white/10 bg-[#06101f] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-lg font-medium">{selectedInstrument}</div>
            <div className="text-sm text-white/55">
              Replay progress: {progress}%
            </div>
          </div>

          <div className="mb-4 h-[560px] overflow-hidden rounded-[20px] border border-white/8">
            <div ref={chartContainerRef} className="h-full w-full" />
          </div>

          <div className="mb-4">
            <input
              type="range"
              min={10}
              max={allCandles.length}
              value={replayIndex}
              onChange={(e) => {
                setReplayIndex(Number(e.target.value));
                setIsPlaying(false);
              }}
              className="w-full accent-blue-500"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-white/45">
              <span>Start</span>
              <span>
                {currentCandle
                  ? new Date(currentCandle.time * 1000).toLocaleString()
                  : "—"}
              </span>
              <span>End</span>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-7">
            <button
              onClick={() => setPlaySpeed("x1")}
              className={`rounded-xl py-3 text-sm ${
                playSpeed === "x1" ? "bg-white/15" : "bg-white/5"
              }`}
            >
              x1
            </button>
            <button
              onClick={() => setPlaySpeed("x2")}
              className={`rounded-xl py-3 text-sm ${
                playSpeed === "x2" ? "bg-white/15" : "bg-white/5"
              }`}
            >
              x2
            </button>
            <button
              onClick={() => setPlaySpeed("x5")}
              className={`rounded-xl py-3 text-sm ${
                playSpeed === "x5" ? "bg-white/15" : "bg-white/5"
              }`}
            >
              x5
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setReplayIndex((v) => Math.max(v - 1, 10));
              }}
              className="rounded-xl border border-white/10 bg-white/5 py-3 text-sm"
            >
              Prev
            </button>
            <button
              onClick={() => setIsPlaying((prev) => !prev)}
              className="rounded-xl bg-blue-600 py-3 text-sm"
            >
              {isPlaying ? "Pause" : "Play"}
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setReplayIndex((v) => Math.min(v + 1, allCandles.length));
              }}
              className="rounded-xl bg-blue-600/80 py-3 text-sm"
            >
              Next
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setReplayIndex(60);
              }}
              className="rounded-xl bg-emerald-600 py-3 text-sm"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[24px] border border-white/10 bg-[#06101f] p-5">
            <div className="mb-4 text-lg font-medium">Replay Panel</div>

            <div className="grid gap-3">
              <input
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
                placeholder="Entry"
                className="rounded-xl border border-white/10 bg-[#091424] px-4 py-3 text-sm outline-none"
              />
              <input
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="Stop Loss"
                className="rounded-xl border border-white/10 bg-[#091424] px-4 py-3 text-sm outline-none"
              />
              <input
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder="Take Profit"
                className="rounded-xl border border-white/10 bg-[#091424] px-4 py-3 text-sm outline-none"
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/8 bg-white/5 p-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/38">
                  RR
                </div>
                <div className="mt-2 text-sm text-white/85">{rrValue}</div>
              </div>

              <div className="rounded-xl border border-white/8 bg-white/5 p-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/38">
                  Trend
                </div>
                <div className="mt-2 text-sm text-white/85">{trend}</div>
              </div>

              <div className="rounded-xl border border-white/8 bg-white/5 p-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/38">
                  Current Candle
                </div>
                <div className="mt-2 text-sm text-white/85">
                  {currentCandle
                    ? new Date(currentCandle.time * 1000).toLocaleString()
                    : "—"}
                </div>
              </div>

              <div className="rounded-xl border border-white/8 bg-white/5 p-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/38">
                  Replay Status
                </div>
                <div className="mt-2 text-sm text-white/85">
                  {isPlaying ? `Playing ${playSpeed}` : "Paused"}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#06101f] p-5">
            <div className="mb-4 text-lg font-medium">Quick Notes</div>
            <div className="space-y-3 text-sm text-white/70">
              <div className="rounded-xl bg-[#091424] p-4">
                Wykres działa w stylu lightweight-charts z replay market.
              </div>
              <div className="rounded-xl bg-[#091424] p-4">
                Przyciskami możesz cofać i przesuwać świece.
              </div>
              <div className="rounded-xl bg-[#091424] p-4">
                Entry / SL / TP rysują poziomy bezpośrednio na wykresie.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}