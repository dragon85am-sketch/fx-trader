import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePremiumUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import BillingPortalButton from "@/components/BillingPortalButton";
import type { ComponentType, ReactNode } from "react";
import {
  Activity,
  ArrowUpRight,
  Bell,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  Camera,
  CandlestickChart,
  GraduationCap,
  PanelsTopLeft,
  PieChart,
  Radio,
  ScanSearch,
  Search,
  Settings,
  ShoppingCart,
  TrendingUp,
  UserRound,
  WalletCards,
} from "lucide-react";

function cn(...xs: Array<string | undefined | false>) {
  return xs.filter(Boolean).join(" ");
}

type DashboardCard = {
  title: string;
  description: string;
  href: string;
  badge?: string;
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
    stat: "MIESIĘCZNY VIEW",
    icon: CalendarDays,
  },
  {
    title: "Skaner rynku",
    description: "FX Scanner, Harmonic Scanner i PRO FX Scanner Alpha Scanner.",
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
    stat: "385 AVG",
    icon: WalletCards,
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

function TopIcon({
  children,
  badge,
}: {
  children: ReactNode;
  badge?: string;
}) {
  return (
    <button
      type="button"
      className="relative flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#0d4e91] bg-[#1478bd] text-sky-100 shadow-[0_10px_28px_rgba(2,18,38,.20),0_0_20px_rgba(56,189,248,.24),0_0_38px_rgba(14,165,233,.12),inset_0_1px_0_rgba(255,255,255,.16)] transition hover:border-sky-300/70 hover:bg-[#1b8bd2]"
    >
      {children}

      {badge ? (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1689ff] px-1 text-[8px] font-bold text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

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
    <div className="flex h-[60px] min-w-0 items-center justify-between rounded-[12px] border border-[#0d579e] bg-[linear-gradient(145deg,#2087c8_0%,#176fae_52%,#105b93_100%)] px-4 shadow-[0_8px_24px_rgba(2,18,38,.18),0_0_20px_rgba(34,211,238,.16),inset_0_1px_0_rgba(255,255,255,.12)]">
      <div className="min-w-0">
        <div className="text-[9px] font-semibold uppercase tracking-[.12em] text-sky-100/50">
          {label}
        </div>
        <div
          className={cn(
            "mt-1 truncate text-[13px] font-semibold",
            accent ? "text-emerald-300" : "text-white"
          )}
        >
          {value}
        </div>
      </div>

      {Icon ? <Icon className="h-5 w-5 shrink-0 text-sky-400/80" /> : null}
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
    <div className="relative h-[74px] overflow-hidden rounded-[12px] border border-[#0d579e] bg-[linear-gradient(145deg,#228dce_0%,#1875b3_52%,#115f98_100%)] px-5 py-4 shadow-[0_8px_24px_rgba(2,18,38,.18),0_0_20px_rgba(34,211,238,.16),inset_0_1px_0_rgba(255,255,255,.12)]">
      <div className="text-[9px] font-semibold uppercase tracking-[.12em] text-sky-100/45">
        {label}
      </div>

      <div
        className={cn(
          "mt-1 text-[18px] font-semibold",
          positive ? "text-emerald-300" : "text-white"
        )}
      >
        {value}
      </div>

      <div className="absolute bottom-2 right-4 rounded-lg bg-sky-500/[0.05] p-1.5">
        <Icon className="h-7 w-7 text-sky-400/80" />
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
      className="group relative flex min-h-[154px] flex-col overflow-hidden rounded-[14px] border border-[#0d579e] bg-[linear-gradient(145deg,#2491d1_0%,#1979b8_55%,#105b93_100%)] p-[18px] shadow-[0_14px_34px_rgba(2,18,38,.22),0_0_18px_rgba(34,211,238,.22),0_0_38px_rgba(14,165,233,.13),inset_0_1px_0_rgba(255,255,255,.16)] transition-all duration-200 hover:border-cyan-300/75 hover:shadow-[0_16px_38px_rgba(2,18,38,.24),0_0_28px_rgba(34,211,238,.34),0_0_52px_rgba(14,165,233,.20),inset_0_1px_0_rgba(255,255,255,.20)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,.06),transparent_38%)]" />

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#0d579e] bg-[#208bd0] text-cyan-300 shadow-[inset_0_1px_0_rgba(255,255,255,.04)]">
              <Icon className="h-5 w-5" />
            </div>

            <h3 className="text-[16px] font-semibold text-slate-100">
              {title}
            </h3>
          </div>

          {badge ? (
            <span
              className={cn(
                "rounded-full border px-2.5 py-1 text-[9px] font-bold tracking-[.08em]",
                badge === "LIVE" &&
                  "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
                badge === "PRO" &&
                  "border-sky-500/35 bg-sky-500/15 text-sky-300",
                badge === "NEW" &&
                  "border-violet-500/35 bg-violet-500/15 text-violet-300"
              )}
            >
              {badge}
            </span>
          ) : null}
        </div>

        <p className="mt-4 max-w-[94%] text-[12px] leading-5 text-sky-100/55">
          {description}
        </p>

        <div className="mt-auto flex items-center justify-between pt-5">
          <span className="text-[9px] font-semibold uppercase tracking-[.17em] text-sky-200/45">
            {stat}
          </span>

          <span className="inline-flex items-center gap-1 rounded-full border border-[#0d579e] bg-[#156ca9] px-3 py-1.5 text-[10px] font-medium text-sky-50/90 transition group-hover:border-sky-400/50 group-hover:bg-[#1b88ca]">
            Otwórz
            <ArrowUpRight className="h-3 w-3" />
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
  let clicks = 0;
  let sales = 0;
  let conversion = 0;
  let monthlyPnl = 0;
  let affiliateTotal = 0;

  try {
    const [user, dashboardStat, affiliateStat] = await Promise.all([
      prisma.user.findUnique({
        where: { id: authUser.userId },
        select: { name: true, email: true },
      }),
      prisma.dashboardStat.findUnique({
        where: { userId: authUser.userId },
      }),
      prisma.affiliateStat.findUnique({
        where: { userId: authUser.userId },
      }),
    ]);

    userName = user?.name || user?.email || "Użytkownik";
    clicks = dashboardStat?.clicks ?? 0;
    sales = dashboardStat?.sales ?? 0;
    conversion = dashboardStat?.conversion ?? 0;
    monthlyPnl = dashboardStat?.monthlyPnl ?? 0;
    affiliateTotal = affiliateStat?.totalEarned ?? 0;
  } catch (error) {
    console.error("Dashboard data error:", error);
  }

  return (
    <section className="relative isolate min-h-screen overflow-hidden bg-[#020817] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "linear-gradient(rgba(2,8,23,.42), rgba(2,8,23,.68)), url('/dashboard-clean-bg.png')",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(circle_at_50%_8%,rgba(34,211,238,.14),transparent_46%)]"
      />
      <div className="relative z-10">
      {/* TOPBAR 1:1 */}
      <div className="border-b border-[#0a417b] bg-[#115d91] px-4 py-4 xl:px-5">
        <div className="flex items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.16em] text-sky-100/65">
              <span>FX TRADE</span>
              <span className="text-sky-500/70">›</span>
              <span>DASHBOARD</span>
            </div>

            <div className="mt-1 flex items-center gap-3">
              <h1 className="text-[22px] font-semibold tracking-tight text-white">
                Premium Panel
              </h1>

              <span className="rounded-full border border-sky-400/40 bg-sky-500/10 px-2.5 py-1 text-[9px] font-bold tracking-[.12em] text-cyan-300">
                PRO
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TopIcon>
              <Search className="h-5 w-5" />
            </TopIcon>

            <TopIcon>
              <Camera className="h-5 w-5" />
            </TopIcon>

            <TopIcon>
              <PanelsTopLeft className="h-5 w-5" />
            </TopIcon>

            <TopIcon badge="12">
              <Bell className="h-5 w-5" />
            </TopIcon>

            <TopIcon>
              <Settings className="h-5 w-5" />
            </TopIcon>

            <div className="ml-2 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-sky-400/50 bg-[#075ecb] text-sm font-semibold text-white">
                DA
              </div>

              <div className="hidden sm:block">
                <div className="max-w-[140px] truncate text-[13px] font-semibold text-white">
                  {userName}
                </div>
                <div className="text-[10px] text-sky-100/55">
                  Administrator
                </div>
              </div>

              <span className="text-sky-100/55">⌄</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 px-4 pb-5 pt-3 xl:px-5">
        {/* STATUS */}
        <div className="grid gap-3 2xl:grid-cols-[1.65fr_repeat(4,.72fr)_1.15fr]">
          <div className="flex h-[60px] items-center justify-between rounded-[12px] border border-[#0d579e] bg-[linear-gradient(145deg,#2087c8_0%,#176fae_52%,#105b93_100%)] px-5">
            <div>
              <div className="text-[10px] text-sky-100/55">
                Zalogowany użytkownik
              </div>
              <div className="mt-1 text-[12px] text-sky-100/70">
                {userName}
              </div>
            </div>

            <UserRound className="h-5 w-5 text-sky-300/80" />
          </div>

          <StatusCard label="SYSTEM" value="Online" accent icon={Activity} />
          <StatusCard label="SIGNALS" value="3 Active" icon={TrendingUp} />
          <StatusCard label="SALDO" value="4,280€" accent icon={WalletCards} />
          <StatusCard label="ALERTY" value="12" icon={Bell} />

          <div className="flex h-[60px] items-center justify-between rounded-[12px] border border-[#0d579e] bg-[linear-gradient(145deg,#2087c8_0%,#176fae_52%,#105b93_100%)] px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-sky-500/30 bg-[#1b82c4] text-xs font-semibold text-sky-100">
                J
              </div>

              <div>
                <div className="text-[12px] font-semibold text-white">
                  jan123
                </div>
                <div className="text-[9px] text-sky-100/50">
                  Premium Member
                </div>
              </div>
            </div>

            <span className="text-sky-200/45">⌄</span>
          </div>
        </div>

        {/* HERO */}
        <div className="relative min-h-[176px] overflow-hidden rounded-[14px] border border-[#0c78c6] bg-[linear-gradient(118deg,#2695d5_0%,#1a7dbb_52%,#115f98_100%)] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,.035)]">
          <div className="pointer-events-none absolute left-[40%] top-0 h-full w-[38%] opacity-[.16] [background-image:radial-gradient(circle,#38bdf8_1px,transparent_1px)] [background-size:7px_7px] [mask-image:radial-gradient(ellipse_at_center,black_0%,transparent_73%)]" />

          <div className="relative z-10 flex h-full flex-col justify-between gap-5 xl:flex-row xl:items-start">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[11px] border border-[#0f66b7] bg-[#2089ca] font-bold text-white">
                  FX
                </div>

                <div>
                  <div className="text-[9px] font-semibold uppercase tracking-[.18em] text-sky-200/60">
                    FX TRADE
                  </div>

                  <div className="text-[22px] font-semibold text-white">
                    Dashboard
                  </div>
                </div>
              </div>

              <p className="mt-4 max-w-[570px] text-[12px] leading-5 text-sky-100/62">
                Główny panel Twojej aplikacji. Szybki dostęp do trading room,
                skanerów, strategii, afiliacji i materiałów edukacyjnych w jednym
                miejscu.
              </p>

              <div className="mt-4">
                <BillingPortalButton />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatusCard label="ACCOUNT" value="Premium" />
              <StatusCard label="SIGNALS" value="3 Active" accent />
              <StatusCard
                label="AFFILIATE"
                value={`${affiliateTotal}€`}
                accent
              />
              <StatusCard
                label="THIS WEEK"
                value={`${monthlyPnl >= 0 ? "+" : ""}${monthlyPnl}€`}
                accent={monthlyPnl >= 0}
              />
            </div>
          </div>
        </div>

        {/* KPI */}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="KLIKNIĘCIA" value={String(clicks)} icon={TrendingUp} />
          <KpiCard label="SPRZEDAŻE" value={String(sales)} icon={ShoppingCart} />
          <KpiCard label="KONWERSJA" value={`${conversion}%`} icon={PieChart} />
          <KpiCard
            label="ZYSK MIESIĄCA"
            value={`${monthlyPnl >= 0 ? "+" : ""}${monthlyPnl}€`}
            icon={TrendingUp}
            positive={monthlyPnl >= 0}
          />
        </div>

        {/* MODULES 3x3 */}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <ModuleCard key={card.title} {...card} />
          ))}
        </div>
      </div>
      </div>
    </section>
  );
}
