// lib/oandaResolver.ts
import type { OandaEnvPicked } from "./oandaClient";

export type OandaInstrument = {
  name: string;        // np. XAU_USD
  displayName?: string; // np. Gold
  type?: string;
};

type Cache = {
  ts: number;
  env: OandaEnvPicked;
  list: OandaInstrument[];
};

declare global {
  // eslint-disable-next-line no-var
  var __OANDA_INSTR_CACHE__: Cache | undefined;
}

const TTL_MS = 60_000; // 1 min na instrumenty (szybko i bez spiny)

export function normalizeSymbol(sym: string) {
  return (sym ?? "").trim().toUpperCase().replaceAll("-", "_").replaceAll("/", "_");
}

function candidatesFor(symN: string): string[] {
  // najczęstsze aliasy / wpisy użytkownika:
  // XAUUSD, XAGUSD, US30, NAS100, SPX500 itd.
  if (symN === "XAUUSD" || symN === "XAU_USD") return ["XAU_USD"];
  if (symN === "XAGUSD" || symN === "XAG_USD") return ["XAG_USD"];

  if (symN === "US30" || symN === "US30_USD" || symN.includes("WALLST")) {
    // OANDA ma różne nazwy zależnie od regionu/konta.
    // Dlatego szukamy po displayName też.
    return ["US30_USD", "US30", "WALL_ST_30", "WALLST30", "US_WALL_ST_30"];
  }

  // Forex wpisany jako EURUSD -> EUR_USD
  if (/^[A-Z]{6}$/.test(symN)) return [`${symN.slice(0, 3)}_${symN.slice(3)}`];

  // jeśli już jest z _:
  return [symN];
}

export function resolveOandaInstrument(
  userSymbol: string,
  instruments: OandaInstrument[]
): { instrument: string | null; reason?: string } {
  const symN = normalizeSymbol(userSymbol);
  const cands = candidatesFor(symN);

  // 1) exact match by name
  for (const c of cands) {
    const exact = instruments.find((x) => x.name?.toUpperCase() === c);
    if (exact) return { instrument: exact.name };
  }

  // 2) try contains match (US30 variants)
  for (const c of cands) {
    const needle = c.replaceAll("_", "");
    const hit = instruments.find((x) => (x.name ?? "").toUpperCase().replaceAll("_", "").includes(needle));
    if (hit) return { instrument: hit.name };
  }

  // 3) try displayName fuzzy (Wall St 30)
  if (symN.includes("US30") || symN.includes("WALL")) {
    const hit = instruments.find((x) => (x.displayName ?? "").toUpperCase().includes("WALL") && (x.displayName ?? "").includes("30"));
    if (hit) return { instrument: hit.name };
  }

  return { instrument: null, reason: `Cannot resolve '${userSymbol}' in OANDA instruments list.` };
}

// prosta cache na instrumenty
export function getCachedInstruments(env: OandaEnvPicked) {
  const c = globalThis.__OANDA_INSTR_CACHE__;
  if (!c) return null;
  if (c.env !== env) return null;
  if (Date.now() - c.ts > TTL_MS) return null;
  return c.list;
}

export function setCachedInstruments(env: OandaEnvPicked, list: OandaInstrument[]) {
  globalThis.__OANDA_INSTR_CACHE__ = { env, list, ts: Date.now() };
}