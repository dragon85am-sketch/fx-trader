"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useUser } from "@/components/UserProvider";
import { useLanguage } from "@/components/LanguageProvider";

function cn(...xs: Array<string | undefined | false>) {
  return xs.filter(Boolean).join(" ");
}

const PREMIUM_NAV_PATHS = [
  "/dashboard",
  "/trading-room",
  "/journal",
  "/skaner",
  "/strategie",
  "/education",
  "/sesje",
  "/kurs",
];

function hrefPath(href: string) {
  return href.split("?")[0];
}

function isPremiumNavHref(href: string) {
  const path = hrefPath(href);

  // Affiliate i Admin zostają poza blokadą Premium w sidebarze.
  if (path.startsWith("/dashboard/affiliate")) return false;
  if (path.startsWith("/dashboard/admin")) return false;

  return PREMIUM_NAV_PATHS.some(
    (premiumPath) =>
      path === premiumPath || path.startsWith(`${premiumPath}/`)
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

type Item = {
  label: string;
  href: string;
  children?: Item[];
};

type IconName =
  | "dashboard"
  | "trading"
  | "scanner"
  | "strategy"
  | "affiliate"
  | "education"
  | "live"
  | "settings"
  | "admin"
  | "home"
  | "logout";

function NavIcon({ name, className }: { name: IconName; className?: string }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };

  switch (name) {
    case "dashboard":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "trading":
      return (
        <svg {...common}>
          <path d="M6 3v18M18 3v18M12 3v18" />
          <rect x="4" y="7" width="4" height="7" rx="1" />
          <rect x="10" y="4" width="4" height="10" rx="1" />
          <rect x="16" y="10" width="4" height="7" rx="1" />
        </svg>
      );
    case "scanner":
      return (
        <svg {...common}>
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M15.5 15.5 21 21M7 11l2-2 2 2 3-4" />
        </svg>
      );
    case "strategy":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="4" />
          <path d="m15 9 5-5M16 4h4v4" />
        </svg>
      );
    case "affiliate":
      return (
        <svg {...common}>
          <path d="M8 12 5.5 9.5a3 3 0 0 1 4.2-4.2L12 7.6" />
          <path d="m16 12 2.5-2.5a3 3 0 0 0-4.2-4.2L12 7.6" />
          <path d="m8 12 3 3a2 2 0 0 0 2.8 0l2.2-2.2" />
          <path d="m6.5 13.5 2 2M9 16l1.5 1.5M15 16l-1.5 1.5" />
        </svg>
      );
    case "education":
      return (
        <svg {...common}>
          <path d="m3 9 9-5 9 5-9 5-9-5Z" />
          <path d="M7 12.5V17c2.8 2 7.2 2 10 0v-4.5M21 9v6" />
        </svg>
      );
    case "live":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="2" />
          <path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4" />
          <path d="M4.9 4.9a10 10 0 0 0 0 14.2M19.1 4.9a10 10 0 0 1 0 14.2" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9A1.7 1.7 0 0 0 21 10h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
        </svg>
      );
    case "admin":
      return (
        <svg {...common}>
          <path d="M12 3 5 6v5c0 4.6 2.9 7.9 7 10 4.1-2.1 7-5.4 7-10V6l-7-3Z" />
          <path d="m9.5 12 1.7 1.7 3.5-3.7" />
        </svg>
      );
    case "home":
      return (
        <svg {...common}>
          <path d="m3 11 9-8 9 8" />
          <path d="M5 10v10h14V10M9 20v-6h6v6" />
        </svg>
      );
    case "logout":
      return (
        <svg {...common}>
          <path d="M10 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h5" />
          <path d="m14 8 4 4-4 4M18 12H8" />
        </svg>
      );
  }
}

