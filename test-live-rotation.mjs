import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {HistoryIntake} from './history-intake.mjs';
import {HistoryBridge} from './history-bridge.mjs';

const root=fs.mkdtempSync(path.join(os.tmpdir(),'fx-live-rotation-'));
const dir=path.join(root,'intake');
const filename=path.join(root,'history.sqlite');
let bridge, intake;
const symbols=Array.from({length:125},(_,i)=>`FX${String(i).padStart(3,'0')}`);
const base=Math.floor(Date.now()/60000)*60000-120000;
const total=7500;
let committed=0,rotations=0,serial=Promise.resolve();
try {
  bridge=new HistoryBridge({filename,maxPendingTicks:5000}); await bridge.ready;
  intake=new HistoryIntake({dir,maxBytes:8*1024*1024,rotateBytes:8192});
  // Simulate 125 symbols arriving while prior SQLite commits/checkpoints are pending.
  // The same serial boundary is used by the real Master Collector.
  const jobs=[];
  for(let i=0;i<total;i++) {
    const index=i;
    const job=serial=serial.then(async()=>{
      const tick={symbol:symbols[index%125],price:1.1+(index%91)/10000,timestamp:base+Math.floor(index/125)*10};
      const durable=intake.append(tick);
      await bridge.ticks([durable]);
      committed++;
      if(intake.bytes>=intake.rotateBytes){assert.equal(committed,index+1);intake.checkpoint();rotations++;}
    });
    jobs.push(job);
  }
  await Promise.all(jobs);
  assert.ok(rotations>10);
  let stats=await bridge.stats();
  assert.equal(stats.stats.symbols,125);
  assert.equal(stats.stats.candles,125);
  console.log(`PASS: ${total} LIVE ticks / 125 instruments committed, ${rotations} checkpoints while events queued`);
  intake.close(); intake=null; await bridge.close();bridge=null;
  bridge=new HistoryBridge({filename,maxPendingTicks:5000});await bridge.ready;
  intake=new HistoryIntake({dir,maxBytes:8*1024*1024,rotateBytes:8192});
  const replay=await intake.replay(bridge);
  assert.ok(replay.read>=0);
  const after=await bridge.stats();
  assert.equal(after.stats.candles,125);
  const rows=await bridge.read('FX000','1min',5,Date.now());
  assert.equal(rows.rows.reduce((sum,r)=>sum+r.ticks,0),total/125);
  console.log(`PASS: restart + replay (${replay.read} records) keeps exact candle tick counts`);
  intake.checkpoint();
  const remaining=fs.readdirSync(dir).filter(x=>x.endsWith('.ndjson'));
  assert.equal(remaining.length,1);
  assert.equal(fs.statSync(path.join(dir,remaining[0])).size,0);
  console.log('PASS: checkpoints leave no pending segments; dedicated journal empty');
  console.log('PASS: all 3 concurrent-queue rotation checks (isolated simulation; NOT production LIVE feed)');
}finally {
  try{if(intake)intake.close();}catch{}
  try{if(bridge)await bridge.close();}catch{}
  fs.rmSync(root,{recursive:true,force:true});
}
