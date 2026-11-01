// FX TRADE stage 2E: standalone durable intake proof-of-concept.
// Does not touch the existing Collector or legacy WAL.
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export class DurableIntake {
  constructor(dir) {
    if (!path.isAbsolute(dir)) throw new Error('Absolute path required');
    fs.mkdirSync(dir,{recursive:true});
    this.log=path.join(dir,'intake.ndjson');
    this.db=new DatabaseSync(path.join(dir,'history.sqlite'));
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;
      CREATE TABLE IF NOT EXISTS applied(id TEXT PRIMARY KEY) WITHOUT ROWID;
      CREATE TABLE IF NOT EXISTS candles(symbol TEXT NOT NULL,bucket INTEGER NOT NULL,open REAL NOT NULL,high REAL NOT NULL,low REAL NOT NULL,close REAL NOT NULL,first_at INTEGER NOT NULL,last_at INTEGER NOT NULL,ticks INTEGER NOT NULL,PRIMARY KEY(symbol,bucket)) WITHOUT ROWID;`);
    this.exists=this.db.prepare('SELECT 1 FROM applied WHERE id=?');
    this.mark=this.db.prepare('INSERT INTO applied(id) VALUES(?)');
    this.upsert=this.db.prepare(`INSERT INTO candles VALUES(?,?,?,?,?,?,?,?,1) ON CONFLICT(symbol,bucket) DO UPDATE SET
      open=CASE WHEN excluded.first_at<candles.first_at THEN excluded.open ELSE candles.open END,
      high=max(candles.high,excluded.high),low=min(candles.low,excluded.low),
      close=CASE WHEN excluded.last_at>=candles.last_at THEN excluded.close ELSE candles.close END,
      first_at=min(candles.first_at,excluded.first_at),last_at=max(candles.last_at,excluded.last_at),ticks=candles.ticks+1`);
  }
  validate(t) {
    if (!t || typeof t.id!=='string' || !/^[a-zA-Z0-9:_-]{1,100}$/.test(t.id) || !/^[A-Z0-9]{3,20}$/.test(t.symbol) || !Number.isFinite(t.price) || t.price<=0 || !Number.isSafeInteger(t.timestamp) || t.timestamp<=0) throw new Error('Invalid tick');
  }
  // Returns only after bytes have been fsync'd. Caller must supply a stable unique ID.
  append(t) {
    this.validate(t);
    const fd=fs.openSync(this.log,'a',0o600);
    try { fs.writeSync(fd,JSON.stringify(t)+'\n'); fs.fsyncSync(fd); }
    finally { fs.closeSync(fd); }
  }
  apply(t) {
    this.validate(t);
    if (this.exists.get(t.id)) return false;
    const bucket=Math.floor(t.timestamp/60000)*60000;
    this.upsert.run(t.symbol,bucket,t.price,t.price,t.price,t.price,t.timestamp,t.timestamp);
    this.mark.run(t.id);
    return true;
  }
  replay() {
    if (!fs.existsSync(this.log)) return {read:0,applied:0};
    const buf=fs.readFileSync(this.log);
    const end=buf.lastIndexOf(10); // ignore torn final line
    const lines=end<0?[]:buf.subarray(0,end+1).toString('utf8').split('\n').filter(Boolean);
    let applied=0;
    this.db.exec('BEGIN IMMEDIATE');
    try {
      for (const line of lines) if(this.apply(JSON.parse(line))) applied++;
      this.db.exec('COMMIT');
    } catch(e) {this.db.exec('ROLLBACK');throw e;}
    return {read:lines.length,applied};
  }
  stats() {return this.db.prepare('SELECT COALESCE(SUM(ticks),0) AS ticks,COUNT(*) AS candles FROM candles').get();}
  close(){this.db.close();}
}
