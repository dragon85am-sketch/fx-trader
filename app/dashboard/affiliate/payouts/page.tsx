import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StripeConnectStatusCard from "@/components/StripeConnectStatusCard";

type TokenPayload = {
  userId: string;
  email: string;
  role: "admin" | "user";
};

type PayoutStatus = "Pending" | "Approved" | "Paid" | "Rejected";

type Payout = {
  id: string;
  amount: number;
  status: PayoutStatus;
  createdAt: Date;
};

function normalizeStatus(status: string): PayoutStatus {
  if (status === "Approved") return "Approved";
  if (status === "Paid") return "Paid";
  if (status === "Rejected") return "Rejected";
  return "Pending";
}

function getStatusStyles(status: PayoutStatus) {
  switch (status) {
    case "Approved":
      return "bg-blue-500/10 text-blue-300 border-blue-400/20";
    case "Paid":
      return "bg-emerald-500/10 text-emerald-300 border-emerald-400/20";
    case "Rejected":
      return "bg-red-500/10 text-red-300 border-red-400/20";
    case "Pending":
    default:
      return "bg-amber-500/10 text-amber-300 border-amber-400/20";
  }
}

function getStatusLabel(status: PayoutStatus) {
  switch (status) {
    case "Approved":
      return "Zatwierdzona";
    case "Paid":
      return "OpÅ‚acona";
    case "Rejected":
      return "Odrzucona";
    case "Pending":
    default:
      return "Oczekuje";
  }
}

export default async function PayoutsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  let payouts: Payout[] = [];

  if (token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET!
      ) as TokenPayload;

      const dbPayouts = await prisma.payoutRequest.findMany({
        where: { userId: decoded.userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
        },
      });

      payouts = dbPayouts.map((p) => ({
        id: p.id,
        amount: p.amount,
        status: normalizeStatus(p.status),
        createdAt: p.createdAt,
      }));
    } catch (err) {
      console.error("PayoutsPage error:", err);
    }
  }

  return (
    <div className="p-6 text-white">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Historia wypÅ‚at</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Tutaj widzisz wszystkie swoje wnioski o wypÅ‚atÄ™.
          </p>
        </div>

        <Link
          href="/dashboard/affiliate"
          className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
        >
          PowrÃ³t
        </Link>
      </div>

      <div className="mb-6">
        <StripeConnectStatusCard />
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.04] text-zinc-400">
            <tr>
              <th className="px-4 py-3 text-left">Data</th>
              <th className="px-4 py-3 text-left">Kwota</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {payouts.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-6 text-center text-zinc-400">
                  Brak wypÅ‚at
                </td>
              </tr>
            ) : (
              payouts.map((p) => (
                <tr key={p.id} className="border-t border-white/10">
                  <td className="px-4 py-4">
                    {new Date(p.createdAt).toLocaleDateString("pl-PL")}
                  </td>

                  <td className="px-4 py-4 font-semibold text-blue-300">
                    {p.amount}â‚¬
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full border px-2 py-1 text-xs ${getStatusStyles(
                        p.status
                      )}`}
                    >
                      {getStatusLabel(p.status)}
                    </span>
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
