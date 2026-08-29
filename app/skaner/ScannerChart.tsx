"use client";

import React from "react";
import type { CandlestickData, UTCTimestamp } from "lightweight-charts";
import MarketChart from "@/components/MarketChart";

type TrendDir = "UP" | "DOWN" | "NONE";

export type Zone = {
  label: "ENTRY" | "SL" | "TP1" | "TP2" | "TP3";
  from: number;
  to: number;
};

export type Levels = {
  entry: number;
  sl: number;
  tps: number[]; // [tp1,tp2,tp3]
  rr: number;
  zones?: Zone[];
  highlightTime?: UTCTimestamp | null;
};

type Candle = {
  open: number;
  high: number;
  low: number;
  close: number;
  time?: UTCTimestamp | number | string;
};

type Props = {
  symbol: string;
  tf?: string;

  candles: Array<CandlestickData | Candle>;
  liveCandle?: CandlestickData | Candle | null;

  liquidityPct: number; // 0..100
  trend: TrendDir; // "UP" | "DOWN" | "NONE"

  tickSize?: number;
  zoneTicks?: number;
  slBufferTicks?: number;
};

function toCandle(x: any): Candle {
  return {
    open: Number(x.open),
    high: Number(x.high),
    low: Number(x.low),
    close: Number(x.close),
    time: x.time,
  };
}

/* ---------------- PATTERNS ---------------- */

function body(c: Candle) {
  return Math.abs(c.close - c.open);
}
function range(c: Candle) {
  return Math.max(1e-9, c.high - c.low);
}
function upperWick(c: Candle) {
  return c.high - Math.max(c.open, c.close);
}
function lowerWick(c: Candle) {
  return Math.min(c.open, c.close) - c.low;
}
function isBull(c: Candle) {
  return c.close > c.open;
}
function isBear(c: Candle) {
  return c.close < c.open;
}

function isHammer(c: Candle) {
  const r = range(c);
  const b = body(c);
  const uw = upperWick(c);
  const lw = lowerWick(c);

  const smallBody = b <= r * 0.35;
  const longLower = lw >= b * 2.0;
  const smallUpper = uw <= r * 0.2;

  return smallBody && longLower && smallUpper;
}
function isHangingMan(c: Candle) {
  return isHammer(c);
}

function isMarubozuBull(c: Candle) {
  const r = range(c);
  const b = body(c);
  const uw = upperWick(c);
  const lw = lowerWick(c);
  return isBull(c) && b >= r * 0.8 && uw <= r * 0.05 && lw <= r * 0.05;
}
function isMarubozuBear(c: Candle) {
  const r = range(c);
  const b = body(c);
  const uw = upperWick(c);
  const lw = lowerWick(c);
  return isBear(c) && b >= r * 0.8 && uw <= r * 0.05 && lw <= r * 0.05;
}

function breaksHigh(c: Candle, h: number) {
  return c.high > h;
}
function breaksLow(c: Candle, l: number) {
  return c.low < l;
}

/* ---------------- SIGNAL / LEVELS ---------------- */

function rr(entry: number, sl: number, tp: number) {
  const risk = Math.abs(entry - sl);
  const reward = Math.abs(tp - entry);
  return risk > 0 ? reward / risk : 0;
}

function roundToTick(x: number, tick: number) {
  if (!tick || tick <= 0) return x;
  return Math.round(x / tick) * tick;
}

function makeZone(price: number, tickSize: number, zoneTicks: number, label: Zone["label"]): Zone {
  const half = Math.max(1, zoneTicks) * tickSize;
  const from = roundToTick(price - half, tickSize);
  const to = roundToTick(price + half, tickSize);
  return { label, from: Math.min(from, to), to: Math.max(from, to) };
}

