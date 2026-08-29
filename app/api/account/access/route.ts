import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAuth();

  if (!auth.ok) {
    return auth.response;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: auth.user.userId,
    },

    select: {
      isPremium: true,
      premiumUntil: true,
      cancelAtPeriodEnd: true,
      role: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      {
        error: "User not found",
      },
      {
        status: 404,
      }
    );
  }

  const active =
    user.role === "admin" ||
    (
      user.isPremium === true &&
      !!user.premiumUntil &&
      user.premiumUntil.getTime() > Date.now()
    );

  return NextResponse.json({
    isPremium: active,

    premiumUntil:
      user.premiumUntil?.toISOString() ?? null,

    cancelAtPeriodEnd:
      user.cancelAtPeriodEnd,

    role:
      user.role,
  });
}
