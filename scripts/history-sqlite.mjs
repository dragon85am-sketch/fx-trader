// FX TRADE: isolated 30-day OHLC M1 storage. Node.js >=22.13 required.
// Does not read, modify or replay the legacy /data/ohlc-queue.
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const MINUTE = 60_000;
const DAY = 86_400_000;
const FRAMES = Object.freeze({ '1min':MINUTE,'5min':5*MINUTE,'15min':15*MINUTE,'30min':30*MINUTE,'1h':60*MINUTE,'4h':240*MINUTE,'1day':DAY });

export class HistorySQLite {
  constructor(filename = process.env.OHLC_HISTORY_SQLITE_PATH || '/data/ohlc-history/history.sqlite') {
    if (!path.isAbsolute(filename)) throw new Error('SQLite path must be absolute');
    fs.mkdirSync(path.dirname(filename), {recursive:true});
    this.filename = filename;
    this.db = new DatabaseSync(filename);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=3000;
      CREATE TABLE IF NOT EXISTS candles_m1 (
        symbol TEXT NOT NULL, bucket INTEGER NOT NULL,
        open REAL NOT NULL, high REAL NOT NULL, low REAL NOT NULL, close REAL NOT NULL,
        first_at INTEGER NOT NULL, last_at INTEGER NOT NULL, ticks INTEGER NOT NULL,
        PRIMARY KEY(symbol,bucket)
      ) WITHOUT ROWID;
      CREATE INDEX IF NOT EXISTS idx_candles_time ON candles_m1(bucket);
       CREATE TABLE IF NOT EXISTS processed_ticks (source TEXT NOT NULL, seq INTEGER NOT NULL, PRIMARY KEY(source,seq)) WITHOUT ROWID;`);
    this.upsert = this.db.prepare(`INSERT INTO candles_m1(symbol,bucket,open,high,low,close,first_at,last_at,ticks)
      VALUES(?,?,?,?,?,?,?,?,1) ON CONFLICT(symbol,bucket) DO UPDATE SET
        open=CASE WHEN excluded.first_at < candles_m1.first_at THEN excluded.open ELSE candles_m1.open END,
        high=max(candles_m1.high,excluded.high),low=min(candles_m1.low,excluded.low),
        close=CASE WHEN excluded.last_at >= candles_m1.last_at THEN excluded.close ELSE candles_m1.close END,
        first_at=min(candles_m1.first_at,excluded.first_at),
        last_at=max(candles_m1.last_at,excluded.last_at), ticks=candles_m1.ticks+1`);
    this.lastPruneAt = 0;
  }
  acceptTick({symbol,price,timestamp,source,seq}) {
    if (!/^[A-Z0-9]{3,20}$/.test(symbol) || !Number.isFinite(price) || price<=0 || !Number.isSafeInteger(timestamp) || timestamp<=0) throw new Error('Invalid tick');
    if (source !== undefined || seq !== undefined) {
      if (typeof source !== "string" || !/^[A-Za-z0-9_-]{1,80}$/.test(source) || !Number.isSafeInteger(seq) || seq < 1) throw new Error("Invalid durable tick identity");
      const inserted=this.db.prepare("INSERT OR IGNORE INTO processed_ticks(source,seq) VALUES(?,?)").run(source,seq);
      if (!inserted.changes) return false;
    }
    const bucket=Math.floor(timestamp/MINUTE)*MINUTE;
    this.upsert.run(symbol,bucket,price,price,price,price,timestamp,timestamp);
    return true;
  }
  prune(now=Date.now()) {
    if (now-this.lastPruneAt < 60*MINUTE) return 0;
    const result=this.db.prepare('DELETE FROM candles_m1 WHERE bucket < ?').run(now-30*DAY);
    this.lastPruneAt=now;
    return Number(result.changes);
  }
  candles(symbol,interval='1min',limit=500,before=Date.now()) {
    const size=FRAMES[interval];
    if (!size || !/^[A-Z0-9]{3,20}$/.test(symbol)) throw new Error('Invalid symbol or interval');
    const count=Math.max(1,Math.min(2000,Math.trunc(limit)||500));
    if (!Number.isFinite(before)) throw new Error('Invalid before');
    const maxBucket=Math.floor(before/size)*size;
    // The query aggregates M1 to the selected timeframe. Restrict to complete
    // bucket windows when requesting historical pages; the live candle is separate.
    const rows=this.db.prepare(`SELECT bucket,open,high,low,close,first_at,last_at,ticks FROM candles_m1
      WHERE symbol=? AND bucket<? ORDER BY bucket DESC LIMIT ?`).all(symbol,maxBucket,count*Math.round(size/MINUTE));
    const grouped=new Map();
    for (const r of rows.reverse()) {
      const bucket=Math.floor(r.bucket/size)*size;
      let g=grouped.get(bucket);
      if (!g) {g={bucket,open:r.open,high:r.high,low:r.low,close:r.close,firstAt:r.first_at,lastAt:r.last_at,ticks:r.ticks};grouped.set(bucket,g);}
      else {if(r.first_at<g.firstAt){g.open=r.open;g.firstAt=r.first_at;} if(r.last_at>=g.lastAt){g.close=r.close;g.lastAt=r.last_at;}g.high=Math.max(g.high,r.high);g.low=Math.min(g.low,r.low);g.ticks+=r.ticks;}
    }
    return [...grouped.values()].slice(-count);
  }
  stats() {
    const row=this.db.prepare('SELECT COUNT(*) AS candles,COUNT(DISTINCT symbol) AS symbols,MIN(bucket) AS oldest,MAX(bucket) AS latest FROM candles_m1').get();
    const main=fs.existsSync(this.filename)?fs.statSync(this.filename).size:0;
    const wal=fs.existsSync(this.filename+'-wal')?fs.statSync(this.filename+'-wal').size:0;
    return {...row,bytes:main+wal,filename:this.filename};
  }
  close(){this.db.close();}
}
