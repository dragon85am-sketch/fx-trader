import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeMarketSymbol } from "@/lib/market/master-symbols";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ALLOWED = new Set(["1min", "5min", "15min", "30min", "1h", "4h", "1day"]);
const INTERVAL_MS: Record<string, number> = {
  "1min": 60_000, "5min": 300_000, "15min": 900_000,
  "30min": 1_800_000, "1h": 3_600_000, "4h": 14_400_000,
  "1day": 86_400_000,
};

// Required UTC cutoff: never expose candles from the pre-reset history.
// Configure OHLC_HISTORY_START_AT in the web application's environment.
function historyStart(): Date {
  const raw = process.env.OHLC_HISTORY_START_AT;
  if (!raw || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(raw)) {
    throw new Error("OHLC_HISTORY_START_AT must be a UTC ISO timestamp, e.g. 2026-11-06T22:00:00Z");
  }
  const date = new Date(raw);
  if (!Number.isFinite(date.getTime())) throw new Error("Invalid OHLC_HISTORY_START_AT");
  return date;
}

type CandleHealth = {
  latestBucket: string | null;
  ageSeconds: number | null;
  stale: boolean;
  gaps: number;
  missingBuckets: number;
  gapsSample: Array<{ from: string; to: string; missing: number }>;
};

// Diagnostic only: never synthesize candles. Weekend/session breaks are
// excluded from intraday gap counts when either endpoint is outside FX hours.
function diagnose(rows: Row[], interval: string, now = Date.now()): CandleHealth {
  const sorted = [...rows].sort((a, b) => +new Date(a.bucket) - +new Date(b.bucket));
  const step = INTERVAL_MS[interval];
  const latest = sorted[sorted.length - 1];
  const latestMs = latest ? +new Date(latest.bucket) : NaN;
  const ageSeconds = Number.isFinite(latestMs) ? Math.max(0, Math.floor((now - latestMs) / 1000)) : null;
  const stale = ageSeconds === null || ageSeconds > (interval === "1day" ? 4 * 86_400 : Math.max(3 * step / 1000, 900));
  let gaps = 0;
  let missingBuckets = 0;
  const gapsSample: CandleHealth["gapsSample"] = [];
  const fxOpen = (ms: number) => {
    const d = new Date(ms);
    const day = d.getUTCDay();
    return day !== 0 && day !== 6;
  };
  for (let i = 1; i < sorted.length; i++) {
    const prev = +new Date(sorted[i - 1].bucket);
    const curr = +new Date(sorted[i].bucket);
    const delta = curr - prev;
    if (!Number.isFinite(delta) || delta <= step * 1.5) continue;
    // Avoid false alarms across weekend/market closure. Other gaps remain
    // diagnostic candidates, not proof of data loss.
    if (interval !== "1day" && (!fxOpen(prev) || !fxOpen(curr) || delta >= 48 * 3_600_000)) continue;
    if (interval === "1day" && delta >= 72 * 3_600_000) continue;
    const missing = Math.max(0, Math.round(delta / step) - 1);
    if (!missing) continue;
    gaps++;
    missingBuckets += missing;
    if (gapsSample.length < 10) gapsSample.push({ from: new Date(prev).toISOString(), to: new Date(curr).toISOString(), missing });
  }
  return { latestBucket: Number.isFinite(latestMs) ? new Date(latestMs).toISOString() : null,
    ageSeconds, stale, gaps, missingBuckets, gapsSample };
}

type Row = { symbol?: string; bucket: Date; open: number | string; high: number | string; low: number | string; close: number | string; ticks: number };

function serializeRows(rows: Row[]) {
  return rows.slice().reverse().map((r) => ({
    datetime: new Date(r.bucket).toISOString().replace("T", " ").slice(0, 19),
    open: String(r.open),
    high: String(r.high),
    low: String(r.low),
    close: String(r.close),
    volume: String(r.ticks ?? 0),
  }));
}

// Bridge the durable SQL backlog into the single-symbol chart response.
// Never fabricate missing minutes and never add queue volume to DB volume:
// overlapping DB buckets are left intact until a fully ledger-aware merge exists.
type CandleValue = { datetime: string; open: string; high: string; low: string; close: string; volume: string };
type OverlaySource = { status: "ok" | "empty" | "error" | "disabled"; count: number; latestBucket: string | null; error?: string; durationMs?: number; attempts?: number };
type OverlayResult = { values: CandleValue[]; sources: { postgres: OverlaySource; durable: OverlaySource; live: OverlaySource } };

