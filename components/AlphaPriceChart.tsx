"use client";

import React from "react";

import {
  createChart,
  CrosshairMode,
  LineStyle,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from "lightweight-charts";

type Props = {
  symbol: string;
  tf: string;

  candles: CandlestickData[];

  loading?: boolean;

  priceAction: string;

  direction: "BUY" | "SELL";

  entry: number;
  sl: number;
  tp1: number;
  tp2: number;

  asianHigh?: number;
  asianLow?: number;

  londonHigh?: number;
  londonLow?: number;

  nyOpenHigh?: number;
  nyOpenLow?: number;

  vwap?: number;

  bosPrice?: number;
  chochPrice?: number;

  height?: number;
  liveBaseUrl?: string;
};

export default function AlphaPriceChart({
  symbol,
  tf,

  candles = [],

  loading = false,

  priceAction,

  direction,

  entry,
  sl,
  tp1,
  tp2,

  asianHigh,
  asianLow,

  londonHigh,
  londonLow,

  nyOpenHigh,
  nyOpenLow,

  vwap,

  bosPrice,
  chochPrice,

  height = 620,
  liveBaseUrl = process.env.NEXT_PUBLIC_US30_LIVE_URL ?? "",
}: Props) {
  const containerRef =
    React.useRef<HTMLDivElement | null>(
      null,
    );

  const chartRef =
    React.useRef<IChartApi | null>(
      null,
    );

  const seriesRef =
    React.useRef<
      ISeriesApi<"Candlestick"> | null
    >(null);

  const [liveConnected, setLiveConnected] = React.useState(false);
  const liveCandleRef = React.useRef<CandlestickData | null>(null);

  // ====================================================
  // CREATE CHART
  // ====================================================

  React.useEffect(() => {
    const el =
      containerRef.current;

    if (!el) return;

    const chart = createChart(
      el,
      {
        width:
          el.clientWidth,

        height,

        layout: {
          background: {
            color: "#061426",
          },

          textColor:
            "#91a4bb",
        },

        grid: {
          vertLines: {
            color:
              "rgba(73,117,170,.08)",
          },

          horzLines: {
            color:
              "rgba(73,117,170,.08)",
          },
        },

        crosshair: {
          mode:
            CrosshairMode.Normal,
        },

        rightPriceScale: {
          borderVisible:
            false,

          scaleMargins: {
            top: 0.08,
            bottom: 0.1,
          },
        },

        timeScale: {
          borderVisible:
            false,

          timeVisible:
            true,

          secondsVisible:
            false,

          rightOffset: 7,

          barSpacing: 9,

          minBarSpacing: 2,
        },

        handleScroll: {
          mouseWheel: true,

          pressedMouseMove:
            true,

          horzTouchDrag:
            true,

          vertTouchDrag:
            false,
        },

        handleScale: {
          mouseWheel: true,

          pinch: true,

          axisPressedMouseMove: {
            time: true,
            price: true,
          },

          axisDoubleClickReset:
            true,
        },
      },
    );

    const series =
      chart.addCandlestickSeries(
        {
          upColor:
            "#10b981",

          downColor:
            "#ef4444",

          wickUpColor:
            "#34d399",

          wickDownColor:
            "#fb7185",

          borderVisible:
            false,

          priceLineVisible:
            true,

          lastValueVisible:
            true,
        },
      );

    chartRef.current =
      chart;

    seriesRef.current =
      series;

    const resizeChart = () => {
      chart.applyOptions({
        width: Math.max(1, el.clientWidth),
        height: Math.max(1, el.clientHeight || height),
      });
    };

    const ro = new ResizeObserver(() => {
      resizeChart();
    });

    ro.observe(el);
    resizeChart();

    return () => {
      ro.disconnect();

      chart.remove();

      chartRef.current =
        null;

      seriesRef.current =
        null;
    };
  }, []);

  // Resize the existing chart after normal/fullscreen size changes.
  React.useEffect(() => {
    const el = containerRef.current;
    const chart = chartRef.current;
    if (!el || !chart) return;

    const applySize = () => {
      chart.applyOptions({
        width: Math.max(1, el.clientWidth),
        height: Math.max(1, el.clientHeight || height),
      });
      if (candles.length > 0) chart.timeScale().fitContent();
    };

    const raf = requestAnimationFrame(() => {
      applySize();
      requestAnimationFrame(applySize);
    });

    window.addEventListener("resize", applySize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", applySize);
    };
  }, [height, candles.length]);

  // ====================================================
  // US30 LIVE TICK (Railway SSE)
  // ====================================================

  React.useEffect(() => {
    if (symbol !== "US30" || !liveBaseUrl) {
      setLiveConnected(false);
      return;
    }

    const base = liveBaseUrl.replace(/\/+$/, "");
    const source = new EventSource(`${base}/api/us30/stream`);

    const onTick = (event: MessageEvent) => {
      try {
        const tick = JSON.parse(event.data) as { price?: number; timestamp?: number };
        const price = Number(tick.price);
        const timestamp = Number(tick.timestamp);
        const series = seriesRef.current;
        if (!series || !Number.isFinite(price) || !Number.isFinite(timestamp)) return;

        // Live-Rates timestamp is milliseconds. Update the active M1 candle tick-by-tick.
        const bucket = Math.floor(timestamp / 60_000) * 60;
        const prev = liveCandleRef.current;

        let next: CandlestickData;

        if (prev && Number(prev.time) === bucket) {
          next = {
            time: bucket as Time,
            open: prev.open,
            high: Math.max(prev.high, price),
            low: Math.min(prev.low, price),
            close: price,
          };
        } else {
          const open = prev ? prev.close : price;
          next = {
            time: bucket as Time,
            open,
            high: Math.max(open, price),
            low: Math.min(open, price),
            close: price,
          };
        }

        liveCandleRef.current = next;
        series.update(next);
        setLiveConnected(true);
      } catch (e) {
        console.error("[US30 LIVE] tick error", e);
      }
    };

    source.addEventListener("tick", onTick as EventListener);
    source.onopen = () => setLiveConnected(true);
    source.onerror = () => setLiveConnected(false);

    return () => {
      source.removeEventListener("tick", onTick as EventListener);
      source.close();
      setLiveConnected(false);
      liveCandleRef.current = null;
    };
  }, [symbol, liveBaseUrl]);

  // ====================================================
  // DATA + LEVELS
  // ====================================================

  React.useEffect(() => {
    const chart =
      chartRef.current;

    const series =
      seriesRef.current;

    if (
      !chart ||
      !series
    ) {
      return;
    }

    series.setData(candles);

    if (symbol === "US30" && candles.length > 0) {
      const last = candles[candles.length - 1];
      const live = liveCandleRef.current;

      // Do not let a REST refresh overwrite a newer live SSE candle.
      if (live && Number(live.time) >= Number(last.time)) {
        series.update(live);
      } else {
        liveCandleRef.current = {
          time: last.time,
          open: last.open,
          high: last.high,
          low: last.low,
          close: last.close,
        };
      }
    }

    if (!candles.length) {
      return;
    }

    const lines: ReturnType<
      typeof series.createPriceLine
    >[] = [];

    function addLine(
      price:
        | number
        | undefined,
      options: {
        title: string;
        color: string;
        lineWidth?:
          | 1
          | 2
          | 3
          | 4;
        lineStyle?:
          LineStyle;
        axisLabelVisible?:
          boolean;
      },
    ) {
      if (
        price === undefined ||
        !Number.isFinite(price) ||
        price === 0
      ) {
        return;
      }

      const line =
       series!.createPriceLine(
          {
            price,

            color:
              options.color,

            lineWidth:
              options.lineWidth ??
              1,

            lineStyle:
              options.lineStyle ??
              LineStyle.Dashed,

            axisLabelVisible:
              options.axisLabelVisible ??
              true,

            title:
              options.title,
          },
        );

      lines.push(line);
    }

    // ==================================================
    // TRADE LEVELS
    // ==================================================

    addLine(entry, {
      title: "ENTRY",
      color: "#22d3ee",
      lineWidth: 2,
      lineStyle:
        LineStyle.Dashed,
    });

    addLine(sl, {
      title: "SL",
      color: "#fb7185",
      lineWidth: 2,
      lineStyle:
        LineStyle.Solid,
    });

    addLine(tp1, {
      title: "TP1",
      color: "#4ade80",
      lineWidth: 2,
      lineStyle:
        LineStyle.Dashed,
    });

    addLine(tp2, {
      title: "TP2",
      color: "#22c55e",
      lineWidth: 2,
      lineStyle:
        LineStyle.Dashed,
    });

    // ==================================================
    // SESSION LEVELS
    // ==================================================

    addLine(
      asianHigh,
      {
        title:
          "ASIAN H",

        color:
          "#c084fc",
      },
    );

    addLine(
      asianLow,
      {
        title:
          "ASIAN L",

        color:
          "#a855f7",
      },
    );

    addLine(
      londonHigh,
      {
        title:
          "LONDON H",

        color:
          "#f59e0b",
      },
    );

    addLine(
      londonLow,
      {
        title:
          "LONDON L",

        color:
          "#f59e0b",
      },
    );

    addLine(
      nyOpenHigh,
      {
        title:
          "NY OR H",

        color:
          "#38bdf8",
      },
    );

    addLine(
      nyOpenLow,
      {
        title:
          "NY OR L",

        color:
          "#38bdf8",
      },
    );

    // ==================================================
    // VWAP
    // ==================================================

    addLine(vwap, {
      title: "VWAP",
      color: "#e2e8f0",
      lineWidth: 2,
      lineStyle:
        LineStyle.Solid,
    });

    // ==================================================
    // STRUCTURE
    // ==================================================

    addLine(
      bosPrice,
      {
        title: "BOS",

        color:
          "#34d399",

        axisLabelVisible:
          false,
      },
    );

    addLine(
      chochPrice,
      {
        title: "CHOCH",

        color:
          "#f472b6",

        axisLabelVisible:
          false,
      },
    );

    // ==================================================
    // SIGNAL MARKER
    // ==================================================

    const signalIndex =
      Math.max(
        0,
        candles.length - 8,
      );

    const signalBar =
      candles[signalIndex];

    if (signalBar) {
      series.setMarkers([
        {
          time:
            signalBar.time as Time,

          position:
            direction === "BUY"
              ? "belowBar"
              : "aboveBar",

          color:
            direction === "BUY"
              ? "#34d399"
              : "#fb7185",

          shape:
            direction === "BUY"
              ? "arrowUp"
              : "arrowDown",

          text:
            priceAction,
        },
      ]);
    }

    chart
      .timeScale()
      .fitContent();

    return () => {
      lines.forEach(
        (line) => {
          try {
            series.removePriceLine(
              line,
            );
          } catch {}
        },
      );
    };
  }, [
    candles,
    symbol,

    direction,

    priceAction,

    entry,
    sl,
    tp1,
    tp2,

    asianHigh,
    asianLow,

    londonHigh,
    londonLow,

    nyOpenHigh,
    nyOpenLow,

    vwap,

    bosPrice,
    chochPrice,
  ]);

  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-[#061426]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <div className="text-[14px] font-bold text-white">
            {symbol} · {tf}
          </div>

          <div className="mt-1 text-[9px] text-white/40">
            {symbol === "US30"
              ? liveConnected
                ? "LIVE-RATES · REAL-TIME"
                : "LIVE-RATES · CONNECTING"
              : "Twelve Data · PRO Session Scanner"}
          </div>
        </div>

        <div
          className={`rounded-lg border px-3 py-1.5 text-[10px] font-bold ${
            direction === "BUY"
              ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
              : "border-rose-400/25 bg-rose-500/10 text-rose-300"
          }`}
        >
          {priceAction}
        </div>
      </div>

      <div
        ref={containerRef}
        style={{
          width: "100%",
          height,
        }}
      />

      {loading ? (
        <div className="absolute inset-0 top-[52px] z-20 flex items-center justify-center bg-[#061426]/65 backdrop-blur-[1px]">
          <div className="rounded-xl border border-sky-400/20 bg-[#081a31] px-4 py-3 text-[11px] font-semibold text-sky-200">
            Pobieranie świec
            z Twelve Data...
          </div>
        </div>
      ) : null}

      {!loading &&
      (!Array.isArray(
        candles,
      ) ||
        candles.length ===
          0) ? (
        <div className="absolute inset-0 top-[52px] z-20 flex items-center justify-center">
          <div className="rounded-xl border border-amber-400/20 bg-[#081a31] px-4 py-3 text-[11px] font-semibold text-amber-200">
            Brak danych
            świecowych.
          </div>
        </div>
      ) : null}
    </div>
  );
}