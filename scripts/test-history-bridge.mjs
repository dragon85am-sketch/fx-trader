import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { HistoryBridge } from './history-bridge.mjs';
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fx-history-bridge-'));
const filename = path.join(dir, 'history.sqlite');
try {
  const b = new HistoryBridge({ filename });
  const minute = Math.floor((Date.now() - 15 * 60_000) / 60_000) * 60_000;
  const ticks = [
    {symbol:'EURUSD',price:1.10,timestamp:minute+1000},
    {symbol:'EURUSD',price:1.12,timestamp:minute+2000},
    {symbol:'EURUSD',price:1.09,timestamp:minute+3000},
    {symbol:'EURUSD',price:1.11,timestamp:minute+4000},
    {symbol:'BTCUSD',price:77000,timestamp:minute+5000},
  ];
  await b.ticks(ticks);
  const res = await b.read('EURUSD','1min',50);
  const row = res.rows.find(x=>x.bucket===minute);
  assert.ok(row);
  assert.equal(row.open,1.10); assert.equal(row.high,1.12);
  assert.equal(row.low,1.09); assert.equal(row.close,1.11);
  assert.equal((await b.stats()).stats.symbols,2);
  await b.close();
  const restarted = new HistoryBridge({ filename });
  assert.ok((await restarted.read('EURUSD','1min',50)).rows.some(x=>x.bucket===minute));
  await restarted.close();
  console.log('PASS: bridge -> worker -> SQLite, two symbols, OHLC, read, restart');
} finally { fs.rmSync(dir, {recursive:true,force:true}); }
