"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button, Card, CardContent, Input, Label, Pill } from "../../../components/ui";
import { getOnboarding, setOnboarding, getPaid } from "../../../components/storage";

export default function Onboarding() {
  const paid = typeof window !== "undefined" ? getPaid() : false;
  const [state, setState] = useState(() => (typeof window !== "undefined" ? getOnboarding() : { completed:false, step:0, tradesCount:0 }));

  useEffect(() => {
    setState(getOnboarding());
  }, []);

  const step = state.step ?? 0;
  const tradesCount = state.tradesCount ?? 0;

  const canProceedRules = useMemo(() => {
    return Boolean((state as any).rulesAccepted);
  }, [state]);

  if (!paid) {
    return (
      <main className="px-6 py-16 max-w-2xl mx-auto">
        <Card><CardContent>
          <h1 className="text-2xl font-bold mb-2">Onboarding</h1>
          <p className="text-zinc-400 mb-6">Onboarding jest dostępny po zakupie.</p>
          <Link href="/paywall"><Button className="py-6 text-lg">Odblokuj dostęp – 99€</Button></Link>
        </CardContent></Card>
      </main>
    );
  }

  if (state.completed) {
    return (
      <main className="px-6 py-16 max-w-2xl mx-auto">
        <Card><CardContent>
          <h1 className="text-2xl font-bold mb-2">Onboarding ukończony ✅</h1>
          <p className="text-zinc-400 mb-6">Masz odblokowany pełny dashboard PRO.</p>
          <Link href="/app"><Button className="py-6 text-lg">Przejdź do dashboardu</Button></Link>
        </CardContent></Card>
      </main>
    );
  }

  return (
    <main className="px-6 py-10 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Onboarding (twardy)</h1>
        <Pill>Krok {Math.max(1, step+1)} / 5</Pill>
      </div>

      {step <= 0 && (
        <Card><CardContent>
          <h2 className="text-xl font-semibold mb-2">Start</h2>
          <p className="text-zinc-400 mb-4">
            To nie jest platforma sygnałowa. To system, który pokaże Ci dlaczego zarabiasz albo tracisz.
          </p>
          <Button className="py-6 text-lg" onClick={() => {
            const next = { ...state, step: 1, tradesCount: 0, completed: false };
            setOnboarding(next as any); setState(next as any);
          }}>Zaczynam onboarding</Button>
        </CardContent></Card>
      )}

      {step === 1 && (
        <Card><CardContent>
          <h2 className="text-xl font-semibold mb-2">Zasady (akceptacja)</h2>
          <p className="text-zinc-400 mb-4">Zaznacz wszystkie. To kontrakt procesu.</p>

          <div className="space-y-2 text-sm text-zinc-200">
            {[
              "Gram TYLKO 1 setup",
              "Gram TYLKO 1 TF",
              "Wpisuję KAŻDY trade do journala",
              "Oceniam proces, nie wynik",
            ].map((t, idx) => (
              <label key={idx} className="flex items-center gap-2">
                <input type="checkbox"
                  onChange={(e) => {
                    const key = `r${idx}`;
                    const next = { ...(state as any), [key]: e.target.checked };
                    const ok = [0,1,2,3].every(i => next[`r${i}`] === true);
                    next.rulesAccepted = ok;
                    setState(next);
                    setOnboarding({ ...next } as any);
                  }}
                  checked={Boolean((state as any)[`r${idx}`])}
                />
                <span>{t}</span>
              </label>
            ))}
          </div>

          <div className="mt-6">
            <Button className="py-6 text-lg" disabled={!canProceedRules} onClick={() => {
              const next = { ...state, step: 2 } as any;
              setOnboarding(next); setState(next);
            }}>Akceptuję zasady i idę dalej</Button>
          </div>
        </CardContent></Card>
      )}

      {step === 2 && (
        <Card><CardContent>
          <h2 className="text-xl font-semibold mb-2">Wybierz setup (bez zmiany do końca)</h2>
          <p className="text-zinc-400 mb-4">Przez pierwsze 10 trade nie zmieniasz setupu. Chcemy czystych danych.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Setup</Label>
              <select className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
                defaultValue="M1 1–2–3"
                onChange={(e)=> {
                  const next = { ...state, setup: { ...(state as any).setup, setup: e.target.value } } as any;
                  setState(next); setOnboarding(next);
                }}
              >
                <option>M1 1–2–3</option>
                <option>M1 retest mid BB</option>
              </select>
            </div>
            <div>
              <Label>TF</Label>
              <select className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
                defaultValue="M1"
                onChange={(e)=> {
                  const next = { ...state, setup: { ...(state as any).setup, tf: e.target.value } } as any;
                  setState(next); setOnboarding(next);
                }}
              >
                <option>M1</option>
                <option>M5</option>
              </select>
            </div>
            <div>
              <Label>Sesja</Label>
              <select className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
                defaultValue="NY"
                onChange={(e)=> {
                  const next = { ...state, setup: { ...(state as any).setup, session: e.target.value } } as any;
                  setState(next); setOnboarding(next);
                }}
              >
                <option>London</option>
                <option>NY</option>
                <option>Asia</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex gap-2 flex-wrap">
            <Link href="/app"><Button variant="outline">Wróć</Button></Link>
            <Button className="py-6 text-lg" onClick={() => {
              const next = { ...state, step: 3, tradesCount: 0 } as any;
              setOnboarding(next); setState(next);
              window.location.href = "/app";
            }}>Start: pierwsze 10 trade</Button>
          </div>
        </CardContent></Card>
      )}

      {step >= 3 && (
        <Card><CardContent>
          <h2 className="text-xl font-semibold mb-2">Tryb 10 trade</h2>
          <p className="text-zinc-400 mb-4">
            Dodawaj trade w Journalu. Po 10 trade zobaczysz analizę i odblokujesz pełną wersję.
          </p>
          <div className="flex flex-wrap gap-2 items-center">
            <Pill>{tradesCount}/10 trade</Pill>
            {(state as any).setup?.setup && <Pill>Setup: {(state as any).setup.setup}</Pill>}
            {(state as any).setup?.tf && <Pill>TF: {(state as any).setup.tf}</Pill>}
            {(state as any).setup?.session && <Pill>Sesja: {(state as any).setup.session}</Pill>}
          </div>

          <div className="mt-6 flex gap-2 flex-wrap">
            <Link href="/app"><Button className="py-6 text-lg">Idę do Journal</Button></Link>
          </div>

          <p className="text-xs text-zinc-500 mt-4">
            Uwaga: w tej paczce licznik zwiększa się automatycznie po dodaniu trade w Journalu.
          </p>
        </CardContent></Card>
      )}
    </main>
  );
}
