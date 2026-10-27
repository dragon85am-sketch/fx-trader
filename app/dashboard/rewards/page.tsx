"use client";

import { useCallback, useEffect, useState } from "react";
import { REWARD_LEVELS } from "@/lib/rewards-levels";
import {
  Award, CalendarDays, CheckCircle2, ChevronRight, CircleAlert, HelpCircle,
  Coins, Crown, Gem, Gift, Link2, Loader2, LockKeyhole,
  RefreshCw, ShieldCheck, Sparkles, TrendingUp, Trophy, Wallet, BarChart3, Download, FileImage,
} from "lucide-react";

type Trade = {
  id: string; instrument: string; lots: number; rewardUsd: number;
  level: number; closedAt: string;
};
type Payout = {
  id: string; amountUsd: number; status: string; createdAt: string;
};
type Data = {
  accountStatus: string; brokerAccountMasked: string | null;
  totalLots: number; earnedUsd: number;
  last30DaysLots: number; last30DaysUsd: number;
  level: {
    index: number; number: number; name: string; percentage: number;
    next: readonly [string, number, number] | null;
  };
  trades: Trade[]; payouts: Payout[];
};
const usd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
const qty = (n: number) => new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 2 }).format(n);
const date = (v: string) => new Date(v).toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" });
const card = "rounded-xl border border-[#0875d5]/70 bg-[linear-gradient(145deg,#062c58_0%,#031d3d_48%,#02142d_100%)] shadow-[inset_0_1px_0_rgba(114,218,255,.15),0_0_18px_rgba(0,119,255,.09)]";
const medalColors = [
  ["#ffad5c", "#a84a17"], ["#d6e7ff", "#6c8dbb"], ["#ffe079", "#b97600"],
  ["#e0eaff", "#647da9"], ["#45dfff", "#0069e8"], ["#40f1ff", "#007fc4"],
  ["#55f4c2", "#008866"], ["#ff718c", "#b20d3b"], ["#ca8bff", "#6727b7"],
  ["#ffcb68", "#b76712"], ["#ff88ec", "#a529a0"], ["#70dbff", "#007ac6"],
  ["#ffb265", "#c5540b"], ["#ffe67d", "#c98b0b"], ["#7fcaff", "#0453ca"],
] as const;

function RankMedal({ level, color, dark }: { level: number; color: string; dark: string }) {
  return <div className="relative mx-auto grid h-[66px] w-[66px] place-items-center" style={{ filter: `drop-shadow(0 0 9px ${dark})` }}>
    <svg viewBox="0 0 80 80" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs><linearGradient id={`medal-${level}`} x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor={color}/><stop offset=".55" stopColor={dark}/><stop offset="1" stopColor={color}/></linearGradient></defs>
      <path d="M22 5 40 14 58 5 61 19 74 24 67 40 74 55 59 61 55 75 40 67 25 75 21 61 6 55 13 40 6 24 19 19Z" fill={`url(#medal-${level})`} stroke={color} strokeWidth="1.5"/>
      <circle cx="40" cy="40" r="26" fill="#031b3c" stroke={color} strokeWidth="4"/>
      <circle cx="40" cy="40" r="20" fill={dark} fillOpacity=".65" stroke={color} strokeOpacity=".6"/>
      <path d="m31 14 9-8 9 8" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M30 24 40 20 50 24" fill="none" stroke="#ffffff" strokeOpacity=".55" strokeWidth="1.5"/>
    </svg>
    <span className="relative z-10 text-[27px] font-black italic tracking-tight text-white" style={{ textShadow: `0 1px 3px #00142d,0 0 8px ${color}` }}>{level}</span>
  </div>;
}

