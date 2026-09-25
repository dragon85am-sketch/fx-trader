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
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "linear-gradient(rgba(2,8,23,.66),rgba(2,8,23,.82)),url('/ustawienia-bg.png')" }} />
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(circle_at_55%_0%,rgba(14,165,233,.16),transparent_42%)]" />

        <div className="relative z-10 mx-auto w-full max-w-[1160px] px-4 py-7 md:px-7">
          <header className="mb-6">
            <h1 className="text-[30px] font-bold tracking-tight">{t("settings")}</h1>
            <p className="mt-1 text-sm text-slate-300/70">Zarządzaj swoim kontem, bezpieczeństwem i preferencjami aplikacji.</p>
          </header>

          <section className="space-y-3.5">
            <div className="rounded-[14px] border border-sky-400/35 bg-[linear-gradient(135deg,rgba(7,42,81,.97),rgba(4,29,59,.98))] p-5 shadow-[0_0_28px_rgba(14,165,233,.10)]">
              <div className="flex items-center justify-between border-b border-sky-300/15 pb-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-500/15 text-cyan-300">♙</div>
                  <div><h2 className="font-semibold">Profil użytkownika</h2><p className="text-xs text-slate-300/60">Twoje dane widoczne w aplikacji.</p></div>
                </div>
                <span className="rounded-full border border-sky-400/30 px-3 py-1 text-[10px] font-bold text-sky-300">{role}</span>
              </div>
              <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-center">
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full border border-cyan-400/60 bg-gradient-to-br from-blue-500 to-blue-700 text-2xl font-bold shadow-[0_0_24px_rgba(14,165,233,.22)]">{initials}</div>
                <div className="min-w-0 flex-1">
                  <input value={name} onChange={e=>setName(e.target.value)} className="mb-2 w-full max-w-md rounded-lg border border-sky-400/20 bg-[#041d3a] px-3 py-2 font-semibold outline-none focus:border-cyan-400/60" />
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full max-w-md rounded-lg border border-sky-400/20 bg-[#041d3a] px-3 py-2 text-sm text-slate-300 outline-none focus:border-cyan-400/60" />
                </div>
                <button onClick={saveProfile} disabled={loadingProfile} className="rounded-lg border border-cyan-400/60 bg-sky-500/10 px-5 py-2.5 text-sm font-semibold hover:bg-sky-500/20 disabled:opacity-50">{loadingProfile ? t("saving") : "Edytuj / zapisz profil"}</button>
              </div>
            </div>

            <div className="rounded-[14px] border border-sky-400/35 bg-[linear-gradient(135deg,rgba(7,42,81,.97),rgba(4,29,59,.98))] p-5">
              <div className="mb-4 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-500/15 text-cyan-300">▣</div><div><h2 className="font-semibold">Konto i logowanie</h2><p className="text-xs text-slate-300/60">Zarządzaj e-mailem i hasłem.</p></div></div>
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-[11px] border border-sky-400/20 bg-[#041d3a]/90 p-4">
                  <div className="mb-3 text-sm font-semibold">E-mail</div><div className="truncate text-xs text-slate-300/70">{email}</div>
                </div>
                <div className="rounded-[11px] border border-sky-400/20 bg-[#041d3a]/90 p-4">
                  <div className="mb-3 text-sm font-semibold">Hasło</div>
                  <div className="grid gap-2 md:grid-cols-3">
                    <input type="password" placeholder="Aktualne hasło" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} className="rounded-lg border border-sky-400/20 bg-[#03182f] px-3 py-2 text-xs outline-none"/>
                    <input type="password" placeholder="Nowe hasło" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="rounded-lg border border-sky-400/20 bg-[#03182f] px-3 py-2 text-xs outline-none"/>
                    <input type="password" placeholder="Powtórz hasło" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className="rounded-lg border border-sky-400/20 bg-[#03182f] px-3 py-2 text-xs outline-none"/>
                  </div>
                  <button onClick={changePassword} disabled={savingPassword} className="mt-3 rounded-lg bg-gradient-to-r from-blue-600 to-sky-500 px-4 py-2 text-xs font-bold disabled:opacity-50">{savingPassword ? t("saving") : "Zmień hasło"}</button>
                </div>
              </div>
            </div>

            <div className="rounded-[14px] border border-sky-400/35 bg-[linear-gradient(135deg,rgba(7,42,81,.97),rgba(4,29,59,.98))] p-5">
              <div className="mb-4 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-500/15 text-cyan-300">▤</div><div><h2 className="font-semibold">Wygląd i język</h2><p className="text-xs text-slate-300/60">Dostosuj wygląd aplikacji do swoich preferencji.</p></div></div>
              <div className="grid gap-4 md:grid-cols-2">
                <div><label className="mb-2 block text-xs text-slate-300/70">Motyw aplikacji</label><div className="grid grid-cols-3 gap-2">
                  {["light","dark","system"].map(v=><button key={v} onClick={()=>setTheme(v)} className={`rounded-xl border px-3 py-3 text-xs ${theme===v?"border-cyan-300 bg-sky-500/20 shadow-[0_0_16px_rgba(34,211,238,.18)]":"border-sky-400/20 bg-[#041d3a]"}`}>{v==="light"?"Jasny":v==="dark"?"Ciemny":"System"}</button>)}
                </div></div>
                <div><label className="mb-2 block text-xs text-slate-300/70">Język</label><select value={language} onChange={e=>{const v=e.target.value as AppLanguage;setLanguage(v);setLang(v);localStorage.setItem("lang",v)}} className="w-full rounded-[10px] border border-sky-400/20 bg-[#041d3a] px-3 py-3 text-sm"><option value="pl">🇵🇱 Polski</option><option value="en">English</option><option value="de">Deutsch</option><option value="nl">Nederlands</option><option value="es">Español</option></select></div>
              </div>
              <button onClick={saveProfile} disabled={loadingProfile} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold disabled:opacity-50">Zapisz preferencje</button>
            </div>

            <div className="rounded-[14px] border border-sky-400/35 bg-[linear-gradient(135deg,rgba(7,42,81,.97),rgba(4,29,59,.98))] p-5">
              <div className="mb-4 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-300">★</div><div><h2 className="font-semibold">Subskrypcja</h2><p className="text-xs text-slate-300/60">Informacje o Twoim planie i płatnościach.</p></div></div>
              <div className="flex flex-col gap-4 rounded-[11px] border border-sky-400/20 bg-[#041d3a]/90 p-4 md:flex-row md:items-center md:justify-between">
                <div><div className="text-lg font-semibold">{isPremium ? "Premium" : "Premium wygasł"}</div><div className="mt-1 text-xs text-slate-300/65">{isPremium ? (cancelAtPeriodEnd ? `Dostęp aktywny do: ${premiumDate}` : `Data odnowienia: ${premiumDate}`) : "Odnów dostęp do funkcji Premium."}</div></div>
                <span className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${isPremium?"border-emerald-400/50 text-emerald-300":"border-rose-400/50 text-rose-300"}`}>{subscriptionLabel}</span>
                {isPremium && hasStripeSubscription ? <button onClick={openBillingPortal} disabled={openingPortal} className="rounded-lg border border-cyan-400/50 px-4 py-2 text-xs font-semibold disabled:opacity-50">{openingPortal?"Otwieranie...":"Zarządzaj subskrypcją"}</button> : !isPremium ? <button onClick={renewPremium} disabled={openingCheckout} className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold disabled:opacity-50">{openingCheckout?"Przekierowanie...":"Odnów Premium — 99 € / mies."}</button> : null}
              </div>
            </div>

            <div className="rounded-[14px] border border-sky-400/35 bg-[linear-gradient(135deg,rgba(7,42,81,.97),rgba(4,29,59,.98))] p-5">
              <div className="mb-4 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-500/15 text-cyan-300">♢</div><div><h2 className="font-semibold">Bezpieczeństwo</h2><p className="text-xs text-slate-300/60">Zarządzaj bezpieczeństwem swojego konta.</p></div></div>
              <div className="rounded-[11px] border border-sky-400/20 bg-[#041d3a]/90 p-4"><div className="font-semibold">Aktywne sesje</div><div className="mt-1 text-xs text-slate-300/60">Wyloguj konto ze wszystkich przeglądarek i urządzeń.</div></div>
              <button onClick={logoutAll} disabled={loggingOutAll} className="mt-3 rounded-lg border border-rose-400/50 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-300 disabled:opacity-50">{loggingOutAll?t("loggingOut"):t("logoutAll")}</button>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-rose-500/50 bg-gradient-to-r from-rose-950/75 to-[#06254a]/90 p-5 md:flex-row md:items-center md:justify-between">
              <div><h2 className="font-semibold text-rose-300">{t("dangerZone")}</h2><p className="mt-1 text-xs text-rose-200/55">{t("dangerZoneDescription")}</p></div>
              <button onClick={()=>setDeleteOpen(true)} className="rounded-lg border border-rose-500/60 bg-rose-600/20 px-5 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-600/30">{t("deleteAccount")}</button>
            </div>
          </section>
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
