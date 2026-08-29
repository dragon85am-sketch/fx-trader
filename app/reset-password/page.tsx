"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

type ResetPasswordResponse = {
  success?: boolean;
  message?: string;
  error?: string;
};

function ResetPasswordContent() {
  const searchParams = useSearchParams();

  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const passwordRules = useMemo(
    () => ({
      length: password.length >= 8,
      number: /\d/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
      match:
        password.length > 0 &&
        confirmPassword.length > 0 &&
        password === confirmPassword,
    }),
    [password, confirmPassword]
  );

  const passwordValid =
    passwordRules.length &&
    passwordRules.number &&
    passwordRules.special &&
    passwordRules.match;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!token) {
      setError("Brak tokenu resetowania hasÅ‚a.");
      return;
    }

    if (!passwordValid) {
      setError("SprawdÅº wymagania dotyczÄ…ce nowego hasÅ‚a.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const data = (await res.json()) as ResetPasswordResponse;

      if (!res.ok) {
        setError(data.error || "Nie udaÅ‚o siÄ™ zmieniÄ‡ hasÅ‚a.");
        return;
      }

      setSuccess(true);
      setMessage(
        data.message ||
          "HasÅ‚o zostaÅ‚o zmienione. MoÅ¼esz siÄ™ teraz zalogowaÄ‡."
      );
    } catch {
      setError("Problem z poÅ‚Ä…czeniem z serwerem.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <ResetShell>
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-400/30 bg-rose-500/10">
            <KeyRound className="h-8 w-8 text-rose-300" />
          </div>

          <h1 className="mt-5 text-3xl font-black">
            NieprawidÅ‚owy link
          </h1>

          <p className="mx-auto mt-3 max-w-[500px] text-sm leading-6 text-slate-400">
            W adresie brakuje tokenu resetowania hasÅ‚a. PoproÅ› o nowy link.
          </p>

          <Link
            href="/forgot-password"
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/30 bg-[linear-gradient(90deg,#0ea5e9,#2563eb)] px-6 py-3.5 font-bold text-white"
          >
            WyÅ›lij nowy link
          </Link>
        </div>
      </ResetShell>
    );
  }

  return (
    <ResetShell>
      {!success ? (
        <>
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-300/30 bg-sky-500/10 shadow-[0_0_28px_rgba(14,165,233,.16)]">
              <KeyRound className="h-8 w-8 text-cyan-300" />
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight">
              Ustaw nowe hasÅ‚o
            </h1>

            <p className="mx-auto mt-3 max-w-[520px] text-sm leading-6 text-slate-400">
              Wpisz nowe hasÅ‚o do swojego konta FX Trade.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
                <LockKeyhole className="h-4 w-4 text-sky-400" />
                Nowe hasÅ‚o
              </label>

              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-400" />

                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  className="w-full rounded-2xl border border-sky-500/45 bg-[#06172f]/85 px-12 py-4 pr-14 text-[16px] text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-sky-300"
                  aria-label={showPassword ? "Ukryj hasÅ‚o" : "PokaÅ¼ hasÅ‚o"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
                <LockKeyhole className="h-4 w-4 text-sky-400" />
                PowtÃ³rz hasÅ‚o
              </label>

              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-400" />

                <input
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  className="w-full rounded-2xl border border-sky-500/45 bg-[#06172f]/85 px-12 py-4 pr-14 text-[16px] text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-sky-300"
                  aria-label={
                    showConfirmPassword ? "Ukryj hasÅ‚o" : "PokaÅ¼ hasÅ‚o"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <PasswordRule ok={passwordRules.length}>
                Minimum 8 znakÃ³w
              </PasswordRule>

              <PasswordRule ok={passwordRules.number}>
                Minimum jedna cyfra
              </PasswordRule>

              <PasswordRule ok={passwordRules.special}>
                Minimum jeden znak specjalny
              </PasswordRule>

              <PasswordRule ok={passwordRules.match}>
                HasÅ‚a sÄ… identyczne
              </PasswordRule>
            </div>

            {error ? (
              <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading || !passwordValid}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-cyan-300/25 bg-[linear-gradient(90deg,#0ea5e9,#2563eb_55%,#1d4ed8)] py-4 text-[16px] font-bold text-white shadow-[0_10px_35px_rgba(37,99,235,.30)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShieldCheck className="h-5 w-5" />
              {loading ? "Zapisywanie..." : "ZmieÅ„ hasÅ‚o"}
            </button>
          </form>
        </>
      ) : (
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/10 shadow-[0_0_28px_rgba(16,185,129,.15)]">
            <CheckCircle2 className="h-8 w-8 text-emerald-300" />
          </div>

          <h1 className="mt-5 text-3xl font-black">
            HasÅ‚o zmienione
          </h1>

          <p className="mx-auto mt-3 max-w-[520px] text-sm leading-6 text-slate-300">
            {message}
          </p>

          <Link
            href="/login"
            className="mt-7 inline-flex min-w-[220px] items-center justify-center gap-2 rounded-2xl border border-cyan-300/25 bg-[linear-gradient(90deg,#0ea5e9,#2563eb_55%,#1d4ed8)] px-6 py-3.5 font-bold text-white shadow-[0_10px_35px_rgba(37,99,235,.30)] transition hover:brightness-110"
          >
            PrzejdÅº do logowania
          </Link>
        </div>
      )}

      {!success ? (
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-sky-300 transition hover:text-cyan-200"
          >
            <ArrowLeft className="h-4 w-4" />
            WrÃ³Ä‡ do logowania
          </Link>
        </div>
      ) : null}
    </ResetShell>
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
      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs ${
        ok
          ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
          : "border-white/10 bg-white/[0.03] text-slate-400"
      }`}
    >
      <Check className="h-4 w-4" />
      {children}
    </div>
  );
}

function ResetShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#031225] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(30,136,229,.18),transparent_34%),radial-gradient(circle_at_14%_68%,rgba(37,99,235,.12),transparent_28%),radial-gradient(circle_at_86%_50%,rgba(14,165,233,.12),transparent_30%)]" />

        <div
          className="absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(56,189,248,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,.18) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-[700px] rounded-[34px] border border-cyan-400/45 bg-[linear-gradient(145deg,rgba(5,28,59,.96),rgba(2,16,35,.98))] p-6 shadow-[0_0_60px_rgba(37,99,235,.20)] backdrop-blur-xl sm:p-8 md:p-10">
          <img
            src="/fx-trade-professional-trading.png"
            alt="FX Trade Professional Trading"
            className="mx-auto mb-7 h-auto w-full max-w-[460px] object-contain drop-shadow-[0_0_30px_rgba(37,99,235,.35)]"
          />

          {children}
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <ResetShell>
          <div className="py-10 text-center text-slate-300">
            Åadowanie...
          </div>
        </ResetShell>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

