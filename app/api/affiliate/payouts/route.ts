import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const payouts = await prisma.payoutRequest.findMany({
      where: {
        userId: auth.user.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ payouts });
  } catch (error) {
    console.error("GET /api/affiliate/payouts error:", error);
    return NextResponse.json(
      { error: "Nie udało się pobrać historii wypłat" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const affiliateStat = await prisma.affiliateStat.findUnique({
      where: {
        userId: auth.user.userId,
      },
    });

    if (!affiliateStat) {
      return NextResponse.json(
        { error: "Nie znaleziono statystyk afiliacyjnych" },
        { status: 404 }
      );
    }

    if (affiliateStat.availablePayout < 50) {
      return NextResponse.json(
        { error: "Minimalna wypłata to 50€" },
        { status: 400 }
      );
    }

    const existingPayout = await prisma.payoutRequest.findFirst({
      where: {
        userId: auth.user.userId,
        status: {
          in: ["Pending", "Approved"],
        },
      },
    });

    if (existingPayout) {
      return NextResponse.json(
        { error: "Masz już aktywny wniosek o wypłatę" },
        { status: 400 }
      );
    }

    const payout = await prisma.payoutRequest.create({
      data: {
        userId: auth.user.userId,
        amount: affiliateStat.availablePayout,
        status: "Pending",
      },
    });

    await prisma.affiliateStat.update({
      where: {
        userId: auth.user.userId,
      },
      data: {
        availablePayout: 0,
      },
    });

    return NextResponse.json({
      ok: true,
      payout,
      message: "Wniosek o wypłatę został utworzony",
    });
  } catch (error) {
    console.error("POST /api/affiliate/payouts error:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas tworzenia wypłaty" },
      { status: 500 }
    );
  }
}