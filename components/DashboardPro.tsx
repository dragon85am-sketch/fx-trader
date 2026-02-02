"use client";

import React, { useMemo, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button, Card, CardContent, Input, Label, Pill, cn } from "./ui";
import {
  Trade,
  TradeSide,
  getOnboarding,
  getTrades,
  setOnboarding,
  setTrades,
} from "./storage";

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-zinc-400">{title}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: Array<Array<string>>;
}) {
  return (
    <div className="overflow-auto rounded-2xl border border-zinc-800">
      <table className="min-w-full text-sm">
        <thead className="bg-zinc-950">
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left font-semibold text-zinc-300 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-zinc-800">
              {r.map((c, j) => (
                <td
                  key={j}
                  className="px-4 py-3 text-zinc-200 whitespace-nowrap"
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DashboardPro() {
  const [tab, setTab] = useState<
    "overview" | "setupy" | "bledy" | "sesje" | "journal"
  >("overview");

  const [trades, _setTrades] = useState<Trade[]>(() => getTrades());

  // ✅ FIX: trzymaj onboarding w state, żeby UI zawsze się odświeżał
  const [onboarding, setOnboardingState] = useState(() => getOnboarding());
  const isOnboarding = !onboarding.completed;

  // filters (disabled during onboarding)
  const [fMarket, setFMarket] = useState("ALL");
  const [fTf, setFTf] = useState("ALL");
  const [fSetup, setFSetup] = useState("ALL");
  const [fSession, setFSession] = useState("ALL");

  const unique = useMemo(() => {
    const markets = Array.from(new Set(trades.map((t) => t.market))).sort();
    const tfs = Array.from(new Set(trades.map((t) => t.tf))).sort();
    const setups = Array.from(new Set(trades.map((t) => t.setup))).sort();
    const sessions = Array.from(new Set(trades.map((t) => t.session))).sort();
    return { markets, tfs, setups, sessions };
  }, [trades]);

  const filtered = useMemo(() => {
    if (isOnboarding) return trades; // onboarding ignores filters
    return trades.filter(
      (t) =>
        (fMarket === "ALL" || t.market === fMarket) &&
        (fTf === "ALL" || t.tf === fTf) &&
        (fSetup === "ALL" || t.setup === fSetup) &&
        (fSession === "ALL" || t.session === fSession)
    );
  }, [trades, fMarket, fTf, fSetup, fSession, isOnboarding]);

  const stats = useMemo(() => {
    const base = filtered;
    const n = base.length;
    const wins = base.filter((t) => t.resultR > 0).length;
    const winRate = n ? (wins / n) * 100 : 0;
    const avgR = n ? base.reduce((a, t) => a + t.resultR, 0) / n : 0;

    let cum = 0;
    const curve = base
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((t) => {
        cum += t.resultR;
        return { name: t.date.slice(5), equityR: Number(cum.toFixed(2)) };
      });

    let peak = -Infinity;
    let maxDD = 0;
    for (const p of curve) {
      peak = Math.max(peak, p.equityR);
      maxDD = Math.min(maxDD, p.equityR - peak);
    }

    // expectancy
    const avgWin = wins
      ? base.filter((t) => t.resultR > 0).reduce((a, t) => a + t.resultR, 0) /
        wins
      : 0;
    const losses = n - wins;
    const avgLoss = losses
      ? base.filter((t) => t.resultR <= 0).reduce((a, t) => a + t.resultR, 0) /
        losses
      : 0;
    const expectancy = n ? (wins / n) * avgWin + (losses / n) * avgLoss : 0;

    // per setup
    const setupMap = new Map<string, { n: number; wins: number; sumR: number }>();
    for (const t of base) {
      const k = t.setup || "(brak)";
      const v = setupMap.get(k) ?? { n: 0, wins: 0, sumR: 0 };
      v.n++;
      v.wins += t.resultR > 0 ? 1 : 0;
      v.sumR += t.resultR;
      setupMap.set(k, v);
    }
    const perSetup = Array.from(setupMap.entries())
      .map(([setup, v]) => ({
        setup,
        trades: v.n,
        winRate: v.n ? (v.wins / v.n) * 100 : 0,
        avgR: v.n ? v.sumR / v.n : 0,
      }))
      .sort((a, b) => b.avgR - a.avgR);

    // per mistake
    const mistakeMap = new Map<string, { n: number; losses: number }>();
    for (const t of base) {
      const k = t.mistake || "Brak";
      const v = mistakeMap.get(k) ?? { n: 0, losses: 0 };
      v.n++;
      v.losses += t.resultR <= 0 ? 1 : 0;
      mistakeMap.set(k, v);
    }
    const perMistake = Array.from(mistakeMap.entries())
      .map(([mistake, v]) => ({
        mistake,
        trades: v.n,
        lossRate: v.n ? (v.losses / v.n) * 100 : 0,
      }))
      .sort((a, b) => b.lossRate - a.lossRate);

    // per session
    const sessMap = new Map<string, { n: number; sumR: number }>();
    for (const t of base) {
      const k = t.session || "Brak";
      const v = sessMap.get(k) ?? { n: 0, sumR: 0 };
      v.n++;
      v.sumR += t.resultR;
      sessMap.set(k, v);
    }
    const perSession = Array.from(sessMap.entries())
      .map(([session, v]) => ({
        session,
        trades: v.n,
        avgR: v.n ? v.sumR / v.n : 0,
      }))
      .sort((a, b) => b.avgR - a.avgR);

    // onboarding insights (top 3 mistakes by losses)
    const lossCount = new Map<string, number>();
    for (const t of base)
      if (t.resultR < 0)
        lossCount.set(
          t.mistake || "Brak",
          (lossCount.get(t.mistake || "Brak") || 0) + 1
        );
    const topMistakes = Array.from(lossCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return {
      n,
      wins,
      winRate,
      avgR,
      maxDD,
      expectancy,
      curve,
      perSetup,
      perMistake,
      perSession,
      topMistakes,
    };
  }, [filtered]);

  function updateTrades(next: Trade[]) {
    _setTrades(next);
    setTrades(next);
  }

  // CSV
  function exportCSV() {
    const header = "date,market,tf,side,setup,resultR,mistake,session,notes";
    const rows = filtered.map((t) =>
      [
        t.date,
        t.market,
        t.tf,
        t.side,
        t.setup,
        t.resultR,
        t.mistake,
        t.session,
        t.notes,
      ]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fx-trader-journal.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importCSV(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const lines = text.split(/\r?\n/).filter(Boolean);
      const dataLines = lines.slice(1);
      const imported: Trade[] = dataLines
        .map((l) => {
          const cols = l
            .split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/)
            .map((v) => v.replace(/^"|"$/g, ""));
          const [date, market, tf, side, setup, resultR, mistake, session, notes] =
            cols;
          return {
            id: crypto.randomUUID(),
            date,
            market,
            tf,
            side: (side as TradeSide) || "SHORT",
            setup: setup || "M1 1–2–3",
            resultR: Number(resultR),
            mistake: mistake || "Brak",
            session: session || "NY",
            notes: notes || "",
          };
        })
        .filter((t) => t.date && t.market && Number.isFinite(t.resultR));

      const nextTrades = [...imported, ...trades];
      updateTrades(nextTrades);

      // ✅ odśwież onboarding state po imporcie (na wypadek)
      setOnboardingState(getOnboarding());
    };
    reader.readAsText(file);
  }

  // Journal form
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [market, setMarket] = useState("BTCUSDT");
  const [tf, setTf] = useState("M1");
  const [side, setSide] = useState<TradeSide>("SHORT");
  const [setup, setSetup] = useState("M1 1–2–3");
  const [resultR, setResultR] = useState("1");
  const [mistake, setMistake] = useState("Brak");
  const [session, setSession] = useState("NY");
  const [notes, setNotes] = useState("");

  // ✅ FIX: completed ustawiane na true po 10 trade + licznik liczony po trades.length
  function addTrade() {
    const r = Number(resultR);
    if (!Number.isFinite(r)) return;

    const t: Trade = {
      id: crypto.randomUUID(),
      date,
      market,
      tf,
      side,
      setup,
      resultR: r,
      mistake,
      session,
      notes,
    };

    const nextTrades = [t, ...trades];
    updateTrades(nextTrades);

    const ob = getOnboarding();
    const nextCount = Math.min(10, nextTrades.length);
    const done = nextCount >= 10;

    setOnboarding({
      ...ob,
      tradesCount: nextCount,
      step: done ? 4 : 3,
      completed: done,
    });

    // ✅ odśwież UI
    setOnboardingState(getOnboarding());

    setNotes("");
    setResultR("1");
  }

  const TabsButton = ({ id, label }: { id: typeof tab; label: string }) => (
    <button
      className={cn(
        "rounded-xl px-3 py-2 text-sm font-semibold border border-zinc-800",
        tab === id
          ? "bg-zinc-100 text-zinc-950"
          : "bg-zinc-950 text-zinc-200 hover:bg-zinc-900"
      )}
      onClick={() => setTab(id)}
      disabled={isOnboarding && id !== "overview" && id !== "journal"}
      title={
        isOnboarding && id !== "overview" && id !== "journal"
          ? "Odblokujesz po onboardingu (10 trade)"
          : undefined
      }
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <TabsButton id="overview" label="Overview" />
          <TabsButton id="setupy" label="Setupy" />
          <TabsButton id="bledy" label="Błędy" />
          <TabsButton id="sesje" label="Sesje" />
          <TabsButton id="journal" label="Journal" />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {isOnboarding ? (
            <Pill>Onboarding: {onboarding.tradesCount ?? 0}/10 trade</Pill>
          ) : (
            <>
              <Button variant="outline" onClick={exportCSV}>
                Export CSV
              </Button>
              <label className="inline-flex">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files?.[0] && importCSV(e.target.files[0])
                  }
                />
                <span className="cursor-pointer rounded-2xl border border-zinc-700 px-4 py-2 text-sm font-semibold hover:bg-zinc-900">
                  Import CSV
                </span>
              </label>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className={cn(isOnboarding ? "opacity-60" : "")}>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="min-w-[140px]">
              <Label>Rynek</Label>
              <select
                disabled={isOnboarding}
                value={fMarket}
                onChange={(e) => setFMarket(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
              >
                <option value="ALL">Wszystkie</option>
                {unique.markets.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[120px]">
              <Label>TF</Label>
              <select
                disabled={isOnboarding}
                value={fTf}
                onChange={(e) => setFTf(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
              >
                <option value="ALL">Wszystkie</option>
                {unique.tfs.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[180px]">
              <Label>Setup</Label>
              <select
                disabled={isOnboarding}
                value={fSetup}
                onChange={(e) => setFSetup(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
              >
                <option value="ALL">Wszystkie</option>
                {unique.setups.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[140px]">
              <Label>Sesja</Label>
              <select
                disabled={isOnboarding}
                value={fSession}
                onChange={(e) => setFSession(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
              >
                <option value="ALL">Wszystkie</option>
                {unique.sessions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {isOnboarding && (
              <div className="text-xs text-zinc-500 ml-auto">
                Filtry/staty PRO odblokujesz po onboardingu (10 trade).
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Metric title="Win rate" value={`${stats.winRate.toFixed(0)}%`} />
            <Metric title="Liczba trade" value={String(stats.n)} />
            <Metric title="Średni wynik" value={`${stats.avgR.toFixed(2)}R`} />
            <Metric title="Max DD" value={`${stats.maxDD.toFixed(2)}R`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardContent>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <h3 className="text-lg font-semibold">Equity curve (R)</h3>
                  <p className="text-sm text-zinc-400">
                    Expectancy: {stats.expectancy.toFixed(2)}R
                  </p>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={stats.curve}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="equityR" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <h3 className="text-lg font-semibold mb-2">Szybkie wnioski</h3>
                {isOnboarding ? (
                  <>
                    <p className="text-sm text-zinc-300">
                      Zrób 10 trade według zasad. Potem pokażę Ci top błędy i
                      najlepsze warunki.
                    </p>
                    <div className="mt-4 space-y-2">
                      {(stats.topMistakes.length
                        ? stats.topMistakes
                        : [["—", 0]] as any
                      ).map(([m, c]: any) => (
                        <div
                          key={m}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-zinc-300">{m}</span>
                          <span className="text-zinc-500">{c}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <ul className="text-sm text-zinc-300 space-y-2">
                    <li>
                      <span className="text-zinc-400">Najlepszy setup:</span>{" "}
                      <span className="font-semibold">
                        {stats.perSetup[0]?.setup ?? "—"}
                      </span>
                    </li>
                    <li>
                      <span className="text-zinc-400">Najgorszy błąd:</span>{" "}
                      <span className="font-semibold">
                        {stats.perMistake[0]?.mistake ?? "—"}
                      </span>
                    </li>
                    <li>
                      <span className="text-zinc-400">Najlepsza sesja:</span>{" "}
                      <span className="font-semibold">
                        {stats.perSession[0]?.session ?? "—"}
                      </span>
                    </li>
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {tab === "setupy" && !isOnboarding && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-semibold mb-4">Statystyki per setup</h3>
            <Table
              headers={["Setup", "Trade", "Win%", "Avg R"]}
              rows={stats.perSetup.map((s) => [
                s.setup,
                String(s.trades),
                `${s.winRate.toFixed(0)}%`,
                `${s.avgR.toFixed(2)}R`,
              ])}
            />
            <p className="text-xs text-zinc-500 mt-3">
              Decyzja: tnij setupy z ujemnym Avg R, dopóki nie poprawisz procesu.
            </p>
          </CardContent>
        </Card>
      )}

      {tab === "bledy" && !isOnboarding && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-semibold mb-4">Błędy (dlaczego tracisz)</h3>
            <Table
              headers={["Błąd", "Trade", "Loss%"]}
              rows={stats.perMistake.map((m) => [
                m.mistake,
                String(m.trades),
                `${m.lossRate.toFixed(0)}%`,
              ])}
            />
            <p className="text-xs text-zinc-500 mt-3">
              Najpierw napraw TOP 1 błąd. To daje najszybszy skok w wynikach.
            </p>
          </CardContent>
        </Card>
      )}

      {tab === "sesje" && !isOnboarding && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-semibold mb-4">Sesje (gdzie masz edge)</h3>
            <Table
              headers={["Sesja", "Trade", "Avg R"]}
              rows={stats.perSession.map((s) => [
                s.session,
                String(s.trades),
                `${s.avgR.toFixed(2)}R`,
              ])}
            />
            <p className="text-xs text-zinc-500 mt-3">
              Jeśli jedna sesja ma wyraźnie lepszy Avg R, ogranicz trading poza nią.
            </p>
          </CardContent>
        </Card>
      )}

      {tab === "journal" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Dodaj trade</h3>

              <div className="space-y-3">
                <div>
                  <Label>Data</Label>
                  <Input
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="YYYY-MM-DD"
                  />
                </div>

                <div>
                  <Label>Rynek</Label>
                  <select
                    value={market}
                    onChange={(e) => setMarket(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
                  >
                    {["BTCUSDT", "ETHUSDT", "XAUUSD", "EURUSD"].map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>TF</Label>
                    <select
                      value={tf}
                      onChange={(e) => setTf(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
                    >
                      {["M1", "M5", "M15"].map((x) => (
                        <option key={x} value={x}>
                          {x}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Strona</Label>
                    <select
                      value={side}
                      onChange={(e) => setSide(e.target.value as TradeSide)}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
                    >
                      {["LONG", "SHORT"].map((x) => (
                        <option key={x} value={x}>
                          {x}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label>Setup</Label>
                  <Input value={setup} onChange={(e) => setSetup(e.target.value)} />
                </div>

                <div>
                  <Label>Wynik (R)</Label>
                  <Input
                    value={resultR}
                    onChange={(e) => setResultR(e.target.value)}
                    inputMode="decimal"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Błąd</Label>
                    <select
                      value={mistake}
                      onChange={(e) => setMistake(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
                    >
                      {[
                        "Brak",
                        "FOMO",
                        "Brak filtra M5",
                        "Brak potwierdzenia",
                        "Zły SL",
                        "Revenge trade",
                      ].map((x) => (
                        <option key={x} value={x}>
                          {x}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Sesja</Label>
                    <select
                      value={session}
                      onChange={(e) => setSession(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
                    >
                      {["London", "NY", "Asia", "Brak"].map((x) => (
                        <option key={x} value={x}>
                          {x}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label>Notatki</Label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="co było dobrze/źle"
                  />
                </div>

                <Button onClick={addTrade} className="w-full">
                  Dodaj trade
                </Button>

                {isOnboarding && (
                  <div className="text-xs text-zinc-500">
                    Po każdym trade: odpowiedz sobie, czy był zgodny z zasadami. Po
                    10 trade odblokujesz PRO.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardContent>
              <h3 className="text-lg font-semibold mb-4">Ostatnie trade</h3>

              <div className="overflow-auto rounded-2xl border border-zinc-800">
                <table className="min-w-full text-sm">
                  <thead className="bg-zinc-950">
                    <tr>
                      {["Data", "Rynek", "TF", "Strona", "Setup", "Błąd", "Sesja", "Wynik"].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-4 py-3 text-left font-semibold text-zinc-300 whitespace-nowrap"
                          >
                            {h}
                          </th>
                        )
                      )}
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((t) => (
                      <tr key={t.id} className="border-t border-zinc-800">
                        <td className="px-4 py-3 whitespace-nowrap">{t.date}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{t.market}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{t.tf}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{t.side}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{t.setup}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{t.mistake}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{t.session}</td>
                        <td className="px-4 py-3 whitespace-nowrap font-semibold">
                          {t.resultR > 0
                            ? `+${t.resultR.toFixed(2)}R`
                            : `${t.resultR.toFixed(2)}R`}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="outline"
                            onClick={() => updateTrades(trades.filter((x) => x.id !== t.id))}
                          >
                            Usuń
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ✅ FIX: opieramy warunek o state onboarding */}
              {isOnboarding && (onboarding.tradesCount ?? 0) >= 10 && (
                <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <h4 className="font-semibold mb-2">Onboarding: mini-analiza</h4>
                  <p className="text-sm text-zinc-400">
                    To nie są Twoje wyniki końcowe. To pierwsza próbka, która pokazuje proces.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Pill>Win rate: {stats.winRate.toFixed(0)}%</Pill>
                    <Pill>Avg R: {stats.avgR.toFixed(2)}R</Pill>
                    <Pill>Max DD: {stats.maxDD.toFixed(2)}R</Pill>
                  </div>

                  <div className="mt-3">
                    <p className="text-sm text-zinc-300 font-semibold">TOP błędy (z strat):</p>
                    <div className="mt-2 space-y-1 text-sm text-zinc-300">
                      {(stats.topMistakes.length ? stats.topMistakes : [["Brak", 0]] as any).map(
                        ([m, c]: any) => (
                          <div key={m} className="flex justify-between">
                            <span>{m}</span>
                            <span className="text-zinc-500">{c}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      onClick={() => {
                        setOnboarding({ ...getOnboarding(), completed: true, step: 999 });
                        setOnboardingState(getOnboarding());
                      }}
                    >
                      Odblokuj pełną wersję
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