export default function RewardsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/rewards/overview", { cache: "no-store" });
      if (!response.ok) throw new Error(response.status === 401 ? "Zaloguj się ponownie." : "Nie udało się pobrać danych nagród.");
      setData(await response.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wystąpił błąd.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const total = data?.totalLots ?? 0;
  const currentIndex = data?.level.index ?? 0;
  const current = REWARD_LEVELS[currentIndex];
  const next = REWARD_LEVELS[currentIndex + 1];
  const progress = next
    ? Math.min(100, Math.max(0, ((total - current[1]) / (next[1] - current[1])) * 100))
    : 100;
  const verified = data?.accountStatus === "VERIFIED";

  return (
    <main className="min-h-screen bg-[#02162f] px-2 py-3 sm:px-3 lg:px-4 text-slate-100 sm:px-5 lg:px-7">
      <div className="mx-auto max-w-none space-y-3">
        <header className={`${card} relative overflow-hidden`}>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_60%_70%,rgba(0,125,255,.24),transparent_48%)]"/>
          <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-45" viewBox="0 0 1600 130" preserveAspectRatio="none" aria-hidden="true">
            {Array.from({length: 25},(_,i)=><line key={i} x1={i*65} x2={i*65} y1="0" y2="130" stroke="#187ac9" strokeOpacity=".2"/>)}
            {[20,50,80,110].map(y=><line key={y} x1="0" x2="1600" y1={y} y2={y} stroke="#187ac9" strokeOpacity=".2"/>)}
            <polyline points="580,120 650,112 710,116 760,90 815,96 870,72 920,83 990,47 1040,60 1090,27 1150,39 1200,14 1260,24 1320,4 1380,20 1440,0" fill="none" stroke="#00b7ff" strokeWidth="2.5"/>
          </svg>
          <div className="relative flex min-h-[126px] flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-7">
            <div className="flex items-center gap-4">
              <div className="grid h-[78px] w-[78px] place-items-center rounded-2xl border border-cyan-300/40 bg-[radial-gradient(circle_at_50%_65%,#0d6ac0,#04162d_75%)] shadow-[0_0_28px_rgba(0,159,255,.4)]">
                <Trophy className="h-12 w-12 text-cyan-200 drop-shadow-[0_0_9px_#00aaff]"/>
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-[.27em] text-cyan-300">FX TRADE / REWARDS PRO</p>
                <h1 className="mt-1 text-2xl font-black sm:text-4xl">Trading Rewards <span className="text-[#169cff]">PRO</span></h1>
                <p className="mt-1 text-xs text-slate-300 sm:text-sm">Zbieraj kwalifikujące się loty, awansuj w 15 rangach i odbieraj nagrody.</p>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <div className="hidden text-right lg:block"><p className="text-lg font-extrabold">Trade. Grow. <span className="text-cyan-300">Earn Rewards.</span></p><p className="text-xs text-slate-300">Handluj · Zbieraj loty · Awansuj · Odbieraj nagrody</p></div>
              <button type="button" onClick={() => setShowHelp(true)} className="flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-[#053266]/80 px-3 py-2 text-xs font-semibold text-white shadow-[0_0_12px_rgba(0,149,255,.25)] hover:bg-[#084681]"><HelpCircle className="h-4 w-4"/> Jak to działa?</button>
            </div>
          </div>
        </header>
        {showHelp && <div role="dialog" aria-modal="true" aria-label="Jak działa Trading Rewards" className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4" onClick={() => setShowHelp(false)}>
          <div className={`${card} w-full max-w-lg space-y-3 p-6`} onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Jak działa Trading Rewards?</h2><button onClick={()=>setShowHelp(false)} className="rounded-lg border border-sky-400/30 px-3 py-1.5 text-sm">Zamknij</button></div>
            <p className="text-sm text-slate-300">1. Po uruchomieniu integracji połącz i zweryfikuj konto TradeQuo.</p>
            <p className="text-sm text-slate-300">2. Zweryfikowane loty zwiększają Twój łączny wynik i odblokowują kolejne rangi.</p>
            <p className="text-sm text-slate-300">3. Zdobyta ranga pozostaje na stałe. Rozliczenia nagród odbywają się w okresach 30-dniowych.</p>
            <p className="text-xs text-amber-200">Połączenie brokera i wypłaty nie są jeszcze aktywne. Procenty oznaczają stawkę nagrody, nie zysk z handlu.</p>
          </div>
        </div>}

        {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 text-sm text-rose-200"><span className="flex items-center gap-2"><CircleAlert className="h-5 w-5" />{error}</span><button onClick={() => void load()} className="flex items-center gap-2 rounded-lg border border-rose-400/30 px-3 py-2"><RefreshCw className="h-4 w-4" /> Spróbuj ponownie</button></div>}
        {loading && <div className="flex items-center gap-2 text-sm text-cyan-200"><Loader2 className="h-4 w-4 animate-spin" /> Pobieranie danych nagród…</div>}

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className={`${card} p-5`}>
            <div className="flex items-start gap-3"><div className="rounded-xl bg-amber-400/10 p-3"><Crown className="h-7 w-7 text-amber-400" /></div><div><p className="text-xs text-slate-400">Twój aktualny poziom</p><p className="mt-1 text-2xl font-extrabold">Level {data?.level.number ?? "—"}</p><p className="text-sm font-semibold text-amber-400">{data?.level.name ?? "—"}</p></div></div>
            <div className="mt-4 flex justify-between text-xs text-slate-300"><span>{data ? `${qty(total)} / ${next ? qty(next[1]) : qty(total)} lotów` : "—"}</span><span>{data ? `${Math.round(progress)}%` : "—"}</span></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-300 transition-all" style={{ width: `${data ? progress : 0}%` }} /></div>
          </div>
          <div className={`${card} flex items-center gap-4 p-5`}><div className="rounded-xl bg-blue-500/20 p-3"><Coins className="h-8 w-8 text-cyan-300" /></div><div><p className="text-xs text-slate-400">Łącznie kwalifikujących się lotów</p><p className="mt-1 text-3xl font-bold">{data ? qty(total) : "—"}</p><p className="text-xs text-slate-400">Ostatnie 30 dni: {data ? qty(data.last30DaysLots) : "—"}</p></div></div>
          <div className={`${card} flex items-center gap-4 p-5`}><div className="rounded-xl bg-blue-500/20 p-3"><Gift className="h-8 w-8 text-cyan-300" /></div><div><p className="text-xs text-slate-400">Łącznie naliczone nagrody</p><p className="mt-1 text-3xl font-bold">{data ? usd(data.earnedUsd) : "—"}</p><p className="text-xs text-slate-400">Nie jest to saldo dostępne do wypłaty</p></div></div>
          <div className={`${card} flex items-center gap-4 p-5`}><div className="rounded-xl bg-blue-500/20 p-3"><CalendarDays className="h-8 w-8 text-cyan-300" /></div><div><p className="text-xs text-slate-400">Okres rozliczeniowy</p><p className="mt-1 text-lg font-bold">Ostatnie 30 dni</p><p className="mt-1 text-sm text-cyan-300">{data ? usd(data.last30DaysUsd) : "—"} nagród</p></div></div>
        </section>

        <section className={`${card} p-5`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3"><div className="rounded-xl border border-cyan-400/20 bg-sky-500/10 p-3"><Link2 className="h-6 w-6 text-cyan-300" /></div><div><h2 className="font-bold">Konto brokerskie TradeQuo</h2><p className="mt-1 text-xs text-slate-400">{verified ? `Konto zweryfikowane${data?.brokerAccountMasked ? ` · ${data.brokerAccountMasked}` : ""}` : "Połączenie i synchronizacja transakcji wymagają integracji z brokerem."}</p></div></div>
            <div className="flex items-center gap-3"><span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${verified ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300" : "border-amber-400/30 bg-amber-500/10 text-amber-300"}`}>{verified ? "Zweryfikowane" : "Niepołączone"}</span><button type="button" disabled title="Integracja TradeQuo nie jest jeszcze aktywna" className="cursor-not-allowed rounded-xl border border-sky-400/20 bg-blue-800/35 px-4 py-2.5 text-xs font-semibold text-slate-300 opacity-70">Połączenie — w przygotowaniu</button></div>
          </div>
          <div className="mt-4 grid gap-2 border-t border-sky-400/10 pt-4 sm:grid-cols-4">
            {["Połączenie konta", "Synchronizacja transakcji", "Weryfikacja lotów", "Naliczanie nagród"].map((step, i) => <div key={step} className="flex items-center gap-2 text-xs text-slate-400"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-sky-400/20 bg-sky-500/10 font-bold text-cyan-300">{i + 1}</span>{step}{i < 3 && <ChevronRight className="ml-auto hidden h-4 w-4 text-sky-500/30 sm:block" />}</div>)}
          </div>
        </section>

        <section className={`${card} p-4 sm:p-5`}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3"><Gem className="h-7 w-7 text-cyan-300" /><div><h2 className="text-lg font-bold">15 poziomów nagród</h2><p className="text-xs text-slate-400">Raz zdobyta ranga pozostaje na stałe. Loty sumują się między okresami rozliczeniowymi.</p></div></div>
            <span className="rounded-lg border border-sky-400/20 bg-sky-500/5 px-3 py-2 text-xs text-cyan-200"><ShieldCheck className="mr-1 inline h-4 w-4" /> Progi do 650 lotów</span>
          </div>
          <div className="overflow-x-auto pb-3" aria-label="Poziomy Trading Rewards — przewijaj poziomo">
            <div className="grid min-w-[1530px] grid-cols-15 gap-2" style={{gridTemplateColumns:"repeat(15,minmax(94px,1fr))"}}>
              {REWARD_LEVELS.map((rank, i) => {
                const active = data?.level.index === i;
                const unlocked = !!data && total >= rank[1];
                const upper = REWARD_LEVELS[i + 1]?.[1];
                const [color, dark] = medalColors[i];
                return <div key={rank[0]} className={`relative flex min-h-[205px] min-w-0 flex-col items-center rounded-xl border px-1.5 py-3 text-center ${active ? "border-cyan-200 bg-[#0a3764] shadow-[0_0_22px_rgba(0,184,255,.55),inset_0_0_15px_rgba(0,149,255,.2)]" : unlocked ? "border-cyan-500/50 bg-[#062950]" : "border-blue-500/35 bg-[#041b38]"}`}>
                  {active && <span className="absolute -top-2 rounded-full bg-cyan-500 px-2 py-0.5 text-[9px] font-bold text-white shadow-[0_0_12px_#00baff]">TWÓJ LEVEL</span>}
                  <RankMedal level={i + 1} color={color} dark={dark} />
                  <p className="mt-2 min-h-[32px] text-[11px] font-extrabold leading-4" style={{color}}>{rank[0]}</p>
                  <p className="text-xs font-bold text-slate-200">{upper ? `${qty(rank[1])}–${qty(upper - 1)}` : `${qty(rank[1])}+`}</p>
                  <p className="text-[10px] text-sky-300">lotów</p>
                  <div className="mt-auto w-full border-t border-blue-400/20 pt-2">
                    <p className="text-base font-extrabold text-white">{rank[2]}%</p>
                    <p className="text-[10px] text-slate-400">stawka nagrody</p>
                  </div>
                  {unlocked && !active && <CheckCircle2 className="absolute right-1 top-1 h-3 w-3 text-emerald-400"/>}
                </div>;
              })}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-sky-400/30 bg-sky-500/10 px-3 py-2 text-xs text-slate-400"><Sparkles className="h-4 w-4 shrink-0 text-cyan-300" />Procenty oznaczają poziom nagrody w programie. Nie przedstawiają zysku z handlu ani gwarantowanej wypłaty.</div>
        </section>

        <section className={`${card} flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5`}>
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-cyan-400/40 bg-cyan-500/10 shadow-[0_0_16px_rgba(0,185,255,.16)]">
              <FileImage className="h-6 w-6 text-cyan-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Tabela poziomów i symulacja nagród</h2>
              <p className="mt-1 text-xs text-slate-300">Pobierz grafikę z tabelą 15 poziomów, progami lotów i przykładowym czasem awansu.</p>
              <p className="mt-1 text-[11px] text-amber-200">Uwaga: grafika pokazuje próg Level 15 = 600 lotów; aktualny panel ma 650 lotów. Symulacja ma charakter orientacyjny.</p>
            </div>
          </div>
          <a
            href="/rewards/fx-trade-poziomy-1-15.png"
            download="FX-TRADE-Trading-Rewards-Poziomy-1-15.png"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-cyan-300/60 bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3 text-sm font-bold text-white shadow-[0_0_18px_rgba(0,160,255,.35)] transition hover:from-blue-500 hover:to-cyan-500"
          >
            <Download className="h-4 w-4" />
            Pobierz tabelę PNG
          </a>
        </section>

        <section className="grid gap-3 xl:grid-cols-2">
          <div className={`${card} min-w-0 p-5`}>
            <div className="mb-4 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-cyan-300" /><h2 className="font-bold">Ostatnie kwalifikujące się transakcje</h2></div>
            {data?.trades.length ? <div className="overflow-x-auto"><table className="w-full min-w-[570px] text-left text-xs"><thead><tr className="bg-sky-500/10 text-slate-300"><th className="rounded-l-lg p-3">Data zamknięcia</th><th className="p-3">Instrument</th><th className="p-3">Loty</th><th className="p-3">Nagroda</th><th className="p-3">Ranga</th><th className="rounded-r-lg p-3">Status</th></tr></thead><tbody>{data.trades.map(t => <tr key={t.id} className="border-b border-sky-400/10"><td className="p-3 text-slate-400">{date(t.closedAt)}</td><td className="p-3 font-semibold">{t.instrument}</td><td className="p-3">{qty(t.lots)}</td><td className="p-3 text-cyan-300">{usd(t.rewardUsd)}</td><td className="p-3 text-sky-300">L{t.level}</td><td className="p-3 text-emerald-300">Zweryfikowana</td></tr>)}</tbody></table></div>
              : <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-center"><LockKeyhole className="h-7 w-7 text-sky-300/70" /><p className="font-semibold">Brak zweryfikowanych transakcji</p><p className="max-w-sm text-xs text-slate-400">Transakcje pojawią się po podłączeniu konta i potwierdzeniu lotów przez brokera.</p></div>}
          </div>
          <div className={`${card} min-w-0 p-5`}>
            <div className="mb-4 flex items-center gap-2"><Wallet className="h-5 w-5 text-cyan-300" /><h2 className="font-bold">Historia wypłat nagród</h2></div>
            {data?.payouts.length ? <div className="overflow-x-auto"><table className="w-full min-w-[420px] text-left text-xs"><thead><tr className="bg-sky-500/10 text-slate-300"><th className="rounded-l-lg p-3">Data wniosku</th><th className="p-3">Kwota</th><th className="p-3">Ranga</th><th className="rounded-r-lg p-3">Status</th></tr></thead><tbody>{data.payouts.map(p => <tr key={p.id} className="border-b border-sky-400/10"><td className="p-3 text-slate-400">{date(p.createdAt)}</td><td className="p-3 text-cyan-300">{usd(p.amountUsd)}</td><td className="p-3">{p.status}</td></tr>)}</tbody></table></div>
              : <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-center"><Gift className="h-7 w-7 text-sky-300/70" /><p className="font-semibold">Brak wypłat</p><p className="text-xs text-slate-400">Tutaj pojawią się zatwierdzone wnioski i historia wypłat.</p></div>}
          </div>
        </section>
      </div>
    </main>
  );
}
