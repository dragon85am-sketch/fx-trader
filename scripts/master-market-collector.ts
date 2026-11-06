import { PrismaClient } from "@prisma/client";
import { io } from "socket.io-client";
import dotenv from "dotenv";
import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { getCollectorSymbols, normalizeMarketSymbol, toLiveRatesSymbol } from "../lib/market/master-symbols";
import { LiveCandleEngine } from "../lib/market/live-candle-engine";
import { chooseNextChunk } from "../lib/market/history-priority";

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
const liveCandleEngine = new LiveCandleEngine();
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
// Fresh-start mode is opt-in and NEVER removes the legacy durable queue.
// Deploy with OHLC_FRESH_START=true and a NEW OHLC_QUEUE_DIR on the SAME mounted volume.
const FRESH_START = (process.env.OHLC_FRESH_START || "").trim().toLowerCase() === "true";
const LEGACY_QUEUE_DIR = "/data/ohlc-queue";
const QUEUE_DIR = process.env.OHLC_QUEUE_DIR || LEGACY_QUEUE_DIR;
if (FRESH_START && (path.resolve(QUEUE_DIR) === path.resolve(LEGACY_QUEUE_DIR) ||
    !path.resolve(QUEUE_DIR).startsWith("/data/"))) {
  throw new Error("FRESH START requires a separate OHLC_QUEUE_DIR under /data/ (e.g. /data/ohlc-fresh-20261106); legacy queue is protected");
}
// Prevent replayed provider ticks from rebuilding pre-restart history.
const FRESH_START_AT = Date.now();
const QUEUE_FILE = path.join(QUEUE_DIR, "state.json");
// V2.1: small fsynced append-only WAL per tick; large snapshots only at flush boundaries.
const WAL_FILE = path.join(QUEUE_DIR, "ticks.wal");
let walSequence = 0;
let walBytes = 0;
let walRecoveredTicks = 0;
let lastWalSyncMs: number | null = null;
const MAX_WAL_BYTES = 16 * 1024 * 1024;
const MAX_QUEUE_BYTES = 128 * 1024 * 1024; // Temporary recovery headroom; keep WAL 16 MiB guard.
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
  const payload = JSON.stringify({ version: 2, walSequence, pending: [...pending.entries()], retryChunks });
  const bytes = Buffer.byteLength(payload);
  if (bytes > MAX_QUEUE_BYTES) throw new Error(`OHLC queue exceeds 128 MiB (${bytes} bytes)`);
  const tmp = `${QUEUE_FILE}.${process.pid}.tmp`;
  try {
    const fd = fs.openSync(tmp, "w", 0o600);
    try { fs.writeFileSync(fd, payload); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    fs.renameSync(tmp, QUEUE_FILE);
    // Ensure the directory entry survives a host crash where supported.
    const dirfd = fs.openSync(QUEUE_DIR, "r");
    try { fs.fsyncSync(dirfd); } finally { fs.closeSync(dirfd); }
    // Snapshot is now durable. WAL records <= walSequence are covered by it.
    // A crash before WAL truncation is safe: recovery skips those sequences.
    const walFd = fs.openSync(WAL_FILE, fs.existsSync(WAL_FILE) ? "r+" : "w+", 0o600);
    try { fs.ftruncateSync(walFd, 0); fs.fsyncSync(walFd); } finally { fs.closeSync(walFd); }
    walBytes = 0;
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
  if (!fs.existsSync(QUEUE_FILE)) {
    if (fs.existsSync(WAL_FILE) && fs.statSync(WAL_FILE).size > 0)
      throw new Error("WAL exists but state.json is missing; refusing unsafe recovery");
    saveQueue(); return;
  }
  const state = JSON.parse(fs.readFileSync(QUEUE_FILE, "utf8"));
  if (![1, 2].includes(state?.version) || !Array.isArray(state.pending) || !Array.isArray(state.retryChunks))
    throw new Error("Invalid OHLC durable queue version or structure");
  for (const entry of state.pending) {
    if (!Array.isArray(entry) || entry.length !== 2 || typeof entry[0] !== "string" || !validateBatch(entry[1]) || entry[0] !== batchKey(entry[1]))
      throw new Error("Corrupt OHLC pending entry");
    if (pending.has(entry[0])) throw new Error("Duplicate OHLC pending key");
    pending.set(entry[0], entry[1]);
  }
  const recoveredIds = new Set<string>();
  for (const chunk of state.retryChunks) {
    if (!Array.isArray(chunk) || !chunk.every((row: any) => row && typeof row.id === "string" && validateBatch(row.batch)))
      throw new Error("Corrupt OHLC retry chunk");
    for (const row of chunk) {
      if (recoveredIds.has(row.id)) throw new Error("Duplicate durable batch ID");
      recoveredIds.add(row.id);
    }
    retryChunks.push(chunk);
  }
  walSequence = state.version === 2 ? state.walSequence : 0;
  if (!Number.isSafeInteger(walSequence) || walSequence < 0) throw new Error("Invalid WAL sequence");
  if (fs.existsSync(WAL_FILE)) {
    let raw = fs.readFileSync(WAL_FILE, "utf8");
    // Never silently discard an incomplete record: it may contain an acknowledged tick.
    // Preserve the WAL intact for inspection or recovery from the external backup.
    if (raw.length && !raw.endsWith("\n"))
      throw new Error("Incomplete WAL tail; refusing automatic truncation to protect queued ticks");
    walBytes = Buffer.byteLength(raw);
    const lines = raw.split("\n");
    // A final partial record can be caused by a crash during append; ignore only that tail.
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i]) continue;
      let entry: { seq: number; tick: Tick; sha256?: string };
      try { entry = JSON.parse(lines[i]); }
      catch (e) { throw new Error(`Invalid WAL JSON at line ${i + 1}`); }
      if (!Number.isSafeInteger(entry.seq) || entry.seq <= 0 ||
          !entry.tick || typeof entry.tick.symbol !== "string" ||
          !Number.isFinite(entry.tick.price) || entry.tick.price <= 0 ||
          !Number.isFinite(entry.tick.timestamp) || entry.tick.timestamp <= 0)
        throw new Error("Invalid durable WAL record");
      if (entry.sha256 !== undefined) {
        const expected = crypto.createHash("sha256")
          .update(JSON.stringify({ seq: entry.seq, tick: entry.tick })).digest("hex");
        if (entry.sha256 !== expected) throw new Error(`WAL checksum mismatch at line ${i + 1}`);
      }
      if (entry.seq <= walSequence) continue;
      if (entry.seq !== walSequence + 1) throw new Error("WAL sequence gap");
      aggregateTick(entry.tick);
      walSequence = entry.seq;
      walRecoveredTicks++;
    }
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
// V2.2: in-flight diagnostics; no changes to WAL, batch identity or SQL semantics.
let dbSqlStartedAt: number | null = null;
let dbSqlRowsInFlight = 0;
let dbFlushStartedAt: number | null = null;
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
// V2: aggregate incoming ticks for longer before creating immutable SQL chunks.
// The durable queue is still checkpointed on every accepted tick, so this
// does not discard tick data. Configure OHLC_DB_FLUSH_MS on Railway if needed.
// 60s default reduces repeated UPSERTs of the same active candle compared
// with the previous 15s interval. Existing retry chunks are never rewritten.
const DB_FLUSH_MS = FRESH_START ? 15_000 : Math.max(15_000, Math.min(120_000, Number(process.env.OHLC_DB_FLUSH_MS || 60_000) || 60_000));
// Fewer database round-trips. Existing durable retry chunks retain their original IDs.
// Keep bounded to avoid excessively large SQL statements.
const DB_CHUNK_ROWS = Math.max(1, Math.min(64, Number(process.env.OHLC_DB_CHUNK_ROWS || 42) || 42));
// V2: adaptive sizing applies ONLY to newly created chunks. Persisted retry
// chunks retain their exact contents and IDs to preserve ledger idempotency.
const DB_MIN_CHUNK_ROWS = Math.min(DB_CHUNK_ROWS, 12);
let adaptiveChunkRows = DB_CHUNK_ROWS;
let consecutiveFastBatches = 0;
let slowDbBatches = 0;
let adaptiveReductions = 0;
let adaptiveIncreases = 0;
const DB_SLOW_MS = 5000;
const DB_FAST_MS = 1500;
const DB_MAX_FLUSH_WORK_MS = 12000;
let lastDbSqlMs: number | null = null;
let lastDbCheckpointMs: number | null = null;
let maxDbSqlMs = 0;
let lastDbBatchRows = 0;
let lastDbBatchAt: number | null = null;
// V4 history priority is opt-in until production recovery/latency tests pass.
// One SQL writer and one durable queue remain the source of truth.
const V4_HISTORY_PRIORITY = process.env.OHLC_V4_HISTORY_PRIORITY === "true";
const V4_RECENT_WINDOW_MS = Math.max(60_000, Math.min(3_600_000, Number(process.env.OHLC_V4_RECENT_WINDOW_MS || 300_000) || 300_000));
const V4_HISTORY_QUOTA = Math.max(1, Math.min(20, Number(process.env.OHLC_V4_HISTORY_QUOTA || 3) || 3));
let historyWritesSinceLive = 0;
let priorityLiveWrites = 0;
let historyWrites = 0;
// V4 stage 4a: drain persisted backlog faster while keeping SQL work bounded.
// This changes scheduling only; WAL format, chunk IDs and SQL semantics are unchanged.
const DB_DRAIN_MS = Math.max(500, Math.min(30_000, Number(process.env.OHLC_DB_DRAIN_MS || 750) || 750));
const DB_DRAIN_BACKLOG_ROWS = Math.max(1, Math.min(1_000_000, Number(process.env.OHLC_DB_DRAIN_BACKLOG_ROWS || 1000) || 1000));
let drainSchedules = 0;
// Stage 4B: opt-in two independent asynchronous SQL lanes; one queue owner.
// No second process touches state.json/ticks.wal. Disabled by default.
// Production safety: writes stay paused unless explicitly enabled.
const HISTORY_PAUSED = (process.env.HISTORY_PAUSED || "true").trim().toLowerCase() !== "false";
// Controlled database probe: at most ONE already-durable SQL chunk per process lifetime.
// Never split immutable chunks: their ledger IDs must remain unchanged.
const DB_PROBE_ONCE = (process.env.OHLC_DB_PROBE_ONCE || "").trim().toLowerCase() === "true";
const DB_PROBE_MAX_ROWS = 64; // Existing immutable chunks may contain up to 64 rows; never split them.
let dbProbeAttempted = false;
let dbProbeSucceeded = false;
const V4_DUAL_WRITER = (process.env.OHLC_V4_DUAL_WRITER || "").trim().toLowerCase() === "true";
let v4LiveInFlight = 0;
let v4HistoryInFlight = 0;
let v4LiveCommitted = 0;
let v4HistoryCommitted = 0;
let v4ConflictDeferrals = 0;
let v4WriterErrors = 0;
// Safe backlog recovery: one SQL writer, bounded work per flush, no queue ID rewrites.
const RECOVERY_MAX_BATCHES = Math.max(1, Math.min(8, Number(process.env.OHLC_RECOVERY_MAX_BATCHES || 8) || 8));
const RECOVERY_NEW_ROWS = FRESH_START ? 512 : Math.max(1, Math.min(512, Number(process.env.OHLC_RECOVERY_NEW_ROWS || 128) || 128));
const RECOVERY_RETRY_THRESHOLD = Math.max(0, Math.min(10000, Number(process.env.OHLC_RECOVERY_RETRY_THRESHOLD || 1000) || 1000));
let recoveryBatchesThisFlush = 0;
let recoveryCheckpointGroups = 0;
let recoveryCheckpointSaved = 0;
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
  if (!flushTimer && !shuttingDown && !HISTORY_PAUSED && !(DB_PROBE_ONCE && dbProbeAttempted)) {
    flushTimer = setTimeout(() => { flushTimer = null; void flushDb(); }, delayMs);
  }
}

