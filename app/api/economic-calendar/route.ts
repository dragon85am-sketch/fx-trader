import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const selectedDate =
      searchParams.get("date") ||
      new Date().toISOString().split("T")[0];

    const { data, error } = await supabaseAdmin
      .from("economic_events")
      .select("*")
      .eq("date", selectedDate)
      .order("time", { ascending: true });

    if (error) {
      console.error(error);
      return NextResponse.json([]);
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error(err);
    return NextResponse.json([]);
  }
}