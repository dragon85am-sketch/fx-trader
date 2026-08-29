import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const path = searchParams.get("path") ?? "/time_series";
    const symbol = searchParams.get("symbol");
    const interval = searchParams.get("interval");
    const outputsize = searchParams.get("outputsize") ?? "220";
    const format = searchParams.get("format") ?? "JSON";

    const apiKey = process.env.TWELVE_DATA_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "TWELVE_DATA_API_KEY missing in .env.local" },
        { status: 500 }
      );
    }

    if (!symbol || !interval) {
      return Response.json(
        {
          error: "Missing required query params",
          received: { symbol, interval, path, outputsize, format },
        },
        { status: 400 }
      );
    }

    const url =
      `https://api.twelvedata.com${path}` +
      `?symbol=${encodeURIComponent(symbol)}` +
      `&interval=${encodeURIComponent(interval)}` +
      `&outputsize=${encodeURIComponent(outputsize)}` +
      `&format=${encodeURIComponent(format)}` +
      `&apikey=${encodeURIComponent(apiKey)}`;

    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    const data = await res.json();

    return Response.json(data, { status: res.status });
  } catch (err: any) {
    return Response.json(
      { error: err?.message ?? "Unknown Twelve Data proxy error" },
      { status: 500 }
    );
  }
}
