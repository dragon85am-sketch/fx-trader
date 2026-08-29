import { NextResponse } from "next/server";
import Stripe from "stripe";
import { requireAdmin } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET() {
  try {
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
        error: "Nie udaÅ‚o siÄ™ pobraÄ‡ salda Stripe",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
