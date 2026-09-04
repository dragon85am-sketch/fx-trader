import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  try {
    const auth = await requireAuth();
    console.log("CONNECT AUTH OK:", auth.ok);

    if (!auth.ok) return auth.response;

    const userId = auth.user.userId;
    console.log("CONNECT USER ID:", userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        stripeAccountId: true,
      },
    });

    console.log("CONNECT USER:", user);

    if (!user) {
      return NextResponse.json(
        { error: "Nie znaleziono użytkownika" },
        { status: 404 }
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    console.log("CONNECT APP URL:", appUrl);

    let accountId = user.stripeAccountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email || undefined,
        capabilities: {
          transfers: {
            requested: true,
          },
        },
      });

      accountId = account.id;

      console.log("CONNECT ACCOUNT CREATED:", accountId);

      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          stripeAccountId: accountId,
        },
      });
    } else {
      console.log("CONNECT ACCOUNT EXISTS:", accountId);
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/dashboard/affiliate/payouts?connect=refresh`,
      return_url: `${appUrl}/dashboard/affiliate/payouts?connect=return`,
      type: "account_onboarding",
    });

    console.log("CONNECT LINK CREATED:", accountLink.url);

    return NextResponse.json({
      ok: true,
      url: accountLink.url,
    });
  } catch (error) {
    console.error("STRIPE CONNECT ERROR FULL:", error);

    return NextResponse.json(
      {
        error: "Nie udało się rozpocząć onboardingu Stripe Connect",
        details:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}
