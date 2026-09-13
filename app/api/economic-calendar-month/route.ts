import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchFinnhubEconomicCalendar, fetchTradingEconomicsCalendar } from "@/lib/economicCalendar";

export const dynamic = "force-dynamic";

function lastDayOfMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const last = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return String(last).padStart(2, "0");
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const defaultMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    const month = searchParams.get("month") || defaultMonth;

    if (!/^\d{4}-\d{2}$/.test(month)) return NextResponse.json([]);

    const from = `${month}-01`;
    const to = `${month}-${lastDayOfMonth(month)}`;

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
      console.error("economic-calendar-month fallback:", error);
      return NextResponse.json([]);
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error("economic-calendar-month:", error);
    return NextResponse.json([]);
  }
}
