import { PrismaClient } from "@prisma/client";
import { io } from "socket.io-client";
import dotenv from "dotenv";
import http from "node:http";
import crypto from "node:crypto";
import { getCollectorSymbols, normalizeMarketSymbol } from "../lib/market/master-symbols";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const prisma = new PrismaClient();
const key = process.env.LIVE_RATES_API_KEY;
if (!key) throw new Error("Missing LIVE_RATES_API_KEY");

const PORT = Number(process.env.PORT || 8080);
const PROVIDER_INSTRUMENTS = getCollectorSymbols(process.env.LIVE_RATES_INSTRUMENTS);
const PROVIDER_SET = new Set(PROVIDER_INSTRUMENTS);

const frames = [
  ["1min", 60_000], ["5min", 300_000], ["15min", 900_000],
  ["30min", 1_800_000], ["1h", 3_600_000], ["4h", 14_400_000], ["1day", 86_400_000],
] as const;

type Tick = { symbol: string; price: number; timestamp: number };
type TickBatch = { symbol: string; open: number; high: number; low: number; close: number; timestamp: number; ticks: number };

const latestTicks: Record<string, Tick> = {};
const clientsBySymbol = new Map<string, Set<http.ServerResponse>>();
const pending = new Map<string, TickBatch>();
let flushTimer: NodeJS.Timeout | null = null;
let dbWriting = false;
let liveRatesConnected = false;
let providerInfo = "";
let providerError = "";

function clientSet(symbol: string) {
  let set = clientsBySymbol.get(symbol);
  if (!set) { set = new Set(); clientsBySymbol.set(symbol, set); }
  return set;
}
function totalClients() { let n=0; for (const s of clientsBySymbol.values()) n+=s.size; return n; }
function normalizeTimestamp(value: unknown) { const n=Number(value); return !Number.isFinite(n)||n<=0 ? Date.now() : n<10_000_000_000 ? n*1000 : n; }

function queueDbTick(t: Tick) {
  const p = pending.get(t.symbol);
  if (!p) pending.set(t.symbol,{symbol:t.symbol,open:t.price,high:t.price,low:t.price,close:t.price,timestamp:t.timestamp,ticks:1});
  else { p.high=Math.max(p.high,t.price); p.low=Math.min(p.low,t.price); p.close=t.price; p.timestamp=t.timestamp; p.ticks+=1; }
  if (!flushTimer) flushTimer=setTimeout(()=>{ flushTimer=null; void flushDb(); },250);
}

