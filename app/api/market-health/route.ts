import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const baseUrl = (
    process.env.MARKET_COLLECTOR_URL ??
    process.env.NEXT_PUBLIC_US30_LIVE_URL ??
    ""
  ).replace(/\/$/, "");

  if (!baseUrl) {
    return NextResponse.json(
      { ok: false, error: "MARKET_COLLECTOR_URL is not configured" },
      { status: 503 }
    );
  }

  try {
    const response = await fetch(`${baseUrl}/health`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    const body = await response.text();

    return new NextResponse(body, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") ?? "application/json; charset=utf-8",
        "cache-control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("market-health proxy error:", error);
    return NextResponse.json(
      { ok: false, error: "Market Collector health unavailable" },
      { status: 502 }
    );
  }
}
