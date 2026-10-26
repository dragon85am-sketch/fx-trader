'use strict';
// Offline integration test of the actual collector's recovery, WAL append and checkpoint functions.
// Run from FX TRADE project root: node .\test-collector-wal.cjs "C:\...\state.json"
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const ts = require('typescript');
const snapshotArg = process.argv[2];
if (!snapshotArg) { console.error('Usage: node test-collector-wal.cjs "PATH_TO_TEST_STATE_JSON"'); process.exit(2); }
const snapshot = path.resolve(snapshotArg);
const sourcePath = path.resolve('scripts/master-market-collector.ts');
assert(fs.existsSync(snapshot) && fs.existsSync(sourcePath), 'Missing test snapshot or collector source');
const source = fs.readFileSync(sourcePath, 'utf8');
const original = fs.readFileSync(snapshot);
const originalHash = crypto.createHash('sha256').update(original).digest('hex');
const state = JSON.parse(original.toString('utf8'));
assert.equal(state.version, 1, 'Expected V1 test backup');
const baselinePending = state.pending.length;
const baselineRetry = state.retryChunks.reduce((n,c) => n+c.length,0);
const ids = state.retryChunks.flat().map(r=>r.id);
const originalKeys = state.pending.map(r=>r[0]);
const augmented = source + '\n;globalThis.__test = { recoverQueue, queueDbTick, saveQueue, status: () => ({ pending: [...pending.entries()], retryChunks: retryChunks.map(c=>c.map(r=>r.id)), walSequence, walRecoveredTicks }) };\n';
const js = ts.transpileModule(augmented, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
const temp = fs.mkdtempSync(path.join(os.tmpdir(),'fx-trade-wal-test-'));
const dir = path.join(temp,'ohlc-queue');
fs.mkdirSync(dir);
fs.writeFileSync(path.join(dir,'state.json'),original);
const realDir = fs.realpathSync(dir);
function allowed(p) {
  const resolved = path.resolve(String(p));
  if (resolved !== realDir && !resolved.startsWith(realDir + path.sep)) throw Error('Filesystem access outside isolated test directory: '+resolved);
  return resolved;
}
const allowedFds = new Set();
const guardedFs = new Proxy(fs, {get(target,prop){
  if (prop==='openSync') return (...args) => {allowed(args[0]); const fd=target.openSync(...args); allowedFds.add(fd); return fd;};
  if (prop==='closeSync') return fd => {allowedFds.delete(fd);return target.closeSync(fd);};
  if (['ftruncateSync','fsyncSync'].includes(prop)) return (fd,...args) => {if(!allowedFds.has(fd))throw Error('FD not allowed');return target[prop](fd,...args);};
  if (prop==='writeFileSync') return (p,...args) => {if(typeof p==='number'){if(!allowedFds.has(p))throw Error('FD not allowed');}else allowed(p);return target.writeFileSync(p,...args);};
  if (['openSync','writeFileSync','appendFileSync','renameSync','unlinkSync','truncateSync','copyFileSync','rmSync','rmdirSync','mkdirSync'].includes(prop)) return (...args) => {
    if (prop==='renameSync' || prop==='copyFileSync') {allowed(args[0]);allowed(args[1]);}
    else allowed(args[0]);
    return target[prop](...args);
  };
  return typeof target[prop] === 'function' ? target[prop].bind(target) : target[prop];
}});
function boot() {
  const socket={on(){return this;},onAny(){return this;},disconnect(){},connect(){throw Error('Network blocked');},removeAllListeners(){}};
  const server={listen(){},close(cb){if(cb)cb();}};
  const fakeRequire=name=>{
    if(name==='@prisma/client') return {PrismaClient:class{$executeRawUnsafe(){throw Error('Database blocked');}$disconnect(){}}};
    if(name==='socket.io-client') return {io:()=>socket};
    if(name==='dotenv') return {config(){}};
    if(name==='node:http') return {createServer:()=>server};
    if(name==='node:fs') return guardedFs;
    if(name==='node:crypto') return crypto;
    if(name==='node:path') return path;
    if(name.includes('master-symbols')) return {getCollectorSymbols:()=>[],normalizeMarketSymbol:x=>x,toLiveRatesSymbol:x=>x};
    throw Error('Blocked dependency: '+name);
  };
  let lastError='';
  const sandbox={require:fakeRequire,exports:{},module:{exports:{}},
    process:{env:{LIVE_RATES_API_KEY:'OFFLINE_TEST_ONLY',OHLC_QUEUE_DIR:dir},pid:999999,exit(){throw Error('process.exit blocked: '+lastError);},on(){}},
    console:{log(){},warn(){},error(...args){lastError=args.map(String).join(' ');}},Buffer,Date,URL,Map,Set,Number,JSON,Math,String,Object,Array,
    setTimeout(){return 1;},clearTimeout(){}};
  sandbox.globalThis=sandbox;
  vm.runInNewContext(js,sandbox,{filename:sourcePath,timeout:30000});
  return sandbox.__test;
}
function inspect(t) { const s=t.status();return {pending:s.pending.length,retryRows:s.retryChunks.reduce((n,c)=>n+c.length,0),ids:Array.from(s.retryChunks.flat()),keys:Array.from(s.pending.map(r=>r[0])),seq:s.walSequence,replayed:s.walRecoveredTicks}; }
try {
  const first=boot();
  let before=inspect(first);
  assert.equal(before.pending,baselinePending);
  assert.equal(before.retryRows,baselineRetry);
  assert.deepEqual(before.ids,ids);
  assert.deepEqual(before.keys,originalKeys);
  const tick={symbol:'XAUUSD',price:2734.56,timestamp:Date.now()-120000};
  first.queueDbTick(tick);
  const afterWrite=inspect(first);
  assert.equal(afterWrite.seq,1);
  assert.equal(afterWrite.retryRows,baselineRetry);
  const walPath=path.join(dir,'ticks.wal');
  const wal=fs.readFileSync(walPath,'utf8');
  const line=JSON.parse(wal.trim());
  assert.equal(line.seq,1);
  assert.equal(line.sha256,crypto.createHash('sha256').update(JSON.stringify({seq:line.seq,tick:line.tick})).digest('hex'));
  const reboot=boot();
  const recovered=inspect(reboot);
  assert.equal(recovered.seq,1);
  assert.equal(recovered.replayed,1);
  assert.equal(recovered.retryRows,baselineRetry);
  assert.deepEqual(recovered.ids,ids);
  assert.equal(recovered.pending,afterWrite.pending);
  assert.deepEqual(recovered.keys,afterWrite.keys);
  reboot.saveQueue();
  const persisted=JSON.parse(fs.readFileSync(path.join(dir,'state.json'),'utf8'));
  assert.equal(persisted.version,2);
  assert.equal(persisted.walSequence,1);
  assert.equal(fs.readFileSync(walPath,'utf8'),'');
  const checkpointReboot=boot();
  const checkpointState=inspect(checkpointReboot);
  assert.equal(checkpointState.seq,1);
  assert.equal(checkpointState.replayed,0);
  assert.deepEqual(checkpointState.ids,ids);
  assert.equal(checkpointState.pending,recovered.pending);
  // Deliberately damage a WAL line; recovery must fail closed, without deleting it.
  const tick2={symbol:'XAUUSD',price:2735.12,timestamp:Date.now()-60000};
  checkpointReboot.queueDbTick(tick2);
  const goodWal=fs.readFileSync(walPath,'utf8');
  const tampered=JSON.parse(goodWal.trim());
  tampered.tick.price+=1;
  const damaged=JSON.stringify(tampered)+'\n';
  fs.writeFileSync(walPath,damaged);
  let rejected=false;
  try {boot();} catch(e) {rejected=/checksum mismatch/i.test(String(e));if(!rejected)throw e;}
  assert(rejected,'Damaged WAL must fail checksum validation');
  assert.equal(fs.readFileSync(walPath,'utf8'),damaged,'Damaged WAL must remain intact');
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(snapshot)).digest('hex'),originalHash,'Original test snapshot changed');
  console.log('PASS: offline WAL write, reboot recovery, checkpoint, corruption detection');
  console.log(JSON.stringify({originalRows:baselinePending+baselineRetry,originalRetryIdsPreserved:true,walChecksumValid:true,walRecoveredTicks:recovered.replayed,checkpointVersion:persisted.version,checkpointWalSequence:persisted.walSequence,corruptWalRejected:true,originalSnapshotUnchanged:true,networkAndDatabaseBlocked:true},null,2));
} finally {
  fs.rmSync(temp,{recursive:true,force:true});
}
