import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeMarketSymbol } from "@/lib/market/master-symbols";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ALLOWED = new Set(["1min", "5min", "15min", "30min", "1h", "4h", "1day"]);
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

async function readCandles(symbol: string, interval: string, limit: number) {
  const rows = await prisma.$queryRaw<Row[]>`
    SELECT "bucket","open","high","low","close","ticks"
    FROM "MarketCandle"
    WHERE "symbol"=${symbol} AND "interval"=${interval}
    ORDER BY "bucket" DESC
    LIMIT ${limit}
  `;
  return serializeRows(rows);
}

async function readCandlesBatch(symbols: string[], interval: string, limit: number) {
  // V4: ONE PostgreSQL round-trip for the complete Market Watch.
  // row_number() keeps the requested per-symbol limit without 31 Promise.all queries.
  const rows = await prisma.$queryRaw<Row[]>(Prisma.sql`
    SELECT "symbol","bucket","open","high","low","close","ticks"
    FROM (
      SELECT
        "symbol","bucket","open","high","low","close","ticks",
        ROW_NUMBER() OVER (PARTITION BY "symbol" ORDER BY "bucket" DESC) AS rn
      FROM "MarketCandle"
      WHERE "symbol" IN (${Prisma.join(symbols)})
        AND "interval"=${interval}
    ) ranked
    WHERE rn <= ${limit}
    ORDER BY "symbol" ASC, "bucket" DESC
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
      return [symbol, { count: values.length, warmup: values.length < 60, values }];
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

    const values = await readCandles(symbol, interval, limit);
    return NextResponse.json(
      { status: "ok", symbol, interval, count: values.length, warmup: values.length < 60, values },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: error instanceof Error ? error.message : "Market candle engine error" },
      { status: 500 }
    );
  }
}
