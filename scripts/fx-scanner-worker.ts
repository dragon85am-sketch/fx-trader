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
type DbC={bucket:Date;open:number|string;high:number|string;low:number|string;close:number|string;ticks:number};
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
const found=scan4of4(cs);if(found.count!==4||!found.side)return;const signal=cs[cs.length-2];if(!signal)return;const lv=buildLevels(cs,found.side);if(!lv)return;const signalTime=new Date(signal.time*1000),id=crypto.createHash("sha1").update(`${storage}|${tf}|${found.side}|${signalTime.toISOString()}`).digest("hex");let trade;try{trade=await prisma.fxScannerTrade.create({data:{id,instrument:display,storageSymbol:storage,tf,side:found.side,confirmation:4,signalTime,entry:lv.entry,sl:lv.sl,tp1:lv.tps[0],tp2:lv.tps[1],tp3:lv.tps[2],rr:lv.rr}});}catch{return;}const ok=await telegram({type:"SIGNAL",instrument:trade.instrument,side:trade.side,tf:trade.tf,rr:trade.rr,entry:trade.entry,sl:trade.sl,tp1:trade.tp1,tp2:trade.tp2,tp3:trade.tp3,timeISO:trade.openedAt.toISOString()});if(ok)await prisma.fxScannerTrade.update({where:{id:trade.id},data:{telegramSignal:true}});console.log(`[FX-WORKER] NEW ${display} ${tf} ${found.side}`);}
async function cycle(){for(const display of FX_SCANNER_SYMBOLS)for(const x of INTERVALS)try{await scanOne(display,x.tf,x.db)}catch(e:any){console.error(`[FX-WORKER] ${display} ${x.tf}`,e?.message||e);}}
let running=false;async function run(){if(running)return;running=true;try{await cycle();}finally{running=false;}}console.log(`[FX-WORKER] 24/7 start: ${FX_SCANNER_SYMBOLS.length} configured symbols, ${INTERVALS.length} TF, every ${EVERY}ms`);void run();const timer=setInterval(()=>void run(),EVERY);async function stop(){clearInterval(timer);await prisma.$disconnect();process.exit(0);}process.on("SIGINT",()=>void stop());process.on("SIGTERM",()=>void stop());
