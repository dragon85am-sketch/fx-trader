import { PrismaClient } from "@prisma/client";
import { io } from "socket.io-client";
import dotenv from "dotenv";
import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { getCollectorSymbols, normalizeMarketSymbol, toLiveRatesSymbol } from "../lib/market/master-symbols";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const prisma = new PrismaClient();
const key = process.env.LIVE_RATES_API_KEY;
if (!key) throw new Error("Missing LIVE_RATES_API_KEY");

const PORT = Number(process.env.PORT || 8080);
const PROVIDER_INSTRUMENTS = getCollectorSymbols(process.env.LIVE_RATES_INSTRUMENTS);
const PROVIDER_SET = new Set(PROVIDER_INSTRUMENTS);
const LIVE_RATES_SUBSCRIPTIONS = Array.from(new Set(PROVIDER_INSTRUMENTS.map(toLiveRatesSymbol)));

const frames = [
  ["1min", 60_000], ["5min", 300_000], ["15min", 900_000],
  ["30min", 1_800_000], ["1h", 3_600_000], ["4h", 14_400_000], ["1day", 86_400_000],
] as const;

type Tick = { symbol: string; price: number; timestamp: number };
type TickBatch = { symbol: string; interval: string; bucket: number; open: number; high: number; low: number; close: number; firstAt: number; lastAt: number; ticks: number };

const latestTicks: Record<string, Tick> = {};
// Reject out-of-order events that would overwrite the latest candle close.
const lastAcceptedTimestamp = new Map<string, number>();
let staleTicksRejected = 0;
const staleTicksBySymbol = new Map<string, number>();
const acceptedTicksBySymbol = new Map<string, number>();
let invalidTimestampsRejected = 0;
let futureTimestampsRejected = 0;
let invalidPricesRejected = 0;
let shutdownFlushFailed = false;
// FAZA 3.0.1: passive diagnostics. No changes to tick acceptance or SQL writes.
let acceptedTicks = 0;
let lastAcceptedTickAt: number | null = null;
let lastProviderTickTimestamp: number | null = null;
let maxProviderTickLagMs = 0;
let lastProviderTickLagMs: number | null = null;
const acceptedByMinute = new Map<number, Set<string>>();
// FAZA 3.0.3: provider-arrival monitoring (independent of accepted tick timestamps).
let lastProviderPriceArrivalAt: number | null = null;
let marketDataGapEvents = 0;
let longestProviderSilenceMs = 0;
let lastProviderGapMs: number | null = null;
const PROVIDER_GAP_THRESHOLD_MS = 30_000;
let tickArrivalLagMs: number | null = null;
let maxTickArrivalLagMs = 0;
let negativeTickArrivalLagCount = 0;
function observeProviderPrice(timestamp: number) {
  const now = Date.now();
  if (lastProviderPriceArrivalAt !== null) {
    const gap = now - lastProviderPriceArrivalAt;
    if (gap >= PROVIDER_GAP_THRESHOLD_MS) {
      marketDataGapEvents++;
      lastProviderGapMs = gap;
      longestProviderSilenceMs = Math.max(longestProviderSilenceMs, gap);
      console.warn(`[MASTER] provider price arrival gap: ${gap}ms`);
    }
  }
  lastProviderPriceArrivalAt = now;
  tickArrivalLagMs = now - timestamp;
  maxTickArrivalLagMs = Math.max(maxTickArrivalLagMs, tickArrivalLagMs);
  if (tickArrivalLagMs < 0) negativeTickArrivalLagCount++;
}

