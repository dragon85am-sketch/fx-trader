"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function ConnectStripeButton() {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/stripe/connect", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || "Nie udało się połączyć Stripe");
        console.error("CONNECT BUTTON ERROR:", data);
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("ConnectStripeButton error:", error);
      toast.error("Wystąpił błąd podczas łączenia Stripe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-60"
    >
      {loading ? "Łączenie..." : "Dokończ Stripe"}
    </button>
  );
}