"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  Radio,
  ShieldCheck,
  Target,
  UserRound,
  Users,
} from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const passwordRules = useMemo(
    () => ({
      length: password.length >= 8,
      number: /\d/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    }),
    [password]
  );

  const passwordValid =
    passwordRules.length && passwordRules.number && passwordRules.special;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");

    if (!name.trim()) {
      setMsg("Wpisz swoje imię.");
      return;
    }

    if (!passwordValid) {
      setMsg("Hasło musi mieć minimum 8 znaków, cyfrę i znak specjalny.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          password,
        }),
      });

      let data: any = null;

      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        setMsg(data?.error || "Błąd rejestracji");
        return;
      }

      // Konto zostało utworzone.
      // Przechodzimy do checkoutu zamiast wpuszczać użytkownika do dashboardu.
      // /api/stripe/checkout wymaga aktywnej sesji przez requireAuth(),
      // więc endpoint /api/register powinien po rejestracji ustawić cookie "token".
      setMsg("Konto utworzone. Przekierowanie do płatności...");

      window.location.href = "/checkout";
    } catch {
      setMsg("Błąd serwera");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_50%_-10%,#1679b8_0%,#0b548d_25%,#06345f_52%,#031a34_100%)] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "linear-gradient(rgba(2,8,23,.34), rgba(2,8,23,.58)), url('/register-bg.png')",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(circle_at_50%_18%,rgba(34,211,238,.10),transparent_42%)]"
      />

      <div className="relative z-10 mx-auto w-full max-w-[1780px] px-4 py-6 md:px-6 xl:px-8">
        {/* BRAND */}
        <div className="mb-6 flex items-center justify-center xl:justify-start">
          <div>
            <div className="flex items-end gap-3">
              <div className="text-[56px] font-black leading-none tracking-[-0.08em]">
                <span className="text-white">F</span>
                <span className="bg-gradient-to-br from-cyan-300 via-blue-500 to-blue-700 bg-clip-text text-transparent">
                  X
                </span>
              </div>
              <div className="pb-1 text-[34px] font-black tracking-[0.08em]">
                TRADE
              </div>
            </div>
            <div className="mt-1 text-[12px] font-semibold uppercase tracking-[0.30em]">
              <span className="text-sky-400">Premium</span>{" "}
              <span className="text-slate-300">Education</span>
            </div>
          </div>
        </div>

        {/* MAIN */}
        <section className="grid min-h-[760px] overflow-hidden rounded-[30px] border border-sky-300/30 bg-[linear-gradient(145deg,rgba(10,70,128,.88),rgba(4,37,75,.92))] shadow-[0_30px_100px_rgba(0,0,0,.28),0_0_55px_rgba(14,165,233,.12),inset_0_1px_0_rgba(255,255,255,.06)] xl:grid-cols-[1.05fr_.95fr]">
          {/* LEFT */}
          <div className="relative overflow-hidden border-b border-sky-500/15 p-7 md:p-10 xl:border-b-0 xl:border-r xl:p-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_48%,rgba(56,189,248,.18),transparent_38%),linear-gradient(145deg,rgba(14,165,233,.055),transparent_55%)]" />

            <div className="relative z-10 flex h-full flex-col">
              <div className="grid items-center gap-8 xl:grid-cols-[0.9fr_1.1fr]">
                {/* LEFT COPY */}
                <div>
                  <h1 className="whitespace-nowrap text-3xl font-black leading-tight md:text-4xl xl:text-[46px]">
                    Dołącz do
                    <br />
                    <span className="bg-gradient-to-r from-sky-300 via-blue-500 to-blue-600 bg-clip-text text-transparent">
                      FX TRADE
                    </span>
                  </h1>

                  <div className="mt-5 h-[3px] w-16 bg-sky-500" />

                  <p className="mt-6 max-w-xl text-base leading-7 text-slate-300/80 md:text-lg">
                    Platforma edukacyjna dla traderów, którzy chcą działać świadomie
                    i rozwijać swój proces krok po kroku.
                  </p>

                  <div className="mt-8 space-y-4">
                    <Feature
                      icon={GraduationCap}
                      title="Kompletna edukacja"
                      text="Kursy od podstaw do zaawansowanych zagadnień tradingowych."
                    />
                    <Feature
                      icon={BarChart3}
                      title="Narzędzia analityczne"
                      text="Skanery rynku, wskaźniki i dashboard analityczny."
                    />
                    <Feature
                      icon={Target}
                      title="Strategie rynkowe"
                      text="7 sprawdzonych strategii z zasadami i checklistami."
                    />
                    <Feature
                      icon={Radio}
                      title="Live sesje codziennie"
                      text="Scalping na żywo, analiza rynku oraz Q&A."
                    />
                  </div>
                </div>

                {/* BULL BESIDE COPY */}
                <div className="relative min-h-[560px] overflow-hidden rounded-[26px]">
                  <img
                    src="/images/register/fx-bull.png"
                    alt="FX Trade - niebieski byk tradingowy"
                    className="absolute inset-0 h-full w-full object-cover object-[58%_56%]"
                  />

                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(2,8,18,.18),rgba(2,8,18,.02)_28%,rgba(2,8,18,.04))]" />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,8,18,.02),rgba(2,8,18,.14))]" />
                </div>
              </div>

              <div className="mt-7 flex items-center gap-3 rounded-2xl border border-sky-300/35 bg-[linear-gradient(145deg,rgba(8,65,119,.92),rgba(4,36,73,.95))] p-4 shadow-[0_12px_35px_rgba(0,0,0,.20),0_0_24px_rgba(56,189,248,.09),inset_0_1px_0_rgba(255,255,255,.05)] backdrop-blur-md">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-sky-400/30 bg-sky-500/10">
                  <ShieldCheck className="h-6 w-6 text-sky-300" />
                </div>
                <div>
                  <div className="text-sm font-black text-sky-300">
                    Bezpieczne i profesjonalne środowisko
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Twoje dane są chronione. Skup się na nauce i rozwoju.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center justify-center p-6 md:p-10 xl:p-12">
            <div className="w-full max-w-[700px] rounded-[28px] border border-cyan-300/40 bg-[radial-gradient(circle_at_top,rgba(14,165,233,.12),transparent_34%),linear-gradient(145deg,#0a477f,#052c57_58%,#041f40)] p-6 shadow-[0_24px_70px_rgba(0,0,0,.24),0_0_55px_rgba(14,165,233,.18),inset_0_1px_0_rgba(255,255,255,.07)] md:p-10">
              <div className="text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-blue-500/35 bg-blue-500/10 shadow-[0_0_30px_rgba(37,99,235,.20)]">
                  <UserRound className="h-9 w-9 text-blue-400" />
                </div>

                <h2 className="mt-6 text-4xl font-black">Rejestracja</h2>
                <p className="mx-auto mt-3 max-w-lg text-base leading-7 text-slate-400">
                  Utwórz konto i zyskaj dostęp do platformy{" "}
                  <span className="font-semibold text-sky-400">
                    FX Trade Premium.
                  </span>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-9 space-y-6">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-300">
                    <UserRound className="h-4 w-4 text-sky-400" />
                    Imię
                  </label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Imię"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-2xl border border-sky-300/25 bg-[#06294f]/90 px-14 py-4 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-sky-500/70 focus:ring-2 focus:ring-sky-500/10"
                      required
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Wpisz swoje imię</p>
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-300">
                    <Mail className="h-4 w-4 text-sky-400" />
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-2xl border border-sky-300/25 bg-[#06294f]/90 px-14 py-4 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-sky-500/70 focus:ring-2 focus:ring-sky-500/10"
                      required
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Wpisz swój adres email</p>
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-300">
                    <LockKeyhole className="h-4 w-4 text-sky-400" />
                    Hasło
                  </label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Hasło"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-2xl border border-sky-300/25 bg-[#06294f]/90 px-14 py-4 pr-16 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-sky-500/70 focus:ring-2 focus:ring-sky-500/10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-sky-300"
                      aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
                    >
                      {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    Minimum 8 znaków, w tym cyfra i znak specjalny
                  </p>

                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <PasswordRule ok={passwordRules.length}>Minimum 8 znaków</PasswordRule>
                    <PasswordRule ok={passwordRules.number}>Jedna cyfra</PasswordRule>
                    <PasswordRule ok={passwordRules.special}>Znak specjalny</PasswordRule>
                  </div>
                </div>

                {msg ? (
                  <div
                    className={`rounded-2xl border px-4 py-3 text-sm ${
                      msg.toLowerCase().includes("sukces")
                        ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                        : "border-rose-400/20 bg-rose-500/10 text-rose-200"
                    }`}
                  >
                    {msg}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-blue-400/20 bg-gradient-to-r from-sky-500 via-blue-600 to-blue-700 px-5 py-4 text-lg font-black shadow-[0_12px_38px_rgba(37,99,235,.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Tworzenie konta..." : "Załóż konto"}
                  {!loading ? <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" /> : null}
                </button>

                <div className="pt-2 text-center text-base text-slate-400">
                  Masz już konto?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-sky-400 underline-offset-4 hover:underline"
                  >
                    Zaloguj się
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* DISCLAIMER */}
        <section className="mt-4 rounded-2xl border border-sky-300/30 bg-[linear-gradient(145deg,#094779,#052d56)] p-5 shadow-[0_14px_38px_rgba(0,0,0,.18),0_0_28px_rgba(14,165,233,.08),inset_0_1px_0_rgba(255,255,255,.05)] md:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
            <div className="flex flex-1 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-blue-500/25 bg-blue-500/10">
                <ShieldCheck className="h-6 w-6 text-blue-400" />
              </div>
              <p className="max-w-5xl text-xs leading-6 text-slate-400">
                Dostęp do Platformy Edukacyjnej FX Trade Premium obejmuje kurs tradingu,
                strategie rynkowe, dashboard analityczny oraz narzędzia wspierające proces
                decyzyjny. Produkt ma charakter wyłącznie edukacyjny i informacyjny.
                Nie stanowi porady inwestycyjnej ani rekomendacji finansowej.
                Wyniki zależą od indywidualnych decyzji użytkownika.
              </p>
            </div>

            <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MiniBenefit icon={ShieldCheck} title="Bezpieczeństwo" text="Twoje dane są chronione" />
              <MiniBenefit icon={BookOpen} title="Edukacja" text="Na każdym poziomie" />
              <MiniBenefit icon={BarChart3} title="Narzędzia" text="Dla świadomego tradera" />
              <MiniBenefit icon={Users} title="Społeczność" text="Wsparcie i rozwój" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Feature({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ElementType;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
        <Icon className="h-6 w-6 text-sky-400" />
      </div>
      <div>
        <div className="text-base font-black text-sky-400">{title}</div>
        <div className="mt-1 text-sm leading-5 text-slate-400">{text}</div>
      </div>
    </div>
  );
}

function PasswordRule({
  ok,
  children,
}: {
  ok: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${
        ok
          ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
          : "border-white/5 bg-white/[0.02] text-slate-400"
      }`}
    >
      <Check className="h-3.5 w-3.5" />
      {children}
    </div>
  );
}

function MiniBenefit({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ElementType;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-sky-300/20 bg-[linear-gradient(145deg,#073762,#05284b)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,.04)]">
      <Icon className="h-5 w-5 text-blue-400" />
      <div className="mt-3 text-sm font-black">{title}</div>
      <div className="mt-1 text-xs text-slate-500">{text}</div>
    </div>
  );
}

