import { NextResponse } from "next/server";
import { requireAuthProfile } from "@/lib/auth";

export const runtime = "nodejs";
export async function GET() {
  try {
    const auth = await requireAuthProfile();
    if (!auth.ok) return auth.response;
    const user = auth.user;
    const premiumActive = user.role === "admin" ||
      (user.isPremium === true && !!user.premiumUntil && user.premiumUntil.getTime() > Date.now());
    return NextResponse.json({
      user: {
        id: user.id, email: user.email, name: user.name, role: user.role,
        theme: user.theme, language: user.language,
        priceFormat: user.priceFormat ?? "dot", avatarUrl: user.avatarUrl,
        isPremium: premiumActive,
        premiumSince: user.premiumSince?.toISOString() ?? null,
        premiumUntil: user.premiumUntil?.toISOString() ?? null,
        cancelAtPeriodEnd: user.cancelAtPeriodEnd,
        hasStripeCustomer: Boolean(user.stripeCustomerId),
        hasStripeSubscription: Boolean(user.stripeSubscriptionId),
        hasPin: Boolean(user.pinHash),
        twoFactorEnabled: user.twoFactorEnabled,
      },
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("GET /api/me error:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
