import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const productId = searchParams.get("product_id");
    const granularity = searchParams.get("granularity") ?? "300";

    if (!productId) {
      return Response.json({ error: "Missing product_id" }, { status: 400 });
    }

    const url = `https://api.exchange.coinbase.com/products/${encodeURIComponent(
      productId
    )}/candles?granularity=${encodeURIComponent(granularity)}`;

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
      { error: err?.message ?? "Coinbase proxy error" },
      { status: 500 }
    );
  }
}