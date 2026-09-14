import { PrismaClient } from "@prisma/client";
import { io } from "socket.io-client";
import dotenv from "dotenv";

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

socket.on("rates", async (raw: string) => {
  try {
    const msg = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (msg?.info) return console.log("[US30]", msg.info);
    if (msg?.error) return console.error("[US30]", msg.error);
    if (String(msg?.currency || "").replace(/[^A-Z0-9]/g, "") !== "US30") return;

    const bid = Number(msg.bid);
    const ts = Number(msg.timestamp) || Date.now();
    if (!Number.isFinite(bid)) return;
    await upsertTick(bid, ts);
  } catch (e) {
    console.error("[US30] tick error", e);
  }
});

socket.on("connect_error", (e) => console.error("[US30] socket error", e.message));

async function shutdown() {
  socket.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
