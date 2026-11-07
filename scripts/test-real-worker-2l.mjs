// FX TRADE 2L: isolated test of real HistoryBridge + HistorySQLite worker.
// No changes to Master Collector, Railway, or legacy queue.
import { HistoryBridge } from './history-bridge.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fx-2l-'));
const filename = path.join(dir, 'test.sqlite');
const journal = path.join(dir, 'intake.ndjson');
let bridge;
try {
  const minute = Math.floor((Date.now() - 180000) / 60000) * 60000;
  const ticks = Array.from({length:500}, (_, i) => ({
    source:'fx2l_test', seq:i+1, symbol:'EURUSD', price:1.1 + i/1e6,
    timestamp:minute + i*80,
  }));
  // Synchronous fsync before passing any tick to the actual worker.
  const fd=fs.openSync(journal,'w',0o600);
  try {for(const tick of ticks) fs.writeSync(fd,JSON.stringify(tick)+'\n');fs.fsyncSync(fd);} finally {fs.closeSync(fd);}
  bridge = new HistoryBridge({filename,maxPendingTicks:1000});
  await bridge.ready;
  for(let i=0;i<ticks.length;i+=100) await bridge.ticks(ticks.slice(i,i+100));
  const initial=await bridge.read('EURUSD','1min',5,minute+120000);
  assert.equal(initial.rows.reduce((n,r)=>n+r.ticks,0),500);
  console.log('PASS: 500 fsynced ticks committed by real history-worker in 5 batches');
  await bridge.close();bridge=null;

  // Simulate a restart: reopen the same DB and replay the durable journal.
  bridge = new HistoryBridge({filename,maxPendingTicks:1000});
  await bridge.ready;
  const recovered=fs.readFileSync(journal,'utf8').trimEnd().split('\n').map(JSON.parse);
  for(let i=0;i<recovered.length;i+=100) await bridge.ticks(recovered.slice(i,i+100));
  const again=await bridge.read('EURUSD','1min',5,minute+120000);
  assert.deepEqual(again.rows,initial.rows);
  console.log('PASS: restart + journal replay does not double-count OHLC');

  // Test rejection and atomic rollback of a mixed valid/invalid batch.
  const valid={source:'fx2l_test',seq:501,symbol:'EURUSD',price:1.3,timestamp:minute+1000};
  const invalid={source:'fx2l_test',seq:502,symbol:'EURUSD',price:-1,timestamp:minute+2000};
  await assert.rejects(bridge.ticks([valid,invalid]));
  const after=await bridge.read('EURUSD','1min',5,minute+120000);
  assert.deepEqual(after.rows,initial.rows);
  console.log('PASS: invalid batch rolls back candle and processed tick IDs');
  await bridge.ticks([valid]);
  const committed=await bridge.read('EURUSD','1min',5,minute+120000);
  assert.equal(committed.rows.reduce((n,r)=>n+r.ticks,0),501);
  console.log('PASS: rolled-back tick ID can be committed on retry');
  console.log('NOTE: isolated real-worker test only; no concurrent journal rotation, no Collector integration. DO NOT DEPLOY.');
} finally {
  if(bridge) await bridge.close().catch(()=>{});
  fs.rmSync(dir,{recursive:true,force:true,maxRetries:10,retryDelay:200});
}
