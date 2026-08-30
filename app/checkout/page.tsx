"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  Crown,
  GraduationCap,
  Headphones,
  Lock,
  ShieldCheck,
  Users,
  Video,
} from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Skaner Rynku PRO",
    text: "Zaawansowany skaner setupów z sygnałami w czasie rzeczywistym",
  },
  {
    icon: BarChart3,
    title: "Wykresy Premium",
    text: "Profesjonalne wykresy i narzędzia do analizy technicznej",
  },
  {
    icon: GraduationCap,
    title: "Strategie Tradingowe",
    text: "Sprawdzone strategie z zasadami i checklistami",
  },
  {
    icon: Video,
    title: "Trading Room",
    text: "Codzienne analizy, setupy i edukacja na żywo",
  },
  {
    icon: BookOpen,
    title: "Edukacja",
    text: "Kursy, webinary i materiały dla każdego tradera",
  },
  {
    icon: BarChart3,
    title: "Trading Journal",
    text: "Dziennik transakcyjny do analizy i rozwoju",
  },
  {
    icon: Users,
    title: "Społeczność FX TRADE",
    text: "Dołącz do społeczności traderów i rozwijaj się razem z nami",
  },
  {
    icon: Headphones,
    title: "Wsparcie 24/7",
    text: "Pomoc techniczna i merytoryczna zawsze po Twojej stronie",
  },
];

