import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    await prisma.$queryRaw`SELECT 1 as ok`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DB TEST ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "Database check failed" },
      { status: 500 }
    );
  }
}
