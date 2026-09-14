"use client";

import { useCallback, useEffect, useState } from "react";
import { getLiveRate, type LiveRate } from "@/lib/market/live-rates";

const SYMBOLS = ["US30", "XAUUSD", "EURUSD", "GBPUSD", "USDJPY"] as const;

function fmt(v: number | null, symbol: string) {
  if (v === null || !Number.isFinite(v)) return "–";
  if (symbol === "US30") return v.toFixed(2);
  if (symbol === "XAUUSD") return v.toFixed(2);
  if (symbol.includes("JPY")) return v.toFixed(3);
  return v.toFixed(5);
}

export default function LiveRatesFeedTest() {
  const [quotes, setQuotes] = useState<Record<string, LiveRate>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const items = await Promise.all(SYMBOLS.map((s) => getLiveRate(s)));
      setQuotes(Object.fromEntries(items.map((x) => [x.symbol, x])));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd Live-Rates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, 5000);
    return () => window.clearInterval(id);
  }, [refresh]);

  return (
    <div className="min-h-screen bg-[#07111f] p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-400">FX TRADE</p>
            <h1 className="mt-2 text-3xl font-black">Live-Rates Feed Test</h1>
            <p className="mt-1 text-sm text-slate-400">US30 + GOLD + Forex • REST test • odświeżanie co 5 s</p>
          </div>
          <button onClick={refresh} className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-300 hover:bg-cyan-500/20">
            {loading ? "Pobieranie..." : "Odśwież"}
          </button>
        </div>

        {error ? <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {SYMBOLS.map((symbol) => {
            const q = quotes[symbol];
            return (
              <div key={symbol} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-black">{symbol}</div>
                    <div className="text-xs text-slate-500">{q?.currency || "Live-Rates"}</div>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black text-emerald-400">LIVE</span>
                </div>
                <div className="mt-5 text-3xl font-black tracking-tight">{fmt(q?.rate ?? null, symbol)}</div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-black/20 p-3"><div className="text-xs text-slate-500">BID</div><div className="mt-1 font-bold">{fmt(q?.bid ?? null, symbol)}</div></div>
                  <div className="rounded-xl bg-black/20 p-3"><div className="text-xs text-slate-500">ASK</div><div className="mt-1 font-bold">{fmt(q?.ask ?? null, symbol)}</div></div>
                  <div className="rounded-xl bg-black/20 p-3"><div className="text-xs text-slate-500">HIGH</div><div className="mt-1 font-bold">{fmt(q?.high ?? null, symbol)}</div></div>
                  <div className="rounded-xl bg-black/20 p-3"><div className="text-xs text-slate-500">LOW</div><div className="mt-1 font-bold">{fmt(q?.low ?? null, symbol)}</div></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
