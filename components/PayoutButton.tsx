"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function PayoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handlePayout = async () => {
    if (loading) return;

    try {
      setLoading(true);

      const res = await fetch("/api/affiliate/payouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(
          data?.error || "Nie udało się utworzyć wniosku o wypłatę"
        );
        return;
      }

      toast.success("Wniosek o wypłatę został utworzony");

      router.refresh();
    } catch (error) {
      console.error("PayoutButton error:", error);

      toast.error(
        "Wystąpił błąd podczas tworzenia wniosku o wypłatę"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePayout}
      disabled={loading}
      className="mt-5 w-full rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.25)] transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Tworzenie wniosku..." : "Złóż wniosek o wypłatę"}
    </button>
  );
}