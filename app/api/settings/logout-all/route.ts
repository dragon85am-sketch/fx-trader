import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    await prisma.user.update({
      where: { id: auth.user.userId },
      data: {
        tokenVersion: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Wylogowano ze wszystkich urządzeń",
    });
  } catch (error) {
    console.error("LOGOUT ALL ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
