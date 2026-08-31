"use client";

import { useEffect, useMemo, useState } from "react";

type Trade = {
  id: number;
  pair: string;
  side: string;
  setup: string;
  entry: string;
  stopLoss: string;
  takeProfit1: string;
  takeProfit2: string;
  takeProfit3: string;
  status: string;
  notes: string;
  createdAt: string;
};

type TradingPlan = {
  accountBalance: number;
  monthlyGoalPercent: number;
  riskPerTradePercent: number;
  tradingDays: number;
  maxTradesPerDay: number;
  includeWeekends: boolean;
  startDate: string;
  endDate: string;
};

const PLAN_KEY = "fxtrader_active_plan";

export default function Journal() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [activeTab, setActiveTab] = useState<"config" | "active">("config");

  const [plan, setPlan] = useState<TradingPlan>({
    accountBalance: 1000,
    monthlyGoalPercent: 10,
    riskPerTradePercent: 2,
    tradingDays: 20,
    maxTradesPerDay: 5,
    includeWeekends: true,
    startDate: "2025-05-01",
    endDate: "2025-05-31",
  });

  useEffect(() => {
    const savedTrades = localStorage.getItem("fxtrader_trades");
    const savedPlan = localStorage.getItem(PLAN_KEY);

    if (savedTrades) setTrades(JSON.parse(savedTrades));

    if (savedPlan) {
      setPlan(JSON.parse(savedPlan));
      setActiveTab("active");
    }
  }, []);

  const calculations = useMemo(() => {
    const monthlyTarget =
      plan.accountBalance * (plan.monthlyGoalPercent / 100);

    const riskPerTrade =
      plan.accountBalance * (plan.riskPerTradePercent / 100);

    const dailyTarget = monthlyTarget / plan.tradingDays;
    const weeklyTarget = dailyTarget * 5;
    const maxDailyLoss = riskPerTrade * 2;
    const requiredR = dailyTarget / riskPerTrade;

    return {
      monthlyTarget,
      riskPerTrade,
      dailyTarget,
      weeklyTarget,
      maxDailyLoss,
      requiredR,
    };
  }, [plan]);

  const startPlan = () => {
    localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
    setActiveTab("active");
  };

  const restartPlan = () => {
    localStorage.removeItem(PLAN_KEY);
    setActiveTab("config");
  };

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 overflow-x-hidden text-white sm:space-y-6">
      <div>
        <h1 className="text-[22px] font-bold sm:text-3xl">
          FX Trade Journal <span className="text-cyan-400">PRO</span>
        </h1>
        <p className="text-sm text-white/50">
          Zaawansowany dziennik transakcji, statystyki i analiza strategii.
        </p>
      </div>

      <section className="min-w-0 rounded-[18px] border border-white/10 bg-[#0b1423] p-3 sm:rounded-[26px] sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold sm:text-2xl">Trading Plan</h2>
            <p className="text-sm text-white/45">
              Ustaw cele i aktywuj plan tradingowy
            </p>
          </div>

          {activeTab === "active" && (
            <button
              onClick={restartPlan}
              className="w-full rounded-xl bg-red-500/20 px-4 py-2.5 text-red-300 sm:w-auto sm:px-5 sm:py-3"
            >
              Restart Plan
            </button>
          )}
        </div>

        <div className="mb-6 flex max-w-full gap-5 overflow-x-auto border-b border-white/10 sm:gap-6">
          <button
            onClick={() => setActiveTab("config")}
            className={`pb-3 ${
              activeTab === "config"
                ? "border-b-2 border-emerald-400 text-white"
                : "text-white/45"
            }`}
          >
            Plan Configuration
          </button>

          <button
            onClick={() => setActiveTab("active")}
            className={`pb-3 ${
              activeTab === "active"
                ? "border-b-2 border-emerald-400 text-white"
                : "text-white/45"
            }`}
          >
            Active Plan
          </button>
        </div>

        {activeTab === "config" ? (
          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
            <PlanInput
              label="Account Balance"
              value={plan.accountBalance}
              suffix="USD"
              onChange={(v) =>
                setPlan({ ...plan, accountBalance: Number(v) })
              }
            />

            <PlanInput
              label="Monthly Goal"
              value={plan.monthlyGoalPercent}
              suffix="%"
              onChange={(v) =>
                setPlan({ ...plan, monthlyGoalPercent: Number(v) })
              }
            />

            <PlanInput
              label="Risk Per Trade"
              value={plan.riskPerTradePercent}
              suffix="%"
              onChange={(v) =>
                setPlan({ ...plan, riskPerTradePercent: Number(v) })
              }
            />

            <PlanInput
              label="Trading Days"
              value={plan.tradingDays}
              suffix="Days"
              onChange={(v) =>
                setPlan({ ...plan, tradingDays: Number(v) })
              }
            />

            <PlanInput
              label="Max Trades / Day"
              value={plan.maxTradesPerDay}
              suffix="Trades"
              onChange={(v) =>
                setPlan({ ...plan, maxTradesPerDay: Number(v) })
              }
            />

            <div>
              <label className="mb-2 block text-sm text-white/50">
                Include Weekends
              </label>
              <button
                onClick={() =>
                  setPlan({
                    ...plan,
                    includeWeekends: !plan.includeWeekends,
                  })
                }
                className={`w-full rounded-xl border border-white/10 px-4 py-3 text-left ${
                  plan.includeWeekends
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-[#091424] text-white/60"
                }`}
              >
                {plan.includeWeekends ? "Yes" : "No"}
              </button>
            </div>

            <button
              onClick={startPlan}
              className="lg:col-span-2 rounded-xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-600 px-4 py-4 font-semibold text-white"
            >
              Start Trading Plan
            </button>
          </div>
        ) : (
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
                <StatCard
                  label="Monthly Goal"
                  value={`${plan.monthlyGoalPercent}%`}
                  sub={`${calculations.monthlyTarget.toFixed(2)} USD`}
                  green
                />
                <StatCard label="Current Progress" value="+0.00%" sub="0.00 USD" green />
                <StatCard
                  label="Remaining"
                  value={`${plan.monthlyGoalPercent}%`}
                  sub={`${calculations.monthlyTarget.toFixed(2)} USD`}
                  blue
                />
                <StatCard label="Days Left" value={String(plan.tradingDays)} sub="trading days" />
                <StatCard label="Consistency" value="0%" sub="Start tracking" />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
                <Panel title="Plan Parameters">
                  <Row label="Account Balance" value={`${plan.accountBalance.toFixed(2)} USD`} />
                  <Row
                    label="Risk Per Trade"
                    value={`${plan.riskPerTradePercent}% (${calculations.riskPerTrade.toFixed(
                      2
                    )} USD)`}
                  />
                  <Row
                    label="Monthly Goal"
                    value={`${plan.monthlyGoalPercent}% (${calculations.monthlyTarget.toFixed(
                      2
                    )} USD)`}
                  />
                  <Row label="Trading Days" value={`${plan.tradingDays} Days`} />
                  <Row label="Max Trades / Day" value={`${plan.maxTradesPerDay} Trades`} />
                  <Row label="Include Weekends" value={plan.includeWeekends ? "Yes" : "No"} />
                  <Row label="Start Date" value={plan.startDate} />
                  <Row label="End Date" value={plan.endDate} />
                </Panel>

                <Panel title="Target Summary">
                  <Row label="Daily Target" value={`${calculations.dailyTarget.toFixed(2)} USD`} green />
                  <Row label="Weekly Target" value={`${calculations.weeklyTarget.toFixed(2)} USD`} green />
                  <Row label="Monthly Target" value={`${calculations.monthlyTarget.toFixed(2)} USD`} green />
                  <Row label="Max Daily Loss" value={`${calculations.maxDailyLoss.toFixed(2)} USD`} red />
                  <Row label="Risk Per Trade" value={`${calculations.riskPerTrade.toFixed(2)} USD`} />
                  <Row label="Required R / Day" value={`${calculations.requiredR.toFixed(2)}R`} blue />
                </Panel>

                <Panel title="Daily Progress">
                  <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <div className="text-white/45">Daily Goal</div>
                      <div className="mt-1 text-emerald-300">
                        {calculations.dailyTarget.toFixed(2)} USD
                      </div>
                    </div>
                    <div>
                      <div className="text-white/45">Current P&L</div>
                      <div className="mt-1 text-emerald-300">0.00 USD</div>
                    </div>
                    <div>
                      <div className="text-white/45">Remaining</div>
                      <div className="mt-1 text-blue-400">
                        {calculations.dailyTarget.toFixed(2)} USD
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 h-3 rounded-full bg-white/10">
                    <div className="h-3 w-[4%] rounded-full bg-emerald-400" />
                  </div>

                  <div className="mt-6 rounded-xl border border-white/10 bg-[#091424] p-4">
                    <div className="flex justify-between text-sm text-white/50">
                      <span>Trades Today</span>
                      <span>Max Trades</span>
                    </div>
                    <div className="mt-2 flex justify-between text-2xl font-semibold">
                      <span>0 / {plan.maxTradesPerDay}</span>
                      <span>{plan.maxTradesPerDay}</span>
                    </div>
                  </div>
                </Panel>
              </div>
            </div>

            <aside className="min-w-0 space-y-4 rounded-[18px] border border-white/10 bg-[#091424] p-4 sm:rounded-[22px] sm:p-5">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-500 text-2xl">
                  ✓
                </div>
                <h3 className="text-xl font-semibold">Trading Plan Active</h3>
                <p className="text-sm text-white/45">
                  Your strategy is ready to execute
                </p>
              </div>

              <MiniBox label="Max Trades/Day" value={String(plan.maxTradesPerDay)} />
              <MiniBox
                label="Daily Target"
                value={`${calculations.dailyTarget.toFixed(2)} USD`}
              />

              <Panel title="Daily Rules">
                <Checklist text="Max trades per day" />
                <Checklist text="No revenge trading" />
                <Checklist text="RR minimum 1:2" failed />
                <Checklist text="Follow session bias" />
                <Checklist text="No trading outside plan" />
              </Panel>
            </aside>
          </div>
        )}
      </section>

      <section className="min-w-0 rounded-[18px] border border-white/10 bg-[#0b1423] p-3 sm:rounded-[26px] sm:p-6">
        <h2 className="mb-4 text-xl font-semibold">Trade Journal</h2>

        <div className="grid gap-3">
          {trades.map((trade) => (
            <div
              key={trade.id}
              className="rounded-xl border border-white/10 bg-[#091424] p-4"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="font-medium">{trade.pair}</div>
                <div
                  className={
                    trade.side === "BUY" ? "text-green-400" : "text-red-400"
                  }
                >
                  {trade.side}
                </div>
              </div>

              <div className="mt-2 text-sm text-zinc-400">
                Entry: {trade.entry}
              </div>
              <div className="text-sm text-zinc-400">
                SL: {trade.stopLoss}
              </div>
              <div className="text-sm text-zinc-400">
                TP1: {trade.takeProfit1}
              </div>
            </div>
          ))}
        </div>
      </section>
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
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-white/50">{label}</label>
      <div className="flex min-w-0 rounded-xl border border-white/10 bg-[#091424]">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 w-full bg-transparent px-3 py-3 outline-none sm:px-4"
        />
        <div className="shrink-0 px-3 py-3 text-white/35 sm:px-4">{suffix}</div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  green,
  blue,
}: {
  label: string;
  value: string;
  sub: string;
  green?: boolean;
  blue?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-[#091424] p-3 text-center sm:p-4">
      <div className="text-sm text-white/50">{label}</div>
      <div
        className={`mt-2 break-words text-xl font-bold sm:mt-3 sm:text-3xl ${
          green ? "text-emerald-300" : blue ? "text-blue-400" : "text-white"
        }`}
      >
        {value}
      </div>
      <div className="mt-2 text-sm text-white/60">{sub}</div>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-[#091424] p-4 sm:p-5">
      <h3 className="mb-4 text-lg font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  green,
  red,
  blue,
}: {
  label: string;
  value: string;
  green?: boolean;
  red?: boolean;
  blue?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 border-b border-white/5 py-2 text-sm sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <span className="text-white/50">{label}</span>
      <span
        className={`${
          green
            ? "text-emerald-300"
            : red
            ? "text-red-400"
            : blue
            ? "text-blue-400"
            : "text-white"
        } break-words sm:text-right`}
      >
        {value}
      </span>
    </div>
  );
}

function MiniBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0b1423] p-4">
      <div className="text-sm text-white/50">{label}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}

function Checklist({
  text,
  failed,
}: {
  text: string;
  failed?: boolean;
}) {
  return (
    <div className="mb-2 flex items-center gap-2 text-sm">
      <span
        className={`flex h-4 w-4 items-center justify-center rounded ${
          failed ? "bg-red-500" : "bg-emerald-500"
        }`}
      >
        {failed ? "×" : "✓"}
      </span>
      <span>{text}</span>
    </div>
  );
}