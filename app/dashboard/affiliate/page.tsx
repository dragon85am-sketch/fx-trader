
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import PayoutButton from "@/components/PayoutButton";
import CopyAffiliateLinkButton from "@/components/affilatie/CopyAffilatieLinkButton";
import ConnectStripeButton from "@/components/ConnectStripeButton";
function cn(...xs: Array<string | undefined | false>) {
  return xs.filter(Boolean).join(" ");
}

type StatCardProps = {
  title: string;
  value: string;
  hint?: string;
};

type BalanceCardProps = {
  label: string;
  value: string;
  tone?: "default" | "success";
};

type SaleRowProps = {
  date: string;
  user: string;
  commission: string;
  status: "Pending" | "Approved" | "Paid";
};

type PayoutStatus = "Pending" | "Approved" | "Paid" | "Rejected";

function normalizePayoutStatus(status: string): PayoutStatus {
  if (status === "Approved") return "Approved";
  if (status === "Paid") return "Paid";
  if (status === "Rejected") return "Rejected";
  return "Pending";
}

function getPayoutStatusLabel(status: PayoutStatus) {
  switch (status) {
    case "Approved":
      return "Zatwierdzona";
    case "Paid":
      return "Opłacona";
    case "Rejected":
      return "Odrzucona";
    case "Pending":
    default:
      return "Oczekuje";
  }
}

function getPayoutBadgeClass(status: PayoutStatus) {
  switch (status) {
    case "Paid":
      return "bg-emerald-500/10 text-emerald-300 border-emerald-400/20";
    case "Approved":
      return "bg-blue-500/10 text-blue-300 border-blue-400/20";
    case "Rejected":
      return "bg-red-500/10 text-red-300 border-red-400/20";
    case "Pending":
    default:
      return "bg-amber-500/10 text-amber-300 border-amber-400/20";
  }
}

function formatEuro(value: number) {
  return `${value}€`;
}

