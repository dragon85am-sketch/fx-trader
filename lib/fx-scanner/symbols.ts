import { normalizeMarketSymbol } from "@/lib/market/master-symbols";

// Test universe requested for the first effectiveness run.
// The worker automatically skips symbols that do not yet have MarketCandle data.
export const FX_SCANNER_SYMBOLS = [
  "GBPUSD","GBPCHF","GBPAUD","GBPCAD","GBPNZD",
  "EURUSD","EURCHF","EURCAD","EURGBP","EURAUD","EURNZD","EURJPY","EURPLN",
  "USDCAD","USDPLN","USDCHF","USDJPY","NZDUSD",
  "AUDCAD","AUDUSD","AUDHUF","AUDZAR","AUDNZD","AUDJPY","AUDCHF",
  "BTCUSD","NASUSD","USOUSD","XAGUSD","US30",
] as const;

// Provider/database aliases used by the current Master Collector universe.
export function fxScannerStorageSymbol(symbol: string) {
  const s = normalizeMarketSymbol(symbol);
  if (s === "NASUSD") return "US100";
  if (s === "USOUSD") return "WTIUSD";
  return s;
}

export const FX_SCANNER_STORAGE_SYMBOLS = Array.from(
  new Set(FX_SCANNER_SYMBOLS.map(fxScannerStorageSymbol))
);
