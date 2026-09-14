export type LiveRate = {
  symbol: string;
  currency: string;
  rate: number | null;
  bid: number | null;
  ask: number | null;
  high: number | null;
  low: number | null;
  open: number | null;
  close: number | null;
  timestamp: number;
};

export async function getLiveRate(symbol: string): Promise<LiveRate> {
  const res = await fetch(`/api/live-rates?symbol=${encodeURIComponent(symbol)}`, {
    cache: "no-store",
  });

  const data = await res.json();
  if (!res.ok || !data?.ok || !data?.data) {
    throw new Error(data?.message || `Nie udało się pobrać ${symbol} z Live-Rates.`);
  }

  return data.data as LiveRate;
}
