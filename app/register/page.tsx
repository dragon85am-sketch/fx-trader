"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { setCurrentStorageUser } from "@/lib/userScopedStorage";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  Radio,
  ShieldCheck,
  Target,
  UserRound,
  Users,
} from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const passwordRules = useMemo(
    () => ({
      length: password.length >= 8,
      number: /\d/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    }),
    [password]
  );

  const passwordValid =
    passwordRules.length && passwordRules.number && passwordRules.special;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");

    if (!name.trim()) {
      setMsg("Wpisz swoje imię.");
      return;
    }

    if (!passwordValid) {
      setMsg("Hasło musi mieć minimum 8 znaków, cyfrę i znak specjalny.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          password,
        }),
      });

      let data: any = null;

      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        setMsg(data?.error || "Błąd rejestracji");
        return;
      }

      // Konto zostało utworzone.
      // Przechodzimy do checkoutu zamiast wpuszczać użytkownika do dashboardu.
      // /api/stripe/checkout wymaga aktywnej sesji przez requireAuth(),
      // więc endpoint /api/register powinien po rejestracji ustawić cookie "token".
      if (data?.user?.id) setCurrentStorageUser(String(data.user.id));
      setMsg("Konto utworzone. Przekierowanie do płatności...");

      window.location.href = "/checkout";
    } catch {
      setMsg("Błąd serwera");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#020b1c] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/fx-trade-market-background.png')" }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(1,8,25,.70)_0%,rgba(1,9,26,.18)_45%,rgba(1,8,25,.60)_100%)]" />
      <div className="mx-auto max-w-[1540px] px-5 pb-8 pt-6 md:px-10">
        <header className="mb-7 flex items-start justify-between gap-4">
          <div className="leading-none"><div className="text-3xl font-black tracking-tight md:text-4xl">F<span className="text-cyan-400">X</span> TRADE</div><div className="mt-2 text-[10px] font-bold uppercase tracking-[.35em] text-cyan-200">Premium Education</div></div>
          <LanguageSwitcher />
        </header>
        <section className="grid items-center gap-10 lg:grid-cols-[1.08fr_.92fr] xl:gap-16">
          <div className="relative min-h-[570px] py-7 lg:min-h-[710px] lg:py-12">
            <h1 className="text-[44px] font-black leading-[.99] tracking-tight drop-shadow-[0_4px_18px_rgba(0,0,0,.75)] sm:text-6xl xl:text-[70px]">Dołącz do<br/><span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-600 bg-clip-text text-transparent">FX TRADE</span></h1>
            <p className="mt-6 max-w-[420px] text-base leading-relaxed text-slate-100 drop-shadow-[0_2px_8px_#001] sm:text-lg">Rozwijaj swoje umiejętności tradingowe z profesjonalną platformą edukacyjną.</p>
            <div className="mt-9 max-w-[410px] space-y-6">
              <Feature icon={GraduationCap} title="Kompletna edukacja" text="Kursy od podstaw do zaawansowanych strategii tradingowych." />
              <Feature icon={BarChart3} title="Narzędzia analityczne" text="Skanery rynku, wskaźniki i dashboard analityczny." />
              <Feature icon={Target} title="Strategie rynkowe" text="Sprawdzone strategie z zasadami i checklistami." />
              <Feature icon={Users} title="Aktywna społeczność" text="Analiza rynku, edukacja i wsparcie traderów." />
            </div>
            <div className="mt-10 flex max-w-[480px] flex-wrap gap-2 text-xs font-bold tracking-wide text-cyan-100">
              {['EUR/USD','XAU/USD','US30'].map((market) => <span key={market} className="rounded-lg border border-cyan-400/40 bg-[#04162c]/80 px-4 py-2 shadow-[0_0_18px_rgba(0,183,255,.12)]">{market}</span>)}
            </div>
          </div>
          <div className="rounded-[26px] border border-cyan-400/70 bg-[linear-gradient(145deg,rgba(6,29,63,.96),rgba(1,14,36,.97))] p-5 shadow-[0_0_35px_rgba(0,174,255,.25),0_18px_65px_rgba(0,0,0,.60),inset_0_1px_0_rgba(255,255,255,.15)] sm:p-8 xl:p-10">
            <div className="text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-cyan-400/60 bg-blue-500/10 shadow-[0_0_24px_rgba(0,183,255,.40)]"><UserRound className="h-8 w-8 text-sky-200" /></div>
              <h2 className="mt-4 text-3xl font-black sm:text-4xl">Rejestracja</h2>
              <p className="mt-2 text-sm text-slate-300">Utwórz konto i zyskaj dostęp do platformy <span className="font-semibold text-cyan-300">FX Trade Premium.</span></p>
            </div>
            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <div><label htmlFor="reg-name" className="mb-2 flex items-center gap-2 text-sm font-semibold"><UserRound className="h-4 w-4 text-cyan-400"/> Imię</label><div className="relative"><UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"/><input id="reg-name" autoComplete="given-name" required value={name} onChange={e=>setName(e.target.value)} placeholder="Wpisz swoje imię" className="w-full rounded-xl border border-sky-400/35 bg-[#051b38] py-3.5 pl-12 pr-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20" /></div></div>
              <div><label htmlFor="reg-email" className="mb-2 flex items-center gap-2 text-sm font-semibold"><Mail className="h-4 w-4 text-cyan-400"/> Email</label><div className="relative"><Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"/><input id="reg-email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Wpisz swój adres email" className="w-full rounded-xl border border-sky-400/35 bg-[#051b38] py-3.5 pl-12 pr-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20" /></div></div>
              <div><label htmlFor="reg-password" className="mb-2 flex items-center gap-2 text-sm font-semibold"><LockKeyhole className="h-4 w-4 text-cyan-400"/> Hasło</label><div className="relative"><LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"/><input id="reg-password" type={showPassword?'text':'password'} autoComplete="new-password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Utwórz silne hasło" className="w-full rounded-xl border border-sky-400/35 bg-[#051b38] py-3.5 pl-12 pr-12 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"/><button type="button" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?'Ukryj hasło':'Pokaż hasło'} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300">{showPassword?<EyeOff className="h-5 w-5"/>:<Eye className="h-5 w-5"/>}</button></div></div>
              <div className="rounded-xl border border-cyan-400/20 bg-blue-950/50 p-3"><p className="mb-2 text-xs text-slate-300">Hasło musi zawierać:</p><div className="grid gap-2 text-xs sm:grid-cols-2"><PasswordRule ok={passwordRules.length}>Minimum 8 znaków</PasswordRule><PasswordRule ok={passwordRules.number}>Jedną cyfrę</PasswordRule><PasswordRule ok={/[A-Z]/.test(password)}>Dużą literę (zalecane)</PasswordRule><PasswordRule ok={passwordRules.special}>Znak specjalny</PasswordRule></div></div>
              <label className="flex cursor-pointer items-start gap-3 text-xs leading-5 text-slate-300"><input type="checkbox" required className="mt-1 h-4 w-4 accent-cyan-500"/><span>Akceptuję <Link href="/terms" className="text-cyan-300 underline">Regulamin</Link> oraz <Link href="/privacy" className="text-cyan-300 underline">Politykę prywatności</Link></span></label>
              <label className="flex cursor-pointer items-start gap-3 text-xs leading-5 text-slate-300"><input type="checkbox" className="mt-1 h-4 w-4 accent-cyan-500"/><span>Chcę otrzymywać informacje o nowościach i edukacji FX Trade (opcjonalnie)</span></label>
              {msg && <div role="alert" className="rounded-xl border border-sky-400/30 bg-sky-900/30 px-4 py-3 text-sm">{msg}</div>}
              <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-700 px-5 py-4 text-base font-black shadow-[0_10px_30px_rgba(0,120,255,.25)] transition hover:brightness-110 disabled:opacity-60">{loading?'Tworzenie konta...':'Załóż konto'}{!loading&&<ArrowRight className="h-5 w-5"/>}</button>
              <p className="pt-2 text-center text-sm text-slate-300">Masz już konto? <Link href="/login" className="font-bold text-cyan-300 hover:underline">Zaloguj się</Link></p>
            </form>
          </div>
        </section>
        <section className="mt-6 grid gap-3 rounded-2xl border border-cyan-400/45 bg-[#041b39]/90 p-4 shadow-[0_0_24px_rgba(0,145,255,.18)] sm:grid-cols-2 lg:grid-cols-4">
          <MiniBenefit icon={ShieldCheck} title="Bezpieczeństwo" text="Twoje dane są chronione"/><MiniBenefit icon={BookOpen} title="Edukacja" text="Na każdym poziomie"/><MiniBenefit icon={BarChart3} title="Narzędzia" text="Dla świadomego tradera"/><MiniBenefit icon={Users} title="Społeczność" text="Wsparcie i rozwój"/>
        </section>
        <p className="mx-auto mt-4 max-w-5xl text-center text-[11px] leading-5 text-slate-400">FX Trade Premium to platforma edukacyjna. Materiały nie stanowią porady inwestycyjnej ani rekomendacji finansowej. Wyniki zależą od indywidualnych decyzji użytkownika.</p>
      </div>
    </main>
  );
}

function Feature({icon:Icon,title,text}:{icon:React.ElementType;title:string;text:string}) {
 return <div className="flex items-start gap-4"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-cyan-400/50 bg-[#06264d]/90 shadow-[0_0_18px_rgba(0,150,255,.17)]"><Icon className="h-7 w-7 text-cyan-300"/></div><div><div className="text-base font-black text-cyan-300">{title}</div><div className="mt-1 max-w-[300px] text-sm leading-5 text-slate-200">{text}</div></div></div>;
}
function PasswordRule({ok,children}:{ok:boolean;children:React.ReactNode}) {
 return <span className={ok?'flex items-center gap-2 text-emerald-300':'flex items-center gap-2 text-slate-400'}><Check className="h-3.5 w-3.5 shrink-0"/>{children}</span>;
}
function MiniBenefit({icon:Icon,title,text}:{icon:React.ElementType;title:string;text:string}) {
 return <div className="flex items-center gap-3 rounded-xl border border-cyan-500/20 bg-[#072b52]/80 p-4"><Icon className="h-7 w-7 shrink-0 text-cyan-300"/><div><div className="text-sm font-bold">{title}</div><div className="mt-1 text-xs text-slate-400">{text}</div></div></div>;
}
