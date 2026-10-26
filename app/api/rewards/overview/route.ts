import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/server-auth";
import { PrismaClient } from "@prisma/client";
import { getRewardLevel } from "@/lib/rewards-levels";
export const dynamic = "force-dynamic";
const prisma = new PrismaClient();
export async function GET() {
  const auth = await getServerUser();
  if (!auth?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [account, trades, payouts] = await Promise.all([
    prisma.rewardAccount.findUnique({ where: { userId: auth.userId } }),
    prisma.rewardLot.findMany({ where: { userId: auth.userId, status: "VERIFIED" }, orderBy: { closedAt: "desc" }, take: 10000 }),
    prisma.rewardPayout.findMany({ where: { userId: auth.userId }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  const totalLots = trades.reduce((sum,t)=>sum+Number(t.lots),0);
  const earnedUsd = trades.reduce((sum,t)=>sum+Number(t.rewardUsd),0);
  const since = new Date(); since.setUTCDate(since.getUTCDate()-30);
  const monthTrades = trades.filter(t=>t.closedAt>=since);
  return NextResponse.json({
    accountStatus: account?.status ?? "NOT_CONNECTED",
    brokerAccountMasked: account?.brokerAccountMasked ?? null,
    totalLots, earnedUsd, level: getRewardLevel(totalLots),
    last30DaysLots: monthTrades.reduce((sum,t)=>sum+Number(t.lots),0),
    last30DaysUsd: monthTrades.reduce((sum,t)=>sum+Number(t.rewardUsd),0),
    trades: trades.slice(0,30).map(t=>({ id:t.id, instrument:t.instrument, lots:Number(t.lots), rewardUsd:Number(t.rewardUsd), level:t.levelAtTrade, closedAt:t.closedAt.toISOString() })),
    payouts: payouts.map(p=>({id:p.id,amountUsd:Number(p.amountUsd),status:p.status,createdAt:p.createdAt.toISOString()})),
  }, { headers: { "Cache-Control": "private, no-store" } });
}
