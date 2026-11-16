// Run from C:\fx-trader with: node scripts/run-faza34-worker-test.cjs
// No production .env is loaded by this runner or the isolated worker.
const { PrismaClient } = require('@prisma/client');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const id = 'FXTRADE-FAZA34-WORKER-ISOLATED';
const url = process.env.FX_SCANNER_TEST_DATABASE_URL;
function safety() {
  if (!url) throw Error('STOP: ustaw FX_SCANNER_TEST_DATABASE_URL (lokalny PostgreSQL).');
  const u = new URL(url);
  if (u.hostname !== '127.0.0.1' || u.port !== '55432' || u.pathname !== '/fxtrade_restart_test' || u.username !== 'fxtrade_test')
    throw Error('SAFETY STOP: tylko fxtrade_test@127.0.0.1:55432/fxtrade_restart_test');
  if (process.env.DATABASE_URL === url || process.env.DIRECT_URL === url) {
    // Matching session-local URL is safe if it passed the strict local-only validation above.
  }
}
const assert = (condition,message) => {if (!condition) throw Error('FAIL: '+message)};
const frozen = {entry:75000,sl:74900,tp1:75100,tp2:75200,tp3:75300};
function verify(row,status) {
  assert(row && row.status===status,`expected ${status}, got ${row?.status}`);
  for (const [key,value] of Object.entries(frozen)) assert(row[key]===value,`changed ${key}`);
  assert(row.tp1Hit===true,'TP1 milestone lost');
}
function runWorker(mode) {
  const target=path.join(__dirname,'fx-scanner-worker-isolated-34.ts');
  assert(fs.existsSync(target),'missing isolated worker file');
  const cmd=process.platform==='win32'?'npx.cmd':'npx';
  const child=spawnSync(cmd,['--no-install','tsx',target],{
    cwd:path.resolve(__dirname,'..'), encoding:'utf8',timeout:45000,
    env:{PATH:process.env.PATH,Path:process.env.Path,SystemRoot:process.env.SystemRoot,
      TEMP:process.env.TEMP,TMP:process.env.TMP,HOME:process.env.HOME,
      FX_SCANNER_TEST_DATABASE_URL:url,FX_SCANNER_TEST_CANDLE_MODE:mode},
    shell:process.platform==='win32',
  });
  if(child.error) throw child.error;
  assert(child.status===0 && child.stdout.includes('TEST_WORKER_CYCLE_OK'),
    `worker ${mode} failed: ${child.stderr || child.stdout}`);
  console.log(`PASS: worker process ${mode} exited cleanly`);
}
async function main(){
  safety();
  const prisma=new PrismaClient({datasources:{db:{url}}});
  let created=false;
  try {
    const existing=await prisma.fxScannerTrade.findUnique({where:{id}});
    assert(!existing,`test ID already exists (${id}); stop rather than overwrite`);
    const row=await prisma.fxScannerTrade.create({data:{
      id,instrument:'BTCUSD',storageSymbol:'BTCUSD',tf:'M1',side:'BUY',
      signalTime:new Date('2020-01-01T00:00:00.000Z'),confirmation:4,...frozen,rr:2,
      status:'ACTIVE',tp1Hit:true,tp2Hit:false,tp3Hit:false,
      telegramSignal:true,telegramClosed:true,
    }});
    created=true;
    verify(row,'ACTIVE');
    runWorker('neutral'); // process 1; no BE touch
    verify(await prisma.fxScannerTrade.findUnique({where:{id}}),'ACTIVE');
    console.log('PASS 3.4C: ACTIVE / TP1 survived worker process exit');
    runWorker('be'); // process 2; BE after TP1
    const closed=await prisma.fxScannerTrade.findUnique({where:{id}});
    verify(closed,'TP1_BE');
    assert(closed.exitPrice===75000 && closed.resultR===0 && closed.closeReason==='TP1_BE','BE metrics');
    assert(closed.closedAt,'closedAt missing');
    const closedAt=closed.closedAt.getTime();
    runWorker('be'); // process 3; no duplicate closing
    const again=await prisma.fxScannerTrade.findUnique({where:{id}});
    verify(again,'TP1_BE');
    assert(again.closedAt.getTime()===closedAt,'double closure updated timestamp');
    assert(await prisma.fxScannerTrade.count({where:{id}})===1,'duplicate row');
    let blocked=false;
    try {await prisma.fxScannerTrade.create({data:{id,instrument:'BTCUSD',storageSymbol:'BTCUSD',tf:'M1',side:'BUY',signalTime:new Date('2020-01-01'),...frozen}})}
    catch(e){if(e.code==='P2002') blocked=true;else throw e}
    assert(blocked,'unique constraint failed to reject duplicate');
    console.log('PASS 3.4D: BE once, frozen levels, duplicate rejected');
    console.log('RESULT: PASS 3.4C + 3.4D (isolated one-shot worker)');
  } finally {
    if(created) {await prisma.fxScannerTrade.deleteMany({where:{id}});console.log('CLEANUP: test row deleted');}
    await prisma.$disconnect();
  }
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