async function writeBatch(b: TickBatch) {
  for (const [interval,size] of frames) {
    const bucket = new Date(Math.floor(b.timestamp/size)*size);
    await prisma.$executeRaw`
      INSERT INTO "MarketCandle" ("id","symbol","interval","bucket","open","high","low","close","ticks","createdAt","updatedAt")
      VALUES (${crypto.randomUUID()},${b.symbol},${interval},${bucket},${b.open},${b.high},${b.low},${b.close},${b.ticks},NOW(),NOW())
      ON CONFLICT ("symbol","interval","bucket") DO UPDATE SET
        "high"=GREATEST("MarketCandle"."high",EXCLUDED."high"),
        "low"=LEAST("MarketCandle"."low",EXCLUDED."low"),
        "close"=EXCLUDED."close",
        "ticks"="MarketCandle"."ticks"+EXCLUDED."ticks",
        "updatedAt"=NOW();`;
  }
}
async function flushDb() {
  if (dbWriting) return;
  dbWriting=true;
  try {
    while (pending.size) {
      const batch=[...pending.values()]; pending.clear();
      for (const b of batch) try { await writeBatch(b); } catch(e:any) { console.error(`[${b.symbol}] DB`,e?.message||e); }
    }
  } finally { dbWriting=false; if (pending.size && !flushTimer) flushTimer=setTimeout(()=>{flushTimer=null;void flushDb();},250); }
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
socket.on("connect",()=>{ liveRatesConnected=true; providerError=""; console.log(`[MASTER] connected; subscribing ${PROVIDER_INSTRUMENTS.length} symbols`); socket.emit("instruments",PROVIDER_INSTRUMENTS); socket.emit("key",{key}); broadcastStatus({provider:"live-rates",connected:true,mode:"MASTER_150"}); });
socket.on("rates",(raw:any)=>{ try { const msg=typeof raw==="string"?JSON.parse(raw):raw; if(msg?.info){providerInfo=String(msg.info);broadcastStatus({provider:"live-rates",connected:liveRatesConnected,info:providerInfo,mode:"MASTER_150"});return;} if(msg?.error){providerError=String(msg.error);broadcastStatus({provider:"live-rates",connected:liveRatesConnected,error:providerError,mode:"MASTER_150"});return;} const symbol=normalizeMarketSymbol(String(msg?.currency??msg?.symbol??"")); if(!PROVIDER_SET.has(symbol)) return; const price=Number(msg?.bid??msg?.price); if(!Number.isFinite(price)||price<=0)return; const tick={symbol,price,timestamp:normalizeTimestamp(msg?.timestamp)}; latestTicks[symbol]=tick; broadcastTick(tick); queueDbTick(tick); } catch(e){console.error("[MASTER] parse",e);} });
socket.on("disconnect",reason=>{liveRatesConnected=false;broadcastStatus({provider:"live-rates",connected:false,reason,mode:"MASTER_150"});});
socket.on("connect_error",e=>{liveRatesConnected=false;providerError=e.message;console.error("[MASTER] connect",e.message);});

const server=http.createServer((req,res)=>{
  const origin=req.headers.origin||"*"; res.setHeader("Access-Control-Allow-Origin",origin);res.setHeader("Vary","Origin");res.setHeader("Access-Control-Allow-Methods","GET, OPTIONS");res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS"){res.writeHead(204);res.end();return;}
  const url=new URL(req.url||"/",`http://${req.headers.host||"localhost"}`);
  if(url.pathname==="/health"){res.writeHead(200,{"Content-Type":"application/json","Cache-Control":"no-store"});res.end(JSON.stringify({ok:true,mode:"MASTER_150",connected:liveRatesConnected,configured:PROVIDER_INSTRUMENTS.length,clients:totalClients(),receivedSymbols:Object.keys(latestTicks).length,latestTicks,dbWriting,dbPending:[...pending.keys()],providerInfo:providerInfo||null,providerError:providerError||null}));return;}
  const m=url.pathname.match(/^\/api\/(?:market\/)?([a-z0-9]+)\/stream$/i);
  if(m){ const symbol=normalizeMarketSymbol(m[1]); if(!PROVIDER_SET.has(symbol)){res.writeHead(404,{"Content-Type":"application/json"});res.end(JSON.stringify({ok:false,error:"Unknown symbol"}));return;} res.writeHead(200,{"Content-Type":"text/event-stream; charset=utf-8","Cache-Control":"no-cache, no-transform",Connection:"keep-alive","X-Accel-Buffering":"no","Access-Control-Allow-Origin":origin,Vary:"Origin"});res.write("retry: 3000\n\n");res.write(`event: status\ndata: ${JSON.stringify({provider:"live-rates",connected:liveRatesConnected,symbol,mode:"MASTER_150"})}\n\n`);if(latestTicks[symbol])res.write(`event: tick\ndata: ${JSON.stringify(latestTicks[symbol])}\n\n`);const set=clientSet(symbol);set.add(res);const keep=setInterval(()=>{try{res.write(`: keepalive ${Date.now()}\n\n`);}catch{}},15000);req.on("close",()=>{clearInterval(keep);set.delete(res);});return; }
  res.writeHead(200,{"Content-Type":"application/json"});res.end(JSON.stringify({ok:true,service:"FX Trade Master Market Collector",mode:"MASTER_150",configured:PROVIDER_INSTRUMENTS.length,health:"/health",streamPattern:"/api/market/{symbol}/stream"}));
});
server.listen(PORT,"0.0.0.0",()=>{console.log(`[MASTER] HTTP/SSE :${PORT}`);socket.connect();});
async function shutdown(signal:string){console.log(`[MASTER] ${signal}`);if(flushTimer)clearTimeout(flushTimer);await flushDb();socket.removeAllListeners();socket.disconnect();for(const set of clientsBySymbol.values())for(const c of set)try{c.end();}catch{}await new Promise<void>(r=>server.close(()=>r()));await prisma.$disconnect();process.exit(0);}
process.on("SIGINT",()=>void shutdown("SIGINT"));process.on("SIGTERM",()=>void shutdown("SIGTERM"));
