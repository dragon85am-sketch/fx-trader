"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Brain,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Gauge,
  Gem,
  LineChart,
  Pencil,
  PieChart,
  Play,
  RefreshCcw,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  TrendingUp,
  Trophy,
  WalletCards,
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
type JournalTrade = {
  id: string;
  date: string;
  pair: string;
  side: "BUY" | "SELL";
  entry: string;
  sl: string;
  tp: string;
  rr: string;
  outcome: "WIN" | "LOSS" | "BE";
  resultR: number;
  pnl: number;
  notes: string;
  screenshot?: string;
};

type TradingPlan = {
  accountBalance: number;
  monthlyGoalPercent: number;
  riskPerTradePercent: number;
  tradingDays: number;
  maxTradesPerDay: number;
  includeWeekends: boolean;
  isActive: boolean;
};

const STORAGE_KEY = "fxtrade_journal_trades_v5";
const TRADING_PLAN_KEY = "fxtrade_trading_plan_v1";

function rrToNumber(rr: string): number {
  const cleaned = rr.replace(/\s/g, "").replace(",", ".");
  const match = cleaned.match(/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/);
  if (!match) return 0;

  const left = Number(match[1]);
  const right = Number(match[2]);
  if (!left || !right) return 0;

  return right / left;
}

function parseCsvLine(line: string): string[] {
  return line
    .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
    .map((v) => v.replace(/^"|"$/g, "").trim());
}

export default function FxTradeJournalProPage() {
  const [activeJournalTab, setActiveJournalTab] = useState("PrzeglÄ…d");
  const [showAddTradeModal, setShowAddTradeModal] = useState(false);
  const [editingTradeId, setEditingTradeId] = useState<string | null>(null);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);

  const [filterPair, setFilterPair] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // WAÅ»NE: pierwszy render serwera i klienta musi byÄ‡ identyczny.
  // Nie czytamy localStorage bezpoÅ›rednio w useState, bo powoduje hydration mismatch.
  const [trades, setTrades] = useState<JournalTrade[]>([]);
  const [storageReady, setStorageReady] = useState(false);

  const [tradingPlan, setTradingPlan] = useState<TradingPlan>({
    accountBalance: 1000,
    monthlyGoalPercent: 45,
    riskPerTradePercent: 0.5,
    tradingDays: 20,
    maxTradesPerDay: 3,
    includeWeekends: false,
    isActive: false,
  });

  const [calendarMonth, setCalendarMonth] = useState(() =>
    new Date().toISOString().slice(0, 7)
  );

  const [form, setForm] = useState<JournalTrade>({
    id: "",
    date: new Date().toISOString().slice(0, 10),
    pair: "XAUUSD",
    side: "BUY",
    entry: "",
    sl: "",
    tp: "",
    rr: "1:2",
    outcome: "WIN",
    resultR: 2,
    pnl: 0,
    notes: "",
    screenshot: "",
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (raw) {
        setTrades(JSON.parse(raw));
      } else {
        setTrades([
          {
            id: crypto.randomUUID(),
            date: "2026-03-15",
            pair: "XAUUSD",
            side: "BUY",
            entry: "71648",
            sl: "70658",
            tp: "72300",
            rr: "1:2",
            outcome: "WIN",
            resultR: 2,
            pnl: 240,
            notes: "Strong breakout after liquidity sweep",
            screenshot: "",
          },
          {
            id: crypto.randomUUID(),
            date: "2026-03-14",
            pair: "EURUSD",
            side: "BUY",
            entry: "1.0824",
            sl: "1.0812",
            tp: "1.0848",
            rr: "1:2",
            outcome: "WIN",
            resultR: 2,
            pnl: 180,
            notes: "London breakout with retest",
            screenshot: "",
          },
          {
            id: crypto.randomUUID(),
            date: "2026-03-13",
            pair: "GBPJPY",
            side: "SELL",
            entry: "189.44",
            sl: "189.82",
            tp: "189.00",
            rr: "1:1.2",
            outcome: "LOSS",
            resultR: -1,
            pnl: -100,
            notes: "Entry too early, weak confirmation",
            screenshot: "",
          },
        ]);
      }
    } catch (err) {
      console.error("BÅ‚Ä…d odczytu localStorage:", err);
    }

    try {
      const savedPlan = localStorage.getItem(TRADING_PLAN_KEY);
      if (savedPlan) {
        setTradingPlan(JSON.parse(savedPlan));
      }
    } catch (err) {
      console.error("BÅ‚Ä…d odczytu trading plan:", err);
    } finally {
      // Dopiero od tej chwili wolno zapisywaÄ‡ stan z powrotem do localStorage.
      setStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (!storageReady) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
    } catch (err) {
      console.error("BÅ‚Ä…d zapisu do localStorage:", err);
      alert("Nie udaÅ‚o siÄ™ zapisaÄ‡ trade. Screenshot jest prawdopodobnie za duÅ¼y.");
    }
  }, [trades, storageReady]);

 const journalTabs = [
  "PrzeglÄ…d",
  "Wszystkie trade'y",
  "Statystyki",
  "Strategie",
  "Screenshoty",
  "Ustawienia",
  "Trading Plan",
];

  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      if (filterPair && !t.pair.toLowerCase().includes(filterPair.toLowerCase())) return false;
      if (filterFrom && t.date < filterFrom) return false;
      if (filterTo && t.date > filterTo) return false;
      return true;
    });
  }, [trades, filterPair, filterFrom, filterTo]);

  const screenshotTrades = useMemo(() => trades.filter((t) => !!t.screenshot), [trades]);

