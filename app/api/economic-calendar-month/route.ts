import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const month = searchParams.get("month") || "2026-06";

    const from = `${month}-01`;
    const to = `${month}-30`;

    const { data, error } = await supabaseAdmin
      .from("economic_events")
      .select("*")
      .gte("date", from)
      .lte("date", to)
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (error) {
      return NextResponse.json([]);
    }

    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json([]);
  }
}