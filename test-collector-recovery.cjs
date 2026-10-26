'use strict';
// Run from the FX TRADE project root: node test-collector-recovery.cjs "C:\\...\\state.json"
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const snapshot = process.argv[2];
if (!snapshot) { console.error('Usage: node test-collector-recovery.cjs "PATH_TO_TEST_STATE_JSON"'); process.exit(2); }
const statePath = path.resolve(snapshot);
const queueDir = path.dirname(statePath);
const sourcePath = path.resolve('scripts/master-market-collector.ts');
if (!fs.existsSync(sourcePath) || !fs.existsSync(statePath)) { console.error('Missing source or test snapshot'); process.exit(2); }
if (path.resolve(queueDir) === path.resolve('/data/ohlc-queue')) throw Error('Refusing production queue directory');
const source = fs.readFileSync(sourcePath, 'utf8');
const original = JSON.parse(fs.readFileSync(statePath, 'utf8'));
assert.equal(original.version, 1, 'Expected V1 test backup');
assert(Array.isArray(original.pending) && Array.isArray(original.retryChunks));
const originalIds = original.retryChunks.flat().map(x => x.id);
const originalKeys = original.pending.map(x => x[0]);
const originalDigest = crypto.createHash('sha256').update(fs.readFileSync(statePath)).digest('hex');
const ts = require('typescript');
const augmented = source + `\n;globalThis.__recoveryResult = {version: 1, pending: [...pending.entries()], retryChunks: retryChunks.map(c => c.map(r => r.id)), recoveredRows: queueRecoveredRows, walSequence, walRecoveredTicks};\n`;
const js = ts.transpileModule(augmented, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
const mockSocket = { on(){return this;}, onAny(){return this;}, disconnect(){}, connect(){throw Error('Network connection blocked');}, removeAllListeners(){} };
const mockServer = { listen(){ /* never start HTTP */ }, close(cb){if(cb)cb();} };
const guardedFs = new Proxy(fs, { get(target, prop) {
  if (['writeFileSync','appendFileSync','renameSync','unlinkSync','truncateSync','ftruncateSync','openSync','rmSync','rmdirSync','copyFileSync'].includes(prop)) return () => { throw Error('Filesystem mutation blocked: ' + String(prop)); };
  if (prop === 'mkdirSync') return p => { if (!fs.existsSync(p)) throw Error('Test directory does not exist: ' + p); };
  const v = target[prop]; return typeof v === 'function' ? v.bind(target) : v;
}});
const fakeRequire = name => {
  if (name === '@prisma/client') return { PrismaClient: class { constructor(){} $executeRawUnsafe(){throw Error('Database blocked');} $disconnect(){} } };
  if (name === 'socket.io-client') return { io: () => mockSocket };
  if (name === 'dotenv') return { config(){} };
  if (name === 'node:http') return { createServer: () => mockServer };
  if (name === 'node:fs') return guardedFs;
  if (name === 'node:crypto') return crypto;
  if (name === 'node:path') return path;
  if (name.includes('master-symbols')) return { getCollectorSymbols: () => [], normalizeMarketSymbol: x => x, toLiveRatesSymbol: x => x };
  throw Error('Blocked dependency: ' + name);
};
const sandbox = {
  require: fakeRequire, exports: {}, module: {exports: {}},
  process: { env: { LIVE_RATES_API_KEY: 'OFFLINE_TEST_ONLY', OHLC_QUEUE_DIR: queueDir }, pid: 999999, exit: () => {throw Error('process.exit blocked');}, on(){} },
  console: {log(){},warn(){},error(...args){throw Error('Collector error: ' + args.join(' '));}},
  Buffer, Date, URL, Map, Set, Number, JSON, Math, String, Object, Array,
  setTimeout: () => {throw Error('Timer blocked');}, clearTimeout(){}
};
sandbox.globalThis = sandbox;
vm.runInNewContext(js, sandbox, { filename: sourcePath, timeout: 15000 });
const result = sandbox.__recoveryResult;
assert(result, 'Recovery did not run');
assert.equal(result.recoveredRows, originalKeys.length + originalIds.length);
assert.equal(result.pending.length, originalKeys.length);
assert.equal(JSON.stringify(result.pending.map(x => x[0])), JSON.stringify(originalKeys));
assert.equal(JSON.stringify(result.retryChunks.flat()), JSON.stringify(originalIds));
assert.equal(result.walSequence, 0);
assert.equal(result.walRecoveredTicks, 0);
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(statePath)).digest('hex'), originalDigest, 'Snapshot changed');
console.log('PASS: actual recoverQueue() executed offline');
console.log(JSON.stringify({pending: result.pending.length, retryChunks: result.retryChunks.length, retryRows: originalIds.length, total: result.recoveredRows, idsPreserved: true, sha256Unchanged: true}, null, 2));
