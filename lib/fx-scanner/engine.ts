export type Side = "BUY" | "SELL";
export type Signal = "UP" | "DOWN" | "NONE";
export type Candle = { time: number; open: number; high: number; low: number; close: number; volume?: number };
export type Levels = { side: Side; entry: number; sl: number; tps: [number, number, number]; rr: number };

const EMA_FAST=14, WMA_SLOW=40, ADX_PERIOD=14, ADX_MIN=22;
const TARGET={atrPeriod:14,slMultiplier:1,tp1Multiplier:1,tp2Multiplier:1.5,tp3Multiplier:2};

function ema(values:number[],period:number){const out:number[]=[];const k=2/(period+1);let prev=values[0]??0;out.push(prev);for(let i=1;i<values.length;i++){const n=values[i]*k+prev*(1-k);out.push(n);prev=n;}return out;}
function wma(values:number[],period:number){const out:number[]=[];const d=period*(period+1)/2;for(let i=0;i<values.length;i++){if(i<period-1){out.push(values[i]??0);continue;}let sum=0;for(let j=0;j<period;j++)sum+=values[i-j]*(period-j);out.push(sum/d);}return out;}
function lastClosed(c:Candle[]){return c.length>=2?c[c.length-2]:c[c.length-1];}
export function calcATR(c:Candle[],period=14){if(c.length<period+1)return 0;const tr:number[]=[];for(let i=1;i<c.length;i++){const p=c[i-1],x=c[i];tr.push(Math.max(x.high-x.low,Math.abs(x.high-p.close),Math.abs(x.low-p.close)));}let a=tr.slice(0,period).reduce((s,v)=>s+v,0)/period;for(let i=period;i<tr.length;i++)a=(a*(period-1)+tr[i])/period;return a;}
function emaWmaSignal(c:Candle[]):Signal{if(c.length<WMA_SLOW+5)return"NONE";const closes=c.map(x=>x.close),e=ema(closes,EMA_FAST),w=wma(closes,WMA_SLOW),last=lastClosed(c);if(!last)return"NONE";const i=c.findIndex(x=>x.time===last.time);if(last.close>e[i]&&e[i]>w[i])return"UP";if(last.close<e[i]&&e[i]<w[i])return"DOWN";return"NONE";}
function adxDiSignal(c:Candle[],period=ADX_PERIOD,minAdx=ADX_MIN):Signal{if(c.length<period*2+2)return"NONE";const closed=c.slice(0,-1);const tr:number[]=[],plus:number[]=[],minus:number[]=[];for(let i=1;i<closed.length;i++){const x=closed[i],p=closed[i-1],up=x.high-p.high,down=p.low-x.low;plus.push(up>down&&up>0?up:0);minus.push(down>up&&down>0?down:0);tr.push(Math.max(x.high-x.low,Math.abs(x.high-p.close),Math.abs(x.low-p.close)));}if(tr.length<period)return"NONE";let st=tr.slice(0,period).reduce((a,b)=>a+b,0),sp=plus.slice(0,period).reduce((a,b)=>a+b,0),sm=minus.slice(0,period).reduce((a,b)=>a+b,0);const dx:number[]=[];let dip=0,dim=0;const push=()=>{if(st<=0){dx.push(0);return;}dip=100*sp/st;dim=100*sm/st;const sum=dip+dim;dx.push(sum?100*Math.abs(dip-dim)/sum:0);};push();for(let i=period;i<tr.length;i++){st=st-st/period+tr[i];sp=sp-sp/period+plus[i];sm=sm-sm/period+minus[i];push();}if(dx.length<period)return"NONE";let adx=dx.slice(0,period).reduce((a,b)=>a+b,0)/period;for(let i=period;i<dx.length;i++)adx=(adx*(period-1)+dx[i])/period;return adx>=minAdx&&dip>dim?"UP":adx>=minAdx&&dim>dip?"DOWN":"NONE";}
function bullishSweep(c:Candle[],i:number){if(i<2)return false;const x=c[i],p=c[i-1],wick=Math.min(x.open,x.close)-x.low,body=Math.abs(x.close-x.open);return x.low<p.low&&x.close>x.open&&wick>body*.5;}
function bearishSweep(c:Candle[],i:number){if(i<2)return false;const x=c[i],p=c[i-1],wick=x.high-Math.max(x.open,x.close),body=Math.abs(x.close-x.open);return x.high>p.high&&x.close<x.open&&wick>body*.5;}
function recentSweep(c:Candle[],side:Side){const last=Math.max(0,c.length-2),from=Math.max(2,last-3);for(let i=from;i<=last;i++)if(side==="BUY"?bullishSweep(c,i):bearishSweep(c,i))return true;return false;}
function momentum(x:Candle,side:Side){const body=Math.abs(x.close-x.open),range=x.high-x.low;if(range<=0)return false;const ratio=body/range;if(side==="BUY")return x.close>x.open&&ratio>=.65&&(x.high-x.close)/range<=.25;return x.close<x.open&&ratio>=.65&&(x.close-x.low)/range<=.25;}
function recentMomentum(c:Candle[],side:Side){const last=Math.max(0,c.length-2),from=Math.max(0,last-2);for(let i=from;i<=last;i++)if(momentum(c[i],side))return true;return false;}
export function scan4of4(c:Candle[]){const ew=emaWmaSignal(c),ad=adxDiSignal(c);const score=(side:Side)=>{const want=side==="BUY"?"UP":"DOWN";return Number(ew===want)+Number(ad===want)+Number(recentSweep(c,side))+Number(recentMomentum(c,side));};const buy=score("BUY"),sell=score("SELL");if(buy===4&&buy>sell)return{side:"BUY" as Side,count:4 as const};if(sell===4&&sell>buy)return{side:"SELL" as Side,count:4 as const};return{side:null,count:Math.max(buy,sell) as 0|1|2|3|4};}
export function buildLevels(c:Candle[],side:Side):Levels|null{const s=lastClosed(c),atr=calcATR(c,TARGET.atrPeriod);if(!s||!atr)return null;const entry=s.close,sl=side==="BUY"?entry-atr*TARGET.slMultiplier:entry+atr*TARGET.slMultiplier;const dir=side==="BUY"?1:-1;return{side,entry,sl,tps:[entry+dir*atr*TARGET.tp1Multiplier,entry+dir*atr*TARGET.tp2Multiplier,entry+dir*atr*TARGET.tp3Multiplier],rr:2};}
export function advanceTrade(c:Candle[],side:Side,l:Levels,signalTime:number,tp1Hit=false,tp2Hit=false){
  // Last element is treated as the still-forming candle, as in scan4of4().
  // Conservative OHLC policy: protective level wins when intrabar order is unknown.
  const start=c.findIndex(x=>x.time>signalTime);
  if(start<0)return {status:null as null|"TP3"|"SL"|"TP1_BE",tp1Hit,tp2Hit};
  const isBuy=side==="BUY";
  for(let i=start;i<c.length-1;i++){
    const x=c[i];
    const stopTouched=isBuy?x.low<=l.sl:x.high>=l.sl;
    const entryTouched=isBuy?x.low<=l.entry:x.high>=l.entry;
    const hit1=isBuy?x.high>=l.tps[0]:x.low<=l.tps[0];
    const hit2=isBuy?x.high>=l.tps[1]:x.low<=l.tps[1];
    const hit3=isBuy?x.high>=l.tps[2]:x.low<=l.tps[2];
    if(!tp1Hit&&stopTouched)return {status:"SL" as const,tp1Hit:false,tp2Hit:false};
    // If BE was already armed, it takes precedence over a target on the same candle.
    if(tp1Hit&&entryTouched)return {status:"TP1_BE" as const,tp1Hit:true,tp2Hit};
    if(!tp1Hit&&hit1){
      tp1Hit=true;
      // TP1 and retracement to entry inside one candle: order is unknown.
      // Mark as BE conservatively rather than assuming TP3.
      if(entryTouched)return {status:"TP1_BE" as const,tp1Hit:true,tp2Hit:false};
    }
    if(tp1Hit&&hit2)tp2Hit=true;
    if(tp1Hit&&hit3)return {status:"TP3" as const,tp1Hit:true,tp2Hit:true};
  }
  return {status:null,tp1Hit,tp2Hit};
}


