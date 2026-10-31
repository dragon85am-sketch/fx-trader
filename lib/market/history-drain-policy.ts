/**
 * V4 stage 3: pure, deterministic history-drain policy.
 * No filesystem/DB mutations. Never drops or reorders durable retry chunks.
 * Used to bound work per pass and protect live ingestion under SQL overload.
 */
export type HistoryDrainInput = {
  queuedRows: number;
  sqlFailures: number;
  lastSqlMs: number | null;
  liveTickLagMs: number | null;
  shuttingDown: boolean;
};
export type HistoryDrainDecision = {
  maxChunksPerPass: number;
  delayMs: number;
  reason: "shutdown" | "db-backoff" | "live-priority" | "normal";
};
export function historyDrainPolicy(input: HistoryDrainInput): HistoryDrainDecision {
  const failures = Math.max(0, Math.floor(input.sqlFailures || 0));
  if (input.shuttingDown) return { maxChunksPerPass: 1, delayMs: 0, reason: "shutdown" };
  if (failures > 0) return {
    maxChunksPerPass: 1,
    delayMs: Math.min(60_000, 1500 * 2 ** Math.min(5, failures)),
    reason: "db-backoff",
  };
  if ((input.liveTickLagMs ?? 0) > 2000 || (input.lastSqlMs ?? 0) > 5000)
    return { maxChunksPerPass: 1, delayMs: 1500, reason: "live-priority" };
  return { maxChunksPerPass: input.queuedRows > 1000 ? 4 : 2, delayMs: 1000, reason: "normal" };
}
