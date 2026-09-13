import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchFinnhubEconomicCalendar, fetchTradingEconomicsCalendar } from "@/lib/economicCalendar";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const selectedDate = searchParams.get("date") || new Date().toISOString().split("T")[0];

    // Primary source: live macro calendar. This fixes empty months without manual seeding.
    const live = await fetchFinnhubEconomicCalendar(selectedDate, selectedDate);
    if (live.length) return NextResponse.json(live);

    const tradingEconomics = await fetchTradingEconomicsCalendar(selectedDate, selectedDate);
    if (tradingEconomics.length) return NextResponse.json(tradingEconomics);

    // Safe fallback: rows already stored in Supabase.
    const { data, error } = await supabaseAdmin
      .from("economic_events")
      .select("*")
      .eq("date", selectedDate)
      .order("time", { ascending: true });

    if (error) {
      console.error("economic-calendar fallback:", error);
      return NextResponse.json([]);
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("economic-calendar:", err);
    return NextResponse.json([]);
  }
}
