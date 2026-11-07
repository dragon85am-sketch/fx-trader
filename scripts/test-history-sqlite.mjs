import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { HistorySQLite } from './history-sqlite.mjs';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'fx-history-'));
try {
  const db=new HistorySQLite(path.join(dir,'history.sqlite'));
  const t=Date.UTC(2026,9,30,10,0,0);
  db.acceptTick({symbol:'BTCUSD',price:77000,timestamp:t+1000});
  db.acceptTick({symbol:'BTCUSD',price:77100,timestamp:t+2000});
  db.acceptTick({symbol:'BTCUSD',price:76900,timestamp:t+3000});
  db.acceptTick({symbol:'BTCUSD',price:77050,timestamp:t+61000});
  const m1=db.candles('BTCUSD','1min',20,t+180000);
  assert.equal(m1.length,2);
  assert.deepEqual([m1[0].open,m1[0].high,m1[0].low,m1[0].close,m1[0].ticks],[77000,77100,76900,76900,3]);
  const m5=db.candles('BTCUSD','5min',20,t+600000);
  assert.equal(m5[0].close,77050);
  assert.equal(db.stats().symbols,1);
  db.close();
  const reopened=new HistorySQLite(path.join(dir,'history.sqlite'));
  assert.equal(reopened.candles('BTCUSD','1min',20,t+180000).length,2);
  reopened.close();
  console.log('PASS: M1, M5, OHLC, persistence after restart');
} finally {fs.rmSync(dir,{recursive:true,force:true});}
