import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getBaseUrl() {
  const env = (process.env.OANDA_ENV || "practice").toLowerCase();
  // practice = demo, live = real
  return env === "live" ? "https://api-fxtrade.oanda.com" : "https://api-fxpractice.oanda.com";
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const instrument = url.searchParams.get("instrument");
    const granularity = url.searchParams.get("granularity");
    const count = url.searchParams.get("count") || "220";

    if (!instrument || !granularity) {
      return NextResponse.json(
        { error: "Missing params: instrument, granularity" },
        { status: 400 }
      );
    }

    const token = process.env.OANDA_API_KEY;
    if (!token) {
      return NextResponse.json({ error: "Missing OANDA_API_KEY in .env.local" }, { status: 500 });
    }

    const baseUrl = getBaseUrl();

    const endpoint = `${baseUrl}/v3/instruments/${encodeURIComponent(
      instrument
    )}/candles?granularity=${encodeURIComponent(granularity)}&count=${encodeURIComponent(count)}&price=M`;

    const r = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const text = await r.text();
    if (!r.ok) {
      return NextResponse.json(
        {
          error: "OANDA request failed",
          status: r.status,
          details: text,
          baseUrl,
          instrument,
          granularity,
        },
        { status: 500 }
      );
    }

    // Oanda zwraca JSON
    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: "Server error", message: e?.message ?? "Unknown" },
      { status: 500 }
    );
  }
}