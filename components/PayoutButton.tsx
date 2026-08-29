"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function PayoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePayout = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/affiliate/payouts", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || "Nie udało się utworzyć wniosku");
        return;
      }

      toast.success("Wniosek o wypłatę został utworzony");
      router.refresh();
    } catch (error) {
      console.error("PayoutButton error:", error);
      toast.error("Wystąpił błąd podczas tworzenia wypłaty");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayout}
      disabled={loading}
      className="mt-5 w-full rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.25)] transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Tworzenie wniosku..." : "Złóż wniosek o wypłatę"}
    </button>
  );
}