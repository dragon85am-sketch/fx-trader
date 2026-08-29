"use client";

export default function LogoutButton() {
  async function handleLogout() {
    try {
      await fetch("/api/logout", {
        method: "POST",
      });

      window.location.replace("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full rounded-full border border-white/20 py-2 text-sm text-white hover:bg-white/10"
    >
      Wyloguj
    </button>
  );
}