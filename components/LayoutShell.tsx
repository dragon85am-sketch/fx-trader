"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AppSidebar from "@/components/AppSidebar";
import TopbarUserMenu from "@/components/TopbarUserMenu";
import ThemeProvider from "@/components/ThemeProvider";
import { UserProvider, useUser } from "@/components/UserProvider";
import { useLanguage } from "@/components/LanguageProvider";
type LanguageCode = "pl" | "en" | "de" | "nl" | "es";

type LanguageItem = {
  code: LanguageCode;
  short: string;
  label: string;
};

const TOPBAR_LANGUAGES: LanguageItem[] = [
  { code: "pl", short: "PL", label: "Polski" },
  { code: "en", short: "EN", label: "English" },
  { code: "de", short: "DE", label: "Deutsch" },
  { code: "nl", short: "NL", label: "Nederlands" },
  { code: "es", short: "ES", label: "Español" },
];

function LanguageFlag({ code }: { code: LanguageCode }) {
  const base =
    "relative h-[18px] w-[29px] shrink-0 overflow-hidden rounded-[3px] shadow-[0_0_0_1px_rgba(255,255,255,.24),0_0_10px_rgba(56,189,248,.12)]";

  if (code === "pl") {
    return (
      <span className={`${base} flex flex-col bg-white`} aria-hidden="true">
        <span className="h-1/2 w-full bg-white" />
        <span className="h-1/2 w-full bg-[#dc143c]" />
      </span>
    );
  }

  if (code === "de") {
    return (
      <span className={`${base} flex flex-col`} aria-hidden="true">
        <span className="h-1/3 w-full bg-black" />
        <span className="h-1/3 w-full bg-[#dd0000]" />
        <span className="h-1/3 w-full bg-[#ffce00]" />
      </span>
    );
  }

  if (code === "nl") {
    return (
      <span className={`${base} flex flex-col`} aria-hidden="true">
        <span className="h-1/3 w-full bg-[#ae1c28]" />
        <span className="h-1/3 w-full bg-white" />
        <span className="h-1/3 w-full bg-[#21468b]" />
      </span>
    );
  }

  if (code === "es") {
    return (
      <span className={`${base} flex flex-col`} aria-hidden="true">
        <span className="h-1/4 w-full bg-[#aa151b]" />
        <span className="h-1/2 w-full bg-[#f1bf00]" />
        <span className="h-1/4 w-full bg-[#aa151b]" />
      </span>
    );
  }

  return (
    <span className={`${base} bg-[#012169]`} aria-hidden="true">
      <span className="absolute left-1/2 top-1/2 h-[4px] w-[40px] -translate-x-1/2 -translate-y-1/2 rotate-[31deg] bg-white" />
      <span className="absolute left-1/2 top-1/2 h-[4px] w-[40px] -translate-x-1/2 -translate-y-1/2 -rotate-[31deg] bg-white" />
      <span className="absolute left-1/2 top-0 h-full w-[7px] -translate-x-1/2 bg-white" />
      <span className="absolute left-0 top-1/2 h-[7px] w-full -translate-y-1/2 bg-white" />
      <span className="absolute left-1/2 top-0 h-full w-[3px] -translate-x-1/2 bg-[#c8102e]" />
      <span className="absolute left-0 top-1/2 h-[3px] w-full -translate-y-1/2 bg-[#c8102e]" />
    </span>
  );
}

