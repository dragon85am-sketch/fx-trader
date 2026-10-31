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

// V4 opt-in live overlay. If collector is down, preserve the existing DB response.
type CandleValue = { datetime: string; open: string; high: string; low: string; close: string; volume: string };
async function overlayLive(symbol: string, interval: string, values: CandleValue[]): Promise<CandleValue[]> {
  const base=process.env.OHLC_LIVE_COLLECTOR_URL;
  if(!base) return values;
  try {
    const url=new URL("/api/market/live-candles",base);
    url.searchParams.set("symbol",symbol);
    url.searchParams.set("interval",interval);
    const headers:Record<string,string>={};
    if(process.env.OHLC_LIVE_READ_TOKEN) headers["x-ohlc-live-token"]=process.env.OHLC_LIVE_READ_TOKEN;
    const response=await fetch(url,{headers,cache:"no-store",signal:AbortSignal.timeout(1500)});
    if(!response.ok) return values;
    const data=await response.json() as {connected?:boolean;candle?:CandleValue|null};
    if(!data.connected||!data.candle) return values;
    const candle=data.candle;
    const t=Date.parse(candle.datetime.replace(" ","T")+"Z");
    const frame=INTERVAL_MS[interval];
    if(!Number.isFinite(t)||t!==Math.floor(Date.now()/frame)*frame) return values;
    const ix=values.findIndex(v=>v.datetime===candle.datetime);
    if(ix>=0){
      // DB may already contain part of the same candle. Do not add volumes
      // or replace its open: those would double-count without an exact merge ledger.
      return values;
    }
    return [...values,candle].sort((a,b)=>a.datetime.localeCompare(b.datetime)).slice(-2000);
  }catch{return values;}
}

async function readCandles(symbol: string, interval: string, limit: number) {
  const rows = await prisma.$queryRaw<Row[]>`
    SELECT "bucket","open","high","low","close","ticks"
    FROM "MarketCandle"
    WHERE "symbol"=${symbol} AND "interval"=${interval}
    ORDER BY "bucket" DESC
    LIMIT ${limit}
  `;
  return { rows, values: serializeRows(rows) };
}

async function readCandlesBatch(symbols: string[], interval: string, limit: number) {
  // One query, bounded index-friendly lookup per requested symbol.
  // Requires an efficient index on (symbol, interval, bucket DESC).
  const rows = await prisma.$queryRaw<Row[]>(Prisma.sql`
    SELECT c."symbol", c."bucket", c."open", c."high", c."low", c."close", c."ticks"
    FROM unnest(ARRAY[${Prisma.join(symbols)}]::text[]) AS requested("symbol")
    CROSS JOIN LATERAL (
      SELECT mc."symbol", mc."bucket", mc."open", mc."high", mc."low", mc."close", mc."ticks"
      FROM "MarketCandle" AS mc
      WHERE mc."symbol" = requested."symbol" AND mc."interval" = ${interval}
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

      const symbolData = await readCandlesBatch(symbols, interval, limit);
      return NextResponse.json(
        { status: "ok", interval, symbols: symbolData },
        { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
      );
    }

    const symbol = normalizeMarketSymbol(req.nextUrl.searchParams.get("symbol") || "");
    if (!symbol) {
      return NextResponse.json({ status: "error", message: "Missing symbol" }, { status: 400 });
    }

    const { rows, values } = await readCandles(symbol, interval, limit);
    const liveValues = await overlayLive(symbol, interval, values);
    return NextResponse.json(
      { status: "ok", symbol, interval, count: liveValues.length, warmup: liveValues.length < 60, health: diagnose(rows, interval), values: liveValues },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: error instanceof Error ? error.message : "Market candle engine error" },
      { status: 500 }
    );
  }
}
