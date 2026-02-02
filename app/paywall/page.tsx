"use client";

import Link from "next/link";
import { Button, Card, CardContent } from "../../components/ui";

// ⬇️ WSTAW SWÓJ PAYMENT LINK ze Stripe:
const STRIPE_LINK = "https://buy.stripe.com/TWOJ_LINK_TUTAJ";

export default function Paywall() {
  return (
    <main className="px-6 py-16 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-center">Odblokuj dostęp</h1>
      <p className="text-zinc-400 text-center mb-8">
        Kurs + dashboard PRO + journal. Dostęp lifetime.
      </p>

      <Card>
        <CardContent>
          <ul className="text-sm text-zinc-200 space-y-2">
            <li>✔️ Kurs premium</li>
            <li>✔️ Dashboard PRO: setupy / błędy / sesje</li>
            <li>✔️ Journal + statystyki</li>
            <li>✔️ Import/Export CSV</li>
          </ul>

          <div className="mt-6 flex flex-col gap-3">
            <Button
              className="py-6 text-lg"
              onClick={() => {
                // 👉 przejście do Stripe Payment Link
                window.location.href = STRIPE_LINK;
              }}
            >
              Kup dostęp – 99€
            </Button>

            <Link href="/">
              <Button variant="outline" className="py-6 text-lg w-full">
                Wróć
              </Button>
            </Link>
          </div>

          <p className="text-xs text-zinc-500 mt-4">
            Po płatności Stripe przekieruje na /success (ustawione w Stripe).
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
