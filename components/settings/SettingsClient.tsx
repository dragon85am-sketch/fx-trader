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
    avatarUrl?: string | null;
    priceFormat?: string | null;

    isPremium?: boolean;
    premiumSince?: string | null;
    premiumUntil?: string | null;
    cancelAtPeriodEnd?: boolean;

    hasStripeCustomer?: boolean;
    hasStripeSubscription?: boolean;
    hasPin?: boolean;
    twoFactorEnabled?: boolean;
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
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
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

  const [priceFormat, setPriceFormat] = React.useState<"dot" | "comma">("dot");

  const previewTheme = (value: string) => {
    setTheme(value);
    const root = document.documentElement;
    const resolved = value === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : value;
    root.classList.remove("dark", "light", "system");
    root.classList.add(resolved);
    root.dataset.theme = value;
  };

  // =====================================================
  // SECURITY
  // =====================================================

  const [loggingOutAll, setLoggingOutAll] =
    React.useState(false);

  const [hasPin, setHasPin] = React.useState(false);
  const [pinOpen, setPinOpen] = React.useState(false);
  const [pinPassword, setPinPassword] = React.useState("");
  const [currentPin, setCurrentPin] = React.useState("");
  const [newPin, setNewPin] = React.useState("");
  const [confirmPin, setConfirmPin] = React.useState("");
  const [savingPin, setSavingPin] = React.useState(false);
  const [twoFactorEnabled,setTwoFactorEnabled]=React.useState(false);
  const [twoFactorOpen,setTwoFactorOpen]=React.useState(false);
  const [twoFactorStep,setTwoFactorStep]=React.useState<"password"|"verify"|"disable">("password");
  const [twoFactorPassword,setTwoFactorPassword]=React.useState("");
  const [twoFactorCode,setTwoFactorCode]=React.useState("");
  const [twoFactorSecret,setTwoFactorSecret]=React.useState("");
  const [twoFactorSaving,setTwoFactorSaving]=React.useState(false);


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
        setAvatarUrl(user.avatarUrl || "");
        const savedPriceFormat = user.priceFormat === "comma" ? "comma" : ((localStorage.getItem("priceFormat") === "comma") ? "comma" : "dot");
        setPriceFormat(savedPriceFormat);
        localStorage.setItem("priceFormat", savedPriceFormat);

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

        setHasPin(user.hasPin === true);
        setTwoFactorEnabled(user.twoFactorEnabled === true);
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

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.match(/^image\/(png|jpeg|webp)$/)) { toast.error("Wybierz zdjęcie PNG, JPG lub WEBP."); return; }
    if (file.size > 1_500_000) { toast.error("Zdjęcie może mieć maksymalnie 1,5 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => toast.error("Nie udało się wczytać zdjęcia.");
    reader.readAsDataURL(file);
  };

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
            avatarUrl,
            priceFormat,
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

      localStorage.setItem("priceFormat", priceFormat);
      window.dispatchEvent(new CustomEvent("fxtrade:price-format", { detail: priceFormat }));

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

  async function savePinSettings(action: "set" | "change" | "remove") {
    if (action !== "remove" && (!/^\d{4}$/.test(newPin) || newPin !== confirmPin)) {
      toast.error(newPin !== confirmPin ? "Kody PIN nie są takie same" : "PIN musi mieć 4 cyfry");
      return;
    }
    setSavingPin(true);
    try {
      const res = await fetch("/api/pin/manage", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ action, password: pinPassword, currentPin, newPin }) });
      const data = await res.json();
      if (!res.ok) { toast.error(data?.error || "Nie udało się zapisać PIN-u"); return; }
      toast.success(data?.message || "PIN zapisany");
      setHasPin(action !== "remove"); setPinOpen(false); setPinPassword(""); setCurrentPin(""); setNewPin(""); setConfirmPin("");
    } catch { toast.error("Problem z połączeniem z serwerem"); }
    finally { setSavingPin(false); }
  }

  async function startTwoFactor(){setTwoFactorSaving(true);try{const res=await fetch("/api/2fa/setup",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({password:twoFactorPassword})});const data=await res.json();if(!res.ok){toast.error(data?.error||"Nie udało się rozpocząć konfiguracji 2FA");return;}setTwoFactorSecret(data.secret);setTwoFactorStep("verify");setTwoFactorCode("");}finally{setTwoFactorSaving(false)}}
  async function enableTwoFactor(){if(!/^\d{6}$/.test(twoFactorCode)){toast.error("Wpisz 6-cyfrowy kod");return;}setTwoFactorSaving(true);try{const res=await fetch("/api/2fa/enable",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({code:twoFactorCode})});const data=await res.json();if(!res.ok){toast.error(data?.error||"Nieprawidłowy kod");return;}setTwoFactorEnabled(true);setTwoFactorOpen(false);setTwoFactorPassword("");setTwoFactorCode("");setTwoFactorSecret("");toast.success("Dwuetapowe logowanie zostało włączone");}finally{setTwoFactorSaving(false)}}
  async function disableTwoFactor(){if(!/^\d{6}$/.test(twoFactorCode)||!twoFactorPassword){toast.error("Podaj hasło i 6-cyfrowy kod");return;}setTwoFactorSaving(true);try{const res=await fetch("/api/2fa/disable",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({password:twoFactorPassword,code:twoFactorCode})});const data=await res.json();if(!res.ok){toast.error(data?.error||"Nie udało się wyłączyć 2FA");return;}setTwoFactorEnabled(false);setTwoFactorOpen(false);setTwoFactorPassword("");setTwoFactorCode("");toast.success("Dwuetapowe logowanie zostało wyłączone");}finally{setTwoFactorSaving(false)}}
  function openTwoFactor(){setTwoFactorPassword("");setTwoFactorCode("");setTwoFactorSecret("");setTwoFactorStep(twoFactorEnabled?"disable":"password");setTwoFactorOpen(true)}

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
                <button onClick={saveProfile} disabled={loadingProfile} className="rounded-md border border-cyan-300/70 bg-[linear-gradient(90deg,rgba(14,165,233,.24),rgba(37,99,235,.28))] px-4 py-2 text-[9px] font-bold text-white shadow-[0_0_18px_rgba(34,211,238,.25)] transition hover:border-cyan-200 hover:shadow-[0_0_25px_rgba(34,211,238,.42)] disabled:opacity-50">✓ &nbsp; {loadingProfile ? t("saving") : "Zapisz profil"}</button>
              </div>
              <div className="grid gap-5 px-4 py-4 md:grid-cols-[92px_1fr] md:items-center">
                <div className="relative mx-auto md:mx-0">
                  <button type="button" onClick={()=>avatarInputRef.current?.click()} className="group relative grid h-[82px] w-[82px] place-items-center overflow-hidden rounded-full border-2 border-cyan-300/75 bg-gradient-to-br from-blue-500 to-blue-700 text-xl font-bold shadow-[0_0_22px_rgba(34,211,238,.28)]" title="Zmień zdjęcie profilowe">
                    {avatarUrl ? <img src={avatarUrl} alt="Zdjęcie profilowe" className="h-full w-full object-cover" /> : <span>{initials}</span>}
                    <span className="absolute inset-0 grid place-items-center bg-slate-950/55 text-[10px] font-semibold opacity-0 transition group-hover:opacity-100">Zmień</span>
                  </button>
                  <button type="button" onClick={()=>avatarInputRef.current?.click()} className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border border-cyan-200 bg-[#0877d8] text-[12px] text-white shadow-[0_0_15px_rgba(34,211,238,.65)]" aria-label="Wybierz zdjęcie">✎</button>
                  <input ref={avatarInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarChange} className="hidden" />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block"><span className="mb-1 block text-[8px] font-medium uppercase tracking-[.12em] text-slate-400">Nazwa użytkownika</span><input value={name} onChange={e=>setName(e.target.value)} className="w-full rounded-lg border border-sky-400/25 bg-[#041d3a]/95 px-3 py-2.5 text-[11px] font-semibold outline-none transition focus:border-cyan-300 focus:shadow-[0_0_14px_rgba(34,211,238,.18)]" /></label>
                  <label className="block"><span className="mb-1 block text-[8px] font-medium uppercase tracking-[.12em] text-slate-400">E-mail</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-lg border border-sky-400/25 bg-[#041d3a]/95 px-3 py-2.5 text-[11px] text-slate-200 outline-none transition focus:border-cyan-300 focus:shadow-[0_0_14px_rgba(34,211,238,.18)]" /></label>
                  <div className="md:col-span-2 flex items-center gap-2 text-[9px] text-slate-400"><span className="rounded-full border border-sky-400/35 bg-sky-500/10 px-2 py-0.5 text-[7px] font-bold text-sky-300">{role}</span><span>Konto FX TRADE</span><span className="text-slate-600">•</span><span>Kliknij zdjęcie lub ołówek, aby je zmienić</span></div>
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
                  <button type="button" onClick={()=>setPinOpen(true)} className="mt-auto rounded-md border border-cyan-300/70 bg-blue-600/70 py-2 text-[9px] font-semibold shadow-[0_0_14px_rgba(34,211,238,.28)] hover:brightness-110">{hasPin ? "Zmień PIN" : "Ustaw PIN"}</button>
                </div>
              </div>
            </section>

            {/* APPEARANCE */}
            <section className="overflow-hidden rounded-xl border border-sky-400/30 bg-[linear-gradient(135deg,rgba(7,43,83,.97),rgba(3,28,58,.98))]">
              <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-500/10 text-cyan-300">▤</span><div><h2 className="text-[13px] font-semibold">Wygląd i język</h2><p className="text-[9px] text-slate-300/55">Dostosuj wygląd aplikacji do swoich preferencji.</p></div></div>
              <div className="grid gap-4 p-3 md:grid-cols-[1.2fr_.72fr_.82fr]">
                <div><p className="mb-2 text-[8px] text-slate-300/60">Motyw aplikacji</p><div className="grid grid-cols-3 gap-2">
                  {[["light","☼","Jasny"],["dark","☾","Ciemny"],["system","▣","System"]].map(([v,i,l])=><button key={v} onClick={()=>previewTheme(v)} className={`rounded-lg border py-2 text-[8px] ${theme===v?"border-cyan-300 bg-sky-500/15 shadow-[0_0_12px_rgba(34,211,238,.35)]":"border-sky-400/20 bg-[#041d3a]"}`}><span className="block text-lg text-cyan-300">{i}</span>{l}</button>)}
                </div></div>
                <div><p className="mb-2 text-[8px] text-slate-300/60">Język</p><select value={language} onChange={e=>{const v=e.target.value as AppLanguage;setLanguage(v);setLang(v);localStorage.setItem("lang",v)}} className="w-full rounded-lg border border-sky-400/20 bg-[#041d3a] px-3 py-3 text-[9px]"><option value="pl">🇵🇱  Polski</option><option value="en">🇬🇧  English</option><option value="de">🇩🇪  Deutsch</option><option value="nl">🇳🇱  Nederlands</option><option value="es">🇪🇸  Español</option></select></div>
                <div><p className="mb-2 text-[8px] text-slate-300/60">Format ceny</p><div className="grid grid-cols-2 gap-2"><button type="button" onClick={()=>setPriceFormat("dot")} className={`rounded-lg border py-2 text-[8px] transition ${priceFormat==="dot"?"border-cyan-300 bg-sky-500/15 shadow-[0_0_16px_rgba(34,211,238,.45)]":"border-sky-400/20 bg-[#041d3a] hover:border-cyan-400/50"}`}><b>Standard</b><span className="block text-[7px] text-slate-300">1.23456</span></button><button type="button" onClick={()=>setPriceFormat("comma")} className={`rounded-lg border py-2 text-[8px] transition ${priceFormat==="comma"?"border-cyan-300 bg-sky-500/15 shadow-[0_0_16px_rgba(34,211,238,.45)]":"border-sky-400/20 bg-[#041d3a] hover:border-cyan-400/50"}`}>Z przecinkiem<span className="block text-[7px] text-slate-300">1,23456</span></button></div></div>
              </div>
              <div className="px-3 pb-3"><button onClick={saveProfile} disabled={loadingProfile} className="rounded-md border border-cyan-300/60 bg-[linear-gradient(90deg,#0284c7,#2563eb)] px-4 py-2 text-[9px] font-semibold shadow-[0_0_18px_rgba(34,211,238,.35)] transition hover:brightness-110 disabled:opacity-50">Zapisz preferencje</button></div>
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
                <div className="rounded-lg border border-sky-400/20 bg-[#041d3a]/95 p-3"><b className="text-[9px]">♢ &nbsp; Dwuetapowe logowanie</b><p className="mt-2 text-[8px] text-slate-300/60">{twoFactorEnabled ? "Aktywne — Authenticator" : "Dodatkowa ochrona konta"}</p><button type="button" onClick={openTwoFactor} className={`mt-3 flex h-5 w-10 items-center rounded-full border p-0.5 transition-all ${twoFactorEnabled?"justify-end border-emerald-300 bg-emerald-500/60 shadow-[0_0_14px_rgba(52,211,153,.4)]":"justify-start border-slate-500 bg-slate-600"}`}><span className="h-3.5 w-3.5 rounded-full bg-white shadow"/></button></div>
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

      {twoFactorOpen ? (
        <div className="fixed inset-0 z-[110] grid place-items-center bg-black/75 p-4 backdrop-blur-sm"><div className="w-full max-w-[460px] rounded-2xl border border-cyan-400/60 bg-[#041a35] p-6 shadow-[0_0_45px_rgba(34,211,238,.25)]"><div className="flex items-center justify-between"><div><h3 className="text-lg font-bold">{twoFactorEnabled?"Wyłącz 2FA":"Dwuetapowe logowanie"}</h3><p className="mt-1 text-xs text-slate-400">Google Authenticator / Microsoft Authenticator</p></div><button onClick={()=>setTwoFactorOpen(false)} className="text-xl text-slate-400">×</button></div>
        {twoFactorStep==="password"?<div className="mt-5 grid gap-3"><p className="text-sm text-slate-300">Potwierdź hasło do konta, aby rozpocząć konfigurację.</p><input type="password" value={twoFactorPassword} onChange={e=>setTwoFactorPassword(e.target.value)} placeholder="Hasło do konta" className="rounded-xl border border-sky-400/30 bg-[#03142b] px-4 py-3 outline-none focus:border-cyan-300"/><button disabled={twoFactorSaving} onClick={startTwoFactor} className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 font-bold shadow-[0_0_20px_rgba(34,211,238,.30)] disabled:opacity-50">Dalej</button></div>:null}
        {twoFactorStep==="verify"?<div className="mt-5 grid gap-3"><p className="text-sm text-slate-300">W aplikacji Authenticator wybierz dodanie konta przez <b>klucz konfiguracji</b> i wpisz poniższy sekret:</p><div className="select-all break-all rounded-xl border border-cyan-400/30 bg-[#03142b] p-4 text-center font-mono text-sm tracking-wider text-cyan-300">{twoFactorSecret}</div><p className="text-xs text-slate-400">Typ klucza: czasowy (TOTP). Następnie wpisz wygenerowany 6-cyfrowy kod.</p><input inputMode="numeric" maxLength={6} value={twoFactorCode} onChange={e=>setTwoFactorCode(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="000000" className="rounded-xl border border-sky-400/30 bg-[#03142b] px-4 py-3 text-center text-xl tracking-[.35em] outline-none focus:border-cyan-300"/><button disabled={twoFactorSaving} onClick={enableTwoFactor} className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 font-bold shadow-[0_0_20px_rgba(34,211,238,.30)] disabled:opacity-50">Włącz 2FA</button></div>:null}
        {twoFactorStep==="disable"?<div className="mt-5 grid gap-3"><p className="text-sm text-slate-300">Aby wyłączyć 2FA, potwierdź hasło oraz aktualny kod z aplikacji Authenticator.</p><input type="password" value={twoFactorPassword} onChange={e=>setTwoFactorPassword(e.target.value)} placeholder="Hasło do konta" className="rounded-xl border border-sky-400/30 bg-[#03142b] px-4 py-3 outline-none"/><input inputMode="numeric" maxLength={6} value={twoFactorCode} onChange={e=>setTwoFactorCode(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="Kod 2FA" className="rounded-xl border border-sky-400/30 bg-[#03142b] px-4 py-3 text-center text-xl tracking-[.35em] outline-none"/><button disabled={twoFactorSaving} onClick={disableTwoFactor} className="rounded-xl border border-rose-500/60 bg-rose-500/10 py-3 font-semibold text-rose-300 disabled:opacity-50">Wyłącz 2FA</button></div>:null}
        </div></div>
      ) : null}

      {pinOpen ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[420px] rounded-2xl border border-cyan-400/50 bg-[#041a35] p-5 shadow-[0_0_45px_rgba(34,211,238,.22)]">
            <div className="flex items-center justify-between"><div><h3 className="text-lg font-bold">{hasPin ? "Zmień kod PIN" : "Ustaw kod PIN"}</h3><p className="mt-1 text-xs text-slate-400">4-cyfrowy kod do szybkiego logowania.</p></div><button onClick={()=>setPinOpen(false)} className="text-xl text-slate-400">×</button></div>
            <div className="mt-5 grid gap-3">
              {hasPin ? <input inputMode="numeric" maxLength={4} value={currentPin} onChange={e=>setCurrentPin(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="Aktualny PIN" className="rounded-xl border border-sky-400/30 bg-[#03142b] px-4 py-3 outline-none focus:border-cyan-300"/> : <input type="password" value={pinPassword} onChange={e=>setPinPassword(e.target.value)} placeholder="Hasło do konta" className="rounded-xl border border-sky-400/30 bg-[#03142b] px-4 py-3 outline-none focus:border-cyan-300"/>}
              <input inputMode="numeric" maxLength={4} value={newPin} onChange={e=>setNewPin(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="Nowy 4-cyfrowy PIN" className="rounded-xl border border-sky-400/30 bg-[#03142b] px-4 py-3 outline-none focus:border-cyan-300"/>
              <input inputMode="numeric" maxLength={4} value={confirmPin} onChange={e=>setConfirmPin(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="Powtórz nowy PIN" className="rounded-xl border border-sky-400/30 bg-[#03142b] px-4 py-3 outline-none focus:border-cyan-300"/>
              <button disabled={savingPin} onClick={()=>savePinSettings(hasPin ? "change" : "set")} className="rounded-xl border border-cyan-300/70 bg-gradient-to-r from-cyan-500 to-blue-600 py-3 font-bold shadow-[0_0_20px_rgba(34,211,238,.30)] disabled:opacity-50">{savingPin ? "Zapisywanie..." : hasPin ? "Zmień PIN" : "Ustaw PIN"}</button>
              {hasPin ? <><div className="my-1 h-px bg-white/10"/><input type="password" value={pinPassword} onChange={e=>setPinPassword(e.target.value)} placeholder="Hasło do konta — wymagane do usunięcia PIN" className="rounded-xl border border-rose-400/25 bg-[#03142b] px-4 py-3 outline-none"/><button disabled={savingPin} onClick={()=>savePinSettings("remove")} className="rounded-xl border border-rose-500/60 bg-rose-500/10 py-3 font-semibold text-rose-300">Usuń PIN</button></> : null}
            </div>
          </div>
        </div>
      ) : null}

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
