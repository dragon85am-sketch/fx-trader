import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminUserPage({
  params,
}: Props) {
  const auth = await requireAdmin();

  if (!auth.ok) {
    redirect("/dashboard");
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: {
      id,
    },

    include: {
      affiliateStat: true,
      affiliateSales: true,
      payoutRequests: true,
    },
  });

  if (!user) {
    redirect("/dashboard/admin");
  }

  return (
    <div className="p-10">

      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white">
          {user.name || "User"}
        </h1>

        <p className="mt-2 text-white/50">
          {user.email}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="mb-6 text-xl font-semibold text-white">
            Account
          </h2>

          <div className="space-y-3 text-sm">

            <div className="flex justify-between">
              <span className="text-white/50">
                Role
              </span>

              <span className="text-white">
                {user.role}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-white/50">
                Premium
              </span>

              <span className="text-white">
                {user.isPremium ? "YES" : "NO"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-white/50">
                Premium Until
              </span>

              <span className="text-white">
                {user.premiumUntil
                  ? new Date(
                      user.premiumUntil
                    ).toLocaleDateString()
                  : "-"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-white/50">
                Created
              </span>

              <span className="text-white">
                {new Date(
                  user.createdAt
                ).toLocaleDateString()}
              </span>
            </div>

          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="mb-6 text-xl font-semibold text-white">
            Affiliate
          </h2>

          <div className="space-y-3 text-sm">

            <div className="flex justify-between">
              <span className="text-white/50">
                Referrals
              </span>

              <span className="text-white">
                {user.affiliateSales.length}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-white/50">
                Earnings
              </span>

              <span className="text-white">
                €
                {user.affiliateStat?.totalEarned || 0}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-white/50">
                Paid Out
              </span>

              <span className="text-white">
                €
                {user.affiliateStat?.availablePayout || 0}
              </span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}