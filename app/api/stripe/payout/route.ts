import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  
});

export async function POST(req: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { amount } = await req.json();

    const user = await prisma.user.findUnique({
      where: { id: auth.user.userId },
      select: {
        stripeAccountId: true,
      },
    });

    if (!user?.stripeAccountId) {
      return NextResponse.json(
        { error: "Brak konta Stripe" },
        { status: 400 }
      );
    }

    // ðŸ’¸ transfer (waÅ¼ne: amount w centach)
    const transfer = await stripe.transfers.create({
      amount: amount * 100,
      currency: "eur",
      destination: user.stripeAccountId,
    });

    return NextResponse.json({
      ok: true,
      transfer,
    });
  } catch (error) {
    console.error("PAYOUT ERROR:", error);

    return NextResponse.json(
      { error: "BÅ‚Ä…d wypÅ‚aty" },
      { status: 500 }
    );
  }
}
