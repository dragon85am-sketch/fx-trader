import type React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AffiliateCampaignsClient from "@/components/affilatie/AffiliateCampaignsClient";

const nav = [
  ["Dashboard", "/dashboard/affiliate"],
  ["Kampanie", "/dashboard/affiliate/campaigns"],
  ["Prowizje", "/dashboard/affiliate/commissions"],
  ["Wypłaty", "/dashboard/affiliate/payouts"],
  ["Materiały", "/dashboard/affiliate/materials"],
] as const;

function euro(n: number) { return `${n.toFixed(2)} €`; }

export default async function AffiliateSubpage({ kind }: { kind: "campaigns" | "commissions" | "payouts" | "materials" }) {
  const auth = await requireAuth();
  if (!auth.ok) redirect("/login");
  const userId = auth.user.userId;

  const [stats, dash, sales, payouts] = await Promise.all([
    prisma.affiliateStat.findUnique({ where: { userId } }),
    prisma.dashboardStat.findUnique({ where: { userId } }),
    prisma.affiliateSale.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.payoutRequest.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);
  const referral = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/ref/${userId}`;
  const title = { campaigns: "Kampanie", commissions: "Prowizje", payouts: "Wypłaty", materials: "Materiały promocyjne" }[kind];

  return <main className="min-h-screen bg-[#030914] p-4 text-white md:p-7">
    <div className="mx-auto max-w-[1500px]">
      <div className="rounded-[22px] border border-sky-400/20 bg-[linear-gradient(135deg,#071b34,#06111f)] p-5">
        <div className="text-[10px] font-black uppercase tracking-[.2em] text-sky-300">Affiliate Hub</div>
        <h1 className="mt-1 text-3xl font-black">{title}</h1>
        <div className="mt-5 flex flex-wrap gap-2">{nav.map(([label, href]) => <Link key={href} href={href} className="rounded-xl border border-sky-400/15 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-100 hover:bg-sky-500/20">{label}</Link>)}</div>
      </div>

      {kind === "campaigns" && <section className="mt-4"><AffiliateCampaignsClient referral={referral} /></section>}

      {kind === "commissions" && <section className="mt-4">
        <div className="mb-4 grid gap-3 sm:grid-cols-3"><Card title="Oczekujące"><Big>{euro(stats?.pendingCommission ?? 0)}</Big></Card><Card title="Dostępne"><Big>{euro(stats?.availablePayout ?? 0)}</Big></Card><Card title="Łącznie zarobione"><Big>{euro(stats?.totalEarned ?? 0)}</Big></Card></div>
        <Table headers={["Data","Kupujący","Prowizja","Status"]} rows={sales.map(x=>[x.createdAt.toLocaleDateString("pl-PL"),x.buyer,euro(x.amount),x.status])} empty="Brak naliczonych prowizji."/>
      </section>}

      {kind === "payouts" && <section className="mt-4">
        <div className="mb-4 grid gap-3 sm:grid-cols-2"><Card title="Dostępne do wypłaty"><Big>{euro(stats?.availablePayout ?? 0)}</Big></Card><Card title="Minimalna wypłata"><Big>50,00 €</Big></Card></div>
        <Table headers={["Data","Kwota","Status","ID transferu"]} rows={payouts.map(x=>[x.createdAt.toLocaleDateString("pl-PL"),euro(x.amount),x.status,x.stripeTransferId ?? "—"])} empty="Brak historii wypłat."/>
        <p className="mt-3 text-xs text-slate-500">Żądanie wypłaty i Stripe Connect pozostają obsługiwane z głównego Dashboardu Affiliate.</p>
      </section>}

      {kind === "materials" && <section className="mt-4">
        <div className="mb-4"><h2 className="text-xl font-black">Materiały do promocji FX TRADE</h2><p className="mt-1 text-xs text-slate-400">TikTok, Stories, posty, bannery i tapety. Każdy plik możesz pobrać i dodać do niego swój link polecający.</p></div>
        <div className="mb-5 grid gap-4 md:grid-cols-3">
          {[
            ["TikTok • FX TRADE", "/downloads/tiktok-fx-trade.mp4"],
            ["TikTok • PRO Scanner", "/downloads/tiktok-pro-scanner.mp4"],
            ["TikTok • Gold Scalping", "/downloads/tiktok-gold-scalping.mp4"],
          ].map(([name,src])=><div key={src} className="rounded-[18px] border border-fuchsia-400/15 bg-[#071522] p-4"><div className="text-xs font-black uppercase tracking-wider text-fuchsia-300">{name}</div><video src={src} controls muted playsInline className="mx-auto mt-3 aspect-[9/16] max-h-[440px] w-full rounded-xl bg-black object-cover"/><a href={src} download className="mt-3 inline-flex rounded-xl bg-fuchsia-500 px-4 py-2.5 text-xs font-black text-white hover:bg-fuchsia-400">Pobierz film MP4</a></div>)}
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          ["TikTok • FX TRADE", "/affiliate-hub-bg.png", "Format promocyjny do TikTok / Reels", "1080 × 1920"],
          ["PRO FX Scanner", "/pro-fx-scanner.png", "Promocja skanera PRO i sygnałów", "1920 × 1080"],
          ["Trading Room", "/trading-room-market-bg.png", "Promocja analiz i Trading Room", "1920 × 1080"],
          ["FX Academy", "/fx-trade-academy-bg.png", "Promocja Akademii FX TRADE", "1920 × 1080"],
          ["Setupy tradingowe", "/setupy-glow-bg.png", "Grafika do postów edukacyjnych", "1920 × 1080"],
          ["Materiały bonusowe", "/materialy-bonusowe-bg.png", "Grafika do promocji bonusów", "1920 × 1080"],
          ["Sesje LIVE", "/sessions-bg-left.png", "Banner do promocji sesji LIVE", "1920 × 1080"],
          ["Gold Scalping", "/gold-scalping-scanner.png", "Materiał promujący scalping XAUUSD", "1920 × 1080"],
          ["Tapeta FX TRADE", "/affiliate-hub-bg.png", "Tapeta desktop / social background", "Desktop"],
        ].map(([name,img,desc,size])=><Card key={name} title={name}><div className="aspect-video overflow-hidden rounded-xl border border-white/10 bg-black/20"><img src={img} alt={name} className="h-full w-full object-cover"/></div><p className="mt-3 text-xs text-slate-400">{desc}</p><div className="mt-1 text-[10px] text-slate-500">{size}</div><a href={img} download className="mt-3 inline-flex rounded-xl bg-sky-500 px-4 py-2.5 text-xs font-black text-white hover:bg-sky-400">Pobierz materiał</a></Card>)}
        </div>
      </section>}
    </div>
  </main>;
}

function Card({title,children}:{title:string;children:React.ReactNode}) { return <div className="rounded-[18px] border border-sky-400/15 bg-[#071522] p-5"><div className="mb-3 text-xs font-black uppercase tracking-wider text-sky-300">{title}</div>{children}</div> }
function Big({children}:{children:React.ReactNode}) { return <div className="text-3xl font-black">{children}</div> }
function Table({headers,rows,empty}:{headers:string[];rows:string[][];empty:string}) { return <div className="overflow-x-auto rounded-[18px] border border-sky-400/15 bg-[#071522]"><div className="min-w-[700px]"><div className="grid bg-white/[.04] px-4 py-3 text-[10px] font-black uppercase text-slate-400" style={{gridTemplateColumns:`repeat(${headers.length},minmax(0,1fr))`}}>{headers.map(h=><div key={h}>{h}</div>)}</div>{rows.length?rows.map((r,i)=><div key={i} className="grid border-t border-white/[.06] px-4 py-3 text-xs" style={{gridTemplateColumns:`repeat(${headers.length},minmax(0,1fr))`}}>{r.map((v,j)=><div key={j}>{v}</div>)}</div>):<div className="p-6 text-sm text-slate-500">{empty}</div>}</div></div> }
