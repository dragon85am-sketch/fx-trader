import {advanceTrade} from './lib/fx-scanner/engine_FAZA_3_2_TP_BE_FIXED.ts';
import assert from 'node:assert/strict';
const buy={side:'BUY',entry:100,sl:99,tps:[101,101.5,102],rr:2};
const sell={side:'SELL',entry:100,sl:101,tps:[99,98.5,98],rr:2};
const run=(side,l,bars)=>advanceTrade([{time:1,open:100,high:100,low:100,close:100},...bars.map((b,i)=>({time:i+2,open:100,close:100,...b})),{time:100,open:100,high:100,low:100,close:100}],side,l,1);
const cases=[
 ['BUY SL',run('BUY',buy,[{high:100.2,low:98.9}]),'SL'],
 ['SELL SL',run('SELL',sell,[{high:101.1,low:99.8}]),'SL'],
 ['BUY TP3',run('BUY',buy,[{high:102.2,low:100.1}]),'TP3'],
 ['SELL TP3',run('SELL',sell,[{high:99.9,low:97.9}]),'TP3'],
 ['BUY same candle TP and BE',run('BUY',buy,[{high:102.2,low:99.9}]),'TP1_BE'],
 ['SELL same candle TP and BE',run('SELL',sell,[{high:100.1,low:97.9}]),'TP1_BE'],
 ['BUY both SL and TP',run('BUY',buy,[{high:102.2,low:98.9}]),'SL'],
 ['SELL both SL and TP',run('SELL',sell,[{high:101.1,low:97.9}]),'SL'],
 ['BUY next candle BE',run('BUY',buy,[{high:101.2,low:100.1},{high:101.3,low:99.9}]),'TP1_BE'],
 ['SELL next candle BE',run('SELL',sell,[{high:99.9,low:98.8},{high:100.1,low:98.7}]),'TP1_BE'],
];
for(const [name,result,expected] of cases){assert.equal(result.status,expected,name);console.log('PASS',name)}
