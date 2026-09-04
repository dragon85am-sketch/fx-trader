import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  
});

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const user = await prisma.user.findUnique({
      where: { id: auth.user.userId },
      select: {
        id: true,
        stripeAccountId: true,
      },
    });

    if (!user?.stripeAccountId) {
      return NextResponse.json({
        connected: false,
        onboardingComplete: false,
        payoutsEnabled: false,
        requirements: [],
      });
    }

    const account = await stripe.accounts.retrieve(user.stripeAccountId);

    const onboardingComplete = Boolean(account.details_submitted);
    const payoutsEnabled = Boolean(account.payouts_enabled);
    const requirements = [
      ...(account.requirements?.currently_due ?? []),
      ...(account.requirements?.eventually_due ?? []),
      ...(account.requirements?.past_due ?? []),
    ];

    await prisma.user.update({
      where: { id: user.id },
      data: {
        stripeOnboardingDone: onboardingComplete,
        payoutsEnabled,
      },
    });

    return NextResponse.json({
      connected: true,
      onboardingComplete,
      payoutsEnabled,
      requirements,
      stripeAccountId: user.stripeAccountId,
    });
  } catch (error) {
    console.error("GET /api/stripe/connect/status error:", error);

    return NextResponse.json(
      { error: "Nie udało się pobrać statusu Stripe Connect" },
      { status: 500 }
    );
  }
}
