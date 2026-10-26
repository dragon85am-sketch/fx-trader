import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export type TokenPayload = {
  userId: string;
  role: "admin" | "educator" | "user";
  tokenVersion: number;
};

// =====================================================
// BASIC AUTH
// =====================================================

export async function requireAuth() {
  const cookieStore = await cookies();

  const token = cookieStore.get("token")?.value;

  if (!token) {
    return {
      ok: false as const,

      response: NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      ),
    };
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("JWT_SECRET missing");

      return {
        ok: false as const,

        response: NextResponse.json(
          {
            error: "Server configuration error",
          },
          {
            status: 500,
          }
        ),
      };
    }

    const decoded = jwt.verify(
      token,
      jwtSecret
    ) as TokenPayload;

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },

      select: {
        id: true,
        role: true,
        tokenVersion: true,
        isBanned: true,
        isPremium: true,
        premiumUntil: true,
        cancelAtPeriodEnd: true,
      },
    });

    if (!user) {
      return {
        ok: false as const,

        response: NextResponse.json(
          {
            error: "Session expired",
          },
          {
            status: 401,
          }
        ),
      };
    }

    // =================================================
    // BAN CHECK
    // =================================================

    if (user.isBanned) {
      return {
        ok: false as const,

        response: NextResponse.json(
          {
            error: "Account banned",
          },
          {
            status: 403,
          }
        ),
      };
    }

    // =================================================
    // TOKEN VERSION CHECK
    // =================================================

    if (
      user.tokenVersion !==
      decoded.tokenVersion
    ) {
      return {
        ok: false as const,

        response: NextResponse.json(
          {
            error: "Session expired",
          },
          {
            status: 401,
          }
        ),
      };
    }

    return {
      ok: true as const,

      user: {
        userId: user.id,

        role:
          user.role as "admin" | "educator" | "user",
        isPremium: user.isPremium,
        premiumUntil: user.premiumUntil,
        cancelAtPeriodEnd: user.cancelAtPeriodEnd,
      },
    };
  } catch (error) {
    console.error(
      "AUTH VERIFY ERROR:",
      error
    );

    return {
      ok: false as const,

      response: NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      ),
    };
  }
}

// =====================================================
// ADMIN AUTH
// =====================================================

export async function requireAdmin() {
  const auth = await requireAuth();

  if (!auth.ok) {
    return auth;
  }

  if (auth.user.role !== "admin") {
    return {
      ok: false as const,

      response: NextResponse.json(
        {
          error: "Forbidden",
        },
        {
          status: 403,
        }
      ),
    };
  }

  return auth;
}

// =====================================================
// PREMIUM AUTH
// =====================================================

export async function requirePremiumUser() {
  const auth = await requireAuth();

  if (!auth.ok) {
    return auth;
  }

  // Dane Premium zostały już pobrane i zweryfikowane w requireAuth().
  // Unikamy drugiego zapytania do Supabase podczas każdego wejścia na Dashboard.
  const user = {
    id: auth.user.userId,
    role: auth.user.role,
    isPremium: auth.user.isPremium,
    premiumUntil: auth.user.premiumUntil,
    cancelAtPeriodEnd: auth.user.cancelAtPeriodEnd,
  };

  // =================================================
  // ADMIN ALWAYS HAS ACCESS
  // =================================================

  if (user.role === "admin") {
    return {
      ok: true as const,

      user: {
        userId: user.id,

        role:
          user.role as "admin" | "educator" | "user",

        isPremium: true,

        premiumUntil:
          user.premiumUntil,

        cancelAtPeriodEnd:
          user.cancelAtPeriodEnd,
      },
    };
  }

  // =================================================
  // PREMIUM EXPIRATION CHECK
  // =================================================

  const premiumExpired =
    !user.premiumUntil ||
    user.premiumUntil.getTime() <=
      Date.now();

  const premiumActive =
    user.isPremium === true &&
    !premiumExpired;

  if (!premiumActive) {
    /*
     * Jeśli data Premium już minęła,
     * porządkujemy bazę nawet wtedy,
     * gdy webhook Stripe jeszcze nie dotarł.
     */
    if (
      user.isPremium ||
      user.cancelAtPeriodEnd
    ) {
      await prisma.user.update({
        where: {
          id: user.id,
        },

        data: {
          isPremium: false,

          cancelAtPeriodEnd: false,
        },
      });

      console.log(
        "⛔ PREMIUM EXPIRED / ACCESS DISABLED:",
        user.id
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL;

    if (!appUrl) {
      return {
        ok: false as const,

        response: NextResponse.json(
          {
            error:
              "Brak NEXT_PUBLIC_APP_URL",
          },
          {
            status: 500,
          }
        ),
      };
    }

    return {
      ok: false as const,

      response: NextResponse.redirect(
        new URL(
          "/paywall?premium=expired",
          appUrl
        )
      ),
    };
  }

  // =================================================
  // PREMIUM ACTIVE
  // =================================================

  return {
    ok: true as const,

    user: {
      userId: user.id,

      role:
        user.role as "admin" | "educator" | "user",

      isPremium: true,

      premiumUntil:
        user.premiumUntil,

      cancelAtPeriodEnd:
        user.cancelAtPeriodEnd,
    },
  };
}

// Profil użytkownika: jedna weryfikacja JWT i jeden odczyt Prisma.
// Nie pomijamy kontroli blokady ani unieważnienia tokenu.
export async function requireAuthProfile() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const secret = process.env.JWT_SECRET;
  if (!secret) return { ok: false as const, response: NextResponse.json({ error: "Server configuration error" }, { status: 500 }) };
  let decoded: TokenPayload;
  try {
    decoded = jwt.verify(token, secret) as TokenPayload;
    if (!decoded || typeof decoded.userId !== "string" || typeof decoded.tokenVersion !== "number") throw new Error("Invalid token payload");
  } catch {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  // Błędy bazy propagujemy do obsługi 500, nie udajemy wygaśnięcia sesji.
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true, email: true, name: true, role: true, tokenVersion: true, isBanned: true,
      theme: true, language: true, priceFormat: true, avatarUrl: true,
      isPremium: true, premiumSince: true, premiumUntil: true, cancelAtPeriodEnd: true,
      stripeCustomerId: true, stripeSubscriptionId: true, pinHash: true, twoFactorEnabled: true,
    },
  });
  if (!user || user.tokenVersion !== decoded.tokenVersion) {
    return { ok: false as const, response: NextResponse.json({ error: "Session expired" }, { status: 401 }) };
  }
  if (user.isBanned) {
    return { ok: false as const, response: NextResponse.json({ error: "Account banned" }, { status: 403 }) };
  }
  return { ok: true as const, user };
}
