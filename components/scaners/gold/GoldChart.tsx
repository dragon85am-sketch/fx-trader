"use client";

import { useEffect, useRef } from "react";

import {
  ColorType,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";

/* =========================================================
   TYPES
========================================================= */

export type GoldCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type GoldLinePoint = {
  time: number;
  value: number;
};

type GoldChartProps = {
  candles: GoldCandle[];

  ema50?: GoldLinePoint[];
  ema200?: GoldLinePoint[];

  entry?: number | null;
  stopLoss?: number | null;
  tp1?: number | null;
  tp2?: number | null;

  timeframe?: "M1" | "M5" | "M15";
};

/* =========================================================
   COMPONENT
========================================================= */

export default function GoldChart({
  candles,
  ema50 = [],
  ema200 = [],
  entry = null,
  stopLoss = null,
  tp1 = null,
  tp2 = null,
  timeframe = "M1",
}: GoldChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const chartRef = useRef<IChartApi | null>(null);

  const candleSeriesRef =
    useRef<ISeriesApi<"Candlestick"> | null>(null);

  const ema50Ref =
    useRef<ISeriesApi<"Line"> | null>(null);

  const ema200Ref =
    useRef<ISeriesApi<"Line"> | null>(null);

  /* =======================================================
     CREATE CHART
  ======================================================= */

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const chart = createChart(container, {
      width: container.clientWidth,

      height: Math.max(container.clientHeight, 560),

      layout: {
        background: {
          type: ColorType.Solid,
          color: "#071018",
        },

        textColor: "#9ca3af",

        fontSize: 12,
      },

      grid: {
        vertLines: {
          color: "rgba(255,255,255,0.035)",
        },

        horzLines: {
          color: "rgba(255,255,255,0.035)",
        },
      },

      rightPriceScale: {
        visible: true,

        borderColor: "rgba(255,255,255,0.10)",

        scaleMargins: {
          top: 0.08,
          bottom: 0.08,
        },
      },

      timeScale: {
        borderColor: "rgba(255,255,255,0.10)",

        timeVisible: true,

        secondsVisible: false,

        rightOffset: 8,

        barSpacing: 8,

        minBarSpacing: 3,

        fixLeftEdge: false,

        fixRightEdge: false,
      },

      crosshair: {
        vertLine: {
          color: "rgba(255,255,255,0.20)",

          width: 1,

          style: 2,

          labelBackgroundColor: "#111827",
        },

        horzLine: {
          color: "rgba(255,255,255,0.20)",

          width: 1,

          style: 2,

          labelBackgroundColor: "#111827",
        },
      },

      handleScroll: {
        mouseWheel: true,

        pressedMouseMove: true,

        horzTouchDrag: true,

        vertTouchDrag: true,
      },

      handleScale: {
        axisPressedMouseMove: true,

        mouseWheel: true,

        pinch: true,
      },
    });

    chartRef.current = chart;

    /* =====================================================
       CANDLESTICKS
       lightweight-charts V4
    ===================================================== */

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#10b981",

      downColor: "#ef4444",

      borderVisible: false,

      wickUpColor: "#10b981",

      wickDownColor: "#ef4444",

      priceLineVisible: true,

      lastValueVisible: true,
    });

    candleSeriesRef.current = candleSeries;

    /* =====================================================
       EMA 50
    ===================================================== */

    const ema50Series = chart.addLineSeries({
      color: "#3b82f6",

      lineWidth: 2,

      priceLineVisible: false,

      lastValueVisible: false,

      crosshairMarkerVisible: false,
    });

    ema50Ref.current = ema50Series;

    /* =====================================================
       EMA 200
    ===================================================== */

    const ema200Series = chart.addLineSeries({
      color: "#f59e0b",

      lineWidth: 2,

      priceLineVisible: false,

      lastValueVisible: false,

      crosshairMarkerVisible: false,
    });

    ema200Ref.current = ema200Series;

    /* =====================================================
       RESPONSIVE
    ===================================================== */

    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current) return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      chart.applyOptions({
        width,
        height: Math.max(height, 560),
      });
    });

    resizeObserver.observe(container);

    /* =====================================================
       CLEANUP
    ===================================================== */

    return () => {
      resizeObserver.disconnect();

      chart.remove();

      chartRef.current = null;

      candleSeriesRef.current = null;

      ema50Ref.current = null;

      ema200Ref.current = null;
    };
  }, []);

  /* =======================================================
     CANDLE DATA
  ======================================================= */

  useEffect(() => {
    const series = candleSeriesRef.current;

    if (!series) return;

    if (!candles || candles.length === 0) {
      series.setData([]);
      return;
    }

    /*
      Sortujemy świece po czasie.

      Lightweight Charts wymaga:
      time ASC
    */

    const sortedCandles = [...candles].sort(
      (a, b) => a.time - b.time
    );

    /*
      Usuwamy ewentualne duplikaty czasu.
    */

    const uniqueCandles = Array.from(
      new Map(
        sortedCandles.map((candle) => [
          candle.time,
          candle,
        ])
      ).values()
    );

    const formatted = uniqueCandles.map((candle) => ({
      time: candle.time as UTCTimestamp,

      open: Number(candle.open),

      high: Number(candle.high),

      low: Number(candle.low),

      close: Number(candle.close),
    }));

    series.setData(formatted);

    /*
      Pokazujemy ostatnią część wykresu.
    */

    if (formatted.length > 80) {
      chartRef.current
        ?.timeScale()
        .setVisibleLogicalRange({
          from: formatted.length - 80,
          to: formatted.length + 5,
        });
    } else {
      chartRef.current?.timeScale().fitContent();
    }
  }, [candles]);

  /* =======================================================
     EMA 50 DATA
  ======================================================= */

  useEffect(() => {
    const series = ema50Ref.current;

    if (!series) return;

    if (!ema50 || ema50.length === 0) {
      series.setData([]);
      return;
    }

    const sorted = [...ema50]
      .sort((a, b) => a.time - b.time)
      .map((point) => ({
        time: point.time as UTCTimestamp,

        value: Number(point.value),
      }));

    series.setData(sorted);
  }, [ema50]);

  /* =======================================================
     EMA 200 DATA
  ======================================================= */

  useEffect(() => {
    const series = ema200Ref.current;

    if (!series) return;

    if (!ema200 || ema200.length === 0) {
      series.setData([]);
      return;
    }

    const sorted = [...ema200]
      .sort((a, b) => a.time - b.time)
      .map((point) => ({
        time: point.time as UTCTimestamp,

        value: Number(point.value),
      }));

    series.setData(sorted);
  }, [ema200]);

  /* =======================================================
     ENTRY / SL / TP
  ======================================================= */

  useEffect(() => {
    const series = candleSeriesRef.current;

    if (!series) return;

    const createdLines: any[] = [];

    /* =========================
       ENTRY
    ========================= */

    if (
      entry !== null &&
      Number.isFinite(entry)
    ) {
      const line = series.createPriceLine({
        price: entry,

        color: "#22c55e",

        lineWidth: 2,

        lineStyle: 0,

        axisLabelVisible: true,

        title: "ENTRY",
      });

      createdLines.push(line);
    }

    /* =========================
       STOP LOSS
    ========================= */

    if (
      stopLoss !== null &&
      Number.isFinite(stopLoss)
    ) {
      const line = series.createPriceLine({
        price: stopLoss,

        color: "#ef4444",

        lineWidth: 2,

        lineStyle: 0,

        axisLabelVisible: true,

        title: "SL",
      });

      createdLines.push(line);
    }

    /* =========================
       TP1
    ========================= */

    if (
      tp1 !== null &&
      Number.isFinite(tp1)
    ) {
      const line = series.createPriceLine({
        price: tp1,

        color: "#10b981",

        lineWidth: 1,

        lineStyle: 2,

        axisLabelVisible: true,

        title: "TP1",
      });

      createdLines.push(line);
    }

    /* =========================
       TP2
    ========================= */

    if (
      tp2 !== null &&
      Number.isFinite(tp2)
    ) {
      const line = series.createPriceLine({
        price: tp2,

        color: "#22c55e",

        lineWidth: 1,

        lineStyle: 2,

        axisLabelVisible: true,

        title: "TP2",
      });

      createdLines.push(line);
    }

    /* =========================
       REMOVE OLD LINES
    ========================= */

    return () => {
      createdLines.forEach((line) => {
        try {
          series.removePriceLine(line);
        } catch {
          // chart mógł zostać już usunięty
        }
      });
    };
  }, [entry, stopLoss, tp1, tp2]);

  /* =======================================================
     CURRENT PRICE
  ======================================================= */

  const currentCandle =
    candles.length > 0
      ? candles[candles.length - 1]
      : null;

  const currentPrice =
    currentCandle?.close ?? null;

  const priceChange =
    currentCandle
      ? currentCandle.close -
        currentCandle.open
      : 0;

  const bullish =
    priceChange >= 0;

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="flex h-full min-h-[560px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#071018]">
      {/* HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="text-lg font-black text-white">
              XAUUSD • {timeframe}
            </div>

            <div className="rounded-md border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-[10px] font-black text-amber-400">
              GOLD
            </div>
          </div>

          <div className="mt-1 text-xs text-white/40">
            Gold Spot / U.S. Dollar
          </div>
        </div>

        {/* PRICE */}

        <div className="flex items-center gap-6">
          {currentPrice !== null && (
            <div className="text-right">
              <div
                className={`font-mono text-lg font-black ${
                  bullish
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {currentPrice.toFixed(2)}
              </div>

              <div
                className={`text-[11px] ${
                  bullish
                    ? "text-emerald-400/70"
                    : "text-red-400/70"
                }`}
              >
                {bullish ? "+" : ""}
                {priceChange.toFixed(2)}
              </div>
            </div>
          )}

          {/* EMA LEGEND */}

          <div className="hidden items-center gap-4 text-xs md:flex">
            <span className="flex items-center gap-2 text-blue-400">
              <span className="h-2 w-2 rounded-full bg-blue-400" />

              EMA 50
            </span>

            <span className="flex items-center gap-2 text-amber-400">
              <span className="h-2 w-2 rounded-full bg-amber-400" />

              EMA 200
            </span>
          </div>
        </div>
      </div>

      {/* CHART */}

      <div className="relative min-h-0 flex-1">
        {/* LIVE BADGE */}

        <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-black/50 px-3 py-2 backdrop-blur">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />

          <span className="text-[10px] font-black tracking-widest text-emerald-400">
            LIVE
          </span>
        </div>

        {/* NO DATA */}

        {candles.length === 0 && (
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="rounded-xl border border-white/10 bg-black/50 px-5 py-3 text-sm text-white/50 backdrop-blur">
              Ładowanie danych XAUUSD...
            </div>
          </div>
        )}

        <div
          ref={containerRef}
          className="absolute inset-0 h-full min-h-[560px] w-full"
        />
      </div>

      {/* FOOTER */}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-3">
        <div className="flex items-center gap-4 text-[11px] text-white/40">
          <span>
            CANDLES{" "}
            <strong className="text-white/70">
              {candles.length}
            </strong>
          </span>

          <span>
            TF{" "}
            <strong className="text-amber-400">
              {timeframe}
            </strong>
          </span>
        </div>

        <div className="text-[10px] uppercase tracking-[0.15em] text-white/30">
          Momentum • Liquidity • Structure
        </div>
      </div>
    </div>
  );
}