"use client";

import { useState } from "react";

type Props = {
  userId: string;
  isPremium: boolean;
  isBanned: boolean;
  role?: string;
};

export default function AdminUserActions({
  userId,
  isPremium,
  isBanned,
  role = "user",
}: Props) {
  const [loading, setLoading] = useState(false);

  async function togglePremium() {
    try {
      setLoading(true);

      const res = await fetch(`/api/admin/users/${userId}/premium`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isPremium: !isPremium,
        }),
      });

      if (!res.ok) {
        throw new Error("Nie udało się zmienić premium");
      }

      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Błąd zmiany premium");
    } finally {
      setLoading(false);
    }
  }

  async function toggleAdmin() {
    try {
      setLoading(true);

      const nextRole = role === "admin" ? "user" : "admin";

      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: nextRole,
        }),
      });

      if (!res.ok) {
        throw new Error("Nie udało się zmienić roli");
      }

      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Błąd zmiany roli");
    } finally {
      setLoading(false);
    }
  }

  async function toggleBan() {
    try {
      setLoading(true);

      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isBanned: !isBanned,
        }),
      });

      if (!res.ok) {
        throw new Error("Nie udało się zmienić bana");
      }

      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Błąd zmiany bana");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-w-[640px] grid-cols-3 gap-x-6 gap-y-3">
      <button
        onClick={togglePremium}
        disabled={loading}
        className={`
          flex
          w-[180px]
          items-center
          justify-center
          rounded-2xl
          px-5
          py-3
          text-sm
          font-semibold
          transition
          ${
            isPremium
              ? "bg-red-500/20 text-red-300 hover:bg-red-500/30"
              : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
          }
        `}
      >
        {loading ? "Loading..." : isPremium ? "Remove Premium" : "Make Premium"}
      </button>

      <button
        onClick={toggleAdmin}
        disabled={loading}
        className={`
          flex
          w-[180px]
          items-center
          justify-center
          rounded-2xl
          px-5
          py-3
          text-sm
          font-semibold
          transition
          ${
            role === "admin"
              ? "bg-orange-500/20 text-orange-300 hover:bg-orange-500/30"
              : "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
          }
        `}
      >
        {loading ? "Loading..." : role === "admin" ? "Remove Admin" : "Make Admin"}
      </button>

      <button
        onClick={toggleBan}
        disabled={loading}
        className={`
          flex
          w-[180px]
          items-center
          justify-center
          rounded-2xl
          px-5
          py-3
          text-sm
          font-semibold
          transition
          ${
            isBanned
              ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
              : "bg-zinc-500/20 text-zinc-300 hover:bg-zinc-500/30"
          }
        `}
      >
        {loading ? "Loading..." : isBanned ? "Unban User" : "Ban User"}
      </button>
    </div>
  );
}