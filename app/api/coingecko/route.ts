import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const symbol = searchParams.get("symbol"); // np. BTCUSDT
  const interval = searchParams.get("interval") || "5m";

  if (!symbol) {
    return Response.json({ error: "Missing symbol" }, { status: 400 });
  }

  // mapowanie symbol â†’ coingecko id
  const map: Record<string, string> = {
    BTCUSDT: "bitcoin",
    ETHUSDT: "ethereum",
    BNBUSDT: "binancecoin",
    SOLUSDT: "solana",
    XRPUSDT: "ripple",
    ADAUSDT: "cardano",
    DOGEUSDT: "dogecoin",
  };

  const coinId = map[symbol.toUpperCase()];

  if (!coinId) {
    return Response.json({ error: "Unsupported symbol" }, { status: 400 });
  }

  // timeframe â†’ days
  const tfMap: Record<string, number> = {
    "1m": 1,
    "5m": 1,
    "15m": 1,
    "30m": 1,
    "1h": 1,
    "4h": 7,
    "1d": 30,
  };

  const days = tfMap[interval] || 1;

  const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const data = await res.json();

  if (!data.prices) {
    return Response.json({ error: "No data from CoinGecko", data });
  }

  // konwersja â†’ candles (pseudo OHLC)
  const candles = data.prices.map((p: any, i: number) => {
    const price = p[1];

    return {
      time: Math.floor(p[0] / 1000),
      open: price,
      high: price,
      low: price,
      close: price,
      volume: data.total_volumes?.[i]?.[1] || 0,
    };
  });

  const volume = candles.reduce((sum: number, c: any) => sum + c.volume, 0);

  return Response.json({
    candles,
    volume,
  });
}
