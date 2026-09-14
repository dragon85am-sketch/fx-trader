import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function n(v: unknown): number | null {
  if (v === null || v === undefined || v === "" || v === "n/a") return null;
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
}

export async function GET(req: NextRequest) {
  const key = process.env.LIVE_RATES_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "Missing LIVE_RATES_API_KEY" }, { status: 500 });

  const symbol = (new URL(req.url).searchParams.get("symbol") || "US30")
    .toUpperCase().replace(/[^A-Z0-9]/g, "");

  const upstream = `https://www.live-rates.com/api/price?key=${encodeURIComponent(key)}&rate=${encodeURIComponent(symbol)}`;
  const res = await fetch(upstream, { cache: "no-store", headers: { Accept: "application/json" } });
  const raw = await res.text();
  let payload: any;
  try { payload = JSON.parse(raw); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON from Live-Rates" }, { status: 502 }); }
  const row = Array.isArray(payload) ? payload[0] : payload;
  if (!res.ok || row?.error) return NextResponse.json({ ok: false, error: row?.error || `HTTP ${res.status}` }, { status: 502 });

  return NextResponse.json({
    ok: true,
    provider: "live-rates",
    data: {
      symbol,
      currency: row?.currency ?? symbol,
      rate: n(row?.rate),
      bid: n(row?.bid),
      ask: n(row?.ask),
      high: n(row?.high),
      low: n(row?.low),
      open: n(row?.open),
      close: n(row?.close),
      timestamp: n(row?.timestamp),
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
