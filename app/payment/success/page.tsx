"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from "lucide-react";

type Status = "checking" | "active" | "timeout";

const MAX_ATTEMPTS = 30;
const CHECK_INTERVAL = 2000;

export default function PaymentSuccessPage() {
  const [status, setStatus] = useState<Status>("checking");
  const [attempt, setAttempt] = useState(0);

  const cancelledRef = useRef(false);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const checkAccess = useCallback(async () => {
    cancelledRef.current = false;
    setStatus("checking");
    setAttempt(0);

    for (let i = 1; i <= MAX_ATTEMPTS; i++) {
      if (cancelledRef.current) return;

      setAttempt(i);

      try {
        const res = await fetch(`/api/account/access?t=${Date.now()}`, {
          method: "GET",
          cache: "no-store",
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (res.status === 401) {
          window.location.replace("/login");
          return;
        }

        if (res.ok) {
          const data = await res.json();

          if (cancelledRef.current) return;

          if (data?.isPremium === true) {
            setStatus("active");

            redirectTimerRef.current = setTimeout(() => {
              window.location.replace("/dashboard");
            }, 1000);

            return;
          }
        }
      } catch (error) {
        console.error("PAYMENT ACCESS CHECK ERROR:", error);
      }

      if (i < MAX_ATTEMPTS) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, CHECK_INTERVAL);
        });
      }
    }

    if (!cancelledRef.current) {
      setStatus("timeout");
    }
  }, []);

  useEffect(() => {
    checkAccess();

    return () => {
      cancelledRef.current = true;

      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, [checkAccess]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#071526] px-6 text-white">
      <div className="w-full max-w-xl rounded-3xl border border-sky-400/20 bg-[#0B2B4D] p-8 text-center shadow-[0_30px_90px_rgba(0,0,0,.35)]">
        {status === "checking" && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-sky-400" />

            <h1 className="mt-5 text-2xl font-black">
              Płatność przyjęta
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-300">
              Potwierdzamy płatność i aktywujemy Twoje konto Premium.
            </p>

            <div className="mt-6 rounded-2xl border border-sky-400/10 bg-black/10 px-4 py-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Aktywacja konta
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-600 transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      (attempt / MAX_ATTEMPTS) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>

              <p className="mt-3 text-xs text-slate-400">
                Może to potrwać kilka sekund.
              </p>
            </div>
          </>
        )}

        {status === "active" && (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />

            <h1 className="mt-5 text-2xl font-black">
              Dostęp Premium aktywowany
            </h1>

            <p className="mt-2 text-sm text-slate-300">
              Wszystko gotowe. Przekierowujemy Cię do dashboardu...
            </p>
          </>
        )}

        {status === "timeout" && (
          <>
            <AlertCircle className="mx-auto h-12 w-12 text-amber-400" />

            <h1 className="mt-5 text-2xl font-black">
              Aktywacja trwa dłużej
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-300">
              Płatność została przyjęta, ale nadal czekamy na
              potwierdzenie aktywacji konta Premium.
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Nie wykonuj ponownie płatności. Spróbuj ponownie
              sprawdzić dostęp.
            </p>

            <button
              type="button"
              onClick={checkAccess}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-3 font-bold transition hover:brightness-110"
            >
              <RefreshCw className="h-4 w-4" />
              Sprawdź ponownie
            </button>
          </>
        )}
      </div>
    </main>
  );
}