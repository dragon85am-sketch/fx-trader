"use client";

import React from "react";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Circle,
  Clock3,
  Crosshair,
  Loader2,
  Maximize2,
  Minimize2,
  RefreshCw,
  Search,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";

import type {
  CandlestickData,
  UTCTimestamp,
} from "lightweight-charts";

import AlphaPriceChart from "@/components/AlphaPriceChart";

import {
  scanGoldUs30,
  type ScannerCandle,
  type ScannerResult,
  type ScannerSymbol,
} from "@/lib/scanners/goldUs30Scanner";

// ======================================================
// TWELVE DATA TYPES
// ======================================================

type TwelveValue = {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume?: string;
};

type TwelveResponse = {
  values?: TwelveValue[];
  status?: string;
  message?: string;
  error?: string;
  code?: number;
};

// ======================================================
// MARKET STATE
// ======================================================

type MarketState = {
  symbol: ScannerSymbol;

  scanner: ScannerResult | null;

  m1: ScannerCandle[];
  m5: ScannerCandle[];

  chartCandles: CandlestickData[];

  loading: boolean;

  error: string | null;

  updatedAt: Date | null;
};

// ======================================================
// TWELVE DATA SYMBOLS
// ======================================================

const TWELVE_SYMBOLS: Record<ScannerSymbol, string> = {
  XAUUSD: "XAU/USD",
  US30: "DJI",
};

let resolvedUs30Symbol: string | null = null;

