"use client";
import React from "react";
import type { CandlestickData } from "lightweight-charts";

export const OSCILLATORS = ["RSI", "MACD", "Stochastic", "ADX", "ATR", "CCI", "Williams %R", "Momentum", "ROC", "Rate of Change", "Awesome Oscillator", "Accelerator Oscillator", "Bulls Power", "Bears Power", "OsMA", "Bollinger Bands Width", "Vortex", "DeMarker", "Aroon"] as const;
export type OscillatorName = (typeof OSCILLATORS)[number];
type Candle = Pick<CandlestickData, "open" | "high" | "low" | "close">;
const avg = (a:number[]) => a.reduce((s,v)=>s+v,0)/a.length;
const ema = (a:number[],n:number) => {const out:number[]=[]; const k=2/(n+1); a.forEach((v,i)=>out.push(i?out[i-1]+k*(v-out[i-1]):v));return out;};
const rolling=(a:number[],n:number,fn:(x:number[])=>number)=>a.map((_,i)=>i+1<n?NaN:fn(a.slice(i+1-n,i+1)));
const divide=(a:number,b:number)=>b===0?0:a/b;
export type OscillatorSettings = { period:number; fast:number; slow:number; signal:number; smooth:number; lower:number; upper:number; color:string; lineWidth:number; signalWidth:number; histogramWidth:number; signalColor:string; levelWidth:number; levelStyle:"solid"|"dashed"|"dotted"; levelColor:string; showLevels:boolean };
export const defaultOscillatorSettings: OscillatorSettings = {period:14,fast:12,slow:26,signal:9,smooth:3,lower:30,upper:70,color:"",lineWidth:2,signalWidth:2,histogramWidth:2,signalColor:"",levelWidth:1,levelStyle:"dashed",levelColor:"#64748b",showLevels:true};
const clampPeriod=(n:number)=>Math.max(1,Math.min(300,Math.round(Number(n)||14)));
type OscillatorNumericSetting = "period" | "fast" | "slow" | "signal" | "smooth" | "lower" | "upper";
type OscillatorResult = { lines:number[][]; colors:string[]; levels?:number[]; bounds?:number[]; histogram?:number };
function calculate(name:OscillatorName,c:Candle[],settings:OscillatorSettings):OscillatorResult {
 const period=clampPeriod(settings.period);
 const close=c.map(x=>x.close),high=c.map(x=>x.high),low=c.map(x=>x.low);
 const diff=close.map((x,i)=>i?x-close[i-1]:0);
 const tr=c.map((x,i)=>Math.max(x.high-x.low,Math.abs(x.high-(c[i-1]?.close??x.close)),Math.abs(x.low-(c[i-1]?.close??x.close))));
 const atr=rolling(tr,period,avg);
 if(name==="ATR")return {lines:[atr],colors:["#f59e0b"]};
 if(name==="RSI") {const gain=ema(diff.map(x=>Math.max(x,0)),period),loss=ema(diff.map(x=>Math.max(-x,0)),period);return {lines:[gain.map((v,i)=>loss[i]===0?100:100-100/(1+v/loss[i]))],colors:["#a78bfa"],levels:[settings.lower,settings.upper],bounds:[0,100]};}
 if(name==="MACD") {const f=ema(close,clampPeriod(settings.fast)),s=ema(close,clampPeriod(settings.slow)),m=f.map((v,i)=>v-s[i]),sig=ema(m,clampPeriod(settings.signal));return {lines:[m,sig,m.map((v,i)=>v-sig[i])],colors:["#38bdf8","#f59e0b","#34d399"],histogram:2};}
 if(name==="Stochastic") {const k=close.map((v,i)=>i<period-1?NaN:100*divide(v-Math.min(...low.slice(i-period+1,i+1)),Math.max(...high.slice(i-period+1,i+1))-Math.min(...low.slice(i-period+1,i+1))));const d=rolling(k,clampPeriod(settings.smooth),avg);return {lines:[k,d],colors:["#38bdf8","#fb923c"],levels:[settings.lower,settings.upper],bounds:[0,100]};}
 if(name==="CCI") {const tp=c.map(x=>(x.high+x.low+x.close)/3),ma=rolling(tp,period,avg);return {lines:[tp.map((v,i)=>i<period-1?NaN:divide(v-ma[i],0.015*avg(tp.slice(i-period+1,i+1).map(x=>Math.abs(x-ma[i])))))],colors:["#f59e0b"],levels:[settings.lower,settings.upper]};}
 if(name==="Williams %R")return {lines:[close.map((v,i)=>i<period-1?NaN:-100*divide(Math.max(...high.slice(i-period+1,i+1))-v,Math.max(...high.slice(i-period+1,i+1))-Math.min(...low.slice(i-period+1,i+1))))],colors:["#a78bfa"],levels:[-80,-20],bounds:[-100,0]};
 if(name==="Momentum")return {lines:[close.map((v,i)=>i<period?NaN:100*divide(v,close[i-period]))],colors:["#38bdf8"],levels:[100]};
 if(name==="ROC"||name==="Rate of Change")return {lines:[close.map((v,i)=>i<period?NaN:100*divide(v-close[i-period],close[i-period]))],colors:["#38bdf8"],levels:[0]};
 if(name==="Awesome Oscillator") {const mid=c.map(x=>(x.high+x.low)/2),a=rolling(mid,clampPeriod(settings.fast),avg),b=rolling(mid,clampPeriod(settings.slow),avg);return {lines:[a.map((v,i)=>v-b[i])],colors:["#34d399"],histogram:0,levels:[0]};}
 if(name==="Bulls Power"||name==="Bears Power") {const baseline=ema(close,period);return {lines:[c.map((v,i)=>(name==="Bulls Power"?v.high:v.low)-baseline[i])],colors:[name==="Bulls Power"?"#34d399":"#fb7185"],levels:[0]};}
 if(name==="OsMA") {const f=ema(close,clampPeriod(settings.fast)),sl=ema(close,clampPeriod(settings.slow)),m=f.map((v,i)=>v-sl[i]),sig=ema(m,clampPeriod(settings.signal));return {lines:[m.map((v,i)=>v-sig[i])],colors:["#34d399"],histogram:0,levels:[0]};}
 if(name==="Accelerator Oscillator") {const mid=c.map(v=>(v.high+v.low)/2),fast=rolling(mid,5,avg),slow=rolling(mid,34,avg),ao=fast.map((v,i)=>v-slow[i]),signal=rolling(ao,5,avg);return {lines:[ao.map((v,i)=>v-signal[i])],colors:["#34d399"],histogram:0,levels:[0]};}
 if(name==="Bollinger Bands Width") {const basis=rolling(close,period,avg);const width=close.map((_,i)=>{if(i<period-1)return NaN;const b=basis[i],v=close.slice(i-period+1,i+1);const std=Math.sqrt(avg(v.map(x=>(x-b)**2)));return b===0?0:400*std/Math.abs(b);});return {lines:[width],colors:["#a78bfa"]};}
 if(name==="Vortex") {const vp=c.map((v,i)=>i?Math.abs(v.high-c[i-1].low):0),vm=c.map((v,i)=>i?Math.abs(v.low-c[i-1].high):0);const sum=(a:number[])=>rolling(a,period,v=>v.reduce((x,y)=>x+y,0));const t=sum(tr),plus=sum(vp),minus=sum(vm);return {lines:[plus.map((v,i)=>divide(v,t[i])),minus.map((v,i)=>divide(v,t[i]))],colors:["#34d399","#fb7185"],levels:[1]};}
 if(name==="DeMarker") {const up=high.map((v,i)=>i?Math.max(v-high[i-1],0):0),dn=low.map((v,i)=>i?Math.max(low[i-1]-v,0):0),u=rolling(up,period,avg),d=rolling(dn,period,avg);return {lines:[u.map((v,i)=>divide(v,v+d[i]))],colors:["#a78bfa"],levels:[0.3,0.7],bounds:[0,1]};}
 if(name==="Aroon") {const up=high.map((_,i)=>i<period-1?NaN:100*(period-(period-1-(high.slice(i-period+1,i+1).lastIndexOf(Math.max(...high.slice(i-period+1,i+1))))))/period),down=low.map((_,i)=>i<period-1?NaN:100*(period-(period-1-(low.slice(i-period+1,i+1).lastIndexOf(Math.min(...low.slice(i-period+1,i+1))))))/period);return {lines:[up,down],colors:["#34d399","#f87171"],bounds:[0,100],levels:[20,80]};}
 // Wilder-smoothed directional movement and ADX
 const plus=c.map((x,i)=>i?Math.max(x.high-c[i-1].high,0):0),minus=c.map((x,i)=>i?Math.max(c[i-1].low-x.low,0):0);
 const pd=plus.map((v,i)=>v>minus[i]?v:0),md=minus.map((v,i)=>v>plus[i]?v:0);
 const smooth=(a:number[])=>a.map((_,i)=>i<period-1?NaN:avg(a.slice(Math.max(0,i-period+1),i+1)));
 const ta=smooth(tr),p=smooth(pd).map((v,i)=>100*divide(v,ta[i])),m=smooth(md).map((v,i)=>100*divide(v,ta[i]));
 const dx=p.map((v,i)=>100*divide(Math.abs(v-m[i]),v+m[i]));return {lines:[smooth(dx),p,m],colors:["#fbbf24","#34d399","#f87171"],levels:[22]};
}
export function OscillatorPanels({candles,active,onRemove,visibleLogicalRange,chartPlotWidth,crosshairTime,onCrosshairTimeChange}:{candles:Candle[];active:OscillatorName[];onRemove:(n:OscillatorName)=>void;visibleLogicalRange?:{from:number;to:number}|null; chartPlotWidth?:number|null; crosshairTime?:number|null; onCrosshairTimeChange?:(time:number|null)=>void}) {
 const [panelWidth,setPanelWidth]=React.useState(900);
 const panelRef=React.useRef<HTMLDivElement|null>(null);
 React.useEffect(()=>{
   const el=panelRef.current;
   if(!el)return;
   const observer=new ResizeObserver(entries=>{
     const w=entries[0]?.contentRect.width;
     if(w&&Number.isFinite(w))setPanelWidth(w);
   });
   observer.observe(el);
   setPanelWidth(el.clientWidth||900);
   return ()=>observer.disconnect();
 },[]);
 const [settings,setSettings]=React.useState<Partial<Record<OscillatorName,OscillatorSettings>>>({});
 const [editing,setEditing]=React.useState<OscillatorName|null>(null);
 React.useEffect(()=>{try{const saved=localStorage.getItem("fx-scanner-oscillator-settings-v1");if(saved)setSettings(JSON.parse(saved));}catch{}},[]);
 const change=(name:OscillatorName,patch:Partial<OscillatorSettings>)=>setSettings(prev=>{const next={...prev,[name]:{...defaultOscillatorSettings,...prev[name],...patch}};try{localStorage.setItem("fx-scanner-oscillator-settings-v1",JSON.stringify(next));}catch{}return next;});
 const data=active.map(name=>({name,config:{...defaultOscillatorSettings,...settings[name]},calc:calculate(name,candles,{...defaultOscillatorSettings,...settings[name]})}));
 if(!active.length)return null;
 return <div ref={panelRef} className="mt-2 w-full min-w-0 space-y-2" aria-label="Panele oscylatorów">
 {data.map(({name,calc,config})=>{
  const width=900,height=112,pad=8;
  const samples=calc.lines.flatMap(l=>l.filter(Number.isFinite));
  const levels=calc.levels??[];
  const min=calc.bounds?.[0]??Math.min(...samples,...levels,0),max=calc.bounds?.[1]??Math.max(...samples,...levels,1);
  const span=max-min||1;
  const y=(v:number)=>pad+(max-v)/span*(height-2*pad);
  // Lightweight Charts uses logical candle indices. Reuse its visible viewport
  // instead of stretching the full historical series to the SVG width.
  const range = visibleLogicalRange && visibleLogicalRange.to > visibleLogicalRange.from
    ? visibleLogicalRange : {from:0,to:Math.max(candles.length-1,1)};
  // Price axis occupies the right edge of the main chart, not the oscillator.
  // Match the chart's actual plot width, rather than stretching over its price axis.
  const plotFraction=chartPlotWidth&&panelWidth>0
    ? Math.min(1,Math.max(0.1,chartPlotWidth/panelWidth)):1;
  const x=(i:number)=>((i-range.from)/(range.to-range.from))*width*plotFraction;
  const line=(values:number[])=>values.map((v,i)=>Number.isFinite(v)?`${i===0||!Number.isFinite(values[i-1])?'M':'L'}${x(i).toFixed(2)},${y(v).toFixed(2)}`:'').join(' ');
  const valid=calc.lines[0].filter(Number.isFinite),last=valid[valid.length-1];
  const hasSignal=["MACD","OsMA","Awesome Oscillator","Accelerator Oscillator"].includes(name);
  const hasLevels=["RSI","Stochastic","CCI","Williams %R","DeMarker","ADX","Aroon"].includes(name);
  return <div key={name} className="overflow-hidden rounded-xl border border-sky-400/25 bg-[#081426]">
    <div className="flex items-center justify-between border-b border-sky-400/10 px-3 py-1.5"><span className="text-xs font-bold text-slate-100">{name} <span className="ml-2 text-cyan-300">{Number.isFinite(last)?last.toFixed(2):'—'}</span></span><div className="flex items-center gap-2"><button type="button" onClick={()=>setEditing(v=>v===name?null:name)} title={`Ustawienia ${name}`} aria-label={`Ustawienia ${name}`} className="rounded p-1 text-slate-300 hover:bg-white/10 hover:text-white">⚙</button><button type="button" onClick={()=>onRemove(name)} title={`Usuń ${name}`} className="rounded px-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label={`Usuń ${name}`}>×</button></div></div>
    {editing===name&&<div className="flex flex-wrap items-end gap-3 border-b border-sky-400/20 bg-[#10243e] p-3">
      {(["period",...(hasSignal?["fast","slow"]:[]),...(["MACD","OsMA"].includes(name)?["signal"]:[]),...(name==="Stochastic"?["smooth"]:[]),...(hasLevels?["lower","upper"]:[])] as OscillatorNumericSetting[]).map(key=><label key={key} className="flex flex-col gap-1 text-[11px] text-slate-300"><span>{{period:"Okres",fast:"Fast",slow:"Slow",signal:"Signal",smooth:"Wygładzanie",lower:"Poziom dolny",upper:"Poziom górny"}[key]}</span><input type="number" min={key==="lower"||key==="upper"?-200:1} max={key==="lower"||key==="upper"?200:300} value={config[key]} onChange={e=>change(name,{[key]:Number(e.target.value)})} className="w-20 rounded border border-sky-400/30 bg-[#071426] px-2 py-1.5 text-white"/></label>)}
      <label className="flex flex-col gap-1 text-[11px] text-slate-300">Kolor<input type="color" value={config.color||calc.colors[0]} onChange={e=>change(name,{color:e.target.value})} className="h-8 w-12 cursor-pointer rounded bg-transparent"/></label>
      <label className="flex flex-col gap-1 text-[11px] text-slate-300">Grubość linii<input type="number" min="1" max="6" value={config.lineWidth} onChange={e=>change(name,{lineWidth:Math.max(1,Math.min(6,Number(e.target.value)||1))})} className="w-20 rounded border border-sky-400/30 bg-[#071426] px-2 py-1.5 text-white"/></label>
      {calc.lines.length>1&&calc.histogram!==1&&<><label className="flex flex-col gap-1 text-[11px] text-slate-300">Grubość Signal<input type="number" min="1" max="6" value={config.signalWidth} onChange={e=>change(name,{signalWidth:Math.max(1,Math.min(6,Number(e.target.value)||1))})} className="w-20 rounded border border-sky-400/30 bg-[#071426] px-2 py-1.5 text-white"/></label><label className="flex flex-col gap-1 text-[11px] text-slate-300">Kolor Signal<input type="color" value={config.signalColor||calc.colors[1]||"#f59e0b"} onChange={e=>change(name,{signalColor:e.target.value})} className="h-8 w-12 cursor-pointer rounded bg-transparent"/></label></>}
      {calc.histogram!==undefined&&<label className="flex flex-col gap-1 text-[11px] text-slate-300">Grubość histogramu<input type="number" min="1" max="6" value={config.histogramWidth} onChange={e=>change(name,{histogramWidth:Math.max(1,Math.min(6,Number(e.target.value)||1))})} className="w-20 rounded border border-sky-400/30 bg-[#071426] px-2 py-1.5 text-white"/></label>}
      <div className="flex w-full flex-wrap items-end gap-3 border-t border-sky-400/20 pt-3">
        <span className="w-full text-xs font-semibold text-sky-200">Poziomy poziome / linie odniesienia</span>
        <label className="flex items-center gap-2 text-[11px] text-slate-300"><input type="checkbox" checked={config.showLevels!==false} onChange={e=>change(name,{showLevels:e.target.checked})} /> Pokaż poziomy</label>
        <label className="flex flex-col gap-1 text-[11px] text-slate-300">Styl poziomów
          <select value={config.levelStyle||"dashed"} onChange={e=>change(name,{levelStyle:e.target.value as OscillatorSettings["levelStyle"]})} className="rounded border border-sky-400/30 bg-[#071426] px-2 py-1.5 text-white">
            <option value="solid">Ciągła</option><option value="dashed">Przerywana</option><option value="dotted">Kropkowana</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-slate-300">Grubość poziomów (1–5 px)
          <input type="number" min="1" max="5" step="1" value={config.levelWidth??1} onChange={e=>change(name,{levelWidth:Math.max(1,Math.min(5,Number(e.target.value)||1))})} className="w-28 rounded border border-sky-400/30 bg-[#071426] px-2 py-1.5 text-white" />
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-slate-300">Kolor poziomów
          <input type="color" value={config.levelColor||"#64748b"} onChange={e=>change(name,{levelColor:e.target.value})} className="h-8 w-12 cursor-pointer rounded bg-transparent" />
        </label>
      </div>
      <button type="button" className="rounded border border-sky-400/30 px-3 py-1.5 text-xs text-slate-200" onClick={()=>change(name,defaultOscillatorSettings)}>Reset</button>
      <button type="button" className="rounded bg-sky-600 px-3 py-1.5 text-xs text-white" onClick={()=>setEditing(null)}>Gotowe</button>
    </div>}
    {candles.length<35?<p className="p-4 text-xs text-slate-400">Oczekiwanie na historię świec (minimum 35)...</p>:<svg onMouseMove={e=>{const rect=e.currentTarget.getBoundingClientRect();const ratio=(e.clientX-rect.left)/(rect.width*plotFraction);const idx=Math.round(range.from+ratio*(range.to-range.from));const t=(candles[idx] as any)?.time;if(t!=null)onCrosshairTimeChange?.(Number(t));}} onMouseLeave={()=>onCrosshairTimeChange?.(null)} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="block h-[100px] w-full" role="img" aria-label={`Wykres ${name}`}>
      <defs><clipPath id={`fx-osc-clip-${OSCILLATORS.indexOf(name)}`}><rect x="0" y="0" width={width} height={height}/></clipPath></defs>
      {[0.25,0.5,0.75].map(v=><line key={v} x1="0" x2={width} y1={height*v} y2={height*v} stroke="#25334a" strokeDasharray="3 5"/>)}
      {config.showLevels!==false&&levels.map((v,i)=><line key={`${v}-${i}`} x1="0" x2={width} y1={y(v)} y2={y(v)} stroke={config.levelColor||"#64748b"} strokeWidth={Math.max(1,Math.min(5,Number(config.levelWidth)||1))} strokeDasharray={config.levelStyle==="solid"?undefined:config.levelStyle==="dotted"?"1 5":"6 5"} vectorEffect="non-scaling-stroke" opacity=".8"/>)}
      <g clipPath={`url(#fx-osc-clip-${OSCILLATORS.indexOf(name)})`}>
      {calc.lines.map((series,i)=>i===calc.histogram?series.map((v,j)=>Number.isFinite(v)?<line key={j} x1={x(j)} x2={x(j)} y1={y(0)} y2={y(v)} stroke={v>=0?'#34d399':'#fb7185'} strokeWidth={config.histogramWidth||2}/>:null):<path key={i} d={line(series)} fill="none" stroke={i===0&&config.color?config.color:i===1&&config.signalColor?config.signalColor:calc.colors[i]} strokeWidth={i===1?config.signalWidth||2:config.lineWidth||2} vectorEffect="non-scaling-stroke"/>)}
      </g>
      {crosshairTime!=null&&(()=>{const idx=candles.findIndex(c=>Number((c as any).time)===crosshairTime);if(idx<0)return null;const cx=x(idx);return cx>=0&&cx<=width?<line x1={cx} x2={cx} y1={0} y2={height} stroke="#94a3b8" strokeDasharray="4 3" strokeWidth="1" vectorEffect="non-scaling-stroke" pointerEvents="none"/>:null;})()}
    </svg>}
  </div>;
 })}
 </div>;
}
