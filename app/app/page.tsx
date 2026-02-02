"use client";

import React from "react";
import Link from "next/link";
import DashboardPro from "../../components/DashboardPro";
import { Button, Card, CardContent } from "../../components/ui";
import { getPaid, getOnboarding } from "../../components/storage";

export default function AppHome() {
  const [paid, setPaid] = React.useState(false);
  const [onboarding, setOnboarding] = React.useState({
    completed: false,
    step: 0,
    tradesCount: 0,
  });

  React.useEffect(() => {
    const sync = () => {
      setPaid(getPaid());
      setOnboarding(getOnboarding());
    };

    sync();

    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (!paid) {
    return (
      <main className="px-6 py-16 max-w-3xl mx-auto">
        <Card>
          <CardContent>
            <h1 className="text-2xl font-bold mb-2">Premium</h1>
            <p className="text-zinc-400 mb-6">
              Dashboard i kurs są dostępne po zakupie.
            </p>
            <Link href="/paywall">
              <Button className="py-6 text-lg">
                Odblokuj dostęp – 99€
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  // paid === true → zawsze pokazujemy dashboard
  return (
    <main className="px-6 py-10 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">Dashboard PRO</h1>
        <div className="flex gap-2">
          <Link href="/app/kurs">
            <Button variant="outline">Kurs</Button>
          </Link>
          <Link href="/app/onboarding">
            <Button variant="outline">Onboarding</Button>
          </Link>
        </div>
      </div>

      <DashboardPro />
    </main>
  );
}
