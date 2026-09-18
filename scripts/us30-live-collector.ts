import { PrismaClient } from "@prisma/client";
import { io } from "socket.io-client";
import dotenv from "dotenv";
import http from "node:http";
import crypto from "node:crypto";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const prisma = new PrismaClient();
const key = process.env.LIVE_RATES_API_KEY;
if (!key) throw new Error("Missing LIVE_RATES_API_KEY");

const PORT = Number(process.env.PORT || 8080);

const frames = [
  ["1min", 60_000],
  ["5min", 5 * 60_000],
  ["15min", 15 * 60_000],
  ["1h", 60 * 60_000],
  ["4h", 4 * 60 * 60_000],
] as const;

type Tick = { symbol: string; price: number; timestamp: number };

const PROVIDER_INSTRUMENTS = ["US30", "EUR/USD", "GBP/USD", "XAU/USD"] as const;
const SYMBOL_MAP: Record<string,string> = { US30:"US30", EURUSD:"EURUSD", GBPUSD:"GBPUSD", XAUUSD:"XAUUSD" };
const latestTicks: Record<string, Tick> = {};
let liveRatesConnected = false;
let providerInfo = "";
let providerError = "";

let dbWriting = false;
const pendingDbTicks = new Map<string, Tick>();

const clients = new Set<http.ServerResponse>();

