import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DurableIntake } from './durable-intake.mjs';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'fx-2e-'));
try {
  const t0=Date.now();
  const ticks=Array.from({length:500},(_,i)=>({id:`test-${i}`,symbol:i%2?'EURUSD':'XAUUSD',price:1+i/1000,timestamp:t0+i}));
  let intake=new DurableIntake(dir);
  ticks.forEach(t=>intake.append(t)); // crash before applying any tick
  intake.close();
  intake=new DurableIntake(dir);
  let r=intake.replay();
  assert.equal(r.applied,500); assert.equal(intake.stats().ticks,500);
  console.log('PASS: 500 fsynced intake ticks replayed after restart');
  intake.close();
  intake=new DurableIntake(dir);
  r=intake.replay();
  assert.equal(r.applied,0); assert.equal(intake.stats().ticks,500);
  console.log('PASS: second replay is idempotent (0 duplicate ticks)');
  intake.close();
  // Simulate torn final line; only complete lines are replayed.
  fs.appendFileSync(path.join(dir,'intake.ndjson'),'CORRUPT_PARTIAL');
  intake=new DurableIntake(dir);
  r=intake.replay();
  assert.equal(r.applied,0); assert.equal(intake.stats().ticks,500);
  console.log('PASS: incomplete final journal record ignored');
  intake.close();
  console.log('NOTE: no disk-full or concurrent-writer guarantees; production integration NOT ready');
} finally {fs.rmSync(dir,{recursive:true,force:true});}
