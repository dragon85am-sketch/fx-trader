import { NextResponse } from "next/server";
import Stripe from "stripe";
import { requireAuth } from "@/lib/auth";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

if (!stripeSecretKey) {
  throw new Error("Brak STRIPE_SECRET_KEY w zmiennych środowiskowych");
}

const stripe = new Stripe(stripeSecretKey);

export async function POST() {
  try {
    const auth = await requireAuth();

    if (!auth.ok) {
      return auth.response;
    }

    if (!appUrl) {
      return NextResponse.json(
        {
          error: "Brak NEXT_PUBLIC_APP_URL",
        },
        {
          status: 500,
        }
      );
    }

    const userId = auth.user.userId;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

      payment_method_types: ["card"],

      client_reference_id: userId,

      line_items: [
        {
          quantity: 1,

          price_data: {
            currency: "eur",

            unit_amount: 9900,

            recurring: {
              interval: "month",
            },

            product_data: {
              name: "FX Trade Professional Trading",
              description:
                "Miesięczny dostęp Premium do platformy FX TRADE",
            },
          },
        },
      ],

      metadata: {
        userId,
      },

      subscription_data: {
        metadata: {
          userId,
        },
      },

      success_url:
        `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url: `${appUrl}/paywall?payment=cancel`,
    });

    if (!session.url) {
      return NextResponse.json(
        {
          error: "Stripe nie zwrócił adresu checkout",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error("STRIPE CHECKOUT ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nie udało się utworzyć checkout",
      },
      {
        status: 500,
      }
    );
  }
}
