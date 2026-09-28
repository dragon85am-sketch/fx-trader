import { NextResponse } from "next/server";
import Stripe from "stripe";
import { requireAdmin } from "@/lib/auth";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export async function GET() {
  try {
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "Missing STRIPE_SECRET_KEY" },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);

    const auth = await requireAdmin();

    if (!auth.ok) {
      return auth.response;
    }

    const balance = await stripe.balance.retrieve();

    return NextResponse.json({
      ok: true,
      available: balance.available.map((item) => ({
        amount: item.amount,
        currency: item.currency,
      })),
      pending: balance.pending.map((item) => ({
        amount: item.amount,
        currency: item.currency,
      })),
    });
  } catch (error) {
    console.error("GET /api/stripe/balance error:", error);

    return NextResponse.json(
      {
        error: "Nie udało się pobrać salda Stripe",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
