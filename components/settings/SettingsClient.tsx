"use client";

import React from "react";
import { toast } from "sonner";
import DeleteAccountModal from "@/components/settings/DeleteAccountModal";
import { useLanguage } from "@/components/LanguageProvider";

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
  const { t, setLang } = useLanguage();

  // =====================================================
  // PROFILE
  // =====================================================

  const [name, setName] = React.useState("");
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
    React.useState<"pl" | "en">("pl");

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

        setRole(
          (user.role || "user").toUpperCase()
        );

        setTheme(
          user.theme || "dark"
        );

        const dbLanguage =
          user.language === "en"
            ? "en"
            : "pl";

        setLanguage(dbLanguage);
        setLang(dbLanguage);

        localStorage.setItem(
          "lang",
          dbLanguage
        );

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
  }, [setLang]);

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
      "pl-PL",
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

      setTimeout(() => {
        window.location.reload();
      }, 200);
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

  return (
    <>
      <main className="relative isolate min-h-screen overflow-hidden bg-[#020817] text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "linear-gradient(rgba(2,8,23,.40), rgba(2,8,23,.66)), url('/ustawienia-bg.png')",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(circle_at_50%_8%,rgba(34,211,238,.14),transparent_46%)]"
        />

        <div className="relative z-10 mx-auto w-full max-w-[1900px] space-y-4 px-4 py-5 md:px-6 xl:px-8">

          {/* HEADER */}

          <section className="relative overflow-hidden rounded-[16px] border border-sky-400/35 bg-[linear-gradient(120deg,#125b9b_0%,#0c477f_52%,#082f5d_100%)] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,.035)]">

            <div className="pointer-events-none absolute right-[8%] top-0 h-full w-[34%] opacity-[.12] [background-image:radial-gradient(circle,#38bdf8_1px,transparent_1px)] [background-size:7px_7px] [mask-image:radial-gradient(ellipse_at_center,black_0%,transparent_72%)]" />

            <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>

                <div className="text-[9px] font-semibold uppercase tracking-[.18em] text-sky-200/60">
                  FX TRADE / SYSTEM
                </div>

                <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-white">
                  {t("settings")}
                </h1>

                <p className="mt-1 text-[11px] text-sky-100/50">
                  {t(
                    "settingsDescription"
                  )}
                </p>

              </div>

              <div className="flex items-center gap-3 rounded-[12px] border border-sky-400/35 bg-[#0a4175]/85 px-4 py-3 shadow-[0_0_20px_rgba(56,189,248,.10)]">

                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-sky-400/35 bg-[#075ecb] text-[12px] font-bold text-white">

                  {(name || "U")
                    .slice(0, 2)
                    .toUpperCase()}

                </div>

                <div>

                  <div className="text-[11px] font-semibold text-white">
                    {name ||
                      "Użytkownik"}
                  </div>

                  <div className="mt-0.5 text-[8px] uppercase tracking-[.12em] text-sky-200/45">
                    {role}
                  </div>

                </div>

              </div>

            </div>

          </section>

          {/* SETTINGS GRID */}

          <section className="grid gap-4 xl:grid-cols-2">

            {/* PROFILE */}

            <div className="rounded-[15px] border border-sky-400/35 bg-[linear-gradient(145deg,#0d4d87_0%,#093b6e_55%,#062d58_100%)] p-5 shadow-[0_0_28px_rgba(14,165,233,.14),inset_0_1px_0_rgba(255,255,255,.07)]">

              <div className="flex items-start justify-between gap-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-sky-400/25 bg-sky-500/10 text-lg text-sky-300">
                    ◉
                  </div>

                  <div>

                    <h2 className="text-[16px] font-semibold text-white">
                      {t("profile")}
                    </h2>

                    <p className="mt-1 text-[9px] text-sky-100/40">
                      Dane widoczne w Twoim panelu FX Trade.
                    </p>

                  </div>

                </div>

                <span className="rounded-full border border-sky-400/25 bg-sky-500/10 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[.12em] text-sky-300">
                  {role}
                </span>

              </div>

              <div className="mt-5">

                <label className="text-[9px] font-semibold uppercase tracking-[.12em] text-sky-100/45">
                  {t("name")}
                </label>

                <input
                  value={name}
                  onChange={(e) =>
                    setName(
                      e.target.value
                    )
                  }
                  className="mt-2 w-full rounded-[9px] border border-sky-400/25 bg-[#062b52] px-3 py-3 text-[11px] text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/10"
                />

              </div>

              <button
                type="button"
                onClick={saveProfile}
                disabled={
                  loadingProfile
                }
                className="mt-4 inline-flex items-center justify-center rounded-[9px] border border-sky-300/20 bg-[linear-gradient(90deg,#075ECB,#0B8FE4)] px-4 py-2.5 text-[10px] font-bold text-white shadow-[0_0_18px_rgba(14,165,233,.12)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingProfile
                  ? t("saving")
                  : t(
                      "saveProfile"
                    )}
              </button>

            </div>

            {/* PASSWORD */}

            <div className="rounded-[15px] border border-sky-400/35 bg-[linear-gradient(145deg,#0d4d87_0%,#093b6e_55%,#062d58_100%)] p-5 shadow-[0_0_28px_rgba(14,165,233,.14),inset_0_1px_0_rgba(255,255,255,.07)]">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-sky-400/25 bg-sky-500/10 text-lg text-sky-300">
                  ◈
                </div>

                <div>

                  <h2 className="text-[16px] font-semibold text-white">
                    {t(
                      "changePassword"
                    )}
                  </h2>

                  <p className="mt-1 text-[9px] text-sky-100/40">
                    Zabezpiecz konto silnym i unikalnym hasłem.
                  </p>

                </div>

              </div>

              <div className="mt-5 grid gap-3">

                <div>

                  <label className="text-[9px] font-semibold uppercase tracking-[.1em] text-sky-100/45">
                    {t(
                      "currentPassword"
                    )}
                  </label>

                  <input
                    type="password"
                    value={
                      currentPassword
                    }
                    onChange={(e) =>
                      setCurrentPassword(
                        e.target.value
                      )
                    }
                    className="mt-2 w-full rounded-[9px] border border-sky-400/25 bg-[#062b52] px-3 py-3 text-[11px] text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/10"
                  />

                </div>

                <div className="grid gap-3 md:grid-cols-2">

                  <div>

                    <label className="text-[9px] font-semibold uppercase tracking-[.1em] text-sky-100/45">
                      {t(
                        "newPassword"
                      )}
                    </label>

                    <input
                      type="password"
                      value={
                        newPassword
                      }
                      onChange={(e) =>
                        setNewPassword(
                          e.target.value
                        )
                      }
                      className="mt-2 w-full rounded-[9px] border border-sky-400/25 bg-[#062b52] px-3 py-3 text-[11px] text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/10"
                    />

                  </div>

                  <div>

                    <label className="text-[9px] font-semibold uppercase tracking-[.1em] text-sky-100/45">
                      {t(
                        "confirmPassword"
                      )}
                    </label>

                    <input
                      type="password"
                      value={
                        confirmPassword
                      }
                      onChange={(e) =>
                        setConfirmPassword(
                          e.target.value
                        )
                      }
                      className="mt-2 w-full rounded-[9px] border border-sky-400/25 bg-[#062b52] px-3 py-3 text-[11px] text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/10"
                    />

                  </div>

                </div>

              </div>

              <button
                type="button"
                onClick={
                  changePassword
                }
                disabled={
                  savingPassword
                }
                className="mt-4 w-full rounded-[9px] border border-sky-300/20 bg-[linear-gradient(90deg,#075ECB,#0B8FE4)] px-4 py-2.5 text-[10px] font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingPassword
                  ? t("saving")
                  : t(
                      "changePasswordButton"
                    )}
              </button>

            </div>

            {/* PREFERENCES */}

            <div className="rounded-[15px] border border-sky-400/35 bg-[linear-gradient(145deg,#0d4d87_0%,#093b6e_55%,#062d58_100%)] p-5 shadow-[0_0_28px_rgba(14,165,233,.14),inset_0_1px_0_rgba(255,255,255,.07)]">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-cyan-400/25 bg-cyan-500/10 text-lg text-cyan-300">
                  ⚙
                </div>

                <div>

                  <h2 className="text-[16px] font-semibold text-white">
                    {t(
                      "preferences"
                    )}
                  </h2>

                  <p className="mt-1 text-[9px] text-sky-100/40">
                    Dopasuj wygląd i język aplikacji.
                  </p>

                </div>

              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">

                <div>

                  <label className="text-[9px] font-semibold uppercase tracking-[.1em] text-sky-100/45">
                    {t("theme")}
                  </label>

                  <select
                    value={theme}
                    onChange={(e) =>
                      setTheme(
                        e.target.value
                      )
                    }
                    className="mt-2 w-full rounded-[9px] border border-sky-400/25 bg-[#062b52] px-3 py-3 text-[11px] text-white outline-none"
                  >
                    <option value="dark">
                      {t(
                        "themeDark"
                      )}
                    </option>

                    <option value="light">
                      {t(
                        "themeLight"
                      )}
                    </option>

                    <option value="system">
                      {t(
                        "themeSystem"
                      )}
                    </option>
                  </select>

                </div>

                <div>

                  <label className="text-[9px] font-semibold uppercase tracking-[.1em] text-sky-100/45">
                    {t(
                      "language"
                    )}
                  </label>

                  <select
                    value={language}
                    onChange={(e) => {
                      const newLang =
                        e.target.value as
                          | "pl"
                          | "en";

                      setLanguage(
                        newLang
                      );

                      setLang(
                        newLang
                      );

                      localStorage.setItem(
                        "lang",
                        newLang
                      );
                    }}
                    className="mt-2 w-full rounded-[9px] border border-sky-400/25 bg-[#062b52] px-3 py-3 text-[11px] text-white outline-none"
                  >
                    <option value="pl">
                      Polski
                    </option>

                    <option value="en">
                      English
                    </option>
                  </select>

                </div>

              </div>

              <button
                type="button"
                onClick={saveProfile}
                disabled={
                  loadingProfile
                }
                className="mt-4 inline-flex items-center justify-center rounded-[9px] border border-sky-300/20 bg-[#075ecb] px-4 py-2.5 text-[10px] font-bold text-white transition hover:bg-[#0b76e0] disabled:opacity-60"
              >
                {loadingProfile
                  ? t("saving")
                  : t(
                      "savePreferences"
                    )}
              </button>

            </div>

            {/* SUBSCRIPTION */}

            <div
              className={`rounded-[15px] border p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.07)] ${
                isPremium && cancelAtPeriodEnd
                  ? "border-amber-400/40 bg-[linear-gradient(145deg,#69440b_0%,#54410b_20%,#093b6e_65%,#062d58_100%)] shadow-[0_0_30px_rgba(245,158,11,.10)]"
                  : isPremium
                    ? "border-emerald-400/30 bg-[linear-gradient(145deg,#0c5674_0%,#094774_45%,#062d58_100%)] shadow-[0_0_30px_rgba(16,185,129,.08)]"
                    : "border-rose-400/25 bg-[linear-gradient(145deg,#4e2533_0%,#243b61_45%,#062d58_100%)] shadow-[0_0_30px_rgba(244,63,94,.06)]"
              }`}
            >

              <div className="flex items-start justify-between gap-4">

                <div className="flex items-center gap-3">

                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-[10px] border text-lg ${
                      isPremium && cancelAtPeriodEnd
                        ? "border-amber-400/30 bg-amber-500/10 text-amber-300"
                        : isPremium
                          ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
                          : "border-rose-400/25 bg-rose-500/10 text-rose-300"
                    }`}
                  >
                    ★
                  </div>

                  <div>

                    <h2 className="text-[16px] font-semibold text-white">
                      Subskrypcja Premium
                    </h2>

                    <p className="mt-1 text-[9px] text-sky-100/45">
                      FX Trade Professional Trading
                    </p>

                  </div>

                </div>

                <span
                  className={`rounded-full border px-3 py-1 text-[8px] font-black uppercase tracking-[.12em] ${
                    isPremium && cancelAtPeriodEnd
                      ? "border-amber-400/30 bg-amber-500/10 text-amber-300"
                      : isPremium
                        ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
                        : "border-rose-400/25 bg-rose-500/10 text-rose-300"
                  }`}
                >
                  {subscriptionLabel}
                </span>

              </div>

              <div className="mt-5 rounded-[11px] border border-white/10 bg-[#062b52]/80 p-4">

                {isPremium ? (
                  <>
                    <div className="text-[11px] font-semibold text-white">

                      {cancelAtPeriodEnd
                        ? "Premium pozostaje aktywne"
                        : "Premium aktywne"}

                    </div>

                    <div className="mt-2 text-[10px] leading-5 text-sky-100/55">

                      {cancelAtPeriodEnd ? (
                        <>
                          Subskrypcja została anulowana.
                          Dostęp do platformy pozostanie aktywny do{" "}
                          <span className="font-bold text-amber-300">
                            {premiumDate}
                          </span>
                          .
                        </>
                      ) : (
                        <>
                          Następne odnowienie planu:{" "}
                          <span className="font-bold text-emerald-300">
                            {premiumDate}
                          </span>
                          .
                        </>
                      )}

                    </div>

                    {cancelAtPeriodEnd && (
                      <div className="mt-3 rounded-[9px] border border-amber-400/20 bg-amber-500/[0.07] px-3 py-2.5 text-[9px] leading-4 text-amber-200">

                        Automatyczne odnowienie jest wyłączone.
                        Stripe nie pobierze kolejnej płatności,
                        chyba że ponownie aktywujesz subskrypcję.

                      </div>
                    )}

                  </>
                ) : (
                  <>
                    <div className="text-[11px] font-semibold text-white">
                      Dostęp Premium wygasł
                    </div>

                    <div className="mt-2 text-[9px] leading-4 text-sky-100/45">
                      Odnów subskrypcję, aby odzyskać dostęp do
                      Dashboardu, skanerów, strategii i pozostałych
                      funkcji Premium.
                    </div>

                    <div className="mt-3 rounded-[9px] border border-rose-400/20 bg-rose-500/[0.06] px-3 py-2.5 text-[9px] leading-4 text-rose-200">
                      Wymagana jest nowa płatność Stripe.
                    </div>
                  </>
                )}

              </div>

              {isPremium && hasStripeSubscription ? (
                <button
                  type="button"
                  onClick={
                    openBillingPortal
                  }
                  disabled={
                    openingPortal
                  }
                  className="mt-4 w-full rounded-[9px] border border-sky-300/20 bg-[linear-gradient(90deg,#075ECB,#0B8FE4)] px-4 py-2.5 text-[10px] font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {openingPortal
                    ? "Otwieranie Stripe..."
                    : cancelAtPeriodEnd
                      ? "Zarządzaj / Wznów subskrypcję"
                      : "Zarządzaj subskrypcją"}
                </button>
              ) : !isPremium ? (
                <button
                  type="button"
                  onClick={
                    renewPremium
                  }
                  disabled={
                    openingCheckout
                  }
                  className="mt-4 w-full rounded-[9px] border border-emerald-300/20 bg-[linear-gradient(90deg,#059669,#10b981)] px-4 py-3 text-[10px] font-black text-white shadow-[0_0_20px_rgba(16,185,129,.12)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {openingCheckout
                    ? "Przekierowanie do Stripe..."
                    : "Odnów Premium — 99 € / mies."}
                </button>
              ) : null}

            </div>

            {/* SECURITY */}

            <div className="rounded-[15px] border border-sky-400/35 bg-[linear-gradient(145deg,#0d4d87_0%,#093b6e_55%,#062d58_100%)] p-5 shadow-[0_0_28px_rgba(14,165,233,.14),inset_0_1px_0_rgba(255,255,255,.07)]">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-emerald-400/20 bg-emerald-500/10 text-lg text-emerald-300">
                  ⛨
                </div>

                <div>

                  <h2 className="text-[16px] font-semibold text-white">
                    {t(
                      "security"
                    )}
                  </h2>

                  <p className="mt-1 text-[9px] text-sky-100/40">
                    {t(
                      "securityDescription"
                    )}
                  </p>

                </div>

              </div>

              <div className="mt-5 rounded-[10px] border border-sky-400/25 bg-[#062b52] p-4">

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                  <div>

                    <div className="text-[11px] font-semibold text-white">
                      Aktywne sesje
                    </div>

                    <div className="mt-1 text-[9px] leading-4 text-sky-100/40">
                      Wyloguj konto ze wszystkich przeglądarek i urządzeń.
                    </div>

                  </div>

                  <span className="w-fit rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[.1em] text-emerald-300">
                    Protected
                  </span>

                </div>

              </div>

              <button
                type="button"
                onClick={logoutAll}
                disabled={
                  loggingOutAll
                }
                className="mt-4 w-full rounded-[9px] border border-rose-400/35 bg-rose-500/[0.06] px-4 py-2.5 text-[10px] font-bold text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-60"
              >
                {loggingOutAll
                  ? t(
                      "loggingOut"
                    )
                  : t(
                      "logoutAll"
                    )}
              </button>

            </div>

          </section>

          {/* DANGER ZONE */}

          <section className="overflow-hidden rounded-[15px] border border-rose-500/30 bg-[linear-gradient(145deg,rgba(73,35,66,.72),rgba(8,54,96,.88))] shadow-[0_0_24px_rgba(244,63,94,.08)]">

            <div className="flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between">

              <div className="flex items-start gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-rose-400/25 bg-rose-500/10 text-lg text-rose-300">
                  !
                </div>

                <div>

                  <h2 className="text-[16px] font-semibold text-rose-300">
                    {t(
                      "dangerZone"
                    )}
                  </h2>

                  <p className="mt-1 text-[9px] text-rose-100/45">
                    {t(
                      "dangerZoneDescription"
                    )}
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setDeleteOpen(
                    true
                  )
                }
                className="rounded-[9px] border border-rose-400/30 bg-rose-600 px-5 py-2.5 text-[10px] font-bold text-white transition hover:bg-rose-500"
              >
                {t(
                  "deleteAccount"
                )}
              </button>

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