import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePremiumUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import BillingPortalButton from "@/components/BillingPortalButton";
import type { ComponentType } from "react";
import {
  Activity,
  ArrowUpRight,
  Bell,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  CandlestickChart,
  GraduationCap,
  PieChart,
  Radio,
  ScanSearch,
  Settings,
  ShoppingCart,
  TrendingUp,
  UserRound,
  UsersRound,
  WalletCards,
} from "lucide-react";

function cn(...xs: Array<string | undefined | false>) {
  return xs.filter(Boolean).join(" ");
}

type DashboardCard = {
  title: string;
  description: string;
  href: string;
  badge?: "LIVE" | "PRO" | "NEW";
  stat?: string;
  icon: ComponentType<{ className?: string }>;
};

const cards: DashboardCard[] = [
  {
    title: "Journal",
    description: "Dziennik tradingowy i analiza zagrań.",
    href: "/journal",
    stat: "24 WPISY",
    icon: BookOpen,
  },
  {
    title: "Trading Room",
    description: "Live market, raporty i performance AI.",
    href: "/trading-room",
    badge: "LIVE",
    stat: "6 MODUŁÓW",
    icon: CandlestickChart,
  },
  {
    title: "Profit Calendar",
    description: "Kalendarz wyników i podsumowań tradingu.",
    href: "/trading-room?tab=calendar",
    badge: "NEW",
    stat: "MIESIĘCZNY VIEW",
    icon: CalendarDays,
  },
  {
    title: "Skaner rynku",
    description: "FX Scanner, Harmonic Scanner, PRO FX Scanner i Alpha Scanner.",
    href: "/skaner",
    badge: "PRO",
    stat: "4 SKANERY",
    icon: ScanSearch,
  },
  {
    title: "Strategie",
    description: "Scalping, day trading i swing trading.",
    href: "/strategie",
    stat: "3 STRATEGIE",
    icon: BrainCircuit,
  },
  {
    title: "Affiliate Hub",
    description: "Panel partnera, kampanie, prowizje i wypłaty.",
    href: "/dashboard/affiliate",
    badge: "NEW",
    stat: "365 AVG",
    icon: UsersRound,
  },
  {
    title: "Education",
    description: "FX Trade Academy, setupy i bonusowe materiały.",
    href: "/education",
    stat: "12 LEKCJI",
    icon: GraduationCap,
  },
  {
    title: "Sesje / Webinary",
    description: "Dołącz do sesji live i webinarów premium.",
    href: "/sesje",
    badge: "LIVE",
    stat: "2 W TYM TYGODNIU",
    icon: Radio,
  },
  {
    title: "Ustawienia",
    description: "Personalizacja panelu i ustawienia konta.",
    href: "/settings",
    stat: "SYSTEM",
    icon: Settings,
  },
];

function StatusCard({
  label,
  value,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  icon?: ComponentType<{ className?: string }>;
  accent?: boolean;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[18px] border border-cyan-300/35 bg-[linear-gradient(145deg,rgba(10,84,137,.94),rgba(7,56,102,.96))] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,.04),0_12px_30px_rgba(0,0,0,.22)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(34,211,238,.08),transparent_42%)]" />
      <div className="relative z-10 flex items-center gap-3">
        {Icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/45 bg-cyan-400/[0.06] text-cyan-300 shadow-[0_0_18px_rgba(34,211,238,.08)]">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
        <div className="min-w-0">
          <div className="text-[9px] font-bold uppercase tracking-[.18em] text-sky-200/45">
            {label}
          </div>
          <div
            className={cn(
              "mt-1 truncate text-[14px] font-semibold",
              accent ? "text-emerald-300" : "text-white"
            )}
          >
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  positive = false,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  positive?: boolean;
}) {
  return (
    <div className="relative min-h-[88px] overflow-hidden rounded-[18px] border border-cyan-300/35 bg-[linear-gradient(145deg,rgba(10,84,137,.96),rgba(7,56,102,.98))] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,.04),0_12px_30px_rgba(0,0,0,.22)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(37,99,235,.14),transparent_45%)]" />
      <div className="relative z-10 flex items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-300/45 bg-cyan-400/[0.06] text-cyan-300">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-[.18em] text-sky-200/45">
            {label}
          </div>
          <div
            className={cn(
              "mt-1 text-[20px] font-bold",
              positive ? "text-emerald-300" : "text-white"
            )}
          >
            {value}
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-2 right-4 flex items-end gap-1 opacity-50">
        {[10, 16, 12, 24, 18, 32].map((h, i) => (
          <span key={i} className="w-[2px] rounded-full bg-cyan-300" style={{ height: h }} />
        ))}
      </div>
    </div>
  );
}

