// lib/scanners/goldUs30Scanner.ts

export type ScannerDirection = "BUY" | "SELL" | "WAIT";

export type ScannerStatus =
  | "A+ SETUP"
  | "READY"
  | "FORMING"
  | "WAIT";

export type ScannerSymbol = "XAUUSD" | "US30";

export type ScannerCandle = {
  datetime: string;

  open: number;
  high: number;
  low: number;
  close: number;

  volume?: number;
};

export type SessionLevels = {
  asianHigh?: number;
  asianLow?: number;

  londonHigh?: number;
  londonLow?: number;

  nyOpenHigh?: number;
  nyOpenLow?: number;
};

export type ScannerResult = {
  symbol: ScannerSymbol;

  direction: ScannerDirection;
  status: ScannerStatus;

  score: number;

  setup:
    | "Liquidity Reversal"
    | "NY OR Breakout"
    | "Setup Forming"
    | "No Setup";

  biasM5: "BULLISH" | "BEARISH" | "NEUTRAL";

  priceAction: string;

  liquidityConfirmed: boolean;
  structureConfirmed: boolean;
  vwapConfirmed: boolean;
  momentumConfirmed: boolean;

  sweepType:
    | "ASIAN_HIGH"
    | "ASIAN_LOW"
    | "LONDON_HIGH"
    | "LONDON_LOW"
    | "NY_OR_HIGH"
    | "NY_OR_LOW"
    | null;

  structureType:
    | "BOS_UP"
    | "BOS_DOWN"
    | "CHOCH_UP"
    | "CHOCH_DOWN"
    | null;

  entry: number;
  sl: number;
  tp1: number;
  tp2: number;

  rr: number;

  vwap?: number;

  bosPrice?: number;
  chochPrice?: number;

  asianHigh?: number;
  asianLow?: number;

  londonHigh?: number;
  londonLow?: number;

  nyOpenHigh?: number;
  nyOpenLow?: number;

  lastPrice?: number;

  reasons: string[];
};

// ======================================================
// HELPERS
// ======================================================

function safeNumber(value: unknown): number {
  const n = Number(value);

  return Number.isFinite(n) ? n : 0;
}

function roundPrice(
  value: number,
  symbol: ScannerSymbol,
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  if (symbol === "US30") {
    return Math.round(value * 10) / 10;
  }

  return Math.round(value * 100) / 100;
}

function parseTime(datetime: string) {
  const timePart = datetime.split(" ")[1];

  if (!timePart) {
    return {
      hour: 0,
      minute: 0,
    };
  }

  const [hour, minute] = timePart
    .split(":")
    .map(Number);

  return {
    hour: hour || 0,
    minute: minute || 0,
  };
}

function minutesFromMidnight(datetime: string) {
  const { hour, minute } = parseTime(datetime);

  return hour * 60 + minute;
}

function getDate(datetime: string) {
  return datetime.split(" ")[0] || "";
}

function getLatestDate(candles: ScannerCandle[]) {
  if (!candles.length) {
    return "";
  }

  return getDate(
    candles[candles.length - 1].datetime,
  );
}

function candlesForDate(
  candles: ScannerCandle[],
  date: string,
) {
  return candles.filter(
    (candle) => getDate(candle.datetime) === date,
  );
}

function candlesBetween(
  candles: ScannerCandle[],
  startMinute: number,
  endMinute: number,
) {
  return candles.filter((candle) => {
    const minute =
      minutesFromMidnight(candle.datetime);

    return (
      minute >= startMinute &&
      minute < endMinute
    );
  });
}

function getHighLow(
  candles: ScannerCandle[],
) {
  if (!candles.length) {
    return {
      high: undefined,
      low: undefined,
    };
  }

  let high = -Infinity;
  let low = Infinity;

  for (const candle of candles) {
    if (candle.high > high) {
      high = candle.high;
    }

    if (candle.low < low) {
      low = candle.low;
    }
  }

  return {
    high:
      Number.isFinite(high)
        ? high
        : undefined,

    low:
      Number.isFinite(low)
        ? low
        : undefined,
  };
}

