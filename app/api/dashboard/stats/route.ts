import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const headers = { "Cache-Control": "private, no-store, max-age=0" };

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Brak tokenu" }, { status: 401, headers });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("Dashboard stats: JWT_SECRET is not configured");
      return NextResponse.json({ error: "Błąd serwera" }, { status: 500, headers });
    }

    let userId: string;
    try {
      const decoded = jwt.verify(token, secret);
      if (typeof decoded === "string" || typeof decoded.userId !== "string" || !decoded.userId) {
        return NextResponse.json({ error: "Nieprawidłowy token" }, { status: 401, headers });
      }
      userId = decoded.userId;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
        return NextResponse.json({ error: "Nieprawidłowy lub wygasły token" }, { status: 401, headers });
      }
      throw error;
    }

    const [dashboardStat, affiliateStat] = await Promise.all([
      prisma.dashboardStat.findUnique({ where: { userId } }),
      prisma.affiliateStat.findUnique({ where: { userId } }),
    ]);

    return NextResponse.json({ dashboardStat, affiliateStat }, { headers });
  } catch (error) {
    console.error("Dashboard stats API error:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500, headers });
  }
}
