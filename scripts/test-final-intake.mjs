import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {HistoryBridge} from './history-bridge.mjs';
import {HistoryIntake} from './history-intake.mjs';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'fx-intake-final-'));
const file=path.join(dir,'history.sqlite');
let bridge, intake;
try {
  bridge=new HistoryBridge({filename:file});await bridge.ready;
  intake=new HistoryIntake({dir:path.join(dir,'intake')});
  const now=Date.now();
  for(let i=0;i<500;i++){const tick=intake.append({symbol:'EURUSD',price:1.1+i/1e6,timestamp:now+i});await bridge.ticks([tick]);}
  assert.equal((await bridge.stats()).stats.candles,1);
  intake.close();intake=null;await bridge.close();bridge=null;
  bridge=new HistoryBridge({filename:file});await bridge.ready;
  intake=new HistoryIntake({dir:path.join(dir,'intake')});
  assert.equal((await intake.replay(bridge)).read,500);
  const rows=(await bridge.read('EURUSD','1min',10,now+120000)).rows;
  assert.equal(rows.reduce((n,r)=>n+r.ticks,0),500);
  console.log('PASS: 500 durable ticks + restart replay, no double-count');
  assert.throws(()=>new HistoryIntake({dir:path.join(dir,'intake')}),/EEXIST/);
  console.log('PASS: exclusive intake writer lock');
  intake.close();intake=null;
  const journal=path.join(dir,'intake','sqlite-intake.ndjson');
  fs.appendFileSync(journal,'{"broken":');
  intake=new HistoryIntake({dir:path.join(dir,'intake')});
  await assert.rejects(intake.replay(bridge),/Incomplete/);
  console.log('PASS: torn tail fails closed');
}finally{try{intake?.close();}catch{}try{await bridge?.close();}catch{}fs.rmSync(dir,{recursive:true,force:true});}