async function upsertTick(symbol: string, price: number, ts: number) {
  for (const [interval, size] of frames) {
    const bucket = new Date(Math.floor(ts / size) * size);

    await prisma.$executeRaw`
      INSERT INTO "MarketCandle"
        ("id","symbol","interval","bucket","open","high","low","close","ticks","createdAt","updatedAt")
      VALUES
        (${crypto.randomUUID()},${symbol},${interval},${bucket},
         ${price},${price},${price},${price},1,NOW(),NOW())
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

function queueDbTick(tick: Tick) {
  pendingDbTicks.set(tick.symbol, tick);
  if (!dbWriting) void drainDbQueue();
}

async function drainDbQueue() {
  if (dbWriting) return;
  dbWriting = true;
  try {
    while (pendingDbTicks.size > 0) {
      const batch = Array.from(pendingDbTicks.values());
      pendingDbTicks.clear();
      for (const tick of batch) {
        try { await upsertTick(tick.symbol, tick.price, tick.timestamp); }
        catch (e: any) { console.error(`[${tick.symbol}] DB write error`, e?.code || "", e?.message || e); }
      }
    }
  } finally {
    dbWriting = false;
    if (pendingDbTicks.size > 0) void drainDbQueue();
  }
}

function broadcast(event: string, payload: unknown) {
  const body = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;

  for (const client of clients) {
    try {
      client.write(body);
    } catch {
      clients.delete(client);
    }
  }
}

function normalizeTimestamp(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return Date.now();
  // Accept either seconds or milliseconds.
  return n < 10_000_000_000 ? n * 1000 : n;
}

const socket = io("https://wss.live-rates.com", {
  transports: ["websocket"],

  // CRITICAL DIAGNOSTIC CHANGE:
  // exactly one connection attempt per Railway process.
  reconnection: false,
  forceNew: true,
  multiplex: false,
  autoConnect: false,

  timeout: 20_000,
});

socket.on("connect", () => {
  liveRatesConnected = true;
  providerError = "";
  console.log("[US30] Live-Rates SINGLE socket connected");

  socket.emit("instruments", [...PROVIDER_INSTRUMENTS]);
  socket.emit("key", { key });

  broadcast("status", {
    provider: "live-rates",
    connected: true,
    mode: "WS_SINGLE_CONNECTION",
  });
});

socket.on("rates", (raw: any) => {
  try {
    const msg = typeof raw === "string" ? JSON.parse(raw) : raw;

    if (msg?.info) {
      providerInfo = String(msg.info);
      console.log("[US30]", providerInfo);

      if (/another connection/i.test(providerInfo)) {
        liveRatesConnected = false;
        providerError = providerInfo;
      }

      broadcast("status", {
        provider: "live-rates",
        connected: liveRatesConnected,
        info: providerInfo,
        mode: "WS_SINGLE_CONNECTION",
      });
      return;
    }

    if (msg?.error) {
      providerError = String(msg.error);
      console.error("[US30]", providerError);
      broadcast("status", {
        provider: "live-rates",
        connected: liveRatesConnected,
        error: providerError,
        mode: "WS_SINGLE_CONNECTION",
      });
      return;
    }

    const providerSymbol = String(msg?.currency ?? msg?.symbol ?? "")
      .toUpperCase().replace(/[^A-Z0-9]/g, "");
    const symbol = SYMBOL_MAP[providerSymbol];
    if (!symbol) return;
    const bid = Number(msg?.bid);
    if (!Number.isFinite(bid) || bid <= 0) return;

    const tick: Tick = { symbol, price: bid, timestamp: normalizeTimestamp(msg?.timestamp) };
    latestTicks[symbol] = tick;

    // Browser gets the tick immediately; DB work is serialized separately.
    broadcast("tick", tick);
    queueDbTick(tick);
  } catch (e) {
    console.error("[US30] tick parse error", e);
  }
});

socket.on("disconnect", (reason) => {
  liveRatesConnected = false;
  console.warn("[US30] Live-Rates socket disconnected:", reason);

  broadcast("status", {
    provider: "live-rates",
    connected: false,
    reason,
    mode: "WS_SINGLE_CONNECTION",
  });

  // Deliberately DO NOT reconnect here.
  // This test prevents a reconnect loop from being mistaken for a second session.
});

socket.on("connect_error", (e) => {
  liveRatesConnected = false;
  providerError = e.message;
  console.error("[US30] socket connect error:", e.message);

  broadcast("status", {
    provider: "live-rates",
    connected: false,
    error: e.message,
    mode: "WS_SINGLE_CONNECTION",
  });
});

const server = http.createServer((req, res) => {
  const origin = req.headers.origin || "*";

  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (url.pathname === "/health") {
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });

    res.end(JSON.stringify({
      ok: true,
      mode: "WS_SINGLE_CONNECTION",
      liveRatesConnected,
      clients: clients.size,
      instruments: PROVIDER_INSTRUMENTS,
      latestTicks,
      dbWriting,
      dbPending: pendingDbTicks.size > 0,
      dbPendingSymbols: Array.from(pendingDbTicks.keys()),
      providerInfo: providerInfo || null,
      providerError: providerError || null,
      socketId: socket.id || null,
      socketActive: socket.active,
      socketConnected: socket.connected,
    }));
    return;
  }

  const streamMatch = url.pathname.match(/^\/api\/(us30|eurusd|gbpusd|xauusd)\/stream$/i);
  if (streamMatch) {
    const streamSymbol = streamMatch[1].toUpperCase();
    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": origin,
      Vary: "Origin",
    });

    res.write("retry: 3000\n\n");

    res.write(`event: status\ndata: ${JSON.stringify({
      provider: "live-rates",
      connected: liveRatesConnected,
      mode: "WS_SINGLE_CONNECTION",
    })}\n\n`);

    const latestTick = latestTicks[streamSymbol];
    if (latestTick) res.write(`event: tick\ndata: ${JSON.stringify(latestTick)}\n\n`);

    clients.add(res);

    const keepAlive = setInterval(() => {
      try {
        res.write(`: keepalive ${Date.now()}\n\n`);
      } catch {}
    }, 15_000);

    req.on("close", () => {
      clearInterval(keepAlive);
      clients.delete(res);
    });

    return;
  }

  res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({
    ok: true,
    service: "FX Trade Multi-Market Collector",
    mode: "WS_SINGLE_CONNECTION",
    instruments: PROVIDER_INSTRUMENTS,
    health: "/health",
    streams: { US30:"/api/us30/stream", EURUSD:"/api/eurusd/stream", GBPUSD:"/api/gbpusd/stream", XAUUSD:"/api/xauusd/stream" },
  }));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[US30] HTTP/SSE listening on :${PORT}`);
  console.log("[US30] WS SINGLE CONNECTION mode - reconnect disabled");
  socket.connect();
});

async function shutdown(signal: string) {
  console.log(`[US30] ${signal} - shutting down`);

  socket.removeAllListeners();
  socket.disconnect();

  for (const client of clients) {
    try { client.end(); } catch {}
  }
  clients.clear();

  await new Promise<void>((resolve) => server.close(() => resolve()));
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
