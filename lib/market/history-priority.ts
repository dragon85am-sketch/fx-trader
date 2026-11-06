/** V4: Fair priority scheduling for immutable, WAL-checkpointed SQL chunks.
 * Only reorder disjoint candle keys: an older chunk touching the same candle
 * must commit before a newer chunk. Preserve IDs for ledger idempotency.
 */
export type QueueCandle = { symbol: string; interval: string; bucket: number };
export type QueueItem = { id: string; batch: QueueCandle };
export type QueueChunk = QueueItem[];

export function chooseNextChunk(chunks: readonly QueueChunk[], now: number, recentWindowMs: number, historyWritesSinceLive: number, historyQuota: number): number {
  if (chunks.length <= 1 || historyWritesSinceLive < historyQuota) return 0;
  const olderKeys = new Set<string>();
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const recent = chunk.some(row => row.batch.bucket >= now - recentWindowMs);
    const disjoint = chunk.every(row => !olderKeys.has(`${row.batch.symbol}|${row.batch.interval}|${row.batch.bucket}`));
    if (i > 0 && recent && disjoint) return i;
    for (const row of chunk) olderKeys.add(`${row.batch.symbol}|${row.batch.interval}|${row.batch.bucket}`);
  }
  return 0;
}
