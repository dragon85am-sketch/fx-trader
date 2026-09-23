"use client";

import React from "react";
import {
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type UTCTimestamp,
} from "lightweight-charts";

export type DrawTool =
  | "SELECT"
  | "HLINE"
  | "VLINE"
  | "TREND"
  | "RAY"
  | "HORIZONTAL_RAY"
  | "RECT"
  | "FIBO"
  | "BRUSH"
  | "PATH";

type Point = { t: UTCTimestamp; p: number };

function formatChartDateTime(time: UTCTimestamp) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(Number(time) * 1000));
  } catch {
    return "";
  }
}

type FiboLevel = {
  id: string;
  value: number;
  enabled: boolean;
  color: string;
};

const DEFAULT_FIBO_LEVELS: FiboLevel[] = [
  { id: "0", value: 0, enabled: true, color: "#94a3b8" },
  { id: "236", value: 0.236, enabled: true, color: "#ef4444" },
  { id: "382", value: 0.382, enabled: true, color: "#f59e0b" },
  { id: "500", value: 0.5, enabled: true, color: "#22c55e" },
  { id: "618", value: 0.618, enabled: true, color: "#10b981" },
  { id: "786", value: 0.786, enabled: true, color: "#0ea5e9" },
  { id: "1000", value: 1, enabled: true, color: "#94a3b8" },
];
type BaseObj = {
  id: string;
  type: DrawTool;
  color: string;
  visible: boolean;
  createdAt: number;
};

type HLineObj = BaseObj & { type: "HLINE"; price: number };
type VLineObj = BaseObj & { type: "VLINE"; t: UTCTimestamp };

type TwoPointObj = BaseObj & {
  type: "TREND" | "RAY" | "HORIZONTAL_RAY" | "RECT" | "FIBO";
  a: Point;
  b: Point;
};

type PathObj = BaseObj & {
  type: "PATH" | "BRUSH";
  points: Point[];
};

type AnyObj = HLineObj | VLineObj | TwoPointObj | PathObj;

export type TradeLevelsCanvas = {
  side?: "BUY" | "SELL";
  entry: number;
  sl: number;
  tps?: number[];
  tp?: number;
  zones?: Array<{ label: "ENTRY" | "SL" | "TP1" | "TP2" | "TP3"; from: number; to: number }>;
};

export type TradeZoneCanvasSpec = {
  anchorTime: UTCTimestamp;
  levels: TradeLevelsCanvas;
  widthPx?: number;
  gapPx?: number;
  precision?: number;
} | null;

function getStorageKey(symbol: string) {
  // Drawings are shared by instrument, not by timeframe.
  // A EURUSD line drawn on M1 is therefore visible on M5/M15/M30/H1/H4/D1.
  return `drawings_${symbol}_ALL_TF`;
}

const SHARED_DRAWING_TIMEFRAMES = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "default"] as const;

const TWO_POINT_TOOLS: DrawTool[] = [
  "TREND",
  "RAY",
  "HORIZONTAL_RAY",
  "RECT",
  "FIBO",
];

