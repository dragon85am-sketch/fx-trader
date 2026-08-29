"use client";

import { useState } from "react";

export default function BillingPortalButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    try {
      setLoading(true);

      const res = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok || !data?.url) {
        alert(data?.error || "Nie udało się otworzyć zarządzania subskrypcją.");
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("BILLING PORTAL ERROR:", error);
      alert("Wystąpił błąd podczas otwierania Stripe.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="
        rounded-2xl
        border
        border-blue-500/30
        bg-blue-500/10
        px-5
        py-3
        text-sm
        font-semibold
        text-blue-200
        transition
        hover:bg-blue-500/20
        hover:text-white
        disabled:cursor-not-allowed
        disabled:opacity-60
      "
    >
      {loading ? "Opening Stripe..." : "Manage Subscription"}
    </button>
  );
}