// ======================================================
// ATR
// ======================================================

function calculateATR(
  candles: ScannerCandle[],
  period = 14,
) {
  if (candles.length < 2) {
    return 0;
  }

  const start = Math.max(
    1,
    candles.length - period,
  );

  const trueRanges: number[] = [];

  for (
    let i = start;
    i < candles.length;
    i++
  ) {
    const current = candles[i];
    const previous = candles[i - 1];

    const tr = Math.max(
      current.high - current.low,
      Math.abs(
        current.high - previous.close,
      ),
      Math.abs(
        current.low - previous.close,
      ),
    );

    trueRanges.push(tr);
  }

  if (!trueRanges.length) {
    return 0;
  }

  return (
    trueRanges.reduce(
      (sum, value) => sum + value,
      0,
    ) / trueRanges.length
  );
}

// ======================================================
// VWAP
// ======================================================

function calculateVWAP(
  candles: ScannerCandle[],
) {
  if (!candles.length) {
    return undefined;
  }

  let totalPV = 0;
  let totalVolume = 0;

  for (const candle of candles) {
    const typicalPrice =
      (candle.high +
        candle.low +
        candle.close) /
      3;

    const volume =
      candle.volume &&
      candle.volume > 0
        ? candle.volume
        : 1;

    totalPV += typicalPrice * volume;
    totalVolume += volume;
  }

  if (!totalVolume) {
    return undefined;
  }

  return totalPV / totalVolume;
}

// ======================================================
// M5 BIAS
// ======================================================

function getM5Bias(
  candles: ScannerCandle[],
):
  | "BULLISH"
  | "BEARISH"
  | "NEUTRAL" {
  if (candles.length < 12) {
    return "NEUTRAL";
  }

  const recent = candles.slice(-12);

  const first = recent.slice(0, 6);
  const second = recent.slice(6);

  const firstHigh = Math.max(
    ...first.map((c) => c.high),
  );

  const firstLow = Math.min(
    ...first.map((c) => c.low),
  );

  const secondHigh = Math.max(
    ...second.map((c) => c.high),
  );

  const secondLow = Math.min(
    ...second.map((c) => c.low),
  );

  const last =
    recent[recent.length - 1];

  if (
    secondHigh > firstHigh &&
    secondLow > firstLow &&
    last.close >= last.open
  ) {
    return "BULLISH";
  }

  if (
    secondHigh < firstHigh &&
    secondLow < firstLow &&
    last.close <= last.open
  ) {
    return "BEARISH";
  }

  return "NEUTRAL";
}

// ======================================================
// MOMENTUM
// ======================================================

function detectMomentum(
  candles: ScannerCandle[],
) {
  if (!candles.length) {
    return {
      bullish: false,
      bearish: false,
      strength: 0,
    };
  }

  const last =
    candles[candles.length - 1];

  const atr =
    calculateATR(candles, 14);

  const body = Math.abs(
    last.close - last.open,
  );

  if (!atr) {
    return {
      bullish: false,
      bearish: false,
      strength: 0,
    };
  }

  const strength = body / atr;

  return {
    bullish:
      last.close > last.open &&
      strength >= 0.6,

    bearish:
      last.close < last.open &&
      strength >= 0.6,

    strength,
  };
}

// ======================================================
// LIQUIDITY SWEEP
// ======================================================

type SweepResult = {
  direction: ScannerDirection;

  type: ScannerResult["sweepType"];

  level?: number;
};

