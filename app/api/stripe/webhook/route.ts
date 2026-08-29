import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripeWebhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey) {
    return new NextResponse(
      "Missing STRIPE_SECRET_KEY",
      { status: 500 }
    );
  }

  if (!stripeWebhookSecret) {
    return new NextResponse(
      "Missing STRIPE_WEBHOOK_SECRET",
      { status: 500 }
    );
  }

  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new NextResponse(
      "Missing stripe-signature",
      { status: 400 }
    );
  }

  const body = await req.text();

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2026-03-25.dahlia",
  });

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      stripeWebhookSecret
    );
  } catch (error) {
    console.error(
      "Webhook signature error:",
      error
    );

    return new NextResponse(
      "Webhook Error",
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      // =====================================================
      // INVOICE PAID
      // =====================================================

      case "invoice.paid": {
        const invoice =
          event.data.object as Stripe.Invoice;

        let userId: string | null = null;
        let subscription: Stripe.Subscription | null =
          null;

        const subscriptionRef =
          (invoice as any).subscription;

        if (subscriptionRef) {
          const subscriptionId =
            typeof subscriptionRef === "string"
              ? subscriptionRef
              : subscriptionRef.id;

          if (subscriptionId) {
            subscription =
              await stripe.subscriptions.retrieve(
                subscriptionId
              );

            userId =
              subscription.metadata?.userId ?? null;
          }
        }

        const customerEmail =
          invoice.customer_email ?? null;

        const user = userId
          ? await prisma.user.findUnique({
              where: {
                id: userId,
              },
              select: {
                id: true,
              },
            })
          : customerEmail
            ? await prisma.user.findUnique({
                where: {
                  email: customerEmail,
                },
                select: {
                  id: true,
                },
              })
            : null;

        if (!user) {
          console.error(
            "❌ invoice.paid: nie znaleziono użytkownika",
            {
              invoiceId: invoice.id,
              userId,
              customerEmail,
            }
          );

          return NextResponse.json({
            received: true,
            skipped: "no_user",
          });
        }

        const currentPeriodEnd =
          subscription &&
          (subscription as any).current_period_end
            ? new Date(
                (subscription as any)
                  .current_period_end * 1000
              )
            : new Date(
                Date.now() +
                  30 * 24 * 60 * 60 * 1000
              );

        const invoiceCustomerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id ?? null;

        /*
         * Wykrywamy anulowanie zarówno przez:
         *
         * cancel_at_period_end === true
         *
         * jak również:
         *
         * cancel_at === current_period_end
         *
         * ponieważ w naszym Customer Portal Stripe
         * korzysta właśnie z drugiego wariantu.
         */
        let cancelAtPeriodEnd = false;

        if (subscription) {
          const stripeCancelAt =
            (subscription as any).cancel_at as
              | number
              | null;

          const stripePeriodEnd =
            (subscription as any)
              .current_period_end as
              | number
              | null;

          cancelAtPeriodEnd =
            subscription.cancel_at_period_end ===
              true ||
            (
              typeof stripeCancelAt === "number" &&
              typeof stripePeriodEnd === "number" &&
              stripeCancelAt === stripePeriodEnd
            );
        }

        await prisma.user.update({
          where: {
            id: user.id,
          },

          data: {
            isPremium: true,

            premiumUntil: currentPeriodEnd,

            cancelAtPeriodEnd,

            ...(invoiceCustomerId
              ? {
                  stripeCustomerId:
                    invoiceCustomerId,
                }
              : {}),

            ...(subscription?.id
              ? {
                  stripeSubscriptionId:
                    subscription.id,
                }
              : {}),
          },
        });

        console.log(
          "✅ SUBSCRIPTION PAID / PREMIUM EXTENDED:",
          user.id,
          currentPeriodEnd.toISOString(),
          {
            cancelAtPeriodEnd,
          }
        );

        return NextResponse.json({
          received: true,
          premiumExtended: true,
        });
      }

      // =====================================================
      // PAYMENT FAILED
      // =====================================================

      case "invoice.payment_failed": {
        const invoice =
          event.data.object as Stripe.Invoice;

        /*
         * Nie wyłączamy Premium natychmiast.
         *
         * Użytkownik zachowuje dostęp do premiumUntil.
         */
        console.warn(
          "⚠️ SUBSCRIPTION PAYMENT FAILED:",
          invoice.id
        );

        return NextResponse.json({
          received: true,
          paymentFailed: true,
        });
      }

      // =====================================================
      // SUBSCRIPTION UPDATED
      // =====================================================

      case "customer.subscription.updated": {
        const subscription =
          event.data.object as Stripe.Subscription;

        const metadataUserId =
          subscription.metadata?.userId ?? null;

        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        let user = metadataUserId
          ? await prisma.user.findUnique({
              where: {
                id: metadataUserId,
              },
              select: {
                id: true,
              },
            })
          : null;

        /*
         * Fallback po stripeCustomerId.
         */
        if (!user && customerId) {
          user = await prisma.user.findFirst({
            where: {
              stripeCustomerId: customerId,
            },
            select: {
              id: true,
            },
          });
        }

        if (!user) {
          console.error(
            "❌ customer.subscription.updated: nie znaleziono użytkownika",
            {
              subscriptionId:
                subscription.id,
              metadataUserId,
              customerId,
            }
          );

          return NextResponse.json({
            received: true,
            skipped: "no_user",
          });
        }

        const currentPeriodEndUnix =
          (subscription as any)
            .current_period_end as
            | number
            | null;

        const premiumUntil =
          currentPeriodEndUnix
            ? new Date(
                currentPeriodEndUnix * 1000
              )
            : null;

        const status = subscription.status;

        const cancelAt =
          (subscription as any).cancel_at as
            | number
            | null;

        const currentPeriodEnd =
          (subscription as any)
            .current_period_end as
            | number
            | null;

        /*
         * Stripe może oznaczyć anulowanie:
         *
         * cancel_at_period_end = true
         *
         * LUB:
         *
         * cancel_at === current_period_end
         */
        const cancelAtPeriodEnd =
          subscription.cancel_at_period_end ===
            true ||
          (
            typeof cancelAt === "number" &&
            typeof currentPeriodEnd === "number" &&
            cancelAt === currentPeriodEnd
          );

        console.log(
          "🔎 STRIPE CANCEL DEBUG:",
          {
            subscriptionId:
              subscription.id,

            status:
              subscription.status,

            stripeCancelAtPeriodEnd:
              subscription.cancel_at_period_end,

            detectedCancelAtPeriodEnd:
              cancelAtPeriodEnd,

            cancelAt,

            canceledAt:
              (subscription as any)
                .canceled_at,

            currentPeriodEnd,
          }
        );

        // ===================================================
        // ACTIVE / TRIALING
        // ===================================================

        if (
          status === "active" ||
          status === "trialing"
        ) {
          await prisma.user.update({
            where: {
              id: user.id,
            },

            data: {
              /*
               * Premium pozostaje aktywne nawet gdy
               * anulowanie zostało zaplanowane.
               */
              isPremium: true,

              ...(premiumUntil
                ? {
                    premiumUntil,
                  }
                : {}),

              /*
               * Zapisujemy status anulowania w bazie.
               */
              cancelAtPeriodEnd,

              stripeCustomerId:
                customerId,

              stripeSubscriptionId:
                subscription.id,
            },
          });

          console.log(
            cancelAtPeriodEnd
              ? "⚠️ SUBSCRIPTION CANCELLED AT PERIOD END:"
              : "✅ SUBSCRIPTION UPDATED / ACTIVE:",

            user.id,

            {
              status,
              cancelAtPeriodEnd,

              premiumUntil:
                premiumUntil?.toISOString() ??
                null,
            }
          );

          return NextResponse.json({
            received: true,

            subscriptionUpdated: true,

            status,

            cancelAtPeriodEnd,
          });
        }

        // ===================================================
        // PAST DUE / UNPAID
        // ===================================================

        if (
          status === "past_due" ||
          status === "unpaid"
        ) {
          /*
           * Nie wyłączamy Premium natychmiast.
           *
           * Zachowujemy premiumUntil.
           */
          await prisma.user.update({
            where: {
              id: user.id,
            },

            data: {
              ...(premiumUntil
                ? {
                    premiumUntil,
                  }
                : {}),

              cancelAtPeriodEnd,

              stripeCustomerId:
                customerId,

              stripeSubscriptionId:
                subscription.id,
            },
          });

          console.warn(
            "⚠️ SUBSCRIPTION PAYMENT STATUS:",
            user.id,
            status
          );

          return NextResponse.json({
            received: true,

            subscriptionUpdated: true,

            status,

            cancelAtPeriodEnd,
          });
        }

        // ===================================================
        // CANCELED / INCOMPLETE EXPIRED
        // ===================================================

        if (
          status === "canceled" ||
          status === "incomplete_expired"
        ) {
          await prisma.user.update({
            where: {
              id: user.id,
            },

            data: {
              isPremium: false,

              premiumUntil:
                new Date(),

              cancelAtPeriodEnd:
                false,
            },
          });

          console.log(
            "❌ SUBSCRIPTION NO LONGER ACTIVE:",
            user.id,
            status
          );

          return NextResponse.json({
            received: true,

            premiumDisabled: true,

            status,
          });
        }

        console.log(
          "ℹ️ SUBSCRIPTION STATUS:",
          user.id,
          status
        );

        return NextResponse.json({
          received: true,

          subscriptionUpdated: true,

          status,

          cancelAtPeriodEnd,
        });
      }

      // =====================================================
      // SUBSCRIPTION DELETED
      // =====================================================

      case "customer.subscription.deleted": {
        const subscription =
          event.data.object as Stripe.Subscription;

        const metadataUserId =
          subscription.metadata?.userId ?? null;

        let customerEmail:
          | string
          | null = null;

        if (!metadataUserId) {
          const customerId =
            typeof subscription.customer ===
            "string"
              ? subscription.customer
              : subscription.customer.id;

          const customer =
            await stripe.customers.retrieve(
              customerId
            );

          if (!customer.deleted) {
            customerEmail =
              customer.email ?? null;
          }
        }

        const user = metadataUserId
          ? await prisma.user.findUnique({
              where: {
                id: metadataUserId,
              },
              select: {
                id: true,
              },
            })
          : customerEmail
            ? await prisma.user.findUnique({
                where: {
                  email:
                    customerEmail,
                },
                select: {
                  id: true,
                },
              })
            : null;

        if (!user) {
          console.error(
            "❌ customer.subscription.deleted: nie znaleziono użytkownika",
            {
              subscriptionId:
                subscription.id,

              metadataUserId,

              customerEmail,
            }
          );

          return NextResponse.json({
            received: true,
            skipped: "no_user",
          });
        }

        await prisma.user.update({
          where: {
            id: user.id,
          },

          data: {
            isPremium: false,

            premiumUntil:
              new Date(),

            /*
             * Subskrypcja już zakończona.
             * Nie ma już zaplanowanego anulowania.
             */
            cancelAtPeriodEnd:
              false,
          },
        });

        console.log(
          "❌ SUBSCRIPTION ENDED - PREMIUM DISABLED:",
          user.id
        );

        return NextResponse.json({
          received: true,
          premiumDisabled: true,
        });
      }

      // =====================================================
      // STRIPE CONNECT ACCOUNT
      // =====================================================

      case "account.updated": {
        const account =
          event.data.object as Stripe.Account;

        await prisma.user.updateMany({
          where: {
            stripeAccountId:
              account.id,
          },

          data: {
            stripeOnboardingDone:
              Boolean(
                account.details_submitted
              ),

            payoutsEnabled:
              Boolean(
                account.payouts_enabled
              ),
          },
        });

        console.log(
          "✅ Stripe Connect account synced:",
          account.id
        );

        return NextResponse.json({
          received: true,
        });
      }

      // =====================================================
      // TRANSFER CREATED
      // =====================================================

      case "transfer.created": {
        const transfer =
          event.data.object as Stripe.Transfer;

        await prisma.payoutRequest.updateMany({
          where: {
            stripeTransferId:
              transfer.id,
          },

          data: {
            status: "Paid",
          },
        });

        console.log(
          "✅ Transfer created:",
          transfer.id
        );

        return NextResponse.json({
          received: true,
        });
      }

      // =====================================================
      // TRANSFER REVERSED
      // =====================================================

      case "transfer.reversed": {
        const transfer =
          event.data.object as Stripe.Transfer;

        await prisma.payoutRequest.updateMany({
          where: {
            stripeTransferId:
              transfer.id,
          },

          data: {
            status: "Rejected",
          },
        });

        console.log(
          "⚠️ Transfer reversed:",
          transfer.id
        );

        return NextResponse.json({
          received: true,
        });
      }

      // =====================================================
      // CHECKOUT SESSION COMPLETED
      // =====================================================

      case "checkout.session.completed": {
        const session =
          event.data.object as Stripe.Checkout.Session;

        const sessionId =
          session.id;

        /*
         * Najpierw userId z metadata.
         */
        const metadataUserId =
          session.metadata?.userId ?? null;

        let customerEmail =
          session.customer_details?.email ??
          session.customer_email ??
          null;

        if (
          !customerEmail &&
          session.customer
        ) {
          const customerId =
            typeof session.customer ===
            "string"
              ? session.customer
              : session.customer.id;

          const customer =
            await stripe.customers.retrieve(
              customerId
            );

          if (!customer.deleted) {
            customerEmail =
              customer.email;
          }
        }

        const buyer =
          metadataUserId
            ? await prisma.user.findUnique({
                where: {
                  id:
                    metadataUserId,
                },

                select: {
                  id: true,
                  email: true,
                  name: true,

                  referredByUserId:
                    true,
                },
              })
            : customerEmail
              ? await prisma.user.findUnique({
                  where: {
                    email:
                      customerEmail,
                  },

                  select: {
                    id: true,
                    email: true,
                    name: true,

                    referredByUserId:
                      true,
                  },
                })
              : null;

        if (!buyer) {
          console.error(
            "❌ checkout.session.completed: nie znaleziono użytkownika",
            {
              sessionId,
              metadataUserId,
              customerEmail,
            }
          );

          return NextResponse.json(
            {
              received: true,
              skipped: "no_user",
            },
            {
              status: 200,
            }
          );
        }

        const stripeCustomerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id ??
              null;

        const stripeSubscriptionId =
          typeof session.subscription ===
          "string"
            ? session.subscription
            : session.subscription?.id ??
              null;

        let premiumUntil =
          new Date(
            Date.now() +
              30 * 24 * 60 * 60 * 1000
          );

        if (stripeSubscriptionId) {
          const subscription =
            await stripe.subscriptions.retrieve(
              stripeSubscriptionId
            );

          const currentPeriodEnd =
            (subscription as any)
              .current_period_end;

          if (currentPeriodEnd) {
            premiumUntil =
              new Date(
                currentPeriodEnd *
                  1000
              );
          }
        }

        /*
         * Nowy zakup:
         *
         * Premium aktywne
         * oraz resetujemy cancelAtPeriodEnd.
         */
        await prisma.user.update({
          where: {
            id: buyer.id,
          },

          data: {
            isPremium: true,

            premiumSince:
              new Date(),

            premiumUntil,

            cancelAtPeriodEnd:
              false,

            stripeCustomerId,

            stripeSubscriptionId,
          },
        });

        console.log(
          "✅ PREMIUM ACTIVATED:",
          buyer.id
        );

        console.log(
          "✅ STRIPE CUSTOMER SAVED:",
          stripeCustomerId
        );

        console.log(
          "✅ STRIPE SUBSCRIPTION SAVED:",
          stripeSubscriptionId
        );

        // ===================================================
        // EMAIL PO ZAKUPIE
        // ===================================================

        if (buyer.email) {
          await sendEmail({
            to: buyer.email,

            subject:
              "Witamy w FX-TRADER 🚀",

            html: `
              <div style="font-family:Arial,sans-serif;line-height:1.6">

                <h2>
                  Dziękujemy za zakup 🚀
                </h2>

                <p>
                  Twój dostęp do FX TRADE został aktywowany.
                </p>

                <p>
                  Twoja subskrypcja Premium jest aktywna.
                </p>

                <p>
                  Możesz teraz zalogować się do platformy:
                </p>

                <a
                  href="${process.env.NEXT_PUBLIC_APP_URL}/login"
                  style="
                    display:inline-block;
                    padding:12px 20px;
                    background:#2563eb;
                    color:white;
                    text-decoration:none;
                    border-radius:8px;
                    margin-top:10px;
                  "
                >
                  Zaloguj się
                </a>

                <p style="margin-top:30px">
                  Do zobaczenia w dashboardzie 👋
                </p>

                <p>
                  FX TRADE
                </p>

              </div>
            `,
          });
        }

        // ===================================================
        // BRAK REFERRERA
        // ===================================================

        if (!buyer.referredByUserId) {
          console.log(
            "ℹ️ Zakup bez polecenia - Premium aktywne"
          );

          return NextResponse.json({
            received: true,

            premiumActivated:
              true,

            affiliate:
              false,
          });
        }

        // ===================================================
        // SELF REFERRAL
        // ===================================================

        if (
          buyer.referredByUserId ===
          buyer.id
        ) {
          console.log(
            "⚠️ Self-referral - pomijam prowizję"
          );

          return NextResponse.json({
            received: true,

            premiumActivated:
              true,

            affiliate:
              false,

            skipped:
              "self_ref",
          });
        }

        // ===================================================
        // DUPLIKAT AFFILIATE
        // ===================================================

        const existingSale =
          await prisma.affiliateSale.findFirst({
            where: {
              stripeSessionId:
                sessionId,
            },
          });

        if (existingSale) {
          console.log(
            "⚠️ Duplikat webhooka affiliate - pomijam prowizję"
          );

          return NextResponse.json({
            received: true,

            premiumActivated:
              true,

            duplicate:
              true,
          });
        }

        // ===================================================
        // AFFILIATE COMMISSION
        // ===================================================

        const commission = 30;

        await prisma.affiliateSale.create({
          data: {
            userId:
              buyer.referredByUserId,

            buyer:
              buyer.email,

            amount:
              commission,

            status:
              "Pending",

            stripeSessionId:
              sessionId,
          },
        });

        await prisma.affiliateStat.upsert({
          where: {
            userId:
              buyer.referredByUserId,
          },

          update: {
            pendingCommission: {
              increment:
                commission,
            },

            totalEarned: {
              increment:
                commission,
            },
          },

          create: {
            userId:
              buyer.referredByUserId,

            availablePayout:
              0,

            pendingCommission:
              commission,

            totalEarned:
              commission,
          },
        });

        const dashboard =
          await prisma.dashboardStat.findUnique({
            where: {
              userId:
                buyer.referredByUserId,
            },
          });

        const nextSales =
          (dashboard?.sales ?? 0) + 1;

        const clicks =
          dashboard?.clicks ?? 0;

        const conversion =
          clicks > 0
            ? Number(
                (
                  (nextSales /
                    clicks) *
                  100
                ).toFixed(1)
              )
            : 0;

        await prisma.dashboardStat.upsert({
          where: {
            userId:
              buyer.referredByUserId,
          },

          update: {
            sales:
              nextSales,

            conversion,
          },

          create: {
            userId:
              buyer.referredByUserId,

            sales:
              1,

            clicks:
              0,

            conversion:
              0,

            monthlyPnl:
              0,

            totalRevenue:
              0,
          },
        });

        const referrer =
          await prisma.user.findUnique({
            where: {
              id:
                buyer.referredByUserId,
            },

            select: {
              email:
                true,

              name:
                true,
            },
          });

        if (referrer?.email) {
          await sendEmail({
            to:
              referrer.email,

            subject:
              "Nowa prowizja w FX-TRADER",

            html: `
              <div style="font-family:Arial,sans-serif;line-height:1.6">

                <h2>
                  Nowa prowizja affiliate
                </h2>

                <p>
                  Cześć ${
                    referrer.name ||
                    "Partnerze"
                  },
                </p>

                <p>
                  Właśnie naliczyliśmy nową prowizję za sprzedaż FX Trade Education.
                </p>

                <p>
                  <strong>
                    Prowizja:
                  </strong>
                  ${commission}€
                </p>

                <p>
                  <strong>
                    Status:
                  </strong>
                  Pending
                </p>

                <p>
                  Możesz sprawdzić szczegóły w swoim Affiliate Hub.
                </p>

              </div>
            `,
          });
        }

        console.log(
          "✅ PROWIZJA DODANA"
        );

        return NextResponse.json({
          success:
            true,

          premiumActivated:
            true,

          affiliate:
            true,
        });
      }

      // =====================================================
      // OTHER EVENTS
      // =====================================================

      default: {
        console.log(
          "ℹ️ Event:",
          event.type
        );

        return NextResponse.json({
          received: true,
        });
      }
    }
  } catch (error) {
    console.error(
      "Webhook processing error:",
      error
    );

    return new NextResponse(
      "Server Error",
      {
        status: 500,
      }
    );
  }
}