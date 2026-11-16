// Read-only audit. Usage: node scripts/test-fx-scanner-api.mjs http://localhost:3000
const base=(process.argv[2]||'http://localhost:3000').replace(/\/$/,'');
let errors=0,warnings=0;
function fail(s){console.error('FAIL',s);errors++;}function warn(s){console.warn('WARN',s);warnings++;}function ok(s){console.log('OK',s);}
async function fetchTrades(status){const url=`${base}/api/fx-scanner/trades?status=${status}&limit=1000`;const r=await fetch(url,{headers:{'cache-control':'no-cache'}});if(!r.ok)throw Error(`${status}: HTTP ${r.status}`);const j=await r.json();if(j.ok!==true||!Array.isArray(j.trades))throw Error(`${status}: unexpected response`);return j.trades;}
try{
 const [active,closed]=await Promise.all([fetchTrades('ACTIVE'),fetchTrades('CLOSED')]);
 ok(`API reachable: ACTIVE=${active.length}, CLOSED=${closed.length}`);
 const ids=new Set();
 for(const [bucket,rows] of [['ACTIVE',active],['CLOSED',closed]])for(const t of rows){
  if(!t.id){fail(`${bucket}: missing trade id`);continue;}
  if(ids.has(t.id))fail(`${t.id}: duplicate in ACTIVE/CLOSED`);ids.add(t.id);
  if(bucket==='ACTIVE'&&t.status!=='ACTIVE')fail(`${t.id}: ACTIVE response has ${t.status}`);
  if(bucket==='CLOSED'&&t.status==='ACTIVE')fail(`${t.id}: CLOSED response includes ACTIVE`);
  if(!['BUY','SELL'].includes(t.side))fail(`${t.id}: invalid side ${t.side}`);
  for(const k of ['entry','sl','tp1','tp2'])if(!Number.isFinite(Number(t[k])))fail(`${t.id}: ${k} invalid`);
  const entry=Number(t.entry),sl=Number(t.sl),tp1=Number(t.tp1),tp2=Number(t.tp2);
  if(t.side==='BUY'&&!(sl<entry&&entry<tp1&&tp1<tp2))warn(`${t.id}: BUY level ordering unexpected`);
  if(t.side==='SELL'&&!(sl>entry&&entry>tp1&&tp1>tp2))warn(`${t.id}: SELL level ordering unexpected`);
  if(bucket==='ACTIVE'&&t.closedAt)fail(`${t.id}: ACTIVE has closedAt`);
  if(bucket==='CLOSED'&&!t.closedAt)warn(`${t.id}: CLOSED without closedAt`);
  if(t.status==='TP2'&&(!t.tp1Hit||!t.tp2Hit))fail(`${t.id}: TP2 without TP1/TP2 flags`);
  if(t.status==='TP1_BE'&&!t.tp1Hit)fail(`${t.id}: BE without TP1 flag`);
  if(t.status==='SL'&&t.tp1Hit)warn(`${t.id}: SL with TP1 flag (historical?)`);
  if(t.status==='ACTIVE'&&t.tp2Hit)fail(`${t.id}: ACTIVE already tp2Hit`);
  if(t.status==='TP3')warn(`${t.id}: legacy TP3 preserved`);
 }
 if(active.length===1000||closed.length===1000)warn('At least one API result reached limit 1000: audit is incomplete');
 if(!active.length)warn('No ACTIVE trades: cannot verify TP1 persistence');
 if(!closed.length)warn('No CLOSED trades: cannot verify closure records');
 console.log(`\nSUMMARY errors=${errors} warnings=${warnings}; read-only, no database writes`);
 process.exitCode=errors?1:0;
}catch(e){fail(e.message);console.log(`SUMMARY errors=${errors}`);process.exitCode=1;}
