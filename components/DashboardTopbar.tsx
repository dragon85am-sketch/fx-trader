"use client";

import {
  Bell,
  ChevronRight,
  CircleDollarSign,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

function cn(...xs: Array<string | undefined | false>) {
  return xs.filter(Boolean).join(" ");
}

export default function DashboardTopbar() {
  return (
    <div className="fx-card rounded-[26px] border border-[var(--line-soft)] bg-[var(--card)] px-4 py-4 text-[var(--text)] shadow-[0_0_24px_rgba(59,130,246,0.10)] backdrop-blur-xl md:px-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-400/25 bg-[linear-gradient(180deg,rgba(37,99,235,0.24),rgba(59,130,246,0.08))] text-sm font-bold tracking-wide text-blue-100 shadow-[0_0_20px_rgba(59,130,246,0.22)]">
            FX
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--text)]/35">
              <span>FX Trade</span>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-blue-300">Dashboard</span>
            </div>

            <div className="mt-1 flex items-center gap-2">
              <h1 className="truncate text-xl font-semibold text-[var(--text)] md:text-2xl">
                Premium Panel
              </h1>
              <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-blue-300">
                PRO
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 lg:w-[320px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text)]/35" />
            <input
              type="text"
              placeholder="Szukaj modułu, strategii, skanera..."
              className="w-full rounded-2xl border border-[var(--line-soft)] bg-black/10 py-3 pl-10 pr-4 text-sm text-[var(--text)] placeholder:text-[var(--text)]/30 outline-none transition focus:border-blue-400/30 focus:bg-blue-500/[0.04] dark:bg-white/[0.04]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <TopStat
              icon={<ShieldCheck className="h-4 w-4" />}
              label="System"
              value="Online"
              tone="positive"
            />
            <TopStat
              icon={<Sparkles className="h-4 w-4" />}
              label="Signals"
              value="3 Active"
              tone="default"
            />
            <TopStat
              icon={<CircleDollarSign className="h-4 w-4" />}
              label="Saldo"
              value="4,280€"
              tone="positive"
            />

            <button className="flex items-center justify-between rounded-2xl border border-[var(--line-soft)] bg-black/10 px-4 py-3 text-left transition hover:border-blue-400/25 hover:bg-blue-500/[0.05] dark:bg-white/[0.04]">
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--text)]/35">
                  Alerty
                </div>
                <div className="mt-1 text-sm font-semibold text-[var(--text)]">
                  12
                </div>
              </div>

              <div className="relative ml-3 flex h-9 w-9 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10 text-blue-200 shadow-[0_0_14px_rgba(59,130,246,0.12)]">
                <Bell className="h-4 w-4" />
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
              </div>
            </button>
          </div>

          <button className="flex items-center gap-3 rounded-2xl border border-[var(--line-soft)] bg-black/10 px-3 py-2.5 transition hover:border-blue-400/25 hover:bg-blue-500/[0.05] dark:bg-white/[0.04]">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-sm font-semibold text-blue-100 shadow-[0_0_16px_rgba(59,130,246,0.16)]">
              J
            </div>

            <div className="text-left">
              <div className="text-sm font-medium text-[var(--text)]">
                jan123
              </div>
              <div className="text-xs text-[var(--text)]/40">
                Premium Member
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function TopStat({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "default" | "positive";
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[var(--line-soft)] bg-black/10 px-4 py-3 dark:bg-white/[0.04]">
      <div>
        <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--text)]/35">
          {label}
        </div>
        <div
          className={cn(
            "mt-1 text-sm font-semibold",
            tone === "positive" ? "text-emerald-300" : "text-[var(--text)]"
          )}
        >
          {value}
        </div>
      </div>

      <div className="ml-3 flex h-9 w-9 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10 text-blue-200 shadow-[0_0_12px_rgba(59,130,246,0.12)]">
        {icon}
      </div>
    </div>
  );
}