function recordAcceptedTick(t: Tick) {
  acceptedTicks++;
  acceptedTicksBySymbol.set(t.symbol, (acceptedTicksBySymbol.get(t.symbol) || 0) + 1);
  lastAcceptedTickAt = Date.now();
  lastProviderTickTimestamp = t.timestamp;
  lastProviderTickLagMs = Date.now() - t.timestamp;
  maxProviderTickLagMs = Math.max(maxProviderTickLagMs, lastProviderTickLagMs);
  const minute = Math.floor(t.timestamp / 60_000) * 60_000;
  let symbols = acceptedByMinute.get(minute);
  if (!symbols) { symbols = new Set<string>(); acceptedByMinute.set(minute, symbols); }
  symbols.add(t.symbol);
  const cutoff = Date.now() - 30 * 60_000;
  for (const k of acceptedByMinute.keys()) if (k < cutoff) acceptedByMinute.delete(k);
}
function oldestQueueBucket() {
  let oldest = Infinity;
  for (const b of pending.values()) oldest = Math.min(oldest, b.bucket);
  for (const chunk of retryChunks) for (const row of chunk) oldest = Math.min(oldest, row.batch.bucket);
  return Number.isFinite(oldest) ? oldest : null;
}
function ingestionDiagnostics() {
  const oldest = oldestQueueBucket();
  return {
    providerSilenceSeconds: lastProviderPriceArrivalAt === null ? null : Math.floor((Date.now() - lastProviderPriceArrivalAt) / 1000),
    marketDataGapEvents, lastProviderGapMs, longestProviderSilenceMs,
    tickArrivalLagMs, maxTickArrivalLagMs, negativeTickArrivalLagCount,
    lastProviderPriceArrivalAt,
    acceptedTicks, lastAcceptedTickAt, lastProviderTickTimestamp,
    lastProviderTickLagMs, maxProviderTickLagMs,
    oldestQueuedBucket: oldest,
    oldestQueuedBucketAgeMs: oldest === null ? null : Date.now() - oldest,
    acceptedMinuteCoverage: [...acceptedByMinute.entries()].sort((a,b)=>b[0]-a[0]).slice(0, 15)
      .map(([minute, symbols]) => ({ minute, symbols: symbols.size })),
  };
}
const MAX_FUTURE_TICK_MS = 60_000;

const clientsBySymbol = new Map<string, Set<http.ServerResponse>>();
const pending = new Map<string, TickBatch>();
// Immutable failed chunks keep stable IDs for idempotent SQL retries.
const retryChunks: Array<Array<{ id: string; batch: TickBatch }>> = [];
// Synchronous, crash-safe checkpoint on the mounted Railway Volume.
// Checkpoint BEFORE acknowledging a tick or submitting SQL, preserving stable ledger IDs.
const QUEUE_DIR = process.env.OHLC_QUEUE_DIR || "/data/ohlc-queue";
const QUEUE_FILE = path.join(QUEUE_DIR, "state.json");
const MAX_QUEUE_BYTES = 64 * 1024 * 1024;
let queueCheckpointAt: number | null = null;
let queueCheckpointBytes = 0;
let lastQueueCheckpointMs: number | null = null;
let maxQueueCheckpointMs = 0;
let slowQueueCheckpoints = 0;
let queueRecoveredRows = 0;
let queueFatalError: string | null = null;

function validateBatch(value: any): value is TickBatch {
  return !!value && typeof value.symbol === "string" && typeof value.interval === "string" &&
    [value.bucket, value.open, value.high, value.low, value.close, value.firstAt, value.lastAt, value.ticks]
      .every((n: unknown) => typeof n === "number" && Number.isFinite(n)) &&
    value.bucket > 0 && value.firstAt > 0 && value.lastAt >= value.firstAt &&
    value.open > 0 && value.close > 0 && value.high >= Math.max(value.open, value.close) &&
    value.low <= Math.min(value.open, value.close) && value.ticks > 0;
}