function detectSweep(
  recentCandles: ScannerCandle[],
  levels: SessionLevels,
): SweepResult {
  if (recentCandles.length < 2) {
    return {
      direction: "WAIT",
      type: null,
    };
  }

  const recent =
    recentCandles.slice(-8);

  const levelChecks: Array<{
    type: NonNullable<
      ScannerResult["sweepType"]
    >;
    level?: number;
    side: "HIGH" | "LOW";
  }> = [
    {
      type: "LONDON_HIGH",
      level: levels.londonHigh,
      side: "HIGH",
    },
    {
      type: "LONDON_LOW",
      level: levels.londonLow,
      side: "LOW",
    },
    {
      type: "ASIAN_HIGH",
      level: levels.asianHigh,
      side: "HIGH",
    },
    {
      type: "ASIAN_LOW",
      level: levels.asianLow,
      side: "LOW",
    },
    {
      type: "NY_OR_HIGH",
      level: levels.nyOpenHigh,
      side: "HIGH",
    },
    {
      type: "NY_OR_LOW",
      level: levels.nyOpenLow,
      side: "LOW",
    },
  ];

  for (let i = recent.length - 1; i >= 0; i--) {
    const candle = recent[i];

    for (const check of levelChecks) {
      if (
        check.level === undefined
      ) {
        continue;
      }

      if (
        check.side === "HIGH" &&
        candle.high > check.level &&
        candle.close < check.level
      ) {
        return {
          direction: "SELL",
          type: check.type,
          level: check.level,
        };
      }

      if (
        check.side === "LOW" &&
        candle.low < check.level &&
        candle.close > check.level
      ) {
        return {
          direction: "BUY",
          type: check.type,
          level: check.level,
        };
      }
    }
  }

  return {
    direction: "WAIT",
    type: null,
  };
}

// ======================================================
// BOS / CHOCH
// ======================================================

type StructureResult = {
  direction: ScannerDirection;

  type: ScannerResult["structureType"];

  bosPrice?: number;
  chochPrice?: number;
};

function detectStructure(
  candles: ScannerCandle[],
  desiredDirection: ScannerDirection,
): StructureResult {
  if (
    candles.length < 10 ||
    desiredDirection === "WAIT"
  ) {
    return {
      direction: "WAIT",
      type: null,
    };
  }

  const recent =
    candles.slice(-12);

  const last =
    recent[recent.length - 1];

  const previous =
    recent.slice(0, -2);

  const recentSwingHigh = Math.max(
    ...previous.map((c) => c.high),
  );

  const recentSwingLow = Math.min(
    ...previous.map((c) => c.low),
  );

  if (
    desiredDirection === "BUY" &&
    last.close > recentSwingHigh
  ) {
    return {
      direction: "BUY",
      type: "BOS_UP",
      bosPrice: recentSwingHigh,
    };
  }

  if (
    desiredDirection === "SELL" &&
    last.close < recentSwingLow
  ) {
    return {
      direction: "SELL",
      type: "BOS_DOWN",
      bosPrice: recentSwingLow,
    };
  }

  const short = recent.slice(-5);

  if (desiredDirection === "BUY") {
    const shortHigh = Math.max(
      ...short
        .slice(0, -1)
        .map((c) => c.high),
    );

    if (last.close > shortHigh) {
      return {
        direction: "BUY",
        type: "CHOCH_UP",
        chochPrice: shortHigh,
      };
    }
  }

  if (desiredDirection === "SELL") {
    const shortLow = Math.min(
      ...short
        .slice(0, -1)
        .map((c) => c.low),
    );

    if (last.close < shortLow) {
      return {
        direction: "SELL",
        type: "CHOCH_DOWN",
        chochPrice: shortLow,
      };
    }
  }

  return {
    direction: "WAIT",
    type: null,
  };
}

// ======================================================
// NY OPENING RANGE
// ======================================================