function ModuleCard({
  title,
  description,
  href,
  badge,
  stat,
  icon: Icon,
}: DashboardCard) {
  return (
    <Link
      href={href}
      className="group relative flex min-h-[170px] flex-col overflow-hidden rounded-[20px] border border-cyan-300/35 bg-[linear-gradient(145deg,rgba(10,88,145,.96),rgba(6,48,91,.98))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.04),0_14px_34px_rgba(0,0,0,.24)] transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-200/80 hover:shadow-[0_0_30px_rgba(34,211,238,.10),0_18px_40px_rgba(0,0,0,.28)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(34,211,238,.07),transparent_40%)] opacity-80" />
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-cyan-300/45 bg-[linear-gradient(180deg,rgba(14,165,233,.34),rgba(6,182,212,.16))] text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,.09)]">
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="text-[17px] font-semibold text-white">{title}</h3>
          </div>

          {badge ? (
            <span
              className={cn(
                "rounded-full border px-2.5 py-1 text-[9px] font-bold tracking-[.08em]",
                badge === "LIVE" &&
                  "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
                badge === "PRO" &&
                  "border-cyan-300/45 bg-cyan-500/10 text-cyan-300",
                badge === "NEW" &&
                  "border-violet-400/25 bg-violet-500/10 text-violet-300"
              )}
            >
              {badge === "NEW" ? "NOWOŚĆ" : badge}
            </span>
          ) : null}
        </div>

        <p className="mt-4 max-w-[92%] text-[12px] leading-5 text-sky-100/55">
          {description}
        </p>

        <div className="mt-auto flex items-center justify-between pt-5">
          <span className="text-[9px] font-semibold uppercase tracking-[.18em] text-sky-200/45">
            {stat}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-[10px] border border-cyan-300/45 bg-cyan-400/[0.04] px-3 py-2 text-[10px] font-semibold text-white transition group-hover:border-cyan-200/80 group-hover:bg-cyan-400/[0.08]">
            Otwórz
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default async function DashboardPage() {
  const auth = await requirePremiumUser();

  if (!auth.ok) {
    redirect("/paywall");
  }

  const authUser = auth.user;

  let userName = "Użytkownik";
  let userEmail = "";
  let userRole = authUser.role ?? "user";
  let clicks = 0;
  let sales = 0;
  let conversion = 0;
  let monthlyPnl = 0;
  let affiliateTotal = 0;

  try {
    const [user, dashboardStat, affiliateStat] = await Promise.all([
      prisma.user.findUnique({
        where: { id: authUser.userId },
        select: { name: true, email: true, role: true },
      }),
      prisma.dashboardStat.findUnique({
        where: { userId: authUser.userId },
      }),
      prisma.affiliateStat.findUnique({
        where: { userId: authUser.userId },
      }),
    ]);

    userName = user?.name || user?.email || "Użytkownik";
    userEmail = user?.email ?? "";
    userRole = user?.role === "admin" ? "admin" : "user";
    clicks = dashboardStat?.clicks ?? 0;
    sales = dashboardStat?.sales ?? 0;
    conversion = dashboardStat?.conversion ?? 0;
    monthlyPnl = dashboardStat?.monthlyPnl ?? 0;
    affiliateTotal = affiliateStat?.totalEarned ?? 0;
  } catch (error) {
    console.error("Dashboard data error:", error);
  }

  const userInitials =
    userName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "FX";

  const roleLabel = userRole === "admin" ? "Administrator" : "Premium Member";

  return (
    <section className="relative isolate min-h-screen overflow-hidden rounded-[24px] bg-[#03162d] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_52%_0%,rgba(34,211,238,.20),transparent_40%),linear-gradient(180deg,#0b4f82_0%,#073864_46%,#05284c_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[.13] [background-image:linear-gradient(rgba(103,232,249,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(103,232,249,.16)_1px,transparent_1px)] [background-size:54px_54px]" />

      <div className="relative z-10 space-y-4 p-3 sm:p-4 xl:p-5">
        {/* CLEAN HEADER - profil jest tylko w głównym topbarze */}
        <div className="rounded-[22px] border border-cyan-300/45 bg-[linear-gradient(135deg,rgba(12,98,158,.96),rgba(7,61,111,.98))] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,.04),0_14px_40px_rgba(0,0,0,.24)]">
          <div className="flex items-center">
            <div className="flex min-w-0 items-center gap-4">
              <div className="hidden h-[62px] w-[118px] shrink-0 items-center justify-center border-r border-cyan-300/15 pr-4 md:flex">
                <img
                  src="/fx-trade-panel-logo.png"
                  alt="FX Trade"
                  className="max-h-[58px] max-w-[102px] object-contain mix-blend-lighten"
                />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[.22em] text-sky-300/70">
                  FX TRADE • DASHBOARD
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <h1 className="text-[24px] font-bold tracking-tight text-white md:text-[28px]">
                    Premium Panel
                  </h1>
                  <span className="rounded-full border border-cyan-200/55 bg-cyan-400/[0.08] px-2.5 py-1 text-[9px] font-bold tracking-[.12em] text-cyan-300">
                    PRO
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STATUS */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <StatusCard label="UŻYTKOWNIK" value={userName} icon={UserRound} />
          <StatusCard label="SYSTEM" value="Online" accent icon={Activity} />
          <StatusCard label="SYGNAŁY" value="3 Active" icon={TrendingUp} />
          <StatusCard label="SALDO" value="4,280€" icon={WalletCards} />
          <StatusCard label="ALERTY" value="12" icon={Bell} />
          <div className="relative overflow-hidden rounded-[18px] border border-cyan-300/35 bg-[linear-gradient(145deg,rgba(10,84,137,.94),rgba(7,56,102,.96))] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-400/25 bg-cyan-500/20 text-xs font-bold text-white">
                {userInitials}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[12px] font-semibold text-white">{userName}</div>
                <div className="truncate text-[9px] text-sky-100/45">{userEmail || roleLabel}</div>
              </div>
            </div>
          </div>
        </div>

        {/* HERO */}
        <div className="relative overflow-hidden rounded-[22px] border border-cyan-200/55 bg-[linear-gradient(118deg,rgba(12,111,176,.96),rgba(8,77,134,.97)_54%,rgba(6,56,106,.98))] p-5 shadow-[0_0_34px_rgba(34,211,238,.16),inset_0_1px_0_rgba(255,255,255,.08)] md:p-6">
          <div className="pointer-events-none absolute left-[34%] top-0 h-full w-[45%] opacity-[.14] [background-image:radial-gradient(circle,#38bdf8_1px,transparent_1px)] [background-size:7px_7px] [mask-image:radial-gradient(ellipse_at_center,black_0%,transparent_76%)]" />
          <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-[680px]">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-[18px] border border-cyan-300/70 shadow-[0_0_24px_rgba(34,211,238,.32)] md:h-[72px] md:w-[72px]">
                  <img
                    src="/dashboard-icon.png"
                    alt="FX Trade Dashboard"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[.22em] text-sky-300/65">FX TRADE</div>
                  <div className="mt-1 text-[26px] font-bold text-white md:text-[32px]">Dashboard</div>
                </div>
              </div>
              <p className="mt-4 max-w-[620px] text-[12px] leading-6 text-sky-100/58 md:text-[13px]">
                Główny panel Twojej aplikacji. Szybki dostęp do trading room, skanerów,
                strategii, edukacji i materiałów w jednym miejscu.
              </p>
              <div className="mt-5">
                <BillingPortalButton />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatusCard label="KONTO" value="Premium" />
              <StatusCard label="SYGNAŁY" value="3 Active" accent />
              <StatusCard label="AFFILIATE" value={`${affiliateTotal}€`} />
              <StatusCard
                label="TEN TYDZIEŃ"
                value={`${monthlyPnl >= 0 ? "+" : ""}${monthlyPnl}€`}
                accent={monthlyPnl >= 0}
              />
            </div>
          </div>
        </div>

        {/* KPI */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="KLIENCI" value={String(clicks)} icon={UsersRound} />
          <KpiCard label="SPRZEDAŻE" value={String(sales)} icon={ShoppingCart} />
          <KpiCard label="KONWERSJA" value={`${conversion}%`} icon={PieChart} />
          <KpiCard
            label="ZYSK MIESIĄCA"
            value={`${monthlyPnl >= 0 ? "+" : ""}${monthlyPnl}€`}
            icon={TrendingUp}
            positive={monthlyPnl >= 0}
          />
        </div>

        {/* MODULES */}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <ModuleCard key={card.title} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}
