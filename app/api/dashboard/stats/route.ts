import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Brak tokenu" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    const [dashboardStat, affiliateStat] = await Promise.all([
      prisma.dashboardStat.findUnique({
        where: { userId: decoded.userId },
      }),
      prisma.affiliateStat.findUnique({
        where: { userId: decoded.userId },
      }),
    ]);

    return NextResponse.json({
      dashboardStat,
      affiliateStat,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "BÅ‚Ä…d serwera" }, { status: 500 });
  }
}