export default function DrawingsLayer({
  wrapRef,
  chartRef,
  candleSeriesRef,
  getCandles,
  activeDrawTool,
  onDrawToolChange,
  symbol,
  timeframe,
  tradeZoneSpec,
}: {
  wrapRef: React.RefObject<HTMLDivElement | null>;
  chartRef: React.RefObject<IChartApi | null>;
  candleSeriesRef: React.RefObject<ISeriesApi<"Candlestick"> | null>;
  getCandles: () => CandlestickData[];
  activeDrawTool: DrawTool;
  onDrawToolChange?: (t: DrawTool) => void;
  symbol: string;
  timeframe: string;
  tradeZoneSpec?: TradeZoneCanvasSpec;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

const [objs, setObjs] = React.useState<AnyObj[]>([]);
  const storageReadyRef = React.useRef(false);

  const [draft, setDraft] = React.useState<Point | null>(null);
  const [preview, setPreview] = React.useState<Point | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [hoverId, setHoverId] = React.useState<string | null>(null);
const [fiboLevels, setFiboLevels] =

  React.useState<FiboLevel[]>(() => {
  try {
    const saved = localStorage.getItem("fibo_levels");

    return saved
      ? JSON.parse(saved)
      : DEFAULT_FIBO_LEVELS;
  } catch {
    return DEFAULT_FIBO_LEVELS;
  }
});
React.useEffect(() => {
  storageReadyRef.current = false;
  try {
    const key = getStorageKey(symbol);
    const raw = localStorage.getItem(key);

    if (raw) {
      setObjs(JSON.parse(raw));
    } else {
      // One-time migration: merge drawings previously saved separately on each TF.
      const merged: AnyObj[] = [];
      const seen = new Set<string>();
      for (const tfKey of SHARED_DRAWING_TIMEFRAMES) {
        const legacy = localStorage.getItem(`drawings_${symbol}_${tfKey}`);
        if (!legacy) continue;
        try {
          const parsed = JSON.parse(legacy) as AnyObj[];
          for (const obj of parsed) {
            if (!obj?.id || seen.has(obj.id)) continue;
            seen.add(obj.id);
            merged.push(obj);
          }
        } catch {}
      }
      setObjs(merged);
      if (merged.length) localStorage.setItem(key, JSON.stringify(merged));
    }
  } catch {
    setObjs([]);
  } finally {
    requestAnimationFrame(() => { storageReadyRef.current = true; });
  }
}, [symbol]);
  React.useEffect(() => {
  localStorage.setItem(
    "fibo_levels",
    JSON.stringify(fiboLevels)
  );
}, [fiboLevels]);
  const dragRef = React.useRef<{
    id: string | null;
    last: Point | null;
    mode: "move" | "a" | "b";
    startClientX: number;
    startClientY: number;
    startObj: AnyObj | null;
  }>({
    id: null,
    last: null,
    mode: "move",
    startClientX: 0,
    startClientY: 0,
    startObj: null,
  });

  const drawingPathRef = React.useRef<Point[]>([]);
  const isMouseDownRef = React.useRef(false);

  // SELECT mode:
  // - drag on drawing => move/edit drawing
  // - drag on empty chart => pan chart horizontally AND vertically
  const chartPanRef = React.useRef<{
    active: boolean;
    lastClientX: number;
    lastClientY: number;
    priceMin: number | null;
    priceMax: number | null;
  }>({
    active: false,
    lastClientX: 0,
    lastClientY: 0,
    priceMin: null,
    priceMax: null,
  });

  React.useEffect(() => {
    if (!storageReadyRef.current) return;
    const timer = window.setTimeout(() => {
      try {
        const key = getStorageKey(symbol);
        localStorage.setItem(key, JSON.stringify(objs));
      } catch {}
    }, 250);
    return () => window.clearTimeout(timer);
  }, [objs, symbol]);

  const resize = React.useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const dpr = window.devicePixelRatio || 1;

    canvas.width = wrap.clientWidth * dpr;
    canvas.height = wrap.clientHeight * dpr;

    canvas.style.width = `${wrap.clientWidth}px`;
    canvas.style.height = `${wrap.clientHeight}px`;

    const ctx = canvas.getContext("2d");
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, [wrapRef]);

  const pointToData = React.useCallback(
    (x: number, y: number): Point | null => {
      const chart = chartRef.current;
      const series = candleSeriesRef.current;
      const candles = getCandles();

      if (!chart || !series || !candles.length) return null;

      const logical = chart.timeScale().coordinateToLogical(x);
      const price = series.coordinateToPrice(y);

      if (logical == null || price == null) return null;

      const idx = Math.max(
        0,
        Math.min(Math.round(Number(logical)), candles.length - 1)
      );

      return {
        t: candles[idx].time as UTCTimestamp,
        p: Number(price),
      };
    },
    [chartRef, candleSeriesRef, getCandles]
  );

  const screenToData = React.useCallback(
    (x: number, y: number): Point | null => {
      const chart = chartRef.current;
      const series = candleSeriesRef.current;
      if (!chart || !series) return null;

      const price = series.coordinateToPrice(y);
      const time = (chart.timeScale() as any).coordinateToTime?.(x);
      if (price == null || time == null) return null;

      return { t: time as UTCTimestamp, p: Number(price) };
    },
    [chartRef, candleSeriesRef]
  );

  // Convert an absolute market time to X even when the current timeframe
  // does not contain that exact candle. Example: a point created at 10:17 on
  // M1 must still exist between the 10:15 and 10:20 candles on M5.
  const marketTimeToX = React.useCallback(
    (time: UTCTimestamp): number | null => {
      const chart = chartRef.current;
      if (!chart) return null;

      const ts = chart.timeScale();
      const exact = ts.timeToCoordinate(time as any);
      if (exact != null && Number.isFinite(Number(exact))) return Number(exact);

      const candles = getCandles();
      if (!candles.length) return null;

      const target = Number(time);

      // Binary search: first candle with time >= target.
      let lo = 0;
      let hi = candles.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (Number(candles[mid].time) < target) lo = mid + 1;
        else hi = mid;
      }

      const rightIdx = Math.min(candles.length - 1, lo);
      const leftIdx = Math.max(0, rightIdx - 1);

      // Outside the loaded history: extrapolate using the nearest two bars.
      let i0 = leftIdx;
      let i1 = rightIdx;
      if (target < Number(candles[0].time) && candles.length > 1) {
        i0 = 0;
        i1 = 1;
      } else if (target > Number(candles[candles.length - 1].time) && candles.length > 1) {
        i0 = candles.length - 2;
        i1 = candles.length - 1;
      }

      const t0 = Number(candles[i0].time);
      const t1 = Number(candles[i1].time);

      if (i0 === i1 || t1 === t0) {
        const x = ts.logicalToCoordinate(i0 as any);
        return x == null ? null : Number(x);
      }

      const fraction = (target - t0) / (t1 - t0);
      const logical = i0 + fraction;
      const x = ts.logicalToCoordinate(logical as any);
      return x == null || !Number.isFinite(Number(x)) ? null : Number(x);
    },
    [chartRef, getCandles]
  );

  const dataToPoint = React.useCallback(
    (p: Point | null) => {
      const series = candleSeriesRef.current;
      if (!series || !p) return null;

      const x = marketTimeToX(p.t);
      const y = series.priceToCoordinate(p.p);

      if (x == null || y == null) return null;

      return {
        x: Number(x),
        y: Number(y),
      };
    },
    [candleSeriesRef, marketTimeToX]
  );

  function distance(
    a: { x: number; y: number },
    b: { x: number; y: number }
  ) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function distToSegment(
    p: { x: number; y: number },
    a: { x: number; y: number },
    b: { x: number; y: number }
  ) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;

    if (dx === 0 && dy === 0) return distance(p, a);

    const t = Math.max(
      0,
      Math.min(
        1,
        ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)
      )
    );

    return distance(p, {
      x: a.x + t * dx,
      y: a.y + t * dy,
    });
  }

  function findHitHandle(x: number, y: number) {
    const mouse = { x, y };

    for (let i = objs.length - 1; i >= 0; i--) {
      const o = objs[i];

      if (
        o.type === "TREND" ||
        o.type === "RAY" ||
        o.type === "HORIZONTAL_RAY" ||
        o.type === "RECT" ||
        o.type === "FIBO"
      ) {
        const a = dataToPoint(o.a);
        const b = dataToPoint(o.b);

        if (!a || !b) continue;

        if (distance(mouse, a) < 10) {
          return { id: o.id, mode: "a" as const };
        }

        if (distance(mouse, b) < 10) {
          return { id: o.id, mode: "b" as const };
        }
      }
    }

    return null;
  }

  function findHitObject(x: number, y: number) {
    const mouse = { x, y };

    for (let i = objs.length - 1; i >= 0; i--) {
      const o = objs[i];

      if (o.type === "HLINE") {
        const yy = candleSeriesRef.current?.priceToCoordinate(o.price);
        if (yy != null && Math.abs(y - Number(yy)) < 8) return o.id;
      }

      if (o.type === "VLINE") {
        const xx = marketTimeToX(o.t);
        if (xx != null && Math.abs(x - Number(xx)) < 8) return o.id;
      }

      if (
        o.type === "TREND" ||
        o.type === "RAY" ||
        o.type === "HORIZONTAL_RAY" ||
        o.type === "RECT" ||
        o.type === "FIBO"
      ) {
        const a = dataToPoint(o.a);
        const b = dataToPoint(o.b);

        if (!a || !b) continue;

        if (o.type === "RECT") {
          const left = Math.min(a.x, b.x);
          const right = Math.max(a.x, b.x);
          const top = Math.min(a.y, b.y);
          const bottom = Math.max(a.y, b.y);

          if (
            x >= left - 6 &&
            x <= right + 6 &&
            y >= top - 6 &&
            y <= bottom + 6
          ) {
            return o.id;
          }
        } else if (o.type === "RAY") {
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.max(1, Math.hypot(dx, dy));
          const rayEnd = {
            x: a.x + (dx / len) * 5000,
            y: a.y + (dy / len) * 5000,
          };
          if (distToSegment(mouse, a, rayEnd) < 10) return o.id;
        } else if (o.type === "HORIZONTAL_RAY") {
          const rayEnd = { x: (canvasRef.current?.clientWidth ?? 0) + 2000, y: a.y };
          if (distToSegment(mouse, a, rayEnd) < 10) return o.id;
        } else if (o.type === "FIBO") {
          const x1 = Math.min(a.x, b.x);
          const x2 = Math.max(a.x, b.x);
          const insideX = x >= x1 - 10 && x <= x2 + 10;
          if (insideX) {
            for (const level of fiboLevels.filter((level) => level.enabled)) {
              const yy = a.y + (b.y - a.y) * level.value;
              if (Math.abs(y - yy) < 10) return o.id;
            }
          }
          if (distToSegment(mouse, a, b) < 10) return o.id;
        } else {
          if (distToSegment(mouse, a, b) < 10) return o.id;
        }
      }

      if (o.type === "PATH" || o.type === "BRUSH") {
        const pts = o.points
          .map(dataToPoint)
          .filter(Boolean) as Array<{ x: number; y: number }>;

        for (let j = 1; j < pts.length; j++) {
          if (distToSegment(mouse, pts[j - 1], pts[j]) < 8) return o.id;
        }
      }
    }

    return null;
  }

  const drawObject = React.useCallback(
    (ctx: CanvasRenderingContext2D, o: AnyObj, selected = false) => {
      if (!o.visible) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      ctx.save();

      ctx.strokeStyle = selected ? "#60a5fa" : o.color;
      ctx.fillStyle = selected
        ? "rgba(96,165,250,0.12)"
        : "rgba(59,130,246,0.10)";
      ctx.lineWidth = selected ? 3 : 2;
      ctx.setLineDash([]);

      if (o.type === "HLINE") {
        const y = candleSeriesRef.current?.priceToCoordinate(o.price);
        if (y == null) {
          ctx.restore();
          return;
        }

        ctx.beginPath();
        ctx.moveTo(0, Number(y));
        ctx.lineTo(canvas.clientWidth, Number(y));
        ctx.stroke();

        // HLINE: show selected price on the right edge.
        const priceText = Number(o.price).toFixed(
          Math.abs(o.price) >= 1000 ? 2 : Math.abs(o.price) >= 100 ? 3 : 5
        );
        ctx.save();
        ctx.font = "700 11px Inter, Arial";
        ctx.textBaseline = "middle";
        const padX = 7;
        const labelH = 22;
        const labelW = Math.ceil(ctx.measureText(priceText).width) + padX * 2;
        const labelX = Math.max(0, canvas.clientWidth - labelW);
        const labelY = Math.max(labelH / 2, Math.min(canvas.clientHeight - labelH / 2, Number(y)));
        ctx.fillStyle = selected ? "#2563eb" : o.color;
        ctx.fillRect(labelX, labelY - labelH / 2, labelW, labelH);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(priceText, labelX + padX, labelY);
        ctx.restore();
      }

      if (o.type === "VLINE") {
        const x = marketTimeToX(o.t);
        if (x == null) {
          ctx.restore();
          return;
        }

        ctx.beginPath();
        ctx.moveTo(Number(x), 0);
        ctx.lineTo(Number(x), canvas.clientHeight);
        ctx.stroke();

        // VLINE: use the same local-time formatter as the chart axis/crosshair.
        // No manual timezone offset: the stored anchor remains the absolute UTCTimestamp.
        const timeText = formatChartDateTime(o.t);

        ctx.save();
        ctx.font = "700 11px Inter, Arial";
        ctx.textBaseline = "middle";
        const padX = 7;
        const labelH = 22;
        const labelW = Math.ceil(ctx.measureText(timeText).width) + padX * 2;
        const labelX = Math.max(0, Math.min(canvas.clientWidth - labelW, Number(x) - labelW / 2));
        const labelY = Math.max(0, canvas.clientHeight - labelH);
        ctx.fillStyle = selected ? "#2563eb" : o.color;
        ctx.fillRect(labelX, labelY, labelW, labelH);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(timeText, labelX + padX, labelY + labelH / 2);
        ctx.restore();
      }

      if (
        o.type === "TREND" ||
        o.type === "RAY" ||
        o.type === "HORIZONTAL_RAY" ||
        o.type === "RECT" ||
        o.type === "FIBO"
      ) {
        const a = dataToPoint(o.a);
        const b = dataToPoint(o.b);

        if (!a || !b) {
          ctx.restore();
          return;
        }

        if (o.type === "TREND") {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }

        if (o.type === "RAY") {
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.max(1, Math.sqrt(dx * dx + dy * dy));
          const ux = dx / len;
          const uy = dy / len;

          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(a.x + ux * 5000, a.y + uy * 5000);
          ctx.stroke();
        }

        if (o.type === "HORIZONTAL_RAY") {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(canvas.clientWidth + 2000, a.y);
          ctx.stroke();
        }

        if (o.type === "RECT") {
          const x = Math.min(a.x, b.x);
          const y = Math.min(a.y, b.y);
          const w = Math.abs(b.x - a.x);
          const h = Math.abs(b.y - a.y);

          ctx.fillRect(x, y, w, h);
          ctx.strokeRect(x, y, w, h);
        }

if (o.type === "FIBO") {
  const x1 = Math.min(a.x, b.x);
  const x2 = Math.max(a.x, b.x);

  ctx.font = "11px Inter, Arial";
  ctx.textBaseline = "middle";

  fiboLevels
    .filter((level) => level.enabled)
    .forEach((level) => {
      const yy = a.y + (b.y - a.y) * level.value;

      ctx.strokeStyle = level.color;

      ctx.beginPath();
      ctx.moveTo(x1, yy);
      ctx.lineTo(x2, yy);
      ctx.stroke();

      ctx.fillStyle = level.color;
      ctx.fillText(String(level.value), x1 - 55, yy);
    });
}

        if (selected) {
          ctx.save();
          ctx.strokeStyle = "#60a5fa";
          ctx.fillStyle = "#60a5fa";
          ctx.lineWidth = 3;
          ctx.setLineDash([6, 4]);

          if (o.type === "RECT") {
            const left = Math.min(a.x, b.x);
            const right = Math.max(a.x, b.x);
            const top = Math.min(a.y, b.y);
            const bottom = Math.max(a.y, b.y);
            ctx.strokeRect(left - 2, top - 2, right - left + 4, bottom - top + 4);
            ctx.setLineDash([]);
            [
              { x: left, y: top }, { x: right, y: top },
              { x: left, y: bottom }, { x: right, y: bottom },
            ].forEach((pt) => {
              ctx.fillRect(pt.x - 5, pt.y - 5, 10, 10);
            });
          } else {
            ctx.setLineDash([]);
            [a, b].forEach((pt) => {
              ctx.beginPath();
              ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
              ctx.fill();
            });
          }
          ctx.restore();
        }
      }

      if (o.type === "PATH" || o.type === "BRUSH") {
        const pts = o.points
          .map(dataToPoint)
          .filter(Boolean) as Array<{ x: number; y: number }>;

        if (pts.length < 2) {
          ctx.restore();
          return;
        }

        ctx.lineWidth = o.type === "BRUSH" ? 5 : 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        pts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.stroke();
      }

      ctx.restore();
    },
    [chartRef, candleSeriesRef, dataToPoint, marketTimeToX]
  );

  const drawTradeZones = React.useCallback((ctx: CanvasRenderingContext2D) => {
    const spec = tradeZoneSpec;
    const chart = chartRef.current;
    const series = candleSeriesRef.current;
    const canvas = canvasRef.current;
    if (!spec || !chart || !series || !canvas) return;

    const anchorX = marketTimeToX(spec.anchorTime);
    if (anchorX == null || !Number.isFinite(Number(anchorX))) return;

    const levels = spec.levels;
    const x = Number(anchorX) + (spec.gapPx ?? 12);
    const w = spec.widthPx ?? 220;
    const tps = (levels.tps?.length ? levels.tps : levels.tp != null ? [levels.tp] : [])
      .filter(Number.isFinite).slice(0, 3) as number[];
    const side: "BUY" | "SELL" = levels.side ?? (tps[0] != null && tps[0] < levels.entry ? "SELL" : "BUY");
    const risk = Math.max(1e-9, Math.abs(levels.entry - levels.sl));
    const maxEntryHalf = risk * 0.10;
    const ez = levels.zones?.find(z => z.label === "ENTRY");
    let entryHalf = maxEntryHalf;
    if (ez && Number.isFinite(ez.from) && Number.isFinite(ez.to)) {
      entryHalf = Math.min(Math.max(Math.abs(ez.to - ez.from) / 2, risk * 0.025), maxEntryHalf);
    }

    const bands: Array<{from:number;to:number;kind:"ENTRY"|"SL"|"TP1"|"TP2"|"TP3"}> = [
      { from: levels.entry - entryHalf, to: levels.entry + entryHalf, kind: "ENTRY" },
      { from: levels.sl, to: levels.entry, kind: "SL" },
    ];
    if (side === "BUY") {
      if (tps[0] != null) bands.push({from:levels.entry,to:tps[0],kind:"TP1"});
      if (tps[1] != null && tps[0] != null) bands.push({from:tps[0],to:tps[1],kind:"TP2"});
      if (tps[2] != null && tps[1] != null) bands.push({from:tps[1],to:tps[2],kind:"TP3"});
    } else {
      if (tps[0] != null) bands.push({from:tps[0],to:levels.entry,kind:"TP1"});
      if (tps[1] != null && tps[0] != null) bands.push({from:tps[1],to:tps[0],kind:"TP2"});
      if (tps[2] != null && tps[1] != null) bands.push({from:tps[2],to:tps[1],kind:"TP3"});
    }

    const fillFor = (k:string) => k === "SL" ? "rgba(239,68,68,.14)" : k === "ENTRY" ? (side === "BUY" ? "rgba(16,185,129,.20)" : "rgba(239,68,68,.20)") : "rgba(16,185,129,.10)";
    const strokeFor = (k:string) => k === "SL" ? "rgba(239,68,68,.82)" : k === "ENTRY" ? (side === "BUY" ? "rgba(16,185,129,.95)" : "rgba(239,68,68,.95)") : "rgba(16,185,129,.60)";

    ctx.save();
    ctx.font = "700 11px Inter, Arial";
    ctx.textBaseline = "middle";
    for (const b of bands) {
      const y1 = series.priceToCoordinate(b.from);
      const y2 = series.priceToCoordinate(b.to);
      if (y1 == null || y2 == null) continue;
      const top = Math.min(Number(y1), Number(y2));
      const h = Math.max(b.kind === "ENTRY" ? 18 : 6, Math.abs(Number(y2)-Number(y1)));
      ctx.fillStyle = fillFor(b.kind); ctx.strokeStyle = strokeFor(b.kind); ctx.lineWidth = b.kind === "ENTRY" ? 2 : 1;
      ctx.beginPath(); ctx.roundRect(x, top, w, h, b.kind === "ENTRY" ? 10 : 6); ctx.fill(); ctx.stroke();
    }

    const lineItems: Array<[string,number,string,number]> = [["ENTRY",levels.entry,side === "BUY" ? "rgba(16,185,129,.98)" : "rgba(239,68,68,.98)",3],["SL",levels.sl,"rgba(239,68,68,.98)",3]];
    tps.forEach((v,i)=>lineItems.push([`TP${i+1}`,v,"rgba(16,185,129,.92)",2]));
    const dp = Math.min(8, Math.max(0, spec.precision ?? 5));
    for (const [label,price,color,lw] of lineItems) {
      const yy = series.priceToCoordinate(price);
      if (yy == null) continue;
      const y = Number(yy);
      ctx.strokeStyle=color; ctx.lineWidth=lw; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+w,y); ctx.stroke();
      const txt=`${label} ${Number(price).toFixed(dp)}`;
      const tw=ctx.measureText(txt).width+18;
      ctx.fillStyle="rgba(7,17,31,.94)"; ctx.strokeStyle=color; ctx.lineWidth=1;
      ctx.beginPath(); ctx.roundRect(x+w+8,y-12,tw,24,8); ctx.fill(); ctx.stroke();
      ctx.fillStyle="#f8fafc"; ctx.fillText(txt,x+w+17,y+.5);
    }
    ctx.restore();
  }, [tradeZoneSpec, chartRef, candleSeriesRef, marketTimeToX]);

  const draw = React.useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    drawTradeZones(ctx);
    objs.forEach((o) => drawObject(ctx, o, o.id === selectedId || o.id === hoverId));

    if (draft && preview && TWO_POINT_TOOLS.includes(activeDrawTool)) {
      drawObject(ctx, {
        id: "preview",
        type: activeDrawTool as TwoPointObj["type"],
        a: draft,
        b: preview,
        color: "#facc15",
        visible: true,
        createdAt: Date.now(),
      } as AnyObj);
    }

    if (
      (activeDrawTool === "PATH" || activeDrawTool === "BRUSH") &&
      drawingPathRef.current.length > 1
    ) {
      drawObject(ctx, {
        id: "path-preview",
        type: activeDrawTool,
        points: drawingPathRef.current,
        color: "#facc15",
        visible: true,
        createdAt: Date.now(),
      } as AnyObj);
    }
  }, [objs, selectedId, hoverId, draft, preview, activeDrawTool, drawObject, drawTradeZones]);

  React.useEffect(() => {
    resize();
    draw();

    const ro = new ResizeObserver(() => {
      resize();
      draw();
    });

    if (wrapRef.current) ro.observe(wrapRef.current);

    return () => ro.disconnect();
  }, [resize, draw, wrapRef]);

  React.useEffect(() => {
    draw();
  }, [draw]);

  // Candles change on every timeframe, drawings do not. Re-project all saved
  // TIME + PRICE anchors onto the new candle spacing after a TF switch.
  React.useEffect(() => {
    const raf1 = requestAnimationFrame(() => {
      draw();
      requestAnimationFrame(draw);
    });
    return () => cancelAnimationFrame(raf1);
  }, [timeframe, draw]);

  // ============================================================
  // FREEZE DRAWINGS TO MARKET COORDINATES
  //
  // Drawings are stored as TIME + PRICE, not as screen pixels.
  // When the chart is panned/zoomed, Lightweight Charts changes the
  // conversion from TIME/PRICE -> X/Y. The canvas must therefore be
  // redrawn on every visible-range change. Without this subscription
  // the candles move, but the already rendered canvas can remain in the
  // old pixel position, which makes RECT/lines look like they slide.
  // ============================================================
  React.useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    let raf = 0;
    const redraw = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        draw();
      });
    };

    const timeScale = chart.timeScale();

    try {
      timeScale.subscribeVisibleLogicalRangeChange(redraw);
    } catch {}

    try {
      timeScale.subscribeVisibleTimeRangeChange(redraw);
    } catch {}

    redraw();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      try {
        timeScale.unsubscribeVisibleLogicalRangeChange(redraw);
      } catch {}
      try {
        timeScale.unsubscribeVisibleTimeRangeChange(redraw);
      } catch {}

    };
  }, [chartRef, wrapRef, resize, draw]);

  // Keep the Canvas locked to Lightweight Charts while the user drags
  // the chart/price scale. Price-scale movement does not emit a public
  // visible-time-range event, so redraw on animation frames only for the
  // duration of the pointer interaction. Every frame recalculates Y via
  // series.priceToCoordinate(), keeping drawings and ENTRY/SL/TP on price.
  React.useEffect(() => {
    let syncRaf = 0;
    let syncing = false;

    const frame = () => {
      if (!syncing) return;
      draw();
      syncRaf = requestAnimationFrame(frame);
    };

    const startSync = (e: PointerEvent) => {
      const wrap = wrapRef.current;
      if (!wrap) return;

      const r = wrap.getBoundingClientRect();
      const inside =
        e.clientX >= r.left &&
        e.clientX <= r.right &&
        e.clientY >= r.top &&
        e.clientY <= r.bottom;

      if (!inside || syncing) return;
      syncing = true;
      draw();
      syncRaf = requestAnimationFrame(frame);
    };

    const stopSync = () => {
      if (!syncing) return;
      syncing = false;
      if (syncRaf) cancelAnimationFrame(syncRaf);
      syncRaf = 0;
      // One final redraw after Lightweight Charts applies its last scale transform.
      requestAnimationFrame(draw);
    };

    window.addEventListener("pointerdown", startSync, true);
    window.addEventListener("pointerup", stopSync, true);
    window.addEventListener("pointercancel", stopSync, true);
    window.addEventListener("blur", stopSync);

    return () => {
      syncing = false;
      if (syncRaf) cancelAnimationFrame(syncRaf);
      window.removeEventListener("pointerdown", startSync, true);
      window.removeEventListener("pointerup", stopSync, true);
      window.removeEventListener("pointercancel", stopSync, true);
      window.removeEventListener("blur", stopSync);
    };
  }, [wrapRef, draw]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDraft(null);
        setPreview(null);
        onDrawToolChange?.("SELECT");
      }

      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        setObjs((prev) => prev.filter((x) => x.id !== selectedId));
        setSelectedId(null);
      }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, onDrawToolChange]);

  const addObj = (obj: AnyObj) => {
    setObjs((prev) => [...prev, obj]);
  };

  const makeBase = (type: DrawTool): BaseObj => ({
    id: crypto.randomUUID(),
    type,
    color: "#3b82f6",
    visible: true,
    createdAt: Date.now(),
  });

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const p = pointToData(x, y);

    if (!p) return;

    isMouseDownRef.current = true;

    if (activeDrawTool === "SELECT") {
      const handleHit = findHitHandle(x, y);

      if (handleHit) {
        setSelectedId(handleHit.id);

        dragRef.current = {
          id: handleHit.id,
          last: p,
          mode: handleHit.mode,
          startClientX: e.clientX,
          startClientY: e.clientY,
          startObj: objs.find((o) => o.id === handleHit.id) ?? null,
        };

        chartPanRef.current = {
          active: false,
          lastClientX: e.clientX,
          lastClientY: e.clientY,
          priceMin: null,
          priceMax: null,
        };

        return;
      }

      const hitId = findHitObject(x, y);

      if (hitId) {
        setSelectedId(hitId);

        dragRef.current = {
          id: hitId,
          last: p,
          mode: "move",
          startClientX: e.clientX,
          startClientY: e.clientY,
          startObj: objs.find((o) => o.id === hitId) ?? null,
        };

        chartPanRef.current = {
          active: false,
          lastClientX: e.clientX,
          lastClientY: e.clientY,
          priceMin: null,
          priceMax: null,
        };

        return;
      }

      // Empty chart area => pan chart instead of selecting a drawing.
      setSelectedId(null);

      dragRef.current = {
        id: null,
        last: null,
        mode: "move",
        startClientX: 0,
        startClientY: 0,
        startObj: null,
      };

      let priceMin: number | null = null;
      let priceMax: number | null = null;

      try {
        const chart = chartRef.current;
        const candles = getCandles();
        const range = chart?.timeScale().getVisibleLogicalRange();

        if (range && candles.length) {
          const fromIdx = Math.max(0, Math.floor(Number(range.from)));
          const toIdx = Math.min(candles.length - 1, Math.ceil(Number(range.to)));
          const visible = candles.slice(fromIdx, toIdx + 1) as any[];
          const lows = visible.map((c) => Number(c.low)).filter(Number.isFinite);
          const highs = visible.map((c) => Number(c.high)).filter(Number.isFinite);

          if (lows.length && highs.length) {
            priceMin = Math.min(...lows);
            priceMax = Math.max(...highs);
          }
        }
      } catch {}

      chartPanRef.current = {
        active: true,
        lastClientX: e.clientX,
        lastClientY: e.clientY,
        priceMin,
        priceMax,
      };

      return;
    }

    if (activeDrawTool === "HLINE") {
      addObj({
        ...makeBase("HLINE"),
        type: "HLINE",
        price: p.p,
      });

      return;
    }

    if (activeDrawTool === "VLINE") {
      // Prefer the chart's own X -> time conversion. This keeps the VLINE time
      // synchronized with the time scale. If the library cannot resolve it,
      // fall back to the nearest candle time.
      const exact = screenToData(x, y);
      addObj({
        ...makeBase("VLINE"),
        type: "VLINE",
        t: (exact?.t ?? p.t) as UTCTimestamp,
      });

      return;
    }

    if (activeDrawTool === "PATH" || activeDrawTool === "BRUSH") {
      drawingPathRef.current = [p];
      return;
    }

    if (TWO_POINT_TOOLS.includes(activeDrawTool)) {
      if (!draft) {
        setDraft(p);
        setPreview(p);
        return;
      }

      addObj({
        ...makeBase(activeDrawTool),
        type: activeDrawTool as TwoPointObj["type"],
        a: draft,
        b: p,
      } as AnyObj);

      setDraft(null);
      setPreview(null);
      onDrawToolChange?.("SELECT");
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;
    const p = pointToData(localX, localY);

    // Crosshair dokładnie jak w Alpha: pion + poziom śledzą kursor.
    // Canvas Drawing Tools jest nad chartem, więc synchronizujemy crosshair ręcznie.
    if (p && !dragRef.current.id && !chartPanRef.current.active) {
      try {
        (chartRef.current as any)?.setCrosshairPosition?.(
          p.p,
          p.t as any,
          candleSeriesRef.current
        );
      } catch {}
    }

    if (!p) return;

    if (activeDrawTool === "SELECT" && !isMouseDownRef.current) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const hit = findHitHandle(x, y)?.id ?? findHitObject(x, y);
      setHoverId((prev) => (prev === hit ? prev : hit));
    }

    if (
      activeDrawTool === "SELECT" &&
      chartPanRef.current.active &&
      isMouseDownRef.current
    ) {
      const chart = chartRef.current;

      if (chart) {
        const dx = e.clientX - chartPanRef.current.lastClientX;
        const dy = e.clientY - chartPanRef.current.lastClientY;
        chartPanRef.current.lastClientX = e.clientX;
        chartPanRef.current.lastClientY = e.clientY;

        try {
          const timeScale = chart.timeScale();
          const range = timeScale.getVisibleLogicalRange();

          if (range) {
            const canvasWidth = e.currentTarget.clientWidth || 1;
            const logicalPerPixel = (range.to - range.from) / canvasWidth;
            const shift = -dx * logicalPerPixel;

            timeScale.setVisibleLogicalRange({
              from: range.from + shift,
              to: range.to + shift,
            });
            requestAnimationFrame(draw);
          }

          // PAN Y: przesuwanie wykresu góra/dół myszką w pustym miejscu.
          const series = candleSeriesRef.current;
          const min = chartPanRef.current.priceMin;
          const max = chartPanRef.current.priceMax;

          if (series && min != null && max != null && max > min) {
            const canvasHeight = e.currentTarget.clientHeight || 1;
            const span = max - min;
            const priceShift = (dy / canvasHeight) * span;
            const nextMin = min + priceShift;
            const nextMax = max + priceShift;

            chartPanRef.current.priceMin = nextMin;
            chartPanRef.current.priceMax = nextMax;

            series.applyOptions({
              autoscaleInfoProvider: (() => ({
                priceRange: { minValue: nextMin, maxValue: nextMax },
                margins: { above: 0, below: 0 },
              })) as any,
            } as any);

            chart.priceScale("right").applyOptions({ autoScale: true });
          }
        } catch {}
      }

      return;
    }

    if (activeDrawTool === "SELECT" && dragRef.current.id && dragRef.current.last) {
      const id = dragRef.current.id;
      const mode = dragRef.current.mode;
      const startObj = dragRef.current.startObj;
      const dx = e.clientX - dragRef.current.startClientX;
      const dy = e.clientY - dragRef.current.startClientY;

      if (startObj) {
        const movePoint = (pt: Point): Point | null => {
          const sp = dataToPoint(pt);
          if (!sp) return null;
          return screenToData(sp.x + dx, sp.y + dy) ?? pointToData(sp.x + dx, sp.y + dy);
        };

        setObjs((prev) =>
          prev.map((o) => {
            if (o.id !== id) return o;

            if (mode === "a" && "a" in o && "b" in o) {
              return { ...o, a: p } as AnyObj;
            }
            if (mode === "b" && "a" in o && "b" in o) {
              return { ...o, b: p } as AnyObj;
            }

            if (startObj.type === "HLINE") {
              const y0 = candleSeriesRef.current?.priceToCoordinate(startObj.price);
              const price = y0 == null ? null : candleSeriesRef.current?.coordinateToPrice(Number(y0) + dy);
              return price == null ? o : ({ ...o, price: Number(price) } as AnyObj);
            }

            // MOVE całego obiektu po BARACH + CENIE.
            // Nie przeliczamy osobno punktów przez coordinateToTime(), bo przy
            // pan/zoom powodowało to "latanie" i zmianę szerokości RECT/FIBO.
            const chart = chartRef.current;
            const series = candleSeriesRef.current;
            const candles = getCandles();
            const ts = chart?.timeScale();

            const startLocalX = dragRef.current.startClientX - rect.left;
            const startLocalY = dragRef.current.startClientY - rect.top;
            const startLogical = ts?.coordinateToLogical(startLocalX);
            const currentLogical = ts?.coordinateToLogical(localX);
            const startPrice = series?.coordinateToPrice(startLocalY);
            const currentPrice = series?.coordinateToPrice(localY);

            const barDelta =
              startLogical != null && currentLogical != null
                ? Math.round(Number(currentLogical) - Number(startLogical))
                : 0;
            const priceDelta =
              startPrice != null && currentPrice != null
                ? Number(currentPrice) - Number(startPrice)
                : 0;

            const indexForTime = (t: UTCTimestamp) => {
              let best = 0;
              let bestD = Infinity;
              const target = Number(t);
              for (let i = 0; i < candles.length; i++) {
                const d = Math.abs(Number(candles[i].time) - target);
                if (d < bestD) { bestD = d; best = i; }
              }
              return best;
            };

            const shiftPointStable = (pt: Point): Point => {
              if (!candles.length) return { t: pt.t, p: pt.p + priceDelta };
              const idx = indexForTime(pt.t);
              const next = Math.max(0, Math.min(candles.length - 1, idx + barDelta));
              return {
                t: candles[next].time as UTCTimestamp,
                p: pt.p + priceDelta,
              };
            };

            if (startObj.type === "VLINE") {
              if (!candles.length) return o;
              const idx = indexForTime(startObj.t);
              const next = Math.max(0, Math.min(candles.length - 1, idx + barDelta));
              return { ...o, t: candles[next].time as UTCTimestamp } as AnyObj;
            }

            if (
              startObj.type === "TREND" ||
              startObj.type === "RAY" ||
              startObj.type === "HORIZONTAL_RAY" ||
              startObj.type === "RECT" ||
              startObj.type === "FIBO"
            ) {
              return {
                ...o,
                a: shiftPointStable(startObj.a),
                b: shiftPointStable(startObj.b),
              } as AnyObj;
            }

            if (startObj.type === "PATH" || startObj.type === "BRUSH") {
              return {
                ...o,
                points: startObj.points.map(shiftPointStable),
              } as AnyObj;
            }

            return o;
          })
        );
      }

      dragRef.current.last = p;
      draw();
      return;
    }

    if (draft && TWO_POINT_TOOLS.includes(activeDrawTool)) {
      setPreview(p);
    }

    if (
      isMouseDownRef.current &&
      (activeDrawTool === "PATH" || activeDrawTool === "BRUSH")
    ) {
      drawingPathRef.current.push(p);
      draw();
    }
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;

    chartPanRef.current = {
      active: false,
      lastClientX: 0,
      lastClientY: 0,
      priceMin: null,
      priceMax: null,
    };

    dragRef.current = {
      id: null,
      last: null,
      mode: "move",
      startClientX: 0,
      startClientY: 0,
      startObj: null,
    };

    if (
      (activeDrawTool === "PATH" || activeDrawTool === "BRUSH") &&
      drawingPathRef.current.length > 1
    ) {
      addObj({
        ...makeBase(activeDrawTool),
        type: activeDrawTool,
        points: drawingPathRef.current,
      } as AnyObj);

      drawingPathRef.current = [];
      onDrawToolChange?.("SELECT");
    }
  };
  const selectedFibo = objs.find(
    (o) => o.id === selectedId && o.type === "FIBO"
  );

  return (
    <>
      {selectedFibo && (
        <div
          className="absolute right-3 top-3 z-[100] w-[300px] rounded-2xl border border-white/10 bg-[#07111f]/95 p-4 text-white shadow-2xl backdrop-blur"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-black">FIBONACCI</h3>

            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="rounded-lg px-2 py-1 text-white/60 hover:bg-white/10 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            {fiboLevels.map((level) => (
              <div
                key={level.id}
                className="grid grid-cols-[20px_1fr_48px] items-center gap-2"
              >
                <input
                  type="checkbox"
                  checked={level.enabled}
                  onChange={(e) =>
                    setFiboLevels((prev) =>
                      prev.map((x) =>
                        x.id === level.id
                          ? {
                              ...x,
                              enabled: e.target.checked,
                            }
                          : x
                      )
                    )
                  }
                  className="h-4 w-4 accent-sky-500"
                />

                <input
                  type="number"
                  step="0.001"
                  value={level.value}
                  onChange={(e) =>
                    setFiboLevels((prev) =>
                      prev.map((x) =>
                        x.id === level.id
                          ? {
                              ...x,
                              value: Number(e.target.value),
                            }
                          : x
                      )
                    )
                  }
                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
                />

                <input
                  type="color"
                  value={level.color}
                  onChange={(e) =>
                    setFiboLevels((prev) =>
                      prev.map((x) =>
                        x.id === level.id
                          ? {
                              ...x,
                              color: e.target.value,
                            }
                          : x
                      )
                    )
                  }
                  className="h-10 w-12 rounded-lg border border-white/10 bg-transparent"
                />
              </div>
            ))}
          </div>

   <div className="mt-4 grid grid-cols-3 gap-2">
  <button
    type="button"
    onClick={() =>
      setFiboLevels((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          value: 1.618,
          enabled: true,
          color: "#a855f7",
        },
      ])
    }
    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold hover:bg-white/10"
  >
    + Level
  </button>

  <button
    type="button"
    onClick={() =>
      setFiboLevels(DEFAULT_FIBO_LEVELS)
    }
    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold hover:bg-white/10"
  >
    Reset
  </button>

  <button
    type="button"
    onClick={() => {
      localStorage.setItem(
        "fibo_levels",
        JSON.stringify(fiboLevels)
      );
    }}
    className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm font-bold text-emerald-100 hover:bg-emerald-500/20"
  >
    Save
  </button>
