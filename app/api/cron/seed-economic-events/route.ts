import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
 const events = [
  {
    date: "2026-06-16",
    time: "14:30",
    currency: "USD",
    country: "US",
    impact: "HIGH",
    title: "Retail Sales m/m",
    actual: "-",
    forecast: "0.4%",
    previous: "0.1%",
  },

  {
    date: "2026-06-17",
    time: "20:00",
    currency: "USD",
    country: "US",
    impact: "HIGH",
    title: "FOMC Interest Rate Decision",
    actual: "-",
    forecast: "4.50%",
    previous: "4.50%",
  },

  {
    date: "2026-06-18",
    time: "14:30",
    currency: "USD",
    country: "US",
    impact: "HIGH",
    title: "Initial Jobless Claims",
    actual: "-",
    forecast: "220K",
    previous: "218K",
  },

  {
    date: "2026-06-11",
    time: "14:30",
    currency: "USD",
    country: "US",
    impact: "HIGH",
    title: "Core CPI m/m",
    actual: "-",
    forecast: "0.3%",
    previous: "0.4%",
  },

  {
    date: "2026-06-11",
    time: "14:30",
    currency: "USD",
    country: "US",
    impact: "HIGH",
    title: "CPI y/y",
    actual: "-",
    forecast: "3.4%",
    previous: "3.5%",
  },

  // <-- TU DODAJ NFP
  {
    date: "2026-06-19",
    time: "14:30",
    currency: "USD",
    country: "US",
    impact: "HIGH",
    title: "Non-Farm Payrolls",
    actual: "-",
    forecast: "185K",
    previous: "177K",
  },
];

  const { data, error } = await supabaseAdmin
    .from("economic_events")
    .insert(events)
    .select();

  return NextResponse.json({
    success: !error,
    inserted: data?.length ?? 0,
    error,
  });
}