function detectORB(
  candles: ScannerCandle[],
  levels: SessionLevels,
  vwap?: number,
) {
  if (
    levels.nyOpenHigh === undefined ||
    levels.nyOpenLow === undefined ||
    !candles.length
  ) {
    return {
      direction: "WAIT" as ScannerDirection,
      confirmed: false,
    };
  }

  const last =
    candles[candles.length - 1];

  // Twelve Data is requested with timezone=America/New_York.
  // NY Opening Range is built from 09:30-09:45.
  // A breakout is considered fresh only from 09:45 to 11:30 NY.
  const lastMinute =
    minutesFromMidnight(last.datetime);

  const orbStart =
    9 * 60 + 45;

  const orbEnd =
    11 * 60 + 30;

  if (
    lastMinute < orbStart ||
    lastMinute > orbEnd
  ) {
    return {
      direction: "WAIT" as ScannerDirection,
      confirmed: false,
    };
  }

  if (
    last.close >
      levels.nyOpenHigh &&
    (vwap === undefined ||
      last.close > vwap)
  ) {
    return {
      direction: "BUY" as ScannerDirection,
      confirmed: true,
    };
  }

  if (
    last.close <
      levels.nyOpenLow &&
    (vwap === undefined ||
      last.close < vwap)
  ) {
    return {
      direction: "SELL" as ScannerDirection,
      confirmed: true,
    };
  }

  return {
    direction: "WAIT" as ScannerDirection,
    confirmed: false,
  };
}

// ======================================================
// SESSION LEVELS
//
// Times below assume Twelve Data endpoint:
// timezone=America/New_York
//
// Asian approximation:
// 18:00 previous evening -> 02:00 NY
//
// London:
// 02:00 -> 08:00 NY
//
// NY Opening Range:
// 09:30 -> 09:45 NY
// ======================================================

function calculateSessionLevels(
  m1Candles: ScannerCandle[],
  m5Candles: ScannerCandle[] = [],
): SessionLevels {
  const source =
    m1Candles.length > 0
      ? m1Candles
      : m5Candles;

  if (!source.length) {
    return {};
  }

  const currentDate =
    getLatestDate(source);

  const dates = Array.from(
    new Set(
      [...m5Candles, ...m1Candles]
        .map((c) => getDate(c.datetime))
        .filter(Boolean),
    ),
  ).sort();

  const currentDateIndex =
    dates.indexOf(currentDate);

  const previousDate =
    currentDateIndex > 0
      ? dates[currentDateIndex - 1]
      : undefined;

  function rangeForDate(
    date: string,
    startMinute: number,
    endMinute: number,
  ) {
    // Prefer M1 when that session exists in M1.
    const m1Day =
      candlesForDate(
        m1Candles,
        date,
      );

    const m1Range =
      candlesBetween(
        m1Day,
        startMinute,
        endMinute,
      );

    if (m1Range.length > 0) {
      return m1Range;
    }

    // Twelve Data Basic can return only a limited M1 history window.
    // M5 usually reaches further back, so use it for session H/L fallback.
    const m5Day =
      candlesForDate(
        m5Candles,
        date,
      );

    return candlesBetween(
      m5Day,
      startMinute,
      endMinute,
    );
  }

  // London: 02:00 -> 08:00 New York time
  const london =
    rangeForDate(
      currentDate,
      2 * 60,
      8 * 60,
    );

  // NY Opening Range: 09:30 -> 09:45 New York time
  const nyOpeningRange =
    rangeForDate(
      currentDate,
      9 * 60 + 30,
      9 * 60 + 45,
    );

  const londonHL =
    getHighLow(london);

  const nyHL =
    getHighLow(nyOpeningRange);

  // Asia: 18:00 previous day -> 02:00 current day
  const asiaCurrent =
    rangeForDate(
      currentDate,
      0,
      2 * 60,
    );

  let asiaPrevious:
    ScannerCandle[] = [];

  if (previousDate) {
    asiaPrevious =
      rangeForDate(
        previousDate,
        18 * 60,
        24 * 60,
      );
  }

  const asia = [
    ...asiaPrevious,
    ...asiaCurrent,
  ];

  const asiaHL =
    getHighLow(asia);

  return {
    asianHigh: asiaHL.high,
    asianLow: asiaHL.low,

    londonHigh: londonHL.high,
    londonLow: londonHL.low,

    nyOpenHigh: nyHL.high,
    nyOpenLow: nyHL.low,
  };
}

// ======================================================
// TRADE PLAN
// ======================================================