// Faza 3.3: niezalezna ocena jakosci Liquidity Sweep (nie zmienia warunku 4/4).
export type LiquiditySweepScore = {
  side: Side; score: number; sweep: number; rejection: number;
  confirmation: number; sweepTime: number | null; confirmed: boolean;
};
export function scoreLiquiditySweep(c: Candle[], side: Side, lookback = 5): LiquiditySweepScore {
  const empty = (): LiquiditySweepScore => ({side,score:0,sweep:0,rejection:0,confirmation:0,sweepTime:null,confirmed:false});
  // Ostatnia swieca moze byc w trakcie tworzenia: analizujemy tylko zamkniete.
  if (c.length < 4) return empty();
  const end = c.length - 2;
  let best = empty();
  for (let i = Math.max(2, end - Math.max(1, lookback) + 1); i <= end; i++) {
    const x = c[i], previous = c[i - 1];
    const range = x.high - x.low;
    if (!(range > 0)) continue;
    const buy = side === "BUY";
    const swept = buy ? x.low < previous.low : x.high > previous.high;
    if (!swept) continue;
    const reclaimed = buy ? x.close > previous.low : x.close < previous.high;
    const penetration = buy ? previous.low - x.low : x.high - previous.high;
    const sweep = Math.round(40 * (reclaimed ? 0.6 + 0.4 * Math.min(1, penetration / range) : 0.3 * Math.min(1, penetration / range)));
    const wick = buy ? Math.min(x.open,x.close)-x.low : x.high-Math.max(x.open,x.close);
    const wickRatio = Math.max(0,wick/range);
    const closePosition = buy ? (x.close-x.low)/range : (x.high-x.close)/range;
    const rejection = Math.round(35 * Math.min(1, 0.65 * wickRatio / 0.5 + 0.35 * Math.max(0,closePosition)));
    // Potwierdzenie musi nastapic na kolejnej ZAMKNIETEJ swiecy.
    const next = i < end ? c[i+1] : null;
    const confirmed = !!next && (buy ? next.close > x.high : next.close < x.low);
    const confirmation = confirmed ? 25 : next && (buy ? next.close > x.close : next.close < x.close) ? 12 : 0;
    const score = Math.min(100,sweep+rejection+confirmation);
    if (score > best.score) best = {side,score,sweep,rejection,confirmation,sweepTime:x.time,confirmed};
  }
  return best;
}
