"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Mail,
  Send,
  ShieldCheck,
} from "lucide-react";

type ForgotPasswordResponse = {
  success?: boolean;
  message?: string;
  error?: string;
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      let data: ForgotPasswordResponse = {};

      try {
        data = (await res.json()) as ForgotPasswordResponse;
      } catch {
        data = {};
      }

      if (!res.ok) {
        setError(
          data.error || "Nie udało się wysłać linku resetującego."
        );
        return;
      }

      setSent(true);

      setMessage(
        data.message ||
          "Jeżeli konto z tym adresem istnieje, wysłaliśmy link do resetowania hasła."
      );
    } catch {
      setError("Problem z połączeniem z serwerem.");
    } finally {
      setLoading(false);
    }
  }

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
          <div className="mb-7 text-center">
            <img
              src="/fx-trade-professional-trading.png"
              alt="FX Trade Professional Trading"
              className="mx-auto h-auto w-full max-w-[470px] object-contain drop-shadow-[0_0_30px_rgba(37,99,235,.35)]"
            />

            <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-300/30 bg-sky-500/10 shadow-[0_0_28px_rgba(14,165,233,.16)]">
              <KeyRound className="h-8 w-8 text-cyan-300" />
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight">
              Reset hasła
            </h1>

            <p className="mx-auto mt-3 max-w-[520px] text-sm leading-6 text-slate-400">
              Podaj adres email przypisany do konta. Wyślemy Ci bezpieczny link
              do ustawienia nowego hasła.
            </p>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
                  <Mail className="h-4 w-4 text-sky-400" />
                  Email
                </label>

                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-400" />

                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@domain.com"
                    className="w-full rounded-2xl border border-sky-500/45 bg-[#06172f]/85 px-12 py-4 text-[16px] text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
                    required
                  />
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
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-cyan-300/25 bg-[linear-gradient(90deg,#0ea5e9,#2563eb_55%,#1d4ed8)] py-4 text-[16px] font-bold text-white shadow-[0_10px_35px_rgba(37,99,235,.30)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="h-5 w-5" />

                {loading
                  ? "Wysyłanie..."
                  : "Wyślij link resetujący"}
              </button>
            </form>
          ) : (
            <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.08] p-5">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-500/10">
                  <CheckCircle2 className="h-6 w-6 text-emerald-300" />
                </div>

                <div>
                  <div className="font-bold text-emerald-300">
                    Sprawdź swoją skrzynkę
                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {message}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Link resetujący jest ważny przez 30 minut.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-500/20 bg-[#071a34]/80 px-4 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10">
              <ShieldCheck className="h-5 w-5 text-blue-400" />
            </div>

            <div>
              <div className="text-sm font-medium text-slate-200">
                Bezpieczny reset hasła
              </div>

              <div className="mt-1 text-sm leading-5 text-slate-400">
                Dla bezpieczeństwa nie informujemy, czy podany adres email
                istnieje w systemie.
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex min-w-[220px] items-center justify-center gap-2 rounded-2xl border border-blue-500/40 bg-[#06172f]/70 px-6 py-3.5 text-[15px] font-semibold text-sky-300 transition hover:border-sky-400/70 hover:bg-[#0a2344] hover:text-sky-200"
            >
              <ArrowLeft className="h-5 w-5" />
              Wróć do logowania
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}