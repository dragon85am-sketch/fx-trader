// FX TRADE V4: isolated SQL execution thread. No WAL or snapshot access.
// Main collector owns the durable queue and acknowledges commits only after SQL succeeds.
const { parentPort } = require('node:worker_threads');
const { PrismaClient } = require('@prisma/client');
const crypto = require('node:crypto');
const prisma = new PrismaClient();
let busy = false;
async function writeBatches(rows) {
  if (!rows.length) return;
  const params = [];
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
    -- Deduplicate batch IDs within the same statement before ledger insertion.
    unique_batches AS (
      SELECT DISTINCT ON (batch_id) * FROM incoming ORDER BY batch_id
    ),
    accepted AS (
      INSERT INTO public."MarketCandleBatchLedger" ("batchId")
      SELECT batch_id::text FROM unique_batches
      ON CONFLICT ("batchId") DO NOTHING
      RETURNING "batchId"
    ),
    -- PostgreSQL cannot UPSERT the same candle key twice in one statement.
    -- Aggregate only NEW ledger batches, retaining chronological open/close.
    grouped AS (
      SELECT i.symbol::text AS symbol, i.interval::text AS interval,
        i.bucket::timestamptz AS bucket,
        (ARRAY_AGG(i.id::text ORDER BY i.first_at::timestamptz, i.batch_id::text))[1] AS id,
        (ARRAY_AGG(i.open::float8 ORDER BY i.first_at::timestamptz, i.batch_id::text))[1] AS open,
        MAX(i.high::float8) AS high, MIN(i.low::float8) AS low,
        (ARRAY_AGG(i.close::float8 ORDER BY i.last_at::timestamptz DESC, i.batch_id::text DESC))[1] AS close,
        SUM(i.ticks::bigint)::integer AS ticks,
        MIN(i.first_at::timestamptz) AS first_at,
        MAX(i.last_at::timestamptz) AS last_at
      FROM unique_batches i JOIN accepted a ON a."batchId" = i.batch_id::text
      GROUP BY i.symbol::text, i.interval::text, i.bucket::timestamptz
    )
    INSERT INTO public."MarketCandle"
      ("id","symbol","interval","bucket","open","high","low","close","ticks","firstAt","lastAt","createdAt","updatedAt")
    SELECT g.id,g.symbol,g.interval,g.bucket,
      g.open,g.high,g.low,g.close,g.ticks,g.first_at,g.last_at,NOW(),NOW()
    FROM grouped g
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
parentPort.on('message', async (message) => {
  if (!message || message.type !== 'write' || busy) return;
  busy = true;
  try {
    await writeBatches(message.rows);
    parentPort.postMessage({ type: 'result', id: message.id, ok: true });
  } catch (error) {
    parentPort.postMessage({ type: 'result', id: message.id, ok: false, error: String(error?.message || error) });
  } finally { busy = false; }
});
