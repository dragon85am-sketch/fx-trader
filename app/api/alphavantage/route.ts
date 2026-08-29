import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const fn = searchParams.get("fn");
    const symbol = searchParams.get("symbol");
    const market = searchParams.get("market");
    const fromSymbol = searchParams.get("from_symbol");
    const toSymbol = searchParams.get("to_symbol");
    const interval = searchParams.get("interval");
    const outputsize = searchParams.get("outputsize") ?? "full";

    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "ALPHA_VANTAGE_API_KEY missing in .env.local" },
        { status: 500 }
      );
    }

    if (!fn || !interval) {
      return Response.json(
        { error: "Missing required query params", received: { fn, interval } },
        { status: 400 }
      );
    }

    let url = `https://www.alphavantage.co/query?function=${encodeURIComponent(
      fn
    )}&interval=${encodeURIComponent(interval)}&outputsize=${encodeURIComponent(
      outputsize
    )}&apikey=${encodeURIComponent(apiKey)}`;

    if (fn === "CRYPTO_INTRADAY") {
      if (!symbol || !market) {
        return Response.json(
          { error: "Missing crypto params", received: { symbol, market } },
          { status: 400 }
        );
      }

      url += `&symbol=${encodeURIComponent(symbol)}&market=${encodeURIComponent(market)}`;
    } else if (fn === "FX_INTRADAY") {
      if (!fromSymbol || !toSymbol) {
        return Response.json(
          { error: "Missing forex params", received: { fromSymbol, toSymbol } },
          { status: 400 }
        );
      }

      url += `&from_symbol=${encodeURIComponent(fromSymbol)}&to_symbol=${encodeURIComponent(
        toSymbol
      )}`;
    } else {
      return Response.json({ error: `Unsupported function: ${fn}` }, { status: 400 });
    }

    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    const data = await res.json();

    return Response.json(data, { status: res.status });
  } catch (err: any) {
    return Response.json(
      { error: err?.message ?? "Unknown Alpha Vantage proxy error" },
      { status: 500 }
    );
  }
}