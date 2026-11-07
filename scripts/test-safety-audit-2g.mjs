// FX TRADE 2G: diagnostic tests of existing 2F prototype. Does NOT change production files.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SafeIntake2F } from './safe-intake-2f.mjs';

const root=fs.mkdtempSync(path.join(os.tmpdir(),'fx2g-audit-'));
const tick=i=>({id:`audit-${i}`,symbol:'EURUSD',price:1.1+i/1000000,timestamp:1700000000000+i});
let store;
const open=(name,options={})=>new SafeIntake2F(path.join(root,name),{maxJournalBytes:32*1024*1024,...options});
function close(){if(store){store.close();store=undefined;}}
try {
  // Stale lock must fail closed: never delete another process's lock automatically.
  const stale=path.join(root,'stale');fs.mkdirSync(stale);fs.writeFileSync(path.join(stale,'writer.lock'),'stale-test');
  assert.throws(()=>open('stale'),e=>e?.code==='EEXIST');
  console.log('PASS: stale writer lock fails closed (manual recovery required)');

  // Inject ENOSPC at journal fsync. This tests error propagation, not actual disk-full behavior.
  store=open('disk');
  const original=fs.fsyncSync;
  let injected=false;
  try {
    fs.fsyncSync=function(fd){if(!injected){injected=true;const e=new Error('simulated full disk');e.code='ENOSPC';throw e;}return original(fd);};
    assert.throws(()=>store.append(tick(1)),e=>e?.code==='ENOSPC');
  } finally {fs.fsyncSync=original;}
  assert.equal(injected,true);
  assert.equal(store.stats().ticks,0);
  console.log('PASS: injected ENOSPC is reported, no SQLite candle acknowledged');
  console.log('NOTE: failed fsync can leave unacknowledged bytes in journal; replay semantics need production policy');
  close();

  // A malformed complete record must roll back an entire replay transaction.
  store=open('corrupt');store.append(tick(2));
  fs.appendFileSync(path.join(root,'corrupt','intake.ndjson'),'{not valid json}\n');
  assert.throws(()=>store.replayAndCompact(),SyntaxError);
  assert.equal(store.stats().ticks,0);
  console.log('PASS: malformed complete journal record rolls back SQLite transaction');
  close();

  // Larger replay; report time, do not assert performance thresholds on user hardware.
  store=open('volume');
  const count=10000;
  for(let i=0;i<count;i++)store.append(tick(i+100));
  const bytes=store.stats().journalBytes;
  const t0=performance.now();
  const r=store.replayAndCompact();
  const ms=Math.round(performance.now()-t0);
  assert.equal(r.applied,count);assert.equal(store.stats().ticks,count);assert.equal(store.stats().journalBytes,0);
  console.log(`PASS: ${count} tick replay and compact; ${bytes} journal bytes; ${ms} ms`);
  close();
  console.log('AUDIT COMPLETE: 2G is not production readiness. Replay still reads full WAL into RAM; no safe lock takeover, real disk-full simulation, or collector integration. DO NOT DEPLOY.');
} finally {
  fs.fsyncSync=fs.fsyncSync;
  try{close();}catch(e){console.warn('close:',e.message);}
  try{fs.rmSync(root,{recursive:true,force:true,maxRetries:15,retryDelay:200});}catch(e){console.warn('Temporary files left:',root,e.code);}
}
