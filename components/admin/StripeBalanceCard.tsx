"use client";

import { useEffect, useMemo, useState } from "react";

type BalanceItem = {
  amount: number;
  currency: string;
};

type BalanceResponse = {
  ok?: boolean;
  available?: BalanceItem[];
  pending?: BalanceItem[];
  error?: string;
};

function formatMoney(amountInMinor: number, currency: string) {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountInMinor / 100);
}

export default function StripeBalanceCard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BalanceResponse | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch("/api/stripe/balance", {
          cache: "no-store",
        });

        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("StripeBalanceCard error:", error);
        setData({ error: "Nie udało się pobrać salda Stripe" });
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const totalAvailable = useMemo(() => {
    return (data?.available ?? []).reduce((sum, item) => sum + item.amount, 0);
  }, [data]);

  const totalPending = useMemo(() => {
    return (data?.pending ?? []).reduce((sum, item) => sum + item.amount, 0);
  }, [data]);

  const primaryCurrency =
    data?.available?.[0]?.currency ||
    data?.pending?.[0]?.currency ||
    "eur";

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0b162d] p-5 text-sm text-white/70">
        Ładowanie salda Stripe...
      </div>
    );
  }

  if (data?.error) {
    return (
      <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-5 text-sm text-red-300">
        {data.error}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b162d] p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Saldo Stripe</h2>
          <p className="mt-1 text-sm text-white/60">
            Stan środków platformy potrzebnych do wypłat.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
          <div className="text-xs uppercase tracking-wide text-emerald-300/80">
            Dostępne
          </div>
          <div className="mt-2 text-2xl font-semibold text-emerald-300">
            {formatMoney(totalAvailable, primaryCurrency)}
          </div>
        </div>

        <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4">
          <div className="text-xs uppercase tracking-wide text-amber-300/80">
            Oczekujące
          </div>
          <div className="mt-2 text-2xl font-semibold text-amber-300">
            {formatMoney(totalPending, primaryCurrency)}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-2 text-sm font-medium text-white">Available</div>
          <div className="space-y-2">
            {(data?.available ?? []).length === 0 ? (
              <div className="text-sm text-white/50">Brak dostępnych środków</div>
            ) : (
              data!.available!.map((item) => (
                <div
                  key={`available-${item.currency}`}
                  className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-sm"
                >
                  <span className="text-white/70">{item.currency.toUpperCase()}</span>
                  <span className="font-medium text-white">
                    {formatMoney(item.amount, item.currency)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="mb-2 text-sm font-medium text-white">Pending</div>
          <div className="space-y-2">
            {(data?.pending ?? []).length === 0 ? (
              <div className="text-sm text-white/50">Brak oczekujących środków</div>
            ) : (
              data!.pending!.map((item) => (
                <div
                  key={`pending-${item.currency}`}
                  className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-sm"
                >
                  <span className="text-white/70">{item.currency.toUpperCase()}</span>
                  <span className="font-medium text-white">
                    {formatMoney(item.amount, item.currency)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}