"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Plus, Check, X, Trash2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

type Campaign = {
  id: string;
  name: string;
  slug: string;
  clicks: number;
  createdAt: string;
  link: string;
  registrations: number;
};

type Referral = {
  id: string;
  name: string;
  createdAt: string;
  isPremium: boolean;
  campaignId: string | null;
};

const copyText = {
  pl: {
    referralLink: "Twój link polecający",
    copied: "Skopiowano",
    copyLink: "Kopiuj link",
    campaigns: "Kampanie polecające",
    campaignsDesc: "Twórz osobne linki dla TikTok, Instagram, YouTube lub konkretnego bannera.",
    createCampaign: "Utwórz kampanię",
    newCampaign: "Nowa kampania",
    placeholder: "np. TikTok Wrzesień",
    creating: "Tworzę…",
    create: "Utwórz",
    registeredPeople: "Zarejestrowane osoby z Twojego linku",
    registered: "ZAREJESTROWANY",
    noRegistrations: "Brak rejestracji z linku polecającego.",
    clicks: "Kliknięcia",
    registrations: "Rejestracje",
    deleting: "Usuwam…",
    remove: "Usuń",
    empty: "Nie masz jeszcze kampanii. Kliknij „Utwórz kampanię”.",
    createError: "Nie udało się utworzyć kampanii",
    deleteError: "Nie udało się usunąć kampanii",
    confirmDelete: (name: string) => `Usunąć kampanię „${name}”? Tej operacji nie można cofnąć.`,
  },
  en: {
    referralLink: "Your referral link",
    copied: "Copied",
    copyLink: "Copy link",
    campaigns: "Referral campaigns",
    campaignsDesc: "Create separate links for TikTok, Instagram, YouTube or a specific banner.",
    createCampaign: "Create campaign",
    newCampaign: "New campaign",
    placeholder: "e.g. TikTok September",
    creating: "Creating…",
    create: "Create",
    registeredPeople: "People registered through your link",
    registered: "REGISTERED",
    noRegistrations: "No registrations from your referral link yet.",
    clicks: "Clicks",
    registrations: "Registrations",
    deleting: "Deleting…",
    remove: "Delete",
    empty: "You do not have any campaigns yet. Click “Create campaign”.",
    createError: "Could not create campaign",
    deleteError: "Could not delete campaign",
    confirmDelete: (name: string) => `Delete campaign “${name}”? This action cannot be undone.`,
  },
  de: {
    referralLink: "Dein Empfehlungslink",
    copied: "Kopiert",
    copyLink: "Link kopieren",
    campaigns: "Empfehlungskampagnen",
    campaignsDesc: "Erstelle separate Links für TikTok, Instagram, YouTube oder ein bestimmtes Banner.",
    createCampaign: "Kampagne erstellen",
    newCampaign: "Neue Kampagne",
    placeholder: "z. B. TikTok September",
    creating: "Wird erstellt…",
    create: "Erstellen",
    registeredPeople: "Über deinen Link registrierte Personen",
    registered: "REGISTRIERT",
    noRegistrations: "Noch keine Registrierungen über deinen Empfehlungslink.",
    clicks: "Klicks",
    registrations: "Registrierungen",
    deleting: "Wird gelöscht…",
    remove: "Löschen",
    empty: "Du hast noch keine Kampagnen. Klicke auf „Kampagne erstellen“.",
    createError: "Kampagne konnte nicht erstellt werden",
    deleteError: "Kampagne konnte nicht gelöscht werden",
    confirmDelete: (name: string) => `Kampagne „${name}“ löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
  },
  nl: {
    referralLink: "Jouw verwijzingslink",
    copied: "Gekopieerd",
    copyLink: "Link kopiëren",
    campaigns: "Verwijzingscampagnes",
    campaignsDesc: "Maak aparte links voor TikTok, Instagram, YouTube of een specifieke banner.",
    createCampaign: "Campagne maken",
    newCampaign: "Nieuwe campagne",
    placeholder: "bijv. TikTok september",
    creating: "Bezig met maken…",
    create: "Maken",
    registeredPeople: "Personen geregistreerd via jouw link",
    registered: "GEREGISTREERD",
    noRegistrations: "Nog geen registraties via jouw verwijzingslink.",
    clicks: "Klikken",
    registrations: "Registraties",
    deleting: "Bezig met verwijderen…",
    remove: "Verwijderen",
    empty: "Je hebt nog geen campagnes. Klik op ‘Campagne maken’.",
    createError: "Campagne kon niet worden gemaakt",
    deleteError: "Campagne kon niet worden verwijderd",
    confirmDelete: (name: string) => `Campagne ‘${name}’ verwijderen? Deze actie kan niet ongedaan worden gemaakt.`,
  },
  es: {
    referralLink: "Tu enlace de referido",
    copied: "Copiado",
    copyLink: "Copiar enlace",
    campaigns: "Campañas de referidos",
    campaignsDesc: "Crea enlaces separados para TikTok, Instagram, YouTube o un banner específico.",
    createCampaign: "Crear campaña",
    newCampaign: "Nueva campaña",
    placeholder: "p. ej. TikTok Septiembre",
    creating: "Creando…",
    create: "Crear",
    registeredPeople: "Personas registradas desde tu enlace",
    registered: "REGISTRADO",
    noRegistrations: "Aún no hay registros desde tu enlace de referido.",
    clicks: "Clics",
    registrations: "Registros",
    deleting: "Eliminando…",
    remove: "Eliminar",
    empty: "Todavía no tienes campañas. Haz clic en «Crear campaña».",
    createError: "No se pudo crear la campaña",
    deleteError: "No se pudo eliminar la campaña",
    confirmDelete: (name: string) => `¿Eliminar la campaña «${name}»? Esta acción no se puede deshacer.`,
  },
} as const;

export default function AffiliateCampaignsClient({ referral }: { referral: string }) {
  const { lang, locale } = useLanguage();
  const tx = useMemo(() => copyText[lang], [lang]);

  const [items, setItems] = useState<Campaign[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [copied, setCopied] = useState("");
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    const r = await fetch("/api/affiliate/campaigns", { cache: "no-store" });
    if (r.ok) {
      const d = await r.json();
      setItems(d.campaigns || []);
      setReferrals(d.referrals || []);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const copy = async (value: string, id: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(id);
    setTimeout(() => setCopied(""), 1500);
  };

  const create = async () => {
    if (!name.trim()) return;
    setError("");
    setBusy(true);

    const r = await fetch("/api/affiliate/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    setBusy(false);

    if (r.ok) {
      setName("");
      setOpen(false);
      void load();
      return;
    }

    const d = await r.json().catch(() => ({}));
    setError(d.error || tx.createError);
  };

  const remove = async (campaign: Campaign) => {
    if (!window.confirm(tx.confirmDelete(campaign.name))) return;

    setError("");
    setDeletingId(campaign.id);

    const r = await fetch("/api/affiliate/campaigns", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: campaign.id }),
    });

    setDeletingId("");

    if (r.ok) {
      setItems((prev) => prev.filter((x) => x.id !== campaign.id));
      return;
    }

    const d = await r.json().catch(() => ({}));
    setError(d.error || tx.deleteError);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[18px] border border-sky-400/15 bg-[#071522] p-5">
        <div className="text-xs font-black uppercase tracking-wider text-sky-300">
          {tx.referralLink}
        </div>
        <div className="mt-3 flex flex-col gap-2 md:flex-row">
          <div className="min-w-0 flex-1 break-all rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-xs text-sky-200">
            {referral}
          </div>
          <button
            onClick={() => copy(referral, "main")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-3 text-xs font-black hover:bg-sky-400"
          >
            {copied === "main" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied === "main" ? tx.copied : tx.copyLink}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">{tx.campaigns}</h2>
          <p className="text-xs text-slate-400">{tx.campaignsDesc}</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-black"
        >
          <Plus className="h-4 w-4" />
          {tx.createCampaign}
        </button>
      </div>

      {open && (
        <div className="rounded-[18px] border border-cyan-400/25 bg-[#071522] p-5">
          <div className="flex items-center justify-between">
            <b>{tx.newCampaign}</b>
            <button onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void create();
              }}
              placeholder={tx.placeholder}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-cyan-400/40"
            />
            <button
              disabled={busy || !name.trim()}
              onClick={() => void create()}
              className="rounded-xl bg-cyan-500 px-5 text-xs font-black disabled:opacity-40"
            >
              {busy ? tx.creating : tx.create}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-[18px] border border-sky-400/15 bg-[#071522] p-5">
        <div className="text-xs font-black uppercase tracking-wider text-sky-300">
          {tx.registeredPeople}
        </div>
        <div className="mt-3 space-y-2">
          {referrals.length ? (
            referrals.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/15 px-3 py-2"
              >
                <div>
                  <div className="text-xs font-bold">{r.name}</div>
                  <div className="text-[9px] text-slate-500">
                    {new Date(r.createdAt).toLocaleDateString(locale)}
                  </div>
                </div>
                <span
                  className={
                    r.isPremium
                      ? "rounded-lg bg-emerald-500/10 px-2 py-1 text-[9px] font-black text-emerald-300"
                      : "rounded-lg bg-sky-500/10 px-2 py-1 text-[9px] font-black text-sky-300"
                  }
                >
                  {r.isPremium ? "PREMIUM" : tx.registered}
                </span>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-500">{tx.noRegistrations}</div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-3">
        {items.length ? (
          items.map((c) => (
            <div key={c.id} className="rounded-[18px] border border-sky-400/15 bg-[#071522] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-black">{c.name}</div>
                  <div className="mt-1 text-[10px] text-slate-500">
                    {tx.clicks}: {c.clicks} • {tx.registrations}: {c.registrations}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => copy(c.link, c.id)}
                    className="inline-flex items-center gap-2 rounded-xl border border-sky-400/20 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-200"
                  >
                    {copied === c.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied === c.id ? tx.copied : tx.copyLink}
                  </button>
                  <button
                    disabled={deletingId === c.id}
                    onClick={() => void remove(c)}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deletingId === c.id ? tx.deleting : tx.remove}
                  </button>
                </div>
              </div>
              <div className="mt-3 break-all rounded-lg bg-black/20 p-2 text-[11px] text-slate-400">
                {c.link}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[18px] border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">
            {tx.empty}
          </div>
        )}
      </div>
    </div>
  );
}
