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

function getStorageKey(
  symbol: string,
  timeframe: string
) {
  return `drawings_${symbol}_${timeframe}`;
}

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
}: {
  wrapRef: React.RefObject<HTMLDivElement | null>;
  chartRef: React.RefObject<IChartApi | null>;
  candleSeriesRef: React.RefObject<ISeriesApi<"Candlestick"> | null>;
  getCandles: () => CandlestickData[];
  activeDrawTool: DrawTool;
  onDrawToolChange?: (t: DrawTool) => void;
  symbol: string;
  timeframe: string;
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
    const key = getStorageKey(symbol, timeframe);
    const raw = localStorage.getItem(key);
    setObjs(raw ? JSON.parse(raw) : []);
  } catch {
    setObjs([]);
  } finally {
    requestAnimationFrame(() => { storageReadyRef.current = true; });
  }
}, [symbol, timeframe]);
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
        const key = getStorageKey(symbol, timeframe);
        localStorage.setItem(key, JSON.stringify(objs));
      } catch {}
    }, 250);
    return () => window.clearTimeout(timer);
  }, [objs, symbol, timeframe]);

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

  const dataToPoint = React.useCallback(
    (p: Point | null) => {
      const chart = chartRef.current;
      const series = candleSeriesRef.current;

      if (!chart || !series || !p) return null;

      const x = chart.timeScale().timeToCoordinate(p.t as any);
      const y = series.priceToCoordinate(p.p);

      if (x == null || y == null) return null;

      return {
        x: Number(x),
        y: Number(y),
      };
    },
    [chartRef, candleSeriesRef]
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
        const xx = chartRef.current?.timeScale().timeToCoordinate(o.t as any);
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
        } else {
          if (distToSegment(mouse, a, b) < 8) return o.id;
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
      }

      if (o.type === "VLINE") {
        const x = chartRef.current?.timeScale().timeToCoordinate(o.t as any);
        if (x == null) {
          ctx.restore();
          return;
        }

        ctx.beginPath();
        ctx.moveTo(Number(x), 0);
        ctx.lineTo(Number(x), canvas.clientHeight);
        ctx.stroke();
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
    [chartRef, candleSeriesRef, dataToPoint]
  );

  const draw = React.useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

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
  }, [objs, selectedId, hoverId, draft, preview, activeDrawTool, drawObject]);

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
      addObj({
        ...makeBase("VLINE"),
        type: "VLINE",
        t: p.t,
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
    const p = pointToData(e.clientX - rect.left, e.clientY - rect.top);

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

            if (startObj.type === "VLINE") {
              const x0 = chartRef.current?.timeScale().timeToCoordinate(startObj.t as any);
              const time = x0 == null ? null : (chartRef.current?.timeScale() as any)?.coordinateToTime?.(Number(x0) + dx);
              return time == null ? o : ({ ...o, t: time as UTCTimestamp } as AnyObj);
            }

            if (
              startObj.type === "TREND" ||
              startObj.type === "RAY" ||
              startObj.type === "HORIZONTAL_RAY" ||
              startObj.type === "RECT" ||
              startObj.type === "FIBO"
            ) {
              const a = movePoint(startObj.a);
              const b = movePoint(startObj.b);
              return a && b ? ({ ...o, a, b } as AnyObj) : o;
            }

            if (startObj.type === "PATH" || startObj.type === "BRUSH") {
              const points = startObj.points.map(movePoint);
              if (points.some((pt) => !pt)) return o;
              return { ...o, points: points as Point[] } as AnyObj;
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
    cursor:
      activeDrawTool === "SELECT"
        ? dragRef.current.id || chartPanRef.current.active
          ? "grabbing"
          : hoverId
          ? "move"
          : "default"
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
    } catch {}
  }}
  onMouseDown={handleMouseDown}
  onMouseMove={handleMouseMove}
  onMouseUp={handleMouseUp}
/>
    </>
  );
}