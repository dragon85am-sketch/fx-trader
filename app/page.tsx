import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import LanguageSwitcher from "@/components/LanguageSwitcher";

import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BrainCircuit,
  Crown,
  GraduationCap,
  Headphones,
  LockKeyhole,
  Radar,
  ShieldCheck,
  Target,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (token) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-[#031A31] text-white">
      {/* BACKGROUND - STATIC, NO ANIMATION */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#03152B_0%,#06284A_48%,#03182F_100%)]" />

        {/* soft static blue light */}
        <div className="absolute left-[8%] top-[6%] h-[560px] w-[560px] rounded-full bg-blue-600/[0.10] blur-[150px]" />
        <div className="absolute right-[8%] top-[10%] h-[620px] w-[620px] rounded-full bg-sky-500/[0.08] blur-[170px]" />

        {/* REAL SIDE WALLPAPERS FROM REFERENCE IMAGE */}
        <div className="absolute inset-y-0 left-0 hidden w-[calc((100vw-1380px)/2+170px)] min-w-[250px] overflow-hidden xl:block">
          <Image
            src="/home/side-left.png"
            alt=""
            fill
            priority
            sizes="28vw"
            className="object-cover object-right opacity-95"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#03182F]" />
        </div>

        <div className="absolute inset-y-0 right-0 hidden w-[calc((100vw-1380px)/2+170px)] min-w-[250px] overflow-hidden xl:block">
          <Image
            src="/home/side-right.png"
            alt=""
            fill
            priority
            sizes="28vw"
            className="object-cover object-left opacity-95"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#03182F]" />
        </div>
      </div>

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 overflow-visible border-b border-sky-200/25 bg-[#031A31]/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[58px] w-full max-w-[1380px] items-center gap-1.5 px-2 py-2 sm:min-h-[64px] sm:gap-2.5 sm:px-4 md:px-6">
          <Link href="/" className="relative h-[36px] w-[96px] shrink-0 min-[390px]:w-[104px] sm:h-[52px] sm:w-[205px]">
            <Image
              src="/home/logo-fxtrade.png"
              alt="FX Trade Professional Trading"
              fill
              priority
              sizes="205px"
              className="object-contain object-left"
            />
          </Link>

          <nav className="hidden items-center gap-7 text-[12px] font-semibold text-slate-300 lg:flex">
            <a href="#funkcje" className="transition hover:text-sky-400">
              Funkcje
            </a>
            <a href="#scanner" className="transition hover:text-sky-400">
              Skaner Rynku
            </a>
            <a href="#strategie" className="transition hover:text-sky-400">
              Strategie
            </a>
            <a href="#edukacja" className="transition hover:text-sky-400">
              Edukacja
            </a>
            <Link href="/trading-room" className="transition hover:text-sky-400">
              Trading Room
            </Link>
            <Link href="/cennik" className="transition hover:text-sky-400">
              Cennik
            </Link>
            <a href="#onas" className="transition hover:text-sky-400">
              O nas
            </a>
          </nav>

          <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2.5">
            <div className="relative z-[100] w-[104px] shrink-0 overflow-visible min-[390px]:w-[112px] sm:w-auto
              [&_button]:!h-9 [&_button]:!min-w-0 [&_button]:!w-[104px] [&_button]:!px-2
              min-[390px]:[&_button]:!w-[112px]
              sm:[&_button]:!h-auto sm:[&_button]:!w-auto sm:[&_button]:!px-4">
              <LanguageSwitcher />
            </div>

            <Link
              href="/login"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-sky-400/42 bg-[#06335C] text-[0px] font-semibold transition hover:border-sky-400/60 sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-2.5 sm:text-[12px]"
            >
              <User className="h-4 w-4 text-sky-400" />
              Zaloguj się
            </Link>

            <Link
              href="/checkout"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-sky-500 via-blue-600 to-blue-700 text-[10px] font-bold shadow-[0_0_26px_rgba(37,99,235,.26)] transition hover:brightness-110 min-[430px]:w-auto min-[430px]:gap-1.5 min-[430px]:px-3 sm:h-auto sm:gap-2 sm:px-4 sm:py-2.5 sm:text-[12px]"
              aria-label="Kup dostęp do platformy"
            >
              <Crown className="h-4 w-4 shrink-0" />
              <span className="hidden min-[430px]:inline">Kup dostęp</span>
              <span className="hidden sm:inline"> do platformy</span>
            </Link>
          </div>
        </div>

        <nav className="mx-auto flex w-full max-w-[1380px] gap-1 overflow-x-auto px-2 pb-2 text-[9px] font-semibold text-slate-300 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-[390px]:gap-1.5 min-[390px]:text-[10px] lg:hidden sm:px-4">
          <a href="#funkcje" className="shrink-0 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-2 min-[390px]:px-3">Funkcje</a>
          <a href="#scanner" className="shrink-0 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-2 min-[390px]:px-3">Skaner</a>
          <a href="#strategie" className="shrink-0 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-2 min-[390px]:px-3">Strategie</a>
          <a href="#edukacja" className="shrink-0 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-2 min-[390px]:px-3">Edukacja</a>
          <Link href="/trading-room" className="shrink-0 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-2 min-[390px]:px-3">Trading Room</Link>
          <Link href="/cennik" className="shrink-0 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-2 min-[390px]:px-3">Cennik</Link>
          <a href="#onas" className="shrink-0 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-2 min-[390px]:px-3">O nas</a>
        </nav>
      </header>

      <div className="relative z-10 mx-auto w-full min-w-0 max-w-[1380px] px-2 pb-6 sm:px-4 md:px-6">
        {/* HERO */}
        <section className="grid min-w-0 grid-cols-1 items-center gap-5 py-4 sm:gap-7 sm:py-6 lg:grid-cols-[minmax(0,.86fr)_minmax(0,1.14fr)]">
          <div className="relative isolate min-w-0">
          {/* STATIC HERO CANDLES — anchored to hero, do not follow scroll */}
          <div className="pointer-events-none absolute right-[-30px] top-[18px] z-0 hidden h-[360px] w-[310px] xl:block">
            {[
              [10, 238, 54, 18],
              [46, 208, 70, 23],
              [82, 178, 86, 27],
              [120, 194, 62, 21],
              [156, 148, 98, 31],
              [194, 116, 112, 35],
              [232, 82, 132, 40],
              [270, 48, 150, 45],
            ].map(([x, y, wick, body], i) => (
              <div key={i} className="absolute" style={{ left: x, top: y }}>
                <div
                  className="absolute left-1/2 -translate-x-1/2 bg-sky-300/55"
                  style={{
                    width: "1px",
                    height: wick,
                    boxShadow: "0 0 14px rgba(56,189,248,.60)",
                  }}
                />
                <div
                  className="absolute left-1/2 top-[12px] -translate-x-1/2 rounded-[2px] bg-gradient-to-b from-cyan-100 via-sky-400 to-blue-600"
                  style={{
                    width: "12px",
                    height: body,
                    boxShadow:
                      "0 0 15px rgba(56,189,248,.95), 0 0 38px rgba(37,99,235,.60)",
                  }}
                />
                <div
                  className="absolute left-1/2 top-[4px] h-[42px] w-[42px] -translate-x-1/2 rounded-full bg-sky-300/20 blur-xl"
                />
              </div>
            ))}
            <div className="absolute bottom-[45px] left-[5px] h-[120px] w-[285px] rounded-[50%] border-b border-sky-400/15" />
          </div>

            <div className="mb-4 inline-flex max-w-full items-center rounded-full border border-sky-400/38 bg-sky-500/[0.06] px-3 py-2 text-[8px] font-bold uppercase tracking-[0.10em] text-sky-400 sm:mb-5 sm:px-4 sm:text-[9px] sm:tracking-[0.19em]">
              Profesjonalna platforma tradingowa
            </div>

            <h1 className="leading-none">
              <span className="block text-[42px] font-black tracking-[-0.055em] min-[390px]:text-[48px] sm:text-[64px] xl:text-[70px]">
                FX{" "}
                <span className="bg-gradient-to-r from-sky-400 via-blue-500 to-blue-700 bg-clip-text text-transparent">
                  TRADE
                </span>
              </span>

              <span className="mt-3 flex min-w-0 items-center gap-2 text-[9px] font-semibold tracking-[0.22em] text-sky-300 min-[390px]:text-[10px] sm:gap-3 sm:text-[15px] sm:tracking-[0.5em]">
                <span className="h-px w-8 bg-sky-500" />
                PROFESSIONAL TRADING
                <span className="h-px flex-1 bg-gradient-to-r from-sky-500 to-transparent" />
              </span>
            </h1>

            <p className="mt-5 max-w-[620px] text-[12px] leading-5 text-slate-400 sm:mt-6 sm:text-[13px] sm:leading-6">
              Zaawansowane narzędzia do analizy rynku, wyszukiwania
              potencjalnych setupów oraz uporządkowanej edukacji
              tradingowej w jednym profesjonalnym środowisku.
            </p>

            <div id="funkcje" className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:grid-cols-4 sm:gap-4">
              <MiniFeature
                icon={<Target />}
                title="Znajdź najlepsze setupy"
                text="Skanery rynku w czasie rzeczywistym"
              />
              <MiniFeature
                icon={<TrendingUp />}
                title="Analizuj profesjonalnie"
                text="Wskaźniki, wykresy i dane"
              />
              <MiniFeature
                icon={<ShieldCheck />}
                title="Handluj z planem"
                text="Strategie i uporządkowany proces"
              />
              <MiniFeature
                icon={<BookOpen />}
                title="Rozwijaj wiedzę"
                text="Kursy, analizy i materiały"
              />
            </div>

            <div className="mt-6 flex w-full flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">
              <Link
                href="/checkout"
                className="group flex w-full min-w-0 items-center justify-center gap-3 sm:w-auto sm:min-w-[235px] rounded-lg bg-gradient-to-r from-sky-500 via-blue-600 to-blue-700 px-6 py-3.5 text-[12px] font-bold shadow-[0_0_34px_rgba(37,99,235,.24)] transition hover:brightness-110"
              >
                <Crown className="h-4 w-4" />
                Kup dostęp do platformy
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
              </Link>

              <Link
                href="/register"
                className="flex w-full min-w-0 items-center justify-center gap-2 sm:w-auto sm:min-w-[190px] rounded-lg border border-sky-400/46 bg-[#073A6A] px-6 py-3.5 text-[12px] font-semibold text-sky-200 transition hover:bg-sky-500/[0.07]"
              >
                <User className="h-4 w-4" />
                Zarejestruj się
              </Link>
            </div>
          </div>

          {/* HERO CHART */}
          <div className="relative min-w-0">
            <div className="absolute inset-0 bg-blue-400/[0.12] blur-[90px]" />

            <div className="relative w-full min-w-0 overflow-hidden rounded-[14px] border border-sky-400/38 bg-gradient-to-br from-[#073A6A] to-[#061C33] p-2.5 shadow-[0_24px_70px_rgba(2,12,27,.32)] sm:rounded-[18px] sm:p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex gap-2">
                  <span className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] font-bold">
                    EURUSD
                  </span>
                  <span className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] text-slate-400">
                    M15
                  </span>
                </div>

                <span className="text-[10px] font-bold text-emerald-400">
                  1.08742&nbsp;&nbsp;+0.21%
                </span>
              </div>

              <div className="relative h-[205px] overflow-hidden rounded-lg min-[390px]:h-[230px] sm:h-[315px] border border-sky-200/22 bg-[#042845]">
                <Image
                  src="/home/hero-chart.png"
                  alt="FX Trade EURUSD chart"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  className="object-cover object-center"
                />
              </div>

              <div className="mt-2.5 grid grid-cols-2 overflow-hidden rounded-lg border border-sky-200/22 bg-sky-300/[0.035] sm:grid-cols-4 sm:divide-x sm:divide-white/[0.06]">
                <ChartStat label="BID" value="1.08738" />
                <ChartStat label="ASK" value="1.08746" />
                <ChartStat label="SPREAD" value="0.8" />
                <ChartStat label="VOLUME" value="124.6K" />
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="grid grid-cols-1 overflow-hidden rounded-[14px] border border-sky-300/45 bg-[#06335C]/92 min-[390px]:grid-cols-2 xl:grid-cols-4">
          <BigStat icon={<Radar />} value="5" text="Skanerów dostępnych" />
          <BigStat icon={<TrendingUp />} value="10+" text="Rynków obsługiwanych" />
          <BigStat icon={<Zap />} value="24/7" text="Dostęp do platformy" />
          <BigStat icon={<BrainCircuit />} value="AI" text="Narzędzia analityczne" />
        </section>

        {/* 4 MAIN CARDS */}
        <section className="grid min-w-0 grid-cols-1 items-stretch gap-2.5 py-3 sm:grid-cols-2 xl:grid-cols-4">
          <FeatureCard
            id="scanner"
            icon={<Radar />}
            title="Skaner Rynku"
            description="Skanuj wiele instrumentów w czasie rzeczywistym i filtruj potencjalne okazje."
            image="/home/market-scanner.png"
            href="/skaner"
            button="Otwórz skaner"
          />
          <FeatureCard
            icon={<BarChart3 />}
            title="Wykresy Premium"
            description="Zaawansowane wykresy i narzędzia analizy technicznej."
            image="/home/premium-chart.png"
            href="/dashboard"
            button="Otwórz wykresy"
          />
          <FeatureCard
            id="strategie"
            icon={<ShieldCheck />}
            title="Strategie"
            description="Sprawdzone modele tradingowe z zasadami i checklistami."
            image="/home/strategies.png"
            href="/strategie"
            button="Zobacz strategie"
          />
          <FeatureCard
            id="edukacja"
            icon={<GraduationCap />}
            title="Edukacja"
            description="Rozwijaj umiejętności dzięki kursom, webinarom i analizom."
            image="/home/education.png"
            href="/edukacja"
            button="Otwórz edukację"
          />
        </section>

        {/* BENEFITS */}
        <section className="grid grid-cols-1 overflow-hidden rounded-[14px] border border-sky-300/45 bg-[#06335C]/92 min-[390px]:grid-cols-2 xl:grid-cols-4">
          <Benefit
            icon={<LockKeyhole />}
            title="Bezpieczeństwo"
            text="Bezpieczny dostęp do platformy i Twoich danych."
          />
          <Benefit
            icon={<Zap />}
            title="Szybkość"
            text="Dostęp do narzędzi i danych w jednym miejscu."
          />
          <Benefit
            icon={<ShieldCheck />}
            title="Niezawodność"
            text="Stabilne środowisko stworzone dla traderów."
          />
          <Benefit
            icon={<Headphones />}
            title="Wsparcie 24/7"
            text="Jesteśmy tu dla Ciebie przez całą dobę."
          />
        </section>

        <section
          id="onas"
          className="mt-3 rounded-[12px] border border-sky-200/25 bg-sky-300/[0.035] px-4 py-3"
        >
          <p className="text-[9px] leading-5 text-slate-400">
            Dostęp do Platformy Edukacyjnej FX Trade Professional Trading
            obejmuje kurs tradingu, strategie rynkowe, dashboard analityczny
            oraz narzędzia wspierające proces analizy i podejmowania
            samodzielnych decyzji tradingowych. Produkt ma charakter wyłącznie
            edukacyjny i informacyjny. Nie stanowi porady inwestycyjnej ani
            rekomendacji finansowej. Trading na rynkach finansowych wiąże się
            z ryzykiem utraty kapitału.
          </p>
        </section>

        <footer className="flex flex-col items-center justify-between gap-3 py-4 text-center text-[8px] text-slate-500 sm:flex-row sm:text-left">
          <span>© 2026 FX Trade Professional Trading.</span>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 sm:justify-end">
            <Link href="/regulamin" className="hover:text-slate-400">
              Regulamin
            </Link>
            <Link href="/polityka-prywatnosci" className="hover:text-slate-400">
              Polityka prywatności
            </Link>
            <Link href="/kontakt" className="hover:text-slate-400">
              Kontakt
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

function MiniFeature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div>
      <div className="mb-2.5 text-sky-400 [&_svg]:h-6 [&_svg]:w-6">{icon}</div>
      <div className="break-words text-[10px] font-bold text-white">{title}</div>
      <div className="mt-1 break-words text-[8px] leading-4 text-slate-400">{text}</div>
    </div>
  );
}

function ChartStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3">
      <div className="text-[7px] text-slate-400">{label}</div>
      <div className="mt-1 text-[11px] font-bold">{value}</div>
    </div>
  );
}

function BigStat({
  icon,
  value,
  text,
}: {
  icon: React.ReactNode;
  value: string;
  text: string;
}) {
  return (
    <div className="flex min-w-0 items-center justify-start gap-3 border-b border-sky-200/22 px-3 py-3.5 min-[390px]:border-r sm:px-4 xl:border-b-0">
      <div className="text-sky-400 [&_svg]:h-7 [&_svg]:w-7">{icon}</div>
      <div>
        <div className="text-[16px] font-black">{value}</div>
        <div className="mt-0.5 text-[8px] text-slate-400">{text}</div>
      </div>
    </div>
  );
}

function FeatureCard({
  id,
  icon,
  title,
  description,
  image,
  href,
  button,
}: {
  id?: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  image: string;
  href: string;
  button: string;
}) {
  return (
    <article
      id={id}
      className="group flex min-w-0 min-h-[320px] flex-col rounded-[14px] sm:h-[350px] border border-sky-400/38 bg-gradient-to-b from-[#073A6A] to-[#042845] p-3 transition duration-300 hover:border-sky-400/38"
    >
      <div className="flex min-h-[54px] gap-2.5">
        <div className="shrink-0 text-sky-400 [&_svg]:h-5 [&_svg]:w-5">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-[12px] font-bold leading-4 text-white">{title}</h2>
          <p className="mt-1 line-clamp-2 text-[8px] leading-3 text-slate-400">
            {description}
          </p>
        </div>
      </div>

      <div className="relative mt-3 h-[180px] w-full min-w-0 overflow-hidden sm:h-[198px] rounded-lg border border-sky-200/25 bg-[#032138] p-2">
        <div className="relative h-full w-full overflow-hidden rounded-md">
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
            className="object-contain object-center"
          />
        </div>
      </div>

      <Link
        href={href}
        className="mt-auto flex h-[38px] items-center justify-between rounded-lg border border-sky-400/38 bg-sky-500/[0.04] px-3 text-[9px] font-semibold text-sky-400 transition hover:bg-sky-500/[0.08]"
      >
        {button}
        <ArrowRight className="h-3 w-3" />
      </Link>
    </article>
  );
}

function Benefit({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 border-b border-sky-200/22 px-3 py-3.5 min-[390px]:border-r sm:px-4 xl:border-b-0">
      <div className="shrink-0 text-blue-500 [&_svg]:h-7 [&_svg]:w-7">{icon}</div>
      <div>
        <div className="text-[11px] font-bold">{title}</div>
        <div className="mt-1 break-words text-[8px] leading-4 text-slate-400">{text}</div>
      </div>
    </div>
  );
}