function calculateTradePlan(
  symbol: ScannerSymbol,
  direction: ScannerDirection,
  candles: ScannerCandle[],
  atr: number,
  sweepLevel?: number,
) {
  const last =
    candles[candles.length - 1];

  if (
    !last ||
    direction === "WAIT"
  ) {
    return {
      entry: 0,
      sl: 0,
      tp1: 0,
      tp2: 0,
      rr: 0,
    };
  }

  const entry = last.close;

  const minimumStop =
    symbol === "US30"
      ? Math.max(atr * 0.55, 15)
      : Math.max(atr * 0.55, 0.5);

  let sl: number;

  if (direction === "BUY") {
    const candidate =
      sweepLevel !== undefined
        ? Math.min(
            sweepLevel,
            last.low,
          )
        : last.low;

    sl =
      candidate -
      minimumStop * 0.15;

    if (sl >= entry) {
      sl =
        entry - minimumStop;
    }
  } else {
    const candidate =
      sweepLevel !== undefined
        ? Math.max(
            sweepLevel,
            last.high,
          )
        : last.high;

    sl =
      candidate +
      minimumStop * 0.15;

    if (sl <= entry) {
      sl =
        entry + minimumStop;
    }
  }

  const risk =
    Math.abs(entry - sl);

  if (!risk) {
    return {
      entry: roundPrice(
        entry,
        symbol,
      ),
      sl: 0,
      tp1: 0,
      tp2: 0,
      rr: 0,
    };
  }

  const tp1 =
    direction === "BUY"
      ? entry + risk
      : entry - risk;

  const tp2 =
    direction === "BUY"
      ? entry + risk * 2
      : entry - risk * 2;

  return {
    entry: roundPrice(
      entry,
      symbol,
    ),

    sl: roundPrice(
      sl,
      symbol,
    ),

    tp1: roundPrice(
      tp1,
      symbol,
    ),

    tp2: roundPrice(
      tp2,
      symbol,
    ),

    rr: 2,
  };
}

// ======================================================
// MAIN SCANNER
// ======================================================

