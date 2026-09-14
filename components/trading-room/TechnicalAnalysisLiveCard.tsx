"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Candle = { time: number; open: number; high: number; low: number; close: number };

type Snapshot = {
  price: number | null;
  changePct: number | null;
  score: number | null;
  trend: "UPTREND" | "DOWNTREND" | "NEUTRAL";
  strength: "STRONG" | "MODERATE" | "WEAK";
};

function ema(values: number[], period: number) {
  if (!values.length) return [] as number[];
  const k = 2 / (period + 1);
  const out = [values[0]];
  for (let i = 1; i < values.length; i += 1) out.push(values[i] * k + out[i - 1] * (1 - k));
  return out;
}

function rsi(values: number[], period = 14) {
  if (values.length <= period) return null;
  let gains = 0;
  let losses = 0;
  for (let i = values.length - period; i < values.length; i += 1) {
    const d = values[i] - values[i - 1];
    if (d >= 0) gains += d;
    else losses += Math.abs(d);
  }
  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

function parseCandles(data: any): Candle[] {
  const values = Array.isArray(data?.values) ? data.values : Array.isArray(data?.candles) ? data.candles : [];
  return values
    .map((v: any) => {
      const raw = String(v.datetime ?? v.time ?? "");
      const normalized = raw && !/^\d+$/.test(raw) ? raw.replace(" ", "T") : raw;
      const parsed = /^\d+$/.test(normalized)
        ? Number(normalized)
        : Date.parse(/Z$|[+-]\d\d:\d\d$/.test(normalized) ? normalized : `${normalized}Z`) / 1000;
      return {
        time: Number(parsed),
        open: Number(v.open),
        high: Number(v.high),
        low: Number(v.low),
        close: Number(v.close),
      };
    })
    .filter((c: Candle) => [c.time, c.open, c.high, c.low, c.close].every(Number.isFinite))
    .sort((a: Candle, b: Candle) => a.time - b.time);
}

export default function TechnicalAnalysisLiveCard({ onOpen }: { onOpen: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(false);
      const qs = new URLSearchParams({ symbol: "BTC/USD", interval: "5min", outputsize: "90", timezone: "UTC", order: "asc" });
      const res = await fetch(`/api/twelve-data?${qs.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || data?.status === "error") throw new Error(data?.message || "Market data error");
      const next = parseCandles(data);
      if (!next.length) throw new Error("No candles");
      setCandles(next.slice(-70));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const snapshot = useMemo<Snapshot>(() => {
    if (candles.length < 20) return { price: null, changePct: null, score: null, trend: "NEUTRAL", strength: "WEAK" };
    const closes = candles.map((c) => c.close);
    const e20 = ema(closes, 20);
    const e50 = ema(closes, 50);
    const last = closes.at(-1)!;
    const prev = closes.at(-2)!;
    const e20Last = e20.at(-1)!;
    const e50Last = e50.at(-1)!;
    const rv = rsi(closes) ?? 50;
    let score = 50;
    if (last > e20Last) score += 12; else score -= 12;
    if (e20Last > e50Last) score += 16; else score -= 16;
    if (rv > 55) score += 10;
    if (rv < 45) score -= 10;
    if (last > prev) score += 5; else score -= 5;
    score = Math.max(0, Math.min(100, Math.round(score)));
    const trend = e20Last > e50Last && last > e20Last ? "UPTREND" : e20Last < e50Last && last < e20Last ? "DOWNTREND" : "NEUTRAL";
    const spread = Math.abs(e20Last - e50Last) / Math.max(last, 1);
    const strength = spread > 0.004 ? "STRONG" : spread > 0.0015 ? "MODERATE" : "WEAK";
    return { price: last, changePct: ((last - prev) / prev) * 100, score, trend, strength };
  }, [candles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const draw = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#06182a";
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(56,189,248,.08)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= w; x += w / 8) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y <= h; y += h / 5) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

      if (candles.length < 10) return;
      const view = candles.slice(-48);
      const highs = view.map((c) => c.high);
      const lows = view.map((c) => c.low);
      const min = Math.min(...lows);
      const max = Math.max(...highs);
      const range = Math.max(max - min, 1e-8);
      const padX = 8;
      const padY = 10;
      const plotW = w - padX * 2;
      const plotH = h - padY * 2;
      const step = plotW / view.length;
      const y = (p: number) => padY + (max - p) / range * plotH;

      const closes = view.map((c) => c.close);
      const e10 = ema(closes, 10);
      const e20 = ema(closes, 20);
      const e40 = ema(closes, 40);
      const drawLine = (arr: number[], stroke: string, width: number) => {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = width;
        ctx.beginPath();
        arr.forEach((v, i) => {
          const px = padX + i * step + step / 2;
          const py = y(v);
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        });
        ctx.stroke();
      };

      view.forEach((c, i) => {
        const x = padX + i * step + step / 2;
        const up = c.close >= c.open;
        const color = up ? "#22d3ee" : "#ef4444";
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, y(c.high));
        ctx.lineTo(x, y(c.low));
        ctx.stroke();
        const top = y(Math.max(c.open, c.close));
        const bottom = y(Math.min(c.open, c.close));
        ctx.fillRect(x - Math.max(2, step * 0.28), top, Math.max(4, step * 0.56), Math.max(2, bottom - top));
      });

      drawLine(e10, "#38bdf8", 1.8);
      drawLine(e20, "#f59e0b", 1.5);
      drawLine(e40, "#22c55e", 1.5);
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [candles]);

  const trendColor = snapshot.trend === "UPTREND" ? "text-emerald-300" : snapshot.trend === "DOWNTREND" ? "text-rose-300" : "text-sky-100/70";
  const strengthColor = snapshot.strength === "STRONG" ? "text-amber-300" : snapshot.strength === "MODERATE" ? "text-yellow-200" : "text-sky-100/65";

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex h-full min-h-[500px] flex-col overflow-hidden rounded-[20px] border border-blue-400/50 bg-[#06182a] text-left shadow-[0_12px_34px_rgba(0,0,0,.28)] transition hover:-translate-y-0.5 hover:border-cyan-300/70 hover:shadow-[0_0_36px_rgba(14,165,233,.24)] xl:min-h-[560px]"
    >
      <div ref={wrapRef} className="relative h-[235px] shrink-0 overflow-hidden rounded-t-[24px] bg-[#041426] sm:h-[245px] xl:h-[270px]">
        <img
          src="/trading-room/technical-analysis-preview-v2.png"
          alt="Technical Analysis"
          className="absolute inset-0 h-full w-full object-contain object-center p-2"
        />
        <canvas ref={canvasRef} className="hidden" aria-label="Live BTCUSD candlestick chart" />
        <div className="absolute left-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-xl border border-blue-300/25 bg-blue-600/90 text-white shadow-[0_0_24px_rgba(37,99,235,.45)]">
          <span className="text-[22px] font-black leading-none">▥</span>
        </div>
        <div className="absolute right-4 top-4 z-10 rounded-full border border-emerald-300/20 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-bold text-emerald-300">
          ● LIVE
        </div>
        <div className="absolute bottom-3 left-4 z-10 rounded-lg border border-cyan-300/10 bg-[#06182a]/80 px-2.5 py-1.5 backdrop-blur">
          <div className="text-[9px] font-bold text-white">BTCUSD · M5</div>
          <div className="mt-0.5 text-[9px] text-sky-100/60">
            {snapshot.price != null ? snapshot.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : loading ? "Loading..." : error ? "No data" : "—"}
            {snapshot.changePct != null ? <span className={snapshot.changePct >= 0 ? "ml-2 text-emerald-300" : "ml-2 text-rose-300"}>{snapshot.changePct >= 0 ? "+" : ""}{snapshot.changePct.toFixed(2)}%</span> : null}
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#06182a] via-[#06182a]/45 to-transparent" />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-300/80">TECHNICAL ANALYSIS</div>
        <h2 className="mt-1 text-[21px] font-black uppercase tracking-tight text-white">Technical Analysis</h2>
        <p className="mt-1 text-[11px] leading-5 text-sky-100/60">Real-time technical data and trading signals.<br />EMA, RSI, ADX, Pivot Points and more.</p>

        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-cyan-300/10 bg-emerald-500/5 px-2 py-3">
            <div className="text-[9px] text-sky-100/45">TA SCORE</div>
            <div className="mt-1 text-[18px] font-black text-emerald-300">{snapshot.score != null ? `${snapshot.score}%` : "LIVE"}</div>
          </div>
          <div className="rounded-xl border border-cyan-300/10 bg-emerald-500/5 px-2 py-3">
            <div className="text-[9px] text-sky-100/45">TREND</div>
            <div className={`mt-1 text-[12px] font-black ${trendColor}`}>{snapshot.trend}</div>
          </div>
          <div className="rounded-xl border border-cyan-300/10 bg-amber-500/5 px-2 py-3">
            <div className="text-[9px] text-sky-100/45">STRENGTH</div>
            <div className={`mt-1 text-[12px] font-black ${strengthColor}`}>{snapshot.strength}</div>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between rounded-xl border border-blue-300/20 bg-gradient-to-r from-blue-600 to-sky-500 px-4 py-3.5 shadow-[0_10px_28px_rgba(37,99,235,.28)] transition group-hover:brightness-110">
          <span className="text-[12px] font-bold text-white">Otwórz analizę</span>
          <span className="text-blue-100">→</span>
        </div>
      </div>
    </button>
  );
}
