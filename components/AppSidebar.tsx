"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useUser } from "@/components/UserProvider";
import { useLanguage } from "@/components/LanguageProvider";

function cn(...xs: Array<string | undefined | false>) {
  return xs.filter(Boolean).join(" ");
}

type Item = {
  label: string;
  href: string;
  children?: Item[];
};

export default function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { user, isAdmin, clearUser, loading } = useUser();
  const { lang } = useLanguage();

  const [loggingOut, setLoggingOut] = useState(false);

  const tradingRoomTab = searchParams.get("tab");

  const NAV: Item[] =
    lang === "en"
      ? [
          { label: "Dashboard", href: "/dashboard" },
          
          {
            label: "Trading Room",
            href: "/trading-room",
            children: [
              { label: "Technical Analysis", href: "/trading-room?tab=technical" },
              { label: "Journal", href: "/journal" },
              { label: "Economic Calendar", href: "/trading-room?tab=live" },
              { label: "Reports", href: "/trading-room?tab=reports" },
              {
                label: "Backtesting Panel",
                href: "/trading-room?tab=backtesting",
              },
              { label: "Profit Calendar", href: "/trading-room?tab=calendar" },
              { label: "AI Performance", href: "/trading-room?tab=ai" },
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
            ],
          },
          {
            label: "Strategies",
            href: "/strategie",
            children: [
              { label: "Scalping", href: "/strategie/scalping" },
              { label: "Day Trading", href: "/strategie/day-trading" },
              { label: "Swing Trading", href: "/strategie/swing-trading" },
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
                    {
                      label: "Admin Payouts",
                      href: "/dashboard/admin/payouts",
                    },
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
    { label: "Analiza techniczna", href: "/trading-room?tab=technical" },
    { label: "Journal", href: "/journal" },
    { label: "Economic Calendar", href: "/trading-room?tab=live" },
    { label: "Reports", href: "/trading-room?tab=reports" },
    {
      label: "Backtesting Panel",
      href: "/trading-room?tab=backtesting",
    },
    { label: "Profit Calendar", href: "/trading-room?tab=calendar" },
    { label: "AI Performance", href: "/trading-room?tab=ai" },
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
  ],
},
          {
            label: "Strategie",
            href: "/strategie",
            children: [
              { label: "Scalping", href: "/strategie/scalping" },
              { label: "Day Trading", href: "/strategie/day-trading" },
              { label: "Swing Trading", href: "/strategie/swing-trading" },
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
  {
    label: "Admin Panel",
    href: "/dashboard/admin",
  },

  {
    label: "Wypłaty admin",
    href: "/dashboard/admin/payouts",
  },
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

  const tradingRoomOpen =
    pathname.startsWith("/trading-room") || pathname.startsWith("/journal");
  const educationOpen = pathname.startsWith("/education");
  const strategieOpen = pathname.startsWith("/strategie");
  const skanerOpen = pathname.startsWith("/skaner");
  const affiliateOpen = pathname.startsWith("/dashboard/affiliate");
  const adminOpen = pathname.startsWith("/dashboard/admin");

  async function handleLogout() {
    try {
      setLoggingOut(true);

      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

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
    <aside className="hidden w-[290px] shrink-0 md:block">
  <div className="h-screen p-3 pr-0 xl:p-4 xl:pr-0">
    <div
      className="
      sticky
      top-4
      max-h-[calc(100vh-2rem)]
      overflow-auto

      rounded-[28px]

      fx-sidebar

      border

      border-sky-400/15

      bg-[#1A4F90]

      text-slate-100

      backdrop-blur-2xl

      shadow-[0_15px_50px_rgba(0,0,0,.45)]

      xl:top-5
      xl:max-h-[calc(100vh-2.5rem)]
      "
    >
          <div className="px-5 pt-5 pb-4 border-b border-sky-400/10">
  <div className="mb-4 flex items-center gap-3">
    <div
      className="
        flex
        h-12
        w-12
        items-center
        justify-center
        rounded-2xl
        bg-gradient-to-br
        from-sky-300
        via-sky-500
        to-blue-700
        text-sm
        font-bold
        text-white
        shadow-[0_0_30px_rgba(56,189,248,.35)]
        ring-1
        ring-sky-300/20
      "
      >
                {user?.name
                  ? user.name.slice(0, 2).toUpperCase()
                  : user?.email?.slice(0, 2).toUpperCase()}
              </div>

              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-[var(--text)]">
                  {user?.name || user?.email}
                </div>

                <div className="mt-1">
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px]",
                      isAdmin
                        ? "border-blue-400/20 bg-blue-500/10 text-blue-300"
                        : "border-white/10 bg-white/10 text-[var(--text)]/65"
                    )}
                  >
                    {isAdmin ? "ADMIN" : "USER"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <nav className="space-y-1.5">
            {NAV.map((it) => {
              const active = isActive(it.href);
              const hasChildren = !!it.children?.length;

              const showChildren =
                hasChildren &&
                ((it.href === "/trading-room" && tradingRoomOpen) ||
                  (it.href === "/education" && educationOpen) ||
                  (it.href === "/strategie" && strategieOpen) ||
                  (it.href === "/skaner" && skanerOpen) ||
                  (it.href === "/dashboard/affiliate" && affiliateOpen) ||
                  (it.href === "/dashboard/admin/payouts" && adminOpen));

              return (
                <div key={it.href} className="space-y-1">
                  <Link
                    href={it.href}
                    className={cn(
                      "group flex items-center justify-between rounded-2xl border px-3 py-2.5 text-sm transition-all duration-200",
                      active
                        ? "fx-active fx-neon text-[var(--text)]"
                        : "border-transparent text-[var(--text)]/72 hover:border-blue-400/20 hover:bg-blue-500/[0.06] hover:text-[var(--text)]"
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          "h-2 w-2 shrink-0 rounded-full transition-all duration-200",
                          active
                            ? "bg-blue-300 shadow-[0_0_10px_rgba(96,165,250,0.8)]"
                            : "bg-blue-400/70 group-hover:bg-blue-300"
                        )}
                      />
                      <span className="truncate">{it.label}</span>
                    </span>

                    {hasChildren && (
                      <span
                        className={cn(
                          "text-[11px] transition",
                          showChildren || active
                            ? "text-blue-200"
                            : "text-[var(--text)]/35"
                        )}
                      >
                        ▾
                      </span>
                    )}
                  </Link>

                  {hasChildren && showChildren && it.children && (
                    <div className="ml-4 space-y-1.5 border-l border-blue-400/15 pl-3">
                      {it.children.map((ch) => {
                        const chActive = isActive(ch.href);

                        return (
                          <Link
                            key={ch.href}
                            href={ch.href}
                            className={cn(
                              "block rounded-2xl border px-3 py-2 text-sm transition-all duration-200",
                              chActive
                                ? "border-blue-400/25 bg-blue-500/10 text-[var(--text)] shadow-[0_0_14px_rgba(59,130,246,0.14)]"
                                : "border-transparent text-[var(--text)]/60 hover:border-blue-400/15 hover:bg-blue-500/[0.05] hover:text-[var(--text)]"
                            )}
                          >
                            {ch.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="mt-6 space-y-2 border-t border-[var(--line-soft)] pt-5">
            <Link
              href="/"
              className="block rounded-2xl border border-transparent px-3 py-2.5 text-sm text-[var(--text)]/68 transition hover:border-blue-400/20 hover:bg-blue-500/[0.05] hover:text-[var(--text)]"
            >
              {lang === "en" ? "← Home page" : "← Strona główna"}
            </Link>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full rounded-2xl border border-transparent px-3 py-2.5 text-left text-sm text-[var(--text)]/68 transition hover:border-blue-400/20 hover:bg-blue-500/[0.05] hover:text-[var(--text)] disabled:opacity-60"
            >
              {loggingOut
                ? lang === "en"
                  ? "Logging out..."
                  : "Wylogowywanie..."
                : lang === "en"
                ? "Log out"
                : "Wyloguj"}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}