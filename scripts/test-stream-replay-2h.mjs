import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {DurableIntake} from './durable-intake.mjs';
import {replayStream2H} from './stream-replay-2h.mjs';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'fx2h-'));
const tick=i=>({id:`h-${i}`,symbol:'EURUSD',price:1.1+i/10000000,timestamp:1700000000000+i});
let db;
try{
  db=new DurableIntake(root);
  const fd=fs.openSync(db.log,'a');
  try{for(let i=0;i<30000;i++)fs.writeSync(fd,JSON.stringify(tick(i))+'\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
  const size=fs.statSync(db.log).size;
  let r=replayStream2H(db,{chunkBytes:257,batchSize:211});
  assert.equal(r.applied,30000);assert.equal(r.read,30000);assert.equal(db.stats().ticks,30000);
  console.log(`PASS: streaming replay 30000 ticks, ${size} bytes, chunk=257, batch=211`);
  r=replayStream2H(db,{chunkBytes:311,batchSize:300});
  assert.equal(r.applied,0);assert.equal(db.stats().ticks,30000);
  console.log('PASS: replay twice without duplicate candles');
  fs.appendFileSync(db.log,'{"id":"unfinished"');
  r=replayStream2H(db,{chunkBytes:131,batchSize:100});
  assert.ok(r.trailingBytes>0);assert.equal(r.applied,0);
  console.log('PASS: torn trailing record ignored without losing committed history');
  fs.appendFileSync(db.log,'\n');
  assert.throws(()=>replayStream2H(db,{chunkBytes:257,batchSize:100}),/SyntaxError|Invalid tick/);
  assert.equal(db.stats().ticks,30000);
  console.log('PASS: invalid complete record fails closed; prior batches remain committed');
  console.log('NOTE: journal is NOT compacted, and replay commits in batches; full-file atomicity is NOT guaranteed. NOT FOR PRODUCTION.');
}finally{
  try{db?.close();}catch{}
  try{fs.rmSync(root,{recursive:true,force:true,maxRetries:15,retryDelay:200});}catch(e){console.warn('Temp cleanup:',e.code,root);}
}
