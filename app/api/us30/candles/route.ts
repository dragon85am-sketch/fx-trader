import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ALLOWED = new Set(["1min", "5min", "15min", "1h", "4h"]);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const interval = searchParams.get("interval") || "1min";
  const limit = Math.min(Math.max(Number(searchParams.get("limit") || 220), 1), 2000);

  if (!ALLOWED.has(interval)) {
    return NextResponse.json(
      { status: "error", error: `Unsupported interval: ${interval}` },
      { status: 400 },
    );
  }

  const rows = await prisma.marketCandle.findMany({
    where: { symbol: "US30", interval },
    orderBy: { bucket: "desc" },
    take: limit,
  });

  const values = rows.reverse().map((c) => ({
    datetime: c.bucket.toISOString().replace("T", " ").replace(".000Z", ""),
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
    { headers: { "Cache-Control": "no-store" } },
  );
}
