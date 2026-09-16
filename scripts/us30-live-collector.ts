import { PrismaClient } from "@prisma/client";
import { io } from "socket.io-client";
import dotenv from "dotenv";
import http from "node:http";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });
const prisma = new PrismaClient();
const key = process.env.LIVE_RATES_API_KEY;
if (!key) throw new Error("Missing LIVE_RATES_API_KEY");

const frames = [
  ["1min", 60_000],
  ["5min", 5 * 60_000],
  ["15min", 15 * 60_000],
  ["1h", 60 * 60_000],
  ["4h", 4 * 60 * 60_000],
] as const;

function bucketDate(ts: number, size: number) {
  return new Date(Math.floor(ts / size) * size);
}

async function upsertTick(price: number, ts: number) {
  for (const [interval, size] of frames) {
    const bucket = bucketDate(ts, size);
    await prisma.$executeRaw`
      INSERT INTO "MarketCandle" ("id", "symbol", "interval", "bucket", "open", "high", "low", "close", "ticks", "createdAt", "updatedAt")
      VALUES (${crypto.randomUUID()}, 'US30', ${interval}, ${bucket}, ${price}, ${price}, ${price}, ${price}, 1, NOW(), NOW())
      ON CONFLICT ("symbol", "interval", "bucket")
      DO UPDATE SET
        "high" = GREATEST("MarketCandle"."high", EXCLUDED."high"),
        "low" = LEAST("MarketCandle"."low", EXCLUDED."low"),
        "close" = EXCLUDED."close",
        "ticks" = "MarketCandle"."ticks" + 1,
        "updatedAt" = NOW();
    `;
  }
}


type LiveTick = { symbol: "US30"; price: number; timestamp: number };
let latestTick: LiveTick | null = null;
const clients = new Set<http.ServerResponse>();
const PORT = Number(process.env.PORT || 3001);

function broadcastTick(tick: LiveTick) {
  const payload = `event: tick\ndata: ${JSON.stringify(tick)}\n\n`;
  for (const res of clients) {
    try { res.write(payload); } catch { clients.delete(res); }
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const origin = req.headers.origin || "";
  const allowedOrigin =
    origin === "https://www.fx-trade.eu" ||
    origin === "https://fx-trade.eu" ||
    origin.startsWith("http://localhost:")
      ? origin
      : "https://www.fx-trade.eu";

  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Vary", "Origin");

  if (url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({
      ok: true,
      liveRatesConnected: socket.connected,
      clients: clients.size,
      latestTick,
    }));
  }

  if (url.pathname === "/api/us30/stream") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.write(": connected\n\n");
    if (latestTick) res.write(`event: tick\ndata: ${JSON.stringify(latestTick)}\n\n`);
    clients.add(res);

    const ping = setInterval(() => {
      try { res.write(": ping\n\n"); } catch {}
    }, 20000);

    req.on("close", () => {
      clearInterval(ping);
      clients.delete(res);
    });
    return;
  }

  res.writeHead(404).end();
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[US30] HTTP/SSE listening on :${PORT}`);
});

const socket = io("https://eu-wss.live-rates.com", {
  transports: ["websocket"],
  reconnection: true,
  reconnectionDelay: 1500,
});

socket.on("connect", () => {
  console.log("[US30] Live-Rates socket connected");
  socket.emit("instruments", ["US30"]);
  socket.emit("key", key);
});

let writeChain = Promise.resolve();

socket.on("rates", (raw: string) => {
  try {
    const msg = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (msg?.info) return console.log("[US30]", msg.info);
    if (msg?.error) return console.error("[US30]", msg.error);
    if (String(msg?.currency || "").replace(/[^A-Z0-9]/g, "") !== "US30") return;

    const bid = Number(msg.bid);
    const rawTs = Number(msg.timestamp);
    const ts = Number.isFinite(rawTs) && rawTs > 0
      ? (rawTs < 10_000_000_000 ? rawTs * 1000 : rawTs)
      : Date.now();
    if (!Number.isFinite(bid)) return;

    latestTick = { symbol: "US30", price: bid, timestamp: ts };
    broadcastTick(latestTick);

    writeChain = writeChain
      .then(() => upsertTick(bid, ts))
      .catch((e) => console.error("[US30] DB write error", e));
  } catch (e) {
    console.error("[US30] tick error", e);
  }
});

socket.on("connect_error", (e) => console.error("[US30] socket error", e.message));

async function shutdown() {
  socket.close();
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
