"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TechnicalAnalysisPanel from "@/components/TechnicalAnalysisPanel";
export const dynamic = "force-dynamic";
type Trade = {
  id: string;
  pair: string;
  side: "BUY" | "SELL";
  entry: number;
  exit?: number;
  sl?: number;
  tp?: number;
  size?: number;
  result: number;
  setup?: string;
  session?: "Asia" | "London" | "New York" | "US" | "Crypto" | string;
  date: string;
  note?: string;
};

type CalendarTrade = {
  id: number;
  day: number;
  month: number;
  year: number;
  pair: string;
  side: string;
  result: string;
  pnl: number;
  setup: string;
  session: string;
  entry: string;
  sl: string;
  tp: string;
  size: string;
  exit: string;
  note: string;
};

const TRADE_STORE_KEY = "fxtrade_trade_store";

const MONTH_OPTIONS = [
  { value: 0, label: "Styczeń" },
  { value: 1, label: "Luty" },
  { value: 2, label: "Marzec" },
  { value: 3, label: "Kwiecień" },
  { value: 4, label: "Maj" },
  { value: 5, label: "Czerwiec" },
  { value: 6, label: "Lipiec" },
  { value: 7, label: "Sierpień" },
  { value: 8, label: "Wrzesień" },
  { value: 9, label: "Październik" },
  { value: 10, label: "Listopad" },
  { value: 11, label: "Grudzień" },
];

const YEAR_OPTIONS = Array.from({ length: 9 }, (_, i) => 2022 + i);

