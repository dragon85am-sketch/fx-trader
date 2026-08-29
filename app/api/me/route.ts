import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const auth = await requireAuth();

    if (!auth.ok) {
      return auth.response;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: auth.user.userId,
      },

      select: {
        id: true,
        email: true,
        name: true,
        role: true,

        theme: true,
        language: true,

        isPremium: true,
        premiumSince: true,
        premiumUntil: true,
        cancelAtPeriodEnd: true,

        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "Nie znaleziono uÅ¼ytkownika",
        },
        {
          status: 404,
        }
      );
    }

    const premiumActive =
      user.role === "admin" ||
      (
        user.isPremium === true &&
        !!user.premiumUntil &&
        user.premiumUntil.getTime() > Date.now()
      );

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,

        theme: user.theme,
        language: user.language,

        isPremium: premiumActive,

        premiumSince:
          user.premiumSince?.toISOString() ?? null,

        premiumUntil:
          user.premiumUntil?.toISOString() ?? null,

        cancelAtPeriodEnd:
          user.cancelAtPeriodEnd,

        hasStripeCustomer:
          Boolean(user.stripeCustomerId),

        hasStripeSubscription:
          Boolean(user.stripeSubscriptionId),
      },
    });
  } catch (error) {
    console.error("GET /api/me error:", error);

    return NextResponse.json(
      {
        error: "BÅ‚Ä…d serwera",
      },
      {
        status: 500,
      }
    );
  }
}
