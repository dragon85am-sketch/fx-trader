import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_INTERVALS = new Set(["1min", "5min", "15min", "30min", "1h", "4h", "1day"]);
const ALLOWED_SYMBOLS = new Set([
  "XAU/USD",
  "EUR/USD",
  "GBP/USD",
  "GBP/CHF",
  "USD/JPY",
  "USD/CAD",
  "AUD/USD",
  "EUR/GBP",
  "DJI",
  "BTC/USD",
  "ETH/USD",
  "SOL/USD",
]);

type CacheEntry = { data: unknown; expiresAt: number };
const globalForTwelve = globalThis as typeof globalThis & { fxTwelveCache?: Map<string, CacheEntry>; fxTwelveInflight?: Map<string, Promise<unknown>> };
const cache = globalForTwelve.fxTwelveCache ?? new Map<string, CacheEntry>();
const inflight = globalForTwelve.fxTwelveInflight ?? new Map<string, Promise<unknown>>();
if (process.env.NODE_ENV !== "production") { globalForTwelve.fxTwelveCache = cache; globalForTwelve.fxTwelveInflight = inflight; }

function ttl(interval: string) {
  if (interval === "1min") return 45_000;
  if (interval === "5min") return 90_000;
  if (interval === "15min" || interval === "30min") return 3 * 60_000;
  if (interval === "1h") return 10 * 60_000;
  if (interval === "4h") return 30 * 60_000;
  return 2 * 60 * 60_000;
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) return NextResponse.json({ status: "error", message: "Brak TWELVE_DATA_API_KEY w Environment Variables." }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") ?? "";
  const interval = searchParams.get("interval") ?? "";
  const outputsize = Math.min(Math.max(Number(searchParams.get("outputsize") ?? 260) || 260, 20), 5000);
  const timezone = searchParams.get("timezone") ?? "UTC";
  const order = searchParams.get("order") ?? "asc";

  if (!ALLOWED_SYMBOLS.has(symbol)) return NextResponse.json({ status: "error", message: `Nieobsługiwany instrument: ${symbol}` }, { status: 400 });
  if (!ALLOWED_INTERVALS.has(interval)) return NextResponse.json({ status: "error", message: `Nieobsługiwany timeframe: ${interval}` }, { status: 400 });

  const cacheKey = [symbol, interval, outputsize, timezone, order].join("|");
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return NextResponse.json(cached.data, { headers: { "X-Twelve-Cache": "HIT", "Cache-Control": "no-store" } });
  const pending = inflight.get(cacheKey);
  if (pending) {
    try { return NextResponse.json(await pending, { headers: { "X-Twelve-Cache": "IN-FLIGHT", "Cache-Control": "no-store" } }); }
    catch (error) { return NextResponse.json({ status: "error", message: error instanceof Error ? error.message : "Twelve Data error" }, { status: 500 }); }
  }

  const url = new URL("https://api.twelvedata.com/time_series");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", interval);
  url.searchParams.set("outputsize", String(outputsize));
  url.searchParams.set("format", "JSON");
  url.searchParams.set("timezone", timezone);
  url.searchParams.set("order", order);
  url.searchParams.set("apikey", apiKey);

  const promise = (async () => {
    const response = await fetch(url.toString(), { cache: "no-store", headers: { Accept: "application/json" }, signal: AbortSignal.timeout(15_000) });
    const raw = await response.text();
    let data: any;
    try { data = JSON.parse(raw); } catch { throw new Error("Twelve Data zwróciło nieprawidłowy JSON."); }
    if (!response.ok || data?.status === "error") throw new Error(data?.message || `Twelve Data HTTP ${response.status}`);
    cache.set(cacheKey, { data, expiresAt: Date.now() + ttl(interval) });
    return data;
  })();

  inflight.set(cacheKey, promise);
  try { return NextResponse.json(await promise, { headers: { "X-Twelve-Cache": "MISS", "Cache-Control": "no-store" } }); }
  catch (error) { return NextResponse.json({ status: "error", message: error instanceof Error ? error.message : "Nie udało się połączyć z Twelve Data." }, { status: 500 }); }
  finally { inflight.delete(cacheKey); }
}
