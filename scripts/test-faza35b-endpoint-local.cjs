'use strict';
// FX TRADE FAZA 3.5B: local DB + mocked Telegram, never starts Next.js or Railway.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
process.chdir(root);
const url = process.env.DATABASE_URL || '';
const direct = process.env.DIRECT_URL || '';
function isLocal(v) { try { const u = new URL(v); return ['127.0.0.1','localhost'].includes(u.hostname) && u.port === '55432' && u.pathname === '/fxtrade_restart_test'; } catch { return false; } }
if (!isLocal(url) || !isLocal(direct)) { console.error('STOP: DATABASE_URL i DIRECT_URL musza wskazywac 127.0.0.1:55432/fxtrade_restart_test. Nie uruchomiono testu.'); process.exit(2); }
const ts = require('typescript');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const routeFile = path.join(root, 'app/api/telegram/notify/route.ts');
const source = fs.readFileSync(routeFile, 'utf8');
const transpiled = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
const original = {worker:process.env.FX_SCANNER_WORKER_KEY, bot:process.env.TELEGRAM_BOT_TOKEN, chat:process.env.TELEGRAM_CHAT_ID, app:process.env.NEXT_PUBLIC_APP_URL};
process.env.FX_SCANNER_WORKER_KEY='FAZA35B-LOCAL-ONLY';
process.env.TELEGRAM_BOT_TOKEN='MOCK-NO-NETWORK';
process.env.TELEGRAM_CHAT_ID='MOCK-CHAT';
process.env.NEXT_PUBLIC_APP_URL='https://mock.invalid';
let requests=0;
let fail=false;
const fakeFetch = async (target, options) => {
  if (typeof target !== 'string' || !target.startsWith('https://api.telegram.org/botMOCK-NO-NETWORK/')) throw new Error('Blocked external request: '+String(target));
  requests++;
  return {ok:!fail,status:fail?500:200,json:async()=>fail?{ok:false,description:'mock failure'}:{ok:true,result:{message_id:123}}};
};
const mockNext = {NextResponse:{json:(data,opts={})=>({status:opts.status||200,data})}};
function loadRoute() {
  const mod={exports:{}};
  const localRequire = (id)=>id==='next/server'?mockNext:require(id);
  new Function('require','module','exports','process','fetch','console',transpiled)(localRequire,mod,mod.exports,process,fakeFetch,console);
  return mod.exports.POST;
}
const makeReq=(payload)=>({headers:{get:(name)=>name==='x-fx-scanner-worker-key'?'FAZA35B-LOCAL-ONLY':null},json:async()=>payload});
const makePayload=(key,type='SIGNAL')=>({type,deliveryKey:key,instrument:'BTCUSD',side:'BUY',tf:'M1',entry:75000,sl:74900,tp1:75100,tp2:75200,tp3:75300,...(type==='CLOSED'?{status:'TP2',tp1Hit:true,tp2Hit:true}:{})});
const key=(label)=>'SIGNAL:'+crypto.createHash('sha1').update('FAZA35B-'+label+'-'+process.pid+'-'+Date.now()).digest('hex');
const ids=[];
const pass=(name)=>console.log('PASS:',name);
async function main(){
  console.log('LOCAL ONLY: '+new URL(url).hostname+':'+new URL(url).port+new URL(url).pathname);
  const post=loadRoute();
  const firstKey=key('parallel');ids.push(firstKey);
  const start=requests;
  const [a,b]=await Promise.all([post(makeReq(makePayload(firstKey))),post(makeReq(makePayload(firstKey)))]);
  assert.deepEqual([a.status,b.status].sort((x,y)=>x-y),[200,409]);
  assert.equal(requests-start,1);pass('2 rownolegle zadania: HTTP 200 + 409, tylko 1 wywolanie Telegram mock');
  const row=await prisma.fxScannerTelegramDelivery.findUnique({where:{id:firstKey}});
  assert.equal(row.status,'SENT');pass('Trwaly zapis SENT w PostgreSQL');
  const restarted=loadRoute();
  const retry=await restarted(makeReq(makePayload(firstKey)));
  assert.equal(retry.status,409);assert.equal(requests-start,1);pass('Ponowienie po przeladowaniu endpointu: 409, bez drugiej wysylki');
  const badKey=key('invalid');ids.push(badKey);
  const invalid=await restarted(makeReq({...makePayload(badKey),instrument:''}));
  assert.equal(invalid.status,400);
  assert.equal(await prisma.fxScannerTelegramDelivery.count({where:{id:badKey}}),0);pass('Nieprawidlowe dane: 400, bez blokady identyfikatora');
  const errorKey=key('failure');ids.push(errorKey);fail=true;
  const err=await restarted(makeReq(makePayload(errorKey)));
  fail=false;assert.notEqual(err.status,200);
  const uncertain=await prisma.fxScannerTelegramDelivery.findUnique({where:{id:errorKey}});
  assert.equal(uncertain.status,'UNCERTAIN');
  const before=requests;
  const noRetry=await restarted(makeReq(makePayload(errorKey)));
  assert.equal(noRetry.status,409);assert.equal(requests,before);pass('Blad Telegram mock: UNCERTAIN i brak automatycznego ponowienia');
  console.log('RESULT: PASS — 5 kontroli (mock Telegram, lokalna baza)');
}
main().catch(e=>{console.error('FAIL:',e.message);process.exitCode=1}).finally(async()=>{
  try{if(ids.length)await prisma.fxScannerTelegramDelivery.deleteMany({where:{id:{in:ids}}});console.log('CLEANUP: testowe wpisy usuniete');}catch(e){console.error('CLEANUP ERROR:',e.message);process.exitCode=1;}
  await prisma.$disconnect();
  for(const [k,v] of Object.entries(original)){const name={worker:'FX_SCANNER_WORKER_KEY',bot:'TELEGRAM_BOT_TOKEN',chat:'TELEGRAM_CHAT_ID',app:'NEXT_PUBLIC_APP_URL'}[k];if(v===undefined)delete process.env[name];else process.env[name]=v;}
});
