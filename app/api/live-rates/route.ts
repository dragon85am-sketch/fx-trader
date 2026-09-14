import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LiveRateRaw = {
  currency?: string;
  rate?: string | number;
  bid?: string | number;
  ask?: string | number;
  high?: string | number;
  low?: string | number;
  open?: string | number;
  close?: string | number;
  timestamp?: string | number;
  error?: string;
};

function toNumber(value: unknown): number | null {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    value === "n/a"
  ) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeSymbol(symbol: string) {
  return symbol
    .trim()
    .toUpperCase()
    .replace(/\//g, "")
    .replace(/_/g, "")
    .replace(/[^A-Z0-9]/g, "");
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.LIVE_RATES_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "Brak LIVE_RATES_API_KEY w zmiennych środowiskowych.",
        },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);

    const requestedSymbol = searchParams.get("symbol");

    if (!requestedSymbol) {
      return NextResponse.json(
        {
          ok: false,
          error: "Podaj symbol, np. ?symbol=US30",
        },
        { status: 400 }
      );
    }

    const symbol = normalizeSymbol(requestedSymbol);

    const upstreamUrl =
      `https://www.live-rates.com/api/price` +
      `?key=${encodeURIComponent(apiKey)}` +
      `&rate=${encodeURIComponent(symbol)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let response: Response;

    try {
      response = await fetch(upstreamUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          provider: "live-rates",
          symbol,
          error: `Live-Rates HTTP ${response.status}`,
          details: text.slice(0, 500),
        },
        { status: response.status }
      );
    }

    let payload: LiveRateRaw[] | LiveRateRaw;

    try {
      payload = JSON.parse(text);
    } catch {
      return NextResponse.json(
        {
          ok: false,
          provider: "live-rates",
          symbol,
          error: "Live-Rates zwrócił niepoprawny JSON.",
          details: text.slice(0, 500),
        },
        { status: 502 }
      );
    }

    const row: LiveRateRaw | undefined = Array.isArray(payload)
      ? payload[0]
      : payload;

    if (!row) {
      return NextResponse.json(
        {
          ok: false,
          provider: "live-rates",
          symbol,
          error: "Brak danych dla instrumentu.",
        },
        { status: 404 }
      );
    }

    if (row.error) {
      return NextResponse.json(
        {
          ok: false,
          provider: "live-rates",
          symbol,
          error: row.error,
        },
        { status: 502 }
      );
    }

    const bid = toNumber(row.bid);
    const ask = toNumber(row.ask);
    const rate = toNumber(row.rate) ?? bid;

    if (bid === null && ask === null && rate === null) {
      return NextResponse.json(
        {
          ok: false,
          provider: "live-rates",
          symbol,
          error: "Provider nie zwrócił ceny dla tego instrumentu.",
          rawCurrency: row.currency ?? null,
        },
        { status: 502 }
      );
    }

    const timestamp = toNumber(row.timestamp);

    return NextResponse.json(
      {
        ok: true,
        provider: "live-rates",
        data: {
          symbol,
          currency: row.currency ?? symbol,
          rate,
          bid,
          ask,
          high: toNumber(row.high),
          low: toNumber(row.low),
          open: toNumber(row.open),
          close: toNumber(row.close),
          timestamp,
          updatedAt: timestamp ?? Date.now(),
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("LIVE-RATES ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        provider: "live-rates",
        error:
          error instanceof Error
            ? error.message
            : "Nieznany błąd Live-Rates.",
      },
      { status: 500 }
    );
  }
}