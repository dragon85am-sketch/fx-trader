import { NextResponse } from "next/server";
import Stripe from "stripe";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  req: Request,
  { params }: Context
) {
  try {
    const auth = await requireAdmin();

    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await params;

    const payout = await prisma.payoutRequest.findUnique({
      where: {
        id,
      },

      include: {
        user: true,
      },
    });

    if (!payout) {
      return NextResponse.json(
        {
          error: "Payout not found",
        },
        {
          status: 404,
        }
      );
    }

    if (!payout.user.stripeAccountId) {
      return NextResponse.json(
        {
          error: "User has no Stripe account",
        },
        {
          status: 400,
        }
      );
    }

    if (!payout.user.payoutsEnabled) {
      return NextResponse.json(
        {
          error: "Stripe payouts not enabled",
        },
        {
          status: 400,
        }
      );
    }

    const transfer = await stripe.transfers.create({
      amount: Math.round(payout.amount * 100),

      currency: "eur",

      destination: payout.user.stripeAccountId,

      metadata: {
        payoutId: payout.id,
        userId: payout.user.id,
      },
    });

    await prisma.payoutRequest.update({
      where: {
        id: payout.id,
      },

      data: {
        status: "Paid",
        paidAt: new Date(),
        stripeTransferId: transfer.id,
      },
    });

    await prisma.activityLog.create({
      data: {
        type: "PAYOUT_PAID",
        message: `Affiliate payout paid: ${payout.amount}€ to ${payout.user.email}`,
      },
    });
if (payout.user.email) {
  await sendEmail({
    to: payout.user.email,
    subject: "Wypłata affiliate została zrealizowana",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6">
        <h2>Wypłata została zrealizowana ✅</h2>

        <p>Cześć ${payout.user.name || "Partnerze"},</p>

        <p>Twoja wypłata afiliacyjna została pomyślnie zrealizowana.</p>

        <p><strong>Kwota:</strong> ${payout.amount}€</p>
        <p><strong>Status:</strong> Opłacona</p>
        <p><strong>Stripe Transfer ID:</strong> ${transfer.id}</p>

        <p>Środki zostały przekazane przez Stripe Connect.</p>

        <p style="margin-top:24px">FX-TRADER</p>
      </div>
    `,
  });
}
    return NextResponse.json({
      ok: true,
      transferId: transfer.id,
    });
  } catch (error) {
    console.error(
      "POST /api/admin/payouts/[id]/pay error:",
      error
    );

    return NextResponse.json(
      {
        error: "Nie udało się wysłać payoutu",
      },
      {
        status: 500,
      }
    );
  }
}