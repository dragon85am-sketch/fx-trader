export type EconomicEvent = {
  date: string;
  time: string;
  currency: string;
  country: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  actual: string;
  forecast: string;
  previous: string;
  source?: string;
};

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: "USD",
  USA: "USD",
  GB: "GBP",
  UK: "GBP",
  EU: "EUR",
  EZ: "EUR",
  DE: "EUR",
  FR: "EUR",
  IT: "EUR",
  ES: "EUR",
  JP: "JPY",
  CA: "CAD",
  AU: "AUD",
  NZ: "NZD",
  CH: "CHF",
};

function asText(value: unknown, unit?: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  const text = String(value).trim();
  if (!text || text === "null" || text === "undefined") return "-";
  const unitText = unit == null ? "" : String(unit).trim();
  if (!unitText || text.endsWith(unitText)) return text;
  return `${text}${unitText}`;
}

function normalizeImpact(value: unknown): "HIGH" | "MEDIUM" | "LOW" {
  const impact = String(value ?? "").toLowerCase();
  if (impact.includes("high") || impact === "3") return "HIGH";
  if (impact.includes("med") || impact === "2") return "MEDIUM";
  return "LOW";
}

function splitDateTime(value: unknown) {
  const raw = String(value ?? "").trim();
  // Finnhub economic calendar commonly returns YYYY-MM-DD HH:mm:ss.
  const match = raw.match(/(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2})/);
  if (match) return { date: match[1], time: match[2] };
  return { date: "", time: "" };
}

export function normalizeFinnhubEvent(row: any): EconomicEvent | null {
  const dt = splitDateTime(row?.time ?? row?.datetime ?? row?.date);
  const date = String(row?.date ?? dt.date ?? "").slice(0, 10);
  const time = String(row?.hour ?? dt.time ?? "").slice(0, 5);
  const country = String(row?.country ?? "").toUpperCase();
  const currency = String(row?.currency ?? COUNTRY_TO_CURRENCY[country] ?? country).toUpperCase();
  const title = String(row?.event ?? row?.title ?? "").trim();

  if (!date || !title) return null;

  return {
    date,
    time: time || "--:--",
    currency: currency || "USD",
    country: country || "US",
    impact: normalizeImpact(row?.impact),
    title,
    actual: asText(row?.actual ?? row?.value ?? row?.Actual, row?.unit ?? row?.Unit),
    forecast: asText(row?.estimate ?? row?.forecast ?? row?.consensus ?? row?.Forecast, row?.unit ?? row?.Unit),
    previous: asText(row?.prev ?? row?.previous ?? row?.revised ?? row?.Previous, row?.unit ?? row?.Unit),
    source: "finnhub",
  };
}


export function normalizeTradingEconomicsEvent(row: any): EconomicEvent | null {
  const rawDate = String(row?.Date ?? row?.date ?? "").trim();
  const parsed = rawDate ? new Date(rawDate) : null;
  const date = parsed && !Number.isNaN(parsed.getTime())
    ? parsed.toISOString().slice(0, 10)
    : rawDate.slice(0, 10);
  const time = parsed && !Number.isNaN(parsed.getTime())
    ? parsed.toISOString().slice(11, 16)
    : "--:--";
  const countryName = String(row?.Country ?? row?.country ?? "").trim();
  const country = countryName.toLowerCase().includes("united states") ? "US" : countryName.toUpperCase();
  const currency = String(row?.Currency ?? row?.currency ?? COUNTRY_TO_CURRENCY[country] ?? "USD").toUpperCase();
  const title = String(row?.Event ?? row?.event ?? row?.Category ?? row?.category ?? "").trim();
  const importance = Number(row?.Importance ?? row?.importance ?? 1);

  if (!date || !title) return null;

  return {
    date,
    time,
    currency: currency || "USD",
    country: country || "US",
    impact: importance >= 3 ? "HIGH" : importance === 2 ? "MEDIUM" : "LOW",
    title,
    actual: asText(row?.Actual ?? row?.actual),
    forecast: asText(row?.Forecast ?? row?.forecast ?? row?.TEForecast ?? row?.teForecast),
    previous: asText(row?.Previous ?? row?.previous ?? row?.Revised ?? row?.revised),
    source: "tradingeconomics",
  };
}

export async function fetchTradingEconomicsCalendar(from: string, to: string): Promise<EconomicEvent[]> {
  const apiKey = process.env.TRADING_ECONOMICS_API_KEY;
  if (!apiKey) return [];

  const url =
    `https://api.tradingeconomics.com/calendar/country/united%20states/${encodeURIComponent(from)}/${encodeURIComponent(to)}` +
    `?c=${encodeURIComponent(apiKey)}&f=json`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 900 },
    });
    if (!res.ok) {
      console.error("TradingEconomics calendar HTTP", res.status);
      return [];
    }
    const payload = await res.json();
    if (!Array.isArray(payload)) return [];
    return payload
      .map((row: unknown) => normalizeTradingEconomicsEvent(row))
      .filter((event: EconomicEvent | null): event is EconomicEvent => Boolean(event))
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  } catch (error) {
    console.error("TradingEconomics calendar fetch failed:", error);
    return [];
  }
}

export async function fetchFinnhubEconomicCalendar(from: string, to: string): Promise<EconomicEvent[]> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return [];

  const url =
    `https://finnhub.io/api/v1/calendar/economic` +
    `?from=${encodeURIComponent(from)}` +
    `&to=${encodeURIComponent(to)}` +
    `&token=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 900 },
    });

    if (!res.ok) {
      console.error("Finnhub economic calendar HTTP", res.status);
      return [];
    }

    const payload = await res.json();
    const rows = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.economicCalendar)
        ? payload.economicCalendar
        : [];

    const events: EconomicEvent[] = rows
      .map((row: unknown) => normalizeFinnhubEvent(row))
      .filter((event: EconomicEvent | null): event is EconomicEvent => Boolean(event));

    return events.sort((a: EconomicEvent, b: EconomicEvent) =>
      `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)
    );
  } catch (error) {
    console.error("Finnhub economic calendar fetch failed:", error);
    return [];
  }
}
