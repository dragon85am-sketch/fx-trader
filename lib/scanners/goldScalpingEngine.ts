export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type ScannerSide = "BUY" | "SELL" | "NONE";

export type ScannerStatus =
  | "WAIT"
  | "WATCH"
  | "CLOSE"
  | "READY"
  | "INVALID";

export type GoldScannerResult = {
  side: ScannerSide;
  status: ScannerStatus;

  score: number;
  momentum: number;

  m5Trend: "BULLISH" | "BEARISH" | "NEUTRAL";
  structure: "HH_HL" | "LH_LL" | "NEUTRAL";

  liquiditySweep: boolean;
  structureShift: boolean;
  displacement: boolean;

  ema50: number;
  ema200: number;
  atr: number;
  rsi: number;

  entry: number | null;
  stopLoss: number | null;
  tp1: number | null;
  tp2: number | null;
  rr1: number | null;
  rr2: number | null;

  reasons: string[];
};

function sma(values: number[], length: number) {
  if (values.length < length) return 0;

  const slice = values.slice(-length);

  return slice.reduce((sum, value) => sum + value, 0) / length;
}

export function ema(values: number[], length: number) {
  if (!values.length) return 0;

  const multiplier = 2 / (length + 1);

  let result = values[0];

  for (let i = 1; i < values.length; i++) {
    result =
      values[i] * multiplier +
      result * (1 - multiplier);
  }

  return result;
}

export function atr(
  candles: Candle[],
  length = 14
) {
  if (candles.length < length + 1) return 0;

  const trueRanges: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const previous = candles[i - 1];

    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - previous.close),
      Math.abs(current.low - previous.close)
    );

    trueRanges.push(tr);
  }

  return sma(trueRanges, length);
}

