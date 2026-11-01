import { parentPort, workerData } from 'node:worker_threads';
import { HistorySQLite } from './history-sqlite.mjs';
const db = new HistorySQLite(workerData.filename);
let received=0, errors=0, lastWriteAt=null;
parentPort.on('message', msg => {
  if (msg.type === 'ticks') {
    try {
      db.db.exec('BEGIN IMMEDIATE');
      try { for (const tick of msg.ticks) db.acceptTick(tick); db.db.exec('COMMIT'); }
      catch (e) { db.db.exec('ROLLBACK'); throw e; }
      received += msg.ticks.length; lastWriteAt=Date.now();
      parentPort.postMessage({type:'ack',id:msg.id,received:msg.ticks.length});
    } catch(e) {errors++; parentPort.postMessage({type:'error',id:msg.id,error:String(e)});}
  } else if(msg.type === 'read') {
    try {parentPort.postMessage({type:'read',id:msg.id,rows:db.candles(msg.symbol,msg.interval,msg.limit,msg.before)});}
    catch(e){parentPort.postMessage({type:'error',id:msg.id,error:String(e)});}
  } else if(msg.type === 'stats') {
    try {parentPort.postMessage({type:'stats',id:msg.id,stats:{...db.stats(),received,errors,lastWriteAt}});}
    catch(e){parentPort.postMessage({type:'error',id:msg.id,error:String(e)});}
  } else if(msg.type === 'prune') {
    try {parentPort.postMessage({type:'pruned',id:msg.id,removed:db.prune()});}
    catch(e){parentPort.postMessage({type:'error',id:msg.id,error:String(e)});}
  } else if(msg.type === 'close') {
    db.close(); parentPort.postMessage({type:'closed',id:msg.id});
  }
});
parentPort.postMessage({type:'ready'});
