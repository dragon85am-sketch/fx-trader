"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AppSidebar from "@/components/AppSidebar";
import TopbarUserMenu from "@/components/TopbarUserMenu";
import ThemeProvider from "@/components/ThemeProvider";
import { UserProvider, useUser } from "@/components/UserProvider";
import { useLanguage } from "@/components/LanguageProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";

function TopbarLanguageMenu() {
  return <LanguageSwitcher compact />;
}

function WelcomeTopbarInfo() {
  const { user } = useUser();
  const { lang, locale } = useLanguage();
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
    "Trader";

  const time = now
    ? new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(now)
    : "--:--:--";

  const date = now
    ? new Intl.DateTimeFormat(locale, {
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
    <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4 xl:gap-5">
      {/* BRAND - DESKTOP */}
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
      <div
        className="
          flex min-w-0 flex-1 items-center
          gap-2
          rounded-[14px]
          border border-cyan-300/15
          bg-[#061d39]/35
          px-2 py-2
          shadow-[inset_0_1px_0_rgba(255,255,255,.04),0_0_20px_rgba(14,165,233,.05)]
          backdrop-blur-md
          sm:max-w-[590px]
          sm:gap-3.5
          sm:rounded-[20px]
          sm:px-4
          sm:py-3
        "
      >
        <div
          className="
            hidden
            h-9 w-9 shrink-0
            items-center justify-center
            rounded-xl
            border border-cyan-300/25
            bg-[#0b4f87]/70
            text-cyan-300
            shadow-[0_0_18px_rgba(34,211,238,.10)]
            sm:flex
            sm:h-11 sm:w-11
          "
        >
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
          <div className="truncate text-[12px] font-extrabold text-white sm:text-[15px] xl:text-[16px]">
            {{
              pl: `Witaj, ${name}!`,
              en: `Welcome, ${name}!`,
              de: `Willkommen, ${name}!`,
              nl: `Welkom, ${name}!`,
              es: `Bienvenido, ${name}!`,
            }[lang]}
          </div>

          <div className="mt-1 hidden truncate text-[11px] text-sky-100/55 sm:block xl:text-[12px]">
            {{
              pl: "Życzymy udanego dnia i skutecznego tradingu!",
              en: "Have a great day and successful trading!",
              de: "Wir wünschen dir einen erfolgreichen Trading-Tag!",
              nl: "We wensen je een fijne dag en succesvolle trades!",
              es: "¡Que tengas un gran día y un trading exitoso!",
            }[lang]}
          </div>
        </div>
      </div>

      {/* CLOCK - DESKTOP */}
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

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register";

  /*
    Po przejściu na inną stronę
    automatycznie zamknij mobilne menu.
  */
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  /*
    Kiedy menu mobilne jest otwarte,
    blokujemy scroll strony pod spodem.
  */
  useEffect(() => {
    if (!mobileSidebarOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSidebarOpen]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <UserProvider>
      <ThemeProvider>
        {/* ========================================= */}
        {/* DESKTOP SIDEBAR */}
        {/* ========================================= */}

        <aside
          className="
            fixed
            left-0
            top-0
            z-[200]
            hidden
            h-screen
            w-[304px]
            lg:block
          "
        >
          <AppSidebar />
        </aside>

        {/* ========================================= */}
        {/* MOBILE OVERLAY */}
        {/* ========================================= */}

        <div
          onClick={() => setMobileSidebarOpen(false)}
          className={`
            fixed inset-0
            z-[290]
            bg-black/70
            backdrop-blur-[3px]
            transition-opacity
            duration-300
            lg:hidden

            ${
              mobileSidebarOpen
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none opacity-0"
            }
          `}
        />

        {/* ========================================= */}
        {/* MOBILE SIDEBAR */}
        {/* ========================================= */}

        <aside
          className={`
            fixed
            left-0
            top-0
            z-[300]
            h-[100dvh]
            w-[86vw]
            max-w-[304px]
            overflow-y-auto
            border-r
            border-cyan-300/15
            bg-[#020b18]
            shadow-[20px_0_70px_rgba(0,0,0,.65)]
            transition-transform
            duration-300
            ease-out
            lg:hidden

            ${
              mobileSidebarOpen
                ? "translate-x-0"
                : "-translate-x-full"
            }
          `}
        >
          {/* MOBILE CLOSE BUTTON */}
          <button
            type="button"
            aria-label="Zamknij menu"
            onClick={() => setMobileSidebarOpen(false)}
            className="
              absolute
              right-3
              top-3
              z-[400]
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              border
              border-cyan-300/20
              bg-[#061d39]/90
              text-cyan-200
              shadow-lg
              transition
              hover:bg-cyan-300/10
            "
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12" />
              <path d="M18 6L6 18" />
            </svg>
          </button>

          <AppSidebar />
        </aside>

        {/* ========================================= */}
        {/* APP */}
        {/* ========================================= */}

        <div
          className="
            fx-app-background
            relative
            min-h-[100dvh]
            w-full
            overflow-x-hidden
            px-2
            text-white
            transition-all
            duration-300

            sm:px-4

            lg:pl-[328px]
            lg:pr-6
          "
        >
          {/* AMBIENT */}
          <div
            aria-hidden="true"
            className="
              fx-app-ambient
              pointer-events-none
              fixed
              inset-0
              z-0
            "
          />

          {/* GRID */}
          <div
            aria-hidden="true"
            className="
              fx-app-grid
              pointer-events-none
              fixed
              inset-0
              z-0
            "
          />

          <div
            className="
              fx-page-shell
              relative
              z-10
              min-h-[100dvh]
              w-full
              min-w-0
              bg-transparent
            "
          >
            {/* ========================================= */}
            {/* TOPBAR */}
            {/* ========================================= */}

            <header
              className="
                fx-layout-topbar

                sticky
                top-0
                z-[150]

                mb-2
                w-full

                overflow-visible

                rounded-b-[18px]

                border

                px-2
                py-2

                backdrop-blur-xl

                transition-all
                duration-300

                sm:mb-4
                sm:rounded-[22px]
                sm:px-4
                sm:py-3

                lg:rounded-[26px]
                lg:px-5
                lg:py-3.5

                xl:px-6
              "
            >
              <div className="relative z-10 flex min-w-0 items-center gap-2 sm:gap-4">
                {/* MOBILE HAMBURGER */}
                <button
                  type="button"
                  aria-label="Otwórz menu"
                  onClick={() => setMobileSidebarOpen(true)}
                  className="
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-cyan-300/20
                    bg-[#082541]/80
                    text-cyan-300
                    shadow-[0_0_18px_rgba(34,211,238,.08)]
                    transition
                    active:scale-95
                    lg:hidden
                  "
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M4 7h16" />
                    <path d="M4 12h16" />
                    <path d="M4 17h16" />
                  </svg>
                </button>

                <WelcomeTopbarInfo />

                {/* USER / LANGUAGE */}
                <div
                  className="
                    ml-auto
                    flex
                    shrink-0
                    items-center
                    gap-1

                    sm:gap-2

                    lg:gap-3
                    lg:border-l
                    lg:border-cyan-300/15
                    lg:pl-4
                  "
                >
                  {/* Language ukrywamy na najmniejszych ekranach */}
                  <div className="hidden min-[430px]:block">
                    <TopbarLanguageMenu />
                  </div>

                  <TopbarUserMenu />
                </div>
              </div>

              <div
                aria-hidden="true"
                className="
                  pointer-events-none
                  absolute
                  inset-0
                  rounded-[inherit]
                  shadow-[inset_0_0_28px_rgba(56,189,248,.065)]
                "
              />
            </header>

            {/* ========================================= */}
            {/* PAGE CONTENT */}
            {/* ========================================= */}

            <main
              className="
                fx-layout-content

                ml-0

                w-full
                min-w-0
                max-w-full

                overflow-x-hidden

                rounded-[18px]

                border

                px-2
                py-3

                text-white

                backdrop-blur-xl

                transition-all
                duration-300

                sm:rounded-[22px]
                sm:px-4
                sm:py-4

                lg:rounded-[28px]
                lg:px-6
                lg:py-5
              "
            >
              {children}
            </main>
          </div>
        </div>
      </ThemeProvider>
    </UserProvider>
  );
}