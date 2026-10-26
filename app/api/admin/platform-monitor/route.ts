import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";
const SYMBOLS = ["XAUUSD", "XAGUSD", "US30", "EURUSD", "GBPUSD"];
const INTERVALS = ["1min", "5min", "15min", "1h", "4h", "1day"];
type Candle = { symbol:string; interval:string; bucket:Date; open:unknown; high:unknown; low:unknown; close:unknown; ticks:number };
function state(age:number, interval:string) {
  const seconds:Record<string,number> = {"1min":60,"5min":300,"15min":900,"1h":3600,"4h":14400,"1day":86400};
  // A market closure or a session gap can also produce stale candles.
  return age <= seconds[interval]*3 ? "fresh" : "stale";
}
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const started = Date.now();
  let database:{status:string;latencyMs:number|null;error?:string} = {status:"unknown",latencyMs:null};
  let candles: Array<{symbol:string;interval:string;status:string;lastCandle:string|null;ageSeconds:number|null;count:number;invalid:number;lastOHLC: {open:number;high:number;low:number;close:number}|null}> = [];
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = {status:"online",latencyMs:Date.now()-started};
    const rows = await prisma.$queryRaw<Candle[]>(Prisma.sql`
      SELECT "symbol","interval","bucket","open","high","low","close","ticks"
      FROM (
        SELECT "symbol","interval","bucket","open","high","low","close","ticks",
        ROW_NUMBER() OVER (PARTITION BY "symbol","interval" ORDER BY "bucket" DESC) AS rn
        FROM "MarketCandle"
        WHERE "symbol" IN (${Prisma.join(SYMBOLS)}) AND "interval" IN (${Prisma.join(INTERVALS)})
      ) latest WHERE rn <= 30
    `);
    for (const symbol of SYMBOLS) for (const interval of INTERVALS) {
      const group = rows.filter(r=>r.symbol===symbol && r.interval===interval);
      const last=group[0];
      const age=last?Math.max(0,Math.round((Date.now()-new Date(last.bucket).getTime())/1000)):null;
      const invalid=group.filter(r=>{const o=Number(r.open),h=Number(r.high),l=Number(r.low),c=Number(r.close);return ![o,h,l,c].every(Number.isFinite)||h<Math.max(o,c,l)||l>Math.min(o,c,h)}).length;
      candles.push({symbol,interval,status:!last?"missing":invalid?"invalid":state(age!,interval),lastCandle:last?new Date(last.bucket).toISOString():null,ageSeconds:age,count:group.length,invalid,lastOHLC:last?{open:Number(last.open),high:Number(last.high),low:Number(last.low),close:Number(last.close)}:null});
    }
  } catch (e) { database={status:"error",latencyMs:Date.now()-started,error:e instanceof Error?e.message:"Database error"}; }
  return NextResponse.json({generatedAt:new Date().toISOString(),database,candles,services:[{name:"Vercel Frontend",status:"online",detail:"Admin API odpowiada"},{name:"Railway Workers",status:"unknown",detail:"Brak podłączonej telemetrii heartbeat"},{name:"Telegram",status:"unknown",detail:"Brak podłączonego testu bota"},{name:"Market Collector",status:"unknown",detail:"Wymaga heartbeat workera"}]},{headers:{"Cache-Control":"no-store"}});
}
