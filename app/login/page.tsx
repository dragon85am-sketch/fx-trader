"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  TrendingUp,
  UserRound,
} from "lucide-react";

type LoginResponse = {
  error?: string;
  details?: string;
  message?: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
};

export default function LoginPage() {
  const [email, setEmail] = useState("admin@test.com");
  const [password, setPassword] = useState("tajne123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      let data: LoginResponse | null = null;

      try {
        data = (await res.json()) as LoginResponse;
      } catch {
        data = null;
      }

      if (!res.ok) {
        setError(
          data?.details ||
            data?.error ||
            `Błąd logowania (${res.status})`
        );
        return;
      }

      window.location.replace("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Problem z połączeniem z serwerem"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#031225] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "linear-gradient(rgba(2,8,23,.34), rgba(2,8,23,.58)), url('/login-bg.png')",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(circle_at_50%_18%,rgba(34,211,238,.10),transparent_42%)]"
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-[760px] rounded-[34px] border border-cyan-400/45 bg-[linear-gradient(145deg,rgba(5,28,59,.88),rgba(2,16,35,.92))] p-5 shadow-[0_0_60px_rgba(37,99,235,.20)] backdrop-blur-xl sm:p-8 md:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto flex justify-center">
              <img
                src="/fx-trade-professional-trading.png"
                alt="FX Trade Professional Trading"
                className="h-auto w-full max-w-[520px] object-contain drop-shadow-[0_0_30px_rgba(37,99,235,.35)]"
              />
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
                <Mail className="h-4 w-4 text-sky-400" />
                Email
              </label>

              <div className="relative">
                <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-400" />

                <input
                  type="email"
                  autoComplete="email"
                  className="w-full rounded-2xl border border-sky-500/45 bg-[#06172f]/85 px-12 py-4 text-[16px] text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
                  placeholder="email@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-200">
                  <LockKeyhole className="h-4 w-4 text-sky-400" />
                  Hasło
                </label>

                <Link
                  href="/forgot-password"
                  className="text-[13px] font-semibold text-cyan-300 transition hover:text-cyan-200"
                >
                  Nie pamiętasz hasła?
                </Link>
              </div>

              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-400" />

                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="w-full rounded-2xl border border-sky-500/45 bg-[#06172f]/85 px-12 py-4 pr-14 text-[16px] text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-sky-300"
                  aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-cyan-300/25 bg-[linear-gradient(90deg,#0ea5e9,#2563eb_55%,#1d4ed8)] py-4 text-[17px] font-bold text-white shadow-[0_10px_35px_rgba(37,99,235,.30)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <TrendingUp className="h-5 w-5" />
              {loading ? "Logowanie..." : "Zaloguj się"}
            </button>

            <div className="flex items-center gap-4 py-1">
              <div className="h-px flex-1 bg-white/10" />

              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                lub zaloguj się
              </span>

              <div className="h-px flex-1 bg-white/10" />
            </div>

            <button
              type="button"
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-sky-500/35 bg-[#06172f]/65 py-4 text-[15px] font-semibold text-white transition hover:border-sky-400/60 hover:bg-[#0a2344]"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[15px] font-black text-blue-600">
                G
              </span>
              Zaloguj się przez Google
            </button>

            <div className="flex items-start gap-3 rounded-2xl border border-blue-500/20 bg-[#071a34]/80 px-4 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10">
                <ShieldCheck className="h-5 w-5 text-blue-400" />
              </div>

              <div>
                <div className="text-sm font-medium text-slate-200">
                  Bezpieczne logowanie
                </div>

                <div className="mt-1 text-sm text-slate-400">
                  Twoje konto i sesja są chronione.
                </div>
              </div>
            </div>

            <div className="pt-1 text-center">
              <Link
                href="/"
                className="inline-flex min-w-[220px] items-center justify-center gap-2 rounded-2xl border border-blue-500/40 bg-[#06172f]/70 px-6 py-3.5 text-[15px] font-semibold text-sky-300 transition hover:border-sky-400/70 hover:bg-[#0a2344] hover:text-sky-200"
              >
                <ArrowLeft className="h-5 w-5" />
                Wróć
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}