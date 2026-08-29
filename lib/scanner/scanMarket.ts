import { fxTradeScanner, type Candle, type Signal } from "./fxTradeScanner";

export type MarketScanItem = {
  symbol: string;
  signal: Signal;
};

export function scanMarket(
  marketData: Record<string, Candle[]>,
): MarketScanItem[] {
  return Object.entries(marketData).map(([symbol, candles]) => ({
    symbol,
    signal: fxTradeScanner(candles),
  }));
}