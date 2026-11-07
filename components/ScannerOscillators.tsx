"use client";
import React from "react";
import type { CandlestickData } from "lightweight-charts";

export const OSCILLATORS = ["RSI", "MACD", "Stochastic", "ADX", "ATR", "CCI", "Williams %R", "Momentum", "ROC", "Awesome Oscillator", "DeMarker", "Aroon"] as const;
export type OscillatorName = (typeof OSCILLATORS)[number];
type Candle = Pick<CandlestickData, "open" | "high" | "low" | "close">;
const avg = (a:number[]) => a.reduce((s,v)=>s+v,0)/a.length;
const ema = (a:number[],n:number) => {const out:number[]=[]; const k=2/(n+1); a.forEach((v,i)=>out.push(i?out[i-1]+k*(v-out[i-1]):v));return out;};
const rolling=(a:number[],n:number,fn:(x:number[])=>number)=>a.map((_,i)=>i+1<n?NaN:fn(a.slice(i+1-n,i+1)));
const divide=(a:number,b:number)=>b===0?0:a/b;
type OscillatorResult = { lines:number[][]; colors:string[]; levels?:number[]; bounds?:number[]; histogram?:number };
function calculate(name:OscillatorName,c:Candle[]):OscillatorResult {
 const close=c.map(x=>x.close),high=c.map(x=>x.high),low=c.map(x=>x.low);
 const diff=close.map((x,i)=>i?x-close[i-1]:0);
 const tr=c.map((x,i)=>Math.max(x.high-x.low,Math.abs(x.high-(c[i-1]?.close??x.close)),Math.abs(x.low-(c[i-1]?.close??x.close))));
 const atr=rolling(tr,14,avg);
 if(name==="ATR")return {lines:[atr],colors:["#f59e0b"]};
 if(name==="RSI") {const gain=ema(diff.map(x=>Math.max(x,0)),14),loss=ema(diff.map(x=>Math.max(-x,0)),14);return {lines:[gain.map((v,i)=>loss[i]===0?100:100-100/(1+v/loss[i]))],colors:["#a78bfa"],levels:[30,70],bounds:[0,100]};}
 if(name==="MACD") {const f=ema(close,12),s=ema(close,26),m=f.map((v,i)=>v-s[i]),sig=ema(m,9);return {lines:[m,sig,m.map((v,i)=>v-sig[i])],colors:["#38bdf8","#f59e0b","#34d399"],histogram:2};}
 if(name==="Stochastic") {const k=close.map((v,i)=>i<13?NaN:100*divide(v-Math.min(...low.slice(i-13,i+1)),Math.max(...high.slice(i-13,i+1))-Math.min(...low.slice(i-13,i+1))));const d=rolling(k,3,avg);return {lines:[k,d],colors:["#38bdf8","#fb923c"],levels:[20,80],bounds:[0,100]};}
 if(name==="CCI") {const tp=c.map(x=>(x.high+x.low+x.close)/3),ma=rolling(tp,20,avg);return {lines:[tp.map((v,i)=>i<19?NaN:divide(v-ma[i],0.015*avg(tp.slice(i-19,i+1).map(x=>Math.abs(x-ma[i])))))],colors:["#f59e0b"],levels:[-100,100]};}
 if(name==="Williams %R")return {lines:[close.map((v,i)=>i<13?NaN:-100*divide(Math.max(...high.slice(i-13,i+1))-v,Math.max(...high.slice(i-13,i+1))-Math.min(...low.slice(i-13,i+1))))],colors:["#a78bfa"],levels:[-80,-20],bounds:[-100,0]};
 if(name==="Momentum")return {lines:[close.map((v,i)=>i<10?NaN:100*divide(v,close[i-10]))],colors:["#38bdf8"],levels:[100]};
 if(name==="ROC")return {lines:[close.map((v,i)=>i<12?NaN:100*divide(v-close[i-12],close[i-12]))],colors:["#38bdf8"],levels:[0]};
 if(name==="Awesome Oscillator") {const mid=c.map(x=>(x.high+x.low)/2),a=rolling(mid,5,avg),b=rolling(mid,34,avg);return {lines:[a.map((v,i)=>v-b[i])],colors:["#34d399"],histogram:0,levels:[0]};}
 if(name==="DeMarker") {const up=high.map((v,i)=>i?Math.max(v-high[i-1],0):0),dn=low.map((v,i)=>i?Math.max(low[i-1]-v,0):0),u=rolling(up,14,avg),d=rolling(dn,14,avg);return {lines:[u.map((v,i)=>divide(v,v+d[i]))],colors:["#a78bfa"],levels:[0.3,0.7],bounds:[0,1]};}
 if(name==="Aroon") {const up=high.map((_,i)=>i<24?NaN:100*(25-(24-(high.slice(i-24,i+1).lastIndexOf(Math.max(...high.slice(i-24,i+1))))))/25),down=low.map((_,i)=>i<24?NaN:100*(25-(24-(low.slice(i-24,i+1).lastIndexOf(Math.min(...low.slice(i-24,i+1))))))/25);return {lines:[up,down],colors:["#34d399","#f87171"],bounds:[0,100],levels:[20,80]};}
 // Wilder-smoothed directional movement and ADX
 const plus=c.map((x,i)=>i?Math.max(x.high-c[i-1].high,0):0),minus=c.map((x,i)=>i?Math.max(c[i-1].low-x.low,0):0);
 const pd=plus.map((v,i)=>v>minus[i]?v:0),md=minus.map((v,i)=>v>plus[i]?v:0);
 const smooth=(a:number[])=>a.map((_,i)=>i<13?NaN:avg(a.slice(Math.max(0,i-13),i+1)));
 const ta=smooth(tr),p=smooth(pd).map((v,i)=>100*divide(v,ta[i])),m=smooth(md).map((v,i)=>100*divide(v,ta[i]));
 const dx=p.map((v,i)=>100*divide(Math.abs(v-m[i]),v+m[i]));return {lines:[smooth(dx),p,m],colors:["#fbbf24","#34d399","#f87171"],levels:[22]};
}
export function OscillatorPanels({candles,active,onRemove}:{candles:Candle[];active:OscillatorName[];onRemove:(n:OscillatorName)=>void}) {
 const data=React.useMemo(()=>active.map(name=>({name,calc:calculate(name,candles)})),[active,candles]);
 if(!active.length)return null;
 return <div className="mt-2 space-y-2" aria-label="Panele oscylatorów">
 {data.map(({name,calc})=>{
  const width=900,height=112, pad=8;
  const samples=calc.lines.flatMap(l=>l.filter(Number.isFinite));
  const levels=calc.levels??[];
  const min=calc.bounds?.[0]??Math.min(...samples,...levels,0),max=calc.bounds?.[1]??Math.max(...samples,...levels,1);
  const span=max-min||1;
  const y=(v:number)=>pad+(max-v)/span*(height-2*pad);
  const x=(i:number)=>pad+(i/Math.max(candles.length-1,1))*(width-2*pad);
  const line=(values:number[])=>values.map((v,i)=>Number.isFinite(v)?`${i===0||!Number.isFinite(values[i-1])?'M':'L'}${x(i).toFixed(2)},${y(v).toFixed(2)}`:'').join(' ');
  const valid=calc.lines[0].filter(Number.isFinite);
  const last=valid[valid.length-1];
  return <div key={name} className="overflow-hidden rounded-xl border border-sky-400/25 bg-[#081426]">
    <div className="flex items-center justify-between border-b border-sky-400/10 px-3 py-1.5"><span className="text-xs font-bold text-slate-100">{name} <span className="ml-2 text-cyan-300">{Number.isFinite(last)?last?.toFixed(2):'—'}</span></span><button type="button" onClick={()=>onRemove(name)} title={`Usuń ${name}`} className="rounded px-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label={`Usuń ${name}`}>×</button></div>
    {candles.length<35?<p className="p-4 text-xs text-slate-400">Oczekiwanie na historię świec (minimum 35)...</p>:<svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="block h-[100px] w-full" role="img" aria-label={`Wykres ${name}`}>
      {[0.25,0.5,0.75].map(v=><line key={v} x1="0" x2={width} y1={height*v} y2={height*v} stroke="#25334a" strokeDasharray="3 5"/>)}
      {levels.map(v=><line key={v} x1="0" x2={width} y1={y(v)} y2={y(v)} stroke="#64748b" strokeDasharray="5 5" opacity=".7"/>)}
      {calc.lines.map((series,i)=>i===calc.histogram?series.map((v,j)=>Number.isFinite(v)?<line key={j} x1={x(j)} x2={x(j)} y1={y(0)} y2={y(v)} stroke={v>=0?'#34d399':'#fb7185'} strokeWidth="2"/>:null):<path key={i} d={line(series)} fill="none" stroke={calc.colors[i]} strokeWidth="2" vectorEffect="non-scaling-stroke"/>)}
    </svg>}
  </div>;
 })}
 </div>;
}
