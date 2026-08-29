"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function cn(...xs: Array<string | undefined | false>) {
  return xs.filter(Boolean).join(" ");
}

type Item = {
  label: string;
  href: string;
  children?: Item[];
};

const NAV: Item[] = [
  { label: "Dashboard", href: "/app" },
  { label: "Journal", href: "/app/journal" },
  { label: "Skaner rynku", href: "/app/skaner" },

  {
    label: "Strategie",
    href: "/app/strategie",
    children: [
      { label: "Scalping", href: "/app/strategie/scalping" },
      { label: "Day Trading", href: "/app/strategie/day-trading" },
      { label: "Swing Trading", href: "/app/strategie/swing-trading" },
    ],
  },

  {
    label: "Education",
    href: "/education",
    children: [
      { label: "Kurs główny", href: "/education/kurs" },
      { label: "Setupy", href: "/education/setupy" },
      { label: "Sesje live / Zoom", href: "/education/sesje" },
      { label: "Materiały bonusowe", href: "/education/bonusy" },
    ],
  },
{
  label: "Trading Room",
  href: "/trading-room",
  children: [
    { label: "Live Market", href: "/trading-room?tab=live" },
    { label: "Reports", href: "/trading-room?tab=reports" },
    { label: "Backtesting Panel", href: "/trading-room?tab=backtesting" },
    { label: "Profit Calendar", href: "/trading-room?tab=calendar" },
    { label: "AI Performance", href: "/trading-room?tab=ai" }
  ]
},
  { label: "Ustawienia", href: "/app/settings" },
];

export default function Nav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/app") return pathname === "/app";
    return pathname.startsWith(href);
  };

  const educationOpen = pathname.startsWith("/education");
  const strategieOpen = pathname.startsWith("/strategie");

  return (
    <aside className="hidden md:block w-[290px] shrink-0">
      <div className="sticky top-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur px-4 py-5 shadow-[0_0_50px_rgba(0,0,0,0.35)]">
        {/* Brand */}
        <div className="px-2 mb-6">
          <div className="text-sm tracking-widest font-bold">FX TRADE</div>
          <div className="text-xs text-zinc-300/70 mt-1">Premium Panel</div>
        </div>

        {/* Nav */}
        <nav className="space-y-1">
          {NAV.map((it) => {
            const active = isActive(it.href);
            const hasChildren = !!it.children?.length;

            const showChildren =
              hasChildren &&
              ((it.href.startsWith("/education") && educationOpen) ||
                (it.href.startsWith("/strategie") && strategieOpen));

            return (
              <div key={it.href} className="space-y-1">
                <Link
                  href={it.href}
                  className={cn(
                    "flex items-center justify-between rounded-2xl px-3 py-2 text-sm transition",
                    active
                      ? "bg-white/10 text-white shadow-[0_0_18px_rgba(59,130,246,0.22)]"
                      : "text-zinc-200/80 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-400/70" />
                    {it.label}
                  </span>

                  {hasChildren && (
                    <span className={cn("text-xs opacity-70", showChildren && "opacity-100")}>
                      ▾
                    </span>
                  )}
                </Link>

                {hasChildren && showChildren && it.children && (
                  <div className="ml-4 pl-3 border-l border-white/10 space-y-1">
                    {it.children.map((ch) => {
                      const chActive = isActive(ch.href);
                      return (
                        <Link
                          key={ch.href}
                          href={ch.href}
                          className={cn(
                            "block rounded-2xl px-3 py-2 text-sm transition",
                            chActive
                              ? "bg-blue-500/15 text-white shadow-[0_0_16px_rgba(59,130,246,0.18)]"
                              : "text-zinc-200/70 hover:bg-white/5 hover:text-white"
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

        {/* Bottom */}
        <div className="mt-6 pt-5 border-t border-white/10 space-y-2">
          <Link
            href="/"
            className="block rounded-2xl px-3 py-2 text-sm text-zinc-200/80 hover:bg-white/5 hover:text-white transition"
          >
            ← Strona główna
          </Link>

          <button
            onClick={() => {
              try {
                localStorage.removeItem("fxtrader_paid");
                localStorage.removeItem("fxtrader_onboarding");
                localStorage.removeItem("fxtrader_trades");
                localStorage.removeItem("fxtrade_course_progress_v1");
              } catch {}
              window.location.href = "/";
            }}
            className="w-full text-left rounded-2xl px-3 py-2 text-sm text-zinc-200/80 hover:bg-white/5 hover:text-white transition"
          >
            Wyloguj (demo)
          </button>
        </div>
      </div>
    </aside>
  );
}
