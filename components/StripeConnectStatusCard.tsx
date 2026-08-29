"use client";

import { useEffect, useState } from "react";
import ConnectStripeButton from "@/components/ConnectStripeButton";

type ConnectStatus = {
  connected: boolean;
  onboardingComplete?: boolean;
  payoutsEnabled?: boolean;
  stripeAccountId?: string | null;
  requirements?: string[];
};

export default function StripeConnectStatusCard() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ConnectStatus | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch("/api/stripe/connect/status", {
          cache: "no-store",
        });

        const data = await res.json();
        setStatus(data);
      } catch (error) {
        console.error("StripeConnectStatusCard error:", error);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0b162d] p-5 text-white/70">
        Ładowanie statusu Stripe...
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b162d] p-5">
      <div className="mb-2 text-lg font-semibold text-white">
        Stripe Connect
      </div>

      <div className="space-y-2 text-sm text-white/75">
        <div>
          <b>Połączono:</b> {status?.connected ? "Tak" : "Nie"}
        </div>
        <div>
          <b>Onboarding:</b>{" "}
          {status?.onboardingComplete ? "Ukończony" : "Nieukończony"}
        </div>
        <div>
          <b>Payouts enabled:</b> {status?.payoutsEnabled ? "Tak" : "Nie"}
        </div>
        {status?.stripeAccountId ? (
          <div className="break-all">
            <b>Stripe account:</b> {status.stripeAccountId}
          </div>
        ) : null}
      </div>

      {!!status?.requirements?.length && (
        <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-sm text-amber-200">
          <div className="mb-2 font-semibold">
            Stripe nadal wymaga uzupełnienia:
          </div>
          <ul className="list-disc pl-5">
            {status.requirements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {(!status?.connected || !status?.onboardingComplete || !status?.payoutsEnabled) && (
        <div className="mt-4">
          <ConnectStripeButton />
        </div>
      )}

      {status?.connected &&
        status?.onboardingComplete &&
        status?.payoutsEnabled && (
          <div className="mt-4 text-sm text-emerald-400">
            ✅ Konto Stripe gotowe do wypłat
          </div>
        )}
    </div>
  );
}