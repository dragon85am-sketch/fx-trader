import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ROOT = "https://www.live-rates.com";

async function getJson(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" }, signal: controller.signal });
    const text = await res.text();
    let body: unknown = text;
    try { body = JSON.parse(text); } catch {}
    return { ok: res.ok, status: res.status, body };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(req: NextRequest) {
  const key = process.env.LIVE_RATES_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "Brak LIVE_RATES_API_KEY." }, { status: 500 });

  const sp = new URL(req.url).searchParams;
  const mode = (sp.get("mode") || "list").toLowerCase();

  try {
    if (mode === "list") {
      const url = `${ROOT}/historical/list?key=${encodeURIComponent(key)}`;
      const r = await getJson(url);
      return NextResponse.json({ ok: r.ok, provider: "live-rates", mode: "list", note: "Sprawdź, czy odpowiedź zawiera US30/US_30. Jeśli nie, Live-Rates nie udostępnia historii dla US30 w tym API.", raw: r.body }, { status: r.ok ? 200 : r.status });
    }

    if (mode === "series") {
      const base = (sp.get("base") || "USD").toUpperCase();
      const symbols = (sp.get("symbols") || "").toUpperCase();
      const start = sp.get("start");
      const end = sp.get("end");
      if (!start || !end) return NextResponse.json({ ok: false, error: "Dla mode=series podaj start=YYYY-MM-DD i end=YYYY-MM-DD." }, { status: 400 });

      const p = new URLSearchParams({ base, start, end, key });
      if (symbols) p.set("symbols", symbols);
      const r = await getJson(`${ROOT}/historical/series?${p.toString()}`);
      return NextResponse.json({ ok: r.ok, provider: "live-rates", mode: "series", base, symbols: symbols || null, start, end, warning: "To API jest dokumentowane jako dzienne dane historyczne/time series; nie zakładamy, że są to świece M1/M5/M15/H1/H4.", raw: r.body }, { status: r.ok ? 200 : r.status });
    }

    if (mode === "day") {
      const base = (sp.get("base") || "USD").toUpperCase();
      const symbols = (sp.get("symbols") || "").toUpperCase();
      const date = sp.get("date");
      if (!date) return NextResponse.json({ ok: false, error: "Dla mode=day podaj date=YYYY-MM-DD." }, { status: 400 });
      const p = new URLSearchParams({ base, date, key });
      if (symbols) p.set("symbols", symbols);
      const r = await getJson(`${ROOT}/historical?${p.toString()}`);
      return NextResponse.json({ ok: r.ok, provider: "live-rates", mode: "day", base, symbols: symbols || null, date, raw: r.body }, { status: r.ok ? 200 : r.status });
    }

    return NextResponse.json({ ok: false, error: "Nieznany mode. Użyj list, series albo day." }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ ok: false, provider: "live-rates", error: e instanceof Error ? e.message : "Nieznany błąd" }, { status: 500 });
  }
}
