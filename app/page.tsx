import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

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
    <main className="min-h-screen overflow-hidden bg-[#031A31] text-white">
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
      <header className="relative z-50 border-b border-sky-200/25 bg-[#031A31]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[64px] w-full max-w-[1380px] items-center justify-between px-4 md:px-6">
          <Link href="/" className="relative h-[52px] w-[205px] shrink-0">
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

          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="hidden items-center gap-2 rounded-lg border border-sky-400/42 bg-[#06335C] px-4 py-2.5 text-[12px] font-semibold transition hover:border-sky-400/46 sm:flex"
            >
              <User className="h-4 w-4 text-sky-400" />
              Zaloguj się
            </Link>

            <Link
              href="/checkout"
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 via-blue-600 to-blue-700 px-4 py-2.5 text-[12px] font-bold shadow-[0_0_26px_rgba(37,99,235,.26)] transition hover:brightness-110"
            >
              <Crown className="h-4 w-4" />
              Kup dostęp do platformy
            </Link>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto w-full max-w-[1380px] px-4 pb-6 md:px-6">
        {/* HERO */}
        <section className="grid items-center gap-7 py-6 lg:grid-cols-[0.86fr_1.14fr]">
          <div className="relative isolate">
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

            <div className="mb-5 inline-flex items-center rounded-full border border-sky-400/38 bg-sky-500/[0.06] px-4 py-2 text-[9px] font-bold uppercase tracking-[0.19em] text-sky-400">
              Profesjonalna platforma tradingowa
            </div>

            <h1 className="leading-none">
              <span className="block text-[54px] font-black tracking-[-0.055em] sm:text-[64px] xl:text-[70px]">
                FX{" "}
                <span className="bg-gradient-to-r from-sky-400 via-blue-500 to-blue-700 bg-clip-text text-transparent">
                  TRADE
                </span>
              </span>

              <span className="mt-3 flex items-center gap-3 text-[12px] font-semibold tracking-[0.5em] text-sky-300 sm:text-[15px]">
                <span className="h-px w-8 bg-sky-500" />
                PROFESSIONAL TRADING
                <span className="h-px flex-1 bg-gradient-to-r from-sky-500 to-transparent" />
              </span>
            </h1>

            <p className="mt-6 max-w-[620px] text-[13px] leading-6 text-slate-400">
              Zaawansowane narzędzia do analizy rynku, wyszukiwania
              potencjalnych setupów oraz uporządkowanej edukacji
              tradingowej w jednym profesjonalnym środowisku.
            </p>

            <div id="funkcje" className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
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

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/checkout"
                className="group flex min-w-[235px] items-center justify-center gap-3 rounded-lg bg-gradient-to-r from-sky-500 via-blue-600 to-blue-700 px-6 py-3.5 text-[12px] font-bold shadow-[0_0_34px_rgba(37,99,235,.24)] transition hover:brightness-110"
              >
                <Crown className="h-4 w-4" />
                Kup dostęp do platformy
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
              </Link>

              <Link
                href="/register"
                className="flex min-w-[190px] items-center justify-center gap-2 rounded-lg border border-sky-400/46 bg-[#073A6A] px-6 py-3.5 text-[12px] font-semibold text-sky-200 transition hover:bg-sky-500/[0.07]"
              >
                <User className="h-4 w-4" />
                Zarejestruj się
              </Link>
            </div>
          </div>

          {/* HERO CHART */}
          <div className="relative">
            <div className="absolute inset-0 bg-blue-400/[0.12] blur-[90px]" />

            <div className="relative overflow-hidden rounded-[18px] border border-sky-400/38 bg-gradient-to-br from-[#073A6A] to-[#061C33] p-4 shadow-[0_24px_70px_rgba(2,12,27,.32)]">
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

              <div className="relative h-[315px] overflow-hidden rounded-lg border border-sky-200/22 bg-[#042845]">
                <Image
                  src="/home/hero-chart.png"
                  alt="FX Trade EURUSD chart"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  className="object-cover object-center"
                />
              </div>

              <div className="mt-2.5 grid grid-cols-4 divide-x divide-white/[0.06] rounded-lg border border-sky-200/22 bg-sky-300/[0.035]">
                <ChartStat label="BID" value="1.08738" />
                <ChartStat label="ASK" value="1.08746" />
                <ChartStat label="SPREAD" value="0.8" />
                <ChartStat label="VOLUME" value="124.6K" />
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="grid overflow-hidden rounded-[14px] border border-sky-300/45 bg-[#06335C]/92 sm:grid-cols-2 xl:grid-cols-4">
          <BigStat icon={<Radar />} value="5" text="Skanerów dostępnych" />
          <BigStat icon={<TrendingUp />} value="10+" text="Rynków obsługiwanych" />
          <BigStat icon={<Zap />} value="24/7" text="Dostęp do platformy" />
          <BigStat icon={<BrainCircuit />} value="AI" text="Narzędzia analityczne" />
        </section>

        {/* 4 MAIN CARDS */}
        <section className="grid items-stretch gap-2.5 py-3 md:grid-cols-2 xl:grid-cols-4">
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
        <section className="grid overflow-hidden rounded-[14px] border border-sky-300/45 bg-[#06335C]/92 sm:grid-cols-2 xl:grid-cols-4">
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

        <footer className="flex flex-col items-center justify-between gap-4 py-4 text-[8px] text-slate-500 sm:flex-row">
          <span>© 2026 FX Trade Professional Trading.</span>
          <div className="flex gap-5">
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
      <div className="text-[10px] font-bold text-white">{title}</div>
      <div className="mt-1 text-[8px] leading-4 text-slate-400">{text}</div>
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
    <div className="flex items-center justify-center gap-4 border-b border-sky-200/22 px-4 py-3.5 sm:border-r xl:border-b-0">
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
      className="group flex h-[350px] flex-col rounded-[14px] border border-sky-400/38 bg-gradient-to-b from-[#073A6A] to-[#042845] p-3 transition duration-300 hover:border-sky-400/38"
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

      <div className="relative mt-3 h-[198px] w-full overflow-hidden rounded-lg border border-sky-200/25 bg-[#032138] p-2">
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
    <div className="flex items-center gap-4 border-b border-sky-200/22 px-4 py-3.5 sm:border-r xl:border-b-0">
      <div className="shrink-0 text-blue-500 [&_svg]:h-7 [&_svg]:w-7">{icon}</div>
      <div>
        <div className="text-[11px] font-bold">{title}</div>
        <div className="mt-1 text-[8px] leading-4 text-slate-400">{text}</div>
      </div>
    </div>
  );
}

