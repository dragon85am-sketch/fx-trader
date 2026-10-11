/** FX TRADE: historical daily CLOSE rates only. Never writes MarketCandle/OHLC. */
import dotenv from 'dotenv';
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { getCollectorSymbols } from '../lib/market/master-symbols';

dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ path: '.env', quiet: true });

const DAY = 86_400_000;
const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
const day = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const apiKey = process.env.LIVE_RATES_API_KEY?.trim();
if (!apiKey) throw new Error('Missing LIVE_RATES_API_KEY');

const dbVariable = process.env.D1_BACKFILL_DATABASE_URL ? 'D1_BACKFILL_DATABASE_URL' : 'DIRECT_URL';
const dbValue = process.env[dbVariable]?.trim();
if (!dbValue) throw new Error(`Missing ${dbVariable}`);
const dbUrl = new URL(dbValue);
if (!['postgres:', 'postgresql:'].includes(dbUrl.protocol)) throw new Error('Invalid PostgreSQL URL');
for (const param of ['sslmode', 'sslrootcert', 'sslcert', 'sslkey']) dbUrl.searchParams.delete(param);
// Railway: supply the PEM certificate as D1_BACKFILL_CA_CERT.
// Local development: fall back to the downloaded Supabase CA file.
const caFromEnv = process.env.D1_BACKFILL_CA_CERT?.trim().replace(/\\n/g, '\n');
const caPath = path.resolve(process.cwd(), process.env.D1_BACKFILL_CA_PATH || 'certs/prod-ca-2021.crt');
const ca = caFromEnv || fs.readFileSync(caPath, 'utf8');
if (!ca.includes('-----BEGIN CERTIFICATE-----') || !ca.includes('-----END CERTIFICATE-----')) {
  throw new Error('Invalid Supabase CA certificate: provide D1_BACKFILL_CA_CERT or a valid CA file');
}
const client = new pg.Client({
  connectionString: dbUrl.toString(),
  ssl: { ca, rejectUnauthorized: true },
  connectionTimeoutMillis: 20_000,
  query_timeout: 30_000,
  application_name: 'fxtrade-d1-close-backfill-v3',
});

function parseDay(value: string, name: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${name}: expected YYYY-MM-DD`);
  const ms = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(ms) || day(ms) !== value) throw new Error(`${name}: invalid date`);
  return ms;
}
const today = Date.parse(`${day(Date.now())}T00:00:00Z`);
const start = parseDay(process.env.D1_BACKFILL_START || day(today - 7 * DAY), 'D1_BACKFILL_START');
const end = parseDay(process.env.D1_BACKFILL_END || day(today - DAY), 'D1_BACKFILL_END');
if (start > end || end >= today) throw new Error('Date range must end before today UTC');

// Forex majors plus provider-confirmed precious metals.
// D1_BACKFILL_SYMBOLS in Railway overrides this default.
const DEFAULT_SYMBOLS = 'EURUSD,GBPUSD,USDJPY,USDCHF,AUDUSD,USDCAD,NZDUSD,XAUUSD,XAGUSD';
const configured = process.env.D1_BACKFILL_SYMBOLS?.trim() || DEFAULT_SYMBOLS;
const symbols = [...new Set(configured.split(/[\s,;]+/).map(s => s.trim().toUpperCase()).filter(Boolean))];
if (!symbols.length) throw new Error('No symbols configured');
const collectorSymbols = new Set(getCollectorSymbols(process.env.LIVE_RATES_INSTRUMENTS));
console.log(`Collector symbols available: ${collectorSymbols.size}; requested: ${symbols.length}`);

const REQUEST_GAP_MS = Math.max(1200, Number(process.env.D1_BACKFILL_REQUEST_GAP_MS) || 1200);
const failures: string[] = [];
let savedTotal = 0;
let emptyWindows = 0;
let skipped = 0;

async function fetchWindow(symbol: string, from: number, to: number): Promise<Record<string, unknown>> {
  const base = symbol.slice(0, 3);
  const quote = symbol.slice(3);
  const url = new URL('https://www.live-rates.com/historical/series');
  url.searchParams.set('base', base);
  url.searchParams.set('symbols', quote);
  url.searchParams.set('start', day(from));
  url.searchParams.set('end', day(to));
  url.searchParams.set('key', apiKey!);
  const response = await fetch(url, { signal: AbortSignal.timeout(25_000) });
  if (response.status === 429 || response.status === 503) {
    throw new Error(`RATE_LIMIT_${response.status}`);
  }
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
  const payload: unknown = await response.json();
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('INVALID_JSON_SHAPE');
  const root = payload as Record<string, unknown>;
  if ('error' in root || 'message' in root) throw new Error('PROVIDER_ERROR');
  const rates = root.rates && typeof root.rates === 'object' && !Array.isArray(root.rates)
    ? root.rates as Record<string, unknown> : root;
  return rates;
}

async function main() {
  console.log(`D1 Backfill V3: ${day(start)}..${day(end)} | ${symbols.join(', ')}`);
  console.log(`Database: ${dbUrl.hostname}:${dbUrl.port || 5432} | TLS certificate verified`);
  await client.connect();
  try {
    const result = await client.query(`SELECT to_regclass('public."MarketDailyClose"') AS name`);
    if (!result.rows[0]?.name) throw new Error('Missing public."MarketDailyClose"');
    for (const symbol of symbols) {
      if (!/^[A-Z]{6}$/.test(symbol)) {
        skipped++;
        failures.push(`${symbol}: unsupported instrument format`);
        continue;
      }
      for (let from = start; from <= end; from += 30 * DAY) {
        const to = Math.min(end, from + 29 * DAY);
        try {
          const rates = await fetchWindow(symbol, from, to);
          let saved = 0;
          for (const [date, raw] of Object.entries(rates)) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < day(from) || date > day(to)) continue;
            const value = raw && typeof raw === 'object' && !Array.isArray(raw)
              ? (raw as Record<string, unknown>)[symbol.slice(3)] : undefined;
            const close = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
            if (!Number.isFinite(close) || close <= 0) continue;
            await client.query(
              `INSERT INTO public."MarketDailyClose" ("symbol", "date", "close") VALUES ($1, $2::date, $3)
               ON CONFLICT ("symbol", "date") DO UPDATE SET "close"=EXCLUDED."close", "updatedAt"=NOW()`,
              [symbol, date, close],
            );
            saved++;
            savedTotal++;
          }
          if (!saved) emptyWindows++;
          console.log(`${symbol} ${day(from)}..${day(to)}: ${saved} closes`);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          failures.push(`${symbol} ${day(from)}..${day(to)}: ${message}`);
          console.error(`SKIPPED: ${failures[failures.length - 1]}`);
          if (message.startsWith('RATE_LIMIT_')) throw new Error(`Live-Rates rate limit: stopping globally to avoid lockout`);
          // Continue with the next symbol if provider rejects this one.
          if (message === 'PROVIDER_ERROR' || message.startsWith('HTTP_')) break;
        } finally {
          await sleep(REQUEST_GAP_MS);
        }
      }
    }
    console.log(`FINISHED: ${savedTotal} upserts | ${emptyWindows} empty windows | ${skipped} invalid symbols | ${failures.length} failures`);
    if (failures.length) console.log('Failures:\n' + failures.join('\n'));
    if (failures.length || emptyWindows) process.exitCode = 1;
  } finally {
    await client.end();
  }
}
main().catch(error => { console.error('BACKFILL FAILED:', error instanceof Error ? error.message : error); process.exitCode = 1; });
