import { prisma } from "@/lib/prisma";
import { requireServerAdmin } from "@/lib/server-auth";
import AdminPayoutActions from "@/components/AdminPayoutActions";
import PayoutStatusBadge from "@/components/PayoutStatusBadge";
import StripeBalanceCard from "@/components/admin/StripeBalanceCard";

function formatEuro(value: number) {
  return `${value}â‚¬`;
}

export default async function AdminPayoutsPage() {
  await requireServerAdmin();

const affiliateStats = await prisma.affiliateStat.findMany({
  orderBy: {
    totalEarned: "desc",
  },
});
const affiliateUserIds = affiliateStats.map((stat) => stat.userId);

const affiliateUsers = await prisma.user.findMany({
  where: {
    id: {
      in: affiliateUserIds,
    },
  },
  select: {
    id: true,
    email: true,
    name: true,
  },
});
  const payouts = await prisma.payoutRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
       select: {
  email: true,
  name: true,
  stripeAccountId: true,
  payoutsEnabled: true,
},
      },
    },
  });

  const pendingCount = payouts.filter((p) => p.status === "Pending").length;
  const approvedCount = payouts.filter((p) => p.status === "Approved").length;
  const paidCount = payouts.filter((p) => p.status === "Paid").length;
  const rejectedCount = payouts.filter((p) => p.status === "Rejected").length;
  const totalAmount = payouts.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6 p-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h1 className="text-2xl font-semibold">Admin â€” wypÅ‚aty</h1>

        <div className="mb-6">
          <StripeBalanceCard />
        </div>

        <p className="mt-2 text-sm text-white/55">
          ZarzÄ…dzanie payout requestami uÅ¼ytkownikÃ³w.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-white/40">
              Pending
            </div>
            <div className="mt-2 text-2xl font-semibold text-amber-300">
              {pendingCount}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-white/40">
              Approved
            </div>
            <div className="mt-2 text-2xl font-semibold text-blue-300">
              {approvedCount}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-white/40">
              Paid
            </div>
            <div className="mt-2 text-2xl font-semibold text-emerald-300">
              {paidCount}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-white/40">
              Rejected
            </div>
            <div className="mt-2 text-2xl font-semibold text-rose-300">
              {rejectedCount}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-white/40">
              ÅÄ…czna kwota
            </div>
            <div className="mt-2 text-2xl font-semibold text-cyan-300">
              {formatEuro(totalAmount)}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.04] text-zinc-400">
            <tr>
              <th className="px-4 py-3 text-left">Data</th>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Kwota</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Stripe Connect</th>
              <th className="px-4 py-3 text-left">Stripe Transfer</th>
              <th className="px-4 py-3 text-left">Akcja</th>
            </tr>
          </thead>

          <tbody>
            {payouts.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-zinc-400">
                  Brak wnioskÃ³w
                </td>
              </tr>
            ) : (
              payouts.map((payout) => (
                <tr key={payout.id} className="border-t border-white/10">
                  <td className="px-4 py-4">
                    {new Date(payout.createdAt).toLocaleDateString("pl-PL")}
                  </td>

                  <td className="px-4 py-4 font-medium">
                    {payout.user.name || "Brak nazwy"}
                  </td>

                  <td className="px-4 py-4 text-zinc-300">
                    {payout.user.email}
                  </td>

                  <td className="px-4 py-4 font-semibold text-blue-300">
                    {formatEuro(payout.amount)}
                  </td>

                  <td className="px-4 py-4">
                    <PayoutStatusBadge status={payout.status} />
                  </td>
                  <td className="px-4 py-4">
  {payout.user.payoutsEnabled ? (
    <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
      Connected
    </span>
  ) : payout.user.stripeAccountId ? (
    <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs text-amber-300">
      Pending
    </span>
  ) : (
    <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs text-red-300">
      Not connected
    </span>
  )}
</td>
                 <td className="px-4 py-4">
  {payout.stripeTransferId ? (
    <a
      href={`https://dashboard.stripe.com/test/transfers/${payout.stripeTransferId}`}
      target="_blank"
      rel="noreferrer"
      className="text-cyan-400 hover:text-cyan-300"
    >
      Open
    </a>
  ) : (
    "-"
  )}
</td>
                  <td className="px-4 py-4">
                    <AdminPayoutActions
                      payoutId={payout.id}
                      currentStatus={payout.status}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="border-b border-white/10 px-6 py-5">
          <h2 className="text-xl font-semibold text-white">
            Top Affiliate Accounts
          </h2>

          <p className="mt-1 text-sm text-white/40">
            Affiliate earnings overview
          </p>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-white/[0.04] text-zinc-400">
            <tr>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Earned</th>
              <th className="px-4 py-3 text-left">Pending</th>
              <th className="px-4 py-3 text-left">Available</th>
            </tr>
          </thead>

          <tbody>
            {affiliateStats.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-zinc-400">
                  Brak danych afiliacyjnych
                </td>
              </tr>
            ) : (
              affiliateStats.map((affiliate) => (
                <tr key={affiliate.id} className="border-t border-white/10">
                  <td className="px-4 py-4 font-medium">
                    {affiliateUsers.find((user) => user.id === affiliate.userId)?.name || "Brak"}
                  </td>

                  <td className="px-4 py-4 text-zinc-300">
                    {affiliateUsers.find((user) => user.id === affiliate.userId)?.email || "-"}
                  </td>

                  <td className="px-4 py-4 text-emerald-300">
                    â‚¬{affiliate.totalEarned.toFixed(2)}
                  </td>

                  <td className="px-4 py-4 text-amber-300">
                    â‚¬{affiliate.pendingCommission.toFixed(2)}
                  </td>

                  <td className="px-4 py-4 text-cyan-300">
                    â‚¬{affiliate.availablePayout.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
