// Standalone destructive-crash simulation on a TEMPORARY database only.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { HistoryBridge } from './history-bridge.mjs';
const dir = mkdtempSync(path.join(os.tmpdir(), 'fx-history-crash-'));
const db = path.join(dir, 'crash-test.sqlite');
const now = Math.floor(Date.now()/60000)*60000 + 1000;
const symbol='EURUSD';
const tick=(i)=>({symbol,price:1.1+i*0.00001,timestamp:now+i});
const timeout=(p,ms=15000)=>Promise.race([p,new Promise((_,reject)=>setTimeout(()=>reject(new Error('Timeout')),ms))]);
let bridge;
try {
  bridge = new HistoryBridge({filename:db,maxPendingTicks:20000});
  await timeout(bridge.ticks(Array.from({length:500},(_,i)=>tick(i))));
  const before = await timeout(bridge.read(symbol,'1min',5,now+60000));
  assert.equal(before.rows.length,1);
  assert.equal(before.rows[0].ticks,500);
  // Abrupt termination: do NOT call close(); simulate Railway process death.
  await timeout(bridge.worker.terminate());
  bridge = new HistoryBridge({filename:db});
  const after = await timeout(bridge.read(symbol,'1min',5,now+60000));
  assert.deepEqual(after.rows,before.rows,'ACKed data must survive abrupt worker termination');
  console.log('PASS: 500 acknowledged ticks survive abrupt worker termination');
  // SQLite transaction atomicity under kill during a large batch: either 0 or all rows.
  // This is a smoke test, not proof of crash safety under power loss.
  const bulk=Array.from({length:1000},(_,i)=>({symbol:'GBPUSD',price:1.2+i*0.000001,timestamp:now+i}));
  const pending=bridge.ticks(bulk);
  await bridge.worker.terminate();
  try { await timeout(pending,1000); } catch {}
  bridge = new HistoryBridge({filename:db});
  const rows=await timeout(bridge.read('GBPUSD','1min',5,now+60000));
  const count=rows.rows[0]?.ticks??0;
  assert.ok(count===0||count===1000,`Partial transaction detected: ${count}`);
  console.log(`PASS: interrupted batch atomicity (${count} / 1000 ticks committed)`);
  const saved=await timeout(bridge.read(symbol,'1min',5,now+60000));
  assert.equal(saved.rows[0].ticks,500);
  console.log('PASS: existing history intact after second crash');
  console.log('NOTE: unacknowledged ticks may be lost; durable intake journal still required before production');
} finally {
  if(bridge) { try {await timeout(bridge.close(),2000);} catch {try{await bridge.worker.terminate();}catch{}} }
  rmSync(dir,{recursive:true,force:true});
}
