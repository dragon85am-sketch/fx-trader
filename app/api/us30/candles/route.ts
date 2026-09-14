import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ALLOWED = new Set(["1min", "5min", "15min", "1h", "4h"]);

type MarketCandleRow = {
  symbol: string;
  interval: string;
  bucket: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  ticks: number;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const interval = searchParams.get("interval") || "1min";

    const rawLimit = Number(searchParams.get("limit") || "220");
    const limit = Math.min(
      Math.max(Number.isFinite(rawLimit) ? rawLimit : 220, 1),
      2000
    );

    if (!ALLOWED.has(interval)) {
      return NextResponse.json(
        {
          status: "error",
          error: `Unsupported interval: ${interval}`,
        },
        { status: 400 }
      );
    }

    const rows = await prisma.$queryRaw<MarketCandleRow[]>`
      SELECT
        "symbol",
        "interval",
        "bucket",
        "open",
        "high",
        "low",
        "close",
        "ticks"
      FROM "MarketCandle"
      WHERE
        "symbol" = 'US30'
        AND "interval" = ${interval}
      ORDER BY "bucket" DESC
      LIMIT ${limit}
    `;

    const values = [...rows]
      .reverse()
      .map((c) => ({
        datetime: new Date(c.bucket)
          .toISOString()
          .replace("T", " ")
          .replace(".000Z", ""),
        open: String(c.open),
        high: String(c.high),
        low: String(c.low),
        close: String(c.close),
        volume: String(c.ticks),
      }));

    return NextResponse.json(
      {
        status: "ok",
        provider: "fx-trade-live-rates-engine",
        symbol: "US30",
        interval,
        count: values.length,
        warmup: values.length < Math.min(limit, 30),
        values,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[US30 CANDLES API]", error);

    return NextResponse.json(
      {
        status: "error",
        error:
          error instanceof Error
            ? error.message
            : "US30 candles API error",
      },
      { status: 500 }
    );
  }
}