function getTradeStore(): Trade[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TRADE_STORE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTradeStore(trades: Trade[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TRADE_STORE_KEY, JSON.stringify(trades));
}

function addTradeStore(trade: Trade) {
  const current = getTradeStore();
  saveTradeStore([trade, ...current]);
}

function updateTradeStore(id: string, next: Partial<Trade>) {
  const current = getTradeStore();
  saveTradeStore(current.map((t) => (t.id === id ? { ...t, ...next } : t)));
}

function deleteTradeStore(id: string) {
  const current = getTradeStore();
  saveTradeStore(current.filter((t) => t.id !== id));
}

function mapStoredTradeToCalendarTrade(t: Trade): CalendarTrade {
  const pnl = typeof t.result === "number" ? t.result : 0;
  const parsedDate = new Date(t.date);

  return {
    id: Number(t.id),
    day: parsedDate.getDate(),
    month: parsedDate.getMonth(),
    year: parsedDate.getFullYear(),
    pair: t.pair,
    side: t.side,
    result: pnl >= 0 ? `+$${pnl}` : `-$${Math.abs(pnl)}`,
    pnl,
    setup: t.setup ?? "-",
    session: t.session ?? "-",
    entry: String(t.entry ?? "-"),
    sl: t.sl !== undefined ? String(t.sl) : "-",
    tp: t.tp !== undefined ? String(t.tp) : "-",
    size: t.size !== undefined ? String(t.size) : "1.0",
    exit: t.exit !== undefined ? String(t.exit) : t.tp !== undefined ? String(t.tp) : "-",
    note: t.note ?? "",
  };
}

const traderCalendarTrades: CalendarTrade[] = [
  {
    id: 1,
    day: 2,
    month: 2,
    year: 2025,
    pair: "EUR/USD",
    side: "BUY",
    result: "+$240",
    pnl: 240,
    setup: "London Breakout",
    session: "London",
    entry: "1.0824",
    sl: "1.0800",
    tp: "1.0850",
    size: "1.0",
    exit: "1.0850",
    note: "Clean breakout after liquidity sweep.",
  },
  {
    id: 2,
    day: 8,
    month: 2,
    year: 2025,
    pair: "NAS100",
    side: "BUY",
    result: "+$540",
    pnl: 540,
    setup: "Open Drive",
    session: "New York",
    entry: "17820",
    sl: "17780",
    tp: "17902",
    size: "1.0",
    exit: "17902",
    note: "Strong NY open continuation.",
  },
  {
    id: 3,
    day: 12,
    month: 2,
    year: 2025,
    pair: "EUR/USD",
    side: "BUY",
    result: "+$610",
    pnl: 610,
    setup: "London Breakout",
    session: "London",
    entry: "1.0832",
    sl: "1.0808",
    tp: "1.0876",
    size: "1.0",
    exit: "1.0876",
    note: "Excellent follow-through after BOS.",
  },
  {
    id: 4,
    day: 16,
    month: 2,
    year: 2025,
    pair: "XAU/USD",
    side: "SELL",
    result: "+$370",
    pnl: 370,
    setup: "NY Reversal",
    session: "New York",
    entry: "2038.4",
    sl: "2044.0",
    tp: "2030.9",
    size: "1.0",
    exit: "2030.9",
    note: "Sell from premium zone after sweep.",
  },
];

const instrumentOptions: Record<string, string[]> = {
  Forex: ["EUR/USD", "GBP/JPY", "USD/JPY", "AUD/USD", "USD/CAD", "EUR/JPY"],
  Surowce: ["XAU/USD", "XAG/USD", "WTI", "BRENT", "NAS100"],
  Kryptowaluty: ["BTC/USD", "ETH/USD", "SOL/USD", "XRP/USD"],
};

const watchlist = [
  { pair: "EUR/USD", price: "1.0832", bias: "Bullish" },
  { pair: "XAU/USD", price: "2034.1", bias: "Bearish" },
  { pair: "GBP/JPY", price: "189.22", bias: "Neutral" },
  { pair: "USD/JPY", price: "149.84", bias: "Bullish" },
  { pair: "AUD/USD", price: "0.6614", bias: "Bearish" },
  { pair: "BTC/USD", price: "61,240", bias: "Bullish" },
];

const alerts = [
  "EUR/USD near liquidity 1.0850",
  "GBP/JPY approaching London high",
  "USD/JPY breakout level 150.00",
];

const levels = [
  { pair: "EUR/USD", level: "1.0860", type: "Resistance" },
  { pair: "EUR/USD", level: "1.0820", type: "Liquidity" },
  { pair: "GBP/JPY", level: "189.80", type: "London High" },
  { pair: "USD/JPY", level: "149.20", type: "Support" },
];

const news = [
  { time: "08:30", event: "US CPI", impact: "High" },
  { time: "10:00", event: "ECB Speech", impact: "Medium" },
  { time: "14:30", event: "US Jobless Claims", impact: "High" },
];

const setupRows = [
  { setup: "Breakout", trades: "42", winRate: "67%", avgRR: "1:2.5", pnl: "+$4,280" },
  { setup: "NY Reversal", trades: "27", winRate: "63%", avgRR: "1:2.1", pnl: "+$2,140" },
  { setup: "Liquidity Sweep", trades: "18", winRate: "50%", avgRR: "1:1.8", pnl: "+$380" },
  { setup: "Open Drive", trades: "21", winRate: "71%", avgRR: "1:2.8", pnl: "+$3,060" },
];

function Pill({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-full px-3 py-1.5 text-xs transition ${
        active ? "bg-blue-500/20 text-white" : "bg-white/5 text-white/60"
      }`}
    >
      {children}
    </div>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4">
      <div className="text-lg font-medium">{title}</div>
      {subtitle ? <div className="text-sm text-white/52">{subtitle}</div> : null}
    </div>
  );
}

function formatTradeInputDate(year: number, month: number, day = 1) {
  const safeDay = String(day).padStart(2, "0");
  const safeMonth = String(month + 1).padStart(2, "0");
  return `${year}-${safeMonth}-${safeDay}`;
}
const cpiCalendarByYear: Record<string, any[]> = {
  "2026": [
    ["13 sty 2026", "14:30", "CPI USA", "-", "-", "Wysoki"],
    ["13 lut 2026", "14:30", "CPI USA", "-", "-", "Wysoki"],
    ["11 mar 2026", "14:30", "CPI USA", "-", "-", "Wysoki"],
    ["10 kwi 2026", "14:30", "CPI USA", "-", "-", "Wysoki"],
    ["12 maj 2026", "14:30", "CPI USA", "-", "-", "Wysoki"],
    ["10 cze 2026", "14:30", "CPI USA", "-", "-", "Wysoki"],
    ["14 lip 2026", "14:30", "CPI USA", "-", "-", "Wysoki"],
    ["12 sie 2026", "14:30", "CPI USA", "-", "-", "Wysoki"],
    ["11 wrz 2026", "14:30", "CPI USA", "-", "-", "Wysoki"],
    ["14 paź 2026", "14:30", "CPI USA", "-", "-", "Wysoki"],
    ["10 lis 2026", "14:30", "CPI USA", "-", "-", "Wysoki"],
    ["10 gru 2026", "14:30", "CPI USA", "-", "-", "Wysoki"],
  ],
  "2027": [],
};

const nfpCalendarByYear: Record<string, any[]> = {
  "2026": [
    ["09 sty 2026", "14:30", "Non-Farm Payrolls", "-", "-", "Wysoki"],
    ["11 lut 2026", "14:30", "Non-Farm Payrolls", "-", "-", "Wysoki"],
    ["06 mar 2026", "14:30", "Non-Farm Payrolls", "-", "-", "Wysoki"],
    ["03 kwi 2026", "14:30", "Non-Farm Payrolls", "-", "-", "Wysoki"],
    ["08 maj 2026", "14:30", "Non-Farm Payrolls", "-", "-", "Wysoki"],
    ["05 cze 2026", "14:30", "Non-Farm Payrolls", "-", "-", "Wysoki"],
    ["02 lip 2026", "14:30", "Non-Farm Payrolls", "-", "-", "Wysoki"],
    ["07 sie 2026", "14:30", "Non-Farm Payrolls", "-", "-", "Wysoki"],
    ["04 wrz 2026", "14:30", "Non-Farm Payrolls", "-", "-", "Wysoki"],
    ["02 paź 2026", "14:30", "Non-Farm Payrolls", "-", "-", "Wysoki"],
    ["06 lis 2026", "14:30", "Non-Farm Payrolls", "-", "-", "Wysoki"],
    ["04 gru 2026", "14:30", "Non-Farm Payrolls", "-", "-", "Wysoki"],
  ],
  "2027": [],
};


type MacroLanguage = "pl" | "en" | "de" | "nl" | "es";

type ReleaseScheduleItem = {
  date: string;
  time: string;
  event: "NFP" | "CPI";
};

const OFFICIAL_NFP_2026: ReleaseScheduleItem[] = [
  { date: "2026-01-09", time: "14:30", event: "NFP" },
  { date: "2026-02-11", time: "14:30", event: "NFP" },
  { date: "2026-03-06", time: "14:30", event: "NFP" },
  { date: "2026-04-03", time: "14:30", event: "NFP" },
  { date: "2026-05-08", time: "14:30", event: "NFP" },
  { date: "2026-06-05", time: "14:30", event: "NFP" },
  { date: "2026-07-02", time: "14:30", event: "NFP" },
  { date: "2026-08-07", time: "14:30", event: "NFP" },
  { date: "2026-09-04", time: "14:30", event: "NFP" },
  { date: "2026-10-02", time: "14:30", event: "NFP" },
  { date: "2026-11-06", time: "14:30", event: "NFP" },
  { date: "2026-12-04", time: "14:30", event: "NFP" },
];

const OFFICIAL_CPI_2026: ReleaseScheduleItem[] = [
  { date: "2026-01-13", time: "14:30", event: "CPI" },
  { date: "2026-02-13", time: "14:30", event: "CPI" },
  { date: "2026-03-11", time: "13:30", event: "CPI" },
  { date: "2026-04-10", time: "14:30", event: "CPI" },
  { date: "2026-05-12", time: "14:30", event: "CPI" },
  { date: "2026-06-10", time: "14:30", event: "CPI" },
  { date: "2026-07-14", time: "14:30", event: "CPI" },
  { date: "2026-08-12", time: "14:30", event: "CPI" },
  { date: "2026-09-11", time: "14:30", event: "CPI" },
  { date: "2026-10-14", time: "14:30", event: "CPI" },
  { date: "2026-11-10", time: "14:30", event: "CPI" },
  { date: "2026-12-10", time: "14:30", event: "CPI" },
];

const MACRO_I18N = {
  pl: {
    nextNfp: "Najbliższy NFP", nextCpi: "Najbliższy CPI", forecast: "Prognoza", previous: "Poprzedni", impact: "Wpływ", high: "WYSOKI",
    macroData: "Dane z kalendarza makro", consensus: "Prognoza konsensusu", previousRelease: "Poprzedni odczyt",
    nfpCalendar: "Kalendarz NFP", cpiCalendar: "Kalendarz CPI", nfpSubtitle: "Oficjalny harmonogram publikacji Employment Situation (BLS)", cpiSubtitle: "Oficjalny harmonogram publikacji CPI (BLS)",
    date: "Data", time: "Czas", event: "Wydarzenie", loadingNfp: "Ładowanie danych NFP…", loadingCpi: "Ładowanie danych CPI…",
    noNfp: "Brak danych NFP dla wybranego roku.", noCpi: "Brak danych CPI dla wybranego roku.",
    upcomingNfp: "Nadchodzące terminy NFP", upcomingCpi: "Nadchodzące terminy CPI", nextBadge: "NAJBLIŻSZY", officialSchedule: "Oficjalny harmonogram BLS", fullYear: "Pełny harmonogram 2026", released: "ODBYŁO SIĘ", upcoming: "NADCHODZI",
    aiNfp: "Analiza AI NFP", affected: "Rynki pod wpływem", aiNfpText: "NFP zwykle powoduje silną zmienność na parach USD, złocie, US30 i NAS100. Unikaj nowych transakcji 15 minut przed publikacją i poczekaj na zamknięcie pierwszej świecy.",
  },
  en: {
    nextNfp: "Next NFP", nextCpi: "Next CPI", forecast: "Forecast", previous: "Previous", impact: "Impact", high: "HIGH",
    macroData: "Economic calendar data", consensus: "Consensus forecast", previousRelease: "Previous release",
    nfpCalendar: "NFP Calendar", cpiCalendar: "CPI Calendar", nfpSubtitle: "Official Employment Situation release schedule (BLS)", cpiSubtitle: "Official CPI release schedule (BLS)",
    date: "Date", time: "Time", event: "Event", loadingNfp: "Loading NFP data…", loadingCpi: "Loading CPI data…",
    noNfp: "No NFP data for the selected year.", noCpi: "No CPI data for the selected year.",
    upcomingNfp: "Upcoming NFP releases", upcomingCpi: "Upcoming CPI releases", nextBadge: "NEXT", officialSchedule: "Official BLS schedule", fullYear: "Full 2026 schedule", released: "RELEASED", upcoming: "UPCOMING",
    aiNfp: "AI NFP Analysis", affected: "Affected Markets", aiNfpText: "NFP usually creates strong volatility on USD pairs, Gold, US30 and NAS100. Avoid new trades 15 minutes before release and wait for the first candle close.",
  },
  de: {
    nextNfp: "Nächster NFP", nextCpi: "Nächster CPI", forecast: "Prognose", previous: "Vorheriger Wert", impact: "Auswirkung", high: "HOCH",
    macroData: "Wirtschaftskalenderdaten", consensus: "Konsensprognose", previousRelease: "Vorherige Veröffentlichung",
    nfpCalendar: "NFP-Kalender", cpiCalendar: "CPI-Kalender", nfpSubtitle: "Offizieller Veröffentlichungsplan der Employment Situation (BLS)", cpiSubtitle: "Offizieller CPI-Veröffentlichungsplan (BLS)",
    date: "Datum", time: "Zeit", event: "Ereignis", loadingNfp: "NFP-Daten werden geladen…", loadingCpi: "CPI-Daten werden geladen…",
    noNfp: "Keine NFP-Daten für das gewählte Jahr.", noCpi: "Keine CPI-Daten für das gewählte Jahr.",
    upcomingNfp: "Kommende NFP-Termine", upcomingCpi: "Kommende CPI-Termine", nextBadge: "NÄCHSTER", officialSchedule: "Offizieller BLS-Terminplan", fullYear: "Vollständiger Terminplan 2026", released: "VERÖFFENTLICHT", upcoming: "KOMMT",
    aiNfp: "KI-NFP-Analyse", affected: "Betroffene Märkte", aiNfpText: "NFP verursacht meist starke Volatilität bei USD-Paaren, Gold, US30 und NAS100. 15 Minuten vor der Veröffentlichung keine neuen Trades eröffnen und auf den Schluss der ersten Kerze warten.",
  },
  nl: {
    nextNfp: "Volgende NFP", nextCpi: "Volgende CPI", forecast: "Prognose", previous: "Vorige", impact: "Impact", high: "HOOG",
    macroData: "Economische kalenderdata", consensus: "Consensusprognose", previousRelease: "Vorige publicatie",
    nfpCalendar: "NFP-kalender", cpiCalendar: "CPI-kalender", nfpSubtitle: "Officieel publicatieschema Employment Situation (BLS)", cpiSubtitle: "Officieel CPI-publicatieschema (BLS)",
    date: "Datum", time: "Tijd", event: "Gebeurtenis", loadingNfp: "NFP-data laden…", loadingCpi: "CPI-data laden…",
    noNfp: "Geen NFP-data voor het geselecteerde jaar.", noCpi: "Geen CPI-data voor het geselecteerde jaar.",
    upcomingNfp: "Komende NFP-publicaties", upcomingCpi: "Komende CPI-publicaties", nextBadge: "VOLGENDE", officialSchedule: "Officieel BLS-schema", fullYear: "Volledig schema 2026", released: "GEWEEST", upcoming: "KOMEND",
    aiNfp: "AI NFP-analyse", affected: "Beïnvloede markten", aiNfpText: "NFP veroorzaakt meestal sterke volatiliteit in USD-paren, goud, US30 en NAS100. Open 15 minuten voor de publicatie geen nieuwe trades en wacht op het sluiten van de eerste candle.",
  },
  es: {
    nextNfp: "Próximo NFP", nextCpi: "Próximo CPI", forecast: "Previsión", previous: "Anterior", impact: "Impacto", high: "ALTO",
    macroData: "Datos del calendario económico", consensus: "Previsión de consenso", previousRelease: "Publicación anterior",
    nfpCalendar: "Calendario NFP", cpiCalendar: "Calendario CPI", nfpSubtitle: "Calendario oficial de Employment Situation (BLS)", cpiSubtitle: "Calendario oficial de publicaciones CPI (BLS)",
    date: "Fecha", time: "Hora", event: "Evento", loadingNfp: "Cargando datos NFP…", loadingCpi: "Cargando datos CPI…",
    noNfp: "No hay datos NFP para el año seleccionado.", noCpi: "No hay datos CPI para el año seleccionado.",
    upcomingNfp: "Próximas publicaciones NFP", upcomingCpi: "Próximas publicaciones CPI", nextBadge: "PRÓXIMO", officialSchedule: "Calendario oficial BLS", fullYear: "Calendario completo 2026", released: "PUBLICADO", upcoming: "PRÓXIMO",
    aiNfp: "Análisis AI de NFP", affected: "Mercados afectados", aiNfpText: "NFP suele generar una fuerte volatilidad en pares USD, oro, US30 y NAS100. Evita nuevas operaciones 15 minutos antes de la publicación y espera al cierre de la primera vela.",
  },
} as const;

function formatOfficialReleaseDate(date: string, lang: MacroLanguage) {
  const locale = lang === "pl" ? "pl-PL" : lang === "de" ? "de-DE" : lang === "nl" ? "nl-NL" : lang === "es" ? "es-ES" : "en-GB";
  return new Date(`${date}T12:00:00`).toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
}

function upcomingOfficialReleases(items: ReleaseScheduleItem[]) {
  const today = new Date().toISOString().slice(0, 10);
  return items.filter((item) => item.date >= today);
}

function isPastOfficialRelease(date: string) {
  const today = new Date().toISOString().slice(0, 10);
  return date < today;
}

function formatMacroCalendarDate(date: string) {
  if (!date) return "-";
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function macroEventToRow(event: any) {
  return [
    formatMacroCalendarDate(String(event?.date ?? "")),
    String(event?.time ?? "-") || "-",
    String(event?.title ?? "-"),
    String(event?.forecast ?? "-") || "-",
    String(event?.previous ?? "-") || "-",
    String(event?.impact ?? "HIGH").toUpperCase(),
  ];
}

function getNextEvent(events: any[]) {
  const today = new Date().toISOString().slice(0, 10);
  const sorted = [...events].sort((a, b) =>
    `${a?.date ?? ""} ${a?.time ?? ""}`.localeCompare(`${b?.date ?? ""} ${b?.time ?? ""}`)
  );
  return sorted.find((event) => String(event?.date ?? "") >= today) ?? sorted.at(-1) ?? null;
}

function getTimeUntil(date: string, time: string) {
  const eventDate = new Date(`${date}T${time}:00`);
  const now = new Date();

  const diff = eventDate.getTime() - now.getTime();

  if (diff <= 0) return "Already passed";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );

  return `${days}d ${hours}h`;
}
function getEventBias(title: string) {
  const event = title.toLowerCase();

  if (event.includes("cpi")) {
    return {
      volatility: "HIGH",
      bias: "Higher CPI = Bullish USD / Bearish Gold",
    };
  }

  if (event.includes("non-farm") || event.includes("nfp")) {
    return {
      volatility: "HIGH",
      bias: "Strong NFP = Bullish USD / Bearish Gold",
    };
  }

  if (event.includes("fomc") || event.includes("fed") || event.includes("interest rate")) {
    return {
      volatility: "VERY HIGH",
      bias: "Hawkish FED = Bullish USD / Bearish Gold",
    };
  }

  return {
    volatility: "MEDIUM",
    bias: "Watch forecast vs actual",
  };
}
function getAffectedMarkets(title: string) {
  const event = title.toLowerCase();

  if (event.includes("cpi")) {
    return ["XAUUSD", "EURUSD", "GBPUSD", "US30"];
  }

  if (event.includes("non-farm") || event.includes("nfp")) {
    return ["XAUUSD", "US30", "NAS100", "USDJPY"];
  }

  if (
    event.includes("fomc") ||
    event.includes("fed") ||
    event.includes("interest rate")
  ) {
    return ["XAUUSD", "US30", "NAS100", "EURUSD"];
  }

  if (event.includes("retail")) {
    return ["EURUSD", "GBPUSD", "US30"];
  }

  if (event.includes("jobless")) {
    return ["XAUUSD", "US30", "USDJPY"];
  }

  return ["EURUSD", "XAUUSD"];
}

export default function TradingRoomPanel() {
  const [showMacroFilters, setShowMacroFilters] = useState(true);
  const [macroLang, setMacroLang] = useState<MacroLanguage>("pl");

  useEffect(() => {
    const readLang = () => {
      const raw = localStorage.getItem("fxtrade-language") || localStorage.getItem("lang") || document.documentElement.lang || "pl";
      const next: MacroLanguage = ["pl", "en", "de", "nl", "es"].includes(raw) ? (raw as MacroLanguage) : "pl";
      setMacroLang(next);
    };
    readLang();
    const onCustom = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (["pl", "en", "de", "nl", "es"].includes(detail)) setMacroLang(detail as MacroLanguage);
      else readLang();
    };
    const onStorage = () => readLang();
    window.addEventListener("fxtrade-language-change", onCustom as EventListener);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("fxtrade-language-change", onCustom as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const macroT = MACRO_I18N[macroLang];
  const officialUpcomingNfp = upcomingOfficialReleases(OFFICIAL_NFP_2026);
  const officialUpcomingCpi = upcomingOfficialReleases(OFFICIAL_CPI_2026);

const [selectedMacroDate, setSelectedMacroDate] = useState(() => {
  return new Date().toISOString().split("T")[0];
});
const [selectedMacroMonth, setSelectedMacroMonth] = useState(() => {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
});

  



const emptyMacroFilters = {
  cpi: false,
  nfp: false,
  fed: false,
  rates: false,
  gdp: false,
  retail: false,
  ppi: false,
  pce: false,
  adp: false,
  claims: false,
  pmi: false,
};
const [macroFilters, setMacroFilters] = useState({
  cpi: true,
  nfp: true,
  fed: true,
  rates: true,
  gdp: true,
  retail: true,
  ppi: true,
  pce: true,
  adp: true,
  claims: true,
  pmi: true,
});
const [selectedMacroEvent, setSelectedMacroEvent] = useState<any | null>(null);
const [quickFilter, setQuickFilter] = useState("today");



const [impactFilters, setImpactFilters] = useState({
  HIGH: true,
  MEDIUM: true,
  LOW: true,
});

const [currencyFilters, setCurrencyFilters] = useState({
  USD: true,
  EUR: true,
  GBP: true,
  JPY: true,
});

const [eventTypeFilters, setEventTypeFilters] = useState({
  cpi: true,
  nfp: true,
  fed: true,
  rates: true,
  gdp: true,
  retail: true,
  ppi: true,
  pce: true,
  adp: true,
  jobless: true,
  pmi: true,
});
const [activeEventFilter, setActiveEventFilter] =
  useState<string | null>(null);
const [apiEvents, setApiEvents] = useState<any[]>([]);
const [monthEvents, setMonthEvents] = useState<any[]>([]);






const macroEvents = [
  ["2026-06-08", "14:30", "🇺🇸 USD", "cpi", "HIGH", "Core CPI m/m", "-", "0.3%", "0.4%"],
  ["2026-06-08", "14:30", "🇺🇸 USD", "cpi", "HIGH", "CPI y/y", "-", "3.4%", "3.5%"],

  ["2026-06-09", "14:30", "🇺🇸 USD", "ppi", "HIGH", "PPI m/m", "-", "0.2%", "0.5%"],
  ["2026-06-09", "14:30", "🇺🇸 USD", "ppi", "HIGH", "Core PPI m/m", "-", "0.3%", "0.4%"],
  ["2026-06-09", "14:30", "🇺🇸 USD", "pce", "HIGH", "Core PCE Price Index", "-", "0.2%", "0.3%"],
  ["2026-06-09", "14:30", "🇺🇸 USD", "employment", "MEDIUM", "Initial Jobless Claims", "-", "220K", "218K"],
  ["2026-06-10", "16:00", "🇺🇸 USD", "consumer", "MEDIUM", "Consumer Confidence", "-", "102.0", "101.3"],
  ["2026-06-10", "16:00", "🇺🇸 USD", "manufacturing", "MEDIUM", "ISM Manufacturing PMI", "-", "49.5", "48.7"],
  ["2026-06-11", "16:00", "🇺🇸 USD", "services", "MEDIUM", "ISM Services PMI", "-", "52.0", "51.6"],

  ["2026-06-12", "14:30", "🇺🇸 USD", "retail", "HIGH", "Retail Sales m/m", "-", "0.4%", "0.1%"],

["2026-06-13", "14:30", "🇺🇸 USD", "ppi", "HIGH", "PPI m/m", "-", "0.2%", "0.5%"],
["2026-06-13", "14:30", "🇺🇸 USD", "ppi", "HIGH", "Core PPI m/m", "-", "0.3%", "0.4%"],

["2026-06-14", "14:30", "🇺🇸 USD", "pce", "HIGH", "PCE Price Index m/m", "-", "0.2%", "0.3%"],
["2026-06-14", "14:30", "🇺🇸 USD", "pce", "HIGH", "Core PCE Price Index m/m", "-", "0.2%", "0.3%"],

["2026-06-15", "14:15", "🇺🇸 USD", "adp", "HIGH", "ADP Non-Farm Employment Change", "-", "185K", "192K"],

["2026-06-16", "14:30", "🇺🇸 USD", "claims", "MEDIUM", "Initial Jobless Claims", "-", "220K", "218K"],

["2026-06-17", "16:00", "🇺🇸 USD", "pmi", "MEDIUM", "ISM Manufacturing PMI", "-", "49.5", "48.7"],
["2026-06-17", "16:00", "🇺🇸 USD", "pmi", "MEDIUM", "ISM Services PMI", "-", "52.0", "51.6"],
];

const apiMacroEvents = Array.isArray(apiEvents)
  ? apiEvents.map((e) => [
      e.date,
      e.time,
      `🇺🇸 ${e.currency}`,
      e.title.toLowerCase().includes("cpi")
  ? "cpi"
  : e.title.toLowerCase().includes("non-farm") ||
    e.title.toLowerCase().includes("nfp")
  ? "nfp"
  : e.title.toLowerCase().includes("fomc") ||
    e.title.toLowerCase().includes("fed")
  ? "fed"
  : e.title.toLowerCase().includes("interest rate")
  ? "rates"
  : e.title.toLowerCase().includes("gdp")
  ? "gdp"
  : e.title.toLowerCase().includes("retail")
  ? "retail"
  : e.title.toLowerCase().includes("ppi")
  ? "ppi"
  : e.title.toLowerCase().includes("pce")
  ? "pce"
  : e.title.toLowerCase().includes("adp")
  ? "adp"
  : e.title.toLowerCase().includes("jobless")
  ? "jobless"
  : e.title.toLowerCase().includes("pmi")
  ? "pmi"
  : "macro",
      e.impact,
      e.title,
      e.actual ?? "-",
      e.forecast ?? "-",
      e.previous ?? "-",
    ])
  : [];

const calendarEvents = apiMacroEvents;



const filteredMacroEvents = calendarEvents.filter((event) => {
  const date = event[0];
  const currency = String(event[2]).replace("🇺🇸", "").trim();
  const type = String(event[3]);
  const impactLevel = String(event[4]);

  const matchesDate = date === selectedMacroDate;
  const matchesImpact =
    impactFilters[impactLevel as keyof typeof impactFilters] ?? true;
  const matchesCurrency =
    currencyFilters[currency as keyof typeof currencyFilters] ?? true;

  const matchesType =
  eventTypeFilters[type as keyof typeof eventTypeFilters] ?? true;

const matchesRightPanel =
  !activeEventFilter || type === activeEventFilter;

return (
  matchesDate &&
  matchesImpact &&
  matchesCurrency &&
  matchesType &&
  matchesRightPanel
);
});
const nextHighImpactEvent = monthEvents
  .filter((e) => {
    const title = String(e.title || "").toLowerCase();
    const impact = String(e.impact || "").toUpperCase();

    const isImportantEvent =
      title.includes("cpi") ||
      title.includes("non-farm") ||
      title.includes("nonfarm") ||
      title.includes("nfp") ||
      title.includes("fomc") ||
      title.includes("fed") ||
      title.includes("interest rate");

    return impact === "HIGH" && isImportantEvent;
  })
  .sort((a, b) => {
    const aTime = `${a.date} ${a.time}`;
    const bTime = `${b.date} ${b.time}`;

    return aTime.localeCompare(bTime);
  })
  .find((e) => e.date >= selectedMacroDate);

const nextCpiEvent = monthEvents.find((e) =>
  e.title?.toLowerCase().includes("cpi")
);
const nextNfpEvent = monthEvents.find((e) => {
  const title = String(e.title || "").toLowerCase();

  return (
    title.includes("non-farm") ||
    title.includes("payroll") ||
    title.includes("nfp")
  );
});


const nextFedEvent = monthEvents.find(
  (e) =>
    e.title?.toLowerCase().includes("fomc") ||
    e.title?.toLowerCase().includes("fed") ||
    e.title?.toLowerCase().includes("interest rate")
);

const getEventTypeCount = (type: string) => {
  return monthEvents.filter((e) => {
    const title = String(e.title || "").toLowerCase();

    if (type === "cpi") return title.includes("cpi");
    if (type === "nfp")
      return title.includes("non-farm") || title.includes("nfp");
    if (type === "fed")
      return (
        title.includes("fomc") ||
        title.includes("fed") ||
        title.includes("interest rate")
      );
    if (type === "retail") return title.includes("retail");
    if (type === "jobless") return title.includes("jobless");
    if (type === "ppi") return title.includes("ppi");
    if (type === "pce") return title.includes("pce");
    if (type === "adp") return title.includes("adp");
    if (type === "pmi") return title.includes("pmi");
    if (type === "gdp") return title.includes("gdp");
    if (type === "rates") return title.includes("interest rate");

    return false;
  }).length;
};


const getDaysUntil = (date: string) => {
  const today = new Date();
  const eventDate = new Date(date);
  const diff = eventDate.getTime() - today.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) return "Already passed";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";

  return `In ${days} days`;
};
const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [selectedNfpYear, setSelectedNfpYear] = useState("2026");
  const getInitialTab = () => {
 
  switch (tabParam) {
    case "fxmarket":
      return "Trading Room";

    case "technical":
      return "Technical Analysis";

    case "live":
      return "Economic Calendar";

    case "news":
      return "News";

    case "nfp":
      return "NFP Calendar";

    case "cpi":
      return "CPI Calendar";

    case "calendar":
      return "Profit Calendar";

    default:
      return "FxMarket";
  }
};
  const [activeRoomTab, setActiveRoomTab] = useState(getInitialTab);
  const [selectedCategory, setSelectedCategory] = useState("Forex");
  const [selectedPair, setSelectedPair] = useState("EUR/USD");
  const [selectedTimeframe] = useState("M5");

  const [selectedMonth, setSelectedMonth] = useState(2);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedCpiYear, setSelectedCpiYear] = useState("2026");
  const [nfpYearEvents, setNfpYearEvents] = useState<any[]>([]);
  const [cpiYearEvents, setCpiYearEvents] = useState<any[]>([]);
  const [nfpCalendarLoading, setNfpCalendarLoading] = useState(false);
  const [cpiCalendarLoading, setCpiCalendarLoading] = useState(false);
  const [calendarTrades, setCalendarTrades] = useState<CalendarTrade[]>(() => {
    if (typeof window === "undefined") return traderCalendarTrades;

    try {
      const stored = getTradeStore();
      if (stored.length > 0) return stored.map(mapStoredTradeToCalendarTrade);
      return traderCalendarTrades;
    } catch {
      return traderCalendarTrades;
    }
  });

  const [selectedTraderCalendarDay, setSelectedTraderCalendarDay] =
    useState<number | null>(16);

  const [selectedCalendarTradeId, setSelectedCalendarTradeId] =
    useState<number | null>(null);

  const [editingTradeId, setEditingTradeId] = useState<number | null>(null);

  const [newTrade, setNewTrade] = useState({
    date: formatTradeInputDate(2025, 2, 16),
    pair: "EUR/USD",
    side: "BUY",
    setup: "Breakout",
    entry: "1.0853",
    sl: "1.0822",
    tp: "1.0920",
    size: "1.0",
    result: "240",
    session: "London",
    notes: "London breakout, strong momentum",
  });
  
useEffect(() => {
  fetch(
    `/api/economic-calendar?date=${selectedMacroDate}`
  )
    .then((res) => res.json())
    .then((data) => {
      
      setApiEvents(data);
    })
    .catch(console.error);
}, [selectedMacroDate]);

useEffect(() => {
  fetch(
    `/api/economic-calendar-month?month=${selectedMacroMonth}&t=${Date.now()}`
  )
    .then((res) => res.json())
    .then((data) => {
      setMonthEvents(Array.isArray(data) ? data : []);
    })
    .catch(console.error);
}, [selectedMacroMonth]);

useEffect(() => {
  setNfpCalendarLoading(true);
  fetch(`/api/economic-calendar-year?year=${selectedNfpYear}&t=${Date.now()}`)
    .then((res) => res.json())
    .then((data) => setNfpYearEvents(Array.isArray(data) ? data : []))
    .catch((error) => {
      console.error(error);
      setNfpYearEvents([]);
    })
    .finally(() => setNfpCalendarLoading(false));
}, [selectedNfpYear]);

useEffect(() => {
  setCpiCalendarLoading(true);
  fetch(`/api/economic-calendar-year?year=${selectedCpiYear}&t=${Date.now()}`)
    .then((res) => res.json())
    .then((data) => setCpiYearEvents(Array.isArray(data) ? data : []))
    .catch((error) => {
      console.error(error);
      setCpiYearEvents([]);
    })
    .finally(() => setCpiCalendarLoading(false));
}, [selectedCpiYear]);

const nfpDynamicEvents = nfpYearEvents.filter((event) => {
  const title = String(event?.title ?? "").toLowerCase();
  if (title.includes("adp")) return false;
  return (
    title.includes("non-farm payroll") ||
    title.includes("nonfarm payroll") ||
    title.includes("non farm payroll") ||
    title === "nfp"
  );
});
const cpiDynamicEvents = cpiYearEvents.filter((event) => {
  const title = String(event?.title ?? "").toLowerCase();
  return title.includes("cpi") && !title.includes("ppi");
});
const nfpRows = nfpDynamicEvents.length
  ? nfpDynamicEvents.map(macroEventToRow)
  : (nfpCalendarByYear[selectedNfpYear] ?? []);
const cpiRows = cpiDynamicEvents.length
  ? cpiDynamicEvents.map(macroEventToRow)
  : (cpiCalendarByYear[selectedCpiYear] ?? []);
const providerNextNfpCalendarEvent = getNextEvent(nfpDynamicEvents);
const providerNextCpiCalendarEvent = getNextEvent(cpiDynamicEvents);
const officialNextNfp = officialUpcomingNfp[0] ?? null;
const officialNextCpi = officialUpcomingCpi[0] ?? null;
const nextNfpCalendarEvent = officialNextNfp
  ? { date: officialNextNfp.date, time: officialNextNfp.time, currency: "USD", forecast: "-", previous: "-", impact: "HIGH", title: "Non-Farm Payrolls" }
  : providerNextNfpCalendarEvent;
const nextCpiCalendarEvent = officialNextCpi
  ? { date: officialNextCpi.date, time: officialNextCpi.time, currency: "USD", forecast: "-", previous: "-", impact: "HIGH", title: "CPI" }
  : providerNextCpiCalendarEvent;

  useEffect(() => {
    switch (tabParam) {
      case "fxmarket":
        setActiveRoomTab("Trading Room");
        break;
      case "technical":
        setActiveRoomTab("Technical Analysis");
        break;
      case "live":
        setActiveRoomTab("Economic Calendar");
        break;
 case "news":
      setActiveRoomTab("News");
      break;

    case "nfp":
      setActiveRoomTab("NFP Calendar");
      break;

    case "cpi":
      setActiveRoomTab("CPI Calendar");
      break;

      case "calendar":
        setActiveRoomTab("Profit Calendar");
        break;
      default:
        setActiveRoomTab("Trading Room");
    }
  }, [tabParam]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedPair(instrumentOptions[category][0]);
  };

  const selectInstrument = (instrument: string) => {
    setSelectedPair(instrument);
  };

  const resetTradeForm = () => {
    setNewTrade({
      date: formatTradeInputDate(selectedYear, selectedMonth, selectedTraderCalendarDay ?? 1),
      pair: "EUR/USD",
      side: "BUY",
      setup: "Breakout",
      entry: "1.0853",
      sl: "1.0822",
      tp: "1.0920",
      size: "1.0",
      result: "240",
      session: "London",
      notes: "",
    });
    setEditingTradeId(null);
  };

  const filteredCalendarTrades = useMemo(
    () =>
      calendarTrades.filter(
        (trade) => trade.month === selectedMonth && trade.year === selectedYear
      ),
    [calendarTrades, selectedMonth, selectedYear]
  );

  const daysInSelectedMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

  const calendarDaysComputed = useMemo(
    () =>
      Array.from({ length: daysInSelectedMonth }, (_, i) => {
        const day = i + 1;
        const dayTrades = filteredCalendarTrades.filter((trade) => trade.day === day);
        const pnl = dayTrades.reduce((sum, trade) => sum + trade.pnl, 0);

        return {
          day,
          pnl,
          trades: dayTrades.length,
        };
      }),
    [daysInSelectedMonth, filteredCalendarTrades]
  );

  useEffect(() => {
    const availableDays = filteredCalendarTrades.map((trade) => trade.day);

    if (
      selectedTraderCalendarDay !== null &&
      selectedTraderCalendarDay <= daysInSelectedMonth
    ) {
      return;
    }

    if (availableDays.length > 0) {
      setSelectedTraderCalendarDay(availableDays[0]);
      setSelectedCalendarTradeId(null);
      return;
    }

    setSelectedTraderCalendarDay(null);
    setSelectedCalendarTradeId(null);
  }, [
    selectedMonth,
    selectedYear,
    filteredCalendarTrades,
    selectedTraderCalendarDay,
    daysInSelectedMonth,
  ]);

  const handleAddTrade = () => {
    const dateObj = new Date(newTrade.date);
    const day = dateObj.getDate();
    const pnl = Number(newTrade.result);

    if (!Number.isFinite(pnl)) return;

    const trade: Trade = {
      id: String(Date.now()),
      pair: newTrade.pair,
      side: newTrade.side as "BUY" | "SELL",
      entry: Number(newTrade.entry),
      sl: Number(newTrade.sl),
      tp: Number(newTrade.tp),
      size: Number(newTrade.size),
      result: pnl,
      setup: newTrade.setup,
      session: newTrade.session,
      date: newTrade.date,
      note: newTrade.notes,
    };

    addTradeStore(trade);

    const mapped = getTradeStore().map(mapStoredTradeToCalendarTrade);
    setCalendarTrades(mapped);
    setSelectedMonth(dateObj.getMonth());
    setSelectedYear(dateObj.getFullYear());
    setSelectedTraderCalendarDay(day);
    setEditingTradeId(null);
  };

  const handleEditTrade = (trade: CalendarTrade) => {
    const paddedDay = String(trade.day).padStart(2, "0");
    const paddedMonth = String(trade.month + 1).padStart(2, "0");

    setNewTrade({
      date: `${trade.year}-${paddedMonth}-${paddedDay}`,
      pair: trade.pair,
      side: trade.side,
      setup: trade.setup,
      entry: trade.entry,
      sl: trade.sl,
      tp: trade.tp,
      size: trade.size,
      result: String(trade.pnl),
      session: trade.session,
      notes: trade.note,
    });

    setEditingTradeId(trade.id);
  };

  const handleUpdateTrade = () => {
    if (!editingTradeId) return;

    const pnl = Number(newTrade.result);
    if (!Number.isFinite(pnl)) return;

    const dateObj = new Date(newTrade.date);

    updateTradeStore(String(editingTradeId), {
      pair: newTrade.pair,
      side: newTrade.side as "BUY" | "SELL",
      entry: Number(newTrade.entry),
      sl: Number(newTrade.sl),
      tp: Number(newTrade.tp),
      size: Number(newTrade.size),
      result: pnl,
      setup: newTrade.setup,
      session: newTrade.session,
      date: newTrade.date,
      note: newTrade.notes,
    });

    const mapped = getTradeStore().map(mapStoredTradeToCalendarTrade);
    setCalendarTrades(mapped);
    setSelectedMonth(dateObj.getMonth());
    setSelectedYear(dateObj.getFullYear());
    setSelectedTraderCalendarDay(dateObj.getDate());
    setEditingTradeId(null);
  };

  const handleDeleteTrade = (id: number) => {
    deleteTradeStore(String(id));
    const mapped = getTradeStore().map(mapStoredTradeToCalendarTrade);
    setCalendarTrades(mapped);

    if (selectedCalendarTradeId === id) {
      setSelectedCalendarTradeId(null);
    }
  };

  const selectedTraderDayTrades = filteredCalendarTrades.filter(
    (trade) => trade.day === selectedTraderCalendarDay
  );

  const selectedTraderDayPnl = selectedTraderDayTrades.reduce(
    (sum, trade) => sum + trade.pnl,
    0
  );

  const profitDays = calendarDaysComputed.filter((d) => d.pnl > 0).length;
  const lossDays = calendarDaysComputed.filter((d) => d.pnl < 0).length;

  const selectedCalendarTrade =
    selectedTraderDayTrades.find((trade) => trade.id === selectedCalendarTradeId) ||
    selectedTraderDayTrades[0] ||
    null;

  const monthlySummary = {
    totalPnl: filteredCalendarTrades.reduce((sum, trade) => sum + trade.pnl, 0),
    totalTrades: filteredCalendarTrades.length,
    winningTrades: filteredCalendarTrades.filter((trade) => trade.pnl > 0).length,
    losingTrades: filteredCalendarTrades.filter((trade) => trade.pnl < 0).length,
    bestDay: Math.max(...calendarDaysComputed.map((d) => d.pnl), 0),
    worstDay: Math.min(...calendarDaysComputed.map((d) => d.pnl), 0),
  };

  const winRate =
    monthlySummary.totalTrades > 0
      ? Math.round((monthlySummary.winningTrades / monthlySummary.totalTrades) * 100)
      : 0;

  const avgTradePnl =
    monthlySummary.totalTrades > 0
      ? monthlySummary.totalPnl / monthlySummary.totalTrades
      : 0;

  const grossProfit = filteredCalendarTrades
    .filter((trade) => trade.pnl > 0)
    .reduce((sum, trade) => sum + trade.pnl, 0);

  const grossLossAbs = Math.abs(
    filteredCalendarTrades
      .filter((trade) => trade.pnl < 0)
      .reduce((sum, trade) => sum + trade.pnl, 0)
  );

  const calendarProfitFactor =
    grossLossAbs > 0 ? grossProfit / grossLossAbs : grossProfit > 0 ? grossProfit : 0;

  const roomTabs = [
    "Technical Analysis",
    "Economic Calendar",
    "NFP Calendar",
    "CPI Calendar",
    "Profit Calendar",
  ];

  const upcomingMacroEvents = [...monthEvents]
    .filter((event) => {
      const eventDate = String(event.date || "");
      return eventDate >= selectedMacroDate;
    })
    .sort((a, b) =>
      `${a.date || ""} ${a.time || ""}`.localeCompare(`${b.date || ""} ${b.time || ""}`)
    )
    .slice(0, 5);

  const highImpactCount = monthEvents.filter(
    (event) => String(event.impact || "").toUpperCase() === "HIGH"
  ).length;
  const mediumImpactCount = monthEvents.filter(
    (event) => String(event.impact || "").toUpperCase() === "MEDIUM"
  ).length;
  const lowImpactCount = monthEvents.filter(
    (event) => String(event.impact || "").toUpperCase() === "LOW"
  ).length;

  const categories = ["Forex", "Surowce", "Kryptowaluty"];

  return (
    <div className="relative isolate min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-[#020817] px-2 pb-5 pt-3 text-white sm:px-4 sm:pb-6 sm:pt-5">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "linear-gradient(rgba(2,8,23,.52), rgba(2,8,23,.72)), url('/trading-room-market-bg.png')",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(circle_at_50%_15%,rgba(14,165,233,.06),transparent_45%)]"
      />
      <section className="relative z-10 mx-auto w-full min-w-0 max-w-[1600px] [&_*]:max-w-full">
        <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[.20em] text-cyan-300/70">
              FX Trade
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h1 className="text-[22px] font-black tracking-tight sm:text-3xl">TRADING ROOM</h1>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.8)]" />
                RYNEK OTWARTY
              </span>
            </div>
            <p className="mt-2 text-sm text-sky-100/55">
              Twoje centrum analizy, planu i wyników.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-[10px]">
            <div className="rounded-xl border border-cyan-300/15 bg-[#0a2946] px-4 py-3">
              <div className="text-sky-100/40">Sesja</div>
              <div className="mt-1 font-bold text-amber-300">LONDYN 🇬🇧</div>
            </div>
            <div className="rounded-xl border border-cyan-300/15 bg-[#0a2946] px-4 py-3">
              <div className="text-sky-100/40">Status</div>
              <div className="mt-1 font-bold text-emerald-300">LIVE</div>
            </div>
          </div>
        </div>

        {activeRoomTab !== "Trading Room" ? (
          <div className="mb-4 flex max-w-full gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
            <button
              onClick={() => setActiveRoomTab("Trading Room")}
              className="rounded-xl border border-cyan-300/20 bg-[#0d3b63] px-4 py-2 text-[11px] font-semibold text-white transition hover:bg-[#12517f]"
            >
              ← Trading Room
            </button>
            <button
              onClick={() => setActiveRoomTab("Technical Analysis")}
              className={`rounded-xl border px-4 py-2 text-[11px] font-semibold transition ${
                activeRoomTab === "Technical Analysis"
                  ? "border-blue-300/40 bg-blue-600 text-white"
                  : "border-cyan-300/15 bg-[#0a2946] text-sky-100/70 hover:bg-[#0f416d]"
              }`}
            >
              Technical Analysis
            </button>
            <button
              onClick={() => setActiveRoomTab("Economic Calendar")}
              className={`rounded-xl border px-4 py-2 text-[11px] font-semibold transition ${
                activeRoomTab === "Economic Calendar"
                  ? "border-cyan-300/40 bg-blue-600 text-white"
                  : "border-cyan-300/15 bg-[#0a2946] text-sky-100/70 hover:bg-[#0f416d]"
              }`}
            >
              Economic Calendar
            </button>
            <button
              onClick={() => setActiveRoomTab("Profit Calendar")}
              className={`rounded-xl border px-4 py-2 text-[11px] font-semibold transition ${
                activeRoomTab === "Profit Calendar"
                  ? "border-emerald-300/40 bg-emerald-700 text-white"
                  : "border-cyan-300/15 bg-[#0a2946] text-sky-100/70 hover:bg-[#0f416d]"
              }`}
            >
              Calendar Profit / Journal
            </button>
          </div>
        ) : null}

        {activeRoomTab === "Trading Room" ? (
          <>
            <section className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-4">
              <button
                type="button"
                onClick={() => setActiveRoomTab("Technical Analysis")}
                className="group flex h-full min-h-[500px] flex-col overflow-hidden rounded-[20px] border border-blue-400/45 bg-[#06182a] text-left shadow-[0_12px_34px_rgba(0,0,0,.24)] transition hover:-translate-y-0.5 hover:border-blue-300/70 hover:shadow-[0_0_34px_rgba(59,130,246,.22)] xl:min-h-[560px]"
              >
                <div className="relative h-[220px] shrink-0 overflow-hidden bg-[#041426] sm:h-[230px] xl:h-[245px]">
                  <div className="absolute left-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-xl border border-blue-300/20 bg-blue-600/80 shadow-[0_0_24px_rgba(37,99,235,.35)]">
                    <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 19V9M9 19V5M14 19v-7M19 19V3" />
                      <path d="m3 14 5-4 4 2 8-7" />
                    </svg>
                  </div>
                  <svg viewBox="0 0 420 245" className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
                    <defs>
                      <linearGradient id="taBg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#071d36" />
                        <stop offset="100%" stopColor="#03101f" />
                      </linearGradient>
                      <linearGradient id="taGlow" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>
                    <rect width="420" height="245" fill="url(#taBg)" />
                    <rect width="420" height="245" fill="url(#taGlow)" />
                    {Array.from({ length: 9 }).map((_, i) => <line key={`vg-${i}`} x1={i * 52.5} y1="0" x2={i * 52.5} y2="245" stroke="#38bdf8" strokeOpacity="0.08" />)}
                    {Array.from({ length: 6 }).map((_, i) => <line key={`hg-${i}`} x1="0" y1={i * 49} x2="420" y2={i * 49} stroke="#38bdf8" strokeOpacity="0.08" />)}
                    <path d="M0 176 C35 168 52 180 80 154 S128 136 157 143 S206 112 235 121 S282 93 312 103 S358 70 420 56" fill="none" stroke="#38bdf8" strokeWidth="2" strokeOpacity="0.9" />
                    <path d="M0 191 C38 188 66 176 96 169 S150 164 183 147 S237 145 270 128 S332 113 420 93" fill="none" stroke="#22c55e" strokeWidth="1.8" strokeOpacity="0.9" />
                    <path d="M0 205 C50 201 87 194 125 184 S190 173 224 162 S282 151 317 136 S370 126 420 117" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeOpacity="0.85" />
                    {[
                      [30,166,140,185,155,1],[58,153,132,172,143,1],[86,145,123,165,134,0],[114,134,115,153,124,1],
                      [142,125,108,146,116,1],[170,137,116,151,143,0],[198,126,101,144,132,1],[226,112,90,133,104,1],
                      [254,118,97,138,126,0],[282,104,79,126,91,1],[310,93,69,114,83,1],[338,86,58,101,72,1],
                      [366,75,45,91,60,1],[394,65,34,82,48,1]
                    ].map(([x,bodyY,wickY,bottomY,closeY,up],i)=>{
                      const color=up ? '#22d3ee' : '#ef4444';
                      const y=Math.min(bodyY, closeY), h=Math.max(10, Math.abs(bodyY-closeY));
                      return <g key={`c-${i}`}><line x1={x} y1={wickY} x2={x} y2={bottomY} stroke={color} strokeWidth="2"/><rect x={x-6} y={y} width="12" height={h} rx="1" fill={color} fillOpacity="0.95"/></g>
                    })}
                  </svg>
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#06182a] via-[#06182a]/55 to-transparent" />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-300/80">TECHNICAL ANALYSIS</div>
                  <h2 className="mt-1 text-[21px] font-black uppercase tracking-tight">Technical Analysis</h2>
                  <p className="mt-1 text-[11px] leading-5 text-sky-100/60">Real-time technical data and trading signals.<br />EMA, RSI, ADX, Pivot Points and more.</p>
                  <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg border border-cyan-300/10 bg-emerald-500/5 px-2 py-3"><div className="text-[9px] text-sky-100/45">TA SCORE</div><div className="mt-1 text-[18px] font-black text-emerald-300">LIVE</div></div>
                    <div className="rounded-lg border border-cyan-300/10 bg-emerald-500/5 px-2 py-3"><div className="text-[9px] text-sky-100/45">TREND</div><div className="mt-1 text-[13px] font-black text-emerald-300">AUTO</div></div>
                    <div className="rounded-lg border border-cyan-300/10 bg-amber-500/5 px-2 py-3"><div className="text-[9px] text-sky-100/45">STRENGTH</div><div className="mt-1 text-[13px] font-black text-amber-300">ADX</div></div>
                  </div>
                  <div className="mt-auto flex items-center justify-between rounded-xl border border-blue-300/20 bg-blue-600 px-4 py-3 shadow-[0_10px_28px_rgba(37,99,235,.24)] transition group-hover:bg-blue-500"><span className="text-[12px] font-bold">Otwórz analizę</span><span className="text-blue-100">→</span></div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveRoomTab("Economic Calendar")}
                className="group flex h-full min-h-[500px] flex-col overflow-hidden rounded-[20px] border border-cyan-400/25 bg-[#07192b] text-left shadow-[0_12px_34px_rgba(0,0,0,.24)] transition hover:-translate-y-0.5 hover:border-cyan-300/55 hover:shadow-[0_0_34px_rgba(34,211,238,.14)] xl:min-h-[560px]"
              >
                <div className="relative h-[220px] shrink-0 overflow-hidden sm:h-[230px] xl:h-[245px]">
                  <img
                    src="/trading-room/economic-calendar-trading.png"
                    alt="Economic Calendar"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07192b] via-transparent to-transparent" />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="text-[10px] font-bold uppercase tracking-[.18em] text-cyan-300/70">
                    LIVE MACRO
                  </div>
                  <h2 className="mt-1 text-[18px] font-bold">Economic Calendar</h2>
                  <p className="mt-1 text-[11px] leading-5 text-sky-100/50">
                    CPI, NFP, FOMC i najważniejsze wydarzenia rynkowe.
                  </p>
                  <div className="mt-auto flex items-center justify-between rounded-xl border border-cyan-300/15 bg-[#0b2d4c] px-3 py-2.5">
                    <span className="text-[11px] font-semibold">Otwórz kalendarz</span>
                    <span className="text-cyan-300">→</span>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveRoomTab("Profit Calendar")}
                className="group flex h-full min-h-[500px] flex-col overflow-hidden rounded-[20px] border border-emerald-400/25 bg-[#071b19] text-left shadow-[0_12px_34px_rgba(0,0,0,.24)] transition hover:-translate-y-0.5 hover:border-emerald-300/55 hover:shadow-[0_0_34px_rgba(16,185,129,.14)] xl:min-h-[560px]"
              >
                <div className="relative h-[220px] shrink-0 overflow-hidden sm:h-[230px] xl:h-[245px]">
                  <img
                    src="/trading-room/calendar-profit-bull.png"
                    alt="Calendar Profit"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#071b19] via-transparent to-transparent" />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="text-[10px] font-bold uppercase tracking-[.18em] text-emerald-300/70">
                    PERFORMANCE
                  </div>
                  <h2 className="mt-1 text-[18px] font-bold">Calendar Profit</h2>
                  <p className="mt-1 text-[11px] leading-5 text-emerald-50/50">
                    Kontroluj P&L, zyskowne dni i miesięczne wyniki.
                  </p>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg border border-emerald-400/10 bg-emerald-500/5 px-2 py-2">
                      <div className="text-[10px] text-emerald-100/40">P&L</div>
                      <div className={`mt-1 text-[11px] font-bold ${monthlySummary.totalPnl >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                        {monthlySummary.totalPnl >= 0 ? "+" : "-"}${Math.abs(monthlySummary.totalPnl).toFixed(0)}
                      </div>
                    </div>
                    <div className="rounded-lg border border-emerald-400/10 bg-emerald-500/5 px-2 py-2">
                      <div className="text-[10px] text-emerald-100/40">Win Rate</div>
                      <div className="mt-1 text-[11px] font-bold text-white">{winRate}%</div>
                    </div>
                    <div className="rounded-lg border border-emerald-400/10 bg-emerald-500/5 px-2 py-2">
                      <div className="text-[10px] text-emerald-100/40">Trades</div>
                      <div className="mt-1 text-[11px] font-bold text-white">{monthlySummary.totalTrades}</div>
                    </div>
                  </div>
                  <div className="mt-auto flex items-center justify-between rounded-xl border border-emerald-300/15 bg-[#0b332b] px-3 py-2.5">
                    <span className="text-[11px] font-semibold">Pokaż statystyki</span>
                    <span className="text-emerald-300">→</span>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => router.push("/journal")}
                className="group flex h-full min-h-[500px] flex-col overflow-hidden rounded-[20px] border border-violet-400/25 bg-[#15102a] text-left shadow-[0_12px_34px_rgba(0,0,0,.24)] transition hover:-translate-y-0.5 hover:border-violet-300/55 hover:shadow-[0_0_34px_rgba(139,92,246,.16)] xl:min-h-[560px]"
              >
                <div className="relative h-[220px] shrink-0 overflow-hidden sm:h-[230px] xl:h-[245px]">
                  <img
                    src="/trading-room/journal-trading.png"
                    alt="Journal"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#15102a] via-transparent to-transparent" />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="text-[10px] font-bold uppercase tracking-[.18em] text-violet-300/70">
                    TRADE JOURNAL
                  </div>
                  <h2 className="mt-1 text-[18px] font-bold">Journal</h2>
                  <p className="mt-1 text-[11px] leading-5 text-violet-50/50">
                    Dodawaj, edytuj i analizuj wszystkie swoje transakcje.
                  </p>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg border border-violet-400/10 bg-violet-500/5 px-2 py-2">
                      <div className="text-[10px] text-violet-100/40">Trades</div>
                      <div className="mt-1 text-[11px] font-bold text-white">{monthlySummary.totalTrades}</div>
                    </div>
                    <div className="rounded-lg border border-violet-400/10 bg-violet-500/5 px-2 py-2">
                      <div className="text-[10px] text-violet-100/40">Win</div>
                      <div className="mt-1 text-[11px] font-bold text-emerald-300">{monthlySummary.winningTrades}</div>
                    </div>
                    <div className="rounded-lg border border-violet-400/10 bg-violet-500/5 px-2 py-2">
                      <div className="text-[10px] text-violet-100/40">Loss</div>
                      <div className="mt-1 text-[11px] font-bold text-rose-300">{monthlySummary.losingTrades}</div>
                    </div>
                  </div>
                  <div className="mt-auto flex items-center justify-between rounded-xl border border-violet-300/15 bg-[#25184b] px-3 py-2.5">
                    <span className="text-[11px] font-semibold">Otwórz journal</span>
                    <span className="text-violet-300">→</span>
                  </div>
                </div>
              </button>
            </section>

            <section className="mt-4 rounded-[16px] border border-cyan-300/15 bg-[linear-gradient(135deg,#09233d,#07182a)] p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-[13px] font-semibold">Trading Room Premium</div>
                  <p className="mt-1 text-[10px] text-sky-100/45">
                    Technical Analysis, Economic Calendar, Calendar Profit i Journal w jednym miejscu.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-blue-300/15 bg-blue-400/5 px-3 py-1.5 text-[9px] text-blue-200">Technical</span>
                  <span className="rounded-full border border-cyan-300/15 bg-cyan-400/5 px-3 py-1.5 text-[9px] text-cyan-200">
                    Economic
                  </span>
                  <span className="rounded-full border border-emerald-300/15 bg-emerald-400/5 px-3 py-1.5 text-[9px] text-emerald-200">
                    Profit
                  </span>
                  <span className="rounded-full border border-violet-300/15 bg-violet-400/5 px-3 py-1.5 text-[9px] text-violet-200">
                    Journal
                  </span>
                </div>
              </div>
            </section>
          </>
        ) : activeRoomTab === "Technical Analysis" ? (
          <TechnicalAnalysisPanel />
        ) : activeRoomTab === "Economic Calendar" ? (
  <>
    {/* =========================================================
        FX TRADE PREMIUM — ECONOMIC CALENDAR
       ========================================================= */}
    <section className="overflow-x-auto rounded-[16px] border border-cyan-300/30 bg-[linear-gradient(145deg,#1d82c3_0%,#1466a3_58%,#0d4f84_100%)] shadow-[0_12px_32px_rgba(1,20,45,.18),0_0_28px_rgba(34,211,238,.13),inset_0_1px_0_rgba(255,255,255,.12)]">
      <div className="flex flex-col gap-4 px-3 py-4 sm:px-5 sm:py-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-[.18em] text-sky-300/65">
            Trading Room
          </div>
          <h2 className="mt-1 text-[21px] font-semibold tracking-tight text-white sm:text-[26px]">
            Economic Calendar
          </h2>
          <p className="mt-1 text-[11px] text-sky-100/50">
            Profesjonalny kalendarz makroekonomiczny bez wykresu
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[10px]">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 font-semibold text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.7)]" />
            London Active
          </span>
          <span className="rounded-full border border-[#0d579e] bg-[#0f5b96] px-3 py-1.5 text-sky-100/70">
            NY opens in 2h 15m
          </span>
        </div>
      </div>

      <div className="border-t border-[#0a417b] px-3 py-3 sm:px-5">
        <div className="flex flex-wrap gap-2">
          {roomTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveRoomTab(tab)}
              className={`rounded-[8px] border px-3 py-2 text-[10px] font-medium transition ${
                activeRoomTab === tab
                  ? "border-sky-400/50 bg-[#1269e8] text-white shadow-[0_0_16px_rgba(14,165,233,.18)]"
                  : "border-[#0d579e] bg-[#0f5b96] text-sky-100/60 hover:bg-[#1674b5] hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
    </section>

    {/* TOP FILTER / SUMMARY ROW */}
    <section className="mt-3 grid gap-3 xl:grid-cols-[.8fr_1.2fr_1fr]">
      <div className="rounded-[14px] border border-cyan-300/30 bg-[linear-gradient(145deg,#1a79b9_0%,#135f9b_52%,#0d4e82_100%)] p-4 shadow-[0_10px_28px_rgba(1,20,45,.16),0_0_24px_rgba(34,211,238,.11),inset_0_1px_0_rgba(255,255,255,.10)]">
        <h3 className="text-[14px] font-semibold text-white">Nadchodzące wydarzenia</h3>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["HIGH", highImpactCount, "border-rose-500/25 bg-rose-500/10 text-rose-300"],
            ["MEDIUM", mediumImpactCount, "border-amber-400/25 bg-amber-400/10 text-amber-300"],
            ["LOW", lowImpactCount, "border-sky-400/25 bg-sky-400/10 text-sky-300"],
            ["TOTAL", monthEvents.length, "border-violet-400/25 bg-violet-400/10 text-violet-300"],
          ].map(([label, value, tone]) => (
            <div
              key={String(label)}
              className={`rounded-[10px] border p-3 ${tone}`}
            >
              <div className="text-[8px] font-semibold uppercase tracking-[.12em] opacity-60">
                {label}
              </div>
              <div className="mt-1 text-[20px] font-bold">{String(value)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[14px] border border-cyan-300/30 bg-[linear-gradient(145deg,#1a79b9_0%,#135f9b_52%,#0d4e82_100%)] p-4 shadow-[0_10px_28px_rgba(1,20,45,.16),0_0_24px_rgba(34,211,238,.11),inset_0_1px_0_rgba(255,255,255,.10)]">
        <h3 className="text-[14px] font-semibold text-white">Filtry wydarzeń</h3>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-3">
          {[
            ["HIGH", "High Impact"],
            ["MEDIUM", "Medium Impact"],
            ["LOW", "Low Impact"],
          ].map(([key, label]) => (
            <label key={key} className="flex cursor-pointer items-center gap-2 text-[10px] text-sky-100/65">
              <input
                type="checkbox"
                checked={impactFilters[key as keyof typeof impactFilters]}
                onChange={() =>
                  setImpactFilters((prev) => ({
                    ...prev,
                    [key]: !prev[key as keyof typeof prev],
                  }))
                }
                className="h-3.5 w-3.5 accent-sky-500"
              />
              {label}
            </label>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-3">
          {Object.keys(currencyFilters).map((currency) => (
            <label
              key={currency}
              className="flex cursor-pointer items-center gap-2 text-[10px] text-sky-100/65"
            >
              <input
                type="checkbox"
                checked={currencyFilters[currency as keyof typeof currencyFilters]}
                onChange={() =>
                  setCurrencyFilters((prev) => ({
                    ...prev,
                    [currency]: !prev[currency as keyof typeof prev],
                  }))
                }
                className="h-3.5 w-3.5 accent-sky-500"
              />
              {currency}
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-[14px] border border-cyan-300/30 bg-[linear-gradient(145deg,#1a79b9_0%,#135f9b_52%,#0d4e82_100%)] p-4 shadow-[0_10px_28px_rgba(1,20,45,.16),0_0_24px_rgba(34,211,238,.11),inset_0_1px_0_rgba(255,255,255,.10)]">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={activeEventFilter || ""}
            onChange={(e) => setActiveEventFilter(e.target.value || null)}
            className="min-w-[180px] flex-1 rounded-[8px] border border-[#0d579e] bg-[#0c4b7d] px-3 py-2 text-[10px] text-sky-100 outline-none"
          >
            <option value="">Wszystkie kategorie</option>
            <option value="cpi">CPI / Inflation</option>
            <option value="nfp">NFP / Employment</option>
            <option value="fed">FED / FOMC / Powell</option>
            <option value="rates">Interest Rates</option>
            <option value="gdp">GDP</option>
            <option value="retail">Retail Sales</option>
            <option value="ppi">PPI</option>
            <option value="pce">PCE</option>
            <option value="adp">ADP Employment</option>
            <option value="jobless">Jobless Claims</option>
            <option value="pmi">PMI</option>
          </select>

          <input
            type="date"
            value={selectedMacroDate}
            onChange={(e) => setSelectedMacroDate(e.target.value)}
            className="rounded-[8px] border border-[#0d579e] bg-[#0c4b7d] px-3 py-2 text-[10px] text-sky-100 outline-none"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {["Today", "Tomorrow", "This Week", "Next Week", "CPI", "NFP", "FOMC"].map((filter) => (
            <button
              key={filter}
              onClick={() => {
                const today = new Date();

                if (filter === "Today") {
                  setSelectedMacroDate(today.toISOString().split("T")[0]);
                  setQuickFilter("today");
                  setActiveEventFilter(null);
                }

                if (filter === "Tomorrow") {
                  const tomorrow = new Date(today);
                  tomorrow.setDate(today.getDate() + 1);
                  setSelectedMacroDate(tomorrow.toISOString().split("T")[0]);
                  setQuickFilter("tomorrow");
                  setActiveEventFilter(null);
                }

                if (filter === "This Week") {
                  setQuickFilter("thisweek");
                  setActiveEventFilter(null);
                }

                if (filter === "Next Week") {
                  setQuickFilter("nextweek");
                  setActiveEventFilter(null);
                }

                if (filter === "CPI") {
                  setQuickFilter("cpi");
                  setActiveEventFilter("cpi");
                }

                if (filter === "NFP") {
                  setQuickFilter("nfp");
                  setActiveEventFilter("nfp");
                }

                if (filter === "FOMC") {
                  setQuickFilter("fomc");
                  setActiveEventFilter("fed");
                }
              }}
              className={`rounded-full border px-3 py-1.5 text-[9px] font-semibold transition ${
                quickFilter === filter.toLowerCase().replace(" ", "")
                  ? "border-sky-400/50 bg-[#1269e8] text-white"
                  : filter === "NFP"
                  ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
                  : "border-[#0d579e] bg-[#0f5b96] text-sky-100/55 hover:bg-[#1674b5]"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
    </section>

    {/* MAIN CALENDAR AREA */}
    <section className="mt-3 grid gap-3 xl:grid-cols-[1.72fr_.58fr]">
      <div className="rounded-[14px] border border-cyan-300/30 bg-[linear-gradient(145deg,#1a79b9_0%,#135f9b_52%,#0d4e82_100%)] p-4 shadow-[0_10px_28px_rgba(1,20,45,.16),0_0_24px_rgba(34,211,238,.11),inset_0_1px_0_rgba(255,255,255,.10)]">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-white">Kalendarz ekonomiczny</h3>
            <p className="mt-1 text-[10px] text-sky-100/45">
              Kliknij dzień, aby filtrować wydarzenia
            </p>
          </div>

          <select className="rounded-[8px] border border-[#0d579e] bg-[#0c4b7d] px-3 py-2 text-[10px] text-sky-100/70 outline-none">
            <option>Strefa czasowa: Europe/Warsaw</option>
          </select>
        </div>

        <div className="rounded-[11px] border border-[#0a417b] bg-[#0b4778] p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const [year, month] = selectedMacroMonth.split("-").map(Number);
                  const prev = new Date(year, month - 2, 1);
                  setSelectedMacroMonth(
                    `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`
                  );
                }}
                className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#0d579e] bg-[#0f5b96] text-sky-100/70 hover:bg-[#1674b5]"
              >
                ←
              </button>

              <h4 className="min-w-[110px] text-[11px] font-semibold text-white">
                {new Date(`${selectedMacroMonth}-01`).toLocaleDateString("pl-PL", {
                  month: "long",
                  year: "numeric",
                })}
              </h4>

              <button
                onClick={() => {
                  const [year, month] = selectedMacroMonth.split("-").map(Number);
                  const next = new Date(year, month, 1);
                  setSelectedMacroMonth(
                    `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`
                  );
                }}
                className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#0d579e] bg-[#0f5b96] text-sky-100/70 hover:bg-[#1674b5]"
              >
                →
              </button>

              <button
                onClick={() => {
                  const now = new Date();
                  const currentMonth = `${now.getFullYear()}-${String(
                    now.getMonth() + 1
                  ).padStart(2, "0")}`;
                  const currentDate = `${currentMonth}-${String(now.getDate()).padStart(2, "0")}`;

                  setSelectedMacroMonth(currentMonth);
                  setSelectedMacroDate(currentDate);
                }}
                className="rounded-[8px] border border-sky-400/35 bg-sky-500/10 px-3 py-2 text-[9px] font-semibold text-sky-200 hover:bg-sky-500/20"
              >
                Dzisiaj
              </button>
            </div>

            <div className="hidden text-[9px] text-sky-100/40 lg:block">
              CPI • NFP • FOMC oznaczone kolorami
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {Array.from(
              {
                length: new Date(
                  Number(selectedMacroMonth.split("-")[0]),
                  Number(selectedMacroMonth.split("-")[1]),
                  0
                ).getDate(),
              },
              (_, i) => String(i + 1).padStart(2, "0")
            ).map((day) => {
              const fullDate = `${selectedMacroMonth}-${day}`;
              const dayEvents = monthEvents.filter((event) => event.date === fullDate);
              const hasEvents = dayEvents.length > 0;
              const hasCpi = dayEvents.some((event) =>
                String(event.title || "").toLowerCase().includes("cpi")
              );
              const hasNfp = dayEvents.some((event) => {
                const title = String(event.title || "").toLowerCase();
                return title.includes("non-farm") || title.includes("nfp") || title.includes("payroll");
              });
              const hasFed = dayEvents.some((event) => {
                const title = String(event.title || "").toLowerCase();
                return title.includes("fomc") || title.includes("fed") || title.includes("interest rate");
              });

              return (
                <button
                  key={day}
                  onClick={() => setSelectedMacroDate(fullDate)}
                  className={`relative min-h-[38px] rounded-[7px] border px-2 py-2 text-[10px] font-medium transition ${
                    selectedMacroDate === fullDate
                      ? "border-sky-300/60 bg-[#1689ff] text-white shadow-[0_0_14px_rgba(22,137,255,.28)]"
                      : hasEvents
                      ? "border-[#0d579e] bg-[#176fae] text-white hover:border-sky-400/60"
                      : "border-transparent bg-[#0f4e7f] text-sky-100/65 hover:bg-[#156aa5]"
                  }`}
                >
                  {day}

                  {(hasCpi || hasNfp || hasFed) && (
                    <span className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-1">
                      {hasCpi ? <span className="h-1.5 w-1.5 rounded-full bg-sky-400" /> : null}
                      {hasNfp ? <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> : null}
                      {hasFed ? <span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> : null}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* SELECTED EVENT ANALYSIS */}
        {selectedMacroEvent && (
          <div className="mt-3 rounded-[11px] border border-sky-400/30 bg-sky-500/[0.07] p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[9px] font-semibold uppercase tracking-[.15em] text-sky-300">
                  AI Market Impact
                </div>
                <div className="mt-2 text-[15px] font-semibold text-white">
                  {selectedMacroEvent.event}
                </div>
                <div className="mt-1 text-[10px] text-sky-100/50">
                  {selectedMacroEvent.cur} · {selectedMacroEvent.time} ·{" "}
                  {selectedMacroEvent.impactLevel}
                </div>
              </div>

              <button
                onClick={() => setSelectedMacroEvent(null)}
                className="rounded-[8px] border border-[#0d579e] bg-[#0f5b96] px-3 py-2 text-[9px] text-sky-100/70"
              >
                Zamknij
              </button>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_.75fr]">
              <div>
                <div className="mb-2 text-[9px] uppercase tracking-[.12em] text-sky-100/40">
                  Affected Markets
                </div>
                <div className="flex flex-wrap gap-2">
                  {getAffectedMarkets(selectedMacroEvent.event).map((market) => (
                    <span
                      key={market}
                      className="rounded-full border border-sky-400/25 bg-sky-500/10 px-2.5 py-1 text-[9px] text-sky-200"
                    >
                      {market}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[9px] border border-[#0a417b] bg-[#0c4b7d] p-3">
                <div className="text-[9px] uppercase tracking-[.12em] text-sky-100/40">
                  Expected Volatility
                </div>
                <div className="mt-1 text-[13px] font-bold text-rose-300">
                  {getEventBias(selectedMacroEvent.event).volatility}
                </div>
                <div className="mt-1 text-[10px] leading-4 text-sky-100/55">
                  {getEventBias(selectedMacroEvent.event).bias}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EVENTS TABLE */}
        <div className="mt-3 overflow-x-auto rounded-[11px] border border-[#0a417b]">
          <div className="min-w-[820px]">
            <div className="grid grid-cols-[70px_95px_110px_1fr_100px_100px_100px] bg-[#0c4b7d] px-3 py-3 text-[8px] font-semibold uppercase tracking-[.1em] text-sky-100/40">
              <div>Czas</div>
              <div>Kraj</div>
              <div>Wpływ</div>
              <div>Wydarzenie</div>
              <div>Aktualny</div>
              <div>Prognoza</div>
              <div>Poprzedni</div>
            </div>

            <div className="border-t border-[#0a417b] bg-[#0b4778] px-3 py-2 text-center text-[9px] font-semibold text-sky-100/60">
              {new Date(selectedMacroDate).toLocaleDateString("pl-PL", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>

            {filteredMacroEvents.length === 0 ? (
              <div className="border-t border-[#0a417b] bg-[#0e568f] px-4 py-8 text-center text-[10px] text-sky-100/40">
                Brak wydarzeń dla wybranych filtrów.
              </div>
            ) : (
              filteredMacroEvents.map(
                ([
                  date,
                  time,
                  cur,
                  impact,
                  impactLevel,
                  event,
                  actual,
                  forecast,
                  previous,
                ]) => (
                  <button
                    type="button"
                    key={`${date}-${time}-${event}`}
                    onClick={() =>
                      setSelectedMacroEvent({
                        date,
                        time,
                        cur,
                        impact,
                        impactLevel,
                        event,
                        actual,
                        forecast,
                        previous,
                      })
                    }
                    className="grid w-full grid-cols-[70px_95px_110px_1fr_100px_100px_100px] items-center border-t border-[#0a417b] bg-[#0e568f] px-3 py-3 text-left text-[10px] text-sky-50/85 transition hover:bg-[#146da9]"
                  >
                    <div className="text-sky-100/65">{time}</div>
                    <div>{cur}</div>
                    <div>
                      <span
                        className={`inline-flex rounded-[6px] border px-2 py-1 text-[8px] font-bold ${
                          impactLevel === "HIGH"
                            ? "border-rose-400/25 bg-rose-500/10 text-rose-300"
                            : impactLevel === "MEDIUM"
                            ? "border-amber-400/25 bg-amber-400/10 text-amber-300"
                            : "border-sky-400/25 bg-sky-400/10 text-sky-300"
                        }`}
                      >
                        {impactLevel}
                      </span>
                    </div>
                    <div className="font-medium text-white">{event}</div>
                    <div className={String(actual).includes("-") ? "text-sky-100/35" : "font-semibold text-emerald-300"}>
                      {actual}
                    </div>
                    <div>{forecast}</div>
                    <div>{previous}</div>
                  </button>
                )
              )
            )}
          </div>
        </div>

        <button
          type="button"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-[8px] border border-[#0d579e] bg-[#0c4b7d] px-4 py-2.5 text-[9px] font-semibold text-sky-300 transition hover:bg-[#1674b5]"
        >
          Pokaż więcej wydarzeń →
        </button>
      </div>

      {/* RIGHT COLUMN */}
      <aside className="space-y-3">
        <div className="rounded-[14px] border border-cyan-300/30 bg-[linear-gradient(145deg,#1a79b9_0%,#135f9b_52%,#0d4e82_100%)] p-4 shadow-[0_10px_28px_rgba(1,20,45,.16),0_0_24px_rgba(34,211,238,.11),inset_0_1px_0_rgba(255,255,255,.10)]">
          <h3 className="text-[14px] font-semibold text-white">Najbliższe wydarzenia</h3>

          <div className="mt-3 space-y-2">
            {upcomingMacroEvents.length === 0 ? (
              <div className="rounded-[9px] border border-[#0a417b] bg-[#0c4b7d] p-4 text-[10px] text-sky-100/40">
                Brak nadchodzących wydarzeń.
              </div>
            ) : (
              upcomingMacroEvents.map((event) => (
                <button
                  type="button"
                  key={`${event.date}-${event.time}-${event.title}`}
                  onClick={() => {
                    setSelectedMacroDate(event.date);
                    setSelectedMacroEvent({
                      date: event.date,
                      time: event.time,
                      cur: `🇺🇸 ${event.currency}`,
                      impact: event.title,
                      impactLevel: event.impact,
                      event: event.title,
                      actual: event.actual ?? "-",
                      forecast: event.forecast ?? "-",
                      previous: event.previous ?? "-",
                    });
                  }}
                  className="min-w-0 w-full rounded-[9px] border border-[#0a417b] bg-[#0c4b7d] p-3 text-left transition hover:border-sky-400/50 hover:bg-[#115f99]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <div className="text-[10px] font-semibold text-white">{event.time || "--:--"}</div>
                      <div>
                        <div className="text-[9px] text-sky-100/45">
                          {event.currency || "USD"} · {event.impact || "MEDIUM"}
                        </div>
                        <div className="mt-1 text-[10px] font-medium text-white">
                          {event.title}
                        </div>
                      </div>
                    </div>

                    <span className="whitespace-nowrap text-[8px] text-sky-300/60">
                      {getDaysUntil(event.date)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

          <button
            type="button"
            className="mt-3 w-full rounded-[8px] border border-[#0d579e] bg-[#0f5b96] px-3 py-2.5 text-[9px] font-semibold text-sky-300 hover:bg-[#1674b5]"
          >
            Zobacz pełny kalendarz →
          </button>
        </div>

        {showMacroFilters && (
          <div className="rounded-[14px] border border-cyan-300/30 bg-[linear-gradient(145deg,#1a79b9_0%,#135f9b_52%,#0d4e82_100%)] p-4 shadow-[0_10px_28px_rgba(1,20,45,.16),0_0_24px_rgba(34,211,238,.11),inset_0_1px_0_rgba(255,255,255,.10)]">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-white">Event Filters</h3>
              <button
                onClick={() => setShowMacroFilters(false)}
                className="text-[9px] text-sky-300/60 hover:text-sky-300"
              >
                Ukryj
              </button>
            </div>

            <div className="space-y-2">
              {[
                ["cpi", "CPI / Inflation"],
                ["nfp", "NFP / Employment"],
                ["fed", "FED / FOMC / Powell"],
                ["rates", "Interest Rates"],
                ["gdp", "GDP"],
                ["retail", "Retail Sales"],
                ["ppi", "PPI"],
                ["pce", "PCE"],
                ["adp", "ADP Employment"],
                ["claims", "Jobless Claims"],
                ["pmi", "PMI"],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-[8px] border px-3 py-2.5 text-[9px] transition ${
                    activeEventFilter === key
                      ? "border-sky-400/50 bg-sky-500/10 text-sky-200"
                      : "border-[#0a417b] bg-[#0c4b7d] text-sky-100/60"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={macroFilters[key as keyof typeof macroFilters]}
                      onChange={() =>
                        setMacroFilters((prev) => ({
                          ...prev,
                          [key]: !prev[key as keyof typeof prev],
                        }))
                      }
                      className="h-3 w-3 accent-sky-500"
                    />
                    {label}
                  </span>

                  <span className="text-sky-100/35">
                    {getEventTypeCount(String(key))}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {!showMacroFilters && (
          <button
            onClick={() => setShowMacroFilters(true)}
            className="min-w-0 w-full rounded-[10px] border border-[#0d579e] bg-[#0f5b96] px-4 py-3 text-[10px] font-semibold text-sky-300 hover:bg-[#1674b5]"
          >
            Pokaż Event Filters
          </button>
        )}
      </aside>
    </section>

    {/* BOTTOM DASHBOARD CARDS */}
    <section className="mt-3 grid gap-3 xl:grid-cols-[1fr_1fr_.9fr]">
      <div className="rounded-[14px] border border-cyan-300/30 bg-[linear-gradient(145deg,#1a79b9_0%,#135f9b_52%,#0d4e82_100%)] p-4 shadow-[0_10px_28px_rgba(1,20,45,.16),0_0_24px_rgba(34,211,238,.11),inset_0_1px_0_rgba(255,255,255,.10)]">
        <h3 className="text-[14px] font-semibold text-white">Wskaźniki kluczowe</h3>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["USD Index", "103.42", "+0.23%", "text-emerald-300"],
            ["VIX", "16.85", "-2.15%", "text-rose-300"],
            ["Gold", "2,401.30", "+0.58%", "text-emerald-300"],
            ["Oil (WTI)", "78.25", "-0.34%", "text-rose-300"],
          ].map(([label, value, change, tone], index) => (
            <div key={label} className="rounded-[9px] border border-[#0a417b] bg-[#0c4b7d] p-3">
              <div className="text-[9px] text-sky-100/45">{label}</div>
              <div className="mt-1 text-[16px] font-semibold text-white">{value}</div>
              <div className={`mt-1 text-[9px] font-semibold ${tone}`}>{change}</div>

              <svg viewBox="0 0 80 28" className="mt-2 h-7 w-full">
                <polyline
                  points={
                    index % 2 === 0
                      ? "0,22 10,18 20,19 30,11 40,14 50,8 60,10 70,4 80,8"
                      : "0,8 10,11 20,7 30,19 40,16 50,22 60,13 70,18 80,10"
                  }
                  fill="none"
                  stroke={tone.includes("emerald") ? "#10b981" : "#f43f5e"}
                  strokeWidth="2"
                />
              </svg>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[14px] border border-cyan-300/30 bg-[linear-gradient(145deg,#1a79b9_0%,#135f9b_52%,#0d4e82_100%)] p-4 shadow-[0_10px_28px_rgba(1,20,45,.16),0_0_24px_rgba(34,211,238,.11),inset_0_1px_0_rgba(255,255,255,.10)]">
        <h3 className="text-[14px] font-semibold text-white">Nastroje rynkowe</h3>

        <div className="mt-4 grid gap-4 md:grid-cols-[150px_1fr]">
          <div className="flex items-center justify-center">
            <div className="relative flex h-[110px] w-[110px] items-center justify-center rounded-full border-[10px] border-[#26374d] border-t-amber-400 border-l-amber-400">
              <div className="text-center">
                <div className="text-[28px] font-bold text-white">62</div>
                <div className="text-[9px] text-sky-100/45">Neutralny</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {[
              ["Bullish", 62, "bg-emerald-400"],
              ["Neutralny", 28, "bg-amber-400"],
              ["Bearish", 10, "bg-rose-400"],
            ].map(([label, value, tone]) => (
              <div key={String(label)}>
                <div className="mb-1 flex items-center justify-between text-[9px]">
                  <span className="text-sky-100/60">{label}</span>
                  <span className="font-semibold text-white">{value}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#0b4778]">
                  <div
                    className={`h-full rounded-full ${tone}`}
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className="mt-4 w-full rounded-[8px] border border-[#0d579e] bg-[#0c4b7d] px-3 py-2.5 text-[9px] font-semibold text-sky-300 hover:bg-[#1674b5]">
          Zobacz analizę sentymentu →
        </button>
      </div>

      <div className="rounded-[14px] border border-cyan-300/30 bg-[linear-gradient(145deg,#1a79b9_0%,#135f9b_52%,#0d4e82_100%)] p-4 shadow-[0_10px_28px_rgba(1,20,45,.16),0_0_24px_rgba(34,211,238,.11),inset_0_1px_0_rgba(255,255,255,.10)]">
        <h3 className="text-[14px] font-semibold text-white">Nadchodzące sesje</h3>

        <div className="mt-3 space-y-2">
          {[
            ["London Session", "08:00 – 17:00", "Aktywna", "text-emerald-300"],
            ["New York Session", "14:30 – 23:00", "Za 2h 15m", "text-sky-300"],
            ["Tokyo Session", "02:00 – 11:00", "Zakończona", "text-sky-100/35"],
          ].map(([session, hours, status, tone]) => (
            <div key={session} className="flex items-center justify-between rounded-[9px] border border-[#0a417b] bg-[#0c4b7d] px-3 py-3">
              <div>
                <div className="text-[10px] font-medium text-white">{session}</div>
                <div className="mt-1 text-[8px] text-sky-100/40">{hours}</div>
              </div>
              <div className={`text-[9px] font-semibold ${tone}`}>{status}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    <div className="mt-3 flex items-start gap-3 rounded-[11px] border border-[#0d579e] bg-[#0c4b7d] px-4 py-3 text-[9px] text-sky-100/50">
      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-sky-400/40 text-[8px] text-sky-300">
        i
      </span>
      <div>
        <div>Czas podany w strefie Europe/Warsaw (UTC+2)</div>
        <div className="mt-1 text-sky-100/35">
          Dane dostarczane przez serwisy zewnętrzne. Opóźnienie może wynosić do 15 minut.
        </div>
      </div>
    </div>
  </>
) : activeRoomTab === "NFP Calendar" ? (

  <>
    <section className="grid gap-4 xl:grid-cols-4">
      {[
        [macroT.nextNfp, nextNfpCalendarEvent ? formatOfficialReleaseDate(nextNfpCalendarEvent.date, macroLang) : "-", nextNfpCalendarEvent ? `${nextNfpCalendarEvent.time} · ${nextNfpCalendarEvent.currency ?? "USD"}` : macroT.macroData, "text-blue-300"],
        [macroT.forecast, nextNfpCalendarEvent?.forecast ?? "-", macroT.consensus, "text-white"],
        [macroT.previous, nextNfpCalendarEvent?.previous ?? "-", macroT.previousRelease, "text-white"],
        [macroT.impact, nextNfpCalendarEvent?.impact ?? macroT.high, "USD / Gold / Indices", "text-red-300"],
      ].map(([label, value, sub, color]) => (
        <div key={label} className="rounded-[26px] border border-cyan-300/25 bg-[linear-gradient(135deg,#176fab,#11588f)] p-5 shadow-[0_8px_24px_rgba(1,20,45,.14),0_0_20px_rgba(34,211,238,.08),inset_0_1px_0_rgba(255,255,255,.09)]">
          <div className="text-sm text-white/45">{label}</div>
          <div className={`mt-3 text-3xl font-semibold ${color}`}>{value}</div>
          <div className="mt-2 text-sm text-[#8fb6ff]">{sub}</div>
        </div>
      ))}
    </section>

    <section className="mt-4 rounded-[22px] border border-cyan-300/25 bg-[linear-gradient(135deg,#176fab,#11588f)] p-5 shadow-[0_8px_24px_rgba(1,20,45,.14),0_0_20px_rgba(34,211,238,.08)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{macroT.upcomingNfp}</h3>
          <p className="mt-1 text-xs text-sky-100/55">{macroT.officialSchedule}</p>
        </div>
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        {officialUpcomingNfp.map((item, index) => (
          <div key={item.date} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0c426f] px-4 py-3">
            <div>
              <div className="font-semibold text-white">{formatOfficialReleaseDate(item.date, macroLang)}</div>
              <div className="mt-1 text-xs text-sky-100/55">{item.time} · USD</div>
            </div>
            {index === 0 ? <span className="rounded-full border border-amber-300/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold text-amber-200">{macroT.nextBadge}</span> : null}
          </div>
        ))}
      </div>
    </section>

    <section className="mt-4 rounded-[22px] border border-cyan-300/25 bg-[linear-gradient(135deg,#176fab,#11588f)] p-5 shadow-[0_8px_24px_rgba(1,20,45,.14),0_0_20px_rgba(34,211,238,.08)]">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-white">{macroT.fullYear} · NFP</h3>
        <p className="mt-1 text-xs text-sky-100/55">{macroT.officialSchedule}</p>
      </div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {OFFICIAL_NFP_2026.map((item) => {
          const past = isPastOfficialRelease(item.date);
          return (
            <div key={`nfp-full-${item.date}`} className={`flex items-center justify-between rounded-xl border px-4 py-3 ${past ? "border-white/10 bg-[#0c426f]/70" : "border-cyan-300/25 bg-[#0c426f]"}`}>
              <div>
                <div className="font-semibold text-white">{formatOfficialReleaseDate(item.date, macroLang)}</div>
                <div className="mt-1 text-xs text-sky-100/55">{item.time} · USD</div>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${past ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200" : "border-amber-300/30 bg-amber-400/10 text-amber-200"}`}>
                {past ? macroT.released : macroT.upcoming}
              </span>
            </div>
          );
        })}
      </div>
    </section>

    <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.7fr]">
      <div className="rounded-[26px] border border-cyan-300/25 bg-[linear-gradient(135deg,#176fab,#11588f)] p-5 shadow-[0_8px_24px_rgba(1,20,45,.14),0_0_20px_rgba(34,211,238,.08),inset_0_1px_0_rgba(255,255,255,.09)]">
        <div className="mb-5 flex items-center justify-between">
  <div>
    <h3 className="text-xl font-semibold">
      {macroT.nfpCalendar} {selectedNfpYear}
    </h3>

    <p className="text-sm text-white/50">
      {macroT.nfpSubtitle}
    </p>
  </div>

  <select
  value={selectedNfpYear}
  onChange={(e) => setSelectedNfpYear(e.target.value)}
  className="rounded-xl border border-white/10 bg-[#0c426f] px-4 py-2 text-white"
>
  {["2026", "2027"].map((year) => (
    <option key={year} value={year}>
      {year}
    </option>
  ))}
</select>
</div>
{selectedMacroEvent && (
  <div className="mb-5 rounded-2xl border border-blue-400/30 bg-blue-500/10 p-4">
    <div className="text-xs uppercase tracking-widest text-blue-300">
      Selected Event
    </div>

    <div className="mt-2 text-xl font-semibold">
      {selectedMacroEvent.event}
    </div>

    <div className="mt-2 text-sm text-white/60">
      {selectedMacroEvent.cur} · {selectedMacroEvent.time}
    </div>

    <div className="mt-4 flex flex-wrap gap-2">
      {["EUR/USD", "GBP/USD", "USD/JPY", "XAU/USD", "US30", "NAS100"].map(
        (market) => (
          <span
            key={market}
            className="rounded-full bg-blue-500/15 px-3 py-1 text-sm text-blue-200"
          >
            {market}
          </span>
        )
      )}
    </div>
  </div>
)}
<div className="overflow-x-auto rounded-2xl border border-white/10">
  <div className="grid grid-cols-6 bg-white/5 px-4 py-3 text-xs uppercase tracking-wider text-white/45">
    <div>{macroT.date}</div>
    <div>{macroT.time}</div>
    <div>{macroT.event}</div>
    <div>{macroT.forecast}</div>
    <div>{macroT.previous}</div>
    <div>{macroT.impact}</div>
    
  </div>

  {nfpCalendarLoading ? (
    <div className="border-t border-white/10 bg-[#0c426f] px-4 py-6 text-sm text-sky-100/70">
      Ładowanie danych NFP…
    </div>
  ) : nfpRows.length === 0 ? (
    <div className="border-t border-white/10 bg-[#0c426f] px-4 py-6 text-sm text-sky-100/70">
      Brak danych NFP dla wybranego roku.
    </div>
  ) : nfpRows.map(
    ([date, time, event, forecast, previous, impact]) => (
      <div
        key={`${date}-${event}`}
        className="grid grid-cols-6 items-center border-t border-white/10 bg-[#0c426f] px-4 py-4 text-sm hover:bg-white/5"
      >
        <div>{date}</div>
        <div>{time}</div>
        <div className="font-medium">{event}</div>
        <div>{forecast}</div>
        <div>{previous}</div>

        <div>
          <span className="rounded bg-red-500/20 px-2 py-1 text-red-300">
            {impact}
          </span>
        </div>
      </div>
    )
)}
</div>
</div>

<div className="space-y-6">
        <div className="rounded-[26px] border border-cyan-300/25 bg-[linear-gradient(135deg,#176fab,#11588f)] p-5 shadow-[0_8px_24px_rgba(1,20,45,.14),0_0_20px_rgba(34,211,238,.08),inset_0_1px_0_rgba(255,255,255,.09)]">
          <SectionTitle title={macroT.aiNfp} />
          <div className="rounded-xl bg-[#0c426f] p-4 text-sm leading-6 text-white/70">
            {macroT.aiNfpText}
          </div>
        </div>

        <div className="rounded-[26px] border border-cyan-300/25 bg-[linear-gradient(135deg,#176fab,#11588f)] p-5 shadow-[0_8px_24px_rgba(1,20,45,.14),0_0_20px_rgba(34,211,238,.08),inset_0_1px_0_rgba(255,255,255,.09)]">
          <SectionTitle title={macroT.affected} />
          <div className="flex flex-wrap gap-2">
            {["EUR/USD", "GBP/USD", "XAU/USD", "US30", "NAS100", "DXY"].map((item) => (
              <span key={item} className="rounded-full bg-blue-500/15 px-3 py-1 text-sm text-blue-200">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  </>
) : activeRoomTab === "CPI Calendar" ? (
  <>
    <section className="grid gap-4 xl:grid-cols-4">
      {[
        [macroT.nextCpi, nextCpiCalendarEvent ? formatOfficialReleaseDate(nextCpiCalendarEvent.date, macroLang) : "-", nextCpiCalendarEvent ? `${nextCpiCalendarEvent.time} · ${nextCpiCalendarEvent.currency ?? "USD"}` : macroT.macroData, "text-blue-300"],
        [macroT.forecast, nextCpiCalendarEvent?.forecast ?? "-", nextCpiCalendarEvent?.title ?? "CPI", "text-white"],
        [macroT.previous, nextCpiCalendarEvent?.previous ?? "-", macroT.previousRelease, "text-white"],
        [macroT.impact, nextCpiCalendarEvent?.impact ?? macroT.high, "USD · Gold · Indices", "text-red-300"],
      ].map(([label, value, sub, color]) => (
        <div key={label} className="rounded-[26px] border border-cyan-300/25 bg-[linear-gradient(135deg,#176fab,#11588f)] p-5 shadow-[0_8px_24px_rgba(1,20,45,.14),0_0_20px_rgba(34,211,238,.08),inset_0_1px_0_rgba(255,255,255,.09)]">
          <div className="text-sm text-white/45">{label}</div>
          <div className={`mt-3 text-3xl font-semibold ${color}`}>{value}</div>
          <div className="mt-2 text-sm text-[#8fb6ff]">{sub}</div>
        </div>
      ))}
    </section>

    <section className="mt-4 rounded-[22px] border border-cyan-300/25 bg-[linear-gradient(135deg,#176fab,#11588f)] p-5 shadow-[0_8px_24px_rgba(1,20,45,.14),0_0_20px_rgba(34,211,238,.08)]">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-white">{macroT.upcomingCpi}</h3>
        <p className="mt-1 text-xs text-sky-100/55">{macroT.officialSchedule}</p>
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        {officialUpcomingCpi.map((item, index) => (
          <div key={item.date} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0c426f] px-4 py-3">
            <div>
              <div className="font-semibold text-white">{formatOfficialReleaseDate(item.date, macroLang)}</div>
              <div className="mt-1 text-xs text-sky-100/55">{item.time} · USD</div>
            </div>
            {index === 0 ? <span className="rounded-full border border-amber-300/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold text-amber-200">{macroT.nextBadge}</span> : null}
          </div>
        ))}
      </div>
    </section>

    <section className="mt-4 rounded-[22px] border border-cyan-300/25 bg-[linear-gradient(135deg,#176fab,#11588f)] p-5 shadow-[0_8px_24px_rgba(1,20,45,.14),0_0_20px_rgba(34,211,238,.08)]">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-white">{macroT.fullYear} · CPI</h3>
        <p className="mt-1 text-xs text-sky-100/55">{macroT.officialSchedule}</p>
      </div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {OFFICIAL_CPI_2026.map((item) => {
          const past = isPastOfficialRelease(item.date);
          return (
            <div key={`cpi-full-${item.date}`} className={`flex items-center justify-between rounded-xl border px-4 py-3 ${past ? "border-white/10 bg-[#0c426f]/70" : "border-cyan-300/25 bg-[#0c426f]"}`}>
              <div>
                <div className="font-semibold text-white">{formatOfficialReleaseDate(item.date, macroLang)}</div>
                <div className="mt-1 text-xs text-sky-100/55">{item.time} · USD</div>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${past ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200" : "border-amber-300/30 bg-amber-400/10 text-amber-200"}`}>
                {past ? macroT.released : macroT.upcoming}
              </span>
            </div>
          );
        })}
      </div>
    </section>

    <section className="mt-6 rounded-[26px] border border-cyan-300/25 bg-[linear-gradient(135deg,#176fab,#11588f)] p-5 shadow-[0_8px_24px_rgba(1,20,45,.14),0_0_20px_rgba(34,211,238,.08),inset_0_1px_0_rgba(255,255,255,.09)]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">{macroT.cpiCalendar} {selectedCpiYear}</h3>
          <p className="text-sm text-white/50">{macroT.cpiSubtitle}</p>
        </div>

        <select
          value={selectedCpiYear}
          onChange={(e) => setSelectedCpiYear(e.target.value)}
          className="rounded-xl border border-white/10 bg-[#0c426f] px-4 py-2 text-white outline-none"
        >
          {["2026", "2027"].map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <div className="grid grid-cols-6 bg-white/5 px-4 py-3 text-xs uppercase tracking-wider text-white/45">
          <div>{macroT.date}</div>
          <div>{macroT.time}</div>
          <div>{macroT.event}</div>
          <div>{macroT.forecast}</div>
          <div>{macroT.previous}</div>
          <div>{macroT.impact}</div>
        </div>

        {cpiCalendarLoading ? (
          <div className="border-t border-white/10 bg-[#0c426f] px-4 py-6 text-sm text-sky-100/70">
            {macroT.loadingCpi}
          </div>
        ) : cpiRows.length === 0 ? (
          <div className="border-t border-white/10 bg-[#0c426f] px-4 py-6 text-sm text-sky-100/70">
            {macroT.noCpi}
          </div>
        ) : cpiRows.map(
          ([date, time, event, forecast, previous, impact]) => (
            <div
              key={`${date}-${event}`}
              className="grid grid-cols-6 items-center border-t border-white/10 bg-[#0c426f] px-4 py-4 text-sm hover:bg-white/5"
            >
              <div>{date}</div>
              <div>{time}</div>
              <div className="font-medium">{event}</div>
              <div>{forecast}</div>
              <div>{previous}</div>
              <div>
                <span className="rounded bg-red-500/20 px-2 py-1 text-red-300">
                  {impact}
                </span>
              </div>
            </div>
          )
        )}
      </div>
    </section>
  </>
) : activeRoomTab === "Profit Calendar" ? (
        <>
          {/* =========================================================
              FX TRADE PREMIUM — PROFIT CALENDAR
             ========================================================= */}
          <section className="overflow-x-auto rounded-[16px] border border-cyan-300/30 bg-[linear-gradient(145deg,#1d82c3_0%,#1466a3_58%,#0d4f84_100%)] shadow-[0_12px_32px_rgba(1,20,45,.18),0_0_28px_rgba(34,211,238,.13),inset_0_1px_0_rgba(255,255,255,.12)]">
            <div className="flex flex-col gap-4 px-5 py-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-[.18em] text-sky-300/65">
                  Trading Room
                </div>
                <h2 className="mt-1 text-[27px] font-semibold tracking-tight text-white">
                  Profit <span className="text-[#20a8ff]">Calendar</span>
                </h2>
                <p className="mt-1 text-[11px] text-sky-100/50">
                  Śledź swoje zyski i straty w czasie. Analizuj wyniki i buduj konsekwentne zyski.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[10px]">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 font-semibold text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.7)]" />
                  London Active
                </span>
                <span className="rounded-full border border-[#0d579e] bg-[#0f5b96] px-3 py-1.5 text-sky-100/70">
                  NY opens in 2h 15m
                </span>
              </div>
            </div>
          </section>

          {/* KPI */}
          <section className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Total P&L",
                value:
                  monthlySummary.totalPnl >= 0
                    ? `+$${monthlySummary.totalPnl.toFixed(0)}`
                    : `-$${Math.abs(monthlySummary.totalPnl).toFixed(0)}`,
                tone: monthlySummary.totalPnl >= 0 ? "text-emerald-300" : "text-rose-300",
                icon: "↗",
              },
              {
                label: "Win Rate",
                value: `${winRate}%`,
                tone: "text-emerald-300",
                icon: "🏆",
              },
              {
                label: "Avg Trade",
                value: `${avgTradePnl >= 0 ? "+" : "-"}$${Math.abs(avgTradePnl).toFixed(0)}`,
                tone: avgTradePnl >= 0 ? "text-emerald-300" : "text-rose-300",
                icon: "⚖",
              },
              {
                label: "Profit Factor",
                value: calendarProfitFactor.toFixed(2),
                tone: calendarProfitFactor >= 1 ? "text-emerald-300" : "text-rose-300",
                icon: "◎",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="relative overflow-hidden rounded-[14px] border border-cyan-300/30 bg-[linear-gradient(145deg,#1a79b9_0%,#135f9b_52%,#0d4e82_100%)] p-4 shadow-[0_10px_28px_rgba(1,20,45,.16),0_0_24px_rgba(34,211,238,.11),inset_0_1px_0_rgba(255,255,255,.10)] shadow-[inset_0_1px_0_rgba(255,255,255,.03)]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-sky-400/20 bg-sky-500/10 text-[22px] text-sky-300">
                    {stat.icon}
                  </div>
                  <div>
                    <div className="text-[10px] text-sky-100/50">{stat.label}</div>
                    <div className={`mt-1 text-[23px] font-bold ${stat.tone}`}>{stat.value}</div>
                  </div>
                </div>

                <div className="pointer-events-none absolute bottom-0 left-0 h-[2px] w-1/3 bg-gradient-to-r from-sky-400 to-transparent" />
              </div>
            ))}
          </section>

          {/* CALENDAR + ADD TRADE */}
          <section className="mt-3 grid gap-3 xl:grid-cols-[1.7fr_.66fr]">
            <div className="rounded-[14px] border border-cyan-300/30 bg-[linear-gradient(145deg,#1a79b9_0%,#135f9b_52%,#0d4e82_100%)] p-4 shadow-[0_10px_28px_rgba(1,20,45,.16),0_0_24px_rgba(34,211,238,.11),inset_0_1px_0_rgba(255,255,255,.10)]">
              <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-4">
                  <h3 className="text-[16px] font-semibold text-white">Profit Calendar</h3>

                  <div className="flex flex-wrap items-center gap-3 text-[9px] text-sky-100/55">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-[3px] bg-emerald-400" />
                      Profit
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-[3px] bg-rose-500" />
                      Loss
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-[3px] bg-slate-500" />
                      No Trade
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-[3px] bg-sky-500" />
                      Wybrany dzień
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (selectedMonth === 0) {
                        setSelectedMonth(11);
                        setSelectedYear(selectedYear - 1);
                      } else {
                        setSelectedMonth(selectedMonth - 1);
                      }
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#0d579e] bg-[#0f5b96] text-sky-100/70 transition hover:bg-[#1674b5]"
                  >
                    ‹
                  </button>

                  <div className="min-w-[120px] text-center text-[12px] font-semibold text-white">
                    {MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label} {selectedYear}
                  </div>

                  <button
                    onClick={() => {
                      if (selectedMonth === 11) {
                        setSelectedMonth(0);
                        setSelectedYear(selectedYear + 1);
                      } else {
                        setSelectedMonth(selectedMonth + 1);
                      }
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#0d579e] bg-[#0f5b96] text-sky-100/70 transition hover:bg-[#1674b5]"
                  >
                    ›
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1.5 text-center text-[9px] font-semibold text-sky-100/55">
                {["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Niedz"].map((day) => (
                  <div key={day} className="py-2">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {[
                  ...Array.from(
                    {
                      length:
                        (new Date(selectedYear, selectedMonth, 1).getDay() + 6) % 7,
                    },
                    () => null
                  ),
                  ...calendarDaysComputed,
                ].map((cell, index) => {
                  const isSelected = cell?.day === selectedTraderCalendarDay;

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        if (!cell) return;

                        setSelectedTraderCalendarDay(cell.day);
                        setSelectedCalendarTradeId(null);
                        setNewTrade((prev) => ({
                          ...prev,
                          date: formatTradeInputDate(selectedYear, selectedMonth, cell.day),
                        }));
                      }}
                      className={`relative min-h-[72px] rounded-[9px] border p-2.5 text-left transition ${
                        !cell
                          ? "pointer-events-none border-transparent bg-transparent"
                          : isSelected
                          ? "border-sky-300/70 bg-[linear-gradient(145deg,#1689ff,#0753c8)] text-white shadow-[0_0_18px_rgba(22,137,255,.28)]"
                          : cell.pnl > 0
                          ? "border-emerald-400/35 bg-emerald-500/[0.08] hover:bg-emerald-500/[0.14]"
                          : cell.pnl < 0
                          ? "border-rose-400/35 bg-rose-500/[0.08] hover:bg-rose-500/[0.14]"
                          : "border-[#0a417b] bg-[#0c4b7d] hover:bg-[#115f99]"
                      }`}
                    >
                      {cell ? (
                        <>
                          <div className="text-[10px] font-semibold text-white">{cell.day}</div>

                          <div
                            className={`mt-3 text-[16px] font-bold ${
                              isSelected
                                ? "text-white"
                                : cell.pnl > 0
                                ? "text-emerald-300"
                                : cell.pnl < 0
                                ? "text-rose-300"
                                : "text-sky-100/30"
                            }`}
                          >
                            {cell.pnl > 0
                              ? `+$${cell.pnl}`
                              : cell.pnl < 0
                              ? `-$${Math.abs(cell.pnl)}`
                              : "—"}
                          </div>

                          {cell.trades > 0 ? (
                            <div className={`mt-1 text-[8px] ${isSelected ? "text-white/70" : "text-sky-100/40"}`}>
                              {cell.trades} {cell.trades === 1 ? "trade" : "trades"}
                            </div>
                          ) : null}
                        </>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ADD / EDIT TRADE */}
            <aside className="rounded-[14px] border border-cyan-300/30 bg-[linear-gradient(145deg,#1a79b9_0%,#135f9b_52%,#0d4e82_100%)] p-4 shadow-[0_10px_28px_rgba(1,20,45,.16),0_0_24px_rgba(34,211,238,.11),inset_0_1px_0_rgba(255,255,255,.10)]">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-sky-400/20 bg-sky-500/10 text-sky-300">
                    ↗
                  </div>
                  <h3 className="text-[17px] font-semibold text-white">
                    {editingTradeId ? "Edit Trade" : "Add Trade"}
                  </h3>
                </div>

                {editingTradeId ? (
                  <button
                    onClick={resetTradeForm}
                    className="text-[9px] text-sky-100/45 hover:text-white"
                  >
                    Anuluj
                  </button>
                ) : null}
              </div>

              <div className="space-y-3">
                <select
                  value={newTrade.pair}
                  onChange={(e) => setNewTrade({ ...newTrade, pair: e.target.value })}
                  className="min-w-0 w-full rounded-[8px] border border-[#0d579e] bg-[#0c4b7d] px-3 py-2.5 text-[10px] text-white outline-none"
                >
                  {Object.values(instrumentOptions).flat().map((symbol) => (
                    <option key={symbol} value={symbol}>{symbol}</option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setNewTrade({ ...newTrade, side: "BUY" })}
                    className={`rounded-[8px] border py-2.5 text-[10px] font-bold transition ${
                      newTrade.side === "BUY"
                        ? "border-emerald-400/35 bg-emerald-500/25 text-emerald-300"
                        : "border-[#0a417b] bg-[#0c4b7d] text-sky-100/55"
                    }`}
                  >
                    BUY
                  </button>

                  <button
                    onClick={() => setNewTrade({ ...newTrade, side: "SELL" })}
                    className={`rounded-[8px] border py-2.5 text-[10px] font-bold transition ${
                      newTrade.side === "SELL"
                        ? "border-rose-400/35 bg-rose-500/20 text-rose-300"
                        : "border-[#0a417b] bg-[#0c4b7d] text-sky-100/55"
                    }`}
                  >
                    SELL
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    ["Entry", "entry", "0.0001"],
                    ["SL", "sl", "0.0001"],
                    ["TP", "tp", "0.0001"],
                  ].map(([label, key, step]) => (
                    <label key={key} className="block">
                      <span className="mb-1 block text-[8px] text-sky-100/45">{label}</span>
                      <input
                        type="number"
                        step={step}
                        value={newTrade[key as "entry" | "sl" | "tp"]}
                        onChange={(e) =>
                          setNewTrade({
                            ...newTrade,
                            [key]: e.target.value,
                          })
                        }
                        className="min-w-0 w-full rounded-[8px] border border-[#0d579e] bg-[#0c4b7d] px-2.5 py-2.5 text-[10px] text-white outline-none"
                      />
                    </label>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label>
                    <span className="mb-1 block text-[8px] text-sky-100/45">Lot</span>
                    <input
                      value={newTrade.size}
                      onChange={(e) => setNewTrade({ ...newTrade, size: e.target.value })}
                      className="min-w-0 w-full rounded-[8px] border border-[#0d579e] bg-[#0c4b7d] px-3 py-2.5 text-[10px] text-white outline-none"
                    />
                  </label>

                  <label>
                    <span className="mb-1 block text-[8px] text-sky-100/45">P&L</span>
                    <input
                      type="number"
                      value={newTrade.result}
                      onChange={(e) => setNewTrade({ ...newTrade, result: e.target.value })}
                      className="min-w-0 w-full rounded-[8px] border border-[#0d579e] bg-[#0c4b7d] px-3 py-2.5 text-[10px] text-emerald-300 outline-none"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1 block text-[8px] text-sky-100/45">Data</span>
                  <input
                    type="date"
                    value={newTrade.date}
                    onChange={(e) => setNewTrade({ ...newTrade, date: e.target.value })}
                    className="min-w-0 w-full rounded-[8px] border border-[#0d579e] bg-[#0c4b7d] px-3 py-2.5 text-[10px] text-white outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[8px] text-sky-100/45">Setup</span>
                  <input
                    value={newTrade.setup}
                    onChange={(e) => setNewTrade({ ...newTrade, setup: e.target.value })}
                    placeholder="np. London Breakout"
                    className="min-w-0 w-full rounded-[8px] border border-[#0d579e] bg-[#0c4b7d] px-3 py-2.5 text-[10px] text-white outline-none placeholder:text-sky-100/25"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[8px] text-sky-100/45">Sesja</span>
                  <select
                    value={newTrade.session}
                    onChange={(e) => setNewTrade({ ...newTrade, session: e.target.value })}
                    className="min-w-0 w-full rounded-[8px] border border-[#0d579e] bg-[#0c4b7d] px-3 py-2.5 text-[10px] text-white outline-none"
                  >
                    <option value="Asia">Asia</option>
                    <option value="London">London</option>
                    <option value="New York">New York</option>
                    <option value="US">US</option>
                    <option value="Crypto">Crypto</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-[8px] text-sky-100/45">Notatka</span>
                  <textarea
                    value={newTrade.notes}
                    onChange={(e) => setNewTrade({ ...newTrade, notes: e.target.value })}
                    placeholder="Clean breakout after liquidity sweep..."
                    className="min-h-[72px] w-full resize-none rounded-[8px] border border-[#0d579e] bg-[#0c4b7d] px-3 py-2.5 text-[10px] text-white outline-none placeholder:text-sky-100/25"
                  />
                </label>

                <button
                  onClick={editingTradeId ? handleUpdateTrade : handleAddTrade}
                  className="min-w-0 w-full rounded-[9px] border border-sky-300/30 bg-[linear-gradient(90deg,#0b9ee8,#1269e8)] px-4 py-3 text-[10px] font-bold text-white shadow-[0_0_18px_rgba(14,165,233,.18)] transition hover:brightness-110"
                >
                  {editingTradeId ? "✓ Zapisz zmiany" : "＋ Add Trade to Calendar"}
                </button>
              </div>
            </aside>
          </section>

          {/* TRADE LOG + QUICK STATS */}
          <section className="mt-3 grid gap-3 xl:grid-cols-[1.72fr_.58fr]">
            <div className="rounded-[14px] border border-cyan-300/30 bg-[linear-gradient(145deg,#1a79b9_0%,#135f9b_52%,#0d4e82_100%)] p-4 shadow-[0_10px_28px_rgba(1,20,45,.16),0_0_24px_rgba(34,211,238,.11),inset_0_1px_0_rgba(255,255,255,.10)]">
              <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-[16px] font-semibold text-white">Trade Log</h3>
                  <p className="mt-1 text-[9px] text-sky-100/45">
                    Total: {filteredCalendarTrades.length} trades · Selected day P&L:{" "}
                    <span className={selectedTraderDayPnl >= 0 ? "text-emerald-300" : "text-rose-300"}>
                      {selectedTraderDayPnl >= 0
                        ? `+$${selectedTraderDayPnl}`
                        : `-$${Math.abs(selectedTraderDayPnl)}`}
                    </span>
                  </p>
                </div>

                <button className="rounded-[8px] border border-[#0d579e] bg-[#0f5b96] px-3 py-2 text-[9px] font-semibold text-sky-300 hover:bg-[#1674b5]">
                  View All Trades
                </button>
              </div>

              <div className="overflow-x-auto rounded-[10px] border border-[#0a417b]">
                <div className="min-w-[980px]">
                  <div className="grid grid-cols-[95px_90px_70px_90px_80px_80px_80px_100px_110px_1fr_90px] bg-[#0c4b7d] px-3 py-3 text-[8px] font-semibold uppercase tracking-[.08em] text-sky-100/40">
                    <div>Data</div>
                    <div>Para</div>
                    <div>Strona</div>
                    <div>Wejście</div>
                    <div>SL</div>
                    <div>TP</div>
                    <div>Lot</div>
                    <div>Wynik</div>
                    <div>Setup</div>
                    <div>Notatki</div>
                    <div>Akcje</div>
                  </div>

                  {(selectedTraderDayTrades.length
                    ? selectedTraderDayTrades
                    : filteredCalendarTrades
                  ).map((trade) => (
                    <div
                      key={trade.id}
                      className="grid grid-cols-[95px_90px_70px_90px_80px_80px_80px_100px_110px_1fr_90px] items-center border-t border-[#0a417b] bg-[#0e568f] px-3 py-3 text-[9px] text-sky-50/80 transition hover:bg-[#146da9]"
                    >
                      <div>
                        {String(trade.day).padStart(2, "0")}.
                        {String(trade.month + 1).padStart(2, "0")}.{trade.year}
                      </div>
                      <div className="font-semibold text-white">{trade.pair}</div>
                      <div>
                        <span
                          className={`rounded-full px-2 py-1 text-[8px] font-bold ${
                            trade.side === "BUY"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-rose-500/15 text-rose-300"
                          }`}
                        >
                          {trade.side}
                        </span>
                      </div>
                      <div>{trade.entry}</div>
                      <div>{trade.sl}</div>
                      <div>{trade.tp}</div>
                      <div>{trade.size}</div>
                      <div className={`font-semibold ${trade.pnl >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                        {trade.result}
                      </div>
                      <div>{trade.setup}</div>
                      <div className="truncate pr-3 text-sky-100/55">{trade.note || "—"}</div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditTrade(trade)}
                          className="text-sky-300 hover:text-white"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTrade(trade.id)}
                          className="text-rose-300 hover:text-rose-200"
                        >
                          Usuń
                        </button>
                      </div>
                    </div>
                  ))}

                  {filteredCalendarTrades.length === 0 ? (
                    <div className="bg-[#0e568f] px-4 py-8 text-center text-[10px] text-sky-100/40">
                      Brak zapisanych transakcji w tym miesiącu.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <aside className="rounded-[14px] border border-cyan-300/30 bg-[linear-gradient(145deg,#1a79b9_0%,#135f9b_52%,#0d4e82_100%)] p-4 shadow-[0_10px_28px_rgba(1,20,45,.16),0_0_24px_rgba(34,211,238,.11),inset_0_1px_0_rgba(255,255,255,.10)]">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-sky-400/20 bg-sky-500/10 text-sky-300">
                  ▥
                </div>
                <h3 className="text-[16px] font-semibold text-white">Quick Stats</h3>
              </div>

              <div className="divide-y divide-[#0a417b]">
                {[
                  ["Total Trades", monthlySummary.totalTrades, "text-white"],
                  ["Winning Trades", `${monthlySummary.winningTrades} (${winRate}%)`, "text-emerald-300"],
                  ["Losing Trades", `${monthlySummary.losingTrades}`, "text-rose-300"],
                  [
                    "Total P&L",
                    monthlySummary.totalPnl >= 0
                      ? `+$${monthlySummary.totalPnl}`
                      : `-$${Math.abs(monthlySummary.totalPnl)}`,
                    monthlySummary.totalPnl >= 0 ? "text-emerald-300" : "text-rose-300",
                  ],
                  ["Profit Factor", calendarProfitFactor.toFixed(2), "text-white"],
                ].map(([label, value, tone]) => (
                  <div key={String(label)} className="flex items-center justify-between gap-4 py-3">
                    <span className="text-[10px] text-sky-100/55">{label}</span>
                    <span className={`text-[12px] font-bold ${tone}`}>{String(value)}</span>
                  </div>
                ))}
              </div>
            </aside>
          </section>
        </>
      ) : null}
      </section>
    </div>
  );
}