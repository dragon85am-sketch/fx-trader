"use client";

import React from "react";
import {
  createChart,
  CrosshairMode,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";

export type HarmonicPoint = {
  label: "X" | "A" | "B" | "C" | "D";
  time: UTCTimestamp;
  price: number;
  index: number;
};

export type HarmonicPattern = {
  name: string;
  direction: "Bullish" | "Bearish";
  points: HarmonicPoint[];
  ratios: {
    AB_XA: number;
    BC_AB: number;
    CD_BC: number;
    XD_XA: number;
  };
};

export type HarmonicLevels = {
  entry: number;
  sl: number;
  tp1: number;
  tp2: number;
  przFrom: number;
  przTo: number;
};

type Props = {
  symbol: string;
  tf: string;
  candles: CandlestickData[];
  pattern: HarmonicPattern | null;
  levels: HarmonicLevels | null;
  height?: number;
};

type PixelPoint = HarmonicPoint & { x: number; y: number };

export default function HarmonicChart({
  symbol,
  tf,
  candles,
  pattern,
  levels,
  height = 620,
}: Props) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const chartRef = React.useRef<IChartApi | null>(null);
  const candleSeriesRef = React.useRef<ISeriesApi<"Candlestick"> | null>(null);

  const [pixelPoints, setPixelPoints] = React.useState<PixelPoint[]>([]);
  const [levelPixels, setLevelPixels] = React.useState<
    Array<{ key: string; y: number; label: string; color: string }>
  >([]);
  const [przPixels, setPrzPixels] = React.useState<{ top: number; height: number } | null>(null);

  const recalcOverlay = React.useCallback(() => {
    const chart = chartRef.current;
    const series = candleSeriesRef.current;
    if (!chart || !series) return;

    if (pattern?.points?.length === 5) {
      const pts = pattern.points
        .map((p) => {
          const x = chart.timeScale().timeToCoordinate(p.time);
          const y = series.priceToCoordinate(p.price);
          if (x == null || y == null) return null;
          return { ...p, x: Number(x), y: Number(y) };
        })
        .filter(Boolean) as PixelPoint[];
      setPixelPoints(pts);
    } else {
      setPixelPoints([]);
    }

    if (levels) {
      const specs = [
        ["entry", levels.entry, `ENTRY ${levels.entry.toFixed(2)}`, "#22d3ee"],
        ["sl", levels.sl, `SL ${levels.sl.toFixed(2)}`, "#fb7185"],
        ["tp1", levels.tp1, `TP1 ${levels.tp1.toFixed(2)}`, "#4ade80"],
        ["tp2", levels.tp2, `TP2 ${levels.tp2.toFixed(2)}`, "#22c55e"],
      ] as const;

      setLevelPixels(
        specs
          .map(([key, price, label, color]) => {
            const y = series.priceToCoordinate(price);
            if (y == null) return null;
            return { key, y: Number(y), label, color };
          })
          .filter(Boolean) as Array<{ key: string; y: number; label: string; color: string }>
      );

      const y1 = series.priceToCoordinate(levels.przFrom);
      const y2 = series.priceToCoordinate(levels.przTo);
      if (y1 != null && y2 != null) {
        setPrzPixels({
          top: Math.min(Number(y1), Number(y2)),
          height: Math.max(8, Math.abs(Number(y2) - Number(y1))),
        });
      } else {
        setPrzPixels(null);
      }
    } else {
      setLevelPixels([]);
      setPrzPixels(null);
    }
  }, [pattern, levels]);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      width: el.clientWidth || 1000,
      height,
      layout: {
        background: { color: "#03111f" },
        textColor: "#94a3b8",
      },
      grid: {
        vertLines: { color: "rgba(56,189,248,0.045)" },
        horzLines: { color: "rgba(56,189,248,0.045)" },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.07, bottom: 0.08 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 10,
        barSpacing: 8,
        minBarSpacing: 2,
        rightBarStaysOnScroll: true,
      },
      crosshair: { mode: CrosshairMode.Normal },
      handleScroll: {
        pressedMouseMove: true,
        mouseWheel: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      handleScale: {
        mouseWheel: true,
        pinch: true,
        axisPressedMouseMove: { time: true, price: true },
        axisDoubleClickReset: true,
      },
    });

    const series = chart.addCandlestickSeries({
      upColor: "#10b981",
      downColor: "#ef4444",
      wickUpColor: "#34d399",
      wickDownColor: "#fb7185",
      borderVisible: false,
    });

    chartRef.current = chart;
    candleSeriesRef.current = series;

    series.setData(Array.isArray(candles) ? candles : []);
    if (candles?.length) chart.timeScale().fitContent();

    const onRange = () => recalcOverlay();
    const ts: any = chart.timeScale();
    ts.subscribeVisibleTimeRangeChange?.(onRange);
    ts.subscribeVisibleLogicalRangeChange?.(onRange);

    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: el.clientWidth || 1000, height });
      requestAnimationFrame(recalcOverlay);
    });
    ro.observe(el);

    let raf = 0;
    const tick = () => {
      recalcOverlay();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      ts.unsubscribeVisibleTimeRangeChange?.(onRange);
      ts.unsubscribeVisibleLogicalRangeChange?.(onRange);
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
    };
  }, [height]);

  React.useEffect(() => {
    const chart = chartRef.current;
    const series = candleSeriesRef.current;
    if (!chart || !series) return;

    const safe = Array.isArray(candles) ? candles : [];
    series.setData(safe);
    if (safe.length) chart.timeScale().fitContent();
    requestAnimationFrame(recalcOverlay);
  }, [candles, symbol, tf, recalcOverlay]);

  const polyline = pixelPoints.map((p) => `${p.x},${p.y}`).join(" ");

  const ratioLabels = React.useMemo(() => {
    if (!pattern || pixelPoints.length !== 5) return [];
    const byLabel = Object.fromEntries(pixelPoints.map((x) => [x.label, x])) as Record<string, PixelPoint>;
    return [
      { key: "AB", a: byLabel.A, b: byLabel.B, text: pattern.ratios.AB_XA.toFixed(3) },
      { key: "BC", a: byLabel.B, b: byLabel.C, text: pattern.ratios.BC_AB.toFixed(3) },
      { key: "CD", a: byLabel.C, b: byLabel.D, text: pattern.ratios.CD_BC.toFixed(3) },
    ].filter((x) => x.a && x.b);
  }, [pattern, pixelPoints]);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#0d579e] bg-[#03111f]">
      <div className="flex items-center justify-between border-b border-[#0d579e] bg-[#061426] px-4 py-3">
        <div>
          <h2 className="text-[13px] font-bold text-white">
            {symbol} · {tf}
            {pattern ? ` · ${pattern.name} ${pattern.direction}` : ""}
          </h2>
          <p className="mt-1 text-[8px] text-slate-500">
            Candlestick chart · X-A-B-C-D zakotwiczone do czasu i ceny świec
          </p>
        </div>
        {pattern ? (
          <span className="rounded-md border border-fuchsia-400/25 bg-fuchsia-500/10 px-2.5 py-1 text-[8px] font-bold text-fuchsia-300">
            XABCD ACTIVE
          </span>
        ) : null}
      </div>

      <div className="relative">
        <div ref={containerRef} style={{ width: "100%", height }} />

        <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible">
          {pixelPoints.length === 5 ? (
            <>
              <polyline
                points={polyline}
                fill="rgba(168,85,247,.13)"
                stroke="rgba(217,70,239,.95)"
                strokeWidth="2.4"
                strokeLinejoin="round"
              />
              <line
                x1={pixelPoints[0].x}
                y1={pixelPoints[0].y}
                x2={pixelPoints[4].x}
                y2={pixelPoints[4].y}
                stroke="rgba(168,85,247,.45)"
                strokeWidth="1.2"
                strokeDasharray="5 5"
              />
            </>
          ) : null}

          {przPixels ? (
            <rect
              x="72%"
              y={przPixels.top}
              width="23%"
              height={przPixels.height}
              rx="7"
              fill="rgba(34,197,94,.10)"
              stroke="rgba(34,197,94,.50)"
            />
          ) : null}

          {levelPixels.map((l) => (
            <line
              key={l.key}
              x1="72%"
              x2="96%"
              y1={l.y}
              y2={l.y}
              stroke={l.color}
              strokeWidth="2"
              strokeDasharray={l.key === "entry" ? "7 5" : undefined}
            />
          ))}
        </svg>

        <div className="pointer-events-none absolute inset-0 z-20">
          {pixelPoints.map((p) => (
            <div
              key={p.label}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-md bg-fuchsia-600 px-2 py-1 text-[10px] font-black text-white shadow-[0_0_14px_rgba(217,70,239,.55)]"
              style={{ left: p.x, top: p.y }}
            >
              {p.label}
            </div>
          ))}

          {ratioLabels.map((r) => (
            <div
              key={r.key}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-md bg-violet-500 px-2 py-1 text-[8px] font-bold text-white"
              style={{
                left: (r.a.x + r.b.x) / 2,
                top: (r.a.y + r.b.y) / 2 - 12,
              }}
            >
              {r.text}
            </div>
          ))}

          {levelPixels.map((l) => (
            <div
              key={l.key}
              className="absolute right-[3%] -translate-y-1/2 rounded-md bg-[#04101f]/95 px-2 py-1 text-[8px] font-black"
              style={{ top: l.y, color: l.color }}
            >
              {l.label}
            </div>
          ))}

          {przPixels ? (
            <div
              className="absolute left-[78%] text-center text-[9px] font-black text-emerald-300"
              style={{ top: przPixels.top + przPixels.height / 2 - 8 }}
            >
              PRZ
              <div className="text-[7px] font-medium text-emerald-300/65">
                Potential Reversal Zone
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
