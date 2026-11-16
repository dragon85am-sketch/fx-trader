
import assert from "node:assert/strict";
import {
  chooseNextChunk,
  type QueueChunk,
} from "../lib/market/history-priority";

const NOW = Date.UTC(2026, 10, 14, 0, 0);
const MIN = 60_000;

const row = (
  id: string,
  symbol: string,
  ageMin: number
): QueueChunk[number] => ({
  id,
  batch: {
    symbol,
    interval: "1min",
    bucket: NOW - ageMin * MIN,
  },
});

const check = (
  name: string,
  chunks: QueueChunk[],
  quotaCounter: number,
  quota: number,
  expected: number
): void => {
  const before = JSON.stringify(chunks);

  const actual = chooseNextChunk(
    chunks,
    NOW,
    60 * MIN,
    quotaCounter,
    quota
  );

  assert.equal(
    actual,
    expected,
    `${name}: expected index ${expected}, got ${actual}`
  );

  assert.equal(
    JSON.stringify(chunks),
    before,
    `${name}: function mutated WAL queue`
  );

  console.log(`PASS: ${name}`);
};

// TEST 1: FIFO before history quota
check(
  "FIFO while history quota not reached",
  [
    [row("old", "EURUSD", 120)],
    [row("live", "BTCUSD", 1)],
  ],
  2,
  3,
  0
);

// TEST 2: LIVE priority after quota
check(
  "Live chunk selected after quota",
  [
    [row("old", "EURUSD", 120)],
    [row("live", "BTCUSD", 1)],
  ],
  3,
  3,
  1
);

// TEST 3: Same candle cannot overtake
check(
  "Same candle key cannot overtake older chunk",
  [
    [row("old", "BTCUSD", 1)],
    [row("new", "BTCUSD", 1)],
  ],
  3,
  3,
  0
);

// TEST 4: Independent LIVE candle
check(
  "Independent live key may bypass older key",
  [
    [row("old", "BTCUSD", 1)],
    [row("new", "ETHUSD", 1)],
  ],
  3,
  3,
  1
);

// TEST 5: Mixed chunk collision protection
check(
  "Mixed chunk cannot overtake conflicting candle",
  [
    [row("old", "BTCUSD", 1)],
    [
      row("new", "ETHUSD", 1),
      row("same", "BTCUSD", 1),
    ],
  ],
  3,
  3,
  0
);

// TEST 6: No recent candles = FIFO
check(
  "No recent chunks keeps FIFO",
  [
    [row("old", "EURUSD", 120)],
    [row("old2", "BTCUSD", 90)],
  ],
  3,
  3,
  0
);

// TEST 7: Empty queue
check(
  "Empty queue returns index 0",
  [],
  3,
  3,
  0
);

console.log(
  "\n7 tests passed. Scheduler verified."
);

console.log(
  "Note: WAL replay, pending admission and DB writes are not tested."
);