function bucketMs(datetime: string): number {
  const normalized = datetime.trim().replace(" ", "T");
  return Date.parse(/(?:Z|[+-]\d\d:\d\d)$/.test(normalized) ? normalized : `${normalized}Z`);
}
function latestDatetime(values: CandleValue[]): string | null {
  let latest = -Infinity;
  for (const value of values) {
    const ms = bucketMs(value.datetime);
    if (Number.isFinite(ms) && ms > latest) latest = ms;
  }
  return Number.isFinite(latest) ? new Date(latest).toISOString() : null;
}
function healthFromValues(values: CandleValue[], interval: string): CandleHealth {
  const rows: Row[] = values.flatMap((v) => {
    const ms = bucketMs(v.datetime);
    return Number.isFinite(ms) ? [{ bucket: new Date(ms), open: v.open, high: v.high, low: v.low, close: v.close, ticks: Number(v.volume) || 0 }] : [];
  });
  return diagnose(rows, interval);
}

// PostgreSQL is the authoritative source for overlapping buckets. Queue/live
// can add real buckets, but must never invent prices or override persisted OHLC.
async function overlayLive(symbol: string, interval: string, values: CandleValue[], limit: number, start: Date): Promise<OverlayResult> {
  const sources: OverlayResult["sources"] = {
    postgres: { status: values.length ? "ok" : "empty", count: values.length, latestBucket: latestDatetime(values) },
    durable: { status: "disabled", count: 0, latestBucket: null },
    live: { status: "disabled", count: 0, latestBucket: null },
  };
  const merged = new Map(values.map((v) => [v.datetime, v]));
  const base = process.env.OHLC_LIVE_COLLECTOR_URL;
  if (!base) return { values, sources };
  const headers: Record<string, string> = {};
  if (process.env.OHLC_LIVE_READ_TOKEN) headers["x-ohlc-live-token"] = process.env.OHLC_LIVE_READ_TOKEN;
  const fetchCollector = async (path: string) => {
    const url = new URL(path, base);
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("interval", interval);
    if (path.endsWith("durable-candles")) url.searchParams.set("limit", String(limit));
    // Retry only the durable history request. LIVE is time-sensitive and is not retried.
    const maxAttempts = path.endsWith("durable-candles") ? 2 : 1;
    const started = Date.now();
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(url, {
          headers,
          cache: "no-store",
          signal: AbortSignal.timeout(6500),
        });
        if (!response.ok) throw new Error(`collector HTTP ${response.status}`);
        const data = await response.json() as { connected?: boolean; candle?: CandleValue | null; values?: CandleValue[] };
        return { data, durationMs: Date.now() - started, attempts: attempt };
      } catch (error) {
        lastError = error;
        // Do not retry an explicit HTTP failure (e.g. invalid token / 401).
        if (error instanceof Error && error.message.startsWith("collector HTTP ")) break;
      }
    }
    throw new Error(`collector failed after ${Date.now() - started}ms (${maxAttempts} max attempts): ${lastError instanceof Error ? lastError.message : String(lastError)}`);
  };
  try {
    const { data, durationMs, attempts } = await fetchCollector("/api/market/durable-candles");
    const accepted: CandleValue[] = [];
    for (const candle of data.values || []) {
      const time = bucketMs(candle.datetime);
      if (Number.isFinite(time) && time >= start.getTime() && time <= Date.now() + 60_000) {
        accepted.push(candle);
        if (!merged.has(candle.datetime)) merged.set(candle.datetime, candle);
      }
    }
    sources.durable = { status: accepted.length ? "ok" : "empty", count: accepted.length, latestBucket: latestDatetime(accepted), durationMs, attempts };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    sources.durable = { status: "error", count: 0, latestBucket: null, error: message };
    console.warn("[market/candles] durable collector overlay unavailable", message);
  }
  try {
    const { data, durationMs, attempts } = await fetchCollector("/api/market/live-candles");
    const candle = data.connected ? data.candle : null;
    const time = candle ? bucketMs(candle.datetime) : NaN;
    const frame = INTERVAL_MS[interval];
    if (candle && Number.isFinite(time) && time >= start.getTime() && time === Math.floor(Date.now() / frame) * frame) {
      if (!merged.has(candle.datetime)) merged.set(candle.datetime, candle);
      sources.live = { status: "ok", count: 1, latestBucket: latestDatetime([candle]), durationMs, attempts };
    } else {
      sources.live = { status: "empty", count: 0, latestBucket: null, durationMs, attempts };
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    sources.live = { status: "error", count: 0, latestBucket: null, error: message };
    console.warn("[market/candles] live collector overlay unavailable", message);
  }
  return { values: [...merged.values()].sort((a, b) => a.datetime.localeCompare(b.datetime)).slice(-limit), sources };
}

