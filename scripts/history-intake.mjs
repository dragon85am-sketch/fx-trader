// FX TRADE dedicated durable SQLite intake; never touches legacy SQL queue.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import readline from 'node:readline';

export class HistoryIntake {
  constructor({dir,maxBytes=256*1024*1024,rotateBytes=4*1024*1024}={}) {
    if (!dir || !path.isAbsolute(dir)) throw Error('Absolute intake directory required');
    fs.mkdirSync(dir,{recursive:true});
    this.dir=dir;this.file=path.join(dir,'sqlite-intake.ndjson');
    this.lock=path.join(dir,'sqlite-intake.lock');this.maxBytes=maxBytes;
    this.rotateBytes=rotateBytes;this.source=crypto.randomUUID().replaceAll('-','');this.seq=0;
    this.lockFd=fs.openSync(this.lock,'wx',0o600);
    try {
      this.fd=fs.openSync(this.file,'a+',0o600);
      this.bytes=fs.fstatSync(this.fd).size;
      if(this.bytes>maxBytes)throw Error('SQLite intake journal cap exceeded');
    }catch(e){try{if(this.fd!==undefined)fs.closeSync(this.fd);fs.closeSync(this.lockFd);fs.unlinkSync(this.lock);}catch{}throw e;}
  }
  append(tick){
    const entry={...tick,source:this.source,seq:++this.seq};
    if(!/^[A-Z0-9]{3,20}$/.test(entry.symbol)||!Number.isFinite(entry.price)||entry.price<=0||!Number.isSafeInteger(entry.timestamp)||entry.timestamp<=0)throw Error('Invalid intake tick');
    const line=Buffer.from(JSON.stringify(entry)+'\n');
    if(this.bytes+line.length>this.maxBytes)throw Error('SQLite intake journal cap reached; stop LIVE safely');
    const written=fs.writeSync(this.fd,line,0,line.length);
    if(written!==line.length)throw Error('Short SQLite intake journal write');
    fs.fsyncSync(this.fd);this.bytes+=line.length;return entry;
  }
  segments(){return fs.readdirSync(this.dir).filter(n=>/^sqlite-intake\.segment-[a-f0-9]{32}\.ndjson$/.test(n)).sort().map(n=>path.join(this.dir,n));}
  async replayFile(file,bridge,batchSize){
    const size=fs.statSync(file).size;if(!size)return 0;
    const fd=fs.openSync(file,'r');
    try{const last=Buffer.alloc(1);fs.readSync(fd,last,0,1,size-1);if(last[0]!==10)throw Error(`Incomplete SQLite intake journal tail: ${file}`);}finally{fs.closeSync(fd);}
    const stream=fs.createReadStream(file,{encoding:'utf8'});
    const rl=readline.createInterface({input:stream,crlfDelay:Infinity});
    let batch=[],read=0;
    try{for await(const line of rl){if(!line)throw Error('Empty SQLite intake journal record');const tick=JSON.parse(line);if(typeof tick.source!=='string'||!Number.isSafeInteger(tick.seq)||tick.seq<1)throw Error('Invalid durable tick identity');batch.push(tick);read++;if(batch.length>=batchSize){await bridge.ticks(batch);batch=[];}}if(batch.length)await bridge.ticks(batch);}finally{rl.close();stream.destroy();}
    return read;
  }
  async replay(bridge,{batchSize=250}={}){
    let read=0;
    // Rotated segments are never deleted until all their ticks are committed.
    for(const segment of this.segments()){read+=await this.replayFile(segment,bridge,batchSize);fs.unlinkSync(segment);this.syncDir();}
    read+=await this.replayFile(this.file,bridge,batchSize);
    return {read};
  }
  syncDir(){if(process.platform==='win32')return;const fd=fs.openSync(this.dir,'r');try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}
  // Call ONLY after all intake ticks are acknowledged by SQLite and no appends are queued.
  // If interrupted, the segment is replayed idempotently on next startup.
  checkpoint(){
    if(!this.bytes)return false;
    const segment=path.join(this.dir,`sqlite-intake.segment-${crypto.randomUUID().replaceAll('-','')}.ndjson`);
    fs.fsyncSync(this.fd);fs.closeSync(this.fd);this.fd=undefined;
    fs.renameSync(this.file,segment);this.syncDir();
    this.fd=fs.openSync(this.file,'a+',0o600);this.bytes=0;fs.fsyncSync(this.fd);this.syncDir();
    // All entries in the rotated segment were committed before checkpoint() call.
    fs.unlinkSync(segment);this.syncDir();return true;
  }
  close(){try{if(this.fd!==undefined)fs.closeSync(this.fd);}finally{fs.closeSync(this.lockFd);fs.unlinkSync(this.lock);}}
}