function TopbarLanguageMenu() {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);

  const current =
    TOPBAR_LANGUAGES.find((item) => item.code === lang) ??
    TOPBAR_LANGUAGES[0];

  function changeLanguage(next: LanguageCode) {
    setLang(next);

    try {
      localStorage.setItem("lang", next);
      localStorage.setItem("fxtrade-language", next);
    } catch {}

    document.cookie = `fxtrade-language=${next}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = next;

    window.dispatchEvent(
      new CustomEvent("fxtrade-language-change", {
        detail: next,
      })
    );

    setOpen(false);
  }

  return (
    <div className="relative z-[350]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-[42px] min-w-[94px] items-center gap-2 rounded-xl border border-cyan-300/35 bg-transparent px-3 text-[12px] font-black text-white shadow-[0_0_18px_rgba(34,211,238,.08)] backdrop-blur-sm transition hover:border-cyan-200/70 hover:shadow-[0_0_26px_rgba(34,211,238,.18)]"
      >
        <LanguageFlag code={current.code} />
        <span>{current.short}</span>
        <svg
          viewBox="0 0 24 24"
          className={`ml-auto h-3.5 w-3.5 text-cyan-200 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[48px] z-[500] w-[178px] space-y-1 bg-transparent p-1 shadow-none"
        >
          {TOPBAR_LANGUAGES.map((item) => {
            const active = item.code === current.code;

            return (
              <button
                key={item.code}
                type="button"
                role="menuitem"
                onClick={() => changeLanguage(item.code)}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-[12px] font-semibold text-white backdrop-blur-md transition ${
                  active
                    ? "border-cyan-300/70 bg-cyan-300/[0.07] shadow-[0_0_20px_rgba(34,211,238,.12)]"
                    : "border-transparent bg-transparent hover:border-cyan-300/35 hover:bg-cyan-300/[0.05]"
                }`}
              >
                <LanguageFlag code={item.code} />
                <span className="flex-1">{item.label}</span>
                {active ? (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 text-cyan-300"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m5 12 4 4L19 6" />
                  </svg>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
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
      <div className="hidden min-w-[250px] items-center border-r border-cyan-300/15 pr-5 2xl:flex">
        <div className="relative flex h-[70px] w-[220px] items-center justify-start bg-transparent px-1">
          <img
            src="/fx-trade-panel-logo.png"
            alt="FX Trade Professional Trading"
            className="h-[66px] w-[205px] object-contain object-left mix-blend-lighten drop-shadow-[0_0_12px_rgba(14,165,233,.18)]"
          />
        </div>
      </div>

      {/* WELCOME */}
      <div
        className="
          flex min-w-0 flex-1 items-center
          gap-2
          rounded-[14px]
          border border-cyan-300/30
          bg-gradient-to-r from-[#06345d]/55 via-[#082f55]/45 to-[#061d39]/30
          px-2 py-2
          shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_0_24px_rgba(34,211,238,.10)]
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
            border border-cyan-300/35
            bg-cyan-300/[0.07]
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
      <div className="hidden min-w-[245px] items-center gap-3.5 rounded-[20px] border border-cyan-300/30 bg-gradient-to-r from-[#06345d]/55 via-[#082f55]/45 to-[#061d39]/30 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_0_24px_rgba(34,211,238,.10)] backdrop-blur-md lg:flex">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-300/35 bg-cyan-300/[0.07] text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,.14)]">
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
  const isHarmonicScanner = pathname.toLowerCase().includes("harmonic");
  const isScannerSuite =
    pathname.startsWith("/skaner/pro") ||
    pathname.startsWith("/skaner/alpha") ||
    pathname.startsWith("/skaner/gold");
  const hasCustomScannerBackground = isHarmonicScanner || isScannerSuite;

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
          style={
            hasCustomScannerBackground
              ? {
                  backgroundImage: isHarmonicScanner
                    ? "linear-gradient(rgba(2,18,38,.16), rgba(2,18,38,.28)), url('/images/harmonic-scanner-bg.png')"
                    : "linear-gradient(rgba(2,18,38,.10), rgba(2,18,38,.22)), url('/images/scanner-suite-bg.png')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  backgroundAttachment: "fixed",
                  backgroundColor: "#03172f",
                }
              : undefined
          }
        >
          {/* AMBIENT */}
          {!hasCustomScannerBackground ? (
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
          ) : null}

          {/* GRID */}
          {!hasCustomScannerBackground ? (
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
          ) : null}

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

                  <div className="fx-user-menu-blue">
                      <TopbarUserMenu />
                    </div>
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
              className={`
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

                transition-all
                duration-300

                sm:rounded-[22px]
                sm:px-4
                sm:py-4

                lg:rounded-[28px]
                lg:px-6
                lg:py-5

                ${
                  hasCustomScannerBackground
                    ? "!border-transparent !bg-transparent !shadow-none !backdrop-blur-none"
                    : "backdrop-blur-xl"
                }
              `}
            >
              {children}
            </main>

            <style>{`
              ${
                hasCustomScannerBackground
                  ? `
                    .fx-app-background {
                      background-color: #03172f !important;
                    }

                    .fx-layout-content {
                      background: transparent !important;
                      background-color: transparent !important;
                      border-color: transparent !important;
                      box-shadow: none !important;
                      backdrop-filter: none !important;
                      -webkit-backdrop-filter: none !important;
                    }

                    .fx-page-shell {
                      background: transparent !important;
                    }
                  `
                  : ""
              }

              .fx-user-menu-blue > div {
                --fx-profile-bg: rgba(7, 58, 104, 0.96);
              }

              .fx-user-menu-blue [role="menu"],
              .fx-user-menu-blue [data-user-menu],
              .fx-user-menu-blue .absolute[class*="top-"],
              .fx-user-menu-blue .absolute[class*="right-"] {
                background: linear-gradient(145deg, rgba(8, 76, 132, 0.98), rgba(5, 47, 88, 0.98)) !important;
                border-color: rgba(34, 211, 238, 0.34) !important;
                box-shadow: 0 18px 48px rgba(0, 20, 45, 0.38), 0 0 26px rgba(34, 211, 238, 0.12), inset 0 1px 0 rgba(255,255,255,.08) !important;
                backdrop-filter: blur(18px);
              }

              .fx-user-menu-blue [role="menu"] button:not([class*="red"]):hover,
              .fx-user-menu-blue [data-user-menu] button:not([class*="red"]):hover {
                background: rgba(34, 211, 238, 0.10) !important;
              }
            `}</style>
          </div>
        </div>
      </ThemeProvider>
    </UserProvider>
  );
}