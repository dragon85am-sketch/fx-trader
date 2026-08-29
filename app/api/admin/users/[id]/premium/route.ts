import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, { params }: Context) {
  try {
    const auth = await requireAdmin();

    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await params;
    const body = await req.json();

    const isPremium = Boolean(body?.isPremium);

    const user = await prisma.user.update({
      where: {
        id,
      },

      data: {
        isPremium,

        premiumSince: isPremium ? new Date() : null,

        premiumUntil: isPremium
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          : null,
      },

      select: {
        id: true,
        email: true,
        isPremium: true,
        premiumUntil: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        type: "premium_change",
        message: isPremium
          ? `Premium granted to ${user.email}`
          : `Premium removed from ${user.email}`,
        userId: user.id,
      },
    });

    return NextResponse.json({
      ok: true,
      user,
    });
  } catch (error) {
    console.error("PATCH admin premium error:", error);

    return NextResponse.json(
      {
        error: "Nie udało się zmienić premium",
      },
      {
        status: 500,
      }
    );
  }
}