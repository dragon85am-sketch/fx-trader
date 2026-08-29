export type Candle = {
  open: number
  high: number
  low: number
  close: number
}

export type Signal = {
  trend: "bullish" | "bearish" | "neutral"
  entry: number
  sl: number
  tp1: number
  tp2: number
  tp3: number
}

function ema(values: number[], length: number) {
  const k = 2 / (length + 1)
  let result = values[0]

  for (let i = 1; i < values.length; i++) {
    result = values[i] * k + result * (1 - k)
  }

  return result
}

function atr(data: Candle[], length: number) {
  const trs: number[] = []

  for (let i = 1; i < data.length; i++) {
    const highLow = data[i].high - data[i].low
    const highClose = Math.abs(data[i].high - data[i - 1].close)
    const lowClose = Math.abs(data[i].low - data[i - 1].close)

    const tr = Math.max(highLow, highClose, lowClose)
    trs.push(tr)
  }

  const last = trs.slice(-length)
  const sum = last.reduce((a, b) => a + b, 0)

  return sum / length
}

export function fxTradeScanner(data: Candle[]): Signal {

  const closes = data.map(c => c.close)

  const trendLine = ema(closes, 40)

  const last = data[data.length - 1]

  const volatility = atr(data, 14)

  const bullish = last.close > trendLine

  const entry = last.close

  const sl = bullish
    ? last.low - volatility * 2
    : last.high + volatility * 2

  const risk = Math.abs(entry - sl)

  return {
    trend: bullish ? "bullish" : "bearish",
    entry,
    sl,
    tp1: bullish ? entry + risk * 1 : entry - risk * 1,
    tp2: bullish ? entry + risk * 2 : entry - risk * 2,
    tp3: bullish ? entry + risk * 3 : entry - risk * 3
  }
}
