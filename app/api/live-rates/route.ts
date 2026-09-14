import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIVE_RATES_BASE_URL = "https://www.live-rates.com/api";

type LiveRatesRaw = {
  currency?: string;
  rate?: string | number;
  bid?: string | number;
  ask?: string | number;
  high?: string | number;
  low?: string | number;
  open?: string | number;
  close?: string | number;
  timestamp?: string | number;
  [key: string]: unknown;
};

function n(value: unknown): number | null {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function normalizeSymbol(value: string) {
  return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

function normalizeRate(row: LiveRatesRaw) {
  const bid = n(row.bid);
  const ask = n(row.ask);
  const rate = n(row.rate) ?? (bid !== null && ask !== null ? (bid + ask) / 2 : bid ?? ask);

  return {
    symbol: normalizeSymbol(String(row.currency ?? "")),
    currency: String(row.currency ?? ""),
    rate,
    bid,
    ask,
    high: n(row.high),
    low: n(row.low),
    open: n(row.open),
    close: n(row.close),
    timestamp: n(row.timestamp) ?? Date.now(),
  };
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.LIVE_RATES_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { ok: false, message: "Brak LIVE_RATES_API_KEY w .env.local / Vercel Environment Variables." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const requestedSymbol = normalizeSymbol(searchParams.get("symbol") ?? "");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    // Pobieramy całą paczkę raz. Później centralny FX Trade Engine może cache'ować ten wynik.
    const url = new URL(`${LIVE_RATES_BASE_URL}/rates`);
    url.searchParams.set("key", apiKey);

    const upstream = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    const rawText = await upstream.text();
    let payload: unknown;

    try {
      payload = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { ok: false, message: "Live-Rates zwrócił odpowiedź inną niż JSON." },
        { status: 502 }
      );
    }

    if (!upstream.ok) {
      return NextResponse.json(
        { ok: false, message: "Błąd Live-Rates API.", upstreamStatus: upstream.status, details: payload },
        { status: 502 }
      );
    }

    const rows = (Array.isArray(payload) ? payload : [])
      .map((row) => normalizeRate(row as LiveRatesRaw))
      .filter((row) => row.symbol);

    if (requestedSymbol) {
      const item = rows.find((row) => row.symbol === requestedSymbol);
      if (!item) {
        return NextResponse.json(
          { ok: false, message: `Instrument ${requestedSymbol} nie został zwrócony przez Live-Rates.` },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { ok: true, provider: "live-rates", data: item, updatedAt: Date.now() },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    return NextResponse.json(
      { ok: true, provider: "live-rates", count: rows.length, data: rows, updatedAt: Date.now() },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nie udało się połączyć z Live-Rates.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  } finally {
    clearTimeout(timeout);
  }
}