function tryBuildSignal(params: {
  candles: Candle[];
  trend: TrendDir;
  liquidityPct: number;
  tickSize: number;
  slBufferTicks: number;
  zoneTicks: number;
}): { ready: boolean; side?: "BUY" | "SELL"; levels?: Levels } {
  const { candles, trend, liquidityPct, tickSize, slBufferTicks, zoneTicks } = params;

  const ready = liquidityPct >= 70 && (trend === "UP" || trend === "DOWN");
  if (!ready) return { ready: false };
  if (candles.length < 6) return { ready: true };

  const baseIdx = candles.length - 5;
  const base = candles[baseIdx];
  const c1 = candles[baseIdx + 1];
  const c2 = candles[baseIdx + 2];
  const c3 = candles[baseIdx + 3];
  const c4 = candles[baseIdx + 4];

  const buffer = slBufferTicks * tickSize;

  // BUY
  if (trend === "UP") {
    if (!isHammer(base)) return { ready: true };

    const baseHigh = base.high;
    const baseLow = base.low;

    const breakout =
      (isMarubozuBull(c1) && breaksHigh(c1, baseHigh)) ? c1 :
      (isMarubozuBull(c2) && breaksHigh(c2, baseHigh)) ? c2 :
      (isMarubozuBull(c3) && breaksHigh(c3, baseHigh)) ? c3 :
      (isBull(c1) && breaksHigh(c1, baseHigh)) ? c1 :
      (isBull(c2) && breaksHigh(c2, baseHigh)) ? c2 :
      (isBull(c3) && breaksHigh(c3, baseHigh)) ? c3 :
      (isBull(c4) && breaksHigh(c4, baseHigh)) ? c4 :
      null;

    if (!breakout) return { ready: true };

    const entry = roundToTick(baseHigh + tickSize, tickSize);
    const sl = roundToTick(baseLow - buffer, tickSize);

    const risk = Math.abs(entry - sl);
    if (risk <= 0) return { ready: true };

    const tp1 = roundToTick(entry + risk * 1, tickSize);
    const tp2 = roundToTick(entry + risk * 2, tickSize);
    const tp3 = roundToTick(entry + risk * 3, tickSize);

    const zones: Zone[] = [
      makeZone(entry, tickSize, zoneTicks, "ENTRY"),
      makeZone(tp1, tickSize, zoneTicks, "TP1"),
      makeZone(tp2, tickSize, zoneTicks, "TP2"),
      makeZone(tp3, tickSize, zoneTicks, "TP3"),
      makeZone(sl, tickSize, zoneTicks, "SL"),
    ];

    return {
      ready: true,
      side: "BUY",
      levels: {
        entry,
        sl,
        tps: [tp1, tp2, tp3],
        rr: rr(entry, sl, tp3),
        zones,
        highlightTime: (base.time as any) ?? null,
      },
    };
  }

  // SELL
  if (trend === "DOWN") {
    if (!isHangingMan(base)) return { ready: true };

    const baseHigh = base.high;
    const baseLow = base.low;

    const breakout =
      (isMarubozuBear(c1) && breaksLow(c1, baseLow)) ? c1 :
      (isMarubozuBear(c2) && breaksLow(c2, baseLow)) ? c2 :
      (isMarubozuBear(c3) && breaksLow(c3, baseLow)) ? c3 :
      (isBear(c1) && breaksLow(c1, baseLow)) ? c1 :
      (isBear(c2) && breaksLow(c2, baseLow)) ? c2 :
      (isBear(c3) && breaksLow(c3, baseLow)) ? c3 :
      (isBear(c4) && breaksLow(c4, baseLow)) ? c4 :
      null;

    if (!breakout) return { ready: true };

    const entry = roundToTick(baseLow - tickSize, tickSize);
    const sl = roundToTick(baseHigh + buffer, tickSize);

    const risk = Math.abs(entry - sl);
    if (risk <= 0) return { ready: true };

    const tp1 = roundToTick(entry - risk * 1, tickSize);
    const tp2 = roundToTick(entry - risk * 2, tickSize);
    const tp3 = roundToTick(entry - risk * 3, tickSize);

    const zones: Zone[] = [
      makeZone(entry, tickSize, zoneTicks, "ENTRY"),
      makeZone(tp1, tickSize, zoneTicks, "TP1"),
      makeZone(tp2, tickSize, zoneTicks, "TP2"),
      makeZone(tp3, tickSize, zoneTicks, "TP3"),
      makeZone(sl, tickSize, zoneTicks, "SL"),
    ];

    return {
      ready: true,
      side: "SELL",
      levels: {
        entry,
        sl,
        tps: [tp1, tp2, tp3],
        rr: rr(entry, sl, tp3),
        zones,
        highlightTime: (base.time as any) ?? null,
      },
    };
  }

  return { ready: true };
}

