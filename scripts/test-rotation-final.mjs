import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {HistoryIntake} from './history-intake.mjs';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'fx-rotation-'));
const seen=new Set();let accepted=0;
const bridge={async ticks(batch){for(const t of batch){const key=`${t.source}:${t.seq}`;if(!seen.has(key)){seen.add(key);accepted++;}}}};
const tick={symbol:'EURUSD',price:1.1234,timestamp:Date.now()};
try{
 let intake=new HistoryIntake({dir,rotateBytes:1000});
 for(let i=0;i<500;i++)intake.append(tick);
 await intake.replay(bridge);assert.equal(accepted,500);
 intake.checkpoint();assert.equal(intake.bytes,0);intake.close();
 console.log('PASS: 500 committed ticks checkpointed and journal cleared');
 intake=new HistoryIntake({dir});await intake.replay(bridge);assert.equal(accepted,500);
 console.log('PASS: restart does not duplicate committed ticks');
 for(let i=0;i<50;i++)intake.append(tick);
 // Simulate crash after rename, before new file creation/deletion.
 fs.closeSync(intake.fd);intake.fd=undefined;
 const segment=path.join(dir,'sqlite-intake.segment-'+ 'a'.repeat(32)+'.ndjson');
 fs.renameSync(intake.file,segment);
 fs.closeSync(intake.lockFd);fs.unlinkSync(intake.lock);
 intake=new HistoryIntake({dir});await intake.replay(bridge);assert.equal(accepted,550);
 assert.equal(intake.segments().length,0);
 console.log('PASS: interrupted rotation segment recovered, no tick loss');
 intake.checkpoint();intake.close();
 console.log('PASS: all 3 rotation checks');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
