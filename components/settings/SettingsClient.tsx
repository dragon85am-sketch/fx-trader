"use client";

import React from "react";
import { toast } from "sonner";
import DeleteAccountModal from "@/components/settings/DeleteAccountModal";
import { useLanguage } from "@/components/LanguageProvider";
import {
  normalizeLanguage,
  type AppLanguage,
} from "@/lib/i18n/catalog";

type MeResponse = {
  user?: {
    id: string;
    email: string;
    name: string | null;
    role: string;

    theme?: string | null;
    language?: string | null;

    isPremium?: boolean;
    premiumSince?: string | null;
    premiumUntil?: string | null;
    cancelAtPeriodEnd?: boolean;

    hasStripeCustomer?: boolean;
    hasStripeSubscription?: boolean;
  };

  error?: string;
};

export default function SettingsClient() {
  const { t, lang, setLang, locale } = useLanguage();

  // =====================================================
  // PROFILE
  // =====================================================

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState("USER");
  const [loadingProfile, setLoadingProfile] =
    React.useState(false);

  // =====================================================
  // PASSWORD
  // =====================================================

  const [currentPassword, setCurrentPassword] =
    React.useState("");

  const [newPassword, setNewPassword] =
    React.useState("");

  const [confirmPassword, setConfirmPassword] =
    React.useState("");

  const [savingPassword, setSavingPassword] =
    React.useState(false);

  // =====================================================
  // PREFERENCES
  // =====================================================

  const [theme, setTheme] =
    React.useState("dark");

  const [language, setLanguage] =
    React.useState<AppLanguage>(lang);

  // =====================================================
  // SECURITY
  // =====================================================

  const [loggingOutAll, setLoggingOutAll] =
    React.useState(false);

  // =====================================================
  // SUBSCRIPTION
  // =====================================================

  const [openingPortal, setOpeningPortal] =
    React.useState(false);

  const [openingCheckout, setOpeningCheckout] =
    React.useState(false);

  const [isPremium, setIsPremium] =
    React.useState(false);

  const [premiumUntil, setPremiumUntil] =
    React.useState<string | null>(null);

  const [
    cancelAtPeriodEnd,
    setCancelAtPeriodEnd,
  ] = React.useState(false);

  const [
    hasStripeSubscription,
    setHasStripeSubscription,
  ] = React.useState(false);

  // =====================================================
  // DELETE ACCOUNT
  // =====================================================

  const [deleteOpen, setDeleteOpen] =
    React.useState(false);

  const [deletePassword, setDeletePassword] =
    React.useState("");

  const [
    deleteConfirmation,
    setDeleteConfirmation,
  ] = React.useState("");

  const [
    deletingAccount,
    setDeletingAccount,
  ] = React.useState(false);

  // =====================================================
  // LOAD USER
  // =====================================================

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/me", {
          credentials: "include",
          cache: "no-store",
        });

        const data =
          (await res.json()) as MeResponse;

        if (res.status === 401) {
          window.location.replace("/login");
          return;
        }

        if (!res.ok) {
          console.error(
            "SETTINGS /api/me error:",
            data?.error
          );

          return;
        }

        const user = data.user;

        if (!user) {
          return;
        }

        setName(user.name || "");
        setEmail(user.email || "");

        setRole(
          (user.role || "user").toUpperCase()
        );

        setTheme(
          user.theme || "dark"
        );

        // Nie nadpisuj języka wybranego w górnym przełączniku.
        // Wejście w /settings ma zachować aktualny język aplikacji.
        setLanguage(lang);

        localStorage.setItem(
          "theme",
          user.theme || "dark"
        );

        setIsPremium(
          user.isPremium === true
        );

        setPremiumUntil(
          user.premiumUntil ?? null
        );

        setCancelAtPeriodEnd(
          user.cancelAtPeriodEnd === true
        );

        setHasStripeSubscription(
          user.hasStripeSubscription === true
        );
      } catch (err) {
        console.error(
          "SETTINGS LOAD ERROR:",
          err
        );
      }
    }

    load();
  }, [lang]);

  // =====================================================
  // FORMAT DATE
  // =====================================================

  function formatPremiumDate(
    value: string | null
  ) {
    if (!value) {
      return "Brak daty";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Brak daty";
    }

    return new Intl.DateTimeFormat(
      locale,
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    ).format(date);
  }

  // =====================================================
  // SAVE PROFILE
  // =====================================================

  const saveProfile = async () => {
    try {
      setLoadingProfile(true);

      const res = await fetch(
        "/api/settings/profile",
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            name,
            email,
            theme,
            language,
          }),
        }
      );

      const data = await res.json();

      if (res.status === 401) {
        toast.error(
          "Sesja wygasła. Zaloguj się ponownie."
        );

        setTimeout(() => {
          window.location.replace(
            "/login"
          );
        }, 500);

        return;
      }

      if (!res.ok) {
        toast.error(
          data?.error ||
            t("saveError")
        );

        return;
      }

      setLang(language);

      localStorage.setItem(
        "lang",
        language
      );

      localStorage.setItem(
        "theme",
        theme
      );

      toast.success(
        t("savedSettings")
      );

      // Język aktualizuje się od razu przez LanguageProvider.
      // Nie przeładowujemy całej strony, więc ekran nie miga.
    } catch (err) {
      console.error(
        "SAVE PROFILE ERROR:",
        err
      );

      toast.error(
        t("serverError")
      );
    } finally {
      setLoadingProfile(false);
    }
  };

  // =====================================================
  // CHANGE PASSWORD
  // =====================================================

  const changePassword = async () => {
    try {
      setSavingPassword(true);

      const res = await fetch(
        "/api/settings/password",
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword,
          }),
        }
      );

      const data = await res.json();

      if (res.status === 401) {
        toast.error(
          "Sesja wygasła. Zaloguj się ponownie."
        );

        setTimeout(() => {
          window.location.replace(
            "/login"
          );
        }, 500);

        return;
      }

      if (!res.ok) {
        toast.error(
          data?.error ||
            t("passwordChangeError")
        );

        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      toast.success(
        t("passwordChanged")
      );
    } catch (err) {
      console.error(
        "CHANGE PASSWORD ERROR:",
        err
      );

      toast.error(
        t("serverError")
      );
    } finally {
      setSavingPassword(false);
    }
  };

  // =====================================================
  // LOGOUT ALL
  // =====================================================

  const logoutAll = async () => {
    try {
      setLoggingOutAll(true);

      const res = await fetch(
        "/api/settings/logout-all",
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await res.json();

      if (res.status === 401) {
        window.location.replace(
          "/login"
        );

        return;
      }

      if (!res.ok) {
        toast.error(
          data?.error ||
            t("genericError")
        );

        return;
      }

      toast.success(
        t("loggedOutAll")
      );

      window.location.replace(
        "/login"
      );
    } catch (err) {
      console.error(
        "LOGOUT ALL ERROR:",
        err
      );

      toast.error(
        t("serverError")
      );
    } finally {
      setLoggingOutAll(false);
    }
  };

  // =====================================================
  // STRIPE CUSTOMER PORTAL
  // =====================================================

  const openBillingPortal = async () => {
    try {
      setOpeningPortal(true);

      const res = await fetch(
        "/api/stripe/portal",
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await res.json();

      if (res.status === 401) {
        toast.error(
          "Sesja wygasła. Zaloguj się ponownie."
        );

        setTimeout(() => {
          window.location.replace(
            "/login"
          );
        }, 500);

        return;
      }

      if (!res.ok) {
        toast.error(
          data?.error ||
            "Nie udało się otworzyć zarządzania subskrypcją."
        );

        return;
      }

      if (!data?.url) {
        toast.error(
          "Stripe nie zwrócił adresu portalu."
        );

        return;
      }

      window.location.href =
        data.url;
    } catch (err) {
      console.error(
        "STRIPE PORTAL ERROR:",
        err
      );

      toast.error(
        "Problem z połączeniem z serwerem."
      );
    } finally {
      setOpeningPortal(false);
    }
  };

  // =====================================================
  // STRIPE CHECKOUT / RENEW PREMIUM
  // =====================================================

  const renewPremium = async () => {
    try {
      setOpeningCheckout(true);

      const res = await fetch(
        "/api/stripe/checkout",
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await res.json();

      if (res.status === 401) {
        toast.error(
          "Sesja wygasła. Zaloguj się ponownie."
        );

        setTimeout(() => {
          window.location.replace(
            "/login"
          );
        }, 500);

        return;
      }

      if (!res.ok) {
        toast.error(
          data?.error ||
            "Nie udało się rozpocząć płatności."
        );

        return;
      }

      if (!data?.url) {
        toast.error(
          "Stripe nie zwrócił adresu płatności."
        );

        return;
      }

      window.location.href =
        data.url;
    } catch (err) {
      console.error(
        "STRIPE CHECKOUT ERROR:",
        err
      );

      toast.error(
        "Problem z połączeniem z serwerem."
      );
    } finally {
      setOpeningCheckout(false);
    }
  };

  // =====================================================
  // DELETE ACCOUNT
  // =====================================================

  const deleteAccount = async () => {
    try {
      setDeletingAccount(true);

      const res = await fetch(
        "/api/settings/delete-account",
        {
          method: "DELETE",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            password:
              deletePassword,

            confirmation:
              deleteConfirmation,
          }),
        }
      );

      const data = await res.json();

      if (res.status === 401) {
        window.location.replace(
          "/login"
        );

        return;
      }

      if (!res.ok) {
        toast.error(
          data?.error ||
            t("deleteAccountError")
        );

        return;
      }

      toast.success(
        t("accountDeleted")
      );

      window.location.replace(
        "/login"
      );
    } catch (err) {
      console.error(
        "DELETE ACCOUNT ERROR:",
        err
      );

      toast.error(
        t("serverError")
      );
    } finally {
      setDeletingAccount(false);
    }
  };

  const closeDeleteModal = () => {
    if (deletingAccount) {
      return;
    }

    setDeleteOpen(false);
    setDeletePassword("");
    setDeleteConfirmation("");
  };

  // =====================================================
  // SUBSCRIPTION UI
  // =====================================================

  const premiumDate =
    formatPremiumDate(
      premiumUntil
    );

  const subscriptionLabel =
    isPremium && cancelAtPeriodEnd
      ? "ANULOWANA"
      : isPremium
        ? "AKTYWNA"
        : "WYGASŁA";

  const initials = (name || "U").slice(0, 2).toUpperCase();

  return (
    <>
      <main className="relative isolate min-h-screen overflow-hidden bg-[#020817] text-white">
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "linear-gradient(rgba(2,8,23,.70),rgba(2,8,23,.86)),url('/ustawienia-bg.png')" }} />
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_55%_8%,rgba(14,165,233,.18),transparent_40%)]" />

        <div className="mx-auto w-full max-w-[1080px] px-3 py-5 md:px-5">
          <header className="mb-4">
            <h1 className="text-[28px] font-bold tracking-tight">{t("settings")}</h1>
            <p className="mt-1 text-[12px] text-slate-300/65">Zarządzaj swoim kontem, bezpieczeństwem i preferencjami aplikacji.</p>
          </header>

          <div className="space-y-3">
            {/* PROFILE */}
            <section className="overflow-hidden rounded-xl border border-sky-400/30 bg-[linear-gradient(135deg,rgba(7,43,83,.97),rgba(3,28,58,.98))] shadow-[0_0_22px_rgba(14,165,233,.09)]">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg border border-cyan-400/20 bg-cyan-500/10 text-cyan-300">♙</span>
                  <div><h2 className="text-[13px] font-semibold">Profil użytkownika</h2><p className="text-[9px] text-slate-300/55">Twoje dane widoczne w aplikacji.</p></div>
                </div>
                <button onClick={saveProfile} disabled={loadingProfile} className="rounded-md border border-sky-400/70 bg-sky-500/[.06] px-3 py-2 text-[9px] font-semibold hover:bg-sky-500/15 disabled:opacity-50">✎ &nbsp; {loadingProfile ? t("saving") : "Edytuj profil"}</button>
              </div>
              <div className="flex items-center gap-4 px-4 py-4">
                <div className="grid h-[68px] w-[68px] shrink-0 place-items-center rounded-full border border-cyan-300/70 bg-gradient-to-br from-blue-500 to-blue-700 text-xl font-bold shadow-[0_0_18px_rgba(34,211,238,.22)]">{initials}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><input value={name} onChange={e=>setName(e.target.value)} className="w-full max-w-[220px] bg-transparent text-[13px] font-semibold outline-none" /><span className="rounded-full border border-sky-400/35 bg-sky-500/10 px-2 py-0.5 text-[7px] font-bold text-sky-300">{role}</span></div>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 block w-full max-w-[300px] bg-transparent text-[10px] text-slate-300 outline-none" />
                  <div className="mt-1 text-[9px] text-slate-400">Konto FX TRADE</div>
                </div>
              </div>
            </section>

            {/* ACCOUNT */}
            <section className="overflow-hidden rounded-xl border border-sky-400/30 bg-[linear-gradient(135deg,rgba(7,43,83,.97),rgba(3,28,58,.98))]">
              <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg border border-cyan-400/20 bg-cyan-500/10 text-cyan-300">▣</span>
                <div><h2 className="text-[13px] font-semibold">Konto i logowanie</h2><p className="text-[9px] text-slate-300/55">Zarządzaj e-mailem, hasłem oraz kodem PIN do szybkiego logowania.</p></div>
              </div>
              <div className="grid gap-2.5 p-3 md:grid-cols-3">
                <div className="flex min-h-[126px] flex-col rounded-lg border border-sky-400/20 bg-[#041d3a]/95 p-3">
                  <div className="flex gap-2.5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cyan-500/10 text-cyan-300">✉</span><div className="min-w-0"><b className="text-[10px]">E-mail</b><p className="mt-1 truncate text-[8px] text-slate-300/60">{email}</p></div></div>
                  <button onClick={saveProfile} disabled={loadingProfile} className="mt-auto rounded-md border border-sky-400/50 bg-blue-600/65 py-2 text-[9px] font-semibold disabled:opacity-50">Zmień e-mail</button>
                </div>

                <div className="flex min-h-[126px] flex-col rounded-lg border border-sky-400/20 bg-[#041d3a]/95 p-3">
                  <div className="flex gap-2.5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cyan-500/10 text-cyan-300">▢</span><div><b className="text-[10px]">Hasło</b><p className="mt-1 text-[8px] text-slate-300/60">••••••••••••</p></div></div>
                  <details className="mt-auto">
                    <summary className="cursor-pointer list-none rounded-md border border-sky-400/50 bg-blue-600/65 py-2 text-center text-[9px] font-semibold">Zmień hasło</summary>
                    <div className="mt-2 grid gap-1.5">
                      <input type="password" placeholder="Aktualne hasło" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} className="rounded-md border border-sky-400/20 bg-[#03182f] px-2 py-2 text-[9px] outline-none"/>
                      <input type="password" placeholder="Nowe hasło" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="rounded-md border border-sky-400/20 bg-[#03182f] px-2 py-2 text-[9px] outline-none"/>
                      <input type="password" placeholder="Powtórz hasło" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className="rounded-md border border-sky-400/20 bg-[#03182f] px-2 py-2 text-[9px] outline-none"/>
                      <button onClick={changePassword} disabled={savingPassword} className="rounded-md bg-blue-600 py-2 text-[9px] font-bold disabled:opacity-50">{savingPassword?t("saving"):"Zapisz nowe hasło"}</button>
                    </div>
                  </details>
                </div>

                <div className="flex min-h-[126px] flex-col rounded-lg border border-sky-400/20 bg-[#041d3a]/95 p-3">
                  <div className="flex gap-2.5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cyan-500/10 text-cyan-300">⠿</span><div><b className="text-[10px]">Kod PIN</b><p className="mt-1 text-[8px] leading-4 text-slate-300/60">Ustaw 4-cyfrowy kod PIN do szybkiego logowania.</p></div></div>
                  <button type="button" disabled title="Backend PIN nie jest jeszcze podłączony" className="mt-auto rounded-md border border-sky-400/45 bg-blue-600/55 py-2 text-[9px] font-semibold disabled:opacity-70">Ustaw PIN</button>
                </div>
              </div>
            </section>

            {/* APPEARANCE */}
            <section className="overflow-hidden rounded-xl border border-sky-400/30 bg-[linear-gradient(135deg,rgba(7,43,83,.97),rgba(3,28,58,.98))]">
              <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-500/10 text-cyan-300">▤</span><div><h2 className="text-[13px] font-semibold">Wygląd i język</h2><p className="text-[9px] text-slate-300/55">Dostosuj wygląd aplikacji do swoich preferencji.</p></div></div>
              <div className="grid gap-4 p-3 md:grid-cols-[1.2fr_.72fr_.82fr]">
                <div><p className="mb-2 text-[8px] text-slate-300/60">Motyw aplikacji</p><div className="grid grid-cols-3 gap-2">
                  {[["light","☼","Jasny"],["dark","☾","Ciemny"],["system","▣","System"]].map(([v,i,l])=><button key={v} onClick={()=>setTheme(v)} className={`rounded-lg border py-2 text-[8px] ${theme===v?"border-cyan-300 bg-sky-500/15 shadow-[0_0_12px_rgba(34,211,238,.35)]":"border-sky-400/20 bg-[#041d3a]"}`}><span className="block text-lg text-cyan-300">{i}</span>{l}</button>)}
                </div></div>
                <div><p className="mb-2 text-[8px] text-slate-300/60">Język</p><select value={language} onChange={e=>{const v=e.target.value as AppLanguage;setLanguage(v);setLang(v);localStorage.setItem("lang",v)}} className="w-full rounded-lg border border-sky-400/20 bg-[#041d3a] px-3 py-3 text-[9px]"><option value="pl">🇵🇱  Polski</option><option value="en">🇬🇧  English</option><option value="de">🇩🇪  Deutsch</option><option value="nl">🇳🇱  Nederlands</option><option value="es">🇪🇸  Español</option></select></div>
                <div><p className="mb-2 text-[8px] text-slate-300/60">Format ceny</p><div className="grid grid-cols-2 gap-2"><button type="button" className="rounded-lg border border-cyan-300 bg-sky-500/15 py-2 text-[8px] shadow-[0_0_12px_rgba(34,211,238,.35)]"><b>Standard</b><span className="block text-[7px] text-slate-300">1.23456</span></button><button type="button" className="rounded-lg border border-sky-400/20 bg-[#041d3a] py-2 text-[8px]">Z przecinkiem<span className="block text-[7px] text-slate-300">1,23456</span></button></div></div>
              </div>
              <div className="px-3 pb-3"><button onClick={saveProfile} disabled={loadingProfile} className="rounded-md bg-blue-600 px-3 py-2 text-[9px] font-semibold disabled:opacity-50">Zapisz preferencje</button></div>
            </section>

            {/* SUBSCRIPTION */}
            <section className="overflow-hidden rounded-xl border border-sky-400/30 bg-[linear-gradient(135deg,rgba(7,43,83,.97),rgba(3,28,58,.98))]">
              <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/15 text-emerald-300">★</span><div><h2 className="text-[13px] font-semibold">Subskrypcja</h2><p className="text-[9px] text-slate-300/55">Informacje o Twoim planie i płatnościach.</p></div></div>
              <div className="m-3 flex flex-col gap-3 rounded-lg border border-sky-400/20 bg-[#041d3a]/95 p-3 md:flex-row md:items-center">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-emerald-500/15 text-xl text-emerald-300">★</span>
                <div className="flex-1"><b className="text-[11px]">{isPremium?"Premium":"Premium wygasł"}</b><p className="text-[8px] text-slate-300/60">FX Trade Professional Trading</p><p className="mt-1 text-[8px]">Data odnowienia: <span className="text-cyan-300">{premiumDate}</span></p></div>
                <span className={`w-fit rounded-full border px-3 py-1 text-[8px] font-bold ${isPremium?"border-emerald-400/50 text-emerald-300":"border-rose-400/50 text-rose-300"}`}>♛ &nbsp; {subscriptionLabel}</span>
                {isPremium&&hasStripeSubscription?<button onClick={openBillingPortal} disabled={openingPortal} className="rounded-md border border-sky-400/60 px-3 py-2 text-[9px] disabled:opacity-50">▣ &nbsp; {openingPortal?"Otwieranie...":"Zarządzaj subskrypcją"}</button>:!isPremium?<button onClick={renewPremium} disabled={openingCheckout} className="rounded-md bg-emerald-600 px-3 py-2 text-[9px] disabled:opacity-50">{openingCheckout?"Przekierowanie...":"Odnów Premium"}</button>:null}
              </div>
            </section>

            {/* SECURITY */}
            <section className="overflow-hidden rounded-xl border border-sky-400/30 bg-[linear-gradient(135deg,rgba(7,43,83,.97),rgba(3,28,58,.98))]">
              <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-500/10 text-cyan-300">♢</span><div><h2 className="text-[13px] font-semibold">Bezpieczeństwo</h2><p className="text-[9px] text-slate-300/55">Zarządzaj bezpieczeństwem swojego konta.</p></div></div>
              <div className="grid gap-2.5 p-3 md:grid-cols-3">
                <div className="rounded-lg border border-sky-400/20 bg-[#041d3a]/95 p-3"><b className="text-[9px]">▣ &nbsp; Aktywne sesje</b><p className="mt-2 text-[8px] text-slate-300/60">1 aktywna sesja</p><p className="text-[7px] text-slate-400">To urządzenie →</p></div>
                <div className="rounded-lg border border-sky-400/20 bg-[#041d3a]/95 p-3"><b className="text-[9px]">♢ &nbsp; Dwuetapowe logowanie</b><p className="mt-2 text-[8px] text-slate-300/60">Dodatkowa ochrona konta</p><div className="mt-2 h-4 w-8 rounded-full bg-slate-500 p-0.5"><div className="h-3 w-3 rounded-full bg-white"/></div></div>
                <div className="rounded-lg border border-rose-400/20 bg-[#041d3a]/95 p-3"><b className="text-[9px]">⇥ &nbsp; Wyloguj ze wszystkich urządzeń</b><p className="mt-2 text-[8px] text-slate-300/60">Zakończ wszystkie aktywne sesje</p><button onClick={logoutAll} disabled={loggingOutAll} className="mt-2 w-full rounded-md border border-rose-500/60 bg-rose-500/10 py-2 text-[8px] text-rose-300 disabled:opacity-50">{loggingOutAll?t("loggingOut"):"Wyloguj wszędzie"}</button></div>
              </div>
            </section>

            {/* DANGER */}
            <section className="flex flex-col gap-3 rounded-xl border border-rose-500/60 bg-gradient-to-r from-rose-950/80 to-[#151533]/90 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full border border-rose-400/50 bg-rose-500/15 text-rose-300">!</span><div><b className="text-[10px] text-rose-300">{t("dangerZone")}</b><p className="text-[7px] text-rose-200/55">{t("dangerZoneDescription")}</p></div></div>
              <button onClick={()=>setDeleteOpen(true)} className="rounded-md border border-rose-500/70 px-4 py-2 text-[8px] font-semibold text-rose-300">▥ &nbsp; {t("deleteAccount")}</button>
            </section>
          </div>
        </div>
      </main>

      <DeleteAccountModal
        open={deleteOpen}
        password={
          deletePassword
        }
        confirmation={
          deleteConfirmation
        }
        deleting={
          deletingAccount
        }
        onClose={
          closeDeleteModal
        }
        onPasswordChange={
          setDeletePassword
        }
        onConfirmationChange={
          setDeleteConfirmation
        }
        onConfirm={
          deleteAccount
        }
      />


    </>
  );
}
