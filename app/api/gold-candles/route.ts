import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TwelveDataCandle = {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume?: string;
};

type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

const ALLOWED_INTERVALS = ["1min", "5min"];

function parseTime(datetime: string) {
  if (!datetime) return null;

  const normalized = datetime.includes("T")
    ? datetime
    : datetime.replace(" ", "T");

  const withTimezone = normalized.endsWith("Z")
    ? normalized
    : `${normalized}Z`;

  const timestamp = new Date(withTimezone).getTime();

  if (!Number.isFinite(timestamp)) {
    return null;
  }

  return Math.floor(timestamp / 1000);
}

function isValidCandle(candle: Candle) {
  const values = [
    candle.time,
    candle.open,
    candle.high,
    candle.low,
    candle.close,
  ];

  if (!values.every(Number.isFinite)) {
    return false;
  }

  if (candle.time <= 0) {
    return false;
  }

  if (
    candle.open <= 0 ||
    candle.high <= 0 ||
    candle.low <= 0 ||
    candle.close <= 0
  ) {
    return false;
  }

  if (
    candle.high <
    Math.max(
      candle.open,
      candle.close,
      candle.low
    )
  ) {
    return false;
  }

  if (
    candle.low >
    Math.min(
      candle.open,
      candle.close,
      candle.high
    )
  ) {
    return false;
  }

  return true;
}

function removeDuplicateTimes(candles: Candle[]) {
  const map = new Map<number, Candle>();

  for (const candle of candles) {
    map.set(candle.time, candle);
  }

  return Array.from(map.values()).sort(
    (a, b) => a.time - b.time
  );
}

function median(numbers: number[]) {
  if (!numbers.length) return 0;

  const sorted = [...numbers].sort(
    (a, b) => a - b
  );

  const middle = Math.floor(
    sorted.length / 2
  );

  if (sorted.length % 2 === 0) {
    return (
      sorted[middle - 1] +
      sorted[middle]
    ) / 2;
  }

  return sorted[middle];
}

function removeExtremeCandles(candles: Candle[]) {
  if (candles.length < 10) {
    return candles;
  }

  const ranges = candles
    .map(
      (candle) =>
        candle.high - candle.low
    )
    .filter(
      (range) =>
        Number.isFinite(range) &&
        range > 0
    );

  const medianRange = median(ranges);

  if (!medianRange || medianRange <= 0) {
    return candles;
  }

  return candles.filter((candle) => {
    const range =
      candle.high - candle.low;

    return range <= medianRange * 15;
  });
}

function cleanContinuity(candles: Candle[]) {
  if (candles.length < 2) {
    return candles;
  }

  const result: Candle[] = [
    candles[0],
  ];

  for (let i = 1; i < candles.length; i++) {
    const previous =
      result[result.length - 1];

    const current = candles[i];

    if (previous.close <= 0) {
      result.push(current);
      continue;
    }

    const gapPercent =
      Math.abs(
        current.open -
          previous.close
      ) / previous.close;

    if (gapPercent > 0.05) {
      continue;
    }

    result.push(current);
  }

  return result;
}

function getFeedDiagnostics(
  candles: Candle[]
) {
  if (!candles.length) {
    return {
      repeatedLowRatio: 0,
      repeatedHighRatio: 0,
      suspicious: false,
    };
  }

  const lowCounts =
    new Map<string, number>();

  const highCounts =
    new Map<string, number>();

  for (const candle of candles) {
    const lowKey =
      candle.low.toFixed(3);

    const highKey =
      candle.high.toFixed(3);

    lowCounts.set(
      lowKey,
      (lowCounts.get(lowKey) ?? 0) + 1
    );

    highCounts.set(
      highKey,
      (highCounts.get(highKey) ?? 0) + 1
    );
  }

  const maxLowCount =
    Math.max(...lowCounts.values());

  const maxHighCount =
    Math.max(...highCounts.values());

  const repeatedLowRatio =
    maxLowCount / candles.length;

  const repeatedHighRatio =
    maxHighCount / candles.length;

  const suspicious =
    repeatedLowRatio > 0.2 ||
    repeatedHighRatio > 0.2;

  return {
    repeatedLowRatio: Number(
      repeatedLowRatio.toFixed(3)
    ),

    repeatedHighRatio: Number(
      repeatedHighRatio.toFixed(3)
    ),

    suspicious,
  };
}

