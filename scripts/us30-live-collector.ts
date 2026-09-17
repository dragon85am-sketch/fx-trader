import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import http from "node:http";
import crypto from "node:crypto";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const prisma = new PrismaClient();
const key = process.env.LIVE_RATES_API_KEY;
if (!key) throw new Error("Missing LIVE_RATES_API_KEY");

const PORT = Number(process.env.PORT || 8080);
const POLL_MS = 1000;
const frames = [
  ["1min", 60_000], ["5min", 300_000], ["15min", 900_000],
  ["1h", 3_600_000], ["4h", 14_400_000],
] as const;

type Tick = { symbol: string; price: number; timestamp: number };
let latestTick: Tick | null = null;
let lastRestOkAt = 0;
let lastRestError = "";
let polling = false;
let dbWriting = false;
let pendingDbTick: Tick | null = null;
const clients = new Set<http.ServerResponse>();

async function upsertTick(price: number, ts: number) {
  for (const [interval, size] of frames) {
    const bucket = new Date(Math.floor(ts / size) * size);
    await prisma.$executeRaw`
      INSERT INTO "MarketCandle" ("id","symbol","interval","bucket","open","high","low","close","ticks","createdAt","updatedAt")
      VALUES (${crypto.randomUUID()},'US30',${interval},${bucket},${price},${price},${price},${price},1,NOW(),NOW())
      ON CONFLICT ("symbol","interval","bucket")
      DO UPDATE SET
        "high"=GREATEST("MarketCandle"."high",EXCLUDED."high"),
        "low"=LEAST("MarketCandle"."low",EXCLUDED."low"),
        "close"=EXCLUDED."close",
        "ticks"="MarketCandle"."ticks"+1,
        "updatedAt"=NOW();
    `;
  }
}

function sendTick(tick: Tick) {
  const body = `event: tick\ndata: ${JSON.stringify(tick)}\n\n`;
  for (const client of clients) {
    try { client.write(body); } catch { clients.delete(client); }
  }
}

// Keep only the newest pending tick. This guarantees one DB writer at a time
// while SSE can still publish every REST quote immediately.
function queueDbTick(tick: Tick) {
  pendingDbTick = tick;
  if (!dbWriting) void drainDbQueue();
}

async function drainDbQueue() {
  if (dbWriting) return;
  dbWriting = true;

  try {
    while (pendingDbTick) {
      const tick = pendingDbTick;
      pendingDbTick = null;

      try {
        await upsertTick(tick.price, tick.timestamp);
      } catch (e: any) {
        console.error("[US30] DB write error", e?.code || "", e?.message || e);
        // If a newer tick arrived while DB was busy, the loop will write it next.
        // We deliberately do not spawn another writer.
      }
    }
  } finally {
    dbWriting = false;
    // Close a tiny race where a tick arrived between the while check and finally.
    if (pendingDbTick) void drainDbQueue();
  }
}

function num(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function extractPrice(payload: any): number | null {
  const items: any[] = [];
  if (Array.isArray(payload)) items.push(...payload); else items.push(payload);
  if (payload?.data) Array.isArray(payload.data) ? items.push(...payload.data) : items.push(payload.data);
  if (payload?.rates) Array.isArray(payload.rates) ? items.push(...payload.rates) : items.push(payload.rates);

  for (const x of items) {
    if (!x || typeof x !== "object") continue;
    const s = String(x.currency ?? x.symbol ?? x.instrument ?? "").toUpperCase().replace(/[^A-Z0-9]/g,"");
    if (s && s !== "US30") continue;
    for (const v of [x.bid, x.price, x.close, x.value, x.mid, x.rate_value]) {
      const n = num(v); if (n !== null) return n;
    }
  }
  return null;
}

async function poll() {
  if (polling) return;
  polling = true;
  try {
    const url = `https://www.live-rates.com/api/price?key=${encodeURIComponent(key!)}&rate=US30&_=${Date.now()}`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json", "Cache-Control": "no-cache" },
      signal: AbortSignal.timeout(8000),
    });
    const raw = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${raw.slice(0,180)}`);
    let payload: any;
    try { payload = JSON.parse(raw); } catch { throw new Error(`Invalid JSON: ${raw.slice(0,180)}`); }
    const price = extractPrice(payload);
    if (price === null) throw new Error(`US30 price not found: ${raw.slice(0,220)}`);

    const tick = { symbol: "US30", price, timestamp: Date.now() };
    latestTick = tick;
    lastRestOkAt = tick.timestamp;
    lastRestError = "";
    sendTick(tick);
    queueDbTick(tick);
  } catch (e) {
    lastRestError = e instanceof Error ? e.message : String(e);
    console.error("[US30] REST poll error:", lastRestError);
  } finally { polling = false; }
}

const server = http.createServer((req, res) => {
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  if (url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    res.end(JSON.stringify({
      ok: true, mode: "REST_1S_TEST",
      liveRatesConnected: Date.now() - lastRestOkAt < 5000,
      clients: clients.size, latestTick, pollMs: POLL_MS,
      dbWriting, dbPending: Boolean(pendingDbTick),
      lastRestOkAt: lastRestOkAt || null, lastRestError: lastRestError || null,
    }));
    return;
  }

  if (url.pathname === "/api/us30/stream") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": origin,
      Vary: "Origin",
    });
    res.write("retry: 2000\n\n");
    if (latestTick) res.write(`event: tick\ndata: ${JSON.stringify(latestTick)}\n\n`);
    clients.add(res);
    const ka = setInterval(() => { try { res.write(`: keepalive ${Date.now()}\n\n`); } catch {} }, 15000);
    req.on("close", () => { clearInterval(ka); clients.delete(res); });
    return;
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ok: true, service: "FX Trade US30 Collector", mode: "REST_1S_TEST" }));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[US30] HTTP/SSE listening on :${PORT}`);
  console.log("[US30] REST 1s diagnostic mode started");
});

void poll();
const timer = setInterval(() => void poll(), POLL_MS);

async function shutdown(signal: string) {
  console.log(`[US30] ${signal} - shutting down`);
  clearInterval(timer);
  for (const c of clients) { try { c.end(); } catch {} }
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