const included = [
  "Skaner Rynku PRO",
  "Wykresy Premium",
  "Wszystkie strategie",
  "Trading Room",
  "Pełna edukacja",
  "Trading Journal",
  "Społeczność FX TRADE",
  "Wsparcie 24/7",
];

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok || !data?.url) {
        alert(data?.error || "Nie udało się uruchomić płatności");
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("CHECKOUT ERROR:", error);
      alert("Błąd podczas uruchamiania płatności");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020b18] text-white">
      {/* ============================================
          BACKGROUND
      ============================================ */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(14,165,233,.12),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(37,99,235,.16),transparent_30%),linear-gradient(180deg,#020817_0%,#06172d_48%,#020817_100%)]" />

        {/* Existing side wallpapers from public/home */}
        <div className="absolute inset-y-0 left-0 hidden w-[28vw] min-w-[330px] xl:block">
          <Image
            src="/home/checkout-left.png"
            alt=""
            fill
            priority
            sizes="28vw"
            className="object-cover object-right opacity-95"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#06172d]" />
        </div>

        <div className="absolute inset-y-0 right-0 hidden w-[28vw] min-w-[330px] xl:block">
          <Image
            src="/home/checkout-right.png"
            alt=""
            fill
            priority
            sizes="28vw"
            className="object-cover object-left opacity-95"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#06172d]" />
        </div>

        <div className="absolute left-1/2 top-[18%] h-[720px] w-[900px] -translate-x-1/2 rounded-full bg-blue-600/[0.08] blur-[150px]" />
      </div>

      {/* ============================================
          NAVBAR
      ============================================ */}
      <header className="relative z-30 border-b border-white/5 bg-[#020817]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-[1240px] items-center justify-between px-5">
          <Link href="/" className="flex flex-col leading-none">
            <span className="text-[25px] font-black italic tracking-[-0.04em]">
              FX <span className="text-sky-400">TRADE</span>
            </span>
            <span className="mt-1 text-[7px] font-bold tracking-[0.28em] text-slate-400">
              PROFESSIONAL TRADING
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-[12px] font-semibold text-slate-300 lg:flex">
            <Link href="/#funkcje" className="hover:text-sky-400">
              Funkcje
            </Link>
            <Link href="/#scanner" className="hover:text-sky-400">
              Skaner Rynku
            </Link>
            <Link href="/#strategie" className="hover:text-sky-400">
              Strategie
            </Link>
            <Link href="/#edukacja" className="hover:text-sky-400">
              Edukacja
            </Link>
            <Link href="/trading-room" className="hover:text-sky-400">
              Trading Room
            </Link>
            <Link href="/cennik" className="hover:text-sky-400">
              Cennik
            </Link>
            <Link href="/#onas" className="hover:text-sky-400">
              O nas
            </Link>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="hidden rounded-lg border border-sky-400/25 bg-[#071628] px-4 py-2.5 text-[11px] font-semibold text-slate-200 transition hover:border-sky-400/45 sm:block"
            >
              Zaloguj się
            </Link>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={loading}
              className="rounded-lg bg-gradient-to-r from-sky-500 via-blue-600 to-blue-700 px-4 py-2.5 text-[11px] font-bold shadow-[0_0_26px_rgba(37,99,235,.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Przekierowanie..." : "Kup dostęp do platformy"}
            </button>
          </div>
        </div>
      </header>

      {/* ============================================
          CONTENT
      ============================================ */}
      <section className="relative z-10 mx-auto max-w-[1040px] px-5 py-10">
        <div className="text-center">
          <h1 className="text-[34px] font-black tracking-[-0.03em] sm:text-[46px]">
            Odbierz pełny dostęp do{" "}
            <span className="bg-gradient-to-r from-sky-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">
              FX TRADE
            </span>
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Profesjonalne narzędzia dla wymagających traderów
          </p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {/* ========================================
              LEFT - ACCESS
          ======================================== */}
          <section className="rounded-[22px] border border-sky-400/30 bg-gradient-to-b from-[#0A315A]/95 to-[#04162A]/95 p-5 shadow-[0_25px_70px_rgba(0,0,0,.28)] backdrop-blur-md">
            <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-sky-400/35 bg-sky-500/[0.08] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-sky-300">
              <Crown className="h-4 w-4" />
              Dostęp Premium
            </div>

            <div className="mt-5 text-center">
              <h2 className="text-[24px] font-black">
                Pełny dostęp do platformy
              </h2>
            </div>

            <div className="mt-6 space-y-2.5">
              {features.map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="flex items-center gap-3 rounded-xl border border-sky-400/15 bg-[#092849]/80 p-3"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sky-400/30 bg-sky-500/[0.07] text-sky-400">
                    <Icon className="h-5 w-5" />
                  </div>

                  <div>
                    <div className="text-sm font-bold">{title}</div>
                    <div className="mt-0.5 text-[10px] leading-4 text-slate-400">
                      {text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ========================================
              RIGHT - SUBSCRIPTION
          ======================================== */}
          <section className="rounded-[22px] border border-sky-400/30 bg-gradient-to-b from-[#0A315A]/95 to-[#04162A]/95 p-5 shadow-[0_25px_70px_rgba(0,0,0,.28)] backdrop-blur-md">
            <div>
              <h2 className="text-[20px] font-black">
                Płatność za dostęp do platformy
              </h2>
              <p className="mt-1 text-[11px] text-slate-300">
                Subskrypcja miesięczna – pełny dostęp do FX TRADE
              </p>
            </div>

            <div className="mt-5 rounded-2xl border border-sky-400/40 bg-[#0B2B4D] p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-sky-400/35 bg-sky-500/10 text-sky-300 shadow-[0_0_22px_rgba(56,189,248,.18)]">
                    <Crown className="h-6 w-6" />
                  </div>

                  <div>
                    <div className="text-sm font-bold">FX TRADE PREMIUM</div>
                    <div className="text-[10px] text-slate-400">
                      Pełny dostęp do platformy
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[32px] font-black">99 €</div>
                  <div className="text-[12px] font-bold text-sky-400">
                    / miesiąc
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2">
              {included.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 text-[11px] text-slate-200"
                >
                  <Check className="h-4 w-4 shrink-0 text-sky-400" />
                  {item}
                </div>
              ))}
            </div>

            <div className="my-6 h-px bg-white/[0.07]" />

            <button
              type="button"
              onClick={handleCheckout}
              disabled={loading}
              className="group flex h-[64px] w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-sky-400 via-blue-500 to-blue-700 px-5 text-center text-[15px] font-black shadow-[0_0_34px_rgba(37,99,235,.34)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Lock className="h-5 w-5" />
              <span>
                {loading ? "PRZEKIEROWANIE DO STRIPE..." : "KUP DOSTĘP DO PLATFORMY"}
                {!loading ? (
                  <span className="block text-[13px]">
                    99 € / MIES.
                  </span>
                ) : null}
              </span>
              {!loading ? (
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              ) : null}
            </button>

            <div className="mt-4 flex items-start gap-3 rounded-xl border border-sky-400/15 bg-[#092849]/70 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" />
              <div>
                <div className="text-[11px] font-bold text-white">
                  Bezpieczna płatność obsługiwana przez Stripe
                </div>
                <div className="mt-1 text-[10px] leading-4 text-slate-400">
                  Twoje dane są chronione i szyfrowane.
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-start gap-3 rounded-xl border border-sky-400/15 bg-[#092849]/70 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" />
              <div>
                <div className="text-[11px] font-bold text-white">
                  Aktywacja po płatności
                </div>
                <div className="mt-1 text-[10px] leading-4 text-slate-400">
                  Po zaksięgowaniu płatności otrzymujesz dostęp do funkcji platformy.
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ============================================
            BENEFITS
        ============================================ */}
        <div className="mt-6 grid overflow-hidden rounded-[18px] border border-sky-400/20 bg-[#071b33]/80 sm:grid-cols-3">
          <InfoBox
            icon={<Lock className="h-7 w-7" />}
            title="Bezpieczna płatność"
            text="Szyfrowane połączenie SSL i ochrona Twoich danych."
          />
          <InfoBox
            icon={<Headphones className="h-7 w-7" />}
            title="Wsparcie 24/7"
            text="Nasz zespół jest dostępny przez cały tydzień."
          />
          <InfoBox
            icon={<Users className="h-7 w-7" />}
            title="Społeczność FX TRADE"
            text="Rozwijaj swoje umiejętności razem z innymi traderami."
          />
        </div>

        <div className="mt-6 text-center text-[11px] leading-5 text-slate-400">
          Subskrypcja 99 € miesięcznie. Płatność odnawia się automatycznie co miesiąc.
          <br />
          Anulowanie subskrypcji odbywa się zgodnie z warunkami płatności i ustawieniami konta.
        </div>
      </section>
    </main>
  );
}

function InfoBox({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-4 border-b border-white/[0.06] px-5 py-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <div className="shrink-0 text-blue-400">{icon}</div>
      <div>
        <div className="text-[12px] font-bold">{title}</div>
        <div className="mt-1 text-[10px] leading-4 text-slate-400">
          {text}
        </div>
      </div>
    </div>
  );
}

