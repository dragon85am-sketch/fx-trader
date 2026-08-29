// lib/binanceClient.ts
export type BinanceKline = {
  time: number; open: number; high: number; low: number; close: number;
};

const BINANCE_BASE = "https://api.binance.com";

export function isBinanceEnabled() {
  return (process.env.BINANCE_ENABLED ?? "").trim() === "1";
}

export function normalizeBinanceSymbol(sym: string) {
  // Binance: BTCUSDT, ETHUSDT...
  return (sym ?? "").trim().toUpperCase().replaceAll("_", "").replaceAll("-", "").replaceAll("/", "");
}

export async function fetchBinanceCandles(symbol: string, interval: string, limit: number) {
  const s = normalizeBinanceSymbol(symbol);
  const url = `${BINANCE_BASE}/api/v3/klines?symbol=${encodeURIComponent(s)}&interval=${encodeURIComponent(interval)}&limit=${Math.min(1500, Math.max(1, limit))}`;
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`Binance error ${r.status}`);
  const data = (await r.json()) as any[];

  const out: BinanceKline[] = data.map((k) => ({
    time: Math.floor(Number(k[0]) / 1000),
    open: Number(k[1]),
    high: Number(k[2]),
    low: Number(k[3]),
    close: Number(k[4]),
  }));

  return out;
}

// map TF -> Binance interval
export function mapTfToBinance(tf: string) {
  const t = (tf ?? "").toUpperCase();
  if (t === "M1") return "1m";
  if (t === "M5") return "5m";
  if (t === "M15") return "15m";
  if (t === "M30") return "30m";
  if (t === "H1") return "1h";
  if (t === "H4") return "4h";
  if (t === "D1") return "1d";
  return "5m";
}