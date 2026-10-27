import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;
const SYMBOLS = ["XAUUSD", "XAGUSD", "US30", "EURUSD", "GBPUSD"] as const;
const INTERVALS = ["1min", "5min", "15min", "1h", "4h", "1day"] as const;
const SECONDS: Record<string, number> = {"1min":60,"5min":300,"15min":900,"1h":3600,"4h":14400,"1day":86400};
type Row = { symbol:string; interval:string; bucket:Date; open:unknown; high:unknown; low:unknown; close:unknown; ticks:unknown };
const errorMessage = (e:unknown) => e instanceof Error ? e.message : "Błąd odczytu";
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const started = Date.now();
  let database: {status:string;latencyMs:number|null;error?:string} = {status:"unknown",latencyMs:null};
  let candles: Array<{symbol:string;interval:string;status:string;lastCandle:string|null;ageSeconds:number|null;count:number;invalid:number;gaps:number;lastOHLC:{open:number;high:number;low:number;close:number}|null;series:Array<{time:string;open:number;high:number;low:number;close:number}>}> = [];
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = {status:"online",latencyMs:Date.now()-started};
    // LATERAL queries read only the last 40 candles for each symbol/interval.
    // Recommended DB index: (symbol, interval, bucket DESC).
    const rows = await prisma.$queryRaw<Row[]>(Prisma.sql`
      SELECT m."symbol", m."interval", m."bucket", m."open", m."high", m."low", m."close", m."ticks"
      FROM unnest(ARRAY[${Prisma.join(SYMBOLS)}]::text[]) AS sym("symbol")
      CROSS JOIN unnest(ARRAY[${Prisma.join(INTERVALS)}]::text[]) AS tf("interval")
      CROSS JOIN LATERAL (
        SELECT c."symbol",c."interval",c."bucket",c."open",c."high",c."low",c."close",c."ticks"
        FROM "MarketCandle" c
        WHERE c."symbol"=sym."symbol" AND c."interval"=tf."interval"
        ORDER BY c."bucket" DESC LIMIT 40
      ) m
    `);
    const groups = new Map<string,Row[]>();
    for (const r of rows) {
      const k = `${r.symbol}:${r.interval}`;
      groups.set(k,[...(groups.get(k)??[]),r]);
    }
    for (const symbol of SYMBOLS) for (const interval of INTERVALS) {
      const group = (groups.get(`${symbol}:${interval}`)??[]).sort((a,b)=>new Date(a.bucket).getTime()-new Date(b.bucket).getTime());
      const last = group[group.length-1];
      const ageSeconds = last ? Math.max(0,Math.floor((Date.now()-new Date(last.bucket).getTime())/1000)) : null;
      const invalid = group.filter(r=>{const o=Number(r.open),h=Number(r.high),l=Number(r.low),c=Number(r.close);return ![o,h,l,c].every(Number.isFinite)||h<Math.max(o,c,l)||l>Math.min(o,c,h);}).length;
      let gaps = 0;
      for(let i=1;i<group.length;i++) {
        const delta=(new Date(group[i].bucket).getTime()-new Date(group[i-1].bucket).getTime())/1000;
        if(delta>SECONDS[interval]*1.5) gaps += Math.max(1,Math.round(delta/SECONDS[interval])-1);
      }
      const status = !last ? "missing" : invalid ? "invalid" : ageSeconds!==null && ageSeconds>SECONDS[interval]*3 ? "stale" : "fresh";
      candles.push({symbol,interval,status,lastCandle:last?new Date(last.bucket).toISOString():null,ageSeconds,count:group.length,invalid,gaps,
        lastOHLC:last?{open:Number(last.open),high:Number(last.high),low:Number(last.low),close:Number(last.close)}:null,
        series:group.map(r=>({time:new Date(r.bucket).toISOString(),open:Number(r.open),high:Number(r.high),low:Number(r.low),close:Number(r.close)}))});
    }
  } catch(e) {database={status:"error",latencyMs:Date.now()-started,error:errorMessage(e)};}
  // Never report uninstrumented services as ONLINE.
  return NextResponse.json({generatedAt:new Date().toISOString(),database,candles,services:[
    {name:"Vercel / Frontend API",status:"online",detail:"Żądanie API obsłużone"},
    {name:"Supabase / Prisma",status:database.status,detail:database.error??`Odpowiedź ${database.latencyMs??"—"} ms`},
    {name:"Railway / Workers",status:"unknown",detail:"Wymaga heartbeat workera"},
    {name:"Market Collector",status:"unknown",detail:"Wymaga telemetrycznego endpointu health"},
    {name:"Telegram",status:"unknown",detail:"Brak aktywnego testu połączenia"}
  ]},{headers:{"Cache-Control":"no-store"}});
}