/* ---------------- CLOSED CANDLE HELPERS ---------------- */

function normTime(t: any): number {
  if (typeof t === "number") return t;
  if (t == null) return 0;
  const n = Number(t);
  return Number.isFinite(n) ? n : 0;
}

/**
 * JeÅ›li liveCandle aktualizuje tÄ™ samÄ… Å›wiecÄ™ co ostatnia w candles,
 * to ta ostatnia NIE jest zamkniÄ™ta -> bierzemy candles[length-2].
 */
function getLastClosedCandle(candles: Candle[], liveCandle?: CandlestickData | Candle | null): Candle | null {
  if (!candles.length) return null;
  const last = candles[candles.length - 1];
  if (!liveCandle) return last;

  const liveT = normTime((liveCandle as any).time);
  const lastT = normTime((last as any).time);

  if (liveT && lastT && liveT === lastT) {
    return candles.length >= 2 ? candles[candles.length - 2] : null;
  }
  return last;
}

/** dotkniÄ™cie entry (wick lub body) */
function isEntryTouched(c: Candle | null, entry: number) {
  if (!c) return false;
  const lo = Math.min(c.low, c.high);
  const hi = Math.max(c.low, c.high);
  return entry >= lo && entry <= hi;
}

/* ---------------- COMPONENT ---------------- */

