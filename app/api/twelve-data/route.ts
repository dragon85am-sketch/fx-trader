import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ======================================================
// CONFIG
// ======================================================

const ALLOWED_INTERVALS = new Set([
  "1min",
  "5min",
  "15min",
  "1h",
  "4h",
  "1day",
]);

const ALLOWED_SYMBOLS = new Set([
  // Metals
  "XAU/USD",

  // Forex
  "EUR/USD",
  "GBP/USD",
  "USD/JPY",

  // Index
  // Zostawiamy, chociaż na Twoim obecnym
  // planie DJI może być niedostępne.
  "DJI",

  // Crypto
  "BTC/USD",
  "ETH/USD",
  "SOL/USD",
]);

// ======================================================
// CACHE TYPES
// ======================================================

type CacheEntry = {
  data: unknown;

  createdAt: number;

  expiresAt: number;
};

// ======================================================
// GLOBAL CACHE
// ======================================================

// W development cache przeżyje kolejne requesty
// dopóki proces Next.js działa.
//
// W produkcji / serverless instancja może zostać
// zrestartowana, więc traktujemy to jako cache
// optymalizacyjny, a nie trwałą bazę danych.

const globalForTwelve =
  globalThis as typeof globalThis & {
    twelveDataCache?: Map<
      string,
      CacheEntry
    >;

    twelveDataInFlight?: Map<
      string,
      Promise<unknown>
    >;
  };

const twelveDataCache =
  globalForTwelve.twelveDataCache ??
  new Map<
    string,
    CacheEntry
  >();

const twelveDataInFlight =
  globalForTwelve.twelveDataInFlight ??
  new Map<
    string,
    Promise<unknown>
  >();

if (
  process.env.NODE_ENV !==
  "production"
) {
  globalForTwelve.twelveDataCache =
    twelveDataCache;

  globalForTwelve.twelveDataInFlight =
    twelveDataInFlight;
}

// ======================================================
// CACHE TTL
// ======================================================

function getCacheTtl(
  interval: string,
) {
  switch (interval) {
    case "1min":
      return 60_000;

    case "5min":
      return 5 * 60_000;

    case "15min":
      return 15 * 60_000;

    case "1h":
      return 60 * 60_000;

    case "4h":
      return 4 * 60 * 60_000;

    case "1day":
      return 12 * 60 * 60_000;

    default:
      return 60_000;
  }
}

// ======================================================
// CLEAN OLD CACHE
// ======================================================

function cleanExpiredCache() {
  const now = Date.now();

  for (
    const [key, entry]
    of twelveDataCache.entries()
  ) {
    if (
      entry.expiresAt <= now
    ) {
      twelveDataCache.delete(
        key,
      );
    }
  }

  // dodatkowe zabezpieczenie,
  // żeby mapa nie rosła w nieskończoność
  if (
    twelveDataCache.size > 200
  ) {
    const entries =
      Array.from(
        twelveDataCache.entries(),
      ).sort(
        (a, b) =>
          a[1].createdAt -
          b[1].createdAt,
      );

    const toDelete =
      entries.slice(
        0,
        Math.max(
          0,
          entries.length - 100,
        ),
      );

    for (
      const [key]
      of toDelete
    ) {
      twelveDataCache.delete(
        key,
      );
    }
  }
}

// ======================================================
// MAIN
// ======================================================

