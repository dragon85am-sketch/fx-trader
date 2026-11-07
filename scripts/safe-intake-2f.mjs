// FX TRADE 2F: isolated safety harness; NOT a production collector integration.
import fs from 'node:fs';
import path from 'node:path';
import { DurableIntake } from './durable-intake.mjs';
export class SafeIntake2F {
  constructor(dir,{maxJournalBytes=8*1024*1024,batchSize=500}={}) {
    if (!path.isAbsolute(dir)) throw Error('Absolute path required');
    fs.mkdirSync(dir,{recursive:true});
    this.dir=dir; this.lockPath=path.join(dir,'writer.lock');
    this.lockFd=fs.openSync(this.lockPath,'wx',0o600); // fail closed if another writer or stale lock
    try {
      fs.writeSync(this.lockFd,JSON.stringify({pid:process.pid,createdAt:new Date().toISOString()})); fs.fsyncSync(this.lockFd);
      this.intake=new DurableIntake(dir);
      this.maxJournalBytes=maxJournalBytes; this.batchSize=batchSize;
      this.metrics={appended:0,applied:0,replays:0,errors:0};
    } catch(e) {fs.closeSync(this.lockFd);fs.unlinkSync(this.lockPath);throw e;}
  }
  append(t) {
    const bytes=Buffer.byteLength(JSON.stringify(t)+'\n');
    const size=fs.existsSync(this.intake.log)?fs.statSync(this.intake.log).size:0;
    if (size+bytes>this.maxJournalBytes) {this.metrics.errors++;throw Error('JOURNAL_LIMIT_REACHED: refuse new tick, do not silently drop');}
    this.intake.append(t);this.metrics.appended++;
  }
  // The underlying 2E replay is a single SQLite transaction; this is NOT bounded-memory streaming.
  replayAndCompact() {
    const r=this.intake.replay();this.metrics.applied+=r.applied;this.metrics.replays++;
    // Important: after successful SQLite COMMIT only, truncate journal and fsync.
    // If crash occurs before truncation, applied(id) makes replay idempotent.
    // Windows: O_APPEND ('a+') forbids truncation via ftruncate on some filesystems.
    // DurableIntake.replay() returns no rows if journal does not exist.
    if (!fs.existsSync(this.intake.log)) return r;
    const fd=fs.openSync(this.intake.log,'r+');
    try {fs.ftruncateSync(fd,0);fs.fsyncSync(fd);} finally {fs.closeSync(fd);}
    return r;
  }
  stats() {return {...this.metrics,...this.intake.stats(),journalBytes:fs.existsSync(this.intake.log)?fs.statSync(this.intake.log).size:0,lockHeld:true};}
  close() {try{this.intake.close();}finally{fs.closeSync(this.lockFd);fs.unlinkSync(this.lockPath);}}
}