export default function ScannerChart({
  symbol,
  tf,
  candles,
  liveCandle = null,
  liquidityPct,
  trend,
  tickSize = 0.5,
  zoneTicks = 20,
  slBufferTicks = 2,
}: Props) {
  // pending = wykryte levele, ale jeszcze NIE zamroÅ¼one
  const [armed, setArmed] = React.useState(false);
  const [pending, setPending] = React.useState<{ side?: "BUY" | "SELL"; levels?: Levels } | null>(null);

  // frozen = zamroÅ¼one levele po speÅ‚nieniu warunku na ZAMKNIÄ˜TEJ Å›wiecy
  const [frozen, setFrozen] = React.useState<{ ready: boolean; side?: "BUY" | "SELL"; levels?: Levels }>({ ready: false });

  // HA / RENKO UI state
  const [heikinAshi, setHeikinAshi] = React.useState(false);
  const [renko, setRenko] = React.useState(false);
  const [renkoBoxSize, setRenkoBoxSize] = React.useState<number | undefined>(undefined);

  // 1) wykryj setup -> ustaw pending (ale nie zamraÅ¼aj)
  React.useEffect(() => {
    const safe = (candles ?? []).map(toCandle);

    const res = tryBuildSignal({
      candles: safe,
      trend,
      liquidityPct,
      tickSize,
      slBufferTicks,
      zoneTicks,
    });

    if (!res.ready) {
      setArmed(false);
      setPending(null);
      setFrozen({ ready: false });
      return;
    }

    // jeÅ›li juÅ¼ zamroÅ¼one â€” nie zmieniaj
    if (frozen.levels) {
      setFrozen((p) => ({ ...p, ready: true }));
      return;
    }

    // ready bez levels (setup jeszcze nie ma) -> tylko READY
    if (!res.levels) {
      setFrozen((p) => ({ ...p, ready: true }));
      setArmed(false);
      setPending(null);
      return;
    }

    // mamy levels => uzbrÃ³j (pending) i czekaj na ZAMKNIÄ˜TÄ„ Å›wiecÄ™ dotykajÄ…cÄ… entry
    setFrozen({ ready: true });
    setArmed(true);
    setPending({ side: res.side, levels: res.levels });
  }, [candles, trend, liquidityPct, tickSize, slBufferTicks, zoneTicks, frozen.levels]);

  // 2) zamroÅº dopiero gdy ZAMKNIÄ˜TA Å›wieca dotknie entry
  React.useEffect(() => {
    if (!armed) return;
    if (frozen.levels) return;
    if (!pending?.levels) return;

    const safe = (candles ?? []).map(toCandle);
    const lastClosed = getLastClosedCandle(safe, liveCandle);

    if (isEntryTouched(lastClosed, pending.levels.entry)) {
      setFrozen({ ready: true, side: pending.side, levels: pending.levels });
      setArmed(false);
      setPending(null);
    }
  }, [armed, frozen.levels, pending, candles, liveCandle]);

  const ready = frozen.ready;

  // âœ… pokaÅ¼ levele nawet jak jeszcze nie zamroÅ¼one (pending)
  const levelsToShow = frozen.levels ?? pending?.levels ?? null;
  const hasLevelsToShow = !!levelsToShow;

  const lampClass =
    ready && trend === "UP" ? "bg-green-500" : ready && trend === "DOWN" ? "bg-red-500" : "bg-zinc-500";

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0B1220] overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-sm font-semibold text-slate-100">
            {symbol} {tf ? <span className="text-slate-300/70">â€¢ {tf}</span> : null}
          </div>

          <div className="flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full ${lampClass}`} title={`Trend: ${trend}`} />
            <div className={`text-xs font-semibold ${ready ? "text-white" : "text-white/50"}`}>
              {ready ? "READY" : "NOT READY"}
            </div>
          </div>

          <div className="text-xs text-white/60">
            Liquidity: <span className="text-white/80">{Math.round(liquidityPct)}%</span>
          </div>

          {/* RENKO */}
          <button
            type="button"
            onClick={() => {
              setRenko((v) => {
                const next = !v;
                if (next) setHeikinAshi(false);
                return next;
              });
            }}
            className={`ml-1 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
              renko
                ? "border-teal-400/30 bg-teal-500/15 text-teal-100"
                : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            }`}
            title="Renko"
          >
            <span className={`h-2 w-2 rounded-full ${renko ? "bg-teal-300" : "bg-zinc-500"}`} />
            RENKO
          </button>

          {renko ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-white/50">Box</span>
              <input
                className="h-7 w-24 rounded-lg border border-white/10 bg-black/20 px-2 text-xs text-white outline-none"
                placeholder="auto"
                value={renkoBoxSize ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  const n = v === "" ? undefined : Number(v);
                  setRenkoBoxSize(Number.isFinite(n as number) ? n : undefined);
                }}
              />
            </div>
          ) : null}

          {/* HA */}
          <button
            type="button"
            onClick={() => {
              setHeikinAshi((v) => {
                const next = !v;
                if (next) setRenko(false);
                return next;
              });
            }}
            className={`ml-1 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
              heikinAshi
                ? "border-amber-400/30 bg-amber-500/15 text-amber-100"
                : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            }`}
            title="Heikin Ashi"
          >
            <span className={`h-2 w-2 rounded-full ${heikinAshi ? "bg-amber-300" : "bg-zinc-500"}`} />
            HA
          </button>
        </div>

        <div className="text-xs text-white/70">
          {hasLevelsToShow ? (
            <>
              <span className="text-white font-semibold">{frozen.side ?? pending?.side ?? "â€”"}</span>
              <span className="text-white/50"> â€¢ </span>
              RR <span className="text-white">{levelsToShow!.rr.toFixed(2)}</span>
              <span className="text-white/30"> â€¢ </span>
              <span className="text-white/60">Zones: Â±{zoneTicks} ticks</span>
            </>
          ) : (
            <span className="text-white/40">â€”</span>
          )}
        </div>
      </div>

      <div className="p-3">
        <MarketChart
          symbol={symbol}
          tf={tf}
          candles={candles as any}
          liveCandle={liveCandle as any}
          heikinAshi={heikinAshi}
          renko={renko}
          renkoBoxSize={renkoBoxSize}
          showTradeLines={hasLevelsToShow}
          levels={levelsToShow as any}
          highlightTime={levelsToShow?.highlightTime ?? null}
        />
      </div>
    </div>
  );
}
