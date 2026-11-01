// FX TRADE: isolated SQLite worker transport. This module does NOT modify legacy SQL/WAL.
import { Worker } from 'node:worker_threads';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export class HistoryBridge {
  constructor({ filename, maxPendingTicks = 20000 } = {}) {
    if (!filename || !path.isAbsolute(filename)) throw new Error('Absolute SQLite filename required');
    this.filename = filename;
    this.maxPendingTicks = maxPendingTicks;
    this.nextId = 0;
    this.inflight = new Map();
    this.pendingTicks = 0;
    this.failed = null;
    this.worker = new Worker(path.join(HERE, 'history-worker.mjs'), { workerData: { filename } });
    this.ready = new Promise((resolve, reject) => { this.readyResolve = resolve; this.readyReject = reject; });
    this.worker.on('message', (message) => {
      if (message.type === 'ready') { this.readyResolve(); return; }
      const pending = this.inflight.get(message.id);
      if (!pending) return;
      this.inflight.delete(message.id);
      this.pendingTicks -= pending.count;
      if (message.type === 'error') pending.reject(new Error(message.error));
      else pending.resolve(message);
    });
    const fail = (error) => {
      if (this.failed) return;
      this.failed = error instanceof Error ? error : new Error(String(error));
      this.readyReject(this.failed);
      for (const pending of this.inflight.values()) pending.reject(this.failed);
      this.inflight.clear(); this.pendingTicks = 0;
    };
    this.worker.on('error', fail);
    this.worker.on('exit', code => fail(new Error(`SQLite worker stopped (${code})`)));
  }
  async request(type, args = {}, count = 0) {
    await this.ready;
    if (this.failed) throw this.failed;
    if (this.pendingTicks + count > this.maxPendingTicks) throw new Error('SQLite history backlog limit reached; refusing silent tick loss');
    const id = ++this.nextId;
    this.pendingTicks += count;
    return new Promise((resolve, reject) => {
      this.inflight.set(id, { resolve, reject, count });
      try { this.worker.postMessage({ type, id, ...args }); }
      catch (error) { this.inflight.delete(id); this.pendingTicks -= count; reject(error); }
    });
  }
  ticks(ticks) {
    if (!Array.isArray(ticks) || !ticks.length || ticks.length > 1000) throw new Error('Expected 1–1000 ticks');
    return this.request('ticks', { ticks }, ticks.length);
  }
  read(symbol, interval = '1min', limit = 500, before = Date.now()) {
    return this.request('read', { symbol, interval, limit, before });
  }
  stats() { return this.request('stats'); }
  prune() { return this.request('prune'); }
  async close() {
    try { await this.request('close'); } finally { await this.worker.terminate(); }
  }
}