function iconForHref(href: string): IconName {
  if (href === "/dashboard") return "dashboard";
  if (href.startsWith("/trading-room") || href === "/journal") return "trading";
  if (href.startsWith("/skaner")) return "scanner";
  if (href.startsWith("/strategie")) return "strategy";
  if (href.startsWith("/dashboard/affiliate")) return "affiliate";
  if (href.startsWith("/education")) return "education";
  if (href.startsWith("/sesje")) return "live";
  if (href.startsWith("/settings")) return "settings";
  return "admin";
}

export default function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isAdmin, clearUser, loading } = useUser();
  const { lang } = useLanguage();
  const [loggingOut, setLoggingOut] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumLoading, setPremiumLoading] = useState(true);
  const [themeMode, setThemeMode] = useState<"light" | "bright" | "dark">("bright");
  const tradingRoomTab = searchParams.get("tab");

  useEffect(() => {
    if (loading) return;

    if (isAdmin) {
      setIsPremium(true);
      setPremiumLoading(false);
      return;
    }

    let cancelled = false;

    async function loadPremiumAccess() {
      try {
        setPremiumLoading(true);

        const res = await fetch("/api/account/access", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json().catch(() => null);

        if (cancelled) return;

        setIsPremium(res.ok && data?.isPremium === true);
      } catch (error) {
        console.error("SIDEBAR PREMIUM ACCESS ERROR:", error);

        if (!cancelled) {
          setIsPremium(false);
        }
      } finally {
        if (!cancelled) {
          setPremiumLoading(false);
        }
      }
    }

    loadPremiumAccess();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, loading]);

  function applyTheme(next: "light" | "bright" | "dark") {
    const root = document.documentElement;

    // Nowy system używany przez globals.css
    root.dataset.fxTheme = next;

    // Kompatybilność ze starszym globals.css / komponentami.
    root.classList.remove("light", "system", "dark");
    if (next === "light") root.classList.add("light");
    if (next === "bright") root.classList.add("system");
    if (next === "dark") root.classList.add("dark");

    setThemeMode(next);

    try {
      localStorage.setItem("fxtrade_theme", next);
    } catch {}
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem("fxtrade_theme");
      const initial =
        saved === "light" || saved === "bright" || saved === "dark"
          ? saved
          : "bright";

      applyTheme(initial);
    } catch {
      applyTheme("bright");
    }
  }, []);

  function changeTheme(next: "light" | "bright" | "dark") {
    applyTheme(next);
  }

  const hasPremiumAccess = isAdmin || isPremium;
  const paywallHref = "/paywall?premium=expired";

  const NAV: Item[] =
    lang === "en"
      ? [
          { label: "Dashboard", href: "/dashboard" },
          {
            label: "Trading Room",
            href: "/trading-room",
            children: [
              { label: "Journal", href: "/journal" },
              { label: "Economic Calendar", href: "/trading-room?tab=live" },
              { label: "Profit Calendar", href: "/trading-room?tab=calendar" },
            ],
          },
          {
            label: "Market Scanner",
            href: "/skaner",
            children: [
              { label: "FX Scanner", href: "/skaner/fx" },
              { label: "Harmonic Scanner", href: "/skaner/harmonic" },
              { label: "PRO FX Scanner", href: "/skaner/pro" },
                            { label: "Alpha Scanner", href: "/skaner/alpha" },
              { label: "GOLD Scalping Scanner", href: "/skaner/gold" },
            ],
          },
          {
            label: "Strategies",
            href: "/strategie",
            children: [
              { label: "All Strategies", href: "/strategie" },
              { label: "Scalping", href: "/strategie/scalping" },
              { label: "Day Trading", href: "/strategie/day-trading" },
              { label: "Swing Trading", href: "/strategie/swing-trading" },
              { label: "Renko Strategy", href: "/strategie/renko" },
              { label: "SuperTrend Strategy", href: "/strategie/supertrend" },
              { label: "Bollinger Bands", href: "/strategie/bollinger" },
              { label: "Price Action", href: "/strategie/price-action" },
            ],
          },
          {
            label: "Affiliate Hub",
            href: "/dashboard/affiliate",
            children: [
              { label: "Dashboard", href: "/dashboard/affiliate" },
              { label: "Campaigns", href: "/dashboard/affiliate/campaigns" },
              { label: "Commissions", href: "/dashboard/affiliate/commissions" },
              { label: "Payouts", href: "/dashboard/affiliate/payouts" },
              { label: "Materials", href: "/dashboard/affiliate/materials" },
            ],
          },
          {
            label: "Education",
            href: "/education",
            children: [
              { label: "FX Trade Academy", href: "/education/kurs" },
              { label: "Setups", href: "/education/setupy" },
              { label: "Bonus Materials", href: "/education/bonusy" },
            ],
          },
          { label: "Live Sessions / Webinars", href: "/sesje" },
          { label: "Settings", href: "/settings" },
          ...(!loading && isAdmin
            ? [
                {
                  label: "Admin",
                  href: "/dashboard/admin/payouts",
                  children: [
                    { label: "Admin Panel", href: "/dashboard/admin" },
                    { label: "Admin Payouts", href: "/dashboard/admin/payouts" },
                  ],
                },
              ]
            : []),
        ]
      : [
          { label: "Dashboard", href: "/dashboard" },
          {
            label: "Trading Room",
            href: "/trading-room",
            children: [
              { label: "Journal", href: "/journal" },
              { label: "Economic Calendar", href: "/trading-room?tab=live" },
              { label: "Profit Calendar", href: "/trading-room?tab=calendar" },
            ],
          },
          {
            label: "Skaner rynku",
            href: "/skaner",
            children: [
              { label: "FX Scanner", href: "/skaner/fx" },
              { label: "Harmonic Scanner", href: "/skaner/harmonic" },
              { label: "PRO FX Scanner", href: "/skaner/pro" },
                            { label: "Alpha Scanner", href: "/skaner/alpha" },
              { label: "GOLD Scalping Scanner", href: "/skaner/gold" },
            ],
          },
          {
            label: "Strategie",
            href: "/strategie",
            children: [
              { label: "Wszystkie strategie", href: "/strategie" },
              { label: "Scalping", href: "/strategie/scalping" },
              { label: "Day Trading", href: "/strategie/day-trading" },
              { label: "Swing Trading", href: "/strategie/swing-trading" },
              { label: "Renko Strategy", href: "/strategie/renko" },
              { label: "SuperTrend Strategy", href: "/strategie/supertrend" },
              { label: "Bollinger Bands", href: "/strategie/bollinger" },
              { label: "Price Action", href: "/strategie/price-action" },
            ],
          },
          {
            label: "Affiliate Hub",
            href: "/dashboard/affiliate",
            children: [
              { label: "Dashboard", href: "/dashboard/affiliate" },
              { label: "Kampanie", href: "/dashboard/affiliate/campaigns" },
              { label: "Prowizje", href: "/dashboard/affiliate/commissions" },
              { label: "Wypłaty", href: "/dashboard/affiliate/payouts" },
              { label: "Materiały", href: "/dashboard/affiliate/materials" },
            ],
          },
          {
            label: "Education",
            href: "/education",
            children: [
              { label: "FX Trade Academy", href: "/education/kurs" },
              { label: "Setupy", href: "/education/setupy" },
              { label: "Materiały bonusowe", href: "/education/bonusy" },
            ],
          },
          { label: "Sesje live / Webinary", href: "/sesje" },
          { label: "Ustawienia", href: "/settings" },
          ...(!loading && isAdmin
            ? [
                {
                  label: "Admin",
                  href: "/dashboard/admin/payouts",
                  children: [
                    { label: "Admin Panel", href: "/dashboard/admin" },
                    { label: "Wypłaty admin", href: "/dashboard/admin/payouts" },
                  ],
                },
              ]
            : []),
        ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href.startsWith("/trading-room?tab=")) {
      const tab = href.split("tab=")[1];
      return pathname === "/trading-room" && tradingRoomTab === tab;
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const tradingRoomOpen = pathname.startsWith("/trading-room") || pathname.startsWith("/journal");
  const educationOpen = pathname.startsWith("/education");
  const strategieOpen = pathname.startsWith("/strategie");
  const skanerOpen = pathname.startsWith("/skaner");
  const affiliateOpen = pathname.startsWith("/dashboard/affiliate");
  const adminOpen = pathname.startsWith("/dashboard/admin");

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await fetch("/api/logout", { method: "POST", credentials: "include" });
      clearUser();
      try {
        localStorage.removeItem("fxtrader_paid");
        localStorage.removeItem("fxtrader_onboarding");
        localStorage.removeItem("fxtrader_trades");
        localStorage.removeItem("fxtrade_course_progress_v2");
        localStorage.removeItem("fxtrade_profit_calendar_trades");
      } catch {}
      window.location.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
      window.location.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <aside className="hidden w-[304px] shrink-0 md:block">
      <div className="h-screen p-3 pr-0 xl:p-4 xl:pr-0">
        <div className={cn(
            "sticky top-3 flex max-h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-[30px] border border-sky-300/25 text-sky-50 shadow-[0_22px_70px_rgba(0,20,55,.42),0_0_30px_rgba(56,189,248,.12),inset_0_1px_0_rgba(255,255,255,.08)] backdrop-blur-2xl transition-colors duration-300 xl:top-4 xl:max-h-[calc(100vh-2rem)]",
            themeMode === "light"
              ? "bg-[linear-gradient(180deg,#2B91D0_0%,#207BB9_38%,#17679E_100%)]"
              : themeMode === "dark"
                ? "bg-[linear-gradient(180deg,#082642_0%,#061D34_38%,#041526_100%)]"
                : "bg-[linear-gradient(180deg,#194F8C_0%,#123D70_38%,#0A2B50_100%)]"
          )}>
          <div className="relative overflow-hidden border-b border-sky-200/10 px-5 pb-4 pt-5">
            <div className="pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full bg-cyan-300/20 blur-3xl" />
            <div className="pointer-events-none absolute left-10 top-0 h-24 w-24 rounded-full bg-blue-500/20 blur-3xl" />

            <div className="relative flex items-center gap-3.5">
              <div className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl border border-cyan-200/30 bg-[linear-gradient(145deg,#67D6FF_0%,#189DFF_45%,#1262E8_100%)] text-base font-extrabold tracking-wide text-white shadow-[0_0_28px_rgba(56,189,248,.38),inset_0_1px_0_rgba(255,255,255,.25)]">
                {user?.name
                  ? user.name.slice(0, 2).toUpperCase()
                  : user?.email?.slice(0, 2).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-bold text-white">
                  {user?.name || user?.email}
                </div>
                <div className="mt-1.5">
                  <span className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide",
                    isAdmin
                      ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100 shadow-[0_0_12px_rgba(34,211,238,.12)]"
                      : "border-white/10 bg-white/5 text-sky-100/70"
                  )}>
                    {isAdmin
                      ? "ADMIN"
                      : premiumLoading
                        ? "USER"
                        : hasPremiumAccess
                          ? "USER • PREMIUM"
                          : "USER • FREE"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:thin] [scrollbar-color:rgba(56,189,248,.35)_transparent]">
            <nav className="space-y-1.5">
              {NAV.map((it) => {
                const active = isActive(it.href);
                const hasChildren = !!it.children?.length;
                const premiumItem = isPremiumNavHref(it.href);
                const locked =
                  !premiumLoading && !hasPremiumAccess && premiumItem;

                const showChildren =
                  hasChildren &&
                  !locked &&
                  ((it.href === "/trading-room" && tradingRoomOpen) ||
                    (it.href === "/education" && educationOpen) ||
                    (it.href === "/strategie" && strategieOpen) ||
                    (it.href === "/skaner" && skanerOpen) ||
                    (it.href === "/dashboard/affiliate" && affiliateOpen) ||
                    (it.href === "/dashboard/admin/payouts" && adminOpen));

                return (
                  <div key={it.href} className="space-y-1">
                    <Link
                      href={locked ? paywallHref : it.href}
                      aria-label={
                        locked
                          ? `${it.label} — ${lang === "en" ? "Premium required" : "wymagane Premium"}`
                          : undefined
                      }
                      className={cn(
                        "group relative flex min-h-[46px] items-center justify-between overflow-hidden rounded-2xl border px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                        locked
                          ? "border-amber-300/15 bg-amber-300/[0.035] text-sky-100/45 hover:border-amber-300/25 hover:bg-amber-300/[0.07] hover:text-sky-50/75"
                          : active
                            ? "border-cyan-200/35 bg-[linear-gradient(90deg,#147BFF_0%,#1FA8FF_52%,#38C6F7_100%)] text-white shadow-[0_0_24px_rgba(14,165,233,.34),inset_0_1px_0_rgba(255,255,255,.16)]"
                            : "border-transparent text-sky-50/88 hover:border-cyan-300/15 hover:bg-cyan-300/[0.08] hover:text-white"
                      )}
                    >
                      {!locked && active && (
                        <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-cyan-200 shadow-[0_0_12px_rgba(103,232,249,.95)]" />
                      )}

                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-200",
                            locked
                              ? "bg-white/[0.025] text-sky-100/30"
                              : active
                                ? "bg-white/10 text-white"
                                : "bg-sky-300/[0.04] text-sky-300 group-hover:bg-cyan-300/10 group-hover:text-cyan-200"
                          )}
                        >
                          <NavIcon
                            name={iconForHref(it.href)}
                            className="h-[19px] w-[19px]"
                          />
                        </span>

                        <span className="truncate">{it.label}</span>
                      </span>

                      {locked ? (
                        <span className="ml-2 inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-300/20 bg-amber-300/[0.07] px-2 py-1 text-[8px] font-black uppercase tracking-[.1em] text-amber-200/80">
                          <LockIcon className="h-3 w-3" />
                          Premium
                        </span>
                      ) : (
                        hasChildren && (
                          <span
                            className={cn(
                              "ml-2 text-[13px] transition-transform duration-200",
                              showChildren
                                ? "rotate-180 text-white"
                                : active
                                  ? "text-white"
                                  : "text-sky-200/65"
                            )}
                          >
                            ▾
                          </span>
                        )
                      )}
                    </Link>

                    {hasChildren && showChildren && it.children && (
                      <div className="ml-[30px] space-y-1 border-l border-cyan-300/20 py-1 pl-3">
                        {it.children.map((ch) => {
                          const chActive = isActive(ch.href);
                          const childLocked =
                            !premiumLoading &&
                            !hasPremiumAccess &&
                            isPremiumNavHref(ch.href);

                          return (
                            <Link
                              key={ch.href}
                              href={childLocked ? paywallHref : ch.href}
                              className={cn(
                                "flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-[13px] transition-all duration-200",
                                childLocked
                                  ? "border-transparent text-sky-100/35 hover:border-amber-300/15 hover:bg-amber-300/[0.05] hover:text-sky-50/70"
                                  : chActive
                                    ? "border-cyan-300/25 bg-cyan-300/10 text-white shadow-[0_0_14px_rgba(34,211,238,.10)]"
                                    : "border-transparent text-sky-100/65 hover:border-cyan-300/15 hover:bg-cyan-300/[0.06] hover:text-white"
                              )}
                            >
                              <span className="truncate">{ch.label}</span>

                              {childLocked && (
                                <LockIcon className="h-3.5 w-3.5 shrink-0 text-amber-200/60" />
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* FX TRADE PREMIUM COMMUNITY — pełny byk z /public */}
            <div className="mt-5 overflow-hidden rounded-[18px] border border-[#0d579e] bg-[#041f40] shadow-[0_0_26px_rgba(14,165,233,.12),inset_0_1px_0_rgba(255,255,255,.04)]">
              <div
                className="relative aspect-[208/280] w-full overflow-hidden bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: 'url("/fx-trade-premium-bull.png")',
                }}
              >
                <Link
  href="https://t.me/+SP10ZSqjehcxOTNk"
  target="_blank"
  rel="noopener noreferrer"
  aria-label={lang === "en" ? "Join group" : "Przejdź do grupy"}
  className="absolute bottom-[5%] left-[8%] h-[14%] w-[84%] rounded-[11px] transition hover:bg-white/[0.05]"
/>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 rounded-[14px] border border-cyan-300/15 bg-[#052348] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,.04)]">
              <button
                type="button"
                onClick={() => changeTheme("light")}
                title={lang === "en" ? "Light" : "Jasny"}
                aria-pressed={themeMode === "light"}
                className={cn(
                  "flex h-9 items-center justify-center rounded-[10px] text-lg transition",
                  themeMode === "light"
                    ? "bg-[#E8F5FF] text-[#0B4D87] shadow-[inset_0_1px_0_rgba(255,255,255,.8),0_0_14px_rgba(125,211,252,.22)]"
                    : "text-sky-300/45 hover:bg-sky-400/[0.06] hover:text-sky-100"
                )}
              >
                ☀
              </button>

              <button
                type="button"
                onClick={() => changeTheme("bright")}
                title={lang === "en" ? "Brighter blue" : "Jaśniejszy niebieski"}
                aria-pressed={themeMode === "bright"}
                className={cn(
                  "flex h-9 items-center justify-center rounded-[10px] text-lg transition",
                  themeMode === "bright"
                    ? "bg-[#0A3972] text-sky-100 shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_0_14px_rgba(56,189,248,.12)]"
                    : "text-sky-200/55 hover:bg-sky-400/[0.06] hover:text-white"
                )}
              >
                ☼
              </button>

              <button
                type="button"
                onClick={() => changeTheme("dark")}
                title={lang === "en" ? "Dark" : "Ciemny"}
                aria-pressed={themeMode === "dark"}
                className={cn(
                  "flex h-9 items-center justify-center rounded-[10px] text-lg transition",
                  themeMode === "dark"
                    ? "bg-[#031426] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.05),0_0_14px_rgba(0,0,0,.25)]"
                    : "text-sky-100/65 hover:bg-sky-400/[0.06] hover:text-white"
                )}
              >
                ◐
              </button>
            </div>

            <div className="mt-4 space-y-1.5 border-t border-cyan-200/12 pt-4">
              <Link
                href="/"
                className="group flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-sm text-sky-100/78 transition-all hover:border-cyan-300/15 hover:bg-cyan-300/[0.06] hover:text-white"
              >
                <span className="text-sky-300 transition-colors group-hover:text-cyan-200">
                  <NavIcon name="home" className="h-[18px] w-[18px]" />
                </span>
                {lang === "en" ? "Home page" : "Strona główna"}
              </Link>

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="group flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-left text-sm text-sky-100/78 transition-all hover:border-cyan-300/15 hover:bg-cyan-300/[0.06] hover:text-white disabled:opacity-60"
              >
                <span className="text-sky-300 transition-colors group-hover:text-cyan-200">
                  <NavIcon name="logout" className="h-[18px] w-[18px]" />
                </span>
                {loggingOut
                  ? lang === "en"
                    ? "Logging out..."
                    : "Wylogowywanie..."
                  : lang === "en"
                  ? "Log out"
                  : "Wyloguj się"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
