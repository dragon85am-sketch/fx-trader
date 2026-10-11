import { PrismaClient } from "@prisma/client";
import { io } from "socket.io-client";
import dotenv from "dotenv";
import http from "node:http";
import crypto from "node:crypto";
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
let invalidTimestampsRejected = 0;
let futureTimestampsRejected = 0;
let invalidPricesRejected = 0;
let shutdownFlushFailed = false;
const MAX_FUTURE_TICK_MS = 60_000;

const clientsBySymbol = new Map<string, Set<http.ServerResponse>>();
const pending = new Map<string, TickBatch>();
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
const DB_CHUNK_ROWS = 14;
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
  scheduleFlush();
}

async function writeBatches(batches: TickBatch[]) {
  if (!batches.length) return;
  // Small, bounded upsert: prevents enormous SQL and limits lock duration.
  const params: unknown[] = [];
  const values = batches.map((b) => {
    const base = params.length;
    params.push(crypto.randomUUID(), b.symbol, b.interval, new Date(b.bucket),
      b.open, b.high, b.low, b.close, b.ticks);
    const p = Array.from({ length: 9 }, (_, i) => `$${base + i + 1}`);
    return `(${p.join(",")},NOW(),NOW())`;
  }).join(",");
  await prisma.$executeRawUnsafe(
    `INSERT INTO "MarketCandle" ("id","symbol","interval","bucket","open","high","low","close","ticks","createdAt","updatedAt")
     VALUES ${values}
     ON CONFLICT ("symbol","interval","bucket") DO UPDATE SET
       "high"=GREATEST("MarketCandle"."high",EXCLUDED."high"),
       "low"=LEAST("MarketCandle"."low",EXCLUDED."low"),
       "close"=EXCLUDED."close",
       "ticks"="MarketCandle"."ticks"+EXCLUDED."ticks",
       "updatedAt"=NOW()`,
    ...params
  );
}

