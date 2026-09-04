import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

if (!stripeSecretKey) {
  throw new Error("Brak STRIPE_SECRET_KEY w zmiennych środowiskowych");
}

const stripe = new Stripe(stripeSecretKey, {
  
});

export async function POST() {
  try {
    const auth = await requireAuth();

    if (!auth.ok) {
      return auth.response;
    }

    if (!appUrl) {
      return NextResponse.json(
        { error: "Brak NEXT_PUBLIC_APP_URL" },
        { status: 500 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: auth.user.userId,
      },
      select: {
        id: true,
        stripeCustomerId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Nie znaleziono użytkownika" },
        { status: 404 }
      );
    }

    if (!user.stripeCustomerId) {
      return NextResponse.json(
        {
          error:
            "To konto nie ma jeszcze przypisanego klienta Stripe. Wykonaj zakup subskrypcji.",
        },
        { status: 400 }
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl}/dashboard`,
    });

    return NextResponse.json({
      url: portalSession.url,
    });
  } catch (error) {
    console.error("STRIPE PORTAL ERROR:", error);

    return NextResponse.json(
      {
        error: "Nie udało się otworzyć zarządzania subskrypcją",
      },
      { status: 500 }
    );
  }
}

