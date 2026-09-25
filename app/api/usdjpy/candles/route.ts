import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SYMBOL = "USDJPY";
const ALLOWED = new Set(["1min", "5min", "15min", "1h", "4h"]);

type CandleRow = {
  bucket: Date;
  open: number | string;
  high: number | string;
  low: number | string;
  close: number | string;
};

export async function GET(request: NextRequest) {
  try {
    const interval = request.nextUrl.searchParams.get("interval") ?? "1min";
    const requestedLimit = Number(request.nextUrl.searchParams.get("limit") ?? "220");
    const limit = Math.max(
      1,
      Math.min(Number.isFinite(requestedLimit) ? requestedLimit : 220, 2000)
    );

    if (!ALLOWED.has(interval)) {
      return NextResponse.json(
        { status: "error", message: `Unsupported interval: ${interval}` },
        { status: 400 }
      );
    }

    const rows = await prisma.$queryRaw<CandleRow[]>`
      SELECT "bucket", "open", "high", "low", "close"
      FROM "MarketCandle"
      WHERE "symbol" = ${SYMBOL}
        AND "interval" = ${interval}
      ORDER BY "bucket" DESC
      LIMIT ${limit}
    `;

    const values = rows
      .slice()
      .reverse()
      .map((row) => ({
        datetime: new Date(row.bucket).toISOString().replace("T", " ").slice(0, 19),
        open: String(row.open),
        high: String(row.high),
        low: String(row.low),
        close: String(row.close),
        volume: "0",
      }));

    return NextResponse.json(
      {
        status: "ok",
        symbol: SYMBOL,
        interval,
        count: values.length,
        warmup: values.length < 60,
        values,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(`[${SYMBOL} CANDLES]`, error);

    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Candle engine error",
      },
      { status: 500 }
    );
  }
}
