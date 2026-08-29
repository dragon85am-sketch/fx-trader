"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AppSidebar from "@/components/AppSidebar";
import TopbarUserMenu from "@/components/TopbarUserMenu";
import ThemeProvider from "@/components/ThemeProvider";
import { UserProvider, useUser } from "@/components/UserProvider";
import {
  LanguageProvider,
  useLanguage,
} from "@/components/LanguageProvider";

const SIDEBAR_W = 304;
const CONTENT_GAP = 24;

function FlagIcon({
  country,
  className = "",
}: {
  country: "GB" | "PL";
  className?: string;
}) {
  if (country === "PL") {
    return (
      <svg
        viewBox="0 0 32 20"
        className={className}
        aria-hidden="true"
      >
        <rect width="32" height="10" fill="#ffffff" />
        <rect y="10" width="32" height="10" fill="#dc143c" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 60 36"
      className={className}
      aria-hidden="true"
    >
      <rect width="60" height="36" fill="#012169" />

      <path d="M0 0 60 36M60 0 0 36" stroke="#ffffff" strokeWidth="8" />
      <path d="M0 0 60 36M60 0 0 36" stroke="#C8102E" strokeWidth="4" />

      <path d="M30 0v36M0 18h60" stroke="#ffffff" strokeWidth="12" />
      <path d="M30 0v36M0 18h60" stroke="#C8102E" strokeWidth="7" />
    </svg>
  );
}


function TopbarLanguageMenu() {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);

  const current =
    lang === "pl"
      ? { country: "PL" as const, code: "PL" }
      : { country: "GB" as const, code: "EN" };

  return (
    <div className="relative z-[300]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="
          flex h-[44px] min-w-[118px]
          items-center gap-2.5
          rounded-xl
          border border-cyan-300/20
          bg-[linear-gradient(180deg,#0B67A7_0%,#07558D_100%)]
          px-3.5
          text-sm
          shadow-[0_8px_25px_rgba(0,40,90,.24),inset_0_1px_0_rgba(255,255,255,.06)]
          transition-all duration-200
          hover:border-cyan-300/40
          hover:bg-[linear-gradient(180deg,#0D73B8_0%,#08639F_100%)]
        "
      >
        <span className="flex h-6 w-8 shrink-0 items-center justify-center">
          <FlagIcon
            country={current.country}
            className="h-[18px] w-[29px] rounded-[3px] shadow-[0_0_0_1px_rgba(255,255,255,.18)]"
          />
        </span>

        <span className="font-bold tracking-wide text-white">
          {current.code}
        </span>

        <span
          className={`ml-auto text-[10px] text-cyan-100/70 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        >
          ▲
        </span>
      </button>

      {open ? (
        <div
          className="
            absolute right-0 top-[50px]
            w-[148px]
            overflow-hidden
            rounded-xl
            border border-cyan-300/20
            bg-[linear-gradient(180deg,#0A5E9C_0%,#064773_100%)]
            p-1.5
            shadow-[0_16px_40px_rgba(0,25,65,.35),inset_0_1px_0_rgba(255,255,255,.05)]
            backdrop-blur-xl
          "
        >
          <button
            type="button"
            onClick={() => {
              setLang("en");
              setOpen(false);
            }}
            className={`
              flex w-full items-center gap-3
              rounded-lg px-3 py-2.5
              text-left text-sm
              transition-all duration-200
              ${
                lang === "en"
                  ? "bg-cyan-300/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.05)]"
                  : "text-cyan-50/80 hover:bg-cyan-300/10 hover:text-white"
              }
            `}
          >
            <span className="flex h-6 w-8 shrink-0 items-center justify-center">
              <FlagIcon
                country="GB"
                className="h-[18px] w-[29px] rounded-[3px] shadow-[0_0_0_1px_rgba(255,255,255,.18)]"
              />
            </span>
            <span className="font-bold tracking-wide text-white">EN</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLang("pl");
              setOpen(false);
            }}
            className={`
              flex w-full items-center gap-3
              rounded-lg px-3 py-2.5
              text-left text-sm
              transition-all duration-200
              ${
                lang === "pl"
                  ? "bg-cyan-300/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.05)]"
                  : "text-cyan-50/80 hover:bg-cyan-300/10 hover:text-white"
              }
            `}
          >
            <span className="flex h-6 w-8 shrink-0 items-center justify-center">
              <FlagIcon
                country="PL"
                className="h-[18px] w-[29px] rounded-[3px] shadow-[0_0_0_1px_rgba(255,255,255,.18)]"
              />
            </span>
            <span className="font-bold tracking-wide text-white">PL</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}


function WelcomeTopbarInfo() {
  const { user } = useUser();
  const { lang } = useLanguage();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => setNow(new Date());
    update();

    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const name =
    user?.name?.trim() ||
    user?.email?.split("@")[0] ||
    (lang === "pl" ? "Trader" : "Trader");

  const time = now
    ? new Intl.DateTimeFormat(lang === "pl" ? "pl-PL" : "en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(now)
    : "--:--:--";

  const date = now
    ? new Intl.DateTimeFormat(lang === "pl" ? "pl-PL" : "en-GB", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(now)
    : "";

  const prettyDate = date
    ? date.charAt(0).toUpperCase() + date.slice(1)
    : "";

  return (
    <div className="flex min-w-0 flex-1 items-center gap-4 xl:gap-5">
      {/* BRAND */}
      <div className="hidden min-w-[210px] items-center gap-4 border-r border-cyan-300/15 pr-5 2xl:flex">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/[0.07] text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,.10)]">
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 18V8M10 18V5M16 18v-8M22 18V3" />
            <path d="m3 15 5-5 4 3 8-9" />
            <path d="M17 4h3v3" />
          </svg>
        </div>

        <div className="min-w-0">
          <div className="truncate text-[15px] font-black uppercase tracking-[0.12em] text-cyan-300">
            FX TRADE
          </div>
          <div className="mt-0.5 text-[11px] uppercase tracking-[0.10em] text-sky-100/55">
            Dashboard panel
          </div>
        </div>
      </div>

      {/* WELCOME */}
      <div className="flex min-w-0 max-w-[590px] flex-1 items-center gap-3.5 rounded-[20px] border border-cyan-300/15 bg-[#061d39]/35 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,.04),0_0_20px_rgba(14,165,233,.05)] backdrop-blur-md">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-300/25 bg-[#0b4f87]/70 text-cyan-300 shadow-[0_0_18px_rgba(34,211,238,.10)]">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 20a7 7 0 0 1 14 0" />
          </svg>
        </div>

        <div className="min-w-0">
          <div className="truncate text-[15px] font-extrabold text-white xl:text-[16px]">
            {lang === "pl"
              ? `Witaj ponownie, ${name}!`
              : `Welcome back, ${name}!`}
          </div>

          <div className="mt-1 truncate text-[11px] text-sky-100/55 xl:text-[12px]">
            {lang === "pl"
              ? "Życzymy udanego dnia i skutecznego tradingu!"
              : "Have a successful day and great trading!"}
          </div>
        </div>
      </div>

      {/* CLOCK */}
      <div className="hidden min-w-[245px] items-center gap-3.5 rounded-[20px] border border-cyan-300/15 bg-[#061d39]/35 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,.04),0_0_20px_rgba(14,165,233,.05)] backdrop-blur-md lg:flex">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-300/25 bg-[#0b4f87]/70 text-cyan-300 shadow-[0_0_18px_rgba(34,211,238,.10)]">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="8.5" />
            <path d="M12 7.5V12l3 2" />
          </svg>
        </div>

        <div className="min-w-0">
          <div className="tabular-nums text-[18px] font-black tracking-[0.03em] text-white">
            {time}
          </div>
          <div className="mt-0.5 truncate text-[11px] text-sky-100/55">
            {prettyDate}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <UserProvider>
      <LanguageProvider>
        <ThemeProvider>
          <div
            className="fixed left-0 top-0 z-[200] h-screen"
            style={{ width: SIDEBAR_W }}
          >
            <AppSidebar />
          </div>

          <div
            className="
              fx-app-background
              relative min-h-screen
              w-full overflow-hidden
              text-white
              transition-all
              duration-300
            "
            style={{
              paddingLeft: SIDEBAR_W + CONTENT_GAP,
              paddingRight: 24,
            }}
          >
            <div
              aria-hidden="true"
              className="
                fx-app-ambient
                pointer-events-none
                fixed inset-0
                z-0
              "
            />

            <div
              aria-hidden="true"
              className="
                fx-app-grid
                pointer-events-none
                fixed inset-0
                z-0
              "
            />

            <div
              className="
                fx-page-shell
                relative z-10
                min-h-screen
                w-full
                bg-transparent
              "
            >
              <header
                className="
                  fx-layout-topbar
                  sticky top-0
                  z-[150]
                  mb-4
                  ml-0
                  w-full
                  overflow-visible
                  rounded-[26px]
                  border
                  px-5 py-3.5 xl:px-6
                  backdrop-blur-xl
                  transition-all
                  duration-300
                "
              >
                <div className="relative z-10 flex items-center gap-4">
                  <WelcomeTopbarInfo />

                  <div className="ml-auto flex shrink-0 items-center gap-3 border-l border-cyan-300/15 pl-4">
                    <TopbarLanguageMenu />
                    <TopbarUserMenu />
                  </div>
                </div>

                <div
                  aria-hidden="true"
                  className="
                    pointer-events-none
                    absolute inset-0
                    rounded-[26px]
                    shadow-[inset_0_0_28px_rgba(56,189,248,.065)]
                  "
                />
              </header>

              <main
                className="
                  fx-layout-content
                  ml-0
                  w-full
                  min-w-0
                  rounded-[28px]
                  border
                  px-6
                  py-5
                  text-white
                  backdrop-blur-xl
                  transition-all
                  duration-300
                "
              >
                {children}
              </main>
            </div>
          </div>
        </ThemeProvider>
      </LanguageProvider>
    </UserProvider>
  );
}
