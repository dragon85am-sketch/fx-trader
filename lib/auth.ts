import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export type TokenPayload = {
  userId: string;
  role: "admin" | "user";
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
          user.role as "admin" | "user",
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

  const user = await prisma.user.findUnique({
    where: {
      id: auth.user.userId,
    },

    select: {
      id: true,
      role: true,

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
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      ),
    };
  }

  // =================================================
  // ADMIN ALWAYS HAS ACCESS
  // =================================================

  if (user.role === "admin") {
    return {
      ok: true as const,

      user: {
        userId: user.id,

        role:
          user.role as "admin" | "user",

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
        user.role as "admin" | "user",

      isPremium: true,

      premiumUntil:
        user.premiumUntil,

      cancelAtPeriodEnd:
        user.cancelAtPeriodEnd,
    },
  };
}