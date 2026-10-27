"use client";

import { useCallback, useEffect, useState } from "react";
import { REWARD_LEVELS } from "@/lib/rewards-levels";
import {
  Award, CalendarDays, CheckCircle2, ChevronRight, CircleAlert,
  Coins, Crown, Gem, Gift, Link2, Loader2, LockKeyhole,
  RefreshCw, ShieldCheck, Sparkles, TrendingUp, Trophy, Wallet, BarChart3,
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
const card = "rounded-xl border border-[#1366ae]/50 bg-[linear-gradient(155deg,#06244c_0%,#04172f_54%,#03132b_100%)] shadow-[inset_0_1px_0_rgba(125,211,252,.08),0_10px_30px_rgba(0,0,0,.2)]";
const rankColors = [
  "text-amber-400", "text-slate-200", "text-yellow-400", "text-slate-300",
  "text-cyan-300", "text-teal-300", "text-emerald-300", "text-rose-400",
  "text-violet-300", "text-amber-300", "text-fuchsia-300", "text-sky-300",
  "text-orange-300", "text-yellow-300", "text-blue-300",
];
export default function RewardsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
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
    <main className="min-h-screen bg-[#031329] px-3 py-4 text-slate-100 sm:px-5 lg:px-7">
      <div className="mx-auto max-w-[1800px] space-y-4">
        <header className={`${card} relative overflow-hidden`}>
          <div className="grid lg:grid-cols-[1fr_1.05fr]">
            <div className="relative flex items-center gap-4 p-5 sm:p-6">
              <div className="rounded-xl border border-cyan-400/40 bg-blue-500/15 p-3 shadow-[0_0_25px_rgba(0,153,255,.3)]"><Trophy className="h-10 w-10 text-cyan-300" /></div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-cyan-400">FX TRADE / REWARDS PRO</p>
                <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Trading Rewards <span className="text-[#17aaff]">PRO</span></h1>
                <p className="mt-1 text-xs text-slate-300">Zbieraj kwalifikujące się loty, awansuj w 15 rangach i odbieraj nagrody.</p>
              </div>
            </div>
            <div className="relative min-h-[120px] overflow-hidden border-t border-blue-500/20 bg-[radial-gradient(ellipse_at_60%_100%,rgba(0,122,255,.26),transparent_65%)] px-6 py-5 lg:border-l lg:border-t-0">
              <svg aria-hidden="true" className="absolute inset-0 h-full w-full opacity-65" viewBox="0 0 650 140" preserveAspectRatio="none">
                <defs><linearGradient id="fxRewardsChart" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#0ea5e9" stopOpacity=".35"/><stop offset="1" stopColor="#0ea5e9" stopOpacity="0"/></linearGradient></defs>
                {Array.from({length: 15}, (_,i)=><line key={i} x1={i*50} y1="0" x2={i*50} y2="140" stroke="#1676c4" strokeOpacity=".14"/>)}
                {[20,50,80,110].map(y=><line key={y} x1="0" y1={y} x2="650" y2={y} stroke="#1676c4" strokeOpacity=".15"/>)}
                <path d="M0 125 L50 116 L85 120 L130 95 L175 102 L220 82 L260 92 L305 69 L345 78 L385 49 L425 59 L470 40 L510 47 L555 20 L605 28 L650 5 L650 140 L0 140 Z" fill="url(#fxRewardsChart)"/>
                <polyline points="0,125 50,116 85,120 130,95 175,102 220,82 260,92 305,69 345,78 385,49 425,59 470,40 510,47 555,20 605,28 650,5" fill="none" stroke="#00aaff" strokeWidth="2.5"/>
              </svg>
              <div className="relative z-10 ml-auto max-w-sm rounded-xl bg-[#04142c]/65 p-3 backdrop-blur-sm">
                <p className="text-lg font-extrabold text-white">Trade. Grow. <span className="text-cyan-300">Earn Rewards.</span></p>
                <p className="mt-1 text-xs text-slate-300">Handluj · Zbieraj loty · Awansuj · Odbieraj nagrody</p>
              </div>
            </div>
          </div>
        </header>

        {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 text-sm text-rose-200"><span className="flex items-center gap-2"><CircleAlert className="h-5 w-5" />{error}</span><button onClick={() => void load()} className="flex items-center gap-2 rounded-lg border border-rose-400/30 px-3 py-2"><RefreshCw className="h-4 w-4" /> Spróbuj ponownie</button></div>}
        {loading && <div className="flex items-center gap-2 text-sm text-cyan-200"><Loader2 className="h-4 w-4 animate-spin" /> Pobieranie danych nagród…</div>}

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className={`${card} p-5`}>
            <div className="flex items-start gap-3"><div className="rounded-xl bg-amber-400/10 p-3"><Crown className="h-7 w-7 text-amber-400" /></div><div><p className="text-xs text-slate-400">Twój aktualny poziom</p><p className="mt-1 text-2xl font-extrabold">Level {data?.level.number ?? "—"}</p><p className="text-sm font-semibold text-amber-400">{data?.level.name ?? "—"}</p></div></div>
            <div className="mt-4 flex justify-between text-xs text-slate-300"><span>{data ? `${qty(total)} / ${next ? qty(next[1]) : qty(total)} lotów` : "—"}</span><span>{data ? `${Math.round(progress)}%` : "—"}</span></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-300 transition-all" style={{ width: `${data ? progress : 0}%` }} /></div>
          </div>
          <div className={`${card} flex items-center gap-4 p-5`}><div className="rounded-xl bg-sky-500/10 p-3"><Coins className="h-8 w-8 text-cyan-300" /></div><div><p className="text-xs text-slate-400">Łącznie kwalifikujących się lotów</p><p className="mt-1 text-3xl font-bold">{data ? qty(total) : "—"}</p><p className="text-xs text-slate-400">Ostatnie 30 dni: {data ? qty(data.last30DaysLots) : "—"}</p></div></div>
          <div className={`${card} flex items-center gap-4 p-5`}><div className="rounded-xl bg-sky-500/10 p-3"><Gift className="h-8 w-8 text-cyan-300" /></div><div><p className="text-xs text-slate-400">Łącznie naliczone nagrody</p><p className="mt-1 text-3xl font-bold">{data ? usd(data.earnedUsd) : "—"}</p><p className="text-xs text-slate-400">Nie jest to saldo dostępne do wypłaty</p></div></div>
          <div className={`${card} flex items-center gap-4 p-5`}><div className="rounded-xl bg-sky-500/10 p-3"><CalendarDays className="h-8 w-8 text-cyan-300" /></div><div><p className="text-xs text-slate-400">Okres rozliczeniowy</p><p className="mt-1 text-lg font-bold">Ostatnie 30 dni</p><p className="mt-1 text-sm text-cyan-300">{data ? usd(data.last30DaysUsd) : "—"} nagród</p></div></div>
        </section>

        <section className={`${card} p-5`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3"><div className="rounded-xl border border-cyan-400/20 bg-sky-500/10 p-3"><Link2 className="h-6 w-6 text-cyan-300" /></div><div><h2 className="font-bold">Konto brokerskie TradeQuo</h2><p className="mt-1 text-xs text-slate-400">{verified ? `Konto zweryfikowane${data?.brokerAccountMasked ? ` · ${data.brokerAccountMasked}` : ""}` : "Połączenie i synchronizacja transakcji wymagają integracji z brokerem."}</p></div></div>
            <div className="flex items-center gap-3"><span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${verified ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300" : "border-amber-400/30 bg-amber-500/10 text-amber-300"}`}>{verified ? "Zweryfikowane" : "Niepołączone"}</span><button type="button" disabled title="Integracja TradeQuo nie jest jeszcze aktywna" className="cursor-not-allowed rounded-xl border border-sky-400/20 bg-slate-700/60 px-4 py-2.5 text-xs font-semibold text-slate-300 opacity-70">Połączenie — w przygotowaniu</button></div>
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
          <div className="flex gap-2 overflow-x-auto pb-3 [scrollbar-width:thin] [scrollbar-color:#147dc0_#031329]">
            {REWARD_LEVELS.map((rank, i) => {
              const active = data?.level.index === i;
              const unlocked = !!data && total >= rank[1];
              const upper = REWARD_LEVELS[i + 1]?.[1];
              return <div key={rank[0]} className={`relative flex min-h-[184px] min-w-[112px] flex-[1_0_112px] flex-col items-center rounded-lg border px-1.5 py-3 text-center transition-all ${active ? "border-cyan-300 bg-[#0b3560] shadow-[0_0_20px_rgba(14,165,233,.45)]" : unlocked ? "border-sky-400/35 bg-sky-950/35" : "border-sky-400/25 bg-[#04162f]/90"}`}>
                {active && <span className="absolute -top-2 rounded-full bg-cyan-500 px-2 py-0.5 text-[9px] font-bold text-white">TWÓJ LEVEL</span>}
                <div className={`relative mt-1 grid h-12 w-12 place-items-center rounded-xl border border-current/20 bg-white/5 ${rankColors[i]}`}><Award className="h-9 w-9 drop-shadow-[0_0_8px_currentColor]" /><span className="absolute text-xs font-black text-white">{i + 1}</span></div>
                <p className={`mt-3 text-[11px] font-bold ${rankColors[i]}`}>{rank[0]}</p>
                <p className="mt-1 text-[10px] text-slate-300">{upper ? `${qty(rank[1])}–${qty(upper - 1)}` : `${qty(rank[1])}+`} lotów</p>
                <div className="mt-auto w-full border-t border-sky-400/10 pt-2"><p className="text-sm font-extrabold text-cyan-200">{rank[2]}%</p><p className="text-[10px] text-slate-500">stawka nagrody</p></div>
                {unlocked && !active && <CheckCircle2 className="absolute right-1 top-1 h-3 w-3 text-emerald-400" />}
              </div>;
            })}
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-sky-400/15 bg-sky-500/5 px-3 py-2 text-xs text-slate-400"><Sparkles className="h-4 w-4 shrink-0 text-cyan-300" />Procenty oznaczają poziom nagrody w programie. Nie przedstawiają zysku z handlu ani gwarantowanej wypłaty.</div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
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
