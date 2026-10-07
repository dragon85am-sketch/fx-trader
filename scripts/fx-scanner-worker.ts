import dotenv from "dotenv";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { FX_SCANNER_SYMBOLS, fxScannerStorageSymbol } from "../lib/fx-scanner/symbols";
import { advanceTrade, buildLevels, scan4of4, type Candle, type Levels, type Side } from "../lib/fx-scanner/engine";
dotenv.config({path:".env.local"}); dotenv.config({path:".env"});
const prisma=new PrismaClient();
const INTERVALS:{tf:string;db:string}[]=[{tf:"M1",db:"1min"},{tf:"M5",db:"5min"},{tf:"M15",db:"15min"},{tf:"M30",db:"30min"},{tf:"H1",db:"1h"},{tf:"H4",db:"4h"},{tf:"D1",db:"1day"}];
const EVERY=Math.max(10_000,Number(process.env.FX_SCANNER_INTERVAL_MS||30_000));
const APP=(process.env.FXTRADE_APP_URL||process.env.NEXT_PUBLIC_APP_URL||"").replace(/\/$/,"");
const KEY=process.env.FX_SCANNER_WORKER_KEY||"";
type PendingSetup={side:Side;levels:Levels;signalTime:number};

async function loadReadySetup(storageSymbol:string,tf:string):Promise<PendingSetup|null>{
  const row=await prisma.fxScannerReadySetup.findUnique({where:{storageSymbol_tf:{storageSymbol,tf}}});
  if(!row)return null;
  return {side:row.side as Side,levels:{side:row.side as Side,entry:row.entry,sl:row.sl,tps:[row.tp1,row.tp2,row.tp3],rr:row.rr},signalTime:Math.floor(row.signalTime.getTime()/1000)};
}
async function saveReadySetup(instrument:string,storageSymbol:string,tf:string,setup:PendingSetup){
  await prisma.fxScannerReadySetup.upsert({
    where:{storageSymbol_tf:{storageSymbol,tf}},
    create:{instrument,storageSymbol,tf,side:setup.side,signalTime:new Date(setup.signalTime*1000),entry:setup.levels.entry,sl:setup.levels.sl,tp1:setup.levels.tps[0],tp2:setup.levels.tps[1],tp3:setup.levels.tps[2],rr:setup.levels.rr},
    update:{instrument,side:setup.side,signalTime:new Date(setup.signalTime*1000),entry:setup.levels.entry,sl:setup.levels.sl,tp1:setup.levels.tps[0],tp2:setup.levels.tps[1],tp3:setup.levels.tps[2],rr:setup.levels.rr},
  });
}
async function clearReadySetup(storageSymbol:string,tf:string){
  await prisma.fxScannerReadySetup.deleteMany({where:{storageSymbol,tf}});
}
type DbC={bucket:Date;open:number|string;high:number|string;low:number|string;close:number|string;ticks:number};

const WEEKLY_TZ = "Europe/Amsterdam";
const WEEKLY_LOG_TYPE = "FX_WEEKLY_TELEGRAM";

type WeeklyTrade = {
  instrument: string;
  status: string;
  entry: number;
  sl: number;
  tp1: number;
  tp2: number;
  tp3: number;
  tp1Hit: boolean;
  tp2Hit: boolean;
  tp3Hit: boolean;
  closedAt: Date | null;
};

function zonedParts(date: Date, timeZone = WEEKLY_TZ) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hourCycle: "h23", weekday: "short",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    year: Number(get("year")), month: Number(get("month")), day: Number(get("day")),
    hour: Number(get("hour")), minute: Number(get("minute")), second: Number(get("second")),
    weekday: get("weekday"),
  };
}

function zonedLocalToUtc(year: number, month: number, day: number, hour: number, minute = 0, second = 0, timeZone = WEEKLY_TZ) {
  const target = Date.UTC(year, month - 1, day, hour, minute, second);
  let guess = target;
  for (let i = 0; i < 3; i++) {
    const p = zonedParts(new Date(guess), timeZone);
    const represented = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    guess += target - represented;
  }
  return new Date(guess);
}

function mondayStartForFriday(now: Date) {
  const p = zonedParts(now);
  const localMidnight = new Date(Date.UTC(p.year, p.month - 1, p.day));
  localMidnight.setUTCDate(localMidnight.getUTCDate() - 4);
  return zonedLocalToUtc(
    localMidnight.getUTCFullYear(),
    localMidnight.getUTCMonth() + 1,
    localMidnight.getUTCDate(),
    0, 0, 0,
  );
}