async function resolveProviderSymbol(symbol: ScannerSymbol): Promise<string> {
  if (symbol !== "US30") return TWELVE_SYMBOLS[symbol];
  if (resolvedUs30Symbol) return resolvedUs30Symbol;

  // Index tickers can differ between Twelve Data plans/feeds. Resolve the
  // Dow dynamically instead of leaving the scanner with an invalid symbol.
  const queries = ["Dow Jones Industrial Average", "Dow Jones", "DJI"];
  for (const query of queries) {
    try {
      const params = new URLSearchParams({ path: "/symbol_search", symbol: query, outputsize: "20" });
      const response = await fetch(`/api/twelve-data?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) continue;
      const json = await response.json();
      const rows = Array.isArray(json?.data) ? json.data : Array.isArray(json?.values) ? json.values : [];
      const match = rows.find((row: any) => {
        const name = String(row?.instrument_name ?? row?.name ?? "").toLowerCase();
        const type = String(row?.instrument_type ?? row?.type ?? "").toLowerCase();
        return (name.includes("dow jones industrial") || String(row?.symbol ?? "").toUpperCase() === "DJI") && (type.includes("index") || !type);
      }) ?? rows.find((row: any) => String(row?.instrument_name ?? row?.name ?? "").toLowerCase().includes("dow jones"));
      const candidate = String(match?.symbol ?? "").trim();
      if (candidate) { resolvedUs30Symbol = candidate; return candidate; }
    } catch {}
  }
  return TWELVE_SYMBOLS.US30;
}

// ======================================================
// INITIAL STATE
// ======================================================

function createEmptyMarket(
  symbol: ScannerSymbol,
): MarketState {
  return {
    symbol,

    scanner: null,

    m1: [],
    m5: [],

    chartCandles: [],

    loading: false,

    error: null,

    updatedAt: null,
  };
}

// ======================================================
// TWELVE DATA -> SCANNER
// ======================================================

function toScannerCandles(
  values: TwelveValue[],
): ScannerCandle[] {
  return values
    .map((item) => ({
      datetime: item.datetime,

      open: Number(item.open),
      high: Number(item.high),
      low: Number(item.low),
      close: Number(item.close),

      volume:
        item.volume !== undefined
          ? Number(item.volume)
          : undefined,
    }))
    .filter(
      (item) =>
        Number.isFinite(item.open) &&
        Number.isFinite(item.high) &&
        Number.isFinite(item.low) &&
        Number.isFinite(item.close),
    )
    .sort((a, b) =>
      a.datetime.localeCompare(
        b.datetime,
      ),
    );
}

// ======================================================
// DATETIME -> LIGHTWEIGHT CHARTS
// ======================================================

function toTimestamp(
  datetime: string,
): UTCTimestamp {
  const [datePart, timePart = "00:00:00"] =
    datetime.split(" ");

  const [year, month, day] =
    datePart.split("-").map(Number);

  const [hour, minute, second] =
    timePart.split(":").map(Number);

  return Math.floor(
    Date.UTC(
      year,
      month - 1,
      day,
      hour || 0,
      minute || 0,
      second || 0,
    ) / 1000,
  ) as UTCTimestamp;
}

// ======================================================
// TWELVE DATA -> CHART
// ======================================================

function toChartCandles(
  values: TwelveValue[],
): CandlestickData[] {
  return values
    .map((item) => ({
      time: toTimestamp(
        item.datetime,
      ),

      open: Number(item.open),
      high: Number(item.high),
      low: Number(item.low),
      close: Number(item.close),
    }))
    .filter(
      (item) =>
        Number.isFinite(item.open) &&
        Number.isFinite(item.high) &&
        Number.isFinite(item.low) &&
        Number.isFinite(item.close),
    )
    .sort(
      (a, b) =>
        Number(a.time) -
        Number(b.time),
    );
}

// ======================================================
// FETCH TWELVE DATA
// ======================================================

async function fetchCandles(
  symbol: ScannerSymbol,
  interval: "1min" | "5min",
  outputsize: number,
): Promise<TwelveValue[]> {
  const providerSymbol =
    await resolveProviderSymbol(symbol);

  const params = new URLSearchParams({
    path: "/time_series",

    symbol: providerSymbol,

    interval,

    outputsize:
      String(outputsize),

    format: "JSON",

    // Scanner liczy sesje w czasie New York.
    timezone:
      "America/New_York",

    order: "asc",
  });

  const response = await fetch(
    `/api/twelve-data?${params.toString()}`,
    {
      method: "GET",

      cache: "no-store",

      headers: {
        Accept:
          "application/json",
      },
    },
  );

  let data: TwelveResponse;

  try {
    data =
      (await response.json()) as TwelveResponse;
  } catch {
    throw new Error(
      `${symbol} ${interval}: invalid JSON`,
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
        data?.message ||
        `${symbol} ${interval}: Twelve Data error`,
    );
  }

  if (
    data?.status === "error"
  ) {
    throw new Error(
      data?.message ||
        data?.error ||
        `${symbol} ${interval}: Twelve Data error`,
    );
  }

  if (
    !Array.isArray(data?.values) ||
    data.values.length === 0
  ) {
    throw new Error(
      `${symbol} ${interval}: brak danych świecowych`,
    );
  }

  return data.values;
}

// ======================================================
// FORMAT PRICE
// ======================================================

function formatPrice(
  value: number | undefined,
  symbol: ScannerSymbol,
) {
  if (
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return value.toLocaleString(
    "en-US",
    {
      minimumFractionDigits:
        symbol === "US30"
          ? 1
          : 2,

      maximumFractionDigits:
        symbol === "US30"
          ? 1
          : 2,
    },
  );
}

// ======================================================
// SCORE
// ======================================================

function ScoreCircle({
  score,
}: {
  score: number;
}) {
  let className =
    "border-slate-600/50 bg-slate-500/5 text-sky-100/70";

  if (score >= 90) {
    className =
      "border-emerald-400/70 bg-emerald-500/10 text-emerald-300";
  } else if (score >= 80) {
    className =
      "border-cyan-400/70 bg-cyan-500/10 text-cyan-300";
  } else if (score >= 60) {
    className =
      "border-amber-400/70 bg-amber-500/10 text-amber-300";
  }

  return (
    <div
      className={`flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-full border-[4px] ${className}`}
    >
      <div className="text-center">
        <div className="text-sm font-black">
          {score}
        </div>

        <div className="text-[8px] font-bold opacity-60">
          SCORE
        </div>
      </div>
    </div>
  );
}

// ======================================================
// STATUS BADGE
// ======================================================

function StatusBadge({
  status,
}: {
  status: ScannerResult["status"];
}) {
  let className =
    "border-slate-500/20 bg-slate-500/5 text-sky-100/70";

  if (status === "A+ SETUP") {
    className =
      "border-emerald-400/25 bg-emerald-500/10 text-emerald-300";
  } else if (status === "READY") {
    className =
      "border-cyan-400/25 bg-cyan-500/10 text-cyan-300";
  } else if (
    status === "FORMING"
  ) {
    className =
      "border-amber-400/25 bg-amber-500/10 text-amber-300";
  }

  return (
    <span
      className={`inline-flex rounded-lg border px-2.5 py-1 text-[9px] font-black tracking-wide ${className}`}
    >
      {status}
    </span>
  );
}

// ======================================================
// CONFIRMATION CARD
// ======================================================

function ConfirmationCard({
  number,
  title,
  active,
  description,
  points,
}: {
  number: string;
  title: string;
  active: boolean;
  description: string;
  points: string;
}) {
  return (
    <div
      className={`rounded-[18px] border p-4 transition ${
        active
          ? "border-emerald-400/25 bg-[linear-gradient(145deg,#0a3658,#08314d)]"
          : "border-sky-300/15 bg-[linear-gradient(145deg,#0b315f,#08284f)]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg border text-[10px] font-black ${
              active
                ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                : "border-white/10 bg-white/[0.03] text-sky-100/55"
            }`}
          >
            {number}
          </div>

          <div>
            <div className="text-[11px] font-black text-white">
              {title}
            </div>

            <div className="mt-1 text-[9px] text-sky-200/45">
              {points}
            </div>
          </div>
        </div>

        {active ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
        ) : (
          <Circle className="h-4 w-4 text-sky-200/30" />
        )}
      </div>

      <p className="mt-4 min-h-[34px] text-[10px] leading-[17px] text-sky-100/55">
        {description}
      </p>
    </div>
  );
}

// ======================================================
// LEVEL BOX
// ======================================================

function LevelBox({
  label,
  value,
  symbol,
}: {
  label: string;

  value: number | undefined;

  symbol: ScannerSymbol;
}) {
  return (
    <div className="rounded-xl border border-sky-300/15 bg-[#0a2a50]/85 px-3 py-3">
      <div className="text-[8px] font-bold uppercase tracking-wider text-sky-200/45">
        {label}
      </div>

      <div className="mt-1.5 font-mono text-[12px] font-bold text-white/90">
        {formatPrice(
          value,
          symbol,
        )}
      </div>
    </div>
  );
}

// ======================================================
// MAIN
// ======================================================

export default function ProScanner() {
  const [
    selectedSymbol,
    setSelectedSymbol,
  ] =
    React.useState<ScannerSymbol>(
      "XAUUSD",
    );

  const [gold, setGold] =
    React.useState<MarketState>(
      createEmptyMarket(
        "XAUUSD",
      ),
    );

  const [us30, setUs30] =
    React.useState<MarketState>(
      createEmptyMarket(
        "US30",
      ),
    );

  const [scanning, setScanning] =
    React.useState(false);

  const [chartFullscreen, setChartFullscreen] = React.useState(false);

  React.useEffect(() => {
    if (!chartFullscreen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setChartFullscreen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [chartFullscreen]);

  const current =
    selectedSymbol === "XAUUSD"
      ? gold
      : us30;

  // ====================================================
  // SCAN ONE
  // ====================================================

  const scanSymbol =
    React.useCallback(
      async (
        symbol: ScannerSymbol,
      ): Promise<MarketState> => {
        try {
          const [
            rawM1,
            rawM5,
          ] =
            await Promise.all([
              fetchCandles(
                symbol,
                "1min",
                1800,
              ),

              fetchCandles(
                symbol,
                "5min",
                300,
              ),
            ]);

          const m1 =
            toScannerCandles(
              rawM1,
            );

          const m5 =
            toScannerCandles(
              rawM5,
            );

          if (
            m1.length < 30
          ) {
            throw new Error(
              `${symbol}: za mało świec M1`,
            );
          }

          if (
            m5.length < 12
          ) {
            throw new Error(
              `${symbol}: za mało świec M5`,
            );
          }

          const scanner =
            scanGoldUs30({
              symbol,

              m1Candles: m1,

              m5Candles: m5,
            });

          return {
            symbol,

            scanner,

            m1,
            m5,

            chartCandles:
              toChartCandles(
                rawM1,
              ),

            loading: false,

            error: null,

            updatedAt:
              new Date(),
          };
        } catch (error) {
          console.error(
            `[PRO SCANNER ${symbol}]`,
            error,
          );

          return {
            ...createEmptyMarket(
              symbol,
            ),

            loading: false,

            error:
              error instanceof Error
                ? error.message
                : "Scanner error",

            updatedAt:
              new Date(),
          };
        }
      },
      [],
    );

  // ====================================================
  // SCAN GOLD + US30
  // ====================================================

  const runScan =
    React.useCallback(
      async () => {
        if (scanning) {
          return;
        }

        setScanning(true);

        setGold(
          (previous) => ({
            ...previous,

            loading: true,

            error: null,
          }),
        );

        setUs30(
          (previous) => ({
            ...previous,

            loading: true,

            error: null,
          }),
        );

        try {
          const [
            goldResult,
            us30Result,
          ] =
            await Promise.all([
              scanSymbol(
                "XAUUSD",
              ),

              scanSymbol(
                "US30",
              ),
            ]);

          setGold(
            goldResult,
          );

          setUs30(
            us30Result,
          );
        } finally {
          setScanning(
            false,
          );
        }
      },
      [
        scanSymbol,
        scanning,
      ],
    );

  // ====================================================
  // INITIAL SCAN
  // ====================================================

  React.useEffect(() => {
    void runScan();

    // wykonujemy tylko po pierwszym wejściu
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markets = [
    gold,
    us30,
  ];

  const scanner =
    current.scanner;

  const chartDirection:
    | "BUY"
    | "SELL" =
    scanner?.direction ===
    "SELL"
      ? "SELL"
      : "BUY";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#0a2a52_0%,#061a33_34%,#041225_70%,#030b16_100%)] text-white">
      <div className="mx-auto max-w-[1760px] px-4 py-5 lg:px-6 xl:px-7">
        {/* ============================================ */}
        {/* HEADER */}
        {/* ============================================ */}

        <header className="mb-5 overflow-hidden rounded-[24px] border border-sky-400/25 bg-[linear-gradient(135deg,#0d3d73_0%,#0b315f_55%,#09284f_100%)] shadow-[0_18px_55px_rgba(2,132,199,.18)]">
          <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between lg:p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-cyan-400/20 bg-cyan-500/10 shadow-[0_0_30px_rgba(34,211,238,.06)]">
                <Crosshair className="h-5 w-5 text-cyan-300" />
              </div>

              <div>
                <div className="text-[9px] font-black uppercase tracking-[.22em] text-cyan-400">
                  FX Trade Professional
                </div>

                <h1 className="mt-1.5 text-xl font-black tracking-tight sm:text-2xl">
                  GOLD & US30 PRO SCANNER
                </h1>

                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-sky-100/55">
                  <span>
                    M5 Bias
                  </span>

                  <span>→</span>

                  <span>
                    M1 Timing
                  </span>

                  <span>·</span>

                  <span>
                    Sesja Nowy Jork
                  </span>

                  <span>·</span>

                  <span>
                    Twelve Data
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setChartFullscreen(true)}
                className="flex h-11 items-center gap-2 rounded-xl border border-sky-300/25 bg-sky-500/10 px-4 text-[10px] font-black text-sky-100 transition hover:bg-sky-500/20"
              >
                <Maximize2 className="h-4 w-4" />
                PEŁNY EKRAN WYKRESU
              </button>
              <div className="flex h-11 items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-400/[0.08] px-4">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />

                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>

                <span className="text-[9px] font-black text-emerald-300">
                  TWELVE DATA
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  void runScan()
                }
                disabled={
                  scanning
                }
                className="flex h-11 items-center gap-2 rounded-xl border border-cyan-300/20 bg-gradient-to-r from-sky-400 via-blue-500 to-blue-600 px-5 text-[10px] font-black shadow-[0_10px_35px_rgba(14,165,233,.14)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {scanning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}

                {scanning
                  ? "SKANOWANIE..."
                  : "SKANUJ SETUPY"}
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[370px_minmax(0,1fr)]">
          {/* ========================================== */}
          {/* LEFT PANEL */}
          {/* ========================================== */}

          <aside className="space-y-5">
            <section className="overflow-hidden rounded-[22px] border border-sky-400/20 bg-[linear-gradient(145deg,#0a2f5d_0%,#08284f_100%)] shadow-[0_14px_34px_rgba(2,132,199,.10)]">
              <div className="flex items-center justify-between border-b border-sky-300/15 px-5 py-4">
                <div>
                  <div className="text-[11px] font-black">
                    SESSION MARKETS
                  </div>

                  <div className="mt-1 text-[9px] text-sky-200/45">
                    GOLD + US30
                  </div>
                </div>

                <Activity className="h-4 w-4 text-cyan-300" />
              </div>

              <div className="divide-y divide-sky-300/10">
                {markets.map(
                  (market) => {
                    const item =
                      market.scanner;

                    const selected =
                      market.symbol ===
                      selectedSymbol;

                    return (
                      <button
                        type="button"
                        key={
                          market.symbol
                        }
                        onClick={() =>
                          setSelectedSymbol(
                            market.symbol,
                          )
                        }
                        className={`w-full p-5 text-left transition ${
                          selected
                            ? "bg-gradient-to-r from-sky-400/[0.18] via-blue-500/[0.08] to-transparent"
                            : "hover:bg-sky-300/[0.06]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="text-[15px] font-black">
                                {
                                  market.symbol
                                }
                              </div>

                              <span
                                className={`rounded-md border px-2 py-0.5 text-[8px] font-bold ${
                                  market.symbol ===
                                  "XAUUSD"
                                    ? "border-amber-400/15 bg-amber-500/[0.06] text-amber-300"
                                    : "border-sky-400/15 bg-sky-500/[0.06] text-sky-300"
                                }`}
                              >
                                {market.symbol ===
                                "XAUUSD"
                                  ? "GOLD"
                                  : "DOW"}
                              </span>
                            </div>

                            {market.loading ? (
                              <div className="mt-4 flex items-center gap-2 text-[10px] text-cyan-300">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />

                                Analiza rynku...
                              </div>
                            ) : market.error ? (
                              <div className="mt-3 max-w-[210px] text-[9px] leading-4 text-rose-300">
                                {
                                  market.error
                                }
                              </div>
                            ) : item ? (
                              <>
                                <div className="mt-3 text-[10px] font-semibold text-sky-50/85">
                                  {
                                    item.setup
                                  }
                                </div>

                                <div className="mt-2 flex items-center gap-2">
                                  {item.direction ===
                                  "BUY" ? (
                                    <TrendingUp className="h-4 w-4 text-emerald-300" />
                                  ) : item.direction ===
                                    "SELL" ? (
                                    <TrendingDown className="h-4 w-4 text-rose-300" />
                                  ) : (
                                    <Activity className="h-4 w-4 text-sky-200/45" />
                                  )}

                                  <span
                                    className={`text-[11px] font-black ${
                                      item.direction ===
                                      "BUY"
                                        ? "text-emerald-300"
                                        : item.direction ===
                                            "SELL"
                                          ? "text-rose-300"
                                          : "text-sky-100/55"
                                    }`}
                                  >
                                    {
                                      item.direction
                                    }
                                  </span>
                                </div>

                                <div className="mt-3">
                                  <StatusBadge
                                    status={
                                      item.status
                                    }
                                  />
                                </div>
                              </>
                            ) : (
                              <div className="mt-3 text-[9px] text-sky-200/45">
                                Brak analizy
                              </div>
                            )}
                          </div>

                          {item ? (
                            <ScoreCircle
                              score={
                                item.score
                              }
                            />
                          ) : null}
                        </div>
                      </button>
                    );
                  },
                )}
              </div>
            </section>

            {/* SCORING */}

            <section className="rounded-[22px] border border-sky-400/20 bg-[linear-gradient(145deg,#0a2f5d_0%,#08284f_100%)] shadow-[0_14px_34px_rgba(2,132,199,.10)] p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-cyan-300" />

                <div className="text-[11px] font-black">
                  SETUP SCORE
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-sky-100/55">
                    Liquidity / OR
                  </span>

                  <span className="font-bold text-white">
                    40
                  </span>
                </div>

                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-sky-100/55">
                    Structure
                  </span>

                  <span className="font-bold text-white">
                    35
                  </span>
                </div>

                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-sky-100/55">
                    VWAP + Momentum
                  </span>

                  <span className="font-bold text-white">
                    25
                  </span>
                </div>
              </div>

              <div className="mt-4 border-t border-sky-300/15 pt-4 text-[9px] leading-5 text-sky-200/45">
                60+ FORMING · 80+ READY · 90+ A+
              </div>
            </section>
          </aside>

          {/* ========================================== */}
          {/* MAIN CONTENT */}
          {/* ========================================== */}

          <section className="min-w-0 space-y-5">
            {/* SELECTED MARKET HEADER */}

            <div className="rounded-[22px] border border-sky-400/20 bg-[linear-gradient(145deg,#0a2f5d_0%,#08284f_100%)] shadow-[0_14px_34px_rgba(2,132,199,.10)] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl border ${
                      selectedSymbol ===
                      "XAUUSD"
                        ? "border-amber-400/15 bg-amber-500/[0.07]"
                        : "border-cyan-400/15 bg-cyan-500/[0.07]"
                    }`}
                  >
                    <Zap
                      className={`h-5 w-5 ${
                        selectedSymbol ===
                        "XAUUSD"
                          ? "text-amber-300"
                          : "text-cyan-300"
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black">
                        {
                          selectedSymbol
                        }
                      </h2>

                      <span className="rounded-md border border-sky-300/15 bg-[#0b2b52]/80 px-2 py-1 text-[8px] font-bold text-sky-100/55">
                        M5 â†’ M1
                      </span>
                    </div>

                    <div className="mt-1 text-[9px] text-sky-200/45">
                      Sesja Nowy Jork
                    </div>
                  </div>
                </div>

                {scanner ? (
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-sky-300/15 bg-[#0b2b52]/80 px-4 py-2">
                      <div className="text-[8px] font-bold text-sky-200/45">
                        M5 BIAS
                      </div>

                      <div
                        className={`mt-1 text-[11px] font-black ${
                          scanner.biasM5 ===
                          "BULLISH"
                            ? "text-emerald-300"
                            : scanner.biasM5 ===
                                "BEARISH"
                              ? "text-rose-300"
                              : "text-sky-100/70"
                        }`}
                      >
                        {
                          scanner.biasM5
                        }
                      </div>
                    </div>

                    <ScoreCircle
                      score={
                        scanner.score
                      }
                    />
                  </div>
                ) : null}
              </div>
            </div>

            {/* ERROR */}

            {current.error ? (
              <div className="rounded-[22px] border border-rose-400/15 bg-rose-500/[0.045] p-5">
                <div className="text-[12px] font-black text-rose-300">
                  DATA ERROR
                </div>

                <p className="mt-2 text-[10px] leading-5 text-rose-200/70">
                  {
                    current.error
                  }
                </p>

                {selectedSymbol ===
                "US30" ? (
                  <p className="mt-3 text-[9px] leading-5 text-sky-100/55">
                    Jeśli GOLD działa,
                    a US30 zwraca błąd,
                    sprawdzimy ticker
                    indeksu dostępny w
                    Twoim planie Twelve
                    Data.
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className={chartFullscreen ? "fixed inset-0 z-[150] overflow-auto bg-[#020914] p-3 md:p-5" : ""}>
              <div className="mb-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setChartFullscreen((value) => !value)}
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-500/10 px-4 py-2 text-[11px] font-black text-cyan-200 transition hover:bg-cyan-500/20"
                >
                  {chartFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  {chartFullscreen ? "ZAMKNIJ PEŁNY EKRAN" : "PEŁNY EKRAN WYKRESU"}
                </button>
              </div>

            {/* LOADING */}

            {current.loading ? (
              <div className="flex h-[620px] items-center justify-center rounded-[22px] border border-sky-400/20 bg-[#061426] shadow-[0_14px_34px_rgba(2,132,199,.08)]">
                <div className="text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-cyan-300" />

                  <div className="mt-3 text-[11px] font-bold text-cyan-200">
                    Pobieranie M1 + M5
                  </div>

                  <div className="mt-1 text-[9px] text-sky-200/45">
                    Twelve Data
                  </div>
                </div>
              </div>
            ) : null}

            {/* CHART */}

            {!current.loading &&
            scanner &&
            current.chartCandles.length >
              0 ? (
              <AlphaPriceChart
                symbol={
                  selectedSymbol
                }
                tf="M1"
                candles={
                  current.chartCandles
                }
                loading={false}
                priceAction={
                  scanner.direction ===
                  "WAIT"
                    ? "WAIT · NO TRADE"
                    : scanner.priceAction
                }
                direction={
                  chartDirection
                }
                entry={
                  scanner.direction ===
                  "WAIT"
                    ? 0
                    : scanner.entry
                }
                sl={
                  scanner.direction ===
                  "WAIT"
                    ? 0
                    : scanner.sl
                }
                tp1={
                  scanner.direction ===
                  "WAIT"
                    ? 0
                    : scanner.tp1
                }
                tp2={
                  scanner.direction ===
                  "WAIT"
                    ? 0
                    : scanner.tp2
                }
                asianHigh={
                  scanner.asianHigh
                }
                asianLow={
                  scanner.asianLow
                }
                londonHigh={
                  scanner.londonHigh
                }
                londonLow={
                  scanner.londonLow
                }
                nyOpenHigh={
                  scanner.nyOpenHigh
                }
                nyOpenLow={
                  scanner.nyOpenLow
                }
                vwap={
                  scanner.vwap
                }
                bosPrice={
                  scanner.bosPrice
                }
                chochPrice={
                  scanner.chochPrice
                }
                height={chartFullscreen ? Math.max(620, typeof window !== "undefined" ? window.innerHeight - 110 : 760) : 620}
              />
            ) : null}

            </div>

            {/* CONFIRMATIONS */}

            {scanner &&
            !current.loading ? (
              <div className="grid gap-4 md:grid-cols-3">
                <ConfirmationCard
                  number="01"
                  title="LIQUIDITY"
                  points="40 POINTS"
                  active={
                    scanner.liquidityConfirmed
                  }
                  description={
                    scanner.sweepType
                      ? `Sweep: ${scanner.sweepType.replaceAll(
                          "_",
                          " ",
                        )}`
                      : scanner.setup ===
                          "NY OR Breakout"
                        ? "NY Opening Range breakout potwierdzony."
                        : "Czekamy na sweep Asian/London lub NY Opening Range."
                  }
                />

                <ConfirmationCard
                  number="02"
                  title="M1 STRUCTURE"
                  points="35 POINTS"
                  active={
                    scanner.structureConfirmed
                  }
                  description={
                    scanner.structureType
                      ? `Potwierdzenie: ${scanner.structureType.replaceAll(
                          "_",
                          " ",
                        )}`
                      : "Czekamy na BOS / CHOCH po reakcji z płynności."
                  }
                />

                <ConfirmationCard
                  number="03"
                  title="VWAP + MOMENTUM"
                  points="25 POINTS"
                  active={
                    scanner.vwapConfirmed &&
                    scanner.momentumConfirmed
                  }
                  description={`VWAP ${
                    scanner.vwapConfirmed
                      ? "âœ“"
                      : "—"
                  } · Momentum ${
                    scanner.momentumConfirmed
                      ? "âœ“"
                      : "—"
                  }`}
                />
              </div>
            ) : null}

            {/* LEVELS / PLAN */}

            {scanner &&
            !current.loading ? (
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_370px]">
                {/* LEVELS */}

                <div className="rounded-[22px] border border-sky-400/20 bg-[linear-gradient(145deg,#0a2f5d_0%,#08284f_100%)] shadow-[0_14px_34px_rgba(2,132,199,.10)] p-5">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-cyan-300" />

                    <h3 className="text-[11px] font-black">
                      SESSION LEVELS
                    </h3>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <LevelBox
                      label="Asian High"
                      value={
                        scanner.asianHigh
                      }
                      symbol={
                        selectedSymbol
                      }
                    />

                    <LevelBox
                      label="Asian Low"
                      value={
                        scanner.asianLow
                      }
                      symbol={
                        selectedSymbol
                      }
                    />

                    <LevelBox
                      label="London High"
                      value={
                        scanner.londonHigh
                      }
                      symbol={
                        selectedSymbol
                      }
                    />

                    <LevelBox
                      label="London Low"
                      value={
                        scanner.londonLow
                      }
                      symbol={
                        selectedSymbol
                      }
                    />

                    <LevelBox
                      label="NY OR High"
                      value={
                        scanner.nyOpenHigh
                      }
                      symbol={
                        selectedSymbol
                      }
                    />

                    <LevelBox
                      label="NY OR Low"
                      value={
                        scanner.nyOpenLow
                      }
                      symbol={
                        selectedSymbol
                      }
                    />

                    <LevelBox
                      label="VWAP"
                      value={
                        scanner.vwap
                      }
                      symbol={
                        selectedSymbol
                      }
                    />

                    <LevelBox
                      label="Last Price"
                      value={
                        scanner.lastPrice
                      }
                      symbol={
                        selectedSymbol
                      }
                    />
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-sky-300/15 bg-[#09264a]/85 p-4">
                      <div className="text-[8px] font-bold text-sky-200/45">
                        BOS LEVEL
                      </div>

                      <div className="mt-1.5 font-mono text-[12px] font-bold text-emerald-300">
                        {formatPrice(
                          scanner.bosPrice,
                          selectedSymbol,
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-sky-300/15 bg-[#09264a]/85 p-4">
                      <div className="text-[8px] font-bold text-sky-200/45">
                        CHOCH LEVEL
                      </div>

                      <div className="mt-1.5 font-mono text-[12px] font-bold text-fuchsia-300">
                        {formatPrice(
                          scanner.chochPrice,
                          selectedSymbol,
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* TRADE PLAN */}

                <div className="rounded-[22px] border border-sky-400/20 bg-[linear-gradient(145deg,#0a2f5d_0%,#08284f_100%)] shadow-[0_14px_34px_rgba(2,132,199,.10)] p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-emerald-300" />

                      <h3 className="text-[11px] font-black">
                        TRADE PLAN
                      </h3>
                    </div>

                    <StatusBadge
                      status={
                        scanner.status
                      }
                    />
                  </div>

                  {scanner.direction ===
                  "WAIT" ? (
                    <div className="mt-5 rounded-[16px] border border-sky-300/15 bg-[#082342]/80 p-5 text-center">
                      <Activity className="mx-auto h-5 w-5 text-sky-200/45" />

                      <div className="mt-3 text-[12px] font-black text-sky-100/70">
                        NO TRADE
                      </div>

                      <div className="mt-2 text-[9px] leading-5 text-sky-200/45">
                        Scanner czeka na
                        setup o odpowiedniej
                        jakości.
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 space-y-3">
                      <div className="flex items-center justify-between rounded-xl border border-sky-300/15 bg-[#09264a]/85 px-3 py-3">
                        <span className="text-[9px] text-sky-100/55">
                          Direction
                        </span>

                        <span
                          className={`text-[11px] font-black ${
                            scanner.direction ===
                            "BUY"
                              ? "text-emerald-300"
                              : "text-rose-300"
                          }`}
                        >
                          {
                            scanner.direction
                          }
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl border border-cyan-400/10 bg-cyan-500/[0.035] px-3 py-3">
                        <span className="text-[9px] text-sky-100/55">
                          ENTRY
                        </span>

                        <span className="font-mono text-[12px] font-black text-cyan-300">
                          {formatPrice(
                            scanner.entry,
                            selectedSymbol,
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl border border-rose-400/10 bg-rose-500/[0.035] px-3 py-3">
                        <span className="text-[9px] text-sky-100/55">
                          STOP LOSS
                        </span>

                        <span className="font-mono text-[12px] font-black text-rose-300">
                          {formatPrice(
                            scanner.sl,
                            selectedSymbol,
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl border border-emerald-400/10 bg-emerald-500/[0.035] px-3 py-3">
                        <span className="text-[9px] text-sky-100/55">
                          TP1 · 1R
                        </span>

                        <span className="font-mono text-[12px] font-black text-emerald-300">
                          {formatPrice(
                            scanner.tp1,
                            selectedSymbol,
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl border border-emerald-400/10 bg-emerald-500/[0.035] px-3 py-3">
                        <span className="text-[9px] text-sky-100/55">
                          TP2 · 2R
                        </span>

                        <span className="font-mono text-[12px] font-black text-emerald-300">
                          {formatPrice(
                            scanner.tp2,
                            selectedSymbol,
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-t border-sky-300/15 pt-4">
                        <span className="text-[9px] text-sky-100/55">
                          Risk / Reward
                        </span>

                        <span className="text-[12px] font-black">
                          1:
                          {
                            scanner.rr
                          }
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* ANALYSIS */}

            {scanner &&
            !current.loading ? (
              <div className="rounded-[22px] border border-sky-400/20 bg-[linear-gradient(145deg,#0a2f5d_0%,#08284f_100%)] shadow-[0_14px_34px_rgba(2,132,199,.10)] p-5">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-black">
                    SCANNER ANALYSIS
                  </div>

                  {current.updatedAt ? (
                    <div className="flex items-center gap-1.5 text-[8px] text-sky-200/45">
                      <Clock3 className="h-3 w-3" />

                      {current.updatedAt.toLocaleTimeString(
                        "pl-PL",
                        {
                          hour:
                            "2-digit",
                          minute:
                            "2-digit",
                          second:
                            "2-digit",
                        },
                      )}
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-2">
                  {scanner.reasons.map(
                    (
                      reason,
                      index,
                    ) => (
                      <div
                        key={`${reason}-${index}`}
                        className="flex items-center gap-3 rounded-xl border border-sky-300/15 bg-[#082342]/85 px-3 py-2.5"
                      >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />

                        <span className="text-[9px] text-sky-100/55">
                          {reason}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            ) : null}

            {/* EMPTY */}

            {!current.loading &&
            !scanner &&
            !current.error ? (
              <div className="flex min-h-[400px] items-center justify-center rounded-[22px] border border-sky-400/20 bg-[linear-gradient(145deg,#0a2f5d_0%,#08284f_100%)] shadow-[0_14px_34px_rgba(2,132,199,.10)]">
                <div className="text-center">
                  <Crosshair className="mx-auto h-7 w-7 text-sky-200/30" />

                  <div className="mt-3 text-[12px] font-black text-sky-100/70">
                    PRO SCANNER
                  </div>

                  <div className="mt-2 text-[9px] text-sky-200/45">
                    Kliknij SKANUJ SETUPY
                  </div>
                </div>
              </div>
            ) : null}

            {/* FOOTER */}

            <div className="flex flex-col gap-2 border-t border-sky-300/10 px-1 pt-4 text-[8px] leading-4 text-sky-200/30 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Scanner edukacyjny ·
                wyniki nie stanowią
                rekomendacji
                inwestycyjnej.
              </span>

              <span>
                GOLD / US30 · M5
                Bias â†’ M1 Timing
              </span>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
