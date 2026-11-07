// FX TRADE 2H: isolated bounded-memory replay prototype; NOT production integration.
import fs from 'node:fs';
import { StringDecoder } from 'node:string_decoder';

export function replayStream2H(intake,{chunkBytes=64*1024,batchSize=500,maxLineBytes=4096}={}) {
  if (!Number.isSafeInteger(chunkBytes)||chunkBytes<64||!Number.isSafeInteger(batchSize)||batchSize<1||!Number.isSafeInteger(maxLineBytes)||maxLineBytes<64) throw Error('Invalid limits');
  if (!fs.existsSync(intake.log)) return {read:0,applied:0,batches:0,trailingBytes:0};
  const fd=fs.openSync(intake.log,'r');
  const decoder=new StringDecoder('utf8');
  const buf=Buffer.alloc(chunkBytes);
  let tail='',read=0,applied=0,batches=0,offset=0;
  let batch=[];
  const commit=()=>{
    if (!batch.length) return;
    intake.db.exec('BEGIN IMMEDIATE');
    try {for(const tick of batch) if(intake.apply(tick))applied++;intake.db.exec('COMMIT');}
    catch(e){intake.db.exec('ROLLBACK');throw e;}
    read+=batch.length;batches++;batch=[];
  };
  try {
    while(true){
      const n=fs.readSync(fd,buf,0,buf.length,offset);
      if(n===0) break;
      offset+=n;
      const data=tail+decoder.write(buf.subarray(0,n));
      const lines=data.split('\n');tail=lines.pop();
      if(Buffer.byteLength(tail,'utf8')>maxLineBytes) throw Error('JOURNAL_LINE_TOO_LONG');
      for(const line of lines){
        if(Buffer.byteLength(line,'utf8')>maxLineBytes) throw Error('JOURNAL_LINE_TOO_LONG');
        if(!line) throw Error('EMPTY_JOURNAL_RECORD');
        const tick=JSON.parse(line);
        intake.validate(tick);
        batch.push(tick);
        if(batch.length>=batchSize)commit();
      }
    }
    tail+=decoder.end();
    if(Buffer.byteLength(tail,'utf8')>maxLineBytes)throw Error('JOURNAL_LINE_TOO_LONG');
    commit();
    return {read,applied,batches,trailingBytes:Buffer.byteLength(tail,'utf8')};
  } finally {fs.closeSync(fd);}
}