function weeklyTradeUnits(t: WeeklyTrade): { value: number; unit: "pips" | "pts" } | null {
  const entry = Number(t.entry);
  if (!Number.isFinite(entry)) return null;
  let distance: number | null = null;
  if (t.status === "SL") distance = Number.isFinite(Number(t.sl)) ? -Math.abs(Number(t.sl) - entry) : null;
  else if (t.status === "TP3") distance = Number.isFinite(Number(t.tp3)) ? Math.abs(Number(t.tp3) - entry) : null;
  else if (t.status === "TP1_BE") {
    const target = t.tp2Hit ? Number(t.tp2) : Number(t.tp1);
    distance = Number.isFinite(target) ? Math.abs(target - entry) : null;
  }
  if (distance == null) return null;
  const symbol = t.instrument.toUpperCase();
  if (symbol === "XAUUSD" || symbol === "XAGUSD") return { value: distance / 0.01, unit: "pips" };
  if (/^[A-Z]{6}$/.test(symbol)) return { value: distance / (symbol.endsWith("JPY") ? 0.01 : 0.0001), unit: "pips" };
  return { value: distance, unit: "pts" };
}

function buildWeeklyStats(trades: WeeklyTrade[]) {
  const rows = new Map<string, { instrument: string; wins: number; losses: number; value: number; unit: "pips" | "pts" }>();
  let wins = 0, losses = 0, totalPips = 0, totalPoints = 0;
  for (const t of trades) {
    const win = t.status === "TP3" || t.status === "TP1_BE";
    if (win) wins++; else if (t.status === "SL") losses++;
    const r = weeklyTradeUnits(t);
    const key = t.instrument.toUpperCase();
    const unit = r?.unit ?? (key.endsWith("USDT") ? "pts" : "pips");
    const row = rows.get(key) ?? { instrument: key, wins: 0, losses: 0, value: 0, unit };
    if (win) row.wins++; else if (t.status === "SL") row.losses++;
    if (r) {
      row.value += r.value;
      if (r.unit === "pips") totalPips += r.value; else totalPoints += r.value;
    }
    rows.set(key, row);
  }
  const total = wins + losses;
  return { total, wins, losses, winRate: total ? (wins / total) * 100 : 0, totalPips, totalPoints, rows: [...rows.values()].sort((a,b)=>a.instrument.localeCompare(b.instrument)) };
}