export function scanGoldUs30({
  symbol,
  m1Candles,
  m5Candles,
}: {
  symbol: ScannerSymbol;

  m1Candles: ScannerCandle[];

  m5Candles: ScannerCandle[];
}): ScannerResult {
  const cleanM1 =
    m1Candles
      .filter(
        (c) =>
          Number.isFinite(c.open) &&
          Number.isFinite(c.high) &&
          Number.isFinite(c.low) &&
          Number.isFinite(c.close),
      )
      .map((c) => ({
        ...c,

        open: safeNumber(c.open),
        high: safeNumber(c.high),
        low: safeNumber(c.low),
        close: safeNumber(c.close),
      }));

  const cleanM5 =
    m5Candles
      .filter(
        (c) =>
          Number.isFinite(c.open) &&
          Number.isFinite(c.high) &&
          Number.isFinite(c.low) &&
          Number.isFinite(c.close),
      )
      .map((c) => ({
        ...c,

        open: safeNumber(c.open),
        high: safeNumber(c.high),
        low: safeNumber(c.low),
        close: safeNumber(c.close),
      }));

  if (
    cleanM1.length < 30 ||
    cleanM5.length < 12
  ){
return {
      symbol,

      direction: "WAIT",

      status: "WAIT",

      score: 0,

      setup: "No Setup",

      biasM5: "NEUTRAL",

      priceAction:
        "Not enough candle data",

      liquidityConfirmed: false,
      structureConfirmed: false,
      vwapConfirmed: false,
      momentumConfirmed: false,

      sweepType: null,

      structureType: null,

      entry: 0,
      sl: 0,
      tp1: 0,
      tp2: 0,

      rr: 0,

      reasons: [
        "Not enough M1 or M5 candles",
      ],
    };
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[PRO Scanner]", {
      symbol,
      m1Count: cleanM1.length,
      m5Count: cleanM5.length,
      firstM1: cleanM1[0]?.datetime,
      lastM1: cleanM1[cleanM1.length - 1]?.datetime,
      firstM5: cleanM5[0]?.datetime,
      lastM5: cleanM5[cleanM5.length - 1]?.datetime,
    });
  }

  const latestDate =
    getLatestDate(cleanM1);

  const today =
    candlesForDate(
      cleanM1,
      latestDate,
    );

  const levels =
    calculateSessionLevels(
      cleanM1,
      cleanM5,
    );

  // VWAP from NY midnight/current trading day.
  const vwap =
    calculateVWAP(today);

  const biasM5 =
    getM5Bias(cleanM5);

  const momentum =
    detectMomentum(cleanM1);

  const sweep =
    detectSweep(
      cleanM1,
      levels,
    );

  const orb =
    detectORB(
      cleanM1,
      levels,
      vwap,
    );

  // Prefer sweep direction.
  // If no sweep, OR breakout can become direction.
  let candidateDirection:
    ScannerDirection =
      sweep.direction !== "WAIT"
        ? sweep.direction
        : orb.direction;

  let setup: ScannerResult["setup"] =
    sweep.direction !== "WAIT"
      ? "Liquidity Reversal"
      : orb.confirmed
        ? "NY OR Breakout"
        : "No Setup";

  const structure =
    detectStructure(
      cleanM1,
      candidateDirection,
    );

  const last =
    cleanM1[cleanM1.length - 1];

  let score = 0;

  const reasons: string[] = [];

  // ====================================================
  // LIQUIDITY / OR — 40 points
  // ====================================================

  let liquidityConfirmed = false;

  if (sweep.direction !== "WAIT") {
    liquidityConfirmed = true;

    score += 40;

    reasons.push(
      `Liquidity sweep: ${sweep.type}`,
    );
  } else if (orb.confirmed) {
    liquidityConfirmed = true;

    score += 35;

    reasons.push(
      "NY Opening Range breakout",
    );
  } else {
    reasons.push(
      "No confirmed liquidity sweep",
    );
  }

  // ====================================================
  // STRUCTURE — 35 points
  // ====================================================

  const structureConfirmed =
    structure.direction !== "WAIT" &&
    structure.direction ===
      candidateDirection;

  if (structureConfirmed) {
    score += 35;

    reasons.push(
      `Structure confirmed: ${structure.type}`,
    );
  } else {
    reasons.push(
      "Waiting for M1 BOS/CHOCH",
    );
  }

  // ====================================================
  // VWAP + MOMENTUM — 25 points
  // ====================================================

  let vwapConfirmed = false;

  if (
    vwap !== undefined &&
    candidateDirection === "BUY" &&
    last.close > vwap
  ) {
    vwapConfirmed = true;
  }

  if (
    vwap !== undefined &&
    candidateDirection === "SELL" &&
    last.close < vwap
  ) {
    vwapConfirmed = true;
  }

  const momentumConfirmed =
    candidateDirection === "BUY"
      ? momentum.bullish
      : candidateDirection === "SELL"
        ? momentum.bearish
        : false;

  if (vwapConfirmed) {
    score += 12;

    reasons.push(
      "VWAP confirmed",
    );
  }

  if (momentumConfirmed) {
    score += 13;

    reasons.push(
      "Momentum confirmed",
    );
  }

  // ====================================================
  // M5 BIAS FILTER
  // Not a separate required confirmation.
  // It slightly adjusts quality.
  // ====================================================

  const biasAgrees =
    (candidateDirection === "BUY" &&
      biasM5 === "BULLISH") ||
    (candidateDirection === "SELL" &&
      biasM5 === "BEARISH");

  const biasOpposes =
    (candidateDirection === "BUY" &&
      biasM5 === "BEARISH") ||
    (candidateDirection === "SELL" &&
      biasM5 === "BULLISH");

  if (biasAgrees) {
    reasons.push(
      `M5 bias agrees: ${biasM5}`,
    );
  }

  if (biasOpposes) {
    score = Math.max(
      0,
      score - 15,
    );

    reasons.push(
      `M5 bias conflicts: ${biasM5}`,
    );
  }

  score = Math.min(
    100,
    Math.max(0, score),
  );

  // ====================================================
  // FINAL DIRECTION
  // ====================================================

  let direction:
    ScannerDirection =
      candidateDirection;

  // A tradable direction requires the two core confirmations:
  // liquidity/OR + M1 structure. Score alone cannot create a signal.
