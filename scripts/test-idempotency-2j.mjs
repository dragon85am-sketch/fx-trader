import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { HistoryBridge } from './history-bridge.mjs';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'fx-2j-'));
const filename=path.join(dir,'history.sqlite');
const base=Math.floor((Date.now()-120000)/60000)*60000;
const ticks=Array.from({length:500},(_,i)=>({source:'collector-test',seq:i+1,symbol:'EURUSD',price:1.1+i/100000,timestamp:base+i}));
let bridge;
try {
 bridge=new HistoryBridge({filename}); await bridge.ready;
 await bridge.ticks(ticks); await bridge.close();bridge=null;
 bridge=new HistoryBridge({filename}); await bridge.ready;
 await bridge.ticks(ticks);
 const res=await bridge.read('EURUSD','1min',10,Date.now());
 assert.equal(res.rows.length,1);assert.equal(res.rows[0].ticks,500);
 console.log('PASS: 500 durable tick IDs replayed after restart without double counting');
 const conflict=[{...ticks[0],price:9.9}]; await bridge.ticks(conflict);
 const again=await bridge.read('EURUSD','1min',10,Date.now());
 assert.equal(again.rows[0].ticks,500);assert.equal(again.rows[0].high,res.rows[0].high);
 console.log('PASS: duplicate sequence cannot modify OHLC');
 await bridge.close();bridge=null;
 console.log('NOTE: test-only patch; legacy ticks without source/seq are not deduplicated; no WAL integration yet. DO NOT DEPLOY.');
} finally {if(bridge) await bridge.close().catch(()=>{});fs.rmSync(dir,{recursive:true,force:true,maxRetries:10,retryDelay:200});}