export async function GET(
  req: NextRequest,
) {
  const apiKey =
    process.env
      .TWELVE_DATA_API_KEY;

  // ====================================================
  // API KEY
  // ====================================================

  if (!apiKey) {
    return NextResponse.json(
      {
        status: "error",

        message:
          "Brak TWELVE_DATA_API_KEY w pliku .env.local",
      },
      {
        status: 500,
      },
    );
  }

  const {
    searchParams,
  } = new URL(req.url);

  // ====================================================
  // PARAMS
  // ====================================================

  const symbol =
    searchParams.get(
      "symbol",
    ) ?? "";

  const interval =
    searchParams.get(
      "interval",
    ) ?? "";

  const requestedOutputsize =
    Number(
      searchParams.get(
        "outputsize",
      ) ?? 220,
    );

  const outputsize =
    Math.min(
      Math.max(
        Number.isFinite(
          requestedOutputsize,
        )
          ? requestedOutputsize
          : 220,

        20,
      ),

      // Możesz później zwiększyć,
      // jeśli Twój plan pozwala.
      5000,
    );

  const timezone =
    searchParams.get(
      "timezone",
    ) ??
    "America/New_York";

  const order =
    searchParams.get(
      "order",
    ) ?? "asc";

  // ====================================================
  // VALIDATION
  // ====================================================

  if (
    !ALLOWED_SYMBOLS.has(
      symbol,
    )
  ) {
    return NextResponse.json(
      {
        status: "error",

        message:
          `Nieobsługiwany instrument: ${symbol}`,
      },
      {
        status: 400,
      },
    );
  }

  if (
    !ALLOWED_INTERVALS.has(
      interval,
    )
  ) {
    return NextResponse.json(
      {
        status: "error",

        message:
          `Nieobsługiwany timeframe: ${interval}`,
      },
      {
        status: 400,
      },
    );
  }

  // ====================================================
  // CACHE KEY
  // ====================================================

  const cacheKey = [
    symbol,
    interval,
    outputsize,
    timezone,
    order,
  ].join("|");

  const now =
    Date.now();

  cleanExpiredCache();

  // ====================================================
  // CACHE HIT
  // ====================================================

  const cached =
    twelveDataCache.get(
      cacheKey,
    );

  if (
    cached &&
    cached.expiresAt > now
  ) {
    console.log(
      `[Twelve Data CACHE HIT] ${symbol} ${interval}`,
    );

    return NextResponse.json(
      cached.data,
      {
        status: 200,

        headers: {
          "X-Twelve-Cache":
            "HIT",

          "X-Twelve-Symbol":
            symbol,

          "X-Twelve-Interval":
            interval,

          "Cache-Control":
            "no-store, max-age=0",
        },
      },
    );
  }

  // ====================================================
  // DUPLICATE REQUEST PROTECTION
  // ====================================================

  const existingRequest =
    twelveDataInFlight.get(
      cacheKey,
    );

  if (existingRequest) {
    console.log(
      `[Twelve Data IN-FLIGHT] ${symbol} ${interval}`,
    );

    try {
      const data =
        await existingRequest;

      return NextResponse.json(
        data,
        {
          status: 200,

          headers: {
            "X-Twelve-Cache":
              "IN-FLIGHT",

            "Cache-Control":
              "no-store, max-age=0",
          },
        },
      );
    } catch (error) {
      return NextResponse.json(
        {
          status: "error",

          message:
            error instanceof Error
              ? error.message
              : "Błąd Twelve Data",
        },
        {
          status: 500,
        },
      );
    }
  }

  // ====================================================
  // TWELVE DATA URL
  // ====================================================

  const url =
    new URL(
      "https://api.twelvedata.com/time_series",
    );

  url.searchParams.set(
    "symbol",
    symbol,
  );

  url.searchParams.set(
    "interval",
    interval,
  );

  url.searchParams.set(
    "outputsize",
    String(outputsize),
  );

  url.searchParams.set(
    "format",
    "JSON",
  );

  url.searchParams.set(
    "timezone",
    timezone,
  );

  url.searchParams.set(
    "order",
    order,
  );

  url.searchParams.set(
    "apikey",
    apiKey,
  );

  // ====================================================
  // REQUEST PROMISE
  // ====================================================

  const requestPromise =
    (async () => {
      console.log(
        `[Twelve Data API MISS] ${symbol} ${interval}`,
      );

      const response =
        await fetch(
          url.toString(),
          {
            method:
              "GET",

            cache:
              "no-store",

            headers: {
              Accept:
                "application/json",
            },

            signal:
              AbortSignal.timeout(
                15_000,
              ),
          },
        );

      const raw =
        await response.text();

      let data: any;

      try {
        data =
          JSON.parse(raw);
      } catch {
        throw new Error(
          "Twelve Data zwróciło nieprawidłowy JSON.",
        );
      }

      if (
        !response.ok ||
        data?.status ===
          "error"
      ) {
        throw new Error(
          data?.message ||
            `Twelve Data HTTP ${response.status}`,
        );
      }

      // ================================================
      // SAVE CACHE
      // ================================================

      const ttl =
        getCacheTtl(
          interval,
        );

      const createdAt =
        Date.now();

      twelveDataCache.set(
        cacheKey,
        {
          data,

          createdAt,

          expiresAt:
            createdAt +
            ttl,
        },
      );

      return data;
    })();

  // ====================================================
  // REGISTER IN-FLIGHT
  // ====================================================

  twelveDataInFlight.set(
    cacheKey,
    requestPromise,
  );

  try {
    const data =
      await requestPromise;

    return NextResponse.json(
      data,
      {
        status: 200,

        headers: {
          "X-Twelve-Cache":
            "MISS",

          "X-Twelve-Symbol":
            symbol,

          "X-Twelve-Interval":
            interval,

          "Cache-Control":
            "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error(
      `[Twelve Data ERROR] ${symbol} ${interval}`,
      error,
    );

    return NextResponse.json(
      {
        status: "error",

        message:
          error instanceof Error
            ? error.message
            : "Nie udało się połączyć z Twelve Data.",
      },
      {
        status: 500,
      },
    );
  } finally {
    // ================================================
    // REMOVE IN-FLIGHT
    // ================================================

    twelveDataInFlight.delete(
      cacheKey,
    );
  }
}