const coreConfirmed =
  liquidityConfirmed &&
  structureConfirmed;

  if (!coreConfirmed) {
    direction = "WAIT";
  }

  // ====================================================
  // STATUS
  // ====================================================

  let status:
    ScannerStatus = "WAIT";

  if (
    coreConfirmed &&
    vwapConfirmed &&
    momentumConfirmed &&
    score >= 90
  ) {
    status = "A+ SETUP";
  } else if (
    coreConfirmed &&
    (vwapConfirmed || momentumConfirmed) &&
    score >= 80
  ) {
    status = "READY";
  } else if (
  liquidityConfirmed
) {
  status = "FORMING";
}

  if (
    status === "FORMING" &&
    setup === "No Setup"
  ) {
    setup = "Setup Forming";
  }

  // ====================================================
  // TRADE PLAN
  // ====================================================

  const atr =
    calculateATR(
      cleanM1,
      14,
    );

  const tradePlan =
    calculateTradePlan(
      symbol,
      direction,
      cleanM1,
      atr,
      sweep.level,
    );

  // ====================================================
  // PRICE ACTION LABEL
  // ====================================================

  let priceAction =
    "WAIT";

  if (
    direction === "BUY" &&
    sweep.direction === "BUY"
  ) {
    priceAction =
      structureConfirmed
        ? "Liquidity Sweep + BOS BUY"
        : "Liquidity Sweep BUY";
  }

  if (
    direction === "SELL" &&
    sweep.direction === "SELL"
  ) {
    priceAction =
      structureConfirmed
        ? "Liquidity Sweep + BOS SELL"
        : "Liquidity Sweep SELL";
  }

  if (
    direction === "BUY" &&
    orb.confirmed &&
    sweep.direction === "WAIT"
  ) {
    priceAction =
      "NY OR Breakout BUY";
  }

  if (
    direction === "SELL" &&
    orb.confirmed &&
    sweep.direction === "WAIT"
  ) {
    priceAction =
      "NY OR Breakout SELL";
  }

  return {
    symbol,

    direction,

    status,

    score,

    setup,

    biasM5,

    priceAction,

    liquidityConfirmed,

    structureConfirmed,

    vwapConfirmed,

    momentumConfirmed,

    sweepType: sweep.type,

    structureType:
      structure.type,

    entry: tradePlan.entry,

    sl: tradePlan.sl,

    tp1: tradePlan.tp1,

    tp2: tradePlan.tp2,

    rr: tradePlan.rr,

    vwap:
      vwap !== undefined
        ? roundPrice(vwap, symbol)
        : undefined,

    bosPrice:
      structure.bosPrice !== undefined
        ? roundPrice(
            structure.bosPrice,
            symbol,
          )
        : undefined,

    chochPrice:
      structure.chochPrice !==
      undefined
        ? roundPrice(
            structure.chochPrice,
            symbol,
          )
        : undefined,

    asianHigh:
      levels.asianHigh !== undefined
        ? roundPrice(
            levels.asianHigh,
            symbol,
          )
        : undefined,

    asianLow:
      levels.asianLow !== undefined
        ? roundPrice(
            levels.asianLow,
            symbol,
          )
        : undefined,

    londonHigh:
      levels.londonHigh !== undefined
        ? roundPrice(
            levels.londonHigh,
            symbol,
          )
        : undefined,

    londonLow:
      levels.londonLow !== undefined
        ? roundPrice(
            levels.londonLow,
            symbol,
          )
        : undefined,

    nyOpenHigh:
      levels.nyOpenHigh !== undefined
        ? roundPrice(
            levels.nyOpenHigh,
            symbol,
          )
        : undefined,

    nyOpenLow:
      levels.nyOpenLow !== undefined
        ? roundPrice(
            levels.nyOpenLow,
            symbol,
          )
        : undefined,

    lastPrice:
      roundPrice(
        last.close,
        symbol,
      ),

    reasons,
  };
}