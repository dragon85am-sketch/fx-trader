"use client";

import React from "react";
import Link from "next/link";
import { Button } from "./ui";
import { getPaid, setPaid } from "./storage";

export default function Nav() {
  const [paid, setPaidState] = React.useState(false);

  React.useEffect(() => {
    setPaidState(getPaid());
  }, []);

  function demoBuy() {
    setPaid(true);
    setPaidState(true);
    window.location.href = "/app/onboarding";
  }

  function demoLogout() {
    // for demo: just clear paid
    // setPaid(false);
// setPaidState(false);
    window.location.href = "/";
  }

  return (
    <div className="sticky top-0 z-50 border-b border-white/10 bg-blue-950/40 backdrop-blur-xl">

      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold tracking-widest text-sm md:text-base">
  FX TRADE
</Link>
        <div className="flex items-center gap-2">
          <Link href="/" className="hidden sm:inline text-sm text-zinc-300 hover:text-zinc-100">Home</Link>
          <Link href="/app" className="hidden sm:inline text-sm text-zinc-300 hover:text-zinc-100">Premium</Link>
          {paid ? (
            <Button variant="outline" onClick={demoLogout}>Wyloguj (demo)</Button>
          ) : (
            <Button onClick={demoBuy}>Kup dostęp – 99€ (demo)</Button>
          )}
        </div>
      </div>
    </div>
  );
}
