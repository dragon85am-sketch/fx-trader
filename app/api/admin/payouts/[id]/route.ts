import { NextResponse } from "next/server";
import Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

type PatchContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, { params }: PatchContext) {
  try {
    const auth = await requireAdmin();

    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await params;
    const body = await req.json();
    const requestedStatus = body?.status as string;

    if (!["Approved", "Rejected", "Paid"].includes(requestedStatus)) {
      return NextResponse.json(
        { error: "Nieprawidłowy status" },
        { status: 400 }
      );
    }

    const payout = await prisma.payoutRequest.findUnique({
      where: { id },
    });

    if (!payout) {
      return NextResponse.json(
        { error: "Nie znaleziono payoutu" },
        { status: 404 }
      );
    }

    if (payout.status === "Rejected") {
      return NextResponse.json(
        { error: "Odrzucony payout nie może być zmieniony" },
        { status: 400 }
      );
    }

    if (payout.status === "Paid") {
      return NextResponse.json(
        { error: "Opłacony payout nie może być zmieniony" },
        { status: 400 }
      );
    }

    if (payout.stripeTransferId) {
      return NextResponse.json(
        { error: "Ten payout ma już Stripe transfer" },
        { status: 400 }
      );
    }

    if (payout.status === "Approved" && requestedStatus === "Rejected") {
      return NextResponse.json(
        { error: "Nie można odrzucić zatwierdzonego payoutu" },
        { status: 400 }
      );
    }

    if (payout.status === requestedStatus) {
      return NextResponse.json(
        { error: "Payout ma już ten status" },
        { status: 400 }
      );
    }

    let payoutUser:
      | {
          id: string;
          email: string | null;
          name: string | null;
          stripeAccountId: string | null;
        }
      | null = null;

    const result = await prisma.$transaction(async (tx) => {
      let finalStatus = requestedStatus;
      let stripeTransferId: string | undefined;

      if (requestedStatus === "Rejected") {
        await tx.affiliateStat.update({
          where: { userId: payout.userId },
          data: {
            availablePayout: {
              increment: payout.amount,
            },
          },
        });

        const updated = await tx.payoutRequest.update({
          where: { id },
          data: {
            status: "Rejected",
            rejectedAt: new Date(),
          },
        });

        await tx.activityLog.create({
          data: {
            type: "PAYOUT_REJECTED",
            message: `Payout rejected: €${payout.amount}`,
            userId: payout.userId,
          },
        });

        return {
          payout: updated,
          message: "Wypłata odrzucona",
        };
      }

      if (requestedStatus === "Paid" && payout.status !== "Approved") {
        throw new Error("Najpierw zatwierdź payout");
      }

      if (requestedStatus === "Approved" || requestedStatus === "Paid") {
        const user = await tx.user.findUnique({
          where: { id: payout.userId },
          select: {
            id: true,
            email: true,
            name: true,
            stripeAccountId: true,
          },
        });

        payoutUser = user;

        if (!user?.stripeAccountId) {
          throw new Error("Użytkownik nie ma Stripe Connect");
        }

        const account = await stripe.accounts.retrieve(user.stripeAccountId);

        if (!account.payouts_enabled) {
          throw new Error(
            "Użytkownik nie może jeszcze otrzymać wypłaty. Dokończ Stripe Connect."
          );
        }

        const payoutCurrency = "eur";
        const payoutAmount = Math.round(payout.amount * 100);

        const balance = await stripe.balance.retrieve();
        const available = balance.available.find(
          (b) => b.currency === payoutCurrency
        );

        if (!available || available.amount < payoutAmount) {
          throw new Error("Brak środków na Stripe balance");
        }

        const transfer = await stripe.transfers.create({
          amount: payoutAmount,
          currency: payoutCurrency,
          destination: user.stripeAccountId,
          metadata: {
            payoutId: payout.id,
            userId: payout.userId,
          },
        });

        stripeTransferId = transfer.id;
        finalStatus = "Paid";
      }

      const updated = await tx.payoutRequest.update({
        where: { id },
        data: {
          status: finalStatus,
          stripeTransferId,
          approvedAt:
            requestedStatus === "Approved" || requestedStatus === "Paid"
              ? new Date()
              : undefined,
          paidAt: finalStatus === "Paid" ? new Date() : undefined,
        },
      });

      await tx.activityLog.create({
        data: {
          type: finalStatus === "Paid" ? "PAYOUT_PAID" : "PAYOUT_APPROVED",
          message: `Payout ${finalStatus}: €${payout.amount}`,
          userId: payout.userId,
        },
      });

      if (finalStatus === "Paid" && payoutUser?.email) {
        await sendEmail({
          to: payoutUser.email,
          subject: "Wypłata affiliate została zrealizowana",
          html: `
            <div style="font-family:Arial,sans-serif;line-height:1.6">
              <h2>Wypłata została zrealizowana ✅</h2>

              <p>Cześć ${payoutUser.name || "Partnerze"},</p>

              <p>Twoja wypłata afiliacyjna została pomyślnie zrealizowana.</p>

              <p><strong>Kwota:</strong> €${payout.amount}</p>
              <p><strong>Status:</strong> Opłacona</p>
              <p><strong>Transfer ID:</strong> ${stripeTransferId}</p>

              <p>Środki zostały przekazane przez Stripe Connect.</p>

              <p style="margin-top:20px">FX-TRADER</p>
            </div>
          `,
        });
      }

      return {
        payout: updated,
        message:
          finalStatus === "Paid"
            ? "Wypłata została automatycznie wysłana przez Stripe"
            : "Wypłata zatwierdzona",
      };
    });

    return NextResponse.json({
      ok: true,
      payout: result.payout,
      message: result.message,
    });
  } catch (error) {
    console.error("PATCH payout error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Błąd serwera",
      },
      { status: 500 }
    );
  }
}