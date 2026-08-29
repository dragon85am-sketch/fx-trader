import { NextRequest, NextResponse } from "next/server";

const BINANCE_BASE = "https://api.binance.com";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json(
        { error: "Brak parametru path" },
        { status: 400 }
      );
    }

    const upstreamParams = new URLSearchParams(searchParams);
    upstreamParams.delete("path");

    const targetUrl = `${BINANCE_BASE}${path}?${upstreamParams.toString()}`;

    const res = await fetch(targetUrl, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    const text = await res.text();

    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    console.error("BINANCE PROXY ERROR:", error);

    return NextResponse.json(
      { error: "Nie udało się pobrać danych z Binance" },
      { status: 500 }
    );
  }
}