async function maybeSendWeeklyReport() {
  const now = new Date();
  const p = zonedParts(now);
  if (p.weekday !== "Fri" || p.hour < 23) return;

  const start = mondayStartForFriday(now);
  const weekKey = `${zonedParts(start).year}-${String(zonedParts(start).month).padStart(2,"0")}-${String(zonedParts(start).day).padStart(2,"0")}`;
  const marker = `weekly:${weekKey}`;
  const alreadySent = await prisma.activityLog.findFirst({ where: { type: WEEKLY_LOG_TYPE, message: marker } });
  if (alreadySent) return;

  const trades = await prisma.fxScannerTrade.findMany({
    where: { status: { in: ["TP3", "TP1_BE", "SL"] }, closedAt: { gte: start, lte: now } },
    orderBy: { closedAt: "asc" },
    select: { instrument:true,status:true,entry:true,sl:true,tp1:true,tp2:true,tp3:true,tp1Hit:true,tp2Hit:true,tp3Hit:true,closedAt:true },
  });
  const stats = buildWeeklyStats(trades as WeeklyTrade[]);
  const ok = await telegram({
    type: "WEEKLY",
    timeISO: now.toISOString(),
    weekly: { periodStartISO: start.toISOString(), periodEndISO: now.toISOString(), ...stats },
  });
  if (ok) {
    await prisma.activityLog.create({ data: { type: WEEKLY_LOG_TYPE, message: marker } });
    console.log(`[FX-WORKER] WEEKLY ${weekKey} sent: ${stats.total} closed trades, WR=${stats.winRate.toFixed(1)}%`);
  }
}
async function candles(symbol:string,interval:string){const rows=await prisma.$queryRaw<DbC[]>`SELECT "bucket","open","high","low","close","ticks" FROM "MarketCandle" WHERE "symbol"=${symbol} AND "interval"=${interval} ORDER BY "bucket" DESC LIMIT 260`;return rows.reverse().map(r=>({time:Math.floor(new Date(r.bucket).getTime()/1000),open:Number(r.open),high:Number(r.high),low:Number(r.low),close:Number(r.close),volume:r.ticks})) as Candle[];}
async function telegram(payload:any){
  const tag=`${payload?.type||"UNKNOWN"} ${payload?.instrument||""} ${payload?.tf||""}`.trim();
  if(!APP||!KEY){console.error(`[FX-WORKER] TELEGRAM ${tag} ERROR: FXTRADE_APP_URL/FX_SCANNER_WORKER_KEY missing`);return false;}
  try{
    const r=await fetch(`${APP}/api/telegram/notify`,{method:"POST",headers:{"content-type":"application/json","x-fx-scanner-worker-key":KEY},body:JSON.stringify(payload)});
    const body=await r.text();
    if(!r.ok){console.error(`[FX-WORKER] TELEGRAM ${tag} ERROR HTTP ${r.status}: ${body}`);return false;}
    console.log(`[FX-WORKER] TELEGRAM ${tag} OK${body?`: ${body.slice(0,240)}`:""}`);
    return true;
  }catch(e:any){console.error(`[FX-WORKER] TELEGRAM ${tag} ERROR:`,e?.message||e);return false;}
}
async function scanOne(display:string,tf:string,db:string){const storage=fxScannerStorageSymbol(display),cs=await candles(storage,db);if(cs.length<45)return;const active=await prisma.fxScannerTrade.findFirst({where:{storageSymbol:storage,tf,status:"ACTIVE"},orderBy:{openedAt:"desc"}});if(active){
  if(!active.telegramSignal){
    const sent=await telegram({type:"SIGNAL",instrument:active.instrument,side:active.side,tf:active.tf,rr:active.rr,entry:active.entry,sl:active.sl,tp1:active.tp1,tp2:active.tp2,tp3:active.tp3,timeISO:active.openedAt.toISOString()});
    if(sent)await prisma.fxScannerTrade.update({where:{id:active.id},data:{telegramSignal:true}});
  }
  const levels:Levels={side:active.side as Side,entry:active.entry,sl:active.sl,tps:[active.tp1,active.tp2,active.tp3],rr:active.rr};const r=advanceTrade(cs,active.side as Side,levels,Math.floor(active.signalTime.getTime()/1000),active.tp1Hit,active.tp2Hit);if(r.status){const closed=await prisma.fxScannerTrade.update({where:{id:active.id},data:{status:r.status,tp1Hit:r.tp1Hit,tp2Hit:r.tp2Hit,tp3Hit:r.status==="TP3",closedAt:new Date()}});if(!closed.telegramClosed){const ok=await telegram({type:"CLOSED",instrument:closed.instrument,side:closed.side,tf:closed.tf,entry:closed.entry,sl:closed.sl,tp1:closed.tp1,tp2:closed.tp2,tp3:closed.tp3,status:closed.status,tp1Hit:closed.tp1Hit,tp2Hit:closed.tp2Hit,tp3Hit:closed.tp3Hit,timeISO:closed.closedAt?.toISOString()});if(ok)await prisma.fxScannerTrade.update({where:{id:closed.id},data:{telegramClosed:true}});}}else if(r.tp1Hit!==active.tp1Hit||r.tp2Hit!==active.tp2Hit)await prisma.fxScannerTrade.update({where:{id:active.id},data:{tp1Hit:r.tp1Hit,tp2Hit:r.tp2Hit}});return;}
const found=scan4of4(cs);if(found.count!==4||!found.side){await clearReadySetup(storage,tf);return;}const signal=cs[cs.length-2];if(!signal)return;let setup=await loadReadySetup(storage,tf);if(!setup||setup.side!==found.side){const lv=buildLevels(cs,found.side);if(!lv)return;setup={side:found.side,levels:lv,signalTime:signal.time};await saveReadySetup(display,storage,tf,setup);console.log(`[FX-WORKER] READY ${display} ${tf} ${found.side} entry=${lv.entry} — persisted, waiting for CLOSED candle confirmation`);return;}if(signal.time<=setup.signalTime)return;const confirmed=setup.side==="BUY"?signal.close>setup.levels.entry:signal.close<setup.levels.entry;if(!confirmed){console.log(`[FX-WORKER] WAIT ENTRY ${display} ${tf} ${setup.side} close=${signal.close} entry=${setup.levels.entry}`);return;}const lv=setup.levels;const signalTime=new Date(signal.time*1000),id=crypto.createHash("sha1").update(`${storage}|${tf}|${setup.side}|${signalTime.toISOString()}`).digest("hex");let trade;try{trade=await prisma.fxScannerTrade.create({data:{id,instrument:display,storageSymbol:storage,tf,side:setup.side,confirmation:4,signalTime,entry:lv.entry,sl:lv.sl,tp1:lv.tps[0],tp2:lv.tps[1],tp3:lv.tps[2],rr:lv.rr}});}catch{return;}await clearReadySetup(storage,tf);const ok=await telegram({type:"SIGNAL",instrument:trade.instrument,side:trade.side,tf:trade.tf,rr:trade.rr,entry:trade.entry,sl:trade.sl,tp1:trade.tp1,tp2:trade.tp2,tp3:trade.tp3,timeISO:trade.openedAt.toISOString()});if(ok)await prisma.fxScannerTrade.update({where:{id:trade.id},data:{telegramSignal:true}});console.log(`[FX-WORKER] ACTIVE ${display} ${tf} ${setup.side} — candle CLOSED beyond ENTRY`);}
async function cycle(){try{await maybeSendWeeklyReport();}catch(e:any){console.error(`[FX-WORKER] WEEKLY ERROR`,e?.message||e);}for(const display of FX_SCANNER_SYMBOLS)for(const x of INTERVALS)try{await scanOne(display,x.tf,x.db)}catch(e:any){console.error(`[FX-WORKER] ${display} ${x.tf}`,e?.message||e);}}
let running=false;async function run(){if(running)return;running=true;try{await cycle();}finally{running=false;}}console.log(`[FX-WORKER] 24/7 start: ${FX_SCANNER_SYMBOLS.length} configured symbols, ${INTERVALS.length} TF, every ${EVERY}ms`);void run();const timer=setInterval(()=>void run(),EVERY);async function stop(){clearInterval(timer);await prisma.$disconnect();process.exit(0);}process.on("SIGINT",()=>void stop());process.on("SIGTERM",()=>void stop());
