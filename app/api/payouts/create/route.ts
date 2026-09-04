import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Brak tokena" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    const userId = decoded.userId;

    const stat = await prisma.affiliateStat.findUnique({
      where: { userId },
    });

    if (!stat || stat.availablePayout <= 0) {
      return NextResponse.json(
        { error: "Brak środków do wypłaty" },
        { status: 400 }
      );
    }

    // ðŸ”¥ CREATE PAYOUT
    await prisma.payoutRequest.create({
      data: {
        userId,
        amount: stat.availablePayout,
        status: "Pending",
      },
    });

    // ðŸ”¥ RESET SALDA
    await prisma.affiliateStat.update({
      where: { userId },
      data: {
        availablePayout: 0,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("PAYOUT ERROR:", e);
    return NextResponse.json(
      { error: "Błąd serwera" },
      { status: 500 }
    );
  }
}
