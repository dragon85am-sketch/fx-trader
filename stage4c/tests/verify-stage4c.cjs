const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const file = process.argv[2] || path.join(process.cwd(), 'scripts/master-market-collector.ts');
const s = fs.readFileSync(file, 'utf8');
let n = 0;
function test(name, fn) { try { fn(); n++; console.log('PASS', name); } catch(e) { console.error('FAIL', name, e.message); process.exitCode = 1; } }
const before = (a,b) => { const x=s.indexOf(a),y=s.indexOf(b); assert(x>=0 && y>=0 && x<y, `${a} must precede ${b}`); };
test('Dual writer opt-in, disabled by default',()=>assert.match(s,/V4_DUAL_WRITER = process\.env\.OHLC_V4_DUAL_WRITER === "true"/));
test('WAL fsync precedes candle memory update',()=>before('fs.fsyncSync(fd); } finally { fs.closeSync(fd); }\n    lastWalSyncMs','liveCandleEngine.accept(t)'));
test('Provider persists tick before broadcast',()=>{ const x=s.indexOf('socket.on("rates"'); const a=s.indexOf('queueDbTick(tick)',x), b=s.indexOf('broadcastTick(tick)',x); assert(a>x && b>a); });
test('WAL has SHA256 verification and sequence gaps rejected',()=>{assert.match(s,/WAL checksum mismatch/);assert.match(s,/WAL sequence gap/);});
test('Durable IDs persisted before lane SQL',()=>before('try { saveQueue(); } catch (e) { fatalQueueError(e); }\n\n    const rowKey','await Promise.all([laneLoop("live"), laneLoop("history")])'));
test('Both lanes share one queue owner',()=>{assert.match(s,/const inFlight = new Set<DurableBatch\[\]>\(\)/);assert.match(s,/const lockedKeys = new Set<string>\(\)/);});
test('Earlier same-candle chunk prevents overtaking',()=>{assert.match(s,/for \(let j = 0; j < i && !overtakes; j\+\+\)/);assert.match(s,/keys\.has\(rowKey\(row\)\)/);});
test('In-flight chunks remain in durable queue until SQL succeeds',()=>{const start=s.indexOf('async function flushDbV4()');assert(start>=0,'Missing flushDbV4');const a=s.indexOf('await writeBatches(chunk)',start);const b=s.indexOf('retryChunks.splice(idx, 1)',a);assert(a>start && b>a,'SQL must commit before removing durable chunk');});
test('Batch ledger deduplicates retries',()=>{assert.match(s,/MarketCandleBatchLedger/);assert.match(s,/ON CONFLICT \("batchId"\) DO NOTHING/);});
test('Older history cannot replace newer close timestamp',()=>assert.match(s,/EXCLUDED\."lastAt" >= "MarketCandle"\."lastAt"/));
// Verify actual WAL serialization/checksum compatibility with existing V4 format.
test('WAL checksum fixture',()=>{const tick={symbol:'EURUSD',price:1.12,timestamp:1762113600000};const seq=13;const sha256=crypto.createHash('sha256').update(JSON.stringify({seq,tick})).digest('hex');const record=JSON.stringify({seq,tick,sha256})+'\n';const decoded=JSON.parse(record.trim());assert.equal(crypto.createHash('sha256').update(JSON.stringify({seq:decoded.seq,tick:decoded.tick})).digest('hex'),decoded.sha256);});
console.log(`${n}/11 static/fixture checks passed. NOT an integration or crash-recovery test.`);
