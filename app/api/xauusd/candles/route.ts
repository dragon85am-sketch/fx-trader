import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ALLOWED_INTERVALS = new Set(["1min", "5min", "15min", "1h", "4h"]);

type CandleRow = {
  bucket: Date;
  open: unknown;
  high: unknown;
  low: unknown;
  close: unknown;
  ticks: number;
};

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const interval = searchParams.get("interval") || "1min";
    const requestedLimit = Number(searchParams.get("limit") || "300");
    const limit = Math.max(1, Math.min(2000, Number.isFinite(requestedLimit) ? requestedLimit : 300));

    if (!ALLOWED_INTERVALS.has(interval)) {
      return NextResponse.json(
        { status: "error", error: `Unsupported interval: ${interval}` },
        { status: 400 },
      );
    }

    const rows = await prisma.$queryRaw<CandleRow[]>`
      SELECT "bucket", "open", "high", "low", "close", "ticks"
      FROM "MarketCandle"
      WHERE "symbol" = 'XAUUSD'
        AND "interval" = ${interval}
      ORDER BY "bucket" DESC
      LIMIT ${limit}
    `;

    const values = rows
      .reverse()
      .map((row) => ({
        datetime: new Date(row.bucket)
          .toISOString()
          .replace("T", " ")
          .replace(".000Z", ""),
        open: String(row.open),
        high: String(row.high),
        low: String(row.low),
        close: String(row.close),
        volume: String(row.ticks ?? 0),
      }));

    return NextResponse.json(
      {
        status: "ok",
        symbol: "XAUUSD",
        interval,
        count: values.length,
        warmup: values.length === 0,
        values,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error("[XAUUSD CANDLES]", error);

    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "XAUUSD candle engine error",
      },
      { status: 500 },
    );
  }
}