async function readCandles(symbol: string, interval: string, limit: number, start: Date) {
  const rows = await prisma.$queryRaw<Row[]>`
    SELECT "bucket","open","high","low","close","ticks"
    FROM "MarketCandle"
    WHERE "symbol"=${symbol} AND "interval"=${interval} AND "bucket" >= ${start}
    ORDER BY "bucket" DESC
    LIMIT ${limit}
  `;
  return { rows, values: serializeRows(rows) };
}

async function readCandlesBatch(symbols: string[], interval: string, limit: number, start: Date) {
  // One query, bounded index-friendly lookup per requested symbol.
  // Requires an efficient index on (symbol, interval, bucket DESC).
  const rows = await prisma.$queryRaw<Row[]>(Prisma.sql`
    SELECT c."symbol", c."bucket", c."open", c."high", c."low", c."close", c."ticks"
    FROM unnest(ARRAY[${Prisma.join(symbols)}]::text[]) AS requested("symbol")
    CROSS JOIN LATERAL (
      SELECT mc."symbol", mc."bucket", mc."open", mc."high", mc."low", mc."close", mc."ticks"
      FROM "MarketCandle" AS mc
      WHERE mc."symbol" = requested."symbol" AND mc."interval" = ${interval} AND mc."bucket" >= ${start}
      ORDER BY mc."bucket" DESC
      LIMIT ${limit}
    ) AS c
    ORDER BY c."symbol" ASC, c."bucket" DESC
  `);

  const grouped = new Map<string, Row[]>();
  for (const symbol of symbols) grouped.set(symbol, []);
  for (const row of rows) {
    const symbol = normalizeMarketSymbol(String(row.symbol || ""));
    const list = grouped.get(symbol);
    if (list) list.push(row);
  }

  return Object.fromEntries(
    symbols.map((symbol) => {
      const values = serializeRows(grouped.get(symbol) || []);
      return [symbol, { count: values.length, warmup: values.length < 60, health: diagnose(grouped.get(symbol) || [], interval), values }];
    })
  );
}

export async function GET(req: NextRequest) {
  try {
    const start = historyStart();
    const interval = req.nextUrl.searchParams.get("interval") || "1min";
    const requested = Number(req.nextUrl.searchParams.get("limit") || "300");
    const limit = Math.max(1, Math.min(2000, Number.isFinite(requested) ? requested : 300));

    if (!ALLOWED.has(interval)) {
      return NextResponse.json({ status: "error", message: `Unsupported interval: ${interval}` }, { status: 400 });
    }

    const symbolsParam = req.nextUrl.searchParams.get("symbols");
    if (symbolsParam) {
      const symbols = [...new Set(
        symbolsParam
          .split(",")
          .map((s) => normalizeMarketSymbol(s.trim()))
          .filter(Boolean)
      )].slice(0, 50);

      if (!symbols.length) {
        return NextResponse.json({ status: "error", message: "Missing symbols" }, { status: 400 });
      }

      const symbolData = await readCandlesBatch(symbols, interval, limit, start);
      return NextResponse.json(
        { status: "ok", interval, historyStartAt: start.toISOString(), symbols: symbolData },
        { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
      );
    }

    const symbol = normalizeMarketSymbol(req.nextUrl.searchParams.get("symbol") || "");
    if (!symbol) {
      return NextResponse.json({ status: "error", message: "Missing symbol" }, { status: 400 });
    }

    const { rows, values } = await readCandles(symbol, interval, limit, start);
    const overlay = await overlayLive(symbol, interval, values, limit, start);
    const health = healthFromValues(overlay.values, interval);
    const fallbackToStalePostgres = health.stale && overlay.sources.postgres.status === "ok" && overlay.sources.durable.status !== "ok";
    return NextResponse.json(
      { status: "ok", symbol, interval, historyStartAt: start.toISOString(), count: overlay.values.length, warmup: overlay.values.length < 60, health, fallbackToStalePostgres, sources: overlay.sources, dbHealth: diagnose(rows, interval), values: overlay.values },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: error instanceof Error ? error.message : "Market candle engine error" },
      { status: 500 }
    );
  }
}
