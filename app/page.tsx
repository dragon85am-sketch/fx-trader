"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button, Card, CardContent } from "../components/ui";

export default function Home() {
  return (
    <main>
      <section className="px-6 py-20 text-center">
        <motion.h1 initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl font-bold mb-6">
          FX TRADE
        </motion.h1>
        <p className="text-zinc-400 max-w-2xl mx-auto mb-8">
          Praktyczna edukacja tradingowa oparta na strukturze rynku, dyscyplinie i statystyce. Bez sygnałów. Bez obietnic.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/paywall"><Button className="text-lg px-8 py-6">Kup dostęp – 99€</Button></Link>
          <Link href="/app"><Button variant="outline" className="text-lg px-8 py-6">Zobacz premium</Button></Link>
        </div>
        <p className="text-xs text-zinc-500 mt-4">*W tej paczce płatność/login są w trybie demo. Integracja Stripe/Supabase jest przygotowana do podpięcia.</p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6 max-w-6xl mx-auto">
        {[
          ["Struktura rynku", "M5 wybiera stronę. M1 daje timing."],
          ["Zarządzanie ryzykiem", "R, expectancy, DD. Proces > wynik."],
          ["Dashboard PRO", "Setupy, błędy, sesje, CSV, journal."],
        ].map(([t, d]) => (
          <Card key={t}>
            <CardContent className="text-center">
              <h3 className="text-xl font-semibold mb-2">{t}</h3>
              <p className="text-zinc-400 text-sm">{d}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="px-6 py-20 max-w-4xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">Co otrzymujesz</h2>
        <ul className="text-zinc-400 space-y-2 mb-8 text-left max-w-2xl mx-auto">
          <li>✔️ Kurs scalping M1 (setup 1–2–3 + retesty)</li>
          <li>✔️ Filtr M5 i czytanie struktury rynku</li>
          <li>✔️ Checklisty premium</li>
          <li>✔️ Dashboard PRO + journal</li>
          <li>✔️ Import/Export CSV</li>
        </ul>
        <Link href="/paywall"><Button className="text-lg px-10 py-6">Dołącz teraz – 99€</Button></Link>
      </section>
    </main>
  );
}
