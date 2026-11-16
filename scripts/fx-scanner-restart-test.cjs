// FX TRADE FAZA 3.4: isolated persistence smoke test. NOT a worker restart test.
const { PrismaClient } = require('@prisma/client');
const crypto = require('node:crypto');
const url = process.env.FX_SCANNER_TEST_DATABASE_URL;
const stage = process.argv[2];
if (!['prepare','verify','cleanup'].includes(stage)) throw Error('Use: prepare | verify | cleanup');
if (!url) throw Error('Set FX_SCANNER_TEST_DATABASE_URL. Never use DATABASE_URL.');
const parsed = new URL(url);
const dbName = decodeURIComponent(parsed.pathname.replace(/^\//,''));
if (!['localhost','127.0.0.1','::1'].includes(parsed.hostname) || dbName !== 'fxtrade_restart_test') {
  throw Error('SAFETY STOP: only local PostgreSQL database named fxtrade_restart_test is allowed.');
}
if (process.env.DATABASE_URL && url === process.env.DATABASE_URL) throw Error('SAFETY STOP: test URL matches DATABASE_URL');
const prisma = new PrismaClient({ datasources: { db: { url } } });
const id = crypto.createHash('sha256').update('fxtrade-faza34-restart-test-v1').digest('hex').slice(0,40);
const expected = {instrument:'BTCUSD',storageSymbol:'BTCUSD',tf:'1min',side:'BUY',confirmation:4,
 signalTime:new Date('2020-01-01T00:00:00.000Z'),entry:100,sl:95,tp1:105,tp2:110,tp3:115,rr:2,
 status:'ACTIVE',tp1Hit:true,tp2Hit:false,tp3Hit:false,telegramSignal:true,telegramClosed:false};
async function main(){
 const existing = await prisma.fxScannerTrade.findUnique({where:{id}});
 if(stage==='prepare'){
  if(existing) throw Error('Test record already exists; verify or cleanup first.');
  const r=await prisma.fxScannerTrade.create({data:{id,...expected}});
  console.log('PREPARED',r.id,'TP1=',r.tp1Hit,'STATUS=',r.status);
  console.log('Now run verify in a NEW process.');
 } else if(stage==='verify'){
  if(!existing) throw Error('Test record missing after process restart.');
  for(const [k,v] of Object.entries(expected)){
   if((v instanceof Date ? v.getTime() : v)!==(existing[k] instanceof Date ? existing[k].getTime():existing[k]))
    throw Error(`Mismatch ${k}: expected ${v}, got ${existing[k]}`);
  }
  const count=await prisma.fxScannerTrade.count({where:{id}});
  if(count!==1) throw Error(`Duplicate record count: ${count}`);
  // Check DB's uniqueness protection without changing the existing row.
  let duplicateBlocked=false;
  try { await prisma.fxScannerTrade.create({data:{id,...expected}}); }
  catch(e){if(e.code==='P2002')duplicateBlocked=true;else throw e;}
  if(!duplicateBlocked) throw Error('Duplicate insert was not blocked');
  console.log('PASS: ACTIVE, TP1, immutable Entry/SL/TP1/TP2, unique record.');
  console.log('NOTE: BE execution and actual worker restart are NOT tested here.');
 } else {
  if(existing) await prisma.fxScannerTrade.delete({where:{id}});
  console.log('CLEANUP OK');
 }
}
main().catch(e=>{console.error('FAIL:',e.message);process.exitCode=1}).finally(()=>prisma.$disconnect());