async function flushDb() {
  if (dbWriting) return;
  dbWriting = true;
  try {
    // Snapshot once; new ticks stay in pending for the next cycle.
    const snapshot = [...pending.entries()];
    pending.clear();
    for (let i = 0; i < snapshot.length; i += DB_CHUNK_ROWS) {
      const part = snapshot.slice(i, i + DB_CHUNK_ROWS);
      const started = Date.now();
      try {
        await writeBatches(part.map(([, b]) => b));
        lastDbWriteMs = Date.now() - started;
        lastDbSuccessAt = Date.now();
        successfulDbWrites++;
        consecutiveDbFailures = 0;
        if (lastDbWriteMs > 5000) console.warn(`[MASTER] slow DB upsert: ${lastDbWriteMs}ms, rows=${part.length}`);
      } catch (e: any) {
        failedDbWrites++;
        consecutiveDbFailures++;
        lastDbFailureAt = Date.now();
        lastDbWriteMs = Date.now() - started;
        // Requeue failed AND unattempted chunks; never drop them silently.
        for (const [k, old] of snapshot.slice(i)) {
          const fresh = pending.get(k);
          pending.set(k, fresh ? mergeBatch(old, fresh) : old);
        }
        console.error(`[MASTER] DB batch failed; queued retry (${part.length} rows), duration=${lastDbWriteMs}ms`, e?.message || e);
        break;
      }
    }
  } finally {
    dbWriting = false;
    if (pending.size) {
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
    if(timestamp > Date.now() + MAX_FUTURE_TICK_MS){ futureTimestampsRejected++; continue; }
    const last=lastAcceptedTimestamp.get(symbol);
    if(last !== undefined && timestamp < last){ staleTicksRejected++; continue; }
    lastAcceptedTimestamp.set(symbol,timestamp);
    const tick={symbol,price,timestamp};
    latestTicks[symbol]=tick;broadcastTick(tick);queueDbTick(tick);
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
  if(url.pathname==="/health"){res.writeHead(200,{"Content-Type":"application/json","Cache-Control":"no-store"});res.end(JSON.stringify({ok:true,mode:"MASTER_150",connected:liveRatesConnected,configured:PROVIDER_INSTRUMENTS.length,providerSubscriptions:providerSubscriptions(),forexSlashSubscriptions,diagnostics:{rawEventCounts:Object.fromEntries(rawEventCounts),rawSymbolCounts:Object.fromEntries(rawSymbolCounts),rawMessageShapes:Object.fromEntries(rawMessageShapes),lastRateAt,lastConnectAt,lastDisconnectAt},clients:totalClients(),receivedSymbols:Object.keys(latestTicks).length,latestTicks,dbWriting,dbPending:[...new Set([...pending.values()].map(b=>b.symbol))],dbPendingRows:pending.size,dbMetrics:{flushMs:DB_FLUSH_MS,chunkRows:DB_CHUNK_ROWS,successfulDbWrites,failedDbWrites,consecutiveDbFailures,lastDbWriteMs,lastDbSuccessAt,lastDbFailureAt,shutdownFlushFailed},ohlcMetrics:{staleTicksRejected,invalidTimestampsRejected,futureTimestampsRejected,invalidPricesRejected,activeCandles:[...pending.values()].filter(b=>b.bucket+Number(frames.find(f=>f[0]===b.interval)?.[1]??0)>Date.now()).length,closedPendingCandles:[...pending.values()].filter(b=>b.bucket+Number(frames.find(f=>f[0]===b.interval)?.[1]??0)<=Date.now()).length},providerInfo:providerInfo||null,providerError:providerError||null,failedDbWrites,receivedCount:Object.fromEntries(receivedCount),unrecognizedSymbols:Object.fromEntries(unrecognizedSymbols),missingConfiguredSymbols:PROVIDER_INSTRUMENTS.filter(s=>!latestTicks[s])}));return;}
  const m=url.pathname.match(/^\/api\/(?:market\/)?([a-z0-9]+)\/stream$/i);
  if(m){ const symbol=normalizeMarketSymbol(m[1]); if(!PROVIDER_SET.has(symbol)){res.writeHead(404,{"Content-Type":"application/json"});res.end(JSON.stringify({ok:false,error:"Unknown symbol"}));return;} res.writeHead(200,{"Content-Type":"text/event-stream; charset=utf-8","Cache-Control":"no-cache, no-transform",Connection:"keep-alive","X-Accel-Buffering":"no","Access-Control-Allow-Origin":origin,Vary:"Origin"});res.write("retry: 3000\n\n");res.write(`event: status\ndata: ${JSON.stringify({provider:"live-rates",connected:liveRatesConnected,symbol,mode:"MASTER_150"})}\n\n`);if(latestTicks[symbol])res.write(`event: tick\ndata: ${JSON.stringify(latestTicks[symbol])}\n\n`);const set=clientSet(symbol);set.add(res);const keep=setInterval(()=>{try{res.write(`: keepalive ${Date.now()}\n\n`);}catch{}},15000);req.on("close",()=>{clearInterval(keep);set.delete(res);});return; }
  res.writeHead(200,{"Content-Type":"application/json"});res.end(JSON.stringify({ok:true,service:"FX Trade Master Market Collector",mode:"MASTER_150",configured:PROVIDER_INSTRUMENTS.length,health:"/health",streamPattern:"/api/market/{symbol}/stream"}));
});
server.listen(PORT,"0.0.0.0",()=>{console.log(`[MASTER] HTTP/SSE :${PORT}`);socket.connect();});
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
    // Flush pending batches once; failed batches stay in RAM and cannot survive a container restart.
    await flushDb();
    if(pending.size){shutdownFlushFailed=true;console.error(`[MASTER] shutdown: ${pending.size} unsaved OHLC batches`);}
  }
  for(const set of clientsBySymbol.values())for(const c of set)try{c.end();}catch{}
  await new Promise<void>(r=>server.close(()=>r()));
  await prisma.$disconnect();
  process.exit(shutdownFlushFailed?1:0);
}
process.on("SIGINT",()=>void shutdown("SIGINT"));process.on("SIGTERM",()=>void shutdown("SIGTERM"));