function saveQueue(): void {
  const checkpointStarted = Date.now();
  const payload = JSON.stringify({ version: 1, pending: [...pending.entries()], retryChunks });
  const bytes = Buffer.byteLength(payload);
  if (bytes > MAX_QUEUE_BYTES) throw new Error(`OHLC queue exceeds 64 MiB (${bytes} bytes)`);
  const tmp = `${QUEUE_FILE}.${process.pid}.tmp`;
  try {
    const fd = fs.openSync(tmp, "w", 0o600);
    try { fs.writeFileSync(fd, payload); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    fs.renameSync(tmp, QUEUE_FILE);
    // Ensure the directory entry survives a host crash where supported.
    const dirfd = fs.openSync(QUEUE_DIR, "r");
    try { fs.fsyncSync(dirfd); } finally { fs.closeSync(dirfd); }
    queueCheckpointAt = Date.now();
    queueCheckpointBytes = bytes;
    lastQueueCheckpointMs = Date.now() - checkpointStarted;
    maxQueueCheckpointMs = Math.max(maxQueueCheckpointMs, lastQueueCheckpointMs);
    if (lastQueueCheckpointMs > 250) {
      slowQueueCheckpoints++;
      if (slowQueueCheckpoints <= 5 || slowQueueCheckpoints % 100 === 0)
        console.warn(`[MASTER] slow durable queue checkpoint: ${lastQueueCheckpointMs}ms, bytes=${bytes}, pending=${pending.size}, retries=${retryChunks.length}`);
    }
  } catch (err) {
    try { fs.unlinkSync(tmp); } catch {}
    throw err;
  }
}

function recoverQueue(): void {
  fs.mkdirSync(QUEUE_DIR, { recursive: true });
  if (!fs.existsSync(QUEUE_FILE)) { saveQueue(); return; }
  const state = JSON.parse(fs.readFileSync(QUEUE_FILE, "utf8"));
  if (state?.version !== 1 || !Array.isArray(state.pending) || !Array.isArray(state.retryChunks))
    throw new Error("Invalid OHLC durable queue version or structure");
  for (const entry of state.pending) {
    if (!Array.isArray(entry) || entry.length !== 2 || typeof entry[0] !== "string" || !validateBatch(entry[1]) || entry[0] !== batchKey(entry[1]))
      throw new Error("Corrupt OHLC pending entry");
    pending.set(entry[0], entry[1]);
  }
  for (const chunk of state.retryChunks) {
    if (!Array.isArray(chunk) || !chunk.every((row: any) => row && typeof row.id === "string" && validateBatch(row.batch)))
      throw new Error("Corrupt OHLC retry chunk");
    retryChunks.push(chunk);
  }
  queueRecoveredRows = pending.size + retryChunks.reduce((n, c) => n + c.length, 0);
  queueCheckpointBytes = fs.statSync(QUEUE_FILE).size;
  queueCheckpointAt = Date.now();
  console.log(`[MASTER] durable OHLC queue recovered ${queueRecoveredRows} rows from ${QUEUE_FILE}`);
}

function fatalQueueError(error: unknown): never {
  queueFatalError = error instanceof Error ? error.message : String(error);
  console.error("[MASTER] FATAL durable OHLC queue error; stopping to avoid unprotected writes", queueFatalError);
  // Do not process any further provider events after a failed durable write.
  socket.disconnect();
  process.exit(1);
}

let flushTimer: NodeJS.Timeout | null = null;
let dbWriting = false;
let liveRatesConnected = false;
let providerInfo = "";
let providerError = "";
const unrecognizedSymbols = new Map<string, number>();
const receivedCount = new Map<string, number>();
let failedDbWrites = 0;
let successfulDbWrites = 0;
let lastDbWriteMs: number | null = null;
let lastDbSuccessAt: number | null = null;
let lastDbFailureAt: number | null = null;
let consecutiveDbFailures = 0;
const DB_FLUSH_MS = 15000;
// Fewer database round-trips. Existing durable retry chunks retain their original IDs.
// Keep bounded to avoid excessively large SQL statements.
const DB_CHUNK_ROWS = Math.max(1, Math.min(64, Number(process.env.OHLC_DB_CHUNK_ROWS || 42) || 42));
let lastDbSqlMs: number | null = null;
let lastDbCheckpointMs: number | null = null;
let maxDbSqlMs = 0;
let lastDbBatchRows = 0;
let lastDbBatchAt: number | null = null;
const DB_RETRY_MAX_MS = 60000;
let shuttingDown = false;
// Bounded, sanitized diagnostics; never expose API keys or complete raw payloads.
const rawEventCounts = new Map<string, number>();
const rawSymbolCounts = new Map<string, number>();
const rawMessageShapes = new Map<string, number>();
let lastRateAt: number | null = null;
let lastConnectAt: number | null = null;
let lastDisconnectAt: number | null = null;
const forexSlashSubscriptions = process.env.LIVE_RATES_FOREX_SLASH === "true";
function summarizeRawRate(raw: unknown) {
  const msg = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (Array.isArray(msg)) { rawMessageShapes.set("array", (rawMessageShapes.get("array") || 0) + 1); return msg; }
  if (!msg || typeof msg !== "object") { rawMessageShapes.set(typeof msg, (rawMessageShapes.get(typeof msg) || 0) + 1); return []; }
  const shape = Object.keys(msg).filter(k => !/key|token|secret|auth/i.test(k)).sort().join(",").slice(0, 180);
  rawMessageShapes.set(shape, (rawMessageShapes.get(shape) || 0) + 1);
  return [msg];
}
function logRawSymbol(rawSymbol: string) {
  const safe = rawSymbol.slice(0, 40).replace(/[^A-Za-z0-9/_-]/g, "");
  if (!safe) return;
  const count = (rawSymbolCounts.get(safe) || 0) + 1;
  rawSymbolCounts.set(safe, count);
  if (count === 1) console.log(`[MASTER] incoming Live Rates symbol: ${safe} -> ${normalizeMarketSymbol(safe)}`);
}
function providerSubscriptions() {
  if (!forexSlashSubscriptions) return LIVE_RATES_SUBSCRIPTIONS;
  return LIVE_RATES_SUBSCRIPTIONS.map(s => /^[A-Z]{6}$/.test(s) && !["BTCUSD", "ETHUSD", "XAUUSD", "XAGUSD"].includes(s) ? `${s.slice(0, 3)}/${s.slice(3)}` : s);
}


function clientSet(symbol: string) {
  let set = clientsBySymbol.get(symbol);
  if (!set) { set = new Set(); clientsBySymbol.set(symbol, set); }
  return set;
}
function totalClients() { let n=0; for (const s of clientsBySymbol.values()) n+=s.size; return n; }
function normalizeTimestamp(value: unknown): number | null {
  // Never fabricate candle timestamps from invalid provider data.
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n < 10_000_000_000 ? n * 1000 : n;
}

function batchKey(b: Pick<TickBatch, "symbol" | "interval" | "bucket">) {
  return `${b.symbol}|${b.interval}|${b.bucket}`;
}

function mergeBatch(a: TickBatch, b: TickBatch): TickBatch {
  return {
    ...a,
    high: Math.max(a.high, b.high),
    low: Math.min(a.low, b.low),
    open: a.firstAt <= b.firstAt ? a.open : b.open,
    close: a.lastAt >= b.lastAt ? a.close : b.close,
    firstAt: Math.min(a.firstAt, b.firstAt),
    lastAt: Math.max(a.lastAt, b.lastAt),
    ticks: a.ticks + b.ticks,
  };
}

function scheduleFlush(delayMs = DB_FLUSH_MS) {
  if (!flushTimer && !shuttingDown) {
    flushTimer = setTimeout(() => { flushTimer = null; void flushDb(); }, delayMs);
  }
}

function queueDbTick(t: Tick) {
  // Aggregate by the *actual* candle bucket, not just by symbol.
  // A batch crossing 1m/5m/etc boundaries must never be assigned to one candle.
  for (const [interval, size] of frames) {
    const bucket = Math.floor(t.timestamp / size) * size;
    const incoming: TickBatch = {
      symbol: t.symbol, interval, bucket, open: t.price, high: t.price,
      low: t.price, close: t.price, firstAt: t.timestamp,
      lastAt: t.timestamp, ticks: 1,
    };
    const k = batchKey(incoming);
    const existing = pending.get(k);
    pending.set(k, existing ? mergeBatch(existing, incoming) : incoming);
  }
  try { saveQueue(); } catch (e) { fatalQueueError(e); }
  scheduleFlush();
}

type DurableBatch = { id: string; batch: TickBatch };

async function writeBatches(rows: DurableBatch[]) {
  if (!rows.length) return;
  const params: unknown[] = [];
  const values = rows.map(({ id, batch: b }) => {
    const base = params.length;
    params.push(id, crypto.randomUUID(), b.symbol, b.interval, new Date(b.bucket),
      b.open, b.high, b.low, b.close, b.ticks, new Date(b.firstAt), new Date(b.lastAt));
    const p = Array.from({ length: 12 }, (_, i) => `$${base + i + 1}`);
    return `(${p.join(",")})`;
  }).join(",");
  // One atomic SQL statement: only previously unseen batch IDs may update candles.
  // A timed-out but committed batch cannot be applied twice.
  await prisma.$executeRawUnsafe(`
    WITH incoming(batch_id, id, symbol, interval, bucket, open, high, low, close, ticks, first_at, last_at) AS
      (VALUES ${values}),
    accepted AS (
      INSERT INTO public."MarketCandleBatchLedger" ("batchId")
      SELECT batch_id::text FROM incoming
      ON CONFLICT ("batchId") DO NOTHING
      RETURNING "batchId"
    )
    INSERT INTO public."MarketCandle"
      ("id","symbol","interval","bucket","open","high","low","close","ticks","firstAt","lastAt","createdAt","updatedAt")
    SELECT i.id::text,i.symbol::text,i.interval::text,i.bucket::timestamptz,
      i.open::float8,i.high::float8,i.low::float8,i.close::float8,i.ticks::integer,
      i.first_at::timestamptz,i.last_at::timestamptz,NOW(),NOW()
    FROM incoming i JOIN accepted a ON a."batchId" = i.batch_id::text
    ON CONFLICT ("symbol","interval","bucket") DO UPDATE SET
      "high"=GREATEST("MarketCandle"."high",EXCLUDED."high"),
      "low"=LEAST("MarketCandle"."low",EXCLUDED."low"),
      "open"=CASE WHEN "MarketCandle"."firstAt" IS NULL OR EXCLUDED."firstAt" < "MarketCandle"."firstAt"
        THEN EXCLUDED."open" ELSE "MarketCandle"."open" END,
      "close"=CASE WHEN "MarketCandle"."lastAt" IS NULL OR EXCLUDED."lastAt" >= "MarketCandle"."lastAt"
        THEN EXCLUDED."close" ELSE "MarketCandle"."close" END,
      "firstAt"=LEAST(COALESCE("MarketCandle"."firstAt", EXCLUDED."firstAt"), EXCLUDED."firstAt"),
      "lastAt"=GREATEST(COALESCE("MarketCandle"."lastAt", EXCLUDED."lastAt"), EXCLUDED."lastAt"),
      "ticks"="MarketCandle"."ticks"+EXCLUDED."ticks",
      "updatedAt"=NOW()
  `, ...params);
}

async function flushDb() {
  if (dbWriting) return;
  dbWriting = true;
  try {
    // Retry immutable failed chunks first. Never merge them with fresh ticks.
    const snapshot = [...pending.entries()];
    pending.clear();
    const newChunks: DurableBatch[][] = [];
    for (let i = 0; i < snapshot.length; i += DB_CHUNK_ROWS) {
      newChunks.push(snapshot.slice(i, i + DB_CHUNK_ROWS).map(([, batch]) => ({ id: crypto.randomUUID(), batch })));
    }
    retryChunks.push(...newChunks);
    // Stable batch IDs must reach disk before any SQL request.
    try { saveQueue(); } catch (e) { fatalQueueError(e); }
    while (retryChunks.length) {
      const part = retryChunks[0];
      const started = Date.now();
      try {
        await writeBatches(part);
        const sqlFinished = Date.now();
        lastDbSqlMs = sqlFinished - started;
        maxDbSqlMs = Math.max(maxDbSqlMs, lastDbSqlMs);
        lastDbBatchRows = part.length;
        lastDbBatchAt = sqlFinished;
        retryChunks.shift();
        // SQL is committed. If we crash before checkpoint, ledger deduplicates replay.
        const checkpointStarted = Date.now();
        try { saveQueue(); } catch (e) { fatalQueueError(e); }
        lastDbCheckpointMs = Date.now() - checkpointStarted;
        lastDbWriteMs = Date.now() - started;
        lastDbSuccessAt = Date.now();
        successfulDbWrites++;
        consecutiveDbFailures = 0;
        if (lastDbSqlMs > 5000 || lastDbCheckpointMs > 1000)
          console.warn(`[MASTER] slow DB upsert: sql=${lastDbSqlMs}ms, checkpoint=${lastDbCheckpointMs}ms, total=${lastDbWriteMs}ms, rows=${part.length}, retryChunks=${retryChunks.length}, pending=${pending.size}`);
      } catch (e: any) {
        failedDbWrites++;
        consecutiveDbFailures++;
        lastDbFailureAt = Date.now();
        lastDbWriteMs = Date.now() - started;
        console.error(`[MASTER] DB batch failed; queued retry (${part.length} rows), duration=${lastDbWriteMs}ms`, e?.message || e);
        break;
      }
    }
  } finally {
    dbWriting = false;
    if (pending.size || retryChunks.length) {
      const retryMs = consecutiveDbFailures
        ? Math.min(DB_RETRY_MAX_MS, DB_FLUSH_MS * 2 ** Math.min(consecutiveDbFailures - 1, 3))
        : DB_FLUSH_MS;
      scheduleFlush(retryMs);
    }
  }
}

function broadcastTick(t: Tick) {
  const body=`event: tick\ndata: ${JSON.stringify(t)}\n\n`;
  for (const c of clientSet(t.symbol)) try { c.write(body); } catch { clientSet(t.symbol).delete(c); }
}
function broadcastStatus(payload: unknown) {
  const body=`event: status\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const set of clientsBySymbol.values()) for (const c of set) try { c.write(body); } catch { set.delete(c); }
}

const socket=io("https://wss.live-rates.com",{transports:["websocket"],reconnection:true,reconnectionAttempts:Infinity,reconnectionDelay:5000,reconnectionDelayMax:30000,randomizationFactor:.5,forceNew:true,multiplex:false,autoConnect:false,timeout:20000});
socket.on("connect",()=>{ lastConnectAt=Date.now(); liveRatesConnected=true; providerError=""; console.log(`[MASTER] connected; subscribing ${providerSubscriptions().length} symbols (forexSlash=${forexSlashSubscriptions})`); socket.emit("instruments",providerSubscriptions()); socket.emit("key",{key}); broadcastStatus({provider:"live-rates",connected:true,mode:"MASTER_150"}); });
socket.on("rates",(raw:any)=>{ try {
  lastRateAt = Date.now();
  for (const msg of summarizeRawRate(raw)) {
    if (msg?.info) { providerInfo=String(msg.info);broadcastStatus({provider:"live-rates",connected:liveRatesConnected,info:providerInfo,mode:"MASTER_150"});continue; }
    if (msg?.error) { providerError=String(msg.error);broadcastStatus({provider:"live-rates",connected:liveRatesConnected,error:providerError,mode:"MASTER_150"});continue; }
    const rawSymbol=String(msg?.currency??msg?.symbol??"");
    logRawSymbol(rawSymbol);
    const symbol=normalizeMarketSymbol(rawSymbol);
    if(!PROVIDER_SET.has(symbol)) { if(rawSymbol){const count=(unrecognizedSymbols.get(rawSymbol)||0)+1;unrecognizedSymbols.set(rawSymbol,count);if(count===1) console.warn(`[MASTER] ignored provider symbol ${rawSymbol.slice(0,40)} -> ${symbol} (not subscribed)`);} continue; }
    receivedCount.set(symbol,(receivedCount.get(symbol)||0)+1);
    const price=Number(msg?.bid??msg?.price);
    if(!Number.isFinite(price)||price<=0){ invalidPricesRejected++; continue; }
    const timestamp=normalizeTimestamp(msg?.timestamp);
    if(timestamp === null){ invalidTimestampsRejected++; continue; }
    observeProviderPrice(timestamp);
    if(timestamp > Date.now() + MAX_FUTURE_TICK_MS){ futureTimestampsRejected++; continue; }
    const last=lastAcceptedTimestamp.get(symbol);
    if(last !== undefined && timestamp < last){ staleTicksRejected++; staleTicksBySymbol.set(symbol, (staleTicksBySymbol.get(symbol) || 0) + 1); continue; }
    lastAcceptedTimestamp.set(symbol,timestamp);
    const tick={symbol,price,timestamp};
    latestTicks[symbol]=tick;recordAcceptedTick(tick);broadcastTick(tick);queueDbTick(tick);
  }
} catch(e){console.error("[MASTER] parse",e);} });
// Count event names only, not raw payloads (which might contain credentials).
socket.onAny((event:string)=>{ rawEventCounts.set(event,(rawEventCounts.get(event)||0)+1); });
socket.on("disconnect",reason=>{lastDisconnectAt=Date.now();liveRatesConnected=false;broadcastStatus({provider:"live-rates",connected:false,reason,mode:"MASTER_150"});});
socket.on("connect_error",e=>{liveRatesConnected=false;providerError=e.message;console.error("[MASTER] connect",e.message);});

const server=http.createServer((req,res)=>{
  const origin=req.headers.origin||"*"; res.setHeader("Access-Control-Allow-Origin",origin);res.setHeader("Vary","Origin");res.setHeader("Access-Control-Allow-Methods","GET, OPTIONS");res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS"){res.writeHead(204);res.end();return;}
  const url=new URL(req.url||"/",`http://${req.headers.host||"localhost"}`);
  if(url.pathname==="/health"){res.writeHead(200,{"Content-Type":"application/json","Cache-Control":"no-store"});res.end(JSON.stringify({ok:true,mode:"MASTER_150",connected:liveRatesConnected,configured:PROVIDER_INSTRUMENTS.length,providerSubscriptions:providerSubscriptions(),forexSlashSubscriptions,diagnostics:{rawEventCounts:Object.fromEntries(rawEventCounts),rawSymbolCounts:Object.fromEntries(rawSymbolCounts),rawMessageShapes:Object.fromEntries(rawMessageShapes),lastRateAt,lastConnectAt,lastDisconnectAt},clients:totalClients(),receivedSymbols:Object.keys(latestTicks).length,latestTicks,dbWriting,dbPending:[...new Set([...pending.values()].map(b=>b.symbol))],dbPendingRows:pending.size,dbRetryRows:retryChunks.reduce((n,c)=>n+c.length,0),durableQueue:{directory:QUEUE_DIR,checkpointAt:queueCheckpointAt,checkpointBytes:queueCheckpointBytes,lastCheckpointMs:lastQueueCheckpointMs,maxCheckpointMs:maxQueueCheckpointMs,slowCheckpoints:slowQueueCheckpoints,recoveredRows:queueRecoveredRows,fatalError:queueFatalError},dbMetrics:{flushMs:DB_FLUSH_MS,chunkRows:DB_CHUNK_ROWS,successfulDbWrites,failedDbWrites,consecutiveDbFailures,lastDbWriteMs,lastDbSqlMs,lastDbCheckpointMs,maxDbSqlMs,lastDbBatchRows,lastDbBatchAt,lastDbSuccessAt,lastDbFailureAt,shutdownFlushFailed},ingestionDiagnostics:ingestionDiagnostics(),ohlcMetrics:{staleTicksRejected,staleTicksBySymbol:Object.fromEntries(staleTicksBySymbol),acceptedTicksBySymbol:Object.fromEntries(acceptedTicksBySymbol),invalidTimestampsRejected,futureTimestampsRejected,invalidPricesRejected,activeCandles:[...pending.values()].filter(b=>b.bucket+Number(frames.find(f=>f[0]===b.interval)?.[1]??0)>Date.now()).length,closedPendingCandles:[...pending.values()].filter(b=>b.bucket+Number(frames.find(f=>f[0]===b.interval)?.[1]??0)<=Date.now()).length},providerInfo:providerInfo||null,providerError:providerError||null,failedDbWrites,receivedCount:Object.fromEntries(receivedCount),unrecognizedSymbols:Object.fromEntries(unrecognizedSymbols),missingConfiguredSymbols:PROVIDER_INSTRUMENTS.filter(s=>!latestTicks[s])}));return;}
  const m=url.pathname.match(/^\/api\/(?:market\/)?([a-z0-9]+)\/stream$/i);
  if(m){ const symbol=normalizeMarketSymbol(m[1]); if(!PROVIDER_SET.has(symbol)){res.writeHead(404,{"Content-Type":"application/json"});res.end(JSON.stringify({ok:false,error:"Unknown symbol"}));return;} res.writeHead(200,{"Content-Type":"text/event-stream; charset=utf-8","Cache-Control":"no-cache, no-transform",Connection:"keep-alive","X-Accel-Buffering":"no","Access-Control-Allow-Origin":origin,Vary:"Origin"});res.write("retry: 3000\n\n");res.write(`event: status\ndata: ${JSON.stringify({provider:"live-rates",connected:liveRatesConnected,symbol,mode:"MASTER_150"})}\n\n`);if(latestTicks[symbol])res.write(`event: tick\ndata: ${JSON.stringify(latestTicks[symbol])}\n\n`);const set=clientSet(symbol);set.add(res);const keep=setInterval(()=>{try{res.write(`: keepalive ${Date.now()}\n\n`);}catch{}},15000);req.on("close",()=>{clearInterval(keep);set.delete(res);});return; }
  res.writeHead(200,{"Content-Type":"application/json"});res.end(JSON.stringify({ok:true,service:"FX Trade Master Market Collector",mode:"MASTER_150",configured:PROVIDER_INSTRUMENTS.length,health:"/health",streamPattern:"/api/market/{symbol}/stream"}));
});
// Fail startup if the persistent volume is absent, read-only, or contains invalid data.
try { recoverQueue(); } catch (e) { fatalQueueError(e); }
server.listen(PORT,"0.0.0.0",()=>{
  console.log(`[MASTER] HTTP/SSE :${PORT}`);
  if (pending.size || retryChunks.length) scheduleFlush(1000);
  socket.connect();
});
async function shutdown(signal:string){
  console.log(`[MASTER] ${signal}: stopping new ticks and flushing pending candles`);
  shuttingDown=true;
  socket.removeAllListeners("rates");
  socket.disconnect();
  if(flushTimer){clearTimeout(flushTimer);flushTimer=null;}
  // An in-flight flush must finish before a final snapshot is taken.
  const waitUntil=Date.now()+20_000;
  while(dbWriting && Date.now()<waitUntil) await new Promise(r=>setTimeout(r,100));
  if(dbWriting){shutdownFlushFailed=true;console.error("[MASTER] shutdown: DB write still in progress");}
  else {
    // Flush pending batches once; any failures remain durable on the mounted volume.
    await flushDb();
    if(pending.size || retryChunks.length){shutdownFlushFailed=true;console.error(`[MASTER] shutdown: ${pending.size} pending candles, ${retryChunks.length} retry chunks`);}
  }
  for(const set of clientsBySymbol.values())for(const c of set)try{c.end();}catch{}
  await new Promise<void>(r=>server.close(()=>r()));
  await prisma.$disconnect();
  process.exit(shutdownFlushFailed?1:0);
}
process.on("SIGINT",()=>void shutdown("SIGINT"));process.on("SIGTERM",()=>void shutdown("SIGTERM"));