function aggregateTick(t: Tick) {
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
}

function queueDbTick(t: Tick) {
  try {
    // Checkpoint first, then derive the next sequence from the durable state.
    // Include a checksum for new records; legacy WAL lines remain readable.
    const nextBytesEstimate = Buffer.byteLength(JSON.stringify({ seq: walSequence + 1, tick: t, sha256: "0".repeat(64) }) + "\n");
    if (walBytes + nextBytesEstimate > MAX_WAL_BYTES) saveQueue();
    const seq = walSequence + 1;
    const sha256 = crypto.createHash("sha256").update(JSON.stringify({ seq, tick: t })).digest("hex");
    const record = JSON.stringify({ seq, tick: t, sha256 }) + "\n";
    const bytes = Buffer.byteLength(record);
    const started = Date.now();
    const fd = fs.openSync(WAL_FILE, "a", 0o600);
    try { fs.writeFileSync(fd, record); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    lastWalSyncMs = Date.now() - started;
    walBytes += bytes;
    walSequence = seq;
    aggregateTick(t);
    // Publish LIVE only after the tick has been fsynced to the WAL.
    liveCandleEngine.accept(t);
  } catch (e) { fatalQueueError(e); }
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
  if (HISTORY_PAUSED || (DB_PROBE_ONCE && dbProbeAttempted)) return;
  if (dbWriting) return;
  dbWriting = true;
  const flushStarted = Date.now();
  dbFlushStartedAt = flushStarted;
  let committedSinceCheckpoint = 0;
  try {
    // Retry immutable failed chunks first. Never merge them with fresh ticks.
    // Drain durable legacy chunks before moving pending rows into new chunks.
    // This avoids a large one-shot queue rewrite near the snapshot size guard.
    // Keep only a bounded number of newly frozen rows per flush.
    if (DB_PROBE_ONCE || retryChunks.length <= RECOVERY_RETRY_THRESHOLD) {
      const limit = DB_PROBE_ONCE ? pending.size : Math.min(pending.size, RECOVERY_NEW_ROWS);
      const snapshot: Array<[string, TickBatch]> = [];
      for (const entry of pending.entries()) {
        if (snapshot.length >= limit) break;
        snapshot.push(entry);
      }
      for (const [key] of snapshot) pending.delete(key);
      const chunkRowsForThisFlush = adaptiveChunkRows;
      for (let i = 0; i < snapshot.length; i += chunkRowsForThisFlush)
        retryChunks.push(snapshot.slice(i, i + chunkRowsForThisFlush).map(([, batch]) => ({ id: crypto.randomUUID(), batch })));
      // Persist IDs before any SQL; on error stop rather than risk unprotected writes.
      if (snapshot.length) try { saveQueue(); } catch (e) { fatalQueueError(e); }
    }
    recoveryBatchesThisFlush = 0;
    while (retryChunks.length) {
      if (!DB_PROBE_ONCE && recoveryBatchesThisFlush >= RECOVERY_MAX_BATCHES) break;
      if (DB_PROBE_ONCE && dbProbeAttempted) break;
      // Never split or mutate immutable chunks. Only choose a recent chunk when
      // it cannot overtake an older write to the same symbol/interval/bucket.
      const selectedIndex = V4_HISTORY_PRIORITY
        ? chooseNextChunk(retryChunks, Date.now(), V4_RECENT_WINDOW_MS, historyWritesSinceLive, V4_HISTORY_QUOTA)
        : 0;
      const part = retryChunks[selectedIndex];
      if (DB_PROBE_ONCE) {
        // Refuse oversized legacy chunks instead of modifying durable batch IDs.
        if (part.length > DB_PROBE_MAX_ROWS) {
          dbProbeAttempted = true;
          console.error(`[MASTER PROBE] refused: chunk has ${part.length} rows; limit=${DB_PROBE_MAX_ROWS}; no SQL sent`);
          break;
        }
        dbProbeAttempted = true; // before SQL, including on timeout/error
        console.warn(`[MASTER PROBE] one SQL attempt: ${part.length} durable rows`);
      }
      const isPriorityLive = selectedIndex > 0;
      const started = Date.now();
      dbSqlStartedAt = started;
      dbSqlRowsInFlight = part.length;
      try {
        await writeBatches(part);
        const sqlFinished = Date.now();
        lastDbSqlMs = sqlFinished - started;
        maxDbSqlMs = Math.max(maxDbSqlMs, lastDbSqlMs);
        lastDbBatchRows = part.length;
        lastDbBatchAt = sqlFinished;
        retryChunks.splice(selectedIndex, 1);
        if (isPriorityLive) { priorityLiveWrites++; historyWritesSinceLive = 0; }
        else { historyWrites++; historyWritesSinceLive++; }
        // SQL is committed. Defer the expensive full state.json fsync until the
        // bounded group ends. If the process crashes first, replaying the older
        // durable checkpoint is safe: the SQL ledger deduplicates batch IDs.
        // Never change IDs or split existing retry chunks.
        committedSinceCheckpoint++;
        lastDbWriteMs = Date.now() - started;
        lastDbSuccessAt = Date.now();
        successfulDbWrites++;
        recoveryBatchesThisFlush++;
        if (DB_PROBE_ONCE) dbProbeSucceeded = true;
        consecutiveDbFailures = 0;
        if (lastDbSqlMs > DB_SLOW_MS) {
          slowDbBatches++;
          consecutiveFastBatches = 0;
          const smaller = Math.max(DB_MIN_CHUNK_ROWS, Math.floor(adaptiveChunkRows / 2));
          if (smaller < adaptiveChunkRows) {
            adaptiveChunkRows = smaller;
            adaptiveReductions++;
            console.warn(`[MASTER] adaptive DB chunk reduced to ${adaptiveChunkRows} after ${lastDbSqlMs}ms SQL`);
          }
        } else if (lastDbSqlMs < DB_FAST_MS) {
          consecutiveFastBatches++;
          if (consecutiveFastBatches >= 12 && adaptiveChunkRows < DB_CHUNK_ROWS) {
            adaptiveChunkRows = Math.min(DB_CHUNK_ROWS, adaptiveChunkRows + 4);
            adaptiveIncreases++;
            consecutiveFastBatches = 0;
          }
        } else {
          consecutiveFastBatches = 0;
        }
        if ((lastDbSqlMs ?? 0) > 5000 || (lastDbCheckpointMs ?? 0) > 1000)
          console.warn(`[MASTER] slow DB upsert: sql=${lastDbSqlMs}ms, checkpoint=${lastDbCheckpointMs}ms, total=${lastDbWriteMs}ms, rows=${part.length}, retryChunks=${retryChunks.length}, pending=${pending.size}`);
        // Yield between chunks during overload. Keep all remaining chunks durable.
        if (!shuttingDown && Date.now() - flushStarted >= DB_MAX_FLUSH_WORK_MS) break;
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
    // Exactly one full durable checkpoint per bounded group of committed SQL
    // chunks, instead of one 60+ MiB rewrite per successful SQL statement.
    // WAL fsync remains per accepted tick and is unchanged.
    if (committedSinceCheckpoint > 0) {
      const checkpointStarted = Date.now();
      try { saveQueue(); } catch (e) { fatalQueueError(e); }
      lastDbCheckpointMs = Date.now() - checkpointStarted;
      recoveryCheckpointGroups++;
      recoveryCheckpointSaved += committedSinceCheckpoint;
    }
    dbWriting = false;
    dbSqlStartedAt = null;
    dbSqlRowsInFlight = 0;
    dbFlushStartedAt = null;
    if (pending.size || retryChunks.length) {
      const retryMs = consecutiveDbFailures
        ? Math.min(DB_RETRY_MAX_MS, DB_FLUSH_MS * 2 ** Math.min(consecutiveDbFailures - 1, 3))
        : (retryChunks.reduce((n, c) => n + c.length, 0) + pending.size >= DB_DRAIN_BACKLOG_ROWS ? DB_DRAIN_MS : DB_FLUSH_MS);
      if (!consecutiveDbFailures && retryMs === DB_DRAIN_MS) drainSchedules++;
      scheduleFlush(retryMs);
    }
  }
}

// Stage 4B: parallel SQL *lanes* (not separate processes).
// The collector remains the only owner of the durable queue and checkpoint.
// A chunk is never removed until its SQL transaction commits. In-flight chunks
// stay in the checkpoint and retain the same batch IDs for crash replay.
async function flushDbV4() {
  if (HISTORY_PAUSED || DB_PROBE_ONCE) return; // probe always uses the single SQL lane
  if (dbWriting) return;
  dbWriting = true;
  dbFlushStartedAt = Date.now();
  const startedAt = Date.now();
  const lockedKeys = new Set<string>();
  const inFlight = new Set<DurableBatch[]>();
  let failure = false;
  try {
    const snapshot = [...pending.entries()];
    pending.clear();
    const chunkSize = adaptiveChunkRows;
    for (let i = 0; i < snapshot.length; i += chunkSize)
      retryChunks.push(snapshot.slice(i, i + chunkSize).map(([, batch]) => ({ id: crypto.randomUUID(), batch })));
    // Persist immutable IDs before starting either lane.
    try { saveQueue(); } catch (e) { fatalQueueError(e); }

    const rowKey = (row: DurableBatch) => batchKey(row.batch);
    const recent = (chunk: DurableBatch[]) => chunk.some(row =>
      row.batch.bucket >= Date.now() - V4_RECENT_WINDOW_MS);

    function claim(lane: "live" | "history"): DurableBatch[] | null {
      // Check every earlier chunk (including in-flight) to prevent a later
      // batch for the same candle from overtaking an earlier one.
      for (let i = 0; i < retryChunks.length; i++) {
        const chunk = retryChunks[i];
        if (inFlight.has(chunk)) continue;
        if (recent(chunk) !== (lane === "live")) continue;
        const keys = new Set(chunk.map(rowKey));
        if ([...keys].some(key => lockedKeys.has(key))) { v4ConflictDeferrals++; continue; }
        let overtakes = false;
        for (let j = 0; j < i && !overtakes; j++) {
          for (const row of retryChunks[j]) {
            if (keys.has(rowKey(row))) { overtakes = true; break; }
          }
        }
        if (overtakes) { v4ConflictDeferrals++; continue; }
        inFlight.add(chunk);
        for (const key of keys) lockedKeys.add(key);
        if (lane === "live") v4LiveInFlight++;
        else v4HistoryInFlight++;
        return chunk;
      }
      return null;
    }

    async function laneLoop(lane: "live" | "history") {
      while (!failure && Date.now() - startedAt < DB_MAX_FLUSH_WORK_MS) {
        const chunk = claim(lane);
        if (!chunk) return;
        const keys = new Set(chunk.map(rowKey));
        const started = Date.now();
        try {
          await writeBatches(chunk);
          const duration = Date.now() - started;
          lastDbSqlMs = duration;
          maxDbSqlMs = Math.max(maxDbSqlMs, duration);
          lastDbWriteMs = duration;
          lastDbBatchRows = chunk.length;
          lastDbBatchAt = Date.now();
          lastDbSuccessAt = Date.now();
          successfulDbWrites++;
          consecutiveDbFailures = 0;
          if (lane === "live") { v4LiveCommitted++; priorityLiveWrites++; }
          else { v4HistoryCommitted++; historyWrites++; }
          const idx = retryChunks.indexOf(chunk);
          if (idx < 0) throw new Error("V4 durable chunk disappeared during SQL write");
          retryChunks.splice(idx, 1);
          // The SQL ledger makes a crash before this checkpoint idempotent.
          const checkpointStarted = Date.now();
          try { saveQueue(); } catch (e) { fatalQueueError(e); }
          lastDbCheckpointMs = Date.now() - checkpointStarted;
          if (duration > DB_SLOW_MS) {
            slowDbBatches++;
            consecutiveFastBatches = 0;
            const smaller = Math.max(DB_MIN_CHUNK_ROWS, Math.floor(adaptiveChunkRows / 2));
            if (smaller < adaptiveChunkRows) { adaptiveChunkRows = smaller; adaptiveReductions++; }
          } else if (duration < DB_FAST_MS) {
            consecutiveFastBatches++;
            if (consecutiveFastBatches >= 12 && adaptiveChunkRows < DB_CHUNK_ROWS) {
              adaptiveChunkRows = Math.min(DB_CHUNK_ROWS, adaptiveChunkRows + 4);
              adaptiveIncreases++; consecutiveFastBatches = 0;
            }
          } else consecutiveFastBatches = 0;
        } catch (e: any) {
          failure = true;
          v4WriterErrors++;
          failedDbWrites++;
          consecutiveDbFailures++;
          lastDbFailureAt = Date.now();
          console.error(`[MASTER V4] ${lane} SQL failed; durable chunk retained (${chunk.length} rows)`, e?.message || e);
        } finally {
          inFlight.delete(chunk);
          for (const key of keys) lockedKeys.delete(key);
          if (lane === "live") v4LiveInFlight--;
          else v4HistoryInFlight--;
        }
      }
    }
    await Promise.all([laneLoop("live"), laneLoop("history")]);
  } finally {
    dbWriting = false;
    dbFlushStartedAt = null;
    dbSqlStartedAt = null;
    dbSqlRowsInFlight = 0;
    if (pending.size || retryChunks.length) {
      const remaining = pending.size + retryChunks.reduce((n, c) => n + c.length, 0);
      const delay = failure || consecutiveDbFailures
        ? Math.min(DB_RETRY_MAX_MS, DB_FLUSH_MS * 2 ** Math.min(Math.max(consecutiveDbFailures - 1, 0), 3))
        : remaining >= DB_DRAIN_BACKLOG_ROWS ? DB_DRAIN_MS : DB_FLUSH_MS;
      if (!failure && delay === DB_DRAIN_MS) drainSchedules++;
      scheduleFlush(delay);
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
    // Fresh-start guard: ignore historical/replayed provider ticks from before this process started.
    if (FRESH_START && timestamp < FRESH_START_AT) { staleTicksRejected++; continue; }
    const last=lastAcceptedTimestamp.get(symbol);
    if(last !== undefined && timestamp < last){ staleTicksRejected++; staleTicksBySymbol.set(symbol, (staleTicksBySymbol.get(symbol) || 0) + 1); continue; }
    const tick={symbol,price,timestamp};
    // Durability first: do not expose or acknowledge a tick before WAL fsync.
    // queueDbTick stops the process if the durable write fails.
    queueDbTick(tick);
    lastAcceptedTimestamp.set(symbol,timestamp);
    latestTicks[symbol]=tick;
    recordAcceptedTick(tick);
    broadcastTick(tick);
  }
} catch(e){console.error("[MASTER] parse",e);} });
// Count event names only, not raw payloads (which might contain credentials).
socket.onAny((event:string)=>{ rawEventCounts.set(event,(rawEventCounts.get(event)||0)+1); });
// Socket.IO automatically retries transport failures, but an explicit server-side
// disconnect ("io server disconnect") disables automatic reconnection. Reconnect
// that case ourselves, without creating another socket or another API-key session.
let providerReconnectTimer: NodeJS.Timeout | null = null;
function scheduleProviderReconnect(delayMs = 5000) {
  if (shuttingDown || providerReconnectTimer || socket.connected) return;
  providerReconnectTimer = setTimeout(() => {
    providerReconnectTimer = null;
    if (!shuttingDown && !socket.connected) {
      console.warn("[MASTER] retrying Live-Rates streaming connection");
      socket.connect();
    }
  }, delayMs);
  providerReconnectTimer.unref();
}
socket.on("disconnect", reason => {
  lastDisconnectAt = Date.now();
  liveRatesConnected = false;
  broadcastStatus({provider:"live-rates",connected:false,reason,mode:"MASTER_150"});
  if (reason === "io server disconnect") scheduleProviderReconnect();
});
socket.on("connect_error", e => {
  liveRatesConnected = false;
  providerError = e.message;
  console.error("[MASTER] connect", e.message);
});
// Backstop for a connection that remains down despite Socket.IO's own retries.
// Only one socket is ever used, so the provider's one-connection-per-key rule holds.
const providerReconnectWatchdog = setInterval(() => {
  if (!shuttingDown && !socket.connected && !socket.active)
    scheduleProviderReconnect(1000);
}, 30_000);
providerReconnectWatchdog.unref();

const server=http.createServer((req,res)=>{
  const origin=req.headers.origin||"*"; res.setHeader("Access-Control-Allow-Origin",origin);res.setHeader("Vary","Origin");res.setHeader("Access-Control-Allow-Methods","GET, OPTIONS");res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS"){res.writeHead(204);res.end();return;}
  const url=new URL(req.url||"/",`http://${req.headers.host||"localhost"}`);
  // V4: independent, read-only LIVE OHLC view. Never mutates WAL or retry chunks.
  // Read-only durable tail: bridge SQL backlog to the chart without mutating WAL,
  // retry IDs, pending batches or the checkpoint. No synthetic candles.
  if(url.pathname==="/api/market/durable-candles") {
    const secret=process.env.OHLC_LIVE_READ_TOKEN;
    if(secret && req.headers["x-ohlc-live-token"]!==secret){res.writeHead(401);res.end();return;}
    const symbol=normalizeMarketSymbol(url.searchParams.get("symbol")||"");
    const interval=url.searchParams.get("interval")||"1min";
    const frame=frames.find(f=>f[0]===interval);
    if(!PROVIDER_SET.has(symbol)||!frame){res.writeHead(400,{"Content-Type":"application/json"});res.end(JSON.stringify({status:"error",message:"Invalid symbol or interval"}));return;}
    const requested=Number(url.searchParams.get("limit")||"300");
    const limit=Math.max(1,Math.min(2000,Number.isFinite(requested)?Math.floor(requested):300));
    // A recent-window filter keeps this endpoint bounded in response size.
    const cutoff=Date.now()-Math.min(7*86_400_000,Math.max(6*3_600_000,limit*frame[1]*2));
    const merged=new Map<number,TickBatch>();
    const accept=(b:TickBatch)=>{
      if(b.symbol!==symbol||b.interval!==interval||b.bucket<cutoff)return;
      const old=merged.get(b.bucket);
      merged.set(b.bucket,old?mergeBatch(old,b):b);
    };
    for(const b of pending.values())accept(b);
    for(const chunk of retryChunks)for(const row of chunk)accept(row.batch);
    const values=[...merged.values()].sort((a,b)=>a.bucket-b.bucket).slice(-limit).map(b=>({
      datetime:new Date(b.bucket).toISOString().replace("T"," ").slice(0,19),
      open:String(b.open),high:String(b.high),low:String(b.low),close:String(b.close),volume:String(b.ticks),
    }));
    res.writeHead(200,{"Content-Type":"application/json","Cache-Control":"no-store"});
    res.end(JSON.stringify({status:"ok",source:"collector-durable-queue",symbol,interval,count:values.length,values}));return;
  }
  if(url.pathname==="/api/market/live-candles") {
    const secret=process.env.OHLC_LIVE_READ_TOKEN;
    if(secret && req.headers["x-ohlc-live-token"]!==secret){res.writeHead(401);res.end();return;}
    const symbol=normalizeMarketSymbol(url.searchParams.get("symbol")||"");
    const interval=url.searchParams.get("interval")||"1min";
    const frame=frames.find(f=>f[0]===interval);
    if(!PROVIDER_SET.has(symbol)||!frame){res.writeHead(400,{"Content-Type":"application/json"});res.end(JSON.stringify({status:"error",message:"Invalid symbol or interval"}));return;}
    const now=Date.now();
    const currentBucket=Math.floor(now/frame[1])*frame[1];
    // Independent live state: no retry queue scan and no SQL dependency.
    const live = liveCandleEngine.current(symbol, interval as import("../lib/market/live-candle-engine").LiveInterval, now);
    res.writeHead(200,{"Content-Type":"application/json","Cache-Control":"no-store"});
    res.end(JSON.stringify({status:"ok",source:"collector-memory",symbol,interval,
      connected:liveRatesConnected,generatedAt:new Date(now).toISOString(),
      lastTickAgeMs:live?now-live.lastAt:null,
      candle:live?{datetime:new Date(live.bucket).toISOString().replace("T"," ").slice(0,19),
        open:String(live.open),high:String(live.high),low:String(live.low),
        close:String(live.close),volume:String(live.ticks),firstAt:live.firstAt,lastAt:live.lastAt}:null}));return;
  }
  if(url.pathname==="/health/quick") {
    res.writeHead(200,{"Content-Type":"application/json","Cache-Control":"no-store"});
    res.end(JSON.stringify({ok:true,buildTag:"fx-fresh-start-v1-20261106",freshStart:FRESH_START,freshStartAt:FRESH_START?FRESH_START_AT:null,connected:liveRatesConnected,historyPaused:HISTORY_PAUSED,dbProbeOnce:DB_PROBE_ONCE,dbProbeAttempted,dbProbeSucceeded,dbWriting,
      pendingRows:pending.size,retryChunks:retryChunks.length,recoveryMaxBatches:RECOVERY_MAX_BATCHES,recoveryNewRows:RECOVERY_NEW_ROWS,recoveryCheckpointGroups,recoveryCheckpointSaved,dbDrainMs:DB_DRAIN_MS,dbRetryRows:retryChunks.reduce((n,c)=>n+c.length,0),dbBacklogRows:pending.size+retryChunks.reduce((n,c)=>n+c.length,0),liveCandles:liveCandleEngine.size,
      successfulDbWrites,failedDbWrites,lastDbSqlMs,lastDbSuccessAt,
      walBytes,walSequence,walRecoveredTicks,lastWalSyncMs,
      checkpointAt:queueCheckpointAt,checkpointBytes:queueCheckpointBytes}));return;
  }
  if(url.pathname==="/health"){res.writeHead(200,{"Content-Type":"application/json","Cache-Control":"no-store"});res.end(JSON.stringify({ok:true,mode:"MASTER_150",freshStart:FRESH_START,freshStartAt:FRESH_START?FRESH_START_AT:null,connected:liveRatesConnected,historyPaused:HISTORY_PAUSED,configured:PROVIDER_INSTRUMENTS.length,providerSubscriptions:providerSubscriptions(),forexSlashSubscriptions,diagnostics:{rawEventCounts:Object.fromEntries(rawEventCounts),rawSymbolCounts:Object.fromEntries(rawSymbolCounts),rawMessageShapes:Object.fromEntries(rawMessageShapes),lastRateAt,lastConnectAt,lastDisconnectAt},clients:totalClients(),receivedSymbols:Object.keys(latestTicks).length,latestTicks,dbWriting,dbPending:[...new Set([...pending.values()].map(b=>b.symbol))],dbPendingRows:pending.size,dbRetryRows:retryChunks.reduce((n,c)=>n+c.length,0),durableQueue:{directory:QUEUE_DIR,checkpointAt:queueCheckpointAt,checkpointBytes:queueCheckpointBytes,lastCheckpointMs:lastQueueCheckpointMs,maxCheckpointMs:maxQueueCheckpointMs,slowCheckpoints:slowQueueCheckpoints,recoveredRows:queueRecoveredRows,walBytes,walSequence,walRecoveredTicks,lastWalSyncMs,fatalError:queueFatalError},dbMetrics:{version:"4.0-priority-preview",v4HistoryPriority:V4_HISTORY_PRIORITY,v4DualWriter:V4_DUAL_WRITER,historyPaused:HISTORY_PAUSED,dbProbeOnce:DB_PROBE_ONCE,dbProbeAttempted,dbProbeSucceeded,v4LiveInFlight,v4HistoryInFlight,v4LiveCommitted,v4HistoryCommitted,v4ConflictDeferrals,v4WriterErrors,dbDrainMs:DB_DRAIN_MS,dbDrainBacklogRows:DB_DRAIN_BACKLOG_ROWS,drainSchedules,recoveryCheckpointGroups,recoveryCheckpointSaved,v4RecentWindowMs:V4_RECENT_WINDOW_MS,v4HistoryQuota:V4_HISTORY_QUOTA,priorityLiveWrites,historyWrites,dbSqlStartedAt,dbSqlAgeMs:dbSqlStartedAt===null?null:Date.now()-dbSqlStartedAt,dbSqlRowsInFlight,dbFlushStartedAt,dbFlushAgeMs:dbFlushStartedAt===null?null:Date.now()-dbFlushStartedAt,flushMs:DB_FLUSH_MS,chunkRows:DB_CHUNK_ROWS,adaptiveChunkRows,slowDbBatches,adaptiveReductions,adaptiveIncreases,successfulDbWrites,failedDbWrites,consecutiveDbFailures,lastDbWriteMs,lastDbSqlMs,lastDbCheckpointMs,maxDbSqlMs,lastDbBatchRows,lastDbBatchAt,lastDbSuccessAt,lastDbFailureAt,shutdownFlushFailed},ingestionDiagnostics:ingestionDiagnostics(),ohlcMetrics:{staleTicksRejected,staleTicksBySymbol:Object.fromEntries(staleTicksBySymbol),acceptedTicksBySymbol:Object.fromEntries(acceptedTicksBySymbol),invalidTimestampsRejected,futureTimestampsRejected,invalidPricesRejected,activeCandles:[...pending.values()].filter(b=>b.bucket+Number(frames.find(f=>f[0]===b.interval)?.[1]??0)>Date.now()).length,closedPendingCandles:[...pending.values()].filter(b=>b.bucket+Number(frames.find(f=>f[0]===b.interval)?.[1]??0)<=Date.now()).length},providerInfo:providerInfo||null,providerError:providerError||null,failedDbWrites,receivedCount:Object.fromEntries(receivedCount),unrecognizedSymbols:Object.fromEntries(unrecognizedSymbols),missingConfiguredSymbols:PROVIDER_INSTRUMENTS.filter(s=>!latestTicks[s])}));return;}
  const m=url.pathname.match(/^\/api\/(?:market\/)?([a-z0-9]+)\/stream$/i);
  if(m){ const symbol=normalizeMarketSymbol(m[1]); if(!PROVIDER_SET.has(symbol)){res.writeHead(404,{"Content-Type":"application/json"});res.end(JSON.stringify({ok:false,error:"Unknown symbol"}));return;} res.writeHead(200,{"Content-Type":"text/event-stream; charset=utf-8","Cache-Control":"no-cache, no-transform",Connection:"keep-alive","X-Accel-Buffering":"no","Access-Control-Allow-Origin":origin,Vary:"Origin"});res.write("retry: 3000\n\n");res.write(`event: status\ndata: ${JSON.stringify({provider:"live-rates",connected:liveRatesConnected,symbol,mode:"MASTER_150"})}\n\n`);if(latestTicks[symbol])res.write(`event: tick\ndata: ${JSON.stringify(latestTicks[symbol])}\n\n`);const set=clientSet(symbol);set.add(res);const keep=setInterval(()=>{try{res.write(`: keepalive ${Date.now()}\n\n`);}catch{}},15000);req.on("close",()=>{clearInterval(keep);set.delete(res);});return; }
  res.writeHead(200,{"Content-Type":"application/json"});res.end(JSON.stringify({ok:true,service:"FX Trade Master Market Collector",mode:"MASTER_150",configured:PROVIDER_INSTRUMENTS.length,health:"/health",streamPattern:"/api/market/{symbol}/stream"}));
});
// Fail startup if the persistent volume is absent, read-only, or contains invalid data.
try { recoverQueue(); } catch (e) { fatalQueueError(e); }
server.listen(PORT,"0.0.0.0",()=>{
  console.log(`[MASTER] build=fx-fresh-start-v1-20261106; HTTP/SSE :${PORT}; OHLC flush=${DB_FLUSH_MS}ms; chunk max=${DB_CHUNK_ROWS}`);
  if (HISTORY_PAUSED) console.warn("[MASTER] HISTORY_PAUSED=true: SQL writes disabled; WAL and LIVE remain active");
  else if (DB_PROBE_ONCE) console.warn("[MASTER PROBE] one durable chunk (max 64 rows) then SQL stops until restart");
  if (!HISTORY_PAUSED && !DB_PROBE_ONCE) console.warn(`[MASTER RECOVERY] bounded SQL drain enabled; maxBatches=${RECOVERY_MAX_BATCHES}; newRows=${RECOVERY_NEW_ROWS}; dualWriter=${V4_DUAL_WRITER}`);
  if (FRESH_START) console.warn(`[MASTER FRESH START] new queue=${QUEUE_DIR}; start=${new Date(FRESH_START_AT).toISOString()}; old queue preserved`);
  if (pending.size || retryChunks.length) scheduleFlush(1000);
  socket.connect();
});
async function shutdown(signal:string){
  console.log(`[MASTER] ${signal}: stopping new ticks and flushing pending candles`);
  if (shuttingDown) return;
  shuttingDown=true;
  if (providerReconnectTimer) { clearTimeout(providerReconnectTimer); providerReconnectTimer=null; }
  clearInterval(providerReconnectWatchdog);
  socket.removeAllListeners("rates");
  socket.disconnect();
  if(flushTimer){clearTimeout(flushTimer);flushTimer=null;}
  // An in-flight flush must finish before a final snapshot is taken.
  const waitUntil=Date.now()+20_000;
  while(dbWriting && Date.now()<waitUntil) await new Promise(r=>setTimeout(r,100));
  if(dbWriting){shutdownFlushFailed=true;console.error("[MASTER] shutdown: DB write still in progress");}
  else {
    // Flush pending batches once; any failures remain durable on the mounted volume.
    if (!HISTORY_PAUSED && !DB_PROBE_ONCE)
      await flushDb();
    else
      console.log("[MASTER] shutdown: SQL disabled by pause/probe guard; preserving durable queue");
    if(!HISTORY_PAUSED && !DB_PROBE_ONCE && (pending.size || retryChunks.length)){shutdownFlushFailed=true;console.error(`[MASTER] shutdown: ${pending.size} pending candles, ${retryChunks.length} retry chunks`);}
  }
  for(const set of clientsBySymbol.values())for(const c of set)try{c.end();}catch{}
  await new Promise<void>(r=>server.close(()=>r()));
  await prisma.$disconnect();
  process.exit(shutdownFlushFailed?1:0);
}
process.on("SIGINT",()=>void shutdown("SIGINT"));process.on("SIGTERM",()=>void shutdown("SIGTERM"));
