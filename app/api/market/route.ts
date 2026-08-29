import { NextResponse } from "next/server";

const SYMBOL_MAP: Record<string, string> = {
  EURUSD: "EUR/USD",
  GBPUSD: "GBP/USD",
  USDJPY: "USD/JPY",
  XAUUSD: "XAU/USD",
  BTCUSD: "BTC/USD",
};

const INTERVAL_MAP: Record<string, string> = {
  "1": "1min",
  "5": "5min",
  "15": "15min",
  "60": "1h",
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const symbolParam = searchParams.get("symbol") ?? "EURUSD";
    const intervalParam = searchParams.get("interval") ?? "5";
    const outputsize = searchParams.get("outputsize") ?? "100";

    const symbol = SYMBOL_MAP[symbolParam] ?? "EUR/USD";
    const interval = INTERVAL_MAP[intervalParam] ?? "5min";
    const apiKey = process.env.TWELVE_DATA_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing TWELVE_DATA_API_KEY in .env.local" },
        { status: 500 },
      );
    }

    const url = new URL("https://api.twelvedata.com/time_series");
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("interval", interval);
    url.searchParams.set("outputsize", outputsize);
    url.searchParams.set("format", "JSON");
    url.searchParams.set("apikey", apiKey);

    const res = await fetch(url.toString(), {
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok || data.status === "error") {
      return NextResponse.json(
        { error: data.message ?? "Failed to fetch market data" },
        { status: 500 },
      );
    }

    const values = Array.isArray(data.values) ? data.values : [];

    const candles = values
      .map((item: Record<string, string>) => ({
        datetime: item.datetime,
        open: Number(item.open),
        high: Number(item.high),
        low: Number(item.low),
        close: Number(item.close),
      }))
      .filter(
        (c: { open: number; high: number; low: number; close: number }) =>
          Number.isFinite(c.open) &&
          Number.isFinite(c.high) &&
          Number.isFinite(c.low) &&
          Number.isFinite(c.close),
      )
      .reverse();

    return NextResponse.json({
      symbol: symbolParam,
      interval: intervalParam,
      candles,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 },
    );
  }
}