export default async function AffiliatePage() {
  const auth = await requireAuth();

  if (!auth.ok) {
    redirect("/login");
  }

  const authUser = auth.user;


  let userName = "Użytkownik";
  let affiliateLink = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/ref/${authUser.userId}`;
  let availablePayout = 0;
  let pendingCommission = 0;
  let totalEarned = 0;
  let totalPaid = 0;
  let clicks = 0;
  let sales = 0;
  let conversion = 0;
  let stripeConnected = false;
  let stripePayoutsEnabled = false;
  let stripeOnboardingDone = false;

  let salesData: {
    id: string;
    buyer: string;
    amount: number;
    status: string;
    createdAt: Date;
  }[] = [];

  let recentPayouts: {
    id: string;
    amount: number;
    status: PayoutStatus;
    createdAt: Date;
  }[] = [];

  let activePayout: {
    id: string;
    amount: number;
    status: PayoutStatus;
    createdAt: Date;
  } | null = null;

  let latestPayout: {
    id: string;
    amount: number;
    status: PayoutStatus;
    createdAt: Date;
  } | null = null;

  try {
    const [
      user,
      affiliateStat,
      dashboardStat,
      affiliateSales,
      payoutRequests,
      activePayoutRequest,
    ] = await Promise.all([
      prisma.user.findUnique({
  where: { id: authUser.userId },

  select: {
    id: true,
    name: true,
    email: true,

    stripeAccountId: true,
    stripeOnboardingDone: true,
    payoutsEnabled: true,
  },
}),
      prisma.affiliateStat.findUnique({
        where: { userId: authUser.userId },
      }),
      prisma.dashboardStat.findUnique({
        where: { userId: authUser.userId },
      }),
      prisma.affiliateSale.findMany({
        where: { userId: authUser.userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.payoutRequest.findMany({
        where: { userId: authUser.userId },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
        },
      }),
           prisma.payoutRequest.findFirst({
        where: {
          userId: authUser.userId,
          status: {
            in: ["Pending", "Approved"],
          },
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    console.log("AUTH USER:", authUser);
    console.log("DB USER:", user);

    userName = user?.name || user?.email || "Użytkownik";
    stripeConnected = Boolean(user?.stripeAccountId);

stripePayoutsEnabled = Boolean(
  user?.payoutsEnabled
);

stripeOnboardingDone = Boolean(
  user?.stripeOnboardingDone
);
    affiliateLink = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/ref/${authUser.userId}`;

    availablePayout = affiliateStat?.availablePayout ?? 0;
    pendingCommission = affiliateStat?.pendingCommission ?? 0;
    totalEarned = affiliateStat?.totalEarned ?? 0;
   totalPaid = payoutRequests
  .filter((p) => normalizePayoutStatus(p.status) === "Paid")
  .reduce((sum, p) => sum + p.amount, 0);
    clicks = dashboardStat?.clicks ?? 0;
    sales = dashboardStat?.sales ?? 0;
    conversion = dashboardStat?.conversion ?? 0;

    salesData = affiliateSales;

    recentPayouts = payoutRequests.map((payout) => ({
      ...payout,
      status: normalizePayoutStatus(payout.status),
    }));

    latestPayout = recentPayouts[0] ?? null;

    activePayout = activePayoutRequest
      ? {
          ...activePayoutRequest,
          status: normalizePayoutStatus(activePayoutRequest.status),
        }
      : null;
  } catch (error) {
    console.error("Affiliate page error:", error);
  }

  const progress = Math.round((sales / 30) * 100);
  const safeProgress = Math.min(progress, 100);

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[#020817] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "linear-gradient(rgba(2,8,23,.48), rgba(2,8,23,.72)), url('/affiliate-hub-bg.png')",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(circle_at_50%_8%,rgba(34,211,238,.16),transparent_46%)]"
      />
      <div className="relative z-10 mx-auto w-full max-w-[1920px] px-4 py-5 md:px-6 xl:px-8">
        <div className="space-y-3">

          {/* HERO / AFFILIATE HEADER */}
          <section className="overflow-hidden rounded-[16px] border border-sky-400/35 bg-[linear-gradient(145deg,#0d4f8f_0%,#093d72_48%,#062e5b_100%)] shadow-[0_0_28px_rgba(14,165,233,.18),inset_0_1px_0_rgba(255,255,255,.08)]">
            <div className="flex flex-col gap-5 px-5 py-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-[.18em] text-sky-300/65">
                  FX Trade / Affiliate Hub
                </div>

                <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-white md:text-[32px]">
                  Dashboard <span className="text-[#20a8ff]">partnera</span>
                </h1>

                <p className="mt-1 max-w-2xl text-[11px] leading-5 text-sky-100/50">
                  Witaj, <span className="font-semibold text-white">{userName}</span>. Polecaj FX Trade Education
                  i zarabiaj <span className="font-semibold text-sky-300">30–40€</span> za każdą sprzedaż.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  ["Kliknięcia", String(clicks)],
                  ["Sprzedaże", String(sales)],
                  ["Zarobki", `${totalEarned}€`],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="min-w-[92px] rounded-[10px] border border-sky-400/30 bg-[#0a3b6d] shadow-[0_0_14px_rgba(14,165,233,.10)] px-3 py-3 text-center"
                  >
                    <div className="text-[8px] uppercase tracking-[.12em] text-sky-100/40">{label}</div>
                    <div className="mt-1 text-[16px] font-bold text-white">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* AFFILIATE LINK + LEVEL */}
          <section className="grid gap-3 xl:grid-cols-[1.55fr_.75fr]">
            <div className="rounded-[14px] border border-sky-400/30 bg-[linear-gradient(145deg,#0b477f_0%,#083967_52%,#062d57_100%)] shadow-[0_0_22px_rgba(14,165,233,.13),inset_0_1px_0_rgba(255,255,255,.055)] p-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] font-semibold uppercase tracking-[.14em] text-sky-100/45">
                    Twój link partnerski
                  </div>

                  <div className="mt-2 flex min-w-0 items-center rounded-[9px] border border-sky-400/20 bg-[#072f59] px-3 py-3">
                    <div className="truncate text-[10px] text-sky-100/80">{affiliateLink}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <CopyAffiliateLinkButton affiliateLink={affiliateLink} />

                  <button className="rounded-[9px] border border-sky-400/30 bg-[#0a3b6d] shadow-[0_0_14px_rgba(14,165,233,.10)] px-4 py-2.5 text-[10px] font-semibold text-sky-100 transition hover:bg-[#0d4c87]">
                    Utwórz kampanię
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-[14px] border border-sky-400/30 bg-[linear-gradient(145deg,#0b477f_0%,#083967_52%,#062d57_100%)] shadow-[0_0_22px_rgba(14,165,233,.13),inset_0_1px_0_rgba(255,255,255,.055)] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[9px] uppercase tracking-[.12em] text-sky-100/45">Twój poziom</div>
                  <div className="mt-1 text-[20px] font-bold text-white">STARTER</div>
                  <div className="mt-1 text-[10px] font-semibold text-sky-300">30€ / sprzedaż</div>
                </div>

                <span className="rounded-full border border-sky-400/25 bg-sky-500/10 px-2.5 py-1 text-[8px] font-semibold text-sky-300">
                  {sales} / 30 sprzedaży
                </span>
              </div>

              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-[8px] text-sky-100/40">
                  <span>Progress do ELITE</span>
                  <span>{safeProgress}%</span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-[#05284c]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#1689ff,#22d3ee)] shadow-[0_0_14px_rgba(34,211,238,.28)]"
                    style={{ width: `${safeProgress}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  ["STARTER", "30€", true],
                  ["PRO", "35€", false],
                  ["ELITE", "40€", false],
                ].map(([label, value, active]) => (
                  <div
                    key={String(label)}
                    className={`rounded-[9px] border px-2 py-3 text-center ${
                      active
                        ? "border-sky-400/35 bg-sky-500/10"
                        : "border-[#0a417b] bg-[#041b36]"
                    }`}
                  >
                    <div className="text-[8px] text-sky-100/40">{String(label)}</div>
                    <div className="mt-1 text-[14px] font-bold text-white">{String(value)}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ACTIVE PAYOUT */}
          {activePayout ? (
            <section className="rounded-[12px] border border-amber-400/20 bg-amber-500/[0.07] p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-amber-200">
                    Masz aktywny wniosek o wypłatę
                  </div>

                  <div className="mt-1 text-[9px] text-amber-100/60">
                    Kwota: <span className="font-semibold text-white">{formatEuro(activePayout.amount)}</span>
                    {" "}• Status: <span className="font-semibold text-white">{getPayoutStatusLabel(activePayout.status)}</span>
                    {" "}• Data: {new Date(activePayout.createdAt).toLocaleDateString("pl-PL")}
                  </div>
                </div>

                <Link
                  href="/dashboard/affiliate/payouts"
                  className="inline-flex w-fit rounded-[8px] border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-[9px] font-semibold text-amber-100"
                >
                  Przejdź do historii
                </Link>
              </div>
            </section>
          ) : null}

          {/* KPI ROW */}
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Kliknięcia", String(clicks), "+12.4% vs 30 dni", "↗"],
              ["Rejestracje", "132", "+8.1% vs 30 dni", "◎"],
              ["Sprzedaże", String(sales), "+23% trend", "▣"],
              ["Konwersja", `${conversion}%`, "realny performance", "◔"],
            ].map(([label, value, hint, icon]) => (
              <div
                key={label}
                className="relative overflow-hidden rounded-[13px] border border-sky-400/30 bg-[linear-gradient(145deg,#0b477f_0%,#083967_52%,#062d57_100%)] shadow-[0_0_22px_rgba(14,165,233,.13),inset_0_1px_0_rgba(255,255,255,.055)] p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[9px] text-sky-100/45">{label}</div>
                    <div className="mt-1 text-[22px] font-bold text-white">{value}</div>
                    <div className="mt-2 text-[8px] font-semibold text-sky-300/70">{hint}</div>
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-sky-400/20 bg-sky-500/10 text-sky-300">
                    {icon}
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* MAIN CONTENT */}
          <section className="grid gap-3 xl:grid-cols-[1.65fr_.72fr]">
            {/* SALES */}
            <div className="rounded-[14px] border border-sky-400/30 bg-[linear-gradient(145deg,#0b477f_0%,#083967_52%,#062d57_100%)] shadow-[0_0_22px_rgba(14,165,233,.13),inset_0_1px_0_rgba(255,255,255,.055)] p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-[16px] font-semibold text-white">Ostatnie sprzedaże</h2>
                  <p className="mt-1 text-[9px] text-sky-100/45">
                    Historia ostatnich prowizji w Affiliate Hub
                  </p>
                </div>

                <button className="rounded-[8px] border border-sky-400/30 bg-[#0a3b6d] shadow-[0_0_14px_rgba(14,165,233,.10)] px-3 py-2 text-[9px] font-semibold text-sky-300 hover:bg-[#0d4c87]">
                  Zobacz wszystkie
                </button>
              </div>

              <div className="mt-3 overflow-x-auto rounded-[10px] border border-[#0a417b]">
                <table className="w-full min-w-[720px] text-left text-[9px]">
                  <thead className="bg-[#062b52] text-sky-100/55">
                    <tr>
                      <th className="px-3 py-3 font-medium">Data</th>
                      <th className="px-3 py-3 font-medium">Klient</th>
                      <th className="px-3 py-3 font-medium">Produkt</th>
                      <th className="px-3 py-3 font-medium">Prowizja</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {salesData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="bg-[#083866] px-3 py-7 text-center text-sky-100/35">
                          Brak sprzedaży
                        </td>
                      </tr>
                    ) : (
                      salesData.map((sale) => (
                        <SaleRow
                          key={sale.id}
                          date={new Date(sale.createdAt).toLocaleDateString("pl-PL")}
                          user={sale.buyer}
                          commission={`${sale.amount}€`}
                          status={sale.status as "Pending" | "Approved" | "Paid"}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-3">
              <div className="rounded-[14px] border border-sky-400/30 bg-[linear-gradient(145deg,#0b477f_0%,#083967_52%,#062d57_100%)] shadow-[0_0_22px_rgba(14,165,233,.13),inset_0_1px_0_rgba(255,255,255,.055)] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-[15px] font-semibold text-white">Saldo partnera</h3>
                    <p className="mt-1 text-[8px] text-sky-100/40">Podsumowanie prowizji i wypłat</p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-emerald-400/20 bg-emerald-500/10 text-emerald-300">
                    €
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    ["Dostępne do wypłaty", `${availablePayout}€`, "text-emerald-300"],
                    ["Oczekujące prowizje", `${pendingCommission}€`, "text-white"],
                    ["Łączny zarobek", `${totalEarned}€`, "text-emerald-300"],
                    ["Łącznie wypłacono", `${totalPaid}€`, "text-emerald-300"],
                    ["Ostatnia wypłata", latestPayout ? formatEuro(latestPayout.amount) : "Brak", "text-white"],
                  ].map(([label, value, tone]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-[9px] border border-sky-400/20 bg-[#072f59] px-3 py-3"
                    >
                      <span className="text-[9px] text-sky-100/45">{label}</span>
                      <span className={`text-[11px] font-bold ${tone}`}>{value}</span>
                    </div>
                  ))}
                </div>

                {availablePayout >= 50 ? (
                  <div className="mt-3">
                    <PayoutButton />
                  </div>
                ) : (
                  <button
                    disabled
                    className="mt-3 w-full rounded-[8px] border border-white/10 bg-slate-500/15 px-3 py-2.5 text-[9px] font-semibold text-sky-100/35"
                  >
                    Minimalna wypłata 50€
                  </button>
                )}
              </div>

              {/* PAYOUTS */}
              <div className="rounded-[14px] border border-sky-400/30 bg-[linear-gradient(145deg,#0b477f_0%,#083967_52%,#062d57_100%)] shadow-[0_0_22px_rgba(14,165,233,.13),inset_0_1px_0_rgba(255,255,255,.055)] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[15px] font-semibold text-white">Ostatnie wypłaty</h3>
                    <p className="mt-1 text-[8px] text-sky-100/40">Trzy ostatnie requesty payoutów</p>
                  </div>

                  <Link
                    href="/dashboard/affiliate/payouts"
                    className="text-[9px] font-semibold text-sky-300 hover:text-white"
                  >
                    Zobacz wszystkie
                  </Link>
                </div>

                <div className="mt-3 space-y-2">
                  {recentPayouts.length === 0 ? (
                    <div className="rounded-[9px] border border-dashed border-[#0a417b] bg-[#041b36] p-4 text-[9px] text-sky-100/35">
                      Nie masz jeszcze historii wypłat.
                    </div>
                  ) : (
                    recentPayouts.map((payout) => (
                      <div
                        key={payout.id}
                        className="flex items-center justify-between rounded-[9px] border border-sky-400/20 bg-[#072f59] px-3 py-3"
                      >
                        <div>
                          <div className="text-[10px] font-semibold text-white">
                            {formatEuro(payout.amount)}
                          </div>
                          <div className="mt-1 text-[8px] text-sky-100/40">
                            {new Date(payout.createdAt).toLocaleDateString("pl-PL")}
                          </div>
                        </div>

                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2 py-1 text-[8px] font-semibold",
                            getPayoutBadgeClass(payout.status)
                          )}
                        >
                          {getPayoutStatusLabel(payout.status)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* STRIPE / QUICK ACTIONS */}
              <div className="rounded-[14px] border border-sky-400/30 bg-[linear-gradient(145deg,#0b477f_0%,#083967_52%,#062d57_100%)] shadow-[0_0_22px_rgba(14,165,233,.13),inset_0_1px_0_rgba(255,255,255,.055)] p-4">
                <h3 className="text-[15px] font-semibold text-white">Szybkie akcje</h3>
                <p className="mt-1 text-[8px] text-sky-100/40">
                  Najważniejsze sekcje związane z payoutami i prowizjami.
                </p>

                <div className="mt-3 rounded-[10px] border border-sky-400/20 bg-[#072f59] p-3">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="text-[10px] font-semibold text-white">Stripe Connect</div>
                      <div className="mt-1 max-w-sm text-[8px] leading-4 text-sky-100/40">
                        Połącz konto payoutów Stripe, aby otrzymywać automatyczne wypłaty affiliate.
                      </div>

                      <div className="mt-3 space-y-1 text-[8px]">
                        <div className={stripeConnected ? "text-emerald-300" : "text-rose-300"}>
                          {stripeConnected ? "✓ Stripe connected" : "✕ Stripe not connected"}
                        </div>
                        <div className={stripeOnboardingDone ? "text-emerald-300" : "text-amber-300"}>
                          {stripeOnboardingDone ? "✓ Onboarding completed" : "⚠ Onboarding incomplete"}
                        </div>
                        <div className={stripePayoutsEnabled ? "text-emerald-300" : "text-rose-300"}>
                          {stripePayoutsEnabled ? "✓ Payouts enabled" : "✕ Payouts disabled"}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {stripePayoutsEnabled ? (
                        <div className="rounded-[8px] border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-[8px] font-semibold text-emerald-300">
                          Stripe gotowy do wypłat
                        </div>
                      ) : (
                        <ConnectStripeButton />
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <Link
                    href="/dashboard/affiliate/payouts"
                    className="block rounded-[8px] border border-sky-400/20 bg-[#072f59] px-3 py-2.5 text-[9px] font-semibold text-sky-100/70 hover:bg-[#0a416f]"
                  >
                    Otwórz historię wypłat
                  </Link>

                  <Link
                    href="/dashboard/affiliate/commissions"
                    className="block rounded-[8px] border border-sky-400/20 bg-[#072f59] px-3 py-2.5 text-[9px] font-semibold text-sky-100/70 hover:bg-[#0a416f]"
                  >
                    Sprawdź prowizje
                  </Link>

                  <div className="rounded-[8px] border border-sky-400/20 bg-sky-500/[0.06] px-3 py-2.5">
                    <div className="text-[9px] font-semibold text-white">Status payoutów</div>
                    <div className="mt-1 text-[8px] text-sky-100/45">
                      {activePayout
                        ? `Masz aktywny request: ${getPayoutStatusLabel(activePayout.status)}`
                        : "Nie masz aktywnego requestu wypłaty"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function QuickMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-[var(--card)] px-4 py-3">
      <div className="text-lg font-semibold text-[var(--text)]">{value}</div>
      <div className="mt-1 text-xs text-zinc-400">{label}</div>
    </div>
  );
}

function StatCard({ title, value, hint }: StatCardProps) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-[var(--card)] p-5">
      <div className="text-sm text-zinc-400">{title}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight text-[var(--text)]">
        {value}
      </div>
      {hint ? (
        <div className="mt-2 text-xs font-medium text-blue-300">{hint}</div>
      ) : null}
    </div>
  );
}

function BalanceCard({
  label,
  value,
  tone = "default",
}: BalanceCardProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-[var(--card)] px-4 py-4">
      <span className="text-sm text-zinc-400">{label}</span>
      <span
        className={cn(
          "text-xl font-semibold",
          tone === "success" ? "text-emerald-300" : "text-[var(--text)]"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function SaleRow({ date, user, commission, status }: SaleRowProps) {
  const badgeClass =
    status === "Paid"
      ? "bg-emerald-500/10 text-emerald-300 border-emerald-400/20"
      : status === "Approved"
        ? "bg-blue-500/10 text-blue-300 border-blue-400/20"
        : "bg-amber-500/10 text-amber-300 border-amber-400/20";

  return (
    <tr className="border-t border-sky-400/20 bg-[#083866] text-sky-50/90 transition hover:bg-[#0b477f]">
      <td className="px-3 py-3">{date}</td>
      <td className="px-3 py-3 font-medium">{user}</td>
      <td className="px-3 py-3 text-sky-100/55">FX Trade Education</td>
      <td className="px-3 py-3 font-semibold text-sky-300">
        {commission}
      </td>
      <td className="px-3 py-3">
        <span
          className={cn(
            "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
            badgeClass
          )}
        >
          {status}
        </span>
      </td>
    </tr>
  );
}