export async function GET(
  req: NextRequest
) {
  try {
    const { searchParams } =
      new URL(req.url);

    /*
     * W aplikacji używamy XAUUSD.
     * Twelve Data wymaga XAU/USD.
     */
    const requestedSymbol =
      searchParams.get("symbol") ||
      "XAUUSD";

    const symbol = "XAUUSD";

    const apiSymbol =
      requestedSymbol === "XAUUSD" ||
      requestedSymbol === "XAU/USD"
        ? "XAU/USD"
        : "XAU/USD";

    const requestedInterval =
      searchParams.get("interval") ||
      "1min";

    const interval =
      ALLOWED_INTERVALS.includes(
        requestedInterval
      )
        ? requestedInterval
        : "1min";

    const outputsizeRaw =
      searchParams.get("outputsize") ||
      "250";

    const outputsize = Math.min(
      Math.max(
        Number(outputsizeRaw) || 250,
        50
      ),
      5000
    );

    const apiKey =
      process.env.TWELVE_DATA_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Brak TWELVE_DATA_API_KEY w .env.local",
        },
        {
          status: 500,
        }
      );
    }

    const params =
      new URLSearchParams({
        symbol: apiSymbol,
        interval,
        outputsize:
          String(outputsize),
        apikey: apiKey,
        format: "JSON",
      });

    const url =
      `https://api.twelvedata.com/time_series?${params.toString()}`;

    const response =
      await fetch(url, {
        cache: "no-store",
        headers: {
          Accept:
            "application/json",
        },
      });

    const data =
      await response.json();

    if (
      !response.ok ||
      data?.status === "error"
    ) {
      console.error(
        "Twelve Data error:",
        data
      );

      return NextResponse.json(
        {
          ok: false,

          symbol,

          apiSymbol,

          interval,

          error:
            data?.message ||
            "Błąd Twelve Data",

          code:
            data?.code ?? null,
        },
        {
          status: 500,
        }
      );
    }

    if (!Array.isArray(data?.values)) {
      return NextResponse.json(
        {
          ok: false,

          symbol,

          apiSymbol,

          interval,

          error:
            "Twelve Data nie zwróciło tablicy values",
        },
        {
          status: 500,
        }
      );
    }

    const mappedCandles: Candle[] =
      (
        data.values as TwelveDataCandle[]
      )
        .map((item): Candle => {
          const time =
            parseTime(
              item.datetime
            );

          const open =
            Number(item.open);

          const high =
            Number(item.high);

          const low =
            Number(item.low);

          const close =
            Number(item.close);

          const volume =
            item.volume !== undefined
              ? Number(item.volume)
              : undefined;

          return {
            time: time ?? 0,
            open,
            high,
            low,
            close,

            ...(Number.isFinite(volume)
              ? { volume }
              : {}),
          };
        })
        .filter(isValidCandle);

    const sortedCandles = [
      ...mappedCandles,
    ].sort(
      (a, b) =>
        a.time - b.time
    );

    const uniqueCandles =
      removeDuplicateTimes(
        sortedCandles
      );

    const withoutExtremes =
      removeExtremeCandles(
        uniqueCandles
      );

    const cleanedCandles =
      cleanContinuity(
        withoutExtremes
      );

    const diagnostics =
      getFeedDiagnostics(
        cleanedCandles
      );

    const firstCandle =
      cleanedCandles[0] ?? null;

    const lastCandle =
      cleanedCandles[
        cleanedCandles.length - 1
      ] ?? null;

    return NextResponse.json(
      {
        ok: true,

        /*
         * Symbol dla Twojej aplikacji.
         */
        symbol,

        /*
         * Symbol faktycznie wysłany
         * do Twelve Data.
         */
        apiSymbol,

        interval,

        count:
          cleanedCandles.length,

        candles:
          cleanedCandles,

        feed: {
          suspicious:
            diagnostics.suspicious,

          repeatedLowRatio:
            diagnostics.repeatedLowRatio,

          repeatedHighRatio:
            diagnostics.repeatedHighRatio,
        },

        debug: {
          requestedSymbol,

          apiSymbol,

          returnedSymbol:
            data?.meta?.symbol ??
            null,

          exchange:
            data?.meta?.exchange ??
            null,

          currency:
            data?.meta?.currency ??
            null,

          type:
            data?.meta?.type ??
            null,

          timezone:
            data?.meta
              ?.exchange_timezone ??
            null,

          received:
            data.values.length,

          mapped:
            mappedCandles.length,

          unique:
            uniqueCandles.length,

          cleaned:
            cleanedCandles.length,

          firstTime:
            firstCandle?.time ??
            null,

          lastTime:
            lastCandle?.time ??
            null,

          firstPrice:
            firstCandle?.open ??
            null,

          lastPrice:
            lastCandle?.close ??
            null,
        },
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(
      "gold-candles route error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : "Nieznany błąd serwera",
      },
      {
        status: 500,
      }
    );
  }
}