</div>

          <button
            type="button"
            onClick={() => {
              setObjs((prev) =>
                prev.filter((x) => x.id !== selectedId)
              );
              setSelectedId(null);
            }}
            className="mt-3 w-full rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-100 hover:bg-red-500/20"
          >
            Delete Fibonacci
          </button>
        </div>
      )}

<canvas
  ref={canvasRef}
  className="absolute inset-0 z-[20]"
  style={{
    pointerEvents: "auto",
    // Bez „łapki”. SELECT ma taki sam kursor/crosshair jak Alpha.
    cursor: activeDrawTool === "SELECT"
      ? dragRef.current.id || chartPanRef.current.active
        ? "grabbing"
        : hoverId
          ? "grab"
          : "crosshair"
      : "crosshair",
    touchAction: "none",
  }}
  onWheel={(e) => {
    e.preventDefault();

    const chart = chartRef.current;
    if (!chart) return;

    try {
      const scale = chart.timeScale();
      const range = scale.getVisibleLogicalRange();

      if (!range) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = Math.max(
        0,
        Math.min(
          e.clientX - rect.left,
          rect.width
        )
      );

      const ratio =
        rect.width > 0
          ? mouseX / rect.width
          : 0.5;

      const span =
        range.to - range.from;

      const factor =
        e.deltaY > 0
          ? 1.12
          : 0.88;

      const nextSpan =
        Math.max(
          8,
          Math.min(
            5000,
            span * factor
          )
        );

      const anchor =
        range.from +
        span * ratio;

      scale.setVisibleLogicalRange({
        from:
          anchor -
          nextSpan * ratio,
        to:
          anchor +
          nextSpan * (1 - ratio),
      });
      // Lightweight Charts applies the new logical range asynchronously.
      // Redraw the market-coordinate overlay for a few frames so ENTRY/SL/TP
      // and drawings stay locked to their TIME + PRICE while wheel-zooming.
      requestAnimationFrame(() => {
        draw();
        requestAnimationFrame(() => {
          draw();
          requestAnimationFrame(draw);
        });
      });
    } catch {}
  }}
  onMouseDown={handleMouseDown}
  onMouseMove={handleMouseMove}
  onMouseUp={handleMouseUp}
  onMouseLeave={() => {
    if (isMouseDownRef.current) handleMouseUp();
    setHoverId(null);
  }}
/>
    </>
  );
}