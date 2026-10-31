// FX TRADE V4: bounded, DB-independent in-memory OHLC for accepted durable ticks.
export const LIVE_FRAMES = [
  ["1min", 60_000], ["5min", 300_000], ["15min", 900_000],
  ["30min", 1_800_000], ["1h", 3_600_000], ["4h", 14_400_000],
  ["1day", 86_400_000],
] as const;
export type LiveInterval = typeof LIVE_FRAMES[number][0];
export type LiveTick = { symbol: string; price: number; timestamp: number };
export type LiveCandle = { symbol: string; interval: LiveInterval; bucket: number; open: number; high: number; low: number; close: number; firstAt: number; lastAt: number; ticks: number };
export class LiveCandleEngine {
  private readonly candles = new Map<string, LiveCandle>();
  private readonly lastTime = new Map<string, number>();
  constructor(private readonly maxBucketsPerSymbol = 2) {}
  accept(t: LiveTick): void {
    if (!t.symbol || !Number.isFinite(t.price) || t.price <= 0 || !Number.isFinite(t.timestamp) || t.timestamp <= 0) throw new Error("Invalid live tick");
    const prev = this.lastTime.get(t.symbol);
    if (prev !== undefined && t.timestamp < prev) throw new Error("Out-of-order live tick");
    this.lastTime.set(t.symbol, t.timestamp);
    for (const [interval, duration] of LIVE_FRAMES) {
      const bucket = Math.floor(t.timestamp / duration) * duration;
      const key = `${t.symbol}|${interval}|${bucket}`;
      const old = this.candles.get(key);
      if (old) {
        old.high = Math.max(old.high, t.price);
        old.low = Math.min(old.low, t.price);
        old.close = t.price;
        old.lastAt = t.timestamp;
        old.ticks++;
      } else {
        this.candles.set(key, {symbol:t.symbol,interval,bucket,open:t.price,high:t.price,low:t.price,close:t.price,firstAt:t.timestamp,lastAt:t.timestamp,ticks:1});
      }
      const cutoff = bucket - (this.maxBucketsPerSymbol - 1) * duration;
      for (const k of this.candles.keys()) {
        if (!k.startsWith(`${t.symbol}|${interval}|`)) continue;
        const oldBucket = Number(k.slice(k.lastIndexOf("|") + 1));
        if (oldBucket < cutoff) this.candles.delete(k);
      }
    }
  }
  current(symbol: string, interval: LiveInterval, now = Date.now()): LiveCandle | null {
    const duration = LIVE_FRAMES.find(([name]) => name === interval)?.[1];
    if (!duration) return null;
    return this.candles.get(`${symbol}|${interval}|${Math.floor(now / duration) * duration}`) ?? null;
  }
  get size(): number { return this.candles.size; }
}