export function rsi(
  closes: number[],
  length = 14
) {
  if (closes.length < length + 1) return 50;

  let gains = 0;
  let losses = 0;

  const start = closes.length - length;

  for (let i = start; i < closes.length; i++) {
    const previous = closes[i - 1];
    const current = closes[i];

    const change = current - previous;

    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  const avgGain = gains / length;
  const avgLoss = losses / length;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;

  return 100 - 100 / (1 + rs);
}

function getRecentHigh(
  candles: Candle[],
  lookback = 10
) {
  return Math.max(
    ...candles
      .slice(-lookback)
      .map((candle) => candle.high)
  );
}

function getRecentLow(
  candles: Candle[],
  lookback = 10
) {
  return Math.min(
    ...candles
      .slice(-lookback)
      .map((candle) => candle.low)
  );
}

function detectM5Structure(
  candles: Candle[]
): GoldScannerResult["structure"] {
  if (candles.length < 10) {
    return "NEUTRAL";
  }

  const recent = candles.slice(-10);

  const firstHalf = recent.slice(0, 5);
  const secondHalf = recent.slice(5);

  const oldHigh = Math.max(
    ...firstHalf.map((c) => c.high)
  );

  const oldLow = Math.min(
    ...firstHalf.map((c) => c.low)
  );

  const newHigh = Math.max(
    ...secondHalf.map((c) => c.high)
  );

  const newLow = Math.min(
    ...secondHalf.map((c) => c.low)
  );

  if (
    newHigh > oldHigh &&
    newLow > oldLow
  ) {
    return "HH_HL";
  }

  if (
    newHigh < oldHigh &&
    newLow < oldLow
  ) {
    return "LH_LL";
  }

  return "NEUTRAL";
}

function detectBullishLiquiditySweep(
  candles: Candle[]
) {
  if (candles.length < 8) return false;

  const signal = candles[candles.length - 2];

  const previous = candles.slice(-8, -2);

  const previousLow = Math.min(
    ...previous.map((c) => c.low)
  );

  return (
    signal.low < previousLow &&
    signal.close > previousLow
  );
}

function detectBearishLiquiditySweep(
  candles: Candle[]
) {
  if (candles.length < 8) return false;

  const signal = candles[candles.length - 2];

  const previous = candles.slice(-8, -2);

  const previousHigh = Math.max(
    ...previous.map((c) => c.high)
  );

  return (
    signal.high > previousHigh &&
    signal.close < previousHigh
  );
}

function detectBullishBOS(
  candles: Candle[]
) {
  if (candles.length < 8) return false;

  const current = candles[candles.length - 1];

  const previous = candles.slice(-7, -1);

  const swingHigh = Math.max(
    ...previous.map((c) => c.high)
  );

  return current.close > swingHigh;
}

function detectBearishBOS(
  candles: Candle[]
) {
  if (candles.length < 8) return false;

  const current = candles[candles.length - 1];

  const previous = candles.slice(-7, -1);

  const swingLow = Math.min(
    ...previous.map((c) => c.low)
  );

  return current.close < swingLow;
}

function detectBullishDisplacement(
  candles: Candle[],
  currentAtr: number
) {
  if (!candles.length) return false;

  const current =
    candles[candles.length - 1];

  const body =
    current.close - current.open;

  const range =
    current.high - current.low;

  if (range <= 0) return false;

  const bodyRatio = body / range;

  return (
    body > 0 &&
    bodyRatio >= 0.6 &&
    body >= currentAtr * 0.5
  );
}

function detectBearishDisplacement(
  candles: Candle[],
  currentAtr: number
) {
  if (!candles.length) return false;

  const current =
    candles[candles.length - 1];

  const body =
    current.open - current.close;

  const range =
    current.high - current.low;

  if (range <= 0) return false;

  const bodyRatio = body / range;

  return (
    body > 0 &&
    bodyRatio >= 0.6 &&
    body >= currentAtr * 0.5
  );
}

function calculateMomentum(
  candles: Candle[],
  side: "BUY" | "SELL",
  currentAtr: number
) {
  if (candles.length < 20) return 0;

  const closes = candles.map(
    (candle) => candle.close
  );

  const currentRsi = rsi(closes);

  const ema9 = ema(closes, 9);
  const ema21 = ema(closes, 21);

  const recent = candles.slice(-5);

  let bullishBodies = 0;
  let bearishBodies = 0;

  let totalBody = 0;

  recent.forEach((candle) => {
    const body = candle.close - candle.open;

    totalBody += Math.abs(body);

    if (body > 0) {
      bullishBodies++;
    }

    if (body < 0) {
      bearishBodies++;
    }
  });

  const avgBody =
    totalBody / recent.length;

  let score = 0;

  if (side === "BUY") {
    if (ema9 > ema21) score += 25;

    if (
      currentRsi >= 52 &&
      currentRsi <= 75
    ) {
      score += 25;
    }

    if (bullishBodies >= 3) {
      score += 20;
    }

    if (avgBody >= currentAtr * 0.25) {
      score += 20;
    }

    if (
      candles[candles.length - 1].close >
      candles[candles.length - 2].high
    ) {
      score += 10;
    }
  }

  if (side === "SELL") {
    if (ema9 < ema21) score += 25;

    if (
      currentRsi <= 48 &&
      currentRsi >= 25
    ) {
      score += 25;
    }

    if (bearishBodies >= 3) {
      score += 20;
    }

    if (avgBody >= currentAtr * 0.25) {
      score += 20;
    }

    if (
      candles[candles.length - 1].close <
      candles[candles.length - 2].low
    ) {
      score += 10;
    }
  }

  return Math.min(score, 100);
}

function calculateRR(
  entry: number,
  stop: number,
  target: number
) {
  const risk = Math.abs(entry - stop);

  const reward = Math.abs(target - entry);

  if (risk === 0) return 0;

  return reward / risk;
}

export function scanGoldScalping({
  m1,
  m5,
  minMomentum = 70,
  minScore = 80,
  minRR = 1.5,
}: {
  m1: Candle[];
  m5: Candle[];
  minMomentum?: number;
  minScore?: number;
  minRR?: number;
}): GoldScannerResult {
  const emptyResult: GoldScannerResult = {
    side: "NONE",
    status: "WAIT",

    score: 0,
    momentum: 0,

    m5Trend: "NEUTRAL",
    structure: "NEUTRAL",

    liquiditySweep: false,
    structureShift: false,
    displacement: false,

    ema50: 0,
    ema200: 0,
    atr: 0,
    rsi: 50,

    entry: null,
    stopLoss: null,
    tp1: null,
    tp2: null,
    rr1: null,
    rr2: null,

    reasons: [],
  };

  if (
    m1.length < 30 ||
    m5.length < 50
  ) {
    return {
      ...emptyResult,
      reasons: [
        "Za mało świec do analizy",
      ],
    };
  }

  const m5Closes = m5.map(
    (candle) => candle.close
  );

  const m1Closes = m1.map(
    (candle) => candle.close
  );

  const ema50 = ema(m5Closes, 50);
  const ema200 = ema(m5Closes, 200);

  const currentAtr = atr(m1, 14);

  const currentRsi = rsi(
    m1Closes,
    14
  );

  const structure =
    detectM5Structure(m5);

  let m5Trend:
    | "BULLISH"
    | "BEARISH"
    | "NEUTRAL" = "NEUTRAL";

  if (
    ema50 > ema200 &&
    structure === "HH_HL"
  ) {
    m5Trend = "BULLISH";
  }

  if (
    ema50 < ema200 &&
    structure === "LH_LL"
  ) {
    m5Trend = "BEARISH";
  }

  const bullishSweep =
    detectBullishLiquiditySweep(m1);

  const bearishSweep =
    detectBearishLiquiditySweep(m1);

  const bullishBos =
    detectBullishBOS(m1);

  const bearishBos =
    detectBearishBOS(m1);

  const bullishDisplacement =
    detectBullishDisplacement(
      m1,
      currentAtr
    );

  const bearishDisplacement =
    detectBearishDisplacement(
      m1,
      currentAtr
    );

  const lastPrice =
    m1[m1.length - 1].close;

  let side: ScannerSide = "NONE";

  if (m5Trend === "BULLISH") {
    side = "BUY";
  }

  if (m5Trend === "BEARISH") {
    side = "SELL";
  }

  if (side === "NONE") {
    return {
      ...emptyResult,

      ema50,
      ema200,

      atr: currentAtr,
      rsi: currentRsi,

      structure,
      m5Trend,

      status: "WAIT",

      reasons: [
        "Brak jednoznacznego trendu M5",
      ],
    };
  }

  const momentum =
    calculateMomentum(
      m1,
      side,
      currentAtr
    );

  const liquiditySweep =
    side === "BUY"
      ? bullishSweep
      : bearishSweep;

  const structureShift =
    side === "BUY"
      ? bullishBos
      : bearishBos;

  const displacement =
    side === "BUY"
      ? bullishDisplacement
      : bearishDisplacement;

  let score = 0;

  const reasons: string[] = [];

  // TREND — 20
  if (side === "BUY") {
    if (m5Trend === "BULLISH") {
      score += 20;
      reasons.push("M5 trend bullish");
    }
  }

  if (side === "SELL") {
    if (m5Trend === "BEARISH") {
      score += 20;
      reasons.push("M5 trend bearish");
    }
  }

  // STRUCTURE — 20
  if (
    structure === "HH_HL" &&
    side === "BUY"
  ) {
    score += 20;
    reasons.push("M5 HH / HL");
  }

  if (
    structure === "LH_LL" &&
    side === "SELL"
  ) {
    score += 20;
    reasons.push("M5 LH / LL");
  }

  // LIQUIDITY — 20
  if (liquiditySweep) {
    score += 20;

    reasons.push(
      side === "BUY"
        ? "SSL liquidity sweep"
        : "BSL liquidity sweep"
    );
  }

  // BOS — 15
  if (structureShift) {
    score += 15;

    reasons.push(
      "M1 BOS / CHOCH potwierdzony"
    );
  }

  // DISPLACEMENT — 10
  if (displacement) {
    score += 10;

    reasons.push(
      "Silny displacement"
    );
  }

  // MOMENTUM — 15
  if (momentum >= minMomentum) {
    score += 15;

    reasons.push(
      `Momentum ${momentum}/100`
    );
  }

  let stopLoss: number;

  if (side === "BUY") {
    stopLoss =
      getRecentLow(m1, 8) -
      currentAtr * 0.15;
  } else {
    stopLoss =
      getRecentHigh(m1, 8) +
      currentAtr * 0.15;
  }

  const entry = lastPrice;

  const risk =
    Math.abs(entry - stopLoss);

  let tp1: number;
  let tp2: number;

  if (side === "BUY") {
    tp1 = entry + risk * 1.5;
    tp2 = entry + risk * 2.5;
  } else {
    tp1 = entry - risk * 1.5;
    tp2 = entry - risk * 2.5;
  }

  const rr1 = calculateRR(
    entry,
    stopLoss,
    tp1
  );

  const rr2 = calculateRR(
    entry,
    stopLoss,
    tp2
  );

  let status: ScannerStatus =
    "WAIT";

  if (m5Trend !== "NEUTRAL") {
    status = "WATCH";
  }

  if (liquiditySweep) {
    status = "CLOSE";
  }

  const ready =
    score >= minScore &&
    liquiditySweep &&
    structureShift &&
    displacement &&
    momentum >= minMomentum &&
    rr1 >= minRR;

  if (ready) {
    status = "READY";
  }

  return {
    side,
    status,

    score,
    momentum,

    m5Trend,
    structure,

    liquiditySweep,
    structureShift,
    displacement,

    ema50,
    ema200,

    atr: currentAtr,
    rsi: currentRsi,

    entry,
    stopLoss,
    tp1,
    tp2,

    rr1,
    rr2,

    reasons,
  };
}