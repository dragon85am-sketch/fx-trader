import { NextResponse } from "next/server";
import Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
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
        stripeAccountId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Nie znaleziono usera" },
        { status: 404 }
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    let stripeAccountId = user.stripeAccountId;

    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email,
        capabilities: {
          transfers: {
            requested: true,
          },
        },
      });

      stripeAccountId = account.id;

      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          stripeAccountId,
          stripeOnboardingDone: false,
          payoutsEnabled: false,
        },
      });
    }

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${appUrl}/dashboard/affiliate/payouts?connect=refresh`,
      return_url: `${appUrl}/dashboard/affiliate/payouts?connect=return`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      url: accountLink.url,
    });
  } catch (error) {
    console.error(
      "POST /api/stripe/connect/onboard error:",
      error
    );

    return NextResponse.json(
      {
        error: "Nie udało się rozpocząć onboardingu Stripe Connect",
      },
      {
        status: 500,
      }
    );
  }
}
