"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  Crown,
  GraduationCap,
  Headphones,
  LineChart,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: GraduationCap,
    title: "Kurs Premium",
    text: "PeÅ‚na edukacja tradingowa krok po kroku",
  },
  {
    icon: BarChart3,
    title: "Dashboard PRO",
    text: "Setupy, sesje, analizy i narzÄ™dzia premium",
  },
  {
    icon: LineChart,
    title: "Trading Journal",
    text: "Statystyki, analiza wynikÃ³w i rozwÃ³j procesu",
  },
  {
    icon: BookOpen,
    title: "Strategie i materiaÅ‚y",
    text: "Checklisty, strategie i materiaÅ‚y edukacyjne",
  },
];

export default function PaywallPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok || !data?.url) {
        setError(data?.error || "Nie udaÅ‚o siÄ™ uruchomiÄ‡ pÅ‚atnoÅ›ci.");
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("CHECKOUT ERROR:", err);
      setError("WystÄ…piÅ‚ bÅ‚Ä…d podczas uruchamiania pÅ‚atnoÅ›ci.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-[calc(100vh-70px)] overflow-hidden bg-[#071526] px-4 py-10 text-white md:px-6">
      {/* BACKGROUND */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(14,165,233,.12),transparent_30%),radial-gradient(circle_at_75%_55%,rgba(37,99,235,.10),transparent_32%)]" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(56,189,248,.16) 1px,transparent 1px),linear-gradient(90deg,rgba(56,189,248,.16) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="absolute left-1/2 top-[120px] h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-blue-500/[0.08] blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[860px] flex-col items-center">
        {/* TITLE */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full border border-sky-400/25 bg-sky-500/[0.07] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.20em] text-sky-300">
            <Crown className="h-4 w-4" />
            FX Trade Premium
          </div>

          <h1 className="text-3xl font-black tracking-[-0.03em] md:text-4xl">
            Odblokuj peÅ‚ny dostÄ™p
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
            Wszystkie narzÄ™dzia, strategie, edukacja i dashboard PRO w jednym miejscu.
          </p>
        </div>

        {/* MAIN CARD */}
        <section className="mt-8 w-full overflow-hidden rounded-[26px] border border-sky-400/25 bg-gradient-to-b from-[#0D3157] to-[#07192E] shadow-[0_28px_90px_rgba(0,0,0,.36)]">
          {/* TOP */}
          <div className="border-b border-white/[0.07] px-5 py-6 md:px-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sky-300">
                  <Sparkles className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-[0.15em]">
                    PeÅ‚ny dostÄ™p do platformy
                  </span>
                </div>

                <div className="mt-3 flex items-end gap-2">
                  <span className="text-5xl font-black tracking-[-0.05em]">
                    99 â‚¬
                  </span>
                  <span className="pb-1.5 text-sm font-semibold text-sky-300">
                    / miesiÄ…c
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  Subskrypcja odnawiana automatycznie co miesiÄ…c.
                </p>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-sky-400/20 bg-[#071A30] px-4 py-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-400/25 bg-sky-500/10 text-sky-300">
                  <ShieldCheck className="h-6 w-6" />
                </div>

                <div>
                  <div className="text-xs font-bold">Bezpieczna pÅ‚atnoÅ›Ä‡</div>
                  <div className="mt-1 text-[10px] text-slate-400">
                    ObsÅ‚ugiwana przez Stripe
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FEATURES */}
          <div className="grid gap-3 p-5 md:grid-cols-2 md:p-8">
            {features.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="flex items-start gap-3 rounded-2xl border border-white/[0.07] bg-[#071A30]/85 p-4 transition hover:border-sky-400/20"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-500/[0.08] text-sky-300">
                  <Icon className="h-5 w-5" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-sm font-bold">{title}</h3>
                  </div>
                  <p className="mt-1 text-[11px] leading-5 text-slate-400">
                    {text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="border-t border-white/[0.07] bg-[#06162A]/75 px-5 py-6 md:px-8">
            {error ? (
              <div className="mb-4 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-center text-xs text-red-200">
                {error}
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleCheckout}
              disabled={loading}
              className="group flex min-h-[60px] w-full items-center justify-center gap-3 rounded-2xl border border-sky-300/20 bg-gradient-to-r from-sky-400 via-blue-500 to-blue-700 px-5 text-[15px] font-black shadow-[0_0_34px_rgba(37,99,235,.34)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Przekierowanie do Stripe...
                </>
              ) : (
                <>
                  <LockKeyhole className="h-5 w-5" />
                  Kup dostÄ™p â€” 99 â‚¬ / mies.
                  <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
                </>
              )}
            </button>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />
                Szyfrowane poÅ‚Ä…czenie
              </span>
              <span className="flex items-center gap-1.5">
                <Headphones className="h-3.5 w-3.5 text-sky-400" />
                Wsparcie 24/7
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                DostÄ™p po zaksiÄ™gowaniu pÅ‚atnoÅ›ci
              </span>
            </div>

            <Link
              href="/"
              className="mx-auto mt-5 flex w-fit items-center gap-2 text-xs font-semibold text-slate-400 transition hover:text-sky-300"
            >
              <ArrowLeft className="h-4 w-4" />
              WrÃ³Ä‡ na stronÄ™ gÅ‚Ã³wnÄ…
            </Link>
          </div>
        </section>

        <p className="mt-5 text-center text-[10px] leading-5 text-slate-500">
          Subskrypcja 99 â‚¬ miesiÄ™cznie. PÅ‚atnoÅ›Ä‡ odnawia siÄ™ automatycznie co miesiÄ…c.
          DostÄ™p do platformy jest aktywny przy aktywnej subskrypcji.
        </p>
      </div>
    </main>
  );
}

