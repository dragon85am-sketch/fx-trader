// FX TRADE shadow history mirror: ONE provider connection stays in the existing collector.
// Consume existing SSE only. Never connects to Live-Rates or touches legacy /data/ohlc-queue.
import http from 'node:http';
import { HistoryBridge } from './history-bridge.mjs';
import { HistoryIntake } from './history-intake.mjs';
const upstream=(process.env.COLLECTOR_UPSTREAM_URL||'').replace(/\/$/,'');
if(!/^https:\/\//.test(upstream)) throw Error('COLLECTOR_UPSTREAM_URL must be https URL');
const dbfile=process.env.OHLC_HISTORY_SQLITE_PATH||'/data/ohlc-history/history.sqlite';
const bridge=new HistoryBridge({filename:dbfile,maxPendingTicks:5000});
await bridge.ready;
const intake=new HistoryIntake({dir:process.env.OHLC_HISTORY_INTAKE_DIR||'/data/ohlc-history/intake'});
await intake.replay(bridge);
intake.checkpoint();
const state={startedAt:Date.now(),received:0,committed:0,reconnects:0,errors:0,lastTickAt:null,upstreamConnected:0,streamCount:0,gapWarnings:0};
const stop=new AbortController();
let fatal=null;
let serial=Promise.resolve();
const seen=new Map();
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function getSymbols(){
 const res=await fetch(upstream+'/health',{signal:AbortSignal.timeout(15000)});
 if(!res.ok)throw Error('Upstream health HTTP '+res.status);
 const data=await res.json();
 const symbols=(data.providerSubscriptions||[]).map(s=>String(s).replace(/\//g,'').toUpperCase()).filter(s=>/^[A-Z0-9]{3,20}$/.test(s));
 if(!symbols.length)throw Error('Upstream did not expose providerSubscriptions');
 return [...new Set(symbols)];
}
function queue(tick){
 if(fatal)return;
 serial=serial.then(async()=>{
  const k=tick.symbol, prev=seen.get(k);
  if(prev && prev.timestamp===tick.timestamp && prev.price===tick.price)return;
  // Source SSE has no stable event ID. Only exact last event duplicates can be filtered.
  const durable=intake.append(tick);
  state.received++;
  await bridge.ticks([durable]);
  state.committed++;state.lastTickAt=Date.now();seen.set(k,tick);
  if(intake.bytes>=intake.rotateBytes)intake.checkpoint();
 }).catch(e=>{fatal=String(e);state.errors++;console.error('[MIRROR] FATAL',e);stop.abort();process.exitCode=1;});
}
async function stream(symbol){
 while(!stop.signal.aborted){
  let connected=false;
  try{
   const res=await fetch(`${upstream}/api/market/${symbol.toLowerCase()}/stream`,{signal:stop.signal,headers:{Accept:'text/event-stream'}});
   if(!res.ok||!res.body)throw Error(`SSE ${symbol}: HTTP ${res.status}`);
   connected=true;state.upstreamConnected++;
   const decoder=new TextDecoder();let buffer='',event='';let data=[];
   for await(const chunk of res.body){
    buffer+=decoder.decode(chunk,{stream:true});
    if(buffer.length>262144)throw Error('SSE frame too large');
    let index;
    while((index=buffer.indexOf('\n'))>=0){
     const line=buffer.slice(0,index).replace(/\r$/,'');buffer=buffer.slice(index+1);
     if(!line){
      if(event==='tick'&&data.length){
       const obj=JSON.parse(data.join('\n'));
       if(obj.symbol===symbol && Number.isFinite(obj.price)&&Number.isSafeInteger(obj.timestamp))queue({symbol,price:obj.price,timestamp:obj.timestamp});
      }
      event='';data=[];
     }else if(line.startsWith('event:'))event=line.slice(6).trim();
     else if(line.startsWith('data:'))data.push(line.slice(5).trimStart());
    }
   }
   state.gapWarnings++;
  }catch(e){if(!stop.signal.aborted){state.errors++;console.error('[MIRROR] stream disconnected',symbol,String(e));state.gapWarnings++;}}
  finally{if(connected)state.upstreamConnected--;}
  if(!stop.signal.aborted){state.reconnects++;await pause(3000);}
 }
}
const symbols=await getSymbols();state.streamCount=symbols.length;
console.log(`[MIRROR] shadow SSE ingest for ${symbols.length} instruments; one upstream Live-Rates connection; no legacy writes`);
const jobs=symbols.map(s=>stream(s));
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url||'/', 'http://localhost');
 const json=(code,obj)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(obj));};
 if(url.pathname==='/health/quick')return json(fatal?503:200,{ok:!fatal,...state,fatal});
 if(url.pathname==='/api/market/history'){
  if(fatal)return json(503,{ok:false,error:'History intake failed'});
  const token=process.env.OHLC_LIVE_READ_TOKEN;
  if(token && req.headers['x-ohlc-live-token']!==token)return json(401,{ok:false});
  const symbol=(url.searchParams.get('symbol')||'').toUpperCase();
  const interval=url.searchParams.get('interval')||'1min';
  if(!symbols.includes(symbol))return json(400,{ok:false,error:'Unknown symbol'});
  try{const rows=await bridge.read(symbol,interval,Number(url.searchParams.get('limit')||500),Number(url.searchParams.get('before')||Date.now()));return json(200,{ok:true,source:'sqlite-shadow',symbol,interval,candles:rows.rows});}
  catch(e){return json(503,{ok:false,error:'History unavailable'});}
 }
 return json(404,{ok:false});
});
server.listen(Number(process.env.PORT||8080),'0.0.0.0');
async function shutdown(){stop.abort();await Promise.allSettled(jobs);await serial;try{await bridge.close();}finally{intake.close();server.close();}}
process.on('SIGTERM',()=>{void shutdown().then(()=>process.exit(fatal?1:0));});
process.on('SIGINT',()=>{void shutdown().then(()=>process.exit(fatal?1:0));});
