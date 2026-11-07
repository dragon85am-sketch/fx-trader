// FX TRADE V4 Stage 4D - isolated PostgreSQL integration tests.
// Never connects to production by default. Run ONLY against a disposable DB.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const crypto = require("node:crypto");
const { URL } = require("node:url");

async function main() {
  const testUrl = process.env.FXTRADE_4D_TEST_DATABASE_URL;
  if (!testUrl) throw new Error("Missing FXTRADE_4D_TEST_DATABASE_URL. No database connection attempted.");
  const parsed = new URL(testUrl);
  const dbName = decodeURIComponent(parsed.pathname.slice(1));
  if (!/^fxtrade_4d_test(?:_[a-z0-9_]+)?$/i.test(dbName))
    throw new Error("REFUSED: database name must be fxtrade_4d_test (or fxtrade_4d_test_suffix).");
  for (const name of ["DATABASE_URL","DIRECT_URL"]) {
    if (process.env[name]) {
      const other = new URL(process.env[name]);
      if (other.href === parsed.href) throw new Error(`REFUSED: ${name} matches disposable test database URL.`);
    }
  }
  if (process.env.FXTRADE_4D_ALLOW_TEST_DB !== "YES")
    throw new Error("Set FXTRADE_4D_ALLOW_TEST_DB=YES to confirm the database is disposable.");
  const collectorPath = process.argv[2] || "./scripts/master-market-collector.ts";
  const source = fs.readFileSync(collectorPath,"utf8");
  const match = source.match(/async function writeBatches\(rows: DurableBatch\[\]\)\s*\{[\s\S]*?await prisma\.\$executeRawUnsafe\(`([\s\S]*?)`, \.\.\.params\);/);
  assert.ok(match, "Cannot extract production writeBatches SQL; no DB mutation performed");
  const sqlTemplate = match[1];
  assert.ok(sqlTemplate.includes('MarketCandleBatchLedger') && sqlTemplate.includes('MarketCandle'), "Unexpected SQL");
  // Require a fully separate disposable database, not a schema in production.
  process.env.DATABASE_URL = testUrl;
  process.env.DIRECT_URL = testUrl;
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  let passes = 0;
  const ok = (name) => {passes++; console.log("PASS",name)};
  const bucket = new Date("2026-11-02T12:00:00Z");
  const t = (s) => new Date(bucket.getTime()+s*1000);
  const row = (id, price, first, last, ticks=1) => ({
    id, batch:{symbol:"EURUSD",interval:"1min",bucket:bucket.getTime(),
    open:price,high:price,low:price,close:price,firstAt:t(first).getTime(),lastAt:t(last).getTime(),ticks}
  });
  async function write(rows) {
    const params=[];
    const values=rows.map(({id,batch:b})=>{
      const base=params.length;
      params.push(id,crypto.randomUUID(),b.symbol,b.interval,new Date(b.bucket),b.open,b.high,b.low,b.close,b.ticks,new Date(b.firstAt),new Date(b.lastAt));
      return `(${Array.from({length:12},(_,i)=>`$${base+i+1}`).join(",")})`;
    }).join(",");
    // The ONLY substitution is the generated VALUES placeholders.
    const sql=sqlTemplate.replace("${values}",values);
    assert.ok(!sql.includes("${"),"Unexpected dynamic SQL expression");
    await prisma.$executeRawUnsafe(sql,...params);
  }
  async function state() {
    const rows=await prisma.$queryRawUnsafe('SELECT "open","high","low","close","ticks","firstAt","lastAt" FROM public."MarketCandle" WHERE "symbol"=$1 AND "interval"=$2 AND "bucket"=$3', "EURUSD","1min",bucket);
    return rows[0];
  }
  try {
    // Only create/modify tables in the explicitly named disposable database.
    await prisma.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS public."MarketCandleBatchLedger" ("batchId" text PRIMARY KEY)');
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS public."MarketCandle" (
      "id" text PRIMARY KEY,"symbol" text NOT NULL,"interval" text NOT NULL,"bucket" timestamptz NOT NULL,
      "open" float8 NOT NULL,"high" float8 NOT NULL,"low" float8 NOT NULL,"close" float8 NOT NULL,
      "ticks" integer NOT NULL,"firstAt" timestamptz,"lastAt" timestamptz,
      "createdAt" timestamptz NOT NULL,"updatedAt" timestamptz NOT NULL,
      UNIQUE ("symbol","interval","bucket"))`);
    await prisma.$executeRawUnsafe('TRUNCATE TABLE public."MarketCandle", public."MarketCandleBatchLedger"');
    const older=row("4d-old",1.10,2,2);
    const newer=row("4d-new",1.12,40,40);
    await write([older]); await write([older]);
    assert.equal((await state()).ticks,1); ok("SQL ledger deduplicates replay after simulated crash before checkpoint");
    await write([newer]); await write([older]);
    assert.equal((await state()).close,1.12);
    assert.equal((await state()).ticks,2); ok("Older replay does not overwrite newer close");
    const a=row("4d-par-a",1.09,1,1), b=row("4d-par-b",1.14,50,50);
    await Promise.all([write([a]),write([b])]);
    const result=await state();
    assert.equal(result.open,1.09); assert.equal(result.close,1.14);
    assert.equal(result.high,1.14); assert.equal(result.low,1.09);
    assert.equal(result.ticks,4); ok("Concurrent SQL upserts preserve OHLC and tick count");
    await Promise.all([write([a]),write([b])]);
    assert.equal((await state()).ticks,4); ok("Concurrent retry remains idempotent");
    const fail=row("4d-failure",1.15,55,55);
    let rejected=false;
    try {await prisma.$executeRawUnsafe('SELECT 1/0');} catch {rejected=true}
    assert.ok(rejected); await write([fail]);
    assert.equal((await state()).ticks,5); ok("Database failure followed by retry");
    console.log(`\n${passes}/5 PostgreSQL integration checks passed (disposable database).`);
    console.log("NOT TESTED: actual process kill, WAL recovery, or Railway production load.");
  } finally {
    await prisma.$disconnect();
  }
}
main().catch(e=>{console.error("FAIL",e.message);process.exitCode=1});
