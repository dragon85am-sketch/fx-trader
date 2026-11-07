// Isolated prototype: closed journal segments + SQLite-committed idempotent replay.
// No concurrent writers; caller MUST hold an exclusive writer lock.
import fs from 'node:fs';
import path from 'node:path';
import { replayStream2H } from './stream-replay-2h.mjs';

const prefix='intake.segment.';
function syncDir(dir){
  // Directory fsync may not be available on Windows. Do not claim power-loss guarantees there.
  if(process.platform==='win32') return false;
  const fd=fs.openSync(dir,'r');try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}return true;
}
export function checkpoint2I(intake,{injectAt=null,chunkBytes=257,batchSize=211}={}){
  const dir=path.dirname(intake.log);
  const segments=()=>fs.readdirSync(dir).filter(n=>/^intake\.segment\.[0-9]+$/.test(n)).sort((a,b)=>Number(a.slice(prefix.length))-Number(b.slice(prefix.length)));
  // If a previous run crashed after rename, process those segments first.
  let rotated=false,removed=0,applied=0,read=0;
  if(fs.existsSync(intake.log)&&fs.statSync(intake.log).size){
    const names=segments();
    const next=names.length?Math.max(...names.map(n=>Number(n.slice(prefix.length))))+1:1;
    const target=path.join(dir,prefix+next);
    fs.renameSync(intake.log,target);
    rotated=true;
    syncDir(dir);
    if(injectAt==='after-rename')throw Error('INJECTED_AFTER_RENAME');
  }
  for(const name of segments()){
    const filename=path.join(dir,name);
    const segmentIntake=Object.create(intake); segmentIntake.log=filename;
    const result=replayStream2H(segmentIntake,{chunkBytes,batchSize});
    if(result.trailingBytes!==0)throw Error('TORN_SEGMENT_NOT_COMPACTED');
    read+=result.read;applied+=result.applied;
    if(injectAt==='after-commit')throw Error('INJECTED_AFTER_COMMIT');
    // All complete records in segment have committed; replay is idempotent if unlink fails.
    fs.unlinkSync(filename);removed++;
    syncDir(dir);
  }
  return {rotated,removed,read,applied,directorySynced:process.platform!=='win32'};
}
