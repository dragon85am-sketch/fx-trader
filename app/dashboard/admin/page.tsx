import { redirect } from "next/navigation";

import AdminUsersTable from "@/components/admin/AdminUsersTable";
import AdminUsersChart from "@/components/admin/AdminUsersChart";
import AdminRevenueChart from "@/components/admin/AdminRevenueChart";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

function AdminStatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="text-xs uppercase tracking-[0.18em] text-white/40">
        {label}
      </div>

      <div className="mt-3 text-3xl font-bold text-white">
        {value}
      </div>
    </div>
  );
}

export default async function AdminPage() {
  const auth = await requireAdmin();

  if (!auth.ok) {
    redirect("/dashboard");
  }

  const [
  users,
  affiliateStats,
  subscriptions,
  payments,
  activities,
] = await Promise.all([
  prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isPremium: true,
      isBanned: true,
      premiumUntil: true,
      createdAt: true,
    },
  }),

  prisma.affiliateStat.findMany({
    select: {
      id: true,
      totalEarned: true,
      pendingCommission: true,
      availablePayout: true,
      user: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  }),

  stripe.subscriptions.list({
    status: "active",
    limit: 100,
  }),

  stripe.paymentIntents.list({
    limit: 10,
    expand: ["data.customer", "data.latest_charge"],
  }),

  prisma.activityLog.findMany({
    take: 10,
    orderBy: {
      createdAt: "desc",
    },
  }),
]);

  const totalUsers = users.length;
  const premiumUsers = users.filter((user) => user.isPremium).length;
  const bannedUsers = users.filter((user) => user.isBanned).length;
  const admins = users.filter((user) => user.role === "admin").length;

  const affiliateRevenue = affiliateStats.reduce(
    (sum, stat) => sum + stat.totalEarned,
    0
  );

  const affiliatePending = affiliateStats.reduce(
    (sum, stat) => sum + stat.pendingCommission,
    0
  );

  const affiliateAvailable = affiliateStats.reduce(
    (sum, stat) => sum + stat.availablePayout,
    0
  );

  const affiliateCount = affiliateStats.length;
  const activeSubscriptions = subscriptions.data.length;

  const mrr =
    subscriptions.data.reduce((sum: number, sub: Stripe.Subscription) => {
      const amount = sub.items.data.reduce(
        (itemSum: number, item: Stripe.SubscriptionItem) => {
          return itemSum + (item.price.unit_amount ?? 0);
        },
        0
      );

      return sum + amount;
    }, 0) / 100;

  const usersChartData = users
    .slice()
    .reverse()
    .map((user, index) => ({
      date: new Date(user.createdAt).toLocaleDateString(),
      users: index + 1,
    }));

  const revenueChartData = [
    {
      month: "Current",
      revenue: Number(mrr.toFixed(2)),
    },
  ];

  return (
    <div className="p-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white">
          Admin Panel
        </h1>

        <p className="mt-2 text-white/50">
          Zarządzanie użytkownikami i subskrypcjami
        </p>

        <a
          href="/api/admin/export-users"
          className="mt-5 inline-flex rounded-2xl border border-blue-500/30 bg-blue-500/10 px-5 py-3 text-sm font-semibold text-blue-200 transition hover:bg-blue-500/20 hover:text-white"
        >
          Export Report Affiate Users
        </a>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        <AdminStatCard label="Total Users" value={totalUsers} />
        <AdminStatCard label="Premium Users" value={premiumUsers} />
        <AdminStatCard label="Banned Users" value={bannedUsers} />
        <AdminStatCard label="Admins" value={admins} />
        <AdminStatCard
          label="Affiliate Revenue"
          value={`${affiliateRevenue}€`}
        />
        <AdminStatCard label="Active Subs" value={activeSubscriptions} />
        <AdminStatCard label="MRR" value={`${mrr.toFixed(2)}€`} />
      </div>

      <div className="mb-8">
        <AdminUsersChart data={usersChartData} />
      </div>

      <div className="mb-8">
        <AdminRevenueChart data={revenueChartData} />
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <AdminStatCard label="Affiliates" value={affiliateCount} />
        <AdminStatCard
          label="Affiliate Pending"
          value={`${affiliatePending}€`}
        />
        <AdminStatCard
          label="Affiliate Available"
          value={`${affiliateAvailable}€`}
        />
      </div>
<div className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
  <div className="border-b border-white/10 px-6 py-5">
    <h2 className="text-xl font-semibold text-white">
      TOP Affiliates
    </h2>

    <p className="mt-1 text-sm text-white/40">
      Najlepsi partnerzy według zarobków
    </p>
  </div>

  <table className="w-full">
    <thead className="border-b border-white/10 bg-white/[0.03]">
      <tr className="text-left text-sm text-white/60">
        <th className="px-6 py-4">#</th>
        <th className="px-6 py-4">Partner</th>
        <th className="px-6 py-4">Email</th>
        <th className="px-6 py-4">Sales</th>
        <th className="px-6 py-4">Earned</th>
        <th className="px-6 py-4">Pending</th>
        <th className="px-6 py-4">Available</th>
      </tr>
    </thead>

    <tbody>
      {affiliateStats
        .slice()
        .sort((a, b) => b.totalEarned - a.totalEarned)
        .slice(0, 10)
        .map((affiliate, index) => (
          <tr
            key={affiliate.id}
            className="border-b border-white/5 text-sm text-white/80"
          >
            <td className="px-6 py-4 text-xl">
  {index === 0
    ? "🥇"
    : index === 1
    ? "🥈"
    : index === 2
    ? "🥉"
    : `#${index + 1}`}
</td>

            <td className="px-6 py-4 font-medium">
  {affiliate.user?.name || "Brak"}
  {index === 0 && " 👑"}
</td>
            <td className="px-6 py-4 text-white/50">
              {affiliate.user?.email || "-"}
            </td>

            <td className="px-6 py-4 text-white/50">
              -
            </td>

            <td className="px-6 py-4 text-emerald-300">
              €{affiliate.totalEarned.toFixed(2)}
            </td>

            <td className="px-6 py-4 text-amber-300">
              €{affiliate.pendingCommission.toFixed(2)}
            </td>

            <td className="px-6 py-4 text-cyan-300">
              €{affiliate.availablePayout.toFixed(2)}
            </td>
          </tr>
        ))}
    </tbody>
  </table>
</div>
      <div className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
        <div className="border-b border-white/10 px-6 py-5">
          <h2 className="text-xl font-semibold text-white">
            Recent Payments
          </h2>

          <p className="mt-1 text-sm text-white/40">
            Ostatnie płatności Stripe
          </p>
        </div>

        <table className="w-full">
          <thead className="border-b border-white/10 bg-white/[0.03]">
            <tr className="text-left text-sm text-white/60">
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Currency</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Payment ID</th>
              <th className="px-6 py-4">Date</th>
            </tr>
          </thead>

          <tbody>
            {payments.data.map((payment) => (
              <tr
                key={payment.id}
                className="border-b border-white/5 text-sm text-white/80"
              >
                <td className="px-6 py-4">
                  {(payment.amount / 100).toFixed(2)}
                </td>

                <td className="px-6 py-4 uppercase">
                  {payment.currency}
                </td>

                <td className="px-6 py-4">
                  {payment.status}
                </td>

                <td className="px-6 py-4">
                  {typeof payment.customer === "object" &&
                  payment.customer &&
                  "email" in payment.customer
                    ? payment.customer.email || payment.customer.id
                    : typeof payment.customer === "string"
                    ? payment.customer
                    : "-"}
                </td>

                <td className="px-6 py-4 text-xs text-white/50">
                  {payment.id}
                </td>

                <td className="px-6 py-4">
                  {new Date(payment.created * 1000).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
        <div className="border-b border-white/10 px-6 py-5">
          <h2 className="text-xl font-semibold text-white">
            Activity Feed
          </h2>

          <p className="mt-1 text-sm text-white/40">
            Recent admin activity
          </p>
        </div>

        <div className="divide-y divide-white/5">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between px-6 py-4"
            >
              <div>
                <div className="text-sm text-white">
                  {activity.message}
                </div>

                <div className="mt-1 text-xs uppercase tracking-[0.14em] text-white/30">
                  {activity.type}
                </div>
              </div>

              <div className="text-xs text-white/40">
                {new Date(activity.createdAt).toLocaleString()}
              </div>
            </div>
          ))}

          {activities.length === 0 && (
            <div className="px-6 py-8 text-center text-sm text-white/40">
              No activity yet.
            </div>
          )}
        </div>
      </div>

      <AdminUsersTable users={users} />
    </div>
  );
}