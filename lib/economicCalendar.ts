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
    actual: asText(row?.actual, row?.unit),
    forecast: asText(row?.estimate ?? row?.forecast, row?.unit),
    previous: asText(row?.prev ?? row?.previous, row?.unit),
    source: "finnhub",
  };
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
