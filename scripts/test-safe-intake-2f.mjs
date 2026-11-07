import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {SafeIntake2F} from './safe-intake-2f.mjs';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'fx2f-'));
const tick=i=>({id:`tick-${i}`,symbol:'EURUSD',price:1.1+i/100000,timestamp:1700000000000+i});
let a;
try {
  a=new SafeIntake2F(dir,{maxJournalBytes:100000});
  for(let i=0;i<500;i++)a.append(tick(i));
  assert.throws(()=>new SafeIntake2F(dir),/EEXIST/);
  console.log('PASS: concurrent writer rejected by exclusive lock');
  a.close(); a=null;
  a=new SafeIntake2F(dir,{maxJournalBytes:100000});
  let r=a.replayAndCompact();assert.equal(r.applied,500);assert.equal(a.stats().journalBytes,0);
  console.log('PASS: restart replay 500 ticks and compact committed journal');
  for(let i=0;i<500;i++)a.append(tick(i));
  r=a.replayAndCompact();assert.equal(r.applied,0);assert.equal(a.stats().ticks,500);
  console.log('PASS: repeated tick IDs remain idempotent after compaction');
  a.close(); a=null;
  a=new SafeIntake2F(dir,{maxJournalBytes:20});
  assert.throws(()=>a.append(tick(999)),/JOURNAL_LIMIT_REACHED/);
  assert.equal(a.stats().ticks,500);
  console.log('PASS: journal size cap refuses intake without corrupting history');
  a.close(); a=null;
  console.log('NOTE: 2F is isolated proof of concept; disk-full, stale lock recovery, bounded replay, true batching, and collector integration still require work. DO NOT DEPLOY.');
} finally {
  try { a?.close(); } catch (e) { if (e?.code !== 'ENOENT' && e?.code !== 'EBADF') console.warn('Cleanup close:', e.message); }
  // Windows may hold SQLite WAL/SHM handles briefly after closing.
  try { fs.rmSync(dir,{recursive:true,force:true,maxRetries:15,retryDelay:200}); }
  catch (e) { console.warn('NOTE: temp test folder could not be removed:', dir, e.code); }
}
