"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type LoadingState =
  | "Approved"
  | "Rejected"
  | "Paid"
  | "StripePay"
  | null;

type Props = {
  payoutId: string;
  currentStatus:
    | "Pending"
    | "Approved"
    | "Paid"
    | "Rejected"
    | string;
};

export default function AdminPayoutActions({
  payoutId,
  currentStatus,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] =
    useState<LoadingState>(null);

  const updateStatus = async (
    status: "Approved" | "Rejected" | "Paid"
  ) => {
    try {
      setLoading(status);

      const res = await fetch(
        `/api/admin/payouts/${payoutId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(
          data?.error ||
            "Nie udało się zmienić statusu"
        );
        return;
      }

      toast.success(
        status === "Approved"
          ? "Wypłata została zatwierdzona"
          : status === "Rejected"
          ? "Wypłata została odrzucona"
          : "Wypłata została oznaczona jako opłacona"
      );

      router.refresh();
    } catch (error) {
      console.error("AdminPayoutActions error:", error);
      toast.error("Wystąpił błąd");
    } finally {
      setLoading(null);
    }
  };

  const payWithStripe = async () => {
    try {
      const confirmed = window.confirm(
        "Na pewno wysłać tę wypłatę przez Stripe Connect?"
      );

      if (!confirmed) return;

      setLoading("StripePay");

      const res = await fetch(
        `/api/admin/payouts/${payoutId}/pay`,
        {
          method: "POST",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(
          data?.error ||
            "Nie udało się wysłać payoutu przez Stripe"
        );
        return;
      }

      toast.success(
        `Payout wysłany przez Stripe: ${data.transferId}`
      );

      router.refresh();
    } catch (error) {
      console.error("Stripe payout error:", error);
      toast.error("Wystąpił błąd Stripe payout");
    } finally {
      setLoading(null);
    }
  };

  if (currentStatus === "Rejected") {
    return (
      <span className="inline-flex rounded-full border border-red-400/20 bg-red-500/10 px-2.5 py-1 text-xs text-red-300">
        Brak akcji
      </span>
    );
  }

  if (currentStatus === "Paid") {
    return (
      <span className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
        Brak akcji
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {currentStatus === "Pending" && (
        <>
          <button
            onClick={() => updateStatus("Approved")}
            disabled={loading !== null}
            className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading === "Approved"
              ? "Zapisywanie..."
              : "Approve"}
          </button>

          <button
            onClick={() => updateStatus("Rejected")}
            disabled={loading !== null}
            className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading === "Rejected"
              ? "Zapisywanie..."
              : "Reject"}
          </button>
        </>
      )}

      {currentStatus === "Approved" && (
        <>
          <button
            onClick={payWithStripe}
            disabled={loading !== null}
            className="rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading === "StripePay"
              ? "Wysyłanie..."
              : "Pay with Stripe"}
          </button>

          <button
            onClick={() => updateStatus("Paid")}
            disabled={loading !== null}
            className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading === "Paid"
              ? "Zapisywanie..."
              : "Mark as paid"}
          </button>
        </>
      )}
    </div>
  );
}