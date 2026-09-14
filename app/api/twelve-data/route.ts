import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const ALLOWED_INTERVALS = new Set([
  "1min",
  "5min",
  "15min",
  "30min",
  "1h",
  "4h",
  "1day",
]);

const ALLOWED_SYMBOLS = new Set([
  "XAU/USD",
  "EUR/USD",
  "GBP/USD",
  "GBP/CHF",
  "USD/JPY",
  "USD/CAD",
  "AUD/USD",
  "EUR/GBP",
  "DJI",
  "BTC/USD",
  "ETH/USD",
  "SOL/USD",
]);

type CacheEntry = {
  data: unknown;
  expiresAt: number;
  staleUntil: number;
};

type TwelveGlobal = typeof globalThis & {
  fxTwelveCache?: Map<string, CacheEntry>;
  fxTwelveInflight?: Map<string, Promise<unknown>>;
};

const globalForTwelve = globalThis as TwelveGlobal;

/*
 * Cache trzymamy globalnie w procesie Node.
 * Przy ciepłej instancji Vercel kolejne requesty korzystają
 * z tej samej mapy zamiast ponownie odpalać Twelve Data.
 */
const cache =
  globalForTwelve.fxTwelveCache ??
  new Map<string, CacheEntry>();

const inflight =
  globalForTwelve.fxTwelveInflight ??
  new Map<string, Promise<unknown>>();

globalForTwelve.fxTwelveCache = cache;
globalForTwelve.fxTwelveInflight = inflight;

/*
 * Celowo dłuższe TTL.
 *
 * Alpha Scanner nie potrzebuje odpytywać Twelve Data
 * co kilka sekund, ponieważ analizujemy świece.
 */
function getCacheTtl(interval: string) {
  switch (interval) {
    case "1min":
      return 60_000;

    case "5min":
      return 5 * 60_000;

    case "15min":
      return 10 * 60_000;

    case "30min":
      return 15 * 60_000;

    case "1h":
      return 30 * 60_000;

    case "4h":
      return 60 * 60_000;

    case "1day":
      return 4 * 60 * 60_000;

    default:
      return 5 * 60_000;
  }
}

/*
 * Jeżeli Twelve Data chwilowo padnie albo limit zostanie
 * osiągnięty, możemy jeszcze pokazać ostatnie poprawne dane.
 */
function getStaleTtl(interval: string) {
  switch (interval) {
    case "1min":
      return 15 * 60_000;

    case "5min":
      return 60 * 60_000;

    case "15min":
    case "30min":
      return 2 * 60 * 60_000;

    case "1h":
      return 6 * 60 * 60_000;

    case "4h":
    case "1day":
      return 24 * 60 * 60_000;

    default:
      return 60 * 60_000;
  }
}

function json(
  data: unknown,
  cacheStatus: string,
  status = 200
) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Twelve-Cache": cacheStatus,
    },
  });
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.TWELVE_DATA_API_KEY;

  if (!apiKey) {
    return json(
      {
        status: "error",
        message:
          "Brak TWELVE_DATA_API_KEY w Environment Variables.",
      },
      "ERROR",
      500
    );
  }

  const { searchParams } = new URL(req.url);

  const symbol = searchParams.get("symbol") ?? "";
  const interval = searchParams.get("interval") ?? "";

  const outputsize = Math.min(
    Math.max(
      Number(searchParams.get("outputsize") ?? 260) || 260,
      20
    ),
    5000
  );

  const timezone =
    searchParams.get("timezone") ?? "UTC";

  const order =
    searchParams.get("order") ?? "asc";

  if (!ALLOWED_SYMBOLS.has(symbol)) {
    return json(
      {
        status: "error",
        message: `Nieobsługiwany instrument: ${symbol}`,
      },
      "ERROR",
      400
    );
  }

  if (!ALLOWED_INTERVALS.has(interval)) {
    return json(
      {
        status: "error",
        message: `Nieobsługiwany timeframe: ${interval}`,
      },
      "ERROR",
      400
    );
  }

  /*
   * Ten sam instrument + TF + outputsize
   * = ten sam cache.
   */
  const cacheKey = [
    symbol,
    interval,
    outputsize,
    timezone,
    order,
  ].join("|");

  const now = Date.now();

  const cached = cache.get(cacheKey);

  /*
   * Świeże dane.
   */
  if (cached && cached.expiresAt > now) {
    return json(cached.data, "HIT");
  }

  /*
   * Jeżeli identyczne zapytanie właśnie trwa,
   * następny użytkownik czeka na ten sam Promise.
   *
   * Nie robimy drugiego requestu do Twelve Data.
   */
  const pending = inflight.get(cacheKey);

  if (pending) {
    try {
      const data = await pending;
      return json(data, "IN-FLIGHT");
    } catch (error) {
      if (cached && cached.staleUntil > now) {
        return json(cached.data, "STALE");
      }

      return json(
        {
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Twelve Data error",
        },
        "ERROR",
        500
      );
    }
  }

  const url = new URL(
    "https://api.twelvedata.com/time_series"
  );

  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", interval);
  url.searchParams.set(
    "outputsize",
    String(outputsize)
  );
  url.searchParams.set("format", "JSON");
  url.searchParams.set("timezone", timezone);
  url.searchParams.set("order", order);
  url.searchParams.set("apikey", apiKey);

  const promise = (async () => {
    const response = await fetch(url.toString(), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15_000),
    });

    const raw = await response.text();

    let data: any;

    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error(
        "Twelve Data zwróciło nieprawidłowy JSON."
      );
    }

    /*
     * Ważne:
     * Twelve Data często zwraca HTTP 200 nawet,
     * gdy w JSON jest status:error.
     */
    if (
      !response.ok ||
      data?.status === "error" ||
      data?.code
    ) {
      throw new Error(
        data?.message ||
          `Twelve Data HTTP ${response.status}`
      );
    }

    const ttl = getCacheTtl(interval);
    const staleTtl = getStaleTtl(interval);

    cache.set(cacheKey, {
      data,
      expiresAt: Date.now() + ttl,
      staleUntil:
        Date.now() + ttl + staleTtl,
    });

    return data;
  })();

  inflight.set(cacheKey, promise);

  try {
    const data = await promise;

    return json(data, "MISS");
  } catch (error) {
    /*
     * Twelve Data limit / timeout / chwilowy problem:
     * zwracamy ostatnie poprawne świece zamiast
     * wyczyścić cały wykres.
     */
    const fallback = cache.get(cacheKey);

    if (
      fallback &&
      fallback.staleUntil > Date.now()
    ) {
      return json(fallback.data, "STALE");
    }

    return json(
      {
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Nie udało się połączyć z Twelve Data.",
      },
      "ERROR",
      500
    );
  } finally {
    inflight.delete(cacheKey);
  }
}