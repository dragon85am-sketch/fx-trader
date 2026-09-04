import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const path = searchParams.get("path");
    const symbol = searchParams.get("symbol");
    const resolution = searchParams.get("resolution");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const apiKey = process.env.FINNHUB_API_KEY;

    // ===== VALIDATION =====
    if (!apiKey) {
      return Response.json(
        { error: "FINNHUB_API_KEY missing in .env.local" },
        { status: 500 }
      );
    }

    if (!path || !symbol || !resolution || !from || !to) {
      return Response.json(
        {
          error: "Missing query params",
          received: { path, symbol, resolution, from, to },
        },
        { status: 400 }
      );
    }

    // ===== BUILD URL =====
    const url =
      `https://finnhub.io/api/v1${path}` +
      `?symbol=${encodeURIComponent(symbol)}` +
      `&resolution=${encodeURIComponent(resolution)}` +
      `&from=${encodeURIComponent(from)}` +
      `&to=${encodeURIComponent(to)}` +
      `&token=${encodeURIComponent(apiKey)}`;

    // ===== FETCH =====
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    const data = await res.json();

    // ===== DEBUG (możesz usunąć później) =====
    console.log("FINNHUB RESPONSE:", {
      symbol,
      resolution,
      status: res.status,
      dataSample: Array.isArray(data?.c) ? data.c.slice(0, 3) : data,
    });

    // ===== RETURN =====
    return Response.json(data, { status: res.status });
  } catch (err: any) {
    console.error("FINNHUB ERROR:", err);

    return Response.json(
      {
        error: err?.message ?? "Unknown Finnhub proxy error",
      },
      { status: 500 }
    );
  }
}