const equityCurve = useMemo(() => {
  let cumulative = 0;

  return [...trades]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((trade) => {
      cumulative += trade.pnl;

      return {
        date: trade.date.slice(5),
        value: Number(cumulative.toFixed(2)),
      };
    });
}, [trades]);

  const performance = useMemo(() => {
    const total = trades.length;
    const wins = trades.filter((t) => t.resultR > 0).length;
    const losses = trades.filter((t) => t.resultR < 0).length;
    const be = trades.filter((t) => t.resultR === 0).length;

    const avgRR = total > 0 ? trades.reduce((sum, t) => sum + rrToNumber(t.rr), 0) / total : 0;
    const totalR = trades.reduce((sum, t) => sum + t.resultR, 0);
    const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
    const winRate = total > 0 ? (wins / total) * 100 : 0;

    const winningTrades = trades.filter((t) => t.resultR > 0);
    const losingTrades = trades.filter((t) => t.resultR < 0);

    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.resultR, 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? losingTrades.reduce((sum, t) => sum + t.resultR, 0) / losingTrades.length : 0;

    const grossWin = winningTrades.reduce((sum, t) => sum + t.resultR, 0);
    const grossLossAbs = Math.abs(losingTrades.reduce((sum, t) => sum + t.resultR, 0));
    const profitFactor = grossLossAbs > 0 ? grossWin / grossLossAbs : grossWin > 0 ? grossWin : 0;
    const expectancy = total > 0 ? totalR / total : 0;

    return {
      total,
      wins,
      losses,
      be,
      avgRR,
      totalR,
      totalPnl,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      expectancy,
    };
  }, [trades]);

  const tradingPlanCalc = useMemo(() => {
    const monthlyTarget = tradingPlan.accountBalance * (tradingPlan.monthlyGoalPercent / 100);
    const riskPerTrade = tradingPlan.accountBalance * (tradingPlan.riskPerTradePercent / 100);
    const dailyTarget = tradingPlan.tradingDays > 0 ? monthlyTarget / tradingPlan.tradingDays : 0;
    const weeklyTarget = dailyTarget * 5;
    const maxDailyLoss = riskPerTrade * tradingPlan.maxTradesPerDay;
    const targetPerTrade =
      tradingPlan.maxTradesPerDay > 0 ? dailyTarget / tradingPlan.maxTradesPerDay : 0;
    const maxLossPerTrade = riskPerTrade;
    const tradeRR = maxLossPerTrade > 0 ? targetPerTrade / maxLossPerTrade : 0;
    const requiredR = riskPerTrade > 0 ? dailyTarget / riskPerTrade : 0;
    const currentProgressPercent = monthlyTarget > 0 ? (performance.totalPnl / monthlyTarget) * 100 : 0;
    const remainingUsd = Math.max(monthlyTarget - performance.totalPnl, 0);
    const remainingPercent = Math.max(tradingPlan.monthlyGoalPercent - currentProgressPercent, 0);

    return {
      monthlyTarget,
      riskPerTrade,
      dailyTarget,
      weeklyTarget,
      maxDailyLoss,
      targetPerTrade,
      maxLossPerTrade,
      tradeRR,
      requiredR,
      currentProgressPercent,
      remainingUsd,
      remainingPercent,
    };
  }, [tradingPlan, performance.totalPnl]);


  const tradingCalendar = useMemo(() => {
    const [year, month] = calendarMonth.split("-").map(Number);

    const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
    const nextMonthDate = new Date(Date.UTC(year, month, 1));
    const nextMonth = `${nextMonthDate.getUTCFullYear()}-${String(
      nextMonthDate.getUTCMonth() + 1
    ).padStart(2, "0")}-01`;

    const dayMap = new Map<string, { pnl: number; trades: number }>();

    for (const trade of trades) {
      if (trade.date < monthStart || trade.date >= nextMonth) continue;
      const current = dayMap.get(trade.date) ?? { pnl: 0, trades: 0 };
      current.pnl += Number(trade.pnl) || 0;
      current.trades += 1;
      dayMap.set(trade.date, current);
    }

    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
    const mondayOffset = (firstWeekday + 6) % 7;

    const cells = Array.from({ length: mondayOffset + daysInMonth }, (_, index) => {
      if (index < mondayOffset) return null;

      const day = index - mondayOffset + 1;
      const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const result = dayMap.get(date);
      const pnl = result?.pnl ?? 0;
      const tradesCount = result?.trades ?? 0;

      const status: "TARGET" | "PARTIAL" | "LOSS" | "NO_TRADE" =
        tradesCount === 0
          ? "NO_TRADE"
          : pnl >= tradingPlanCalc.dailyTarget
          ? "TARGET"
          : pnl > 0
          ? "PARTIAL"
          : "LOSS";

      return { day, date, pnl, trades: tradesCount, status };
    });

    const tradedDays = [...dayMap.values()];
    const targetDays = tradedDays.filter((d) => d.pnl >= tradingPlanCalc.dailyTarget).length;
    const positiveDays = tradedDays.filter((d) => d.pnl > 0).length;
    const profit = tradedDays.reduce((sum, d) => sum + Math.max(d.pnl, 0), 0);
    const loss = tradedDays.reduce((sum, d) => sum + Math.min(d.pnl, 0), 0);
    const net = profit + loss;
    const winRate = tradedDays.length ? (positiveDays / tradedDays.length) * 100 : 0;

    const dated = [...dayMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, ...data }));

    let streak = 0;
    for (let i = dated.length - 1; i >= 0; i -= 1) {
      if (dated[i].pnl >= tradingPlanCalc.dailyTarget) streak += 1;
      else break;
    }

    return {
      year,
      month,
      cells,
      targetDays,
      tradedDays: tradedDays.length,
      profit,
      loss,
      net,
      winRate,
      streak,
    };
  }, [calendarMonth, trades, tradingPlanCalc.dailyTarget]);

  const changeCalendarMonth = (delta: number) => {
    setCalendarMonth((current) => {
      const [year, month] = current.split("-").map(Number);
      const next = new Date(Date.UTC(year, month - 1 + delta, 1));
      return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`;
    });
  };

  const pairStats = useMemo(() => {
    const map = new Map<string, number>();

    for (const trade of trades) {
      map.set(trade.pair, (map.get(trade.pair) || 0) + trade.resultR);
    }

    const arr = [...map.entries()].sort((a, b) => b[1] - a[1]);

    return {
      bestPair: arr[0] ?? null,
      worstPair: arr[arr.length - 1] ?? null,
    };
  }, [trades]);

  const aiInsight = useMemo(() => {
    if (!trades.length) return "Dodaj kilka tradeâ€™Ã³w, a pojawi siÄ™ analiza.";

    const bestPair = pairStats.bestPair;
    const worstPair = pairStats.worstPair;

    if (!bestPair || !worstPair) return "Za maÅ‚o danych do peÅ‚nej analizy.";

    return `Najlepsza para: ${bestPair[0]} (${bestPair[1].toFixed(2)}R). NajsÅ‚absza para: ${worstPair[0]} (${worstPair[1].toFixed(2)}R). Win rate: ${performance.winRate.toFixed(0)}%. Expectancy: ${performance.expectancy.toFixed(2)}R. Ogranicz sÅ‚absze pary i skup siÄ™ na setupach z najwyÅ¼szym expectancy.`;
  }, [trades, pairStats, performance.winRate, performance.expectancy]);

  const topStats = [
    { label: "Total Trades", value: String(performance.total), tone: "blue" },
    {
      label: "Winning Trades",
      value: String(performance.wins),
      sub: `${performance.winRate.toFixed(1)}%`,
      tone: "green",
    },
    {
      label: "Losing Trades",
      value: String(performance.losses),
      sub: `${performance.total ? ((performance.losses / performance.total) * 100).toFixed(1) : "0.0"}%`,
      tone: "red",
    },
    {
      label: "Total R",
      value: `${performance.totalR >= 0 ? "+" : ""}${performance.totalR.toFixed(2)}R`,
      tone: performance.totalR >= 0 ? "green" : "red",
    },
    {
      label: "Win Rate",
      value: `${performance.winRate.toFixed(1)}%`,
      tone: "blue",
    },
  ];

  const strategySummary = [
    { name: "Breakout", value: "+4,350 $", pct: 48, color: "bg-sky-400" },
    { name: "EMA Cross", value: "+4,100 $", pct: 38, color: "bg-cyan-300" },
    { name: "Reversal", value: "-2,830 $", pct: 31, color: "bg-rose-400" },
  ];

  const resetForm = () => {
    setForm({
      id: "",
      date: new Date().toISOString().slice(0, 10),
      pair: "XAUUSD",
      side: "BUY",
      entry: "",
      sl: "",
      tp: "",
      rr: "1:2",
      outcome: "WIN",
      resultR: 2,
      pnl: 0,
      notes: "",
      screenshot: "",
    });
    setEditingTradeId(null);
  };

  const startTradingPlan = () => {
    const activePlan = { ...tradingPlan, isActive: true };
    setTradingPlan(activePlan);
    localStorage.setItem(TRADING_PLAN_KEY, JSON.stringify(activePlan));
  };

  const restartTradingPlan = () => {
    const resetPlan = { ...tradingPlan, isActive: false };
    setTradingPlan(resetPlan);
    localStorage.setItem(TRADING_PLAN_KEY, JSON.stringify(resetPlan));
  };

  const openPreview = (img: string, tradeId?: string) => {
    const idx = screenshotTrades.findIndex((t) => t.id === tradeId);
    setPreviewIndex(idx >= 0 ? idx : 0);
    setPreviewImage(img);
  };

  const showPrevImage = () => {
    if (!screenshotTrades.length) return;
    const nextIndex = (previewIndex - 1 + screenshotTrades.length) % screenshotTrades.length;
    setPreviewIndex(nextIndex);
    setPreviewImage(screenshotTrades[nextIndex].screenshot || null);
  };

  const showNextImage = () => {
    if (!screenshotTrades.length) return;
    const nextIndex = (previewIndex + 1) % screenshotTrades.length;
    setPreviewIndex(nextIndex);
    setPreviewImage(screenshotTrades[nextIndex].screenshot || null);
  };

  const handleTopAction = (action: string) => {
    if (action === "Add Trade") {
      setShowAddTradeModal(true);
      return;
    }

    if (action === "Import Broker") {
      fileInputRef.current?.click();
      return;
    }

    if (action === "Export CSV") {
      const header = "date,pair,side,entry,sl,tp,rr,outcome,resultR,pnl,notes";
      const rows = trades.map((t) =>
        [t.date, t.pair, t.side, t.entry, t.sl, t.tp, t.rr, t.outcome, t.resultR, t.pnl, t.notes]
          .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
          .join(",")
      );

      const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "fxtrade-journal.csv";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || "");
        const lines = text.split(/\r?\n/).filter(Boolean);
        if (lines.length < 2) return;

        const imported = lines.slice(1).map((line) => {
          const [date, pair, side, entry, sl, tp, rr, outcome, resultR, pnl, notes] = parseCsvLine(line);

          return {
            id: crypto.randomUUID(),
            date: date || new Date().toISOString().slice(0, 10),
            pair: pair || "EURUSD",
            side: (side === "SELL" ? "SELL" : "BUY") as "BUY" | "SELL",
            entry: entry || "",
            sl: sl || "",
            tp: tp || "",
            rr: rr || "1:1",
            outcome: outcome === "LOSS" ? "LOSS" : outcome === "BE" ? "BE" : "WIN",
            resultR: Number(resultR || 0),
            pnl: Number(pnl || 0),
            notes: notes || "",
            screenshot: "",
          } satisfies JournalTrade;
        });

        setTrades((prev) => [...imported, ...prev]);
      } catch (err) {
        console.error(err);
        alert("Nie udaÅ‚o siÄ™ zaimportowaÄ‡ CSV.");
      } finally {
        e.target.value = "";
      }
    };

    reader.readAsText(file);
  };

  const handleSaveTrade = () => {
    const saveTradesToStorage = (nextTrades: JournalTrade[]) => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(nextTrades)
  );

  setTrades(nextTrades);
};
    if (!form.pair || !form.entry || !form.rr || !form.date) {
      alert("UzupeÅ‚nij wymagane pola: data, para, entry, RR.");
      return;
    }

    try {
      if (editingTradeId) {
        setTrades((prev) => prev.map((t) => (t.id === editingTradeId ? { ...form, id: editingTradeId } : t)));
      } else {
        const nextTrade: JournalTrade = { ...form, id: crypto.randomUUID() };
        setTrades((prev) => [nextTrade, ...prev]);
      }

      setShowAddTradeModal(false);
      resetForm();
      setActiveJournalTab("Wszystkie trade'y");
    } catch (err) {
      console.error(err);
      alert("Nie udaÅ‚o siÄ™ zapisaÄ‡ trade.");
    }
  };

  const handleDeleteTrade = (id: string) => {
    setTrades((prev) => prev.filter((t) => t.id !== id));
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxWidth = 1200;
        const scale = Math.min(1, maxWidth / img.width);

        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL("image/jpeg", 0.7);

        setForm((prev) => ({ ...prev, screenshot: compressed }));
      };

      img.src = String(reader.result || "");
    };

    reader.readAsDataURL(file);
  };

  const weekdayPerformance = useMemo(() => {
    const names = ["Niedz", "Pon", "Wt", "Åšr", "Czw", "Pt", "Sob"];
    const sums = Array.from({ length: 7 }, () => 0);

    for (const trade of trades) {
      const date = new Date(`${trade.date}T12:00:00`);
      if (!Number.isNaN(date.getTime())) {
        sums[date.getDay()] += trade.resultR;
      }
    }

    const items = [1, 2, 3, 4, 5, 6, 0].map((day) => ({
      label: names[day],
      value: Number(sums[day].toFixed(2)),
    }));

    return {
      items,
      maxAbs: Math.max(...items.map((item) => Math.abs(item.value)), 1),
    };
  }, [trades]);

  const avgDurationLabel = "2h 35m";
  const maxProfitR = trades.length ? Math.max(...trades.map((t) => t.resultR)) : 0;
  const maxLossR = trades.length ? Math.min(...trades.map((t) => t.resultR)) : 0;

  const maxEquity = Math.max(...equityCurve.map((p) => p.value), 1);
  const minEquity = Math.min(...equityCurve.map((p) => p.value), 0);
  const range = Math.max(maxEquity - minEquity, 1);

  const points = equityCurve
    .map((point, i) => {
      const x = 40 + (i * 760) / Math.max(equityCurve.length - 1, 1);
      const y = 280 - ((point.value - minEquity) / range) * 220;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="relative isolate overflow-hidden min-h-screen w-full text-white" style={{ backgroundColor: "#020817" }}>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "linear-gradient(rgba(2,8,23,.50), rgba(2,8,23,.72)), url('/journal-glow-bg.png')",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(circle_at_50%_18%,rgba(14,165,233,.12),transparent_46%)]"
      />
      <div className="relative z-10">
      <main className="relative px-4 py-5 md:px-6 xl:px-8 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-[420px] before:bg-[radial-gradient(circle_at_50%_0%,rgba(56,189,248,.10),transparent_62%)]">
        <div className="mx-auto w-full max-w-[1920px]">
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleImportCsv} />

          <div className="mb-4 flex flex-col gap-4 border-b border-[#0a417b] pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-[28px] font-semibold tracking-tight md:text-[34px]">
                FX Trade Journal <span className="text-[#20a8ff]">PRO</span>
              </h1>
              <p className="mt-1 text-[12px] text-sky-100/55 md:text-sm">
                Zaawansowany dziennik transakcji, statystyki i analiza strategii.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => handleTopAction("Add Trade")}
                className="rounded-[10px] border border-sky-400/50 bg-[linear-gradient(180deg,#0b79df,#075bb8)] px-4 py-2.5 text-[12px] font-semibold text-white shadow-[0_0_20px_rgba(14,165,233,.18)] transition hover:brightness-110"
              >
                + Dodaj Trade
              </button>
              <button
                onClick={() => handleTopAction("Import Broker")}
                className="rounded-[10px] border border-sky-400/30 bg-[linear-gradient(180deg,#083866,#06254b)] px-4 py-2.5 text-[12px] font-semibold text-sky-50 transition hover:bg-[#0a3264]"
              >
                Import Broker
              </button>
              <button
                onClick={() => handleTopAction("Export CSV")}
                className="rounded-[10px] border border-sky-400/30 bg-[linear-gradient(180deg,#083866,#06254b)] px-4 py-2.5 text-[12px] font-semibold text-sky-50 transition hover:bg-[#0a3264]"
              >
                Eksport CSV
              </button>
            </div>
          </div>

          <div className="grid gap-3 2xl:grid-cols-[1.85fr_.72fr]">
            <section className="rounded-[14px] border border-sky-400/35 bg-[linear-gradient(145deg,rgba(10,67,126,.96)_0%,rgba(4,31,64,.98)_62%,rgba(3,23,47,.98)_100%)] shadow-[0_16px_45px_rgba(0,0,0,.18),0_0_26px_rgba(14,165,233,.07),inset_0_1px_0_rgba(255,255,255,.05)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.035)]">
              <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-[18px] font-semibold">Equity Curve</h2>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-sky-400/30 bg-[linear-gradient(180deg,#07345f,#052348)] shadow-[0_8px_24px_rgba(0,0,0,.14),inset_0_1px_0_rgba(255,255,255,.04)] text-[10px] text-sky-200/60">i</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <select className="rounded-[8px] border border-sky-400/30 bg-[linear-gradient(180deg,#07345f,#052348)] shadow-[0_8px_24px_rgba(0,0,0,.14),inset_0_1px_0_rgba(255,255,255,.04)] px-3 py-2 text-[10px] text-sky-100/75 outline-none">
                    <option>Wszystkie konta</option>
                  </select>

                  {["D", "W", "M", "Y", "All"].map((range) => (
                    <button
                      key={range}
                      className={`h-8 min-w-8 rounded-[7px] border px-2 text-[10px] font-semibold ${
                        range === "W"
                          ? "border-sky-400/50 bg-[#1269e8] text-white"
                          : "border-[#0d579e] bg-[#052348] text-sky-100/65"
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative h-[340px] overflow-hidden rounded-[10px] border border-sky-400/20 bg-[radial-gradient(circle_at_top,rgba(14,165,233,.07),transparent_45%),#031a36] p-4">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,.04)_1px,transparent_1px)] bg-[size:100%_52px,64px_100%] opacity-45" />

                <div className="relative h-full w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={equityCurve}>
                      <defs>
                        <linearGradient id="equityFillPremium" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1689ff" stopOpacity={0.34} />
                          <stop offset="100%" stopColor="#1689ff" stopOpacity={0} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid stroke="rgba(56,189,248,0.07)" strokeDasharray="4 4" />

                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#7da6c8", fontSize: 10 }}
                      />

                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#7da6c8", fontSize: 10 }}
                        tickFormatter={(v) => `$${v}`}
                      />

                      <Tooltip
                        formatter={(v: number) => [`$${v}`, "Equity"]}
                        contentStyle={{
                          background: "#041b36",
                          border: "1px solid #0d579e",
                          borderRadius: "10px",
                          color: "#fff",
                          fontSize: "11px",
                        }}
                      />

                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#1689ff"
                        strokeWidth={3}
                        fill="url(#equityFillPremium)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="pointer-events-none absolute right-3 top-8 flex flex-col gap-[28px] text-[9px] text-sky-100/45">
                  <span>1.00R</span>
                  <span>0.75R</span>
                  <span>0.50R</span>
                  <span>0.25R</span>
                  <span>0.00R</span>
                  <span>-0.25R</span>
                  <span>-0.50R</span>
                </div>
              </div>
            </section>

            <section className="space-y-2.5">
              {topStats.map((stat) => (
                <div
                  key={stat.label}
                  className="relative overflow-hidden rounded-[12px] border border-sky-400/30 bg-[linear-gradient(180deg,rgba(9,67,126,.96)_0%,rgba(5,35,73,.98)_100%)] shadow-[0_12px_34px_rgba(0,0,0,.16),0_0_22px_rgba(14,165,233,.06),inset_0_1px_0_rgba(255,255,255,.045)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,.03)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] text-sky-100/55">{stat.label}</p>
                      <div className="mt-1 flex items-end gap-2">
                        <p
                          className={`text-[22px] font-semibold ${
                            stat.tone === "green"
                              ? "text-emerald-200"
                              : stat.tone === "red"
                              ? "text-red-300"
                              : "text-white"
                          }`}
                        >
                          {stat.value}
                        </p>
                        {stat.sub ? (
                          <span
                            className={`mb-1 text-[10px] font-semibold ${
                              stat.tone === "green"
                                ? "text-emerald-200"
                                : stat.tone === "red"
                                ? "text-red-300"
                                : "text-sky-300"
                            }`}
                          >
                            {stat.sub}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="h-7 w-20 opacity-90">
                      <svg viewBox="0 0 80 28" className="h-full w-full">
                        <polyline
                          points="0,21 10,17 18,20 29,11 38,14 48,7 59,12 70,4 80,8"
                          fill="none"
                          stroke={stat.tone === "red" ? "#fb7185" : "#1689ff"}
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          </div>

          <section className="mt-3 rounded-[12px] border border-sky-400/30 bg-[linear-gradient(180deg,#07345f,#052348)] shadow-[0_8px_24px_rgba(0,0,0,.14),inset_0_1px_0_rgba(255,255,255,.04)] p-2">
            <div className="flex flex-wrap gap-3">
         {journalTabs.map((tab) => {
  const active = activeJournalTab === tab;
  const isTradingPlan = tab === "Trading Plan";

  return (
    <button
      key={tab}
      onClick={() => setActiveJournalTab(tab)}
      className={`rounded-[9px] px-4 py-2 text-[11px] font-medium transition ${
        isTradingPlan
          ? active
            ? "border border-sky-400/50 bg-[#1269e8] text-white shadow-[0_0_18px_rgba(14,165,233,.22)]"
            : "border border-sky-400/30 bg-[linear-gradient(180deg,#083866,#06254b)] text-sky-200 hover:bg-[#0a3264]"
          : active
          ? "border border-sky-400/50 bg-[#0b5db5] text-white shadow-[0_0_18px_rgba(14,165,233,.18)]"
          : "border border-sky-300/30 bg-[#041f40] text-sky-100/70 hover:bg-[#0a3264]"
      } ${
        ""
      }`}
    >
      {tab}
    </button>
  );
})}
            </div>
          </section>

          {(activeJournalTab === "PrzeglÄ…d" || activeJournalTab === "Wszystkie trade'y") && (
            <section className="mt-3 overflow-hidden rounded-[12px] border border-sky-400/30 bg-[linear-gradient(180deg,rgba(9,67,126,.96)_0%,rgba(5,35,73,.98)_100%)] shadow-[0_12px_34px_rgba(0,0,0,.16),0_0_22px_rgba(14,165,233,.06),inset_0_1px_0_rgba(255,255,255,.045)] p-3">
              <div className="mb-4 flex flex-wrap gap-3">
                <input placeholder="Pair (np. XAUUSD)" value={filterPair} onChange={(e) => setFilterPair(e.target.value)} className="rounded-[8px] border border-sky-300/35 bg-[linear-gradient(145deg,#06294f,#041b36)] px-3 py-2 text-[11px] outline-none placeholder:text-sky-100/35" />
                <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="rounded-[8px] border border-sky-300/35 bg-[linear-gradient(145deg,#06294f,#041b36)] px-3 py-2 text-[11px] outline-none placeholder:text-sky-100/35" />
                <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="rounded-[8px] border border-sky-300/35 bg-[linear-gradient(145deg,#06294f,#041b36)] px-3 py-2 text-[11px] outline-none placeholder:text-sky-100/35" />
                <button onClick={() => { setFilterPair(""); setFilterFrom(""); setFilterTo(""); }} className="rounded-[8px] border border-sky-300/30 bg-[#0a3264] px-3 py-2 text-[11px] text-sky-50">
                  Reset
                </button>
              </div>

              <TradeTable
                trades={filteredTrades}
                onPreview={openPreview}
                onEdit={(trade) => {
                  setEditingTradeId(trade.id);
                  setForm(trade);
                  setShowAddTradeModal(true);
                }}
                onDelete={handleDeleteTrade}
              />
            </section>
          )}

          {activeJournalTab === "PrzeglÄ…d" && (
            <>
              <div className="mt-3 grid gap-3 xl:grid-cols-3">
                <section className="rounded-[12px] border border-sky-400/30 bg-[radial-gradient(circle_at_15%_10%,rgba(125,211,252,.18),transparent_30%),linear-gradient(145deg,rgba(24,90,145,.98),rgba(9,54,94,.98))] shadow-[0_12px_32px_rgba(0,0,0,.16),0_0_20px_rgba(14,165,233,.055),inset_0_1px_0_rgba(255,255,255,.04)] p-4">
                  <h2 className="mb-3 text-[16px] font-semibold">Strategie Performance</h2>
                  <div className="space-y-2">
                    {strategySummary.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between rounded-[9px] border border-sky-400/20 bg-[linear-gradient(145deg,#06284d,#041b36)] shadow-[inset_0_1px_0_rgba(255,255,255,.025)] px-3 py-2.5"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`h-3 w-3 rounded-full ${item.color}`} />
                          <div>
                            <p className="text-[12px] font-medium">{item.name}</p>
                            <p className="text-[9px] text-sky-100/45">{item.pct}% udziaÅ‚u</p>
                          </div>
                        </div>

                        <p className={`text-[13px] font-semibold ${item.value.startsWith("-") ? "text-rose-400" : "text-emerald-400"}`}>
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-[12px] border border-sky-400/30 bg-[radial-gradient(circle_at_15%_10%,rgba(125,211,252,.18),transparent_30%),linear-gradient(145deg,rgba(24,90,145,.98),rgba(9,54,94,.98))] shadow-[0_12px_32px_rgba(0,0,0,.16),0_0_20px_rgba(14,165,233,.055),inset_0_1px_0_rgba(255,255,255,.04)] p-4">
                  <h2 className="mb-3 text-[16px] font-semibold">AI Analiza</h2>

                  <div className="grid gap-3 md:grid-cols-[120px_1fr]">
                    <div className="flex min-h-[128px] items-center justify-center overflow-hidden rounded-[10px] border border-sky-300/30 bg-[#031a36]">
  <img
    src="/fx-ai-analysis.png"
    alt="AI Analiza"
    className="h-full w-full object-cover"
  />
</div>

                    <div>
                      <div className="rounded-[9px] border border-sky-300/35 bg-sky-500/[0.08] p-3 text-[11px] leading-5 text-sky-50/80">
                        {aiInsight}
                      </div>
                      <p className="mt-3 text-[10px] leading-4 text-sky-100/45">
                        Analiza aktualizuje siÄ™ automatycznie na podstawie Twoich zapisanych transakcji.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="rounded-[12px] border border-sky-400/30 bg-[radial-gradient(circle_at_15%_10%,rgba(125,211,252,.18),transparent_30%),linear-gradient(145deg,rgba(24,90,145,.98),rgba(9,54,94,.98))] shadow-[0_12px_32px_rgba(0,0,0,.16),0_0_20px_rgba(14,165,233,.055),inset_0_1px_0_rgba(255,255,255,.04)] p-4">
                  <h2 className="mb-4 text-[16px] font-semibold">Najlepsze dni tygodnia</h2>

                  <div className="flex h-[150px] items-end justify-between gap-2 border-b border-[#0a417b] px-1 pb-2">
                    {weekdayPerformance.items.map((day) => {
                      const height = Math.max(10, (Math.abs(day.value) / weekdayPerformance.maxAbs) * 105);
                      const positive = day.value >= 0;

                      return (
                        <div key={day.label} className="flex flex-1 flex-col items-center justify-end gap-2">
                          <span className={`text-[9px] font-semibold ${positive ? "text-sky-100/70" : "text-rose-300"}`}>
                            {day.value > 0 ? "+" : ""}{day.value.toFixed(2)}R
                          </span>
                          <div
                            className={`w-full max-w-[34px] rounded-t-[5px] ${
                              positive
                                ? "bg-[linear-gradient(180deg,#1689ff,#0753a6)]"
                                : "bg-[linear-gradient(180deg,#fb7185,#9f1239)]"
                            }`}
                            style={{ height }}
                          />
                          <span className="text-[9px] text-sky-100/50">{day.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>

              <div className="mt-3 grid gap-3 xl:grid-cols-[2.1fr_.85fr]">
                <section className="rounded-[12px] border border-sky-400/30 bg-[radial-gradient(circle_at_15%_10%,rgba(125,211,252,.18),transparent_30%),linear-gradient(145deg,rgba(24,90,145,.98),rgba(9,54,94,.98))] shadow-[0_12px_32px_rgba(0,0,0,.16),0_0_20px_rgba(14,165,233,.055),inset_0_1px_0_rgba(255,255,255,.04)] p-4">
                  <h2 className="mb-3 text-[16px] font-semibold">Twoje statystyki w skrÃ³cie</h2>

                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
                    {[
                      ["Åšredni RR", performance.avgRR.toFixed(2), "text-white"],
                      ["Åšredni czas trwania", avgDurationLabel, "text-white"],
                      ["Maksymalny profit", `${maxProfitR >= 0 ? "+" : ""}${maxProfitR.toFixed(2)}R`, "text-emerald-300"],
                      ["Maksymalna strata", `${maxLossR.toFixed(2)}R`, "text-rose-300"],
                      ["Profit Factor", performance.profitFactor.toFixed(2), "text-white"],
                      ["Expectancy", `${performance.expectancy >= 0 ? "+" : ""}${performance.expectancy.toFixed(2)}R`, "text-emerald-300"],
                    ].map(([label, value, tone]) => (
                      <div key={label} className="rounded-[9px] border border-sky-400/20 bg-[linear-gradient(145deg,#06284d,#041b36)] shadow-[inset_0_1px_0_rgba(255,255,255,.025)] px-3 py-3">
                        <p className="text-[9px] text-sky-100/45">{label}</p>
                        <p className={`mt-1 text-[16px] font-semibold ${tone}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="flex min-h-[120px] items-center rounded-[12px] border border-sky-400/30 bg-[radial-gradient(circle_at_15%_10%,rgba(125,211,252,.18),transparent_30%),linear-gradient(145deg,rgba(24,90,145,.98),rgba(9,54,94,.98))] shadow-[0_12px_32px_rgba(0,0,0,.16),0_0_20px_rgba(14,165,233,.055),inset_0_1px_0_rgba(255,255,255,.04)] p-5">
                  <div>
                    <div className="text-[36px] leading-none text-[#20a8ff]">â€œ</div>
                    <p className="text-[13px] italic leading-6 text-sky-50/80">
                      Dyscyplina w planie, konsekwencja w dziaÅ‚aniu, wolnoÅ›Ä‡ w Å¼yciu.
                    </p>
                    <p className="mt-2 text-[10px] text-sky-100/45">â€“ FX Trade Premium</p>
                  </div>
                </section>
              </div>
            </>
          )}

          {activeJournalTab === "Trading Plan" && (
            <section className="mt-6 overflow-hidden rounded-[22px] border border-cyan-400/45 bg-[radial-gradient(circle_at_12%_0%,rgba(34,211,238,.12),transparent_28%),radial-gradient(circle_at_88%_100%,rgba(37,99,235,.14),transparent_30%),linear-gradient(145deg,#082f5b_0%,#041c39_100%)] shadow-[0_0_0_1px_rgba(56,189,248,.08),0_0_28px_rgba(34,211,238,.16),0_24px_80px_rgba(0,0,0,.28),inset_0_1px_0_rgba(255,255,255,.06)]">
              <div className="p-5 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/60 bg-[radial-gradient(circle_at_35%_25%,rgba(34,211,238,.18),transparent_38%),linear-gradient(145deg,#0b4f83,#062957)] shadow-[0_0_12px_rgba(34,211,238,.28),0_0_34px_rgba(14,165,233,.28),inset_0_1px_0_rgba(255,255,255,.08)]">
                      <Target className="h-7 w-7 text-sky-300" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-[28px] font-black tracking-tight md:text-[34px]">
                          Trading <span className="text-[#20a8ff]">Plan</span>
                        </h2>

                        {tradingPlan.isActive ? (
                          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-300">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.8)]" />
                            Plan Aktywny
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-sky-300/35 bg-sky-500/10 px-3 py-1.5 text-[11px] font-bold text-sky-300">
                            Konfiguracja
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-[12px] text-sky-100/50">
                        Oblicz dzienny target, ryzyko i plan na miesiÄ…c.
                      </p>
                    </div>
                  </div>

                  {tradingPlan.isActive ? (
                    <button
                      onClick={restartTradingPlan}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-5 py-3 text-[12px] font-bold text-rose-300 transition hover:bg-rose-500/15"
                    >
                      <RefreshCcw className="h-4 w-4" /> Restart Plan
                    </button>
                  ) : (
                    <button
                      onClick={startTradingPlan}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[linear-gradient(90deg,#1aa7ec,#2563eb)] px-6 py-3 text-[12px] font-black text-white shadow-[0_0_18px_rgba(34,211,238,.22),0_10px_30px_rgba(37,99,235,.34)] transition hover:brightness-110 hover:shadow-[0_0_26px_rgba(34,211,238,.34),0_12px_36px_rgba(37,99,235,.38)]"
                    >
                      <Play className="h-4 w-4" /> Start Trading Plan
                    </button>
                  )}
                </div>

                {!tradingPlan.isActive ? (
                  <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
                    <div className="mx-auto max-w-[1480px] rounded-[20px] border border-cyan-300/45 bg-[radial-gradient(circle_at_10%_0%,rgba(34,211,238,.12),transparent_26%),radial-gradient(circle_at_92%_100%,rgba(37,99,235,.16),transparent_30%),linear-gradient(145deg,#082d50,#051d36)] p-5 shadow-[0_0_0_1px_rgba(56,189,248,.06),0_0_26px_rgba(34,211,238,.15),0_18px_46px_rgba(0,0,0,.24),inset_0_1px_0_rgba(255,255,255,.06)]">
                      <div className="mb-5 flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-[18px] font-bold">Plan Parameters</h3>
                          <p className="mt-1 text-[10px] text-sky-100/40">
                            Ustaw parametry planu przed aktywacjÄ….
                          </p>
                        </div>
                        <span className="rounded-lg border border-sky-400/20 bg-sky-500/10 px-3 py-2 text-[10px] text-sky-300">
                          <SlidersHorizontal className="mr-1 inline h-3.5 w-3.5" />
                          PARAMETRY
                        </span>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <PlanInput
                          label="Account Balance"
                          value={tradingPlan.accountBalance}
                          suffix="USD"
                          onChange={(value) =>
                            setTradingPlan((prev) => ({ ...prev, accountBalance: value }))
                          }
                        />

                        <PlanInput
                          label="Monthly Goal"
                          value={tradingPlan.monthlyGoalPercent}
                          suffix="%"
                          onChange={(value) =>
                            setTradingPlan((prev) => ({ ...prev, monthlyGoalPercent: value }))
                          }
                        />

                        <PlanInput
                          label="Risk Per Trade"
                          value={tradingPlan.riskPerTradePercent}
                          suffix="%"
                          onChange={(value) =>
                            setTradingPlan((prev) => ({ ...prev, riskPerTradePercent: value }))
                          }
                        />

                        <PlanInput
                          label="Trading Days"
                          value={tradingPlan.tradingDays}
                          suffix="Days"
                          onChange={(value) =>
                            setTradingPlan((prev) => ({ ...prev, tradingDays: value }))
                          }
                        />

                        <PlanInput
                          label="Max Trades / Day"
                          value={tradingPlan.maxTradesPerDay}
                          suffix="Trades"
                          onChange={(value) =>
                            setTradingPlan((prev) => ({ ...prev, maxTradesPerDay: value }))
                          }
                        />

                        <div>
                          <label className="mb-2 block text-[11px] text-sky-100/55">
                            Include Weekends
                          </label>
                          <button
                            onClick={() =>
                              setTradingPlan((prev) => ({
                                ...prev,
                                includeWeekends: !prev.includeWeekends,
                              }))
                            }
                            className={`w-full rounded-[10px] border px-4 py-3 text-left text-[12px] ${
                              tradingPlan.includeWeekends
                                ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
                                : "border-[#0d579e] bg-[#03182f] text-sky-100/60"
                            }`}
                          >
                            {tradingPlan.includeWeekends ? "Yes" : "No"}
                          </button>
                        </div>
                      </div>

                      <div className="mt-5 rounded-xl border border-amber-400/15 bg-amber-500/[0.06] px-4 py-3 text-[10px] text-amber-200/80">
                        ðŸ’¡ Zasada: maÅ‚e ryzyko, konsekwencja, dÅ‚ugoterminowy zysk.
                      </div>
                    </div>

                    <div className="rounded-[18px] border border-cyan-300/40 bg-[radial-gradient(circle_at_12%_4%,rgba(125,211,252,.20),transparent_28%),radial-gradient(circle_at_88%_95%,rgba(37,99,235,.20),transparent_34%),linear-gradient(145deg,#155a91,#0a365f)] shadow-[0_0_18px_rgba(34,211,238,.12),0_14px_36px_rgba(0,0,0,.20),inset_0_1px_0_rgba(255,255,255,.08)] p-5">
                      <div className="mb-5 flex items-center gap-3">
                        <Target className="h-5 w-5 text-sky-300" />
                        <h3 className="text-[18px] font-bold">Target Preview</h3>
                      </div>

                      <PlanRow label="Daily Target" value={`${tradingPlanCalc.dailyTarget.toFixed(2)} USD`} green />
                      <PlanRow label="Target / Trade" value={`${tradingPlanCalc.targetPerTrade.toFixed(2)} USD`} green />
                      <PlanRow label="Max Loss / Trade" value={`${tradingPlanCalc.maxLossPerTrade.toFixed(2)} USD`} red />
                      <PlanRow label="Risk : Reward / Trade" value={`1 : ${tradingPlanCalc.tradeRR.toFixed(2)}`} blue />
                      <PlanRow label="Weekly Target" value={`${tradingPlanCalc.weeklyTarget.toFixed(2)} USD`} green />
                      <PlanRow label="Monthly Target" value={`${tradingPlanCalc.monthlyTarget.toFixed(2)} USD`} green />
                      <PlanRow label="Max Daily Loss" value={`${tradingPlanCalc.maxDailyLoss.toFixed(2)} USD`} red />
                      <PlanRow label="Risk Per Trade" value={`${tradingPlanCalc.riskPerTrade.toFixed(2)} USD`} />
                      <PlanRow label="Required R / Day" value={`${tradingPlanCalc.requiredR.toFixed(2)}R`} blue />

                      <button
                        onClick={startTradingPlan}
                        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(90deg,#1aa7ec,#2563eb)] px-5 py-4 text-[12px] font-black text-white shadow-[0_0_18px_rgba(34,211,238,.20),0_10px_30px_rgba(37,99,235,.32)]"
                      >
                        <Play className="h-4 w-4" /> Start Trading Plan
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* KPI */}
                    <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-[repeat(5,minmax(0,1fr))_1.15fr]">
                      <PlanStat
                        label="Monthly Goal"
                        value={`${tradingPlan.monthlyGoalPercent}%`}
                        sub={`${tradingPlanCalc.monthlyTarget.toFixed(2)} USD`}
                        green
                        icon={<Target className="h-5 w-5" />}
                      />
                      <PlanStat
                        label="Current Progress"
                        value={`${tradingPlanCalc.currentProgressPercent.toFixed(2)}%`}
                        sub={`${performance.totalPnl.toFixed(2)} USD`}
                        green
                        icon={<TrendingUp className="h-5 w-5" />}
                      />
                      <PlanStat
                        label="Remaining"
                        value={`${tradingPlanCalc.remainingPercent.toFixed(2)}%`}
                        sub={`${tradingPlanCalc.remainingUsd.toFixed(2)} USD`}
                        blue
                        icon={<PieChart className="h-5 w-5" />}
                      />
                      <PlanStat
                        label="Days Left"
                        value={`${tradingPlan.tradingDays}`}
                        sub="Trading days"
                        icon={<CalendarDays className="h-5 w-5" />}
                      />
                      <PlanStat
                        label="Consistency"
                        value="78%"
                        sub="Good"
                        green
                        icon={<ShieldCheck className="h-5 w-5" />}
                      />

                      <div className="flex min-h-[145px] flex-col items-center justify-center rounded-[16px] border border-cyan-400/35 bg-[radial-gradient(circle_at_50%_20%,rgba(34,211,238,.12),transparent_55%),#041b36] p-4 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10 text-3xl text-emerald-300 shadow-[0_0_26px_rgba(52,211,153,.22)]">
                          <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <h3 className="mt-3 text-[16px] font-black">Trading Plan Active</h3>
                        <p className="mt-1 text-[10px] text-sky-100/40">
                          Your strategy is ready to execute
                        </p>
                      </div>
                    </div>

                    {/* Main dashboard */}
                    <div className="mt-4 grid gap-4 xl:grid-cols-[1.12fr_.9fr_.95fr_.82fr]">
                      <PlanPanel title="Plan Parameters" icon={<SlidersHorizontal className="h-5 w-5 text-sky-400" />}>
                        <IconPlanRow icon={<WalletCards className="h-4 w-4" />} label="Account Balance" value={`${tradingPlan.accountBalance.toFixed(2)} USD`} />
                        <IconPlanRow
                          icon={<ShieldCheck className="h-4 w-4" />}
                          label="Risk Per Trade"
                          value={`${tradingPlan.riskPerTradePercent}% (${tradingPlanCalc.riskPerTrade.toFixed(2)} USD)`}
                        />
                        <IconPlanRow
                          icon={<Target className="h-4 w-4" />}
                          label="Monthly Goal"
                          value={`${tradingPlan.monthlyGoalPercent}% (${tradingPlanCalc.monthlyTarget.toFixed(2)} USD)`}
                        />
                        <IconPlanRow icon={<CalendarDays className="h-4 w-4" />} label="Trading Days" value={`${tradingPlan.tradingDays} Days`} />
                        <IconPlanRow icon={<BarChart3 className="h-4 w-4" />} label="Max Trades / Day" value={`${tradingPlan.maxTradesPerDay} Trades`} />
                        <IconPlanRow icon={<CalendarDays className="h-4 w-4" />} label="Include Weekends" value={tradingPlan.includeWeekends ? "Yes" : "No"} />

                        <button
                          onClick={() =>
                            setTradingPlan((prev) => ({ ...prev, isActive: false }))
                          }
                          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-blue-400/20 bg-blue-500/10 px-3 py-2 text-[10px] font-bold text-blue-300"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit Plan
                        </button>
                      </PlanPanel>

                      <PlanPanel title="Target Summary" icon={<Target className="h-5 w-5 text-sky-400" />}>
                        <PlanRow label="Daily Target" value={`${tradingPlanCalc.dailyTarget.toFixed(2)} USD`} green />
                        <PlanRow label="Target / Trade" value={`${tradingPlanCalc.targetPerTrade.toFixed(2)} USD`} green />
                        <PlanRow label="Max Loss / Trade" value={`${tradingPlanCalc.maxLossPerTrade.toFixed(2)} USD`} red />
                        <PlanRow label="Risk : Reward / Trade" value={`1 : ${tradingPlanCalc.tradeRR.toFixed(2)}`} blue />
                        <PlanRow label="Weekly Target" value={`${tradingPlanCalc.weeklyTarget.toFixed(2)} USD`} green />
                        <PlanRow label="Monthly Target" value={`${tradingPlanCalc.monthlyTarget.toFixed(2)} USD`} green />
                        <PlanRow label="Max Daily Loss" value={`${tradingPlanCalc.maxDailyLoss.toFixed(2)} USD`} red />
                        <PlanRow label="Risk Per Trade" value={`${tradingPlanCalc.riskPerTrade.toFixed(2)} USD`} />
                        <PlanRow label="Required R / Day" value={`${tradingPlanCalc.requiredR.toFixed(2)}R`} blue />
                      </PlanPanel>

                      <PlanPanel title="Daily Progress" icon={<LineChart className="h-5 w-5 text-sky-400" />}>
                        <div className="grid grid-cols-3 gap-3 text-[10px]">
                          <div>
                            <p className="text-sky-100/40">Daily Goal</p>
                            <p className="mt-1 font-bold text-emerald-300">
                              {tradingPlanCalc.dailyTarget.toFixed(2)} USD
                            </p>
                          </div>
                          <div>
                            <p className="text-sky-100/40">Current P&L</p>
                            <p className={performance.totalPnl >= 0 ? "mt-1 font-bold text-emerald-300" : "mt-1 font-bold text-rose-300"}>
                              {performance.totalPnl.toFixed(2)} USD
                            </p>
                          </div>
                          <div>
                            <p className="text-sky-100/40">Remaining</p>
                            <p className="mt-1 font-bold text-blue-400">
                              {tradingPlanCalc.remainingUsd.toFixed(2)} USD
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,#34d399,#22d3ee)] shadow-[0_0_16px_rgba(34,211,238,.28)]"
                            style={{
                              width: `${Math.min(Math.max(tradingPlanCalc.currentProgressPercent, 0), 100)}%`,
                            }}
                          />
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                          <div className="rounded-xl border border-sky-400/20 bg-[radial-gradient(circle_at_20%_10%,rgba(125,211,252,.16),transparent_32%),linear-gradient(145deg,#15578d,#0b3b68)] p-4">
                            <div className="flex items-center gap-2 text-[10px] text-sky-100/40">
                              <BarChart3 className="h-4 w-4 text-sky-400" />
                              Trades Today
                            </div>
                            <p className="mt-2 text-2xl font-black">
                              {Math.min(trades.length, tradingPlan.maxTradesPerDay)} / {tradingPlan.maxTradesPerDay}
                            </p>
                          </div>

                          <div className="rounded-xl border border-sky-400/20 bg-[radial-gradient(circle_at_20%_10%,rgba(125,211,252,.16),transparent_32%),linear-gradient(145deg,#15578d,#0b3b68)] p-4">
                            <div className="flex items-center gap-2 text-[10px] text-sky-100/40">
                              <Zap className="h-4 w-4 text-blue-400" />
                              Max Trades
                            </div>
                            <p className="mt-2 text-2xl font-black">{tradingPlan.maxTradesPerDay}</p>
                          </div>
                        </div>
                      </PlanPanel>

                      <div className="space-y-3">
                        <MiniPlanBox label="Max Trades / Day" value={String(tradingPlan.maxTradesPerDay)} />
                        <MiniPlanBox label="Daily Target" value={`${tradingPlanCalc.dailyTarget.toFixed(2)} USD`} />

                        <PlanPanel title="Daily Rules" icon={<ShieldCheck className="h-5 w-5 text-sky-400" />}>
                          <Checklist text="Max trades per day" />
                          <Checklist text="No revenge trading" />
                          <Checklist text="RR minimum 1:2" failed />
                          <Checklist text="Follow session bias" />
                          <Checklist text="No trading outside plan" />
                        </PlanPanel>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 grid gap-3 rounded-[16px] border border-sky-300/30 bg-[radial-gradient(circle_at_15%_50%,rgba(125,211,252,.15),transparent_28%),linear-gradient(90deg,#104b7d,#17639d)] p-4 md:grid-cols-2 xl:grid-cols-[1.6fr_repeat(4,1fr)]">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 text-2xl">
                          <Trophy className="h-6 w-6 text-cyan-300" />
                        </div>
                        <div>
                          <p className="text-[12px] font-black">
                            Handluj wedÅ‚ug planu â€“ emocje zostaw poza rynkiem.
                          </p>
                          <p className="mt-1 text-[10px] text-sky-100/40">
                            Konsekwencja tworzy wyniki.
                          </p>
                        </div>
                      </div>

                      {[
                        { icon: ShieldCheck, title: "Dyscyplina", desc: "Klucz do sukcesu" },
                        { icon: BarChart3, title: "Konsekwencja", desc: "Codzienna przewaga" },
                        { icon: Brain, title: "Psychologia", desc: "Kontrola emocji" },
                        { icon: Gem, title: "DÅ‚ugoterminowy zysk", desc: "TwÃ³j cel" },
                      ].map(({ icon: Icon, title, desc }) => (
                        <div
                          key={title}
                          className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-3"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-400/15 bg-blue-500/10">
                            <Icon className="h-4 w-4 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black">{title}</p>
                            <p className="mt-1 text-[9px] text-sky-100/40">{desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            
                <div className="mt-5">
                  <TradingPlanCalendar
                    data={tradingCalendar}
                    dailyTarget={tradingPlanCalc.dailyTarget}
                    onPrev={() => changeCalendarMonth(-1)}
                    onNext={() => changeCalendarMonth(1)}
                  />
                </div>
</section>
          )}

          {activeJournalTab === "Statystyki" && (
            <section className="mt-6 grid gap-6 md:grid-cols-3 xl:grid-cols-4">
              <StatBox label="Win rate" value={`${performance.winRate.toFixed(0)}%`} color="text-emerald-400" />
              <StatBox label="Avg RR" value={performance.avgRR.toFixed(2)} color="text-sky-300" />
              <StatBox label="Total R" value={`${performance.totalR.toFixed(2)}R`} />
              <StatBox label="PnL" value={`${performance.totalPnl >= 0 ? "+" : ""}$${performance.totalPnl.toFixed(2)}`} color={performance.totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"} />
              <StatBox label="Profit Factor" value={performance.profitFactor.toFixed(2)} color="text-sky-300" />
              <StatBox label="Expectancy" value={`${performance.expectancy.toFixed(2)}R`} />
              <StatBox label="Avg Win" value={`+${performance.avgWin.toFixed(2)}R`} color="text-emerald-400" />
              <StatBox label="Avg Loss" value={`${performance.avgLoss.toFixed(2)}R`} color="text-rose-400" />
              <StatBox label="Best Pair" value={pairStats.bestPair ? pairStats.bestPair[0] : "-"} color="text-emerald-400" sub={pairStats.bestPair ? `${pairStats.bestPair[1].toFixed(2)}R` : ""} />
              <StatBox label="Worst Pair" value={pairStats.worstPair ? pairStats.worstPair[0] : "-"} color="text-rose-400" sub={pairStats.worstPair ? `${pairStats.worstPair[1].toFixed(2)}R` : ""} />
            </section>
          )}

          {activeJournalTab === "Strategie" && (
            <section className="mt-6 grid gap-6 2xl:grid-cols-[1fr_1.2fr]">
              <section className="rounded-[14px] border border-sky-400/30 bg-[radial-gradient(circle_at_15%_10%,rgba(125,211,252,.18),transparent_30%),linear-gradient(145deg,rgba(24,90,145,.98),rgba(9,54,94,.98))] shadow-[0_12px_32px_rgba(0,0,0,.16),0_0_20px_rgba(14,165,233,.055),inset_0_1px_0_rgba(255,255,255,.04)] p-6 backdrop-blur">
                <h2 className="mb-5 text-2xl font-semibold">Strategies Performance</h2>
                <div className="space-y-4">
                  {strategySummary.map((item) => (
                    <div key={item.name} className="flex items-center justify-between rounded-[10px] border border-sky-400/20 bg-[linear-gradient(145deg,#06284d,#041b36)] shadow-[inset_0_1px_0_rgba(255,255,255,.025)] px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`h-4 w-4 rounded-full ${item.color}`} />
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-sky-100/45">{item.pct}% udziaÅ‚u</p>
                        </div>
                      </div>
                      <p className={`text-xl font-semibold ${item.value.startsWith("-") ? "text-rose-400" : "text-emerald-400"}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[14px] border border-sky-400/30 bg-[radial-gradient(circle_at_15%_10%,rgba(125,211,252,.18),transparent_30%),linear-gradient(145deg,rgba(24,90,145,.98),rgba(9,54,94,.98))] shadow-[0_12px_32px_rgba(0,0,0,.16),0_0_20px_rgba(14,165,233,.055),inset_0_1px_0_rgba(255,255,255,.04)] p-6 backdrop-blur">
                <h2 className="mb-5 text-2xl font-semibold">Strategy Notes</h2>
                <div className="space-y-4">
                  {strategySummary.map((item) => (
                    <div key={item.name} className="rounded-[10px] border border-sky-400/20 bg-[linear-gradient(145deg,#06284d,#041b36)] shadow-[inset_0_1px_0_rgba(255,255,255,.025)] p-4">
                      <p className="text-lg font-medium">{item.name}</p>
                      <p className="mt-2 text-sky-100/45">Strategia {item.name} dziaÅ‚a najlepiej przy wysokiej pÅ‚ynnoÅ›ci i potwierdzeniu kierunku.</p>
                    </div>
                  ))}
                </div>
              </section>
            </section>
          )}

          {activeJournalTab === "Screenshoty" && (
            <section className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {trades.map((trade) => (
                <div key={trade.id} className="rounded-[12px] border border-sky-400/30 bg-[radial-gradient(circle_at_15%_10%,rgba(125,211,252,.18),transparent_30%),linear-gradient(145deg,rgba(24,90,145,.98),rgba(9,54,94,.98))] shadow-[0_12px_32px_rgba(0,0,0,.16),0_0_20px_rgba(14,165,233,.055),inset_0_1px_0_rgba(255,255,255,.04)] p-5 backdrop-blur">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">{trade.pair}</p>
                      <p className="text-sm text-sky-100/45">{trade.date}</p>
                    </div>
                    <span className="text-sm font-semibold text-sky-300">{trade.rr}</span>
                  </div>

                  {trade.screenshot ? (
                    <button type="button" className="block w-full" onClick={() => openPreview(trade.screenshot!, trade.id)}>
                      <img src={trade.screenshot} alt="trade screenshot" className="h-40 w-full rounded-xl border border-sky-300/30 object-cover transition hover:scale-[1.01]" />
                    </button>
                  ) : (
                    <div className="flex h-40 w-full items-center justify-center rounded-xl border border-sky-300/30 text-sm text-slate-500">Brak screena</div>
                  )}

                  <p className="mt-3 text-sm text-sky-100/70">{trade.notes}</p>
                </div>
              ))}
            </section>
          )}

          {activeJournalTab === "Ustawienia" && (
            <section className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="rounded-[12px] border border-sky-400/30 bg-[radial-gradient(circle_at_15%_10%,rgba(125,211,252,.18),transparent_30%),linear-gradient(145deg,rgba(24,90,145,.98),rgba(9,54,94,.98))] shadow-[0_12px_32px_rgba(0,0,0,.16),0_0_20px_rgba(14,165,233,.055),inset_0_1px_0_rgba(255,255,255,.04)] p-6 backdrop-blur">
                <p className="text-lg font-semibold">DomyÅ›lny widok</p>
                <p className="mt-2 text-sky-100/45">PrzeglÄ…d</p>
              </div>
              <div className="rounded-[12px] border border-sky-400/30 bg-[radial-gradient(circle_at_15%_10%,rgba(125,211,252,.18),transparent_30%),linear-gradient(145deg,rgba(24,90,145,.98),rgba(9,54,94,.98))] shadow-[0_12px_32px_rgba(0,0,0,.16),0_0_20px_rgba(14,165,233,.055),inset_0_1px_0_rgba(255,255,255,.04)] p-6 backdrop-blur">
                <p className="text-lg font-semibold">Import brokera</p>
                <p className="mt-2 text-sky-100/45">CSV</p>
              </div>
            </section>
          )}
        </div>
      </main>

      {showAddTradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-4xl rounded-[28px] border border-sky-300/35 bg-[linear-gradient(145deg,#06294f,#041b36)] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-2xl font-semibold">{editingTradeId ? "Edytuj trade" : "Add Trade"}</h3>
              <button onClick={() => { setShowAddTradeModal(false); resetForm(); }} className="rounded-xl border border-sky-300/30 px-3 py-2 text-sky-100/70 hover:bg-white/10">
                âœ•
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormInput label="Data" type="date" value={form.date} onChange={(value) => setForm((prev) => ({ ...prev, date: value }))} />
              <FormInput label="Para walutowa" value={form.pair} placeholder="np. XAUUSD, EURUSD" onChange={(value) => setForm((prev) => ({ ...prev, pair: value }))} />

              <div>
                <label className="mb-2 block text-sm text-sky-100/70">Kierunek</label>
                <select value={form.side} onChange={(e) => setForm((prev) => ({ ...prev, side: e.target.value as "BUY" | "SELL" }))} className="w-full rounded-[9px] border border-sky-300/35 bg-[linear-gradient(145deg,#06294f,#041b36)] px-4 py-3 outline-none">
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </div>

              <FormInput label="Entry" value={form.entry} placeholder="np. 2380.00" onChange={(value) => setForm((prev) => ({ ...prev, entry: value }))} />
              <FormInput label="SL" value={form.sl} placeholder="Stop loss" onChange={(value) => setForm((prev) => ({ ...prev, sl: value }))} />
              <FormInput label="TP" value={form.tp} placeholder="Take profit" onChange={(value) => setForm((prev) => ({ ...prev, tp: value }))} />
              <FormInput label="Ile RR" value={form.rr} placeholder="np. 1:2.5" onChange={(value) => setForm((prev) => ({ ...prev, rr: value }))} />

              <div>
                <label className="mb-2 block text-sm text-sky-100/70">Outcome</label>
                <select value={form.outcome} onChange={(e) => setForm((prev) => ({ ...prev, outcome: e.target.value as "WIN" | "LOSS" | "BE" }))} className="w-full rounded-[9px] border border-sky-300/35 bg-[linear-gradient(145deg,#06294f,#041b36)] px-4 py-3 outline-none">
                  <option value="WIN">WIN</option>
                  <option value="LOSS">LOSS</option>
                  <option value="BE">BE</option>
                </select>
              </div>

              <FormInput label="Result (R)" type="number" step="0.1" value={String(form.resultR)} onChange={(value) => setForm((prev) => ({ ...prev, resultR: Number(value) }))} />
              <FormInput label="PnL ($)" type="number" step="0.01" value={String(form.pnl)} onChange={(value) => setForm((prev) => ({ ...prev, pnl: Number(value) }))} />

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-sky-100/70">Screenshot</label>
                <input type="file" accept="image/*" onChange={handleScreenshotUpload} className="w-full rounded-[9px] border border-sky-300/35 bg-[linear-gradient(145deg,#06294f,#041b36)] px-4 py-3 outline-none file:mr-4 file:rounded-lg file:border-0 file:bg-sky-500 file:px-3 file:py-2 file:text-white" />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-sky-100/70">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="opis trade'a, dlaczego wejÅ›cie, co byÅ‚o dobrze/Åºle" rows={5} className="w-full rounded-[9px] border border-sky-300/35 bg-[linear-gradient(145deg,#06294f,#041b36)] px-4 py-3 outline-none" />
              </div>

              {form.screenshot && (
                <div className="md:col-span-2">
                  <p className="mb-2 text-sm text-sky-100/70">PodglÄ…d screena</p>
                  <img src={form.screenshot} alt="preview" className="h-52 w-full rounded-xl border border-sky-300/30 object-cover" />
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => { setShowAddTradeModal(false); resetForm(); }} className="rounded-xl border border-sky-300/30 px-5 py-3 text-sky-100/70 hover:bg-white/10">
                Anuluj
              </button>
              <button onClick={handleSaveTrade} className="rounded-xl bg-sky-500 px-5 py-3 font-medium text-white hover:bg-sky-400">
                {editingTradeId ? "Zapisz zmiany" : "Zapisz trade"}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-h-[95vh] max-w-[95vw]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewImage(null)} className="absolute -right-2 -top-2 z-10 rounded-full border border-white/20 bg-[#041b36] px-3 py-2 text-sm text-white hover:bg-white/10">
              âœ•
            </button>

            {screenshotTrades.length > 1 && (
              <>
                <button onClick={showPrevImage} className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-[#041b36]/90 px-4 py-3 text-white hover:bg-white/10">
                  â—€
                </button>
                <button onClick={showNextImage} className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-[#041b36]/90 px-4 py-3 text-white hover:bg-white/10">
                  â–¶
                </button>
              </>
            )}

            <img src={previewImage} alt="Fullscreen screenshot" className="max-h-[95vh] max-w-[95vw] rounded-2xl border border-sky-300/30 object-contain shadow-2xl" />
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

function TradeTable({
  trades,
  onPreview,
  onEdit,
  onDelete,
}: {
  trades: JournalTrade[];
  onPreview: (img: string, tradeId?: string) => void;
  onEdit: (trade: JournalTrade) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-[9px] border border-[#0a417b]">
      <table className="min-w-full text-left">
        <thead className="border-b border-[#0a417b] bg-[#041b36] text-[9px] uppercase tracking-[.08em] text-sky-100/45">
          <tr>
            {["Date", "Pair", "Type", "Entry", "SL", "TP", "RR", "Outcome", "Result R", "PnL", "Notes", "Screenshot", "Action"].map((head) => (
              <th key={head} className="px-3 py-3 font-medium whitespace-nowrap">{head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr key={trade.id} className="border-b border-[#0a417b] bg-[#052349] text-[11px] text-slate-100 transition hover:bg-[#08305f]">
              <td className="px-3 py-3 whitespace-nowrap">{trade.date}</td>
              <td className="px-3 py-3 font-medium">{trade.pair}</td>
              <td className="px-3 py-3">
                <span className={`inline-flex rounded-xl px-3 py-1 text-sm font-semibold ${trade.side === "BUY" ? "border border-emerald-400/20 bg-emerald-500/15 text-emerald-300" : "border border-rose-400/20 bg-rose-500/15 text-rose-300"}`}>{trade.side}</span>
              </td>
              <td className="px-3 py-3">{trade.entry}</td>
              <td className="px-3 py-3">{trade.sl || "-"}</td>
              <td className="px-3 py-3">{trade.tp || "-"}</td>
              <td className="px-3 py-3 font-semibold text-sky-300">{trade.rr}</td>
              <td className="px-3 py-3">
                <span className={`inline-flex rounded-xl px-3 py-1 text-sm font-semibold ${trade.outcome === "WIN" ? "bg-emerald-500/15 text-emerald-300" : trade.outcome === "LOSS" ? "bg-rose-500/15 text-rose-300" : "bg-white/10 text-sky-100/70"}`}>{trade.outcome}</span>
              </td>
              <td className={`px-6 py-4 font-semibold ${trade.resultR > 0 ? "text-emerald-400" : trade.resultR < 0 ? "text-rose-400" : "text-sky-100/70"}`}>{trade.resultR > 0 ? "+" : ""}{trade.resultR.toFixed(2)}R</td>
              <td className={`px-6 py-4 font-semibold ${trade.pnl > 0 ? "text-emerald-400" : trade.pnl < 0 ? "text-rose-400" : "text-sky-100/70"}`}>{trade.pnl > 0 ? "+" : ""}${trade.pnl.toFixed(2)}</td>
              <td className="px-3 py-3 text-sky-100/70">{trade.notes}</td>
              <td className="px-3 py-3">
                {trade.screenshot ? (
                  <button type="button" onClick={() => onPreview(trade.screenshot!, trade.id)} className="block">
                    <img src={trade.screenshot} alt="trade" className="h-16 w-24 rounded-lg border border-sky-300/30 object-cover transition hover:scale-[1.03]" />
                  </button>
                ) : (
                  <div className="flex h-16 w-24 items-center justify-center rounded-lg border border-sky-300/30 text-xs text-slate-500">No image</div>
                )}
              </td>
              <td className="px-3 py-3">
                <div className="flex gap-2">
                  <button onClick={() => onEdit(trade)} className="rounded-xl bg-yellow-500/20 px-3 py-2 text-sm text-yellow-300">Edytuj</button>
                  <button onClick={() => onDelete(trade.id)} className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300 hover:bg-rose-500/20">UsuÅ„</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


function TradingPlanCalendar({
  data,
  dailyTarget,
  onPrev,
  onNext,
}: {
  data: {
    year: number;
    month: number;
    cells: Array<{
      day: number;
      date: string;
      pnl: number;
      trades: number;
      status: "TARGET" | "PARTIAL" | "LOSS" | "NO_TRADE";
    } | null>;
    targetDays: number;
    tradedDays: number;
    profit: number;
    loss: number;
    net: number;
    winRate: number;
    streak: number;
  };
  dailyTarget: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const monthNames = [
    "StyczeÅ„", "Luty", "Marzec", "KwiecieÅ„", "Maj", "Czerwiec",
    "Lipiec", "SierpieÅ„", "WrzesieÅ„", "PaÅºdziernik", "Listopad", "GrudzieÅ„",
  ];

  const statusClass = (status: string) => {
    if (status === "TARGET")
      return "border-emerald-300 bg-emerald-400/20 text-emerald-200 shadow-[0_0_14px_rgba(52,211,153,.30),inset_0_0_20px_rgba(52,211,153,.12)]";
    if (status === "PARTIAL")
      return "border-amber-400/30 bg-amber-500/10 text-amber-300";
    if (status === "LOSS")
      return "border-red-400 bg-red-500/20 text-red-200 shadow-[0_0_14px_rgba(248,113,113,.30),inset_0_0_20px_rgba(248,113,113,.12)]";
    return "border-cyan-400/20 bg-[linear-gradient(145deg,#083a63,#052b4a)] text-sky-100/45 shadow-[inset_0_1px_0_rgba(255,255,255,.035)]";
  };

  return (
    <div className="rounded-[18px] border border-cyan-300/40 bg-[radial-gradient(circle_at_12%_4%,rgba(125,211,252,.20),transparent_28%),radial-gradient(circle_at_88%_95%,rgba(37,99,235,.20),transparent_34%),linear-gradient(145deg,#155a91,#0a365f)] shadow-[0_0_18px_rgba(34,211,238,.12),0_14px_36px_rgba(0,0,0,.20),inset_0_1px_0_rgba(255,255,255,.08)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-sky-300" />
          <div>
            <h3 className="text-[18px] font-bold">Kalendarz Celu</h3>
            <p className="mt-1 text-[10px] text-sky-100/40">
              Dzienny cel: {dailyTarget.toFixed(2)} USD
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrev}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-300/45 bg-[#062a4a] text-cyan-100 shadow-[0_0_14px_rgba(34,211,238,.14)] transition hover:border-cyan-200/70 hover:bg-[#0a3a64]"
          >
            â€¹
          </button>
          <span className="min-w-[125px] text-center text-[11px] font-bold">
            {monthNames[data.month - 1]} {data.year}
          </span>
          <button
            type="button"
            onClick={onNext}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-300/45 bg-[#062a4a] text-cyan-100 shadow-[0_0_14px_rgba(34,211,238,.14)] transition hover:border-cyan-200/70 hover:bg-[#0a3a64]"
          >
            â€º
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-sky-100/40">
        {["Pon", "Wt", "Åšr", "Czw", "Pt", "Sob", "Ndz"].map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {data.cells.map((cell, index) =>
          cell ? (
            <div
              key={cell.date}
              title={`${cell.date} â€¢ ${cell.trades} trade â€¢ ${cell.pnl >= 0 ? "+" : ""}${cell.pnl.toFixed(2)} USD`}
              className={`min-h-[72px] rounded-xl border p-2.5 ${statusClass(cell.status)}`}
            >
              <div className="text-[11px] font-bold text-white/80">{cell.day}</div>
              {cell.trades > 0 ? (
                <div className="mt-3 truncate text-[11px] font-black">
                  {cell.pnl >= 0 ? "+" : ""}{cell.pnl.toFixed(2)}
                </div>
              ) : (
                <div className="mt-3 text-[10px]">â€”</div>
              )}
            </div>
          ) : (
            <div key={`empty-${index}`} className="min-h-[72px]" />
          )
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[9px] text-sky-100/55">
        <span><b className="text-emerald-300">â—</b> TARGET</span>
        <span><b className="text-amber-300">â—</b> PARTIAL</span>
        <span><b className="text-rose-300">â—</b> LOSS</span>
        <span><b className="text-sky-100/30">â—</b> NO TRADE</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        <CalendarStat label="Target Days" value={`${data.targetDays}/${data.tradedDays}`} tone="green" />
        <CalendarStat label="Profit" value={`+${data.profit.toFixed(2)}`} tone="green" />
        <CalendarStat label="Loss" value={data.loss.toFixed(2)} tone="red" />
        <CalendarStat label="Net" value={`${data.net >= 0 ? "+" : ""}${data.net.toFixed(2)}`} tone={data.net >= 0 ? "green" : "red"} />
        <CalendarStat label="Win Rate" value={`${data.winRate.toFixed(0)}%`} tone="blue" />
        <CalendarStat label="Streak" value={`${data.streak} dni`} tone="blue" />
      </div>
    </div>
  );
}

function CalendarStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "red" | "blue";
}) {
  const toneClass =
    tone === "green"
      ? "text-emerald-200"
      : tone === "red"
      ? "text-red-300"
      : "text-sky-300";

  return (
    <div className="rounded-xl border border-cyan-300/25 bg-[radial-gradient(circle_at_15%_10%,rgba(125,211,252,.12),transparent_34%),linear-gradient(145deg,#124f82,#08385f)] px-3 py-2.5 shadow-[0_0_14px_rgba(34,211,238,.07),inset_0_1px_0_rgba(255,255,255,.07)]">
      <p className="text-[8px] text-sky-100/35">{label}</p>
      <p className={`mt-1 text-[12px] font-black ${toneClass}`}>{value}</p>
    </div>
  );
}

function PlanInput({
  label,
  value,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-[11px] text-sky-100/55">{label}</label>
      <div className="flex rounded-[10px] border border-sky-400/20 bg-[radial-gradient(circle_at_20%_10%,rgba(125,211,252,.16),transparent_32%),linear-gradient(145deg,#15578d,#0b3b68)] transition focus-within:border-sky-400/60">
        <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full bg-transparent px-4 py-3 text-[12px] outline-none" />
        <span className="px-4 py-3 text-[11px] text-sky-100/35">{suffix}</span>
      </div>
    </div>
  );
}

function PlanStat({
  label,
  value,
  sub,
  green,
  blue,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  green?: boolean;
  blue?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-[16px] border border-sky-300/30 bg-[radial-gradient(circle_at_20%_0%,rgba(186,230,253,.20),transparent_35%),linear-gradient(160deg,#1d67a3,#0d4779)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.025)]">
      <div className="flex items-center justify-center gap-2">
        {icon ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-400/15 bg-blue-500/10 text-blue-400">
            {icon}
          </span>
        ) : null}
        <p className="text-[10px] text-sky-100/45">{label}</p>
      </div>

      <p
        className={`mt-2 text-center text-[28px] font-black ${
          green
            ? "text-emerald-200"
            : blue
            ? "text-blue-400"
            : "text-white"
        }`}
      >
        {value}
      </p>

      <p className="mt-1 text-center text-[10px] text-sky-100/40">{sub}</p>
    </div>
  );
}

function PlanPanel({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[18px] border border-cyan-300/40 bg-[radial-gradient(circle_at_12%_4%,rgba(125,211,252,.20),transparent_28%),radial-gradient(circle_at_88%_95%,rgba(37,99,235,.20),transparent_34%),linear-gradient(145deg,#155a91,#0a365f)] shadow-[0_0_18px_rgba(34,211,238,.12),0_14px_36px_rgba(0,0,0,.20),inset_0_1px_0_rgba(255,255,255,.08)] p-5">
      <div className="mb-4 flex items-center gap-2">
        {icon ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-400/15 bg-blue-500/10">
            {icon}
          </span>
        ) : null}
        <h3 className="text-[17px] font-black">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function IconPlanRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 py-2.5 text-sm">
      <div className="flex items-center gap-2 text-sky-100/50">
        <span className="text-sky-400">{icon}</span>
        <span>{label}</span>
      </div>
      <span className="text-white">{value}</span>
    </div>
  );
}

function PlanRow({ label, value, green, red, blue }: { label: string; value: string; green?: boolean; red?: boolean; blue?: boolean }) {
  return (
    <div className="flex justify-between gap-3 border-b border-white/5 py-2 text-sm">
      <span className="text-sky-100/45">{label}</span>
      <span className={`text-right ${green ? "text-emerald-400" : red ? "text-red-400" : blue ? "text-blue-400" : "text-white"}`}>{value}</span>
    </div>
  );
}

function MiniPlanBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-sky-400/20 bg-[radial-gradient(circle_at_20%_10%,rgba(125,211,252,.16),transparent_32%),linear-gradient(145deg,#15578d,#0b3b68)] p-4">
      <p className="text-[10px] text-sky-100/45">{label}</p>
      <p className="mt-2 text-[24px] font-black">{value}</p>
    </div>
  );
}

function Checklist({ text, failed }: { text: string; failed?: boolean }) {
  return (
    <div className="mb-2.5 flex items-center gap-2 text-[11px]">
      <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${failed ? "border-rose-400/40 bg-rose-500/15 text-rose-300" : "border-emerald-400/35 bg-emerald-500/15 text-emerald-300"}`}>{failed ? "Ã—" : "âœ“"}</span>
      <span className="text-sky-50/80">{text}</span>
    </div>
  );
}

function StatBox({ label, value, color = "text-white", sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div className="rounded-[12px] border border-sky-400/30 bg-[radial-gradient(circle_at_15%_10%,rgba(125,211,252,.18),transparent_30%),linear-gradient(145deg,rgba(24,90,145,.98),rgba(9,54,94,.98))] shadow-[0_12px_32px_rgba(0,0,0,.16),0_0_20px_rgba(14,165,233,.055),inset_0_1px_0_rgba(255,255,255,.04)] p-6 backdrop-blur">
      <p className="text-lg text-sky-100/70">{label}</p>
      <p className={`mt-3 text-4xl font-semibold ${color}`}>{value}</p>
      {sub ? <p className="mt-1 text-sky-100/45">{sub}</p> : null}
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-sky-100/70">{label}</label>
      <input type={type} step={step} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-[9px] border border-sky-300/35 bg-[linear-gradient(145deg,#06294f,#041b36)] px-4 py-3 outline-none" />
          </div>

  );
}

