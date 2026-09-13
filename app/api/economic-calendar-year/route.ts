import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchFinnhubEconomicCalendar, fetchTradingEconomicsCalendar } from "@/lib/economicCalendar";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year") || String(new Date().getUTCFullYear());
    if (!/^\d{4}$/.test(year)) return NextResponse.json([]);

    const from = `${year}-01-01`;
    const to = `${year}-12-31`;

    const live = await fetchFinnhubEconomicCalendar(from, to);
    if (live.length) return NextResponse.json(live);

    const tradingEconomics = await fetchTradingEconomicsCalendar(from, to);
    if (tradingEconomics.length) return NextResponse.json(tradingEconomics);

    const { data, error } = await supabaseAdmin
      .from("economic_events")
      .select("*")
      .gte("date", from)
      .lte("date", to)
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (error) {
      console.error("economic-calendar-year fallback:", error);
      return NextResponse.json([]);
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error("economic-calendar-year:", error);
    return NextResponse.json([]);
  }
}
