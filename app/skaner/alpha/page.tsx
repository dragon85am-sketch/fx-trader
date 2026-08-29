"use client";

import Link from "next/link";
import React from "react";
import {
  Brain,
  ChevronLeft,
  Loader2,
  RefreshCw,
  Search,
  Star,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { CandlestickData, UTCTimestamp } from "lightweight-charts";
import AlphaPriceChart from "./AlphaPriceChart";

type TF = "M5" | "M15" | "H1" | "H4" | "D1";
type TrendFilter = "All" | "Uptrend" | "Downtrend";
type LiquidityFilter = "All" | "High" | "Medium";

type Setup = {
  instrument: string;
  name: string;
  tf: TF;
  trend: boolean;
  sweep: boolean;
  momentum: boolean;
  liquidityPct: number;
  priceAction: string;
  session: string;
  confidence: number;
  direction: "BUY" | "SELL";
  status: "READY" | "WATCH";
  entry: string;
  sl: string;
  tp1: string;
  tp2: string;
  rr: string;
};


type CandleCacheEntry = {
  fetchedAt: number;
  candles: CandlestickData[];
};

const CACHE_TTL_MS: Record<TF, number> = {
  M5: 5 * 60_000,
  M15: 15 * 60_000,
  H1: 60 * 60_000,
  H4: 4 * 60 * 60_000,
  D1: 12 * 60 * 60_000,
};

const AUTO_CHECK_MS = 60_000;

const SETUPS: Setup[] = [
  {
    instrument: "XAUUSD",
    name: "Gold / U.S. Dollar",
    tf: "M5",
    trend: true,
    sweep: true,
    momentum: true,
    liquidityPct: 88,
    priceAction: "Bullish Engulfing",
    session: "London",
    confidence: 94,
    direction: "BUY",
    status: "READY",
    entry: "3384.20",
    sl: "3378.50",
    tp1: "3392.50",
    tp2: "3398.80",
    rr: "1 : 2.6",
  },
  {
    instrument: "US30",
    name: "Dow Jones 30",
    tf: "M5",
    trend: true,
    sweep: true,
    momentum: true,
    liquidityPct: 82,
    priceAction: "Strong Bullish",
    session: "New York",
    confidence: 88,
    direction: "BUY",
    status: "READY",
    entry: "38720",
    sl: "38640",
    tp1: "38880",
    tp2: "39020",
    rr: "1 : 2.4",
  },
  {
    instrument: "EURUSD",
    name: "Euro / U.S. Dollar",
    tf: "M15",
    trend: true,
    sweep: false,
    momentum: true,
    liquidityPct: 58,
    priceAction: "Pin Bar Bullish",
    session: "London",
    confidence: 76,
    direction: "BUY",
    status: "WATCH",
    entry: "1.08420",
    sl: "1.08150",
    tp1: "1.08800",
    tp2: "1.09100",
    rr: "1 : 2.1",
  },
  {
    instrument: "GBPUSD",
    name: "GBP / U.S. Dollar",
    tf: "M15",
    trend: true,
    sweep: true,
    momentum: true,
    liquidityPct: 72,
    priceAction: "Inside Bar",
    session: "London",
    confidence: 72,
    direction: "BUY",
    status: "WATCH",
    entry: "1.27680",
    sl: "1.27300",
    tp1: "1.28200",
    tp2: "1.28600",
    rr: "1 : 2.3",
  },
  {
    instrument: "USDJPY",
    name: "U.S. Dollar / Yen",
    tf: "M15",
    trend: false,
    sweep: true,
    momentum: true,
    liquidityPct: 79,
    priceAction: "Bearish Engulfing",
    session: "Tokyo",
    confidence: 83,
    direction: "SELL",
    status: "READY",
    entry: "156.830",
    sl: "157.120",
    tp1: "156.300",
    tp2: "155.900",
    rr: "1 : 2.5",
  },
  {
    instrument: "BTCUSD",
    name: "Bitcoin / U.S. Dollar",
    tf: "M5",
    trend: true,
    sweep: true,
    momentum: true,
    liquidityPct: 94,
    priceAction: "Bullish Engulfing",
    session: "Crypto 24/7",
    confidence: 91,
    direction: "BUY",
    status: "READY",
    entry: "0",
    sl: "0",
    tp1: "0",
    tp2: "0",
    rr: "1 : 2.5",
  },
  {
    instrument: "ETHUSD",
    name: "Ethereum / U.S. Dollar",
    tf: "M5",
    trend: true,
    sweep: true,
    momentum: true,
    liquidityPct: 91,
    priceAction: "Strong Bullish",
    session: "Crypto 24/7",
    confidence: 89,
    direction: "BUY",
    status: "READY",
    entry: "0",
    sl: "0",
    tp1: "0",
    tp2: "0",
    rr: "1 : 2.5",
  },
  {
    instrument: "SOLUSD",
    name: "Solana / U.S. Dollar",
    tf: "M15",
    trend: true,
    sweep: true,
    momentum: true,
    liquidityPct: 86,
    priceAction: "Inside Bar",
    session: "Crypto 24/7",
    confidence: 84,
    direction: "BUY",
    status: "WATCH",
    entry: "0",
    sl: "0",
    tp1: "0",
    tp2: "0",
    rr: "1 : 2.5",
  },
];

function FilterButton({
  active,
  children,
  onClick,
  tone = "blue",
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  tone?: "blue" | "green" | "red";
}) {
  const activeStyle =
    tone === "green"
      ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-300"
      : tone === "red"
      ? "border-rose-400/35 bg-rose-500/10 text-rose-300"
      : "border-sky-400/50 bg-sky-500/15 text-sky-200";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3.5 py-2 text-[11px] font-medium transition ${
        active
          ? activeStyle
          : "border-sky-300/15 bg-sky-300/[0.055] text-white/55 hover:bg-sky-300/[0.10] hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function Pass({ value }: { value: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${
        value ? "text-emerald-300" : "text-rose-300"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${value ? "bg-emerald-400" : "bg-rose-400"}`} />
      {value ? "PASS" : "FAIL"}
    </span>
  );
}

export default function AlphaScannerPage() {
  const [tf, setTf] = React.useState<"All" | TF>("All");
  const [trend, setTrend] = React.useState<TrendFilter>("All");
  const [liquidity, setLiquidity] = React.useState<LiquidityFilter>("All");
  const [selected, setSelected] = React.useState<Setup>(SETUPS[0]);
  const [candles, setCandles] = React.useState<CandlestickData[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [scanLoading, setScanLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [fullChart, setFullChart] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const [dataSource, setDataSource] = React.useState<"API" | "CACHE" | null>(null);

  const candleCacheRef = React.useRef<Record<string, CandleCacheEntry>>({});
  const inFlightRef = React.useRef<
    Record<string, Promise<CandlestickData[]> | undefined>
  >({});

  const filtered = React.useMemo(() => {
    return SETUPS.filter((s) => {
      if (tf !== "All" && s.tf !== tf) return false;
      if (trend === "Uptrend" && !s.trend) return false;
      if (trend === "Downtrend" && s.trend) return false;
      if (liquidity === "High" && s.liquidityPct < 70) return false;
      if (
        liquidity === "Medium" &&
        (s.liquidityPct < 40 || s.liquidityPct >= 70)
      )
        return false;
      return true;
    });
  }, [tf, trend, liquidity]);

  const loadCandles = React.useCallback(
    async (
      setup: Setup,
      options?: {
        force?: boolean;
        silent?: boolean;
      }
    ) => {
      const force = options?.force ?? false;
      const silent = options?.silent ?? false;

      if (!silent) setLoading(true);
      setError("");

      const intervalMap: Record<TF, string> = {
        M5: "5min",
        M15: "15min",
        H1: "1h",
        H4: "4h",
        D1: "1day",
      };

      const symbolMap: Record<string, string> = {
        XAUUSD: "XAU/USD",
        EURUSD: "EUR/USD",
        GBPUSD: "GBP/USD",
        USDJPY: "USD/JPY",
        US30: "DJI",
        BTCUSD: "BTC/USD",
        ETHUSD: "ETH/USD",
        SOLUSD: "SOL/USD",
      };

      const cacheKey = `${setup.instrument}|${setup.tf}`;
      const ttl = CACHE_TTL_MS[setup.tf];
      const cached = candleCacheRef.current[cacheKey];

      if (!force && cached && Date.now() - cached.fetchedAt < ttl) {
        setCandles(cached.candles);
        setLastUpdated(new Date(cached.fetchedAt));
        setDataSource("CACHE");
        if (!silent) setLoading(false);
        return cached.candles;
      }

      const existingRequest = inFlightRef.current[cacheKey];

      if (existingRequest) {
        try {
          const shared = await existingRequest;
          setCandles(shared);
          setDataSource("CACHE");
          return shared;
        } finally {
          if (!silent) setLoading(false);
        }
      }

      const requestPromise = (async (): Promise<CandlestickData[]> => {
        const qs = new URLSearchParams({
          path: "/time_series",
          symbol: symbolMap[setup.instrument] ?? setup.instrument,
          interval: intervalMap[setup.tf],
          outputsize: "220",
          format: "JSON",
        });

        const response = await fetch(`/api/twelve-data?${qs.toString()}`, {
          method: "GET",
          cache: "no-store",
        });

        const raw = await response.text();
        let data: any;

        try {
          data = JSON.parse(raw);
        } catch {
          const looksLikeHtml = raw.trim().startsWith("<");
          throw new Error(
            looksLikeHtml
              ? "Endpoint /api/twelve-data zwrÃ³ciÅ‚ HTML zamiast JSON. SprawdÅº route.ts."
              : `NieprawidÅ‚owa odpowiedÅº API: ${raw.slice(0, 140)}`
          );
        }

        if (!response.ok || data?.status === "error" || data?.error) {
          throw new Error(
            data?.message || data?.error || "Nie udaÅ‚o siÄ™ pobraÄ‡ Å›wiec z Twelve Data."
          );
        }

        const values = Array.isArray(data?.values) ? data.values : [];

        const next: CandlestickData[] = values
          .map((c: any) => {
            const rawDate = String(c.datetime ?? "");
            const normalized = rawDate.includes("T") ? rawDate : rawDate.replace(" ", "T");
            const parsed = Date.parse(
              /Z$|[+-]\d\d:\d\d$/.test(normalized) ? normalized : `${normalized}Z`
            );

            return {
              time: Math.floor(parsed / 1000) as UTCTimestamp,
              open: Number(c.open),
              high: Number(c.high),
              low: Number(c.low),
              close: Number(c.close),
            };
          })
          .filter(
            (c: any) =>
              Number.isFinite(Number(c.time)) &&
              Number.isFinite(c.open) &&
              Number.isFinite(c.high) &&
              Number.isFinite(c.low) &&
              Number.isFinite(c.close)
          )
          .sort((a: any, b: any) => Number(a.time) - Number(b.time));

        if (!next.length) {
          throw new Error(
            data?.message || `Twelve Data nie zwrÃ³ciÅ‚o Å›wiec dla ${setup.instrument} ${setup.tf}.`
          );
        }

        const fetchedAt = Date.now();
        candleCacheRef.current[cacheKey] = { fetchedAt, candles: next };
        setLastUpdated(new Date(fetchedAt));
        setDataSource("API");
        return next;
      })();

      inFlightRef.current[cacheKey] = requestPromise;

      try {
        const next = await requestPromise;
        setCandles(next);
        return next;
      } catch (e) {
        if (cached?.candles?.length) {
          setCandles(cached.candles);
          setLastUpdated(new Date(cached.fetchedAt));
          setDataSource("CACHE");
          setError(
            `${e instanceof Error ? e.message : "BÅ‚Ä…d Twelve Data"} Â· pokazujÄ™ ostatnie dane z cache`
          );
          return cached.candles;
        }

        setCandles([]);
        setDataSource(null);
        setError(e instanceof Error ? e.message : "BÅ‚Ä…d pobierania Twelve Data");
        return [];
      } finally {
        delete inFlightRef.current[cacheKey];
        if (!silent) setLoading(false);
      }
    },
    []
  );


  React.useEffect(() => {
    void loadCandles(selected);
  }, [selected.instrument, selected.tf, loadCandles]);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      void loadCandles(selected, { silent: true });
    }, AUTO_CHECK_MS);

    return () => window.clearInterval(timer);
  }, [selected, loadCandles]);

  React.useEffect(() => {
    if (!fullChart) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFullChart(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [fullChart]);

  const selectSetup = (setup: Setup) => {
    setSelected(setup);
  };

  const runScan = async () => {
    if (scanLoading) return;

    setScanLoading(true);

    try {
      const target = filtered[0] ?? selected;

      if (target.instrument !== selected.instrument || target.tf !== selected.tf) {
        setSelected(target);
      }

      await loadCandles(target);
    } finally {
      setScanLoading(false);
    }
  };

  const reset = () => {
    setTf("All");
    setTrend("All");
    setLiquidity("All");
    setSelected(SETUPS[0]);
  };

  const liveLevels = React.useMemo(() => {
    const fallback = {
      entry: Number(selected.entry),
      sl: Number(selected.sl),
      tp1: Number(selected.tp1),
      tp2: Number(selected.tp2),
      rr: selected.rr,
    };

    if (!candles.length) return fallback;

    const recent = candles.slice(-20) as any[];
    const last = candles[candles.length - 1] as any;
    const close = Number(last.close);

    const avgRange =
      recent.reduce(
        (sum, c) => sum + Math.abs(Number(c.high) - Number(c.low)),
        0
      ) / Math.max(1, recent.length);

    const risk = Math.max(avgRange * 1.6, Math.abs(close) * 0.001);

    if (selected.direction === "BUY") {
      return {
        entry: close,
        sl: close - risk,
        tp1: close + risk * 1.5,
        tp2: close + risk * 2.5,
        rr: "1 : 2.5",
      };
    }

    return {
      entry: close,
      sl: close + risk,
      tp1: close - risk * 1.5,
      tp2: close - risk * 2.5,
      rr: "1 : 2.5",
    };
  }, [candles, selected]);

  const formatLevel = (value: number) => {
    if (!Number.isFinite(value)) return "â€”";
    if (selected.instrument === "EURUSD" || selected.instrument === "GBPUSD")
      return value.toFixed(5);
    if (selected.instrument === "USDJPY") return value.toFixed(3);
    if (selected.instrument === "BTCUSD" || selected.instrument === "ETHUSD")
      return value.toFixed(2);
    if (selected.instrument === "SOLUSD") return value.toFixed(3);
    return value.toFixed(2);
  };

  const ready = SETUPS.filter((x) => x.status === "READY").length;
  const buys = SETUPS.filter((x) => x.direction === "BUY").length;
  const sells = SETUPS.filter((x) => x.direction === "SELL").length;
  const avg = Math.round(
    SETUPS.reduce((sum, x) => sum + x.confidence, 0) / SETUPS.length
  );

  return (
    <main className="min-h-screen w-full bg-[#061a31] px-2 py-3 text-white md:px-3 xl:px-4">
      <div className="mx-auto w-full max-w-none space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/skaner"
              className="inline-flex items-center gap-1 text-[11px] text-sky-300"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to scanners
            </Link>
            <h1 className="mt-2 text-[34px] font-bold tracking-tight">
              Alpha Scanner
            </h1>
            <p className="text-[12px] text-white/45">
              AI market scanner with Price Action confirmations
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-[11px] font-bold text-emerald-300">
              â— SMART CACHE
            </div>

            <button
              type="button"
              onClick={runScan}
              disabled={scanLoading}
              className="inline-flex min-w-[145px] items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-[12px] font-bold shadow-lg shadow-sky-500/20 hover:bg-sky-400 disabled:opacity-60"
            >
              {scanLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {scanLoading ? "Scanning..." : "Scan Now"}
            </button>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-4">
          {[
            ["READY SETUPS", ready, "High probability", "text-sky-300", <Zap key="i1" className="h-6 w-6" />],
            ["BUY SIGNALS", buys, "Bullish setups", "text-emerald-300", <TrendingUp key="i2" className="h-6 w-6" />],
            ["SELL SIGNALS", sells, "Bearish setups", "text-rose-300", <TrendingDown key="i3" className="h-6 w-6" />],
            ["AI CONFIDENCE", `${avg}%`, "Average confidence", "text-purple-300", <Brain key="i4" className="h-6 w-6" />],
          ].map(([title, value, sub, color, icon]) => (
            <div
              key={String(title)}
              className="flex items-center justify-between rounded-[20px] border border-sky-300/15 bg-[#0d3158] p-5"
            >
              <div>
                <div className="text-[10px] text-white/40">{title}</div>
                <div className={`mt-2 text-3xl font-bold ${String(color)}`}>
                  {String(value)}
                </div>
                <div className="mt-1 text-[10px] text-white/35">{sub}</div>
              </div>
              <div className={`rounded-xl bg-black/15 p-3 ${String(color)}`}>
                {icon}
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-4 rounded-[20px] border border-sky-300/15 bg-[#0d3158] p-4 xl:grid-cols-[1fr_1fr_1.15fr_auto]">
          <div>
            <div className="mb-2 text-[9px] uppercase text-white/35">
              Timeframe
            </div>
            <div className="flex flex-wrap gap-2">
              {(["All", "M5", "M15", "H1", "H4", "D1"] as const).map((x) => (
                <FilterButton
                  key={x}
                  active={tf === x}
                  onClick={() => setTf(x)}
                >
                  {x}
                </FilterButton>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-[9px] uppercase text-white/35">
              Trend Filter
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterButton
                active={trend === "All"}
                onClick={() => setTrend("All")}
              >
                All
              </FilterButton>
              <FilterButton
                tone="green"
                active={trend === "Uptrend"}
                onClick={() => setTrend("Uptrend")}
              >
                Uptrend
              </FilterButton>
              <FilterButton
                tone="red"
                active={trend === "Downtrend"}
                onClick={() => setTrend("Downtrend")}
              >
                Downtrend
              </FilterButton>
            </div>
          </div>

          <div>
            <div className="mb-2 text-[9px] uppercase text-white/35">
              Liquidity Filter
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterButton
                active={liquidity === "All"}
                onClick={() => setLiquidity("All")}
              >
                All
              </FilterButton>
              <FilterButton
                active={liquidity === "High"}
                onClick={() => setLiquidity("High")}
              >
                High (70%+)
              </FilterButton>
              <FilterButton
                active={liquidity === "Medium"}
                onClick={() => setLiquidity("Medium")}
              >
                Medium (40â€“70%)
              </FilterButton>
            </div>
          </div>

          <div className="flex items-end justify-end">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-xl border border-sky-300/15 bg-sky-300/[0.06] px-4 py-2.5 text-[11px] text-white/70 hover:bg-sky-300/[0.12]"
            >
              <RefreshCw className="h-4 w-4" />
              Reset Filters
            </button>
          </div>
        </section>

        {/* Cleaner layout: no internal Signal panel. Chart gets all available center space. */}
        <section className="grid w-full gap-3 xl:grid-cols-[390px_minmax(0,1fr)_285px]">
          <aside className="overflow-hidden rounded-[20px] border border-sky-300/15 bg-[#0d3158]">
            <div className="border-b border-sky-300/15 px-4 py-3 text-[11px] font-bold">
              SETUPS ({filtered.length})
            </div>

            <div className="grid grid-cols-[minmax(145px,1fr)_48px_52px_48px_64px] border-b border-sky-300/15 bg-sky-300/[0.035] px-3 py-2.5 text-[8px] uppercase text-white/30">
              <div>Instrument</div>
              <div>TF</div>
              <div>AI</div>
              <div>Dir.</div>
              <div>Status</div>
            </div>

            {filtered.map((s) => {
              const active =
                selected.instrument === s.instrument && selected.tf === s.tf;

              return (
                <button
                  key={`${s.instrument}-${s.tf}`}
                  onClick={() => selectSetup(s)}
                  className={`grid w-full grid-cols-[minmax(145px,1fr)_48px_52px_48px_64px] items-center border-b border-white/[0.07] px-3 py-3.5 text-left transition ${
                    active
                      ? "bg-sky-400/15 ring-1 ring-inset ring-sky-400/60"
                      : "hover:bg-sky-300/[0.07]"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Star
                      className={`h-3.5 w-3.5 shrink-0 ${
                        active ? "fill-amber-300 text-amber-300" : "text-white/25"
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="text-[12px] font-bold leading-tight">
                        {s.instrument}
                      </div>
                      <div className="mt-0.5 text-[8px] leading-tight text-white/40">
                        {s.name}
                      </div>
                    </div>
                  </div>

                  <div className="text-[9px] font-semibold">{s.tf}</div>
                  <div
                    className={`text-[9px] font-bold ${
                      s.confidence >= 80
                        ? "text-emerald-300"
                        : "text-amber-300"
                    }`}
                  >
                    {s.confidence}%
                  </div>
                  <div
                    className={`text-[8px] font-bold ${
                      s.direction === "BUY"
                        ? "text-emerald-300"
                        : "text-rose-300"
                    }`}
                  >
                    {s.direction}
                  </div>
                  <div>
                    <span
                      className={`rounded px-1.5 py-1 text-[7px] font-bold ${
                        s.status === "READY"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-amber-500/15 text-amber-300"
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                </button>
              );
            })}
          </aside>

          <div className="min-w-0">
            <AlphaPriceChart
              key={`${selected.instrument}-${selected.tf}`}
              symbol={selected.instrument}
              tf={selected.tf}
              candles={candles}
              loading={loading}
              priceAction={selected.priceAction}
              direction={selected.direction}
              entry={liveLevels.entry}
              sl={liveLevels.sl}
              tp1={liveLevels.tp1}
              tp2={liveLevels.tp2}
              height={840}
            />

            {error ? (
              <div className="mt-2 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-[10px] text-rose-200">
                Twelve Data: {error}
              </div>
            ) : null}

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1 text-[9px] text-white/35">
              <span>
                Dane: {dataSource === "CACHE" ? "cache" : dataSource === "API" ? "Twelve Data API" : "â€”"}
              </span>
              <span>
                {lastUpdated
                  ? `Aktualizacja: ${lastUpdated.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
                  : "Brak aktualizacji"}
              </span>
            </div>
          </div>

          <aside className="rounded-[20px] border border-sky-300/15 bg-[#0d3158] p-4">
            <div className="text-[24px] font-bold">{selected.instrument}</div>
            <div className="text-[10px] text-white/40">{selected.name}</div>

            <div className="mt-4">
              <span
                className={`rounded-lg px-3 py-1.5 text-[9px] font-bold ${
                  selected.direction === "BUY"
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-rose-500/15 text-rose-300"
                }`}
              >
                {selected.direction} SETUP
              </span>
            </div>

            <div className="mt-5 space-y-3 border-t border-sky-300/15 pt-4">
              <div className="flex justify-between gap-2">
                <span className="text-[10px]">Trend Filter</span>
                <Pass value={selected.trend} />
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[10px]">Liquidity Sweep</span>
                <Pass value={selected.sweep} />
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[10px]">Momentum Candle</span>
                <Pass value={selected.momentum} />
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-[10px]">Price Action</span>
                <span className="max-w-[120px] text-right text-[9px] font-semibold">
                  {selected.priceAction}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-[10px]">Session Filter</span>
                <span className="text-[9px]">{selected.session}</span>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-[#082746] p-5 text-center">
              <div className="text-[10px] text-white/40">AI Confidence</div>
              <div className="mt-2 text-5xl font-bold text-emerald-300">
                {selected.confidence}%
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {[
                ["Entry", formatLevel(liveLevels.entry), "text-sky-300"],
                ["Stop Loss", formatLevel(liveLevels.sl), "text-rose-300"],
                ["Take Profit 1", formatLevel(liveLevels.tp1), "text-emerald-300"],
                ["Take Profit 2", formatLevel(liveLevels.tp2), "text-emerald-300"],
                ["Risk / Reward", liveLevels.rr, "text-white"],
              ].map(([label, value, cls]) => (
                <div
                  key={label}
                  className="flex items-center justify-between text-[10px]"
                >
                  <span className="text-white/40">{label}</span>
                  <span className={`font-semibold ${cls}`}>{value}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setFullChart(true)}
              className="mt-5 w-full rounded-xl bg-sky-500 py-3 text-[11px] font-bold transition hover:bg-sky-400"
            >
              View Full Chart
            </button>
          </aside>
        </section>

        {fullChart ? (
          <div
            className="fixed inset-0 z-[100] bg-[#061a33]/98 p-3 md:p-5"
            role="dialog"
            aria-modal="true"
            aria-label="Full screen chart"
          >
            <div className="flex h-full flex-col overflow-hidden rounded-[22px] border border-sky-500/25 bg-[#071f39] shadow-2xl shadow-black/50">
              <div className="flex items-center justify-between border-b border-sky-300/15 px-4 py-3">
                <div>
                  <div className="text-[16px] font-bold text-white">
                    {selected.instrument} Â· {selected.tf}
                  </div>
                  <div className="mt-1 text-[9px] text-white/40">
                    Full Chart Â· Twelve Data Â· {selected.priceAction}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="hidden text-[9px] text-white/35 sm:inline">
                    ESC â€” zamknij
                  </span>
                  <button
                    type="button"
                    onClick={() => setFullChart(false)}
                    className="rounded-xl border border-sky-300/15 bg-sky-300/[0.06] px-4 py-2 text-[11px] font-semibold text-white/80 transition hover:bg-sky-300/[0.12]"
                  >
                    Zamknij âœ•
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 p-2">
                <AlphaPriceChart
                  key={`fullscreen-${selected.instrument}-${selected.tf}`}
                  symbol={selected.instrument}
                  tf={selected.tf}
                  candles={candles}
                  loading={loading}
                  priceAction={selected.priceAction}
                  direction={selected.direction}
                  entry={liveLevels.entry}
                  sl={liveLevels.sl}
                  tp1={liveLevels.tp1}
                  tp2={liveLevels.tp2}
                  height={Math.max(520, typeof window !== "undefined" ? window.innerHeight - 115 : 760)}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

