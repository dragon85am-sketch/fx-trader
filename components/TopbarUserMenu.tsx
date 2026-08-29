"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useUser } from "@/components/UserProvider";

function getInitials(name?: string | null, email?: string | null) {
  if (name && name.trim().length > 0) {
    return name.trim().slice(0, 2).toUpperCase();
  }

  if (email && email.length > 0) {
    return email.slice(0, 2).toUpperCase();
  }

  return "U";
}

export default function TopbarUserMenu() {
  const { user, isAdmin, clearUser } = useUser();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!wrapperRef.current) return;

      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

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
      setOpen(false);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-left transition hover:border-white/15 hover:bg-white/[0.06]"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/25 bg-blue-500/10 text-sm font-bold text-blue-200">
          {getInitials(user?.name, user?.email)}
        </div>

        <div className="hidden min-w-0 sm:block">
          <div className="truncate text-sm font-semibold text-white">
            {user?.name || user?.email || "Użytkownik"}
          </div>
          <div className="mt-0.5 text-xs text-white/45">
            {isAdmin ? "Administrator" : "Użytkownik"}
          </div>
        </div>

        <span className="text-xs text-white/45">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-72 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220]/95 shadow-2xl backdrop-blur">
          <div className="border-b border-white/8 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-400/25 bg-blue-500/10 text-sm font-bold text-blue-200">
                {getInitials(user?.name, user?.email)}
              </div>

              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-white">
                  {user?.name || "Brak nazwy"}
                </div>
                <div className="truncate text-xs text-white/50">
                  {user?.email}
                </div>
              </div>
            </div>

            <div className="mt-3">
              <span
                className={`rounded-full border px-2 py-1 text-[10px] ${
                  isAdmin
                    ? "border-blue-400/20 bg-blue-500/10 text-blue-300"
                    : "border-white/10 bg-white/5 text-white/70"
                }`}
              >
                {isAdmin ? "ADMIN" : "USER"}
              </span>
            </div>
          </div>

          <div className="p-2">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2 text-sm text-white/80 transition hover:bg-white/[0.05] hover:text-white"
            >
              Ustawienia
            </Link>

            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2 text-sm text-white/80 transition hover:bg-white/[0.05] hover:text-white"
            >
              Dashboard
            </Link>

            {isAdmin && (
              <Link
                href="/dashboard/admin/payouts"
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3 py-2 text-sm text-white/80 transition hover:bg-white/[0.05] hover:text-white"
              >
                Panel admina
              </Link>
            )}

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="mt-1 block w-full rounded-xl px-3 py-2 text-left text-sm text-red-300 transition hover:bg-red-500/10 disabled:opacity-60"
            >
              {loggingOut ? "Wylogowywanie..." : "Wyloguj"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}