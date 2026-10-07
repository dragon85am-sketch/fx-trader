import { normalizeMarketSymbol } from "@/lib/market/master-symbols";

// Scanner universe aligned with the default Master Collector universe.
// AUDHUF/AUDZAR were removed because they are not present in MASTER_MARKET_SYMBOLS.
export const FX_SCANNER_SYMBOLS = [
  "GBPUSD","GBPCHF","GBPAUD","GBPCAD","GBPNZD",
  "EURUSD","EURCHF","EURCAD","EURGBP","EURAUD","EURNZD","EURJPY","EURPLN",
  "USDCAD","USDPLN","USDCHF","USDJPY","NZDUSD",
  "AUDCAD","AUDUSD","AUDNZD","AUDJPY","AUDCHF",
  "BTCUSD","NASUSD","USOUSD","XAGUSD","US30","XAUUSD",
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
